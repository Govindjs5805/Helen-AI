import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/context/AuthContext'
import { attentionRequest } from '@/services/attentionApi'

interface LearningTaskRecord {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
}

interface PlannerTaskRecord {
  id: string
  title: string
  status: 'todo' | 'done'
}

interface FocusSessionRecord {
  id: string
  task_label: string
  status: 'active' | 'paused' | 'completed' | 'stopped'
  started_at: string
  planned_minutes: number
  focus_minutes: number
}

interface QuizAttemptRecord {
  id: string
  subject: string | null
  topic: string
  score: number
  total_questions: number
  completed_at: string
}

interface DailyFocus {
  date: string
  label: string
  minutes: number
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getLastSevenDays(sessions: FocusSessionRecord[]): DailyFocus[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const key = dateKey(date)
    return {
      date: key,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      minutes: sessions
        .filter(session => session.status === 'completed' && dateKey(new Date(session.started_at)) === key)
        .reduce((total, session) => total + Math.max(0, session.focus_minutes || 0), 0),
    }
  })
}

interface StudentProgressSummary {
  student_id: string
  full_name: string
  xp_total: number
  current_streak: number
  last_active_date: string | null
}

export function Progress() {
  const { session } = useAuth()
  const [tasks, setTasks] = useState<LearningTaskRecord[]>([])
  const [plannerTasks, setPlannerTasks] = useState<PlannerTaskRecord[]>([])
  const [sessions, setSessions] = useState<FocusSessionRecord[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptRecord[]>([])
  const [quizAttemptCount, setQuizAttemptCount] = useState(0)
  const [quizHistoryError, setQuizHistoryError] = useState('')
  const [subjectsError, setSubjectsError] = useState('')
  const [attentionError, setAttentionError] = useState('')
  const [tasksAvailable, setTasksAvailable] = useState(false)
  const [plannerAvailable, setPlannerAvailable] = useState(false)
  const [focusAvailable, setFocusAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProgress = useCallback(async () => {
    const token = session?.access_token
    if (!token) {
      setLoading(false)
      setError('Sign in again to view your progress.')
      return
    }

    setLoading(true)
    setTasksAvailable(false)
    setPlannerAvailable(false)
    setFocusAvailable(false)
    try {
      const [learningTasksResult, plannerResult, focusResult, profileResult, quizResult] = await Promise.allSettled([
        attentionRequest<{ tasks: LearningTaskRecord[] }>('/attention/tasks', token),
        attentionRequest<{ items: PlannerTaskRecord[] }>('/attention/planner', token),
        attentionRequest<{ sessions: FocusSessionRecord[] }>('/attention/focus-sessions?limit=100', token),
        supabase.from('student_profiles').select('subjects').eq('id', session?.user.id ?? '').maybeSingle(),
        supabase
          .from('quiz_attempts')
          .select('id,subject,topic,score,total_questions,completed_at', { count: 'exact' })
          .eq('student_id', session?.user.id ?? '')
          .order('completed_at', { ascending: false }),
      ])
      const attentionFailures: string[] = []
      if (learningTasksResult.status === 'fulfilled') {
        setTasks(learningTasksResult.value.tasks)
        setTasksAvailable(true)
      } else {
        setTasks([])
        attentionFailures.push('checklist')
      }
      if (plannerResult.status === 'fulfilled') {
        setPlannerTasks(plannerResult.value.items)
        setPlannerAvailable(true)
      } else {
        setPlannerTasks([])
        attentionFailures.push('planner')
      }
      if (focusResult.status === 'fulfilled') {
        setSessions(focusResult.value.sessions)
        setFocusAvailable(true)
      } else {
        setSessions([])
        attentionFailures.push('focus-session')
      }
      setAttentionError(attentionFailures.length
        ? `Your ${attentionFailures.join(', ')} progress could not be loaded. Quiz marks and subjects are available separately.`
        : '')
      if (profileResult.status === 'rejected' || profileResult.value.error) {
        setSubjects([])
        setSubjectsError('Your learning subjects could not be loaded.')
      } else {
        setSubjects(Array.isArray(profileResult.value.data?.subjects) ? profileResult.value.data.subjects : [])
        setSubjectsError('')
      }
      if (quizResult.status === 'rejected' || quizResult.value.error) {
        setQuizAttempts([])
        setQuizAttemptCount(0)
        setQuizHistoryError('Quiz history could not be loaded. Check that the latest database migration has been applied.')
      } else {
        setQuizAttempts((quizResult.value.data ?? []) as QuizAttemptRecord[])
        setQuizAttemptCount(quizResult.value.count ?? quizResult.value.data?.length ?? 0)
        setQuizHistoryError('')
      }
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your progress could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, session?.user.id])

  useEffect(() => { void loadProgress() }, [loadProgress])

  const completedLearningTasks = tasks.filter(task => task.status === 'done').length
  const completedPlannerTasks = plannerTasks.filter(task => task.status === 'done').length
  const completedSessions = sessions.filter(item => item.status === 'completed')
  const totalFocusMinutes = completedSessions.reduce((total, item) => total + Math.max(0, item.focus_minutes || 0), 0)
  const averageQuizMark = quizAttempts.length
    ? Math.round(quizAttempts.reduce((total, attempt) => total + (attempt.score / attempt.total_questions) * 100, 0) / quizAttempts.length)
    : null
  const subjectProgress = subjects.map(subject => {
    const attempts = quizAttempts.filter(attempt => attempt.subject?.toLocaleLowerCase() === subject.toLocaleLowerCase())
    const averageMark = attempts.length
      ? Math.round(attempts.reduce((total, attempt) => total + (attempt.score / attempt.total_questions) * 100, 0) / attempts.length)
      : null
    return { subject, attempts, averageMark }
  })
  const weeklyFocus = getLastSevenDays(sessions)
  const maxDailyMinutes = Math.max(1, ...weeklyFocus.map(day => day.minutes))

  return (
    <main className="mx-auto w-full max-w-5xl space-y-7 text-text">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">YOUR LEARNING JOURNEY</p>
          <h1 className="mt-1 font-heading font-bold">Your progress</h1>
          <p className="mt-2 text-base text-muted">See the tasks you have completed and the time you have made for focus.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadProgress()}
          disabled={loading}
          className="inline-flex min-h-11 items-center rounded-md border border-primary px-4 py-2 font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait"
        >
          {loading ? 'Refreshing…' : 'Refresh progress'}
        </button>
      </header>

      {error && <p role="alert" className="rounded-lg border border-text/20 bg-surface p-4 text-sm">{error}</p>}
      {attentionError && <p role="alert" className="rounded-lg border border-text/20 bg-surface p-4 text-sm">{attentionError}</p>}
      {loading ? (
        <p role="status" className="rounded-lg border border-text/15 bg-surface p-5 text-muted">Loading your progress…</p>
      ) : !error ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Progress summary">
            {[
              { label: 'Completed checklists', value: tasksAvailable ? completedLearningTasks : '—' },
              { label: 'Planned tasks done', value: plannerAvailable ? completedPlannerTasks : '—' },
              { label: 'Focus sessions', value: focusAvailable ? completedSessions.length : '—' },
              { label: 'Focus minutes', value: focusAvailable ? totalFocusMinutes : '—' },
              { label: 'Quizzes attended', value: quizHistoryError ? '—' : quizAttemptCount },
              { label: 'Average quiz mark', value: averageQuizMark === null ? '—' : `${averageQuizMark}%` },
            ].map(metric => (
              <article key={metric.label} className="rounded-xl border border-text/15 bg-surface p-5">
                <h2 className="text-base font-medium text-muted">{metric.label}</h2>
                <p className="mt-2 font-display text-3xl font-semibold">{metric.value}</p>
              </article>
            ))}
          </section>

          <section className="space-y-5 rounded-xl border border-text/15 bg-surface p-5 sm:p-6" aria-labelledby="subject-learning-title">
            <div>
              <h2 id="subject-learning-title" className="font-heading font-semibold">Subjects you’re learning</h2>
              <p className="mt-1 text-sm text-muted">Choose a subject when you create a quiz to track practice and marks here.</p>
            </div>
            {subjectsError && <p role="alert" className="rounded-md border border-text/20 bg-background p-3 text-sm">{subjectsError}</p>}
            {quizHistoryError && <p role="alert" className="rounded-md border border-text/20 bg-background p-3 text-sm">{quizHistoryError}</p>}
            {subjectsError ? null : subjectProgress.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {subjectProgress.map(({ subject, attempts, averageMark }) => (
                  <li key={subject} className="rounded-lg border border-text/15 bg-background p-4">
                    <h3 className="font-semibold">{subject}</h3>
                    <p className="mt-2 text-sm text-muted">
                      {attempts.length} {attempts.length === 1 ? 'quiz' : 'quizzes'} attended
                      {averageMark !== null ? ` · Average mark ${averageMark}%` : ' · No quiz marks yet'}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-text/15 bg-background p-4 text-sm text-muted">No subjects are listed in your learning profile yet.</p>
            )}
          </section>

          <section className="rounded-xl border border-text/15 bg-surface p-5 sm:p-6" aria-labelledby="quiz-marks-title">
            <h2 id="quiz-marks-title" className="font-heading font-semibold">Recent quiz marks</h2>
            {quizHistoryError ? null : quizAttempts.length > 0 ? (
              <ul className="mt-4 divide-y divide-text/15">
                {quizAttempts.slice(0, 8).map(attempt => (
                  <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium">{attempt.topic}</p>
                      <p className="text-sm text-muted">{attempt.subject || 'General'} · {new Date(attempt.completed_at).toLocaleDateString()}</p>
                    </div>
                    <span className="font-semibold tabular-nums">{attempt.score}/{attempt.total_questions} ({Math.round((attempt.score / attempt.total_questions) * 100)}%)</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">Completed quiz marks will appear here. Select a subject before starting a quiz to include it in subject progress.</p>
            )}
          </section>

          <section className="rounded-xl border border-text/15 bg-surface p-5 sm:p-6" aria-labelledby="weekly-focus-title">
            <h2 id="weekly-focus-title" className="font-heading font-semibold">Focus this week</h2>
            <p className="mt-1 text-sm text-muted">Minutes from completed focus sessions over the last seven days.</p>
            {!focusAvailable && <p role="status" className="mt-3 text-sm text-muted">Focus history is unavailable right now.</p>}
            {focusAvailable && (
            <div className="mt-5 grid grid-cols-7 gap-2 sm:gap-4">
              {weeklyFocus.map(day => (
                <div key={day.date} className="flex min-w-0 flex-col items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">{day.minutes}</span>
                  <div className="flex h-32 w-full items-end rounded-md bg-surface-2 p-1" role="img" aria-label={`${day.label}: ${day.minutes} focus minutes`}>
                    <div
                      className="w-full rounded-sm bg-primary"
                      style={{ height: `${day.minutes ? Math.max(6, (day.minutes / maxDailyMinutes) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted">{day.label}</span>
                </div>
              ))}
            </div>
            )}
          </section>

          <section className="rounded-xl border border-text/15 bg-surface p-5 sm:p-6" aria-labelledby="recent-sessions-title">
            <h2 id="recent-sessions-title" className="font-heading font-semibold">Recent focus sessions</h2>
            {!focusAvailable ? (
              <p className="mt-3 text-sm text-muted">Focus history is unavailable right now.</p>
            ) : completedSessions.length > 0 ? (
              <ul className="mt-4 divide-y divide-text/15">
                {completedSessions.slice(0, 5).map(item => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span className="font-medium">{item.task_label || 'Focus session'}</span>
                    <span className="text-sm text-muted">
                      {Math.max(0, item.focus_minutes || 0)} min · {new Date(item.started_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">Your completed focus sessions will show up here.</p>
            )}
          </section>

          <div className="flex flex-wrap gap-3">
            <Link to="/focus" className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Start a focus session
            </Link>
            <Link to="/planner" className="inline-flex min-h-11 items-center rounded-md border border-primary px-5 py-2 font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Open today’s plan
            </Link>
          </div>
        </>
      ) : null}
    </main>
  )
}

export function StudentProgress() {
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('studentId')?.trim() ?? ''
  const [summary, setSummary] = useState<StudentProgressSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!studentId) {
      setSummary(null)
      setError('')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')
    supabase
      .rpc('get_rostered_student_progress', { p_student_id: studentId.toUpperCase() })
      .then(({ data, error: requestError }) => {
        if (cancelled) return
        if (requestError || !data?.[0]) {
          setSummary(null)
          setError('Student progress is unavailable for this ID or it is not on your roster.')
        } else {
          setSummary(data[0] as StudentProgressSummary)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [studentId])

  if (!studentId) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 text-text">
        <h1 className="font-heading text-3xl font-bold">Student progress</h1>
        <p className="rounded-lg border border-text/15 bg-surface p-5 text-text/70">
          Choose a student from one of your classroom rosters to view their progress.
        </p>
        <Link to="/classrooms" className="inline-flex min-h-11 items-center text-primary underline underline-offset-4">
          Back to classrooms
        </Link>
      </section>
    )
  }

  if (loading) {
    return <p role="status" className="text-sm text-text/70">Loading student progress…</p>
  }

  if (error || !summary) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 text-text">
        <h1 className="font-heading text-3xl font-bold">Student progress</h1>
        <p role="alert" className="rounded-lg border border-red-700/40 bg-surface p-5 text-text">
          {error || 'Student progress is unavailable.'}
        </p>
        <Link to="/classrooms" className="inline-flex min-h-11 items-center text-primary underline underline-offset-4">
          Back to classrooms
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 text-text">
      <header>
        <Link to="/classrooms" className="inline-flex min-h-10 items-center text-sm font-medium text-primary underline underline-offset-4">
          Back to classrooms
        </Link>
        <h1 className="mt-3 font-heading text-3xl font-bold">{summary.full_name || 'Student'} progress</h1>
        <p className="mt-1 font-mono text-sm text-text/70">{summary.student_id}</p>
      </header>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-text/15 bg-surface p-5">
          <dt className="text-sm text-text/70">Experience points</dt>
          <dd className="mt-2 text-3xl font-bold text-text">{summary.xp_total.toLocaleString()}</dd>
        </div>
        <div className="rounded-lg border border-text/15 bg-surface p-5">
          <dt className="text-sm text-text/70">Current streak</dt>
          <dd className="mt-2 text-3xl font-bold text-text">{summary.current_streak} days</dd>
        </div>
        <div className="rounded-lg border border-text/15 bg-surface p-5 sm:col-span-2">
          <dt className="text-sm text-text/70">Last active</dt>
          <dd className="mt-2 font-semibold text-text">
            {summary.last_active_date
              ? new Date(`${summary.last_active_date}T00:00:00`).toLocaleDateString()
              : 'No activity recorded yet'}
          </dd>
        </div>
      </dl>
    </section>
  )
}