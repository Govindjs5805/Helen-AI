import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { AccessibilityNeedType } from '@/types'
import { supabase } from '@/services/supabase'
import {
  getPresetName,
  getThemeTokens,
  getThemeSlug,
  shouldHideThemeToggle,
  type ThemePresetName,
  type ThemeTokens,
} from '@/theme/presets'

interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  calmMode: boolean
  setCalmMode: (enabled: boolean) => void
  themeSaveError: string
  activeDisabilityPreset: ThemePresetName | null
  themeTokens: ThemeTokens
  themeSlug: string
  hideThemeToggle: boolean
  setActiveDisabilityPreset: (preset: ThemePresetName | null) => void
}

// Extended Theme interface that includes disability presets
export type Theme = 'light' | 'dark'
export type DisabilityPreset = ThemePresetName | null

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored === 'light' || stored === 'dark') return stored
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return 'light'
  })

  const [activeDisabilityPreset, setActiveDisabilityPresetState] =
    useState<DisabilityPreset>(() => {
      if (typeof window === 'undefined') return null
      return getPresetName(localStorage.getItem('accessibility-theme') as AccessibilityNeedType | null)
    })
  const [calmMode, setCalmModeState] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('adhd-calm-mode') === 'true'
  )
  const [themeSaveError, setThemeSaveError] = useState('')
  const [themeTokens, setThemeTokens] = useState<ThemeTokens>(() =>
    getThemeTokens(null, theme)
  )
  const [themeSlug, setThemeSlug] = useState<string>('default')
  const [hideThemeToggle, setHideThemeToggle] = useState(false)

  useEffect(() => {
    let currentRequest = 0
    let isMounted = true

    const fetchActivePreset = async (
      session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']
    ) => {
      const request = ++currentRequest
      if (!session?.user) {
        if (isMounted) setActiveDisabilityPreset(null)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!isMounted || request !== currentRequest) return
      if (profileError || !profile || !['student', 'teacher'].includes(profile.role)) {
        setActiveDisabilityPreset(null)
        return
      }

      const { data: needs, error: needsError } = await supabase
        .from('accessibility_needs')
        .select('need_type')
        .eq('student_id', session.user.id)
        .eq('priority', 'primary')
        .limit(1)

      if (!isMounted || request !== currentRequest) return
      if (needsError) {
        setActiveDisabilityPreset(null)
        return
      }

      const primaryNeed = (needs?.[0]?.need_type ?? null) as AccessibilityNeedType | null
      setActiveDisabilityPreset(getPresetName(primaryNeed))

      if (profile.role === 'student') {
        const { data: preferences, error: preferencesError } = await supabase
          .from('student_profiles')
          .select('theme_mode, calm_mode')
          .eq('id', session.user.id)
          .maybeSingle()

        if (!isMounted || request !== currentRequest) return
        if (preferencesError) {
          console.error('Failed to load accessibility theme preferences', preferencesError)
        } else if (preferences) {
          if (preferences.theme_mode === 'light' || preferences.theme_mode === 'dark') {
            setTheme(preferences.theme_mode)
          }
          if (typeof preferences.calm_mode === 'boolean') {
            setCalmModeState(preferences.calm_mode)
          }
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      void fetchActivePreset(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void fetchActivePreset(session)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('adhd-calm-mode', String(calmMode))
  }, [calmMode])

  const setActiveDisabilityPreset = useCallback((preset: DisabilityPreset) => {
    setActiveDisabilityPresetState(preset)
    localStorage.setItem('accessibility-theme', preset ?? 'default')
  }, [])

  useEffect(() => {
    const tokens = getThemeTokens(activeDisabilityPreset, theme)
    const slug = getThemeSlug(activeDisabilityPreset)
    setThemeTokens(tokens)
    setThemeSlug(slug)
    setHideThemeToggle(shouldHideThemeToggle(tokens))

    if (typeof window !== 'undefined') {
      const root = document.documentElement
      root.setAttribute('data-profile', slug)
      root.setAttribute('data-theme', activeDisabilityPreset === 'adhd' ? 'adhd' : theme)
      root.setAttribute('data-mode', theme)
      root.setAttribute('data-calm-mode', String(calmMode))

      Object.entries(tokens.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value)
      })

      root.style.setProperty(
        '--font-family',
        activeDisabilityPreset === 'adhd' ? "'Lexend', system-ui, sans-serif" : tokens.font.family
      )
      root.style.setProperty(
        '--font-heading',
        activeDisabilityPreset === 'adhd' ? "'Fredoka', system-ui, sans-serif" : tokens.font.family
      )
      root.style.setProperty('--font-size-multiplier', tokens.font.sizeMultiplier.toString())
      root.style.setProperty('--font-letter-spacing', tokens.font.letterSpacing)
      root.style.setProperty('--font-line-height', tokens.font.lineHeight)

      Object.entries(tokens.layout).forEach(([key, value]) => {
        const cssKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
        root.style.setProperty(`--layout-${cssKey}`, value.toString())
        root.setAttribute(`data-${cssKey}`, value.toString())
      })

      root.classList.remove('light', 'dark')
      root.classList.add(theme)
    }
  }, [theme, activeDisabilityPreset, calmMode])

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    setThemeSaveError('')
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const { error } = await supabase
        .from('student_profiles')
        .update({ theme_mode: next })
        .eq('id', session.user.id)
      if (error) {
        console.error('Failed to save accessibility theme preference', error)
        setThemeSaveError('Your theme changed, but could not be saved to your profile.')
      }
    }).catch((error: unknown) => {
      console.error('Failed to save accessibility theme preference', error)
      setThemeSaveError('Your theme changed, but could not be saved to your profile.')
    })
  }, [theme])

  const setCalmMode = useCallback((enabled: boolean) => {
    setCalmModeState(enabled)
    setThemeSaveError('')
    localStorage.setItem('adhd-calm-mode', String(enabled))
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const { error } = await supabase
        .from('student_profiles')
        .update({ calm_mode: enabled })
        .eq('id', session.user.id)
      if (error) {
        console.error('Failed to save calm mode preference', error)
        setThemeSaveError('Calm mode changed, but could not be saved to your profile.')
      }
    }).catch((error: unknown) => {
      console.error('Failed to save calm mode preference', error)
      setThemeSaveError('Calm mode changed, but could not be saved to your profile.')
    })
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        calmMode,
        setCalmMode,
        themeSaveError,
        activeDisabilityPreset,
        themeTokens,
        themeSlug,
        hideThemeToggle,
        setActiveDisabilityPreset,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}