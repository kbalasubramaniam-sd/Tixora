import { useQuery } from '@tanstack/react-query'
import { globalSearch, advancedSearch, type AdvancedSearchFilters } from '@/api/endpoints/search'

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: () => globalSearch(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  })
}

export function useAdvancedSearch(filters: AdvancedSearchFilters, enabled = true) {
  return useQuery({
    queryKey: ['advanced-search', filters],
    queryFn: () => advancedSearch(filters),
    enabled,
    staleTime: 30_000,
  })
}
