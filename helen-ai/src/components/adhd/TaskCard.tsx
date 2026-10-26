import { useState } from 'react'
import { Link } from 'react-router-dom'

export interface FocusTask {
  title: string
  duration: number
  color: 'lime' | 'pink' | 'periwinkle'
  label?: string
}

export function TaskCard({
  task,
  calmMode,
}: {
  task: FocusTask
  calmMode: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const tone = {
    lime: 'bg-adhd-lime text-adhd-ink',
    pink: 'bg-adhd-pink text-adhd-ink',
    periwinkle: 'bg-adhd-periwinkle text-adhd-ink',
  }[task.color]

  return (
    <article className={`adhd-task-card relative ${tone} ${task.label ? 'adhd-task-card-current' : ''}`}>
      <button
        type="button"
        className="flex min-h-[104px] w-full items-center justify-between gap-4 rounded-adhd-card px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-adhd-navy"
        aria-expanded={expanded}
        onClick={() => setExpanded(value => !value)}
      >
        <span>
          {task.label && <span className="mb-1 block text-xs font-bold tracking-wide">{task.label}</span>}
          <span className="block font-display text-xl font-semibold leading-tight">{task.title}</span>
          <span className="mt-2 inline-flex min-h-7 items-center rounded-full bg-surface px-3 text-xs font-semibold text-text">
            {task.duration} min
          </span>
        </span>
        {!calmMode && (
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-adhd-ink/20 bg-surface">
            <span className="h-5 w-5 rounded-full bg-primary/80" />
          </span>
        )}
        <span className="sr-only">{expanded ? 'Collapse task' : 'Expand task'}</span>
      </button>
      {expanded && (
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          <Link
            to="/focus"
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Start focus timer
          </Link>
          <Link
            to="/planner"
            className="inline-flex min-h-11 items-center rounded-full border-2 border-adhd-ink/30 px-4 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Break it into steps
          </Link>
        </div>
      )}
    </article>
  )
}
