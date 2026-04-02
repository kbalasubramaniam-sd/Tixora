import { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

interface FilterOption {
  label: string
  value: string
}

interface FilterBarProps {
  product?: string
  onProductChange?: (v: string) => void
  task?: string
  onTaskChange?: (v: string) => void
  slaStatus?: string
  onSlaChange?: (v: string) => void
  status?: string
  onStatusChange?: (v: string) => void
  lifecycle?: string
  onLifecycleChange?: (v: string) => void
  partner?: string
  onPartnerChange?: (v: string) => void
  partnerOptions?: FilterOption[]
  requester?: string
  onRequesterChange?: (v: string) => void
  requesterOptions?: FilterOption[]
  onClear: () => void
  children?: React.ReactNode
  hasExtraFilters?: boolean
}

const products: FilterOption[] = [
  { label: 'All', value: 'All' },
  { label: 'Rabet', value: 'RBT' },
  { label: 'Rhoon', value: 'RHN' },
  { label: 'Wtheeq', value: 'WTQ' },
  { label: 'Mulem', value: 'MLM' },
]

const tasks: FilterOption[] = [
  { label: 'All', value: 'All' },
  { label: 'T-01 Agreement', value: 'T01' },
  { label: 'T-02 UAT Access', value: 'T02' },
  { label: 'T-03 Partner Account', value: 'T03' },
  { label: 'T-04 Access Support', value: 'T04' },
]

const slaStatuses: FilterOption[] = [
  { label: 'All', value: 'All' },
  { label: 'On Track', value: 'OnTrack' },
  { label: 'At Risk', value: 'AtRisk' },
  { label: 'Breached', value: 'Breached' },
]

const ticketStatuses: FilterOption[] = [
  { label: 'All', value: 'All' },
  { label: 'Open', value: 'Open' },
  { label: 'In Progress', value: 'InProgress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
]

const lifecycleStates: FilterOption[] = [
  { label: 'All', value: 'All' },
  { label: 'Live', value: 'Live' },
  { label: 'UAT Active', value: 'UatActive' },
  { label: 'UAT Complete', value: 'UatCompleted' },
  { label: 'Onboarded', value: 'Onboarded' },
]

function FilterChip({
  label,
  value,
  options,
  onChange,
  searchable = false,
  wide = false,
}: {
  label: string
  value: string
  options: FilterOption[]
  onChange: (v: string) => void
  searchable?: boolean
  wide?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const displayValue = options.find((o) => o.value === value)?.label ?? 'All'
  const isActive = value !== 'All' && value !== ''

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open, searchable])

  const filtered = searchable && search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-colors',
          wide ? 'min-w-[220px]' : '',
          isActive
            ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
            : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low',
        )}
      >
        <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/60 flex-shrink-0">
          {label}
        </span>
        <span className={cn('text-xs font-bold truncate flex-1 text-left', wide ? 'max-w-[150px]' : '', isActive ? 'text-primary' : 'text-on-surface')}>
          {displayValue}
        </span>
        {isActive ? (
          <span
            className="material-symbols-outlined text-[14px] text-primary hover:text-error transition-colors flex-shrink-0"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onChange('All')
              setOpen(false)
              setSearch('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onChange('All')
                setOpen(false)
                setSearch('')
              }
            }}
          >
            close
          </span>
        ) : (
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant flex-shrink-0">expand_more</span>
        )}
      </button>

      {open && (
        <div className={cn(
          'absolute top-full left-0 mt-2 bg-surface-container-lowest rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-outline-variant/30 p-1.5 z-50 animate-[fadeIn_0.15s_ease-out]',
          searchable ? 'min-w-[260px] max-h-[320px] flex flex-col' : 'min-w-[180px]',
        )}>
          {searchable && (
            <div className="px-2 pb-1.5 mb-1 border-b border-outline-variant/20">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="w-full bg-surface-container-low border-none rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface placeholder-slate-400 focus:ring-1 focus:ring-primary/20 outline-none"
                autoComplete="off"
              />
            </div>
          )}
          <div className={searchable ? 'overflow-y-auto flex-1' : ''}>
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-on-surface-variant text-center">No results</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = value === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                      setSearch('')
                    }}
                    className={cn(
                      'w-full text-left px-3 py-[7px] text-[13px] font-medium rounded-lg transition-colors flex items-center gap-2.5',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                    )}
                  >
                    <span className={cn('w-4 flex items-center justify-center flex-shrink-0', !isSelected && 'invisible')}>
                      <span className="material-symbols-outlined text-[15px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check
                      </span>
                    </span>
                    {opt.label}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { FilterChip }

export function FilterBar({ product, onProductChange, task, onTaskChange, slaStatus, onSlaChange, status, onStatusChange, lifecycle, onLifecycleChange, partner, onPartnerChange, partnerOptions, requester, onRequesterChange, requesterOptions, onClear, children, hasExtraFilters }: FilterBarProps) {
  const hasFilters =
    (product !== undefined && product !== 'All') ||
    (task !== undefined && task !== 'All') ||
    (slaStatus !== undefined && slaStatus !== 'All') ||
    (status !== undefined && status !== 'All') ||
    (lifecycle !== undefined && lifecycle !== 'All') ||
    (partner !== undefined && partner !== 'All' && partner !== '') ||
    (requester !== undefined && requester !== 'All' && requester !== '') ||
    !!hasExtraFilters

  return (
    <div className="bg-surface-bright rounded-lg p-3 mb-8 flex flex-wrap items-center justify-between gap-3 shadow-sm border border-surface-container-high">
      <div className="flex flex-wrap items-center gap-2">
        {product !== undefined && onProductChange && (
          <FilterChip label="Product" value={product} options={products} onChange={onProductChange} />
        )}
        {task !== undefined && onTaskChange && (
          <FilterChip label="Task" value={task} options={tasks} onChange={onTaskChange} />
        )}
        {slaStatus !== undefined && onSlaChange && (
          <FilterChip label="SLA Status" value={slaStatus} options={slaStatuses} onChange={onSlaChange} />
        )}
        {status !== undefined && onStatusChange && (
          <FilterChip label="Status" value={status} options={ticketStatuses} onChange={onStatusChange} />
        )}
        {lifecycle !== undefined && onLifecycleChange && (
          <FilterChip label="Lifecycle" value={lifecycle} options={lifecycleStates} onChange={onLifecycleChange} />
        )}
        {partner !== undefined && onPartnerChange && partnerOptions && (
          <FilterChip label="Partner" value={partner} options={partnerOptions} onChange={onPartnerChange} searchable wide />
        )}
        {requester !== undefined && onRequesterChange && requesterOptions && (
          <FilterChip label="Requester" value={requester} options={requesterOptions} onChange={onRequesterChange} searchable wide />
        )}
        {children}
      </div>
      {hasFilters && (
        <button
          onClick={onClear}
          className="text-[10px] font-black tracking-widest uppercase text-secondary hover:text-primary transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">filter_alt_off</span>
          Clear All
        </button>
      )}
    </div>
  )
}
