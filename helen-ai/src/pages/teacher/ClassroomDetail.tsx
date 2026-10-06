import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabase'

interface Classroom {
  id: string
  name: string
  subject: string
}

interface RosterStudent {
  id: string
  student_id: string
  full_name: string
  joined_at: string
}

interface StudentLookup {
  student_id: string
  full_name: string
}

export function ClassroomDetail() {
  const { classroomId = '' } = useParams()
  const { session } = useAuth()
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [studentIdInput, setStudentIdInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addMessage, setAddMessage] = useState('')
  const [removingId, setRemovingId] = useState('')

  const loadRoster = useCallback(async () => {
    if (!classroomId) return
    const { data, error } = await supabase.rpc('get_classroom_roster', {
      p_classroom_id: classroomId,
    })
    if (error) throw error
    setRoster((data ?? []) as RosterStudent[])
  }, [classroomId])

  useEffect(() => {
    const teacherId = session?.user.id
    if (!classroomId || !teacherId) {
      setLoading(false)
      setLoadError('This class could not be found.')
      return
    }
    let cancelled = false
    setLoading(true)
    setLoadError('')

    async function loadClassroom() {
      const { data, error } = await supabase
        .from('classrooms')
        .select('id, name, subject')
        .eq('id', classroomId)
        .eq('teacher_id', teacherId)
        .maybeSingle()

      if (cancelled) return
      if (error || !data) {
        setLoadError('This class could not be found or you do not have access to it.')
        setClassroom(null)
        setLoading(false)
        return
      }

      setClassroom(data as Classroom)
      try {
        await loadRoster()
      } catch {
        if (!cancelled) setLoadError('The student roster could not be loaded. Refresh and try again.')
      }
      if (!cancelled) setLoading(false)
    }

    void loadClassroom()
    return () => { cancelled = true }
  }, [classroomId, session?.user.id, loadRoster])

  async function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!classroomId) return
    setAdding(true)
    setAddError('')
    setAddMessage('')

    const normalizedId = studentIdInput.trim().toUpperCase()
    const { data, error: lookupError } = await supabase.rpc('lookup_student_by_id', {
      p_student_id: normalizedId,
    })
    const student = (data as StudentLookup[] | null)?.[0]
    if (lookupError || !student) {
      setAddError('No student was found with that Student ID. Check it and try again.')
      setAdding(false)
      return
    }

    const { error } = await supabase
      .from('classroom_students')
      .insert({ classroom_id: classroomId, student_id: student.student_id })

    if (error?.code === '23505') {
      setAddError('This student is already on this class roster.')
    } else if (error) {
      setAddError('The student could not be added. Try again in a moment.')
    } else {
      setStudentIdInput('')
      setAddMessage(`${student.full_name || student.student_id} was added to this class.`)
      try {
        await loadRoster()
      } catch {
        setLoadError('The student was added, but the roster could not be refreshed.')
      }
    }
    setAdding(false)
  }

  async function removeStudent(student: RosterStudent) {
    if (!window.confirm(`Remove ${student.full_name || student.student_id} from ${classroom?.name}? Their account will not be deleted.`)) return
    setRemovingId(student.id)
    setLoadError('')
    const { error } = await supabase
      .from('classroom_students')
      .delete()
      .eq('id', student.id)
      .eq('classroom_id', classroomId)
    if (error) {
      setLoadError('The student could not be removed from this class. Try again.')
    } else {
      setRoster(current => current.filter(item => item.id !== student.id))
    }
    setRemovingId('')
  }

  if (loading) return <p role="status" className="text-sm text-text/70">Loading class…</p>
  if (loadError && !classroom) {
    return (
      <section className="mx-auto max-w-4xl space-y-4 text-text">
        <p role="alert" className="rounded-lg border border-red-700/30 bg-surface p-5">{loadError}</p>
        <Link to="/dashboard" className="inline-flex min-h-10 items-center text-primary underline">Back to dashboard</Link>
      </section>
    )
  }
  if (!classroom) return null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 text-text">
      <header>
        <Link to="/dashboard" className="inline-flex min-h-10 items-center text-sm font-medium text-primary underline underline-offset-4">
          ← My classes
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{classroom.subject}</p>
            <h1 className="mt-1 font-heading text-3xl font-bold">{classroom.name}</h1>
          </div>
          <span className="text-sm text-text/70">{roster.length} {roster.length === 1 ? 'student' : 'students'}</span>
        </div>
      </header>

      <form onSubmit={addStudent} className="grid gap-3 rounded-lg border border-text/15 bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5">
        <div className="space-y-1.5">
          <label htmlFor="student-id" className="text-sm font-medium">Add student by Student ID</label>
          <input
            id="student-id"
            required
            value={studentIdInput}
            onChange={event => setStudentIdInput(event.target.value)}
            placeholder="HAI-2026-0001"
            autoCapitalize="characters"
            autoComplete="off"
            className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2 font-mono text-text placeholder:font-sans placeholder:text-text/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="min-h-11 rounded-md bg-primary px-5 py-2 font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {adding ? 'Adding…' : 'Add Student'}
        </button>
        {addError && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{addError}</p>}
        {addMessage && <p role="status" className="text-sm text-primary sm:col-span-2">{addMessage}</p>}
      </form>

      {loadError && <p role="alert" className="rounded-md border border-red-700/30 bg-surface p-3 text-sm">{loadError}</p>}
      <section aria-labelledby="roster-heading" className="space-y-3">
        <h2 id="roster-heading" className="font-heading text-xl font-semibold">Student roster</h2>
        {loadError && roster.length === 0 ? (
          <p className="rounded-lg border border-red-700/30 bg-surface p-5 text-sm text-text/70">
            The roster is unavailable until the class can be refreshed.
          </p>
        ) : roster.length === 0 ? (
          <p className="rounded-lg border border-text/15 bg-surface p-5 text-sm text-text/70">
            No students yet. Add a student with their Student ID to get started.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-text/15 bg-surface">
            <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
              <thead className="bg-background">
                <tr>
                  <th scope="col" className="border-b border-text/20 px-4 py-3 font-semibold">Student</th>
                  <th scope="col" className="border-b border-text/20 px-4 py-3 font-semibold">Student ID</th>
                  <th scope="col" className="border-b border-text/20 px-4 py-3 font-semibold">Date joined</th>
                  <th scope="col" className="border-b border-text/20 px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text/15">
                {roster.map(student => (
                  <tr key={student.id}>
                    <td className="px-4 py-3 font-medium">{student.full_name || 'Student'}</td>
                    <td className="px-4 py-3 font-mono">{student.student_id}</td>
                    <td className="px-4 py-3">{new Date(student.joined_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/student-progress?studentId=${encodeURIComponent(student.student_id)}&classroomId=${encodeURIComponent(classroomId)}`}
                          className="inline-flex min-h-10 items-center font-medium text-primary underline underline-offset-4"
                        >
                          View progress
                        </Link>
                        <button
                          type="button"
                          disabled={removingId === student.id}
                          onClick={() => void removeStudent(student)}
                          className="min-h-10 px-2 font-medium text-red-700 underline underline-offset-4 disabled:opacity-60"
                        >
                          {removingId === student.id ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
