import { useQuery } from '@tanstack/react-query'
import { fetchMyTickets, type MyTicketsFilters } from '@/api/endpoints/myTickets'

export function useMyTickets(filters?: MyTicketsFilters) {
  return useQuery({
    queryKey: ['my-tickets', filters],
    queryFn: () => fetchMyTickets(filters),
  })
}
