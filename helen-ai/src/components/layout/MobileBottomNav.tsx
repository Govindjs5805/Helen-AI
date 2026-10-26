import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LogoutButton } from '@/components/LogoutButton'
import { BookOpen, Timer } from 'lucide-react'

const NAV_ITEMS = {
  student: [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/ai-assistant', label: 'Assistant', icon: AssistantIcon },
    { href: '/documents', label: 'Documents', icon: DocumentsIcon },
    { href: '/focus', label: 'Focus', icon: Timer },
    { href: '/homework', label: 'Homework help', icon: BookOpen },
    { href: '/notes', label: 'Notes & Quizzes', icon: NotesIcon },
    { href: '/planner', label: 'Daily planner', icon: NotesIcon },
    { href: '/progress', label: 'Progress', icon: ProgressIcon },
  ],
  teacher: [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/classrooms', label: 'Classrooms', icon: ClassroomsIcon },
    { href: '/assignments', label: 'Assign', icon: AssignmentsIcon },
    { href: '/student-progress', label: 'More', icon: ProgressIcon },
  ],
  parent: [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/my-child', label: 'Child', icon: ChildProgressIcon },
  ],
  admin: [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/users', label: 'Users', icon: UsersIcon },
    { href: '/reports', label: 'Reports', icon: ReportsIcon },
  ],
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function AssistantIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 8V4H8"/>
      <rect width="8" height="12" x="3" y="8" rx="2"/>
      <circle cx="9" cy="13" r="1"/>
      <circle cx="15" cy="13" r="1"/>
      <path d="M9 15v2"/>
      <path d="M15 15v2"/>
      <path d="M10 10h4"/>
    </svg>
  )
}

function DocumentsIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function NotesIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z"/>
      <line x1="9" y1="9" x2="15" y2="9"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  )
}

function ProgressIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16"/>
      <path d="M8 17l4-4 4 4 4-4"/>
    </svg>
  )
}

function ClassroomsIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="16" height="12" x="4" y="4" rx="2"/>
      <line x1="4" y1="8" x2="8" y2="8"/>
      <line x1="12" y1="8" x2="16" y2="8"/>
      <line x1="4" y1="12" x2="8" y2="12"/>
      <line x1="12" y1="12" x2="16" y2="12"/>
    </svg>
  )
}

function AssignmentsIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 2 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <line x1="12" y1="9" x2="12" y2="15"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
    </svg>
  )
}

function ChildProgressIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M16 11h.01M8 11h.01"/>
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <line x1="12" y1="11" x2="12" y2="15"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
    </svg>
  )
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  )
}

function OverflowIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="1"/>
      <circle cx="19" cy="12" r="1"/>
      <circle cx="5" cy="12" r="1"/>
    </svg>
  )
}

/**
 * Shows at most `maxVisible` items with a "More" overflow dropdown for the rest.
 * Labels are hidden on very small screens; keep them since we're PWA/app-bound.
 */
export function MobileBottomNav({ maxVisible = 4 }: { maxVisible?: number }) {
  const { profile } = useAuth()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const role = profile?.role || 'student'
  const items = NAV_ITEMS[role as keyof typeof NAV_ITEMS] || NAV_ITEMS.student

  const visible = items.slice(0, maxVisible)
  const overflow = items.slice(maxVisible)

  const activeHref = items.find(i =>
    location.pathname === i.href || (i.href === '/dashboard' && location.pathname === '/dashboard')
  )?.href

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-1 rounded-t-xl border-t border-black/10 bg-surface/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-white/10">
        {visible.map(item => {
          const isActive = activeHref === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text hover:bg-text/10'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-center text-sm font-medium leading-tight">{item.label}</span>
            </Link>
          )
        })}

        {overflow.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen(open => !open)}
              className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-text transition-colors hover:bg-text/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="More navigation items"
              aria-haspopup="true"
              aria-expanded={moreOpen}
            >
              <OverflowIcon className="h-5 w-5" />
              <span className="text-sm font-medium">More</span>
            </button>
            {moreOpen && <div className="absolute bottom-full left-1/2 z-50 mb-2 max-h-[60dvh] w-56 -translate-x-1/2 overflow-y-auto rounded-xl border border-black/10 bg-surface p-2 shadow-lg dark:border-white/10">
              {overflow.map(item => {
                const isActive = activeHref === item.href
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex min-h-11 items-center rounded-md px-3 py-2 text-sm ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text hover:bg-text/10'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <div className="mt-2 border-t border-text/15 pt-2">
                <LogoutButton />
              </div>
            </div>}
          </div>
        )}
      </div>
    </nav>
  )
}