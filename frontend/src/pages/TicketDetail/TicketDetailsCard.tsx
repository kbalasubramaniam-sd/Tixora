import type { TicketDetail } from '@/types/ticket'
import type { FormFieldDefinition } from '@/types/product'
import { useFormSchema } from '@/api/hooks/useProducts'

interface TicketDetailsCardProps {
  ticket: TicketDetail
}

function resolveDisplayValue(field: FormFieldDefinition, value: unknown): string {
  if (value === undefined || value === null || value === '') return '—'

  if (field.type === 'toggle') return value ? 'Yes' : 'No'

  if ((field.type === 'select' || field.type === 'radio-card') && field.options) {
    const option = field.options.find((o) => o.value === value)
    return option?.label ?? String(value)
  }

  return String(value)
}

function formatFieldLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()
}

function tryParseRepeatable(value: string): Record<string, string>[] | null {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') return parsed
  } catch { /* not JSON */ }
  return null
}

export function TicketDetailsCard({ ticket }: TicketDetailsCardProps) {
  const { data: schema } = useFormSchema(ticket.productCode, ticket.taskType)

  if (!schema) {
    return (
      <div className="bg-surface-container-lowest p-8 rounded-xl custom-shadow">
        <h3 className="text-xl font-extrabold text-on-surface">Ticket Details</h3>
        <p className="text-sm text-on-surface-variant mt-4">Loading...</p>
      </div>
    )
  }

  // Group fields by section
  const sections = new Map<string, FormFieldDefinition[]>()
  for (const field of schema.fields) {
    const group = sections.get(field.section) ?? []
    group.push(field)
    sections.set(field.section, group)
  }

  const sectionMetaMap = new Map(schema.sectionMeta?.map((s) => [s.name, s]))

  return (
    <div className="bg-surface-container-lowest p-8 rounded-xl custom-shadow">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-extrabold text-on-surface">Ticket Details</h3>
      </div>

      <div className="space-y-8">
        {Array.from(sections.entries()).map(([sectionName, fields]) => {
          const meta = sectionMetaMap.get(sectionName)
          const cols = meta?.columns ?? 2

          return (
            <div key={sectionName}>
              {sections.size > 1 && (
                <div className="flex items-center gap-2 mb-4">
                  {meta?.icon && (
                    <span className="material-symbols-outlined text-primary text-lg">{meta.icon}</span>
                  )}
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">
                    {sectionName}
                  </h4>
                </div>
              )}
              <div className={cols === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12' : 'space-y-6'}>
                {fields.map((field) => {
                  // partnerName and companyCode are top-level ticket fields, not in formData
                  const value = field.name === 'partnerName' ? ticket.partnerName
                    : field.name === 'companyCode' ? ticket.companyCode
                    : ticket.formData[field.name]
                  return (
                    <div key={field.name} className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-extrabold">
                        {field.label}
                      </p>
                      <p className="text-lg font-semibold text-on-surface">
                        {resolveDisplayValue(field, value)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Repeatable sections (e.g. UAT User Details, Invoicing Contacts) */}
        {Object.entries(ticket.formData as Record<string, unknown>)
          .filter(([key]) => key.startsWith('_repeatable_'))
          .map(([key, value]) => {
            const sectionLabel = key.replace('_repeatable_', '').replace(/_/g, ' ')
            const entries = typeof value === 'string' ? tryParseRepeatable(value) : null
            if (!entries || entries.length === 0) return null
            const meta = sectionMetaMap.get(sectionLabel.replace(/ /g, '_')) ?? sectionMetaMap.get(sectionLabel)
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-4">
                  {meta?.icon && (
                    <span className="material-symbols-outlined text-primary text-lg">{meta.icon}</span>
                  )}
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">
                    {sectionLabel}
                  </h4>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {entries.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="bg-surface-container-low rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full primary-gradient flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">{idx + 1}</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant">{sectionLabel} {idx + 1}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                        {Object.entries(entry)
                          .filter(([, v]) => v !== '' && v !== undefined && v !== null)
                          .map(([fieldKey, fieldValue]) => (
                            <div key={fieldKey} className="space-y-1">
                              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-extrabold">
                                {formatFieldLabel(fieldKey)}
                              </p>
                              <p className="text-sm font-semibold text-on-surface">{fieldValue}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

        {/* Show uploaded documents if any */}
        {ticket.documents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-lg">attach_file</span>
              <h4 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">
                Uploaded Documents
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ticket.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{doc.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{doc.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
