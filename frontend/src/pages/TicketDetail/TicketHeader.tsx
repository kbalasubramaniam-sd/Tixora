import { cn } from '@/utils/cn'
import { PRODUCT_LABELS, TASK_LABELS, STATUS_LABELS } from '@/utils/labels'
import type { TicketDetail } from '@/types/ticket'
import { TicketStatus, SlaStatus } from '@/types/enums'

const statusStyles: Record<string, string> = {
  [TicketStatus.Submitted]: 'bg-secondary-container text-on-secondary-container',
  [TicketStatus.InReview]: 'bg-primary-container text-on-primary-container',
  [TicketStatus.PendingRequesterAction]: 'bg-warning-container text-warning',
  [TicketStatus.InProvisioning]: 'bg-primary-container text-on-primary-container',
  [TicketStatus.Phase1Complete]: 'bg-success-container text-success',
  [TicketStatus.AwaitingUatSignal]: 'bg-warning-container text-warning',
  [TicketStatus.Phase2InReview]: 'bg-primary-container text-on-primary-container',
  [TicketStatus.Completed]: 'bg-success-container text-success',
  [TicketStatus.Rejected]: 'bg-error-badge text-on-error-badge',
  [TicketStatus.Cancelled]: 'bg-surface-container-highest text-on-surface-variant',
}


const slaChipStyles: Record<string, string> = {
  [SlaStatus.OnTrack]: 'bg-success-container text-success',
  [SlaStatus.AtRisk]: 'bg-warning-container text-warning',
  [SlaStatus.Critical]: 'bg-error-badge text-on-error-badge',
  [SlaStatus.Breached]: 'bg-error-badge text-on-error-badge font-black',
}

function formatSlaChip(status: SlaStatus, hours: number): string {
  if (status === SlaStatus.Breached) {
    const over = Math.abs(hours)
    const h = Math.floor(over)
    const m = Math.round((over - h) * 60)
    return `BREACHED · ${h}h ${m}m over`
  }
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `SLA: ${h}h ${m > 0 ? `${m}m ` : ''}left`
}

const accessPathLabel: Record<string, string> = {
  portal: 'Portal Only',
  api: 'API Only',
  both: 'Portal + API',
}

interface TicketHeaderProps {
  ticket: TicketDetail
}

export function TicketHeader({ ticket }: TicketHeaderProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              High Priority
            </span>
            <span className="text-on-surface-variant text-xs font-medium">Ticket ID</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface">{ticket.ticketId}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center h-7 px-3 rounded-full text-xs font-bold bg-surface-container-highest text-on-surface">
            {PRODUCT_LABELS[ticket.productCode] ?? ticket.productCode}
          </span>
          <span className="inline-flex items-center h-7 px-3 rounded-full text-xs font-bold bg-surface-container-highest text-on-surface">
            {TASK_LABELS[ticket.taskType] ?? ticket.taskType}
          </span>
          <span className={cn('inline-flex items-center h-7 px-3 rounded-full text-xs font-bold', statusStyles[ticket.status])}>
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </span>
          <span className={cn('inline-flex items-center h-7 px-3 gap-1 rounded-full text-xs font-bold', slaChipStyles[ticket.slaStatus])}>
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {formatSlaChip(ticket.slaStatus, ticket.slaHoursRemaining)}
          </span>
          {ticket.accessPath && (
            <span className="inline-flex items-center h-7 px-3 rounded-full text-xs font-bold bg-surface-container-highest text-on-surface">
              {accessPathLabel[ticket.accessPath]}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
