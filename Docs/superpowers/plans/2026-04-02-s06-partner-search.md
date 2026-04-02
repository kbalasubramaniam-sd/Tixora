# S-06 Partner Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a partner search/list page at `/partners` with search bar, lifecycle tab filters, partner rows with product chips and status badges, and decorative pagination.

**Architecture:** New page reusing existing design tokens and layout patterns. Mock endpoint with 6 seeded partners. Client-side search and filter. Stitch HTML at `frontend/.stitch-ref/partner-search.html` is the pixel-reference for all styling.

**Tech Stack:** React, React Router, React Query, Tailwind CSS

---

### Task 1: Create mock endpoint and React Query hook

**Files:**
- Create: `frontend/src/api/endpoints/partners.ts`
- Create: `frontend/src/api/hooks/usePartners.ts`

- [ ] **Step 1: Create mock endpoint**

Create `frontend/src/api/endpoints/partners.ts`:

```tsx
import { apiClient } from '@/api/client'
import { ProductCode, LifecycleState } from '@/types/enums'

export interface PartnerSummary {
  id: string
  name: string
  refId: string
  products: ProductCode[]
  lifecycleState: LifecycleState
}

const mockPartners: PartnerSummary[] = [
  {
    id: 'p-1',
    name: 'Gulf Trading LLC',
    refId: 'REF-10001',
    products: [ProductCode.RBT, ProductCode.RHN],
    lifecycleState: LifecycleState.Live,
  },
  {
    id: 'p-2',
    name: 'Emirates Logistics Corp',
    refId: 'REF-10002',
    products: [ProductCode.RHN, ProductCode.WTQ],
    lifecycleState: LifecycleState.UatActive,
  },
  {
    id: 'p-3',
    name: 'Digital Solutions FZE',
    refId: 'REF-10003',
    products: [ProductCode.WTQ, ProductCode.MLM],
    lifecycleState: LifecycleState.Onboarded,
  },
  {
    id: 'p-4',
    name: 'National Bank of Fujairah',
    refId: 'REF-10004',
    products: [ProductCode.MLM],
    lifecycleState: LifecycleState.Agreed,
  },
  {
    id: 'p-5',
    name: 'Mashreq Global',
    refId: 'REF-10005',
    products: [ProductCode.RBT, ProductCode.RHN, ProductCode.WTQ],
    lifecycleState: LifecycleState.Live,
  },
  {
    id: 'p-6',
    name: 'Al Masah Capital',
    refId: 'REF-10006',
    products: [ProductCode.RBT],
    lifecycleState: LifecycleState.UatActive,
  },
]

export interface PartnerFilters {
  search?: string
  lifecycleState?: string
}

export async function fetchPartners(filters?: PartnerFilters): Promise<PartnerSummary[]> {
  try {
    const res = await apiClient.get<PartnerSummary[]>('/partners', { params: filters })
    return res.data
  } catch {
    let results = [...mockPartners]

    if (filters?.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(
        (p) => p.name.toLowerCase().includes(q) || p.refId.toLowerCase().includes(q),
      )
    }
    if (filters?.lifecycleState && filters.lifecycleState !== 'All') {
      results = results.filter((p) => p.lifecycleState === filters.lifecycleState)
    }

    return results
  }
}
```

- [ ] **Step 2: Create React Query hook**

Create `frontend/src/api/hooks/usePartners.ts`:

```tsx
import { useQuery } from '@tanstack/react-query'
import { fetchPartners, type PartnerFilters } from '@/api/endpoints/partners'

export function usePartners(filters?: PartnerFilters) {
  return useQuery({
    queryKey: ['partners', filters?.search, filters?.lifecycleState],
    queryFn: () => fetchPartners(filters),
  })
}
```

- [ ] **Step 3: Verify build**

Run: `cd C:/Claude/Tixora/frontend && npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/endpoints/partners.ts frontend/src/api/hooks/usePartners.ts
git commit -m "feat(S-06): add mock partners endpoint and usePartners hook"
```

---

### Task 2: Create PartnerRow component

**Files:**
- Create: `frontend/src/pages/Partners/PartnerRow.tsx`

The Stitch HTML reference is at `frontend/.stitch-ref/partner-search.html`. The implementer MUST read this file and copy Tailwind classes exactly.

- [ ] **Step 1: Create PartnerRow component**

Create `frontend/src/pages/Partners/PartnerRow.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Partners/PartnerRow.tsx
git commit -m "feat(S-06): add PartnerRow component with lifecycle status badges"
```

---

### Task 3: Create Partners page

**Files:**
- Create: `frontend/src/pages/Partners/index.tsx`

The implementer MUST read the Stitch HTML at `frontend/.stitch-ref/partner-search.html` and match classes exactly for the search bar, tab filters, and pagination.

- [ ] **Step 1: Create the Partners page**

Create `frontend/src/pages/Partners/index.tsx`:

```tsx
import { useState } from 'react'
import { usePartners } from '@/api/hooks/usePartners'
import { LifecycleState } from '@/types/enums'
import { PartnerRow } from './PartnerRow'

const tabs = [
  { label: 'All Partners', value: 'All' },
  { label: 'Live Only', value: LifecycleState.Live },
  { label: 'Onboarding', value: LifecycleState.Onboarded },
  { label: 'Pending UAT', value: LifecycleState.UatActive },
]

export default function Partners() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')

  const filters = {
    search: search || undefined,
    lifecycleState: activeTab !== 'All' ? activeTab : undefined,
  }

  const { data: partners = [], isLoading } = usePartners(
    Object.values(filters).some(Boolean) ? filters : undefined,
  )

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
      <section className="mb-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-primary transition-transform group-focus-within:scale-110">search</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-full py-5 pl-16 pr-8 text-on-surface text-lg font-medium focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest shadow-sm transition-all duration-300 placeholder-slate-400"
            placeholder="Search by partner name or account reference"
          />
        </div>
      </section>

      {/* Tab Filters */}
      <div className="flex gap-4 mb-10 overflow-x-auto pb-2 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-[11px] uppercase tracking-widest transition-colors ${
              activeTab === tab.value
                ? 'bg-surface-container-highest text-on-surface shadow-sm'
                : 'bg-surface-container-low text-slate-500 hover:bg-secondary-container'
            }`}
          >
            {tab.label}
          </button>
        ))}
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

- [ ] **Step 2: Verify build**

Run: `cd C:/Claude/Tixora/frontend && npm run build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Partners/index.tsx
git commit -m "feat(S-06): add Partners search page with tabs, search bar, and pagination"
```

---

### Task 4: Add route in App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add lazy import and route**

In `frontend/src/App.tsx`, add after the MyTickets lazy import:

```tsx
const Partners = lazy(() => import('@/pages/Partners'))
```

Add route after the `my-tickets` route:

```tsx
<Route path="partners" element={<Suspense fallback={<div className="flex items-center justify-center h-full"><span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span></div>}><Partners /></Suspense>} />
```

- [ ] **Step 2: Build and verify**

Run: `cd C:/Claude/Tixora/frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Manual smoke test**

1. Open `http://localhost:5173/partners`
2. Verify: page header shows "Partners"
3. Verify: search bar filters by name (type "Gulf")
4. Verify: search bar filters by ref (type "REF-10004")
5. Verify: tab "Live Only" shows 2 partners
6. Verify: tab "Pending UAT" shows 2 partners
7. Verify: tab "Onboarding" shows 1 partner
8. Verify: empty state shows when search has no matches
9. Verify: sidebar "Partners" link is highlighted/active

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(S-06): wire /partners route in App.tsx"
```

---

### Task 5: Add teal/amber color tokens if missing

**Files:**
- Modify: `frontend/src/index.css` (only if needed)

The Stitch design uses `bg-teal-100 text-teal-800` and `bg-amber-100 text-amber-800` for status badges. These are standard Tailwind colors but may need to be available in our theme.

- [ ] **Step 1: Check if teal/amber classes work**

After Tasks 1-4 are complete, check if the status badges render correctly in the browser. If `bg-teal-100` and `bg-amber-100` produce the expected colors, this task is a no-op.

If the colors are missing or wrong, add them to the `@theme` block in `frontend/src/index.css`:

```css
--color-teal-100: #ccfbf1;
--color-teal-800: #115e59;
--color-amber-100: #fef3c7;
--color-amber-800: #92400e;
```

- [ ] **Step 2: Build and verify**

Run: `cd C:/Claude/Tixora/frontend && npm run build`
Expected: No errors.

- [ ] **Step 3: Commit (only if changes were made)**

```bash
git add frontend/src/index.css
git commit -m "fix(S-06): add teal/amber color tokens for partner lifecycle badges"
```
