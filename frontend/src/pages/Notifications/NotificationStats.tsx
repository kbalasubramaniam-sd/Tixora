import { NotificationType } from '@/types/enums'
import type { NotificationItem } from '@/api/endpoints/notifications'

interface NotificationStatsProps {
  notifications: NotificationItem[]
}

const SLA_TYPES = new Set<string>([NotificationType.SlaBreach, NotificationType.SlaWarning75, NotificationType.SlaWarning90])

export function NotificationStats({ notifications }: NotificationStatsProps) {
  const criticalCount = notifications.filter((n) => !n.read && SLA_TYPES.has(n.type)).length
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Critical SLA</p>
          <p className="text-3xl font-black text-error">{criticalCount}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-error-container flex items-center justify-center text-error">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
        </div>
      </div>
      <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Unread</p>
          <p className="text-3xl font-black text-primary">{unreadCount}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_unread</span>
        </div>
      </div>
      <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Total</p>
          <p className="text-3xl font-black text-on-surface">{notifications.length}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-secondary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
        </div>
      </div>
    </div>
  )
}
