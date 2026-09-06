import { motion } from 'framer-motion'
import type { AccessibilityNeedType } from '@/types'

interface AccessibilityCardProps {
  value: AccessibilityNeedType
  label: string
  description: string
  selected: boolean
  onToggle: () => void
}

/**
 * A toggleable card representing one accessibility need.
 *
 * Tapping or pressing Enter/Space toggles selection. The selected state is
 * shown with an accent-green border + filled background, plus a small
 * animated check icon — not just a checkbox.
 */
export function AccessibilityCard({
  value,
  label,
  description,
  selected,
  onToggle,
}: AccessibilityCardProps) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      // Tap gives a quick "press" feedback. Hover handled via CSS only on
      // pointer devices so it doesn't distract on touch.
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className={[
        'group relative flex w-full flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        // Selected: filled green background, primary border.
        selected
          ? 'border-primary bg-primary text-white shadow-sm shadow-primary/20'
          : 'border-black/10 bg-surface text-text hover:border-primary/40 dark:border-white/15',
      ].join(' ')}
    >
      {/* Icon + check row */}
      <div className="flex w-full items-start justify-between">
        <NeedIcon need={value} selected={selected} />
        {selected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30"
            aria-hidden
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.span>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="font-heading text-base font-semibold leading-tight">
          {label}
        </p>
        <p
          className={[
            'text-xs leading-relaxed',
            selected ? 'text-white/80' : 'text-text/55',
          ].join(' ')}
        >
          {description}
        </p>
      </div>
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Per-need icons. Single-color, 1.75 stroke — visual consistency matters
// more than literal accuracy here.
// ---------------------------------------------------------------------------

function NeedIcon({
  need,
  selected,
}: {
  need: AccessibilityNeedType
  selected: boolean
}) {
  const color = selected ? 'text-white' : 'text-primary'

  if (need === 'visual_impairment') {
    return (
      <svg
        className={color}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  if (need === 'hearing_impairment') {
    return (
      <svg
        className={color}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1v-6h3v4zM3 19a2 2 0 0 0 2 2h1v-6H3v4z" />
      </svg>
    )
  }
  if (need === 'dyslexia') {
    return (
      <svg
        className={color}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 7h20M2 12h20M2 17h20" />
        <path d="M4 4l16 16" opacity="0.4" />
      </svg>
    )
  }
  if (need === 'adhd') {
    return (
      <svg
        className={color}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7v5l3 2" />
        <path d="M19 5l-2 2M5 19l2-2M5 5l2 2M19 19l-2-2" opacity="0.4" />
      </svg>
    )
  }
  if (need === 'motor_impairment') {
    return (
      <svg
        className={color}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v5" />
        <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6" />
        <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </svg>
    )
  }
  if (need === 'autism_spectrum') {
    return (
      <svg
        className={color}
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" />
        <circle cx="9" cy="11" r="1" fill="currentColor" />
        <circle cx="15" cy="11" r="1" fill="currentColor" />
        <path d="M9 15c.83 1 1.86 1.5 3 1.5s2.17-.5 3-1.5" />
      </svg>
    )
  }
  // other_learning_disability
  return (
    <svg
      className={color}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
