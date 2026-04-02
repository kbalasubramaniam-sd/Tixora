import { apiClient } from '@/api/client'
import type { TicketSummary, DashboardStats, ActivityEntry } from '@/types/ticket'
import type { UserRole } from '@/types/enums'
import { SlaStatus, TicketStatus, ProductCode, TaskType } from '@/types/enums'

// --- Mock data for development ---

const mockStats: Record<string, DashboardStats> = {
  PartnershipTeam: {
    stat1: { label: 'My Open Requests', value: 7, icon: 'inbox', iconBg: 'bg-primary-container/10', iconColor: 'text-primary', badge: 'Active', badgeStyle: 'text-xs font-bold text-primary' },
    stat2: { label: 'Pending My Action', value: 2, icon: 'pending_actions', iconBg: 'bg-warning-container/20', iconColor: 'text-warning', badge: 'ACTION', badgeStyle: 'bg-warning text-white px-2 py-0.5 rounded text-[10px] font-bold', valueColor: 'text-warning' },
    stat3: { label: 'Completed This Month', value: 14, icon: 'task_alt', iconBg: 'bg-success-container/30', iconColor: 'text-success', badge: 'This Month' },
    stat4: { label: 'Avg Resolution Time', value: '18h', icon: 'schedule', iconBg: 'bg-secondary-container/30', iconColor: 'text-secondary', badge: 'Avg' },
  },
  LegalTeam: {
    stat1: { label: 'In My Queue', value: 5, icon: 'inbox', iconBg: 'bg-primary-container/10', iconColor: 'text-primary', badge: 'Queue' },
    stat2: { label: 'Near SLA Breach', value: 1, icon: 'warning', iconBg: 'bg-error-container/20', iconColor: 'text-error', badge: 'ALERT', badgeStyle: 'bg-error text-white px-2 py-0.5 rounded text-[10px] font-bold', valueColor: 'text-error' },
    stat3: { label: 'Processed Today', value: 8, icon: 'bolt', iconBg: 'bg-secondary-container/30', iconColor: 'text-secondary', badge: 'Today' },
    stat4: { label: 'SLA Compliance Rate', value: '94%', icon: 'verified', iconBg: 'bg-primary-container/10', iconColor: 'text-primary', badge: 'Live' },
  },
  ExecutiveAuthority: {
    stat1: { label: 'In My Queue', value: 3, icon: 'inbox', iconBg: 'bg-primary-container/10', iconColor: 'text-primary', badge: 'Queue' },
    stat2: { label: 'Near SLA Breach', value: 0, icon: 'warning', iconBg: 'bg-error-container/20', iconColor: 'text-error' },
    stat3: { label: 'Processed Today', value: 5, icon: 'bolt', iconBg: 'bg-secondary-container/30', iconColor: 'text-secondary', badge: 'Today' },
    stat4: { label: 'SLA Compliance Rate', value: '97%', icon: 'verified', iconBg: 'bg-primary-container/10', iconColor: 'text-primary', badge: 'Live' },
  },
  IntegrationTeam: {
    stat1: { label: 'Assigned to Me', value: 4, icon: 'assignment', iconBg: 'bg-primary-container/10', iconColor: 'text-primary', badge: 'Active' },
    stat2: { label: 'SLA At Risk', value: 1, icon: 'warning', iconBg: 'bg-error-container/20', iconColor: 'text-error', badge: 'ALERT', badgeStyle: 'bg-error text-white px-2 py-0.5 rounded text-[10px] font-bold', valueColor: 'text-error' },
    stat3: { label: 'Completed This Week', value: 11, icon: 'task_alt', iconBg: 'bg-success-container/30', iconColor: 'text-success', badge: 'This Week' },
    stat4: { label: 'Avg Completion Time', value: '6h', icon: 'schedule', iconBg: 'bg-secondary-container/30', iconColor: 'text-secondary', badge: 'Avg' },
  },
  DevTeam: {
    stat1: { label: 'Assigned to Me', value: 6, icon: 'assignment', iconBg: 'bg-primary-container/10', iconColor: 'text-primary', badge: 'Active' },
    stat2: { label: 'SLA At Risk', value: 2, icon: 'warning', iconBg: 'bg-error-container/20', iconColor: 'text-error', badge: 'CRITICAL', badgeStyle: 'bg-error text-white px-2 py-0.5 rounded text-[10px] font-bold', valueColor: 'text-error' },
    stat3: { label: 'Completed This Week', value: 9, icon: 'task_alt', iconBg: 'bg-success-container/30', iconColor: 'text-success', badge: 'This Week' },
    stat4: { label: 'Avg Completion Time', value: '4h', icon: 'schedule', iconBg: 'bg-secondary-container/30', iconColor: 'text-secondary', badge: 'Avg' },
  },
  SystemAdministrator: {
    stat1: { label: 'Total Open Tickets', value: '1,284', icon: 'inbox', iconBg: 'bg-primary-container/10', iconColor: 'text-primary', badge: '+12%', badgeStyle: 'text-xs font-bold text-primary' },
    stat2: { label: 'SLA Breaches Today', value: '04', icon: 'warning', iconBg: 'bg-error-container/20', iconColor: 'text-error', badge: 'CRITICAL', badgeStyle: 'bg-error text-white px-2 py-0.5 rounded text-[10px] font-bold', valueColor: 'text-error' },
    stat3: { label: 'Tickets Created', value: 142, icon: 'bolt', iconBg: 'bg-secondary-container/30', iconColor: 'text-secondary', badge: 'Today', badgeStyle: 'text-xs font-bold text-on-surface-variant' },
    stat4: { label: 'System Compliance', value: '98.2%', icon: 'verified', iconBg: 'bg-primary-container/10', iconColor: 'text-primary', badge: 'Live', badgeStyle: 'text-xs font-bold text-on-surface-variant' },
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
    ticketId: 'SPM-RHN-T02-20260401-0002',
    productCode: ProductCode.RHN,
    taskType: TaskType.T02,
    partnerName: 'Gulf Trading LLC',
    requesterName: 'Sara M.',
    status: TicketStatus.InReview,
    currentStage: 'Integration Review',
    slaStatus: SlaStatus.AtRisk,
    slaHoursRemaining: 3.25,
    createdAt: '2026-03-31T10:00:00Z',
    updatedAt: '2026-04-01T09:00:00Z',
  },
  {
    id: '3',
    ticketId: 'SPM-RBT-T03-20260401-0003',
    productCode: ProductCode.RBT,
    taskType: TaskType.T03,
    partnerName: 'Emirates Logistics Corp',
    requesterName: 'Omar R.',
    status: TicketStatus.InReview,
    currentStage: 'Account Provisioning',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 20,
    createdAt: '2026-03-30T08:00:00Z',
    updatedAt: '2026-04-01T11:00:00Z',
  },
  {
    id: '4',
    ticketId: 'SPM-WTQ-T04-20260401-0004',
    productCode: ProductCode.WTQ,
    taskType: TaskType.T04,
    partnerName: 'Digital Solutions FZE',
    requesterName: 'Fatima H.',
    status: TicketStatus.PendingRequesterAction,
    currentStage: 'Awaiting Requester',
    slaStatus: SlaStatus.Critical,
    slaHoursRemaining: 0.75,
    createdAt: '2026-04-01T07:00:00Z',
    updatedAt: '2026-04-01T12:00:00Z',
  },
  {
    id: '5',
    ticketId: 'SPM-RBT-T03-20260401-0008',
    productCode: ProductCode.RBT,
    taskType: TaskType.T03,
    partnerName: 'Takaful Emarat',
    requesterName: 'Ahmed K.',
    status: TicketStatus.Submitted,
    currentStage: 'Compliance Check',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 16,
    createdAt: '2026-04-01T06:00:00Z',
    updatedAt: '2026-04-01T06:00:00Z',
  },
]

const mockActivity: ActivityEntry[] = [
  { id: '1', title: 'System Patch v4.2.1 Deployed', description: 'Global infrastructure update successfully finalized across all regions.', timestamp: '24 mins ago', icon: 'sync', iconBg: 'bg-primary-container', iconColor: 'text-on-primary-container' },
  { id: '2', title: 'New Partner: National Bank of Fujairah', description: 'Onboarding workflow initiated. API documentation shared.', timestamp: '2 hours ago', icon: 'person_add', iconBg: 'bg-warning-container', iconColor: 'text-warning' },
  { id: '3', title: 'SLA Threshold Reached', description: 'Ticket SPM-WTQ-T04-20260401-0011 has entered the critical zone.', timestamp: '4 hours ago', icon: 'priority_high', iconBg: 'bg-error-container', iconColor: 'text-error' },
  { id: '4', title: 'Q1 Report Generated', description: 'Automated system compliance report is ready for download.', timestamp: 'Yesterday, 18:45', icon: 'description', iconBg: 'bg-secondary-container', iconColor: 'text-on-secondary-container' },
  { id: '5', title: 'User Access Granted', description: 'Ahmed K. granted reviewer access to Rabet product.', timestamp: 'Yesterday, 14:20', icon: 'person_add', iconBg: 'bg-primary-container', iconColor: 'text-on-primary-container' },
]

// --- API calls ---

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<DashboardStats>('/dashboard/stats')
  return res.data
}

export async function fetchActionRequired(): Promise<TicketSummary[]> {
  const res = await apiClient.get<TicketSummary[]>('/dashboard/action-required')
  return res.data
}

export async function fetchRecentActivity(): Promise<ActivityEntry[]> {
  const res = await apiClient.get<ActivityEntry[]>('/dashboard/activity')
  return res.data
}
