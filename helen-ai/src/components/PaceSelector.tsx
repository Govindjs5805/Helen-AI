import type { PreferredPace } from '@/types'

interface PaceSelectorProps {
  value: PreferredPace
  onChange: (pace: PreferredPace) => void
}

const PACES: { value: PreferredPace; label: string; description: string }[] = [
  { value: 'slow', label: 'Take it slow', description: 'I like things explained step-by-step' },
  { value: 'moderate', label: 'Steady pace', description: 'Balance between detail and speed' },
  { value: 'fast', label: 'Move quickly', description: "I'm comfortable skipping the basics" },
]

export function PaceSelector({ value, onChange }: PaceSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Preferred learning pace"
      className="grid gap-3 sm:grid-cols-3"
    >
      {PACES.map(pace => {
        const isSelected = value === pace.value
        return (
          <button
            key={pace.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(pace.value)}
            className={[
              'flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
              isSelected
                ? [
                    'border-primary bg-primary text-white shadow-sm shadow-primary/20',
                  ].join(' ')
                : [
                    'border-black/10 bg-surface text-text hover:border-primary/40',
                    'dark:border-white/15',
                  ].join(' '),
            ].join(' ')}
          >
            <span className="font-heading text-sm font-semibold">{pace.label}</span>
            <span
              className={[
                'text-xs leading-relaxed',
                isSelected ? 'text-white/75' : 'text-text/55',
              ].join(' ')}
            >
              {pace.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}
