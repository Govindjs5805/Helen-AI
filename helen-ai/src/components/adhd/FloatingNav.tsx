import { Link } from 'react-router-dom'

const ITEMS = [
  { label: 'Home', href: '/dashboard', icon: '⌂' },
  { label: 'Tasks', href: '/planner', icon: '✓' },
  { label: 'Timer', href: '/focus', icon: '◷' },
]

export function FloatingNav({ firstName }: { firstName: string }) {
  return (
    <nav aria-label="Main navigation" className="adhd-floating-nav fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex min-h-[68px] max-w-md items-center justify-around rounded-full bg-white px-2 shadow-xl shadow-adhd-navy/15 dark:bg-adhd-surface">
      {ITEMS.map(item => {
        const active = item.label === 'Home'
        return (
          <Link
            key={item.label}
            to={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-12 min-w-16 flex-col items-center justify-center rounded-full px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adhd-navy ${active ? 'bg-adhd-lime text-adhd-ink' : 'text-adhd-ink dark:text-white'}`}
          >
            <span aria-hidden="true" className="text-lg leading-5">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
      <Link
        to="/settings/reading"
        aria-label={`Profile for ${firstName}`}
        className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-adhd-periwinkle font-display text-adhd-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adhd-navy"
      >
        {firstName.charAt(0).toUpperCase()}
      </Link>
    </nav>
  )
}
