import { Chip, type ChipVariant } from '@/components/ui/Chip'
import { TicketStatus } from '@/types/enums'
import { STATUS_LABELS } from '@/utils/labels'

const statusVariant: Record<TicketStatus, ChipVariant> = {
  [TicketStatus.Submitted]: 'info',
  [TicketStatus.InReview]: 'default',
  [TicketStatus.PendingRequesterAction]: 'warning',
  [TicketStatus.InProvisioning]: 'default',
  [TicketStatus.Phase1Complete]: 'success',
  [TicketStatus.AwaitingUatSignal]: 'warning',
  [TicketStatus.Phase2InReview]: 'default',
  [TicketStatus.Completed]: 'success',
  [TicketStatus.Rejected]: 'error',
  [TicketStatus.Cancelled]: 'default',
}

interface StatusChipProps {
  status: TicketStatus
  className?: string
}

export function StatusChip({ status, className }: StatusChipProps) {
  return (
    <Chip variant={statusVariant[status]} className={className}>
      {STATUS_LABELS[status]}
    </Chip>
  )
}
