# Codebase Structure

**Analysis Date:** 2026-04-01

## Directory Layout

```
Tixora/
├── .git/                           # Git repository
├── .gitignore                      # Git ignore rules
├── .claude/                        # Claude agent workspace
├── .planning/                      # GSD codebase mapping docs
│   └── codebase/                   # This directory
├── Docs/                           # Product specs, design docs, Stitch prompts
│   ├── spm_portal_story.md         # Product story & workflow spec
│   ├── Stitch_initialDesign.md     # Design tokens, color palette, UI standards
│   ├── stitch-prompts/             # Google Stitch UI prompts for each screen
│   │   ├── 00-shared-layout.md     # Navigation, top bar, sidebar structure
│   │   ├── 01-login.md through 12-user-form.md
│   └── superpowers/
│       ├── specs/                  # Technical design, epic plan, frontend architecture
│       └── plans/                  # Implementation plans (phase breakdown)
├── CLAUDE.md                       # Project conventions, commands, architecture summary
├── frontend/                       # React SPA (separate build, Google Stitch-generated)
│   ├── public/                     # Static assets (favicon, fonts, icons.svg)
│   ├── src/
│   │   ├── main.tsx                # Entry point, React root, providers
│   │   ├── App.tsx                 # Router setup, page layout
│   │   ├── App.css                 # App-level styles
│   │   ├── index.css               # Global CSS (reset, base styles, design tokens as CSS variables)
│   │   ├── api/
│   │   │   ├── client.ts           # Axios instance, base URL, auth header interceptor, 401 handler
│   │   │   ├── endpoints/
│   │   │   │   ├── tickets.ts      # Ticket CRUD: createTicket, getTicket, listTickets, advanceStage, etc.
│   │   │   │   ├── dashboard.ts    # Dashboard stats, action-required, activity
│   │   │   │   ├── partners.ts     # Partner lookup, profile, lifecycle
│   │   │   │   ├── products.ts     # Product list, task list, form schema
│   │   │   │   ├── notifications.ts # List, mark read, read all
│   │   │   │   ├── search.ts       # Advanced search, saved filters
│   │   │   │   ├── reports.ts      # Summary, SLA, volume metrics
│   │   │   │   └── admin.ts        # Users, workflows, SLA config, business hours, delegates
│   │   │   └── hooks/
│   │   │       ├── useTickets.ts   # TanStack Query hooks: useTicket, useTicketList, useMutateStage
│   │   │       ├── useDashboard.ts
│   │   │       ├── usePartners.ts
│   │   │       ├── useProducts.ts
│   │   │       ├── useNotifications.ts
│   │   │       ├── useSearch.ts
│   │   │       ├── useReports.ts
│   │   │       └── useAdmin.ts
│   │   ├── components/
│   │   │   ├── ui/                 # Design system primitives (Radix + Tailwind)
│   │   │   │   ├── Button.tsx      # Variants: primary (gradient), secondary (ghost), tertiary (text), destructive
│   │   │   │   ├── Card.tsx        # Tonal layering, configurable surface tier
│   │   │   │   ├── Chip.tsx        # Product, status, role, SLA color coding
│   │   │   │   ├── Input.tsx       # Text input with label, helper, validation error
│   │   │   │   ├── Textarea.tsx    # Multi-line input
│   │   │   │   ├── Select.tsx      # Dropdown, Radix Select-based
│   │   │   │   ├── Modal.tsx       # Radix Dialog, glassmorphism overlay
│   │   │   │   ├── Table.tsx       # Sortable columns, alternating row tones, hover teal
│   │   │   │   ├── Tabs.tsx        # Radix Tabs, underline indicator
│   │   │   │   ├── Dropdown.tsx    # Radix DropdownMenu (not form select)
│   │   │   │   ├── Toggle.tsx      # Switch component (T-03 API opt-in)
│   │   │   │   ├── FileUpload.tsx  # Drag-drop zone, file list, remove action
│   │   │   │   ├── Stepper.tsx     # Horizontal step indicator (NewRequest wizard)
│   │   │   │   ├── Toast.tsx       # Notifications (success/error/info), auto-dismiss
│   │   │   │   ├── EmptyState.tsx  # Centered placeholder (no results, loading)
│   │   │   │   └── Pagination.tsx  # Prev/next, page numbers, 20 per page default
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx    # Top bar + sidebar + <Outlet /> for routes
│   │   │   │   ├── TopBar.tsx      # Logo, global search, notification bell, user avatar dropdown
│   │   │   │   ├── Sidebar.tsx     # Role-adaptive nav, collapsible at 1024px, active item highlight
│   │   │   │   ├── ProtectedRoute.tsx # Route guard, redirects to /login if no auth
│   │   │   │   ├── ErrorBoundary.tsx # Route-level error catching, "Something went wrong" fallback
│   │   │   │   └── GlobalFallback.tsx # Top-level uncaught error fallback
│   │   │   └── shared/
│   │   │       ├── SlaIndicator.tsx # Green/amber/red dot + time remaining
│   │   │       ├── StatusChip.tsx   # Ticket status mapped to color
│   │   │       ├── ProductChip.tsx  # Product name + code
│   │   │       ├── TicketRow.tsx    # Reusable row (dashboard, queue, search results)
│   │   │       └── WorkflowProgress.tsx # Stage visualization, completed/current/future, T-02 phases, T-03 parallel
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx      # Current user, JWT, login/logout methods
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Email/password form → POST /api/auth/login
│   │   │   ├── Dashboard.tsx        # Stat cards, action required tickets, recent activity
│   │   │   ├── NewRequest/
│   │   │   │   ├── index.tsx        # Wizard container, step state management
│   │   │   │   ├── ProductStep.tsx  # 2x2 grid, select product
│   │   │   │   ├── TaskStep.tsx     # Task card list, disabled cards with tooltips
│   │   │   │   ├── FormStep.tsx     # Dynamic form from schema, React Hook Form + Zod validation
│   │   │   │   ├── ReviewStep.tsx   # Read-only summary, back to edit
│   │   │   │   └── ConfirmationStep.tsx # Ticket ID, routed stage, next steps
│   │   │   ├── TicketDetail.tsx     # Header, workflow progress, main content, right panel, tabs
│   │   │   ├── TeamQueue.tsx        # Pinned breached/at-risk, filter bar, sortable table
│   │   │   ├── MyTickets.tsx        # Requester's ticket list, sortable
│   │   │   ├── Partners/
│   │   │   │   ├── PartnerLookup.tsx # Search bar, results list
│   │   │   │   └── PartnerProfile.tsx # Partner info, ticket timeline, lifecycle per product
│   │   │   ├── Notifications.tsx    # Paginated list, mark as read, link to ticket
│   │   │   ├── Search.tsx           # Advanced search form, filters, results table, CSV export
│   │   │   ├── Reports.tsx          # Metrics dashboard, date range filter, Recharts
│   │   │   └── Admin/
│   │   │       ├── Users.tsx        # User table, add/edit modals
│   │   │       ├── Workflows.tsx    # Product tabs, workflow per task, edit/reorder stages
│   │   │       ├── SlaSettings.tsx  # Task × stage × SLA hours table
│   │   │       └── BusinessHours.tsx # Business hours picker, holiday calendar, delegate table
│   │   ├── types/
│   │   │   ├── ticket.ts            # Ticket, StageLog, TicketStatus, TaskType
│   │   │   ├── product.ts           # Product, ProductCode, ProductAccessMode
│   │   │   ├── partner.ts           # Partner, PartnerProduct, LifecycleState
│   │   │   ├── user.ts              # User, UserRole
│   │   │   ├── notification.ts      # Notification, NotificationType
│   │   │   ├── workflow.ts          # WorkflowDefinition, StageDefinition, StageType
│   │   │   └── enums.ts             # Re-exported backend enums for consistency
│   │   └── utils/
│   │       ├── sla.ts               # formatTimeRemaining, calculateSlaStatus
│   │       ├── format.ts            # formatDate, formatCurrency, formatTime
│   │       └── cn.ts                # Tailwind class merge utility (clsx + tailwind-merge)
│   ├── assets/                      # Logo files, hero images
│   ├── eslint.config.js             # ESLint rules (React, TypeScript, hooks, refresh)
│   ├── tailwind.config.ts           # Design tokens, colors, spacing, shadows, gradients
│   ├── tsconfig.json                # TypeScript project references
│   ├── tsconfig.app.json            # App-specific TypeScript config
│   ├── tsconfig.node.json           # Node/Vite TypeScript config
│   ├── vite.config.ts               # Vite bundler config, React plugin
│   ├── package.json                 # Dependencies, build/dev/lint scripts
│   ├── package-lock.json            # Locked dependency versions
│   ├── index.html                   # HTML entry point
│   ├── README.md                    # Frontend setup instructions
│   └── .gitignore                   # Node modules, build output, env files
├── src/                             # Backend (.NET solution root, not yet created)
│   ├── Tixora.sln                   # Solution file (backend only)
│   ├── Tixora.Domain/               # Domain layer
│   ├── Tixora.Application/          # Application layer
│   ├── Tixora.Infrastructure/       # Infrastructure layer
│   └── Tixora.API/                  # API layer
├── tests/                           # Backend test projects (not yet created)
│   ├── Tixora.Domain.Tests/
│   ├── Tixora.Application.Tests/
│   └── Tixora.API.Tests/
└── README.md                        # Project root readme
```

## Directory Purposes

### Root Level
**CLAUDE.md:** Single source of truth for conventions, tech stack, commands, architecture layers, products, task types, and aggressive MVP scoping. Read first.

**Docs/:** All specifications, design references, and planning documents. Not code.
- `spm_portal_story.md`: Product vision, personas, task types, workflow matrix, SLA rules
- `Stitch_initialDesign.md`: Color palette, typography, spacing, shadow & border styles
- `stitch-prompts/`: Google Stitch AI-generated UI screens (reference for visual fidelity)
- `superpowers/specs/`: Detailed technical design, epic plan, frontend architecture
- `superpowers/plans/`: Phase-by-phase implementation breakdown

**.planning/codebase/:** GSD mapping documents (ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md). These are auto-generated; do not edit by hand.

### Frontend
**src/main.tsx:** React app entry point. Mounts providers (AuthContext, TanStack Query) and root App component.

**src/App.tsx:** React Router configuration. Defines layout routes (protected shell vs. unprotected /login). All page routes nested under AppShell layout.

**src/api/:** API integration layer.
- `client.ts`: Axios instance with interceptors for auth header and 401 handling
- `endpoints/`: Grouped by domain (tickets, partners, products, etc.). Each function is a fetch call.
- `hooks/`: TanStack Query hooks wrapping endpoints. Provide caching, refetching, loading/error states.

**src/components/:** Reusable React components.
- `ui/`: Design system primitives. Each file exports a single component (Button, Card, etc.). Styled with Tailwind utility classes matching Stitch design tokens.
- `layout/`: Shell components (AppShell, Sidebar, TopBar, error boundaries). Wrap pages.
- `shared/`: Domain-specific components used across multiple pages (SlaIndicator, StatusChip, TicketRow, WorkflowProgress).

**src/pages/:** Feature-specific pages, one per route.
- Simple pages: Login.tsx, Dashboard.tsx, TeamQueue.tsx, Notifications.tsx, Search.tsx, Reports.tsx
- Complex pages with substeps: NewRequest/ (wizard with ProductStep, TaskStep, FormStep, etc.), Partners/ (lookup and profile), Admin/ (sub-tabs)
- Each page uses hooks from `src/api/hooks/` to fetch data and handles loading/error states

**src/contexts/:** Global client state (AuthContext stores current user, JWT, login/logout).

**src/types/:** TypeScript interfaces matching backend domain model. Includes enums (TicketStatus, TaskType, ProductCode, UserRole, etc.).

**src/utils/:** Reusable utility functions (date formatting, SLA calculation, Tailwind class merging).

**Configuration files:**
- `tailwind.config.ts`: Design tokens (colors, spacing, shadows, gradients) mapped from Stitch
- `vite.config.ts`: Build tool config (React plugin, dev server, build output)
- `tsconfig.json`: TypeScript compiler config
- `eslint.config.js`: Linting rules
- `package.json`: Dependencies and scripts (dev, build, lint, preview)

### Backend (src/)

**Tixora.Domain/:** Domain layer. No dependencies.
- `Entities/`: Core business models (Ticket, Partner, Product, User, WorkflowDefinition, etc.)
- `Enums/`: ProductCode, TaskType, TicketStatus, UserRole, NotificationType, IssueType, etc.
- `ValueObjects/`: TicketId, BusinessHours
- `Interfaces/`: Repository contracts (ITicketRepository, IPartnerRepository, etc.)

**Tixora.Application/:** Application layer. Depends on Domain.
- `Services/`: Business logic orchestration (TicketService, WorkflowEngine, SlaService, NotificationService, etc.)
- `DTOs/`: Request/response data transfer objects (CreateTicketRequest, TicketDetailResponse, etc.), organized by domain
- `Interfaces/`: Service contracts (ITicketService, IWorkflowEngine, etc.)
- `Validators/`: FluentValidation validators (CreateTicketValidator, StageActionValidator)

**Tixora.Infrastructure/:** Infrastructure layer. Depends on Application + Domain.
- `Data/AppDbContext.cs`: EF Core DbContext
- `Data/Migrations/`: EF Core migration history
- `Data/Configurations/`: EF Core entity mappings and relationships
- `Repositories/`: Repository implementations (TicketRepository, PartnerRepository, etc.)
- `Email/`: Email service (SesEmailSender, EmailTemplates) — MVP 2
- `FileStorage/`: File storage service (LocalFileStorage for MVP 1)
- `Seed/`: Seeded data loaders (SeedUsers, SeedProducts, SeedWorkflows) — run at app startup

**Tixora.API/:** API layer. Depends on all.
- `Controllers/`: HTTP endpoints (AuthController, TicketsController, PartnersController, etc.)
- `Middleware/`: FakeAuthMiddleware (JWT validation), ErrorHandlingMiddleware
- `Program.cs`: DI registration, middleware pipeline, app configuration
- `appsettings.json`: Environment config (db connection string, API port, JWT secret, etc.)

**tests/:** Test projects (one per layer).
- `Tixora.Domain.Tests/`: Domain model tests (entity invariants, value object validation)
- `Tixora.Application.Tests/`: Service tests (business logic, workflow engine, SLA calculation)
- `Tixora.API.Tests/`: Controller/integration tests (endpoint contracts, error handling)

## Key File Locations

### Entry Points
- **Frontend:** `frontend/src/main.tsx` (React DOM mount), `frontend/src/App.tsx` (routing)
- **Backend API:** `src/Tixora.API/Program.cs` (app startup, DI, middleware)

### Configuration
- **Frontend:** `frontend/tailwind.config.ts` (design tokens), `frontend/vite.config.ts` (build), `frontend/tsconfig.app.json` (TypeScript)
- **Backend:** `src/Tixora.API/appsettings.json` (env config), `src/Tixora.API/Program.cs` (DI container)

### Core Logic
- **Ticket Creation:** `src/Tixora.Application/Services/TicketService.cs`, `src/Tixora.Domain/Entities/Ticket.cs`
- **Workflow Routing:** `src/Tixora.Application/Services/WorkflowEngine.cs`, `src/Tixora.Infrastructure/Seed/SeedWorkflows.cs` (seeded definitions)
- **SLA Tracking:** `src/Tixora.Application/Services/SlaService.cs`, `src/Tixora.Domain/Entities/SlaTracker.cs`
- **Form Schema:** `src/Tixora.Infrastructure/Seed/SeedWorkflows.cs` (FormSchema seeding), `frontend/src/pages/NewRequest/FormStep.tsx` (client-side rendering)

### Database
- **DbContext:** `src/Tixora.Infrastructure/Data/AppDbContext.cs`
- **Migrations:** `src/Tixora.Infrastructure/Data/Migrations/`
- **Entity Configurations:** `src/Tixora.Infrastructure/Data/Configurations/`

### API Contracts
- **Backend DTOs:** `src/Tixora.Application/DTOs/` (request/response shapes)
- **Frontend Types:** `frontend/src/types/` (TypeScript interfaces mirroring DTOs)
- **Endpoints:** `frontend/src/api/endpoints/` (API call functions), `src/Tixora.API/Controllers/` (HTTP route handlers)

### Testing
- **Test Projects:** `tests/Tixora.*.Tests/`
- **Run Tests:** `dotnet test` (runs all projects matching `*.Tests.csproj`)

## Naming Conventions

### Files

**Backend:**
- Entity files: `Ticket.cs`, `Partner.cs`, `Product.cs` (PascalCase, singular)
- Enum files: `ProductCode.cs`, `TicketStatus.cs` (PascalCase)
- Service files: `TicketService.cs`, `WorkflowEngine.cs` (PascalCase, Interface before Implementation)
- Repository files: `ITicketRepository.cs` (interface), `TicketRepository.cs` (implementation)
- DTO files: `CreateTicketRequest.cs`, `TicketDetailResponse.cs` (request/response suffixes)
- DbContext: `AppDbContext.cs` (DbContext suffix)
- Migrations: `[timestamp]_[DescriptiveName].cs` (EF Core auto-generated)

**Frontend:**
- Component files: `Button.tsx`, `Card.tsx` (PascalCase, single component per file)
- Page files: `Dashboard.tsx`, `TicketDetail.tsx` (PascalCase)
- Hook files: `useTickets.ts`, `useDashboard.ts` (camelCase, use prefix)
- Utility files: `sla.ts`, `format.ts` (camelCase)
- Type files: `ticket.ts`, `product.ts` (camelCase)
- Config files: `tailwind.config.ts`, `vite.config.ts` (dot-notation)

### Directories

**Backend:**
- Layer folders: `Tixora.Domain`, `Tixora.Application`, `Tixora.Infrastructure`, `Tixora.API` (project names)
- Subfolder organization: `Services/`, `DTOs/`, `Repositories/`, `Data/`, `Middleware/`, `Controllers/` (plural, lowercase)
- Feature-based subfolders within DTOs: `DTOs/Tickets/`, `DTOs/Partners/`, `DTOs/Admin/` (feature names, plural, PascalCase)

**Frontend:**
- Component subfolders: `components/ui/`, `components/layout/`, `components/shared/` (lowercase, plural)
- Feature subfolders: `pages/NewRequest/`, `pages/Partners/`, `pages/Admin/` (PascalCase, feature names)
- Config/source: `src/`, `public/` (lowercase)

## Where to Add New Code

### New Feature (e.g., new task type T-06)

**Backend:**
1. Add enum variant: `Tixora.Domain/Enums/TaskType.cs` (e.g., `T06`)
2. Create entity if needed: `Tixora.Domain/Entities/` (e.g., new tracking entity)
3. Add service logic: `Tixora.Application/Services/` (new or extend TicketService)
4. Add DTOs: `Tixora.Application/DTOs/Tickets/` (CreateT06Request, T06ResponseDto)
5. Seed workflow: `Tixora.Infrastructure/Seed/SeedWorkflows.cs` (add WorkflowDefinition + StageDefinitions)
6. Add controller endpoint: `Tixora.API/Controllers/TicketsController.cs`
7. Add tests: `tests/Tixora.Application.Tests/` (TicketService tests), `tests/Tixora.API.Tests/` (endpoint tests)

**Frontend:**
1. Create page component: `frontend/src/pages/T06/index.tsx`
2. Add API endpoints: `frontend/src/api/endpoints/tickets.ts` (new functions if needed)
3. Add hooks: `frontend/src/api/hooks/useTickets.ts` (new query/mutation if needed)
4. Add route: `frontend/src/App.tsx` (new route under AppShell)
5. Add types: `frontend/src/types/ticket.ts` (extend with T06-specific fields)
6. Add tests: `frontend/src/pages/T06/index.test.tsx` (using vitest, setup TBD)

### New Shared Component

**Frontend:**
1. Create file: `frontend/src/components/[ui|shared]/ComponentName.tsx`
2. Export from index if barrel file exists
3. Use in pages as `<ComponentName prop={value} />`
4. Add TypeScript props interface at top of file
5. Style using Tailwind utility classes matching design tokens from `tailwind.config.ts`

**Backend:**
1. Create entity: `Tixora.Domain/Entities/NewEntity.cs`
2. Add DbSet: `Tixora.Infrastructure/Data/AppDbContext.cs` (DbSet<NewEntity>)
3. Add configuration: `Tixora.Infrastructure/Data/Configurations/NewEntityConfiguration.cs`
4. Add repository interface: `Tixora.Domain/Interfaces/INewEntityRepository.cs`
5. Add repository implementation: `Tixora.Infrastructure/Repositories/NewEntityRepository.cs`
6. Add DTOs: `Tixora.Application/DTOs/NewDomain/` folder with request/response classes
7. Add service: `Tixora.Application/Services/NewEntityService.cs` if domain-specific logic exists
8. Register in DI: `Tixora.API/Program.cs` (services.AddScoped<INewEntityRepository, NewEntityRepository>())

### New API Integration (MVP 2)

**Backend:**
1. Create abstraction: `Tixora.Application/Interfaces/INewService.cs` (e.g., IEmailSender, IFileStorage)
2. Implement in Infrastructure: `Tixora.Infrastructure/[Email|FileStorage|Integrations]/NewServiceImpl.cs`
3. Register in DI: `Tixora.API/Program.cs`
4. Call from Application layer service (e.g., NotificationService calls IEmailSender.SendEmailAsync())

**Frontend:**
1. Create endpoint: `frontend/src/api/endpoints/newservice.ts`
2. Create hook: `frontend/src/api/hooks/useNewService.ts` (wrapping endpoint with TanStack Query)
3. Use hook in pages: `const { data, isLoading, error } = useNewService()`

## Special Directories

### Docs/
**Purpose:** Non-code documentation, specifications, and design references.

**Generated:** No (human-written specs and Stitch-generated screens)

**Committed:** Yes

**Content:** Product story, technical design, design tokens, UI prompts, implementation plans

### .planning/codebase/
**Purpose:** GSD codebase mapping documentation (auto-generated by `/gsd:map-codebase` command).

**Generated:** Yes (by Claude agent)

**Committed:** Yes (but not edited by hand)

**Content:** ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md

### frontend/node_modules/
**Purpose:** NPM dependencies.

**Generated:** Yes (npm install)

**Committed:** No (excluded in .gitignore)

### src/Tixora.Infrastructure/Data/Migrations/
**Purpose:** Entity Framework Core migration history.

**Generated:** Yes (dotnet ef migrations add)

**Committed:** Yes (migrations are source code)

### frontend/dist/
**Purpose:** Built frontend output (Vite bundle).

**Generated:** Yes (npm run build)

**Committed:** No (excluded in .gitignore)

---

*Structure analysis: 2026-04-01*
