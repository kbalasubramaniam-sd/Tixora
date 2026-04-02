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
    <div className={cn('max-w-5xl mx-auto mb-12', className)}>
      {/* Step labels */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center">
          {steps.map((step, i) => {
            const isCompleted = i < currentStep
            const isActive = i === currentStep
            const isFuture = i > currentStep
            const stepNumber = i + 1

            return (
              <div key={step.label} className="flex items-center">
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
                      stepNumber.toString().padStart(2, '0')
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-widest mt-2',
                      (isCompleted || isActive) ? 'text-primary' : 'text-slate-400',
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-24 h-[2px] mx-2 -mt-6',
                      i < currentStep ? 'bg-primary' : 'bg-surface-container-highest',
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress bar strip */}
      <div className="flex gap-2 h-1.5 w-full">
        {steps.map((step, i) => (
          <div
            key={step.label}
            className={cn(
              'flex-1 rounded-full',
              i <= currentStep ? 'bg-primary' : 'bg-surface-container-highest',
            )}
          />
        ))}
      </div>
    </div>
  )
}
