import { useState, useEffect, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { OnboardingLayout } from '@/components/OnboardingLayout'
import { AccessibilityCard } from '@/components/AccessibilityCard'
import { SubjectTags } from '@/components/SubjectTags'
import { PaceSelector } from '@/components/PaceSelector'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/context/AuthContext'
import type {
  OnboardingSubmitData,
  AccessibilityNeedType,
  PreferredPace,
} from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 3

const STEP_LABELS = ['About you', 'How you learn', 'Review']

const NEED_OPTIONS: { value: AccessibilityNeedType; label: string; description: string }[] = [
  { value: 'dyslexia', label: 'Dyslexia', description: 'Reading takes more time or feels different' },
  { value: 'adhd', label: 'ADHD', description: 'Staying focused can be a challenge' },
  { value: 'autism_spectrum', label: 'Autism', description: 'Different ways of processing information' },
  { value: 'visual_impairment', label: 'Vision', description: 'Difficulty seeing or reading text' },
  { value: 'hearing_impairment', label: 'Hearing', description: 'Difficulty hearing audio' },
  { value: 'motor_impairment', label: 'Motor', description: 'Fine motor control is limited' },
  { value: 'other_learning_disability', label: 'Something else', description: "Doesn't fit neatly into one category" },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Clean label for display in the review summary */
function paceLabel(p: PreferredPace): string {
  if (p === 'slow') return 'Take it slow'
  if (p === 'moderate') return 'Steady pace'
  return 'Move quickly'
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function Onboarding() {
  const { session, profile } = useAuth()
  const [step, setStep] = useState(1)

  // ── Step 1 data ──────────────────────────────────────────────────────────
  const [age, setAge] = useState<string>('')
  const [grade, setGrade] = useState<string>('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [subjectInput, setSubjectInput] = useState('')
  const [learningGoals, setLearningGoals] = useState('')
  const [preferredPace, setPreferredPace] = useState<PreferredPace>('moderate')

  // ── Step 2 data ──────────────────────────────────────────────────────────
  const [selectedNeeds, setSelectedNeeds] = useState<Set<AccessibilityNeedType>>(new Set())
  const [primaryNeed, setPrimaryNeed] = useState<AccessibilityNeedType | null>(null)
  const [otherDescription, setOtherDescription] = useState('')

  // ── Submission state ──────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // ── Validation ───────────────────────────────────────────────────────────
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({})

  // ── Redirect if already completed (fetched from DB, not from profile) ────────
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)

  // ── ALL hooks must be declared before any early return ─────────────────────

  useEffect(() => {
    if (!session || !profile) return
    if (profile.role !== 'student') return

    supabase
      .from('student_profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarding_completed === true) {
          setAlreadyCompleted(true)
        }
      })
  }, [session, profile])

  useEffect(() => {
    if (!submitSuccess) return
    const timer = setTimeout(() => {
      window.location.href = '/dashboard'
    }, 2000)
    return () => clearTimeout(timer)
  }, [submitSuccess])

  // ── Auth guards — AFTER all hooks ───────────────────────────────────────────
  if (!session) return <Navigate to="/auth" replace />
  if (profile && profile.role !== 'student') {
    return <Navigate to="/dashboard" replace />
  }
  if (alreadyCompleted) return <Navigate to="/dashboard" replace />

  function validateStep1(): boolean {
    const errors: Record<string, string> = {}
    if (!age.trim()) {
      errors.age = 'Enter your age'
    } else {
      const n = Number(age)
      if (isNaN(n) || n < 5 || n > 120) {
        errors.age = 'Enter a real age between 5 and 120'
      }
    }
    if (!grade.trim()) {
      errors.grade = "What's your current year or grade?"
    }
    if (subjects.length === 0) {
      errors.subjects = 'Add at least one subject'
    }
    setStep1Errors(errors)
    return Object.keys(errors).length === 0
  }

  function handleNext() {
    if (step === 1) {
      if (!validateStep1()) return
    }
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  function handleBack() {
    setStep(s => Math.max(s - 1, 1))
  }

  function toggleNeed(need: AccessibilityNeedType) {
    setSelectedNeeds(prev => {
      const next = new Set(prev)
      if (next.has(need)) {
        next.delete(need)
        // If we're removing the primary need, clear it.
        if (primaryNeed === need) setPrimaryNeed(null)
      } else {
        next.add(need)
        // Auto-set as primary if it's the first selection.
        if (next.size === 1) setPrimaryNeed(need)
      }
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitting(true)

    const userId = session!.user.id

    // Build the submit payload.
    const needsPayload: Array<{ need_type: AccessibilityNeedType; priority: 'primary' | 'secondary' }> = []
    selectedNeeds.forEach(need => {
      const isPrimary = need === primaryNeed
      needsPayload.push({
        need_type: need,
        priority: isPrimary ? 'primary' : 'secondary',
      })
    })

    const profilePayload: OnboardingSubmitData = {
      student_profile: {
        age: age ? Number(age) : undefined,
        grade: grade || undefined,
        subjects,
        learning_goals: learningGoals || undefined,
        preferred_pace: preferredPace,
        onboarding_completed: true,
      },
      accessibility_needs: needsPayload,
    }

    // Write both tables in a transaction-like sequence.
    // If the profile row already exists (re-onboarding), upsert it.
    const { error: profileError } = await supabase
      .from('student_profiles')
      .upsert(
        {
          id: userId,
          age: profilePayload.student_profile.age ?? null,
          grade: profilePayload.student_profile.grade ?? null,
          subjects: profilePayload.student_profile.subjects,
          learning_goals: profilePayload.student_profile.learning_goals ?? null,
          preferred_pace: profilePayload.student_profile.preferred_pace,
          onboarding_completed: true,
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      setSubmitError(
        "Couldn't save your profile. Check your connection and try again."
      )
      setSubmitting(false)
      return
    }

    // Delete existing needs and re-insert (simpler than upsert for an array).
    await supabase
      .from('accessibility_needs')
      .delete()
      .eq('student_id', userId)

    if (needsPayload.length > 0) {
      const { error: needsError } = await supabase
        .from('accessibility_needs')
        .insert(
          needsPayload.map(n => ({
            student_id: userId,
            need_type: n.need_type,
            priority: n.priority,
          }))
        )

      if (needsError) {
        setSubmitError(
          "Couldn't save your accessibility preferences. Check your connection and try again."
        )
        setSubmitting(false)
        return
      }
    }

    setSubmitting(false)
    setSubmitSuccess(true)
  }

  // Slide animation between steps.
  const slideDirection = step > 1 ? 1 : -1

  return (
    <OnboardingLayout
      currentStep={step}
      totalSteps={TOTAL_STEPS}
      stepLabels={STEP_LABELS}
    >
      {submitSuccess ? (
        <SuccessMessage />
      ) : (
        <div className="relative overflow-hidden">
          <AnimatePresence initial={false} custom={slideDirection} mode="wait">
            <motion.div
              key={step}
              custom={slideDirection}
              initial={{ opacity: 0, x: slideDirection * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection * -40 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {step === 1 && (
                <Step1
                  age={age}
                  setAge={setAge}
                  grade={grade}
                  setGrade={setGrade}
                  subjects={subjects}
                  setSubjects={setSubjects}
                  subjectInput={subjectInput}
                  setSubjectInput={setSubjectInput}
                  learningGoals={learningGoals}
                  setLearningGoals={setLearningGoals}
                  preferredPace={preferredPace}
                  setPreferredPace={setPreferredPace}
                  errors={step1Errors}
                  onNext={handleNext}
                />
              )}

              {step === 2 && (
                <Step2
                  selectedNeeds={selectedNeeds}
                  toggleNeed={toggleNeed}
                  primaryNeed={primaryNeed}
                  setPrimaryNeed={setPrimaryNeed}
                  otherDescription={otherDescription}
                  setOtherDescription={setOtherDescription}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {step === 3 && (
                <Step3
                  age={age}
                  grade={grade}
                  subjects={subjects}
                  learningGoals={learningGoals}
                  preferredPace={preferredPace}
                  selectedNeeds={selectedNeeds}
                  primaryNeed={primaryNeed}
                  submitting={submitting}
                  submitError={submitError}
                  onSubmit={handleSubmit}
                  onBack={handleBack}
                  onEditStep={setStep}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </OnboardingLayout>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — About you
// ---------------------------------------------------------------------------

interface Step1Props {
  age: string
  setAge: (v: string) => void
  grade: string
  setGrade: (v: string) => void
  subjects: string[]
  setSubjects: (v: string[]) => void
  subjectInput: string
  setSubjectInput: (v: string) => void
  learningGoals: string
  setLearningGoals: (v: string) => void
  preferredPace: PreferredPace
  setPreferredPace: (v: PreferredPace) => void
  errors: Record<string, string>
  onNext: () => void
}

function Step1({
  age,
  setAge,
  grade,
  setGrade,
  subjects,
  setSubjects,
  subjectInput,
  setSubjectInput,
  learningGoals,
  setLearningGoals,
  preferredPace,
  setPreferredPace,
  errors,
  onNext,
}: Step1Props) {
  const GRADE_SUGGESTIONS = [
    'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12',
    '1st Year Uni', '2nd Year Uni', '3rd Year Uni', 'Postgrad',
  ]

  function handleAddSubject() {
    const trimmed = subjectInput.trim()
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed])
    }
    setSubjectInput('')
  }

  function handleSubjectKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSubject()
    }
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); onNext() }}
      className="space-y-8"
    >
      <div>
        <h1 className="font-heading text-2xl font-bold text-text sm:text-3xl">
          Tell us about yourself
        </h1>
        <p className="mt-2 text-sm text-text/60">
          We'll use this to shape how Helen works for you.
        </p>
      </div>

      {/* Age + Grade row */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="age" className="text-sm font-medium text-text">
            Age <span className="text-red-500">*</span>
          </label>
          <input
            id="age"
            type="number"
            min="5"
            max="120"
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="e.g. 15"
            aria-invalid={!!errors.age}
            aria-describedby={errors.age ? 'age-error' : undefined}
            className={[
              'w-full rounded-lg border bg-surface px-4 py-3 text-sm text-text transition-colors',
              'placeholder:text-text/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
              errors.age
                ? 'border-red-500/70'
                : 'border-black/10 dark:border-white/15',
            ].join(' ')}
          />
          {errors.age && (
            <p id="age-error" role="alert" className="text-xs text-red-500">
              {errors.age}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="grade" className="text-sm font-medium text-text">
            Year / Grade <span className="text-red-500">*</span>
          </label>
          <input
            id="grade"
            list="grade-suggestions"
            value={grade}
            onChange={e => setGrade(e.target.value)}
            placeholder="e.g. Year 10"
            aria-invalid={!!errors.grade}
            aria-describedby={errors.grade ? 'grade-error' : undefined}
            className={[
              'w-full rounded-lg border bg-surface px-4 py-3 text-sm text-text transition-colors',
              'placeholder:text-text/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
              errors.grade
                ? 'border-red-500/70'
                : 'border-black/10 dark:border-white/15',
            ].join(' ')}
          />
          <datalist id="grade-suggestions">
            {GRADE_SUGGESTIONS.map(g => (
              <option key={g} value={g} />
            ))}
          </datalist>
          {errors.grade && (
            <p id="grade-error" role="alert" className="text-xs text-red-500">
              {errors.grade}
            </p>
          )}
        </div>
      </div>

      {/* Subjects */}
      <SubjectTags
        subjects={subjects}
        setSubjects={setSubjects}
        inputValue={subjectInput}
        setInputValue={setSubjectInput}
        onAdd={handleAddSubject}
        onKeyDown={handleSubjectKeyDown}
        error={errors.subjects}
      />

      {/* Learning goals */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="goals" className="text-sm font-medium text-text">
          What do you want to achieve?
        </label>
        <textarea
          id="goals"
          value={learningGoals}
          onChange={e => setLearningGoals(e.target.value)}
          placeholder="e.g. Get better at algebra and understand physics concepts faster"
          rows={3}
          className={[
            'w-full resize-none rounded-lg border border-black/10 bg-surface px-4 py-3 text-sm text-text transition-colors',
            'placeholder:text-text/40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            'dark:border-white/15',
          ].join(' ')}
        />
      </div>

      {/* Preferred pace */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-text">Preferred pace</label>
        <PaceSelector value={preferredPace} onChange={setPreferredPace} />
      </div>

      {/* CTA */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className={[
            'rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-colors',
            'hover:bg-primary/90',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          ].join(' ')}
        >
          Continue
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — How you learn
// ---------------------------------------------------------------------------

interface Step2Props {
  selectedNeeds: Set<AccessibilityNeedType>
  toggleNeed: (need: AccessibilityNeedType) => void
  primaryNeed: AccessibilityNeedType | null
  setPrimaryNeed: (need: AccessibilityNeedType) => void
  otherDescription: string
  setOtherDescription: (v: string) => void
  onNext: () => void
  onBack: () => void
}

function Step2({
  selectedNeeds,
  toggleNeed,
  primaryNeed,
  setPrimaryNeed,
  otherDescription,
  setOtherDescription,
  onNext,
  onBack,
}: Step2Props) {
  const needsArray = Array.from(selectedNeeds)
  const showPriority = needsArray.length >= 2

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text sm:text-3xl">
          What would you like help with?
        </h1>
        <p className="mt-2 text-sm text-text/60">
          Select anything that feels right — you can always change it later.
        </p>
        <p className="mt-1 text-xs text-text/40">
          This just helps us personalize your experience.
        </p>
      </div>

      {/* Need cards grid */}
      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        role="group"
        aria-label="Accessibility needs"
      >
        {NEED_OPTIONS.map(option => (
          <AccessibilityCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedNeeds.has(option.value)}
            onToggle={() => toggleNeed(option.value)}
          />
        ))}
      </div>

      {/* Other description */}
      {selectedNeeds.has('other_learning_disability') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="other-desc" className="text-sm font-medium text-text">
              Briefly describe what you're thinking
            </label>
            <input
              id="other-desc"
              type="text"
              value={otherDescription}
              onChange={e => setOtherDescription(e.target.value)}
              placeholder="e.g. Processing speed, working memory differences"
              className={[
                'w-full rounded-lg border border-black/10 bg-surface px-4 py-3 text-sm text-text transition-colors',
                'placeholder:text-text/40',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                'dark:border-white/15',
              ].join(' ')}
            />
          </div>
        </motion.div>
      )}

      {/* Primary need selection */}
      {showPriority && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-5"
        >
          <p className="text-sm font-medium text-text">
            Which affects you most day-to-day?{' '}
            <span className="font-normal text-text/60">(choose one)</span>
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Primary need">
            {needsArray.map(need => {
              const option = NEED_OPTIONS.find(o => o.value === need)
              const isPrimary = primaryNeed === need
              return (
                <button
                  key={need}
                  type="button"
                  role="radio"
                  aria-checked={isPrimary}
                  onClick={() => setPrimaryNeed(need)}
                  className={[
                    'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    isPrimary
                      ? 'border-primary bg-primary text-white'
                      : 'border-black/10 bg-surface text-text dark:border-white/15 dark:bg-surface',
                  ].join(' ')}
                >
                  {isPrimary && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                  {option?.label ?? need}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className={[
            'rounded-xl border border-black/10 px-6 py-3 text-sm font-medium text-text transition-colors',
            'hover:border-primary/40 hover:text-primary',
            'dark:border-white/15',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          ].join(' ')}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className={[
            'rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-colors',
            'hover:bg-primary/90',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          ].join(' ')}
        >
          Review &amp; confirm
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Review & confirm
// ---------------------------------------------------------------------------

interface Step3Props {
  age: string
  grade: string
  subjects: string[]
  learningGoals: string
  preferredPace: PreferredPace
  selectedNeeds: Set<AccessibilityNeedType>
  primaryNeed: AccessibilityNeedType | null
  submitting: boolean
  submitError: string | null
  onSubmit: (e: FormEvent) => void
  onBack: () => void
  onEditStep: (step: number) => void
}

function Step3({
  age,
  grade,
  subjects,
  learningGoals,
  preferredPace,
  selectedNeeds,
  primaryNeed,
  submitting,
  submitError,
  onSubmit,
  onBack,
  onEditStep,
}: Step3Props) {
  const needsArray = Array.from(selectedNeeds)
  const getNeedLabel = (v: AccessibilityNeedType) =>
    NEED_OPTIONS.find(o => o.value === v)?.label ?? v

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text sm:text-3xl">
          Almost there
        </h1>
        <p className="mt-2 text-sm text-text/60">
          Review your answers and confirm when ready.
        </p>
      </div>

      {/* Summary cards */}
      <div className="space-y-4">
        {/* About you */}
        <SummarySection
          title="About you"
          onEdit={() => onEditStep(1)}
          editLabel="Edit"
        >
          <SummaryRow label="Age">{age || '—'}</SummaryRow>
          <SummaryRow label="Year / Grade">{grade || '—'}</SummaryRow>
          <SummaryRow label="Subjects">
            <div className="mt-1 flex flex-wrap gap-1.5">
              {subjects.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {s}
                </span>
              ))}
            </div>
          </SummaryRow>
          <SummaryRow label="Goals">
            {learningGoals || <span className="text-text/40">None specified</span>}
          </SummaryRow>
          <SummaryRow label="Preferred pace">{paceLabel(preferredPace)}</SummaryRow>
        </SummarySection>

        {/* How you learn */}
        <SummarySection
          title="How you learn"
          onEdit={() => onEditStep(2)}
          editLabel="Edit"
        >
          {needsArray.length === 0 ? (
            <p className="text-sm text-text/50">No needs selected</p>
          ) : (
            <div className="space-y-2">
              {needsArray.map(need => (
                <div key={need} className="flex items-center gap-2">
                  {need === primaryNeed && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                      Primary
                    </span>
                  )}
                  {need !== primaryNeed && (
                    <span className="rounded-full bg-text/10 px-2 py-0.5 text-xs text-text/60">
                      Secondary
                    </span>
                  )}
                  <span className="text-sm text-text">{getNeedLabel(need)}</span>
                </div>
              ))}
            </div>
          )}
        </SummarySection>
      </div>

      {/* Error */}
      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
        >
          <svg
            className="mt-0.5 shrink-0 text-red-500"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Something went wrong
            </p>
            <p className="mt-0.5 text-xs text-red-500/80">{submitError}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className={[
            'rounded-xl border border-black/10 px-6 py-3 text-sm font-medium text-text transition-colors',
            'hover:border-primary/40 hover:text-primary',
            'dark:border-white/15',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            submitting ? 'cursor-not-allowed opacity-50' : '',
          ].join(' ')}
        >
          Back
        </button>

        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={{ scale: submitting ? 1 : 0.97 }}
          className={[
            'flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-colors',
            'hover:bg-primary/90',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            submitting ? 'cursor-not-allowed opacity-80' : '',
          ].join(' ')}
        >
          {submitting ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.3" />
                  <path d="M12 2a10 10 0 1 0 10 10" />
                </svg>
              </motion.span>
              Saving…
            </>
          ) : (
            "Confirm and continue"
          )}
        </motion.button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Summary section (review card)
// ---------------------------------------------------------------------------

function SummarySection({
  title,
  children,
  onEdit,
  editLabel,
}: {
  title: string
  children: React.ReactNode
  onEdit: () => void
  editLabel: string
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-surface p-5 dark:border-white/10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-text">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className={[
            'text-xs font-medium text-primary underline underline-offset-2 transition-colors',
            'hover:text-primary/70',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60',
          ].join(' ')}
        >
          {editLabel}
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-28 shrink-0 text-text/50">{label}</span>
      <span className="text-text">{children}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Success state
// ---------------------------------------------------------------------------

function SuccessMessage() {
  return (
    <div className="flex flex-col items-center gap-5 py-12 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.div>
      <div>
        <h1 className="font-heading text-2xl font-bold text-text sm:text-3xl">
          You're all set!
        </h1>
        <p className="mt-2 max-w-sm text-sm text-text/60">
          Helen is ready to help you learn in the way that works best for you.
          Heading to your dashboard now…
        </p>
      </div>
    </div>
  )
}
