import { useState } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/utils/cn'
import { formatTime, getInitials } from '@/utils/format'
import { PRODUCT_LABELS, TASK_LABELS, SLA_LABELS } from '@/utils/labels'
import type { TicketSummary } from '@/types/ticket'
import { SlaStatus } from '@/types/enums'

interface QueueTableProps {
  tickets: TicketSummary[]
  emptyIcon?: string
  emptyTitle?: string
  emptyMessage?: string
}

const slaDotColor: Record<string, string> = {
  [SlaStatus.OnTrack]: 'bg-primary',
  [SlaStatus.AtRisk]: 'bg-warning',
  [SlaStatus.Critical]: 'bg-error',
  [SlaStatus.Breached]: 'bg-error',
}

const stageIcon: Record<string, string> = {
  'Legal Review': 'gavel',
  'Product Review': 'inventory_2',
  'EA Sign-off': 'verified',
  'Integration Review': 'integration_instructions',
  'Access Provisioning': 'vpn_key',
  'Support Triage': 'support_agent',
  'Compliance Check': 'policy',
  'Account Provisioning': 'settings',
}

type SortKey = 'ticketId' | 'partnerName' | 'slaHoursRemaining'

export function QueueTable({ tickets, emptyIcon = 'inbox', emptyTitle = 'Your queue is clear', emptyMessage = 'No tickets currently assigned to your team' }: QueueTableProps) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState<SortKey>('slaHoursRemaining')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...tickets].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    }
    return 0
  })

  if (tickets.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-sm">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3 block">{emptyIcon}</span>
        <h3 className="text-lg font-bold text-on-surface mb-1">{emptyTitle}</h3>
        <p className="text-sm text-on-surface-variant">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-separate border-spacing-0 min-w-[1100px]">
          <thead className="bg-surface-container-low">
            <tr className="text-[10px] font-black tracking-[0.1em] text-on-surface-variant uppercase">
              <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" tabIndex={0} role="button" onClick={() => handleSort('ticketId')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('ticketId') } }}>
                Ticket ID
              </th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Task</th>
              <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" tabIndex={0} role="button" onClick={() => handleSort('partnerName')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('partnerName') } }}>
                Partner
              </th>
              <th className="px-6 py-4">Requester</th>
              <th className="px-6 py-4">Stage</th>
              <th className="px-6 py-4">SLA</th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-primary transition-colors" tabIndex={0} role="button" onClick={() => handleSort('slaHoursRemaining')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('slaHoursRemaining') } }}>
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {sorted.map((ticket, i) => (
              <tr
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tickets/${ticket.id}`) }}
                tabIndex={0}
                role="button"
                className={cn(
                  'hover:bg-surface-hover transition-colors duration-200 cursor-pointer h-16 outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                  i % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface',
                )}
              >
                <td className="px-6 py-4">
                  <span className="font-semibold text-primary text-sm">{ticket.ticketId}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-secondary-container text-on-secondary-container text-[10px] font-black px-2 py-1 rounded tracking-widest">
                    {PRODUCT_LABELS[ticket.productCode]?.toUpperCase() ?? ticket.productCode}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-on-surface text-sm">{TASK_LABELS[ticket.taskType]}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-on-surface-variant break-words">{ticket.partnerName}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {getInitials(ticket.requesterName)}
                    </div>
                    <span className="text-sm text-on-surface break-words">{ticket.requesterName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <span className="material-symbols-outlined text-[16px] flex-shrink-0">{stageIcon[ticket.currentStage] ?? 'pending'}</span>
                    <span className="break-words">{ticket.currentStage}</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', slaDotColor[ticket.slaStatus])} />
                    <span className="text-[10px] font-bold text-secondary uppercase">{SLA_LABELS[ticket.slaStatus]}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={cn(
                    'font-medium text-sm whitespace-nowrap',
                    ticket.slaHoursRemaining < 0 ? 'text-error font-bold' : 'text-on-surface-variant',
                  )}>
                    {formatTime(ticket.slaHoursRemaining)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-12 pb-12">
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-secondary">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full primary-gradient text-on-primary font-bold shadow-md">1</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors font-medium text-secondary">2</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors font-medium text-secondary">3</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-secondary">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </>
  )
}
