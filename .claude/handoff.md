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
| E3.2 | Documents | DONE | YES | POST/GET /api/tickets/{id}/documents, GET /api/documents/{id} |
| E3.3 | Audit Trail | — | YES (already in E2) | GET /api/tickets/{id} → auditTrail[] |
| E3.4 | SLA Engine | DONE | YES | SLA fields in ticket responses |
| E3.5 | Notifications | DONE | YES | GET/PUT /api/notifications |

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

### E3.2 Documents (BE DONE — FE: NOT WIRED)

**Endpoints:**
- `POST /api/tickets/{ticketId}/documents` — Upload file (multipart/form-data, field name: `file`). Returns 201.
- `GET /api/tickets/{ticketId}/documents` — List documents for ticket, ordered by uploadedAt desc.
- `GET /api/documents/{id}` — Download file (streams binary content with correct Content-Type).

**Response shape (DocumentResponse):**
```json
{
  "id": "guid-string",
  "fileName": "agreement.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 204800,
  "uploadedBy": "Sarah Ahmad",
  "uploadedAt": "2026-04-03T10:00:00Z"
}
```

**Wiring notes:**
- Auth required (Bearer token)
- Max file size: 10MB. Allowed types: PDF, JPEG, PNG, Word, Excel, text
- Files stored to disk (MVP 1), path in DB
- Wire upload into S-02 New Request (FileUpload component) and S-03 Ticket Detail Documents tab
- Download: `GET /api/documents/{id}` returns the file directly (use as href or fetch blob)

### E3.4 SLA Engine (BE DONE — FE: NOT WIRED)

**What changed:**
- `TicketSummaryResponse.SlaStatus` now returns real values: `"OnTrack"`, `"AtRisk"`, `"Critical"`, `"Breached"` (was always "OnTrack")
- `TicketSummaryResponse.SlaHoursRemaining` now returns real remaining hours (was always 0)
- `TicketDetailResponse` — same fields, now live data
- Business hours: Sun-Thu, 08:00-17:00 GST. SLA pauses during clarification.

**FE wiring notes:**
- No new endpoints — SLA data flows through existing ticket responses
- S-03 Ticket Detail: SLA progress bar can now show real % (elapsed / target)
- S-04 Team Queue: SLA Status column now has real values — can color-code AtRisk/Critical/Breached
- S-01 Dashboard: stats endpoint now reflects real SLA data
- Remove hardcoded "100% SLA Integrity" — use real slaStatus from response
- SlaStatus `"OnTrack"` with `slaHoursRemaining = 0` means stage has no SLA tracking (e.g., UAT wait gate)

### E3.5 Notifications (BE DONE — FE: NOT WIRED)

**Endpoints:**
- `GET /api/notifications?unreadOnly=false` — List notifications for current user (max 50, newest first)
- `GET /api/notifications/unread-count` — Returns `{ "count": 5 }`
- `PUT /api/notifications/{id}/read` — Mark single notification as read → 204
- `PUT /api/notifications/read-all` — Mark all as read → 204

**Response shape (NotificationResponse):**
```json
{
  "id": "guid-string",
  "type": "RequestSubmitted",
  "title": "New request assigned to you",
  "message": "Ticket SPM-RBT-T01-20260403-001 has been submitted and assigned to you for Legal Review.",
  "ticketId": "guid-string",
  "ticketDisplayId": "SPM-RBT-T01-20260403-001",
  "isRead": false,
  "readAt": null,
  "createdAt": "2026-04-03T10:00:00Z"
}
```

**Notification types emitted by workflow actions:**
| Action | Type | Recipients |
|--------|------|-----------|
| Create ticket | RequestSubmitted | Assigned stage owner |
| Advance stage | StageAdvanced | Next stage owner |
| Complete ticket | RequestCompleted | Requester |
| Reject | RequestRejected | Requester |
| Return for clarification | ClarificationRequested | Requester |
| Respond to clarification | ClarificationResponded | Stage owner |
| Cancel | RequestCancelled | Assigned stage owner |
| Reassign | TicketReassigned | New assignee |

**Wiring notes:**
- Auth required (Bearer token)
- Wire into S-07 Notifications page (replace mock data)
- Wire unread-count into TopBar notification bell badge
- `ticketId` (guid) can be used to link/navigate to ticket detail
- `ticketDisplayId` is the human-readable ticket ID (e.g., SPM-RBT-T01-...)
- `type` string maps to frontend NotificationType enum for card styling

---

## E3 COMPLETE — 87 tests passing (36 infrastructure + 51 API)

All E3 chunks merged to `frontend/foundation`. Summary:
- **Comments:** POST/GET per ticket
- **Documents:** Upload/download with file validation
- **Audit Trail:** Already complete from E2
- **SLA Engine:** Real business hours tracking, pause/resume, background monitoring
- **Notifications:** In-app with all 8 workflow action types wired

---

## E4: Surface & Admin

| # | Chunk | BE Status | FE Wirable | Endpoints |
|---|-------|-----------|------------|-----------|
| E4.1 | Dashboard Enhancement | DONE | YES | Enhanced GET /api/dashboard/* (SLA stats, urgency sort) |
| E4.2 | Search | DONE | YES | GET /api/search?q=, POST /api/search/advanced |
| E4.3 | Reports | DONE | YES | GET /api/reports/overview, GET /api/reports/export |
| E4.4 | Admin Config | DONE | YES | 10 endpoints under /api/admin/* |
| E4.5 | Pagination | DONE | YES | PagedResult<T> on my-tickets, team-queue, notifications |

### E4.1 Dashboard Enhancement (BE DONE)

**What changed (no new endpoints):**
- `GET /api/dashboard/stats` — 4 stats now show: Open Tickets, SLA Breaches, SLA Compliance %, Avg Resolution (hours)
- `GET /api/dashboard/team-queue` — Now sorted by SLA urgency (Breached > Critical > AtRisk > OnTrack). Added `status` filter param.
- `GET /api/dashboard/action-required` — Now sorted by SLA urgency, limited to 5 results.

### E4.2 Search (BE DONE — FE: NOT WIRED)

**Endpoints:**
- `GET /api/search?q={query}` — Global search (min 2 chars). Searches ticket IDs + partner names/aliases. Returns max 20.
- `POST /api/search/advanced` — Filtered search with pagination.

**Global search response (SearchResultResponse):**
```json
{
  "type": "Ticket",
  "id": "guid",
  "displayId": "SPM-RBT-T01-20260403-001",
  "title": "Al Ain Insurance — T01",
  "subtitle": "InReview | Legal Review"
}
```

**Advanced search request:**
```json
{
  "productCode": "RBT",
  "taskType": "T01",
  "status": "InReview",
  "slaStatus": "AtRisk",
  "assignedTo": "guid",
  "partnerId": "guid",
  "dateFrom": "2026-04-01",
  "dateTo": "2026-04-30",
  "page": 1,
  "pageSize": 20
}
```
Returns `PagedResult<TicketSummaryResponse>`.

### E4.3 Reports (BE DONE — FE: NOT WIRED)

**Endpoints:**
- `GET /api/reports/overview?dateFrom=&dateTo=` — Aggregated metrics
- `GET /api/reports/export?dateFrom=&dateTo=&productCode=&taskType=&status=` — CSV download

**Overview response:**
```json
{
  "totalTickets": 50,
  "openTickets": 30,
  "completedTickets": 15,
  "rejectedTickets": 3,
  "cancelledTickets": 2,
  "slaCompliancePercent": 85.0,
  "slaBreachCount": 4,
  "avgResolutionHours": 12.5,
  "byProduct": [{"productCode": "RBT", "count": 20}],
  "byTaskType": [{"taskType": "T01", "count": 15}],
  "byStatus": [{"status": "InReview", "count": 10}]
}
```

**Wiring notes:**
- Wire overview into S-09 Reports (when built)
- CSV export returns `text/csv` with `Content-Disposition: attachment`

### E4.4 Admin Config (BE DONE — FE: NOT WIRED)

All endpoints require **SystemAdministrator** role. Returns 403 for other roles.

**SLA Config:**
- `GET /api/admin/sla-config` — All workflow stages with SLA hours
- `PUT /api/admin/sla-config` — Update SLA hours per stage. Body: `{ "stages": [{ "stageId": "guid", "slaBusinessHours": 24 }] }`

**Business Hours:**
- `GET /api/admin/business-hours` — 7 days with start/end times
- `PUT /api/admin/business-hours` — Update. Body: `{ "days": [{ "id": "guid", "isWorkingDay": true, "startTime": "08:00", "endTime": "17:00" }] }`

**Holidays:**
- `GET /api/admin/holidays` — List all
- `POST /api/admin/holidays` — Body: `{ "date": "2026-12-25", "name": "Christmas" }`
- `DELETE /api/admin/holidays/{id}` — Remove

**Delegates:**
- `GET /api/admin/delegates` — List active delegates
- `POST /api/admin/delegates` — Body: `{ "primaryUserId": "guid", "delegateUserId": "guid", "validFrom": null, "validTo": null }`
- `DELETE /api/admin/delegates/{id}` — Soft deactivate

**Workflow Config:**
- `GET /api/admin/workflow-config` — Read-only: all active workflows with stages, roles, SLA hours

**Wiring notes:**
- Wire into S-11 Workflows, S-12 SLA Settings, S-13 Business Hours admin screens
- All admin endpoints return proper 403 for non-admin users

### E4.5 Pagination (BE DONE)

**Changed endpoints (now return PagedResult<T>):**
- `GET /api/tickets/my?page=1&pageSize=20` → `PagedResult<TicketSummaryResponse>`
- `GET /api/dashboard/team-queue?page=1&pageSize=20&...` → `PagedResult<TicketSummaryResponse>`
- `GET /api/notifications?page=1&pageSize=20&unreadOnly=false` → `PagedResult<NotificationResponse>`

**PagedResult shape:**
```json
{
  "items": [...],
  "totalCount": 50,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

**FE wiring notes:**
- Update all FE API calls that previously expected arrays to now expect `.items` array inside PagedResult
- Use `totalCount`/`totalPages` for pagination UI
- Default pageSize is 20, max 100

---

## E4 COMPLETE — 103 tests passing (36 infrastructure + 67 API)

All E4 chunks merged to `frontend/foundation`. Summary:
- **Dashboard:** Real SLA stats, urgency sorting, status filter
- **Search:** Global text + advanced filtered with pagination
- **Reports:** Overview metrics + CSV export
- **Admin:** SLA config, business hours, holidays, delegates, workflow viewer (10 endpoints)
- **Pagination:** PagedResult<T> on my-tickets, team-queue, notifications

## Skipped (per CLAUDE.md — MVP 2)
- **4.8 Saved Filters** — deferred
- **4.11 User Management** — "users are seeded in MVP 1, admin CRUD deferred to MVP 2"

---

---

## FedEx Integration (BE DONE — FE: NOT WIRED)

Config toggle: `Shipping:Provider` = `"FedEx"` or `"None"` (default uses NoOp with fake tracking).

**Endpoints:**
- `POST /api/shipments/validate-address` — Validate recipient address
- `POST /api/shipments/book` — Book shipment, returns tracking number + stores label PDF
- `GET /api/shipments/by-ticket/{ticketId}` — Get shipment for a ticket (or 404)
- `GET /api/shipments/{id}/label` — Download label PDF

**ValidateAddressRequest:**
```json
{
  "addressLine1": "123 Main St",
  "addressLine2": null,
  "city": "Dubai",
  "stateProvince": "DU",
  "postalCode": "00000",
  "countryCode": "AE"
}
```

**BookShipmentRequest:**
```json
{
  "ticketId": "guid",
  "recipientName": "John Smith",
  "recipientCompany": "Al Ain Insurance",
  "recipientPhone": "+971-50-123-4567",
  "addressLine1": "123 Main St",
  "addressLine2": null,
  "city": "Dubai",
  "stateProvince": "DU",
  "postalCode": "00000",
  "countryCode": "AE",
  "weightKg": 0.5,
  "serviceType": "STANDARD_OVERNIGHT"
}
```

**ShipmentResponse:**
```json
{
  "id": "guid",
  "ticketId": "guid",
  "ticketDisplayId": "SPM-RBT-T01-20260403-001",
  "status": "LabelReady",
  "trackingNumber": "NOOP-20260403120000-1234",
  "recipientName": "John Smith",
  "recipientCompany": "Al Ain Insurance",
  "addressLine1": "123 Main St",
  "addressLine2": null,
  "city": "Dubai",
  "stateProvince": "DU",
  "postalCode": "00000",
  "countryCode": "AE",
  "weightKg": 0.5,
  "serviceType": "STANDARD_OVERNIGHT",
  "hasLabel": true,
  "createdAt": "2026-04-03T...",
  "shippedAt": "2026-04-03T..."
}
```

**ServiceType options:** STANDARD_OVERNIGHT, PRIORITY_OVERNIGHT, FEDEX_GROUND, FEDEX_EXPRESS_SAVER, INTERNATIONAL_ECONOMY

**FE wiring notes:**
- T-01 tickets only — show "Ship Contract" panel on ticket detail at EA Sign-off stage
- Flow: Enter address → Validate → Book → Print label
- `GET /api/shipments/by-ticket/{ticketId}` to check if shipment already exists
- Label download: `GET /api/shipments/{id}/label` returns PDF directly
- With `Provider: "None"`, everything works with fake tracking numbers (good for dev/testing)

---

## FULL BACKEND STATUS — E1 + E2 + E3 + E4 + Integrations COMPLETE

**108 tests passing** (36 infrastructure + 72 API integration)

**Total API endpoints: 39+**
- Auth: 2 (login, me)
- Products: 1
- Partners: 1
- Tickets: 8 (CRUD + actions + queries)
- Dashboard: 4 (stats, action-required, activity, team-queue)
- Comments: 2 (add, list)
- Documents: 3 (upload, list, download)
- Notifications: 4 (list, unread-count, mark-read, mark-all-read)
- Search: 2 (global, advanced)
- Reports: 2 (overview, CSV export)
- Admin: 10 (SLA config, business hours, holidays, delegates, workflow config)
- Shipments: 4 (validate-address, book, get-by-ticket, label download)

---

## Deployment

**Files:**
- `Docs/deployment/aws-deployment-guide.md` — Full step-by-step AWS guide (6 phases)
- `src/Dockerfile` — Multi-stage Docker build for the .NET API
- `src/.dockerignore` — Excludes bin/obj/uploads from Docker context

**Architecture:** S3+CloudFront (React) → App Runner (API Docker) → RDS SQL Server Express

**CORS:** `Program.cs` now reads `AllowedOrigins` from config (comma-separated). Defaults to localhost:5173 for dev. Set via env var in production.

**Before deploying:** Run EF migration against RDS to create all E3/E4/FedEx tables.

**Config toggles (env vars in App Runner):**
- `Email__Provider` = `None` or `Brevo`
- `Shipping__Provider` = `None` or `FedEx`
- `AllowedOrigins` = `https://your-cloudfront-domain.net`

## Pending Worktrees (DO NOT MERGE without Karthik's OK)
- `fe/doc-upload` — DocumentType enum + FE upload wiring (FormStep → API)
