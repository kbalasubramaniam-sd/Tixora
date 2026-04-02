# Session Handoff — 2026-04-02 (Updated)

## E1 + E2 Backend — COMPLETE

All backend endpoints are live and tested. **64 tests passing** (26 unit + 38 integration).

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
- Frontend enums synced: `Draft`, `Approved`, `SlaBreached` removed; T-02 statuses added

### Workflow Changes
- **T-01:** Removed "Stakeholder Notification" stage 4. Flow is now: Legal Review → Product Review → EA Sign-off → Completed (3 stages, not 4)
- Dashboard stats include Tailwind classes — render directly, no mapping needed
- Team queue filters: pass `product=RBT`, `task=T01`, `partner=Al Ain`, `requester=Sarah` as query params

### FE Wiring Notes for E2
- `POST /api/tickets` body now accepts optional `rejectedTicketRef` (Guid) — pass when re-raising a rejected ticket
- `GET /api/tickets/{id}` response now includes:
  - `rejectedTicketRef` — string (display TicketId like "SPM-RBT-T01-...") or null
  - `allowedActions` — string[] of actions the current user can perform (e.g., ["approve", "reject", "return"])
- Frontend can use `allowedActions` to show/hide action buttons on the ticket detail page

### Known FE-BE Gaps (TODO)
- **T-02/T-03 dynamic user forms:** The product spec allows adding multiple users in T-02 (UAT Access) and T-03 (Production Account) forms. Example: requester can add 3 UAT users in one request, each with name/email/mobile/designation. The backend stores this as JSON in FormData so it supports any shape. But the frontend form schema is static — it only has fields for a single user. Need to add a "repeatable section" / "add another user" pattern to the form renderer for T-02 UAT User Details and T-03 Portal Admin User sections.
- **SLA Panel:** Shows hardcoded "100% SLA Integrity" — should be hidden or show "Not Tracked" until E3 SLA engine is implemented.

---

## E3: Operational Intelligence

| # | Chunk | BE Status | FE Wirable | Endpoints |
|---|-------|-----------|------------|-----------|
| E3.1 | Comments | DONE | YES | POST/GET /api/tickets/{id}/comments |
| E3.2 | Documents | IN PROGRESS | NO | POST/GET /api/tickets/{id}/documents, GET /api/documents/{id} |
| E3.3 | Audit Trail | — | YES (already in E2) | GET /api/tickets/{id} → auditTrail[] |
| E3.4 | SLA Engine | — | NO | SLA fields in ticket responses |
| E3.5 | Notifications | — | NO | GET/PUT /api/notifications |

### E3.1 Comments (BE DONE — FE: NOT WIRED)

**Endpoints:**
- `POST /api/tickets/{ticketId}/comments` — Add comment. Body: `{ "content": "string" }`. Returns 201.
- `GET /api/tickets/{ticketId}/comments` — List comments for ticket, ordered by createdAt asc.

**Response shape (CommentResponse):**
```json
{
  "id": "guid-string",
  "authorName": "Sarah Ahmad",
  "authorRole": "PartnershipTeam",
  "content": "This is a comment.",
  "createdAt": "2026-04-03T10:00:00Z"
}
```

**Wiring notes:**
- Auth required (Bearer token)
- Content max 2000 chars, cannot be empty
- Comments are append-only (no edit/delete in MVP 1)
- Wire into S-03 Ticket Detail Comments tab

## Next Steps
- **E3.2: Documents** — in progress
- **E3.3-E3.5** — pending
