export function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-text sm:text-5xl lg:text-6xl">
          Welcome to Helen AI
        </h1>
        <p className="mt-4 max-w-md text-base text-text/70 sm:text-lg">
          Your AI-powered assistant for productivity and creativity.
        </p>
      </div>
      <div className="w-full max-w-2xl space-y-4">
        <div className="rounded-xl border border-black/10 bg-surface p-6 shadow-lg dark:border-white/10">
          <h2 className="font-heading mb-2 text-xl font-semibold text-primary sm:text-2xl">
            Getting Started
          </h2>
          <p className="text-text/70">
            Start building your Helen AI project. The foundation is ready for both web and native Capacitor deployment.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-black/10 bg-surface p-6 dark:border-white/10">
            <h3 className="font-heading mb-2 font-semibold text-primary">Mobile-First</h3>
            <p className="text-sm text-text/70">Built responsive from the ground up for any device size.</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-surface p-6 dark:border-white/10">
            <h3 className="font-heading mb-2 font-semibold text-primary">PWA Ready</h3>
            <p className="text-sm text-text/70">Installable on any device with offline support.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
