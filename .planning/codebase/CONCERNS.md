# Codebase Concerns

**Analysis Date:** 2026-04-01

## Tech Debt

### Backend Not Yet Implemented

**Area:** ASP.NET Core backend implementation
- **Issue:** Backend solution (`Tixora.sln` and project structure under `src/`) does not yet exist. Only React frontend scaffold is committed.
- **Files:** N/A (not created yet)
- **Impact:** Cannot run the API. No database schema. No authentication. All 4 implementation epics (E1-E4) are pending.
- **Fix approach:** Execute Plan 1 (Foundation) to create domain model, EF Core configuration, seed data, and basic endpoints for T-01. This is prerequisite for all other development.

### Frontend Generated from Stitch Without Integration

**Area:** Frontend codebase generation
- **Issue:** Frontend generated via Google Stitch will be scaffolded as single component tree (all screens in one file) or minimal structure. Requires significant refactoring to match planned architecture in `2026-04-01-frontend-architecture-design.md`.
- **Files:** `frontend/src/App.tsx` (currently just Vite template), entire `frontend/src/` will be regenerated
- **Impact:** Generated code may not follow the layered architecture (API client, hooks, contexts, pages, components). Will require cleanup before integrating with backend.
- **Fix approach:** After Stitch generation, refactor into planned directory structure (`api/endpoints/`, `api/hooks/`, `components/ui/`, `pages/`, `contexts/`, `types/`). Implement TanStack Query hooks, Zod validation, and error boundaries as planned.

### No Fake Auth Implementation Yet

**Area:** Authentication
- **Issue:** Fake JWT auth middleware and seeded user credentials do not exist. Plan calls for `FakeAuthMiddleware.cs` and fake login endpoint.
- **Files:** Not created (should be `src/Tixora.API/Middleware/FakeAuthMiddleware.cs`, `src/Tixora.Application/Services/AuthService.cs`)
- **Impact:** Frontend cannot authenticate against any API. No JWT token generation. MVP 1 login flow cannot work.
- **Fix approach:** Plan 1, Story 1.5 implements this. Must complete before any authenticated API testing.

### Real SSO Deferred to MVP 2

**Area:** Authentication strategy
- **Issue:** MVP 1 uses hardcoded fake users + JWT. Real SSO integration (Active Directory, OAuth) is deferred.
- **Files:** Placeholder path: `src/Tixora.Infrastructure/Auth/` (not yet created)
- **Impact:** Cannot be deployed to production. All users are seeded in database. No integration with real identity provider.
- **Fix approach:** Design SSO replacement in MVP 2. Current architecture should not depend on fake auth tokens existing; keep auth abstraction clean so replacement is straightforward.

### Email Deferred to MVP 2

**Area:** Notifications
- **Issue:** Email sending is entirely deferred. MVP 1 uses in-app notifications only. `IEmailSender` interface exists in design but no implementation.
- **Files:** Placeholder: `src/Tixora.Infrastructure/Email/SesEmailSender.cs` (designed but not implemented)
- **Impact:** Partners and internal users cannot receive email notifications. Workflow milestone notifications (stage advanced, approval needed, UAT reminder) are in-app only.
- **Fix approach:** MVP 2. Implement `SesEmailSender` or alternative. Will require `IEmailSender` dependency throughout notification service.

---

## Known Bugs

### No Known Bugs Yet

**Status:** Codebase is pre-implementation. No runtime bugs identified at this stage. Bugs will emerge during E1 execution.

---

## Security Considerations

### Fake Auth Credentials in Seed Data

**Area:** Authentication
- **Risk:** Seeded users with fake passwords will be hardcoded in database initialization code. If seed code is not removed before production, dummy credentials could allow unauthorized access.
- **Files:** `src/Tixora.Infrastructure/Seed/SeedUsers.cs` (to be created)
- **Current mitigation:** None yet. Seeding strategy not yet documented.
- **Recommendations:**
  1. Never seed fake users in production database. Use conditional seeding: only seed in Development environment.
  2. Document that seed data is for local development only.
  3. Pre-production checklist should include verification that fake seed code is never executed in production builds.

### No HTTPS Enforcement Specified

**Area:** Transport security
- **Risk:** API could be exposed over HTTP. All JWT tokens and form data would be transmitted unencrypted.
- **Files:** `src/Tixora.API/Program.cs` (not yet created)
- **Current mitigation:** None specified in technical design.
- **Recommendations:**
  1. Configure HTTPS redirection in `Program.cs` for all environments except Development.
  2. Add HSTS (HTTP Strict Transport Security) headers.
  3. Document that production deployment must use TLS 1.2+.

### No CORS Policy Defined

**Area:** Frontend-backend communication
- **Risk:** CORS configuration not documented. Could be too permissive (allow all origins) or too restrictive (break frontend).
- **Files:** `src/Tixora.API/Program.cs` (not yet created)
- **Current mitigation:** None.
- **Recommendations:**
  1. Define CORS policy explicitly in `Program.cs`:
     - Development: allow localhost:5173 (Vite default)
     - Production: allow only production frontend domain
  2. Restrict methods (GET, POST, PATCH, DELETE) explicitly.
  3. Include credentials in requests only if necessary (JWT in Authorization header, not cookies).

### No Input Validation Mentioned for File Uploads

**Area:** File handling
- **Risk:** Document upload endpoint (T-01 has upload requirements) has no size limits, MIME type checks, or scanning strategy mentioned.
- **Files:** `src/Tixora.Infrastructure/FileStorage/LocalFileStorage.cs` (designed, not implemented)
- **Current mitigation:** None specified.
- **Recommendations:**
  1. Enforce file size limit (e.g., 10 MB per file, 50 MB total per ticket).
  2. Whitelist MIME types (PDF, DOC, DOCX, images only).
  3. Scan uploaded files for malware before storage (deferred to MVP 2 if budget-constrained).
  4. Store files outside web root, serve via authenticated endpoint only.

### SQL Injection Not Addressed in Design

**Area:** Database queries
- **Risk:** Design uses EF Core (safe from SQL injection via parameterization), but custom SQL or LINQ misuse could introduce vulnerabilities.
- **Files:** All repositories in `src/Tixora.Infrastructure/Repositories/` (not yet created)
- **Current mitigation:** EF Core provides inherent protection if used correctly.
- **Recommendations:**
  1. Code review repositories to ensure no raw SQL or unsafe LINQ.
  2. Document that repositories must use EF Core query API, not `FromSql` unless absolutely necessary (and only with parameterized queries).

---

## Performance Bottlenecks

### Partner Lookup Search Not Indexed

**Area:** Database queries
- **Problem:** Partner lookup (used in new request wizard) will search by name and alias. No indexes specified in EF configuration.
- **Files:** `src/Tixora.Domain/Entities/Partner.cs`, `src/Tixora.Infrastructure/Data/Configurations/PartnerConfiguration.cs` (not yet created)
- **Cause:** Design does not specify indexes. As partner count grows (will have 200+ partners), full table scans will slow the lookup.
- **Improvement path:**
  1. Create unique index on `Partner.Alias` (if used as search key).
  2. Create non-unique index on `Partner.Name` (for LIKE queries).
  3. Example in EF config: `builder.HasIndex(p => p.Name).HasDatabaseName("IX_Partner_Name");`

### No Pagination Strategy for Large Result Sets

**Area:** API endpoints
- **Problem:** Ticket list, partner list, and search endpoints need pagination, but design does not specify page size defaults or maximum limits.
- **Files:** Controller endpoints in `src/Tixora.API/Controllers/` (not yet created)
- **Cause:** If a user requests all 1000+ tickets without pagination, API will load entire dataset into memory.
- **Improvement path:**
  1. Define default page size (e.g., 20 tickets).
  2. Define maximum page size (e.g., 100).
  3. Implement `skip` and `take` in repositories.
  4. Return `PagedResult<T>` with `totalCount`, `pageNumber`, `pageSize`, `items`.

### SLA Calculation on Every Request

**Area:** Workflow processing
- **Problem:** SLA status (OnTrack, AtRisk, Critical, Breached) is calculated in real time on every ticket read. For high-ticket-volume scenarios, this will be slow.
- **Files:** `src/Tixora.Application/Services/SlaService.cs` (not yet created)
- **Cause:** Business hours calculation is complex (Sun-Thu 08:00-17:00 GST, excluding holidays). Doing this for 100 tickets on every request is expensive.
- **Improvement path:**
  1. Cache SLA status in `SlaTracker` table. Update only when ticket status changes or stage advances.
  2. Add background job (MVP 2) to refresh SLA status hourly for in-progress tickets.
  3. Pre-calculate SLA breach thresholds at stage creation time.

### No Caching Layer for Read-Only Data

**Area:** Infrastructure
- **Problem:** Product list, user list, workflow definitions, and business hours config will be fetched from database on every request. These are static reference data.
- **Files:** `src/Tixora.Application/Services/ProductService.cs`, `src/Tixora.Application/Services/AdminService.cs` (not yet created)
- **Cause:** Design does not mention caching strategy.
- **Improvement path:**
  1. Implement in-memory cache (IMemoryCache) in Infrastructure layer.
  2. Cache products, business hours, holidays, and workflow definitions at application startup.
  3. Invalidate cache on admin updates (deferred if not implemented in MVP 1).
  4. Set reasonable TTL (e.g., 1 hour) if live updates are needed.

---

## Fragile Areas

### Workflow Engine State Machine

**Files:** `src/Tixora.Application/Services/WorkflowEngine.cs` (not yet created)
- **Why fragile:** Complex state transitions across 5 task types with different stage counts. Two-phase flow for T-02, three provisioning paths for T-03. If status enum transitions are not validated, tickets could enter invalid states (e.g., Phase2InReview without being in Phase1Complete first).
- **Safe modification:** Create a state machine validator as part of WorkflowEngine. Every transition must check:
  1. Current status is valid predecessor for requested action.
  2. Current stage can perform the requested action.
  3. Lifecycle prerequisites are met (e.g., T-02 requires T-01 completed).
  Test coverage: Cover all valid transitions + common invalid ones (e.g., skip phase, go backward).

### Ticket Lifecycle Enforcement

**Files:** `src/Tixora.Application/Services/TicketService.cs` (to be created), `src/Tixora.Domain/Entities/PartnerProduct.cs` (to be created)
- **Why fragile:** Creating tickets must check partner lifecycle state. T-01 has no prerequisite. T-02 requires T-01 completed. T-03 requires both T-02 Phase2 complete AND no other T-03 in progress. If checks are not enforced at creation, tickets could be created in wrong order.
- **Safe modification:**
  1. Create a `LifecycleValidator` service in Application layer.
  2. Call it from `TicketService.Create()` before ticket is saved.
  3. Query all prior tickets for the same partner+product and verify prerequisites.
  4. Return clear error message with current lifecycle state if prerequisite not met.
  5. Test: Verify T-02 fails when no T-01 exists. Verify T-03 PortalAndApi can only be created once per product.

### Partner-Ticket Relationship Consistency

**Files:** `src/Tixora.Domain/Entities/Partner.cs`, `src/Tixora.Domain/Entities/Ticket.cs`, `src/Tixora.Infrastructure/Data/Configurations/PartnerConfiguration.cs` (not yet created)
- **Why fragile:** Tickets reference partners. If a partner is deleted, cascading deletes could orphan audit trails and historical records. If partner lifecycle state is updated while a ticket is in progress, state could become inconsistent.
- **Safe modification:**
  1. Enforce `DELETE RESTRICT` on foreign key from Ticket to Partner (never delete partner if tickets exist).
  2. Design PartnerProduct lifecycle updates to be transactional: update state only after ticket completes, not before.
  3. Add database constraint: `UNIQUE (PartnerId, ProductCode)` for PartnerProduct (one lifecycle state per product per partner).
  4. Test: Verify deleting partner fails if tickets exist. Verify PartnerProduct state only updates on ticket completion.

### Audit Trail Immutability

**Files:** `src/Tixora.Domain/Entities/AuditEntry.cs`, `src/Tixora.Infrastructure/Data/Configurations/AuditEntryConfiguration.cs` (not yet created)
- **Why fragile:** Audit entries must be immutable (no updates after creation). If audit table allows updates, compliance and debugging history can be falsified.
- **Safe modification:**
  1. Configure EF entity to prevent updates: use `builder.HasNoKey()` or create trigger in database to prevent UPDATE.
  2. In AuditService, only insert, never update or delete.
  3. Set `CreatedAt` timestamp at creation; no `UpdatedAt` field.
  4. Test: Verify that querying for updates on AuditEntry returns zero results. Verify triggers prevent SQL UPDATE statements.

---

## Scaling Limits

### In-Memory Seed Data

**Area:** Reference data management
- **Current capacity:** 4 products, 6 users, 7 workflow definitions fit easily in memory.
- **Limit:** If products grow to 50+ or workflows to 100+, hardcoding seed data in `SeedProducts.cs` and `SeedWorkflows.cs` becomes unmaintainable.
- **Scaling path:**
  1. Move seed data to JSON or SQL script in `src/Tixora.Infrastructure/Seed/data/`.
  2. Load from file at startup instead of inline C# code.
  3. Document process for adding new products or workflows without code change.

### Single-Database SQL Server

**Area:** Database scale
- **Current capacity:** Local SQL Server for hackathon. Can handle 1000s of tickets easily.
- **Limit:** If ticket volume exceeds 100k, indexing strategy (or lack thereof) will degrade query performance. Transaction log may grow quickly.
- **Scaling path:**
  1. Implement read replicas for reporting/search queries (MVP 2+).
  2. Archive completed tickets older than 6 months to separate analytics database.
  3. Monitor database size and query execution plans monthly.
  4. Consider partitioning Ticket table by CreatedAt date if it exceeds 1M rows.

### No Async Processing for Long-Running Tasks

**Area:** Task execution
- **Current capacity:** Stage advancement, document upload, and notification creation are synchronous. Works for <10 concurrent requests.
- **Limit:** If multiple users advance tickets simultaneously, API threads could be blocked waiting for I/O (database writes, file storage, future email sends).
- **Scaling path:**
  1. Implement background job queue (MVP 2) for email, notifications, file scans.
  2. Use `BackgroundService` (built-in, no external package) for SLA status refresh and UAT reminders.
  3. Document current synchronous behavior as MVP 1 limitation.

### Frontend Bundle Size Not Addressed

**Area:** Frontend build
- **Current capacity:** Empty Vite scaffold. No chunks, code splitting, or lazy loading yet.
- **Limit:** Once all pages, forms, and components are generated from Stitch and integrated, bundle could exceed 500 KB (uncompressed). Slow on 3G networks.
- **Scaling path:**
  1. Implement route-based code splitting in React Router (each page is separate chunk).
  2. Lazy-load admin pages (rarely visited).
  3. Monitor bundle size as part of build process (`vite-plugin-visualizer`).
  4. Target: <200 KB gzipped for initial bundle (excluding React, React DOM).

---

## Dependencies at Risk

### Outdated Package Versions

**Area:** Frontend dependencies
- **Risk:** `vite@^8.0.1` is outdated (current is v6.x). No TypeScript version specified (major versions could break).
- **Impact:** May not install correctly or have unresolved peer dependencies.
- **Files:** `frontend/package.json`
- **Migration plan:**
  1. Run `npm audit` and resolve any vulnerabilities immediately.
  2. Use `npm ci` (not `npm install`) in CI/CD to lock exact versions.
  3. Update Vite to latest stable (v6.x) and test HMR.
  4. Pin TypeScript to ~5.9.3 as specified.

### No Backend Dependencies Listed

**Area:** .NET packages
- **Risk:** Design specifies EF Core, BCrypt.Net, and JWT libraries, but no versions or package names finalized.
- **Impact:** Plan 1 execution may discover missing or incompatible versions.
- **Migration plan:**
  1. Create `global.json` to lock .NET SDK version (e.g., 10.0.0).
  2. Document all NuGet package versions in Plan 1 acceptance criteria.
  3. Use `Directory.Packages.props` for centralized package version management.

---

## Missing Critical Features

### No Workflow Versioning

**Area:** Workflow configuration
- **Problem:** If workflow definition is changed after a ticket is created, ticket still follows old workflow. No way to view what workflow version a ticket used.
- **Blocks:** Long-running tickets (T-02 two-phase) could be stranded if workflow is changed mid-process.
- **Fix approach:** MVP 2. Add `WorkflowDefinition.Version` field. Ticket references specific version ID, not latest. Archive old workflow versions.

### No Bulk Operations

**Area:** Admin operations
- **Problem:** Cannot reassign 10 tickets at once, or update SLA thresholds for all products at once. Admin must do one at a time.
- **Blocks:** Operational efficiency for administrators.
- **Fix approach:** MVP 2. Add bulk endpoint for common operations (reassign, archive, report generation).

### No Offline Draft Saving

**Area:** Frontend forms
- **Problem:** If browser crashes or network drops mid-request, unsaved form data is lost. No way to resume filling out a complex 4-step request wizard.
- **Blocks:** Better UX for partners and requesters on unreliable networks.
- **Fix approach:** MVP 2. Implement localStorage caching of form state. Auto-save to draft on server (requires new `TicketStatus: Draft`).

---

## Test Coverage Gaps

### No Frontend Tests

**Area:** React components
- **What's not tested:** All UI components. No unit tests for Form validation (Zod + React Hook Form). No integration tests for API calls (TanStack Query).
- **Files:** `frontend/src/**/*.tsx` (entire codebase once generated)
- **Risk:** Bug in Dashboard card layout, broken form validation, or incorrect API call formatting will only be discovered during manual QA.
- **Priority:** High — UI is customer-facing. Validation errors and API mismatches are high-visibility bugs.
- **Recommendation:** Add Jest + React Testing Library. Target: >60% coverage for critical paths (login, new request, ticket detail). Defer tests for admin pages to MVP 2.

### No Backend Integration Tests for Epics E2-E4

**Area:** .NET integration tests
- **What's not tested:** Plan 1 (E1) calls for basic tests, but E2 (full lifecycle), E3 (SLA, notifications), and E4 (admin, reports) have no test plan.
- **Files:** `tests/Tixora.API.Tests/` (to be created)
- **Risk:** E2-E4 features (T-02 two-phase, T-03 provisioning paths, SLA calculations) could be partially broken and only discovered in manual testing.
- **Priority:** High — E2-E4 are business-critical workflows.
- **Recommendation:** Each epic plan should include test stories. Minimum: 2 happy path + 1 edge case per task type. Use xUnit + Moq. Target: >80% coverage for workflow and lifecycle logic.

### No Performance Tests

**Area:** Load testing
- **What's not tested:** How the API performs with 100 concurrent requests. Whether SLA calculations scale. Whether search queries timeout with 10k tickets.
- **Files:** N/A (no load tests exist)
- **Risk:** System could be slow in production but seem fine in development with 5 sample tickets.
- **Priority:** Medium — low impact for MVP 1 (internal use, <20 concurrent users expected), but high for production.
- **Recommendation:** After E3, add basic load test: 50 concurrent users creating and updating tickets for 5 minutes. Monitor response times and database CPU.

### No Security Tests

**Area:** Authorization and access control
- **What's not tested:** Can user view tickets assigned to others? Can Reviewer skip Approval stage? Can ProvisioningAgent modify workflow definitions?
- **Files:** All API controllers (not yet created)
- **Risk:** Authorization bypass allows privilege escalation.
- **Priority:** High — security critical.
- **Recommendation:** Add authorization tests for every controller action. For each role, test allowed and forbidden operations. Example: `[Fact] public void ReviewerCannotApprove() { /* verify 403 */ }`

---

## Architectural Concerns

### No Explicit Dependency Injection Configuration Documented

**Area:** DI container setup
- **Problem:** Design specifies `Program.cs` wires all layers, but no specific guidance on service lifetimes (Transient vs. Scoped vs. Singleton).
- **Files:** `src/Tixora.API/Program.cs` (not yet created)
- **Impact:** Incorrect lifetimes could cause state leakage between requests (e.g., Singleton repository shares database connection across all requests).
- **Recommendation:** Document in Plan 1:
  - Repositories: Scoped (new instance per request).
  - Services (WorkflowEngine, SlaService, etc.): Scoped.
  - Utilities (logging, time provider): Singleton.
  - DbContext: Scoped (EF Core default).

### No Error Code System

**Area:** API error handling
- **Problem:** Design specifies `{ error, details }` response format, but no error codes or documentation for developers.
- **Files:** `src/Tixora.API/Middleware/ErrorHandlingMiddleware.cs` (not yet created)
- **Impact:** Frontend cannot distinguish between "validation failed" (400) and "partner not found" (404) without parsing error message string.
- **Recommendation:** Define error codes (e.g., `ERR_PARTNER_NOT_FOUND`, `ERR_LIFECYCLE_PREREQUISITE_NOT_MET`, `ERR_TICKET_ALREADY_CLOSED`). Return in response:
  ```json
  { "code": "ERR_LIFECYCLE_PREREQUISITE_NOT_MET", "message": "T-02 requires T-01 completed" }
  ```

### No API Versioning Strategy

**Area:** API stability
- **Problem:** No versioning scheme (URL path `/api/v1/`, header, or query param). If API changes in MVP 2, will break frontend.
- **Files:** Controller routing in `src/Tixora.API/Controllers/` (not yet created)
- **Impact:** Cannot evolve API without breaking clients.
- **Recommendation:** Use URL path versioning (`/api/v1/tickets`, not just `/api/tickets`). Plan for `/api/v2/` in MVP 2 if needed.

---

*Concerns audit: 2026-04-01*
