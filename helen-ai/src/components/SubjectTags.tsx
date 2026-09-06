import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SubjectTagsProps {
  subjects: string[]
  setSubjects: (v: string[]) => void
  inputValue: string
  setInputValue: (v: string) => void
  onAdd: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  error?: string
}

const SUGGESTED_SUBJECTS = [
  'Math', 'Science', 'English', 'History', 'Geography',
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art',
]

/**
 * Multi-select tag input for subjects. Shows a row of suggestion chips the
 * student can click to add, and a free-text input for custom subjects.
 */
export function SubjectTags({
  subjects,
  setSubjects,
  inputValue,
  setInputValue,
  onAdd,
  onKeyDown,
  error,
}: SubjectTagsProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor="subjects" className="text-sm font-medium text-text">
        What subjects are you studying? <span className="text-red-500">*</span>
      </label>

      {/* Selected tags */}
      <AnimatePresence>
        {subjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 pb-1">
              {subjects.map(s => (
                <motion.span
                  key={s}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setSubjects(subjects.filter(x => x !== s))}
                    aria-label={`Remove ${s}`}
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
                  >
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          id="subjects"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a subject and press Enter"
          aria-invalid={!!error}
          aria-describedby={error ? 'subjects-error' : undefined}
          className={[
            'flex-1 rounded-lg border bg-surface px-4 py-2.5 text-sm text-text transition-colors',
            'placeholder:text-text/40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            error
              ? 'border-red-500/70'
              : 'border-black/10 dark:border-white/15',
          ].join(' ')}
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!inputValue.trim()}
          className={[
            'rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary transition-colors',
            'hover:bg-primary hover:text-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            'disabled:cursor-not-allowed disabled:opacity-50',
          ].join(' ')}
        >
          Add
        </button>
      </div>

      {error && (
        <p id="subjects-error" role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}

      {/* Suggestion chips */}
      <SuggestedSubjects
        alreadyAdded={subjects}
        onAdd={s => {
          if (!subjects.includes(s)) setSubjects([...subjects, s])
        }}
      />
    </div>
  )
}

function SuggestedSubjects({
  alreadyAdded,
  onAdd,
}: {
  alreadyAdded: string[]
  onAdd: (s: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? SUGGESTED_SUBJECTS : SUGGESTED_SUBJECTS.slice(0, 6)

  return (
    <div className="pt-1">
      <p className="mb-1.5 text-xs text-text/50">Or pick from common ones:</p>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(s => {
          const isAdded = alreadyAdded.includes(s)
          return (
            <button
              key={s}
              type="button"
              onClick={() => onAdd(s)}
              disabled={isAdded}
              className={[
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                isAdded
                  ? 'border-primary/30 bg-primary/10 text-primary/60'
                  : 'border-black/10 bg-background text-text/70 hover:border-primary/40 hover:text-primary dark:border-white/15',
              ].join(' ')}
            >
              {isAdded ? `✓ ${s}` : `+ ${s}`}
            </button>
          )
        })}
        {SUGGESTED_SUBJECTS.length > 6 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded-full px-3 py-1 text-xs font-medium text-text/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            {expanded ? 'Show less' : `+${SUGGESTED_SUBJECTS.length - 6} more`}
          </button>
        )}
      </div>
    </div>
  )
}
