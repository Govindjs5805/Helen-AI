import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabase'

interface Classroom {
  id: string
  name: string
  subject: string
  created_at: string
}

interface RosterStudent {
  id: string
  student_id: string
  full_name: string
  joined_at: string
}

interface StudentLookup {
  id: string
  student_id: string
  full_name: string
}

export function Classrooms() {
  const { session } = useAuth()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [selectedClassroomId, setSelectedClassroomId] = useState('')
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [loadingClassrooms, setLoadingClassrooms] = useState(true)
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [classroomName, setClassroomName] = useState('')
  const [subject, setSubject] = useState('')
  const [creatingClassroom, setCreatingClassroom] = useState(false)
  const [createError, setCreateError] = useState('')

  const [studentIdInput, setStudentIdInput] = useState('')
  const [addingStudent, setAddingStudent] = useState(false)
  const [addError, setAddError] = useState('')
  const [addMessage, setAddMessage] = useState('')

  useEffect(() => {
    const teacherId = session?.user.id
    if (!teacherId) {
      setLoadingClassrooms(false)
      return
    }

    let cancelled = false
    supabase
      .from('classrooms')
      .select('id, name, subject, created_at')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setLoadError('Classrooms could not be loaded. Refresh and try again.')
        else {
          const loadedClassrooms = (data ?? []) as Classroom[]
          setClassrooms(loadedClassrooms)
          setSelectedClassroomId(loadedClassrooms[0]?.id ?? '')
        }
        setLoadingClassrooms(false)
      })

    return () => {
      cancelled = true
    }
  }, [session?.user.id])

  useEffect(() => {
    if (!selectedClassroomId) {
      setRoster([])
      return
    }

    let cancelled = false
    setLoadingRoster(true)
    setLoadError('')

    supabase
      .rpc('get_classroom_roster', { p_classroom_id: selectedClassroomId })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setLoadError('This classroom roster could not be loaded.')
          setRoster([])
        } else {
          setRoster((data ?? []) as RosterStudent[])
        }
        setLoadingRoster(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedClassroomId])

  async function createClassroom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session?.user.id) return
    setCreatingClassroom(true)
    setCreateError('')

    const { data, error } = await supabase
      .from('classrooms')
      .insert({
        teacher_id: session.user.id,
        name: classroomName.trim(),
        subject: subject.trim(),
      })
      .select('id, name, subject, created_at')
      .single()

    if (error || !data) {
      setCreateError('Classroom could not be created. Check the details and try again.')
    } else {
      const created = data as Classroom
      setClassrooms(current => [created, ...current])
      setSelectedClassroomId(created.id)
      setClassroomName('')
      setSubject('')
    }
    setCreatingClassroom(false)
  }

  async function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedClassroomId) return
    setAddingStudent(true)
    setAddError('')
    setAddMessage('')

    const normalizedId = studentIdInput.trim().toUpperCase()
    const { data: lookupData, error: lookupError } = await supabase.rpc(
      'lookup_student_by_id',
      { p_student_id: normalizedId }
    )
    const foundStudent = (lookupData as StudentLookup[] | null)?.[0]

    if (lookupError || !foundStudent) {
      setAddError('No student found with that ID — double check and try again')
      setAddingStudent(false)
      return
    }

    const { error: insertError } = await supabase
      .from('classroom_students')
      .insert({ classroom_id: selectedClassroomId, student_id: foundStudent.student_id })

    if (insertError?.code === '23505') {
      setAddError('This student is already on this classroom roster.')
    } else if (insertError) {
      setAddError('Student could not be added. Try again in a moment.')
    } else {
      setStudentIdInput('')
      setAddMessage(`${foundStudent.full_name || foundStudent.student_id} added to the classroom.`)
      const { data } = await supabase.rpc('get_classroom_roster', {
        p_classroom_id: selectedClassroomId,
      })
      setRoster((data ?? []) as RosterStudent[])
    }
    setAddingStudent(false)
  }

  const selectedClassroom = classrooms.find(classroom => classroom.id === selectedClassroomId)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 text-text">
      <header>
        <h1 className="font-heading text-3xl font-bold text-text">Classrooms</h1>
        <p className="mt-2 text-text/70">Create a class, then add students with their Student IDs.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <form
          onSubmit={createClassroom}
          className="space-y-4 rounded-lg border border-text/15 bg-surface p-5 sm:p-6"
        >
          <h2 className="font-heading text-xl font-semibold text-text">Create classroom</h2>
          <div className="space-y-1.5">
            <label htmlFor="classroom-name" className="text-sm font-medium text-text">Name</label>
            <input
              id="classroom-name"
              required
              maxLength={80}
              value={classroomName}
              onChange={event => setClassroomName(event.target.value)}
              placeholder="e.g. Room 12"
              className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2 text-text placeholder:text-text/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="classroom-subject" className="text-sm font-medium text-text">Subject</label>
            <input
              id="classroom-subject"
              required
              maxLength={80}
              value={subject}
              onChange={event => setSubject(event.target.value)}
              placeholder="e.g. Science"
              className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2 text-text placeholder:text-text/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          {createError && <p role="alert" className="text-sm text-red-700">{createError}</p>}
          <button
            type="submit"
            disabled={creatingClassroom}
            className="min-h-11 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60"
          >
            {creatingClassroom ? 'Creating…' : 'Create classroom'}
          </button>
        </form>

        <section className="space-y-4 rounded-lg border border-text/15 bg-surface p-5 sm:p-6" aria-labelledby="your-classrooms-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="your-classrooms-heading" className="font-heading text-xl font-semibold text-text">Your classrooms</h2>
            <span className="text-sm text-text/70">{classrooms.length} total</span>
          </div>
          {loadingClassrooms ? (
            <p role="status" className="text-sm text-text/70">Loading classrooms…</p>
          ) : classrooms.length === 0 ? (
            <p className="rounded-md border border-text/15 bg-background p-4 text-sm text-text/70">
              No classrooms yet. Use the form to create your first one.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classrooms.map(classroom => (
                <button
                  key={classroom.id}
                  type="button"
                  aria-pressed={selectedClassroomId === classroom.id}
                  onClick={() => {
                    setSelectedClassroomId(classroom.id)
                    setAddError('')
                    setAddMessage('')
                  }}
                  className={`min-h-11 rounded-md border px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedClassroomId === classroom.id ? 'border-primary bg-primary text-white' : 'border-text/20 bg-background text-text'}`}
                >
                  <span className="block font-semibold">{classroom.name}</span>
                  <span className={`block text-xs ${selectedClassroomId === classroom.id ? 'text-white/85' : 'text-text/70'}`}>
                    {classroom.subject}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </section>

      {selectedClassroom && (
        <section className="space-y-5" aria-labelledby="roster-heading">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="roster-heading" className="font-heading text-2xl font-semibold text-text">
                {selectedClassroom.name} roster
              </h2>
              <p className="text-sm text-text/70">{selectedClassroom.subject}</p>
            </div>
            <span className="text-sm text-text/70">{roster.length} students</span>
          </div>

          <form onSubmit={addStudent} className="grid gap-3 rounded-lg border border-text/15 bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1.5">
              <label htmlFor="student-id" className="text-sm font-medium text-text">Add student by Student ID</label>
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
              disabled={addingStudent}
              className="min-h-11 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60"
            >
              {addingStudent ? 'Adding…' : 'Add student'}
            </button>
            {addError && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{addError}</p>}
            {addMessage && <p role="status" className="text-sm text-primary sm:col-span-2">{addMessage}</p>}
          </form>

          {loadError && <p role="alert" className="text-sm text-red-700">{loadError}</p>}
          {loadingRoster ? (
            <p role="status" className="text-sm text-text/70">Loading roster…</p>
          ) : roster.length === 0 ? (
            <p className="rounded-lg border border-text/15 bg-surface p-5 text-text/70">
              No students yet — share your Student ID request with students to add them.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-text/20 bg-surface">
              <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                <thead className="bg-background text-text">
                  <tr>
                    <th scope="col" className="border-b border-text/20 px-4 py-3 font-semibold">Student</th>
                    <th scope="col" className="border-b border-text/20 px-4 py-3 font-semibold">Student ID</th>
                    <th scope="col" className="border-b border-text/20 px-4 py-3 font-semibold">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-text/15">
                  {roster.map(student => (
                    <tr key={student.id}>
                      <td className="px-4 py-3 font-medium text-text">{student.full_name || 'Student'}</td>
                      <td className="px-4 py-3 font-mono text-text">{student.student_id}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/student-progress?studentId=${encodeURIComponent(student.student_id)}`}
                          className="inline-flex min-h-10 items-center rounded px-2 font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          View progress
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}