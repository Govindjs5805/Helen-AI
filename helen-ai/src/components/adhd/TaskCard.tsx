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
  completed = false,
  onToggleComplete,
}: {
  task: FocusTask
  calmMode: boolean
  completed?: boolean
  onToggleComplete?: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="group relative flex overflow-visible rounded-3xl transition-all duration-200">
      {/* Main card body */}
      <div className="relative flex-1 rounded-3xl border border-blue-500/15 bg-white p-5 shadow-sm transition-all dark:border-white/10 dark:bg-[#0E1A3C] dark:shadow-md">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded={expanded}
          onClick={() => setExpanded(val => !val)}
        >
          <div className="min-w-0 flex-1">
            {task.label && (
              <span className="mb-1.5 inline-block rounded-full bg-[#05FF85]/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#05FF85] dark:bg-[#05FF85]/20 dark:text-[#05FF85]">
                {task.label}
              </span>
            )}
            <h3 className={`font-display text-lg font-bold leading-snug text-slate-900 dark:text-white ${completed ? 'line-through opacity-60' : ''}`}>
              {task.title}
            </h3>
            <span className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-[#142350] dark:text-[#8E9EC5]">
              {completed ? 'Done' : `${task.duration} min`}
            </span>
          </div>

          {!calmMode && (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-[#142350]"
            >
              <span className="h-3 w-3 rounded-full bg-[#2563EB] dark:bg-[#05FF85]" />
            </span>
          )}
        </button>

        {/* Collapsible Action Shelf */}
        {expanded && (
          <div className="mt-4 flex flex-wrap gap-2.5 border-t border-slate-100 pt-4 dark:border-white/10">
            <Link
              to={`/focus?task=${encodeURIComponent(task.title)}`}
              className="inline-flex min-h-10 items-center rounded-full bg-[#2563EB] px-4 text-xs font-bold text-white transition-all hover:bg-[#1D4ED8] dark:bg-[#05FF85] dark:text-[#060B1E] dark:hover:bg-[#26ff95] dark:shadow-[0_0_15px_rgba(5,255,133,0.35)]"
            >
              {completed ? 'Refocus on this' : 'Start focus timer'}
            </Link>
            {onToggleComplete && (
              <button
                type="button"
                onClick={onToggleComplete}
                className="inline-flex min-h-10 items-center rounded-full border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
              >
                {completed ? 'Mark not done' : 'Mark complete'}
              </button>
            )}
            <Link
              to="/planner"
              className="inline-flex min-h-10 items-center rounded-full border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
            >
              Break into steps
            </Link>
          </div>
        )}
      </div>

      {/* Attached Right Side Button Badge matching design */}
      <div className="ml-2 flex items-center">
        <Link
          to="/planner"
          title="Add or manage tasks"
          className="flex h-12 w-10 flex-col items-center justify-center rounded-2xl bg-[#2563EB] font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95 dark:bg-[#05FF85] dark:text-[#060B1E] dark:shadow-[0_0_15px_rgba(5,255,133,0.35)]"
        >
          <span className="text-xl leading-none">+</span>
        </Link>
      </div>
    </article>
  )
}
