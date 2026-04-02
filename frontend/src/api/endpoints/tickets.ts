import { apiClient } from '@/api/client'
import type { TicketDetail } from '@/types/ticket'

export async function fetchTicketDetail(id: string): Promise<TicketDetail> {
  const res = await apiClient.get<TicketDetail>(`/tickets/${id}`)
  return res.data
}
