import type { PartnerSummary } from '@/api/endpoints/partners'
import { LifecycleState } from '@/types/enums'

const statusBadge: Record<string, string> = {
  [LifecycleState.Live]: 'bg-teal-100 text-teal-800',
  [LifecycleState.UatActive]: 'bg-amber-100 text-amber-800',
  [LifecycleState.Onboarded]: 'bg-secondary-container text-on-secondary-container',
  [LifecycleState.Agreed]: 'bg-surface-container-highest text-on-surface-variant',
  [LifecycleState.None]: 'bg-surface-container text-on-surface-variant',
}

const statusLabel: Record<string, string> = {
  [LifecycleState.Live]: 'LIVE',
  [LifecycleState.UatActive]: 'UAT_ACTIVE',
  [LifecycleState.Onboarded]: 'ONBOARDED',
  [LifecycleState.Agreed]: 'AGREED',
  [LifecycleState.None]: 'NONE',
}

interface PartnerRowProps {
  partner: PartnerSummary
}

export function PartnerRow({ partner }: PartnerRowProps) {
  return (
    <div className="group flex items-center bg-surface-container-lowest p-6 rounded-xl hover:shadow-[0_10px_40px_rgba(23,29,28,0.06)] transition-all duration-300 cursor-pointer">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-on-surface">{partner.name}</h3>
          <span className="text-[10px] font-bold text-slate-400 bg-surface-container py-1 px-2 rounded tracking-widest">
            {partner.refId}
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          {partner.products.map((code) => (
            <span
              key={code}
              className="bg-primary/10 text-primary px-2.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider"
            >
              {code}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-10">
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
          <span className={`${statusBadge[partner.lifecycleState] ?? statusBadge[LifecycleState.None]} px-4 py-1.5 rounded-full text-[11px] font-bold`}>
            {statusLabel[partner.lifecycleState] ?? 'UNKNOWN'}
          </span>
        </div>
        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
          chevron_right
        </span>
      </div>
    </div>
  )
}
