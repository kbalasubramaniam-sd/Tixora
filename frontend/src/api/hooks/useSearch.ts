import { useQuery } from '@tanstack/react-query'
import { globalSearch } from '@/api/endpoints/search'

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: () => globalSearch(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  })
}
