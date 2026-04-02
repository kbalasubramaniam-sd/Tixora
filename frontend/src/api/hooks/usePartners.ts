import { useQuery } from '@tanstack/react-query'
import { fetchPartners, type PartnerFilters } from '@/api/endpoints/partners'

export function usePartners(filters?: PartnerFilters) {
  return useQuery({
    queryKey: ['partners', filters?.search, filters?.lifecycleState, filters?.product],
    queryFn: () => fetchPartners(filters),
  })
}
