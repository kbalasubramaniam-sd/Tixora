# Architecture

**Analysis Date:** 2026-04-01

## Pattern Overview

**Overall:** Clean Architecture Monolith (backend) + React SPA Frontend (separate build)

**Key Characteristics:**
- Strict layering: Domain → Application → Infrastructure → API (backend dependencies flow inward only)
- Backend and frontend deployed separately
- Frontend built via Google Stitch, then deployed independently of .NET solution
- Workflow engine custom-built (no external packages), rules seeded at startup
- Product-level configuration drives variation (no per-ticket toggles)
- All users internal employees; fully internal portal

## Layers

### Domain Layer
**Location:** `Tixora.Domain/` (backend only)

**Purpose:** Core business models, enums, value objects, and domain events. No dependencies on other layers.

**Contains:**
- Entities: Product, Partner, PartnerProduct, Ticket, StageLog, AuditEntry, SlaTracker, Document, Comment, Notification, FulfilmentRecord, User, DelegateApprover, WorkflowDefinition, StageDefinition, BusinessHoursConfig, Holiday, SavedFilter
- Enums: ProductCode (RBT, RHN, WTQ, MLM), TaskType (T01-T05), ProductAccessMode, ProvisioningPath, TicketStatus, LifecycleState, StageType, StageAction, SlaStatus, UserRole, NotificationType, IssueType
- Value Objects: TicketId, BusinessHours
- Repository Interfaces: ITicketRepository, IPartnerRepository, IUserRepository, IWorkflowRepository, IAuditRepository, INotificationRepository, ISlaRepository

**Depends on:** Nothing

**Used by:** Application, Infrastructure, API

### Application Layer
**Location:** `Tixora.Application/` (backend only)

**Purpose:** Use cases, business logic orchestration, DTOs, validators, service interfaces. Coordinates domain logic with infrastructure.

**Contains:**
- Services: TicketService, WorkflowEngine, SlaService, LifecycleService, NotificationService, AuditService, PartnerService, SearchService, ReportService, AdminService
- DTOs: Tickets (CreateTicketRequest, TicketDetailResponse, TicketListResponse, StageActionRequest, FulfilmentRequest, ReRaiseRequest), Partners, Auth, Comments, Notifications, Search, Reports, Admin, Common
- Service Interfaces: ITicketService, IWorkflowEngine, ISlaService, ILifecycleService, INotificationService, IAuditService, IEmailSender, IFileStorage
- Validators: CreateTicketValidator, StageActionValidator

**Depends on:** Domain

**Used by:** Infrastructure, API

### Infrastructure Layer
**Location:** `Tixora.Infrastructure/` (backend only)

**Purpose:** Data persistence, external service implementations, database configuration, seed data.

**Contains:**
- **Data/:** AppDbContext, EF Core migrations, entity configurations (ProductConfiguration, PartnerConfiguration, TicketConfiguration, etc.)
- **Repositories/:** Repository implementations (TicketRepository, PartnerRepository, UserRepository, WorkflowRepository, AuditRepository, NotificationRepository, SlaRepository)
- **Email/:** SesEmailSender (AWS SES, MVP 2), EmailTemplates
- **FileStorage/:** LocalFileStorage (MVP 1)
- **Seed/:** SeedData, SeedUsers, SeedProducts, SeedWorkflows (loads workflow definitions and rules at startup)

**Depends on:** Application, Domain

**Used by:** API

### API Layer
**Location:** `Tixora.API/` (backend only)

**Purpose:** HTTP endpoints, middleware, dependency injection configuration, request routing.

**Contains:**
- Controllers: AuthController, TicketsController, PartnersController, ProductsController, NotificationsController, DashboardController, ReportsController, SearchController, AdminController
- Middleware: FakeAuthMiddleware (seeded users + JWT for MVP 1), ErrorHandlingMiddleware
- Configuration: Program.cs (DI setup, middleware registration), appsettings.json

**Depends on:** All (Domain, Application, Infrastructure)

**Used by:** HTTP clients (React frontend, external integrations)

### Frontend Layer
**Location:** `frontend/` (separate React SPA)

**Purpose:** User interface, client-side routing, API consumption, local state management.

**Architecture:** Component-based with shared UI primitives, page slices, and custom hooks for data fetching.

**Contains:**
- **api/:** Axios client, endpoint functions, TanStack Query hooks
- **components/:** Design system (ui/), layout shell, shared domain components
- **pages/:** Page components organized by feature (Login, Dashboard, NewRequest, TicketDetail, etc.)
- **contexts/:** AuthContext for current user and JWT
- **types/:** TypeScript types mirroring backend enums and DTOs
- **utils/:** Helper functions (SLA calculation, formatting, Tailwind class merging)

**Depends on:** Backend API, external libs (React, React Router, Radix UI, TanStack Query, Tailwind CSS)

**Used by:** Web browsers

## Data Flow

### Ticket Creation (T-01 through T-05)

1. **User Initiation:** Frontend renders NewRequest wizard (ProductStep → TaskStep → FormStep → ReviewStep → ConfirmationStep)
2. **Form Schema Resolution:** Frontend fetches form schema from `GET /api/products/{code}/form-schema/{taskType}` (defines required fields, validation rules, document types)
3. **Client-Side Validation:** React Hook Form + Zod validates against runtime-derived schema
4. **Submission:** Frontend posts to `POST /api/tickets` with CreateTicketRequest (product, task, form data, documents)
5. **API Processing:**
   - AuthController delegates to TicketService.CreateTicket()
   - TicketService validates business rules (partner agreement exists for T-02+, partner account exists for T-04, etc.)
   - Ticket entity created, TicketId generated (SPM-[PRODUCT]-[TASK]-[YYYYMMDD]-[SEQ])
   - WorkflowEngine.InitializeWorkflow() loads seeded WorkflowDefinition for (Product, TaskType) combination
   - First stage entry created in StageLog
   - SlaTracker created with deadline calculated from WorkflowDefinition SLA hours + BusinessHoursConfig
   - Notification generated (NotificationType.RequestSubmitted) and persisted
   - AuditEntry logged
6. **Response:** Frontend receives TicketDetailResponse with ticket ID and initial stage routing
7. **UI Update:** Confirmation page displays ticket ID, current stage, next step guidance

### Ticket Advancement (Review → Approval → Provisioning → Completion)

1. **Current Stage Owner Action:** Reviewer/Approver/Agent accesses TicketDetail page
2. **Action Selection:** Clicks action button (Approve, Reject, Return for Clarification, etc.) from actions card (role-dependent)
3. **Modal Input:** Provides comment/reason and stage-specific data (e.g., API credentials for provisioning)
4. **API Call:** Sends StageActionRequest to `PUT /api/tickets/{id}/advance` (or `/reject`, `/return`, `/respond`)
5. **Backend Processing:**
   - TicketService.AdvanceStage() validates permissions (user role matches stage ownership)
   - StageLog entry created with action type, actor, timestamp, comment
   - SlaTracker updated if stage completed
   - WorkflowEngine determines next stage from seeded workflow definition
   - If T-02 Phase 1: status set to Phase1Complete, awaiting requester signal; if Phase 2: status set to Phase2Complete
   - If parallel paths (T-03 portal+API): both Provisioning Team and Integration Team entries created simultaneously
   - NotificationService generates notifications to relevant parties (next stage owner, requester, partner contact if applicable)
   - AuditEntry logged
   - If approval rejected: status set to Rejected, reason captured
   - If all stages completed: status set to Completed, LifecycleState updated (partner moved to Onboarded or Live depending on task)
6. **Response:** Updated TicketDetailResponse with new stage, actions available, notifications queued
7. **Real-time UI:** Frontend re-fetches ticket detail, workflow progress bar updates, next actions card refreshed

### SLA Tracking

1. **Initialization:** At ticket creation, SlaService.CreateSlaTracker() calculates deadline
   - Gets SLA hours from SlaTracker (seeded per Product × Task × Stage)
   - Multiplies by business hours using BusinessHoursConfig (Sun-Thu 08:00-17:00 GST)
   - Deadline = ticket creation time + (SLA hours × business hours elapsed)
2. **Periodic Check:** Background job (or on-demand) runs SlaService.CheckSlaStatus() for open tickets
   - Current elapsed time (business hours only) compared to deadline
   - SlaStatus: OnTrack (< 75%), AtRisk (75-90%), Critical (90-100%), Breached (> 100%)
3. **Notification Triggers:** At 75% and 90% thresholds, notifications sent to stage owner and escalation contacts
4. **Display:** Frontend shows SlaIndicator (green/amber/red dot) + time remaining formatted (e.g., "2d 3h remaining")
5. **Breach:** Once breached, ticket flagged in Team Queue and dashboard with red tint; escalation rules apply per seeded config

### State Management

**Backend State:**
- Ticket entity persists to SQL Server via EF Core
- Domain-driven: Ticket aggregate holds all related state (StageLog entries, Notifications, Comments, Documents, AuditEntry, SlaTracker)
- Seeded configuration (Products, WorkflowDefinitions, SlaTrackers, BusinessHoursConfig) loaded at app startup from `SeedWorkflows.cs`
- No runtime mutation of workflow or SLA rules (MVP 1); all variations driven by product-level attributes

**Frontend State:**
- **Server state:** Ticket details, lists, partner data, workflow configurations managed via TanStack Query (caching, refetching, synchronization)
- **Client state:** Current user (AuthContext via JWT), UI toggles (sidebar collapsed/expanded), form drafts (localStorage + periodically synced to API)
- **Optimistic updates:** Form field changes (watch() in React Hook Form) debounced and saved to localStorage every 60s; auto-resume on page reload

## Key Abstractions

### WorkflowEngine
**Purpose:** Deterministic routing and stage sequencing. Encapsulates workflow matrix logic.

**Location:** `Tixora.Application/Services/WorkflowEngine.cs`

**Pattern:** Service pattern; injected into TicketService. Stateless; reads seeded WorkflowDefinition entities.

**Responsibility:**
- Load seeded workflow for (Product, TaskType) pair
- Determine next stage based on current stage + action (Approve → next stage; Reject → Rejected status; etc.)
- Identify parallel paths (T-03 portal+API) and return both stage entries to create
- Validate stage prerequisites (e.g., T-02 Phase 2 requires Phase 1 completion)

### SlaTracker & SlaService
**Purpose:** Calculate and monitor deadline per stage, respecting business hours.

**Location:** `Tixora.Infrastructure/Data/SlaTrackerConfiguration.cs` (seeded data), `Tixora.Application/Services/SlaService.cs` (calculation logic)

**Pattern:** Value object (SlaTracker entity) + service layer (SlaService)

**Responsibility:**
- Seed SLA hours per (Product, Task, Stage) from `SeedWorkflows.cs`
- Calculate deadline at stage entry using BusinessHoursConfig
- Compute remaining time on-demand accounting for business hours only (skip weekends, holidays)
- Return SlaStatus (OnTrack/AtRisk/Critical/Breached)

### PartnerProduct & LifecycleState
**Purpose:** Track partner onboarding progression per product.

**Location:** `Tixora.Domain/Entities/PartnerProduct.cs`

**Pattern:** Domain model; aggregated under Partner entity

**Responsibility:**
- Store agreement status (Agreed, UatActive, Onboarded, Live) per product
- Updated by LifecycleService when task completes (T-01 → Agreed, T-02 Phase 1 → UatActive, T-03 → Onboarded/Live)
- Gated checks: T-02 requires Agreed state, T-03/T-04 require Agreed, T-05 requires Onboarded/Live

### FormSchema & Dynamic Field Rendering
**Purpose:** Runtime-driven form generation from seeded schema definitions.

**Location:** Backend: `Tixora.Application/DTOs/Common/FormSchemaResponse.cs` (DTO), seeded in `SeedWorkflows.cs`. Frontend: `src/pages/NewRequest/FormStep.tsx`, `src/api/endpoints/products.ts`

**Pattern:** Schema-as-code (no UI builder); frontend interprets JSON schema at runtime

**Responsibility:**
- Seeded FormSchema entity defines required fields, field types, validation rules, conditional visibility rules (T-03 API toggle, T-05 issue type), and mandatory document types
- Frontend `GET /api/products/{code}/form-schema/{taskType}` retrieves schema
- React Hook Form + Zod derives validation from schema at component mount
- Conditional fields hidden/shown via RHF's `watch()` on dependent field values
- Mandatory field counter updated in real-time

## Entry Points

### Backend API
**Location:** `Tixora.API/Program.cs`

**Triggers:** HTTP requests (from React frontend, external integrations, webhooks)

**Responsibilities:**
- Register DI container (services, repositories, middleware)
- Configure middleware pipeline (authentication, error handling, logging)
- Map controller routes
- Seed initial data (users, products, workflows, SLA config)
- Listen on `http://localhost:5000` (local dev)

### Frontend App
**Location:** `frontend/src/main.tsx` (entry), `frontend/src/App.tsx` (router)

**Triggers:** Browser page load, user interactions

**Responsibilities:**
- Mount React app to DOM
- Initialize TanStack Query provider
- Register AuthContext provider
- Set up React Router with app shell layout and page routes
- Handle 404s with error boundary

## Error Handling

**Strategy:** Layered error handling with fallback paths

**Patterns:**

**Domain/Application:**
- Exceptions thrown for business rule violations (e.g., PartnerNotAgreedException, StageTransitionNotAllowedException)
- Application layer catches and transforms to HTTP status codes (400 Bad Request, 409 Conflict, etc.)

**API:**
- ErrorHandlingMiddleware catches unhandled exceptions, logs, returns standardized ErrorResponse JSON
- Validators return 400 BadRequest with field-level error details
- 401 Unauthorized for missing/invalid JWT
- 403 Forbidden for role/permission mismatches

**Frontend:**
- Axios interceptor catches 401, clears auth context, redirects to login
- Route-level ErrorBoundary catches component render errors, displays "Something went wrong" card with retry
- Global GlobalFallback at app root prevents white screen on uncaught errors
- API call errors in hooks result in error state displayed in component (e.g., "Failed to load ticket", retry button)

## Cross-Cutting Concerns

**Logging:** Console.WriteLine in Application/API layers; structured logs to be added in MVP 2 (Serilog integration)

**Validation:** 
- Domain: Value object constructors validate invariants (e.g., TicketId format)
- Application: Fluent validators (FluentValidation) for DTOs (CreateTicketValidator, StageActionValidator)
- Frontend: Zod schemas derived from API form schemas

**Authentication:** 
- FakeAuthMiddleware (MVP 1) checks for `Authorization: Bearer {JWT}` header
- Seeded users validated against claims in JWT payload
- Real SSO integration deferred to MVP 2

**Authorization:**
- Role-based access control: StageAction requires user role matches stage ownership
- T-02 Phase 2 requires requester signal before advance available
- Admin endpoints require SystemAdministrator role

**Audit & Compliance:**
- AuditService logs every ticket state change (creation, stage advance, rejection, cancellation)
- AuditEntry captures: ticket ID, actor (user ID), action type, timestamp, old/new state
- Retrievable via `GET /api/tickets/{id}/audit` (frontend "Audit Trail" tab)
- Exported as CSV/PDF for compliance audits

---

*Architecture analysis: 2026-04-01*
