import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LogoutButton } from '@/components/LogoutButton'
import {
  BookOpen,
  Bot,
  CalendarDays,
  ChartNoAxesCombined,
  Files,
  House,
  NotebookPen,
  SlidersHorizontal,
  Timer,
} from 'lucide-react'

// Local cn helper (no external utility dep needed)
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

const NAV_ITEMS = {
  student: [
    { href: '/dashboard', label: 'Home', icon: House },
    { href: '/ai-assistant', label: 'AI Assistant', icon: Bot },
    { href: '/documents', label: 'Documents', icon: Files },
    { href: '/homework', label: 'Homework help', icon: BookOpen },
    { href: '/planner', label: 'Daily planner', icon: CalendarDays },
    { href: '/focus', label: 'Focus mode', icon: Timer },
    { href: '/notes', label: 'Notes & Quizzes', icon: NotebookPen },
    { href: '/progress', label: 'Progress', icon: ChartNoAxesCombined },
    { href: '/settings/reading', label: 'Accessibility settings', icon: SlidersHorizontal },
  ],
  teacher: [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/classrooms', label: 'Classrooms', icon: ClassroomsIcon },
    { href: '/assignments', label: 'Assignments', icon: AssignmentsIcon },
    { href: '/student-progress', label: 'Student Progress', icon: StudentProgressIcon },
  ],
  parent: [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/my-child', label: "My Child's Progress", icon: ChildProgressIcon },
  ],
  admin: [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/users', label: 'Users', icon: UsersIcon },
    { href: '/reports', label: 'Reports', icon: ReportsIcon },
  ],
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function ClassroomsIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 2 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <line x1="12" y1="9" x2="12" y2="15"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
    </svg>
  )
}

function StudentProgressIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16"/>
      <line x1="9" y1="9" x2="15" y2="9"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  )
}

function ChildProgressIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" y="7" r="4"/>
      <path d="M16 11h.01M8 11h.01"/>
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="12" y="7" r="4"/>
      <line x1="12" y1="11" x2="12" y2="15"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
    </svg>
  )
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile } = useAuth()
  const location = useLocation()
  const prefersReducedMotion = useReducedMotion()
  const role = profile?.role || 'student'
  const items = NAV_ITEMS[role as keyof typeof NAV_ITEMS] || NAV_ITEMS.student

  const handleLinkClick = () => {
    onClose()
  }

  return (
    <aside
      className={cn(
        'group/sidebar fixed inset-y-0 left-0 z-40 w-72 shrink-0 transform border-r border-black/10 bg-surface transition-[width,transform] duration-300 ease-in-out dark:border-white/10 md:w-16 md:group-hover/sidebar:w-72 md:group-focus-within/sidebar:w-72 lg:w-72',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0 md:static md:inset-auto'
      )}
      aria-label="Main navigation"
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-black/10 px-4 dark:border-white/10 md:justify-center md:px-2 md:group-hover/sidebar:px-4 lg:justify-center lg:px-4">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="" className="h-9 w-9 rounded-lg object-cover" />
            <span className="hidden font-heading text-lg font-semibold text-text md:group-hover/sidebar:block lg:block">Helen AI</span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-md hover:bg-text/10"
            aria-label="Close navigation"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 md:px-2 md:group-hover/sidebar:px-4 lg:px-4">
          <ul className="space-y-1">
            <AnimatePresence mode="wait">
              {items.map((item, index) => {
                const isActive = location.pathname === item.href ||
                  (item.href === '/dashboard' && location.pathname === '/dashboard')

                return (
                  <motion.li
                    key={item.href}
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : index * 0.05, duration: prefersReducedMotion ? 0 : 0.2 }}
                  >
                    <Link
                      to={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        'group relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium md:justify-center md:px-0 md:group-hover/sidebar:justify-start md:group-hover/sidebar:px-3 lg:justify-start lg:px-3',
                        'transition-all duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-text/70 hover:bg-text/10 hover:text-text'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={item.label}
                      title={item.label}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5 flex-shrink-0',
                          isActive ? 'text-primary' : 'text-text/60 group-hover:text-text'
                        )}
                      />
                      <span className="hidden truncate md:group-hover/sidebar:inline lg:inline">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-primary"
                          initial={false}
                          transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </nav>

        {/* User info & theme toggle */}
        <div className="hidden border-t border-black/10 px-4 py-4 dark:border-white/10 md:group-hover/sidebar:block lg:block">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-text">
                {profile?.full_name || profile?.email}
              </p>
              <p className="text-xs text-text/60 capitalize">{role}</p>
            </div>
          </div>
          <ThemeToggle className="w-full" />
          <div className="mt-2">
            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
  )
}