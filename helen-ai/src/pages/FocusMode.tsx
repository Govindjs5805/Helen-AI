import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useReadingTheme } from '@/context/ReadingThemeContext'
import { useFocusTimer } from '@/hooks/useFocusTimer'

export function FocusMode() {
  const { session } = useAuth()
  const { attentionPreferences } = useReadingTheme()
  const { timer, remainingSeconds, error, start, pause, resume, finish, startBreak, logEvent } =
    useFocusTimer(session?.user.id, session?.access_token)
  const [taskLabel, setTaskLabel] = useState('')
  const [welcomeBack, setWelcomeBack] = useState(false)
  const [notice, setNotice] = useState('')
  const [showBreak, setShowBreak] = useState(false)
  const finishingRef = useRef(false)
  const hiddenAt = useRef<number | null>(null)

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        hiddenAt.current = Date.now()
        return
      }
      if (hiddenAt.current && Date.now() - hiddenAt.current > 3000) {
        setWelcomeBack(true)
      }
      hiddenAt.current = null
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    if (timer.mode !== 'focus' || remainingSeconds !== 0 || finishingRef.current) return
    finishingRef.current = true
    setShowBreak(true)
    setNotice('Focus session complete. You made time for this task.')
    void finish('completed').finally(() => { finishingRef.current = false })
    if (attentionPreferences.sound_cues) playGentleCue()
  }, [timer.mode, remainingSeconds, finish, attentionPreferences.sound_cues])

  async function handleEvent(event: 'stuck' | 'distracted') {
    await logEvent(event)
    setNotice(event === 'stuck'
      ? 'It is okay to feel stuck. Choose one small next step.'
      : 'Distractions happen. You can return whenever you are ready.')
  }

  const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0')
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0')
  const running = timer.endAt !== null

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-2xl flex-col justify-center py-5 text-text">
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">FOCUS MODE</p>
        <Link to="/dashboard" className="inline-flex min-h-11 items-center rounded-md border border-text/25 px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Exit focus mode
        </Link>
      </div>

      {welcomeBack && (
        <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-surface p-4 text-sm">
          <span>Welcome back. Your task and timer are saved.</span>
          <button type="button" onClick={() => setWelcomeBack(false)} className="min-h-11 rounded-md px-3 font-semibold underline">Dismiss</button>
        </div>
      )}

      {error && <p role="alert" className="mb-4 rounded-md border border-text/20 bg-surface p-3 text-sm">{error}</p>}
      {notice && <p role="status" aria-live="polite" className="mb-4 rounded-md bg-surface p-3 text-sm">{notice}</p>}

      {timer.mode === 'idle' && !showBreak ? (
        <section className="rounded-2xl border border-text/15 bg-surface p-6 sm:p-10">
          <h1 className="font-heading text-3xl font-bold">What is one thing to focus on?</h1>
          <p className="mt-2 text-text/70">A small start is enough. You can pause or leave whenever you want.</p>
          <label className="mt-6 block text-sm font-semibold" htmlFor="focus-task">My task</label>
          <input id="focus-task" value={taskLabel} onChange={event => setTaskLabel(event.target.value)} placeholder="Read question 1" className="mt-2 min-h-12 w-full rounded-md border border-text/25 bg-background px-4 py-3" />
          <button type="button" onClick={() => { setNotice(''); void start(taskLabel.trim() || 'One small task', attentionPreferences.focus_session_minutes) }} className="mt-5 min-h-12 w-full rounded-md bg-primary px-5 py-3 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Start {attentionPreferences.focus_session_minutes}-minute focus session
          </button>
        </section>
      ) : timer.mode === 'focus' ? (
        <section className="rounded-2xl border border-text/15 bg-surface p-6 text-center sm:p-10">
          <p className="text-sm font-semibold text-text/65">ONE THING AT A TIME</p>
          <h1 className="mt-3 font-heading text-2xl font-bold">{timer.taskLabel}</h1>
          <p className="mt-6 font-mono text-6xl font-bold tabular-nums" aria-label={`${minutes} minutes and ${seconds} seconds remaining`} aria-live="off">{minutes}:{seconds}</p>
          <div className="mx-auto mt-6 h-2 max-w-md overflow-hidden rounded-full bg-text/10" role="progressbar" aria-label="Focus session progress" aria-valuemin={0} aria-valuemax={timer.focusTotalSeconds} aria-valuenow={Math.max(0, timer.focusTotalSeconds - remainingSeconds)}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, ((timer.focusTotalSeconds - remainingSeconds) / Math.max(1, timer.focusTotalSeconds)) * 100)}%` }} />
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={running ? pause : resume} className="min-h-11 rounded-md border border-primary px-5 py-2 font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{running ? 'Pause' : 'Resume'}</button>
            <button type="button" onClick={() => void finish('completed').then(() => { setShowBreak(true); setNotice('You made time for this task. Take a break or continue when you choose.') })} className="min-h-11 rounded-md bg-primary px-5 py-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Finish session</button>
            <button type="button" onClick={() => void finish('stopped')} className="min-h-11 rounded-md px-4 py-2 font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">End session</button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3 border-t border-text/10 pt-5">
            <button type="button" onClick={() => void handleEvent('stuck')} className="min-h-11 rounded-md border border-text/20 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">I’m stuck</button>
            <button type="button" onClick={() => void handleEvent('distracted')} className="min-h-11 rounded-md border border-text/20 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">I got distracted</button>
          </div>
        </section>
      ) : timer.mode === 'break' ? (
        <section className="rounded-2xl border border-text/15 bg-surface p-6 text-center sm:p-10">
          <h1 className="font-heading text-3xl font-bold">A short break</h1>
          <p className="mt-3 text-text/75">You could stretch, get a drink of water, or take a few slow breaths.</p>
          <p className="mt-6 font-mono text-5xl font-bold tabular-nums">{minutes}:{seconds}</p>
          <button type="button" onClick={() => void finish('completed')} className="mt-6 min-h-11 rounded-md border border-primary px-5 py-2 font-semibold text-primary">Back to learning</button>
        </section>
      ) : (
        <section className="rounded-2xl border border-text/15 bg-surface p-6 text-center sm:p-10">
          <h1 className="font-heading text-2xl font-bold">You finished a focus session.</h1>
          <p className="mt-2 text-text/70">Choose a short break or return to your next task.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => { setShowBreak(false); startBreak(attentionPreferences.break_minutes) }} className="min-h-11 rounded-md bg-primary px-5 py-2 font-semibold text-white">Take a {attentionPreferences.break_minutes}-minute break</button>
            <button type="button" onClick={() => setShowBreak(false)} className="min-h-11 rounded-md border border-text/25 px-5 py-2 font-semibold">Continue learning</button>
          </div>
        </section>
      )}
    </main>
  )
}

function playGentleCue() {
  try {
    const audio = new AudioContext()
    const oscillator = audio.createOscillator()
    const volume = audio.createGain()
    oscillator.frequency.value = 440
    volume.gain.value = 0.04
    oscillator.connect(volume)
    volume.connect(audio.destination)
    oscillator.start()
    oscillator.stop(audio.currentTime + 0.16)
    oscillator.onended = () => { void audio.close() }
  } catch {
    // Visual completion feedback remains available when Web Audio is unsupported.
  }
}
