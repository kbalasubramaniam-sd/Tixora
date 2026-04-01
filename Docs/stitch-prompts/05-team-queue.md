# Tixora — Team Queue View

## Design System
Apply all rules from `00-shared-layout.md`. Renders inside the app shell.

## Overview
The work queue for Reviewers, Approvers, Integration Team, and Provisioning Agents. Shows all tickets assigned to the user's team, sorted by urgency.

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  "Team Queue" — headline-lg                             │
│  [Filter Bar]                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🔴 BREACHED (pinned section)                    │    │
│  │ ┌───────────────────────────────────────────┐   │    │
│  │ │ SPM-RBT-T01... │ Rabet │ T-01 │ BREACHED │   │    │
│  │ └───────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🟡 AT RISK (pinned section)                     │    │
│  │ ┌───────────────────────────────────────────┐   │    │
│  │ │ SPM-RHN-T03... │ Rhoon │ T-03 │ 2h left  │   │    │
│  │ └───────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ALL TICKETS                                      │    │
│  │ ┌───────────────────────────────────────────┐   │    │
│  │ │ Sortable table rows...                    │   │    │
│  │ └───────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Pagination: ← 1 2 3 4 →]                             │
└─────────────────────────────────────────────────────────┘
```

## Filter Bar

- Horizontal bar, `surface-container-lowest` background, `0.5rem` radius, padding `spacing-3`
- Inline filters (dropdown chips):
  - **Product:** All / Rabet / Rhoon / Wtheeq / Mulem
  - **Task:** All / T-01 / T-02 / T-03 / T-05
  - **Stage:** All / [dynamic based on task]
  - **SLA Status:** All / On Track / At Risk / Breached
  - **Access Path (T-03):** All / Portal Only / Portal + API / API Only
- Each filter: chip-style dropdown, `secondary-container` when active, `surface-container-low` when default
- **Clear All** tertiary link on far right
- Filters apply immediately (no "Apply" button needed)

## Pinned Sections

### Breached Tickets (red section)
- Only shows if breached tickets exist
- Section header: "SLA Breached" in `label-md`, `#c62828`, with red dot indicator
- Section background: very subtle red tint (`#ffebee` at 30% opacity)
- Tickets pinned to top, cannot be sorted away

### At Risk Tickets (amber section)
- Only shows if at-risk tickets exist (75%+ SLA elapsed)
- Section header: "Approaching SLA" in `label-md`, `#e65100`, with amber dot
- Section background: very subtle amber tint (`#fff3e0` at 30% opacity)

## Ticket Table

### Columns
| Column | Width | Content |
|--------|-------|---------|
| Ticket ID | 200px | `SPM-RBT-T01-...` — clickable link to ticket detail, `label-md`, monospace weight |
| Product | 100px | Product chip (`secondary-container` style) |
| Task | 120px | Task code + short name |
| Partner | 160px | Partner name, `body-md` |
| Requester | 120px | Requester name |
| Stage | 140px | Current stage name |
| Phase (T-02) | 80px | "Ph 1" / "Ph 2" — only shown for T-02 tickets, blank for others |
| SLA Status | 140px | Color-coded: green "On Track 18h", amber "At Risk 2h", red "BREACHED" |
| Time Remaining | 100px | Countdown in hours:minutes |

### Table Styling
- No visible borders between rows or columns — use alternating row backgrounds:
  - Odd rows: `surface-container-lowest` (`#f8fdfc`)
  - Even rows: `surface` (`#f5fafa`)
- Header row: `surface-container-highest` (`#dee3e3`), `label-md` (0.75rem), `#3d4949`, Manrope SemiBold
- Row height: 52px
- Hover: row background shifts to subtle teal tint
- Click anywhere on row → navigates to ticket detail
- **Sortable columns:** Ticket ID, Partner, SLA Status, Time Remaining — click header to sort, subtle arrow indicator

### Pagination
- Bottom center, simple style: ← Previous | 1 2 3 ... | Next →
- 20 tickets per page
- Page numbers: `label-md`, current page highlighted with teal background circle

### Empty State
- If queue is empty: centered message "Your queue is clear" with a subtle illustration placeholder
- Subtext: "No tickets currently assigned to your team" in `body-md`, `#3d4949`

## Data Source
- GET `/api/dashboard/team-queue` with query params for filters, sorting, pagination
