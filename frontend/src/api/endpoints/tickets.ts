import { apiClient } from '@/api/client'
import { ProductCode, TaskType, TicketStatus, SlaStatus, LifecycleState } from '@/types/enums'
import type { TicketDetail } from '@/types/ticket'

// --- Mock ticket details (one per task type) ---

const mockTicketDetails: Record<string, TicketDetail> = {
  'SPM-RBT-T01-20260401-0001': {
    id: '1',
    ticketId: 'SPM-RBT-T01-20260401-0001',
    productCode: ProductCode.RBT,
    taskType: TaskType.T01,
    partnerName: 'ABC Insurance Co.',
    companyCode: 'ABC-RBT-2026',
    requesterName: 'Admin Ops',
    status: TicketStatus.InReview,
    currentStage: 'Legal Review',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 12.5,
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T10:30:00Z',
    createdBy: 'Admin Ops',
    assignedTo: 'Sarah Chen',
    lifecycleState: LifecycleState.Agreed,
    formData: {
      partnerName: 'ABC Insurance Co.',
      companyCode: 'ABC-RBT-2026',
    },
    documents: [
      { id: 'd1', name: 'Trade_License_2026.pdf', size: '2.4 MB', uploadedBy: 'Admin Ops', uploadedAt: '2026-04-01T08:05:00Z' },
      { id: 'd2', name: 'VAT_Certificate.pdf', size: '1.1 MB', uploadedBy: 'Admin Ops', uploadedAt: '2026-04-01T08:05:00Z' },
      { id: 'd3', name: 'Duly_Filled_Agreement.pdf', size: '3.8 MB', uploadedBy: 'Admin Ops', uploadedAt: '2026-04-01T08:06:00Z' },
    ],
    workflowStages: [
      { name: 'Legal Review', icon: 'gavel', status: 'current', assignedTo: 'Sarah Chen' },
      { name: 'Product Review', icon: 'inventory_2', status: 'future' },
      { name: 'EA Sign-off', icon: 'verified', status: 'future' },
      { name: 'Complete', icon: 'check_circle', status: 'future' },
    ],
    comments: [
      {
        id: 'c1',
        author: 'Sarah Chen',
        role: 'Legal Council',
        body: "I've reviewed the liability clauses on page 14. They align with our updated 2026 standards. Moving this to 'In Review' for product confirmation.",
        createdAt: '2026-04-01T10:00:00Z',
      },
      {
        id: 'c2',
        author: 'Marcus Thorne',
        role: 'Risk Analyst',
        body: 'Initial screening complete. Risk factor is low (0.12). Partner has provided all required certification docs in the vault.',
        createdAt: '2026-04-01T08:30:00Z',
      },
    ],
    auditTrail: [
      { id: 'a1', type: 'stage_transition', description: 'Ticket created and routed to Legal Review', timestamp: '2026-04-01T08:00:00Z' },
      { id: 'a2', type: 'document', description: 'Trade_License_2026.pdf uploaded by Admin Ops', timestamp: '2026-04-01T08:05:00Z' },
      { id: 'a3', type: 'document', description: 'VAT_Certificate.pdf uploaded by Admin Ops', timestamp: '2026-04-01T08:05:00Z' },
      { id: 'a4', type: 'comment', description: 'Comment added by Marcus Thorne', timestamp: '2026-04-01T08:30:00Z' },
      { id: 'a5', type: 'comment', description: 'Comment added by Sarah Chen', timestamp: '2026-04-01T10:00:00Z' },
    ],
  },

  'SPM-RHN-T02-20260401-0002': {
    id: '2',
    ticketId: 'SPM-RHN-T02-20260401-0002',
    productCode: ProductCode.RHN,
    taskType: TaskType.T02,
    partnerName: 'Gulf Trading LLC',
    companyCode: 'GTL-RHN-2026',
    requesterName: 'Admin Ops',
    status: TicketStatus.InReview,
    currentStage: 'Integration Review',
    slaStatus: SlaStatus.AtRisk,
    slaHoursRemaining: 3.25,
    createdAt: '2026-03-31T10:00:00Z',
    updatedAt: '2026-04-01T09:00:00Z',
    createdBy: 'Admin Ops',
    assignedTo: 'Fatima Al-Rashid',
    lifecycleState: LifecycleState.Onboarded,
    formData: {
      partnerName: 'Gulf Trading LLC',
      companyCode: 'GTL-RHN-2026',
      fullName: 'Sarah Jenkins',
      emailAddress: 'sarah.j@gulftrading.ae',
      mobileNumber: '+971 55 123 4567',
      designation: 'qa',
    },
    documents: [],
    workflowStages: [
      { name: 'Integration Review', icon: 'integration_instructions', status: 'current', assignedTo: 'Fatima Al-Rashid' },
      { name: 'Access Provisioning', icon: 'vpn_key', status: 'future' },
      { name: 'UAT Signal', icon: 'flag', status: 'future' },
      { name: 'Complete', icon: 'check_circle', status: 'future' },
    ],
    comments: [
      {
        id: 'c3',
        author: 'Fatima Al-Rashid',
        role: 'Integration Lead',
        body: 'Reviewing UAT environment capacity. We have a slot available in sandbox-3. Will provision credentials within the next business day.',
        createdAt: '2026-04-01T09:00:00Z',
      },
    ],
    auditTrail: [
      { id: 'a6', type: 'stage_transition', description: 'Ticket created and routed to Integration Review', timestamp: '2026-03-31T10:00:00Z' },
      { id: 'a7', type: 'comment', description: 'Comment added by Fatima Al-Rashid', timestamp: '2026-04-01T09:00:00Z' },
    ],
  },

  'SPM-RBT-T03-20260401-0003': {
    id: '3',
    ticketId: 'SPM-RBT-T03-20260401-0003',
    productCode: ProductCode.RBT,
    taskType: TaskType.T03,
    partnerName: 'Emirates Logistics Corp',
    companyCode: 'ELC-RBT-2026',
    requesterName: 'Admin Ops',
    status: TicketStatus.Approved,
    currentStage: 'Account Provisioning',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 20,
    createdAt: '2026-03-30T08:00:00Z',
    updatedAt: '2026-04-01T11:00:00Z',
    createdBy: 'Admin Ops',
    assignedTo: 'Omar Khalid',
    lifecycleState: LifecycleState.UatActive,
    accessPath: 'both',
    formData: {
      partnerName: 'Emirates Logistics Corp',
      companyCode: 'ELC-RBT-2026',
      apiOptIn: true,
      adminFullName: 'Johnathan Doe',
      adminEmail: 'j.doe@emirateslogistics.ae',
      adminMobile: '+971 50 987 6543',
      adminDesignation: 'Operations Manager',
      ipAddresses: '192.168.1.1, 10.0.0.12, 172.16.0.1',
      invoicingName: 'Finance Dept',
      invoicingEmail: 'billing@emirateslogistics.ae',
      invoicingPhone: '+971 4 555 1234',
      supportPrimaryName: 'Ahmed Hassan',
      supportPrimaryMobile: '+971 55 111 2222',
      supportPrimaryEmail: 'ahmed.h@emirateslogistics.ae',
      supportEscalationName: 'Khalid Omar',
      supportEscalationMobile: '+971 55 333 4444',
      supportEscalationEmail: 'khalid.o@emirateslogistics.ae',
    },
    documents: [
      { id: 'd4', name: 'IP_Whitelist_Request.pdf', size: '0.5 MB', uploadedBy: 'Admin Ops', uploadedAt: '2026-03-30T08:10:00Z' },
    ],
    workflowStages: [
      { name: 'Compliance Check', icon: 'policy', status: 'completed', completedAt: '2026-03-30T14:00:00Z' },
      { name: 'Product Approval', icon: 'thumb_up', status: 'completed', completedAt: '2026-03-31T10:00:00Z' },
      { name: 'Account Provisioning', icon: 'settings', status: 'current', assignedTo: 'Omar Khalid' },
      { name: 'Complete', icon: 'check_circle', status: 'future' },
    ],
    comments: [
      {
        id: 'c4',
        author: 'Omar Khalid',
        role: 'Provisioning Agent',
        body: 'Portal account created. API credentials being generated — will share securely via vault link.',
        createdAt: '2026-04-01T11:00:00Z',
      },
      {
        id: 'c5',
        author: 'Layla Nasser',
        role: 'Compliance Officer',
        body: 'All compliance checks passed. IP whitelist approved for 3 addresses.',
        createdAt: '2026-03-30T14:00:00Z',
      },
    ],
    auditTrail: [
      { id: 'a8', type: 'stage_transition', description: 'Ticket created and routed to Compliance Check', timestamp: '2026-03-30T08:00:00Z' },
      { id: 'a9', type: 'document', description: 'IP_Whitelist_Request.pdf uploaded by Admin Ops', timestamp: '2026-03-30T08:10:00Z' },
      { id: 'a10', type: 'approval', description: 'Compliance Check approved by Layla Nasser', timestamp: '2026-03-30T14:00:00Z' },
      { id: 'a11', type: 'stage_transition', description: 'Advanced to Product Approval', timestamp: '2026-03-30T14:00:00Z' },
      { id: 'a12', type: 'approval', description: 'Product Approval granted', timestamp: '2026-03-31T10:00:00Z' },
      { id: 'a13', type: 'stage_transition', description: 'Advanced to Account Provisioning', timestamp: '2026-03-31T10:00:00Z' },
    ],
  },

  'SPM-WTQ-T04-20260401-0004': {
    id: '4',
    ticketId: 'SPM-WTQ-T04-20260401-0004',
    productCode: ProductCode.WTQ,
    taskType: TaskType.T04,
    partnerName: 'Digital Solutions FZE',
    companyCode: 'DSF-WTQ-2026',
    requesterName: 'Admin Ops',
    status: TicketStatus.PendingRequesterAction,
    currentStage: 'Awaiting Requester',
    slaStatus: SlaStatus.Critical,
    slaHoursRemaining: 0.75,
    createdAt: '2026-04-01T07:00:00Z',
    updatedAt: '2026-04-01T12:00:00Z',
    createdBy: 'Admin Ops',
    lifecycleState: LifecycleState.Live,
    formData: {
      partnerName: 'Digital Solutions FZE',
      companyCode: 'DSF-WTQ-2026',
      issueType: 'api_credentials',
      description: 'API key expired and automatic rotation failed. Getting 401 errors on all endpoints since 06:00 GST today. Need urgent re-issue of production API credentials.',
    },
    documents: [],
    workflowStages: [
      { name: 'Support Triage', icon: 'support_agent', status: 'completed', completedAt: '2026-04-01T07:30:00Z' },
      { name: 'Awaiting Requester', icon: 'hourglass_empty', status: 'current' },
      { name: 'Resolution', icon: 'build', status: 'future' },
      { name: 'Complete', icon: 'check_circle', status: 'future' },
    ],
    clarification: {
      requestedBy: 'Tech Support',
      requestedAt: '2026-04-01T12:00:00Z',
      note: 'Please confirm the API environment (staging vs production) and provide the last 4 characters of the expired key for verification.',
    },
    comments: [
      {
        id: 'c6',
        author: 'Tech Support',
        role: 'Support Agent',
        body: 'Triaged as P1 — API credential issue affecting production. Returning to requester for environment confirmation.',
        createdAt: '2026-04-01T07:30:00Z',
      },
    ],
    auditTrail: [
      { id: 'a14', type: 'stage_transition', description: 'Ticket created and routed to Support Triage', timestamp: '2026-04-01T07:00:00Z' },
      { id: 'a15', type: 'stage_transition', description: 'Advanced to Awaiting Requester', timestamp: '2026-04-01T07:30:00Z' },
      { id: 'a16', type: 'return', description: 'Returned for clarification by Tech Support', timestamp: '2026-04-01T12:00:00Z' },
    ],
  },
}

// Lookup by ticketId string, numeric id, or task type extracted from ticketId
function findMockTicket(id: string): TicketDetail | undefined {
  // Direct match on ticketId
  if (mockTicketDetails[id]) return mockTicketDetails[id]
  // Match on numeric id
  const byId = Object.values(mockTicketDetails).find((t) => t.id === id)
  if (byId) return byId
  // Try to match by task type parsed from a ticket ID like SPM-RBT-T01-...
  const taskMatch = id.match(/T0[1-4]/)
  if (taskMatch) {
    const byTask = Object.values(mockTicketDetails).find((t) => t.taskType === taskMatch[0])
    if (byTask) return byTask
  }
  // Fallback: return first ticket
  return Object.values(mockTicketDetails)[0]
}

// --- API calls with mock fallback ---

export async function fetchTicketDetail(id: string): Promise<TicketDetail> {
  try {
    const res = await apiClient.get<TicketDetail>(`/tickets/${id}`)
    return res.data
  } catch {
    const mock = findMockTicket(id)
    if (!mock) throw new Error(`Ticket not found: ${id}`)
    return mock
  }
}
