import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { fetchDashboardStats, fetchActionRequired, fetchRecentActivity } from '@/api/endpoints/dashboard'

export function useDashboardStats() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['dashboard', 'stats', user?.role],
    queryFn: () => fetchDashboardStats(user!.role),
    enabled: !!user,
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
