import { Button } from '@/components/ui/Button'
import type { Product, TaskOption } from '@/types/product'

interface ReviewStepProps {
  product: Product
  task: TaskOption
  formData: Record<string, string | boolean>
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

export function ReviewStep({ product, task, formData, onSubmit, onBack, isSubmitting }: ReviewStepProps) {
  const entries = Object.entries(formData).filter(([, v]) => v !== '' && v !== undefined)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-[2rem] font-bold text-on-surface tracking-tight mb-2 leading-tight">
          Review Your Request
        </h1>
        <p className="text-on-surface-variant text-lg leading-relaxed">
          Please verify all details before submitting
        </p>
      </div>

      {/* Product & Task */}
      <div className="bg-surface-container-lowest rounded-xl p-8 mb-8">
        <div className="flex items-center gap-3">
          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {product.name} · {product.code}
          </span>
          <span className="text-on-surface-variant text-sm">
            {task.name}
          </span>
        </div>
      </div>

      {/* Form Data */}
      <div className="bg-surface-container-lowest rounded-xl p-8 mb-8">
        <h2 className="text-lg font-bold text-on-surface mb-6">Request Details</h2>
        <div className="space-y-4">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-start border-b border-outline pb-4">
              <span className="text-on-surface-variant capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className="text-on-surface font-medium text-right">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-outline rounded-xl text-on-surface hover:bg-surface-dim transition-colors flex items-center"
          disabled={isSubmitting}
        >
          <span className="material-symbols-outlined mr-1 text-sm">arrow_back</span>
          Edit Details
        </button>
        <Button
          onClick={onSubmit}
          loading={isSubmitting}
          className="shadow-lg shadow-primary/20 rounded-xl"
        >
          Submit Request
          <span className="material-symbols-outlined text-sm ml-1">send</span>
        </Button>
      </div>
    </div>
  )
}
