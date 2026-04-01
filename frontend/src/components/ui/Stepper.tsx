import { cn } from '@/utils/cn'

interface Step {
  label: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('max-w-4xl mx-auto mb-12', className)}>
      <div className="flex items-center justify-center">
        <div className="flex items-center">
          {steps.map((step, i) => {
            const isCompleted = i < currentStep
            const isActive = i === currentStep
            const isFuture = i > currentStep
            const stepNumber = i + 1

            return (
              <div key={step.label} className="flex items-center">
                {/* Step circle + label */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                      isCompleted && 'bg-primary text-on-primary',
                      isActive && 'bg-primary text-on-primary ring-4 ring-primary-container/20',
                      isFuture && 'bg-surface-container-highest text-on-surface-variant',
                    )}
                  >
                    {isCompleted ? (
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check
                      </span>
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider mt-2',
                      (isCompleted || isActive) ? 'text-primary' : 'text-on-surface-variant',
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting line (not after last step) */}
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-24 h-[2px] mx-2 -mt-5',
                      i < currentStep ? 'bg-primary' : 'bg-surface-container-highest',
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
