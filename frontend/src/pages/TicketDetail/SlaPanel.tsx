import { cn } from '@/utils/cn'
import type { TicketDetail } from '@/types/ticket'
import { SlaStatus } from '@/types/enums'

interface SlaPanelProps {
  ticket: TicketDetail
}

function slaPercent(hoursRemaining: number): number {
  // Approximate: assume 16h total SLA window
  const total = 16
  const elapsed = total - hoursRemaining
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100))
  return Math.round(pct)
}

function formatTargetCompletion(createdAt: string): string {
  const created = new Date(createdAt)
  // Add 16 hours (approximate SLA window)
  const target = new Date(created.getTime() + 16 * 60 * 60 * 1000)
  const day = target.getDate().toString().padStart(2, '0')
  const month = target.toLocaleString('en-US', { month: 'long' })
  const hours12 = target.getHours() % 12 || 12
  const minutes = target.getMinutes().toString().padStart(2, '0')
  const ampm = target.getHours() >= 12 ? 'PM' : 'AM'
  return `${day} ${month}, ${hours12.toString().padStart(2, '0')}:${minutes} ${ampm}`
}

function formatTimeRemaining(hours: number): string {
  if (hours <= 0) return '0h 0m'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m}m`
}

const barColor: Record<string, string> = {
  [SlaStatus.OnTrack]: 'primary-gradient',
  [SlaStatus.AtRisk]: 'bg-warning',
  [SlaStatus.Critical]: 'bg-error',
  [SlaStatus.Breached]: 'bg-error',
}

const pctColor: Record<string, string> = {
  [SlaStatus.OnTrack]: 'text-primary',
  [SlaStatus.AtRisk]: 'text-warning',
  [SlaStatus.Critical]: 'text-error',
  [SlaStatus.Breached]: 'text-error',
}

export function SlaPanel({ ticket }: SlaPanelProps) {
  const pct = slaPercent(ticket.slaHoursRemaining)

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl custom-shadow space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">SLA Integrity</h4>
        <span className={cn('font-bold text-xs', pctColor[ticket.slaStatus])}>{pct}%</span>
      </div>
      <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
        <div className={cn('h-full', barColor[ticket.slaStatus])} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-on-surface-variant">Time remaining:</span>
        <span className="text-sm font-black text-on-surface">{formatTimeRemaining(ticket.slaHoursRemaining)}</span>
      </div>
      <div className="pt-2 border-t border-surface-container-highest flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
        <span className="material-symbols-outlined text-xs">info</span>
        Target Completion: {formatTargetCompletion(ticket.createdAt)}
      </div>
    </div>
  )
}
