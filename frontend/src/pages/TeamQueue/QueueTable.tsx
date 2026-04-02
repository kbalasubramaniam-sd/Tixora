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
      <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm">
        <div className="p-6">
          <h3 className="text-xl font-bold text-on-surface mb-1 font-headline">Queue Backlog</h3>
          <p className="text-sm text-on-surface-variant">Showing {tickets.length} active operational tasks</p>
        </div>
        <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-surface-container-highest text-on-surface-variant font-label">
            <tr className="h-[52px]">
              <th className="px-6 py-4 text-[0.75rem] font-bold uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" tabIndex={0} role="button" onClick={() => handleSort('ticketId')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('ticketId') } }}>
                <div className="flex items-center gap-1">Ticket ID <span className="material-symbols-outlined text-sm">unfold_more</span></div>
              </th>
              <th className="px-6 py-4 text-[0.75rem] font-bold uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">
                <div className="flex items-center gap-1">Product <span className="material-symbols-outlined text-sm">unfold_more</span></div>
              </th>
              <th className="px-6 py-4 text-[0.75rem] font-bold uppercase tracking-widest">Task</th>
              <th className="px-6 py-4 text-[0.75rem] font-bold uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" tabIndex={0} role="button" onClick={() => handleSort('partnerName')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('partnerName') } }}>
                <div className="flex items-center gap-1">Partner <span className="material-symbols-outlined text-sm">unfold_more</span></div>
              </th>
              <th className="px-6 py-4 text-[0.75rem] font-bold uppercase tracking-widest">Requester</th>
              <th className="px-6 py-4 text-[0.75rem] font-bold uppercase tracking-widest">Stage</th>
              <th className="px-6 py-4 text-[0.75rem] font-bold uppercase tracking-widest">SLA</th>
              <th className="px-6 py-4 text-[0.75rem] font-bold uppercase tracking-widest text-right cursor-pointer hover:text-primary transition-colors" tabIndex={0} role="button" onClick={() => handleSort('slaHoursRemaining')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('slaHoursRemaining') } }}>
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest">
            {sorted.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tickets/${ticket.id}`) }}
                tabIndex={0}
                role="button"
                className="hover:bg-surface-container-highest/50 cursor-pointer transition-colors h-[64px] outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <td className="px-6 py-2">
                  <span className="font-mono text-xs text-primary font-bold">{ticket.ticketId}</span>
                </td>
                <td className="px-6 py-2">
                  <span className="bg-surface-container-highest text-on-surface px-2 py-1 rounded text-[10px] font-bold uppercase">
                    {PRODUCT_LABELS[ticket.productCode]?.toUpperCase() ?? ticket.productCode}
                  </span>
                </td>
                <td className="px-6 py-2">
                  <span className="font-medium text-on-surface text-sm">{TASK_LABELS[ticket.taskType]}</span>
                </td>
                <td className="px-6 py-2">
                  <span className="text-sm text-on-surface-variant break-words">{ticket.partnerName}</span>
                </td>
                <td className="px-6 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {getInitials(ticket.requesterName)}
                    </div>
                    <span className="text-sm text-on-surface break-words">{ticket.requesterName}</span>
                  </div>
                </td>
                <td className="px-6 py-2">
                  <span className="text-xs bg-surface-container-highest text-on-surface px-2 py-1 rounded font-medium">
                    {ticket.currentStage}
                  </span>
                </td>
                <td className="px-6 py-2">
                  <span className="flex items-center gap-1.5 text-xs text-on-surface font-semibold">
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', slaDotColor[ticket.slaStatus])} />
                    {SLA_LABELS[ticket.slaStatus]} {formatTime(ticket.slaHoursRemaining)}
                  </span>
                </td>
                <td className="px-6 py-2 text-right">
                  <span className="font-mono text-xs text-on-surface-variant">
                    {formatTime(ticket.slaHoursRemaining)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="p-6 bg-surface-container-low rounded-b-xl flex flex-col sm:flex-row justify-between items-center gap-4 -mt-px">
        <div className="flex items-center gap-4">
          <span className="text-sm text-on-surface-variant">Showing {tickets.length} items</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-white transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-10 h-10 rounded-full primary-gradient text-white flex items-center justify-center font-bold">1</button>
          <button className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-white transition-colors">2</button>
          <button className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-white transition-colors">3</button>
          <button className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-white transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </>
  )
}
