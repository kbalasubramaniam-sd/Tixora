import { cn } from '@/utils/cn'
import { SlaStatus } from '@/types/enums'

interface SlaIndicatorProps {
  status: SlaStatus
  hoursRemaining: number
  className?: string
}

function formatTime(hours: number): string {
  if (hours <= 0) return 'BREACHED'
  if (hours < 1) return `${Math.round(hours * 60)}m remaining`
  return `${Math.round(hours)}h remaining`
}

const dotColor: Record<SlaStatus, string> = {
  [SlaStatus.OnTrack]: 'bg-success',
  [SlaStatus.AtRisk]: 'bg-warning',
  [SlaStatus.Critical]: 'bg-error',
  [SlaStatus.Breached]: 'bg-error',
}

const textColor: Record<SlaStatus, string> = {
  [SlaStatus.OnTrack]: 'text-success',
  [SlaStatus.AtRisk]: 'text-warning',
  [SlaStatus.Critical]: 'text-error',
  [SlaStatus.Breached]: 'text-error',
}

export function SlaIndicator({ status, hoursRemaining, className }: SlaIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className={cn('w-2 h-2 rounded-full shrink-0', dotColor[status])} />
      <span className={cn('text-xs font-medium whitespace-nowrap', textColor[status])}>
        {formatTime(hoursRemaining)}
      </span>
    </div>
  )
}
