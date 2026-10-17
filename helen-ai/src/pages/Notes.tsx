import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useReadingTheme } from '@/context/ReadingThemeContext'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { ParkedThoughtReview } from '@/components/ParkedThoughtReview'
import { supabase } from '@/services/supabase'
import { apiFetch } from '@/services/api'

interface QuizQuestion {
  question: string
  choices: string[]
  answer_index: number
  explanation: string
}

interface GeneratedQuiz {
  topic: string
  preset: string
  questions: QuizQuestion[]
}

const presetLabels: Record<string, string> = {
  dyslexia: 'Dyslexia-friendly',
  adhd: 'ADHD-friendly',
  dyslexia_adhd: 'Dyslexia + ADHD friendly',
  visual_impairment: 'Screen-reader friendly',
  hearing_impairment: 'Written and explicit',
  motor_impairment: 'No-timer, tap-friendly',
  autism_spectrum: 'Clear and predictable',
  other_learning_disability: 'Plain-language',
  learning_disability: 'Plain-language',
}

export function Notes() {
  const { session } = useAuth()
  const { preferences, adhdEnabled, attentionPreferences } = useReadingTheme()
  const speech = useTextToSpeech({ rate: preferences.tts.rate, voice: preferences.tts.voice })
  const [topic, setTopic] = useState(() => typeof window === 'undefined' ? '' : sessionStorage.getItem('helen-ai:pending-quiz-topic') ?? '')
  const [sourceText, setSourceText] = useState(() => typeof window === 'undefined' ? '' : sessionStorage.getItem('helen-ai:pending-quiz-source') ?? '')
  const [questionCount, setQuestionCount] = useState(5)
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [revealedQuestions, setRevealedQuestions] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const [activeTab, setActiveTab] = useState<'notes' | 'quiz'>('quiz')
  const [noteId, setNoteId] = useState<string | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteText, setNoteText] = useState('')
  const [noteBusy, setNoteBusy] = useState(false)
  const [noteMessage, setNoteMessage] = useState('')
  const [effortPoints, setEffortPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [gamificationLoaded, setGamificationLoaded] = useState(false)

  useEffect(() => {
    setGamificationLoaded(false)
    if (!session?.user.id) return
    try {
      const saved = localStorage.getItem(`helen-ai-quiz-progress:${session.user.id}`)
      if (saved) {
        const progress = JSON.parse(saved) as { points?: number; rounds?: number }
        setEffortPoints(Number.isFinite(progress.points) ? Math.max(0, progress.points ?? 0) : 0)
        setStreak(Number.isFinite(progress.rounds) ? Math.max(0, progress.rounds ?? 0) : 0)
      } else {
        setEffortPoints(0)
        setStreak(0)
      }
    } catch {
      setError('Practice progress could not be restored on this device.')
    } finally {
      setGamificationLoaded(true)
    }
  }, [session?.user.id])

  useEffect(() => {
    if (!session?.user.id || !gamificationLoaded || !adhdEnabled || attentionPreferences.gamification === 'off') return
    try {
      localStorage.setItem(`helen-ai-quiz-progress:${session.user.id}`, JSON.stringify({ points: effortPoints, rounds: streak }))
    } catch {
      setError('Practice progress is shown for this visit but could not be saved on this device.')
    }
  }, [session?.user.id, gamificationLoaded, adhdEnabled, attentionPreferences.gamification, effortPoints, streak])

  useEffect(() => {
    if (!session?.user.id) return
    const pendingTitle = sessionStorage.getItem('helen-ai:pending-note-title')
    const pendingContent = sessionStorage.getItem('helen-ai:pending-note-content')
    if (pendingContent) {
      setNoteTitle(pendingTitle ?? 'Simplified reading')
      setNoteText(pendingContent)
      setActiveTab('notes')
      sessionStorage.removeItem('helen-ai:pending-note-title')
      sessionStorage.removeItem('helen-ai:pending-note-content')
      return
    }
    let cancelled = false
    void supabase
      .from('student_notes')
      .select('id,title,content')
      .eq('student_id', session.user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (cancelled) return
        if (loadError) {
          setNoteMessage('Saved notes could not be loaded. You can still write a new note.')
          return
        }
        if (data) {
          setNoteId(data.id)
          setNoteTitle(data.title)
          setNoteText(data.content)
        }
      })
    return () => { cancelled = true }
  }, [session?.user.id])

  useEffect(() => {
    sessionStorage.removeItem('helen-ai:pending-quiz-topic')
    sessionStorage.removeItem('helen-ai:pending-quiz-source')
  }, [])

  async function saveNote() {
    if (!session?.user.id) {
      setNoteMessage('Sign in again to save your notes.')
      return
    }
    setNoteBusy(true)
    setNoteMessage('')
    const savedId = noteId ?? crypto.randomUUID()
    const now = new Date().toISOString()
    const { error: saveError } = await supabase.from('student_notes').upsert({
      id: savedId,
      student_id: session.user.id,
      title: noteTitle.trim() || 'My notes',
      content: noteText,
      updated_at: now,
      ...(noteId ? {} : { created_at: now }),
    }, { onConflict: 'id' })
    if (saveError) {
      setNoteMessage('Your notes could not be saved. Check your connection and try again.')
    } else {
      setNoteId(savedId)
      setNoteMessage('Your notes are saved privately.')
    }
    setNoteBusy(false)
  }

  function startDictation() {
    type Recognition = {
      lang: string
      onresult: ((event: { results: ArrayLike<{ 0?: { transcript?: string } }> }) => void) | null
      onerror: (() => void) | null
      onend: (() => void) | null
      start: () => void
    }
    type Constructor = new () => Recognition
    const browserWindow = window as Window & { SpeechRecognition?: Constructor; webkitSpeechRecognition?: Constructor }
    const RecognitionConstructor = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition
    if (!RecognitionConstructor) {
      setNoteMessage('Voice dictation is not available in this browser. You can type or paste your ideas.')
      return
    }
    const recognition = new RecognitionConstructor()
    recognition.lang = navigator.language
    recognition.onresult = event => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? ''
      const command = transcript.toLocaleLowerCase()
      if (command === 'delete last sentence') {
        setNoteText(previous => previous.replace(/(?:^|\s)[^.!?]*[.!?]?\s*$/, '').trim())
      } else if (command.startsWith('new heading ')) {
        setNoteText(previous => `${previous.trim()}${previous.trim() ? '\n\n' : ''}## ${transcript.slice(12).trim()}`)
      } else if (command.startsWith('bullet ')) {
        setNoteText(previous => `${previous.trim()}${previous.trim() ? '\n' : ''}- ${transcript.slice(7).trim()}`)
      } else if (transcript) {
        setNoteText(previous => `${previous.trim()}${previous.trim() ? ' ' : ''}${transcript}`)
      }
      setNoteMessage('')
    }
    recognition.onerror = () => setNoteMessage('Dictation stopped. Your written notes are still here.')
    try {
      recognition.start()
      setNoteMessage('Listening. Say “delete last sentence”, “new heading …”, or “bullet …” to edit by voice.')
    } catch {
      setNoteMessage('Voice dictation could not start. You can continue typing your notes.')
    }
  }

  function structureNotes() {
    const sentences = noteText.split(/(?<=[.!?])\s+/).map(line => line.trim()).filter(Boolean)
    if (!sentences.length) return
    setNoteText(`## ${noteTitle.trim() || 'Key ideas'}\n\n${sentences.map(sentence => `- ${sentence}`).join('\n')}`)
    setNoteMessage('We organized your words into bullets. Review and edit them before saving.')
  }

  function quizFromNotes() {
    setTopic(noteTitle.trim() || 'My notes')
    setSourceText(noteText)
    setActiveTab('quiz')
  }

  function selectAnswerByVoice(questionIndex: number, choices: string[]) {
    type Recognition = {
      lang: string
      onresult: ((event: { results: ArrayLike<{ 0?: { transcript?: string } }> }) => void) | null
      onerror: (() => void) | null
      start: () => void
    }
    type Constructor = new () => Recognition
    const browserWindow = window as Window & { SpeechRecognition?: Constructor; webkitSpeechRecognition?: Constructor }
    const RecognitionConstructor = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition
    if (!RecognitionConstructor) {
      setVoiceError('Voice answers are not available in this browser. Choose an option by tapping it.')
      return
    }
    const recognition = new RecognitionConstructor()
    recognition.lang = navigator.language
    recognition.onresult = event => {
      const spoken = (event.results[0]?.[0]?.transcript ?? '').toLocaleLowerCase().trim()
      const numeric = Number(spoken)
      const index = Number.isInteger(numeric) ? numeric - 1 : choices.findIndex(choice => {
        const normalizedChoice = choice.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim()
        return normalizedChoice && (spoken.includes(normalizedChoice) || normalizedChoice.includes(spoken))
      })
      if (index >= 0 && index < choices.length) {
        setAnswers(previous => ({ ...previous, [questionIndex]: index }))
        if (adhdEnabled) setRevealedQuestions(previous => previous.includes(questionIndex) ? previous : [...previous, questionIndex])
        setVoiceError('')
      } else {
        setVoiceError('I could not match that answer to an option. Try saying the option number or tap an answer.')
      }
    }
    recognition.onerror = () => setVoiceError('Voice input stopped. Please try again or tap an answer.')
    try {
      recognition.start()
      setVoiceError('')
    } catch {
      setVoiceError('Voice input could not start. Please tap an answer instead.')
    }
  }

  async function generateQuiz() {
    if (!topic.trim()) {
      setError('Enter a topic to generate a quiz.')
      return
    }
    if (!session?.access_token) {
      setError('Your session has expired. Sign in again to generate a quiz.')
      return
    }

    setLoading(true)
    setError('')
    setSubmitted(false)
    setQuiz(null)
    setAnswers({})
    setActiveQuestion(0)
    setRevealedQuestions([])
    const requestedCount = adhdEnabled ? 5 : questionCount
    try {
      const response = await apiFetch('/ai/quiz', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          source_text: sourceText.trim(),
          question_count: requestedCount,
        }),
      })
      const payload = await response.json().catch(() => ({})) as {
        detail?: string | { message?: string }
        topic?: string
        preset?: string
        questions?: QuizQuestion[]
      }
      if (!response.ok) {
        const message = typeof payload.detail === 'string'
          ? payload.detail
          : payload.detail?.message
        throw new Error(message || 'The quiz could not be generated. Please try again.')
      }
      if (!payload.questions || payload.questions.length !== requestedCount) {
        throw new Error('The quiz service returned an incomplete quiz. Please try again.')
      }
      setQuiz({
        topic: payload.topic || topic.trim(),
        preset: payload.preset || 'learning_disability',
        questions: payload.questions,
      })
    } catch (caught) {
      setError(caught instanceof Error
        ? caught.message
        : 'The quiz service could not be reached. Check your connection and retry.')
    } finally {
      setLoading(false)
    }
  }

  function submitAnswers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (quiz && Object.keys(answers).length === quiz.questions.length) {
      setSubmitted(true)
      if (adhdEnabled && attentionPreferences.gamification !== 'off') {
        setEffortPoints(points => points + quiz.questions.length)
        setStreak(value => value + 1)
      }
    }
  }

  function finishShortRound() {
    if (!quiz || submitted || Object.keys(answers).length !== quiz.questions.length) return
    setSubmitted(true)
    if (adhdEnabled && attentionPreferences.gamification !== 'off') {
      setEffortPoints(points => points + quiz.questions.length)
      setStreak(value => value + 1)
    }
  }

  const score = quiz
    ? quiz.questions.reduce((total, question, index) => total + (answers[index] === question.answer_index ? 1 : 0), 0)
    : 0

  if (activeTab === 'notes') {
    return (
      <main className="mx-auto w-full max-w-4xl space-y-6 text-text">
        <header>
          <p className="text-sm font-semibold text-primary">YOUR LEARNING SPACE</p>
          <h1 className="mt-1 font-heading text-3xl font-bold">Smart notes</h1>
          <p className="mt-2 text-sm text-text/70">Your own words come first. Helen will never rewrite them without asking.</p>
        </header>
        <div className="flex gap-2 border-b border-text/15 pb-3" role="group" aria-label="Notes and practice">
          <button type="button" aria-pressed="true" className="min-h-11 rounded-md bg-primary px-4 py-2 font-semibold text-white">Notes</button>
          <button type="button" aria-pressed="false" onClick={() => setActiveTab('quiz')} className="min-h-11 rounded-md border border-text/25 px-4 py-2">Quiz</button>
        </div>
        {adhdEnabled && <ParkedThoughtReview />}
        <section className="space-y-4 rounded-xl border border-text/15 bg-surface p-5 sm:p-7">
          <label className="block space-y-1 text-sm font-semibold" htmlFor="note-title">Note title
            <input id="note-title" maxLength={180} value={noteTitle} onChange={event => setNoteTitle(event.target.value)} placeholder="For example, Science lesson" className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </label>
          <label className="block space-y-1 text-sm font-semibold" htmlFor="note-content">Your notes
            <textarea id="note-content" value={noteText} onChange={event => setNoteText(event.target.value)} rows={12} maxLength={50000} spellCheck autoComplete="on" placeholder="Write or dictate your ideas here…" className="w-full resize-y rounded-md border border-text/25 bg-background p-3 font-normal leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </label>
          <p className="text-sm text-text/65">Spelling suggestions are optional. We will not change your words silently.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={startDictation} className="min-h-11 rounded-md border border-primary px-4 py-2 font-semibold text-primary">Dictate notes</button>
            <button type="button" onClick={structureNotes} disabled={!noteText.trim()} className="min-h-11 rounded-md border border-text/25 px-4 py-2 disabled:opacity-50">Organize into bullets</button>
            {speech.supported && preferences.tts.enabled && <button type="button" onClick={() => speech.speakSegments(noteText.split(/(?<=[.!?])\s+/))} disabled={!noteText.trim()} className="min-h-11 rounded-md border border-text/25 px-4 py-2 disabled:opacity-50">Read notes aloud</button>}
            <button type="button" onClick={quizFromNotes} disabled={!noteText.trim()} className="min-h-11 rounded-md border border-text/25 px-4 py-2 disabled:opacity-50">Make a quiz from these notes</button>
            <button type="button" onClick={() => void saveNote()} disabled={noteBusy} className="min-h-11 rounded-md bg-primary px-5 py-2 font-semibold text-white disabled:opacity-60">{noteBusy ? 'Saving…' : 'Save notes'}</button>
          </div>
          {noteMessage && <p role="status" aria-live="polite" className="rounded-md border border-text/15 bg-background p-3 text-sm">{noteMessage}</p>}
        </section>
      </main>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-7 text-text">
      <header>
        <p className="text-sm font-semibold tracking-wide text-primary">Practice &amp; review</p>
        <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">Adaptive quiz generator</h1>
        <p className="mt-2 max-w-2xl text-text/70">
          Create a quiz on any topic. Helen adapts the wording and format to your primary learning profile.
        </p>
        {adhdEnabled && attentionPreferences.gamification !== 'off' && (
          <p className="mt-3 inline-flex rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-sm">
            Practice points: {effortPoints} · Practice rounds: {streak}
          </p>
        )}
      </header>

      <div className="flex gap-2 border-b border-text/15 pb-3" role="group" aria-label="Notes and practice">
        <button type="button" aria-pressed="false" onClick={() => setActiveTab('notes')} className="min-h-11 rounded-md border border-text/25 px-4 py-2">Notes</button>
        <button type="button" aria-pressed="true" className="min-h-11 rounded-md bg-primary px-4 py-2 font-semibold text-white">Quiz</button>
      </div>

      <form onSubmit={generateQuiz} className="space-y-5 rounded-xl border border-text/15 bg-surface p-5 sm:p-7">
        <div className="space-y-1.5">
          <label htmlFor="quiz-topic" className="text-sm font-semibold">What would you like to practice?</label>
          <input
            id="quiz-topic"
            maxLength={180}
            value={topic}
            onChange={event => setTopic(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void generateQuiz()
              }
            }}
            placeholder="e.g. Photosynthesis, fractions, the water cycle"
            className="min-h-12 w-full rounded-md border border-text/25 bg-background px-3 py-2 text-text placeholder:text-text/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="quiz-source" className="text-sm font-semibold">
            Study material <span className="font-normal text-text/60">(optional)</span>
          </label>
          <textarea
            id="quiz-source"
            maxLength={30000}
            rows={6}
            value={sourceText}
            onChange={event => setSourceText(event.target.value)}
            placeholder="Paste notes or a short lesson here. The quiz will be based on this material."
            className="w-full resize-y rounded-md border border-text/25 bg-background p-3 text-text placeholder:text-text/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <p className="text-xs text-text/60">{sourceText.length.toLocaleString()} / 30,000 characters</p>
        </div>

        <div className="space-y-1.5">
          {adhdEnabled
            ? <p className="text-sm font-medium">Short round: 5 questions, one at a time.</p>
            : <>
              <label htmlFor="quiz-count" className="text-sm font-semibold">Number of questions</label>
              <select
                id="quiz-count"
                value={questionCount}
                onChange={event => setQuestionCount(Number(event.target.value))}
                className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-48"
              >
                {[3, 5, 7, 10].map(count => <option key={count} value={count}>{count} questions</option>)}
              </select>
            </>}
        </div>

        {error && <p role="alert" className="rounded-md border border-text/25 bg-background p-3 text-sm">{error}</p>}
        <button
          type="button"
          onClick={() => void generateQuiz()}
          disabled={loading}
          className="min-h-12 w-full rounded-md bg-primary px-5 py-3 font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {loading ? 'Creating your quiz…' : quiz ? 'Generate another quiz' : 'Generate my quiz'}
        </button>
        {loading && <p role="status" aria-live="polite" className="text-sm text-text/70">Building clear, personalized questions…</p>}
      </form>
      {voiceError && <p role="status" className="rounded-md border border-text/20 bg-surface p-3 text-sm">{voiceError}</p>}

      {quiz && (
        <section aria-labelledby="quiz-heading" className="space-y-5">
          <header className="rounded-xl border border-primary/25 bg-primary/5 p-5">
            <p className="text-sm font-semibold text-primary">{presetLabels[quiz.preset] || 'Personalized'} quiz</p>
            <h2 id="quiz-heading" className="mt-1 font-heading text-2xl font-bold">{quiz.topic}</h2>
            <p className="mt-1 text-sm text-text/70">
              {quiz.questions.length} multiple-choice questions. No timer—take your time.
            </p>
            {adhdEnabled && <ol aria-label="Quiz progress" className="mt-4 flex gap-2">
              {quiz.questions.map((_, index) => <li key={index} aria-current={index === activeQuestion && !submitted ? 'step' : undefined} className={`h-3 w-3 rounded-full border border-primary ${index < activeQuestion || submitted ? 'bg-primary' : 'bg-background'}`}><span className="sr-only">Question {index + 1}</span></li>)}
            </ol>}
          </header>

          <form onSubmit={submitAnswers} className="space-y-5">
            {(adhdEnabled && !submitted
              ? [{ question: quiz.questions[activeQuestion], questionIndex: activeQuestion }]
              : quiz.questions.map((question, questionIndex) => ({ question, questionIndex }))
            ).filter(entry => Boolean(entry.question)).map(({ question, questionIndex }) => {
              const selected = answers[questionIndex]
              const correct = selected === question.answer_index
              const feedbackVisible = submitted || (adhdEnabled && revealedQuestions.includes(questionIndex))
              return (
                <fieldset key={`${questionIndex}-${question.question}`} className="space-y-3 rounded-xl border border-text/15 bg-surface p-5 sm:p-6">
                  <legend className="sr-only">Question {questionIndex + 1}</legend>
                  <p className="font-semibold leading-relaxed">
                    <span className="mr-2 text-primary">Question {questionIndex + 1}.</span>
                    {question.question}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {speech.supported && preferences.tts.enabled && <button type="button" onClick={() => speech.speakSegments([question.question])} aria-label={`Read question ${questionIndex + 1} aloud`} className="min-h-10 rounded-md px-2 text-sm font-semibold text-primary underline underline-offset-4">Listen to question</button>}
                    {!submitted && <button type="button" onClick={() => selectAnswerByVoice(questionIndex, question.choices)} className="min-h-10 rounded-md px-2 text-sm font-semibold text-primary underline underline-offset-4">Speak answer</button>}
                  </div>
                  <div className="space-y-2">
                    {question.choices.map((choice, choiceIndex) => {
                      const isAnswer = choiceIndex === question.answer_index
                      const choiceId = `quiz-${questionIndex}-${choiceIndex}`
                      const choiceStyle = feedbackVisible && isAnswer
                        ? 'border-primary/60 bg-primary/10'
                        : feedbackVisible && selected === choiceIndex
                          ? 'border-text/30 bg-text/5'
                          : 'border-text/20 bg-background hover:border-primary/60'
                      return (
                        <div key={choiceId} className={`flex min-h-12 items-start gap-3 rounded-md border p-3 ${choiceStyle}`}>
                          <label htmlFor={choiceId} className={`flex min-w-0 flex-1 cursor-pointer items-start gap-3 focus-within:ring-2 focus-within:ring-primary ${submitted ? 'cursor-default' : ''}`}>
                          <input
                            id={choiceId}
                            type="radio"
                            name={`quiz-question-${questionIndex}`}
                            value={choiceIndex}
                            checked={selected === choiceIndex}
                            disabled={submitted || (adhdEnabled && feedbackVisible)}
                            onChange={() => {
                              setAnswers(previous => ({ ...previous, [questionIndex]: choiceIndex }))
                              if (adhdEnabled) setRevealedQuestions(previous => previous.includes(questionIndex) ? previous : [...previous, questionIndex])
                            }}
                            className="mt-1 h-4 w-4 shrink-0 accent-primary"
                          />
                          <span className="leading-relaxed">{choice}</span>
                          </label>
                          {speech.supported && preferences.tts.enabled && (
                            <button type="button" aria-label={`Read option ${choiceIndex + 1} aloud`} onClick={() => speech.speakSegments([choice])} className="min-h-10 shrink-0 rounded-md px-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Listen</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {feedbackVisible && (
                    <div role="status" className="rounded-md border border-text/10 bg-background p-3 text-sm">
                      <p className="font-semibold">{correct ? 'You got it!' : 'Good effort. Let’s review this idea.'}</p>
                      <p className="mt-1">{question.explanation}</p>
                    </div>
                  )}
                </fieldset>
              )
            })}

            {submitted ? (
              <div role="status" aria-live="polite" className="rounded-xl border border-primary/25 bg-surface p-5">
                <p className="font-heading text-xl font-bold">Your score: {score} out of {quiz.questions.length}</p>
                <p className="mt-1 text-sm text-text/70">Review the explanations above, then generate another quiz whenever you’re ready.</p>
              </div>
            ) : adhdEnabled ? (
              <button
                type="button"
                disabled={!revealedQuestions.includes(activeQuestion)}
                onClick={() => {
                  if (activeQuestion === quiz.questions.length - 1) finishShortRound()
                  else setActiveQuestion(current => current + 1)
                }}
                className="min-h-12 rounded-md bg-primary px-6 py-3 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeQuestion === quiz.questions.length - 1 ? 'Finish this round' : 'Next question'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={Object.keys(answers).length !== quiz.questions.length}
                className="min-h-12 rounded-md bg-primary px-6 py-3 font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Check my answers
              </button>
            )}
          </form>
        </section>
      )}
    </div>
  )
}
