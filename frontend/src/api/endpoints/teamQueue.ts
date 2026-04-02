import { apiClient } from '@/api/client'
import type { TicketSummary } from '@/types/ticket'

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
