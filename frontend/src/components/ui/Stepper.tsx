import { cn } from '@/utils/cn'

interface Step {
  label: string
  icon: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('max-w-4xl mx-auto mb-12', className)}>
      <div className="flex items-center justify-between w-full relative">
        {/* Background line */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-high -translate-y-1/2 z-0" />

        {steps.map((step, i) => {
          const isCompleted = i < currentStep
          const isActive = i === currentStep
          const isFuture = i > currentStep
          const stepNumber = String(i + 1).padStart(2, '0')

          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center group">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  isCompleted && 'bg-primary text-white',
                  isActive && 'primary-gradient text-white shadow-lg shadow-teal-500/20',
                  isFuture && 'bg-surface-container-highest text-on-surface-variant',
                )}
              >
                {isCompleted ? (
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                ) : (
                  <span className="text-sm font-bold">{stepNumber}</span>
                )}
              </div>
              <span
                className={cn(
                  'absolute top-12 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap',
                  (isCompleted || isActive) && 'text-primary',
                  isFuture && 'text-slate-400',
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
