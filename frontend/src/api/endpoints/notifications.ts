import { apiClient } from '@/api/client'

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

export async function fetchNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  const res = await apiClient.get<NotificationItem[]>('/notifications', {
    params: { unreadOnly },
  })
  return res.data
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiClient.get<UnreadCountResponse>('/notifications/unread-count')
  return res.count
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.put(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.put('/notifications/read-all')
}
