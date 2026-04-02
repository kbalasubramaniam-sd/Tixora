import { useNavigate } from 'react-router'
import { cn } from '@/utils/cn'
import { NotificationType } from '@/types/enums'
import type { NotificationItem } from '@/api/endpoints/notifications'

interface TypeConfig {
  border: string
  iconBg: string
  iconColor: string
  icon: string
  primaryAction?: string
  secondaryAction?: string
}

const typeConfig: Partial<Record<NotificationType, TypeConfig>> = {
  [NotificationType.SlaBreach]: {
    border: 'border-error',
    iconBg: 'bg-error-container',
    iconColor: 'text-error',
    icon: 'priority_high',
    primaryAction: 'Investigate Now',
    secondaryAction: 'Acknowledge',
  },
  [NotificationType.SlaWarning75]: {
    border: 'border-tertiary',
    iconBg: 'bg-tertiary-container/10',
    iconColor: 'text-tertiary',
    icon: 'hourglass_empty',
    primaryAction: 'Prioritize',
  },
  [NotificationType.SlaWarning90]: {
    border: 'border-tertiary',
    iconBg: 'bg-tertiary-container/10',
    iconColor: 'text-tertiary',
    icon: 'hourglass_empty',
    primaryAction: 'Prioritize',
  },
  [NotificationType.StageAdvanced]: {
    border: 'border-primary',
    iconBg: 'bg-primary-container/10',
    iconColor: 'text-primary',
    icon: 'stat_3',
    primaryAction: 'View Changes',
  },
  [NotificationType.RequestSubmitted]: {
    border: 'border-primary',
    iconBg: 'bg-primary-container/10',
    iconColor: 'text-primary',
    icon: 'assignment',
    primaryAction: 'View Ticket',
  },
  [NotificationType.ClarificationRequested]: {
    border: 'border-primary',
    iconBg: 'bg-primary-container/10',
    iconColor: 'text-primary',
    icon: 'chat_bubble',
    primaryAction: 'Respond',
  },
  [NotificationType.TicketReassigned]: {
    border: 'border-outline-variant',
    iconBg: 'bg-surface-container-low',
    iconColor: 'text-on-surface-variant',
    icon: 'person_add',
    primaryAction: 'View Ticket',
  },
  [NotificationType.UatPhase1Complete]: {
    border: 'border-outline-variant',
    iconBg: 'bg-surface-container-low',
    iconColor: 'text-on-surface-variant',
    icon: 'vpn_key',
    primaryAction: 'View Ticket',
  },
  [NotificationType.RequestCompleted]: {
    border: '',
    iconBg: 'bg-surface-container-highest',
    iconColor: 'text-secondary',
    icon: 'check_circle',
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
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const navigate = useNavigate()
  const config = typeConfig[notification.type] ?? defaultConfig

  const handlePrimaryAction = () => {
    if (notification.ticketId) {
      navigate(`/tickets/${notification.ticketId}`)
    }
  }

  if (notification.read) {
    return (
      <div className="bg-surface-container-low/50 p-5 rounded-2xl flex gap-5 items-start opacity-80">
        <div className={cn('mt-1 h-10 w-10 shrink-0 rounded-full flex items-center justify-center', config.iconBg, config.iconColor)}>
          <span className="material-symbols-outlined text-[20px]">{config.icon}</span>
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-bold text-on-surface leading-tight">{notification.title}</h4>
            <p className="text-[11px] font-bold text-outline uppercase flex-shrink-0 ml-4">{notification.timestamp}</p>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{notification.description}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'bg-surface-container-lowest p-5 rounded-2xl shadow-[0_10px_40px_rgba(23,29,28,0.03)] flex gap-5 items-start border-l-4 group hover:translate-y-[-2px] transition-all',
      config.border,
    )}>
      <div className={cn('mt-1 h-10 w-10 shrink-0 rounded-full flex items-center justify-center', config.iconBg, config.iconColor)}>
        <span className="material-symbols-outlined text-[20px]">{config.icon}</span>
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-on-surface leading-tight">{notification.title}</h4>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <span className="h-2 w-2 bg-primary rounded-full"></span>
            <p className="text-[11px] font-bold text-secondary uppercase">{notification.timestamp}</p>
          </div>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{notification.description}</p>
        <div className="flex items-center gap-4">
          {config.primaryAction && (
            <button
              onClick={handlePrimaryAction}
              className={cn('text-xs font-black uppercase tracking-wider hover:underline', config.iconColor === 'text-error' ? 'text-error' : config.iconColor === 'text-tertiary' ? 'text-tertiary' : 'text-primary')}
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
