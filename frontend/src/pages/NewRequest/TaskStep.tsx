import { useTasks } from '@/api/hooks/useProducts'
import type { Product, TaskOption } from '@/types/product'
import { cn } from '@/utils/cn'

interface TaskStepProps {
  product: Product
  onSelect: (task: TaskOption) => void
  onBack: () => void
}

export function TaskStep({ product, onSelect, onBack }: TaskStepProps) {
  const { data: tasks, isLoading } = useTasks(product.code)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-[2rem] font-bold text-on-surface tracking-tight mb-2 leading-tight">
          What do you need?
        </h1>
        <p className="text-on-surface-variant text-lg leading-relaxed">
          Select the type of request for <span className="font-bold text-on-surface">{product.name}</span>
        </p>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-6 animate-pulse h-20" />
          ))
        ) : (
          tasks?.map((task) => (
            <div
              key={task.type}
              onClick={() => task.enabled && onSelect(task)}
              className={cn(
                'group relative bg-surface-container-lowest rounded-xl p-6 transition-all duration-300 overflow-hidden',
                task.enabled
                  ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(23,29,28,0.08)]'
                  : 'opacity-50 cursor-not-allowed',
              )}
              role="button"
              tabIndex={task.enabled ? 0 : -1}
              onKeyDown={(e) => { if (e.key === 'Enter' && task.enabled) onSelect(task) }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-on-surface mb-1">
                    {task.type.replace('T0', 'T-0')} · {task.name}
                  </h3>
                  <p className="text-sm text-on-surface-variant">{task.description}</p>
                  {!task.enabled && task.disabledReason && (
                    <p className="text-xs text-error mt-2">{task.disabledReason}</p>
                  )}
                </div>
                {task.enabled && (
                  <span className="material-symbols-outlined text-primary transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="mt-8 flex items-center text-primary font-bold text-sm hover:text-primary-container transition-colors"
      >
        <span className="material-symbols-outlined mr-1 text-sm">arrow_back</span>
        Back to Products
      </button>
    </div>
  )
}
