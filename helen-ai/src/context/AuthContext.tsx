import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { supabase } from '@/services/supabase'
import type { Profile, UserRole } from '@/types'

export interface TeacherRegistrationDetails {
  instituteName: string
  place: string
  designation?: string
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextType {
  session: import('@supabase/supabase-js').Session | null
  profile: Profile | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  register: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    teacherDetails?: TeacherRegistrationDetails
  ) => Promise<{ error: string | null; needsVerification?: boolean }>
  logout: () => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Build a minimal Profile object from a Supabase session when the
 * `profiles` table row hasn't been fetched yet (or doesn't exist).
 *
 * This prevents the UI from getting stuck in a "no profile, no role"
 * state during the brief window between sign-in and the database
 * trigger's INSERT running.
 */
function profileFromSession(
  session: import('@supabase/supabase-js').Session,
): Profile {
  const user = session.user
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const role = (meta.role as UserRole) ?? 'student'
  return {
    id: user.id,
    email: user.email ?? '',
    full_name: (meta.full_name as string) ?? '',
    role,
    student_id: null,
    created_at: user.created_at ?? new Date().toISOString(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const profileRequestId = useRef(0)

  // Fetch the profiles row for the current user. Uses `maybeSingle()` so
  // a missing row doesn't error out — we fall back to deriving the profile
  // from the session's user_metadata so the UI never deadlocks.
  const fetchProfile = useCallback(async (currentSession: import('@supabase/supabase-js').Session | null) => {
    if (!currentSession?.user) {
      profileRequestId.current += 1
      setProfile(null)
      return
    }

    const requestId = ++profileRequestId.current
    setProfile(profileFromSession(currentSession))

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentSession.user.id)
      .maybeSingle()

    if (requestId === profileRequestId.current && !error && data) {
      setProfile(data as Profile)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    await fetchProfile(session)
  }, [fetchProfile, session])

  // Initialize: listen for auth state changes.
  useEffect(() => {
    let mounted = true
    let authStateVersion = 0
    let profileFetchTimer: number | undefined

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, authSession) => {
      authStateVersion += 1
      setSession(authSession)
      setLoading(false)

      if (!authSession) {
        profileRequestId.current += 1
        setProfile(null)
        return
      }

      if (event === 'TOKEN_REFRESHED') return

      const requestId = ++profileRequestId.current
      setProfile(profileFromSession(authSession))
      window.clearTimeout(profileFetchTimer)
      profileFetchTimer = window.setTimeout(() => {
        if (mounted && requestId === profileRequestId.current) {
          void fetchProfile(authSession)
        }
      }, 0)
    })

    const initialAuthStateVersion = authStateVersion
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted || authStateVersion !== initialAuthStateVersion) return
      setSession(session)
      if (session) {
        void fetchProfile(session)
      } else {
        setProfile(null)
      }
      setLoading(false)
    }).catch(error => {
      if (!mounted || authStateVersion !== initialAuthStateVersion) return
      console.error('[Helen AI] Could not restore the saved sign-in session.', error)
      setSession(null)
      setProfile(null)
      setLoading(false)
    })

    return () => {
      mounted = false
      window.clearTimeout(profileFetchTimer)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        return { error: error.message }
      }
      // Fetch profile now rather than waiting for the onAuthStateChange tick
      // — this is the path that takes the user from /auth to their destination.
      if (data.session) {
        await fetchProfile(data.session)
      }
      return { error: null }
    },
    [fetchProfile]
  )

    const register = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      role: UserRole,
      teacherDetails?: TeacherRegistrationDetails,
    ) => {
      const { error: signUpError, data } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verified`,
            data: {
              full_name: fullName,
              role,
              ...(role === 'teacher' && teacherDetails
                ? {
                    institute_name: teacherDetails.instituteName,
                    place: teacherDetails.place,
                    designation: teacherDetails.designation ?? '',
                  }
                : {}),
            },
          },
        })

      if (signUpError) {
        return { error: signUpError.message }
      }

      // Supabase returns a fake user (no identities) for an already-registered email
      if (data.user && data.user.identities?.length === 0) {
        return { error: 'That email is already registered. Try signing in.' }
      }

      // If the user was created, the database trigger will insert the profile.
      // Fetch it (or fall back to user_metadata) so we have a role to route by.
      if (data.session) {
        await fetchProfile(data.session)
      } else if (data.user) {
        // No session yet (e.g. email confirmation required) — synthesize a
        // minimal profile so the UI can show the "check your inbox" state.
        setProfile(profileFromSession({
          user: data.user,
          // A fake session-like object that holds the user; refreshProfile()
          // and other consumers only read `user` from it.
        } as unknown as import('@supabase/supabase-js').Session))
      }

      return { error: null, needsVerification: !data.session }
    },
    [fetchProfile]
  )

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) return { error: error.message }
    setProfile(null)
    return { error: null }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
