import type { ProductCode, TaskType } from './enums'

export interface Product {
  code: ProductCode
  name: string
  description: string
  accessType: 'Portal + API' | 'API'
  icon: string
  bgIcon: string
  iconBg: string
  iconColor: string
}

export interface TaskOption {
  type: TaskType
  name: string
  description: string
  enabled: boolean
  disabledReason?: string
  icon: string
}

export interface FormFieldDefinition {
  name: string
  label: string
  type: 'text' | 'email' | 'textarea' | 'select' | 'date' | 'toggle' | 'file' | 'readonly' | 'radio-card'
  required: boolean
  placeholder?: string
  helperText?: string
  options?: { label: string; value: string; icon?: string }[]
  section: string
  conditional?: { field: string; value: string | boolean }
}

export interface FormSectionMeta {
  name: string
  icon?: string
  iconBg?: string  // e.g. 'bg-primary-container/20' for icon container background
  columns?: 1 | 2
  colorAccent?: string // e.g. 'bg-primary' or 'bg-tertiary' for the left bar
  subtitle?: string
}

export interface RequiredDocument {
  name: string
  label: string
  description?: string
  icon?: string
  required?: boolean  // true = required (shows error icon), false/undefined = optional
  variant?: 'primary' | 'dashed'  // 'dashed' = special dashed-border style for main agreement
}

export interface FormSchema {
  fields: FormFieldDefinition[]
  requiredDocuments: RequiredDocument[]
  sectionMeta?: FormSectionMeta[]
}

export interface TicketCreateRequest {
  productCode: ProductCode
  taskType: TaskType
  formData: Record<string, string | boolean>
  documents: { name: string; file: File }[]
}

export interface TicketCreateResponse {
  ticketId: string
  routedTo: string
}
