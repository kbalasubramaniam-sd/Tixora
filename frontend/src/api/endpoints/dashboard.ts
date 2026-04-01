import { apiClient } from '@/api/client'
import type { TicketSummary, DashboardStats, ActivityEntry } from '@/types/ticket'
import type { UserRole } from '@/types/enums'
import { SlaStatus, TicketStatus, ProductCode, TaskType } from '@/types/enums'

// --- Mock data for development ---

const mockStats: Record<string, DashboardStats> = {
  Requester: {
    stat1: { label: 'My Open Requests', value: 7 },
    stat2: { label: 'Pending My Action', value: 2, highlight: 'amber' },
    stat3: { label: 'Completed This Month', value: 14 },
    stat4: { label: 'Avg Resolution Time', value: '18h' },
  },
  Reviewer: {
    stat1: { label: 'In My Queue', value: 5 },
    stat2: { label: 'Near SLA Breach', value: 1, highlight: 'amber' },
    stat3: { label: 'Processed Today', value: 8 },
    stat4: { label: 'SLA Compliance Rate', value: '94%' },
  },
  Approver: {
    stat1: { label: 'In My Queue', value: 3 },
    stat2: { label: 'Near SLA Breach', value: 0 },
    stat3: { label: 'Processed Today', value: 5 },
    stat4: { label: 'SLA Compliance Rate', value: '97%' },
  },
  IntegrationTeam: {
    stat1: { label: 'Assigned to Me', value: 4 },
    stat2: { label: 'SLA At Risk', value: 1, highlight: 'amber' },
    stat3: { label: 'Completed This Week', value: 11 },
    stat4: { label: 'Avg Completion Time', value: '6h' },
  },
  ProvisioningAgent: {
    stat1: { label: 'Assigned to Me', value: 6 },
    stat2: { label: 'SLA At Risk', value: 2, highlight: 'red' },
    stat3: { label: 'Completed This Week', value: 9 },
    stat4: { label: 'Avg Completion Time', value: '4h' },
  },
  SystemAdministrator: {
    stat1: { label: 'Total Open Tickets', value: 23 },
    stat2: { label: 'SLA Breaches Today', value: 1, highlight: 'red' },
    stat3: { label: 'Tickets Created Today', value: 6 },
    stat4: { label: 'System-wide SLA Compliance', value: '91%' },
  },
}

const mockTickets: TicketSummary[] = [
  {
    id: '1',
    ticketId: 'SPM-RBT-T01-20260401-0001',
    productCode: ProductCode.RBT,
    taskType: TaskType.T01,
    partnerName: 'ABC Insurance Co.',
    requesterName: 'Ahmed K.',
    status: TicketStatus.InReview,
    currentStage: 'Legal Review',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 12,
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T10:30:00Z',
  },
  {
    id: '2',
    ticketId: 'SPM-RHN-T03-20260401-0005',
    productCode: ProductCode.RHN,
    taskType: TaskType.T03,
    partnerName: 'National Bank of Fujairah',
    requesterName: 'Sara M.',
    status: TicketStatus.PendingRequesterAction,
    currentStage: 'Partner Ops Review',
    slaStatus: SlaStatus.AtRisk,
    slaHoursRemaining: 3,
    createdAt: '2026-03-31T14:00:00Z',
    updatedAt: '2026-04-01T09:15:00Z',
  },
  {
    id: '3',
    ticketId: 'SPM-WTQ-T05-20260401-0011',
    productCode: ProductCode.WTQ,
    taskType: TaskType.T05,
    partnerName: 'Oman Insurance',
    requesterName: 'Omar R.',
    status: TicketStatus.InProvisioning,
    currentStage: 'Provisioning Team',
    slaStatus: SlaStatus.Breached,
    slaHoursRemaining: -2,
    createdAt: '2026-03-30T10:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
  {
    id: '4',
    ticketId: 'SPM-MLM-T02-20260401-0003',
    productCode: ProductCode.MLM,
    taskType: TaskType.T02,
    partnerName: 'Dubai Islamic Bank',
    requesterName: 'Fatima H.',
    status: TicketStatus.InReview,
    currentStage: 'Product Review',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 18,
    createdAt: '2026-04-01T07:00:00Z',
    updatedAt: '2026-04-01T07:30:00Z',
  },
  {
    id: '5',
    ticketId: 'SPM-RBT-T04-20260401-0008',
    productCode: ProductCode.RBT,
    taskType: TaskType.T04,
    partnerName: 'Takaful Emarat',
    requesterName: 'Ahmed K.',
    status: TicketStatus.Submitted,
    currentStage: 'Partner Ops Review',
    slaStatus: SlaStatus.Critical,
    slaHoursRemaining: 0.75,
    createdAt: '2026-04-01T06:00:00Z',
    updatedAt: '2026-04-01T06:00:00Z',
  },
]

const mockActivity: ActivityEntry[] = [
  { id: '1', description: 'You approved SPM-RBT-T01-20260401-0001', timestamp: '2 hours ago' },
  { id: '2', description: 'SPM-RHN-T03-20260401-0005 returned for clarification', timestamp: '3 hours ago' },
  { id: '3', description: 'You submitted SPM-WTQ-T05-20260401-0011', timestamp: '5 hours ago' },
  { id: '4', description: 'SPM-MLM-T02-20260401-0003 moved to Product Review', timestamp: '6 hours ago' },
  { id: '5', description: 'You created SPM-RBT-T04-20260401-0008', timestamp: 'Yesterday' },
  { id: '6', description: 'SPM-RHN-T01-20260331-0012 completed', timestamp: 'Yesterday' },
  { id: '7', description: 'You reassigned SPM-WTQ-T05-20260331-0009', timestamp: '2 days ago' },
]

// --- API calls with mock fallback ---

export async function fetchDashboardStats(role: UserRole): Promise<DashboardStats> {
  try {
    const res = await apiClient.get<DashboardStats>('/dashboard/stats')
    return res.data
  } catch {
    return mockStats[role] ?? mockStats.Requester
  }
}

export async function fetchActionRequired(): Promise<TicketSummary[]> {
  try {
    const res = await apiClient.get<TicketSummary[]>('/dashboard/action-required')
    return res.data
  } catch {
    return mockTickets
  }
}

export async function fetchRecentActivity(): Promise<ActivityEntry[]> {
  try {
    const res = await apiClient.get<ActivityEntry[]>('/dashboard/activity')
    return res.data
  } catch {
    return mockActivity
  }
}
