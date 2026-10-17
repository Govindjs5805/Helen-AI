import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { attentionRequest } from '@/services/attentionApi'

interface ParkedThought {
  id: string
  content: string
  reviewed_at: string | null
  created_at: string
}

export function ParkedThoughtReview() {
  const { session } = useAuth()
  const [thoughts, setThoughts] = useState<ParkedThought[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const result = await attentionRequest<{ thoughts: ParkedThought[] }>('/attention/parked-thoughts', session.access_token)
      setThoughts(result.thoughts)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Saved thoughts could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])
  useEffect(() => { void load() }, [load])

  async function review(id: string) {
    if (!session?.access_token) return
    try {
      await attentionRequest(`/attention/parked-thoughts/${id}/review`, session.access_token, { method: 'PATCH' })
      setThoughts(current => current.map(thought => thought.id === id ? { ...thought, reviewed_at: new Date().toISOString() } : thought))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'This thought could not be marked reviewed.')
    }
  }

  const due = thoughts.filter(thought => !thought.reviewed_at)
  return (
    <section className="rounded-xl border border-text/15 bg-surface p-5" aria-labelledby="parked-thoughts-heading">
      <h2 id="parked-thoughts-heading" className="font-heading text-xl font-semibold">Thoughts to revisit</h2>
      <p className="mt-1 text-sm text-text/70">Ideas you parked stay here until you decide what to do with them.</p>
      {loading && <p role="status" className="mt-3 text-sm">Loading saved thoughts…</p>}
      {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
      {!loading && due.length === 0 && <p className="mt-3 text-sm text-text/70">Nothing waiting for review right now.</p>}
      <ul className="mt-3 space-y-2">
        {due.map(thought => (
          <li key={thought.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-text/10 bg-background p-3">
            <p className="min-w-0 flex-1 text-sm">{thought.content}</p>
            <button type="button" onClick={() => void review(thought.id)} className="min-h-11 rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary">Mark reviewed</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
