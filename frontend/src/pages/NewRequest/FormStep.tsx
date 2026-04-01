import { useEffect, useMemo, useState } from 'react'
import { useForm, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFormSchema } from '@/api/hooks/useProducts'
import { FileUpload } from '@/components/ui/FileUpload'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'
import type { Product, TaskOption, FormFieldDefinition, FormSectionMeta } from '@/types/product'

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

function groupBySection(
  fields: FormFieldDefinition[],
): { sectionName: string; fields: FormFieldDefinition[] }[] {
  const map = new Map<string, FormFieldDefinition[]>()
  for (const field of fields) {
    if (!map.has(field.section)) map.set(field.section, [])
    map.get(field.section)!.push(field)
  }
  return Array.from(map.entries()).map(([sectionName, fields]) => ({ sectionName, fields }))
}

function getSectionMeta(
  sectionName: string,
  sectionMeta?: FormSectionMeta[],
): FormSectionMeta | undefined {
  return sectionMeta?.find((m) => m.name === sectionName)
}

// Render a single form field (input, select, textarea)
function FormField({
  field,
  register,
  error,
}: {
  field: FormFieldDefinition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  error?: string
}) {
  const inputClass = cn(
    'w-full bg-surface-container-lowest border-none rounded-lg h-12 px-4',
    'text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 shadow-sm transition-all',
  )

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-on-surface-variant ml-1">
        {field.label}
        {field.required && <span className="text-error ml-0.5">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          {...register(field.name)}
          placeholder={field.placeholder}
          rows={4}
          className={cn(
            'w-full bg-surface-container-lowest border-none rounded-lg px-4 py-3',
            'text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20',
            'shadow-sm transition-all resize-none',
          )}
        />
      ) : field.type === 'select' && field.options ? (
        <div className="relative">
          <select
            {...register(field.name)}
            className={cn(inputClass, 'appearance-none cursor-pointer')}
          >
            <option value="">Select...</option>
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">
            expand_more
          </span>
        </div>
      ) : (
        <input
          {...register(field.name)}
          type={
            field.type === 'date'
              ? 'date'
              : field.type === 'email'
                ? 'email'
                : 'text'
          }
          placeholder={field.placeholder}
          className={inputClass}
        />
      )}

      {error && <p className="text-xs text-error ml-1">{error}</p>}
      {field.helperText && !error && (
        <p className="text-[0.6875rem] text-on-surface-variant/70 ml-1">{field.helperText}</p>
      )}
    </div>
  )
}

export function FormStep({ product, task, initialData, onSubmit, onBack }: FormStepProps) {
  const { data: schema, isLoading } = useFormSchema(product.code, task.type)
  const { user } = useAuth()

  // File state: docName -> File | null
  const [files, setFiles] = useState<Record<string, File | null>>({})

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

  useEffect(() => {
    if (schema && initialData) reset(initialData)
  }, [schema, initialData, reset])

  // Initialize file state when schema loads
  useEffect(() => {
    if (schema?.requiredDocuments) {
      setFiles((prev) => {
        const next: Record<string, File | null> = {}
        for (const doc of schema.requiredDocuments) {
          next[doc.name] = prev[doc.name] ?? null
        }
        return next
      })
    }
  }, [schema])

  if (isLoading || !schema) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-32">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-surface-container-low rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const sections = groupBySection(schema.fields)

  function onFormSubmit(data: FieldValues) {
    onSubmit(data as Record<string, string | boolean>)
  }

  const taskLabel = task.type.replace('T0', 'T-0')

  return (
    <>
      <div className="max-w-4xl mx-auto pb-32">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex gap-2 mb-3">
            <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider rounded">
              {product.name}
            </span>
            <span className="px-2 py-0.5 bg-tertiary-container/20 text-on-tertiary-container text-[10px] font-bold uppercase tracking-wider rounded border border-tertiary/10">
              {taskLabel}
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
            <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">
              {task.name}
            </h1>
            <p className="text-on-surface-variant text-sm hidden md:block">Draft saved 2 mins ago</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="space-y-8">
          {/* Form Sections */}
          {sections.map(({ sectionName, fields }) => {
            const meta = getSectionMeta(sectionName, schema.sectionMeta)
            const icon = meta?.icon
            const columns = meta?.columns ?? 2
            const accentColor = meta?.colorAccent ?? 'bg-primary'

            return (
              <section
                key={sectionName}
                className="bg-surface-container-low rounded-xl p-8 transition-all hover:bg-surface-container"
              >
                {/* Section header */}
                <div className="flex items-center gap-3 mb-8">
                  {icon ? (
                    <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-teal-700 shadow-sm shrink-0">
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                  ) : (
                    <div className={cn('w-1.5 h-6 rounded-full shrink-0', accentColor)} />
                  )}
                  <h2 className="text-xl font-bold text-on-surface">{sectionName}</h2>
                </div>

                {/* Fields grid */}
                <div
                  className={cn(
                    'grid gap-x-8 gap-y-6',
                    columns === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2',
                  )}
                >
                  {fields.map((field) => (
                    <FormField
                      key={field.name}
                      field={field}
                      register={register}
                      error={errors[field.name]?.message as string | undefined}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          {/* Required Documents Section */}
          {schema.requiredDocuments.length > 0 && (
            <section className="bg-surface-container-low rounded-xl p-8 transition-all hover:bg-surface-container">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 rounded-full bg-tertiary shrink-0" />
                <h2 className="text-xl font-bold text-on-surface">Required Documents</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schema.requiredDocuments.map((doc) => (
                  <FileUpload
                    key={doc.name}
                    label={doc.label}
                    file={files[doc.name] ?? null}
                    onFileSelect={(f) => setFiles((prev) => ({ ...prev, [doc.name]: f }))}
                    accept=".pdf,.docx,.xlsx,.png,.jpg"
                    maxSizeMB={10}
                  />
                ))}
              </div>
            </section>
          )}
        </form>
      </div>

      {/* Metadata Sidebar */}
      {user && (
        <aside className="hidden xl:block fixed top-48 right-12 w-64 space-y-6 z-30">
          <div className="p-6 rounded-2xl bg-slate-100/50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Request Metadata
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Requested By</p>
                <p className="text-sm font-semibold text-slate-700">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Role</p>
                <p className="text-sm font-semibold text-slate-700">
                  {user.role.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 w-full bg-white/60 backdrop-blur-xl border-t border-surface-container-high py-4 px-6 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-on-surface-variant font-bold hover:text-primary transition-colors px-6 py-3"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          <button
            type="submit"
            form=""
            onClick={() => {
              const form = document.querySelector('form')
              form?.requestSubmit()
            }}
            className={cn(
              'bg-gradient-to-br from-[#00696a] to-[#23a2a3] text-white',
              'px-8 py-3.5 rounded-lg font-bold shadow-[0_4px_20px_rgba(0,105,106,0.2)]',
              'flex items-center gap-3 transition-transform active:scale-95',
            )}
          >
            Review &amp; Submit
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>
    </>
  )
}
