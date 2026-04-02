# S-07 Notifications — Design Spec

## Overview

In-app notification list page. Displays mock notifications using Tixora's NotificationType enum. Real notification system deferred to backend E3 — this screen is UI-ready with mock data.

## Route

`/notifications`

## Page Layout

### Header
- Breadcrumb: "Dashboard > Notifications" (text-xs text-secondary)
- Title: "Notifications" (text-4xl font-extrabold tracking-tight)
- Right side: "Mark All Read" button + All/Unread toggle pill

### All/Unread Toggle
- Pill container: `bg-surface-container-low rounded-xl p-1`
- Active: `bg-primary text-on-primary rounded-lg shadow-sm px-5 py-1.5 text-sm font-bold`
- Inactive: `text-secondary hover:text-on-surface px-5 py-1.5 text-sm font-bold`

### Stats Strip (3 cards)
Grid: `grid-cols-1 md:grid-cols-3 gap-6 mb-8`

| Card | Label | Value | Icon | Icon BG |
|------|-------|-------|------|---------|
| Critical SLA | CRITICAL SLA | 12 (text-error) | warning (filled) | bg-error-container text-error |
| Open Tasks | OPEN TASKS | 28 (text-primary) | assignment (filled) | bg-primary-container/20 text-primary |
| Avg Response | AVG RESPONSE | 14m (text-on-surface) | timer (filled) | bg-surface-container-highest text-secondary |

Card: `bg-surface-container-low p-6 rounded-2xl flex items-center justify-between`
Label: `text-xs font-bold text-secondary uppercase tracking-widest mb-1`
Value: `text-3xl font-black`
Icon container: `h-12 w-12 rounded-xl flex items-center justify-center`

### Notification Cards

Each card: `p-5 rounded-2xl flex gap-5 items-start`

**Unread state:** `bg-surface-container-lowest shadow-[0_10px_40px_rgba(23,29,28,0.03)] border-l-4 border-{color}`
- Unread dot: `h-2 w-2 bg-primary rounded-full` next to timestamp

**Read state:** `bg-surface-container-low/50 opacity-80` — no border, no shadow, no dot

**Card structure:**
- Icon circle: `h-10 w-10 rounded-full flex items-center justify-center` with type-specific bg/color
- Title: `font-bold text-on-surface leading-tight`
- Description: `text-sm text-on-surface-variant leading-relaxed mb-3`
- Timestamp: `text-[11px] font-bold text-secondary uppercase`
- Action buttons: `text-xs font-bold uppercase tracking-wider` (primary or type-colored)

### Notification Type Styling

| Category | Types | Border | Icon BG | Icon Color | Icon |
|----------|-------|--------|---------|------------|------|
| Critical | SlaBreach | border-error | bg-error-container | text-error | priority_high |
| Warning | SlaWarning75, SlaWarning90 | border-tertiary | bg-tertiary-container/10 | text-tertiary | hourglass_empty |
| Info | StageAdvanced, RequestSubmitted | border-primary | bg-primary-container/10 | text-primary | stat_3 / assignment |
| Action | ClarificationRequested | border-primary | bg-primary-container/10 | text-primary | chat_bubble |
| Neutral | TicketReassigned, UatPhase1Complete | border-outline-variant | bg-surface-container-low | text-on-surface-variant | person_add / vpn_key |
| Success | RequestCompleted | (read state) | bg-surface-container-highest | text-secondary | check_circle |

### Action Buttons per Type

| Type | Primary Action | Secondary Action |
|------|---------------|-----------------|
| SlaBreach | Investigate Now | Acknowledge |
| SlaWarning75/90 | Prioritize | — |
| StageAdvanced | View Changes | — |
| ClarificationRequested | Respond | — |
| RequestSubmitted | View Ticket | — |
| TicketReassigned | View Ticket | — |
| RequestCompleted | View Ticket | — |
| UatPhase1Complete | View Ticket | — |

### Load More
- "Load previous notifications" button centered at bottom
- `text-sm font-bold text-secondary px-8 py-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high`

## Data

### Frontend NotificationType Enum (mirrors backend)

```ts
export const NotificationType = {
  RequestSubmitted: 'RequestSubmitted',
  StageAdvanced: 'StageAdvanced',
  ClarificationRequested: 'ClarificationRequested',
  ClarificationResponded: 'ClarificationResponded',
  UatPhase1Complete: 'UatPhase1Complete',
  UatTestingSignalled: 'UatTestingSignalled',
  UatPhase2Complete: 'UatPhase2Complete',
  UatCompletionReminder: 'UatCompletionReminder',
  PortalAccountProvisioned: 'PortalAccountProvisioned',
  ApiCredentialsIssued: 'ApiCredentialsIssued',
  AccessIssueResolved: 'AccessIssueResolved',
  RequestRejected: 'RequestRejected',
  RequestCancelled: 'RequestCancelled',
  TicketReassigned: 'TicketReassigned',
  DelegateApprovalTriggered: 'DelegateApprovalTriggered',
  SlaWarning75: 'SlaWarning75',
  SlaWarning90: 'SlaWarning90',
  SlaBreach: 'SlaBreach',
  RequestCompleted: 'RequestCompleted',
} as const
```

### Notification Interface

```ts
interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  description: string
  ticketId?: string
  timestamp: string
  read: boolean
}
```

### Mock Data (~8 notifications)

Mix of types: SlaBreach, SlaWarning75, StageAdvanced, RequestSubmitted, ClarificationRequested, TicketReassigned, RequestCompleted, UatPhase1Complete. Some read, most unread.

### Mock Endpoint

`GET /api/notifications`

Returns `NotificationItem[]`. All data is mock. No query params needed for MVP.

### API Contract (for future backend E3)

```
GET /api/notifications
Query params:
  - unreadOnly: boolean (default false)
  - page: int (default 1)
  - pageSize: int (default 20)

POST /api/notifications/{id}/read
POST /api/notifications/read-all

Response (GET): {
  items: NotificationItem[],
  totalCount: number,
  unreadCount: number
}
```

## Components

### New Files
- `frontend/src/pages/Notifications/index.tsx` — page shell (header, toggle, stats, list)
- `frontend/src/pages/Notifications/NotificationCard.tsx` — single notification card
- `frontend/src/pages/Notifications/NotificationStats.tsx` — 3 stat cards
- `frontend/src/api/endpoints/notifications.ts` — mock data + types
- `frontend/src/api/hooks/useNotifications.ts` — React Query hook

### Modified Files
- `frontend/src/types/enums.ts` — add NotificationType enum
- `frontend/src/App.tsx` — add lazy import + `/notifications` route

### Stitch Reference
- HTML: `frontend/.stitch-ref/notifications.html`
- Screenshot: `frontend/.stitch-ref/notifications.png`

## What's Deferred
- Real notification backend (E3)
- Mark as read persistence (needs API)
- Real-time updates / WebSocket push
- Notification preferences / settings
- Email notifications (MVP 2)
