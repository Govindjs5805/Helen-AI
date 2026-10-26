import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ThemeToggle } from './ThemeToggle'

interface OnboardingLayoutProps {
  children: ReactNode
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

/**
 * Shared shell for the onboarding wizard.
 * Houses the progress stepper at the top and renders the active step's content.
 *
 * The stepper is intentionally understated — connected segments that fill in
 * with the primary green as steps complete. No big animated bar.
 */
export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  stepLabels,
}: OnboardingLayoutProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#F7FAFF] text-[#030E50] dark:bg-[#07133F] dark:text-[#EEF3FF]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-40 h-72 w-72 rounded-full bg-[#C3D7FC]/35 blur-3xl dark:bg-[#1E3FB2]/20" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-[#2875FB]/10 blur-3xl dark:bg-[#2875FB]/15" />
      {/* Top bar — minimal, no full navbar, just the brand and theme toggle. */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#C3D7FC]/60 bg-white/70 px-5 py-4 backdrop-blur-xl dark:border-[#263F7A] dark:bg-[#0B1A4A]/80 sm:px-8 sm:py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2875FB] shadow-md shadow-[#2875FB]/20">
            <span className="font-heading text-base font-bold leading-none text-white">
              H
            </span>
          </div>
          <span className="font-heading text-base font-semibold text-text sm:text-lg">
            Helen AI
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Progress stepper */}
      <div className="relative z-10 px-5 pt-7 sm:px-8 sm:pt-9">
        <div className="mx-auto w-full max-w-xl">
          <Stepper
            currentStep={currentStep}
            totalSteps={totalSteps}
            labels={stepLabels}
          />
        </div>
      </div>

      {/* Step content */}
      <main className="relative z-10 flex flex-1 items-start justify-center px-5 py-8 sm:px-8 sm:py-12">
        <div className="w-full max-w-2xl rounded-[2rem] border border-[#C3D7FC] bg-white/90 p-6 shadow-[0_24px_70px_rgba(3,14,80,0.12)] backdrop-blur-sm dark:border-[#263F7A] dark:bg-[#0B1A4A]/95 dark:shadow-black/25 sm:p-10">{children}</div>
      </main>
    </div>
  )
}

function Stepper({
  currentStep,
  totalSteps,
  labels,
}: {
  currentStep: number
  totalSteps: number
  labels: string[]
}) {
  return (
    <div>
      {/* Segments */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1
          const isCompleted = stepNumber < currentStep
          const isActive = stepNumber === currentStep

          return (
            <div
              key={i}
              className="flex flex-1 flex-col gap-2"
              aria-current={isActive ? 'step' : undefined}
            >
              <motion.div
                initial={{ scaleX: 0.7, opacity: 0.5 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className={[
                  'h-2 w-full origin-left rounded-full transition-colors duration-300',
                  isCompleted || isActive
                    ? 'bg-[#2875FB] shadow-sm shadow-[#2875FB]/25'
                    : 'bg-[#C3D7FC] dark:bg-white/15',
                ].join(' ')}
              />
              <div className="hidden items-baseline gap-1.5 sm:flex">
                <span
                  className={[
                    'font-heading text-xs font-semibold transition-colors',
                    isCompleted || isActive ? 'text-[#1E3FB2] dark:text-[#C3D7FC]' : 'text-text/40',
                  ].join(' ')}
                >
                  {String(stepNumber).padStart(2, '0')}
                </span>
                <span
                  className={[
                    'text-xs transition-colors',
                    isActive
                      ? 'font-medium text-text'
                      : isCompleted
                      ? 'text-text/70'
                      : 'text-text/40',
                  ].join(' ')}
                >
                  {labels[i]}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
