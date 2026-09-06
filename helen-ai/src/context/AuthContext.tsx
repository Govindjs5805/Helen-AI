import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '@/services/supabase'
import type { Profile, UserRole } from '@/types'

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
    role: UserRole
  ) => Promise<{ error: string | null }>
  logout: () => Promise<void>
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
    created_at: user.created_at ?? new Date().toISOString(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch the profiles row for the current user. Uses `maybeSingle()` so
  // a missing row doesn't error out — we fall back to deriving the profile
  // from the session's user_metadata so the UI never deadlocks.
  const fetchProfile = useCallback(async (currentSession: import('@supabase/supabase-js').Session | null) => {
    if (!currentSession?.user) {
      setProfile(null)
      return
    }

    // Seed with session-derived data immediately so the UI can render.
    setProfile(prev => prev ?? profileFromSession(currentSession))

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentSession.user.id)
      .maybeSingle()

    if (!error && data) {
      setProfile(data as Profile)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    await fetchProfile(session)
  }, [fetchProfile, session])

  // Initialize: listen for auth state changes.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
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
    async (email: string, password: string, fullName: string, role: UserRole) => {
      const { error: signUpError, data } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
            },
          },
        })

      if (signUpError) {
        return { error: signUpError.message }
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

      return { error: null }
    },
    [fetchProfile]
  )

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
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
