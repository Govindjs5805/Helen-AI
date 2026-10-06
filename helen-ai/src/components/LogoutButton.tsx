import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const { logout } = useAuth()
  const [error, setError] = useState('')

  async function handleLogout() {
    setError('')
    const result = await logout()
    if (result.error) setError('Could not log out. Please try again.')
  }

  return (
    <div className={compact ? 'min-w-0' : 'w-full'}>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className={compact
          ? 'flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-text/70 transition-colors hover:bg-red-700/10 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
          : 'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-text/75 transition-colors hover:bg-red-700/10 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'}
      >
        <LogoutIcon className={compact ? 'h-5 w-5' : 'h-5 w-5 shrink-0'} />
        <span className={compact ? 'text-[10px] font-medium' : ''}>Log out</span>
      </button>
      {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  )
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
    </svg>
  )
}
