import { useNavigate } from 'react-router'
import { Chip } from '@/components/ui/Chip'
import { SlaIndicator } from './SlaIndicator'
import type { TicketSummary } from '@/types/ticket'

interface TicketRowProps {
  ticket: TicketSummary
}

const productLabel: Record<string, string> = {
  RBT: 'Rabet',
  RHN: 'Rhoon',
  WTQ: 'Wtheeq',
  MLM: 'Mulem',
}

const taskLabel: Record<string, string> = {
  T01: 'Agreement',
  T02: 'UAT Access',
  T03: 'Partner Account',
  T04: 'User Account',
  T05: 'Access Support',
}

export function TicketRow({ ticket }: TicketRowProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="flex items-center gap-4 px-4 py-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low cursor-pointer transition-colors"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tickets/${ticket.id}`) }}
    >
      {/* Left: ID + Partner */}
      <div className="min-w-0 flex-1">
        <p className="text-[0.6875rem] font-medium text-on-surface-variant truncate">
          {ticket.ticketId}
        </p>
        <p className="text-sm font-medium text-on-surface truncate">
          {ticket.partnerName}
        </p>
      </div>

      {/* Center: Product + Task */}
      <div className="flex items-center gap-2 shrink-0">
        <Chip>{productLabel[ticket.productCode] ?? ticket.productCode}</Chip>
        <span className="text-xs text-on-surface-variant">
          {taskLabel[ticket.taskType] ?? ticket.taskType}
        </span>
      </div>

      {/* Right: SLA */}
      <div className="shrink-0">
        <SlaIndicator status={ticket.slaStatus} hoursRemaining={ticket.slaHoursRemaining} />
      </div>
    </div>
  )
}
