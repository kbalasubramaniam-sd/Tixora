import { useNavigate } from 'react-router'
import type { TicketSummary } from '@/types/ticket'
import { SlaStatus } from '@/types/enums'
import { cn } from '@/utils/cn'
import { PRODUCT_LABELS, TASK_LABELS_SHORT } from '@/utils/labels'

interface TicketRowProps {
  ticket: TicketSummary
}

const slaBarColor: Record<string, string> = {
  [SlaStatus.Breached]: 'bg-error',
  [SlaStatus.Critical]: 'bg-error',
  [SlaStatus.AtRisk]: 'bg-warning',
  [SlaStatus.OnTrack]: 'bg-primary',
}

const slaTextColor: Record<string, string> = {
  [SlaStatus.Breached]: 'text-error',
  [SlaStatus.Critical]: 'text-error',
  [SlaStatus.AtRisk]: 'text-warning',
  [SlaStatus.OnTrack]: 'text-primary',
}

const slaBorderColor: Record<string, string> = {
  [SlaStatus.Breached]: 'border-error/20',
  [SlaStatus.Critical]: 'border-error/20',
  [SlaStatus.AtRisk]: 'border-warning/20',
  [SlaStatus.OnTrack]: 'border-primary/20',
}

function formatSlaShort(hours: number): string {
  if (hours <= 0) return '0h'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours >= 24) return `${Math.round(hours / 24)}d`
  return `${Math.round(hours)}h`
}

export function TicketRow({ ticket }: TicketRowProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="p-5 flex items-center justify-between group hover:bg-surface-container-low/20 transition-colors cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tickets/${ticket.id}`) }}
    >
      <div className="flex items-center gap-4">
        <div className={cn('w-1.5 h-10 rounded-full', slaBarColor[ticket.slaStatus])} />
        <div>
          <h4 className="font-bold text-sm text-on-surface">
            {ticket.ticketId} — {ticket.partnerName}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-medium text-on-surface-variant">{ticket.partnerName}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="bg-secondary-container/40 px-2 py-0.5 rounded text-[10px] font-bold text-on-secondary-container uppercase tracking-tight">
              {PRODUCT_LABELS[ticket.productCode] ?? ticket.productCode}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 text-right">
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Task Type</p>
          <p className="text-xs font-bold text-on-surface">{TASK_LABELS_SHORT[ticket.taskType] ?? ticket.taskType}</p>
        </div>
        <div className="relative w-8 h-8 flex items-center justify-center">
          <span className={cn('absolute inset-0 border-2 rounded-full', slaBorderColor[ticket.slaStatus])} />
          <span className={cn('text-[9px] font-black', slaTextColor[ticket.slaStatus])}>
            {formatSlaShort(ticket.slaHoursRemaining)}
          </span>
        </div>
      </div>
    </div>
  )
}
