import type { TicketDetail } from '@/types/ticket'
import { LIFECYCLE_LABELS } from '@/utils/labels'

interface PartnerPanelProps {
  ticket: TicketDetail
}

export function PartnerPanel({ ticket }: PartnerPanelProps) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl custom-shadow space-y-4">
      <h4 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">Partner Insight</h4>
      <div className="flex items-center gap-4 p-3 bg-surface-container-low rounded-lg">
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            business
          </span>
        </div>
        <div>
          <p className="text-xs font-bold">{ticket.partnerName}</p>
          <p className="text-[10px] text-on-surface-variant">Partner · {ticket.companyCode}</p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2">
        <span className="text-xs font-medium text-on-surface-variant">Lifecycle Status</span>
        <span className="text-xs font-black text-primary px-3 py-1 bg-primary/10 rounded-full">
          {LIFECYCLE_LABELS[ticket.lifecycleState as keyof typeof LIFECYCLE_LABELS] ?? ticket.lifecycleState}
        </span>
      </div>
    </div>
  )
}
