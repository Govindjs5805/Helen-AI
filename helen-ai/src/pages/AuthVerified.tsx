import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'

export function AuthVerified() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()

  // Supabase puts error info in the URL when a link is expired or already used.
  const [linkFailed] = useState(() =>
    /error(_code|_description)?=/.test(window.location.hash + window.location.search),
  )

  let title = 'Verifying…'
  let body = 'Please wait a moment.'
  let action: { label: string; to: string } | null = null

  if (linkFailed) {
    title = 'Link expired or already used'
    body = 'Go back to sign in and request a new verification email.'
    action = { label: 'Back to sign in', to: '/auth' }
  } else if (!loading && session) {
    title = 'Email verified ✅'
    body = 'Your account is confirmed. You can close this tab. Your other tab will continue automatically.'
    action = { label: 'Continue to Helen AI', to: '/' }
  } else if (!loading) {
    title = "We couldn't confirm this link here"
    body = 'If you already verified your email, just sign in.'
    action = { label: 'Go to sign in', to: '/auth' }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-background px-6 text-text">
      <header className="absolute right-0 top-0 p-4 sm:p-6">
        <ThemeToggle />
      </header>

      <div
        aria-live="polite"
        className="w-full max-w-md rounded-[2rem] rounded-tr-[3rem] border-t-2 border-primary bg-surface px-8 py-10 text-center shadow-2xl shadow-black/5 dark:shadow-black/40"
      >
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text/80">{body}</p>
        {action && (
          <button
            type="button"
            onClick={() => navigate(action!.to, { replace: true })}
            className="mt-6 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}