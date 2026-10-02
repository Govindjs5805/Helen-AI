import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase'
import type { AccessibilityNeed, AccessibilityNeedType } from '@/types'

export interface AccessibilityProfile {
  needs: AccessibilityNeed[]
  has: (type: AccessibilityNeedType) => boolean
  dyslexia: boolean
  adhd: boolean
  visualImpairment: boolean
  hearingImpairment: boolean
  motorImpairment: boolean
  autismSpectrum: boolean
  otherLearningDisability: boolean
  loading: boolean
}

/**
 * Reads the student's accessibility needs from Supabase and returns
 * a typed profile with boolean convenience flags.
 *
 * Theme and layout behavior are driven separately by the student's primary
 * accessibility need in ThemeContext.
 */
export function useAccessibilityProfile(studentId: string | undefined): AccessibilityProfile {
  const [needs, setNeeds] = useState<AccessibilityNeed[]>([])
  const [loading, setLoading] = useState(true)
  // Fetch needs whenever studentId changes
  useEffect(() => {
    if (!studentId) {
      setNeeds([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('accessibility_needs')
      .select('*')
      .eq('student_id', studentId)
      .then(({ data }) => {
        if (cancelled) return
        setNeeds(data as AccessibilityNeed[] ?? [])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [studentId])

  const has = (type: AccessibilityNeedType) => needs.some(n => n.need_type === type)

  return {
    needs,
    loading,
    has,
    dyslexia: has('dyslexia'),
    adhd: has('adhd'),
    visualImpairment: has('visual_impairment'),
    hearingImpairment: has('hearing_impairment'),
    motorImpairment: has('motor_impairment'),
    autismSpectrum: has('autism_spectrum'),
    otherLearningDisability: has('other_learning_disability'),
  }
}
