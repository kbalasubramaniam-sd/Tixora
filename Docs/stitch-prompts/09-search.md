# Tixora — Search & Advanced Search

## Design System
Apply all rules from `00-shared-layout.md`. Renders inside the app shell.

## Overview
Two search modes: the global search bar (in the top bar, always visible) for quick lookups, and a dedicated Advanced Search page for multi-filter queries.

---

## Global Search (Top Bar)

Already defined in `00-shared-layout.md`. When the user types in the global search bar:

### Dropdown Results Panel
- Appears below the search bar, 480px wide, max 500px tall
- Glassmorphism background (semi-transparent + `backdrop-blur: 16px`)
- Ambient shadow
- Results grouped by type with section headers:

```
┌─────────────────────────────────────────┐
│  🔍 "abc insur"                         │
│                                         │
│  TICKETS (3 results)                    │
│  SPM-RBT-T01-20260401-0001 — In Review │
│  SPM-RBT-T03-20260328-0012 — Completed │
│  SPM-WTQ-T01-20260401-0003 — Submitted │
│                                         │
│  PARTNERS (1 result)                    │
│  ABC Insurance Company — LIVE on RBT   │
│                                         │
│  [ View all results → ]                 │
└─────────────────────────────────────────┘
```

- Section headers: `label-sm` (0.6875rem), `#3d4949`, uppercase
- Each result: `body-sm`, clickable → navigates to ticket detail or partner profile
- Max 3 results per section in dropdown
- "View all results →" link at bottom → navigates to Advanced Search page with the query pre-filled
- Searches on 300ms debounce, results under 1 second
- Respects RBAC — only shows results user has access to

---

## Advanced Search Page

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  "Search" — headline-lg                                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Filter Panel                                     │    │
│  │                                                  │    │
│  │ Product: [All ▾]    Task: [All ▾]               │    │
│  │ Status: [All ▾]     SLA: [All ▾]                │    │
│  │ Lifecycle: [All ▾]  Assigned: [All ▾]           │    │
│  │ Partner: [________] Requester: [________]       │    │
│  │ Access Path: [All ▾]                             │    │
│  │ Date Range: [From] → [To]                       │    │
│  │                                                  │    │
│  │ [Clear All]  [Save Filter]      [Search]        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Saved Filters: [My breached] [Rabet open] [+]   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Results: 47 tickets found        [Export CSV]          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Results table (same columns as Team Queue)       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Pagination]                                           │
└─────────────────────────────────────────────────────────┘
```

### Filter Panel
- `surface-container-lowest` card, `0.5rem` radius
- Filters arranged in a 2-column grid:
  - **Product:** dropdown (All / Rabet / Rhoon / Wtheeq / Mulem)
  - **Task Type:** dropdown (All / T-01 through T-04)
  - **Status:** dropdown (All / Submitted / In Review / Pending Requester Action / Completed / Rejected / Cancelled)
  - **SLA Status:** dropdown (All / On Track / At Risk / Breached)
  - **Lifecycle State:** dropdown (All / AGREED / UAT_ACTIVE / ONBOARDED / LIVE)
  - **Assigned Team:** dropdown (All / specific team names)
  - **Partner Name:** text input with autocomplete
  - **Requester:** text input with autocomplete
  - **Access Path (T-03):** dropdown (All / Portal Only / Portal + API / API Only)
  - **Date Range:** two date pickers (From / To), for submission date or completion date toggle
- All filters combinable (AND logic)
- Dropdown styling: `surface-container-lowest` fill, no visible border, `0.5rem` radius

### Action Buttons
- **Clear All:** Tertiary, resets all filters
- **Save Filter:** Secondary, opens glassmorphism modal to name and save the current filter combination
- **Search:** Primary gradient CTA

### Saved Filters Bar
- Horizontal row of chip buttons below filter panel
- Each saved filter: `secondary-container` chip, clickable to apply
- Small (x) button on each to delete
- "[+]" chip to save current filter set

### Results
- Result count: "47 tickets found" in `body-md`, `#3d4949`
- **Export CSV** button: tertiary, right-aligned
- Results table: identical columns and styling to Team Queue (05-team-queue.md)
- Paginated, 20 per page

## Data Source
- GET `/api/search?q={query}` — global search
- POST `/api/search/advanced` — advanced search with filter body
- GET `/api/search/saved` — saved filters
- POST `/api/search/saved` — save filter
- DELETE `/api/search/saved/{id}` — delete saved filter
