import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RoleSelector } from '@/components/RoleSelector'
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
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
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
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string | null
  placeholder?: string
  autoComplete?: string
}) {
  const hasError = Boolean(error)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={[
          'w-full rounded-lg border bg-surface px-4 py-3 text-sm text-text transition-colors',
          'placeholder:text-text/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary',
          hasError
            ? 'border-red-500/70 focus-visible:ring-red-500/60'
            : 'border-black/10 dark:border-white/15',
        ].join(' ')}
      />
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        isSuccess
          ? 'bg-emerald-500 text-white'
          : isError
          ? 'bg-red-500/90 text-white hover:bg-red-500'
          : 'bg-primary text-white hover:bg-primary/90',
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
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('student')

  // Validation errors
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [fullNameError, setFullNameError] = useState<string | null>(null)

  // Submission state
  const [buttonState, setButtonState] = useState<ButtonState>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  // AuthGuard: if session + profile are both loaded, route based on role.
  // We don't redirect on initial mount (loading=true) — that would briefly show the
  // auth page before redirecting away.
  if (session && profile) {
    if (profile.role === 'student') {
      return <Navigate to="/onboarding" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  function validateAll(): boolean {
    const e = validateEmail(email)
    const p = validatePassword(password)
    const n = mode === 'register' ? validateName(fullName) : null

    setEmailError(e)
    setPasswordError(p)
    setFullNameError(n)
    return !e && !p && !n
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
        setButtonState('error')
        const msg =
          error.toLowerCase().includes('invalid login credentials')
            ? 'Wrong email or password. Try again.'
            : error.includes('Email not confirmed')
            ? 'Check your inbox — we sent a confirmation link.'
            : error
        setSubmitError(msg)
        setTimeout(() => setButtonState('idle'), 1500)
        return
      }
    } else {
      const { error } = await register(email, password, fullName, role)
      if (error) {
        setButtonState('error')
        const msg =
          error.toLowerCase().includes('already registered') ||
          error.toLowerCase().includes('already exists')
            ? "That email's already registered. Try signing in."
            : error.includes('Email not confirmed')
            ? 'Check your inbox — we sent a confirmation link.'
            : error
        setSubmitError(msg)
        setTimeout(() => setButtonState('idle'), 1500)
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
    setFullNameError(null)
    setSubmitError(null)
    setButtonState('idle')
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-text">
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header className="absolute right-0 top-0 z-10 p-4 sm:p-6">
        <ThemeToggle />
      </header>

      {/* ── Split layout ──────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left panel — brand headline */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col justify-center px-6 pt-24 pb-10 lg:w-1/2 lg:px-16 lg:pb-0"
        >
          <motion.div variants={slideUpFade}>
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
              <span className="font-heading text-xl font-bold leading-none text-white">H</span>
            </div>
          </motion.div>

          <motion.h1
            variants={slideUpFade}
            className="font-heading text-5xl font-bold tracking-tight text-text sm:text-6xl lg:text-7xl"
          >
            Helen AI
          </motion.h1>

          <motion.p
            variants={slideUpFade}
            className="mt-5 max-w-md text-lg leading-relaxed text-text/70 sm:text-xl"
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
          className="flex items-center justify-center px-6 pb-12 pt-8 lg:w-1/2 lg:px-16"
        >
          {/* Card — asymmetric radius + accent-green top border */}
          <motion.div
            variants={slideUpFade}
            className={[
              'relative w-full max-w-md overflow-hidden rounded-[2rem] border-t-2 border-primary',
              'bg-surface shadow-2xl shadow-black/5 dark:border-primary/80 dark:shadow-black/40',
              // Asymmetric radius: more on top-right than the rest of the card.
              'rounded-tr-[3rem]',
              // Subtle inner border overlay to separate the asymmetric corner from the card body.
              'after:pointer-events-none after:absolute after:inset-0',
              'after:rounded-[2rem] after:rounded-tr-[3rem]',
              'after:border after:border-black/5 dark:after:border-white/5',
            ].join(' ')}
          >
            <div className="px-8 py-9 sm:px-10 sm:py-10">
              {/* Mode toggle — pill segment control */}
              <div className="mb-8 flex rounded-xl bg-background p-1">
                {(['login', 'register'] as AuthMode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={[
                      'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      mode === m
                        ? 'bg-surface text-text shadow-sm'
                        : 'text-text/50 hover:text-text/80',
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
                  }}
                  error={passwordError}
                  placeholder={mode === 'register' ? 'At least 8 characters' : ''}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />

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
      </div>
    </div>
  )
}
