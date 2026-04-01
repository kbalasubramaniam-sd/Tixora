# Tixora — Dashboard

## Design System
Apply all rules from `00-shared-layout.md`. This page renders inside the app shell (sidebar + top bar).

## Overview
The dashboard is **role-adaptive** — it shows different content based on the logged-in user's role. All roles see the same page structure but with different data emphasis.

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  Page Header                                            │
│  "Good morning, [First Name]"  — display-sm (1.75rem)  │
│  Role badge chip below name                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Stat     │ │ Stat     │ │ Stat     │ │ Stat     │   │
│  │ Card 1   │ │ Card 2   │ │ Card 3   │ │ Card 4   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│  ┌──────────────────────────┐ ┌────────────────────┐    │
│  │                          │ │                    │    │
│  │  Action Required         │ │  Recent Activity   │    │
│  │  (tickets needing        │ │  (timeline feed)   │    │
│  │   user's action)         │ │                    │    │
│  │                          │ │                    │    │
│  │                          │ │                    │    │
│  └──────────────────────────┘ └────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Stat Cards Row (4 cards, equal width, horizontal)

Each card:
- Background: `surface-container-lowest` (`#f8fdfc`) on `surface-container-low` page background
- Corner radius: `0.5rem`
- Padding: `spacing-5` (1.25rem)
- No borders (tonal layering provides separation)
- Layout: large number top (`display-md`, 2.25rem, `#171d1c`), label below (`label-md`, 0.75rem, `#3d4949`)

### Stat cards by role:

**Requester:**
1. My Open Requests (count)
2. Pending My Action (count) — amber highlight if > 0
3. Completed This Month (count)
4. Average Resolution Time (hours)

**Reviewer / Approver:**
1. In My Queue (count)
2. Near SLA Breach (count) — amber if > 0, red if breached
3. Processed Today (count)
4. SLA Compliance Rate (percentage)

**Integration Team / Provisioning Agent:**
1. Assigned to Me (count)
2. SLA At Risk (count) — amber/red
3. Completed This Week (count)
4. Avg Completion Time (hours)

**System Administrator:**
1. Total Open Tickets (count)
2. SLA Breaches Today (count) — red if > 0
3. Tickets Created Today (count)
4. System-wide SLA Compliance (percentage)

## Action Required Section (left, 60% width)

- Heading: "Action Required" in `headline-md` (1.5rem), `#171d1c`
- Subtext: "Tickets waiting for your response" in `label-md`, `#3d4949`
- Below: a list of ticket cards, max 5 shown, "View All" link at bottom

### Each ticket card in the list:
- Background: `surface-container-lowest`
- Layout: single row, vertically centered
- Left: Ticket ID (`label-sm`, 0.6875rem, monospace feel, `#3d4949`) + Partner Name (`body-md`, 0.875rem, `#171d1c`)
- Center: Product chip (using `secondary-container` `#c1eaea` with `#456b6b` text) + Task type label
- Right: SLA indicator
  - Green dot + "12h remaining" — on track
  - Amber dot + "3h remaining" — approaching (75%+)
  - Red dot + "BREACHED" — past SLA
- Entire row is clickable → navigates to ticket detail
- Gap between rows: `spacing-4` (1rem), no dividers (use white space)

**For Requester:** shows tickets in "Pending Requester Action" status (clarification requests)
**For Reviewer/Approver:** shows tickets in their queue awaiting action
**For Integration/Provisioning:** shows tickets assigned to them
**For Admin:** shows SLA-breached tickets across all queues

## Recent Activity Section (right, 40% width)

- Heading: "Recent Activity" in `headline-md`
- A vertical timeline feed showing the user's recent actions and events
- Each entry:
  - Small teal dot on timeline line (left edge)
  - Action text: "You approved SPM-RBT-T01-..." in `body-sm` (0.8125rem)
  - Timestamp: "2 hours ago" in `label-sm`, `#3d4949`
- Max 10 entries, scrollable if overflow
- Timeline line: 2px, `outline-variant` (`#bcc9c8`) at 20% opacity

## Quick Action (Requester only)

- A floating action button or prominent "New Request" card at the top of the Action Required section
- Gradient background (primary CTA), white text "Create New Request", plus icon
- Clicking navigates to the ticket creation flow
