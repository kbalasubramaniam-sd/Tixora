# Session Handoff — 2026-04-02 (Updated)

## E1 + E2 Backend — COMPLETE

All backend endpoints are live and tested. **61 tests passing** (26 unit + 35 integration).

### E2 Changes (NEW)
- **Re-raise after rejection:** `CreateTicketRequest` now accepts optional `RejectedTicketRef` (Guid). Creates a new ticket linked to the rejected one. Validation: referenced ticket must exist, be Rejected, and match product/task type.
- **TicketDetailResponse** now includes `RejectedTicketRef` (string — the display TicketId of the rejected ticket, or null) and `AllowedActions` (string[] — computed per user/role: "approve", "reject", "return", "respond", "cancel", "reassign")
- **Full lifecycle proven:** T-01 → T-02 → T-03 → T-04 walks a partner from None → Onboarded → UatActive → UatCompleted → Live
- **T-02 mid-workflow:** Stage 2 completion advances lifecycle to UatActive (verified in tests)

### Available API Endpoints

#### Auth
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET /api/auth/me` — [Authorize] → current user profile

#### Reference Data
- `GET /api/products` — all products (no auth)
- `GET /api/partners` — [Authorize] all partners with products

#### Tickets (Write)
- `POST /api/tickets` — create ticket (PartnershipTeam/SystemAdmin only)
- `POST /api/tickets/{id}/approve` — approve current stage
- `POST /api/tickets/{id}/reject` — reject (terminal)
- `POST /api/tickets/{id}/return` — return for clarification
- `POST /api/tickets/{id}/respond` — respond to clarification
- `POST /api/tickets/{id}/cancel` — cancel (Submitted only)
- `POST /api/tickets/{id}/reassign` — reassign to user with same role

#### Tickets (Read) — NEW
- `GET /api/tickets/my` — [Authorize] tickets created by current user → `TicketSummaryResponse[]`
- `GET /api/tickets/{id}` — [Authorize] full ticket detail → `TicketDetailResponse` (includes workflowStages, auditTrail, clarification)

#### Dashboard — NEW
- `GET /api/dashboard/stats` — [Authorize] 4 role-specific stat cards → `DashboardStatsResponse`
- `GET /api/dashboard/action-required` — [Authorize] tickets needing user's action → `TicketSummaryResponse[]`
- `GET /api/dashboard/activity` — [Authorize] recent activity timeline → `ActivityEntryResponse[]`
- `GET /api/dashboard/team-queue?product=&task=&partner=&requester=` — [Authorize] team queue with filters → `TicketSummaryResponse[]`

### Response Shapes (for frontend wiring)

**TicketSummaryResponse:**
```json
{
  "id": "guid-string",
  "ticketId": "SPM-RBT-T01-20260402-001",
  "productCode": "RBT",
  "taskType": "T01",
  "partnerName": "Al Ain Insurance",
  "requesterName": "Sarah Ahmad",
  "status": "Submitted",
  "currentStage": "Legal Review",
  "slaStatus": "OnTrack",
  "slaHoursRemaining": 0,
  "createdAt": "2026-04-02T...",
  "updatedAt": "2026-04-02T..."
}
```

**DashboardStatsResponse:**
```json
{
  "stat1": { "label": "My Open Requests", "value": 7, "icon": "inbox", "iconBg": "bg-primary-container/10", "iconColor": "text-primary", "badge": "Active", "badgeStyle": "...", "valueColor": null },
  "stat2": { ... },
  "stat3": { ... },
  "stat4": { ... }
}
```

**TicketDetailResponse:** extends TicketSummary with:
- `companyCode`, `formData` (parsed JSON object), `documents` (empty []), `workflowStages[]`, `comments` (empty []), `auditTrail[]`, `clarification?`, `assignedTo?`, `createdBy`, `accessPath?`, `lifecycleState`

**WorkflowStageResponse:** `{ name, icon, status: "completed"|"current"|"future", assignedTo?, completedAt? }`

**ActivityEntryResponse:** `{ id, title, description, timestamp (relative string), icon, iconBg, iconColor }`

### Notes for Frontend
- `slaStatus` always returns `"OnTrack"` and `slaHoursRemaining` always `0` (SLA is E3)
- `documents` and `comments` return empty arrays (E3)
- Status enum values from backend: `Submitted`, `InReview`, `PendingRequesterAction`, `InProvisioning`, `Phase1Complete`, `AwaitingUatSignal`, `Phase2InReview`, `Completed`, `Rejected`, `Cancelled`
- Frontend has `Draft`, `Approved`, `SlaBreached` which backend doesn't return — handle gracefully
- Dashboard stats include Tailwind classes — render directly, no mapping needed
- Team queue filters: pass `product=RBT`, `task=T01`, `partner=Al Ain`, `requester=Sarah` as query params

### FE Wiring Notes for E2
- `POST /api/tickets` body now accepts optional `rejectedTicketRef` (Guid) — pass when re-raising a rejected ticket
- `GET /api/tickets/{id}` response now includes:
  - `rejectedTicketRef` — string (display TicketId like "SPM-RBT-T01-...") or null
  - `allowedActions` — string[] of actions the current user can perform (e.g., ["approve", "reject", "return"])
- Frontend can use `allowedActions` to show/hide action buttons on the ticket detail page

## Next Steps
- **E3: Operational Intelligence** — SLA tracking, notifications, comments, documents, audit trail
