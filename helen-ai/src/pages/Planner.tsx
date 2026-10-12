import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useReadingTheme } from '@/context/ReadingThemeContext'
import { attentionRequest } from '@/services/attentionApi'

interface PlannerItem {
  id: string
  title: string
  estimated_minutes: number
  priority: number
  position: number
  due_date: string
  status: 'todo' | 'done'
}

const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

export function Planner() {
  const { session } = useAuth()
  const { attentionPreferences } = useReadingTheme()
  const [items, setItems] = useState<PlannerItem[]>([])
  const [title, setTitle] = useState('')
  const [minutes, setMinutes] = useState(15)
  const [priority, setPriority] = useState(3)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reminderVisible, setReminderVisible] = useState(false)
  const [reminderSnoozed, setReminderSnoozed] = useState(false)

  const load = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const result = await attentionRequest<{ items: PlannerItem[] }>(`/attention/planner?due_date=${today}`, session.access_token)
      setItems(result.items)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your planner could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!loading && !reminderSnoozed && attentionPreferences.reminders.enabled && items.some(item => item.status === 'todo')) {
      setReminderVisible(true)
    }
  }, [loading, attentionPreferences.reminders.enabled, items, reminderSnoozed])

  useEffect(() => {
    if (!reminderSnoozed) return
    const timeout = window.setTimeout(() => setReminderSnoozed(false), 30 * 60 * 1000)
    return () => window.clearTimeout(timeout)
  }, [reminderSnoozed])

  async function add(event: React.FormEvent) {
    event.preventDefault()
    if (!session?.access_token || !title.trim()) return
    setSaving(true)
    try {
      const result = await attentionRequest<{ item: PlannerItem }>('/attention/planner', session.access_token, {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), estimated_minutes: minutes, priority, due_date: today, position: items.length }),
      })
      setItems(current => [...current, result.item])
      setTitle('')
      setNotice('Added to today. You can change the order any time.')
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your task could not be added.')
    } finally {
      setSaving(false)
    }
  }

  async function updateItem(item: PlannerItem, patch: { status?: 'todo' | 'done'; position?: number }) {
    if (!session?.access_token) return
    const optimistic = { ...item, ...patch }
    setItems(current => current.map(candidate => candidate.id === item.id ? optimistic : candidate))
    try {
      await attentionRequest(`/attention/planner/${item.id}`, session.access_token, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      setError('')
    } catch (caught) {
      setItems(current => current.map(candidate => candidate.id === item.id ? item : candidate))
      setError(caught instanceof Error ? caught.message : 'That planner change could not be saved.')
    }
  }

  async function move(item: PlannerItem, offset: number) {
    const index = items.findIndex(candidate => candidate.id === item.id)
    const target = index + offset
    if (target < 0 || target >= items.length) return
    const other = items[target]
    setItems(current => {
      const next = [...current]
      next[index] = { ...other, position: index }
      next[target] = { ...item, position: target }
      return next
    })
    await Promise.all([
      updateItem(item, { position: target }),
      updateItem(other, { position: index }),
    ])
  }

  const completed = items.filter(item => item.status === 'done').length
  const sessionGoal = Math.max(1, attentionPreferences.daily_goal)

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 text-text">
      <header>
        <p className="text-sm font-semibold text-primary">YOUR PLAN</p>
        <h1 className="mt-1 font-heading text-3xl font-bold">Today, one step at a time</h1>
        <p className="mt-2 text-sm text-text/70">Pick up to three priorities. Estimates are flexible, and you can change your plan.</p>
      </header>
      <section className="rounded-xl border border-text/15 bg-surface p-5">
        <h2 className="font-semibold">Daily progress</h2>
        <p className="mt-1 text-sm text-text/70">{completed} of {items.length} tasks completed · Focus goal: {sessionGoal} sessions</p>
        <progress className="mt-3 h-3 w-full accent-primary" value={completed} max={Math.max(items.length, 1)} aria-label={`${completed} of ${items.length} tasks completed`} />
      </section>
      <form onSubmit={event => void add(event)} className="space-y-3 rounded-xl border border-text/15 bg-surface p-5">
        <h2 className="font-heading text-lg font-semibold">Add a task</h2>
        <label className="block text-sm font-semibold" htmlFor="planner-task">Task
          <input id="planner-task" value={title} onChange={event => setTitle(event.target.value)} required maxLength={180} className="mt-1 min-h-11 w-full rounded-md border border-text/25 bg-background px-3 font-normal" />
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="text-sm font-semibold">Estimated minutes
            <input type="number" min={1} max={480} value={minutes} onChange={event => setMinutes(Number(event.target.value))} className="ml-2 min-h-11 w-24 rounded-md border border-text/25 bg-background px-2 font-normal" />
          </label>
          <label className="text-sm font-semibold">Priority
            <select value={priority} onChange={event => setPriority(Number(event.target.value))} className="ml-2 min-h-11 rounded-md border border-text/25 bg-background px-2 font-normal">
              <option value={1}>Top 1</option><option value={2}>Top 2</option><option value={3}>Top 3 or later</option>
            </select>
          </label>
          <button type="submit" disabled={saving} className="min-h-11 rounded-md bg-primary px-5 py-2 font-semibold text-white disabled:opacity-60">{saving ? 'Adding…' : 'Add to today'}</button>
        </div>
      </form>
      {error && <p role="alert" className="rounded-md border border-text/20 bg-surface p-3 text-sm">{error}</p>}
      {notice && <p role="status" className="text-sm">{notice}</p>}
      {reminderVisible && (
        <aside className="rounded-lg border border-primary/25 bg-primary/5 p-4" aria-label="Gentle reminder">
          <p className="text-sm">A gentle reminder: choose one small next step when you feel ready.</p>
          <button type="button" onClick={() => { setReminderVisible(false); setReminderSnoozed(true) }} className="mt-2 min-h-11 rounded-md px-2 text-sm font-semibold underline underline-offset-4">Snooze this reminder</button>
        </aside>
      )}
      {loading ? <p role="status">Loading today’s plan…</p> : (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-start gap-3 rounded-xl border border-text/15 bg-surface p-4">
              <input type="checkbox" checked={item.status === 'done'} onChange={event => void updateItem(item, { status: event.target.checked ? 'done' : 'todo' })} aria-label={`Mark ${item.title} ${item.status === 'done' ? 'not done' : 'done'}`} className="mt-1 accent-primary" />
              <div className="min-w-0 flex-1">
                <p className={item.status === 'done' ? 'font-semibold line-through opacity-70' : 'font-semibold'}>{item.title}</p>
                <p className="mt-1 text-sm text-text/65">About {item.estimated_minutes} minutes · Priority {item.priority}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" disabled={index === 0} onClick={() => void move(item, -1)} aria-label={`Move ${item.title} earlier`} className="min-h-11 min-w-11 rounded-md border border-text/15 disabled:opacity-40">↑</button>
                <button type="button" disabled={index === items.length - 1} onClick={() => void move(item, 1)} aria-label={`Move ${item.title} later`} className="min-h-11 min-w-11 rounded-md border border-text/15 disabled:opacity-40">↓</button>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="rounded-xl border border-dashed border-text/25 p-6 text-center text-sm text-text/70">Add one small task to begin your plan.</li>}
        </ol>
      )}
      <Link to="/focus" className="inline-flex min-h-11 items-center rounded-md border border-primary px-5 py-2 font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Start focus mode</Link>
    </main>
  )
}
