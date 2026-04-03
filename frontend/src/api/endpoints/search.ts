import { apiClient, type PagedResult } from '@/api/client'
import type { TicketSummary } from '@/types/ticket'

export interface SearchResult {
  type: string
  id: string
  displayId: string
  title: string
  subtitle: string
}

export interface AdvancedSearchFilters {
  productCode?: string
  taskType?: string
  status?: string
  slaStatus?: string
  assignedTo?: string
  partnerId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const res = await apiClient.get<SearchResult[]>('/search', { params: { q: query } })
  return res.data
}

export async function advancedSearch(filters: AdvancedSearchFilters): Promise<PagedResult<TicketSummary>> {
  const res = await apiClient.post<PagedResult<TicketSummary>>('/search/advanced', filters)
  return res.data
}
