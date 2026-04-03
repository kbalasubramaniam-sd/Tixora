import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFormSchema } from '@/api/hooks/useProducts'
import { usePartners } from '@/api/hooks/usePartners'
import { useAuth } from '@/contexts/AuthContext'
import { TaskType } from '@/types/enums'
import { cn } from '@/utils/cn'
import { FileUpload } from '@/components/ui/FileUpload'
import type { Product, TaskOption, FormFieldDefinition, FormSectionMeta } from '@/types/product'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

interface FormStepProps {
  product: Product
  task: TaskOption
  initialData?: AnyRecord
  onSubmit: (data: AnyRecord) => void
  onBack: () => void
}

/** Build zod schema for flat (non-repeatable) fields only */
function buildZodSchema(fields: FormFieldDefinition[], repeatableSections: Set<string>) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    // Skip fields belonging to repeatable sections — validated separately
    if (repeatableSections.has(field.section)) continue

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
function ReadonlyField({ field, value }: { field: FormFieldDefinition; value?: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        {field.label}
      </label>
      <div className="w-full h-12 flex items-center px-4 bg-surface-container-high rounded-lg text-secondary font-mono text-sm">
        {value ? (
          <span>{value}</span>
        ) : (
          <span className="opacity-50 italic">Auto-populated from selection</span>
        )}
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
  checked,
}: {
  field: FormFieldDefinition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  checked?: boolean
}) {
  // Spread register but override checked so DOM stays in sync after reset()
  const { ref, ...rest } = register(field.name)
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-on-surface-variant font-medium max-w-lg">{field.label}</p>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input ref={ref} {...rest} type="checkbox" checked={!!checked} className="sr-only peer" />
        <div className="w-14 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-container" />
      </label>
    </div>
  )
}

/** Generic form field renderer — used in both flat sections and repeatable entries */
function FormField({
  field,
  register,
  error,
  partnerOptions,
  companyCode,
  watchedValue,
}: {
  field: FormFieldDefinition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  error?: string
  partnerOptions?: { id: string; name: string }[]
  companyCode?: string | null
  watchedValue?: unknown
}) {
  if (field.type === 'readonly') return <ReadonlyField field={field} value={companyCode ?? undefined} />
  if (field.type === 'radio-card') return <RadioCardField field={field} register={register} error={error} />
  if (field.type === 'toggle') return <ToggleField field={field} register={register} checked={!!watchedValue} />

  const inputClass = cn(
    'w-full bg-surface-container-lowest border-none rounded-xl h-14 px-4',
    'text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 shadow-sm transition-all font-medium',
  )

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
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
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-sm">
            expand_more
          </span>
        </div>
      ) : field.type === 'select' && partnerOptions ? (
        // Partner select — populated from API
        <div className="relative">
          <select
            {...register(field.name)}
            className={cn(inputClass, 'appearance-none cursor-pointer')}
          >
            <option value="">{field.placeholder ?? 'Select...'}</option>
            {partnerOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-sm">
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

// ---------------------------------------------------------------------------
// RepeatableSection — renders N entry cards for a repeatable section
// ---------------------------------------------------------------------------

type RepeatableEntry = Record<string, string>

function createEmptyEntry(fields: FormFieldDefinition[]): RepeatableEntry {
  const entry: RepeatableEntry = {}
  for (const f of fields) entry[f.name] = ''
  return entry
}

function RepeatableSection({
  sectionName,
  meta,
  fields,
  entries,
  onChange,
  validationErrors,
}: {
  sectionName: string
  meta: FormSectionMeta | undefined
  fields: FormFieldDefinition[]
  entries: RepeatableEntry[]
  onChange: (entries: RepeatableEntry[]) => void
  validationErrors: Record<string, string>  // key = "sectionKey.idx.fieldName"
}) {
  const icon = meta?.icon
  const iconBg = meta?.iconBg ?? 'bg-surface-container-lowest'
  const iconColor = meta?.colorAccent ?? 'text-primary'
  const columns = meta?.columns ?? 2
  const subtitle = meta?.subtitle
  const minEntries = meta?.minEntries ?? 1

  const handleFieldChange = (idx: number, fieldName: string, value: string) => {
    const updated = entries.map((e, i) => (i === idx ? { ...e, [fieldName]: value } : e))
    onChange(updated)
  }

  const addEntry = () => {
    onChange([...entries, createEmptyEntry(fields)])
  }

  const removeEntry = (idx: number) => {
    if (entries.length <= minEntries) return
    onChange(entries.filter((_, i) => i !== idx))
  }

  // Derive a stable key for error lookup from sectionName
  const sectionKey = sectionName.replace(/\s+/g, '_')

  const inputClass = cn(
    'w-full bg-white border-none rounded-lg h-12 px-4',
    'text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 shadow-sm transition-all font-medium',
  )

  return (
    <section className="bg-surface-container-low rounded-xl p-10 transition-all">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-8">
        {icon ? (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg, iconColor)}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
        ) : null}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-on-surface">{sectionName}</h2>
          {subtitle && (
            <p className="text-sm text-on-surface-variant mt-0.5">{subtitle}</p>
          )}
        </div>
        <span className="text-xs font-bold text-on-surface-variant bg-surface-container-highest px-3 py-1 rounded-full">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Entry cards */}
      <div className="space-y-4">
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className="bg-surface-container-lowest rounded-xl p-6 border-l-4 border-primary/20 transition-all duration-200"
            style={{ opacity: 1, transform: 'translateY(0)' }}
          >
            <div className="flex items-center justify-between mb-5">
              {/* Entry badge */}
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00696a] to-[#23a2a3] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{idx + 1}</span>
                </div>
                <span className="text-sm font-semibold text-on-surface-variant">
                  {sectionName} {idx + 1}
                </span>
              </div>
              {/* Remove button */}
              {entries.length > minEntries && (
                <button
                  type="button"
                  onClick={() => removeEntry(idx)}
                  className="p-1.5 rounded-lg text-error/50 hover:text-error hover:bg-error/5 transition-colors"
                  title="Remove entry"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              )}
            </div>

            {/* Fields grid */}
            <div
              className={cn(
                'grid gap-x-8 gap-y-6',
                columns === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2',
              )}
            >
              {fields.map((field) => {
                const errorKey = `${sectionKey}.${idx}.${field.name}`
                const error = validationErrors[errorKey]
                const value = entry[field.name] ?? ''

                return (
                  <div key={field.name} className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      {field.label}
                      {field.required && <span className="text-error ml-0.5"> *</span>}
                    </label>

                    {field.type === 'select' && field.options ? (
                      <div className="relative">
                        <select
                          value={value}
                          onChange={(e) => handleFieldChange(idx, field.name, e.target.value)}
                          className={cn(inputClass, 'appearance-none cursor-pointer')}
                        >
                          <option value="">{field.placeholder ?? 'Select...'}</option>
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-sm">
                          expand_more
                        </span>
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={value}
                        onChange={(e) => handleFieldChange(idx, field.name, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className={cn(
                          'w-full bg-white border-none rounded-lg px-4 py-3',
                          'text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20',
                          'shadow-sm transition-all resize-none',
                        )}
                      />
                    ) : (
                      <input
                        type={field.type === 'email' ? 'email' : 'text'}
                        value={value}
                        onChange={(e) => handleFieldChange(idx, field.name, e.target.value)}
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
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add entry button */}
      <button
        type="button"
        onClick={addEntry}
        className="mt-4 w-full py-4 rounded-xl border-2 border-dashed border-outline-variant/30 text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/20 transition-all active:scale-[0.99]"
      >
        <span className="material-symbols-outlined text-lg">add</span>
        Add {sectionName}
      </button>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Validation helpers for repeatable sections
// ---------------------------------------------------------------------------

/** Validate all repeatable section entries, returns error map */
function validateRepeatableSections(
  sections: { sectionName: string; fields: FormFieldDefinition[]; meta: FormSectionMeta | undefined }[],
  repeatableData: Record<string, RepeatableEntry[]>,
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const { sectionName, fields, meta } of sections) {
    const sectionKey = sectionName.replace(/\s+/g, '_')
    const entries = repeatableData[sectionKey] ?? []
    const minEntries = meta?.minEntries ?? 1

    if (entries.length < minEntries) {
      errors[`${sectionKey}._section`] = `At least ${minEntries} ${minEntries === 1 ? 'entry is' : 'entries are'} required`
    }

    entries.forEach((entry, idx) => {
      for (const field of fields) {
        if (field.required && (!entry[field.name] || entry[field.name].trim() === '')) {
          errors[`${sectionKey}.${idx}.${field.name}`] = `${field.label} is required`
        }
        if (field.type === 'email' && entry[field.name] && entry[field.name].trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(entry[field.name])) {
            errors[`${sectionKey}.${idx}.${field.name}`] = 'Invalid email address'
          }
        }
      }
    })

    // Special: Customer Support Contact must have at least one Primary role
    if (sectionName === 'Customer Support Contact') {
      const hasPrimary = entries.some((e) => e.contactRole === 'Primary')
      if (!hasPrimary && entries.length > 0) {
        errors[`${sectionKey}._section_primary`] = 'At least one contact must have the Primary role'
      }
    }
  }

  return errors
}

// Required lifecycle state for each task type
const REQUIRED_LIFECYCLE: Record<string, string> = {
  [TaskType.T01]: 'None',
  [TaskType.T02]: 'Onboarded',
  [TaskType.T03]: 'UatCompleted',
  [TaskType.T04]: 'Live',
}

export function FormStep({ product, task, initialData, onSubmit, onBack }: FormStepProps) {
  const { data: schema, isLoading } = useFormSchema(product.code, task.type)
  const { user } = useAuth()
  const { data: allPartners = [] } = usePartners()

  // Filter partners: must have this product at the required lifecycle state
  const eligiblePartners = useMemo(() => {
    const requiredState = REQUIRED_LIFECYCLE[task.type]
    return allPartners.filter((p) =>
      p.productDetails.some(
        (pd) => pd.productCode === product.code && pd.lifecycleState === requiredState,
      ),
    )
  }, [allPartners, product.code, task.type])

  // File upload: single shared <input> to avoid Windows file dialog perf issues
  // Restore files from initialData when navigating back from Review step
  const [files, setFiles] = useState<Record<string, File | null>>(() => {
    if (initialData?._files && typeof initialData._files === 'object') {
      return initialData._files as Record<string, File | null>
    }
    return {}
  })
  const [fileSubmitAttempted, setFileSubmitAttempted] = useState(false)
  const [fileErrors, setFileErrors] = useState<Record<string, string | null>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeDocRef = useRef<string | null>(null)

  const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.doc', '.xls', '.txt']
  const MAX_FILE_SIZE_MB = 10

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const docName = activeDocRef.current
    if (!docName) return
    const selected = e.target.files?.[0] ?? null
    if (!selected) return
    e.target.value = ''

    const ext = '.' + selected.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileErrors((prev) => ({ ...prev, [docName]: 'Unsupported file type. Use: PDF, DOCX, XLSX, PNG, JPG' }))
      return
    }
    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileErrors((prev) => ({ ...prev, [docName]: `File exceeds ${MAX_FILE_SIZE_MB} MB limit` }))
      return
    }

    setFileErrors((prev) => ({ ...prev, [docName]: null }))
    setFiles((prev) => ({ ...prev, [docName]: selected }))
  }

  function triggerFileUpload(docName: string) {
    activeDocRef.current = docName
    fileInputRef.current?.click()
  }

  // Determine which sections are repeatable
  const repeatableSectionNames = useMemo(() => {
    if (!schema?.sectionMeta) return new Set<string>()
    return new Set(schema.sectionMeta.filter((m) => m.repeatable).map((m) => m.name))
  }, [schema])

  // Repeatable section data: sectionKey -> entries[]
  const [repeatableData, setRepeatableData] = useState<Record<string, RepeatableEntry[]>>({})
  const [repeatableErrors, setRepeatableErrors] = useState<Record<string, string>>({})

  // Initialize repeatable data when schema loads or initialData changes
  useEffect(() => {
    if (!schema) return
    const sections = groupBySection(schema.fields)
    const newRepData: Record<string, RepeatableEntry[]> = {}

    for (const { sectionName, fields } of sections) {
      if (!repeatableSectionNames.has(sectionName)) continue
      const sectionKey = sectionName.replace(/\s+/g, '_')
      const meta = getSectionMeta(sectionName, schema.sectionMeta)
      const minEntries = meta?.minEntries ?? 1

      // Try to restore from initialData
      if (initialData?.[`_repeatable_${sectionKey}`]) {
        try {
          const parsed = JSON.parse(initialData[`_repeatable_${sectionKey}`] as string)
          if (Array.isArray(parsed) && parsed.length >= 1) {
            newRepData[sectionKey] = parsed
            continue
          }
        } catch { /* ignore */ }
      }

      // Default: create minEntries empty entries
      newRepData[sectionKey] = Array.from({ length: minEntries }, () => createEmptyEntry(fields))
    }

    setRepeatableData(newRepData)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, repeatableSectionNames, initialData])

  const zodSchema = useMemo(
    () => (schema ? buildZodSchema(schema.fields, repeatableSectionNames) : z.object({})),
    [schema, repeatableSectionNames],
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FieldValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(zodSchema) as any,
    mode: 'onChange',
    defaultValues: initialData ?? {},
  })

  // Watch partner selection to auto-fill company code
  const selectedPartnerId = watch('partnerName')
  const selectedPartner = useMemo(
    () => eligiblePartners.find((p) => p.id === selectedPartnerId),
    [eligiblePartners, selectedPartnerId],
  )
  const companyCode = useMemo(() => {
    if (!selectedPartner) return null
    const pd = selectedPartner.productDetails.find((d) => d.productCode === product.code)
    return pd?.companyCode ?? null
  }, [selectedPartner, product.code])

  // Set companyCode in form when it changes
  useEffect(() => {
    setValue('companyCode', companyCode ?? '')
  }, [companyCode, setValue])

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

  const handleRepeatableChange = useCallback((sectionKey: string, entries: RepeatableEntry[]) => {
    setRepeatableData((prev) => ({ ...prev, [sectionKey]: entries }))
    // Clear errors for this section when user edits
    setRepeatableErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (key.startsWith(sectionKey + '.')) delete next[key]
      }
      return next
    })
  }, [])

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

  // Get repeatable section info for validation
  const repeatableSectionInfos = sections
    .filter(({ sectionName }) => repeatableSectionNames.has(sectionName))
    .map(({ sectionName, fields }) => ({
      sectionName,
      fields,
      meta: getSectionMeta(sectionName, schema.sectionMeta),
    }))

  function onFormSubmit(data: FieldValues) {
    // Validate repeatable sections
    const repErrors = validateRepeatableSections(repeatableSectionInfos, repeatableData)
    if (Object.keys(repErrors).length > 0) {
      setRepeatableErrors(repErrors)
      return
    }
    setRepeatableErrors({})

    // Validate required documents — all must be uploaded
    if (schema && schema.requiredDocuments.length > 0) {
      const missingFiles = schema.requiredDocuments.some((doc) => !files[doc.name])
      if (missingFiles) {
        setFileSubmitAttempted(true)
        return
      }
    }

    // Merge repeatable data into formData as JSON strings
    const merged: AnyRecord = { ...data }
    for (const [sectionKey, entries] of Object.entries(repeatableData)) {
      merged[`_repeatable_${sectionKey}`] = JSON.stringify(entries)
    }
    // Attach files for upload after ticket creation
    merged._files = files
    onSubmit(merged)
  }

  // Format task label e.g. T01 -> T-01
  const taskLabel = task.type.replace(/^T0?(\d+)$/, 'T-$1').replace('T-', 'T-0').replace('T-00', 'T-0')
  const taskCode = `${taskLabel}: ${task.name}`

  return (
    <>
      <div className="max-w-5xl mx-auto pb-36">
        {/* Page Header — Stitch V2 style */}
        <div className="mb-12">
          <div className="flex items-start justify-between gap-4 mb-8">
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
          {/* Step indicator bar */}
          <div className="flex gap-2 h-1.5 w-full">
            <div className="flex-1 bg-primary rounded-full" />
            <div className="flex-1 bg-primary rounded-full" />
            <div className="flex-1 bg-primary rounded-full" />
            <div className="flex-1 bg-surface-container-highest rounded-full" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="space-y-12">
          {/* Form Sections */}
          {sections.map(({ sectionName, fields }) => {
            const meta = getSectionMeta(sectionName, schema.sectionMeta)

            // --- Repeatable section ---
            if (repeatableSectionNames.has(sectionName)) {
              const sectionKey = sectionName.replace(/\s+/g, '_')
              const entries = repeatableData[sectionKey] ?? []

              // Check for section-level errors
              const sectionError = repeatableErrors[`${sectionKey}._section`]
              const primaryError = repeatableErrors[`${sectionKey}._section_primary`]

              return (
                <div key={sectionName}>
                  <RepeatableSection
                    sectionName={sectionName}
                    meta={meta}
                    fields={fields}
                    entries={entries}
                    onChange={(newEntries) => handleRepeatableChange(sectionKey, newEntries)}
                    validationErrors={repeatableErrors}
                  />
                  {sectionError && (
                    <p className="text-xs text-error mt-2 ml-1">{sectionError}</p>
                  )}
                  {primaryError && (
                    <p className="text-xs text-error mt-2 ml-1">{primaryError}</p>
                  )}
                </div>
              )
            }

            // --- Flat section (original logic) ---
            const icon = meta?.icon
            const iconBg = meta?.iconBg ?? 'bg-surface-container-lowest'
            const iconColor = meta?.colorAccent ?? 'text-primary'
            const columns = meta?.columns ?? 2
            const subtitle = meta?.subtitle
            const isToggleOnlySection = fields.length === 1 && fields[0].type === 'toggle'

            return (
              <section
                key={sectionName}
                className="bg-surface-container-low rounded-xl p-10 transition-all hover:bg-surface-container-high/50"
              >
                {/* Section header */}
                <div className={cn('flex items-center gap-4', isToggleOnlySection ? 'mb-0' : 'mb-8')}>
                  {icon ? (
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg, iconColor)}>
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
                    <ToggleField field={fields[0]} register={register} checked={!!watch(fields[0].name)} />
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
                        partnerOptions={field.name === 'partnerName' ? eligiblePartners.map((p) => ({ id: p.id, name: p.name })) : undefined}
                        companyCode={field.name === 'companyCode' ? companyCode : undefined}
                        watchedValue={field.type === 'toggle' ? watch(field.name) : undefined}
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
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {schema.requiredDocuments.map((doc) => (
                  <FileUpload
                    key={doc.name}
                    label={doc.label}
                    icon={doc.icon ?? 'description'}
                    file={files[doc.name] ?? null}
                    onUploadClick={() => triggerFileUpload(doc.name)}
                    onRemove={() => {
                      setFiles((prev) => ({ ...prev, [doc.name]: null }))
                      setFileErrors((prev) => ({ ...prev, [doc.name]: null }))
                    }}
                    error={fileErrors[doc.name]}
                    showError={fileSubmitAttempted && !files[doc.name]}
                  />
                ))}
              </div>
              {fileSubmitAttempted && schema.requiredDocuments.some((doc) => !files[doc.name]) && (
                <p className="text-sm text-error font-medium flex items-center gap-1.5 mt-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  All required documents must be uploaded before submitting
                </p>
              )}
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
        <aside className="hidden xl:block fixed top-64 right-12 w-64 space-y-6 z-30">
          <div className="p-6 rounded-2xl bg-slate-100/50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Request Metadata
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Requested By</p>
                <p className="text-sm font-semibold text-slate-700">
                  {user.fullName}
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
            className="px-6 py-3 border border-outline-variant rounded-xl text-on-surface-variant font-bold text-sm hover:bg-surface-container-low hover:border-primary/20 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">save</span>
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
