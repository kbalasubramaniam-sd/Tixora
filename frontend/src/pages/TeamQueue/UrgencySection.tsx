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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      {/* SLA Breached */}
      {breached.length > 0 && (
        <section className="bg-error-surface rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-on-surface tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              SLA BREACHED
            </h2>
            <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-black tracking-widest">
              {breached.length} {breached.length === 1 ? 'ITEM' : 'ITEMS'}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {breached.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="bg-surface-container-lowest p-4 rounded-lg flex items-center justify-between border-l-4 border-error shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tickets/${ticket.id}`) }}
              >
                <div>
                  <span className="text-[10px] font-bold text-secondary tracking-widest mb-1 block">{ticket.ticketId}</span>
                  <h3 className="font-bold text-on-surface">{ticket.partnerName} — {TASK_LABELS_SHORT[ticket.taskType]}</h3>
                </div>
                <div className="text-right">
                  <p className="text-error font-black text-sm uppercase tracking-tighter">{formatSlaTime(ticket.slaHoursRemaining)}</p>
                  <span className="text-[10px] font-bold text-tertiary-container uppercase tracking-widest">CRITICAL</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Approaching SLA */}
      {atRisk.length > 0 && (
        <section className="bg-warning-surface rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-on-surface tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-warning" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              APPROACHING SLA
            </h2>
            <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-black tracking-widest">
              {atRisk.length} {atRisk.length === 1 ? 'ITEM' : 'ITEMS'}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {atRisk.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="bg-surface-container-lowest p-4 rounded-lg flex items-center justify-between border-l-4 border-warning shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tickets/${ticket.id}`) }}
              >
                <div>
                  <span className="text-[10px] font-bold text-secondary tracking-widest mb-1 block">{ticket.ticketId}</span>
                  <h3 className="font-bold text-on-surface">{ticket.partnerName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-warning font-black text-sm uppercase tracking-tighter">{formatSlaTime(ticket.slaHoursRemaining)}</p>
                  <span className="text-[10px] font-bold text-tertiary-container uppercase tracking-widest">HIGH</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fill empty grid slot if only one section exists */}
      {breached.length === 0 && <div />}
      {atRisk.length === 0 && breached.length > 0 && <div />}
    </div>
  )
}
