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

// ---------------------------------------------------------------------------
// Shared task-level schemas (used as fallback when no product-specific key)
// ---------------------------------------------------------------------------

// T-01: Agreement Validation & Sign-off — same across all products
const schemaT01: FormSchema = {
  fields: [
    { name: 'partnerName', label: 'Partner Name', type: 'select', required: true, placeholder: 'Select partner entity', section: 'Partner Information' },
    { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true, section: 'Partner Information' },
  ],
  requiredDocuments: [
    { name: 'tradeLicense', label: 'Trade License' },
    { name: 'vatCertificate', label: 'VAT Certificate' },
    { name: 'powerOfAttorney', label: 'Power of Attorney' },
    { name: 'dulyFilledAgreement', label: 'Duly Filled Agreement' },
  ],
  sectionMeta: [
    { name: 'Partner Information', icon: 'handshake', columns: 2, colorAccent: 'bg-primary' },
  ],
}

// T-02: UAT Access Creation — same across all products
const schemaT02: FormSchema = {
  fields: [
    { name: 'partnerName', label: 'Partner Name', type: 'select', required: true, placeholder: 'Select a partner...', section: 'Request Details' },
    { name: 'companyCode', label: 'Company Code', type: 'text', required: true, placeholder: 'e.g. GLC-9921', section: 'Request Details' },
    { name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: "Enter user's full name", section: 'UAT User Details' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'name@company.com', section: 'UAT User Details' },
    { name: 'mobile', label: 'Mobile', type: 'text', required: true, placeholder: 'Phone number', section: 'UAT User Details' },
    { name: 'designation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Operations Specialist', section: 'UAT User Details' },
  ],
  requiredDocuments: [],
  sectionMeta: [
    { name: 'Request Details', icon: 'corporate_fare', columns: 2, colorAccent: 'bg-primary' },
    { name: 'UAT User Details', icon: 'person_add', columns: 2, colorAccent: 'bg-secondary' },
  ],
}

// T-03: Partner Account Creation — Both-access products (RBT, RHN)
const schemaT03Both: FormSchema = {
  fields: [
    { name: 'partnerName', label: 'Partner Name', type: 'select', required: true, placeholder: 'Select partner entity', section: 'Partner Details' },
    { name: 'registrationNumber', label: 'Registration Number', type: 'text', required: true, placeholder: 'e.g. CN-20240001', section: 'Partner Details' },
    { name: 'contactEmail', label: 'Contact Email', type: 'email', required: true, placeholder: 'contact@company.com', section: 'Partner Details' },
    { name: 'adminUsername', label: 'Admin Username', type: 'text', required: true, placeholder: 'e.g. admin.company', section: 'Portal Access' },
    { name: 'adminEmail', label: 'Admin Email', type: 'email', required: true, placeholder: 'admin@company.com', section: 'Portal Access' },
    { name: 'apiAccess', label: 'Does this partner require API access?', type: 'toggle', required: false, section: 'Access Configuration' },
    { name: 'apiUseCase', label: 'API Use Case', type: 'textarea', required: false, placeholder: 'Describe the intended API use case', section: 'API Access', conditional: { field: 'apiAccess', value: true } },
    { name: 'expectedCallVolume', label: 'Expected Call Volume', type: 'select', required: false, options: [{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }], section: 'API Access', conditional: { field: 'apiAccess', value: true } },
    { name: 'technicalContactName', label: 'Technical Contact Name', type: 'text', required: false, placeholder: 'Full name', section: 'API Access', conditional: { field: 'apiAccess', value: true } },
    { name: 'technicalContactEmail', label: 'Technical Contact Email', type: 'email', required: false, placeholder: 'tech@company.com', section: 'API Access', conditional: { field: 'apiAccess', value: true } },
    { name: 'ipAddresses', label: 'IP Addresses', type: 'textarea', required: false, placeholder: 'One IP per line', helperText: 'Whitelisted IPs for API calls', section: 'API Access', conditional: { field: 'apiAccess', value: true } },
  ],
  requiredDocuments: [],
  sectionMeta: [
    { name: 'Partner Details', icon: 'domain', columns: 2, colorAccent: 'bg-primary' },
    { name: 'Portal Access', icon: 'admin_panel_settings', columns: 2, colorAccent: 'bg-secondary' },
    { name: 'Access Configuration', icon: 'toggle_on', columns: 1, colorAccent: 'bg-tertiary' },
    { name: 'API Access', icon: 'api', columns: 2, colorAccent: 'bg-tertiary' },
  ],
}

// T-03: Partner Account Creation — API-only products (WTQ, MLM)
const schemaT03Api: FormSchema = {
  fields: [
    { name: 'partnerName', label: 'Partner Name', type: 'select', required: true, placeholder: 'Select partner entity', section: 'Partner Details' },
    { name: 'registrationNumber', label: 'Registration Number', type: 'text', required: true, placeholder: 'e.g. CN-20240001', section: 'Partner Details' },
    { name: 'contactEmail', label: 'Contact Email', type: 'email', required: true, placeholder: 'contact@company.com', section: 'Partner Details' },
    { name: 'apiUseCase', label: 'API Use Case', type: 'textarea', required: true, placeholder: 'Describe the intended API use case', section: 'API Integration' },
    { name: 'expectedCallVolume', label: 'Expected Call Volume', type: 'select', required: true, options: [{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }], section: 'API Integration' },
    { name: 'technicalContactName', label: 'Technical Contact Name', type: 'text', required: true, placeholder: 'Full name', section: 'API Integration' },
    { name: 'technicalContactEmail', label: 'Technical Contact Email', type: 'email', required: true, placeholder: 'tech@company.com', section: 'API Integration' },
    { name: 'ipAddresses', label: 'IP Addresses', type: 'textarea', required: true, placeholder: 'One IP per line', helperText: 'Whitelisted IPs for API calls', section: 'API Integration' },
    { name: 'preferredEnvironment', label: 'Preferred Environment', type: 'select', required: true, options: [{ label: 'Staging', value: 'staging' }, { label: 'Production', value: 'production' }], section: 'API Integration' },
  ],
  requiredDocuments: [],
  sectionMeta: [
    { name: 'Partner Details', icon: 'domain', columns: 2, colorAccent: 'bg-primary' },
    { name: 'API Integration', icon: 'api', columns: 2, colorAccent: 'bg-tertiary' },
  ],
}

// T-04: User Account Creation — same across all products
const schemaT04: FormSchema = {
  fields: [
    { name: 'partnerAccount', label: 'Partner Account', type: 'select', required: true, placeholder: 'Select partner account', section: 'Partner Reference' },
    { name: 'product', label: 'Product', type: 'text', required: true, placeholder: 'Filled from context', helperText: 'Pre-filled based on your product selection', section: 'Partner Reference' },
    { name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter full name', section: 'User Details' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'user@company.com', section: 'User Details' },
    { name: 'designation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Operations Manager', section: 'User Details' },
    { name: 'accessRole', label: 'Access Role', type: 'select', required: true, options: [{ label: 'Admin', value: 'admin' }, { label: 'Operator', value: 'operator' }, { label: 'ReadOnly', value: 'readonly' }], section: 'User Details' },
  ],
  requiredDocuments: [],
  sectionMeta: [
    { name: 'Partner Reference', icon: 'link', columns: 2, colorAccent: 'bg-secondary' },
    { name: 'User Details', icon: 'badge', columns: 2, colorAccent: 'bg-primary' },
  ],
}

// T-05: Access & Credential Support — Both-access products (RBT, RHN)
const schemaT05Both: FormSchema = {
  fields: [
    { name: 'partnerName', label: 'Partner Name', type: 'select', required: true, placeholder: 'Select partner entity', section: 'Affected User' },
    { name: 'userEmail', label: 'User Email', type: 'email', required: true, placeholder: 'user@company.com', section: 'Affected User' },
    { name: 'userFullName', label: 'User Full Name', type: 'text', required: true, placeholder: 'Enter full name', section: 'Affected User' },
    { name: 'issueType', label: 'Issue Type', type: 'select', required: true, options: [{ label: 'Portal login issue', value: 'portal_login' }, { label: 'API credential issue', value: 'api_credential' }], section: 'Issue Details' },
    { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the issue in detail', section: 'Issue Details' },
  ],
  requiredDocuments: [],
  sectionMeta: [
    { name: 'Affected User', icon: 'manage_accounts', columns: 2, colorAccent: 'bg-primary' },
    { name: 'Issue Details', icon: 'support_agent', columns: 1, colorAccent: 'bg-tertiary' },
  ],
}

// T-05: Access & Credential Support — API-only products (WTQ, MLM)
const schemaT05Api: FormSchema = {
  fields: [
    { name: 'partnerName', label: 'Partner Name', type: 'select', required: true, placeholder: 'Select partner entity', section: 'Affected User' },
    { name: 'userEmail', label: 'User Email', type: 'email', required: true, placeholder: 'user@company.com', section: 'Affected User' },
    { name: 'userFullName', label: 'User Full Name', type: 'text', required: true, placeholder: 'Enter full name', section: 'Affected User' },
    { name: 'issueType', label: 'Issue Type', type: 'select', required: true, options: [{ label: 'Portal password reset', value: 'portal_password_reset' }, { label: 'API credential issue', value: 'api_credential' }], section: 'Issue Details' },
    { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the issue in detail', section: 'Issue Details' },
  ],
  requiredDocuments: [],
  sectionMeta: [
    { name: 'Affected User', icon: 'manage_accounts', columns: 2, colorAccent: 'bg-primary' },
    { name: 'Issue Details', icon: 'support_agent', columns: 1, colorAccent: 'bg-tertiary' },
  ],
}

// ---------------------------------------------------------------------------
// mockFormSchemas — product-specific keys take priority over task-level keys
// ---------------------------------------------------------------------------

const mockFormSchemas: Record<string, FormSchema> = {
  // T-01: shared across all products — use task-level key only
  [TaskType.T01]: schemaT01,

  // T-02: shared across all products — use task-level key only
  [TaskType.T02]: schemaT02,

  // T-03: Both-access products
  [`${ProductCode.RBT}-${TaskType.T03}`]: schemaT03Both,
  [`${ProductCode.RHN}-${TaskType.T03}`]: schemaT03Both,
  // T-03: API-only products
  [`${ProductCode.WTQ}-${TaskType.T03}`]: schemaT03Api,
  [`${ProductCode.MLM}-${TaskType.T03}`]: schemaT03Api,

  // T-04: shared across all products — use task-level key only
  [TaskType.T04]: schemaT04,

  // T-05: Both-access products
  [`${ProductCode.RBT}-${TaskType.T05}`]: schemaT05Both,
  [`${ProductCode.RHN}-${TaskType.T05}`]: schemaT05Both,
  // T-05: API-only products
  [`${ProductCode.WTQ}-${TaskType.T05}`]: schemaT05Api,
  [`${ProductCode.MLM}-${TaskType.T05}`]: schemaT05Api,
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
    // Try product-specific key first, then task-level fallback, then default
    return (
      mockFormSchemas[`${productCode}-${taskType}`] ??
      mockFormSchemas[taskType] ??
      defaultFormSchema
    )
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
