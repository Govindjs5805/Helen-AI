import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useAccessibilityProfile } from '@/hooks/useAccessibilityProfile'
import { supabase } from '@/services/supabase'
import type { StudentProfile } from '@/types'

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

/** Circular progress ring for streak/XP */
function StreakProgressRing({
  streak,
  xpTotal,
  isADHD,
}: {
  streak: number
  xpTotal: number
  isADHD: boolean
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
            style={isADHD ? { animation: 'none' } : undefined}
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

/** Quick access cards to main modules — ADHD focus mode shows one at a time */
function QuickAccessCards({ isADHDFocusMode }: { isADHDFocusMode: boolean }) {
  const modules = [
    { href: '/ai-assistant', label: 'AI Assistant', icon: '🤖' },
    { href: '/documents', label: 'Document Simplifier', icon: '📄' },
    { href: '/notes', label: 'Notes', icon: '📝' },
    { href: '/ai-assistant', label: 'Quiz', icon: '🎯' },
    { href: '/ai-assistant', label: 'Homework Helper', icon: '💡' },
  ]

  // Filter to one module when in ADHD focus mode
  const visibleModules = isADHDFocusMode ? modules.slice(0, 1) : modules

  return (
    <section className="mt-8">
      <h2 className="font-heading text-xl font-semibold text-text mb-4">
        Quick Access
      </h2>
      <div className={isADHDFocusMode ? 'grid w-full max-w-sm' : 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5'}>
        {visibleModules.map(module => (
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

export function Dashboard() {
  const { session, profile, loading, logout } = useAuth()
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [studentActivity, setStudentActivity] = useState<{
    xpTotal: number
    currentStreak: number
  } | null>(null)
  const { has, loading: profileLoading } = useAccessibilityProfile(
    session?.user.id
  )
  const isADHD = has('adhd')
  const isVisualImpairment = has('visual_impairment')

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
  const rolePlaceholder: Record<string, string> = {
    teacher: 'Teacher dashboard coming soon',
    parent: 'Parent dashboard coming soon',
    admin: 'Admin dashboard coming soon',
  }

  if (profile?.role !== 'student') {
    return (
      <div className="flex min-h-screen flex-col bg-background text-text">
        <Navbar />
        <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">
            Welcome back, {profile?.full_name || session.user.email}
          </h1>
          <div className="mt-8 rounded-2xl border border-black/10 bg-surface p-8 text-center dark:border-white/10">
            <p className="text-text/60">
              {rolePlaceholder[profile?.role || ''] || 'Dashboard coming soon'}
            </p>
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

        {/* Accessibility role-based class: visual impairment bumps font */}
        {isVisualImpairment && (
          <div className="sr-only" aria-live="polite">
            Visual accessibility mode enabled
          </div>
        )}

        {/* Student dashboard */}
        {studentProfile && (
          <section className="mt-8 space-y-8">
            {/* Streak/XP ring — the one bold gamified moment */}
            <div className="flex justify-center py-4">
              <StreakProgressRing
                streak={studentActivity?.currentStreak ?? 0}
                xpTotal={studentActivity?.xpTotal ?? 0}
                isADHD={isADHD}
              />
            </div>

            {/* Quick access cards — ADHD focus mode shows only one */}
            <QuickAccessCards isADHDFocusMode={isADHD} />

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
