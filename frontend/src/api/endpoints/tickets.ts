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

// --- Documents (E3.2) ---

export interface DocumentResponse {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
  uploadedBy: string
  uploadedAt: string
  documentType: string
}

export async function fetchDocuments(ticketId: string): Promise<DocumentResponse[]> {
  const res = await apiClient.get<DocumentResponse[]>(`/tickets/${ticketId}/documents`)
  return res.data
}

export async function uploadDocument(ticketId: string, file: File, documentType?: string): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  if (documentType) {
    formData.append('documentType', documentType)
  }
  await apiClient.post(`/tickets/${ticketId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function getDocumentDownloadUrl(documentId: string): string {
  return `${apiClient.defaults.baseURL}/documents/${documentId}`
}
