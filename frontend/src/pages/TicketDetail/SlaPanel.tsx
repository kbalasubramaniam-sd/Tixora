import { cn } from '@/utils/cn'
import type { TicketDetail } from '@/types/ticket'
import { SlaStatus, TicketStatus } from '@/types/enums'

interface SlaPanelProps {
  ticket: TicketDetail
}

function formatTimeRemaining(hours: number): string {
  if (hours <= 0) return '0h 0m'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m}m`
}

const barColor: Record<string, string> = {
  [SlaStatus.OnTrack]: 'primary-gradient',
  [SlaStatus.AtRisk]: 'bg-warning',
  [SlaStatus.Critical]: 'bg-error',
  [SlaStatus.Breached]: 'bg-error',
}

const pctColor: Record<string, string> = {
  [SlaStatus.OnTrack]: 'text-primary',
  [SlaStatus.AtRisk]: 'text-warning',
  [SlaStatus.Critical]: 'text-error',
  [SlaStatus.Breached]: 'text-error',
}

const statusLabel: Record<string, string> = {
  [SlaStatus.OnTrack]: 'On Track',
  [SlaStatus.AtRisk]: 'At Risk',
  [SlaStatus.Critical]: 'Critical',
  [SlaStatus.Breached]: 'Breached',
}

export function SlaPanel({ ticket }: SlaPanelProps) {
  // Hide SLA for cancelled or rejected tickets
  const isTerminal = ticket.status === TicketStatus.Cancelled || ticket.status === TicketStatus.Rejected
  if (isTerminal) {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-xl custom-shadow space-y-3">
        <h4 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">SLA Tracking</h4>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">block</span>
          <span className="text-sm font-medium">N/A</span>
        </div>
      </div>
    )
  }

  // SLA = 0 with OnTrack means no SLA tracking for this stage
  const noSla = ticket.slaStatus === SlaStatus.OnTrack && ticket.slaHoursRemaining === 0

  if (noSla) {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-xl custom-shadow space-y-3">
        <h4 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">SLA Tracking</h4>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span className="text-sm font-medium">Not tracked for this stage</span>
        </div>
      </div>
    )
  }

  // Calculate progress bar: use remaining hours relative to a reasonable estimate
  // Since we don't know the total SLA target, show remaining time + status
  const pct = ticket.slaStatus === SlaStatus.Breached ? 100
    : ticket.slaStatus === SlaStatus.Critical ? 85
    : ticket.slaStatus === SlaStatus.AtRisk ? 65
    : Math.min(50, Math.max(10, 50 - ticket.slaHoursRemaining * 3))

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl custom-shadow space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">SLA Integrity</h4>
        <span className={cn('font-bold text-xs px-2 py-0.5 rounded-full', pctColor[ticket.slaStatus],
          ticket.slaStatus === SlaStatus.Breached && 'bg-error/10',
          ticket.slaStatus === SlaStatus.Critical && 'bg-error/10',
          ticket.slaStatus === SlaStatus.AtRisk && 'bg-warning/10',
          ticket.slaStatus === SlaStatus.OnTrack && 'bg-primary/10',
        )}>
          {statusLabel[ticket.slaStatus] ?? ticket.slaStatus}
        </span>
      </div>
      <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
        <div className={cn('h-full transition-all duration-500', barColor[ticket.slaStatus])} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-on-surface-variant">Time remaining:</span>
        <span className="text-sm font-black text-on-surface">{formatTimeRemaining(ticket.slaHoursRemaining)}</span>
      </div>
    </div>
  )
}
