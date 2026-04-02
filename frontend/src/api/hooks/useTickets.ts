import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTicketDetail, fetchComments, postComment, fetchDocuments, uploadDocument } from '@/api/endpoints/tickets'

export function useTicketDetail(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicketDetail(id),
    enabled: !!id,
  })
}

export function useComments(ticketId: string) {
  return useQuery({
    queryKey: ['comments', ticketId],
    queryFn: () => fetchComments(ticketId),
    enabled: !!ticketId,
  })
}

export function usePostComment(ticketId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => postComment(ticketId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] })
    },
  })
}

export function useDocuments(ticketId: string) {
  return useQuery({
    queryKey: ['documents', ticketId],
    queryFn: () => fetchDocuments(ticketId),
    enabled: !!ticketId,
  })
}

export function useUploadDocument(ticketId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadDocument(ticketId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', ticketId] })
    },
  })
}
