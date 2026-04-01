# Architecture Patterns: Internal Ticketing System with Workflow Engine

**Domain:** Internal partner management / ticketing portal
**Researched:** 2026-04-01
**Overall confidence:** HIGH — patterns are well-established in .NET ecosystem with multiple authoritative sources

---

## Recommended Architecture

Tixora is a Clean Architecture monolith with a custom configuration-driven workflow engine. The frontend is a React SPA that communicates exclusively over REST. There is no shared code between backend and frontend at build time.

```
┌────────────────────────────────────────────────────────────┐
│  React SPA (Vite + TanStack Query)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Pages /    │  │  Query Hooks │  │  API Service     │  │
│  │  Features   │  │  (useTickets,│  │  Layer (axios)   │  │
│  │  (screens)  │→ │  useMutate…) │→ │  per domain      │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────────────┬───────────────────────────┘
                                 │ REST / JSON  (HTTP)
┌────────────────────────────────▼───────────────────────────┐
│  ASP.NET Core 8 API                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  API Layer (Controllers, Middleware, DI config)    │    │
│  │   - JWT validation middleware (fake auth MVP 1)    │    │
│  │   - Problem Details error handling                 │    │
│  │   - Route: /api/v1/[resource]                     │    │
│  └──────────────────────┬─────────────────────────────┘    │
│                         │ IRequest (MediatR)                │
│  ┌──────────────────────▼─────────────────────────────┐    │
│  │  Application Layer                                 │    │
│  │   - Commands / Queries (CQRS via MediatR)          │    │
│  │   - WorkflowEngine.cs (pure service, no lib)       │    │
│  │   - SlaCalculator.cs (business hours math)         │    │
│  │   - NotificationService.cs (in-app only)          │    │
│  │   - IFileStorage / IEmailSender abstractions       │    │
│  │   - FluentValidation pipeline behaviors            │    │
│  └──────────────────────┬─────────────────────────────┘    │
│                         │ interfaces (IRepository, IUoW)    │
│  ┌──────────────────────▼─────────────────────────────┐    │
│  │  Infrastructure Layer                              │    │
│  │   - AppDbContext (EF Core, SQL Server)             │    │
│  │   - Generic + typed Repository implementations    │    │
│  │   - Audit interceptor (SaveChanges)               │    │
│  │   - LocalFileStorage (MVP 1)                      │    │
│  │   - NoOpEmailSender (MVP 1)                       │    │
│  │   - SlaBreachMonitor (BackgroundService)           │    │
│  └──────────────────────┬─────────────────────────────┘    │
│                         │                                   │
│  ┌──────────────────────▼─────────────────────────────┐    │
│  │  Domain Layer (no dependencies)                    │    │
│  │   - Ticket aggregate + domain events               │    │
│  │   - Partner, Product, WorkflowStage entities       │    │
│  │   - WorkflowConfig value objects (seeded)          │    │
│  │   - Enums: TaskType, TicketStatus, ProductCode     │    │
│  │   - ISlaAware, IAuditTrail interfaces              │    │
│  └────────────────────────────────────────────────────┘    │
│                         │                                   │
│           SQL Server (EF Core migrations)                   │
└────────────────────────────────────────────────────────────┘
                         │
         ┌───────────────▼──────────────┐
         │  BackgroundService           │
         │  SlaBreachMonitor            │
         │  (PeriodicTimer, ~5 min)     │
         │  Uses scoped IServiceScope   │
         │  to access DbContext safely  │
         └──────────────────────────────┘
```

---

## Component Boundaries

### Domain Layer
**Responsibility:** Define what the business IS. No framework references, no IO.

| Entity / Type | Responsibility | Communicates With |
|---------------|---------------|-------------------|
| `Ticket` (aggregate root) | Owns all ticket state, raises domain events on transitions | Domain events dispatched by Infrastructure via MediatR |
| `WorkflowStage` | A single step in a task's execution sequence; holds role, SLA minutes, transition rules | Read by WorkflowEngine |
| `WorkflowConfig` | Seeded immutable rules per TaskType + ProductCode | Read by WorkflowEngine at startup |
| `Partner` | External organisation being onboarded | Referenced by Ticket |
| `AuditEntry` | Immutable record of every state change and comment | Appended by Ticket, persisted by Infrastructure |
| Enums (`TaskType`, `TicketStatus`, `ProductCode`, `AccessType`) | Shared vocabulary | Used everywhere in Domain and Application |
| Domain Events (`TicketCreated`, `TicketTransitioned`, `SlaBreached`) | Signal that something meaningful happened | Published by Ticket aggregate, consumed by Application handlers |

**Rule:** Domain layer has zero EF Core, zero MediatR, zero ASP.NET Core references. Only primitive .NET types.

---

### Application Layer
**Responsibility:** Orchestrate use cases. No HTTP, no EF Core.

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `CreateTicketCommand` / handler | Validate input, construct Ticket, persist via IUnitOfWork, raise domain events | Domain, IUnitOfWork |
| `TransitionTicketCommand` / handler | Ask WorkflowEngine for next valid stage, mutate Ticket, persist, raise domain events | WorkflowEngine, Domain, IUnitOfWork |
| `GetTicketQuery` / `GetTicketListQuery` handlers | Read-optimised projections, filtering, pagination | IReadRepository or DbContext via interface |
| `WorkflowEngine` | Given a Ticket + action, determine next stage and whether transition is allowed. Pure service. | WorkflowConfig (from IWorkflowConfigRepository), Ticket |
| `SlaCalculator` | Compute deadline and elapsed business hours for Sun-Thu 08:00-17:00 GST. Pure function. | BusinessHoursConfig, Holiday table via interface |
| `NotificationService` | Write in-app notifications for every workflow milestone | INotificationRepository |
| FluentValidation pipeline behaviours | Validate every IRequest before it reaches its handler | MediatR pipeline |
| `ValidationBehavior<TRequest, TResponse>` | Generic MediatR pipeline behaviour for validation | FluentValidation validators |

**CQRS note:** Commands mutate state, Queries only read. Commands return `Result<T>` (or `Guid` for new IDs). Queries return DTOs. Do not return domain entities from query handlers — project to DTOs in the query handler.

---

### Infrastructure Layer
**Responsibility:** Implement all interfaces declared in Application/Domain. All IO lives here.

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `AppDbContext` | EF Core DbContext. Owns all entity configurations (Fluent API). Dispatches domain events in `SaveChangesAsync`. | SQL Server, MediatR (for domain event dispatch) |
| `AuditInterceptor` | `SaveChangesInterceptor` that stamps `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy` on all IAuditTrail entities | AppDbContext |
| `GenericRepository<T>` | CRUD against AppDbContext for any entity. Never calls SaveChanges. | AppDbContext |
| `TicketRepository` | Typed repository with ticket-specific queries (by status, by assignee, by SLA breach risk) | AppDbContext |
| `UnitOfWork` | Coordinates repositories, owns `SaveChangesAsync`. Ensures atomic commits. | AppDbContext, all repositories |
| `LocalFileStorage` | Saves attachments to local filesystem. Implements `IFileStorage`. | File system (swap to blob in MVP 2) |
| `NoOpEmailSender` | Implements `IEmailSender`, does nothing. | — (swap to real sender in MVP 2) |
| `SlaBreachMonitor` | `BackgroundService` using `PeriodicTimer` (~5 min). Creates `IServiceScope` per tick to safely use DbContext. Marks breached tickets, raises domain events. | IServiceScopeFactory, AppDbContext |
| Seed data classes | Populate WorkflowConfig, Users, Products, BusinessHours on first run via EF Core `HasData` or `IDbInitializer` | AppDbContext |

---

### API Layer
**Responsibility:** HTTP concerns only. No business logic.

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `TicketsController` | Route HTTP → MediatR commands/queries. Return `ActionResult`. | MediatR `ISender` |
| `WorkflowController` | POST `/tickets/{id}/transition` — triggers `TransitionTicketCommand` | MediatR |
| `NotificationsController` | GET my notifications, POST mark-as-read | MediatR |
| JWT middleware (fake) | Validates token, sets `ClaimsPrincipal`. Identical contract to real SSO. | `ICurrentUserService` |
| `ICurrentUserService` | Extracts `UserId`, `Role` from `HttpContext.User.Claims` | Used by all command handlers |
| Global exception handler (`IProblemDetailsService`) | Translates exceptions to RFC 7807 Problem Details responses | ASP.NET Core middleware pipeline |

---

## Workflow Engine — Internal Design

The custom `WorkflowEngine` is a pure service in the Application layer. No external library.

**Data model (seeded, immutable in MVP 1):**

```
WorkflowConfig
  - TaskType (T-01 … T-04)
  - ProductCode (RBT, RHN, WTQ, MLM)
  - StageSequence[]
      - StageOrder (int)
      - StageName (string)
      - RequiredRole (enum)
      - SlaMinutes (int)
      - Transitions[]
          - TriggerAction (string, e.g. "Approve", "Reject")
          - NextStageOrder (int? null = terminal)
          - Condition (enum: None, IsApiProduct, IsBothProduct, ...)
```

**Execution pattern:**

```
TransitionTicketCommandHandler:
  1. Load Ticket (with current stage index)
  2. Load WorkflowConfig for ticket.TaskType + ticket.ProductCode
  3. Ask WorkflowEngine.GetAllowedTransitions(ticket, config, currentUser.Role)
  4. Validate: requested action is in allowed transitions
  5. Apply: ticket.Transition(nextStage) — raises TicketTransitioned domain event
  6. Recalculate SLA deadline for new stage via SlaCalculator
  7. UnitOfWork.SaveChangesAsync()
     → AppDbContext dispatches TicketTransitioned via MediatR
     → Handler writes audit entry + in-app notification
```

**T-02 two-phase special case:** WorkflowConfig has a `WaitForUatSignal` flag on the UAT-active stage. The engine does not auto-advance — a separate `SignalUatReadyCommand` triggers the transition. This is configuration data, not a code branch.

**T-03 product-driven path:** The `Condition` field on transitions routes to different next stages based on product's `AccessType`. The engine evaluates conditions at transition time from the seeded config.

---

## SLA Calculator — Internal Design

Pure static or singleton service. No database calls.

```
Input:  StartedAt (UTC), SlaMinutes (int), BusinessHoursConfig, HolidayList
Output: Deadline (UTC), ElapsedBusinessMinutes (int), IsBreached (bool)

Algorithm:
  1. Convert StartedAt to GST (UTC+4)
  2. Walk forward minute-by-minute in business time:
     - Skip weekends (Fri, Sat in UAE context — but spec says Sun-Thu so skip Fri+Sat)
     - Skip holidays (from HolidayList)
     - Skip outside 08:00-17:00
  3. Count minutes until SlaMinutes consumed
  4. Convert result back to UTC
```

**Performance note:** Minute-by-minute walk is fine for SLA windows up to ~8 hours (480 iterations max). No optimisation needed at this scale. For very large SLA windows, use a segment-skipping algorithm, but that is over-engineering for MVP 1.

---

## Data Flow

### Ticket Creation (happy path)

```
Browser → POST /api/v1/tickets
  → TicketsController.Create(dto)
  → ISender.Send(new CreateTicketCommand(dto))
  → ValidationBehavior (FluentValidation)
  → CreateTicketCommandHandler
      → Ticket.Create(taskType, productCode, partnerId, ...) — raises TicketCreated
      → SlaCalculator.ComputeDeadline(stageConfig.SlaMinutes)
      → UnitOfWork.SaveChangesAsync()
          → AppDbContext.SaveChangesAsync()
              → AuditInterceptor stamps CreatedAt/By
              → Dispatch domain events (TicketCreated)
                  → NotificationHandler writes in-app notification
                  → AuditEntryHandler appends AuditEntry
  → Returns TicketId (Guid)
  → 201 Created { id: "SPM-RBT-T01-20260401-001" }
Frontend TanStack Query:
  → useMutation onSuccess → invalidateQueries(["tickets"])
  → useTickets re-fetches → UI updates
```

### Ticket Transition

```
Browser → POST /api/v1/tickets/{id}/transition  { action: "Approve" }
  → WorkflowController.Transition(id, dto)
  → ISender.Send(new TransitionTicketCommand(id, action, currentUserId))
  → TransitionTicketCommandHandler
      → Load Ticket from DB (with current stage)
      → Load WorkflowConfig (cached, seeded)
      → WorkflowEngine.GetAllowedTransitions(ticket, config, role)
      → Validate action is allowed
      → ticket.Transition(nextStage) — raises TicketTransitioned
      → SlaCalculator.ComputeDeadline(nextStage.SlaMinutes)
      → UnitOfWork.SaveChangesAsync()
          → Domain events dispatched:
              → AuditEntry written
              → In-app notification written
              → If terminal stage: TicketCompleted event → further handlers
  → 200 OK { ticket: updated DTO }
```

### SLA Breach Detection

```
SlaBreachMonitor (BackgroundService)
  → PeriodicTimer fires every 5 minutes
  → Create IServiceScope
  → Query: tickets WHERE SlaDeadline < NOW() AND Status != Breached AND Status != Closed
  → For each: ticket.MarkBreached() — raises SlaBreached domain event
  → UnitOfWork.SaveChangesAsync()
      → SlaBreachedHandler → in-app notification to assignee + team lead
```

### Read / Query

```
Browser → GET /api/v1/tickets?status=open&assigneeId=me&page=1
  → TicketsController.List(query params)
  → ISender.Send(new GetTicketListQuery(filters, pagination))
  → GetTicketListQueryHandler
      → DbContext.Tickets
          .Where(filters)
          .OrderBy(...)
          .Select(t => new TicketSummaryDto {...})  ← project at DB level
          .Skip/Take
      → Returns PagedResult<TicketSummaryDto>
  → 200 OK { items: [...], totalCount: N, page: 1 }
Frontend:
  → useQuery(["tickets", filters]) → cached, background-refetched
```

---

## Frontend Architecture (React SPA)

### Layer structure

```
src/
  features/             ← vertical slices, one per domain area
    tickets/
      api/              ← axios calls + TanStack Query hooks
        ticketsApi.ts   ← raw axios functions (createTicket, getTicket, etc.)
        useTickets.ts   ← useQuery("tickets", ...) — list + filters
        useTicket.ts    ← useQuery(["ticket", id])
        useCreateTicket.ts  ← useMutation + invalidation
        useTransition.ts    ← useMutation for workflow transitions
      components/       ← feature-scoped UI components
      pages/            ← route-level components (TicketDetailPage, etc.)
      types.ts          ← TypeScript interfaces matching backend DTOs
    dashboard/
    partners/
    admin/
    notifications/
  lib/
    apiClient.ts        ← configured Axios instance (baseURL, auth headers, interceptors)
    queryClient.ts      ← TanStack QueryClient with default stale/retry config
  components/           ← shared design system components (Button, Badge, etc.)
  router/               ← React Router v7 route definitions
  auth/                 ← fake auth context (JWT decode, currentUser)
```

### Key patterns

**API service layer (ticketsApi.ts):**
- Pure functions, no hooks, no JSX. One file per domain.
- All calls go through the shared `apiClient` Axios instance.
- The Axios instance sets `Authorization: Bearer <token>` from localStorage/context on every request.

**Query hooks:**
- Wrap raw API functions in `useQuery` / `useMutation`.
- `queryKey` follows `["resource", id_or_filters]` convention for targeted invalidation.
- `useMutation` `onSuccess` calls `queryClient.invalidateQueries` to keep list views fresh.
- No `useEffect` + `useState` for server data anywhere.

**Optimistic updates:** Not used in MVP 1. Workflow transitions are sequential and must be confirmed by server. Use `isPending` state to disable buttons during mutation.

---

## Suggested Build Order

This order respects hard dependencies between components. Each step produces something runnable end-to-end (T-01 first strategy from PROJECT.md).

| Step | What to Build | Why First |
|------|--------------|-----------|
| 1 | Domain entities + enums + domain events (no EF) | Everything depends on Domain. Zero dependencies, fastest to write. |
| 2 | AppDbContext + EF migrations + seed data (WorkflowConfig, Users, Products) | Infrastructure depends on Domain. Can verify DB schema before writing handlers. |
| 3 | Repository + UnitOfWork implementations | Application handlers need working persistence. |
| 4 | `WorkflowEngine` + `SlaCalculator` as pure services with unit tests | These are the core logic. No EF needed. Test in isolation first. |
| 5 | `CreateTicketCommand` handler (T-01 only) + FluentValidation | Proves the full Application→Infrastructure→Domain chain. |
| 6 | `TransitionTicketCommand` handler (T-01 only) | Exercises WorkflowEngine end-to-end for T-01. |
| 7 | API Controllers (Tickets, Workflow) + fake JWT middleware | Wire the HTTP layer to working handlers. |
| 8 | React: apiClient + ticketsApi + useCreateTicket + useTransition hooks | Frontend service layer mirrors backend endpoints. |
| 9 | React: T-01 screens (ticket creation form, ticket detail, transition button) | Proves full stack end-to-end on simplest task type. |
| 10 | Expand: T-02, T-03, T-04, T-04 workflow configs (seed + handler conditional logic) | Incremental — share all infrastructure from steps 1-9. |
| 11 | Notifications, Audit Trail display, Comments, Document upload | Layer on top of working ticket lifecycle. |
| 12 | Dashboard, Search, Reports, Admin screens | Pure read/query work — no workflow complexity. |
| 13 | `SlaBreachMonitor` BackgroundService | Add after ticket lifecycle is stable. |

**Critical path:** Steps 1 → 4 → 5 → 6 → 7 → 9 (T-01 end-to-end). All other task types are additive.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Business Logic in Controllers
**What:** Transition logic, SLA math, or workflow rules in the controller action.
**Why bad:** Untestable, bypasses validation pipeline, creates fat controllers.
**Instead:** Controller sends IRequest to MediatR. All logic lives in handlers.

### Anti-Pattern 2: Calling SaveChanges Inside Repositories
**What:** `_context.SaveChangesAsync()` inside a repository method.
**Why bad:** Breaks atomicity. Two repository calls that should be one transaction become two separate commits.
**Instead:** Only `UnitOfWork.SaveChangesAsync()` commits. Repositories just track changes.

### Anti-Pattern 3: Returning Domain Entities from Query Handlers
**What:** Handler returns `Ticket` entity with navigation properties.
**Why bad:** Lazy-loading traps, over-fetching, serialization cycles, coupling the API contract to the domain model.
**Instead:** Project to `TicketDetailDto` inside the query handler using `.Select(...)` at the EF level.

### Anti-Pattern 4: Hardcoding Workflow Rules in Code Branches
**What:** `if (taskType == T02 && stage == "UatActive") { ... }` scattered in handlers.
**Why bad:** Adding a task type or product requires code changes. Impossible to add via config later.
**Instead:** WorkflowConfig seeded into DB. WorkflowEngine reads config at runtime. All branching is data.

### Anti-Pattern 5: Storing Derived SLA State
**What:** Persisting `IsBreached` as a computed column re-derived on every read.
**Why bad:** Inconsistent if background job misses a tick. Over-reliance on polling.
**Instead:** Store `SlaDeadline` (UTC). Compute `IsBreached` at query time as `SlaDeadline < DateTime.UtcNow`. Background job only updates `Status` to `Breached` for notifications — not for the display logic.

### Anti-Pattern 6: Global State in React for Server Data
**What:** Redux or Zustand store holding ticket lists that must be manually invalidated.
**Why bad:** Cache invalidation is error-prone. Leads to stale data after mutations.
**Instead:** TanStack Query owns all server state. Mutations call `invalidateQueries`. Zustand/useState only for genuine client state (e.g., currently open modal, filter panel open/closed).

### Anti-Pattern 7: EF DbContext Injected Directly into BackgroundService
**What:** `IServiceProvider` or `AppDbContext` constructor-injected into `BackgroundService`.
**Why bad:** `DbContext` is scoped, `BackgroundService` is singleton. Lifetime mismatch causes runtime exceptions or context reuse across concurrent ticks.
**Instead:** Inject `IServiceScopeFactory`. Create a new scope per timer tick. Resolve `AppDbContext` from the scope.

---

## Scalability Considerations

Tixora is internal-only. Realistic concurrent users: 5-50. These concerns are for correctness, not scale.

| Concern | MVP 1 Approach | If Scale Required (MVP 2+) |
|---------|---------------|---------------------------|
| Concurrent ticket transitions | EF Core optimistic concurrency (`RowVersion`) on Ticket | Same — already correct |
| SLA timer precision | 5-minute polling is acceptable for internal SLA windows (hours) | Reduce to 1 minute or use SQL Server scheduled jobs |
| File storage | Local disk (`wwwroot/uploads`) | Azure Blob via IFileStorage swap |
| Auth | Fake JWT, seeded users | Azure AD / SSO, same JWT contract |
| Notifications | In-process, DB-backed poll | SignalR for push if real-time needed |
| Email | NoOp | Real SMTP/SendGrid via IEmailSender swap |

---

## Key Technology Decisions with Rationale

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CQRS mediator | MediatR 12 | Pipeline behaviors for validation/logging, clean command/query split, widely supported — HIGH confidence |
| Workflow engine | Custom `WorkflowEngine.cs` | No external package per project constraint; sequential-only simplifies implementation significantly |
| Validation | FluentValidation + MediatR pipeline behavior | Validates before handler executes; readable rules; integrates with Problem Details |
| EF Core patterns | Generic repository + UnitOfWork over bare DbContext | Testability via interfaces; transaction control; avoids SaveChanges-in-repository pitfall |
| Domain events | Raised on aggregate, dispatched in `AppDbContext.SaveChangesAsync` | Keeps domain clean; events are consistent with DB state (post-commit) |
| Audit trail | `SaveChangesInterceptor` stamps all `IAuditTrail` entities | Automatic, consistent, no handler-level boilerplate |
| React state | TanStack Query for server state, no Redux | Tixora state is almost entirely server-derived; Query handles cache, loading, error |
| API client | Axios instance + domain-specific service modules | Centralized auth headers, error interceptors; clean separation from query hooks |

---

## Sources

- [Designing a Workflow Engine Database (Parts 1 & 4)](https://exceptionnotfound.net/designing-a-workflow-engine-database-part-1-introduction-and-purpose/) — MEDIUM confidence (practitioner series, not official)
- [Immediate Domain Event Salvation with MediatR — Ardalis](https://ardalis.com/immediate-domain-event-salvation-with-mediatr/) — HIGH confidence (Steve Smith, .NET architect)
- [Domain Events Design and Implementation — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation) — HIGH confidence (official Microsoft docs)
- [Implementing Infrastructure Persistence with EF Core — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-implementation-entity-framework-core) — HIGH confidence (official)
- [Background tasks with hosted services in ASP.NET Core — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services) — HIGH confidence (official)
- [Unit of Work in .NET Clean Architecture — Mykola Aleksandrov](https://www.mykolaaleksandrov.dev/posts/2025/09/unit-of-work-clean-architecture/) — MEDIUM confidence (practitioner, Sept 2025)
- [Soft Deletes in EF Core — codewithmukesh](https://codewithmukesh.com/blog/soft-deletes-efcore/) — MEDIUM confidence (well-known .NET community author)
- [TanStack Query Overview](https://tanstack.com/query/latest/docs/framework/react/overview) — HIGH confidence (official docs)
- [Path to a Clean(er) React Architecture (Part 8) — TanStack Query](https://profy.dev/article/react-architecture-tanstack-query) — MEDIUM confidence (practitioner)
- [Running Background Tasks in ASP.NET Core — Milan Jovanovic](https://www.milanjovanovic.tech/blog/running-background-tasks-in-asp-net-core) — MEDIUM confidence (well-known .NET author)
- [Modelling Workflows with Finite State Machines in .NET — Lloyd Atkinson](https://www.lloydatkinson.net/posts/2022/modelling-workflows-with-finite-state-machines-in-dotnet/) — MEDIUM confidence (2022, patterns still applicable)
