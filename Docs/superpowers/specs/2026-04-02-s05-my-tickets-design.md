# S-05 My Tickets — Design Spec

## Overview

Personal ticket view for the logged-in user. Shows all tickets where the current user is the requester, including completed and cancelled tickets. Reuses Team Queue components (QueueTable, FilterBar) with minor extensions.

## Route

`/my-tickets`

## Page Layout

### Header
- Title: "My Tickets"
- Subtitle: "Track your submitted requests and monitor their progress"
- No "Create Ticket" button (available elsewhere in sidebar/dashboard)

### Filters
Reuse `FilterBar` from TeamQueue with an additional Status filter:

| Filter | Options |
|--------|---------|
| Product | All, Rabet, Rhoon, Wtheeq, Mulem |
| Task | All, T-01 Agreement, T-02 UAT Access, T-03 Partner Account, T-04 Access Support |
| SLA Status | All, On Track, At Risk, Breached |
| **Status** | **All, Open, In Progress, Completed, Cancelled** |

### Table
Reuse `QueueTable` from TeamQueue — same 8 columns (Ticket ID, Product, Task, Partner, Requester, Stage, SLA, Time), same sorting, same row click navigation to `/tickets/:id`.

### No Urgency Bento Grid
The urgency section is a team triage tool — not needed for personal ticket tracking.

## Data

### Mock Endpoint
`GET /api/my-tickets?product=&task=&slaStatus=&status=`

Returns `TicketSummary[]` filtered to `requesterId === currentUser.id`.

Mock data should include ~6-8 tickets with a mix of statuses (open, in progress, completed, cancelled) to exercise the status filter.

### API Contract (for future backend implementation)

```
GET /api/tickets/mine
Query params:
  - product: string (product code, e.g. "RBT")
  - taskType: string (e.g. "T01")
  - slaStatus: string (e.g. "OnTrack")
  - status: string (e.g. "Open", "InProgress", "Completed", "Cancelled")
  - page: int (default 1)
  - pageSize: int (default 20)

Response: {
  items: TicketSummary[],
  totalCount: number,
  page: number,
  pageSize: number
}
```

The backend filters by `Ticket.RequesterId == currentUser.Id` using the JWT claim.

## Components

### New Files
- `frontend/src/pages/MyTickets/index.tsx` — page shell
- `frontend/src/api/endpoints/myTickets.ts` — mock endpoint
- `frontend/src/api/hooks/useMyTickets.ts` — React Query hook

### Reused (imported directly)
- `pages/TeamQueue/QueueTable` — table with sorting
- `pages/TeamQueue/FilterBar` — extended with optional status filter

### FilterBar Extension
Add optional `status` prop + `onStatusChange` callback. When not provided, the status chip is hidden (preserving Team Queue behavior).

## Differences from Team Queue

| Aspect | Team Queue | My Tickets |
|--------|-----------|------------|
| Scope | All team tickets | Current user's tickets only |
| Urgency grid | Yes (breached + at risk) | No |
| Status filter | No (active only) | Yes (all statuses) |
| Create button | Yes (header) | No |
| Header text | "Team Queue" | "My Tickets" |
| Data includes completed | No | Yes |
