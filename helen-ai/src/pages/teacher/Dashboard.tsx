import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabase'

interface TeacherDetails {
  institute_name: string
  place: string
  designation: string | null
}

interface Classroom {
  id: string
  name: string
  subject: string
  created_at: string
  student_count: number | null
}

export function Dashboard() {
  const { session, profile } = useAuth()
  const [teacherDetails, setTeacherDetails] = useState<TeacherDetails | null>(null)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [classesError, setClassesError] = useState('')
  const [countsError, setCountsError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [className, setClassName] = useState('')
  const [subject, setSubject] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    const teacherId = session?.user.id
    if (!teacherId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setProfileError('')
    setClassesError('')
    setCountsError('')

    async function loadDashboard() {
      const [teacherResult, classroomResult] = await Promise.all([
        supabase
          .from('teacher_profiles')
          .select('institute_name, place, designation')
          .eq('id', teacherId)
          .maybeSingle(),
        supabase
          .from('classrooms')
          .select('id, name, subject, created_at')
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false }),
      ])

      if (cancelled) return
      if (teacherResult.error) {
        setProfileError('Your teacher profile could not be loaded. Refresh and try again.')
      } else {
        setTeacherDetails(teacherResult.data as TeacherDetails | null)
      }
      if (classroomResult.error) {
        setClassesError('Your classes could not be loaded. Refresh and try again.')
        setClassrooms([])
      } else {
        const rows = classroomResult.data ?? []
        if (rows.length === 0) {
          setClassrooms([])
        } else {
          const rosterResult = await supabase
            .from('classroom_students')
            .select('classroom_id')
            .in('classroom_id', rows.map(row => row.id))

          if (cancelled) return
          if (rosterResult.error) {
            setCountsError('Student counts could not be loaded. Refresh and try again.')
            setClassrooms(rows.map(row => ({ ...row, student_count: null })))
          } else {
            const counts = new Map<string, number>()
            for (const membership of rosterResult.data ?? []) {
              counts.set(membership.classroom_id, (counts.get(membership.classroom_id) ?? 0) + 1)
            }
            setClassrooms(rows.map(row => ({
              ...row,
              student_count: counts.get(row.id) ?? 0,
            })))
          }
        }
      }
      setLoading(false)
    }

    void loadDashboard()
    return () => { cancelled = true }
  }, [session?.user.id])

  async function createClassroom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session?.user.id) return
    setCreating(true)
    setCreateError('')

    const { data, error } = await supabase
      .from('classrooms')
      .insert({
        teacher_id: session.user.id,
        name: className.trim(),
        subject: subject.trim(),
      })
      .select('id, name, subject, created_at')
      .single()

    if (error || !data) {
      setCreateError('Class could not be created. Check the details and try again.')
    } else {
      setClassrooms(previous => [{ ...data, student_count: 0 }, ...previous])
      setClassName('')
      setSubject('')
      setFormOpen(false)
    }
    setCreating(false)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 text-text">
      <header className="rounded-2xl border border-text/15 bg-surface p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Teacher dashboard</p>
        <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
          Welcome, {profile?.full_name || 'Teacher'}
        </h1>
        {teacherDetails ? (
          <div className="mt-3">
            <p className="text-lg font-semibold">{teacherDetails.institute_name}</p>
            <p className="mt-1 text-sm text-text/70">
              {[teacherDetails.designation, teacherDetails.place].filter(Boolean).join(' · ')}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-text/70">
            {profileError || 'Your institute details have not been added yet.'}
          </p>
        )}
      </header>

      <section aria-labelledby="my-classes-heading" className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="my-classes-heading" className="font-heading text-2xl font-bold">My Classes</h2>
            <p className="mt-1 text-sm text-text/70">Manage your classrooms and student rosters.</p>
          </div>
          <button
            type="button"
            onClick={() => { setFormOpen(open => !open); setCreateError('') }}
            aria-expanded={formOpen}
            className="min-h-11 rounded-md bg-primary px-5 py-2 font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {formOpen ? 'Cancel' : 'Create New Class'}
          </button>
        </div>

        {formOpen && (
          <form onSubmit={createClassroom} className="grid gap-4 rounded-lg border border-text/15 bg-surface p-5 sm:grid-cols-2 sm:p-6">
            <div className="space-y-1.5">
              <label htmlFor="new-class-name" className="text-sm font-medium">Class name</label>
              <input
                id="new-class-name"
                required
                maxLength={80}
                value={className}
                onChange={event => setClassName(event.target.value)}
                placeholder="e.g. Grade 8 - A"
                className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-class-subject" className="text-sm font-medium">Subject</label>
              <input
                id="new-class-subject"
                required
                maxLength={80}
                value={subject}
                onChange={event => setSubject(event.target.value)}
                placeholder="e.g. Science"
                className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            {createError && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{createError}</p>}
            <button
              type="submit"
              disabled={creating}
              className="min-h-11 rounded-md bg-primary px-5 py-2 font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
            >
              {creating ? 'Creating…' : 'Create class'}
            </button>
          </form>
        )}

        {classesError && <p role="alert" className="rounded-md border border-red-700/30 bg-surface p-3 text-sm">{classesError}</p>}
        {countsError && <p role="alert" className="rounded-md border border-red-700/30 bg-surface p-3 text-sm">{countsError}</p>}
        {loading ? (
          <p role="status" className="rounded-lg border border-text/15 bg-surface p-5 text-sm text-text/70">Loading your classes…</p>
        ) : classesError ? null : classrooms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-text/25 bg-surface p-8 text-center">
            <h3 className="font-heading text-lg font-semibold">No classes yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-text/70">
              Create your first class to add students and follow their learning progress.
            </p>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="mt-5 min-h-11 rounded-md bg-primary px-5 py-2 font-semibold text-white hover:opacity-90"
            >
              Create your first class
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {classrooms.map(classroom => (
              <Link
                key={classroom.id}
                to={`/classrooms/${classroom.id}`}
                className="group rounded-xl border border-text/15 bg-surface p-5 transition hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{classroom.subject}</p>
                <h3 className="mt-2 font-heading text-xl font-bold group-hover:text-primary">{classroom.name}</h3>
                <p className="mt-4 text-sm text-text/70">
                  {classroom.student_count === null
                    ? 'Student count unavailable'
                    : `${classroom.student_count} ${classroom.student_count === 1 ? 'student' : 'students'}`}
                </p>
                <span className="mt-4 inline-flex min-h-10 items-center font-semibold text-primary">
                  Open class <span aria-hidden="true" className="ml-2">→</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
