import { Button } from '@/components/ui/Button'
import { usePartners } from '@/api/hooks/usePartners'
import type { Product, TaskOption } from '@/types/product'

interface ReviewStepProps {
  product: Product
  task: TaskOption
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: Record<string, any>
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

// Format field keys for display: "partnerName" -> "Partner Name"
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

// Format repeatable section key for display: "UAT_User_Details" -> "UAT User Details"
function formatSectionKey(key: string): string {
  return key.replace(/_/g, ' ')
}

// Try to parse a repeatable data JSON string
function tryParseRepeatableEntries(value: string): Record<string, string>[] | null {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
      return parsed
    }
  } catch { /* not JSON */ }
  return null
}

export function ReviewStep({ product, task, formData, onSubmit, onBack, isSubmitting }: ReviewStepProps) {
  const { data: partners = [] } = usePartners()

  // Separate flat entries from repeatable entries
  const flatEntries: [string, string | boolean][] = []
  const repeatableEntries: { sectionLabel: string; entries: Record<string, string>[] }[] = []

  for (const [key, value] of Object.entries(formData)) {
    if (value === '' || value === undefined) continue

    if (key.startsWith('_repeatable_')) {
      const sectionKey = key.replace('_repeatable_', '')
      const parsed = typeof value === 'string' ? tryParseRepeatableEntries(value) : null
      if (parsed) {
        repeatableEntries.push({ sectionLabel: formatSectionKey(sectionKey), entries: parsed })
      }
      continue
    }

    flatEntries.push([key, value as string | boolean])
  }

  // Resolve partner ID to name for display
  function resolveValue(key: string, value: string | boolean): string {
    if (key === 'partnerName') {
      const partner = partners.find((p) => p.id === value)
      return partner?.name ?? String(value)
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    return String(value)
  }

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

      {/* Flat Form Data */}
      {flatEntries.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-8 mb-8">
          <h2 className="text-lg font-bold text-on-surface mb-6">Request Details</h2>
          <div className="space-y-4">
            {flatEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between items-start border-b border-outline pb-4">
                <span className="text-on-surface-variant">{formatLabel(key)}</span>
                <span className="text-on-surface font-medium text-right">{resolveValue(key, value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repeatable Section Data */}
      {repeatableEntries.map(({ sectionLabel, entries }) => (
        <div key={sectionLabel} className="bg-surface-container-lowest rounded-xl p-8 mb-8">
          <h2 className="text-lg font-bold text-on-surface mb-6">{sectionLabel}</h2>
          <div className="space-y-6">
            {entries.map((entry, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00696a] to-[#23a2a3] flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{idx + 1}</span>
                  </div>
                  <span className="text-sm font-semibold text-on-surface-variant">
                    {sectionLabel} {idx + 1}
                  </span>
                </div>
                {Object.entries(entry)
                  .filter(([, v]) => v !== '' && v !== undefined)
                  .map(([fieldKey, fieldValue]) => (
                    <div key={fieldKey} className="flex justify-between items-start border-b border-outline/50 pb-3 pl-8">
                      <span className="text-on-surface-variant text-sm">{formatLabel(fieldKey)}</span>
                      <span className="text-on-surface font-medium text-sm text-right">{fieldValue}</span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      ))}

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
