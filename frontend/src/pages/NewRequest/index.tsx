import { useState } from 'react'
import { Stepper } from '@/components/ui/Stepper'
import { ProductStep } from './ProductStep'
import { TaskStep } from './TaskStep'
import { FormStep } from './FormStep'
import { ReviewStep } from './ReviewStep'
import { ConfirmationStep } from './ConfirmationStep'
import { useSubmitTicket } from '@/api/hooks/useProducts'
import type { Product, TaskOption } from '@/types/product'
import type { ProductCode, TaskType } from '@/types/enums'

const STEPS = [
  { label: 'Product', icon: 'category' },
  { label: 'Task', icon: 'assignment' },
  { label: 'Details', icon: 'edit_note' },
  { label: 'Review', icon: 'verified' },
]

export default function NewRequest() {
  const [step, setStep] = useState(0)
  const [product, setProduct] = useState<Product | null>(null)
  const [task, setTask] = useState<TaskOption | null>(null)
  const [formData, setFormData] = useState<Record<string, string | boolean>>({})
  const [result, setResult] = useState<{ ticketId: string; routedTo: string } | null>(null)

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

  function handleFormSubmit(data: Record<string, string | boolean>) {
    setFormData(data)
    setStep(3)
  }

  async function handleFinalSubmit() {
    if (!product || !task) return
    const res = await submitMutation.mutateAsync({
      productCode: product.code as ProductCode,
      taskType: task.type as TaskType,
      formData,
      documents: [],
    })
    setResult(res)
    setStep(4)
  }

  // Confirmation is step 4 — no stepper shown
  if (step === 4 && result) {
    return <ConfirmationStep ticketId={result.ticketId} routedTo={result.routedTo} />
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
        <ReviewStep
          product={product}
          task={task}
          formData={formData}
          onSubmit={handleFinalSubmit}
          onBack={() => setStep(2)}
          isSubmitting={submitMutation.isPending}
        />
      )}
    </div>
  )
}
