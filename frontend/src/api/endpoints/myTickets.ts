import { apiClient } from '@/api/client'
import type { TicketSummary } from '@/types/ticket'

export interface MyTicketsFilters {
  product?: string
  task?: string
  slaStatus?: string
  status?: string
}

export async function fetchMyTickets(filters?: MyTicketsFilters): Promise<TicketSummary[]> {
  const res = await apiClient.get<TicketSummary[]>('/tickets/my', { params: filters })
  return res.data
}
