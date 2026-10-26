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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#F7FAFF] px-6 text-[#030E50] dark:bg-[#07133F] dark:text-[#EEF3FF]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-[#C3D7FC]/40 blur-3xl dark:bg-[#1E3FB2]/25" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-1/4 h-56 w-56 rounded-full bg-[#2875FB]/10 blur-3xl" />
      <header className="absolute right-0 top-0 p-4 sm:p-6">
        <ThemeToggle />
      </header>

      <div
        aria-live="polite"
        className="relative z-10 w-full max-w-md rounded-[2rem] rounded-tr-[3rem] border border-[#C3D7FC] border-t-4 border-t-[#2875FB] bg-white px-8 py-10 text-center shadow-[0_24px_70px_rgba(3,14,80,0.14)] dark:border-[#263F7A] dark:bg-[#0B1A4A] dark:shadow-black/40"
      >
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text/80">{body}</p>
        {action && (
          <button
            type="button"
            onClick={() => navigate(action!.to, { replace: true })}
            className="mt-6 w-full rounded-xl bg-[#2875FB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2875FB]/20 transition-all hover:-translate-y-0.5 hover:bg-[#1E3FB2]"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
