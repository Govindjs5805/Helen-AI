export type Theme = 'light' | 'dark'

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  student_id?: string | null
  created_at: string
}

export interface User {
  id: string
  email?: string
  created_at?: string
}

export interface AppProps {
  className?: string
  children: React.ReactNode
}

export type AuthMode = 'login' | 'register'

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export type PreferredPace = 'slow' | 'moderate' | 'fast'

export type AccessibilityNeedType =
  | 'visual_impairment'
  | 'hearing_impairment'
  | 'dyslexia'
  | 'adhd'
  | 'motor_impairment'
  | 'autism_spectrum'
  | 'other_learning_disability'
  | 'learning_disability'

export type NeedPriority = 'primary' | 'secondary'

export type ReadingFont = 'lexend' | 'atkinson' | 'opendyslexic' | 'verdana' | 'system'
export type ReadingTint = 'cream' | 'pale-yellow' | 'pale-blue' | 'light-gray' | 'white' | 'dark'
export type ReadingAid = 'none' | 'ruler' | 'focus-mask' | 'syllable-split'
export type ReadingLevel = 'auto' | 'grade_4_5' | 'grade_6_8' | 'original'
export type ReadingDensity = 'full' | 'chunked' | 'bullets'

export interface ReadingPreferences {
  severity: 'mild' | 'moderate' | 'severe'
  font: ReadingFont
  text_scale: number
  letter_spacing: number
  word_spacing: number
  line_height: number
  paragraph_spacing: number
  max_line_chars: number
  background_tint: ReadingTint
  text_color: string
  reading_aid: ReadingAid
  tts: {
    enabled: boolean
    word_highlight: boolean
    rate: number
    voice: string
    pause_seconds: number
  }
  reading_level: ReadingLevel
  density: ReadingDensity
}

export interface AttentionPreferences {
  presentation: 'inattentive' | 'hyperactive_impulsive' | 'combined' | 'not_sure'
  focus_session_minutes: number
  break_minutes: number
  distraction_level: 'low' | 'medium' | 'high'
  chunk_size: 'one_paragraph' | 'short_section'
  reminders: { enabled: boolean; style: 'gentle' | 'quiet' }
  gamification: 'off' | 'light' | 'full'
  motion: 'reduced' | 'normal'
  sound_cues: boolean
  daily_goal: number
  quiet_ui: boolean
  tldr_first: boolean
  accountability_prompts: boolean
  weekly_goal: number
}

export interface StudentProfile {
  id: string
  age?: number
  grade?: string
  subjects: string[]
  learning_goals?: string
  preferred_pace: PreferredPace
  onboarding_completed: boolean
  reading_preferences?: ReadingPreferences
  attention_preferences?: AttentionPreferences
  attention_sharing_consent?: boolean
  created_at: string
}

export interface AccessibilityNeed {
  id: string
  student_id: string
  need_type: AccessibilityNeedType
  priority: NeedPriority
  created_at: string
}

export interface OnboardingData {
  // Step 1
  age?: number
  grade?: string
  subjects: string[]
  learning_goals?: string
  preferred_pace: PreferredPace
  // Step 2
  accessibility_needs: AccessibilityNeedType[]
  primary_need?: AccessibilityNeedType
  other_need_description?: string
  reading_preferences: ReadingPreferences
  attention_preferences: AttentionPreferences
}

export interface OnboardingSubmitData {
  student_profile: {
    age?: number
    grade?: string
    subjects: string[]
    learning_goals?: string
    preferred_pace: PreferredPace
    onboarding_completed: boolean
    reading_preferences: ReadingPreferences
    attention_preferences: AttentionPreferences
  }
  accessibility_needs: Array<{
    need_type: AccessibilityNeedType
    priority: NeedPriority
  }>
}
