import { useState, type CSSProperties } from 'react'
import { getThemeTokens, type ThemePresetName } from '@/theme/presets'
import type { Theme } from '@/types'

const PRESET_OPTIONS: Array<{ value: ThemePresetName | null; label: string }> = [
  { value: null, label: 'Default' },
  { value: 'dyslexia', label: 'Dyslexia' },
  { value: 'adhd', label: 'ADHD' },
  { value: 'visual_impairment', label: 'Visual impairment' },
  { value: 'hearing_impairment', label: 'Hearing impairment' },
  { value: 'learning_disability', label: 'Learning disability' },
]

export function ThemePreview() {
  const [preset, setPreset] = useState<ThemePresetName | null>(null)
  const [theme, setTheme] = useState<Theme>('light')
  const tokens = getThemeTokens(preset, theme)
  const pageStyle = {
    '--color-background': tokens.colors.background,
    '--color-surface': tokens.colors.surface,
    '--color-text': tokens.colors.text,
    '--color-primary': tokens.colors.primary,
    '--color-accent': tokens.colors.accent,
    '--font-family': tokens.font.family,
    '--font-heading': tokens.font.family,
    '--font-size-multiplier': tokens.font.sizeMultiplier,
    '--font-letter-spacing': tokens.font.letterSpacing,
    '--font-line-height': tokens.font.lineHeight,
  } as CSSProperties
  const primaryText = preset === 'visual_impairment'
    ? '#000000'
    : theme === 'dark' ? '#0B120D' : '#FFFFFF'

  return (
    <main
      className="min-h-screen bg-background px-5 py-8 text-text sm:px-8"
      data-profile={preset ?? 'default'}
      data-theme={theme}
      style={{
        ...pageStyle,
        fontFamily: tokens.font.family,
        fontSize: `calc(16px * ${tokens.font.sizeMultiplier})`,
        letterSpacing: tokens.font.letterSpacing,
        lineHeight: tokens.font.lineHeight,
      }}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="font-heading text-2xl font-bold text-text sm:text-3xl">
            Theme preview
          </h1>
          <p className="mt-2 text-sm text-text/70">
            {preset ? PRESET_OPTIONS.find(option => option.value === preset)?.label : 'Default'}
            {' · '}{theme} mode
            {tokens.layout.forcesOwnContrast ? ' · fixed high contrast' : ''}
          </p>
        </header>

        <section aria-label="Preset" className="space-y-3">
          <h2 className="text-sm font-semibold text-text">Preset</h2>
          <div className="flex flex-wrap gap-2">
            {PRESET_OPTIONS.map(option => (
              <button
                key={option.label}
                type="button"
                aria-pressed={preset === option.value}
                onClick={() => setPreset(option.value)}
                className="min-h-11 rounded-md border border-text/25 px-3 py-2 text-sm font-medium text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={preset === option.value
                  ? { backgroundColor: 'var(--color-primary)', color: primaryText }
                  : { backgroundColor: 'var(--color-surface)' }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Color mode" className="space-y-3">
          <h2 className="text-sm font-semibold text-text">Light / dark</h2>
          <div className="inline-flex rounded-md border border-text/25 p-1">
            {(['light', 'dark'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                aria-pressed={theme === mode}
                onClick={() => setTheme(mode)}
                className="min-h-10 rounded px-4 py-2 text-sm font-medium capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={theme === mode
                  ? { backgroundColor: 'var(--color-primary)', color: primaryText }
                  : { color: 'var(--color-text)' }}
              >
                {mode}
              </button>
            ))}
          </div>
          {tokens.layout.forcesOwnContrast && (
            <p role="status" className="text-sm text-text">
              Optimized for visual accessibility. Both settings show the same fixed contrast.
            </p>
          )}
        </section>

        <section
          aria-label="Sample theme"
          className="max-w-xl rounded-lg border border-text/20 bg-surface p-6"
        >
          <p className="text-xs font-semibold uppercase text-primary">Helen AI</p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-text">
            A clear place to begin
          </h2>
          <p className="mt-3 text-text">
            Your learning space adapts its colors, type size, spacing, and interaction support.
          </p>
          <button
            type="button"
            className="mt-5 min-h-11 rounded-md px-5 py-2 text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-primary)', color: primaryText }}
          >
            Start learning
          </button>
        </section>

        <section aria-label="Roster and student ID preview" className="space-y-4">
          <h2 className="font-heading text-xl font-semibold text-text">
            Roster and ID readability
          </h2>
          <div className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text">Your Student ID</h3>
              <p className="mt-1 font-mono text-lg font-semibold text-primary">HAI-2026-0001</p>
              <p className="text-sm text-text/70">Share this ID with your teacher.</p>
            </div>
            <button
              type="button"
              className="min-h-11 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary"
            >
              Copy ID
            </button>
          </div>

          <form className="grid gap-3 rounded-lg border border-text/20 bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="space-y-1.5 text-sm font-medium text-text">
              <span>Add student by Student ID</span>
              <input
                value="HAI-2026-0001"
                readOnly
                className="min-h-11 w-full rounded-md border border-text/30 bg-background px-3 py-2 font-mono text-text"
              />
            </label>
            <button
              type="button"
              className="min-h-11 rounded-md px-5 py-2 text-sm font-semibold"
              style={{ backgroundColor: 'var(--color-primary)', color: primaryText }}
            >
              Add student
            </button>
          </form>

          <div className="overflow-x-auto rounded-lg border border-text/25 bg-surface">
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              <thead className="bg-background">
                <tr>
                  <th className="border-b border-text/25 px-4 py-3">Student</th>
                  <th className="border-b border-text/25 px-4 py-3">Student ID</th>
                  <th className="border-b border-text/25 px-4 py-3">Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b border-text/15 px-4 py-3">Alex Morgan</td>
                  <td className="border-b border-text/15 px-4 py-3 font-mono">HAI-2026-0001</td>
                  <td className="border-b border-text/15 px-4 py-3">
                    <a href="#preview" className="font-medium text-primary underline underline-offset-4">
                      View progress
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold">Background</dt><dd>{tokens.colors.background}</dd></div>
          <div><dt className="font-semibold">Text</dt><dd>{tokens.colors.text}</dd></div>
          <div><dt className="font-semibold">Font</dt><dd>{tokens.font.family}</dd></div>
          <div><dt className="font-semibold">Layout flags</dt><dd>{Object.entries(tokens.layout).filter(([, enabled]) => enabled).map(([key]) => key).join(', ') || 'None'}</dd></div>
        </dl>
      </div>
    </main>
  )
}