import { useEffect, useRef, useState } from 'react'
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
 * Side-effect: applies one or more CSS classes to `document.documentElement`
 * so global CSS can adapt typography, spacing, and motion without each
 * consumer having to do it themselves.
 *
 * Classes applied:
 *   - `dyslexia-mode`   — increased line-height, letter-spacing, Dyslexia-friendly font
 *   - `adhd-mode`       — disables entrance animations, enables focus mode
 *   - `vi-mode`         — base font size bumped +1 step, larger tap targets
 */
export function useAccessibilityProfile(studentId: string | undefined): AccessibilityProfile {
  const [needs, setNeeds] = useState<AccessibilityNeed[]>([])
  const [loading, setLoading] = useState(true)
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    rootRef.current = document.documentElement
  }, [])

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

  // Apply CSS classes to root whenever needs change
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const dyslexia = needs.some(n => n.need_type === 'dyslexia')
    const adhd = needs.some(n => n.need_type === 'adhd')
    const visualImpairment = needs.some(n => n.need_type === 'visual_impairment')

    root.classList.toggle('dyslexia-mode', dyslexia)
    root.classList.toggle('adhd-mode', adhd)
    root.classList.toggle('vi-mode', visualImpairment)

    // Remove all when needs cleared
    if (needs.length === 0) {
      root.classList.remove('dyslexia-mode', 'adhd-mode', 'vi-mode')
    }
  }, [needs])

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
