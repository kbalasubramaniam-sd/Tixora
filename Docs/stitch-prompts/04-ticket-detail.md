# Tixora — Ticket Detail View

## Design System
Apply all rules from `00-shared-layout.md`. Renders inside the app shell.

## Overview
The single most important page in Tixora. Shows everything about a ticket: status, workflow progress, SLA, actions, comments, documents, fulfilment record, and audit trail.

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  Ticket Header                                          │
│  SPM-RBT-T01-20260401-0001                             │
│  [Rabet] [T-01 Agreement] [In Review] [SLA: 12h left] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Workflow Progress (stage visualization)           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────┐ ┌────────────────────┐    │
│  │                          │ │                    │    │
│  │  Ticket Details          │ │  Right Panel       │    │
│  │  (main content)          │ │  - Actions         │    │
│  │                          │ │  - SLA Details     │    │
│  │                          │ │  - Partner Info    │    │
│  │                          │ │  - Quick Facts     │    │
│  │                          │ │                    │    │
│  └──────────────────────────┘ └────────────────────┘    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Tabs: Comments | Documents | Audit Trail          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Ticket Header

- **Ticket ID:** `display-sm` (1.75rem), `#171d1c`, Manrope Bold
- **Chips row** below ID, horizontal:
  - Product chip: `secondary-container` (`#c1eaea`, `#456b6b` text) — e.g., "Rabet · RBT"
  - Task chip: same style — e.g., "T-01 · Agreement Validation"
  - Status chip: color-coded
    - Submitted: `#c1eaea` background
    - In Review: teal tint
    - Pending Requester Action: amber tint (`#fff3e0`, `#e65100` text)
    - Completed: green tint (`#e8f5e9`, `#2e7d32` text)
    - Rejected: red tint (`#ffebee`, `#c62828` text)
    - Cancelled: gray tint
    - SLA Breached: red tint, bold
  - SLA chip: dynamic color
    - On track (< 75%): green tint + "12h 30m remaining"
    - At risk (75-90%): amber tint + "3h 15m remaining"
    - Critical (90-100%): red tint + "45m remaining"
    - Breached: red tint + "BREACHED · 2h 10m over"
  - Access path chip (T-03 only): "Portal Only" / "Portal + API" / "API Only"
- **Cancel button** (if status = Submitted and user is the requester): Tertiary red text, "Cancel Request"

---

## Workflow Progress Bar

A horizontal stage visualization showing the ticket's journey:

```
  ● Legal Review  ──────  ○ Product Review  ──────  ○ EA Sign-off  ──────  ○ Complete
    (Current)               (Next)                    (Pending)              (Final)
    Assigned to:
    reviewer@tixora
```

- **Completed stages:** Teal filled circle + teal solid connecting line
- **Current stage:** Teal filled circle with pulse animation + teal line before, gray after
- **Future stages:** `#bcc9c8` outline circle + gray connecting line
- **Stage labels:** `label-md` (0.75rem) below each circle
- Current stage shows: "Assigned to: [name]" in `label-sm`, `#3d4949`
- **T-02 special:** Shows Phase 1 and Phase 2 as separate stages in the progress bar
- **T-03 Portal + API:** Shows parallel branches visually (fork and merge)

---

## Main Content (left, 65% width)

### Ticket Details Card
- `surface-container-lowest` background, `0.5rem` radius
- All submitted form data displayed as label-value pairs
- **Label:** `label-md`, `#3d4949`
- **Value:** `body-md`, `#171d1c`
- Organized in the same sections as the submission form
- Read-only — no editing

### Fulfilment Record (shown after provisioning actions)
- Separate card below ticket details
- Heading: "Fulfilment Record" in `title-md`
- Shows structured data recorded by the provisioning/integration team
- E.g., "Partner Account ID: PA-00412", "Portal URL: https://...", "API Key Reference: KEY-..."

### Clarification Exchange (if ticket was returned)
- Yellow-tinted card (`#fff8e1` background)
- Shows: "Clarification requested by [name] on [date]:"
- The clarification note in `body-md`
- Below: the requester's response (if provided)
- If pending: a text area for the requester to respond with a "Submit Response" primary button

---

## Right Panel (35% width, sticky on scroll)

### Actions Card
Role-dependent action buttons in a `surface-container-lowest` card:

**Reviewer / Approver (current stage owner):**
- **Approve & Advance:** Primary gradient button, full width
- **Reject:** Secondary button, red text variant
- **Return for Clarification:** Secondary button, amber text variant
- Each action opens a glassmorphism modal with:
  - Action title
  - Mandatory comment/reason textarea
  - Confirm / Cancel buttons

**Integration Team (T-02):**
- **Close Phase 1 — Access Provisioned:** Primary button (when in Phase 1)
- **Close Phase 2 — UAT Signed Off:** Primary button (when in Phase 2)
- Opens modal requiring fulfilment details

**Provisioning Agent:**
- **Mark Complete:** Primary button
- Opens modal requiring fulfilment details

**Requester (when Pending Requester Action):**
- **Respond to Clarification:** Primary button
- **Signal UAT Complete (T-02):** Primary button with file attachment

**Any user:**
- **Reassign:** Tertiary button, opens modal with team member dropdown + reason

### SLA Details Card
- Current stage SLA: visual progress bar (teal → amber → red as time elapses)
- Time remaining: `title-md` size number
- Started: date/time
- Business hours elapsed: X of Y hours
- **T-02:** Shows Phase 1 SLA and Phase 2 SLA separately

### Partner Info Card
- Partner name (linked to partner profile)
- Lifecycle state on this product: chip showing AGREED / UAT_ACTIVE / ONBOARDED / LIVE
- Number of other open tickets for this partner

### Quick Facts Card
- Created by: [name] on [date]
- Last updated: [date]
- Stage history count: "Passed through 2 of 3 stages"

---

## Bottom Tabs Section

Three tabs, underline-style tab indicator (teal, 2px, animated slide):

### Tab 1: Comments
- Chronological list of all comments
- Each comment:
  - Author avatar (initials circle) + name + role chip + timestamp
  - Comment body in `body-md`
  - Optional attachment shown as a file chip
  - Spacing: `spacing-4` between comments
- **Add Comment:** text area at bottom with "Post Comment" primary button + optional file attachment button

### Tab 2: Documents
- Grid of uploaded documents
- Each document: file icon + filename + file size + uploaded by + date
- Download button (tertiary) on each
- Upload button if ticket is still open

### Tab 3: Audit Trail
- Immutable chronological log of every event
- Each entry: timestamp (left, `label-sm`, `#3d4949`) + icon + event description (`body-sm`)
- Event types differentiated by subtle icon:
  - ↗ Stage transition
  - ✓ Approval
  - ✗ Rejection
  - ↩ Return for clarification
  - 📎 Document uploaded
  - 💬 Comment added
  - 🔔 Notification sent
  - ⏰ SLA event
- **Export buttons** at top: "Export CSV" | "Export PDF" — tertiary style

### Data Source
- GET `/api/tickets/{id}` — full ticket detail
- GET `/api/tickets/{id}/comments`
- GET `/api/tickets/{id}/audit`
- PUT `/api/tickets/{id}/advance`, `/reject`, `/return`, `/respond`, `/cancel`, etc.
