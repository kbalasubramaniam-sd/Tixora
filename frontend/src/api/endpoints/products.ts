import { apiClient } from '@/api/client'
import { ProductCode, TaskType } from '@/types/enums'
import type { Product, TaskOption, FormSchema, TicketCreateRequest, TicketCreateResponse } from '@/types/product'

// --- Mock data ---

const mockProducts: Product[] = [
  { code: ProductCode.RBT, name: 'Rabet', description: 'RBT • Central Gateway Authority', accessType: 'Portal + API', icon: 'hub', bgIcon: 'lan', iconBg: 'bg-primary-container/10', iconColor: 'text-primary' },
  { code: ProductCode.RHN, name: 'Rhoon', description: 'RHN • Identity Compliance', accessType: 'Portal + API', icon: 'account_balance', bgIcon: 'cloud_sync', iconBg: 'bg-tertiary-container/10', iconColor: 'text-tertiary' },
  { code: ProductCode.WTQ, name: 'Wtheeq', description: 'WTQ • Digital Signature Hub', accessType: 'API', icon: 'encrypted', bgIcon: 'code', iconBg: 'bg-slate-200', iconColor: 'text-on-surface' },
  { code: ProductCode.MLM, name: 'Mulem', description: 'MLM • Intelligence Analytics', accessType: 'API', icon: 'psychology', bgIcon: 'directions_car', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
]

const mockTasks: Record<string, TaskOption[]> = {
  [ProductCode.RBT]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Formal review and digital signature processing for partnership agreements and service level commitments.', enabled: true, icon: 'description' },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request sandbox credentials for User Acceptance Testing environments to validate integrations.', enabled: true, icon: 'person_add' },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Initiate live environment provisioning and primary administrator account setup for the portal.', enabled: true, icon: 'key' },
    { type: TaskType.T04, name: 'User Account Creation', description: 'Create user accounts for an existing partner organisation already provisioned on the platform.', enabled: false, disabledReason: 'Requires completed Partner Account (T-03)', icon: 'group_add' },
    { type: TaskType.T05, name: 'Access & Credential Support', description: 'Technical assistance for existing accounts, password resets, or API key troubleshooting.', enabled: false, disabledReason: 'Requires partner in ONBOARDED state', icon: 'support_agent' },
  ],
  [ProductCode.RHN]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Formal review and digital signature processing for partnership agreements and service level commitments.', enabled: true, icon: 'description' },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request sandbox credentials for User Acceptance Testing environments to validate integrations.', enabled: true, icon: 'person_add' },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Initiate live environment provisioning and primary administrator account setup for the portal.', enabled: true, icon: 'key' },
    { type: TaskType.T04, name: 'User Account Creation', description: 'Create user accounts for an existing partner organisation already provisioned on the platform.', enabled: true, icon: 'group_add' },
    { type: TaskType.T05, name: 'Access & Credential Support', description: 'Technical assistance for existing accounts, password resets, or API key troubleshooting.', enabled: true, icon: 'support_agent' },
  ],
  [ProductCode.WTQ]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Formal review and digital signature processing for partnership agreements and service level commitments.', enabled: true, icon: 'description' },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request sandbox credentials for User Acceptance Testing environments to validate integrations.', enabled: true, icon: 'person_add' },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Initiate live environment provisioning and primary administrator account setup for the portal.', enabled: true, icon: 'key' },
    { type: TaskType.T04, name: 'User Account Creation', description: 'Create user accounts for an existing partner organisation already provisioned on the platform.', enabled: true, icon: 'group_add' },
    { type: TaskType.T05, name: 'Access & Credential Support', description: 'Technical assistance for existing accounts, password resets, or API key troubleshooting.', enabled: true, icon: 'support_agent' },
  ],
  [ProductCode.MLM]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Formal review and digital signature processing for partnership agreements and service level commitments.', enabled: true, icon: 'description' },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request sandbox credentials for User Acceptance Testing environments to validate integrations.', enabled: true, icon: 'person_add' },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Initiate live environment provisioning and primary administrator account setup for the portal.', enabled: true, icon: 'key' },
    { type: TaskType.T04, name: 'User Account Creation', description: 'Create user accounts for an existing partner organisation already provisioned on the platform.', enabled: true, icon: 'group_add' },
    { type: TaskType.T05, name: 'Access & Credential Support', description: 'Technical assistance for existing accounts, password resets, or API key troubleshooting.', enabled: true, icon: 'support_agent' },
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
