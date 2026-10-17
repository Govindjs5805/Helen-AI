import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTaskBreakdown, type LearningTask } from '@/hooks/useTaskBreakdown'

export function TaskBreakdownPanel() {
  const { session } = useAuth()
  const { tasks, loading, saving, error, create, update } = useTaskBreakdown(session?.access_token)
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    try {
      await create(title.trim(), instructions.trim())
      setTitle('')
      setInstructions('')
      setNotice('Your checklist is ready. Start with the first small step.')
    } catch {
      setNotice('')
    }
  }

  async function toggle(task: LearningTask, stepId: string, checked: boolean) {
    const steps = task.steps.map(step => step.id === stepId ? { ...step, done: checked } : step)
    try {
      await update(task, steps)
      setNotice(steps.every(step => step.done) ? 'You finished this checklist. Nice work making progress.' : '')
    } catch {
      setNotice('')
    }
  }

  return (
    <section className="space-y-5 rounded-xl border border-text/15 bg-surface p-5 sm:p-7" aria-labelledby="task-breakdown-title">
      <header>
        <h2 id="task-breakdown-title" className="font-heading text-xl font-semibold">Break a task into small steps</h2>
        <p className="mt-1 text-sm text-text/70">The first step is designed to be easy to start. You stay in control of the work.</p>
      </header>
      <form onSubmit={event => void submit(event)} className="space-y-3">
        <label className="block text-sm font-semibold" htmlFor="breakdown-title">Task name
          <input id="breakdown-title" value={title} onChange={event => setTitle(event.target.value)} required maxLength={180} className="mt-1 min-h-11 w-full rounded-md border border-text/25 bg-background px-3 py-2 font-normal" />
        </label>
        <label className="block text-sm font-semibold" htmlFor="breakdown-instructions">Instructions (optional)
          <textarea id="breakdown-instructions" value={instructions} onChange={event => setInstructions(event.target.value)} rows={3} maxLength={30000} className="mt-1 w-full rounded-md border border-text/25 bg-background p-3 font-normal" />
        </label>
        <button type="submit" disabled={saving} className="min-h-11 rounded-md bg-primary px-5 py-2 font-semibold text-white disabled:opacity-60">{saving ? 'Making your steps…' : 'Make my checklist'}</button>
      </form>
      {error && <p role="alert" className="rounded-md border border-text/20 p-3 text-sm">{error}</p>}
      {notice && <p role="status" aria-live="polite" className="text-sm">{notice}</p>}
      {loading && <p role="status" className="text-sm text-text/70">Loading saved checklists…</p>}
      {tasks.map(task => (
        <article key={task.id} className="rounded-lg border border-text/15 bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">{task.title}</h3>
            <span className="text-sm text-text/65">About {task.estimated_minutes} minutes</span>
          </div>
          <ol className="mt-3 space-y-2">
            {task.steps.map((step, index) => (
              <li key={step.id}>
                <label className="flex min-h-11 items-start gap-3 rounded-md p-2 hover:bg-surface">
                  <input type="checkbox" checked={step.done} onChange={event => void toggle(task, step.id, event.target.checked)} className="mt-1 accent-primary" />
                  <span className="text-sm"><span className="font-semibold">{index === 0 ? 'First small step: ' : ''}</span>{step.text}<span className="ml-2 whitespace-nowrap text-xs text-text/55">{step.estimated_minutes} min</span></span>
                </label>
              </li>
            ))}
          </ol>
          {task.status === 'done' && <p className="mt-2 text-sm font-semibold text-primary">Checklist complete</p>}
        </article>
      ))}
    </section>
  )
}
