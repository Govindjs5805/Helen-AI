export type Theme = 'light' | 'dark'

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
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

export type NeedPriority = 'primary' | 'secondary'

export interface StudentProfile {
  id: string
  age?: number
  grade?: string
  subjects: string[]
  learning_goals?: string
  preferred_pace: PreferredPace
  onboarding_completed: boolean
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
}

export interface OnboardingSubmitData {
  student_profile: {
    age?: number
    grade?: string
    subjects: string[]
    learning_goals?: string
    preferred_pace: PreferredPace
    onboarding_completed: boolean
  }
  accessibility_needs: Array<{
    need_type: AccessibilityNeedType
    priority: NeedPriority
  }>
}
