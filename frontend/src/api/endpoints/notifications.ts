import { apiClient, type PagedResult } from '@/api/client'

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  ticketId: string | null
  ticketDisplayId: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface UnreadCountResponse {
  count: number
}

export async function fetchNotifications(unreadOnly = false, page = 1, pageSize = 20): Promise<PagedResult<NotificationItem>> {
  const res = await apiClient.get<PagedResult<NotificationItem>>('/notifications', {
    params: { unreadOnly, page, pageSize },
  })
  return res.data
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiClient.get<UnreadCountResponse>('/notifications/unread-count')
  return res.data.count
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.put(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.put('/notifications/read-all')
}
