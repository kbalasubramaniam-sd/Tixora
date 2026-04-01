# Coding Conventions

**Analysis Date:** 2026-04-01

## Naming Patterns

**Files:**
- C# classes: PascalCase (e.g., `TicketService.cs`, `CreateTicketValidator.cs`)
- DTOs: Suffix pattern — `CreateTicketRequest.cs`, `TicketDetailResponse.cs`, `PagedResult.cs`
- Repositories: `[Entity]Repository.cs` (e.g., `TicketRepository.cs`, `PartnerRepository.cs`)
- React components: PascalCase (e.g., `App.tsx`)
- React utilities/hooks: camelCase prefix with .ts extension (e.g., `useTicketFetch.ts`)
- Test files: `[FileName].Tests` for C# projects, co-located with source

**Functions:**
- C# methods: PascalCase (public/internal), camelCase (private)
- React components: PascalCase for exported components
- JavaScript/TypeScript: camelCase for functions and handlers
- Async methods: Suffix `Async` (e.g., `GetTicketsAsync`, `CreateTicketAsync`)

**Variables:**
- C# local variables: camelCase
- C# fields: camelCase with underscore prefix for private (e.g., `_ticketRepository`)
- TypeScript/JavaScript: camelCase throughout
- Constants: UPPER_SNAKE_CASE (rare — prefer named constants in enums)

**Types:**
- C# enums: PascalCase (e.g., `ProductCode`, `TicketStatus`, `StageAction`)
- C# interfaces: `I` prefix (e.g., `ITicketRepository`, `ITicketService`)
- TypeScript interfaces: PascalCase, no I prefix
- Domain value objects: PascalCase (e.g., `TicketId`, `BusinessHours`)

## Code Style

**Formatting:**
- C#: Target .NET 8, standard Microsoft conventions
- TypeScript/React: Configured via `eslint.config.js` and `tsconfig.app.json`
- Line endings: LF (Unix)
- Indentation: 2 spaces (frontend), 4 spaces (backend convention)

**Linting:**
- Frontend: ESLint with TypeScript support
  - Config: `frontend/eslint.config.js`
  - Rules: React hooks, React refresh, TypeScript recommended
  - Commands: `npm run lint` in `frontend/`
- Backend: .NET code analysis (StyleCop implied via Clean Architecture best practices)

**TypeScript Strictness:**
- Target: `ES2023`
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

## Import Organization

**Order (C#):**
1. System namespaces
2. Third-party namespaces
3. Application namespaces (Domain → Application → Infrastructure)

**Order (TypeScript/React):**
1. React core imports
2. Third-party dependencies
3. Internal imports (components, utils, assets)
4. CSS/style imports last

**Path Aliases:**
- Frontend: None configured yet (standard relative imports)
- Backend: Clean Architecture layer separation enforces dependency flow

## Error Handling

**Patterns:**
- C# Backend: Try-catch in Application layer services, propagate domain exceptions
- Exceptions: Domain-specific exceptions inherit from `ApplicationException`
- Validation: FluentValidation for TicketValidator, StageActionValidator (planned)
- HTTP responses: Consistent ApiResponse wrapper with status codes
- Frontend: Error boundaries for React components, try-catch in async operations

**No throwing exceptions from:**
- Domain entities directly (use result objects or return false)
- Controllers (handled by ErrorHandlingMiddleware)

**Validation occurs at:**
- Application layer: DTOs validated before service calls
- Domain layer: Entity invariants checked in constructors
- API layer: FluentValidation rules applied to request objects

## Logging

**Framework:** Console (in-app notifications only for MVP 1; email deferred to MVP 2)

**Patterns:**
- C#: ILogger<T> injected into services
- Log levels: Information (standard flow), Warning (SLA approaching), Error (validation/processing failures)
- Audit trail: AuditService records all state changes append-only in AuditEntry

**What to log:**
- Ticket creation, status transitions, stage advances
- SLA warnings (75%, 90%, breach)
- Validation failures, rejections, reassignments
- User actions via ActorUserId in StageLog

**NOT logged:**
- Full FormData (too large — log summary only)
- Personal credentials (passwords, API keys)

## Comments

**When to Comment:**
- Business rule enforcement in WorkflowEngine (complex stage transitions)
- Non-obvious algorithm logic (e.g., SLA calculation across business hours)
- Workarounds for product-specific behavior (per TaskType or ProductCode)
- TODO: Defer to MVP 2 (mark with // TODO: MVP2 — [reason])

**JSDoc/TSDoc:**
- C#: XML documentation on public methods/classes (e.g., `/// <summary>...</summary>`)
- TypeScript: JSDoc for exported functions/components
- Example (C#):
  ```csharp
  /// <summary>
  /// Advances ticket through workflow stages based on stage definition and action.
  /// </summary>
  /// <param name="ticketId">Ticket GUID</param>
  /// <param name="stageAction">Action to perform (Approve, Reject, etc.)</param>
  /// <returns>Updated ticket with new stage</returns>
  public async Task<Ticket> AdvanceStageAsync(Guid ticketId, StageAction stageAction)
  ```

## Function Design

**Size:** 
- Target: Single responsibility, max 30 lines (logic-heavy methods)
- Shorter preferred for async operations and I/O

**Parameters:**
- Max 3 positional parameters; use DTOs or objects for more
- No boolean flags (use enum or separate methods)
- Example: `CreateTicket(Guid partnerId, CreateTicketRequest request, Guid userId)` ✓
- Avoid: `CreateTicket(Guid partnerId, bool isUrgent, bool validateOnly)` ✗

**Return Values:**
- Service layer: `Task<T>` for async, concrete objects (not null returns)
- Repository layer: `IAsyncEnumerable<T>` for lists, `Task<T?>` for single lookups
- Controllers: `IActionResult` or `ActionResult<T>`

## Module Design

**Exports:**
- C#: Public interfaces exposed, concrete implementations internal to layer
- TypeScript: Named exports for components, default export for Page components
- React: Export component, not hooks directly (wrap in custom hook first)

**Barrel Files:**
- Not used in frontend yet
- When added: Use `index.ts` to re-export from feature directories

**Layer Exports:**
- Domain: Entities, enums, value objects, interfaces (no logic)
- Application: Services, DTOs, validators, interfaces
- Infrastructure: Repository implementations (behind interfaces)
- API: Controllers, middleware, Program.cs configuration

## Generic Naming Philosophy

Per project conventions: Use clear, plain language over technical jargon.

**Examples:**
- Ticket instead of Request or Incident
- Stage instead of Workflow Node or Activity
- Partner instead of Customer or Client
- Approver instead of Decision Maker

**Avoid:**
- Abbreviated entity names (use full `Ticket`, not `Tkt` or `Req`)
- Generic suffixes (Util, Helper, Manager) without context
- Hungarian notation (`sName`, `iCount`)

## Clean Architecture Dependency Rules

**Enforced via project references:**

```
Domain (no dependencies)
   ↑
Application (depends on Domain only)
   ↑
Infrastructure (depends on Application + Domain)
   ↑
API (depends on all layers)
```

**Import restriction:**
- `Tixora.Domain` → nothing
- `Tixora.Application` → `Tixora.Domain`
- `Tixora.Infrastructure` → `Tixora.Application`, `Tixora.Domain`
- `Tixora.API` → any layer (orchestration layer)

**Violate at risk of architectural decay:**
- Infrastructure services never instantiate controllers
- Domain entities never reference services or repositories
- Application services never reference controllers

---

*Convention analysis: 2026-04-01 | Based on CLAUDE.md and technical design spec*
