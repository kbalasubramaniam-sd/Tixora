import { apiClient } from '@/api/client'
import type { TicketSummary } from '@/types/ticket'
import { ProductCode, TaskType, TicketStatus, SlaStatus } from '@/types/enums'

const mockMyTickets: TicketSummary[] = [
  {
    id: 'mt-1',
    ticketId: 'SPM-RBT-T01-20260325-0008',
    productCode: ProductCode.RBT,
    taskType: TaskType.T01,
    partnerName: 'Gulf Trading LLC',
    requesterName: 'Fatima Al-Rashid',
    status: TicketStatus.Completed,
    currentStage: 'Completed',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 0,
    createdAt: '2026-03-25T08:00:00Z',
    updatedAt: '2026-03-27T14:00:00Z',
  },
  {
    id: 'mt-2',
    ticketId: 'SPM-RBT-T02-20260328-0014',
    productCode: ProductCode.RBT,
    taskType: TaskType.T02,
    partnerName: 'Gulf Trading LLC',
    requesterName: 'Fatima Al-Rashid',
    status: TicketStatus.InReview,
    currentStage: 'Integration Review',
    slaStatus: SlaStatus.AtRisk,
    slaHoursRemaining: 1.5,
    createdAt: '2026-03-28T09:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'mt-3',
    ticketId: 'SPM-RHN-T03-20260329-0019',
    productCode: ProductCode.RHN,
    taskType: TaskType.T03,
    partnerName: 'Emirates Logistics Corp',
    requesterName: 'Fatima Al-Rashid',
    status: TicketStatus.SlaBreached,
    currentStage: 'Compliance Check',
    slaStatus: SlaStatus.Breached,
    slaHoursRemaining: -3.0,
    createdAt: '2026-03-29T09:00:00Z',
    updatedAt: '2026-04-01T12:00:00Z',
  },
  {
    id: 'mt-4',
    ticketId: 'SPM-WTQ-T04-20260330-0021',
    productCode: ProductCode.WTQ,
    taskType: TaskType.T04,
    partnerName: 'Digital Solutions FZE',
    requesterName: 'Fatima Al-Rashid',
    status: TicketStatus.Cancelled,
    currentStage: 'Cancelled',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 0,
    createdAt: '2026-03-30T07:00:00Z',
    updatedAt: '2026-03-30T09:00:00Z',
  },
  {
    id: 'mt-5',
    ticketId: 'SPM-MLM-T01-20260401-0036',
    productCode: ProductCode.MLM,
    taskType: TaskType.T01,
    partnerName: 'National Bank of Fujairah',
    requesterName: 'Fatima Al-Rashid',
    status: TicketStatus.Submitted,
    currentStage: 'Product Review',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 18,
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:30:00Z',
  },
  {
    id: 'mt-6',
    ticketId: 'SPM-RBT-T01-20260401-0042',
    productCode: ProductCode.RBT,
    taskType: TaskType.T01,
    partnerName: 'Mashreq Global',
    requesterName: 'Fatima Al-Rashid',
    status: TicketStatus.Approved,
    currentStage: 'EA Sign-off',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 12,
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T11:00:00Z',
  },
  {
    id: 'mt-7',
    ticketId: 'SPM-RHN-T02-20260401-0046',
    productCode: ProductCode.RHN,
    taskType: TaskType.T02,
    partnerName: 'Al Masah Capital',
    requesterName: 'Fatima Al-Rashid',
    status: TicketStatus.Completed,
    currentStage: 'Completed',
    slaStatus: SlaStatus.OnTrack,
    slaHoursRemaining: 0,
    createdAt: '2026-03-20T09:00:00Z',
    updatedAt: '2026-03-22T15:00:00Z',
  },
]

const STATUS_MAP: Record<string, string[]> = {
  Open: [TicketStatus.Submitted, TicketStatus.PendingRequesterAction],
  InProgress: [TicketStatus.InReview, TicketStatus.Approved, TicketStatus.InProvisioning, TicketStatus.SlaBreached],
  Completed: [TicketStatus.Completed],
  Cancelled: [TicketStatus.Cancelled, TicketStatus.Rejected],
}

export interface MyTicketsFilters {
  product?: string
  task?: string
  slaStatus?: string
  status?: string
}

export async function fetchMyTickets(filters?: MyTicketsFilters): Promise<TicketSummary[]> {
  try {
    const res = await apiClient.get<TicketSummary[]>('/tickets/mine', { params: filters })
    return res.data
  } catch {
    let results = [...mockMyTickets]

    if (filters?.product && filters.product !== 'All') {
      results = results.filter((t) => t.productCode === filters.product)
    }
    if (filters?.task && filters.task !== 'All') {
      results = results.filter((t) => t.taskType === filters.task)
    }
    if (filters?.slaStatus && filters.slaStatus !== 'All') {
      results = results.filter((t) => t.slaStatus === filters.slaStatus)
    }
    if (filters?.status && filters.status !== 'All') {
      const allowed = STATUS_MAP[filters.status] ?? []
      results = results.filter((t) => allowed.includes(t.status))
    }

    return results
  }
}
