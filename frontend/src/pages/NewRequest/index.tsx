import { useState } from 'react'
import { Stepper } from '@/components/ui/Stepper'
import { ProductStep } from './ProductStep'
import { TaskStep } from './TaskStep'
import { FormStep } from './FormStep'
import { ReviewStep } from './ReviewStep'
import { ConfirmationStep } from './ConfirmationStep'
import { useSubmitTicket } from '@/api/hooks/useProducts'
import { TaskType } from '@/types/enums'
import type { Product, TaskOption } from '@/types/product'

const STEPS = [
  { label: 'Product' },
  { label: 'Task' },
  { label: 'Details' },
  { label: 'Review' },
]

export default function NewRequest() {
  const [step, setStep] = useState(0)
  const [product, setProduct] = useState<Product | null>(null)
  const [task, setTask] = useState<TaskOption | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [result, setResult] = useState<{ id: string; ticketId: string; currentStageName: string | null } | null>(null)

  const submitMutation = useSubmitTicket()

  function handleProductSelect(p: Product) {
    setProduct(p)
    setTask(null)
    setFormData({})
    setStep(1)
  }

  function handleTaskSelect(t: TaskOption) {
    setTask(t)
    setFormData({})
    setStep(2)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleFormSubmit(data: Record<string, any>) {
    setFormData(data)
    setStep(3)
  }

  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleFinalSubmit() {
    if (!product || !task) return
    setSubmitError(null)

    // Extract top-level fields from formData, rest goes into JSON blob
    const { partnerName: partnerId, issueType, apiOptIn, ...rest } = formData
    const provisioningPath = apiOptIn ? 'PortalAndApi' : 'PortalOnly'

    try {
      const res = await submitMutation.mutateAsync({
        productCode: product.code,
        taskType: task.type,
        partnerId: partnerId as string,
        provisioningPath: task.type === TaskType.T03 ? provisioningPath : null,
        issueType: task.type === TaskType.T04 ? (issueType as string) : null,
        formData: JSON.stringify(rest),
      })
      setResult({ id: res.id, ticketId: res.ticketId, currentStageName: res.currentStageName })
      setStep(4)
    } catch {
      setSubmitError('Failed to submit ticket. Please check your connection and try again.')
    }
  }

  // Confirmation is step 4 — no stepper shown
  if (step === 4 && result) {
    return <ConfirmationStep id={result.id} ticketId={result.ticketId} routedTo={result.currentStageName ?? 'Processing'} />
  }

  return (
    <div>
      <Stepper steps={STEPS} currentStep={step} />

      {step === 0 && <ProductStep onSelect={handleProductSelect} />}

      {step === 1 && product && (
        <TaskStep product={product} onSelect={handleTaskSelect} onBack={() => setStep(0)} />
      )}

      {step === 2 && product && task && (
        <FormStep
          product={product}
          task={task}
          initialData={formData}
          onSubmit={handleFormSubmit}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && product && task && (
        <>
          {submitError && (
            <div className="max-w-4xl mx-auto mb-4 p-3 bg-error-surface rounded-lg flex items-center gap-2 text-sm text-error">
              <span className="material-symbols-outlined text-lg">error</span>
              {submitError}
            </div>
          )}
          <ReviewStep
            product={product}
            task={task}
            formData={formData}
            onSubmit={handleFinalSubmit}
            onBack={() => setStep(2)}
            isSubmitting={submitMutation.isPending}
          />
        </>
      )}
    </div>
  )
}
