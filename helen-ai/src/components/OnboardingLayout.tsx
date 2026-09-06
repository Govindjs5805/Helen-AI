import type { ReactNode } from 'react'
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
    <div className="flex min-h-screen flex-col bg-background text-text">
      {/* Top bar — minimal, no full navbar, just the brand and theme toggle. */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
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
      <div className="px-5 pt-4 sm:px-8 sm:pt-6">
        <div className="mx-auto w-full max-w-xl">
          <Stepper
            currentStep={currentStep}
            totalSteps={totalSteps}
            labels={stepLabels}
          />
        </div>
      </div>

      {/* Step content */}
      <main className="flex flex-1 items-start justify-center px-5 py-8 sm:px-8 sm:py-12">
        <div className="w-full max-w-2xl">{children}</div>
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
              <div
                className={[
                  'h-1.5 w-full rounded-full transition-colors duration-300',
                  isCompleted || isActive
                    ? 'bg-primary'
                    : 'bg-text/15 dark:bg-white/15',
                ].join(' ')}
              />
              <div className="hidden items-baseline gap-1.5 sm:flex">
                <span
                  className={[
                    'font-heading text-xs font-semibold transition-colors',
                    isCompleted || isActive ? 'text-primary' : 'text-text/40',
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
