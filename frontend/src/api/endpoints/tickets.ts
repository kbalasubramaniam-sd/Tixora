import { apiClient } from '@/api/client'
import type { TicketDetail } from '@/types/ticket'

export async function fetchTicketDetail(id: string): Promise<TicketDetail> {
  const res = await apiClient.get<TicketDetail>(`/tickets/${id}`)
  return res.data
}

// --- Comments (E3.1) ---

export interface CommentResponse {
  id: string
  authorName: string
  authorRole: string
  content: string
  createdAt: string
}

export async function fetchComments(ticketId: string): Promise<CommentResponse[]> {
  const res = await apiClient.get<CommentResponse[]>(`/tickets/${ticketId}/comments`)
  return res.data
}

export async function postComment(ticketId: string, content: string): Promise<void> {
  await apiClient.post(`/tickets/${ticketId}/comments`, { content })
}
