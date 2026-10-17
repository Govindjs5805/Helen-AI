import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { attentionRequest } from '@/services/attentionApi'

interface ParentSummary {
  share_id: string
  student_name: string
  focus_summary?: {
    sessions_this_week: number
    completed_sessions: number
    average_focus_minutes: number
  }
  task_progress?: {
    tasks_started_this_week: number
    tasks_completed: number
    tasks_in_progress: number
  }
  accommodations?: {
    focus_session_minutes: number
    break_minutes: number
    chunk_size: string
    distraction_level: string
    quiet_ui: boolean
  }
}

interface TeacherSummary extends ParentSummary {
  shared_at: string
}

export function AttentionInviteRedeem() {
  const { session } = useAuth()
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function redeem(event: React.FormEvent) {
    event.preventDefault()
    if (!session?.access_token || !token.trim()) return
    setBusy(true)
    setMessage('')
    setError('')
    try {
      await attentionRequest('/attention/shares/redeem', session.access_token, {
        method: 'POST', body: JSON.stringify({ token: token.trim() }),
      })
      setToken('')
      setMessage('Invite accepted. The student chose exactly what to share.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'This invite could not be accepted.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={event => void redeem(event)} className="space-y-3 rounded-xl border border-text/15 bg-surface p-5">
      <div>
        <h2 className="font-heading text-lg font-semibold">Accept a student sharing invite</h2>
        <p className="mt-1 text-sm text-text/70">The student’s code is private and expires after 24 hours.</p>
      </div>
      <label htmlFor="attention-invite-code" className="block text-sm font-semibold">One-time invite code
        <input id="attention-invite-code" required minLength={20} maxLength={100} value={token} onChange={event => setToken(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-text/25 bg-background px-3 font-mono font-normal" />
      </label>
      <button type="submit" disabled={busy} className="min-h-11 rounded-md bg-primary px-5 py-2 font-semibold text-white disabled:opacity-60">{busy ? 'Checking invite…' : 'Accept invite'}</button>
      {error && <p role="alert" className="text-sm">{error}</p>}
      {message && <p role="status" className="text-sm">{message}</p>}
    </form>
  )
}

export function ParentAttentionView() {
  const { session } = useAuth()
  const [summaries, setSummaries] = useState<ParentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const result = await attentionRequest<{ summaries: ParentSummary[] }>('/attention/shares/mine', session.access_token)
      setSummaries(result.summaries)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Shared progress could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])
  useEffect(() => { void refresh() }, [refresh])

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 text-text">
      <header>
        <p className="text-sm font-semibold text-primary">FAMILY SUPPORT</p>
        <h1 className="mt-1 font-heading text-3xl font-bold">Shared learning progress</h1>
        <p className="mt-2 text-sm text-text/70">You’ll only see information the student chose to share. This view focuses on supportive progress, not surveillance.</p>
      </header>
      <AttentionInviteRedeem />
      {error && <p role="alert" className="rounded-md border border-text/20 bg-surface p-3 text-sm">{error}</p>}
      {loading && <p role="status" className="text-sm">Loading shared summaries…</p>}
      {!loading && summaries.length === 0 && <p className="rounded-xl border border-dashed border-text/25 bg-surface p-5 text-sm text-text/70">No student has shared an attention summary with this account.</p>}
      <div className="space-y-4">
        {summaries.map(summary => (
          <SummaryCard key={summary.share_id} summary={summary} />
        ))}
      </div>
      <p className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">A gentle reminder: encouragement, choice, and noticing effort can make it easier to begin again.</p>
    </section>
  )
}

export function TeacherAttentionSummary({ studentCode }: { studentCode: string }) {
  const { session } = useAuth()
  const [summary, setSummary] = useState<TeacherSummary | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!session?.access_token || !studentCode) return
    setLoading(true)
    try {
      setSummary(await attentionRequest<TeacherSummary>(
        `/attention/shares/teacher/${encodeURIComponent(studentCode)}`,
        session.access_token,
      ))
      setError('')
    } catch (caught) {
      setSummary(null)
      setError(caught instanceof Error ? caught.message : 'Shared attention information is unavailable.')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, studentCode])
  useEffect(() => { void refresh() }, [refresh])

  if (loading) return <p role="status" className="text-sm text-text/70">Checking student-approved support information…</p>
  if (!summary) return (
    <section className="space-y-3 rounded-xl border border-text/15 bg-surface p-5">
      <h2 className="font-heading text-lg font-semibold">Student-approved attention summary</h2>
      <p className="text-sm text-text/70">{error || 'No summary is available.'}</p>
      <AttentionInviteRedeem />
    </section>
  )
  return <SummaryCard summary={summary} teacher />
}

export function AdminAttentionMetrics() {
  const { session } = useAuth()
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session?.access_token) return
    void attentionRequest<Record<string, number>>('/attention/admin/metrics', session.access_token)
      .then(setMetrics)
      .catch(caught => setError(caught instanceof Error ? caught.message : 'Aggregate metrics are unavailable.'))
  }, [session?.access_token])

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Aggregate ADHD tool usage</h2>
      <p className="text-sm text-text/70">Counts only. No student names, task content, or individual focus data.</p>
      {error && <p role="alert" className="text-sm">{error}</p>}
      {!metrics && !error && <p role="status" className="text-sm">Loading aggregate metrics…</p>}
      {metrics && <dl className="grid gap-3 sm:grid-cols-2">
        {Object.entries(metrics).map(([name, value]) => (
          <div key={name} className="rounded-lg border border-text/15 bg-surface p-4">
            <dt className="text-sm capitalize text-text/65">{name.replaceAll('_', ' ')}</dt>
            <dd className="mt-1 text-2xl font-bold">{value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>}
    </section>
  )
}

function SummaryCard({ summary, teacher = false }: { summary: ParentSummary; teacher?: boolean }) {
  return (
    <article className="space-y-4 rounded-xl border border-text/15 bg-surface p-5">
      <header>
        <h2 className="font-heading text-xl font-semibold">{summary.student_name}’s weekly progress</h2>
        <p className="mt-1 text-sm text-text/65">{teacher ? 'Student consent and classroom roster verified.' : 'Shared by the student.'}</p>
      </header>
      {summary.focus_summary && (
        <section>
          <h3 className="font-semibold">Focus sessions</h3>
          <p className="mt-1 text-sm">{summary.focus_summary.completed_sessions} completed this week · {summary.focus_summary.average_focus_minutes} minute average</p>
        </section>
      )}
      {summary.task_progress && (
        <section>
          <h3 className="font-semibold">Task progress</h3>
          <p className="mt-1 text-sm">{summary.task_progress.tasks_completed} completed · {summary.task_progress.tasks_in_progress} in progress</p>
        </section>
      )}
      {summary.accommodations && (
        <section>
          <h3 className="font-semibold">Student-approved supports</h3>
          <p className="mt-1 text-sm">Focus blocks around {summary.accommodations.focus_session_minutes} minutes, with {summary.accommodations.break_minutes}-minute breaks; content in {summary.accommodations.chunk_size.replaceAll('_', ' ')} chunks.</p>
          {teacher && <p className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">Possible accommodation: offer work in short sections and agree on a manageable focus block.</p>}
        </section>
      )}
      {!teacher && <p className="border-t border-text/10 pt-3 text-sm text-text/70">Try noticing effort and offering a choice about the next small step.</p>}
    </article>
  )
}
