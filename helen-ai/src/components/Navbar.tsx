import { ThemeToggle } from './ThemeToggle'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/10 bg-surface/80 backdrop-blur-md dark:border-white/10">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="font-heading text-base font-bold text-white">H</span>
          </div>
          <span className="font-heading text-lg font-semibold text-text">Helen AI</span>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  )
}
