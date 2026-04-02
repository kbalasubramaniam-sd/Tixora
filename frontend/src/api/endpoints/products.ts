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
    { type: TaskType.T04, name: 'Access & Credential Support', description: 'Technical assistance for existing accounts, password resets, or API key troubleshooting.', enabled: false, disabledReason: 'Requires partner in ONBOARDED state', icon: 'support_agent' },
  ],
  [ProductCode.RHN]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Formal review and digital signature processing for partnership agreements and service level commitments.', enabled: true, icon: 'description' },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request sandbox credentials for User Acceptance Testing environments to validate integrations.', enabled: true, icon: 'person_add' },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Initiate live environment provisioning and primary administrator account setup for the portal.', enabled: true, icon: 'key' },
    { type: TaskType.T04, name: 'Access & Credential Support', description: 'Technical assistance for existing accounts, password resets, or API key troubleshooting.', enabled: true, icon: 'support_agent' },
  ],
  [ProductCode.WTQ]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Formal review and digital signature processing for partnership agreements and service level commitments.', enabled: true, icon: 'description' },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request sandbox credentials for User Acceptance Testing environments to validate integrations.', enabled: true, icon: 'person_add' },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Initiate live environment provisioning and primary administrator account setup for the portal.', enabled: true, icon: 'key' },
    { type: TaskType.T04, name: 'Access & Credential Support', description: 'Technical assistance for existing accounts, password resets, or API key troubleshooting.', enabled: true, icon: 'support_agent' },
  ],
  [ProductCode.MLM]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Formal review and digital signature processing for partnership agreements and service level commitments.', enabled: true, icon: 'description' },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request sandbox credentials for User Acceptance Testing environments to validate integrations.', enabled: true, icon: 'person_add' },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Initiate live environment provisioning and primary administrator account setup for the portal.', enabled: true, icon: 'key' },
    { type: TaskType.T04, name: 'Access & Credential Support', description: 'Technical assistance for existing accounts, password resets, or API key troubleshooting.', enabled: true, icon: 'support_agent' },
  ],
}

// ---------------------------------------------------------------------------
// Shared task-level schemas (used as fallback when no product-specific key)
// ---------------------------------------------------------------------------

// T-01: Agreement Validation & Sign-off — same across all products
// From Stitch V2: Partner Information (select + readonly code) + Required Documents grid
const schemaT01: FormSchema = {
  fields: [
    {
      name: 'partnerName',
      label: 'Partner Name',
      type: 'select',
      required: true,
      placeholder: 'Select an active partner...',
      section: 'Partner Information',
    },
    {
      name: 'companyCode',
      label: 'Company Code',
      type: 'readonly',
      required: false,
      section: 'Partner Information',
    },
  ],
  requiredDocuments: [
    {
      name: 'tradeLicense',
      label: 'Trade License',
      description: 'Valid for at least 6 months from current date.',
      icon: 'badge',
      required: true,
    },
    {
      name: 'vatCertificate',
      label: 'VAT Certificate',
      description: 'Official tax registration document.',
      icon: 'receipt_long',
      required: true,
    },
    {
      name: 'powerOfAttorney',
      label: 'Power of Attorney',
      description: 'Required if signing on behalf of owners.',
      icon: 'gavel',
      required: false,
    },
    {
      name: 'dulyFilledAgreement',
      label: 'Duly Filled Agreement',
      description: 'Signed & Stamped T-01 Form',
      icon: 'edit_document',
      required: true,
      variant: 'dashed',
    },
  ],
  sectionMeta: [
    { name: 'Partner Information', icon: 'handshake', iconBg: 'bg-gradient-to-br from-[#00696a] to-[#23a2a3]', columns: 2, colorAccent: 'text-white' },
  ],
}

// T-02: UAT Access Creation — same across all products
// From Stitch V2: Partner Information (select + readonly code) + UAT User Details (Full Name, Email, Mobile, Designation select)
const schemaT02: FormSchema = {
  fields: [
    {
      name: 'partnerName',
      label: 'Partner Name',
      type: 'select',
      required: true,
      placeholder: 'Select onboarded partner...',
      section: 'Partner Information',
    },
    {
      name: 'companyCode',
      label: 'Company Code',
      type: 'readonly',
      required: false,
      section: 'Partner Information',
    },
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'e.g. Sarah Jenkins',
      section: 'UAT User Details',
    },
    {
      name: 'emailAddress',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'sarah.j@company.com',
      section: 'UAT User Details',
    },
    {
      name: 'mobileNumber',
      label: 'Mobile Number',
      type: 'text',
      required: true,
      placeholder: '+1 (555) 000-0000',
      section: 'UAT User Details',
    },
    {
      name: 'designation',
      label: 'Designation',
      type: 'select',
      required: true,
      placeholder: 'Select role...',
      options: [
        { label: 'QA Engineer', value: 'qa' },
        { label: 'Product Manager', value: 'pm' },
        { label: 'Lead Developer', value: 'dev' },
        { label: 'Operations Specialist', value: 'ops' },
      ],
      section: 'UAT User Details',
    },
  ],
  requiredDocuments: [],
  sectionMeta: [
    { name: 'Partner Information', icon: 'corporate_fare', iconBg: 'bg-primary-container/20', columns: 2, colorAccent: 'text-primary' },
    { name: 'UAT User Details', icon: 'person_add', iconBg: 'bg-tertiary-container/20', columns: 2, colorAccent: 'text-tertiary' },
  ],
}

// T-03: Production Account Creation — unified schema from Stitch V3
// Sections: Partner Information, API Opt-In, Portal Admin User, Network, Invoicing Contacts, Customer Support
const schemaT03: FormSchema = {
  fields: [
    // Partner Information
    {
      name: 'partnerName',
      label: 'Partner Name',
      type: 'select',
      required: true,
      placeholder: 'Select Active UAT Partner',
      section: 'Partner Information',
    },
    {
      name: 'companyCode',
      label: 'Company Code',
      type: 'readonly',
      required: false,
      section: 'Partner Information',
    },
    // API Opt-In
    {
      name: 'apiOptIn',
      label: 'Enable automated programmatic access for this production account.',
      type: 'toggle',
      required: false,
      section: 'API Opt-In Selection',
    },
    // Portal Admin User
    {
      name: 'adminFullName',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Johnathan Doe',
      section: 'Portal Admin User',
    },
    {
      name: 'adminEmail',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'j.doe@company.com',
      section: 'Portal Admin User',
    },
    {
      name: 'adminMobile',
      label: 'Mobile Number',
      type: 'text',
      required: true,
      placeholder: '+1 (555) 000-0000',
      section: 'Portal Admin User',
    },
    {
      name: 'adminDesignation',
      label: 'Designation',
      type: 'text',
      required: true,
      placeholder: 'Operations Manager',
      section: 'Portal Admin User',
    },
    // Network
    {
      name: 'ipAddresses',
      label: 'IP Addresses for Whitelisting',
      type: 'textarea',
      required: true,
      placeholder: 'Enter comma-separated IP addresses (e.g., 192.168.1.1, 10.0.0.12)',
      helperText: 'Please specify all static IPs that will communicate with the Tixora Production environment.',
      section: 'Network',
    },
    // Invoicing Contacts
    {
      name: 'invoicingName',
      label: 'Contact Name',
      type: 'text',
      required: true,
      placeholder: 'Finance Dept',
      section: 'Invoicing Contacts',
    },
    {
      name: 'invoicingEmail',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'billing@company.com',
      section: 'Invoicing Contacts',
    },
    {
      name: 'invoicingPhone',
      label: 'Phone',
      type: 'text',
      required: true,
      placeholder: '+1 (555) 123-4567',
      section: 'Invoicing Contacts',
    },
    // Customer Support Contact
    {
      name: 'supportPrimaryName',
      label: 'Primary Contact Name',
      type: 'text',
      required: true,
      placeholder: 'Name',
      section: 'Customer Support Contact',
    },
    {
      name: 'supportPrimaryMobile',
      label: 'Primary Contact Mobile',
      type: 'text',
      required: true,
      placeholder: 'Mobile',
      section: 'Customer Support Contact',
    },
    {
      name: 'supportPrimaryEmail',
      label: 'Primary Contact Email',
      type: 'email',
      required: true,
      placeholder: 'Email',
      section: 'Customer Support Contact',
    },
    {
      name: 'supportEscalationName',
      label: 'Escalation Contact Name',
      type: 'text',
      required: false,
      placeholder: 'Name',
      section: 'Customer Support Contact',
    },
    {
      name: 'supportEscalationMobile',
      label: 'Escalation Contact Mobile',
      type: 'text',
      required: false,
      placeholder: 'Mobile',
      section: 'Customer Support Contact',
    },
    {
      name: 'supportEscalationEmail',
      label: 'Escalation Contact Email',
      type: 'email',
      required: false,
      placeholder: 'Email',
      section: 'Customer Support Contact',
    },
  ],
  requiredDocuments: [],
  sectionMeta: [
    { name: 'Partner Information', icon: 'corporate_fare', iconBg: 'bg-transparent', columns: 2, colorAccent: 'text-primary' },
    { name: 'API Opt-In Selection', icon: 'api', iconBg: 'bg-primary-container/10', columns: 1, colorAccent: 'text-primary' },
    { name: 'Portal Admin User', icon: 'admin_panel_settings', iconBg: 'bg-transparent', columns: 2, colorAccent: 'text-primary' },
    { name: 'Network', icon: 'lan', iconBg: 'bg-transparent', columns: 1, colorAccent: 'text-primary' },
    { name: 'Invoicing Contacts', icon: 'receipt_long', iconBg: 'bg-transparent', columns: 2, colorAccent: 'text-primary' },
    { name: 'Customer Support Contact', icon: 'support_agent', iconBg: 'bg-transparent', columns: 2, colorAccent: 'text-primary', subtitle: 'First & escalation contacts' },
  ],
}

// T-04: Access & Credential Support — unified schema from Stitch V2
// From Stitch V2: Partner Information (select + readonly code) + Support Details (radio-card issue type + description textarea)
const schemaT04: FormSchema = {
  fields: [
    {
      name: 'partnerName',
      label: 'Partner Name',
      type: 'select',
      required: true,
      placeholder: 'Select Live Partner...',
      section: 'Partner Information',
    },
    {
      name: 'companyCode',
      label: 'Company Code',
      type: 'readonly',
      required: false,
      section: 'Partner Information',
    },
    {
      name: 'issueType',
      label: 'Issue Type',
      type: 'radio-card',
      required: true,
      options: [
        { label: 'Portal Login Issue', value: 'PortalLoginIssue', icon: 'login' },
        { label: 'API Credentials', value: 'ApiCredentialIssue', icon: 'key' },
        { label: 'Password Reset', value: 'PortalPasswordReset', icon: 'lock_reset' },
        { label: 'Account Unlock', value: 'AccountUnlock', icon: 'lock_open' },
        { label: 'General Access Issue', value: 'GeneralAccessIssue', icon: 'help' },
      ],
      section: 'Support Details',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      placeholder: 'Describe the issue or required permissions in detail...',
      helperText: 'Include any error codes received during authentication.',
      section: 'Support Details',
    },
  ],
  requiredDocuments: [],
  sectionMeta: [
    { name: 'Partner Information', icon: 'corporate_fare', iconBg: 'bg-surface-container-highest', columns: 2, colorAccent: 'text-primary', subtitle: 'Details regarding the entity requesting technical credentials.' },
    { name: 'Support Details', icon: 'emergency_home', iconBg: 'bg-surface-container-highest', columns: 1, colorAccent: 'text-primary', subtitle: 'Specify the exact nature of the access issue or request.' },
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

  // T-03: unified schema across all products (Stitch V3)
  [TaskType.T03]: schemaT03,

  // T-04: unified schema across all products (Stitch V2)
  [TaskType.T04]: schemaT04,
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
