import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { attentionRequest } from '@/services/attentionApi'

export function QuickThoughtCapture() {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!session?.access_token || !content.trim()) return
    setSaving(true)
    try {
      await attentionRequest('/attention/parked-thoughts', session.access_token, {
        method: 'POST',
        body: JSON.stringify({ content: content.trim() }),
      })
      setContent('')
      setMessage('Saved for later.')
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'This thought could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <aside className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom)+1rem)] right-4 z-50 w-[min(22rem,calc(100vw-2rem))] md:bottom-6" aria-label="Quick thought capture">
      {open && (
        <form onSubmit={event => void save(event)} onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }} className="mb-2 space-y-3 rounded-xl border border-text/15 bg-surface p-4 shadow-lg">
          <label htmlFor="quick-thought" className="block text-sm font-semibold">Park this thought</label>
          <textarea id="quick-thought" autoFocus value={content} onChange={event => setContent(event.target.value)} maxLength={2000} rows={3} placeholder="Save an idea to come back to later…" className="w-full rounded-md border border-text/25 bg-background p-3 text-sm" />
          <div className="flex items-center justify-between gap-2">
            {message && <p role="status" className="text-sm">{message}</p>}
            <button type="submit" disabled={saving || !content.trim()} className="ml-auto min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted disabled:opacity-100">{saving ? 'Saving…' : 'Save for later'}</button>
          </div>
        </form>
      )}
      <button type="button" aria-expanded={open} aria-controls="quick-thought" onClick={() => { setOpen(value => !value); setMessage('') }} className="ml-auto flex min-h-12 items-center gap-2 rounded-full border border-primary bg-surface px-4 py-3 font-semibold text-primary shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary max-[639px]:h-14 max-[639px]:w-14 max-[639px]:min-w-14 max-[639px]:justify-center max-[639px]:p-0">
        <span aria-hidden="true" className="text-2xl leading-none">+</span>
        <span className="max-[639px]:sr-only">Park a thought</span>
      </button>
    </aside>
  )
}
