import { useState } from 'react'
import { DateStrip } from './DateStrip'
import { FloatingNav } from './FloatingNav'
import { HelenMascot } from './HelenMascot'
import { TaskCard, type FocusTask } from './TaskCard'
import { useTheme } from '@/context/ThemeContext'

const TASKS: FocusTask[] = [
  { title: 'Study Math', duration: 25, color: 'lime', label: 'Now' },
  { title: 'Take a break', duration: 5, color: 'pink' },
  { title: 'Revise notes', duration: 15, color: 'periwinkle' },
]

export function AdhdHome({ firstName }: { firstName: string }) {
  const { theme, toggleTheme, calmMode, setCalmMode, themeSaveError } = useTheme()
  const [timeOfDay] = useState(() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  })

  return (
    <div className="adhd-home relative mx-auto min-h-[calc(100dvh-3rem)] w-full max-w-md bg-adhd-screen px-5 pb-32 pt-6 text-adhd-copy sm:rounded-adhd-screen sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold leading-tight">
          Good {timeOfDay}, {firstName}
        </h1>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="min-h-11 min-w-11 rounded-full border border-adhd-outline bg-adhd-surface text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adhd-lime"
        >
          <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-adhd-outline bg-adhd-surface px-4 py-3">
        <span className="text-sm font-semibold">Calm mode</span>
        <button
          type="button"
          role="switch"
          aria-checked={calmMode}
          onClick={() => setCalmMode(!calmMode)}
          className={`relative min-h-11 min-w-[4.5rem] rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adhd-lime ${calmMode ? 'bg-adhd-navy' : 'bg-adhd-outline'}`}
        >
          <span className={`block h-8 w-8 rounded-full bg-white transition-transform ${calmMode ? 'translate-x-7' : 'translate-x-0'}`} />
          <span className="sr-only">{calmMode ? 'Turn off Calm mode' : 'Turn on Calm mode'}</span>
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {themeSaveError || `${theme === 'light' ? 'Light' : 'Dark'} mode enabled.`}
      </p>

      <section aria-label="Dates this week" className="mb-7">
        <DateStrip />
      </section>

      <section aria-labelledby="today-plan-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="today-plan-title" className="font-display text-xl font-semibold">Your next steps</h2>
          {!calmMode && <HelenMascot mood="focus" className="h-14 w-12 text-adhd-ink dark:text-adhd-lime" />}
        </div>
        <div className="adhd-task-deck space-y-[-0.6rem]">
          {TASKS.map(task => <TaskCard key={task.title} task={task} calmMode={calmMode} />)}
        </div>
      </section>
      <FloatingNav firstName={firstName} />
    </div>
  )
}
