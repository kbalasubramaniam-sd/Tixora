import { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

interface FilterOption {
  label: string
  value: string
}

interface FilterBarProps {
  product: string
  task: string
  slaStatus: string
  onProductChange: (v: string) => void
  onTaskChange: (v: string) => void
  onSlaChange: (v: string) => void
  onClear: () => void
  status?: string
  onStatusChange?: (v: string) => void
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

function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: FilterOption[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const displayValue = options.find((o) => o.value === value)?.label ?? 'All'
  const isActive = value !== 'All'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-colors',
          isActive
            ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
            : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low',
        )}
      >
        <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/60">
          {label}
        </span>
        <span className={cn('text-xs font-bold', isActive ? 'text-primary' : 'text-on-surface')}>
          {displayValue}
        </span>
        {isActive ? (
          <span
            className="material-symbols-outlined text-[14px] text-primary hover:text-error transition-colors"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onChange('All')
              setOpen(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onChange('All')
                setOpen(false)
              }
            }}
          >
            close
          </span>
        ) : (
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">expand_more</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 bg-surface-container-lowest rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-outline-variant/30 p-1.5 z-50 min-w-[180px] animate-[fadeIn_0.15s_ease-out]">
          {options.map((opt) => {
            const isSelected = value === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
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
          })}
        </div>
      )}
    </div>
  )
}

export function FilterBar({ product, task, slaStatus, onProductChange, onTaskChange, onSlaChange, onClear, status, onStatusChange }: FilterBarProps) {
  const hasFilters = product !== 'All' || task !== 'All' || slaStatus !== 'All' || (status !== undefined && status !== 'All')

  return (
    <div className="bg-surface-bright rounded-lg p-3 mb-8 flex flex-wrap items-center justify-between gap-3 shadow-sm border border-surface-container-high">
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="Product" value={product} options={products} onChange={onProductChange} />
        <FilterChip label="Task" value={task} options={tasks} onChange={onTaskChange} />
        <FilterChip label="SLA Status" value={slaStatus} options={slaStatuses} onChange={onSlaChange} />
        {status !== undefined && onStatusChange && (
          <FilterChip label="Status" value={status} options={ticketStatuses} onChange={onStatusChange} />
        )}
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
