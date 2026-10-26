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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#F7FAFF] px-6 text-[#030E50] dark:bg-[#07133F] dark:text-[#EEF3FF]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-[#C3D7FC]/40 blur-3xl dark:bg-[#1E3FB2]/25" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-1/4 h-56 w-56 rounded-full bg-[#2875FB]/10 blur-3xl" />
      <header className="absolute right-0 top-0 p-4 sm:p-6">
        <ThemeToggle />
      </header>

      <div className="relative z-10 w-full max-w-md rounded-[2rem] rounded-tr-[3rem] border border-[#C3D7FC] border-t-4 border-t-[#2875FB] bg-white px-8 py-10 text-center shadow-[0_24px_70px_rgba(3,14,80,0.14)] dark:border-[#263F7A] dark:bg-[#0B1A4A] dark:shadow-black/40">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2875FB] shadow-lg shadow-[#2875FB]/20">
          <span className="font-heading text-xl font-bold leading-none text-white">H</span>
        </div>

        <h1 className="font-heading text-2xl font-bold">Verifying your email…</h1>
        <p className="mt-3 text-sm leading-relaxed text-text/80">
          We sent a verification link to <b>{email}</b>. Click it to continue.
          This page will move on automatically once you verify.
        </p>

        <div className="mt-4 flex justify-center" aria-hidden="true">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#2875FB] border-t-transparent" />
        </div>

        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || sending}
          className="mt-6 w-full rounded-xl bg-[#2875FB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2875FB]/20 transition-all hover:-translate-y-0.5 hover:bg-[#1E3FB2] disabled:cursor-not-allowed disabled:opacity-60"
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
