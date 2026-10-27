import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme, hideThemeToggle } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const handleClick = () => {
    if (!isAnimating) {
      setIsAnimating(true)
      toggleTheme()
      setTimeout(() => setIsAnimating(false), prefersReducedMotion ? 0 : 300)
    }
  }

  const isDark = theme === 'dark'

  return (
    <span
      className={`relative inline-flex ${className}`}
      title={hideThemeToggle ? 'Optimized for visual accessibility' : undefined}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={isAnimating || hideThemeToggle}
        className={`relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-[#0E1A3C] dark:text-white dark:hover:bg-[#142350] disabled:cursor-not-allowed disabled:opacity-100 ${className}`}
        aria-label={hideThemeToggle
          ? 'Optimized for visual accessibility'
          : isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="sun"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: 'easeInOut' }}
              className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            >
              <SunIcon />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: 'easeInOut' }}
              className="text-[#2563EB]"
            >
              <MoonIcon />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </span>
  )
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
