import { useState } from 'react'
import { ReadingProfileEditor } from '@/components/ReadingProfileEditor'
import { AttentionProfileEditor } from '@/components/AttentionProfileEditor'
import { AttentionSharingSettings } from '@/components/AttentionSharingSettings'
import {
  DEFAULT_ATTENTION_PREFERENCES,
  DEFAULT_READING_PREFERENCES,
  useReadingTheme,
} from '@/context/ReadingThemeContext'

export function ReadingSettings() {
  const {
    preferences, savePreferences, setPreferences, error, dyslexiaEnabled,
    attentionPreferences, setAttentionPreferences, saveAttentionPreferences, adhdEnabled,
  } = useReadingTheme()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function preset(name: 'easy' | 'maximum' | 'custom') {
    if (name === 'easy') setPreferences({ ...DEFAULT_READING_PREFERENCES, severity: 'mild', text_scale: 110, letter_spacing: 0.02, line_height: 1.6, background_tint: 'white', density: 'full' })
    if (name === 'maximum') setPreferences({ ...DEFAULT_READING_PREFERENCES, severity: 'severe', text_scale: 150, letter_spacing: 0.08, word_spacing: 0.2, line_height: 1.9, paragraph_spacing: 1.5, max_line_chars: 55, reading_aid: 'ruler', density: 'chunked' })
    if (name === 'custom') setMessage('Adjust any control to make this profile your own.')
  }

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      await Promise.all([savePreferences(preferences), saveAttentionPreferences(attentionPreferences)])
      setMessage('Your accessibility profiles are saved.')
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Could not save your reading profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 text-text">
      <header>
        <p className="text-sm font-semibold text-primary">ACCESSIBILITY SETTINGS</p>
        <h1 className="mt-1 font-heading text-3xl font-bold">Reading profile</h1>
        <p className="mt-2 text-sm text-text/70">
          {dyslexiaEnabled || adhdEnabled ? 'Your choices apply across Helen AI.' : 'These preferences are saved for your account and take effect when the related support is enabled.'}
        </p>
      </header>
      {error && <p role="alert" className="rounded-md border border-text/20 bg-surface p-3 text-sm">{error}</p>}
      <section className="space-y-6 rounded-xl border border-text/15 bg-surface p-5 sm:p-7">
        <h2 className="font-heading text-xl font-bold">Reading profile</h2>
        <ReadingProfileEditor preferences={preferences} onChange={setPreferences} onPreset={preset} />
      </section>
      <section className="space-y-6 rounded-xl border border-text/15 bg-surface p-5 sm:p-7">
        <h2 className="font-heading text-xl font-bold">Attention profile</h2>
        <AttentionProfileEditor preferences={attentionPreferences} onChange={setAttentionPreferences} onPreset={name => {
          if (name === 'light') setAttentionPreferences({ ...DEFAULT_ATTENTION_PREFERENCES, focus_session_minutes: 20, gamification: 'light' })
          if (name === 'strong') setAttentionPreferences({ ...DEFAULT_ATTENTION_PREFERENCES, focus_session_minutes: 10, distraction_level: 'high', quiet_ui: true })
          if (name === 'custom') setMessage('Adjust any control to make this profile your own.')
        }} />
      </section>
      {adhdEnabled && <AttentionSharingSettings />}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => {
          setPreferences(DEFAULT_READING_PREFERENCES)
          setAttentionPreferences(DEFAULT_ATTENTION_PREFERENCES)
          setMessage('Defaults restored. Save to keep this change.')
        }} className="min-h-11 rounded-md border border-text/25 px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Reset all to defaults</button>
        <button type="button" onClick={() => void save()} disabled={saving} className="min-h-11 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60">{saving ? 'Saving…' : 'Save settings'}</button>
        {message && <p role="status" aria-live="polite" className="text-sm">{message}</p>}
      </div>
    </main>
  )
}
