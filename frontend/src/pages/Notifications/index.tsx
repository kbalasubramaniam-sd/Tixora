import { useState } from 'react'
import { useNotifications } from '@/api/hooks/useNotifications'
import { NotificationStats } from './NotificationStats'
import { NotificationCard } from './NotificationCard'

export default function Notifications() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { data: notifications = [], isLoading } = useNotifications()

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications

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
          <button className="text-sm font-bold text-primary px-4 py-2 hover:bg-primary/5 rounded-lg transition-colors">
            Mark All Read
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
      <NotificationStats />

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3 block">notifications_off</span>
          <h3 className="text-lg font-bold text-on-surface mb-1">No notifications</h3>
          <p className="text-sm text-on-surface-variant">You're all caught up.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </div>
      )}

      {/* Load More */}
      {filtered.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button className="text-sm font-bold text-secondary px-8 py-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors">
            Load previous notifications
          </button>
        </div>
      )}
    </div>
  )
}
