import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { GripVertical, Plus, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { attentionRequest } from '@/services/attentionApi'

export function QuickThoughtCapture() {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const pointerStart = useRef<{ id: number; x: number } | null>(null)
  const dragged = useRef(false)
  const suppressClick = useRef(false)

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

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'mouse') return
    pointerStart.current = { id: event.pointerId, x: event.clientX }
    dragged.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (pointerStart.current?.id !== event.pointerId) return
    const distance = Math.max(0, pointerStart.current.x - event.clientX)
    if (distance > 8) dragged.current = true
    setDragOffset(Math.min(distance, 64))
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (pointerStart.current?.id !== event.pointerId) return
    const distance = Math.max(0, pointerStart.current.x - event.clientX)
    pointerStart.current = null
    setDragOffset(0)
    if (distance >= 44) {
      suppressClick.current = true
      setOpen(true)
      setMessage('')
    } else if (dragged.current) {
      suppressClick.current = true
    }
  }

  function cancelDrag() {
    pointerStart.current = null
    setDragOffset(0)
    if (dragged.current) suppressClick.current = true
  }

  function toggleCapture() {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    setOpen(value => !value)
    setMessage('')
  }

  function closeCapture() {
    setOpen(false)
    setDragOffset(0)
  }

  return (
    <aside
      className={open
        ? 'fixed inset-x-2 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 w-auto md:inset-x-auto md:bottom-6 md:right-6 md:w-[min(22rem,calc(100vw-3rem))]'
        : 'fixed right-0 top-[38%] z-50 w-12 md:inset-x-auto md:bottom-6 md:right-6 md:top-auto md:w-auto'}
      aria-label="Quick thought capture"
    >
      {open && (
        <form onSubmit={event => void save(event)} onKeyDown={event => { if (event.key === 'Escape') closeCapture() }} className="mb-2 max-h-[min(65dvh,32rem)] space-y-3 overflow-y-auto rounded-xl border border-text/20 bg-surface p-4 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="quick-thought" className="block text-base font-semibold">Park this thought</label>
            <button type="button" onClick={closeCapture} aria-label="Close thought capture" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <textarea id="quick-thought" autoFocus value={content} onChange={event => setContent(event.target.value)} maxLength={2000} rows={3} placeholder="Save an idea to come back to later…" className="min-h-24 w-full resize-y rounded-md border border-text/30 bg-background p-3 text-base placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          <div className="flex items-center justify-between gap-2">
            {message && <p role="status" className="text-sm">{message}</p>}
            <button type="submit" disabled={saving || !content.trim()} className="ml-auto min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted disabled:opacity-100">{saving ? 'Saving…' : 'Save for later'}</button>
          </div>
        </form>
      )}
      {!open && (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="quick-thought"
            onClick={toggleCapture}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={cancelDrag}
            style={{ transform: `translateX(-${dragOffset}px)` }}
            className="flex min-h-16 w-12 touch-pan-y flex-col items-center justify-center gap-1 rounded-l-xl border border-r-0 border-primary bg-surface px-1 text-primary shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:hidden"
            aria-label="Swipe left or tap to park a thought"
            title="Swipe left or tap to park a thought"
          >
            <GripVertical className="h-5 w-5" aria-hidden="true" />
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="quick-thought"
            onClick={toggleCapture}
            className="ml-auto hidden min-h-12 items-center gap-2 rounded-full border border-primary bg-surface px-4 py-3 font-semibold text-primary shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Park a thought
          </button>
        </>
      )}
    </aside>
  )
}
