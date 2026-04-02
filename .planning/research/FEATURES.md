# Feature Landscape

**Domain:** Internal ticketing and partner lifecycle management portal
**Researched:** 2026-04-01
**Confidence:** HIGH (domain patterns well established; Tixora specifics derived directly from PROJECT.md and spm_portal_story.md)

---

## Context

Tixora is not a general helpdesk. It is a narrow-domain, fully internal operations portal replacing a manual email-based process for five specific task types across four UAE government-integrated products. Features must be judged against that context — not against what Jira or ServiceNow offer.

All users are internal employees. Partners never touch the system. Every ticket is anchored to a Product × Task combination that drives deterministic routing. This narrows what "table stakes" means considerably.

---

## Table Stakes

Features users expect to be present. Missing any of these and the system fails to replace the current email-driven workflow — operators revert to the inbox.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Ticket submission with Product × Task selection** | Every request needs a structured entry point with correct context captured upfront | Medium | Product selector comes first; task options render conditionally per product. T-03 has an API opt-in toggle that exposes additional mandatory fields. |
| **Deterministic workflow routing** | Without enforced routing, approvals still rely on individual judgment and email chasing | High | Custom WorkflowEngine.cs — no external package. Sequential stages per Task Type; T-03 Portal+API path requires parallel provisioning tracks after approval. Must be seeded, not UI-editable in MVP 1. |
| **Stage ownership and action queue** | Each stage must have a clear owner who sees what actions are required of them | Medium | Users see "my queue" (things assigned to me or my role) and "team queue" (things my team owns). No queue = no accountability. |
| **SLA tracking with business-hours math** | Without SLA visibility, breach is discovered retrospectively and there is no pressure to act | High | Sun–Thu, 08:00–17:00 GST. SLA clock must pause outside business hours and on holidays. SLA targets vary by task type (2h for T-04, 48h for T-01). |
| **SLA breach warnings and escalation flags** | Passive SLA tracking without alerts provides no operational benefit | Medium | Warning at configurable threshold (e.g., 80% consumed). Breached tickets must be visually flagged in queues. Escalation routing in MVP 2. |
| **In-app notifications at workflow milestones** | Users need to know when something lands in their queue or transitions | Medium | Triggered at: submission, stage transition, completion, SLA warning. Email deferred to MVP 2 — in-app only for MVP 1. |
| **Ticket detail view with status timeline** | Without a timeline, partners ask "where is my request?" and operators cannot answer quickly | Medium | Shows current stage, who owns it, all prior transitions with timestamps. Read from audit trail. |
| **Comments on tickets** | Internal communication about a ticket must be threaded and on-record | Low | All users who can view a ticket can comment. No "internal vs external" distinction — system is fully internal. |
| **Document upload on tickets** | Many task types require mandatory document packages (T-01: agreement copy, TL, VAT cert, POA, addenda) | Medium | Local file storage in MVP 1. IFileStorage abstraction for swap to blob in MVP 2. Virus scan and file type validation required. |
| **Fulfilment records** | Provisioning and integration teams must record what was actually done (credentials issued, accounts created) | Low | Structured or freetext record attached to the ticket at completion stage. |
| **Immutable audit trail** | Compliance and accountability require a tamper-proof record of every state change, action, and comment | Medium | Every mutation writes an audit record: who, what, when, from-state, to-state. Read-only. Never deleted. |
| **Partner lifecycle state machine** | Prerequisite enforcement (AGREED → UAT ACTIVE → ONBOARDED → LIVE) prevents out-of-order operations | High | State tracked per partner per product. T-02 blocked unless partner is AGREED+. T-03 blocked unless T-02 Phase 2 complete. Enforced at ticket submission. |
| **Role-adaptive dashboard** | Requesters, reviewers, approvers, provisioning agents, and admins have fundamentally different information needs | Medium | My Tickets vs Team Queue. SLA health at a glance. Not role-locked — same user can view both views. |
| **Search with filters** | Operators regularly need to find tickets by partner name, product, task type, status, or date range | Medium | Full-text search + filter facets (product, task type, status, assigned team, SLA status). Saved filters are a quality-of-life feature; valuable but deferrable. |
| **Reports dashboard with CSV export** | Operations managers need to review volumes, SLA performance, and team throughput periodically | Medium | Tabular report views, not interactive charts in MVP 1. CSV export per report. Charts can come in MVP 2. |
| **Admin: user and role management** | Someone must be able to add users, assign roles, and deactivate leavers without a code deployment | Medium | Seeded roles; admin creates/deactivates user accounts and assigns roles. Password reset (fake auth) in MVP 1. |
| **Admin: SLA and business hours config** | SLA targets and holiday calendars change without a code release | Medium | SLA targets per task type configurable. Business hours window and public holiday list configurable. |
| **Admin: delegate management** | Users go on leave; someone must be able to reassign pending queue items or set a delegate | Low | Delegate assignment: while user X is away, route their queue items to user Y. MVP 1 scope. |
| **Ticket ID generation** | Structured IDs (SPM-RBT-T01-20260401-0001) are how operators and partners refer to requests in all communications | Low | Format: SPM-[PRODUCT]-[TASK]-[YYYYMMDD]-[SEQ]. Sequential per day across the system. Must not have gaps or duplicates. |
| **Fake auth with JWT (real SSO contract)** | Some auth gate is needed; fake auth allows MVP 1 to ship while SSO is deferred | Low | Seeded users. JWT contract must be identical to real SSO to allow a no-touch swap in MVP 2. |

---

## Differentiators

Features that provide meaningful operational advantage beyond the baseline. Not expected by users unfamiliar with sophisticated tools, but add real value when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Saved search filters** | Operators who run the same filter query daily (e.g., all Rabet tickets in SLA warning state) save 30 seconds per use; compounds across team | Low | Persist per user. Simple name + serialized filter state. |
| **Partner lifecycle view** | See all products a partner is onboarded on and their lifecycle stage per product at a glance | Medium | Aggregated partner record: partner name, per-product lifecycle state, linked ticket history. Valuable for partner relationship owners. |
| **Bulk ticket operations** | Ops managers need to reassign or close multiple low-priority tickets at once | Medium | Select multiple + action. Useful for queue cleanup but not MVP critical. Defer to MVP 2. |
| **SLA performance reporting** | Trend analysis (average resolution time per task type, SLA breach rate by team) drives process improvement | Medium | Beyond raw ticket counts. Requires aggregation queries. Consider for MVP 1 as a second report page; defer detailed trend charts to MVP 2. |
| **Workflow config read-only view for admins** | Admins can see what the routing rules are without editing them (edit deferred to MVP 2) | Low | Transparent to admins — removes support burden of "why did this go to Legal first?" questions. |
| **Ticket re-open / correction flow** | A completed ticket occasionally needs to be re-opened when fulfilment was incorrect | Low | Restricted to admin or senior role. Audit-logged. Low frequency but eliminates need to raise a duplicate ticket. |

---

## Anti-Features

Features to deliberately NOT build in MVP 1, with explicit reasoning.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Email notifications** | Requires email server config, deliverability management, unsubscribe handling, and HTML template maintenance — none of which deliver MVP 1 value | In-app notifications only. IEmailSender abstraction with NoOpEmailSender stub ensures zero-touch swap in MVP 2. |
| **Real SSO / SAML / OIDC integration** | Requires IT coordination, IdP configuration, and certificate management — weeks of effort for auth that isn't the product | Fake JWT with identical token contract. Swap in MVP 2 without touching any business logic. |
| **Dynamic workflow editor UI** | Drag-and-drop workflow builders are complex to build correctly (cycle detection, stage validation, permission scoping) and not needed until routing rules change frequently | Seed workflow rules from code/migration. Admin can view them read-only. Edit capability in MVP 2. |
| **Draft / auto-save ticket submission** | Auto-save requires debouncing, conflict resolution, and resume-from-draft state management across all form types | Synchronous submit-on-complete. If user navigates away, form state is lost. MVP 1 forms are short enough this is acceptable. |
| **Partner-facing portal** | Partners are external and currently managed through the system, not by it. Building external access introduces auth, data visibility scoping, and UX work for a different persona | All communication with partners happens through internal relationship owners. No external access in any MVP. |
| **Arabic (RTL) localization** | RTL layout requires a parallel CSS layer, bidirectional text handling, and UI testing across all 14 screens | English-only in MVP 1. RTL in MVP 2 when deployment region demands it. |
| **AI-assisted ticket routing or classification** | AI classification requires training data the system doesn't have at launch, and the routing rules are already deterministic | Hard-coded deterministic routing per Product × Task. No ambiguity to resolve. |
| **SLA escalation automation (auto-reassign)** | Automatic reassignment when SLA is breached requires on-call schedules, escalation chains, and "who is available" logic | Visual breach flags and in-app notifications. Human action on escalation. Automated escalation in MVP 2. |
| **Knowledge base / FAQ articles** | Internal team of operators doesn't need a self-service knowledge base — they know the domain | Out of scope permanently. Not applicable to this use case. |
| **Ticket merging** | Duplicate detection and merge logic is complex and low-frequency in a structured system where duplicates are rare by design | Duplicate ticket prevention at submission (warn if partner+product+task has an open ticket already). No merge. |
| **Time tracking / billing** | No billing relationship tied to ticket resolution time | Not applicable. |
| **Customer satisfaction surveys (CSAT)** | All users are internal employees, not customers. CSAT is a customer support metric. | Not applicable. |
| **Cloud blob storage** | Azure Blob / S3 requires cloud credentials, storage lifecycle policies, and signed URL management | Local file system storage behind IFileStorage abstraction. Swap to blob in MVP 2. |
| **Product-scoped user visibility** | Restricting which products a user can see requires a many-to-many user-product permission table and filtering at every query | All users see all products in MVP 1. Scope restriction in MVP 2 when the team grows large enough for this to matter. |
| **Mobile app** | A mobile-optimized native app requires separate build toolchain, app store publishing, and push notification infrastructure | Responsive web UI only. Operators work at desks. |

---

## Feature Dependencies

The following dependency chain must be respected in build order. Attempting to build downstream features before their prerequisites are stable will cause rework.

```
Fake Auth (seeded users + JWT)
  └── Role-adaptive dashboard (knows who you are)
        └── My Tickets queue
        └── Team Queue

Product & Task Selection (form entry point)
  └── Ticket Submission
        └── Ticket ID generation (on create)
        └── SLA clock start (on create)
              └── SLA tracking background service
                    └── SLA warning notifications
                    └── SLA breach flags in queue
        └── In-app notifications (on create)
        └── Audit trail (first entry on create)
              └── Ticket detail timeline view

Workflow Engine (WorkflowEngine.cs)
  └── Stage assignment and routing (on submit, on action)
        └── Stage ownership queue (who sees what)
        └── In-app notifications (on stage transition)
        └── T-02 two-phase flow (Phase 1 → Phase 2)
        └── T-03 parallel provisioning tracks (Portal + API)
        └── Ticket completion

Partner Lifecycle State Machine
  └── Prerequisite enforcement at ticket submission
        └── Partner lifecycle view (aggregated read)

Document Upload (IFileStorage)
  └── Required at submission for T-01
  └── Optional on any ticket (additional evidence)

Comments
  └── No hard dependencies; can be built standalone

Fulfilment Records
  └── Required at completion stage by Provisioning/Integration teams

Admin: User Management
  └── Admin: Delegate management (users must exist first)

Admin: SLA + Business Hours Config
  └── SLA tracking (reads config at clock evaluation)

Audit Trail
  └── All write operations (ticket, comment, document, state change, admin action)
  └── Ticket detail timeline view (reads from trail)

Search + Filters
  └── Ticket data (must exist to search)
  └── Saved Filters (built on top of search)

Reports Dashboard
  └── Ticket data
  └── SLA tracking data
  └── CSV export (reads same data as report view)
```

---

## MVP Recommendation

### Build in MVP 1 (in dependency order)

1. **Fake auth + seeded users** — unblocks everything that needs a user identity
2. **Workflow engine + seeded workflow rules** — the core routing mechanism; proves architecture end-to-end with T-01 first
3. **Ticket submission (all 4 task types)** — product × task selection, conditional form fields, document upload, ticket ID generation
4. **Partner lifecycle state machine** — prerequisite enforcement at submission; per-partner per-product tracking
5. **SLA tracking with business-hours math** — background service, clock start on submit, pause/resume on business hours, SLA config in admin
6. **In-app notifications** — triggered at submission, stage transitions, SLA warning, completion
7. **Audit trail** — immutable write-behind on every mutation; read in ticket timeline
8. **Role-adaptive dashboard** — my tickets, team queue, SLA health summary
9. **Ticket detail view** — status timeline, comments, documents, fulfilment records
10. **Admin panel** — user management, SLA config, business hours + holidays, delegate management, workflow read-only view
11. **Search + filters** — full-text + facets; saved filters
12. **Reports dashboard** — ticket volume, SLA performance, CSV export

### Defer to MVP 2

- Email notifications (IEmailSender → real implementation)
- Real SSO (fake JWT → OIDC/SAML)
- Dynamic workflow editor UI
- Draft / auto-save
- Bulk ticket operations
- Detailed SLA trend charts
- SLA escalation automation
- Arabic (RTL) localization
- Cloud blob storage
- Product-scoped user visibility

---

## Sources

- Internal project spec: `Docs/spm_portal_story.md` — HIGH confidence (primary source)
- Internal project context: `.planning/PROJECT.md` — HIGH confidence (primary source)
- [Ticketing System Guide: Key Features 2026 — InvGate](https://blog.invgate.com/ticketing-system) — MEDIUM confidence
- [SLA Software Complete Guide 2026 — Monday.com](https://monday.com/blog/service/sla-software/) — MEDIUM confidence
- [Partner Lifecycle Management: 8-Step Framework 2026 — Introw](https://www.introw.io/blog/partner-lifecycle-management) — MEDIUM confidence
- [Helpdesk Implementation Mistakes to Avoid 2026 — EasyDesk](https://easydesk.app/blog/helpdesk-implementation-mistakes) — MEDIUM confidence (anti-features informed by industry patterns)
- [ServiceNow vs Jira Service Management — Desk365](https://www.desk365.io/blog/servicenow-vs-jira-service-management/) — LOW confidence (used for feature vocabulary only, not recommendations)
