import type { AttentionPreferences } from '@/types'

interface AttentionProfileEditorProps {
  preferences: AttentionPreferences
  onChange: (preferences: AttentionPreferences) => void
  onPreset: (preset: 'light' | 'strong' | 'custom') => void
}

export function AttentionProfileEditor({ preferences, onChange, onPreset }: AttentionProfileEditorProps) {
  function update<K extends keyof AttentionPreferences>(key: K, value: AttentionPreferences[K]) {
    onChange({ ...preferences, [key]: value })
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Make it easier to get started</h1>
        <p className="mt-2 text-sm text-text/70">Choose a starting point. You can change any setting later. These supports are options, not rules.</p>
      </header>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Starting point</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onPreset('light')} className="min-h-11 rounded-md border border-primary px-4 py-2 font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Light support</button>
          <button type="button" onClick={() => onPreset('strong')} className="min-h-11 rounded-md border border-primary px-4 py-2 font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Strong focus support</button>
          <button type="button" onClick={() => onPreset('custom')} className="min-h-11 rounded-md border border-text/25 px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Custom</button>
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">What kind of support fits?
          <select value={preferences.presentation} onChange={event => update('presentation', event.target.value as AttentionPreferences['presentation'])} className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2">
            <option value="not_sure">Not sure</option><option value="inattentive">Focus and organization</option><option value="hyperactive_impulsive">Movement and impulse support</option><option value="combined">A combination</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">Content size
          <select value={preferences.chunk_size} onChange={event => update('chunk_size', event.target.value as AttentionPreferences['chunk_size'])} className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2">
            <option value="one_paragraph">One paragraph at a time</option><option value="short_section">A short section at a time</option>
          </select>
        </label>
        <Range label="Focus session" value={preferences.focus_session_minutes} min={5} max={45} suffix=" min" onChange={value => update('focus_session_minutes', value)} />
        <Range label="Break" value={preferences.break_minutes} min={1} max={30} suffix=" min" onChange={value => update('break_minutes', value)} />
        <Range label="Daily focus goal" value={preferences.daily_goal} min={1} max={12} suffix=" sessions" onChange={value => update('daily_goal', value)} />
        <Range label="Weekly focus goal" value={preferences.weekly_goal} min={1} max={50} suffix=" sessions" onChange={value => update('weekly_goal', value)} />
        <label className="space-y-1 text-sm font-medium">Distraction level
          <select value={preferences.distraction_level} onChange={event => update('distraction_level', event.target.value as AttentionPreferences['distraction_level'])} className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2">
            <option value="low">Fewer distractions</option><option value="medium">Balanced</option><option value="high">More stimulation</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">Motivation extras
          <select value={preferences.gamification} onChange={event => update('gamification', event.target.value as AttentionPreferences['gamification'])} className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2">
            <option value="off">Off</option><option value="light">Light encouragement</option><option value="full">Points and badges</option>
          </select>
        </label>
      </div>

      <fieldset className="grid gap-3 rounded-lg border border-text/15 p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">Optional supports</legend>
        <Check label="Gentle in-app reminders" checked={preferences.reminders.enabled} onChange={enabled => update('reminders', { ...preferences.reminders, enabled })} />
        <Check label="Quiet reminders" checked={preferences.reminders.style === 'quiet'} onChange={quiet => update('reminders', { ...preferences.reminders, style: quiet ? 'quiet' : 'gentle' })} />
        <Check label="Reduce motion" checked={preferences.motion === 'reduced'} onChange={reduced => update('motion', reduced ? 'reduced' : 'normal')} />
        <Check label="Soft sound cues (off by default)" checked={preferences.sound_cues} onChange={value => update('sound_cues', value)} />
        <Check label="Calm, quiet interface" checked={preferences.quiet_ui} onChange={value => update('quiet_ui', value)} />
        <Check label="Show the key point first" checked={preferences.tldr_first} onChange={value => update('tldr_first', value)} />
        <Check label="Optional accountability prompts" checked={preferences.accountability_prompts} onChange={value => update('accountability_prompts', value)} />
      </fieldset>

      <section className="rounded-lg border border-text/15 bg-surface p-4" aria-label="Focus preview">
        <h2 className="text-sm font-semibold">A preview of your focus session</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md bg-background p-4">
          <div><p className="font-semibold">One thing at a time</p><p className="mt-1 text-sm text-text/70">Read question 1 and underline what it asks.</p></div>
          <span className="rounded-full border border-primary/30 px-3 py-1 text-sm font-semibold text-primary">{preferences.focus_session_minutes}:00</span>
        </div>
        <p className="mt-2 text-xs text-text/60">Dyslexia settings such as your chosen font and read-aloud remain active alongside focus supports.</p>
      </section>
    </div>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="accent-primary" />{label}</label>
}

function Range({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <label className="space-y-1 text-sm font-medium">
      <span className="flex justify-between gap-2"><span>{label}</span><span aria-live="polite">{value}{suffix}</span></span>
      <input type="range" min={min} max={max} value={value} onChange={event => onChange(Number(event.target.value))} className="w-full accent-primary" />
    </label>
  )
}
