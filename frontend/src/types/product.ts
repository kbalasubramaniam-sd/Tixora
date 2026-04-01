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
  type: 'text' | 'email' | 'textarea' | 'select' | 'date' | 'toggle' | 'file'
  required: boolean
  placeholder?: string
  helperText?: string
  options?: { label: string; value: string }[]
  section: string
  conditional?: { field: string; value: string | boolean }
}

export interface FormSectionMeta {
  name: string
  icon?: string
  columns?: 1 | 2
  colorAccent?: string // e.g. 'bg-primary' or 'bg-tertiary' for the left bar
}

export interface FormSchema {
  fields: FormFieldDefinition[]
  requiredDocuments: { name: string; label: string }[]
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
