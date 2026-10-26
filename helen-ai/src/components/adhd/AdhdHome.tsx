import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Timer } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { attentionRequest } from '@/services/attentionApi'
import { ParkedThoughtReview } from '@/components/ParkedThoughtReview'
import { ThemeToggle } from '@/components/ThemeToggle'
import { DateStrip } from './DateStrip'
import { HelenMascot } from './HelenMascot'
import { TaskCard, type FocusTask } from './TaskCard'

const TASKS: FocusTask[] = [
  { title: 'Study Math', duration: 25, color: 'lime', label: 'Now' },
  { title: 'Take a break', duration: 5, color: 'pink' },
  { title: 'Revise notes', duration: 15, color: 'periwinkle' },
]

interface TodaySummary {
  tasksDone: number
  minutesFocused: number
}

interface PlannerItem {
  status: 'todo' | 'done'
}

interface FocusSession {
  started_at: string
  status: string
  focus_minutes?: number | null
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function AdhdHome({ firstName }: { firstName: string }) {
  const { session } = useAuth()
  const { calmMode, setCalmMode, themeSaveError } = useTheme()
  const [timeOfDay] = useState(() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  })
  const [summary, setSummary] = useState<TodaySummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState('')

  useEffect(() => {
    const token = session?.access_token
    if (!token) {
      setSummary(null)
      setSummaryError('Sign in again to load today’s summary.')
      setSummaryLoading(false)
      return
    }

    let active = true
    const today = new Date()
    const dateKey = localDateKey(today)
    setSummaryLoading(true)

    void Promise.all([
      attentionRequest<{ items: PlannerItem[] }>(`/attention/planner?due_date=${dateKey}`, token),
      attentionRequest<{ sessions: FocusSession[] }>('/attention/focus-sessions?limit=100', token),
    ]).then(([planner, focus]) => {
      if (!active) return
      const todaysSessions = focus.sessions.filter(item => new Date(item.started_at).toDateString() === today.toDateString())
      setSummary({
        tasksDone: planner.items.filter(item => item.status === 'done').length,
        minutesFocused: todaysSessions
          .filter(item => item.status === 'completed')
          .reduce((total, item) => total + (item.focus_minutes ?? 0), 0),
      })
      setSummaryError('')
    }).catch(caught => {
      if (active) {
        setSummary(null)
        setSummaryError(caught instanceof Error ? caught.message : 'Today’s summary could not be loaded.')
      }
    }).finally(() => {
      if (active) setSummaryLoading(false)
    })

    return () => { active = false }
  }, [session?.access_token])

  return (
    <div className="adhd-home mx-auto w-full max-w-[1280px] space-y-7 text-text">
      <header className="space-y-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h1 className="min-w-0 flex-1 whitespace-nowrap font-display font-semibold">
            Good {timeOfDay}, {firstName}
          </h1>
          <ThemeToggle />
        </div>
        <p className="text-base text-muted">Welcome back to your learning journey.</p>
        <p aria-live="polite" className="sr-only">
          {themeSaveError || `Calm mode ${calmMode ? 'enabled' : 'disabled'}.`}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(13rem,1fr)] lg:gap-10">
        <div className="min-w-0 space-y-7">
          <section aria-label="Dates this week">
            <DateStrip />
          </section>

          <section aria-labelledby="today-plan-title">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="today-plan-title" className="font-display font-semibold">Your next steps</h2>
              {!calmMode && <HelenMascot mood="focus" className="h-14 w-12 shrink-0 text-primary" />}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {TASKS.map((task, index) => (
                <div key={task.title} className={index === 0 ? 'md:col-span-2' : undefined}>
                  <TaskCard task={task} calmMode={calmMode} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-text/15 bg-surface p-5 sm:p-6" aria-labelledby="focus-card-title">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-text" aria-hidden="true">
                <Timer className="h-5 w-5" />
              </span>
              <div>
                <h2 id="focus-card-title" className="font-display font-semibold">Focus timer</h2>
                <p className="text-sm text-muted">One step at a time.</p>
              </div>
            </div>
            <Link
              to="/focus"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Start focus session
            </Link>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-text/15 pt-3">
              <span className="text-sm font-medium">Calm mode</span>
              <button
                type="button"
                role="switch"
                aria-checked={calmMode}
                aria-label="Calm mode"
                onClick={() => setCalmMode(!calmMode)}
                className={`relative flex min-h-11 min-w-11 items-center justify-center rounded-full border border-text/25 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${calmMode ? 'bg-primary' : 'bg-surface-2'}`}
              >
                <span className={`block h-7 w-7 rounded-full ${calmMode ? 'translate-x-1 bg-background' : '-translate-x-1 bg-muted'} transition-transform`} />
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-text/15 bg-surface p-5 sm:p-6" aria-labelledby="today-summary-title">
            <h2 id="today-summary-title" className="font-display font-semibold">Today</h2>
            {summaryLoading ? (
              <p role="status" className="mt-3 text-sm text-muted">Loading today’s summary…</p>
            ) : summaryError ? (
              <p role="alert" className="mt-3 text-sm text-muted">{summaryError}</p>
            ) : summary && (
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-2 p-4">
                  <dt className="text-sm text-muted">Tasks done</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold">{summary.tasksDone}</dd>
                </div>
                <div className="rounded-xl bg-surface-2 p-4">
                  <dt className="text-sm text-muted">Minutes focused</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold">{summary.minutesFocused}</dd>
                </div>
              </dl>
            )}
          </section>

          <ParkedThoughtReview compact />
        </aside>
      </div>
    </div>
  )
}
