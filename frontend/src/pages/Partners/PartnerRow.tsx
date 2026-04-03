import type { PartnerSummary } from '@/api/endpoints/partners'
import { LifecycleState } from '@/types/enums'
import { PRODUCT_LABELS } from '@/utils/labels'
import { getInitials } from '@/utils/format'

const statusBadge: Record<string, string> = {
  [LifecycleState.Live]: 'bg-teal-100 text-teal-800',
  [LifecycleState.UatCompleted]: 'bg-teal-50 text-teal-700',
  [LifecycleState.UatActive]: 'bg-amber-100 text-amber-800',
  [LifecycleState.Onboarded]: 'bg-secondary-container text-on-secondary-container',
  [LifecycleState.None]: 'bg-surface-container text-on-surface-variant',
}

const statusLabel: Record<string, string> = {
  [LifecycleState.Live]: 'Live',
  [LifecycleState.UatCompleted]: 'UAT Done',
  [LifecycleState.UatActive]: 'UAT',
  [LifecycleState.Onboarded]: 'Onboarded',
  [LifecycleState.None]: 'None',
}

interface PartnerRowProps {
  partner: PartnerSummary
}

export function PartnerRow({ partner }: PartnerRowProps) {
  return (
    <div className="group flex items-center bg-surface-container-lowest p-6 rounded-xl hover:shadow-[0_10px_40px_rgba(23,29,28,0.06)] transition-all duration-300 cursor-pointer">
      {/* Initial circle */}
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm mr-4 flex-shrink-0">
        {getInitials(partner.name)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-on-surface">{partner.name}</h3>
          <span className="text-[10px] font-bold text-slate-400 bg-surface-container py-1 px-2 rounded tracking-widest">
            {partner.refId}
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          {partner.productDetails.map((pd) => (
            <span key={pd.productCode} className="inline-flex items-center bg-surface-container-low rounded-full overflow-hidden text-[10px] font-bold">
              <span className="bg-primary/10 text-primary px-2.5 py-1 tracking-wider">
                {PRODUCT_LABELS[pd.productCode] ?? pd.productCode}
              </span>
              <span className={`${statusBadge[pd.lifecycleState] ?? statusBadge[LifecycleState.None]} px-2 py-1`}>
                {statusLabel[pd.lifecycleState] ?? '—'}
              </span>
            </span>
          ))}
        </div>
      </div>
      <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors flex-shrink-0">
        chevron_right
      </span>
    </div>
  )
}
