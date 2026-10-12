import { useState, type FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
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
  visual_impairment: 'Screen-reader friendly',
  hearing_impairment: 'Written and explicit',
  motor_impairment: 'No-timer, tap-friendly',
  autism_spectrum: 'Clear and predictable',
  other_learning_disability: 'Plain-language',
  learning_disability: 'Plain-language',
}

export function Notes() {
  const { session } = useAuth()
  const [topic, setTopic] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
          question_count: questionCount,
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
      if (!payload.questions || payload.questions.length !== questionCount) {
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
    }
  }

  const score = quiz
    ? quiz.questions.reduce((total, question, index) => total + (answers[index] === question.answer_index ? 1 : 0), 0)
    : 0

  return (
    <div className="mx-auto w-full max-w-4xl space-y-7 text-text">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Practice & review</p>
        <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">Adaptive quiz generator</h1>
        <p className="mt-2 max-w-2xl text-text/70">
          Create a quiz on any topic. Helen adapts the wording and format to your primary learning profile.
        </p>
      </header>

      <div className="space-y-5 rounded-xl border border-text/15 bg-surface p-5 sm:p-7">
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
          <label htmlFor="quiz-count" className="text-sm font-semibold">Number of questions</label>
          <select
            id="quiz-count"
            value={questionCount}
            onChange={event => setQuestionCount(Number(event.target.value))}
            className="min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-48"
          >
            {[3, 5, 7, 10].map(count => <option key={count} value={count}>{count} questions</option>)}
          </select>
        </div>

        {error && <p role="alert" className="rounded-md border border-red-700/30 bg-background p-3 text-sm">{error}</p>}
        <button
          type="button"
          onClick={() => void generateQuiz()}
          disabled={loading}
          className="min-h-12 w-full rounded-md bg-primary px-5 py-3 font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {loading ? 'Creating your quiz…' : quiz ? 'Generate another quiz' : 'Generate my quiz'}
        </button>
        {loading && <p role="status" aria-live="polite" className="text-sm text-text/70">Building clear, personalized questions…</p>}
      </div>

      {quiz && (
        <section aria-labelledby="quiz-heading" className="space-y-5">
          <header className="rounded-xl border border-primary/25 bg-primary/5 p-5">
            <p className="text-sm font-semibold text-primary">{presetLabels[quiz.preset] || 'Personalized'} quiz</p>
            <h2 id="quiz-heading" className="mt-1 font-heading text-2xl font-bold">{quiz.topic}</h2>
            <p className="mt-1 text-sm text-text/70">
              {quiz.questions.length} multiple-choice questions. No timer—take your time.
            </p>
          </header>

          <form onSubmit={submitAnswers} className="space-y-5">
            {quiz.questions.map((question, questionIndex) => {
              const selected = answers[questionIndex]
              const correct = selected === question.answer_index
              return (
                <fieldset key={`${questionIndex}-${question.question}`} className="space-y-3 rounded-xl border border-text/15 bg-surface p-5 sm:p-6">
                  <legend className="sr-only">Question {questionIndex + 1}</legend>
                  <p className="font-semibold leading-relaxed">
                    <span className="mr-2 text-primary">Question {questionIndex + 1}.</span>
                    {question.question}
                  </p>
                  <div className="space-y-2">
                    {question.choices.map((choice, choiceIndex) => {
                      const isAnswer = choiceIndex === question.answer_index
                      const choiceId = `quiz-${questionIndex}-${choiceIndex}`
                      const choiceStyle = submitted && isAnswer
                        ? 'border-emerald-700/50 bg-emerald-700/10'
                        : submitted && selected === choiceIndex
                          ? 'border-red-700/50 bg-red-700/10'
                          : 'border-text/20 bg-background hover:border-primary/60'
                      return (
                        <label
                          key={choiceId}
                          htmlFor={choiceId}
                          className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-md border p-3 focus-within:ring-2 focus-within:ring-primary ${choiceStyle} ${submitted ? 'cursor-default' : ''}`}
                        >
                          <input
                            id={choiceId}
                            type="radio"
                            name={`quiz-question-${questionIndex}`}
                            value={choiceIndex}
                            checked={selected === choiceIndex}
                            disabled={submitted}
                            onChange={() => setAnswers(previous => ({ ...previous, [questionIndex]: choiceIndex }))}
                            className="mt-1 h-4 w-4 shrink-0 accent-primary"
                          />
                          <span className="leading-relaxed">{choice}</span>
                        </label>
                      )
                    })}
                  </div>
                  {submitted && (
                    <div role="status" className="rounded-md border border-text/10 bg-background p-3 text-sm">
                      <p className="font-semibold">{correct ? 'Correct' : 'Not quite'}</p>
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
