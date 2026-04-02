import { cn } from '@/utils/cn'
import type { WorkflowStage } from '@/types/ticket'

interface WorkflowStepperProps {
  stages: WorkflowStage[]
}

export function WorkflowStepper({ stages }: WorkflowStepperProps) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl custom-shadow overflow-x-auto no-scrollbar">
      <div className="flex items-center min-w-[600px]">
        {stages.map((stage, i) => {
          const isLast = i === stages.length - 1
          const isCurrent = stage.status === 'current'
          const isCompleted = stage.status === 'completed'

          return (
            <div key={stage.name} className={cn('flex flex-col items-center relative', !isLast && 'flex-1')}>
              {/* Circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center relative z-10',
                  isCompleted && 'primary-gradient text-white',
                  isCurrent && 'primary-gradient text-white ring-8 ring-primary/30 pulse-active',
                  stage.status === 'future' && 'bg-surface-container-highest text-on-surface-variant',
                )}
              >
                <span
                  className="material-symbols-outlined"
                  style={isCompleted || isCurrent ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {stage.icon}
                </span>
              </div>
              {/* Label */}
              <span
                className={cn(
                  'mt-2 text-xs font-bold',
                  isCurrent && 'font-extrabold text-primary',
                  isCompleted && 'text-primary',
                  stage.status === 'future' && 'text-on-surface-variant',
                )}
              >
                {stage.name}
              </span>
              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute top-5 left-1/2 w-full h-1',
                    isCompleted ? 'bg-primary-container' : 'bg-surface-variant',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
