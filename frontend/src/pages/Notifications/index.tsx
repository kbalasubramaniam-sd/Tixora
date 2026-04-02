import { useState, useMemo } from 'react'
import { useNotifications, useMarkRead, useMarkAllRead } from '@/api/hooks/useNotifications'
import { NotificationStats } from './NotificationStats'
import { NotificationCard } from './NotificationCard'
import { timeAgo } from '@/utils/format'
import type { NotificationItem } from '@/api/endpoints/notifications'

function groupByTime(notifications: NotificationItem[]): { label: string; items: NotificationItem[] }[] {
  const today: NotificationItem[] = []
  const yesterday: NotificationItem[] = []
  const older: NotificationItem[] = []

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000)

  for (const n of notifications) {
    const d = new Date(n.createdAt)
    if (d >= todayStart) today.push(n)
    else if (d >= yesterdayStart) yesterday.push(n)
    else older.push(n)
  }

  const groups: { label: string; items: NotificationItem[] }[] = []
  if (today.length > 0) groups.push({ label: 'Today', items: today })
  if (yesterday.length > 0) groups.push({ label: 'Yesterday', items: yesterday })
  if (older.length > 0) groups.push({ label: 'Earlier', items: older })
  return groups
}

export default function Notifications() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { data: notifications = [], isLoading } = useNotifications(filter === 'unread')
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const groups = useMemo(() => groupByTime(notifications), [notifications])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-secondary mb-3">
            <span className="hover:text-primary cursor-pointer">Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface">Notifications</span>
          </nav>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">Notifications</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-sm font-bold text-primary px-4 py-2 hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50"
          >
            {markAllRead.isPending ? 'Marking...' : 'Mark All Read'}
          </button>
          <div className="flex p-1 bg-surface-container-low rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                filter === 'all'
                  ? 'text-on-primary bg-primary shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-5 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                filter === 'unread'
                  ? 'text-on-primary bg-primary shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Unread
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <NotificationStats notifications={notifications} />

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3 block">notifications_off</span>
          <h3 className="text-lg font-bold text-on-surface mb-1">No notifications</h3>
          <p className="text-sm text-on-surface-variant">You're all caught up.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-black text-secondary uppercase tracking-widest">{group.label}</h3>
                <div className="flex-1 h-px bg-outline-variant/30" />
              </div>
              <div className="space-y-3">
                {group.items.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkRead={(id) => markRead.mutate(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
