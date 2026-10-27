import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useReadingTheme } from '@/context/ReadingThemeContext'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { apiFetch } from '@/services/api'
import { HelenMascot } from '@/components/adhd/HelenMascot'
import { AdhdDecorations } from '@/components/adhd/AdhdDecorations'
import { ThemeToggle } from '@/components/ThemeToggle'

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
      const response = await apiFetch('/ai/tutor', {
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
    if (input.trim()) {
      void sendMessage(input)
    } else {
      startVoiceInput()
    }
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
    recognition.onresult = event => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      setInput(transcript)
      if (transcript.trim()) {
        void sendMessage(transcript)
      }
    }
    recognition.onerror = () => {
      setListening(false)
      setError('Voice input stopped. You can type your question or try again.')
    }
    recognition.onend = () => setListening(false)
    setListening(true)
    setError('')
    recognition.start()
  }

  const starters = [
    { text: 'Explain this in simpler words', action: 'simpler' as const },
    { text: 'Give me a real-world example', action: 'example' as const },
    { text: 'Break this into small steps', action: 'break_down' as const },
    { text: 'Help me get started', action: 'help_start' as const },
  ]

  return (
    <div className="relative min-h-[calc(100dvh-5rem)] w-full overflow-hidden bg-[#EEF4FC] text-slate-900 transition-colors duration-200 dark:bg-[#070D24] dark:text-white">
      {/* Background 3D & Doodle Decorations */}
      <AdhdDecorations />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col justify-between space-y-5 px-1 py-3 sm:px-0">
        {/* Top Header matching Screen 2 */}
        <header className="flex items-center justify-between px-1">
          <p className="text-sm font-semibold tracking-wide text-slate-500 dark:text-[#8E9EC5]">
            Ask in your own words.
          </p>
          <ThemeToggle />
        </header>

        {checkInReady && (
          <div role="status" className="rounded-2xl border border-blue-400/30 bg-blue-50/80 p-4 text-sm dark:bg-[#0E1A3C]">
            <p>Ten minutes have passed. Would you like to check in, take a break, or keep going?</p>
            <button
              type="button"
              onClick={() => setCheckInReady(false)}
              className="mt-2 text-xs font-bold text-[#2563EB] underline dark:text-[#05FF85]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Conversation or Hero Mascot Screen matching Screen 2 */}
        {messages.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center space-y-6 text-center">
            {/* Cute 3D Helen Mascot with glowing aura */}
            <HelenMascot mood="happy" className="h-48 w-44" waving={true} />

            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Hi, I’m Helen!
              </h1>
              <p className="max-w-xs text-sm font-medium text-slate-500 dark:text-[#8E9EC5]">
                Choose a starter or ask me anything. We can take it one small step at a time.
              </p>
            </div>

            {/* Stacked Starter Buttons matching Screen 2 */}
            <div className="w-full space-y-2.5">
              {starters.map(item => (
                <button
                  key={item.text}
                  type="button"
                  disabled={loading}
                  onClick={() => void sendMessage(item.text, item.action)}
                  className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-transparent bg-[#E8EEFF] px-4 py-3 text-center text-sm font-semibold text-slate-800 transition-all hover:bg-[#DCE6FF] hover:scale-[1.01] active:scale-[0.99] dark:border-blue-400/25 dark:bg-[#0D183A] dark:text-white dark:hover:bg-[#13224E] dark:hover:border-blue-400/40"
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="my-auto max-h-[50vh] space-y-3 overflow-y-auto rounded-3xl border border-blue-500/15 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[#0E1A3C]/90">
            {messages.map((msg, i) => (
              <div
                key={`${i}-${msg.sender}`}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#2563EB] text-white dark:bg-[#05FF85] dark:text-[#060B1E] dark:font-semibold'
                      : 'bg-slate-100 text-slate-800 dark:bg-[#142350] dark:text-slate-100'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.sender === 'ai' && speech.supported && preferences.tts.enabled && (
                    <button
                      type="button"
                      onClick={() => speech.speakSegments(msg.text.split(/(?<=[.!?])\s+/))}
                      className="mt-2 text-xs font-bold underline opacity-80"
                    >
                      {speech.isSpeaking ? 'Reading…' : 'Listen'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <p className="text-center text-xs text-slate-400 dark:text-[#8E9EC5]">
                Helen is thinking…
              </p>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-center text-xs text-rose-400">
            {error}
          </p>
        )}

        {/* Input & Speak Button matching Screen 2 */}
        <form onSubmit={submit} className="space-y-3 pt-2">
          <label htmlFor="tutor-message" className="sr-only">Ask anything</label>
          <div className="relative">
            <input
              id="tutor-message"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-[#0E1A3C] dark:text-white dark:placeholder:text-[#8E9EC5]"
            />
          </div>

          {/* Big Action Button: "Speak" matching UI */}
          <button
            type="submit"
            disabled={loading}
            className="adhd-glow-btn flex min-h-12 w-full items-center justify-center rounded-2xl text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {input.trim() ? (loading ? 'Thinking…' : 'Send') : (listening ? 'Listening…' : 'Speak')}
          </button>
        </form>
      </div>
    </div>
  )
}
