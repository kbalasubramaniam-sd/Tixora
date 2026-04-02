import { useQuery } from '@tanstack/react-query'
import { fetchTeamQueue, type TeamQueueFilters } from '@/api/endpoints/teamQueue'

export function useTeamQueue(filters?: TeamQueueFilters) {
  return useQuery({
    queryKey: ['team-queue', filters?.product, filters?.task, filters?.slaStatus, filters?.partner, filters?.requester],
    queryFn: () => fetchTeamQueue(filters),
  })
}
