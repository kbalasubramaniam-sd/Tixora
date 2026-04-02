import { apiClient, type PagedResult } from '@/api/client'
import type { TicketSummary } from '@/types/ticket'

export interface MyTicketsFilters {
  product?: string
  task?: string
  slaStatus?: string
  status?: string
  page?: number
  pageSize?: number
}

export async function fetchMyTickets(filters?: MyTicketsFilters): Promise<PagedResult<TicketSummary>> {
  const res = await apiClient.get<PagedResult<TicketSummary>>('/tickets/my', { params: filters })
  return res.data
}
