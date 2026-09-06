import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabase'
import type {
  StudentProfile,
  AccessibilityNeed,
  AccessibilityNeedType,
} from '@/types'

const NEED_LABELS: Record<AccessibilityNeedType, string> = {
  visual_impairment: 'Vision',
  hearing_impairment: 'Hearing',
  dyslexia: 'Dyslexia',
  adhd: 'ADHD',
  motor_impairment: 'Motor',
  autism_spectrum: 'Autism',
  other_learning_disability: 'Other',
}

export function Dashboard() {
  const { session, profile, loading, logout } = useAuth()
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [needs, setNeeds] = useState<AccessibilityNeed[]>([])

  useEffect(() => {
    if (!session || !profile) return

    if (profile.role === 'student') {
      supabase
        .from('student_profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setStudentProfile(data as StudentProfile)
        })

      supabase
        .from('accessibility_needs')
        .select('*')
        .eq('student_id', session.user.id)
        .then(({ data }) => {
          if (data) setNeeds(data as AccessibilityNeed[])
        })
    }
  }, [session, profile])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text/60">
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">
          Welcome back, {profile?.full_name || session.user.email}
        </h1>
        <p className="mt-2 text-text/70">
          You&apos;re signed in as a{' '}
          <span className="font-semibold text-primary">{profile?.role}</span>.
        </p>

        {profile?.role === 'student' && studentProfile && (
          <section className="mt-8 space-y-6">
            <div className="rounded-2xl border border-black/10 bg-surface p-6 dark:border-white/10">
              <h2 className="font-heading text-lg font-semibold text-text">Your learning profile</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-text/50">Age</dt>
                  <dd className="text-text">{studentProfile.age ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-text/50">Year / Grade</dt>
                  <dd className="text-text">{studentProfile.grade ?? '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-text/50">Subjects</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {studentProfile.subjects.length === 0 ? (
                      <span className="text-text/50">—</span>
                    ) : (
                      studentProfile.subjects.map(s => (
                        <span
                          key={s}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-text/50">Preferred pace</dt>
                  <dd className="text-text capitalize">
                    {studentProfile.preferred_pace}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-text/50">Goals</dt>
                  <dd className="text-text">
                    {studentProfile.learning_goals || '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-black/10 bg-surface p-6 dark:border-white/10">
              <h2 className="font-heading text-lg font-semibold text-text">
                Accessibility needs
              </h2>
              {needs.length === 0 ? (
                <p className="mt-3 text-sm text-text/60">
                  No accessibility needs recorded.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {needs.map(n => (
                    <li key={n.id} className="flex items-center gap-3 text-sm">
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          n.priority === 'primary'
                            ? 'bg-primary text-white'
                            : 'bg-text/10 text-text/60',
                        ].join(' ')}
                      >
                        {n.priority}
                      </span>
                      <span className="text-text">{NEED_LABELS[n.need_type]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
