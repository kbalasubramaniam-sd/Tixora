import { useEffect, useMemo } from 'react'
import { useForm, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFormSchema } from '@/api/hooks/useProducts'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Product, TaskOption, FormFieldDefinition } from '@/types/product'

interface FormStepProps {
  product: Product
  task: TaskOption
  initialData?: Record<string, string | boolean>
  onSubmit: (data: Record<string, string | boolean>) => void
  onBack: () => void
}

function buildZodSchema(fields: FormFieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    if (field.type === 'toggle') {
      shape[field.name] = z.boolean().optional()
    } else if (field.required) {
      shape[field.name] = z.string().min(1, `${field.label} is required`)
    } else {
      shape[field.name] = z.string().optional()
    }
  }
  return z.object(shape)
}

function groupBySection(fields: FormFieldDefinition[]): Record<string, FormFieldDefinition[]> {
  const groups: Record<string, FormFieldDefinition[]> = {}
  for (const field of fields) {
    if (!groups[field.section]) groups[field.section] = []
    groups[field.section].push(field)
  }
  return groups
}

export function FormStep({ product, task, initialData, onSubmit, onBack }: FormStepProps) {
  const { data: schema, isLoading } = useFormSchema(product.code, task.type)

  const zodSchema = useMemo(
    () => (schema ? buildZodSchema(schema.fields) : z.object({})),
    [schema],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FieldValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(zodSchema) as any,
    mode: 'onChange',
    defaultValues: initialData ?? {},
  })

  // Reset form when schema loads
  useEffect(() => {
    if (schema && initialData) reset(initialData)
  }, [schema, initialData, reset])

  if (isLoading || !schema) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-surface-container-low rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const sections = groupBySection(schema.fields)
  const errorCount = Object.keys(errors).length
  const fieldCount = schema.fields.filter((f) => f.required).length
  const filledCount = fieldCount - errorCount

  function onFormSubmit(data: FieldValues) {
    onSubmit(data as Record<string, string | boolean>)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-[2rem] font-bold text-on-surface tracking-tight mb-2 leading-tight">
          {task.name}
        </h1>
        <div className="flex items-center gap-3">
          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {product.name} · {product.code}
          </span>
          <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {task.type.replace('T0', 'T-0')}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
        {/* Form sections */}
        {Object.entries(sections).map(([sectionName, fields]) => (
          <div key={sectionName} className="bg-surface-container-lowest rounded-xl p-8 mb-8">
            <h2 className="text-lg font-bold text-on-surface uppercase tracking-tight mb-6">{sectionName}</h2>
            <div className="space-y-5">
              {fields.map((field) => {
                const error = errors[field.name]?.message as string | undefined

                if (field.type === 'textarea') {
                  return (
                    <div key={field.name} className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant">
                        {field.label}
                        {field.required && <span className="text-primary-container ml-0.5">*</span>}
                      </label>
                      <textarea
                        {...register(field.name)}
                        placeholder={field.placeholder}
                        rows={4}
                        className="px-4 py-3 rounded-lg bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus-glow transition-shadow resize-none ghost-border"
                      />
                      {error && <p className="text-xs text-error">{error}</p>}
                      {field.helperText && !error && (
                        <p className="text-[0.6875rem] text-on-surface-variant/70">{field.helperText}</p>
                      )}
                    </div>
                  )
                }

                if (field.type === 'select' && field.options) {
                  return (
                    <div key={field.name} className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant">
                        {field.label}
                        {field.required && <span className="text-primary-container ml-0.5">*</span>}
                      </label>
                      <select
                        {...register(field.name)}
                        className="h-12 px-4 rounded-lg bg-surface-container-lowest text-sm text-on-surface outline-none focus-glow transition-shadow ghost-border"
                      >
                        <option value="">Select...</option>
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {error && <p className="text-xs text-error">{error}</p>}
                    </div>
                  )
                }

                return (
                  <Input
                    key={field.name}
                    {...register(field.name)}
                    type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
                    label={field.label}
                    placeholder={field.placeholder}
                    helperText={field.helperText}
                    error={error}
                    required={field.required}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-primary font-bold text-sm hover:text-primary-container transition-colors"
          >
            <span className="material-symbols-outlined mr-1 text-sm">arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs text-on-surface-variant">
              {filledCount} of {fieldCount} required fields
            </span>
            <Button type="submit" className="shadow-lg shadow-primary/20 rounded-xl">
              Review &amp; Submit
              <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
