# S-03 Ticket Detail — Design Spec

## Overview

Single-page detail view for any ticket. Shows full ticket state: header chips, workflow progress, submitted form data (read-only), actions panel, SLA, partner info, and tabbed comments/documents/audit trail. All data is mock for MVP 1.

## Route

`/tickets/:id` — lazy-loaded, protected. Linked from TicketRow (Dashboard, future: My Tickets, Team Queue).

## Stitch Reference

- HTML: `frontend/.stitch-ref/ticket-detail.html`
- Prompt spec: `Docs/stitch-prompts/04-ticket-detail.md`

## Data Model

### New Types (`types/ticket.ts`)

```typescript
interface TicketDetail extends TicketSummary {
  companyCode: string
  formData: Record<string, unknown>
  documents: TicketDocument[]
  workflowStages: WorkflowStage[]
  comments: Comment[]
  auditTrail: AuditEntry[]
  fulfilmentRecord?: Record<string, string>
  clarification?: ClarificationExchange
  assignedTo?: string
  createdBy: string
  accessPath?: 'portal' | 'api' | 'both'
}

interface WorkflowStage {
  name: string
  icon: string
  status: 'completed' | 'current' | 'future'
  assignedTo?: string
  completedAt?: string
}

interface Comment {
  id: string
  author: string
  role: string
  body: string
  attachment?: { name: string; size: string }
  createdAt: string
}

interface AuditEntry {
  id: string
  type: 'stage_transition' | 'approval' | 'rejection' | 'return' | 'document' | 'comment' | 'notification' | 'sla'
  description: string
  timestamp: string
}

interface TicketDocument {
  id: string
  name: string
  size: string
  uploadedBy: string
  uploadedAt: string
}

interface ClarificationExchange {
  requestedBy: string
  requestedAt: string
  note: string
  response?: string
  respondedAt?: string
}
```

### Mock Data (`api/endpoints/tickets.ts`)

One mock TicketDetail per task type (T-01 through T-04), each with:
- 3-4 workflow stages matching the task type
- `formData` populated with realistic values matching the form schema fields
- 2-3 comments, 3-5 audit entries, 1-2 documents
- T-01 example: `SPM-RBT-T01-20260401-0001` (matches dashboard mock)

Hook: `useTicketDetail(id)` — parses task type from ticket ID to return the right mock.

## Component Structure

```
pages/TicketDetail/
  index.tsx              — Page shell, data fetching, two-column layout
  TicketHeader.tsx       — Ticket ID + chips (product, task, status, SLA, access path)
  WorkflowStepper.tsx    — Horizontal stage circles + connecting lines (from Stitch HTML)
  TicketDetailsCard.tsx  — Renders formData via FormSchema lookup (Approach A)
  ActionsPanel.tsx       — Role-dependent action buttons + action modals
  SlaPanel.tsx           — Progress bar + time remaining
  PartnerPanel.tsx       — Partner name, lifecycle chip, open ticket count
  CommentsTab.tsx        — Comment list + add comment form
  DocumentsTab.tsx       — Document grid
  AuditTrailTab.tsx      — Chronological event log
```

## Key Design Decisions

### Ticket Details Card (Approach A)
- Looks up `FormSchema` by `ticket.taskType` using same `mockFormSchemas` from `products.ts`
- Groups fields by `section`, uses `sectionMeta` for headings
- Renders each field as read-only label-value pair
- Select fields resolve value to label from options
- Toggle fields show "Yes" / "No"
- Documents from form shown as file chips

### WorkflowStepper
- Custom component (not reusing wizard Stepper.tsx — different visual)
- From Stitch: circles with icons, connecting lines, labels below
- Completed = primary gradient + teal line, Current = gradient + pulse ring, Future = gray

### Actions Panel (role-based)
- Reviewer/Approver: Approve & Advance, Return for Clarification, Reject
- Each action opens Modal with mandatory comment textarea
- Actions are mock-only (no API calls)
- Reassign button disabled with tooltip "Coming soon"

### Tabs
- Local state toggle, not a reusable component
- Comments (default), Documents, Audit Trail
- Underline-style active indicator

### Layout
- Full width header + stepper
- Below: 65% main (details card + tabs) / 35% sticky right panel (actions + SLA + partner)
- Matches Stitch HTML layout exactly

## What's Excluded (MVP 1)
- Real API calls (all mock)
- File download/upload
- Export CSV/PDF (hidden)
- Reassign (disabled)
- Real-time updates
- Fulfilment record card (appears only after provisioning — will add when backend supports)
- Clarification exchange card (will add when backend supports return-for-clarification flow)
