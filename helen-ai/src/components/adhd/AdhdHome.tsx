import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Timer } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { attentionRequest } from '@/services/attentionApi'
import { ThemeToggle } from '@/components/ThemeToggle'
import { DateStrip } from './DateStrip'
import { TaskCard, type FocusTask } from './TaskCard'
import { AdhdDecorations } from './AdhdDecorations'

interface TodaySummary {
  tasksDone: number
  minutesFocused: number
}

interface PlannerItem {
  id: string
  title: string
  estimated_minutes: number
  priority: number
  position: number
  due_date: string
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
  const { session, profile } = useAuth()
  const { theme, toggleTheme, calmMode, setCalmMode, themeSaveError } = useTheme()
  const [timeOfDay] = useState(() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  })
  const [, setSummary] = useState<TodaySummary | null>(null)
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([])
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [, setSummaryError] = useState('')

  // Student name preference
  const displayName = profile?.full_name?.split(' ')[0] || firstName || 'Ahlada'

  useEffect(() => {
    const token = session?.access_token
    if (!token) {
      setSummary(null)
      setSummaryError('Sign in again to load today’s summary.')
      setSummaryLoading(false)
      return
    }

    let active = true
    const dateKey = localDateKey(selectedDate)
    setSummaryLoading(true)

    void Promise.all([
      attentionRequest<{ items: PlannerItem[] }>(`/attention/planner?due_date=${dateKey}`, token),
      attentionRequest<{ sessions: FocusSession[] }>('/attention/focus-sessions?limit=100', token),
    ]).then(([planner, focus]) => {
      if (!active) return
      setPlannerItems(planner.items)
      const selectedSessions = focus.sessions.filter(item => new Date(item.started_at).toDateString() === selectedDate.toDateString())
      setSummary({
        tasksDone: planner.items.filter(item => item.status === 'done').length,
        minutesFocused: selectedSessions
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
  }, [session?.access_token, selectedDate])

  async function setPlannerItemStatus(item: PlannerItem, status: PlannerItem['status']) {
    const token = session?.access_token
    if (!token || item.status === status) return
    setPlannerItems(items => items.map(candidate => candidate.id === item.id ? { ...candidate, status } : candidate))
    setSummaryError('')
    try {
      const result = await attentionRequest<{ item: PlannerItem }>(`/attention/planner/${item.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setPlannerItems(items => items.map(candidate => candidate.id === item.id ? result.item : candidate))
      setSummary(current => current
        ? { ...current, tasksDone: current.tasksDone + (status === 'done' ? 1 : -1) }
        : current)
    } catch (caught) {
      setPlannerItems(items => items.map(candidate => candidate.id === item.id ? item : candidate))
      setSummaryError(caught instanceof Error ? caught.message : 'Your task could not be updated.')
    }
  }

  const orderedTasks = [...plannerItems].sort((first, second) =>
    Number(first.status === 'done') - Number(second.status === 'done') || first.position - second.position
  )

  return (
    <div className="relative min-h-[calc(100dvh-5rem)] w-full overflow-hidden bg-[#EEF4FC] text-slate-900 transition-colors duration-200 dark:bg-[#070D24] dark:text-white">
      {/* Background 3D & Doodle Decorations matching UI */}
      <AdhdDecorations />

      <div className="relative z-10 mx-auto w-full max-w-md space-y-6 px-1 sm:px-0">
        {/* Header matching Screen 1 */}
        <header className="pt-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Good {timeOfDay}, {displayName}
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-[#8E9EC5]">
                Welcome back to your learning journey.
              </p>
            </div>

            {/* Profile Avatar & Theme Toggle matching UI */}
            <div className="flex items-center gap-2.5 shrink-0">
              <ThemeToggle />
              <div
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-white/60 bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md ring-2 ring-primary/40 dark:border-white/20"
                title={displayName}
              >
                <span className="font-display text-base font-bold text-white">
                  {displayName.charAt(0)}
                </span>
              </div>
            </div>
          </div>
          {themeSaveError && (
            <p role="status" className="mt-2 text-xs text-rose-400">
              {themeSaveError}
            </p>
          )}
        </header>

        {/* Date Strip with Track Indicator */}
        <section aria-label="Dates this week">
          <DateStrip onDateChange={setSelectedDate} />
        </section>

        {/* Your next steps section matching Screen 1 */}
        <section aria-labelledby="today-plan-title" className="space-y-3">
          <h2 id="today-plan-title" className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Your next steps
          </h2>

          {orderedTasks.length > 0 ? (
            <div className="space-y-3">
              {orderedTasks.map((item, index) => {
                const task: FocusTask = {
                  title: item.title,
                  duration: item.estimated_minutes,
                  color: (['lime', 'pink', 'periwinkle'] as const)[index % 3],
                  label: index === 0 && item.status !== 'done' ? 'Now' : undefined,
                }
                return (
                  <TaskCard
                    key={item.id}
                    task={task}
                    calmMode={calmMode}
                    completed={item.status === 'done'}
                    onToggleComplete={() => void setPlannerItemStatus(item, item.status === 'done' ? 'todo' : 'done')}
                  />
                )
              })}
            </div>
          ) : summaryLoading ? (
            <div className="flex min-h-[7rem] items-center justify-center rounded-3xl border border-blue-500/15 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0E1A3C]">
              <p className="text-sm font-medium text-slate-500 dark:text-[#8E9EC5]">Loading today’s tasks…</p>
            </div>
          ) : (
            /* Card matching "No tasks planned for today yet." with attached + button */
            <div className="flex items-stretch overflow-visible">
              <div className="flex-1 rounded-3xl border border-blue-500/15 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0E1A3C]">
                <p className="text-base font-semibold text-slate-800 dark:text-white">
                  No tasks planned for today yet.
                </p>
                <Link
                  to="/planner"
                  className="mt-3.5 inline-flex min-h-11 items-center rounded-2xl border border-slate-300 bg-slate-50 px-5 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:border-blue-400/30 dark:bg-[#08122C] dark:text-[#05FF85] dark:hover:bg-[#0D1B3E]"
                >
                  Add a task to your plan
                </Link>
              </div>

              {/* Attached Green/Blue Plus Button */}
              <div className="ml-2 flex items-center">
                <Link
                  to="/planner"
                  aria-label="Add a task"
                  className="flex h-14 w-11 flex-col items-center justify-center rounded-2xl bg-[#2563EB] font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95 dark:bg-[#05FF85] dark:text-[#060B1E] dark:shadow-[0_0_18px_rgba(5,255,133,0.45)]"
                >
                  <span className="text-2xl leading-none">+</span>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Focus timer card matching Screen 1 */}
        <section
          aria-labelledby="focus-card-title"
          className="rounded-3xl border border-blue-500/15 bg-white p-5 shadow-sm transition-all dark:border-white/10 dark:bg-[#0E1A3C] dark:shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EEFF] text-[#2563EB] dark:bg-[#142350] dark:text-[#05FF85]"
              aria-hidden="true"
            >
              <Timer className="h-6 w-6" />
            </span>
            <div>
              <h2 id="focus-card-title" className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Focus timer
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-[#8E9EC5]">
                One step at a time.
              </p>
            </div>
          </div>

          {/* Big Glowing CTA Button */}
          <Link
            to="/focus"
            className="adhd-glow-btn mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Start focus session
          </Link>

          {/* Calm Mode Switch */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-white/10">
            <span id="calm-mode-label" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Calm mode
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={calmMode}
              aria-labelledby="calm-mode-label"
              onClick={() => setCalmMode(!calmMode)}
              className={`relative flex h-8 w-14 shrink-0 items-center rounded-full border border-slate-300 p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/20 ${
                calmMode
                  ? 'bg-[#2563EB] dark:bg-[#05FF85] dark:shadow-[0_0_12px_rgba(5,255,133,0.5)]'
                  : 'bg-slate-200 dark:bg-[#142350]'
              }`}
            >
              <span
                className={`block h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  calmMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Theme Mode Switch (White Mode / Dark Mode) */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/10">
            <span id="theme-switch-label" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {theme === 'dark' ? 'Dark theme' : 'White theme'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              aria-labelledby="theme-switch-label"
              onClick={toggleTheme}
              className={`relative flex h-8 w-14 shrink-0 items-center rounded-full border border-slate-300 p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/20 ${
                theme === 'dark'
                  ? 'bg-[#05FF85] shadow-[0_0_12px_rgba(5,255,133,0.5)]'
                  : 'bg-[#2563EB]'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold shadow-md transition-transform duration-200 ${
                  theme === 'dark' ? 'translate-x-6 text-[#070D24]' : 'translate-x-0 text-[#2563EB]'
                }`}
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
