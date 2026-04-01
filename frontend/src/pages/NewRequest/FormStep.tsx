import { useEffect, useMemo, useState } from 'react'
import { useForm, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFormSchema } from '@/api/hooks/useProducts'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'
import type { Product, TaskOption, FormFieldDefinition, FormSectionMeta, RequiredDocument } from '@/types/product'

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
    } else if (field.type === 'readonly') {
      shape[field.name] = z.string().optional()
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

// Readonly display field (Company Code)
function ReadonlyField({ field }: { field: FormFieldDefinition }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {field.label}
      </label>
      <div className="w-full h-12 flex items-center px-4 bg-surface-container-high rounded-lg text-secondary font-mono text-sm">
        <span className="opacity-50 italic">Auto-populated from selection</span>
        <span className="material-symbols-outlined ml-auto text-sm opacity-30">lock</span>
      </div>
      <p className="text-[11px] text-secondary italic ml-1">Auto-populated based on selection</p>
    </div>
  )
}

// Radio-card field (T04 Issue Type)
function RadioCardField({
  field,
  register,
  error,
}: {
  field: FormFieldDefinition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  error?: string
}) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        {field.label}
        {field.required && <span className="text-error ml-0.5">*</span>}
      </label>
      <div className="flex flex-col sm:flex-row gap-4">
        {field.options?.map((opt) => (
          <label key={opt.value} className="flex-1 cursor-pointer group">
            <input
              {...register(field.name)}
              type="radio"
              value={opt.value}
              className="sr-only peer"
            />
            <div className="p-4 bg-surface-container-lowest rounded-lg border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 transition-all flex flex-col items-center text-center shadow-sm hover:border-outline-variant">
              {opt.icon && (
                <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">
                  {opt.icon}
                </span>
              )}
              <span className="text-sm font-bold text-on-surface">{opt.label}</span>
            </div>
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-error ml-1">{error}</p>}
    </div>
  )
}

// Toggle field (API Opt-In)
function ToggleField({
  field,
  register,
}: {
  field: FormFieldDefinition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-on-surface-variant font-medium max-w-lg">{field.label}</p>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input {...register(field.name)} type="checkbox" className="sr-only peer" />
        <div className="w-14 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-container" />
      </label>
    </div>
  )
}

// Render a single form field
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
  if (field.type === 'readonly') return <ReadonlyField field={field} />
  if (field.type === 'radio-card') return <RadioCardField field={field} register={register} error={error} />
  if (field.type === 'toggle') return <ToggleField field={field} register={register} />

  const inputClass = cn(
    'w-full bg-surface-container-lowest border-none rounded-lg h-12 px-4',
    'text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 shadow-sm transition-all',
  )

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {field.label}
        {field.required && <span className="text-error ml-0.5"> *</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          {...register(field.name)}
          placeholder={field.placeholder}
          rows={field.name === 'description' ? 5 : 4}
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
            <option value="">{field.placeholder ?? 'Select...'}</option>
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
      ) : field.type === 'select' ? (
        // select without options (partner name — dynamic)
        <div className="relative">
          <select
            {...register(field.name)}
            className={cn(inputClass, 'appearance-none cursor-pointer')}
          >
            <option value="">{field.placeholder ?? 'Select...'}</option>
            <option value="partner_1">Global Logistics Corp</option>
            <option value="partner_2">Apex Solutions Ltd</option>
            <option value="partner_3">Summit Enterprise Group</option>
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">
            expand_more
          </span>
        </div>
      ) : (
        <input
          {...register(field.name)}
          type={
            field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'
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

// Document upload card — Stitch T-01 grid card style
function DocUploadCard({
  doc,
  file,
  onFileSelect,
}: {
  doc: RequiredDocument
  file: File | null
  onFileSelect: (f: File | null) => void
}) {
  const inputRef = { current: null as HTMLInputElement | null }

  function handleClick() {
    inputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    onFileSelect(f)
    e.target.value = ''
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    onFileSelect(null)
  }

  if (doc.variant === 'dashed') {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-xl border-2 border-dashed border-outline-variant/30 flex flex-col justify-center items-center text-center">
        <div className="mb-4">
          <span className="material-symbols-outlined text-primary text-4xl">{doc.icon ?? 'edit_document'}</span>
        </div>
        <h3 className="font-bold mb-1">{doc.label}</h3>
        <p className="text-xs text-on-surface-variant mb-6">{doc.description}</p>
        {file ? (
          <div className="w-full space-y-2">
            <p className="text-xs text-primary font-medium truncate">{file.name}</p>
            <button
              type="button"
              onClick={handleRemove}
              className="w-full py-3 bg-error/10 text-error text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            className="w-full py-3 bg-gradient-to-br from-[#00696a] to-[#23a2a3] text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Select File
          </button>
        )}
        <input
          ref={(el) => { inputRef.current = el }}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleChange}
        />
      </div>
    )
  }

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl group transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
      <div className="mb-6 flex justify-between items-start">
        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">
          {doc.icon ?? 'description'}
        </span>
        {doc.required ? (
          <span
            className="material-symbols-outlined text-error text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            priority_high
          </span>
        ) : (
          <span className="text-xs text-on-surface-variant font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            OPTIONAL
          </span>
        )}
      </div>
      <h3 className="font-bold mb-1">{doc.label}</h3>
      <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">{doc.description}</p>
      {file ? (
        <div className="space-y-2">
          <p className="text-xs text-primary font-medium truncate">{file.name}</p>
          <button
            type="button"
            onClick={handleRemove}
            className="w-full py-3 bg-error/10 text-error text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="w-full py-3 bg-surface-container-low text-on-surface text-sm font-bold rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">upload</span>
          Upload
        </button>
      )}
      <input
        ref={(el) => { inputRef.current = el }}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleChange}
      />
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

  // Format task label e.g. T01 -> T-01
  const taskLabel = task.type.replace(/^T0?(\d+)$/, 'T-$1').replace('T-', 'T-0').replace('T-00', 'T-0')
  const taskCode = `${taskLabel}: ${task.name}`

  return (
    <>
      <div className="max-w-4xl mx-auto pb-36">
        {/* Page Header — Stitch V2 style */}
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">
              New Request
            </h1>
            <p className="text-on-surface-variant font-medium">{taskCode}</p>
          </div>
          <span className="px-3 py-1 bg-surface-container-highest rounded-xl text-xs font-bold tracking-widest text-on-surface-variant shrink-0 mt-1">
            STEP 3 OF 4
          </span>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="space-y-10">
          {/* Form Sections */}
          {sections.map(({ sectionName, fields }) => {
            const meta = getSectionMeta(sectionName, schema.sectionMeta)
            const icon = meta?.icon
            const iconBg = meta?.iconBg ?? 'bg-surface-container-lowest'
            const iconColor = meta?.colorAccent ?? 'text-primary'
            const columns = meta?.columns ?? 2
            const subtitle = meta?.subtitle
            const isToggleOnlySection = fields.length === 1 && fields[0].type === 'toggle'

            return (
              <section
                key={sectionName}
                className="bg-surface-container-low rounded-xl p-8 transition-all hover:bg-surface-container-high/50"
              >
                {/* Section header */}
                <div className={cn('flex items-center gap-4', isToggleOnlySection ? 'mb-0' : 'mb-8')}>
                  {icon ? (
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', iconBg, iconColor)}>
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                  ) : null}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-on-surface">{sectionName}</h2>
                    {subtitle && (
                      <p className="text-sm text-on-surface-variant mt-0.5">{subtitle}</p>
                    )}
                  </div>
                  {/* Toggle rendered inline for API Opt-In section */}
                  {isToggleOnlySection && (
                    <ToggleField field={fields[0]} register={register} />
                  )}
                </div>

                {/* Fields grid — skip if toggle-only (already rendered above) */}
                {!isToggleOnlySection && (
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
                )}
              </section>
            )
          })}

          {/* Required Documents Section — Stitch T-01 grid card style */}
          {schema.requiredDocuments.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Required Documents</h2>
                </div>
                <span className="text-sm text-on-surface-variant bg-surface-container-low px-4 py-1.5 rounded-full font-medium italic">
                  All uploads must be PDF or High-Res Image
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {schema.requiredDocuments.map((doc) => (
                  <DocUploadCard
                    key={doc.name}
                    doc={doc}
                    file={files[doc.name] ?? null}
                    onFileSelect={(f) => setFiles((prev) => ({ ...prev, [doc.name]: f }))}
                  />
                ))}
              </div>
            </section>
          )}
        </form>

        {/* Bottom Notice — Stitch T-01 Operational Integrity Protocol */}
        <div className="mt-16 p-8 bg-white/60 backdrop-blur-xl rounded-xl border border-outline-variant/10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
          </div>
          <div>
            <h4 className="text-base font-bold mb-1">Operational Integrity Protocol</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl">
              By proceeding, you acknowledge that all information provided is accurate and complies
              with Tixora's enterprise portal standards. Falsification of documents or credentials
              may result in immediate revocation of partner access.
            </p>
          </div>
        </div>
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

      {/* Sticky Footer — Stitch V2 pattern: Back left, Save as Draft center, Review & Submit right */}
      <footer className="fixed bottom-0 left-0 w-full bg-white/60 backdrop-blur-xl border-t border-surface-container-high py-4 px-6 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Back */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-on-surface-variant font-bold hover:text-on-surface transition-colors px-4 py-3"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Step 2
          </button>

          {/* Save as Draft */}
          <button
            type="button"
            className="text-on-surface-variant text-sm font-medium hover:underline underline-offset-4 decoration-tertiary transition-colors"
          >
            Save as Draft
          </button>

          {/* Review & Submit */}
          <button
            type="submit"
            form=""
            onClick={() => {
              const form = document.querySelector('form')
              form?.requestSubmit()
            }}
            className={cn(
              'bg-gradient-to-br from-[#00696a] to-[#23a2a3] text-white',
              'px-10 py-4 rounded-xl font-extrabold tracking-tight shadow-xl shadow-primary/20',
              'flex items-center gap-3 transition-transform active:scale-95',
            )}
          >
            Review &amp; Submit Request
          </button>
        </div>
      </footer>
    </>
  )
}
