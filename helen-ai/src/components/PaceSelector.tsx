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
              'flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2875FB]/60',
              isSelected
                ? [
                    'border-[#2875FB] bg-[#2875FB] text-white shadow-lg shadow-[#2875FB]/20',
                  ].join(' ')
                : [
                    'border-[#C3D7FC] bg-white text-[#030E50] hover:border-[#2875FB]/60',
                    'dark:border-[#39518f] dark:bg-[#07133F] dark:text-white',
                  ].join(' '),
            ].join(' ')}
          >
            <span className="font-heading text-sm font-semibold">{pace.label}</span>
            <span
              className={[
                'text-xs leading-relaxed',
                 isSelected ? 'text-white/75' : 'text-[#63709A] dark:text-[#C3D7FC]/70',
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
