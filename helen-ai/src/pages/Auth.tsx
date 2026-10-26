import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RoleSelector } from '@/components/RoleSelector'
import { VerifyPending } from '@/components/VerifyPending'
import type { AuthMode, UserRole } from '@/types'

// ---------------------------------------------------------------------------
// Animation variants — orchestrated entrance for the hero panel and card.
// ---------------------------------------------------------------------------

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const slideUpFade: Variants = {
  hidden: { y: 24 },
  visible: {
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateEmail(v: string) {
  if (!v.trim()) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email'
  return null
}

function validatePassword(v: string) {
  if (!v) return 'Password is required'
  if (v.length < 8) return 'Use at least 8 characters'
  return null
}

function validateName(v: string) {
  if (!v.trim()) return 'Full name is required'
  return null
}

function validateConfirmPassword(value: string, password: string) {
  if (!value) return 'Please confirm your password'
  if (value !== password) return 'Passwords do not match'
  return null
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FormInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  showPassword = false,
  onTogglePassword,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string | null
  placeholder?: string
  autoComplete?: string
  showPassword?: boolean
  onTogglePassword?: () => void
}) {
  const hasError = Boolean(error)
  const isPassword = type === 'password'
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-bold tracking-wide text-[#030E50] dark:text-[#C3D7FC]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={[
            'w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-[#030E50] transition-all placeholder:text-[#63709A]/60 dark:bg-[#132653] dark:text-[#EEF3FF] dark:placeholder:text-[#C3D7FC]/45',
            'focus-visible:border-[#2875FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2875FB]/15',
            isPassword ? 'pr-12' : '',
            hasError
              ? 'border-red-500/70 focus-visible:ring-red-500/20'
              : 'border-[#C3D7FC] dark:border-[#39518f]',
          ].join(' ')}
        />
        {isPassword && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#1E3FB2] transition-colors hover:bg-[#C3D7FC]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2875FB] dark:text-[#C3D7FC] dark:hover:bg-[#1E3FB2]/40"
          >
            {showPassword ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 3l18 18" />
                <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4.5c7 0 11 7.5 11 7.5a18.5 18.5 0 0 1-3.17 3.94" />
                <path d="M6.61 6.61C3.69 8.61 1 12 1 12s4 7.5 11 7.5a10.8 10.8 0 0 0 4.13-.82" />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {hasError && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Submit button with animated states: idle → loading → success / error
// ---------------------------------------------------------------------------

type ButtonState = 'idle' | 'loading' | 'success' | 'error'

function SubmitButton({
  state,
  mode,
}: {
  state: ButtonState
  mode: AuthMode
}) {
  const isSuccess = state === 'success'
  const isError = state === 'error'
  const isLoading = state === 'loading'

  let label = mode === 'login' ? 'Sign in' : 'Create account'
  if (isSuccess) label = 'Done'
  if (isError && !isLoading) label = 'Try again'

  return (
    <motion.button
      type="submit"
      disabled={isLoading}
      whileTap={{ scale: 0.97 }}
      className={[
        'relative flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2875FB]/60',
        isSuccess
          ? 'bg-emerald-500 text-white'
          : isError
          ? 'bg-red-500/90 text-white hover:bg-red-500'
          : 'bg-[#2875FB] text-white shadow-lg shadow-[#2875FB]/20 hover:bg-[#1E3FB2]',
        isLoading ? 'cursor-not-allowed opacity-80' : '',
      ].join(' ')}
    >
      {/* Spinner */}
      {isLoading && (
        <motion.span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.3" />
            <path d="M12 2a10 10 0 1 0 10 10" />
          </svg>
        </motion.span>
      )}

      {/* Success check */}
      {isSuccess && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.span>
      )}

      {/* Error cross */}
      {isError && !isLoading && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}

      <span className={isLoading ? 'invisible' : ''}>{label}</span>
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Auth page
// ---------------------------------------------------------------------------

export function Auth() {
  const { session, profile, login, register } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [instituteName, setInstituteName] = useState('')
  const [place, setPlace] = useState('')
  const [designation, setDesignation] = useState('')

  // Validation errors
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [fullNameError, setFullNameError] = useState<string | null>(null)
  const [teacherDetailsError, setTeacherDetailsError] = useState<string | null>(null)

  // Submission state
  const [buttonState, setButtonState] = useState<ButtonState>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  // AuthGuard: if session + profile are both loaded, route based on role.
  // We don't redirect on initial mount (loading=true) — that would briefly show the
  // auth page before redirecting away.
  if (session && profile) {
    if (profile.role === 'student') {
      return <Navigate to="/onboarding" replace />
    }
    return <Navigate to="/dashboard" replace />
  }
  if (pendingEmail) {
    return (
      <VerifyPending
        email={pendingEmail}
        password={password}
        onBack={() => {
          setPendingEmail(null)
          setButtonState('idle')
          setMode('login')
        }}
      />
    )
  }

  function validateAll(): boolean {
    const e = validateEmail(email)
    const p = validatePassword(password)
    const cp = mode === 'register' ? validateConfirmPassword(confirmPassword, password) : null
    const n = mode === 'register' ? validateName(fullName) : null
    const teacherError = mode === 'register' && role === 'teacher'
      ? !instituteName.trim()
        ? 'Institute name is required'
        : !place.trim()
          ? 'Place is required'
          : null
      : null

    setEmailError(e)
    setPasswordError(p)
    setConfirmPasswordError(cp)
    setFullNameError(n)
    setTeacherDetailsError(teacherError)
    return !e && !p && !cp && !n && !teacherError
  }

    async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!validateAll()) {
      setButtonState('error')
      setTimeout(() => setButtonState('idle'), 600)
      return
    }

    setButtonState('loading')

    if (mode === 'login') {
      const { error } = await login(email, password)
      if (error) {
        // Unverified account: show the "verify your email" page instead of an error
        if (error.includes('Email not confirmed')) {
          setButtonState('idle')
          setPendingEmail(email)
          return
        }
        setButtonState('error')
        const msg =
          error.toLowerCase().includes('invalid login credentials')
            ? 'Wrong email or password. Try again.'
            : error
        setSubmitError(msg)
        setTimeout(() => setButtonState('idle'), 1500)
        return
      }
    } else {
      const { error, needsVerification } = await register(email, password, fullName, role, role === 'teacher'
        ? { instituteName: instituteName.trim(), place: place.trim(), designation: designation.trim() }
        : undefined)
      if (error) {
        setButtonState('error')
        const msg =
          error.toLowerCase().includes('already registered') ||
          error.toLowerCase().includes('already exists')
            ? "That email's already registered. Try signing in."
            : error
        setSubmitError(msg)
        setTimeout(() => setButtonState('idle'), 1500)
        return
      }

      // Email confirmation required: show the "verifying your email" page
      if (needsVerification) {
        setButtonState('idle')
        setPendingEmail(email)
        return
      }
    }

    setButtonState('success')
  }

  function switchMode(newMode: AuthMode) {
    if (newMode === mode) return
    setMode(newMode)
    setEmailError(null)
    setPasswordError(null)
    setConfirmPasswordError(null)
    setFullNameError(null)
    setTeacherDetailsError(null)
    setSubmitError(null)
    setButtonState('idle')
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#F7FAFF] text-[#030E50] dark:bg-[#07133F] dark:text-[#EEF3FF]">
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header className="absolute right-0 top-0 z-20 p-4 sm:p-6">
        <ThemeToggle />
      </header>

      {/* ── Split layout ──────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col lg:flex-row">
        {/* Left panel — brand headline */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-[#030E50] via-[#10277e] to-[#1E3FB2] px-6 pb-12 pt-28 text-white lg:min-h-dvh lg:w-1/2 lg:px-16 lg:pb-0 lg:pt-20"
        >
          <motion.div
            aria-hidden="true"
            animate={{ y: [0, -18, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-[#C3D7FC]/35 shadow-[0_0_0_24px_rgba(195,215,252,0.06),0_0_0_52px_rgba(195,215,252,0.05)]"
          />
          <motion.div
            aria-hidden="true"
            animate={{ y: [0, 14, 0], rotate: [-12, -5, -12] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
            className="pointer-events-none absolute bottom-16 left-12 h-28 w-28 rounded-[40%_60%_58%_42%] bg-[#C3D7FC]/15"
          />
          <motion.div variants={slideUpFade}>
            <img
              src={`${import.meta.env.BASE_URL}pwa-192x192.png`}
              alt=""
              className="mb-8 h-12 w-12 rounded-2xl object-cover shadow-lg shadow-black/20"
            />
          </motion.div>

          <motion.h1
            variants={slideUpFade}
            className="relative font-heading text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Helen AI
          </motion.h1>

          <motion.p
            variants={slideUpFade}
            className="relative mt-5 max-w-md text-lg leading-relaxed text-white/75 sm:text-xl"
          >
            Your study companion that actually gets where you&apos;re stuck.
            Helen listens to what you need, explains it in a way that clicks,
            and keeps you moving forward — not just answers.
          </motion.p>
        </motion.div>

        {/* Right panel — auth card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center px-5 pb-12 pt-20 sm:px-8 lg:min-h-dvh lg:w-1/2 lg:px-16 lg:pt-8"
        >
          {/* Card — asymmetric radius + accent-green top border */}
          <motion.div
            variants={slideUpFade}
            className={[
              'relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[#C3D7FC] border-t-4 border-t-[#2875FB]',
              'bg-white shadow-[0_24px_70px_rgba(3,14,80,0.14)] dark:border-[#263F7A] dark:bg-[#0B1A4A] dark:shadow-black/40',
              // Asymmetric radius: more on top-right than the rest of the card.
              'rounded-tr-[3rem]',
              // Subtle inner border overlay to separate the asymmetric corner from the card body.
              'after:pointer-events-none after:absolute after:inset-0',
              'after:rounded-[2rem] after:rounded-tr-[3rem]',
               'after:border after:border-[#C3D7FC]/40 dark:after:border-white/10',
            ].join(' ')}
          >
            <div className="px-8 py-9 sm:px-10 sm:py-10">
              {/* Mode toggle — pill segment control */}
              <div className="mb-8 flex rounded-xl bg-[#EEF4FF] p-1 dark:bg-[#132653]">
                {(['login', 'register'] as AuthMode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={[
                      'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      mode === m
                        ? 'bg-white text-[#030E50] shadow-sm dark:bg-[#1E3FB2] dark:text-white'
                        : 'text-[#63709A] hover:text-[#030E50] dark:text-[#C3D7FC]/75 dark:hover:text-white',
                    ].join(' ')}
                  >
                    {m === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Full name — register only */}
                {mode === 'register' && (
                  <motion.div
                    key="fullName"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <FormInput
                      id="fullName"
                      label="Full name"
                      value={fullName}
                      onChange={v => {
                        setFullName(v)
                        if (fullNameError) setFullNameError(validateName(v))
                      }}
                      error={fullNameError}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </motion.div>
                )}

                <FormInput
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={v => {
                    setEmail(v)
                    if (emailError) setEmailError(validateEmail(v))
                  }}
                  error={emailError}
                  placeholder="you@example.com"
                  autoComplete="email"
                />

                <FormInput
                  id="password"
                  label="Password"
                   type="password"
                   value={password}
                   onChange={v => {
                     setPassword(v)
                     if (passwordError) setPasswordError(validatePassword(v))
                     if (confirmPasswordError) setConfirmPasswordError(validateConfirmPassword(confirmPassword, v))
                   }}
                  error={passwordError}
                   placeholder={mode === 'register' ? 'At least 8 characters' : ''}
                   autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                   showPassword={showPassword}
                   onTogglePassword={() => setShowPassword(value => !value)}
                 />

                 {mode === 'register' && (
                   <motion.div
                     key="confirmPassword"
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     transition={{ duration: 0.25 }}
                     className="overflow-hidden"
                   >
                     <FormInput
                       id="confirmPassword"
                       label="Confirm password"
                       type="password"
                       value={confirmPassword}
                       onChange={value => {
                         setConfirmPassword(value)
                         setConfirmPasswordError(validateConfirmPassword(value, password))
                       }}
                       error={confirmPasswordError}
                       placeholder="Re-enter your password"
                       autoComplete="new-password"
                       showPassword={showPassword}
                       onTogglePassword={() => setShowPassword(value => !value)}
                     />
                   </motion.div>
                 )}

                {/* Role selector — register only, pill buttons */}
                {mode === 'register' && (
                  <motion.div
                    key="role"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <fieldset>
                      <legend className="mb-2.5 text-sm font-medium text-text">
                        I am a
                      </legend>
                      <RoleSelector value={role} onChange={setRole} />
                    </fieldset>
                  </motion.div>
                )}

                {mode === 'register' && role === 'teacher' && (
                  <motion.div
                    key="teacher-details"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5 overflow-hidden"
                  >
                    <FormInput
                      id="teacher-institute"
                      label="Institute name"
                      value={instituteName}
                      onChange={value => {
                        setInstituteName(value)
                        if (teacherDetailsError) setTeacherDetailsError(value.trim() ? null : 'Institute name is required')
                      }}
                      error={teacherDetailsError && !instituteName.trim() ? teacherDetailsError : null}
                      placeholder="Your school or institution"
                      autoComplete="organization"
                    />
                    <FormInput
                      id="teacher-place"
                      label="Place"
                      value={place}
                      onChange={value => {
                        setPlace(value)
                        if (teacherDetailsError && instituteName.trim()) setTeacherDetailsError(value.trim() ? null : 'Place is required')
                      }}
                      error={teacherDetailsError && instituteName.trim() ? teacherDetailsError : null}
                      placeholder="City or location"
                      autoComplete="address-level2"
                    />
                    <FormInput
                      id="teacher-designation"
                      label="Designation (optional)"
                      value={designation}
                      onChange={setDesignation}
                      placeholder="e.g. Assistant Professor"
                      autoComplete="organization-title"
                    />
                  </motion.div>
                )}

                {/* Server-side error */}
                {submitError && (
                  <motion.p
                    key="submitError"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
                  >
                    {submitError}
                  </motion.p>
                )}

                <div className="pt-1">
                  <SubmitButton state={buttonState} mode={mode} />
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
