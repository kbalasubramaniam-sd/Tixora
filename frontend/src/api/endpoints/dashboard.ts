import { apiClient } from '@/api/client'
import type { TicketSummary, DashboardStats, ActivityEntry } from '@/types/ticket'

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<DashboardStats>('/dashboard/stats')
  return res.data
}

export async function fetchActionRequired(): Promise<TicketSummary[]> {
  const res = await apiClient.get<TicketSummary[]>('/dashboard/action-required')
  return res.data
}

export async function fetchRecentActivity(): Promise<ActivityEntry[]> {
  const res = await apiClient.get<ActivityEntry[]>('/dashboard/activity')
  return res.data
}
