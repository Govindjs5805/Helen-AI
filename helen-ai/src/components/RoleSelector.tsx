import type { UserRole } from '@/types'

interface RoleSelectorProps {
  value: UserRole
  onChange: (role: UserRole) => void
}

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'student', label: 'Student', description: 'Learning something new' },
  { value: 'teacher', label: 'Teacher', description: 'Guiding others' },
  { value: 'parent', label: 'Parent', description: 'Supporting a learner' },
]

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div
      role="group"
      className="flex gap-2"
      aria-label="Select your role"
    >
      {ROLES.map(r => {
        const isSelected = value === r.value
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            aria-pressed={isSelected}
            title={r.description}
            className={[
              'flex flex-1 flex-col items-center gap-0.5 rounded-xl border px-3 py-2.5 text-center transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
              isSelected
                ? [
                    'border-primary bg-primary text-white',
                    'shadow-sm shadow-primary/30',
                  ].join(' ')
                : [
                    'border-black/10 bg-background text-text/70',
                    'dark:border-white/15 dark:bg-transparent',
                    'hover:border-primary/40 hover:text-text',
                  ].join(' '),
            ].join(' ')}
          >
            <RoleIcon role={r.value} selected={isSelected} />
            <span className="text-xs font-medium leading-tight">{r.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function RoleIcon({ role, selected }: { role: UserRole; selected: boolean }) {
  const cls = 'transition-colors duration-150'
  if (role === 'student') {
    return selected ? (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
        <path d="M12 13.08l-5 2.73-.85-.46V17l5-2.75 5 2.75v-1.15l-.85.46L12 13.08z" />
      </svg>
    ) : (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    )
  }
  if (role === 'teacher') {
    return selected ? (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21a8.5 8.5 0 0 1 13 0" />
      </svg>
    ) : (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    )
  }
  // parent
  return selected ? (
    <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ) : (
    <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
