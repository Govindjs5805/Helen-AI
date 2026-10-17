import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase'
import { ThemeToggle } from '@/components/ThemeToggle'

interface Props {
  email: string
  password: string
  onBack: () => void
}

export function VerifyPending({ email, password, onBack }: Props) {
  const [cooldown, setCooldown] = useState(0)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Fallback: quietly retry sign-in. Once the email is verified (even on another
  // device) it succeeds, AuthContext gets the session, and Auth.tsx redirects.
  useEffect(() => {
    if (!password) return
    const check = () => {
      void supabase.auth.signInWithPassword({ email, password })
    }
    const id = window.setInterval(check, 15000)
    window.addEventListener('focus', check)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', check)
    }
  }, [email, password])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  async function resend() {
    if (cooldown > 0 || sending) return
    setSending(true)
    setMessage(null)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/verified` },
    })
    setSending(false)
    setMessage(error ? error.message : 'Verification email sent again.')
    setCooldown(60)
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-background px-6 text-text">
      <header className="absolute right-0 top-0 p-4 sm:p-6">
        <ThemeToggle />
      </header>

      <div className="w-full max-w-md rounded-[2rem] rounded-tr-[3rem] border-t-2 border-primary bg-surface px-8 py-10 text-center shadow-2xl shadow-black/5 dark:shadow-black/40">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
          <span className="font-heading text-xl font-bold leading-none text-white">H</span>
        </div>

        <h1 className="font-heading text-2xl font-bold">Verifying your email…</h1>
        <p className="mt-3 text-sm leading-relaxed text-text/80">
          We sent a verification link to <b>{email}</b>. Click it to continue.
          This page will move on automatically once you verify.
        </p>

        <div className="mt-4 flex justify-center" aria-hidden="true">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>

        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || sending}
          className="mt-6 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : sending ? 'Sending…' : 'Resend email'}
        </button>

        {message && (
          <p role="status" className="mt-3 text-xs text-text/70">{message}</p>
        )}

        <button
          type="button"
          onClick={onBack}
          className="mt-4 text-sm text-text/70 underline-offset-4 hover:text-text hover:underline"
        >
          Back to sign in
        </button>
      </div>
    </div>
  )
}