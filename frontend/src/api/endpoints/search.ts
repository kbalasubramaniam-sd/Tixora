import { apiClient } from '@/api/client'

export interface SearchResult {
  type: string
  id: string
  displayId: string
  title: string
  subtitle: string
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const res = await apiClient.get<SearchResult[]>('/search', { params: { q: query } })
  return res.data
}
