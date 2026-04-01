# Tixora

## What This Is

An internal operations portal replacing manual email-based partner request management across four UAE government-integrated platforms (Rabet, Rhoon, Wtheeq, Mulem). All users are internal employees. Partners are external entities managed through the system but never access it directly.

## Core Value

Every partner request is tracked from submission to completion with clear ownership, SLA accountability, and full audit trail — replacing the current email-based manual followup process.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Fake auth with seeded users and JWT (real SSO in MVP 2)
- [ ] 4 task types (T-01 through T-04) with configuration-driven workflow routing
- [ ] T-02 two-phase flow with UAT signal
- [ ] T-03 product-driven access path (PortalOnly, ApiOnly, PortalAndApi)
- [ ] Lifecycle state machine with prerequisite enforcement (Agreed → UatActive → Onboarded → Live)
- [ ] SLA tracking with business-hours math (Sun-Thu, 08:00-17:00 GST)
- [ ] In-app notifications at every workflow milestone
- [ ] Comments, document upload, and fulfilment records on tickets
- [ ] Immutable audit trail
- [ ] Role-adaptive dashboards (my tickets, team queue)
- [ ] Global and advanced search with saved filters
- [ ] Reports dashboard with CSV export
- [ ] Admin: user management, SLA config, business hours/holidays, delegates, workflow config (read-only)
- [ ] React frontend with Tailwind, Radix UI, TanStack Query — all screens from Stitch designs
- [ ] Backend-frontend integration — fully functional end-to-end product

### Out of Scope

- Email notifications — deferred to MVP 2 (IEmailSender with NoOpEmailSender for now)
- Real SSO/auth — deferred to MVP 2 (fake JWT identical contract)
- Draft management (auto-save) — deferred to MVP 2
- Dynamic workflow configuration editing — seed-only in MVP 1
- Product-scoped users — all users see all products in MVP 1
- Arabic (RTL) localisation — deferred to MVP 2
- Cloud blob storage — local file storage in MVP 1
- Mobile app — web-only

## Context

- Replacing a fully manual, email-driven process with no tracking or accountability
- Hackathon project with deadline pressure — aggressive MVP scoping
- Solo developer directing Claude agents for parallel execution
- Backend: ASP.NET Core 8, SQL Server, EF Core, Clean Architecture monolith
- Frontend: React 19, Vite, Tailwind CSS, Radix UI, TanStack Query, React Router v7
- UI designs from Google Stitch (14 screens designed, pixel-perfect reference)
- Build strategy: prove architecture with T-01 end-to-end first, then expand
- 4 products: Rabet (Both), Rhoon (Both), Wtheeq (ApiOnly), Mulem (ApiOnly)

## Constraints

- **Tech stack**: .NET 8 backend + React frontend (non-negotiable)
- **Timeline**: Hackathon deadline — ship fast, defer non-essential
- **No external packages for workflow**: Custom WorkflowEngine.cs, pure service
- **No external packages for background jobs**: Built-in BackgroundService only
- **Database**: SQL Server with EF Core
- **Auth**: Fake JWT with seeded users — must have identical contract to real SSO for easy swap
- **SLA**: Business hours only (Sun-Thu, 08:00-17:00 GST)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clean Architecture monolith | Single deployable, strict layer separation, proven pattern for this scale | -- Pending |
| T-01 first (prove architecture) | Simplest flow touches every layer — catch integration issues early | -- Pending |
| Sequential workflows only | Eliminates parallel stage complexity. Stage order configurable via seed data. | -- Pending |
| Fake auth with real JWT contract | Swap to SSO later without touching downstream code | -- Pending |
| IFileStorage / IEmailSender abstractions | Swap implementations in MVP 2 without business logic changes | -- Pending |
| Tailwind + Radix UI | Design tokens from Stitch map to Tailwind config, Radix for accessible headless primitives | -- Pending |
| TanStack Query for server state | Almost all Tixora state is server-driven — caching, refetching, loading/error handled | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-01 after initialization*
