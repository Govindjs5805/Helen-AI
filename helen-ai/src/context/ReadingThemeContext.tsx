import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabase'
import type {
  ReadingAid,
  ReadingDensity,
  ReadingFont,
  ReadingLevel,
  ReadingPreferences,
  ReadingTint,
  AttentionPreferences,
} from '@/types'

export const DEFAULT_READING_PREFERENCES: ReadingPreferences = {
  severity: 'moderate',
  font: 'atkinson',
  text_scale: 120,
  letter_spacing: 0.04,
  word_spacing: 0.12,
  line_height: 1.75,
  paragraph_spacing: 1.1,
  max_line_chars: 62,
  background_tint: 'cream',
  text_color: '#3b3b3b',
  reading_aid: 'none',
  tts: {
    enabled: true,
    word_highlight: true,
    rate: 0.9,
    voice: '',
    pause_seconds: 0.35,
  },
  reading_level: 'auto',
  density: 'chunked',
}

export const DEFAULT_ATTENTION_PREFERENCES: AttentionPreferences = {
  presentation: 'not_sure',
  focus_session_minutes: 15,
  break_minutes: 5,
  distraction_level: 'medium',
  chunk_size: 'one_paragraph',
  reminders: { enabled: false, style: 'gentle' },
  gamification: 'off',
  motion: 'reduced',
  sound_cues: false,
  daily_goal: 3,
  quiet_ui: true,
  tldr_first: true,
  accountability_prompts: false,
  weekly_goal: 15,
}

export function normalizeAttentionPreferences(value: unknown): AttentionPreferences {
  const input = value && typeof value === 'object' ? value as Partial<AttentionPreferences> : {}
  const reminders: Partial<AttentionPreferences['reminders']> =
    input.reminders && typeof input.reminders === 'object' ? input.reminders : {}
  const bounded = (value: unknown, fallback: number, min: number, max: number) =>
    typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback

  return {
    ...DEFAULT_ATTENTION_PREFERENCES,
    ...input,
    presentation: ['inattentive', 'hyperactive_impulsive', 'combined'].includes(input.presentation ?? '')
      ? input.presentation as AttentionPreferences['presentation']
      : 'not_sure',
    focus_session_minutes: bounded(input.focus_session_minutes, 15, 5, 45),
    break_minutes: bounded(input.break_minutes, 5, 1, 30),
    distraction_level: ['low', 'high'].includes(input.distraction_level ?? '')
      ? input.distraction_level as AttentionPreferences['distraction_level']
      : 'medium',
    chunk_size: input.chunk_size === 'short_section' ? 'short_section' : 'one_paragraph',
    reminders: {
      enabled: typeof reminders.enabled === 'boolean' ? reminders.enabled : false,
      style: reminders.style === 'quiet' ? 'quiet' : 'gentle',
    },
    gamification: ['light', 'full'].includes(input.gamification ?? '')
      ? input.gamification as AttentionPreferences['gamification']
      : 'off',
    motion: input.motion === 'normal' ? 'normal' : 'reduced',
    sound_cues: typeof input.sound_cues === 'boolean' ? input.sound_cues : false,
    daily_goal: bounded(input.daily_goal, 3, 1, 20),
    weekly_goal: bounded(input.weekly_goal, 15, 1, 100),
    quiet_ui: typeof input.quiet_ui === 'boolean' ? input.quiet_ui : true,
    tldr_first: typeof input.tldr_first === 'boolean' ? input.tldr_first : true,
    accountability_prompts: typeof input.accountability_prompts === 'boolean' ? input.accountability_prompts : false,
  }
}

const FONTS: Record<ReadingFont, string> = {
  lexend: "'Lexend', Verdana, sans-serif",
  atkinson: "'Atkinson Hyperlegible', Verdana, sans-serif",
  opendyslexic: "'OpenDyslexic', Verdana, sans-serif",
  verdana: 'Verdana, sans-serif',
  system: 'system-ui, sans-serif',
}

const TINTS: Record<ReadingTint, { light: string; dark: string; lightText: string; darkText: string }> = {
  cream: { light: '#fff8e8', dark: '#25251f', lightText: '#3b3b3b', darkText: '#f5f5f5' },
  'pale-yellow': { light: '#fffde7', dark: '#28271f', lightText: '#3b3b3b', darkText: '#f5f5f5' },
  'pale-blue': { light: '#edf6ff', dark: '#1f252d', lightText: '#28323d', darkText: '#f5f5f5' },
  'light-gray': { light: '#f2f3f4', dark: '#242629', lightText: '#343638', darkText: '#f5f5f5' },
  white: { light: '#ffffff', dark: '#191b1d', lightText: '#333333', darkText: '#f5f5f5' },
  dark: { light: '#151716', dark: '#151716', lightText: '#f5f5f5', darkText: '#f5f5f5' },
}

const FONT_KEYS = new Set<ReadingFont>(['lexend', 'atkinson', 'opendyslexic', 'verdana', 'system'])
const TINT_KEYS = new Set<ReadingTint>(['cream', 'pale-yellow', 'pale-blue', 'light-gray', 'white', 'dark'])
const AID_KEYS = new Set<ReadingAid>(['none', 'ruler', 'focus-mask', 'syllable-split'])
const LEVEL_KEYS = new Set<ReadingLevel>(['auto', 'grade_4_5', 'grade_6_8', 'original'])
const DENSITY_KEYS = new Set<ReadingDensity>(['full', 'chunked', 'bullets'])

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback
}

export function normalizeReadingPreferences(value: unknown): ReadingPreferences {
  const input = value && typeof value === 'object' ? value as Partial<ReadingPreferences> : {}
  const tts: Partial<ReadingPreferences['tts']> =
    input.tts && typeof input.tts === 'object' ? input.tts : {}

  return {
    ...DEFAULT_READING_PREFERENCES,
    ...input,
    severity: input.severity === 'mild' || input.severity === 'severe' ? input.severity : 'moderate',
    font: FONT_KEYS.has(input.font as ReadingFont) ? input.font as ReadingFont : DEFAULT_READING_PREFERENCES.font,
    text_scale: boundedNumber(input.text_scale, DEFAULT_READING_PREFERENCES.text_scale, 110, 200),
    letter_spacing: boundedNumber(input.letter_spacing, DEFAULT_READING_PREFERENCES.letter_spacing, 0, 0.2),
    word_spacing: boundedNumber(input.word_spacing, DEFAULT_READING_PREFERENCES.word_spacing, 0, 0.5),
    line_height: boundedNumber(input.line_height, DEFAULT_READING_PREFERENCES.line_height, 1.4, 2.2),
    paragraph_spacing: boundedNumber(input.paragraph_spacing, DEFAULT_READING_PREFERENCES.paragraph_spacing, 0.5, 2),
    max_line_chars: Math.round(boundedNumber(input.max_line_chars, DEFAULT_READING_PREFERENCES.max_line_chars, 50, 70)),
    background_tint: TINT_KEYS.has(input.background_tint as ReadingTint) ? input.background_tint as ReadingTint : DEFAULT_READING_PREFERENCES.background_tint,
    text_color: typeof input.text_color === 'string' && /^#[\da-f]{6}$/i.test(input.text_color)
      ? input.text_color
      : DEFAULT_READING_PREFERENCES.text_color,
    reading_aid: AID_KEYS.has(input.reading_aid as ReadingAid) ? input.reading_aid as ReadingAid : DEFAULT_READING_PREFERENCES.reading_aid,
    tts: {
      enabled: typeof tts.enabled === 'boolean' ? tts.enabled : DEFAULT_READING_PREFERENCES.tts.enabled,
      word_highlight: typeof tts.word_highlight === 'boolean' ? tts.word_highlight : DEFAULT_READING_PREFERENCES.tts.word_highlight,
      rate: boundedNumber(tts.rate, DEFAULT_READING_PREFERENCES.tts.rate, 0.5, 1.5),
      voice: typeof tts.voice === 'string' ? tts.voice : '',
      pause_seconds: boundedNumber(tts.pause_seconds, DEFAULT_READING_PREFERENCES.tts.pause_seconds, 0, 3),
    },
    reading_level: LEVEL_KEYS.has(input.reading_level as ReadingLevel) ? input.reading_level as ReadingLevel : DEFAULT_READING_PREFERENCES.reading_level,
    density: DENSITY_KEYS.has(input.density as ReadingDensity) ? input.density as ReadingDensity : DEFAULT_READING_PREFERENCES.density,
  }
}

interface ReadingThemeContextValue {
  preferences: ReadingPreferences
  loading: boolean
  error: string
  dyslexiaEnabled: boolean
  adhdEnabled: boolean
  attentionPreferences: AttentionPreferences
  setPreferences: (preferences: ReadingPreferences) => void
  setAttentionPreferences: (preferences: AttentionPreferences) => void
  setDyslexiaEnabled: (enabled: boolean) => void
  setAdhdEnabled: (enabled: boolean) => void
  savePreferences: (preferences: ReadingPreferences) => Promise<void>
  saveAttentionPreferences: (preferences: AttentionPreferences) => Promise<void>
}

const ReadingThemeContext = createContext<ReadingThemeContextValue | undefined>(undefined)

export function ReadingThemeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [preferences, setPreferencesState] = useState(DEFAULT_READING_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dyslexiaEnabled, setDyslexiaEnabled] = useState(false)
  const [adhdEnabled, setAdhdEnabled] = useState(false)
  const [attentionPreferences, setAttentionPreferencesState] = useState(DEFAULT_ATTENTION_PREFERENCES)

  useEffect(() => {
    let cancelled = false
    const userId = session?.user.id
    setError('')

    if (!userId) {
      setPreferencesState(DEFAULT_READING_PREFERENCES)
      setDyslexiaEnabled(false)
      setAdhdEnabled(false)
      setAttentionPreferencesState(DEFAULT_ATTENTION_PREFERENCES)
      setLoading(false)
      return
    }

    setLoading(true)
    void Promise.all([
      supabase
      .from('student_profiles')
      .select('reading_preferences,attention_preferences')
      .eq('id', userId)
      .maybeSingle(),
      supabase
        .from('accessibility_needs')
        .select('need_type')
        .eq('student_id', userId)
        .in('need_type', ['dyslexia', 'adhd']),
    ]).then(([profileResult, needResult]) => {
      if (cancelled) return
      if (profileResult.error || needResult.error) {
        setError('Your reading profile could not be loaded. You can still adjust it here.')
      } else if (profileResult.data?.reading_preferences) {
        setPreferencesState(normalizeReadingPreferences(profileResult.data.reading_preferences))
      }
      if (!profileResult.error && profileResult.data?.attention_preferences) {
        setAttentionPreferencesState(normalizeAttentionPreferences(profileResult.data.attention_preferences))
      }
      const needTypes = (needResult.data ?? []).map(need => need.need_type)
      setDyslexiaEnabled(needTypes.includes('dyslexia'))
      setAdhdEnabled(needTypes.includes('adhd'))
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [session?.user.id])

  useEffect(() => {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    const colors = TINTS[preferences.background_tint]

    root.dataset.readingProfile = dyslexiaEnabled ? 'true' : 'false'
    root.style.setProperty('--reading-font', FONTS[preferences.font])
    root.style.setProperty('--reading-scale', `${preferences.text_scale / 100}`)
    root.style.setProperty('--reading-letter-spacing', `${preferences.letter_spacing}em`)
    root.style.setProperty('--reading-word-spacing', `${preferences.word_spacing}em`)
    root.style.setProperty('--reading-line-height', `${preferences.line_height}`)
    root.style.setProperty('--reading-paragraph-spacing', `${preferences.paragraph_spacing}em`)
    root.style.setProperty('--reading-max-line-width', `${preferences.max_line_chars}ch`)
    const darkBackground = isDark || preferences.background_tint === 'dark'
    root.style.setProperty('--reading-background', darkBackground ? colors.dark : colors.light)
    root.style.setProperty('--reading-text', preferences.text_color === DEFAULT_READING_PREFERENCES.text_color
      ? darkBackground ? colors.darkText : colors.lightText
      : preferences.text_color)
    root.dataset.readingAid = preferences.reading_aid
    root.dataset.attentionSupport = adhdEnabled ? 'true' : 'false'
    root.dataset.quietUi = adhdEnabled && attentionPreferences.quiet_ui ? 'true' : 'false'
    root.dataset.attentionMotion = adhdEnabled && attentionPreferences.motion === 'reduced' ? 'reduced' : 'normal'
  }, [preferences, dyslexiaEnabled, adhdEnabled, attentionPreferences])

  const setPreferences = useCallback((value: ReadingPreferences) => {
    setPreferencesState(normalizeReadingPreferences(value))
  }, [])

  const updateDyslexiaEnabled = useCallback((enabled: boolean) => {
    setDyslexiaEnabled(enabled)
  }, [])

  const updateAdhdEnabled = useCallback((enabled: boolean) => {
    setAdhdEnabled(enabled)
  }, [])

  const setAttentionPreferences = useCallback((value: AttentionPreferences) => {
    setAttentionPreferencesState(normalizeAttentionPreferences(value))
  }, [])

  const savePreferences = useCallback(async (value: ReadingPreferences) => {
    if (!session?.user.id) throw new Error('Sign in to save your reading profile.')
    const normalized = normalizeReadingPreferences(value)
    setPreferencesState(normalized)
    setError('')
    const { error: saveError } = await supabase
      .from('student_profiles')
      .upsert({ id: session.user.id, reading_preferences: normalized }, { onConflict: 'id' })
    if (saveError) {
      setError('Your reading profile could not be saved. Check your connection and try again.')
      throw saveError
    }
  }, [session?.user.id])

  const saveAttentionPreferences = useCallback(async (value: AttentionPreferences) => {
    if (!session?.user.id) throw new Error('Sign in to save your attention profile.')
    const normalized = normalizeAttentionPreferences(value)
    setAttentionPreferencesState(normalized)
    setError('')
    const { error: saveError } = await supabase
      .from('student_profiles')
      .upsert({ id: session.user.id, attention_preferences: normalized }, { onConflict: 'id' })
    if (saveError) {
      setError('Your attention profile could not be saved. Check your connection and try again.')
      throw saveError
    }
  }, [session?.user.id])

  const contextValue = useMemo(() => ({
    preferences,
    loading,
    error,
    setPreferences,
    dyslexiaEnabled,
    adhdEnabled,
    attentionPreferences,
    setAttentionPreferences,
    setDyslexiaEnabled: updateDyslexiaEnabled,
    setAdhdEnabled: updateAdhdEnabled,
    savePreferences,
    saveAttentionPreferences,
  }), [preferences, loading, error, setPreferences, dyslexiaEnabled, adhdEnabled, attentionPreferences, setAttentionPreferences, updateDyslexiaEnabled, updateAdhdEnabled, savePreferences, saveAttentionPreferences])

  return (
    <ReadingThemeContext.Provider value={contextValue}>
      {children}
    </ReadingThemeContext.Provider>
  )
}

export function useReadingTheme() {
  const context = useContext(ReadingThemeContext)
  if (!context) throw new Error('useReadingTheme must be used within ReadingThemeProvider')
  return context
}
