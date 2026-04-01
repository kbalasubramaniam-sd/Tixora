import { apiClient } from '@/api/client'
import { ProductCode, TaskType } from '@/types/enums'
import type { Product, TaskOption, FormSchema, TicketCreateRequest, TicketCreateResponse } from '@/types/product'

// --- Mock data ---

const mockProducts: Product[] = [
  { code: ProductCode.RBT, name: 'Rabet', description: 'RBT · Federal Authority ICP', accessType: 'Portal + API', icon: 'hub', bgIcon: 'lan' },
  { code: ProductCode.RHN, name: 'Rhoon', description: 'RHN · ADP + ITC', accessType: 'Portal + API', icon: 'account_tree', bgIcon: 'cloud_sync' },
  { code: ProductCode.WTQ, name: 'Wtheeq', description: 'WTQ · ADP + ITC', accessType: 'API', icon: 'data_object', bgIcon: 'code' },
  { code: ProductCode.MLM, name: 'Mulem', description: 'MLM · Motor', accessType: 'API', icon: 'settings_input_component', bgIcon: 'directions_car' },
]

const mockTasks: Record<string, TaskOption[]> = {
  [ProductCode.RBT]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Validate and sign off a partner agreement', enabled: true },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request UAT environment access for a partner', enabled: true },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Create a partner account on the platform', enabled: true },
    { type: TaskType.T04, name: 'User Account Creation', description: 'Create user accounts for an existing partner', enabled: false, disabledReason: 'Requires completed Partner Account (T-03)' },
    { type: TaskType.T05, name: 'Access & Credential Support', description: 'Resolve login or credential issues', enabled: false, disabledReason: 'Requires partner in ONBOARDED state' },
  ],
  [ProductCode.RHN]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Validate and sign off a partner agreement', enabled: true },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request UAT environment access for a partner', enabled: true },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Create a partner account on the platform', enabled: true },
    { type: TaskType.T04, name: 'User Account Creation', description: 'Create user accounts for an existing partner', enabled: true },
    { type: TaskType.T05, name: 'Access & Credential Support', description: 'Resolve login or credential issues', enabled: true },
  ],
  [ProductCode.WTQ]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Validate and sign off a partner agreement', enabled: true },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request UAT environment access for a partner', enabled: true },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Create a partner account on the platform', enabled: true },
    { type: TaskType.T04, name: 'User Account Creation', description: 'Create user accounts for an existing partner', enabled: true },
    { type: TaskType.T05, name: 'Access & Credential Support', description: 'Resolve login or credential issues', enabled: true },
  ],
  [ProductCode.MLM]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Validate and sign off a partner agreement', enabled: true },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request UAT environment access for a partner', enabled: true },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Create a partner account on the platform', enabled: true },
    { type: TaskType.T04, name: 'User Account Creation', description: 'Create user accounts for an existing partner', enabled: true },
    { type: TaskType.T05, name: 'Access & Credential Support', description: 'Resolve login or credential issues', enabled: true },
  ],
}

const mockFormSchemas: Record<string, FormSchema> = {
  [`${ProductCode.RBT}-${TaskType.T01}`]: {
    fields: [
      { name: 'partnerName', label: 'Partner Name', type: 'text', required: true, placeholder: 'Enter partner company name', section: 'Partner Information' },
      { name: 'scope', label: 'Scope', type: 'text', required: true, placeholder: 'Full data exchange, partial, etc.', section: 'Partner Information' },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true, section: 'Partner Information' },
      { name: 'commercialTerms', label: 'Commercial Terms', type: 'textarea', required: true, placeholder: 'Describe commercial terms', section: 'Partner Information' },
      { name: 'signatoryName', label: 'Signatory Name', type: 'text', required: true, placeholder: 'Full name of signatory', section: 'Signatory Details' },
      { name: 'signatoryTitle', label: 'Signatory Title', type: 'text', required: true, placeholder: 'Title / designation', section: 'Signatory Details' },
    ],
    requiredDocuments: [
      { name: 'agreementCopy', label: 'Agreement Copy' },
      { name: 'termLetter', label: 'Term Letter' },
      { name: 'vatCertificate', label: 'VAT Certificate' },
      { name: 'powerOfAttorney', label: 'Power of Attorney' },
    ],
  },
}

// Default fallback schema for any Product × Task not explicitly defined
const defaultFormSchema: FormSchema = {
  fields: [
    { name: 'partnerName', label: 'Partner Name', type: 'text', required: true, placeholder: 'Enter partner company name', section: 'Partner Information' },
    { name: 'description', label: 'Request Description', type: 'textarea', required: true, placeholder: 'Describe your request', section: 'Request Details' },
    { name: 'contactEmail', label: 'Contact Email', type: 'email', required: true, placeholder: 'email@example.com', section: 'Request Details' },
  ],
  requiredDocuments: [],
}

// --- API calls with mock fallback ---

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await apiClient.get<Product[]>('/products')
    return res.data
  } catch {
    return mockProducts
  }
}

export async function fetchTasks(productCode: string): Promise<TaskOption[]> {
  try {
    const res = await apiClient.get<TaskOption[]>(`/products/${productCode}/tasks`)
    return res.data
  } catch {
    return mockTasks[productCode] ?? mockTasks[ProductCode.RBT]
  }
}

export async function fetchFormSchema(productCode: string, taskType: string): Promise<FormSchema> {
  try {
    const res = await apiClient.get<FormSchema>(`/products/${productCode}/form-schema/${taskType}`)
    return res.data
  } catch {
    return mockFormSchemas[`${productCode}-${taskType}`] ?? defaultFormSchema
  }
}

export async function submitTicket(request: TicketCreateRequest): Promise<TicketCreateResponse> {
  try {
    const res = await apiClient.post<TicketCreateResponse>('/tickets', request)
    return res.data
  } catch {
    // Dev mock: generate fake ticket ID
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0')
    return {
      ticketId: `SPM-${request.productCode}-${request.taskType}-${date}-${seq}`,
      routedTo: 'Legal Review',
    }
  }
}
