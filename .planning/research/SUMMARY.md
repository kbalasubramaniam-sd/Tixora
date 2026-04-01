# Research Summary: Tixora

**Domain:** Internal operations portal — ticketing, partner lifecycle, workflow engine, SLA tracking
**Researched:** 2026-04-01
**Overall confidence:** HIGH

---

## Executive Summary

Tixora fits a well-understood category: internal workflow portal with role-based dashboards, a state-machine-driven ticket lifecycle, SLA accountability, and audit trails. This category has a mature, proven stack in both the .NET and React ecosystems, so most decisions are confirmatory rather than exploratory.

The .NET 8 + EF Core 9 + MediatR 12 + FluentValidation 12 + Mapperly backend combination is the current community-consensus clean architecture stack. The significant ecosystem change since training data is that AutoMapper went commercial in April 2025, making Mapperly (source-generated, zero runtime reflection) the correct default replacement. All versions were verified against NuGet.org.

On the frontend, the React 19 + Vite + TanStack Query v5 + Tailwind v4 + Radix UI stack is solidly established. Tailwind v4 changed its setup mechanics (now a Vite plugin, no tailwind.config.js required), which matters for the initial scaffold. React Hook Form remains the dominant choice for form handling at this complexity level — TanStack Form is maturing but has not displaced it.

The two areas requiring the most care are: (1) the custom workflow engine, which must encode a state machine with prerequisite enforcement rather than ad-hoc if/else chains, and (2) SLA business-hours arithmetic for the GST Sun-Thu 08:00-17:00 window, which is non-trivial and easy to get wrong under holiday/boundary conditions.

---

## Key Findings

**Stack:** .NET 8 + EF Core 9 + MediatR 12 + FluentValidation 12 + Mapperly 4.3.1 + Serilog 10 + SignalR (built-in) | React 19 + Vite + TanStack Query v5 + Tailwind v4 + Radix UI + React Hook Form

**Architecture:** Clean Architecture monolith (Domain → Application → Infrastructure → API), CQRS via MediatR, custom `WorkflowEngine.cs` as a domain service, `BackgroundService` + `PeriodicTimer` for SLA scanning

**Critical pitfall:** Business-hours SLA math is the most common source of correctness bugs in internal portals. Implement as a tested, isolated `BusinessHoursCalculator` service from day one — do not inline this logic in tickets or the SLA monitor.

---

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation** — Infrastructure plumbing, auth skeleton, one ticket type end-to-end
   - Addresses: EF Core setup, migrations, fake JWT auth, `WorkflowEngine.cs` skeleton, `BusinessHoursCalculator`
   - Avoids: Building UI before API contract is stable; starting with complex task types before architecture is proven
   - Rationale: T-01 (Agreement Validation) is the simplest flow — touches every layer without two-phase complexity. Proves the architecture before expanding.

2. **Core Workflow Engine** — All 5 task types, workflow state machine, SLA tracking
   - Addresses: T-02 two-phase UAT, T-03 product-driven access paths, lifecycle state machine, SLA monitor `BackgroundService`
   - Avoids: Parallel stage complexity (sequential only), dynamic workflow editing (seeded rules only)
   - Rationale: This is the highest-risk phase. Workflow correctness and SLA math are deeply interdependent — build and test together.

3. **Data & Audit** — Comments, document upload, fulfilment records, immutable audit trail
   - Addresses: File upload (local storage), comment threads per ticket, audit log table
   - Avoids: Cloud blob storage (MVP 2)
   - Rationale: Depends on stable ticket entity from Phase 2. Local file storage is simpler than blob; abstract behind `IFileStorage` for MVP 2 swap.

4. **Notifications & Real-Time** — SignalR hub, in-app notification center, milestone push events
   - Addresses: SignalR setup, `NotificationHub`, workflow engine publishing events, React SignalR client
   - Avoids: Email notifications (MVP 2 `NoOpEmailSender`)
   - Rationale: Requires stable workflow events from Phase 2 to know what to notify on.

5. **Dashboard & Search** — Role-adaptive dashboards, global search, advanced filters, saved filters, CSV export
   - Addresses: My tickets / team queue views, search with filter persistence, reports
   - Avoids: Complex analytics (MVP 2)
   - Rationale: Depends on all ticket types existing. Search and filtering require indexing decisions that are easier to make once the schema is stable.

6. **Admin & Polish** — User management, SLA config, business hours/holidays, delegate management, workflow config (read-only)
   - Addresses: Admin screens, holiday calendar for business-hours calculator
   - Avoids: Dynamic workflow editing
   - Rationale: Admin configuration depends on all features existing so you know what needs to be configurable.

**Phase ordering rationale:**
- Foundation first because architecture correctness cannot be validated until data flows end-to-end
- Workflow engine second because it is the highest-risk phase and all subsequent features depend on it
- Notifications fourth (not second) because they are milestone-driven — milestones must exist first
- Search/dashboard fifth because they are read paths over data that must exist first
- Admin last because you cannot configure what doesn't exist yet

**Research flags for phases:**
- Phase 2 (Workflow Engine): High complexity — prerequisite enforcement, two-phase UAT signal, product-driven access paths. Consider a dedicated research spike before coding.
- Phase 2 (SLA Math): GST timezone + Sun-Thu week + holidays is a deceptively complex calculation. Needs unit test coverage before integration.
- Phase 5 (Search): EF Core full-text search on SQL Server — may need `CONTAINS` / `FREETEXT` T-SQL predicates rather than LIKE if performance is a concern. Standard patterns apply.
- All other phases: Standard patterns, unlikely to need research.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack versions | HIGH | All verified against NuGet.org / npm as of 2026-04-01 |
| Features | HIGH | Requirements are well-defined in PROJECT.md; no ambiguity |
| Architecture | HIGH | Clean Architecture monolith is a proven, well-documented pattern for this scale |
| Pitfalls | HIGH | Business-hours SLA math and workflow state machine pitfalls are domain-specific but well-understood |
| AutoMapper commercial status | HIGH | Multiple sources confirm April 2025 announcement |

---

## Gaps to Address

- **SLA holiday calendar schema:** How holidays are stored and queried in the `BusinessHoursCalculator` is not designed yet. The Admin phase must define this clearly.
- **File upload size/type limits:** Local file storage for documents needs a defined policy (max size, allowed types). Not blocking for foundation but must be decided before document upload phase.
- **Exact Radix UI component selection per screen:** 14 screens from Stitch — which Radix primitives map to which UI elements. This is a frontend scaffolding task, not a research gap.
- **SignalR connection management under reconnect:** Standard pattern is `withAutomaticReconnect()` on the JS client — needs to be applied consistently.
