import { useQuery } from '@tanstack/react-query'
import { fetchTeamQueue, type TeamQueueFilters } from '@/api/endpoints/teamQueue'

export function useTeamQueue(filters?: TeamQueueFilters) {
  return useQuery({
    queryKey: ['team-queue', filters],
    queryFn: () => fetchTeamQueue(filters),
  })
}
