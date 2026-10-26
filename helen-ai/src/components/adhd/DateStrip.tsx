import { useMemo, useState } from 'react'

function startOfWeek(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7))
  return result
}

export function DateStrip({ onDateChange }: { onDateChange?: (date: Date) => void }) {
  const today = useMemo(() => new Date(), [])
  const [selected, setSelected] = useState(today.toDateString())
  const days = useMemo(() => {
    const monday = startOfWeek(today)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return date
    })
  }, [today])

  return (
    <div className="adhd-date-strip flex gap-2 overflow-x-auto pb-2" role="list" aria-label="This week">
      {days.map(date => {
        const todayDate = date.toDateString() === today.toDateString()
        const pastDate = date < today && !todayDate
        const selectedDate = date.toDateString() === selected
        const label = `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${date.getDate()}`
        return (
          <div key={date.toISOString()} role="listitem">
            <button
              type="button"
              aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${todayDate ? ', today' : ''}`}
              aria-current={todayDate ? 'date' : undefined}
              aria-pressed={selectedDate}
              onClick={() => {
                setSelected(date.toDateString())
                onDateChange?.(date)
              }}
              className={[
                'min-h-12 min-w-[4.5rem] rounded-full px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                todayDate
                  ? 'bg-primary text-white'
                  : pastDate
                    ? 'bg-adhd-lime text-adhd-ink'
                    : 'bg-adhd-future text-adhd-ink',
                selectedDate && !todayDate ? 'ring-2 ring-primary ring-offset-2' : '',
              ].join(' ')}
            >
              {label}
            </button>
          </div>
        )
      })}
    </div>
  )
}
