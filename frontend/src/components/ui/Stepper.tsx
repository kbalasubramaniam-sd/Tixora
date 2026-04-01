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
    <div className={cn('max-w-4xl mx-auto mb-16', className)}>
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-highest -translate-y-1/2 z-0" />

        {steps.map((step, i) => {
          const isCompleted = i < currentStep
          const isActive = i === currentStep
          const isFuture = i > currentStep

          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white',
                  isCompleted && 'bg-primary text-white',
                  isActive && 'bg-primary-container text-white shadow-[0_0_15px_rgba(35,162,163,0.4)]',
                  isFuture && 'bg-surface-container-highest text-on-surface-variant',
                )}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={isCompleted || isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {isCompleted ? 'check' : step.icon}
                </span>
              </div>
              <span
                className={cn(
                  'absolute -bottom-7 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap',
                  isCompleted && 'text-primary',
                  isActive && 'text-primary',
                  isFuture && 'text-on-surface-variant/50',
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
