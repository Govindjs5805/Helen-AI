import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useAccessibilityProfile } from '@/hooks/useAccessibilityProfile'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/services/supabase'
import { Link } from 'react-router-dom'
import { useReadingTheme } from '@/context/ReadingThemeContext'
import { attentionRequest } from '@/services/attentionApi'
import type { StudentProfile } from '@/types'
import { AdminAttentionMetrics, ParentAttentionView } from '@/components/AttentionSharingViews'

/** Greeting header with time awareness */
function GreetingHeader({ name }: { name: string }) {
  const [timeOfDay, setTimeOfDay] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours()
      if (hour < 12) setTimeOfDay('morning')
      else if (hour < 17) setTimeOfDay('afternoon')
      else setTimeOfDay('evening')
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // update every minute
    return () => clearInterval(interval)
  }, [])

  const greetings = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
  }

  return (
    <header className="mb-8">
      <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">
        {greetings[timeOfDay as keyof typeof greetings]}, {name}
      </h1>
      <p className="mt-2 text-text/70">
        Welcome back to your learning journey.
      </p>
    </header>
  )
}

function FocusRecap({ token }: { token: string }) {
  const [task, setTask] = useState('')
  const [lastTask, setLastTask] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void Promise.all([
      attentionRequest<{ tasks: Array<{ title: string; steps: Array<{ text: string; done: boolean }> }> }>('/attention/tasks', token),
      attentionRequest<{ sessions: Array<{ task_label: string }> }>('/attention/focus-sessions?limit=1', token),
    ]).then(([tasks, sessions]) => {
      if (!active) return
      const next = tasks.tasks.find(item => item.steps.some(step => !step.done))
      setTask(next?.steps.find(step => !step.done)?.text ?? '')
      setLastTask(sessions.sessions[0]?.task_label ?? '')
    }).catch(caught => {
      if (active) setError(caught instanceof Error ? caught.message : 'Your focus recap is unavailable.')
    })
    return () => { active = false }
  }, [token])

  return (
    <section className="rounded-2xl border border-primary/25 bg-primary/5 p-5" aria-labelledby="focus-recap-title">
      <h2 id="focus-recap-title" className="font-heading text-xl font-semibold">Where you left off</h2>
      {lastTask && <p className="mt-2 text-sm">Last focus session: <strong>{lastTask}</strong></p>}
      {task && <p className="mt-2 text-sm">Next small step: <strong>{task}</strong></p>}
      {!lastTask && !task && !error && <p className="mt-2 text-sm text-text/70">Your next task can start with one small step.</p>}
      {error && <p role="status" className="mt-2 text-xs text-text/65">Focus recap is not available while offline.</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/focus" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">Start focus mode</Link>
        <Link to="/planner" className="inline-flex min-h-11 items-center rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary">Open today’s plan</Link>
      </div>
    </section>
  )
}

/** Circular progress ring for streak/XP */
function StreakProgressRing({
  streak,
  xpTotal,
}: {
  streak: number
  xpTotal: number
}) {
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (streak / 10) * circumference

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-40 w-40">
        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-text/10"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-accent transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-text">Day {streak}</div>
            <div className="text-sm text-text/60">XP: {xpTotal.toLocaleString()}</div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm text-text/60">Today&apos;s Streak</p>
    </div>
  )
}

/** Quick access cards share one component tree; preset CSS controls focus mode. */
function QuickAccessCards() {
  const modules = [
    { href: '/ai-assistant', label: 'AI Assistant', icon: '🤖' },
    { href: '/documents', label: 'Document Simplifier', icon: '📄' },
    { href: '/notes', label: 'Notes', icon: '📝' },
    { href: '/ai-assistant', label: 'Quiz', icon: '🎯' },
    { href: '/ai-assistant', label: 'Homework Helper', icon: '💡' },
  ]

  return (
    <section className="mt-8">
      <h2 className="font-heading text-xl font-semibold text-text mb-4">
        Quick Access
      </h2>
      <div className="dashboard-quick-access grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {modules.map(module => (
          <a
            key={module.href}
            href={module.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-black/10 bg-surface p-4 transition-colors hover:bg-primary/10 dark:border-white/10"
          >
            <span className="text-2xl">{module.icon}</span>
            <span className="text-sm font-medium text-text">{module.label}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

/** Continue where you left off section */
function ContinueSection() {
  return (
    <section className="mt-8">
      <h2 className="font-heading text-xl font-semibold text-text mb-4">
        Continue where you left off
      </h2>
      <div className="rounded-2xl border border-black/10 bg-surface p-8 text-center dark:border-white/10">
        <p className="text-text/60 mb-2">Nothing here yet — start with your AI Assistant</p>
        <a
          href="/ai-assistant"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
        >
          Start your first session
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </section>
  )
}

function StudentIdCard({ studentId }: { studentId: string }) {
  const [copyMessage, setCopyMessage] = useState('')

  async function copyStudentId() {
    try {
      await navigator.clipboard.writeText(studentId)
      setCopyMessage('Copied')
    } catch {
      setCopyMessage('Copy unavailable')
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold text-text">Your Student ID</h2>
        <p className="mt-1 font-mono text-lg font-semibold tracking-normal text-primary">
          {studentId}
        </p>
        <p className="mt-1 text-sm text-text/70">Share this ID with your teacher.</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={copyStudentId}
          className="min-h-11 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Copy ID
        </button>
        <span aria-live="polite" className="min-w-24 text-sm text-text/70">
          {copyMessage}
        </span>
      </div>
    </section>
  )
}

function TeacherDashboard({ name }: { name: string }) {
  const { session } = useAuth()
  const [classrooms, setClassrooms] = useState<Array<{
    id: string
    name: string
    subject: string
  }>>([])
  const [loadingClassrooms, setLoadingClassrooms] = useState(true)
  const [classroomError, setClassroomError] = useState('')

  useEffect(() => {
    if (!session?.user.id) return
    let cancelled = false

    supabase
      .from('classrooms')
      .select('id, name, subject')
      .eq('teacher_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setClassroomError('Classrooms could not be loaded.')
        else setClassrooms(data ?? [])
        setLoadingClassrooms(false)
      })

    return () => {
      cancelled = true
    }
  }, [session?.user.id])

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">
            Welcome back, {name}
          </h1>
          <p className="mt-2 text-text/70">Your classrooms and student rosters.</p>
        </header>

        <section className="rounded-lg border border-primary/20 bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text/70">Classrooms</p>
              <p className="mt-1 text-3xl font-bold text-text">
                {loadingClassrooms ? '…' : classrooms.length}
              </p>
            </div>
            <Link
              to="/classrooms"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Manage classrooms
            </Link>
          </div>
          {classroomError && <p role="alert" className="mt-3 text-sm text-red-600">{classroomError}</p>}
        </section>

        <section aria-labelledby="teacher-classrooms-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="teacher-classrooms-heading" className="font-heading text-xl font-semibold text-text">
              Your classrooms
            </h2>
            <Link to="/classrooms" className="text-sm font-medium text-primary underline underline-offset-4">
              Create or manage
            </Link>
          </div>
          {loadingClassrooms ? (
            <p className="text-sm text-text/70">Loading classrooms…</p>
          ) : classrooms.length === 0 ? (
            <p className="rounded-lg border border-text/15 bg-surface p-5 text-text/70">
              No classrooms yet. Create one to start building a roster.
            </p>
          ) : (
            <ul className="divide-y divide-text/15 rounded-lg border border-text/15 bg-surface">
              {classrooms.map(classroom => (
                <li key={classroom.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <span className="font-medium text-text">{classroom.name}</span>
                  <span className="text-sm text-text/70">{classroom.subject}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export function Dashboard() {
  const { session, profile, loading, logout } = useAuth()
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [studentActivity, setStudentActivity] = useState<{
    xpTotal: number
    currentStreak: number
  } | null>(null)
  const { loading: profileLoading } = useAccessibilityProfile(
    session?.user.id
  )
  const { activeDisabilityPreset } = useTheme()
  const { adhdEnabled, attentionPreferences } = useReadingTheme()
  const isVisualImpairment = activeDisabilityPreset === 'visual_impairment'

  useEffect(() => {
    if (!session || !profile || profile.role !== 'student') return

    // Fetch student profile
    supabase
      .from('student_profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setStudentProfile(data as StudentProfile)
      })

    // Fetch student activity (XP/streak)
    supabase
      .from('student_activity')
      .select('xp_total, current_streak, last_active_date')
      .eq('student_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStudentActivity({
            xpTotal: data.xp_total ?? 0,
            currentStreak: data.current_streak ?? 0,
          })
        }
      })
  }, [session, profile])

  // Loading states
  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text/60">
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  // Non-student role placeholders
  if (profile?.role === 'teacher') {
    return <TeacherDashboard name={profile.full_name || session.user.email || 'there'} />
  }

  if (profile?.role !== 'student') {
    return (
      <div className="flex min-h-screen flex-col bg-background text-text">
        <Navbar />
        <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">
            Welcome back, {profile?.full_name || session.user.email}
          </h1>
          <div className="mt-8">
            {profile?.role === 'parent' ? <ParentAttentionView /> : profile?.role === 'admin' ? <AdminAttentionMetrics /> : null}
          </div>
          <button
            onClick={logout}
            className="mt-10 inline-flex items-center justify-center rounded-xl border border-primary px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Log out
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Greeting header */}
        <GreetingHeader
          name={profile?.full_name?.split(' ')[0] ?? session.user.email ?? 'there'}
        />

        {profile.student_id && <StudentIdCard studentId={profile.student_id} />}

        {/* Accessibility role-based class: visual impairment bumps font */}
        {isVisualImpairment && (
          <div className="sr-only" aria-live="polite">
            Visual accessibility mode enabled
          </div>
        )}

        {/* Student dashboard */}
        {studentProfile && (
          <section className="mt-8 space-y-8">
            {adhdEnabled && session?.access_token && <FocusRecap token={session.access_token} />}
            {/* Streak/XP ring — the one bold gamified moment */}
            {(!adhdEnabled || attentionPreferences.gamification !== 'off') && (
              <div className="flex justify-center py-4">
                <StreakProgressRing
                  streak={studentActivity?.currentStreak ?? 0}
                  xpTotal={studentActivity?.xpTotal ?? 0}
                />
              </div>
            )}

            {/* Quick access cards — ADHD focus mode shows only one */}
            <QuickAccessCards />

            {/* Continue where you left off */}
            <ContinueSection />
          </section>
        )}

        <button
          onClick={logout}
          className="mt-10 inline-flex items-center justify-center rounded-xl border border-primary px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          Log out
        </button>
      </main>
    </div>
  )
}
