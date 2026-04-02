# Domain Pitfalls

**Domain:** Internal ticketing / workflow engine portal (ASP.NET Core 8 + React 19)
**Project:** Tixora — Strategic Partner Management Portal
**Researched:** 2026-04-01

---

## Critical Pitfalls

Mistakes that cause rewrites, corrupt data, or break the core value of the system.

---

### Pitfall 1: SLA Clock Stored or Calculated in UTC Without GST-Aware Business-Hours Logic

**What goes wrong:**
SLA deadline is calculated by naively adding hours to a UTC timestamp without anchoring to the GST business-hours window (Sun-Thu, 08:00-17:00 GST = UTC+4). A ticket created at 16:55 GST on Thursday gets an 8-hour SLA deadline set to Friday 00:55 UTC — which is a public/weekend day outside business hours. The displayed deadline is wrong, breaches are miscounted, and reports are untrustworthy.

**Why it happens:**
DateTime.UtcNow is the natural default in .NET. Developers add a TimeSpan directly without iterating over business-hour windows. The GST offset (+4) is hardcoded instead of timezone-aware, so DST transitions or future policy changes break silently. Holiday calendars are an afterthought.

**Consequences:**
- SLA breach flags fire on tickets that were actually resolved within business hours
- Report exports show wrong breach rates
- Admin-configured public holidays are ignored in calculations
- Breaks the entire accountability pillar — the system's core reason to exist

**Prevention:**
- Represent all stored timestamps as `DateTimeOffset` (UTC), never bare `DateTime`
- Build a standalone `SlaCalculator` service with an injectable `IBusinessCalendar` that iterates minute-by-minute (or segment-by-segment) over business windows
- Seed holidays into a `BusinessHoliday` table from day one; `IBusinessCalendar` reads it, making holidays admin-configurable (already in scope)
- Write unit tests covering: ticket opened at end-of-day, ticket opened on Wednesday before a Thursday holiday, ticket opened at exactly 17:00:00
- GST is UTC+4 with no DST — safe to hardcode the +4 offset, but store it in config not in business logic

**Warning signs:**
- `DateTime.Now` or `DateTime.UtcNow + TimeSpan` appears anywhere in SLA logic
- No `BusinessHoliday` table in the migration
- SLA unit tests only cover mid-day, mid-week scenarios

**Phase:** Address in Foundation phase when SLA entity and clock are first introduced.

---

### Pitfall 2: Workflow State Transitions Enforced Only at the API Layer, Not the Domain

**What goes wrong:**
Transition guards (`CanTransitionTo`, prerequisite checks) live only in the API controller or application service. A second code path — a background job, a bulk operation, a test helper — bypasses that layer and writes an illegal state directly via `dbContext.SaveChangesAsync()`. The ticket reaches `Onboarded` without ever being `UatActive`, breaking lifecycle invariants silently. Audit trail shows the jump but no alert fires.

**Why it happens:**
It is tempting to put all workflow logic in the controller where you first write it. The domain entity (e.g., `Ticket`) has public setters, so any code can set `Status = TicketStatus.Onboarded` without going through the state machine.

**Consequences:**
- Lifecycle prerequisite chain (Agreed → UatActive → Onboarded → Live) silently skipped
- T-02 two-phase UAT flow can be bypassed, completing tickets with no UAT signal recorded
- Audit trail shows invalid state sequences; reports are incoherent
- Bugs are invisible until a compliance review

**Prevention:**
- Remove public setters on all state fields in `Ticket` and related domain entities
- Expose only domain methods: `ticket.Transition(TargetState, currentUser)` which internally calls `WorkflowEngine.ValidateTransition()` before mutating state
- `WorkflowEngine` validates: (a) current state allows the target state, (b) all prerequisites in the correct lifecycle sequence are met, (c) the calling user's role is allowed to trigger this transition
- Never expose a `SetStatus(TicketStatus)` escape hatch, even for tests — use proper factory/builder instead
- Add an EF Core `ISaveChangesInterceptor` that asserts no `Ticket.Status` changed without a corresponding `AuditEntry` being written in the same unit of work

**Warning signs:**
- `ticket.Status = ...` assignment appears outside the domain entity
- `WorkflowEngine` is only called from the controller
- Integration tests set state directly via DbContext seed helpers

**Phase:** Address in Foundation phase (T-01 first-ticket implementation). Getting this right on T-01 means all subsequent task types inherit the correct pattern.

---

### Pitfall 3: EF Core Anemic Domain Model — Public Setters Enable Inconsistent State

**What goes wrong:**
EF Core's default convention requires a public parameterless constructor and public property setters to hydrate entities. Developers leave these defaults in place across the entire domain, meaning any code in any layer can modify any field of any entity without validation.

**Why it happens:**
EF Core's documentation examples use public setters. The path of least resistance during fast development is to keep them. Realising the problem after 10 entities and 5 task types means a painful refactor.

**Consequences:**
- Business rules (e.g., "a ticket's DueAt may not change after it is Live") are unenforceable
- Partial updates bypass domain events, so notifications are never triggered
- Audit trail misses field-level changes that happen outside the sanctioned path

**Prevention:**
- Configure EF Core to use private setters with `HasField` and `UsePropertyAccessMode(PropertyAccessMode.Field)` in `OnModelCreating`
- Use `protected` constructors for EF hydration; `internal` or `public` factory methods for application creation
- Enforce the pattern on the first entity (e.g., `Ticket`) and use it as the canonical template for all subsequent entities

**Warning signs:**
- `public set` on status, priority, dueAt, or assignee fields in domain entities
- No `HasField` or `UsePropertyAccessMode` in any `IEntityTypeConfiguration`

**Phase:** Foundation — establish the pattern on `Ticket` before writing application services.

---

### Pitfall 4: N+1 Queries on Ticket List/Queue Views

**What goes wrong:**
The team/my-queue dashboard and global search return lists of tickets. Each ticket row displays: assignee name, product, task type, status, SLA countdown, and last comment author. Without explicit `Include()` chains, EF Core lazy-loads (if enabled) or you load only the root `Ticket` and then loop through calling `.Assignee`, `.Product`, etc. — generating N+1 queries for N tickets.

**Why it happens:**
Lazy loading is easy to accidentally enable (just install `Microsoft.EntityFrameworkCore.Proxies`). Even without lazy loading, a developer adds a `.Select()` projection that references a navigation property without realising EF Core will issue a separate query per row.

**Consequences:**
- 50-ticket list view generates 250+ SQL queries
- Dashboards are slow under normal usage, not just load
- Performance cliff is invisible in development (small seed data), surfaces in production

**Prevention:**
- Disable lazy loading globally (do not install Proxies package; set `UseLazyLoadingProxies(false)` explicitly)
- All list queries must use explicit `.Include()` for navigation properties shown in the list view
- List/queue queries must project to a read-optimised DTO (`TicketSummaryDto`) using `.Select()` — never return the full entity aggregate to the API layer
- Use `AsNoTracking()` on all read-only queries (list views, reports, search)
- Add an EF Core logging call in development to log all SQL; review before any PR touching queries

**Warning signs:**
- `UseLazyLoadingProxies` appears in DbContext configuration
- Controller returns `List<Ticket>` (entity) rather than `List<TicketSummaryDto>`
- No `.AsNoTracking()` on any query method

**Phase:** Foundation — enforce on the first list endpoint; the pattern propagates automatically.

---

### Pitfall 5: BackgroundService (SLA Checker) Injects Scoped DbContext Directly

**What goes wrong:**
The SLA breach-checking `BackgroundService` is registered as a singleton (all hosted services are). If `AppDbContext` (scoped) is injected directly into the constructor, EF Core throws at startup or — worse — the same DbContext instance is reused across iterations, leading to stale change-tracker state, missed SLA checks, or DbContext disposed exceptions.

**Why it happens:**
The DI registration looks right at a glance. `services.AddHostedService<SlaCheckerService>()` plus constructor injection of `IAppDbContext` compiles fine. The lifetime mismatch is a runtime problem.

**Consequences:**
- SLA breaches not detected
- DbContext throws `ObjectDisposedException` at runtime
- In the worst case, stale data is read — tickets look on-time when they have breached

**Prevention:**
- Inject `IServiceScopeFactory` into `SlaCheckerService`, never `AppDbContext` directly
- At the top of each `ExecuteAsync` tick: `using var scope = _scopeFactory.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();`
- Write an integration test that verifies the service creates a fresh scope per execution cycle

**Warning signs:**
- `AppDbContext` or any `IRepository` appears in the constructor of a class registered with `AddHostedService`
- No `IServiceScopeFactory` usage in background service code

**Phase:** Foundation — fix before wiring up SLA background job.

---

## Moderate Pitfalls

Mistakes that cause rework or subtle bugs but are recoverable without a rewrite.

---

### Pitfall 6: JWT Fake Auth Middleware Order — UseAuthentication After UseAuthorization

**What goes wrong:**
`app.UseAuthorization()` is placed before `app.UseAuthentication()` in `Program.cs`. Every request gets a 401 even with a valid Bearer token. The ordering bug is non-obvious from the error message.

**Prevention:**
- Pipeline order must be: `UseRouting()` → `UseAuthentication()` → `UseAuthorization()` → `UseEndpoints()`
- Write a smoke integration test that calls a protected endpoint with a seeded user's token and asserts 200 before the first demo

**Warning signs:**
- 401 errors for requests with valid tokens
- `UseAuthorization` appears before `UseAuthentication` in `Program.cs`

**Phase:** Foundation — catch on first API integration test.

---

### Pitfall 7: JWT Contract Divergence Between Fake Auth and Future SSO

**What goes wrong:**
The fake JWT middleware uses claim types like `"userId"` or `"email"`. When real SSO is wired in (MVP 2), the SSO provider emits `ClaimTypes.NameIdentifier` and `ClaimTypes.Email` (standard .NET types). Every `User.FindFirst(...)` call breaks, requiring a cross-codebase search-and-replace.

**Prevention:**
- Define a `ClaimNames` static class with constants matching real SSO claim names from day one
- The fake JWT token generator must use these same constants
- Integration tests assert that `User.FindFirst(ClaimNames.UserId)` returns the expected value

**Warning signs:**
- String literals like `"userId"`, `"sub"`, `"nameidentifier"` scattered across controllers
- No single `ClaimNames` or `ClaimsHelper` abstraction

**Phase:** Foundation — nail the claim names before writing any controller that reads identity.

---

### Pitfall 8: TanStack Query Cache Key Collisions Across Products/Task Types

**What goes wrong:**
Two different screens both call `/api/tickets` but with different filter parameters. If the query key is `["tickets"]` for both, TanStack Query serves cached data from the first screen to the second. A user viewing Rabet tickets sees Rhoon ticket data after navigating. Invalidation after a mutation also invalidates the wrong query.

**Why it happens:**
Query keys start simple: `["tickets"]`. As filters are added, developers forget to include filter state in the key.

**Prevention:**
- Query key factory: `ticketKeys.list({ productCode, taskType, status, assigneeId, page })` — all filter parameters are part of the key
- Use a central `queryKeys.ts` file with typed factory functions; never inline string arrays in `useQuery` calls
- After any ticket mutation, invalidate with `queryClient.invalidateQueries({ queryKey: ticketKeys.all })` to bust all ticket-related caches

**Warning signs:**
- `useQuery({ queryKey: ["tickets"], ... })` with no filter params in the key
- Inline query key arrays that don't mirror the API request parameters

**Phase:** First frontend screen — establish the query key factory before building the second list view.

---

### Pitfall 9: Optimistic UI Updates on Ticket State Transitions Without Rollback

**What goes wrong:**
A mutation updates ticket status optimistically in the UI before the server responds. The server rejects the transition (wrong role, prerequisite not met). The `onError` callback does not restore the previous cache state, so the UI shows the invalid new state until a full refetch.

**Prevention:**
- For state transitions, do not use optimistic updates — use `isPending` state to disable the action button and show a loading indicator instead
- The latency (one API call) is acceptable; the complexity of rolling back complex multi-entity cache state is not
- Reserve optimistic updates for simple, low-risk mutations (e.g., comment posting)

**Warning signs:**
- `onMutate` with `setQueryData` for ticket status transitions
- No `onError` rollback handler paired with `onMutate`

**Phase:** Any phase implementing ticket status actions.

---

### Pitfall 10: Clean Architecture Interface-Per-Repository Over-Abstraction

**What goes wrong:**
Every entity gets `ITicketRepository`, `IUserRepository`, `IPartnerRepository`, each with 15 methods, all backed by a single EF Core implementation. This doubles the interface-maintenance surface with zero testability benefit (EF Core's in-memory provider or SQLite in-process serves as the test double more reliably).

**Why it happens:**
Clean Architecture tutorials always show the repository pattern. It feels "complete." On a hackathon timeline, the extra files eat time and produce a false sense of completeness.

**Consequences:**
- 3-4 extra files per entity, no architectural benefit for a monolith
- Adding a method to a repo requires changing interface + implementation + DI registration
- Slower velocity on hackathon timeline

**Prevention:**
- Inject `AppDbContext` directly into Application-layer handlers (via `IAppDbContext` interface for testability)
- One `IAppDbContext` interface exposing `DbSet<T>` properties is sufficient for a monolith at this scale
- Do not create per-entity repository interfaces unless a specific need emerges (e.g., a custom caching layer)

**Warning signs:**
- More than one repository interface file per entity
- `ITicketRepository.GetByIdAsync`, `ITicketRepository.GetByProductAsync`, etc. — methods that are just thin LINQ wrappers

**Phase:** Foundation — establish the `IAppDbContext` pattern on the first use case; resist adding per-entity repos.

---

### Pitfall 11: Immutable Audit Trail Broken by Cascade Deletes or Status Overwrites

**What goes wrong:**
A ticket is reassigned; the old audit entry is overwritten rather than a new entry appended. Or, a `User` record is hard-deleted and cascade deletes all `AuditEntry` rows referencing that user, destroying the audit history.

**Prevention:**
- Audit entries are append-only — no `UPDATE` or `DELETE` on `AuditEntry` rows, ever
- Soft-delete users (set `IsActive = false`) rather than hard-delete
- Configure `DeleteBehavior.Restrict` or `DeleteBehavior.SetNull` on foreign keys from `AuditEntry` to mutable entities
- Use an EF Core interceptor (`ISaveChangesInterceptor`) to automatically create audit entries on entity state changes — do not rely on callers to manually create them

**Warning signs:**
- Any code path that updates an existing `AuditEntry` record
- `OnDelete(DeleteBehavior.Cascade)` configured from `AuditEntry` to `User` or `Ticket`
- Audit entries created manually in application services rather than via interceptor

**Phase:** Foundation — interceptor-based audit must be in place before the first end-to-end test.

---

## Minor Pitfalls

---

### Pitfall 12: Ticket ID Sequence Resets After Migration Rebuild

**What goes wrong:**
The Ticket ID format `SPM-[PRODUCT]-[TASK]-[YYYYMMDD]-[SEQ]` uses a per-day, per-product-task sequence. If the sequence counter is stored in the DB and the dev environment is seeded/reset, sequence numbers restart at 1 — colliding with already-issued IDs in test data.

**Prevention:**
- Sequence is per `(ProductCode, TaskTypeCode, Date)` — store in a `TicketSequence` table with a unique constraint on that composite key
- Increment uses an atomic SQL operation (`UPDATE ... SET Seq = Seq + 1 OUTPUT INSERTED.Seq`) or EF Core `ExecuteUpdateAsync` with row-level locking
- Dev seed scripts reset the `TicketSequence` table; never share a DB environment between test runs without truncating this table

**Phase:** Foundation — implement on first ticket creation handler.

---

### Pitfall 13: File Upload Stored at Absolute Path, Breaking After App Restart on Different Machine

**What goes wrong:**
`IFileStorage` local implementation saves files to an absolute path like `C:\Tixora\uploads\`. The path is hardcoded or relative to the process working directory. After deploying to a different machine or container, uploads from a previous session are unreachable.

**Prevention:**
- Store upload path in `appsettings.json` under `FileStorage:BasePath`
- Use `Path.Combine(basePath, relativeFileName)` everywhere — never absolute or relative-to-CWD paths
- Store only the relative path in the database, never the absolute path
- This is deferred-swappable by design (`IFileStorage`) — the local implementation is the only one needed for MVP 1

**Phase:** Any phase adding file attachment features.

---

### Pitfall 14: React Router v7 Loader/Action vs. TanStack Query Double-Fetching

**What goes wrong:**
React Router v7 encourages using route `loader` functions to pre-fetch data. If TanStack Query is also used for the same data, the same API call fires twice on route entry — once in the loader, once from `useQuery`. The responses may even be out of sync.

**Prevention:**
- Pick one fetching strategy per route: either use React Router loaders OR TanStack Query `useQuery`, not both
- For Tixora: use TanStack Query exclusively for all data fetching; React Router v7 loaders are not used
- This is already implied by the PROJECT.md tech choices — make it explicit in architecture docs

**Phase:** First frontend screen — establish the pattern before building route structure.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Foundation: SLA entity + clock | UTC naive datetime, no holiday calendar | Build `SlaCalculator` with `IBusinessCalendar` from day one; unit test edge cases |
| Foundation: First ticket creation | Anemic domain model, public setters | Private setters + domain methods on `Ticket` before any application service touches it |
| Foundation: Workflow engine | Transition guards only in controller | Guards inside domain entity, enforced by `WorkflowEngine`, interceptor as second line |
| Foundation: Audit trail | Cascade deletes, manual audit writes | Append-only interceptor + `Restrict` delete behaviour |
| Foundation: Background SLA checker | Scoped DbContext in singleton | `IServiceScopeFactory` pattern, enforced by integration test |
| Foundation: Auth middleware | `UseAuthorization` before `UseAuthentication` | Smoke test on first protected endpoint |
| Foundation: JWT claims | String literals for claim names | `ClaimNames` constants class, seeded user tokens use same constants |
| Frontend: First list view | N+1 via lazy loading | `AsNoTracking` + explicit `Include` + DTO projection; lazy loading disabled globally |
| Frontend: Query keys | Cache collision across filtered views | `queryKeys.ts` factory file established before second list screen |
| Frontend: Ticket status actions | Optimistic update without rollback | Use `isPending` pattern for state transitions, not optimistic updates |
| Any ticket creation | Sequence ID collision on DB reset | `TicketSequence` table with atomic increment |
| File attachment phase | Absolute file path in storage impl | Config-driven base path, relative path stored in DB |

---

## Sources

- SLA business-hours edge cases: [Building an SLA Deadline Tracker](https://dev.to/robert_pringle_ee42391db0/building-an-sla-deadline-tracker-in-python-235i), [Microsoft Dynamics SLA time scenarios](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/sla-time-scenarios)
- EF Core anemic domain model: [3 Ways To Avoid An Anemic Domain Model in EF Core](https://www.devtrends.co.uk/blog/3-ways-to-avoid-an-anemic-domain-model-in-ef-core), [State Modelling in DDD with EF Core](https://medium.com/@vano4ok/state-modelling-in-ddd-with-entity-framework-core-c65cb8ee4a21)
- EF Core N+1: [Avoiding N+1 Queries in EF Core](https://bytecrafted.dev/posts/ef-core/n-plus-one-include-vs-splitquery/), [EF Core Performance Pitfalls](https://okyrylchuk.dev/blog/how-to-avoid-common-ef-core-performance-pitfalls/)
- Workflow state machine: [Modelling Workflows With Finite State Machines in .NET](https://www.lloydatkinson.net/posts/2022/modelling-workflows-with-finite-state-machines-in-dotnet/)
- Concurrent workflow race conditions: [Race Conditions in Workflows](https://mastermind.helpscoutdocs.com/article/564-race-conditions-in-workflows-unexpected-behavior)
- EF Core optimistic concurrency: [Handling Concurrency Conflicts - EF Core](https://learn.microsoft.com/en-us/ef/core/saving/concurrency)
- BackgroundService scoped services: [Use scoped services within a BackgroundService - Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/extensions/scoped-service), [Using Scoped Services From Singletons in ASP.NET Core](https://www.milanjovanovic.tech/blog/using-scoped-services-from-singletons-in-aspnetcore)
- JWT middleware order: [Troubleshooting JwtBearer authentication issues in ASP.NET Core](https://nestenius.se/net/troubleshooting-jwtbearer-authentication-problems-in-asp-net-core/), [ASP.NET Core JWT Authentication Guide](https://boldsign.com/blogs/aspnet-core-jwt-authentication-guide/)
- TanStack Query cache and mutations: [Query Invalidation](https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation), [Optimistic Updates](https://tanstack.com/query/v5/docs/react/guides/optimistic-updates), [Concurrent Optimistic Updates in React Query](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
- Clean Architecture over-engineering: [Is Clean Architecture Overengineering?](https://medium.com/@gunjanmodi/is-clean-architecture-overengineering-ccca6ff34dcc), [Why Most Developers Misunderstand Clean Architecture](https://dev.to/amirsaeed_skomjani/why-most-developers-misunderstand-clean-architecture-e5p)
- Hackathon scope traps: [Top 5 Mistakes Developers Make at Hackathons](https://medium.com/@BizthonOfficial/top-5-mistakes-developers-make-at-hackathons-and-how-to-avoid-them-d7e870746da1)
