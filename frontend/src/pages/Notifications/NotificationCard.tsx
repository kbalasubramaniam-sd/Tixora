import { useNavigate } from 'react-router'
import { cn } from '@/utils/cn'
import { timeAgo } from '@/utils/format'
import type { NotificationItem } from '@/api/endpoints/notifications'

interface TypeConfig {
  border: string
  iconBg: string
  iconColor: string
  icon: string
  primaryAction?: string
  secondaryAction?: string
}

const typeConfig: Record<string, TypeConfig> = {
  RequestSubmitted: {
    border: 'border-primary',
    iconBg: 'bg-primary-container/10',
    iconColor: 'text-primary',
    icon: 'assignment',
    primaryAction: 'View Ticket',
  },
  StageAdvanced: {
    border: 'border-primary',
    iconBg: 'bg-primary-container/10',
    iconColor: 'text-primary',
    icon: 'trending_up',
    primaryAction: 'View Ticket',
  },
  RequestCompleted: {
    border: '',
    iconBg: 'bg-surface-container-highest',
    iconColor: 'text-secondary',
    icon: 'check_circle',
    primaryAction: 'View Ticket',
  },
  RequestRejected: {
    border: 'border-error',
    iconBg: 'bg-error-container',
    iconColor: 'text-error',
    icon: 'block',
    primaryAction: 'View Ticket',
  },
  ClarificationRequested: {
    border: 'border-primary',
    iconBg: 'bg-primary-container/10',
    iconColor: 'text-primary',
    icon: 'chat_bubble',
    primaryAction: 'Respond',
  },
  ClarificationResponded: {
    border: 'border-primary',
    iconBg: 'bg-primary-container/10',
    iconColor: 'text-primary',
    icon: 'reply',
    primaryAction: 'View Ticket',
  },
  RequestCancelled: {
    border: 'border-outline-variant',
    iconBg: 'bg-surface-container-low',
    iconColor: 'text-on-surface-variant',
    icon: 'cancel',
    primaryAction: 'View Ticket',
  },
  TicketReassigned: {
    border: 'border-outline-variant',
    iconBg: 'bg-surface-container-low',
    iconColor: 'text-on-surface-variant',
    icon: 'swap_horiz',
    primaryAction: 'View Ticket',
  },
}

const defaultConfig: TypeConfig = {
  border: 'border-outline-variant',
  iconBg: 'bg-surface-container-low',
  iconColor: 'text-on-surface-variant',
  icon: 'notifications',
  primaryAction: 'View',
}

interface NotificationCardProps {
  notification: NotificationItem
  onMarkRead?: (id: string) => void
}

export function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const navigate = useNavigate()
  const config = typeConfig[notification.type] ?? defaultConfig

  const handlePrimaryAction = () => {
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id)
    }
    if (notification.ticketId) {
      navigate(`/tickets/${notification.ticketId}`)
    }
  }

  const timestamp = timeAgo(notification.createdAt)

  // Read notifications — compact, muted
  if (notification.isRead) {
    return (
      <div className="bg-surface-container-low/50 px-5 py-4 rounded-2xl flex gap-4 items-start opacity-70">
        <div className={cn('mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center', config.iconBg, config.iconColor)}>
          <span className="material-symbols-outlined text-[18px]">{config.icon}</span>
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h4 className="font-bold text-on-surface leading-tight text-sm">{notification.title}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5 line-clamp-1">{notification.message}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {notification.ticketDisplayId && (
                <span className="text-[10px] font-bold text-slate-400 bg-surface-container py-0.5 px-1.5 rounded tracking-widest hidden sm:inline">
                  {notification.ticketDisplayId}
                </span>
              )}
              <p className="text-[11px] font-bold text-outline uppercase">{timestamp}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Unread notifications — full card with actions
  return (
    <div className={cn(
      'bg-surface-container-lowest p-5 rounded-2xl shadow-[0_10px_40px_rgba(23,29,28,0.03)] flex gap-5 items-start border-l-4 group hover:translate-y-[-2px] transition-all',
      config.border,
    )}>
      <div className={cn('mt-1 h-10 w-10 shrink-0 rounded-full flex items-center justify-center', config.iconBg, config.iconColor)}>
        <span className="material-symbols-outlined text-[20px]">{config.icon}</span>
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start gap-4 mb-1">
          <h4 className="font-bold text-on-surface leading-tight">{notification.title}</h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="h-2 w-2 bg-primary rounded-full"></span>
            <p className="text-[11px] font-bold text-secondary uppercase">{timestamp}</p>
          </div>
        </div>
        {notification.ticketDisplayId && (
          <span className="inline-block text-[10px] font-bold text-slate-400 bg-surface-container py-0.5 px-1.5 rounded tracking-widest mb-2">
            {notification.ticketDisplayId}
          </span>
        )}
        <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{notification.message}</p>
        <div className="flex items-center gap-4">
          {config.primaryAction && (
            <button
              onClick={handlePrimaryAction}
              className="text-xs font-black text-primary uppercase tracking-wider hover:underline"
            >
              {config.primaryAction}
            </button>
          )}
          {config.secondaryAction && (
            <button className="text-xs font-bold text-secondary hover:text-on-surface uppercase tracking-wider">
              {config.secondaryAction}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
