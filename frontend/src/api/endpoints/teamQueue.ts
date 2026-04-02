import { apiClient, type PagedResult } from '@/api/client'
import type { TicketSummary } from '@/types/ticket'

export interface TeamQueueFilters {
  product?: string
  task?: string
  slaStatus?: string
  partner?: string
  requester?: string
  status?: string
  page?: number
  pageSize?: number
}

export async function fetchTeamQueue(filters?: TeamQueueFilters): Promise<PagedResult<TicketSummary>> {
  const res = await apiClient.get<PagedResult<TicketSummary>>('/dashboard/team-queue', { params: filters })
  return res.data
}
