# Tixora — Notifications Page

## Design System
Apply all rules from `00-shared-layout.md`. Renders inside the app shell.

## Overview
Full notification inbox. All milestone notifications the user has received.

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  "Notifications" — headline-lg                          │
│  [Mark All Read] (tertiary button, right-aligned)       │
│                                                         │
│  [Filter tabs: All | Unread]                            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🔵 Ticket SPM-RBT-T01-... advanced to           │    │
│  │    Product Review                                │    │
│  │    2 hours ago                                   │    │
│  ├─────────────────────────────────────────────────┤    │
│  │    SLA Warning: SPM-RHN-T03-... at 75%          │    │
│  │    Take action to avoid breach                   │    │
│  │    4 hours ago                                   │    │
│  ├─────────────────────────────────────────────────┤    │
│  │    Ticket SPM-WTQ-T05-... completed             │    │
│  │    Access issue resolved                         │    │
│  │    Yesterday                                     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Pagination]                                           │
└─────────────────────────────────────────────────────────┘
```

## Specifications

### Filter Tabs
- **All** | **Unread** — underline tab style, same as My Tickets page
- Unread count shown as badge next to "Unread" tab

### Notification List
- Each notification is a card row, full width
- **Unread:** `surface-container-lowest` background + small teal dot indicator on left edge
- **Read:** `surface` background (slightly more muted)
- Layout per notification:
  - **Left:** Teal dot (unread) or empty space (read)
  - **Icon:** Contextual icon based on notification type:
    - ↗ Stage advanced
    - ✓ Completed
    - ↩ Clarification requested
    - ⏰ SLA warning (amber icon)
    - 🔴 SLA breach (red icon)
    - ✗ Rejected
    - 🔄 Reassigned
  - **Content:**
    - Title: `body-md` (0.875rem), `#171d1c` — e.g., "Ticket SPM-RBT-T01-... advanced to Product Review"
    - Subtitle: `body-sm`, `#3d4949` — contextual detail
    - Ticket ID is a clickable link to ticket detail
  - **Right:** Relative timestamp, `label-sm`, `#3d4949` — "2 hours ago", "Yesterday"
- Click notification → marks as read + navigates to the linked ticket
- Row spacing: `spacing-3` (0.75rem), no dividers

### Mark All Read
- Tertiary button, top right
- Marks all unread notifications as read
- Confirmation not needed — instant action

### Empty State
- "All caught up" centered message
- Subtext: "You have no notifications" in `body-md`, `#3d4949`

## Data Source
- GET `/api/notifications?filter={all|unread}&page={n}`
- PUT `/api/notifications/{id}/read`
- GET `/api/notifications/unread-count`
