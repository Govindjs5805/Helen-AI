import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabase'

/**
 * Wraps protected pages (anything other than /auth and /onboarding).
 *
 * Behaviour:
 *  - No session         → /auth
 *  - Student, no row or onboarding_completed = false
 *                       → /onboarding
 *  - Anyone else        → render the wrapped children
 *
 * The student's onboarding status is fetched once on mount (and whenever
 * the session changes). Teachers, parents, and admins skip this check
 * entirely because their role is set in the profile and they never need
 * to onboard.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!session || !profile) {
      setOnboardingComplete(null)
      return
    }
    if (profile.role !== 'student') {
      // Non-students never need to onboard.
      setOnboardingComplete(true)
      return
    }

    let cancelled = false
    setChecking(true)

    supabase
      .from('student_profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          // If the row doesn't exist yet, treat as "not yet onboarded".
          setOnboardingComplete(false)
        } else if (data && typeof data.onboarding_completed === 'boolean') {
          setOnboardingComplete(data.onboarding_completed)
        } else {
          setOnboardingComplete(false)
        }
        setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [session, profile])

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text/50 text-sm">
        Loading…
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />

  if (
    profile?.role === 'student' &&
    onboardingComplete === false
  ) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
