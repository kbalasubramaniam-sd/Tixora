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
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline mb-2">
          What do you need?
        </h1>
        <p className="text-on-surface-variant font-body text-lg">
          Select the type of request for {product.name}
        </p>
      </div>

      {/* Task List */}
      <div className="space-y-4 mb-12">
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
                'group relative bg-surface-container-lowest p-6 rounded-xl shadow-md shadow-slate-200/50 transition-all duration-300 flex items-center justify-between border-2 border-transparent',
                task.enabled
                  ? 'cursor-pointer hover:shadow-xl hover:shadow-teal-900/5 hover:border-primary/20'
                  : 'opacity-50 cursor-not-allowed',
              )}
              role="button"
              tabIndex={task.enabled ? 0 : -1}
              onKeyDown={(e) => { if (e.key === 'Enter' && task.enabled) onSelect(task) }}
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined">{task.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded uppercase tracking-widest">
                      {task.type.replace('T0', 'T-0')}
                    </span>
                    <h3 className="text-lg font-bold text-on-surface font-headline leading-none">
                      {task.name}
                    </h3>
                  </div>
                  <p className="text-sm text-on-surface-variant max-w-xl">{task.description}</p>
                  {!task.enabled && task.disabledReason && (
                    <p className="text-xs text-error mt-2">{task.disabledReason}</p>
                  )}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4">
                <span className="material-symbols-outlined text-primary">chevron_right</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Navigation Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-on-surface-variant font-semibold text-sm hover:underline transition-all"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>
        <div className="flex items-center gap-4">
          <span className="text-xs text-on-surface-variant/60 font-label italic">Step 2 of 4</span>
        </div>
      </div>
    </div>
  )
}
