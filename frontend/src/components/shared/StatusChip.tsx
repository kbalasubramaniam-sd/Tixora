import { Chip, type ChipVariant } from '@/components/ui/Chip'
import { TicketStatus } from '@/types/enums'

const statusVariant: Record<TicketStatus, ChipVariant> = {
  [TicketStatus.Draft]: 'default',
  [TicketStatus.Submitted]: 'info',
  [TicketStatus.InReview]: 'default',
  [TicketStatus.PendingRequesterAction]: 'warning',
  [TicketStatus.Approved]: 'success',
  [TicketStatus.InProvisioning]: 'default',
  [TicketStatus.Completed]: 'success',
  [TicketStatus.Rejected]: 'error',
  [TicketStatus.Cancelled]: 'default',
  [TicketStatus.SlaBreached]: 'error',
}

const statusLabel: Record<TicketStatus, string> = {
  [TicketStatus.Draft]: 'Draft',
  [TicketStatus.Submitted]: 'Submitted',
  [TicketStatus.InReview]: 'In Review',
  [TicketStatus.PendingRequesterAction]: 'Pending Action',
  [TicketStatus.Approved]: 'Approved',
  [TicketStatus.InProvisioning]: 'In Provisioning',
  [TicketStatus.Completed]: 'Completed',
  [TicketStatus.Rejected]: 'Rejected',
  [TicketStatus.Cancelled]: 'Cancelled',
  [TicketStatus.SlaBreached]: 'SLA Breached',
}

interface StatusChipProps {
  status: TicketStatus
  className?: string
}

export function StatusChip({ status, className }: StatusChipProps) {
  return (
    <Chip variant={statusVariant[status]} className={className}>
      {statusLabel[status]}
    </Chip>
  )
}
