# S-06 Partner Search — Design Spec

## Overview

Partner search/list page. Browse and filter seeded partners by lifecycle state and product. Profile page deferred to later — row click is a no-op for MVP.

## Route

`/partners`

## Page Layout

### Header
- Title: "Partners" (text-4xl font-bold tracking-tight)
- Subtitle: "Manage and explore Tixora's global partner network." (text-lg text-on-surface-variant)

### Search (Searchable Dropdown)
- Searchable combobox/autocomplete input replacing the free-text search bar
- Placeholder: "Search by partner name or account reference"
- Icon: search (teal-600) left-aligned
- As user types, a dropdown shows matching partners (name + ref ID, case-insensitive substring)
- Selecting a partner filters the list to that single partner
- Clearing the input resets to show all partners
- Uses the same styling as FilterBar chips for consistency (rounded-full, surface-container-low bg)
- All filtering happens **client-side** — the full partner list is loaded once and filtered in-browser

### Filter Bar (chip dropdowns)
Reuses `FilterBar` component from TeamQueue with two filter chips:

| Filter | Options |
|--------|---------|
| Lifecycle | All, Live, UAT Active, UAT Complete, Onboarded |
| Product | All, Rabet, Rhoon, Wtheeq, Mulem |

FilterBar is extended with optional `lifecycle`/`onLifecycleChange` and reuses existing `product`/`onProductChange` props. Clear All button resets both.

### Result Count
Displayed above the partner list: "Showing X of Y partners" (text-sm text-on-surface-variant). Updates dynamically as search/filters change. `X` = filtered count, `Y` = total unfiltered count.

### Partner Rows
Each row is a card showing:
- **Colored initial circle** — w-10 h-10 rounded-full with partner initials (2 chars), bg-primary/10 text-primary font-bold. Provides visual anchor like Team Queue's requester avatars.
- **Partner name** (text-lg font-bold)
- **Ref ID chip** (text-[10px] font-bold text-slate-400 bg-surface-container py-1 px-2 rounded tracking-widest)
- **Product chips** — show **full product names** (Rabet, Rhoon, Wtheeq, Mulem) instead of codes. Uses PRODUCT_LABELS from `utils/labels.ts`. Styled: bg-primary/10 text-primary px-2.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider
- **Lifecycle status badge** (right-aligned, with "Status" label above)
- **Chevron** (text-slate-300, group-hover:text-primary)

Row container: `bg-surface-container-lowest p-6 rounded-xl hover:shadow-[0_10px_40px_rgba(23,29,28,0.06)] transition-all duration-300 cursor-pointer`

Row click: no-op (profile deferred). Cursor stays pointer for visual consistency.

### Status Badge Colors

| Lifecycle State | Badge Classes | Label |
|----------------|---------------|-------|
| Live | `bg-teal-100 text-teal-800` | LIVE |
| UatCompleted | `bg-teal-50 text-teal-700` | UAT_COMPLETE |
| UatActive | `bg-amber-100 text-amber-800` | UAT_ACTIVE |
| Onboarded | `bg-secondary-container text-on-secondary-container` | ONBOARDED |
| None | `bg-surface-container text-on-surface-variant` | NONE |

All badges: `px-4 py-1.5 rounded-full text-[11px] font-bold`

### Pagination Footer
- Left: "Showing 1-N of N partners" (text-sm text-slate-500)
- Right: first/prev/page numbers/next/last buttons
- Active page: `bg-primary text-on-primary shadow-md`
- Inactive page: `bg-surface-container-low text-slate-600 hover:bg-secondary-container`
- Nav buttons: `bg-surface-container-low text-slate-400 hover:bg-secondary-container`

For MVP mock data (~6 partners), pagination is static/decorative. Real pagination when API exists.

## Data

### Mock Partner Type

```ts
interface PartnerSummary {
  id: string
  name: string
  refId: string
  products: ProductCode[]
  lifecycleState: LifecycleState
}
```

### Mock Data (~6 partners)

| Name | Ref | Products | State |
|------|-----|----------|-------|
| Gulf Trading LLC | REF-10001 | RBT, RHN | Live |
| Emirates Logistics Corp | REF-10002 | RHN, WTQ | UatActive |
| Digital Solutions FZE | REF-10003 | WTQ, MLM | Onboarded |
| National Bank of Fujairah | REF-10004 | MLM | UatCompleted |
| Mashreq Global | REF-10005 | RBT, RHN, WTQ | Live |
| Al Masah Capital | REF-10006 | RBT | UatActive |

### Filtering Strategy

**All filtering is client-side.** The API returns the full partner list (max ~500 partners in production) in a single request. The frontend filters in-browser by search text, lifecycle state, and product. This avoids round-trips for every filter change and keeps the UX instant.

No server-side pagination needed — 500 partners is well within browser memory and render performance.

### Mock Endpoint

`GET /api/partners`

Returns `PartnerSummary[]` — the complete list. All filtering (search, lifecycle, product) happens client-side in the mock endpoint's catch block, but this is only to simulate the filtering UX during development. In production, the API returns all partners and the frontend filters.

### API Contract (for future backend)

```
GET /api/partners
Query params: none (returns all partners)

Response: PartnerSummary[]
```

**Why no query params:** Max ~500 partners in production. Client-side filtering is faster (no round-trips) and simpler. The full list is cached by React Query with a long staleTime.

If partner count grows beyond ~1000 in a future phase, add server-side filtering:
```
GET /api/partners?search=&lifecycleState=&product=&page=&pageSize=
Response: { items: PartnerSummary[], totalCount: number, page: number, pageSize: number }
```

The backend would then filter by:
- `search`: case-insensitive LIKE on Partner.Name and PartnerProduct.CompanyCode
- `lifecycleState`: exact match on PartnerProduct.LifecycleState (partners with at least one product in that state)
- `product`: exact match on PartnerProduct.ProductCode
- Pagination via OFFSET/FETCH with totalCount from COUNT query

## Components

### New Shared Component
- `frontend/src/components/ui/SearchableDropdown.tsx` — reusable searchable combobox/autocomplete. Props:
  - `options: { label: string; value: string; sublabel?: string }[]` — all options
  - `value: string` — currently selected value (empty string = nothing selected)
  - `onChange: (value: string) => void` — called when user selects or clears
  - `placeholder?: string` — input placeholder
  - `icon?: string` — Material Symbol icon name (default: "search")
  - `className?: string` — optional container class override
  
  Behavior: type to filter options, click to select, show sublabel as secondary text (e.g. ref ID), clear button when selected. Keyboard: arrow keys to navigate, Enter to select, Escape to close.

### Modified Files
- `frontend/src/pages/Partners/index.tsx` — replace free-text search with SearchableDropdown

### Existing Files (no changes)
- `frontend/src/pages/TeamQueue/FilterBar.tsx` — already refactored
- `frontend/src/pages/Partners/PartnerRow.tsx` — already enhanced
- `frontend/src/api/endpoints/partners.ts` — already has product filter
- `frontend/src/api/hooks/usePartners.ts` — already supports filter object
- `frontend/src/App.tsx` — route already wired

### Reused
- `FilterBar` from TeamQueue — with lifecycle + product chip dropdowns
- `PRODUCT_LABELS` from `utils/labels.ts` — for full product names
- `getInitials` from `utils/format.ts` — for partner initial circle

## Stitch Reference
- HTML: `frontend/.stitch-ref/partner-search.html`
- Screenshot: `frontend/.stitch-ref/partner-search.png`

## What's Deferred
- Partner Profile page (S-06 Phase 2)
- Stats strip / partner counts by lifecycle (needs API aggregate query)
- Edit Profile functionality (MVP 2)
- Create Ticket shortcut from partner (future)
- Agreement Summary panel (future)
- Real pagination (needs API)
