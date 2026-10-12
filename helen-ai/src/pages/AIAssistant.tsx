import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useReadingTheme } from '@/context/ReadingThemeContext'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'

const API_URL = (import.meta.env.VITE_DOCUMENT_API_URL || 'http://192.168.1.2:8000').replace(/\/$/, '')

interface Message {
  text: string
  sender: 'user' | 'ai'
}

interface SpeechRecognitionResultLike {
  0?: { transcript?: string }
}

interface SpeechRecognitionLike {
  lang: string
  onresult: ((event: { results: ArrayLike<SpeechRecognitionResultLike> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

export function AIAssistant() {
  const { session } = useAuth()
  const { preferences, adhdEnabled, attentionPreferences } = useReadingTheme()
  const speech = useTextToSpeech({ rate: preferences.tts.rate, voice: preferences.tts.voice })
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [checkInEnabled, setCheckInEnabled] = useState(false)
  const [checkInReady, setCheckInReady] = useState(false)

  useEffect(() => {
    if (!checkInEnabled || !adhdEnabled || !attentionPreferences.accountability_prompts) return
    const timeout = window.setTimeout(() => {
      setCheckInReady(true)
      setCheckInEnabled(false)
    }, 10 * 60 * 1000)
    return () => window.clearTimeout(timeout)
  }, [checkInEnabled, adhdEnabled, attentionPreferences.accountability_prompts])

  async function sendMessage(text: string, action: 'answer' | 'simpler' | 'example' | 'one_step' | 'key_point' | 'break_down' | 'help_start' | 'quick_quiz' = 'answer') {
    const message = text.trim()
    if (!message || loading) return
    if (!session?.access_token) {
      setError('Your session expired. Sign in again to talk with your tutor.')
      return
    }

    const priorMessages = messages
    setInput('')
    setError('')
    setLoading(true)
    setMessages(previous => [...previous, { text: message, sender: 'user' }])
    try {
      const response = await fetch(`${API_URL}/ai/tutor`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          action,
          reading_level: preferences.reading_level,
          history: priorMessages.slice(-12).map(item => ({
            role: item.sender === 'user' ? 'user' : 'model',
            text: item.text,
          })),
        }),
      })
      const payload = await response.json().catch(() => ({})) as { reply?: string; detail?: string }
      if (!response.ok) throw new Error(payload.detail || 'Your tutor could not reply. Please try again.')
      if (!payload.reply?.trim()) throw new Error('Your tutor returned an empty reply. Please try again.')
      setMessages(previous => [...previous, { text: payload.reply!, sender: 'ai' }])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The tutor service could not be reached.')
    } finally {
      setLoading(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage(input)
  }

  function startVoiceInput() {
    const browserWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition
    if (!Recognition) {
      setError('Voice input is not available in this browser. You can type your question instead.')
      return
    }
    const recognition = new Recognition()
    recognition.lang = navigator.language
    recognition.onresult = event => setInput(previous => `${previous}${event.results[0]?.[0]?.transcript ?? ''}`.trim())
    recognition.onerror = () => {
      setListening(false)
      setError('Voice input stopped. You can type your question or try again.')
    }
    recognition.onend = () => setListening(false)
    setListening(true)
    setError('')
    recognition.start()
  }

  const quickActions = [
    { label: 'Explain simpler', action: 'simpler' as const },
    { label: 'Give an example', action: 'example' as const },
    { label: 'One step at a time', action: 'one_step' as const },
    ...(adhdEnabled ? [
      { label: 'Break it down', action: 'break_down' as const },
      { label: 'Just the key point', action: 'key_point' as const },
      { label: 'Quiz me quickly', action: 'quick_quiz' as const },
      { label: 'Help me start', action: 'help_start' as const },
    ] : []),
  ]

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 text-text">
      <header>
        <h1 className="font-heading text-2xl font-bold">AI learning tutor</h1>
        <p className="mt-2 text-text/70">Ask in your own words. Spelling does not need to be perfect.</p>
      </header>

      {checkInReady && (
        <p role="status" className="rounded-lg border border-primary/25 bg-primary/5 p-4 text-sm">
          Ten minutes have passed. Would you like to check in, take a break, or keep going?
          <button type="button" onClick={() => setCheckInReady(false)} className="ml-3 min-h-11 underline underline-offset-4">Dismiss</button>
        </p>
      )}

      <section aria-label="Tutor conversation" className="rounded-2xl border border-black/10 bg-surface p-4 sm:p-6 dark:border-white/10">
        <div aria-live="polite" aria-relevant="additions" className="mb-4 max-h-[60vh] min-h-48 space-y-3 overflow-y-auto rounded-lg bg-background p-4">
          {messages.length === 0 ? (
            <p className="text-text/70">Start with a question, topic, or homework problem. Your tutor can explain it in smaller steps.</p>
          ) : messages.map((message, index) => (
            <div key={`${index}-${message.sender}`} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] whitespace-pre-wrap rounded-lg px-4 py-3 ${message.sender === 'user' ? 'bg-primary/10 text-text' : 'bg-text/10 text-text'}`}>
                <p>{message.text}</p>
                {message.sender === 'ai' && speech.supported && preferences.tts.enabled && (
                  <button type="button" onClick={() => speech.speakSegments(message.text.split(/(?<=[.!?])\s+/))} aria-label="Read tutor answer aloud" className="mt-2 min-h-10 rounded-md px-2 text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    {speech.isSpeaking ? 'Read answer aloud' : 'Listen to answer'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && <p role="status" className="text-sm text-text/70">Your tutor is thinking…</p>}
        </div>

        {error && <p role="alert" className="mb-3 rounded-md border border-text/20 bg-background p-3 text-sm">{error}</p>}

        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="tutor-message" className="sr-only">Your question for the tutor</label>
          <input
            id="tutor-message"
            type="text"
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="Ask anything…"
            maxLength={4000}
            className="min-h-12 min-w-0 flex-1 rounded-lg border border-black/10 bg-background px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 dark:border-white/10"
          />
          <button type="button" onClick={startVoiceInput} disabled={listening || loading} aria-label={listening ? 'Listening for your question' : 'Speak your question'} className="min-h-12 rounded-lg border border-primary px-4 py-2 font-semibold text-primary disabled:opacity-60">
            {listening ? 'Listening…' : 'Speak'}
          </button>
          <button type="submit" disabled={loading || !input.trim()} className="min-h-12 rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-primary/90 disabled:opacity-60">Send</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Tutor follow-up prompts">
          {quickActions.map(item => (
            <button key={item.action} type="button" disabled={loading || messages.length === 0} onClick={() => void sendMessage(item.label, item.action)} className="min-h-10 rounded-full border border-text/20 px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">
              {item.label}
            </button>
          ))}
        </div>
        {adhdEnabled && attentionPreferences.accountability_prompts && (
          <label className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={checkInEnabled} onChange={event => {
              setCheckInEnabled(event.target.checked)
              setCheckInReady(false)
            }} className="accent-primary" />
            Ask me to check in after 10 minutes
          </label>
        )}
      </section>
    </main>
  )
}
