import { DocumentSimplifier } from '@/pages/student/DocumentSimplifier'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTheme } from '@/context/ThemeContext'
import type { ThemePresetName } from '@/theme/presets'

const PRESETS: Array<{ value: ThemePresetName; label: string }> = [
  { value: 'dyslexia', label: 'Dyslexia' },
  { value: 'adhd', label: 'ADHD' },
  { value: 'visual_impairment', label: 'Visual impairment' },
  { value: 'hearing_impairment', label: 'Hearing impairment' },
  { value: 'learning_disability', label: 'Learning disability' },
]

export function DocumentSimplifierPreview() {
  const { theme, toggleTheme, activeDisabilityPreset, setActiveDisabilityPreset } = useTheme()

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-text sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 border-b border-text/20 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-primary">INTERNAL QA</p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-text">Document simplifier preview</h1>
            <p className="mt-1 text-sm text-text/70">Sample document only. No upload or API call is made.</p>
          </div>
          <ThemeToggle />
        </header>

        <div className="mb-7 flex flex-wrap items-center gap-2" aria-label="Preview theme controls">
          {PRESETS.map(preset => (
            <button
              key={preset.value}
              type="button"
              aria-pressed={activeDisabilityPreset === preset.value}
              onClick={() => setActiveDisabilityPreset(preset.value)}
              className={`min-h-11 rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeDisabilityPreset === preset.value ? 'border-primary bg-primary text-white' : 'border-text/25 bg-surface text-text'}`}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-11 rounded-md border border-text/25 bg-surface px-3 py-2 text-sm font-medium text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Switch to {theme === 'light' ? 'dark' : 'light'} mode
          </button>
        </div>

        <DocumentSimplifier preview />
      </div>
    </main>
  )
}