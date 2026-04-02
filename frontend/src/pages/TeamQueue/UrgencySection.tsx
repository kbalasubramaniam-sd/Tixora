import { useNavigate } from 'react-router'
import type { TicketSummary } from '@/types/ticket'
import { SlaStatus } from '@/types/enums'
import { TASK_LABELS_SHORT } from '@/utils/labels'

interface UrgencySectionProps {
  tickets: TicketSummary[]
}

function formatSlaTime(hours: number): string {
  const abs = Math.abs(hours)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
  return hours < 0 ? `Over ${timeStr}` : `Ends in ${timeStr}`
}

export function UrgencySection({ tickets }: UrgencySectionProps) {
  const navigate = useNavigate()
  const breached = tickets.filter((t) => t.slaStatus === SlaStatus.Breached)
  const atRisk = tickets.filter((t) => t.slaStatus === SlaStatus.AtRisk || t.slaStatus === SlaStatus.Critical)

  if (breached.length === 0 && atRisk.length === 0) return null

  return (
    <div className="space-y-6 mb-12">
      {/* SLA Breached */}
      {breached.length > 0 && (
        <section className="bg-error-container/20 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
            <h2 className="text-sm font-bold text-error uppercase tracking-wider font-label">
              SLA Breached ({breached.length} {breached.length === 1 ? 'Item' : 'Items'})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {breached.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="bg-surface-container-highest p-4 rounded-lg flex flex-col justify-between shadow-sm border-l-4 border-error cursor-pointer hover:shadow-md transition-shadow"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tickets/${ticket.id}`) }}
              >
                <div>
                  <p className="text-xs font-mono text-on-surface-variant mb-1">{ticket.ticketId}</p>
                  <p className="font-bold text-on-surface">{ticket.partnerName}</p>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs font-bold text-error uppercase">{formatSlaTime(ticket.slaHoursRemaining)}</span>
                  <span className="text-[10px] bg-error-container text-on-error-container px-2 py-0.5 rounded font-bold uppercase">Critical</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Approaching SLA */}
      {atRisk.length > 0 && (
        <section className="bg-tertiary-fixed/20 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <h2 className="text-sm font-bold text-tertiary uppercase tracking-wider font-label">
              Approaching SLA ({atRisk.length} {atRisk.length === 1 ? 'Item' : 'Items'})
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {atRisk.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="bg-surface-container-highest p-4 rounded-lg flex items-center justify-between shadow-sm border-l-4 border-tertiary cursor-pointer hover:shadow-md transition-shadow"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tickets/${ticket.id}`) }}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-surface-container-low p-2 rounded-lg">
                    <span className="material-symbols-outlined text-tertiary">schedule</span>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-on-surface-variant">{ticket.ticketId}</p>
                    <p className="font-bold text-on-surface">{ticket.partnerName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-tertiary">{formatSlaTime(ticket.slaHoursRemaining)}</p>
                  <div className="w-24 h-1.5 bg-surface-container-low rounded-full mt-1">
                    <div className="bg-tertiary h-full w-[70%] rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
