export function HelenMascot({
  mood = 'happy',
  className = '',
}: {
  mood?: 'happy' | 'calm' | 'focus'
  className?: string
}) {
  const smile = mood === 'calm' ? 'M43 44 Q50 49 57 44' : 'M42 42 Q50 51 58 42'

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M25 22V17a25 25 0 0 1 50 0v5" stroke="currentColor" strokeWidth="4" />
      <rect x="19" y="18" width="9" height="19" rx="4.5" fill="#F28BDD" stroke="currentColor" strokeWidth="3" />
      <rect x="72" y="18" width="9" height="19" rx="4.5" fill="#F28BDD" stroke="currentColor" strokeWidth="3" />
      <path d="M22 66 10 82m68-16 12 16M38 83l-5 25m29-25 5 25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <rect x="26" y="23" width="48" height="58" rx="16" fill="#C8F169" stroke="currentColor" strokeWidth="3" />
      <circle cx="42" cy="39" r="2.8" fill="#0B1020" />
      <circle cx="58" cy="39" r="2.8" fill="#0B1020" />
      <path d={smile} stroke="#0B1020" strokeWidth="2.5" strokeLinecap="round" />
      {mood === 'focus' && <path d="M35 33h30" stroke="#1E2F9E" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  )
}
