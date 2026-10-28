import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LogoutButton } from '@/components/LogoutButton'
import { ThemeToggle } from '@/components/ThemeToggle'
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function AssistantIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

function DocumentsIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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
    </svg>
  )
}

function AssignmentsIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    </svg>
  )
}

function ChildProgressIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
    </svg>
  )
}

function OverflowIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  )
}

export function MobileBottomNav({ maxVisible = 4 }: { maxVisible?: number }) {
  const { profile } = useAuth()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const role = profile?.role || 'student'
  const items = NAV_ITEMS[role as keyof typeof NAV_ITEMS] || NAV_ITEMS.student

  // On phones the sidebar footer is hidden, so teachers need a visible More
  // menu for their profile, theme toggle, and logout action.
  const visibleCount = role === 'teacher' ? Math.min(3, maxVisible) : maxVisible
  const visible = items.slice(0, visibleCount)
  const overflow = items.slice(visibleCount)

  const activeHref = items.find(i =>
    location.pathname === i.href || (i.href === '/dashboard' && location.pathname === '/')
  )?.href

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      aria-label="Mobile navigation"
    >
      {/* Liquid Wavy Scalloped Top Edge matching design */}
      <div className="relative mx-auto max-w-lg">
        {/* Floating Bubble Droplets in Light Mode */}
        <div className="pointer-events-none absolute -top-3.5 left-0 right-0 flex justify-around px-8 text-blue-400/50 dark:hidden">
          <span className="h-1.5 w-1.5 -translate-y-1 rounded-full bg-current" />
          <span className="h-2 w-2 translate-y-0.5 rounded-full bg-current" />
          <span className="h-1 w-1 -translate-y-2 rounded-full bg-current" />
          <span className="h-2.5 w-2.5 -translate-y-0.5 rounded-full bg-current" />
          <span className="h-1.5 w-1.5 -translate-y-1.5 rounded-full bg-current" />
        </div>

        {/* Wavy SVG Border */}
        <svg
          viewBox="0 0 500 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none absolute -top-5 left-0 right-0 h-6 w-full text-white drop-shadow-[0_-3px_6px_rgba(0,0,0,0.03)] dark:text-[#0A1435] dark:drop-shadow-[0_-4px_10px_rgba(0,0,0,0.4)]"
          preserveAspectRatio="none"
        >
          <path
            d="M 0,16 C 25,6 35,6 50,16 C 65,26 85,26 100,16 C 115,6 135,6 150,16 C 165,26 185,26 200,16 C 215,6 235,6 250,16 C 265,26 285,26 300,16 C 315,6 335,6 350,16 C 365,26 385,26 400,16 C 415,6 435,6 450,16 C 465,26 485,26 500,16 L 500,24 L 0,24 Z"
            fill="currentColor"
          />
        </svg>

        {/* Navigation Content Bar */}
        <div className="flex items-center justify-between gap-1 bg-white px-3 pt-1.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-6px_25px_rgba(0,0,0,0.08)] dark:bg-[#0A1435] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
          {visible.map(item => {
            const isActive = activeHref === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'text-[#2563EB] font-bold dark:text-blue-300'
                    : 'text-slate-400 hover:text-slate-700 dark:text-[#7A8BB5] dark:hover:text-white'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-400/15 dark:shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    : ''
                }`}>
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-center text-[11px] font-semibold leading-tight">
                  {item.label}
                </span>
              </Link>
            )
          })}

          {overflow.length > 0 && (
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setMoreOpen(open => !open)}
                className={`flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-[#7A8BB5] dark:hover:text-white`}
                aria-label="More navigation items"
                aria-haspopup="true"
                aria-expanded={moreOpen}
              >
                <div className="flex h-9 w-9 items-center justify-center">
                  <OverflowIcon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold">More</span>
              </button>

              {moreOpen && (
                <div className="absolute bottom-full right-0 z-50 mb-4 max-h-[70dvh] w-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#0E1A3C]">
                  {role === 'teacher' && (
                    <div className="mb-2 flex items-center gap-3 rounded-xl bg-blue-50 p-3 dark:bg-blue-500/10">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        {(profile?.full_name || profile?.email || 'T').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {profile?.full_name || 'Teacher'}
                        </p>
                        <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                          {profile?.email || ''}
                        </p>
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Teacher account</p>
                      </div>
                    </div>
                  )}
                  {overflow.map(item => {
                    const isActive = activeHref === item.href
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-[#2563EB] dark:bg-[#142350] dark:text-blue-300'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 px-2 pt-2 dark:border-white/10">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Theme</span>
                    <ThemeToggle />
                  </div>
                  <div className="mt-2 border-t border-slate-100 pt-2 dark:border-white/10">
                    <LogoutButton />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
