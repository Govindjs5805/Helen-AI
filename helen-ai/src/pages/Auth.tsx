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
      <label htmlFor={id} className="text-[0.7rem] font-black uppercase tracking-[0.12em] text-[#030E50] dark:text-[#C3D7FC]">
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
            'h-[3.25rem] w-full rounded-2xl border bg-[#F8FBFF] px-4 text-sm text-[#030E50] shadow-[inset_0_1px_2px_rgba(3,14,80,0.03)] transition-all placeholder:text-[#63709A]/60 dark:bg-[#132653] dark:text-[#EEF3FF] dark:placeholder:text-[#C3D7FC]/45',
            'focus-visible:border-[#2875FB] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2875FB]/15 focus-visible:shadow-[0_8px_20px_rgba(40,117,251,0.08)]',
            isPassword ? 'pr-12' : '',
            hasError
              ? 'border-red-500/70 focus-visible:ring-red-500/20'
               : 'border-[#D8E4F5] dark:border-[#39518f]',
          ].join(' ')}
        />
        {isPassword && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#1E3FB2] transition-colors hover:bg-[#C3D7FC]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2875FB] dark:text-[#C3D7FC] dark:hover:bg-[#1E3FB2]/40"
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
        'relative flex min-h-[3.4rem] w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2875FB]/60',
        isSuccess
          ? 'bg-emerald-500 text-white'
          : isError
          ? 'bg-red-500/90 text-white hover:bg-red-500'
          : 'bg-gradient-to-r from-[#2875FB] to-[#1267EC] text-white shadow-[0_14px_28px_rgba(40,117,251,0.25)] hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(30,63,178,0.28)]',
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
    <div className="relative min-h-dvh overflow-hidden bg-[#EAF2FF] px-0 py-0 text-[#030E50] dark:bg-[#030E50] dark:text-[#EEF3FF] sm:px-6 sm:py-6 lg:px-8">
      <header className="absolute right-3 top-3 z-30 sm:right-6 sm:top-6 lg:right-8 lg:top-8">
        <ThemeToggle />
      </header>

      <main className="flex min-h-dvh items-center justify-center sm:min-h-[calc(100dvh-3rem)]">
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative flex w-full max-w-[1240px] flex-col overflow-hidden rounded-none bg-white shadow-none dark:bg-[#0B1A4A] lg:h-[820px] lg:flex-row lg:rounded-[3rem] lg:shadow-[0_34px_100px_rgba(3,14,80,0.24)] dark:lg:shadow-black/45"
        >
          <motion.aside
            variants={slideUpFade}
            className={[
              'relative z-20 order-1 h-[25rem] w-full shrink-0 overflow-hidden bg-gradient-to-br from-[#031451] via-[#0B4FCB] to-[#073A9C] text-white',
              'rounded-b-[2.5rem] transition-transform duration-1000 ease-out lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-1/2 lg:rounded-[2.75rem]',
              mode === 'register'
                ? 'lg:translate-x-full'
                : 'lg:translate-x-0',
            ].join(' ')}
          >
            <motion.div
              aria-hidden="true"
              animate={{ x: [0, 16, 0], y: [0, -10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute -right-20 -top-24 h-64 w-80 rounded-[50%] bg-[#28B8FF]/25 blur-[1px]"
            />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-[120%] rounded-[50%] bg-[#061D70]/80" aria-hidden="true" />

            <div className="absolute left-6 top-6 z-10 flex items-center gap-3 sm:left-8 sm:top-8">
              <img
                src={`${import.meta.env.BASE_URL}apple-touch-icon.png`}
                alt=""
                className="h-10 w-10 rounded-xl object-cover shadow-sm"
              />
              <span className="text-base font-black tracking-tight">Helen AI</span>
            </div>

            <motion.div
              key={`${mode}-message`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={[
                'absolute top-24 z-10 w-[42%] sm:top-32',
                mode === 'login' ? 'right-7 sm:right-10' : 'left-7 sm:left-10',
              ].join(' ')}
            >
              <h1 className="font-heading text-[1.8rem] font-bold leading-[0.98] tracking-[-0.06em] text-white sm:text-[2.35rem]">
                {mode === 'login' ? (
                  <>Glad to see you <span className="text-white">again!</span></>
                ) : (
                  <>Let&apos;s start your <span className="text-white">journey!</span></>
                )}
              </h1>
              <p className="mt-3 text-xs leading-relaxed text-white/75 sm:text-sm">
                {mode === 'login'
                  ? 'Sign in to continue your learning journey with Helen.'
                  : 'Learn smarter. Grow brighter. With Helen AI.'}
              </p>
            </motion.div>

            <motion.img
              key={`${mode}-speech`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              src={`${import.meta.env.BASE_URL}${mode === 'login' ? 'auth-welcome-back.png' : 'auth-hello-there.png'}`}
              alt={mode === 'login' ? 'Welcome back' : 'Hello there'}
              className={[
                'pointer-events-none absolute bottom-[50%] z-10 w-[38%] max-w-[13rem] object-contain drop-shadow-[0_8px_14px_rgba(3,14,80,0.2)] sm:w-[32%]',
                mode === 'login'
                  ? 'left-[4%] origin-bottom-left sm:left-[6%]'
                  : 'right-[4%] origin-bottom-right sm:right-[6%]',
              ].join(' ')}
            />

            <motion.img
              key={mode}
              initial={{ opacity: 0, y: 18, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              src={`${import.meta.env.BASE_URL}auth-${mode === 'login' ? 'login-mascot.png' : 'register-mascot.png'}`}
              onError={event => {
                event.currentTarget.src = `${import.meta.env.BASE_URL}mascot-blue.png`
              }}
              alt="Helen mascot"
              className="absolute bottom-[-2.25rem] left-1/2 z-[1] w-[54%] max-w-[24rem] -translate-x-1/2 object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,0.25)] sm:bottom-[-2.5rem] sm:w-[72%]"
            />
          </motion.aside>

          <motion.div
            variants={slideUpFade}
            className={[
              'relative z-10 order-2 flex min-h-[36rem] w-full flex-1 items-center overflow-y-auto bg-white px-6 py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:bg-[#0B1A4A] sm:px-10',
              'rounded-none transition-transform duration-1000 ease-out lg:absolute lg:inset-y-0 lg:left-1/2 lg:h-full lg:w-1/2 lg:flex-none lg:rounded-[2.75rem] lg:px-[clamp(3rem,6vw,6rem)] lg:py-14',
              mode === 'register'
                ? 'lg:-translate-x-full'
                : 'lg:translate-x-0',
            ].join(' ')}
          >
            <div className="mx-auto w-full max-w-[29rem]">
              <motion.div
                key={`${mode}-heading`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="font-heading text-[2.65rem] font-bold leading-none tracking-[-0.07em] text-[#030E50] dark:text-white sm:text-5xl">
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#68769D] dark:text-[#C3D7FC]/70">
                  {mode === 'login'
                    ? <>Continue your learning journey with Helen <span aria-hidden="true">💙</span></>
                    : <>Start your learning journey with Helen <span aria-hidden="true">💙</span></>}
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
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
                  placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(value => !value)}
                />

                {mode === 'login' && (
                  <div className="-mt-2 flex justify-end">
                    <button
                      type="button"
                      className="text-xs font-black text-[#1E3FB2] transition-colors hover:text-[#2875FB] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2875FB]/50 dark:text-[#C3D7FC]"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

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
                      <legend className="mb-2.5 text-[0.7rem] font-black uppercase tracking-[0.12em] text-[#030E50] dark:text-[#C3D7FC]">
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

                {submitError && (
                  <motion.p
                    key="submitError"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
                  >
                    {submitError}
                  </motion.p>
                )}

                <div className="pt-1">
                  <SubmitButton state={buttonState} mode={mode} />
                </div>

                <p className="pt-1 text-center text-xs text-[#68769D] dark:text-[#C3D7FC]/65">
                  {mode === 'login' ? 'Don\'t have an account?' : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                    className="font-black text-[#1E3FB2] transition-colors hover:text-[#2875FB] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2875FB]/50 dark:text-[#C3D7FC]"
                  >
                    {mode === 'login' ? 'Create account' : 'Sign in'}
                  </button>
                </p>
              </form>
            </div>
          </motion.div>
        </motion.section>
      </main>
    </div>
  )
}
