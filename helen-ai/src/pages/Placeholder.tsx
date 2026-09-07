interface PlaceholderProps {
  title: string
  description: string
  icon?: string
}

export function Placeholder({ title, description, icon = '🚧' }: PlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-text">{title}</h1>
      <p className="mt-2 text-text/70">{description}</p>

      <div className="mt-6 rounded-2xl border border-black/10 bg-surface p-12 text-center dark:border-white/10">
        <div className="text-6xl mb-4" aria-hidden="true">{icon}</div>
        <p className="text-text/60">{title} is coming soon</p>
      </div>
    </div>
  )
}