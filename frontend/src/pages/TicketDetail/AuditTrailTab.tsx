import { cn } from '@/utils/cn'
import type { AuditEntry } from '@/types/ticket'

interface AuditTrailTabProps {
  entries: AuditEntry[]
}

const typeIcon: Record<string, string> = {
  stage_transition: 'arrow_forward',
  approval: 'check_circle',
  rejection: 'cancel',
  return: 'reply',
  document: 'attach_file',
  comment: 'chat_bubble',
  notification: 'notifications',
  sla: 'schedule',
}

const typeColor: Record<string, string> = {
  stage_transition: 'text-primary',
  approval: 'text-success',
  rejection: 'text-error',
  return: 'text-warning',
  document: 'text-on-surface-variant',
  comment: 'text-on-surface-variant',
  notification: 'text-primary',
  sla: 'text-warning',
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function AuditTrailTab({ entries }: AuditTrailTabProps) {
  // Sort newest first
  const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="space-y-4">
      {sorted.map((entry) => (
        <div key={entry.id} className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <span className={cn('material-symbols-outlined text-lg', typeColor[entry.type])}>
              {typeIcon[entry.type] ?? 'circle'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-on-surface">{entry.description}</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">{formatTimestamp(entry.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
