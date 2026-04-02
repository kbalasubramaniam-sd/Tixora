# S-06 Partner Search Enhancement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Partners page with FilterBar chip dropdowns (Lifecycle + Product), colored initial circles, full product names, result count, and a smaller search bar.

**Architecture:** Refactor FilterBar to accept all filter props as optional (each page passes only the chips it needs). Update Partners page to use FilterBar instead of custom tabs. Enhance PartnerRow with initial avatar and full product labels.

**Tech Stack:** React, Tailwind CSS, existing FilterBar/FilterChip components

---

### Task 1: Make FilterBar props fully optional + add lifecycle filter

**Files:**
- Modify: `frontend/src/pages/TeamQueue/FilterBar.tsx`

Currently `product`/`task`/`slaStatus` + their onChange handlers are required props. Partners page only needs `product` + `lifecycle`. Make all filter props optional and render chips conditionally.

- [ ] **Step 1: Add lifecycle filter options**

Add after the `ticketStatuses` array:

```tsx
const lifecycleStates: FilterOption[] = [
  { label: 'All', value: 'All' },
  { label: 'Live', value: 'Live' },
  { label: 'UAT Active', value: 'UatActive' },
  { label: 'UAT Complete', value: 'UatCompleted' },
  { label: 'Onboarded', value: 'Onboarded' },
]
```

- [ ] **Step 2: Refactor FilterBarProps to make all filters optional**

Replace the entire `FilterBarProps` interface with:

```tsx
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
  onClear: () => void
}
```

- [ ] **Step 3: Update FilterBar component to render chips conditionally**

Replace the FilterBar function with:

```tsx
export function FilterBar({ product, onProductChange, task, onTaskChange, slaStatus, onSlaChange, status, onStatusChange, lifecycle, onLifecycleChange, onClear }: FilterBarProps) {
  const hasFilters =
    (product !== undefined && product !== 'All') ||
    (task !== undefined && task !== 'All') ||
    (slaStatus !== undefined && slaStatus !== 'All') ||
    (status !== undefined && status !== 'All') ||
    (lifecycle !== undefined && lifecycle !== 'All')

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
```

- [ ] **Step 4: Verify TeamQueue and MyTickets still work**

Run: `cd C:/Claude/Tixora/frontend && npm run build`
Expected: No errors. TeamQueue passes `product`, `task`, `slaStatus` — all still work. MyTickets additionally passes `status` — still works.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/TeamQueue/FilterBar.tsx
git commit -m "refactor: make FilterBar props fully optional, add lifecycle filter chip"
```

---

### Task 2: Add product filter to partners endpoint

**Files:**
- Modify: `frontend/src/api/endpoints/partners.ts`
- Modify: `frontend/src/api/hooks/usePartners.ts`

- [ ] **Step 1: Add product filter to PartnerFilters and fetchPartners**

In `frontend/src/api/endpoints/partners.ts`, update the `PartnerFilters` interface:

```tsx
export interface PartnerFilters {
  search?: string
  lifecycleState?: string
  product?: string
}
```

Add product filter logic in the catch block of `fetchPartners`, after the `lifecycleState` filter:

```tsx
    if (filters?.product && filters.product !== 'All') {
      results = results.filter((p) => p.products.includes(filters.product as ProductCode))
    }
```

- [ ] **Step 2: Update usePartners query key**

In `frontend/src/api/hooks/usePartners.ts`, add product to the query key:

```tsx
export function usePartners(filters?: PartnerFilters) {
  return useQuery({
    queryKey: ['partners', filters?.search, filters?.lifecycleState, filters?.product],
    queryFn: () => fetchPartners(filters),
  })
}
```

- [ ] **Step 3: Build and verify**

Run: `cd C:/Claude/Tixora/frontend && npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/endpoints/partners.ts frontend/src/api/hooks/usePartners.ts
git commit -m "feat(S-06): add product filter to partners endpoint and hook"
```

---

### Task 3: Enhance PartnerRow with initial circle and full product names

**Files:**
- Modify: `frontend/src/pages/Partners/PartnerRow.tsx`

- [ ] **Step 1: Add imports and update the component**

Replace the entire file content with:

```tsx
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
  [LifecycleState.Live]: 'LIVE',
  [LifecycleState.UatCompleted]: 'UAT_COMPLETE',
  [LifecycleState.UatActive]: 'UAT_ACTIVE',
  [LifecycleState.Onboarded]: 'ONBOARDED',
  [LifecycleState.None]: 'NONE',
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
          {partner.products.map((code) => (
            <span
              key={code}
              className="bg-primary/10 text-primary px-2.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider"
            >
              {PRODUCT_LABELS[code] ?? code}
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
```

Key changes from previous version:
- Added `getInitials` import and colored initial circle (w-10 h-10, bg-primary/10, text-primary)
- Added `PRODUCT_LABELS` import, chips now show full names (Rabet, Rhoon) instead of codes
- Initial circle has `mr-4 flex-shrink-0` for consistent spacing

- [ ] **Step 2: Build and verify**

Run: `cd C:/Claude/Tixora/frontend && npm run build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Partners/PartnerRow.tsx
git commit -m "feat(S-06): add initial circle and full product names to PartnerRow"
```

---

### Task 4: Update Partners page — FilterBar, result count, smaller search

**Files:**
- Modify: `frontend/src/pages/Partners/index.tsx`

- [ ] **Step 1: Replace the entire Partners page**

Replace the full file content with:

```tsx
import { useState } from 'react'
import { usePartners } from '@/api/hooks/usePartners'
import { FilterBar } from '@/pages/TeamQueue/FilterBar'
import { PartnerRow } from './PartnerRow'

export default function Partners() {
  const [search, setSearch] = useState('')
  const [lifecycle, setLifecycle] = useState('All')
  const [product, setProduct] = useState('All')

  const filters = {
    search: search || undefined,
    lifecycleState: lifecycle !== 'All' ? lifecycle : undefined,
    product: product !== 'All' ? product : undefined,
  }

  const { data: partners = [], isLoading } = usePartners(
    Object.values(filters).some(Boolean) ? filters : undefined,
  )

  // Total count (unfiltered) for "Showing X of Y"
  const { data: allPartners = [] } = usePartners()

  const clearFilters = () => {
    setLifecycle('All')
    setProduct('All')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-on-background font-headline">Partners</h1>
        <p className="text-on-surface-variant mt-2 text-lg">Manage and explore Tixora's global partner network.</p>
      </header>

      {/* Search Bar */}
      <section className="mb-6">
        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-teal-600 transition-transform group-focus-within:scale-110">search</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-full py-3.5 pl-16 pr-8 text-on-surface text-lg font-medium focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest shadow-sm transition-all duration-300 placeholder-slate-400"
            placeholder="Search by partner name or account reference"
          />
        </div>
      </section>

      {/* Filter Bar */}
      <FilterBar
        product={product}
        onProductChange={setProduct}
        lifecycle={lifecycle}
        onLifecycleChange={setLifecycle}
        onClear={clearFilters}
      />

      {/* Result Count */}
      <div className="mb-4 text-sm text-on-surface-variant">
        Showing <span className="font-bold text-on-surface">{partners.length}</span> of{' '}
        <span className="font-bold text-on-surface">{allPartners.length}</span> partners
      </div>

      {/* Partner List */}
      {partners.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3 block">business</span>
          <h3 className="text-lg font-bold text-on-surface mb-1">No partners found</h3>
          <p className="text-sm text-on-surface-variant">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => (
            <PartnerRow key={partner.id} partner={partner} />
          ))}
        </div>
      )}

      {/* Pagination (decorative for mock data) */}
      {partners.length > 0 && (
        <footer className="mt-12 flex items-center justify-between">
          <div className="text-sm text-slate-500 font-medium">
            Showing <span className="text-on-surface font-bold">1-{partners.length}</span> of{' '}
            <span className="text-on-surface font-bold">{partners.length}</span> partners
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-surface-container-low text-slate-400 hover:bg-secondary-container hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">first_page</span>
            </button>
            <button className="p-2 rounded-lg bg-surface-container-low text-slate-400 hover:bg-secondary-container hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="flex items-center px-4 gap-4">
              <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary text-xs font-bold shadow-md">1</span>
            </div>
            <button className="p-2 rounded-lg bg-surface-container-low text-slate-400 hover:bg-secondary-container hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button className="p-2 rounded-lg bg-surface-container-low text-slate-400 hover:bg-secondary-container hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">last_page</span>
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
```

Key changes from previous version:
- Removed custom tab pills and `LifecycleState` import
- Added `FilterBar` with `product` + `lifecycle` chip dropdowns
- Search bar: `py-5` → `py-3.5`, `mb-8` → `mb-6`
- Added result count: "Showing X of Y partners"
- Uses a second `usePartners()` call (no filters) for total count

- [ ] **Step 2: Build and verify**

Run: `cd C:/Claude/Tixora/frontend && npm run build`
Expected: No errors.

- [ ] **Step 3: Manual smoke test**

1. Open `http://localhost:5173/partners`
2. Verify: FilterBar with Product + Lifecycle chip dropdowns (no tabs)
3. Verify: search bar is slightly smaller than before
4. Verify: result count shows "Showing 6 of 6 partners"
5. Verify: Lifecycle → "Live" shows 2 partners, result count updates
6. Verify: Product → "Rabet" shows 3 partners (Gulf Trading, Mashreq, Al Masah)
7. Verify: each partner row has a colored initial circle
8. Verify: product chips show "Rabet", "Rhoon" etc. (not RBT, RHN)
9. Verify: Clear All resets both filters
10. Verify: Team Queue (`/team-queue`) and My Tickets (`/my-tickets`) unchanged

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Partners/index.tsx
git commit -m "feat(S-06): replace tabs with FilterBar, add result count, shrink search"
```
