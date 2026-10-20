import { HelenMascot } from './HelenMascot'

export function AdhdWelcome({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <main className="adhd-welcome relative flex min-h-[100dvh] w-full flex-col items-center justify-between overflow-hidden bg-adhd-navy px-6 py-10 text-white sm:px-10">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <g className="adhd-welcome-decoration">
          <path d="M35 180h115a18 18 0 0 1 18 18v39a18 18 0 0 1-18 18h-61l-20 18v-18H35a18 18 0 0 1-18-18v-39a18 18 0 0 1 18-18Z" fill="#B9F2DC" />
          <text x="42" y="221" fill="#0B1020" fontSize="17" fontWeight="700">Let&apos;s start!</text>
          <path d="m330 115 9 19 21 3-15 15 4 21-19-10-19 10 4-21-15-15 21-3 9-19Z" fill="#C8F169" />
          <text x="298" y="207" fill="#C8F169" fontSize="15" fontWeight="700">Hello!</text>
          <circle cx="335" cy="300" r="9" fill="#F28BDD" />
          <circle cx="367" cy="435" r="6" fill="#F28BDD" />
        </g>
      </svg>
      <h1 className="relative z-10 mt-8 w-full max-w-xl text-left font-display text-4xl font-semibold uppercase leading-[1.08] text-adhd-lime sm:text-6xl">
        Focus feels easier with Helen
      </h1>
      <HelenMascot mood="happy" className="relative z-10 my-8 h-56 w-48 text-adhd-lime sm:h-64 sm:w-56" />
      <button
        type="button"
        onClick={onGetStarted}
        className="relative z-10 min-h-14 w-full max-w-xl rounded-full bg-adhd-lime px-8 text-lg font-bold text-adhd-ink shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-adhd-navy"
      >
        Get started
      </button>
    </main>
  )
}
