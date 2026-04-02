import { apiClient } from '@/api/client'
import type { TicketSummary } from '@/types/ticket'
import { ProductCode, TaskType, TicketStatus, SlaStatus } from '@/types/enums'

// --- Mock team queue data ---

const mockTeamQueue: TicketSummary[] = [
  // Breached tickets
  {
    id: 'tq-1',
    ticketId: 'SPM-RBT-T01-20260328-0012',
    productCode: ProductCode.RBT,
    taskType: TaskType.T01,
    partnerName: 'Gulf Trading LLC',
    requesterName: 'Fatima Al-Rashid',
    status: TicketStatus.InReview,
    currentStage: 'Legal Review',
    slaStatus: SlaStatus.Breached,
    slaHoursRemaining: -4.2,
    createdAt: '2026-03-28T08:00:00Z',
    updatedAt: '2026-04-01T12:00:00Z',
  },
  {
    id: 'tq-2',
    ticketId: 'SPM-RHN-T03-20260329-0018',
    productCode: ProductCode.RHN,
    taskType: TaskType.T03,
    partnerName: 'Emirates Logistics Corp',
    requesterName: 'Omar Khalid',
    status: TicketStatus.InReview,
    currentStage: 'Compliance Check',
    slaStatus: SlaStatus.Breached,
    slaHoursRemaining: -2.75,
    createdAt: '2026-03-29T09:00:00Z',
    updatedAt: '2026-04-01T11:00:00Z',
  },
  // At Risk tickets
  {
    id: 'tq-3',
    ticketId: 'SPM-WTQ-T04-20260331-0024',
    productCode: ProductCode.WTQ,
    taskType: TaskType.T04,
    partnerName: 'Digital Solutions FZE',
    requesterName: 'Admin Ops',
    status: TicketStatus.InReview,
    currentStage: 'Support Triage',
    slaStatus: SlaStatus.AtRisk,
    slaHoursRemaining: 0.75,
    createdAt: '2026-03-31T14:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'tq-4',
    ticketId: 'SPM-RBT-T02-20260401-0031',
    productCode: ProductCode.RBT,
    taskType: TaskType.T02,
    partnerName: 'ABC Insurance Co.',
    requesterName: 'Sarah Chen',
    status: TicketStatus.InReview,
    currentStage: 'Integration Review',
    slaStatus: SlaStatus.AtRisk,
    slaHoursRemaining: 1.2,
    createdAt: '2026-04-01T06:00:00Z',
    updatedAt: '2026-04-01T09:30:00Z',
  },
  // On Track tickets
  {
    id: 'tq-5',
    ticketId: 'SPM-MLM-T01-20260401-0035',
    productCode: ProductCode.MLM,
    taskType: TaskType.T01,
    partnerName: 'National Bank of Fujairah',
    requesterName: 'Layla Nasser',
    status: TicketStatus.InReview,
    currentStage: 'Product Review',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 18,
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:30:00Z',
  },
  {
    id: 'tq-6',
    ticketId: 'SPM-RHN-T02-20260401-0037',
    productCode: ProductCode.RHN,
    taskType: TaskType.T02,
    partnerName: 'Al Masah Capital',
    requesterName: 'Marcus Thorne',
    status: TicketStatus.Submitted,
    currentStage: 'Integration Review',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 24,
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'tq-7',
    ticketId: 'SPM-WTQ-T01-20260401-0039',
    productCode: ProductCode.WTQ,
    taskType: TaskType.T01,
    partnerName: 'Sharjah Chamber of Commerce',
    requesterName: 'Admin Ops',
    status: TicketStatus.InReview,
    currentStage: 'EA Sign-off',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 12.5,
    createdAt: '2026-04-01T07:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'tq-8',
    ticketId: 'SPM-RBT-T03-20260401-0041',
    productCode: ProductCode.RBT,
    taskType: TaskType.T03,
    partnerName: 'Mashreq Global',
    requesterName: 'Omar Khalid',
    status: TicketStatus.InReview,
    currentStage: 'Account Provisioning',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 20,
    createdAt: '2026-03-31T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'tq-9',
    ticketId: 'SPM-MLM-T04-20260401-0043',
    productCode: ProductCode.MLM,
    taskType: TaskType.T04,
    partnerName: 'RAK Insurance',
    requesterName: 'Fatima Al-Rashid',
    status: TicketStatus.InReview,
    currentStage: 'Support Triage',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 14,
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'tq-10',
    ticketId: 'SPM-RHN-T01-20260401-0045',
    productCode: ProductCode.RHN,
    taskType: TaskType.T01,
    partnerName: 'Dubai Holdings',
    requesterName: 'Sarah Chen',
    status: TicketStatus.Submitted,
    currentStage: 'Legal Review',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 16,
    createdAt: '2026-04-01T11:00:00Z',
    updatedAt: '2026-04-01T11:00:00Z',
  },
]

export interface TeamQueueFilters {
  product?: string
  task?: string
  slaStatus?: string
  partner?: string
  requester?: string
}

export async function fetchTeamQueue(filters?: TeamQueueFilters): Promise<TicketSummary[]> {
  const res = await apiClient.get<TicketSummary[]>('/dashboard/team-queue', { params: filters })
  return res.data
}
