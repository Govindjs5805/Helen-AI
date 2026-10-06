import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@/services/supabase'

interface StudentProgressSummary {
  student_id: string
  full_name: string
  xp_total: number
  current_streak: number
  last_active_date: string | null
}

export function StudentProgress() {
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('studentId')?.trim().toUpperCase() ?? ''
  const classroomId = searchParams.get('classroomId')?.trim() ?? ''
  const [summary, setSummary] = useState<StudentProgressSummary | null>(null)
  const [loading, setLoading] = useState(Boolean(studentId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!studentId) {
      setSummary(null)
      setError('')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')
    supabase
      .rpc('get_rostered_student_progress', { p_student_id: studentId })
      .then(({ data, error: requestError }) => {
        if (cancelled) return
        if (requestError || !data?.[0]) {
          setSummary(null)
          setError('Student progress is unavailable for this ID or the student is no longer on your roster.')
        } else {
          setSummary(data[0] as StudentProgressSummary)
        }
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [studentId])

  const backLink = classroomId ? `/classrooms/${encodeURIComponent(classroomId)}` : '/dashboard'
  const backLabel = classroomId ? 'Back to class roster' : 'Back to dashboard'

  if (!studentId) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 text-text">
        <h1 className="font-heading text-3xl font-bold">Student progress</h1>
        <p className="rounded-lg border border-text/15 bg-surface p-5 text-text/70">
          Choose a student from one of your classroom rosters to view their progress.
        </p>
        <Link to="/dashboard" className="inline-flex min-h-11 items-center text-primary underline underline-offset-4">
          Back to dashboard
        </Link>
      </section>
    )
  }

  if (loading) return <p role="status" className="text-sm text-text/70">Loading student progress…</p>
  if (error || !summary) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 text-text">
        <h1 className="font-heading text-3xl font-bold">Student progress</h1>
        <p role="alert" className="rounded-lg border border-red-700/30 bg-surface p-5">{error || 'Student progress is unavailable.'}</p>
        <Link to={backLink} className="inline-flex min-h-11 items-center text-primary underline underline-offset-4">{backLabel}</Link>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 text-text">
      <header>
        <Link to={backLink} className="inline-flex min-h-10 items-center text-sm font-medium text-primary underline underline-offset-4">
          ← {backLabel}
        </Link>
        <h1 className="mt-3 font-heading text-3xl font-bold">{summary.full_name || 'Student'} progress</h1>
        <p className="mt-1 font-mono text-sm text-text/70">{summary.student_id}</p>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-text/15 bg-surface p-5">
          <dt className="text-sm text-text/70">Experience points</dt>
          <dd className="mt-2 text-3xl font-bold">{summary.xp_total.toLocaleString()}</dd>
        </div>
        <div className="rounded-lg border border-text/15 bg-surface p-5">
          <dt className="text-sm text-text/70">Current learning streak</dt>
          <dd className="mt-2 text-3xl font-bold">{summary.current_streak} days</dd>
        </div>
        <div className="rounded-lg border border-text/15 bg-surface p-5">
          <dt className="text-sm text-text/70">Last active</dt>
          <dd className="mt-2 font-semibold">
            {summary.last_active_date
              ? new Date(`${summary.last_active_date}T00:00:00`).toLocaleDateString()
              : 'No activity recorded yet'}
          </dd>
        </div>
        <div className="rounded-lg border border-text/15 bg-surface p-5">
          <dt className="text-sm text-text/70">Quiz scores</dt>
          <dd className="mt-2 font-semibold">Not available yet</dd>
          <p className="mt-1 text-xs text-text/65">Quiz score tracking has not been added yet.</p>
        </div>
      </dl>

      <p className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-text/75">
        This view shows learning activity only. Student-uploaded and simplified document content is private and is not shown here.
      </p>
    </section>
  )
}
