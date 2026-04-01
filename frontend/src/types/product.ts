import type { ProductCode, TaskType } from './enums'

export interface Product {
  code: ProductCode
  name: string
  description: string
  accessType: 'Portal + API' | 'API'
  icon: string
  bgIcon: string
}

export interface TaskOption {
  type: TaskType
  name: string
  description: string
  enabled: boolean
  disabledReason?: string
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

export interface FormSchema {
  fields: FormFieldDefinition[]
  requiredDocuments: { name: string; label: string }[]
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
