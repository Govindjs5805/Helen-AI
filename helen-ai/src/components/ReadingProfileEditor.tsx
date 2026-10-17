import { useEffect, useState } from 'react'
import type { ReadingPreferences } from '@/types'

const SAMPLE = 'The curious fox watched the bright moon rise above the quiet forest. It followed a winding path and discovered a small stream.'
const PREVIEW_TINTS: Record<ReadingPreferences['background_tint'], string> = {
  cream: '#fff8e8',
  'pale-yellow': '#fffde7',
  'pale-blue': '#edf6ff',
  'light-gray': '#f2f3f4',
  white: '#ffffff',
  dark: '#151716',
}
const PREVIEW_FONTS: Record<ReadingPreferences['font'], string> = {
  lexend: "'Lexend', Verdana, sans-serif",
  atkinson: "'Atkinson Hyperlegible', Verdana, sans-serif",
  opendyslexic: "'OpenDyslexic', Verdana, sans-serif",
  verdana: 'Verdana, sans-serif',
  system: 'system-ui, sans-serif',
}

interface ReadingProfileEditorProps {
  preferences: ReadingPreferences
  onChange: (preferences: ReadingPreferences) => void
  onPreset: (preset: 'easy' | 'maximum' | 'custom') => void
}

export function ReadingProfileEditor({ preferences, onChange, onPreset }: ReadingProfileEditorProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices())
    updateVoices()
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices)
  }, [])

  const update = <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => {
    onChange({ ...preferences, [key]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Choose what feels comfortable</h2>
        <p className="mt-1 text-sm text-text/70">
          Font preferences are personal, and research on special fonts is mixed. Text size, spacing and line length are adjustable too.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Starting point</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onPreset('easy')} className="min-h-11 rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Easy reading</button>
          <button type="button" onClick={() => onPreset('maximum')} className="min-h-11 rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Max support</button>
          <button type="button" onClick={() => onPreset('custom')} className="min-h-11 rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Custom</button>
          <button type="button" onClick={() => update('font', 'atkinson')} className="min-h-11 rounded-md border border-text/25 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Try 3 styles</button>
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Support level
          <select value={preferences.severity} onChange={event => update('severity', event.target.value as ReadingPreferences['severity'])} className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2">
            <option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Strong support</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Font
          <select value={preferences.font} onChange={event => update('font', event.target.value as ReadingPreferences['font'])} className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2">
            <option value="lexend">Lexend</option><option value="atkinson">Atkinson Hyperlegible</option><option value="opendyslexic">OpenDyslexic</option><option value="verdana">Verdana</option><option value="system">System</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Background tint
          <select value={preferences.background_tint} onChange={event => {
            const background_tint = event.target.value as ReadingPreferences['background_tint']
            onChange({
              ...preferences,
              background_tint,
              text_color: background_tint === 'dark' ? '#f5f5f5' : '#3b3b3b',
            })
          }} className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2">
            <option value="cream">Cream</option><option value="pale-yellow">Pale yellow</option><option value="pale-blue">Pale blue</option><option value="light-gray">Light gray</option><option value="white">White</option><option value="dark">Dark</option>
          </select>
        </label>
        <Range label="Text size" value={preferences.text_scale} min={110} max={200} step={5} suffix="%" onChange={value => update('text_scale', value)} />
        <Range label="Letter spacing" value={preferences.letter_spacing} min={0} max={0.2} step={0.01} suffix=" em" onChange={value => update('letter_spacing', value)} />
        <Range label="Word spacing" value={preferences.word_spacing} min={0} max={0.5} step={0.02} suffix=" em" onChange={value => update('word_spacing', value)} />
        <Range label="Line height" value={preferences.line_height} min={1.4} max={2.2} step={0.05} suffix="" onChange={value => update('line_height', value)} />
        <Range label="Paragraph spacing" value={preferences.paragraph_spacing} min={0.5} max={2} step={0.1} suffix=" em" onChange={value => update('paragraph_spacing', value)} />
        <Range label="Line length" value={preferences.max_line_chars} min={50} max={70} step={1} suffix=" characters" onChange={value => update('max_line_chars', value)} />
        <label className="space-y-1 text-sm font-medium">
          Reading aid
          <select value={preferences.reading_aid} onChange={event => update('reading_aid', event.target.value as ReadingPreferences['reading_aid'])} className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2">
            <option value="none">None</option><option value="ruler">Reading ruler</option><option value="focus-mask">Focus mask</option><option value="syllable-split">Syllable split</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Reading level
          <select value={preferences.reading_level} onChange={event => update('reading_level', event.target.value as ReadingPreferences['reading_level'])} className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2">
            <option value="auto">Automatic</option><option value="grade_4_5">Grade 4–5</option><option value="grade_6_8">Grade 6–8</option><option value="original">Original</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Content layout
          <select value={preferences.density} onChange={event => update('density', event.target.value as ReadingPreferences['density'])} className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2">
            <option value="full">Full text</option><option value="chunked">Chunked</option><option value="bullets">Bullets</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-3 text-sm font-medium">
          Text color
          <input type="color" value={preferences.text_color} onChange={event => update('text_color', event.target.value)} aria-label="Reading text color" className="h-11 w-16 rounded-md border border-text/25 bg-background p-1" />
        </label>
      </div>

      <fieldset className="grid gap-4 rounded-lg border border-text/15 p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">Read aloud</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={preferences.tts.enabled} onChange={event => update('tts', { ...preferences.tts, enabled: event.target.checked })} /> Enable text-to-speech</label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={preferences.tts.word_highlight} onChange={event => update('tts', { ...preferences.tts, word_highlight: event.target.checked })} /> Highlight spoken words</label>
        <Range label="Speech rate" value={preferences.tts.rate} min={0.5} max={1.5} step={0.05} suffix="×" onChange={value => update('tts', { ...preferences.tts, rate: value })} />
        <Range label="Pause between sentences" value={preferences.tts.pause_seconds} min={0} max={3} step={0.1} suffix=" seconds" onChange={value => update('tts', { ...preferences.tts, pause_seconds: value })} />
        <label className="space-y-1 text-sm font-medium">
          Voice
          <select value={preferences.tts.voice} onChange={event => update('tts', { ...preferences.tts, voice: event.target.value })} className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2">
            <option value="">Browser default</option>
            {voices.map(voice => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} ({voice.lang})</option>)}
          </select>
        </label>
      </fieldset>

      <section aria-label="Reading style comparison">
        <h3 className="mb-2 text-sm font-semibold">Preview and compare three styles</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {(['atkinson', 'lexend', 'verdana'] as const).map(font => (
            <button
              key={font}
              type="button"
              onClick={() => update('font', font)}
              aria-pressed={preferences.font === font}
              className="min-w-0 rounded-lg border border-text/20 bg-surface p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ fontFamily: ({ atkinson: "'Atkinson Hyperlegible', Verdana, sans-serif", lexend: "'Lexend', Verdana, sans-serif", verdana: 'Verdana, sans-serif' })[font] }}
            >
              <span className="block text-xs font-semibold capitalize">{font}</span>
              <span className="mt-1 block text-sm">{SAMPLE}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="rounded-lg border border-text/15 p-4" style={{ background: PREVIEW_TINTS[preferences.background_tint], color: preferences.text_color, fontFamily: PREVIEW_FONTS[preferences.font], fontSize: `${preferences.text_scale}%`, letterSpacing: `${preferences.letter_spacing}em`, wordSpacing: `${preferences.word_spacing}em`, lineHeight: preferences.line_height }}>
        <p style={{ maxWidth: `${preferences.max_line_chars}ch` }}>{SAMPLE}</p>
      </div>
    </div>
  )
}

function Range({ label, value, min, max, step, suffix, onChange }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix: string
  onChange: (value: number) => void
}) {
  return (
    <label className="space-y-1 text-sm font-medium">
      <span className="flex justify-between gap-2"><span>{label}</span><span aria-live="polite">{value}{suffix}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className="w-full accent-primary" />
    </label>
  )
}
