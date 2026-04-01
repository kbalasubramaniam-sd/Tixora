# Tixora — Epic-Based Implementation Plan

**Tixora | Powering Every Request**
*Backend Implementation Plan v2.0 | April 2026*
*Author: Backend Team Lead*

---

## Overview

This plan breaks Tixora's backend implementation into 4 sequential epics. Each epic delivers a **demoable milestone** — working software you can hit with API calls.

### Planning Principles

- **Vertical slices over horizontal layers** — Each epic delivers end-to-end functionality, not just a layer.
- **Prove architecture early** — E1 takes one ticket type (T-01) through the full stack to catch integration issues before building out.
- **Sequential workflows only** — All workflow paths are strictly linear. Stage order is driven by seed data, not parallel execution logic.
- **Aggressive MVP scoping** — Email, drafts, dynamic workflow editing, product scoping per user are all deferred to MVP 2.
- **Background services via `BackgroundService`** — Built-in ASP.NET Core, zero external packages.

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | ASP.NET Core 8 Web API (C#) |
| Database | SQL Server (local) |
| ORM | Entity Framework Core |
| Auth | Fake JWT (seeded users), real SSO in MVP 2 |
| Background | `BackgroundService` (built-in) |
| Tests | xUnit |

### Architecture

Clean Architecture Monolith: `Domain` <- `Application` <- `Infrastructure` <- `API`

Domain has zero dependencies. Application depends on Domain. Infrastructure depends on Application + Domain. API references all layers and wires DI.

---

## Epic Summary

| Epic | Name | Stories | Key Deliverable | Demoable Outcome |
|------|------|---------|----------------|-----------------|
| **E1** | Bootstrap & First Ticket | 13 | T-01 end-to-end, architecture proven | Login → create T-01 → advance 3 stages → partner lifecycle = AGREED |
| **E2** | Full Ticket Lifecycle | 10 | All 5 task types, full lifecycle | Complete partner lifecycle: T-01 → T-02 → T-03 → T-04 → LIVE |
| **E3** | Operational Intelligence | 11 | SLA, notifications, comments, docs, audit | SLA warnings fire, notifications appear, full audit trail visible |
| **E4** | Surface & Admin | 17 | Dashboards, search, reports, admin config | Full demo as every role, search, reports, admin manages system |

---

## Epic 1: Bootstrap & First Ticket

### Goal

A running API where you can log in, create a T-01 (Agreement Validation & Sign-off) ticket for a partner on any product, advance it through 3 stages (Legal Review → Product Review → EA Sign-off), and see it complete — with the partner's lifecycle state advancing to AGREED.

### Why T-01 First

It's the simplest workflow (3 linear stages, no branching, no phases), touches every layer (auth, domain, DB, workflow engine, API), and it's the prerequisite for every other task type. If T-01 works, the architecture is proven.

### Stories

| # | Story | Acceptance Criteria | Dependencies |
|---|-------|-------------------|--------------|
| 1.1 | **Solution scaffold** — .NET solution, 4 projects + 3 test projects, project references, dependency rule enforced | `dotnet build` passes, layer dependencies are correct (Domain has zero refs) | — |
| 1.2 | **Core domain model** — Entities needed for T-01 only: Product, Partner, PartnerProduct, Ticket, StageLog, AuditEntry, User, WorkflowDefinition, StageDefinition. Enums needed for these. Value objects (TicketId). | Compiles, no infrastructure dependencies | 1.1 |
| 1.3 | **EF Core + DbContext** — AppDbContext, entity configurations for the E1 entities only, initial migration | `dotnet ef database update` creates the schema, tables match entity definitions | 1.2 |
| 1.4 | **Seed data** — Products (4), Users (6), T-01 workflow definitions (4, one per product), business hours default, 3 sample partners | API starts → DB is populated. Seed is idempotent. | 1.3 |
| 1.5 | **Fake auth** — AuthService (JWT issue/validate), FakeAuthMiddleware, login endpoint, /me endpoint | POST `/api/auth/login` returns JWT; authenticated requests populate HttpContext.User | 1.1 |
| 1.6 | **Product & Partner read endpoints** — ProductsController (list, tasks), PartnersController (list, profile with lifecycle) | GET `/api/products`, GET `/api/partners/{id}` return seeded data | 1.4 |
| 1.7 | **Ticket creation** — TicketService.Create, TicketRepository, CreateTicketRequest DTO, TicketId generation, lifecycle prerequisite check (T-01 has none), form schema endpoint | POST `/api/tickets` with taskType=T01 creates ticket with status=Submitted | 1.4, 1.5 |
| 1.8 | **Workflow engine (core)** — WorkflowEngine.Initialize, Advance, Reject, Complete. StageLog creation. AuditEntry creation. Lifecycle state advancement on complete. | Create T-01 → advance 3 times → status=Completed, partner lifecycle=AGREED | 1.7 |
| 1.9 | **Clarification flow** — ReturnForClarification, RespondToClarification on the engine. Status toggling. | Return at stage 2 → PendingRequesterAction → respond → back to InReview at stage 2 | 1.8 |
| 1.10 | **Reassign** — Engine.Reassign, StageLog entry | Reassign at any stage → new assignee, audit logged | 1.8 |
| 1.11 | **Cancel** — Engine.Cancel, pre-action guard | Cancel while Submitted → Cancelled. Cancel after first advance → rejected by API. | 1.8 |
| 1.12 | **Error handling & global middleware** — ErrorHandlingMiddleware, consistent error response shape, validation errors | 400/401/403/404/500 all return `{ error, details }` consistently | 1.1 |
| 1.13 | **Tests** — Domain unit tests (TicketId generation, lifecycle guards), Application tests (AuthService, WorkflowEngine core flow), API integration tests (T-01 end-to-end) | `dotnet test` passes, T-01 happy path + rejection + clarification covered | 1.11 |

### Dependency Graph

```
1.1 ─┬─→ 1.2 → 1.3 → 1.4 ─┬─→ 1.6
     │                      └─→ 1.7 → 1.8 ─┬─→ 1.9
     ├─→ 1.5 ──────────────────┘            ├─→ 1.10
     └─→ 1.12                               └─→ 1.11
                                                  └─→ 1.13
```

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Workflow engine complexity creep | Only build linear progression + reject + clarification. No generalization for future task types yet. |
| EF migration churn in later epics | E2-E4 add entities via additive migrations. Don't pre-build entities we won't test in E1. |

### Definition of Done

Demo: login → create T-01 for Partner C on Wtheeq → advance through 3 stages → partner lifecycle becomes AGREED. All via API calls.

---

## Epic 2: Full Ticket Lifecycle

### Goal

All 5 task types working with their unique flows. Lifecycle enforcement prevents creating tickets out of order. Cancel, re-raise, and the full workflow routing matrix are complete. After this epic, the core business logic of Tixora is done.

### Stories

| # | Story | Acceptance Criteria | Dependencies |
|---|-------|-------------------|--------------|
| 2.1 | **Remaining domain entities + migration** — SlaTracker, SlaPause, Document, Comment, Notification, FulfilmentRecord, DelegateApprover, BusinessHoursConfig, Holiday, SavedFilter. EF configs + migration. WorkflowDefinition filtered unique index on (ProductCode, TaskType, ProvisioningPath) where IsActive. | New tables created, build passes, unique constraint enforced | E1 complete |
| 2.2 | **Lifecycle enforcement** — TicketService validates prerequisites at creation time. T-02 requires T-01 completed. T-03 requires T-02 Ph2 completed. T-04 requires T-03 completed. T-05 requires ONBOARDED or LIVE. Clear error messages with current state. | POST `/api/tickets` with T-02 when no T-01 exists → 400 with explanation | 2.1 |
| 2.3 | **T-02 two-phase flow** — ClosePh1 → Phase1Complete → AwaitingUatSignal → SignalUatComplete → Phase2InReview → ClosePh2 → Complete. Independent SLA trackers per phase. Lifecycle: T-02 Ph1 → UAT_ACTIVE. | Full two-phase lifecycle works, partner → UAT_ACTIVE | 2.2 |
| 2.4 | **T-03 all three paths (sequential)** — ProvisioningPath resolved at submission based on product access mode. Three linear workflow variants. PortalAndApi stage order confirmed with Karthik before seeding. Lifecycle: T-02 Ph2 + T-03 both complete → ONBOARDED. | PortalOnly, ApiOnly, PortalAndApi all work as linear stage sequences | 2.2 |
| 2.5 | **T-04 user account creation** — 2-stage flow (Partner Ops → Provisioning). Lifecycle: ONBOARDED → LIVE. | Create T-04 → advance 2 stages → partner becomes LIVE | 2.2 |
| 2.6 | **T-05 access & credential support** — 3 issue types (PortalLoginIssue, ApiCredentialIssue, PortalPasswordReset), single-stage flow (Provisioning verify + resolve). No lifecycle state change. | Create T-05 for LIVE partner → resolve → Completed. No lifecycle change. | 2.2 |
| 2.7 | **Re-raise from rejection** — POST `/api/tickets/re-raise/{rejectedTicketId}`. Copies form data, links to original, creates fresh ticket with new workflow. | Reject a T-01 → re-raise → new ticket with ref to original, fresh stages | 2.3 |
| 2.8 | **Fulfilment records** — FulfilmentRecord captured at completion. Structured JSON per task type. | Advance to final stage → record fulfilment data → ticket completes with record attached | 2.3 |
| 2.9 | **Seed workflow matrix** — All 7 workflow paths seeded (spec §9.2). SLA defaults per task type seeded. T-03 PortalAndApi stage order confirmed with Karthik. | All Product × TaskType × ProvisioningPath combos have correct WorkflowDefinition | 2.4 |
| 2.10 | **Tests** — Workflow engine tests for all 5 task types. Lifecycle enforcement tests. Re-raise tests. Integration tests for T-02 and T-03 end-to-end. | `dotnet test` passes. Each task type has happy path + edge case coverage. | 2.9 |

### Dependency Graph

```
2.1 → 2.2 ─┬─→ 2.3 ─┬─→ 2.7
            │        └─→ 2.8
            ├─→ 2.4 ─→ 2.9 → 2.10
            ├─→ 2.5
            └─→ 2.6
```

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| T-02 two-phase status transitions | Isolated in 2.3. The status machine (Phase1Complete → AwaitingUatSignal → Phase2InReview) is the most complex piece — test heavily. |
| ONBOARDED gate (requires both T-02 Ph2 AND T-03) | The check must query both tickets for the same partner+product. Don't use a naive "last ticket completed" check. |
| T-03 PortalAndApi stage order | Explicitly deferred to user confirmation before seeding (story 2.9). |

### Definition of Done

Demo: full partner lifecycle — T-01 → T-02 (two-phase) → T-03 (on Rabet) → T-04 → partner is LIVE. Plus T-05 for a live partner. Cancel and re-raise both work.

---

## Epic 3: Operational Intelligence

### Goal

The system goes from "tickets move through stages" to "operationally useful." SLA tracking with real business-hours math, in-app notifications at every milestone, comments and documents on tickets, and a full audit trail. After this epic, a team lead can monitor workload, spot breaches, and trace every action.

### Stories

| # | Story | Acceptance Criteria | Dependencies |
|---|-------|-------------------|--------------|
| 3.1 | **SLA service — business hours calculation** — Reads BusinessHoursConfig + Holidays. Calculates elapsed business hours between two timestamps. Handles Sun-Thu, 08:00-17:00 GST. Subtracts paused periods. | Given start Sunday 16:00, current Monday 10:00 → returns 3 business hours. Holidays excluded. | E2 complete |
| 3.2 | **SLA tracker integration** — SlaTracker created when a stage starts. Updated on advance/complete. Pause/resume via SlaPause child table (supports multiple pauses per stage). Thresholds: OnTrack (<75%), AtRisk (75-90%), Critical (90-100%), Breached (>=100%). | Advance ticket → SlaTracker created. Return for clarification → SlaPause created. Respond → SlaPause closed with PausedBusinessHours. Multiple pauses accumulate correctly. | 3.1 |
| 3.3 | **SLA monitoring background service** — `BackgroundService`, runs every 5 minutes. Recalculates BusinessHoursElapsed for all active trackers. Triggers notifications at 75%, 90%, 100%. Idempotent. | After enough business hours, SlaStatus transitions and notification flags set correctly. | 3.2 |
| 3.3b | **UAT reminder background service** — `BackgroundService`, runs daily. Checks T-02 tickets in AwaitingUatSignal. If configurable window exceeded (default: 30 business days), sends reminder to requester. Second threshold flags for admin review. | T-02 sitting in AwaitingUatSignal for 30+ business days → requester gets reminder notification. | 3.2, 3.4 |
| 3.4 | **Notification service** — NotificationService.Send creates in-app Notification records. Maps every workflow event to type + recipient(s). IEmailSender with NoOpEmailSender for MVP 1. | Every stage action creates appropriate notifications. | E2 complete |
| 3.5 | **Notification endpoints** — GET list, PUT mark-read, PUT mark-all-read, GET unread-count | All endpoints work. Mark-read sets IsRead + ReadAt. Mark-all-read bulk updates. | 3.4 |
| 3.6 | **Comments** — POST/GET on tickets. Optional attachment reference. Author tracked. | Add comment → appears in list with author and timestamp. | E2 complete |
| 3.7 | **Document upload** — POST multipart upload, GET metadata. LocalFileStorage. File size/type validation. | Upload PDF → stored locally → metadata in DB → retrievable. Reject >10MB or disallowed types. | E2 complete |
| 3.8 | **Audit trail** — AuditService logs every action. GET `/api/tickets/{id}/audit` returns full history. Immutable, append-only. | Audit shows: created, advanced, returned, responded, reassigned, cancelled with actor, role, timestamp. | E2 complete |
| 3.9 | **Wire notifications into workflow engine** — Retrofit E1/E2 workflow actions to emit notifications. All 19 notification types from product spec (US-012) covered. | Create ticket → requester + reviewer notified. Advance → next owner notified. All milestones wired. | 3.4, 3.5 |
| 3.10 | **Tests** — SLA calculation unit tests (cross-day, holidays, pause/resume, timezone). Notification dispatch tests. Document upload integration tests. | `dotnet test` passes. SLA math battle-tested. | 3.9 |

### Dependency Graph

```
3.1 → 3.2 → 3.3 ───────┐
              └─→ 3.3b ─┤
3.4 → 3.5 ──────────────┼─→ 3.9 → 3.10
3.6 (independent) ───────┘
3.7 (independent)
3.8 (independent)
```

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| SLA business-hours math | Timezone-aware date math with holidays and pause/resume is bug-prone. Isolated in 3.1 with heavy unit testing before integration. |
| Notification retrofit | 3.9 touches every workflow action from E1/E2. Keep NotificationService calls at the service layer, not controllers. |

### Definition of Done

Demo: create T-01 → SLA clock starts → advance through stages → notifications appear at each step → add comments and documents → view audit trail. Let SLA breach happen → see warning notifications at 75%, 90%, breach.

---

## Epic 4: Surface & Admin

### Goal

The system becomes feature-complete for MVP 1. Dashboards give each role a landing page. Search finds anything. Reports provide operational metrics. Admin config manages users, SLA targets, business hours, holidays, and delegates.

### Stories

| # | Story | Acceptance Criteria | Dependencies |
|---|-------|-------------------|--------------|
| 4.1 | **Dashboard — stats** — GET `/api/dashboard/stats`. Role-adaptive stat cards: open count, SLA breaches, compliance %, avg resolution time. Different metrics per role (Requester vs Reviewer vs Admin etc.). | Each role sees relevant stats matching frontend spec. | E3 complete |
| 4.2 | **Dashboard — action required** — GET `/api/dashboard/action-required`. Tickets needing current user's action (clarification for Requester, queue items for Reviewer, SLA breaches for Admin). Max 5, sorted by urgency. | Requester sees clarification requests. Reviewer sees queue. Admin sees breaches. | E3 complete |
| 4.3 | **Dashboard — activity** — GET `/api/dashboard/activity`. Recent activity timeline for current user, derived from audit entries. Max 10 entries. | Shows recent actions: "You approved SPM-RBT-T01-..." with timestamps. | E3 complete |
| 4.4 | **My Tickets** — GET `/api/dashboard/my-tickets`. Tickets created by current user, grouped by status. Summary counts. | Requester logs in → sees their tickets with status breakdown | E3 complete |
| 4.5 | **Team queue** — GET `/api/dashboard/team-queue`. Tickets for current user's role, sorted by SLA urgency (breached first). Filterable by product, task type, status. | Reviewer logs in → sees all tickets awaiting review, worst SLA first | E3 complete |
| 4.6 | **Global search** — GET `/api/search?q={query}`. Searches ticket ID, partner name, partner alias. Ranked results with type indicator. | Search "RBT" → returns matching tickets and partners | E3 complete |
| 4.7 | **Advanced search** — POST `/api/search/advanced`. Filter by product, task type, status, date range, assigned user, SLA status. Paginated. | Filter product=RBT + status=InReview → correct results, paginated | 4.6 |
| 4.8 | **Saved filters** — CRUD on SavedFilter. Per-user. | Save → appears in list → re-apply → same results → delete | 4.7 |
| 4.9 | **Reports — overview** — GET `/api/reports/overview`. Aggregated metrics: tickets by status/product/task type, average resolution time, SLA compliance %, breach count. Date range filter. | JSON metrics match actual ticket data | E3 complete |
| 4.10 | **Reports — CSV export** — GET `/api/reports/export`. Exports filtered ticket data as CSV. | Download CSV → opens in Excel with correct data | 4.9 |
| 4.11 | **Admin — user management** — GET/POST/PUT `/api/admin/users`. List, create, deactivate. Role assignment. System Admin role required. | Create user → can log in. Deactivate → login fails. | E3 complete |
| 4.12 | **Admin — SLA config** — GET/PUT `/api/admin/sla-config`. View and update SLA targets per product × task type. | Change T-01 SLA to 20 hours → new tickets use 20 | E3 complete |
| 4.13 | **Admin — business hours & holidays** — GET/PUT business hours. POST/DELETE holidays. | Add holiday → SLA calculation skips that date | E3 complete |
| 4.14 | **Admin — delegates** — GET/POST/DELETE `/api/admin/delegates`. Delegate approval with optional date range. | Create delegate → delegate can act for primary user | E3 complete |
| 4.15 | **Admin — workflow config (read-only)** — GET `/api/admin/workflow-config`. Displays routing matrix. No PUT in MVP 1. | Admin sees all workflow definitions with stages. Read-only. | E3 complete |
| 4.16 | **Pagination & common patterns** — PagedResult<T>, consistent query params (page, pageSize, sortBy, sortDir). Retrofit E1-E3 list endpoints. | All list endpoints support pagination with consistent shape | 4.1-4.15 |
| 4.17 | **Tests** — Dashboard (stats, action-required, activity), search, report aggregation, admin CRUD, pagination tests. | `dotnet test` passes. Search correct. Reports match data. | 4.16 |

### Dependency Graph

```
4.1 (independent)     — dashboard stats
4.2 (independent)     — action required
4.3 (independent)     — activity
4.4 (independent)     — my tickets
4.5 (independent)     — team queue
4.6 → 4.7 → 4.8      — search pipeline
4.9 → 4.10            — reports
4.11 (independent)    — user management
4.12 (independent)    — SLA config
4.13 (independent)    — business hours & holidays
4.14 (independent)    — delegates
4.15 (independent)    — workflow config (read-only)
4.16 (after 4.1-4.15) — pagination retrofit
4.17 (after 4.16)     — tests
```

Most E4 stories are independent — this epic is highly parallelizable.

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Search performance | For hackathon data volumes, EF LINQ with `Contains` is fine. No full-text indexing needed. |
| Report accuracy | Test aggregation queries against seeded data from E1/E2 demos. |
| Pagination retrofit | 4.13 is mechanical: wrap return types in PagedResult<T>, add query params. No business logic changes. |

### Definition of Done

Demo: log in as each role → see dashboard → search for a partner → view reports → admin configures SLA and business hours. Every endpoint returns paginated, consistent responses.

---

## Cross-Cutting Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Workflow execution | All sequential, stage order from seed data | Eliminates parallel stage complexity. PortalAndApi order configurable without code changes. |
| Ticket assignment | Role queue — `AssignedToUserId` null until a user claims from team queue | Multiple users per role. No auto-assignment algorithm needed. Reassign handles mistakes. |
| Partner initial state | `LifecycleState.None` — partners start with no lifecycle state | T-01 completion moves to Agreed. None represents "no T-01 completed yet." |
| SLA pause tracking | `SlaPause` child table on SlaTracker | Supports multiple clarification cycles per stage. Full audit of pause/resume durations. |
| Workflow uniqueness | Filtered unique index on (ProductCode, TaskType, ProvisioningPath) where IsActive | Prevents duplicate active workflows that would break routing. |
| Background jobs | `BackgroundService` (built-in) | Zero packages. SLA monitor (5min) + UAT reminder (daily). |
| Auth | Fake JWT, seeded users | Identical contract to real SSO — swap later without touching downstream code. |
| File storage | Local disk via `IFileStorage` | Swap to blob storage in MVP 2 by implementing the interface. |
| Email | `IEmailSender` → `NoOpEmailSender` | Interface defined, no-op for MVP 1. No SES-specific code. Real provider in MVP 2. |
| Notifications | In-app only (DB records) | No external delivery in MVP 1. |
| Workflow editing | Seed-only, read-only admin view | No PUT endpoint for workflow config in MVP 1. |

---

## What's Deferred to MVP 2

- Email notifications (real provider)
- Draft management (auto-save)
- Real SSO/auth integration
- Dynamic workflow configuration (admin edits routing rules)
- Product scoping per user (UserProductScope join table)
- Full-text search indexing
- Blob storage for documents
