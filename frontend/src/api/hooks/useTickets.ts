import { useQuery } from '@tanstack/react-query'
import { fetchTicketDetail } from '@/api/endpoints/tickets'

export function useTicketDetail(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicketDetail(id),
    enabled: !!id,
  })
}
