# Tixora — My Tickets (Requester View)

## Design System
Apply all rules from `00-shared-layout.md`. Renders inside the app shell.

## Overview
Shows all tickets raised by the current user. Highlights tickets needing the requester's action.

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  "My Tickets" — headline-lg                             │
│  [ + New Request ] (primary gradient button)            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ⚠ ACTION REQUIRED (pinned section)              │    │
│  │ ┌───────────────────────────────────────────┐   │    │
│  │ │ SPM-RBT-T01... │ Pending Your Response    │   │    │
│  │ └───────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Filter tabs: All | Open | Completed | Rejected | Cancelled] │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Ticket list / table                              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Pagination]                                           │
└─────────────────────────────────────────────────────────┘
```

## Action Required Section
- Only visible when tickets are in "Pending Requester Action" status
- Amber-tinted background (`#fff3e0` at 30%)
- Header: "Action Required" with amber dot, `label-md`
- Each ticket card shows:
  - Ticket ID (link)
  - Clarification note preview (first 100 chars)
  - "Respond Now" button — primary CTA, navigates to ticket detail with clarification section focused
- Also shows T-02 tickets where requester can signal UAT completion

## Filter Tabs
- Horizontal tab bar, underline style
- Tabs: **All** | **Open** | **Completed** | **Rejected** | **Cancelled**
- Active tab: teal underline (2px) + teal text
- Inactive: `#3d4949` text
- Count badge next to each tab label: `label-sm`, `secondary-container` chip style

## Ticket List

### Columns
| Column | Content |
|--------|---------|
| Ticket ID | Clickable link to detail |
| Product | Product chip |
| Task | Task code + name |
| Partner | Partner name |
| Status | Color-coded status chip (same as ticket detail) |
| Phase (T-02) | "Ph 1" / "Ph 2" or blank |
| Current Stage | Where the ticket is now |
| Created | Date submitted |
| Last Updated | Most recent activity date |

### Styling
- Same table styling as Team Queue (alternating rows, no borders, hover highlight)
- Sortable by: date created, last updated, status, product
- 20 per page with pagination

## Data Source
- GET `/api/dashboard/my-tickets` with status filter, sorting, pagination
