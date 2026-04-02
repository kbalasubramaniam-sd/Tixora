import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTicketDetail, fetchComments, postComment } from '@/api/endpoints/tickets'

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
