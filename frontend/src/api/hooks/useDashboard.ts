import { useQuery } from '@tanstack/react-query'
import { fetchDashboardStats, fetchActionRequired, fetchRecentActivity } from '@/api/endpoints/dashboard'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
  })
}

export function useActionRequired() {
  return useQuery({
    queryKey: ['dashboard', 'action-required'],
    queryFn: fetchActionRequired,
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: fetchRecentActivity,
  })
}
