# Tixora — Partner Lookup & Profile

## Design System
Apply all rules from `00-shared-layout.md`. Renders inside the app shell.

## Overview
Two views: a partner search/list page, and a partner profile page showing lifecycle state and ticket history across all products.

---

## Partner Search Page

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  "Partners" — headline-lg                               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🔍 Search partners by name or alias  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Partner Card  │ Products: [RBT] [RHN]  │ LIVE   │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ Partner Card  │ Products: [WTQ]        │ AGREED │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ Partner Card  │ Products: [MLM] [RBT]  │ UAT    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Pagination]                                           │
└─────────────────────────────────────────────────────────┘
```

### Search Bar
- Full width, prominent, `surface-container-lowest` fill
- Corner radius: `2rem` (pill shape)
- Search icon on left, clear button on right when text entered
- Placeholder: "Search by partner name or alias"
- Searches on keystroke with 300ms debounce

### Partner List
- Each partner is a card row (`surface-container-lowest`, `0.5rem` radius):
  - **Left:** Partner name (`title-md`, `#171d1c`) + partner alias below (`label-sm`, `#3d4949`)
  - **Center:** Product chips for each product the partner is registered on (e.g., `[RBT]` `[RHN]`)
  - **Right:** Highest lifecycle state across products as a chip:
    - AGREED: gray chip
    - UAT_ACTIVE: amber chip
    - ONBOARDED: teal chip
    - LIVE: green chip
- Click card → navigates to partner profile
- Row spacing: `spacing-4`

### Data Source
- GET `/api/partners?search={query}&page={n}`

---

## Partner Profile Page

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Partners                                     │
│                                                         │
│  "ABC Insurance Company" — display-sm                   │
│  Partner Ref: PTR-00412                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Lifecycle Status per Product                     │    │
│  │                                                  │    │
│  │ Rabet (RBT)    ● LIVE         Since: 12 Mar 26  │    │
│  │ Rhoon (RHN)    ● ONBOARDED   Since: 28 Mar 26  │    │
│  │ Wtheeq (WTQ)   ● AGREED      Since: 01 Apr 26  │    │
│  │ Mulem (MLM)    — Not registered                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Agreement Summary                                │    │
│  │                                                  │    │
│  │ Rabet: ✓ Active (effective 10 Jan 2026)         │    │
│  │ Rhoon: ✓ Active (effective 15 Feb 2026)         │    │
│  │ Wtheeq: ✓ Active (effective 01 Apr 2026)        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Ticket History Timeline                          │    │
│  │                                                  │    │
│  │  ● 01 Apr — SPM-WTQ-T01-... Completed          │    │
│  │  │                                               │    │
│  │  ● 28 Mar — SPM-RHN-T03-... Completed          │    │
│  │  │                                               │    │
│  │  ● 25 Mar — SPM-RHN-T02-... Completed          │    │
│  │  │                                               │    │
│  │  ● 15 Feb — SPM-RHN-T01-... Completed          │    │
│  │  │                                               │    │
│  │  ● 12 Mar — SPM-RBT-T04-... Completed          │    │
│  │  ...                                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Partner Header
- Back link: tertiary, "← Back to Partners"
- Partner name: `display-sm` (1.75rem), `#171d1c`
- Reference: `label-md`, `#3d4949`

### Lifecycle Status Card
- One row per product
- Product name + code: `body-md`, `#171d1c`
- Lifecycle state chip (color-coded as in partner list)
- "Since" date: `label-sm`, `#3d4949`
- Products the partner is NOT registered on: shown as "— Not registered" in `#3d4949` at 50% opacity
- Read-only — no actions from this view

### Agreement Summary Card
- Lists each product with an active agreement
- Checkmark (teal) + "Active" + effective date
- "Auto-renewed" label in `label-sm`, `#3d4949`

### Ticket History Timeline
- Vertical timeline (teal line on left, 2px, `#23a2a3` at 40%)
- Each entry: teal dot + date + ticket ID (clickable link) + task name + status chip
- Filter row at top: Product filter (All / specific) + Status filter (All / Open / Completed / Rejected)
- Chronological, newest first
- Paginated: "Load More" button at bottom

### Data Source
- GET `/api/partners/{id}`
- GET `/api/partners/{id}/tickets?product={code}&status={status}&page={n}`
