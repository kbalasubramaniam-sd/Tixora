# Technology Stack

**Project:** Tixora — Internal Partner Management Portal
**Researched:** 2026-04-01
**Overall confidence:** HIGH (all recommendations verified against NuGet/npm/official docs)

---

## Recommended Stack

### Backend: ASP.NET Core (.NET 8)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| .NET | 8.0 (LTS) | Runtime | LTS release, supported until Nov 2026. Non-negotiable per project constraints. |
| ASP.NET Core Web API | 8.0 | HTTP layer | Built-in, minimal controllers + route groups for clean endpoint organization. |
| Entity Framework Core | **9.x** | ORM | EF Core 9 targets .NET 8, produces cleaner SQL than EF 8, no-cost upgrade. See note. |
| Microsoft.EntityFrameworkCore.SqlServer | 9.x | SQL Server provider | Matches EF Core version. |
| Microsoft.EntityFrameworkCore.Tools | 9.x | Migration tooling | CLI migration support (dotnet ef). |

**EF Core 8 vs 9 note:** EF Core 9 runs on .NET 8 and adds meaningful query improvements (cleaner SQL, better JSON support). No breaking changes affect this project's use cases. Use 9.x.

---

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Microsoft.AspNetCore.Authentication.JwtBearer | 8.0.x | JWT validation middleware | Built into ASP.NET Core ecosystem, zero extra dependencies. |
| System.IdentityModel.Tokens.Jwt | 7.x | Token generation | Token signing/validation in the fake auth service. |

**Pattern:** Implement `ITokenService` in Infrastructure. Seed 5–10 users in `DbContext.OnModelCreating` via `HasData` with `PasswordHasher`. Generate real JWTs (HS256, configurable secret) so the contract is identical to what a real SSO will produce. No ASP.NET Core Identity — that's heavyweight and adds migration noise for a fake-auth scenario.

**Do not use:** ASP.NET Core Identity (`Microsoft.AspNetCore.Identity.EntityFrameworkCore`). It adds 15+ migration tables, role managers, user managers, and claim transformations you will never use. The swap to SSO in MVP 2 replaces the token generation code, not the JWT validation middleware.

---

### Mediation / CQRS

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| MediatR | **12.5.0** | Command/query dispatch | Decouples controllers from use cases. v12 drops the separate DI extensions package — register with `builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(...))`. |
| MediatR pipeline behaviors | (included) | Cross-cutting concerns | Use pipeline behaviors for validation (FluentValidation), logging, and performance timing. Cleaner than action filters. |

**Why MediatR over direct service injection:** Clean Architecture with handlers means each use case (CreateTicket, AssignTicket, etc.) is an isolated unit. This pays dividends with 5 task types × multiple workflow stages. Direct service injection leads to bloated application service classes.

---

### Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| FluentValidation | **12.x** | Request validation | v12 is the current major release (AutoMapper controversy does not affect FV). Pair with a MediatR `ValidationBehavior` pipeline behavior to auto-validate all commands before handlers run. |

**Do not use:** Data Annotations (`[Required]`, `[MaxLength]`). They scatter validation logic across DTOs and cannot express cross-field rules or conditional logic needed for T-02/T-03 task types.

---

### Object Mapping

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Riok.Mapperly | **4.3.1** | Domain → DTO mapping | Source-generated mapping: zero runtime reflection, compile-time errors when mapping is incomplete, readable generated code. Correct choice given AutoMapper went commercial (April 2025) and Mapster development is stalled. |

**Why not AutoMapper:** Jimmy Bogard made AutoMapper commercial on 16 April 2025. Not suitable for an open/hackathon project going forward.
**Why not Mapster:** Maintenance has stalled; last meaningful release is months old with open issues unaddressed.
**Why Mapperly:** Active development, source-generator approach, NuGet 4.3.1 current as of research date. Only downside is slightly more verbose mapper class declarations — acceptable tradeoff.

---

### Logging

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Serilog.AspNetCore | **10.0.0** | Structured logging | Two-stage bootstrap pattern ensures startup errors are captured before DI is configured. JSON-structured output. Replaces default Microsoft logging. |
| Serilog.Sinks.Console | latest | Dev output | Human-readable dev output. |
| Serilog.Sinks.File | latest | File output | Rolling file sink for production diagnostics without external infra. |

---

### Real-Time Notifications

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Microsoft.AspNetCore.SignalR | 8.0.x (built-in) | Push notifications to browser | Built into ASP.NET Core — no extra NuGet package needed for the hub. Use `IHubContext<NotificationHub>` to push from domain events or workflow transitions. |
| @microsoft/signalr | 8.0.x (npm) | React client | Official JS client for SignalR hubs. |

**Pattern:** `NotificationHub` with user-scoped groups (by UserId). Inject `IHubContext<NotificationHub>` into the workflow engine to push milestone events. This satisfies "in-app notifications at every workflow milestone" without polling.

**Alternative considered:** Server-Sent Events (SSE) — simpler but unidirectional and harder to scope per-user. SignalR with WebSocket transport is the standard for this pattern.

---

### Background Services (SLA Tracking)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `BackgroundService` (built-in) | .NET 8 | SLA breach scanning | Zero external dependencies. `PeriodicTimer` (introduced .NET 6) is the modern replacement for `System.Threading.Timer` — does not block thread pool between ticks. |

**Pattern:**
```csharp
public class SlaMonitorService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            // Query open tickets past SLA deadline, update status, push notification
        }
    }
}
```

**Do not use:** Hangfire, Quartz.NET. Project constraints explicitly prohibit external background job packages. `BackgroundService` + `PeriodicTimer` covers the single use case (periodic SLA scan).

---

### API Documentation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Scalar.AspNetCore | latest | OpenAPI UI | Microsoft deprecated Swashbuckle for .NET 9+ but it works for .NET 8. Scalar is the new preferred UI for OpenAPI specs generated by `Microsoft.AspNetCore.OpenApi` (built-in .NET 9, backported). Use for development only. |

**Alternative:** Swashbuckle.AspNetCore 6.x still works for .NET 8 and has more community resources. Either is acceptable — Scalar is the forward direction.

---

### Test Data Seeding

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Bogus | **35.6.5** | Deterministic fake data generation | Generates realistic partner names, email addresses, ticket content for dev/staging seeds. Integrates directly with EF Core `HasData` via `Faker<T>` with fixed seeds for reproducibility. |

---

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| SQL Server 2022 (or Azure SQL) | -- | Primary data store | Non-negotiable per constraints. |
| EF Core migrations | (part of EF) | Schema management | Code-first migrations, versioned in source control. Run via `dotnet ef database update` in dev, migration bundle in production. |

**Indexing guidance:** Add indexes at migration time for: `Tickets.Status`, `Tickets.AssignedToId`, `Tickets.ProductCode`, `Tickets.CreatedAt`. These drive the dashboard queries and search. Do not defer indexing — retrofitting on a filled table is painful.

---

## Frontend Stack

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | **19.x** | UI framework | Already scaffolded. React 19 ships with improved compiler (React Compiler beta), better concurrent features. |
| Vite | **6.x** | Build tooling | Fast HMR, native ESM, first-class React support. Standard for new React SPAs in 2025. |
| TypeScript | **5.x** | Type safety | Non-negotiable for a multi-developer portal with complex domain types. |
| React Router | **v7** (Library Mode) | Client-side routing | Use Library Mode (not Framework Mode) — this is a pure SPA calling a separate .NET API. Framework Mode adds SSR complexity that provides zero benefit here. Install: `react-router-dom`. |
| TanStack Query | **v5 (5.96+)** | Server state management | Almost all Tixora state is server-driven. TanStack Query handles caching, background refetch, loading/error states, and cache invalidation after mutations. Eliminates custom fetch/loading/error state boilerplate across 14+ screens. |
| Tailwind CSS | **v4.x** | Utility-first styling | v4 drops `tailwind.config.js` for most use cases — configure via CSS `@theme {}` block. Install via `@tailwindcss/vite` Vite plugin. Stitch design tokens map directly to Tailwind theme variables. |
| Radix UI Primitives | **1.x** (`@radix-ui/*`) | Accessible headless components | Unstyled, accessible-by-default primitives (Dialog, Dropdown, Select, Tooltip, etc.). Pair with Tailwind for styling. Use individual `@radix-ui/react-*` packages, not the `radix-ui` umbrella package (umbrella is v1.4.3 but individual packages are more granular and composable). |
| React Hook Form | **7.x** | Form state management | 7M+ weekly downloads, minimal re-renders, uncontrolled inputs. Better choice than TanStack Form here — community maturity, simpler API, no lock-in to TanStack ecosystem. Forms in Tixora are moderately complex (not deeply nested dynamic forms) so the added complexity of TanStack Form is not justified. |
| Zod | **3.x** | Schema validation (frontend) | Integrates with React Hook Form via `@hookform/resolvers/zod`. Define validation schemas once, reuse across form and API boundary parsing. |
| @microsoft/signalr | **8.0.x** | Real-time notification client | Matches the .NET SignalR hub version. |
| Lucide React | latest | Icon set | Clean, consistent icon library. Minimal bundle size per-icon. Avoid react-icons (too large) or heroicons (requires additional config). |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Object mapping | Mapperly 4.3.1 | AutoMapper | Commercial since April 2025 |
| Object mapping | Mapperly 4.3.1 | Mapster | Stalled development, uncertain future |
| Validation | FluentValidation 12 | Data Annotations | Cannot express conditional/cross-field rules |
| Background jobs | BackgroundService | Hangfire / Quartz.NET | Explicit constraint: no external workflow/job packages |
| Workflow engine | Custom WorkflowEngine.cs | Elsa Workflows / MassTransit Saga | Explicit constraint: no external workflow packages |
| Auth | Fake JWT (custom) | ASP.NET Core Identity | 15+ schema tables for a fake-auth scenario is noise |
| Auth | Fake JWT (custom) | OpenIddict | Over-engineering; same contract requirement means a simple token service suffices |
| Frontend routing | React Router v7 (Library) | TanStack Router | React Router is already decided; TanStack Router adds no value over RR v7 Library Mode for a pure SPA |
| Frontend forms | React Hook Form | TanStack Form | TanStack Form is newer, less mature, smaller community; RHF is proven for this complexity level |
| API docs | Scalar | Swashbuckle | Swashbuckle is deprecated for .NET 9+; Scalar is the forward path |
| Real-time | SignalR | Server-Sent Events | SSE is unidirectional; SignalR handles per-user scoping cleanly |
| Icons | Lucide React | Heroicons / react-icons | react-icons bundles everything; heroicons requires extra setup |

---

## Installation Reference

### Backend (add to each project as appropriate)

```bash
# Application layer
dotnet add package MediatR --version 12.5.0
dotnet add package FluentValidation --version 12.*
dotnet add package Riok.Mapperly --version 4.3.1

# Infrastructure layer
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 9.*
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 9.*
dotnet add package System.IdentityModel.Tokens.Jwt --version 7.*
dotnet add package Bogus --version 35.*

# API layer
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.*
dotnet add package Serilog.AspNetCore --version 10.0.0
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File
# SignalR is built-in to Microsoft.AspNetCore.App — no extra package
```

### Frontend

```bash
# Core
npm install react-router-dom @tanstack/react-query @tanstack/react-query-devtools

# UI
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select \
  @radix-ui/react-tooltip @radix-ui/react-tabs @radix-ui/react-popover \
  @radix-ui/react-checkbox @radix-ui/react-switch lucide-react

# Forms
npm install react-hook-form zod @hookform/resolvers

# Real-time
npm install @microsoft/signalr

# Dev dependencies
npm install -D @tailwindcss/vite tailwindcss typescript @types/react @types/react-dom
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| EF Core 9 on .NET 8 | HIGH | Confirmed via Microsoft docs: EF Core 9 targets netstandard2.0 + net8.0 |
| MediatR 12.5.0 | HIGH | Confirmed via NuGet.org, released 2025-04-01 |
| FluentValidation 12.x | HIGH | Confirmed via NuGet.org (12.1.1 current) |
| Mapperly 4.3.1 | HIGH | Confirmed via NuGet.org |
| AutoMapper commercial | HIGH | Jimmy Bogard announcement April 2025, multiple sources |
| Mapster stalled | MEDIUM | Multiple community reports, no recent release activity confirmed |
| Serilog.AspNetCore 10.0.0 | HIGH | Confirmed via NuGet.org |
| React 19 / Vite 6 | HIGH | Scaffolded already per PROJECT.md |
| TanStack Query v5.96+ | HIGH | Confirmed via npm and TanStack docs |
| Tailwind v4 via @tailwindcss/vite | HIGH | Official Tailwind docs confirm v4 Vite plugin approach |
| React Router v7 Library Mode | HIGH | Official React Router docs confirm two modes |
| React Hook Form over TanStack Form | MEDIUM | Community consensus + download stats; TanStack Form is maturing but not yet the default choice |
| Radix UI individual packages | HIGH | Confirmed via npm (radix-ui umbrella 1.4.3, individual packages active) |
| SignalR built-in | HIGH | Part of Microsoft.AspNetCore.App shared framework in .NET 8 |

---

## Sources

- [What's New in EF Core 9 — Microsoft Learn](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-9.0/whatsnew)
- [MediatR 12.5.0 — NuGet Gallery](https://www.nuget.org/packages/MediatR/12.5.0)
- [FluentValidation 12.1.1 — NuGet Gallery](https://www.nuget.org/packages/fluentvalidation/)
- [Riok.Mapperly 4.3.1 — NuGet Gallery](https://www.nuget.org/packages/Riok.Mapperly)
- [Serilog.AspNetCore 10.0.0 — NuGet Gallery](https://www.nuget.org/packages/serilog.aspnetcore)
- [Bogus 35.6.5 — NuGet Gallery](https://www.nuget.org/packages/Bogus)
- [TanStack Query v5 — Official Docs](https://tanstack.com/query/v5/docs/framework/react/overview)
- [Tailwind CSS v4.0 — Official Blog](https://tailwindcss.com/blog/tailwindcss-v4)
- [Radix UI Primitives — npm](https://www.npmjs.com/package/radix-ui)
- [React Router Modes — reactrouter.com](https://reactrouter.com/start/modes)
- [AutoMapper vs Mapster — Code Maze](https://code-maze.com/automapper-vs-mapster-dotnet/)
- [AutoMapper went commercial — Medium](https://medium.com/@dino.cosic/automapper-is-now-commercial-should-net-developers-switch-to-mapster-25445581d38c)
- [TanStack Form vs React Hook Form — LogRocket](https://blog.logrocket.com/tanstack-form-vs-react-hook-form/)
- [Background tasks with hosted services — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services?view=aspnetcore-8.0)
