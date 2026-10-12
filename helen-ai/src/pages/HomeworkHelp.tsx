import { useState } from 'react'
import { DocumentSimplifier } from '@/pages/student/DocumentSimplifier'
import { useAuth } from '@/context/AuthContext'
import { useReadingTheme } from '@/context/ReadingThemeContext'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { TaskBreakdownPanel } from '@/components/TaskBreakdownPanel'
import { Link } from 'react-router-dom'

const API_URL = (import.meta.env.VITE_DOCUMENT_API_URL || 'http://192.168.1.2:8000').replace(/\/$/, '')

interface Dictation {
  lang: string
  onresult: ((event: { results: ArrayLike<{ 0?: { transcript?: string } }> }) => void) | null
  onerror: (() => void) | null
  start: () => void
}
type DictationConstructor = new () => Dictation

export function HomeworkHelp() {
  const { session } = useAuth()
  const { preferences } = useReadingTheme()
  const speech = useTextToSpeech({ rate: preferences.tts.rate, voice: preferences.tts.voice })
  const [question, setQuestion] = useState('')
  const [ideas, setIdeas] = useState('')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [plannerOpen, setPlannerOpen] = useState(false)

  function dictateIdeas() {
    const browserWindow = window as Window & { SpeechRecognition?: DictationConstructor; webkitSpeechRecognition?: DictationConstructor }
    const Constructor = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition
    if (!Constructor) {
      setError('Voice input is not available here. You can type your ideas instead.')
      return
    }
    const recognition = new Constructor()
    recognition.lang = navigator.language
    recognition.onresult = event => setIdeas(previous => `${previous.trim()}${previous.trim() ? ' ' : ''}${event.results[0]?.[0]?.transcript ?? ''}`)
    recognition.onerror = () => setError('Dictation stopped. Your existing ideas are still here.')
    try {
      recognition.start()
      setError('')
    } catch {
      setError('Voice input could not start. Type your ideas instead.')
    }
  }

  async function organizeIdeas() {
    if (!session?.access_token) {
      setError('Sign in again to get writing support.')
      return
    }
    if (!question.trim() || !ideas.trim()) {
      setError('Add the homework question and a few of your own ideas first.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/ai/tutor`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Assignment question: ${question.trim()}\n\nMy own ideas:\n${ideas.trim()}`,
          action: 'organize',
          reading_level: preferences.reading_level,
        }),
      })
      const payload = await response.json().catch(() => ({})) as { reply?: string; detail?: string }
      if (!response.ok) throw new Error(payload.detail || 'Writing support is unavailable right now.')
      if (!payload.reply?.trim()) throw new Error('No outline came back. Please try again.')
      setDraft(payload.reply)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not organize your ideas. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 text-text">
      <header>
        <p className="text-sm font-semibold text-primary">HOMEWORK SUPPORT</p>
        <h1 className="mt-1 font-heading text-3xl font-bold">One step at a time</h1>
        <p className="mt-2 max-w-2xl text-sm text-text/70">Read a worksheet as steps, or speak your own ideas and shape them into a draft you can edit.</p>
      </header>

      <section aria-labelledby="worksheet-heading" className="rounded-xl border border-text/15 bg-surface p-4 sm:p-6">
        <h2 id="worksheet-heading" className="mb-4 font-heading text-xl font-semibold">Make a worksheet easier to follow</h2>
        <DocumentSimplifier initialOutputType="step_outline" />
      </section>

      <TaskBreakdownPanel />
      <Link to="/focus" className="inline-flex min-h-11 items-center rounded-md border border-primary px-5 py-2 font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Start a focus session</Link>

      <section aria-labelledby="writing-heading" className="space-y-4 rounded-xl border border-text/15 bg-surface p-5 sm:p-7">
        <div>
          <h2 id="writing-heading" className="font-heading text-xl font-semibold">Writing support</h2>
          <p className="mt-1 text-sm text-text/70">Your ideas stay yours. Helen offers a rough structure, not a finished essay.</p>
        </div>
        <label htmlFor="homework-question" className="block space-y-1 text-sm font-semibold">What is the assignment asking?
          <textarea id="homework-question" value={question} onChange={event => setQuestion(event.target.value)} rows={3} className="w-full resize-y rounded-md border border-text/25 bg-background p-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
        </label>
        <label htmlFor="homework-ideas" className="block space-y-1 text-sm font-semibold">Speak or write your ideas
          <textarea id="homework-ideas" value={ideas} onChange={event => setIdeas(event.target.value)} rows={5} className="w-full resize-y rounded-md border border-text/25 bg-background p-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={dictateIdeas} className="min-h-11 rounded-md border border-primary px-4 py-2 font-semibold text-primary">Speak my ideas</button>
          <button type="button" onClick={() => { setPlannerOpen(value => !value); setError('') }} aria-expanded={plannerOpen} className="min-h-11 rounded-md border border-text/25 px-4 py-2">Essay planner</button>
          <button type="button" onClick={() => void organizeIdeas()} disabled={busy} className="min-h-11 rounded-md bg-primary px-5 py-2 font-semibold text-white disabled:opacity-60">{busy ? 'Organizing your ideas…' : 'Help organize my ideas'}</button>
          {speech.supported && preferences.tts.enabled && draft && <button type="button" onClick={() => speech.speakSegments(draft.split(/(?<=[.!?])\s+/))} className="min-h-11 rounded-md border border-text/25 px-4 py-2">Read draft aloud</button>}
        </div>
        {plannerOpen && (
          <ol className="list-decimal space-y-2 rounded-md border border-text/15 bg-background p-4 pl-10 text-sm">
            <li>What is your main answer to the assignment question?</li>
            <li>What is one reason or example that supports your answer?</li>
            <li>What is another detail you want to include?</li>
            <li>How will you finish by restating your main idea?</li>
          </ol>
        )}
        {error && <p role="alert" className="rounded-md border border-text/20 bg-background p-3 text-sm">{error}</p>}
        {busy && <p role="status" aria-live="polite" className="text-sm text-text/70">Putting your ideas into a clear order…</p>}
        {draft && (
          <label htmlFor="homework-draft" className="block space-y-1 text-sm font-semibold">Your editable rough draft
            <textarea id="homework-draft" value={draft} onChange={event => setDraft(event.target.value)} rows={10} className="w-full resize-y rounded-md border border-text/25 bg-background p-3 font-normal leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </label>
        )}
      </section>
    </main>
  )
}
