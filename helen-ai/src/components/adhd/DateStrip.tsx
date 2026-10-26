import { useMemo, useState } from 'react'

function startOfWeek(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7))
  return result
}

export function DateStrip({ onDateChange }: { onDateChange?: (date: Date) => void }) {
  const today = useMemo(() => new Date(), [])
  const [selectedDateStr, setSelectedDateStr] = useState(today.toDateString())

  const days = useMemo(() => {
    const monday = startOfWeek(today)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return date
    })
  }, [today])

  const selectedIndex = days.findIndex(d => d.toDateString() === selectedDateStr)
  const trackPosition = Math.max(0, selectedIndex >= 0 ? selectedIndex : 0)

  return (
    <div className="space-y-2.5">
      <div
        className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none"
        role="list"
        aria-label="Dates this week"
      >
        {days.map(date => {
          const isToday = date.toDateString() === today.toDateString()
          const isSelected = date.toDateString() === selectedDateStr
          const weekday = date.toLocaleDateString(undefined, { weekday: 'short' })
          const dayNum = date.getDate()

          return (
            <div key={date.toISOString()} role="listitem" className="shrink-0">
              <button
                type="button"
                aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${isToday ? ', today' : ''}`}
                aria-current={isToday ? 'date' : undefined}
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedDateStr(date.toDateString())
                  onDateChange?.(date)
                }}
                className={`flex min-h-[4rem] min-w-[4.25rem] flex-col items-center justify-center rounded-2xl px-3 py-2 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'scale-[1.03] bg-[#2563EB] text-white font-bold shadow-[0_4px_16px_rgba(37,99,235,0.35)] dark:bg-[#05FF85] dark:text-[#060B1E] dark:shadow-[0_0_20px_rgba(5,255,133,0.45)]'
                    : 'bg-[#E8EEFF] text-[#1E293B] hover:bg-[#DCE6FF] dark:bg-[#0F1B3E] dark:text-[#8E9EC5] dark:border dark:border-white/5 dark:hover:bg-[#142350]'
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  {weekday}
                </span>
                <span className="text-lg font-bold leading-tight">
                  {dayNum}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Track Slider underneath matching UI mockup */}
      <div className="relative mx-1 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out bg-[#2563EB] dark:bg-[#05FF85] dark:shadow-[0_0_10px_rgba(5,255,133,0.7)]"
          style={{
            width: '14.28%',
            transform: `translateX(${trackPosition * 100}%)`,
          }}
        />
      </div>
    </div>
  )
}
