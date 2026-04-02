# Tixora — Frontend Architecture & Task Breakdown

**Tixora | Powering Every Request**
*Frontend Design Spec v1.0 | April 2026*

---

## 1. Overview

This document defines the frontend architecture, technology choices, and task breakdown for the Tixora internal operations portal. The frontend is a React SPA that communicates with the ASP.NET Core backend API.

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Styling | Tailwind CSS v4 | CSS-first config via `@theme` blocks — no `tailwind.config.ts`. Design tokens from Stitch defined directly in CSS. Lighter, native Vite integration via `@tailwindcss/vite`. |
| Routing | React Router v7 | Nested layouts for app shell + page pattern. Mature, well-documented. |
| Server state | TanStack Query | Handles API caching, refetching, loading/error states. Almost all Tixora state is server-driven. |
| Client state | React Context | Lightweight — only needed for auth user and UI toggles (sidebar, theme). |
| Component primitives | Radix UI | Accessible, unstyled headless primitives for complex widgets (modals, dropdowns, tabs, dialogs). Styled with Tailwind to match Stitch designs. |
| Forms | React Hook Form + Zod | Dynamic form rendering, validation, auto-save drafts, mandatory field tracking. Zod for schema-driven validation that maps to API form schemas. |
| Charts | Recharts | Lightweight, React-native charting for the Reports dashboard. |
| Error handling | React Error Boundaries | Route-level error boundaries for graceful degradation. Global fallback for uncaught errors. |
| Build tool | Vite | Already scaffolded. Fast HMR, TypeScript out of the box. |

### Design Source of Truth

All visual designs live in Google Stitch project `14130211189051506529`. The Stitch-generated HTML screens serve as the pixel-perfect visual reference. Design tokens are codified from `Docs/Stitch_initialDesign.md`.

**Stitch screens available:**

| Screen | Stitch Title | Screen ID |
|--------|-------------|-----------|
| Login | Tixora Login - Perfectly Centered | `c7822683cc5b43dfa4a96ebe8bc20981` |
| Dashboard | Tixora Dashboard - Collapsible Sidebar | `49663db1bff6489697e935f130922a19` |
| New Request | Tixora - New Request (Product Selection) | `3ca7010f252942f6b6fea11867aecc05` |
| Ticket Detail | Tixora - Refined Ticket Detail View | `74ce8269b79e49ac8ac315383101d334` |
| Team Queue | Tixora - Corrected Team Queue View | `487ceaa1314a49d28eee257e7ff9514a` |
| Partner Search | Tixora - Partner Search Page | `a8cc55d9bdfe432997339f63c68be026` |
| Partner Profile | Tixora - Partner Profile Page | `d2bce8bfe5264e1380e12a9d3bb9c3df` |
| Advanced Search | Tixora - Advanced Search | `0c226d6f62654d918d6219437fafd974` |
| Reports | Tixora - Reports Dashboard | `0bc6925fed8841598327292a0c1f68e5` |
| User Management | Tixora - User Management (Updated) | `e6255d9014624d6db0dd5a0b63f81f98` |
| Add User Modal | Tixora - Add User Modal (Color Aligned) | `f83a1152585e4d60a475537ba38234aa` |
| Workflow Config | Tixora - Workflow Management (Fully Fixed) | `8b90e38c46d440ef815e5dfe18f7f3d4` |
| SLA Settings | Tixora - SLA Settings (Fixed Header) | `b43e7eab5d00440d84d2280d0b750b09` |
| Business Hours | Tixora - Business Hours & Holidays | `c1336ccf9c314843bc7aaff25b34e7ee` |

---

## 2. Project Structure

```
frontend/
├── public/
├── src/
│   ├── main.tsx                    # Entry point, providers
│   ├── App.tsx                     # Router setup
│   ├── api/
│   │   ├── client.ts              # Axios instance, auth headers, error interceptor
│   │   ├── endpoints/
│   │   │   ├── tickets.ts         # Ticket API calls
│   │   │   ├── dashboard.ts       # Dashboard API calls
│   │   │   ├── partners.ts        # Partner API calls
│   │   │   ├── products.ts        # Product/task/form-schema API calls
│   │   │   ├── notifications.ts   # Notification API calls
│   │   │   ├── search.ts          # Search API calls
│   │   │   ├── reports.ts         # Reports API calls
│   │   │   └── admin.ts           # Admin API calls
│   │   └── hooks/
│   │       ├── useTickets.ts      # TanStack Query hooks for tickets
│   │       ├── useDashboard.ts
│   │       ├── usePartners.ts
│   │       ├── useProducts.ts
│   │       ├── useNotifications.ts
│   │       ├── useSearch.ts
│   │       ├── useReports.ts
│   │       └── useAdmin.ts
│   ├── components/
│   │   ├── ui/                    # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Chip.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx          # Radix Dialog + glassmorphism
│   │   │   ├── Table.tsx
│   │   │   ├── Tabs.tsx           # Radix Tabs + underline indicator
│   │   │   ├── Dropdown.tsx       # Radix Dropdown Menu
│   │   │   ├── Toggle.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── Stepper.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── Pagination.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx       # Top bar + sidebar + content area
│   │   │   ├── TopBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── ErrorBoundary.tsx  # Route-level error boundary (bad IDs, permissions, API failures)
│   │   │   └── GlobalFallback.tsx # Top-level crash fallback (white screen prevention)
│   │   └── shared/
│   │       ├── SlaIndicator.tsx   # Green/amber/red SLA display
│   │       ├── StatusChip.tsx     # Ticket status with color coding
│   │       ├── ProductChip.tsx
│   │       ├── TicketRow.tsx      # Reusable ticket list row
│   │       └── WorkflowProgress.tsx # Stage visualization bar
│   ├── contexts/
│   │   └── AuthContext.tsx        # Current user, login/logout, JWT
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── NewRequest/
│   │   │   ├── index.tsx          # Wizard container
│   │   │   ├── ProductStep.tsx
│   │   │   ├── TaskStep.tsx
│   │   │   ├── FormStep.tsx
│   │   │   ├── ReviewStep.tsx
│   │   │   └── ConfirmationStep.tsx
│   │   ├── TicketDetail.tsx
│   │   ├── TeamQueue.tsx
│   │   ├── MyTickets.tsx
│   │   ├── Partners/
│   │   │   ├── PartnerLookup.tsx
│   │   │   └── PartnerProfile.tsx
│   │   ├── Notifications.tsx
│   │   ├── Search.tsx
│   │   ├── Reports.tsx
│   │   └── Admin/
│   │       ├── Users.tsx
│   │       ├── Workflows.tsx
│   │       ├── SlaSettings.tsx
│   │       └── BusinessHours.tsx
│   ├── types/
│   │   ├── ticket.ts
│   │   ├── product.ts
│   │   ├── partner.ts
│   │   ├── user.ts
│   │   ├── notification.ts
│   │   ├── workflow.ts
│   │   └── enums.ts
│   └── utils/
│       ├── sla.ts                 # SLA calculation helpers
│       ├── format.ts              # Date, number formatting
│       └── cn.ts                  # Tailwind class merge utility
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 3. Design Tokens (Tailwind v4 CSS Theme)

Extracted from `Docs/Stitch_initialDesign.md`. Defined in `src/index.css` using Tailwind v4's `@theme` directive:

```css
@import "tailwindcss";

@theme {
  /* Colors — Surface hierarchy */
  --color-surface: #f5fafa;
  --color-surface-container-lowest: #f8fdfc;
  --color-surface-container-low: #f0f5f4;
  --color-surface-container-highest: #dee3e3;

  /* Colors — Primary */
  --color-primary: #00696a;
  --color-primary-container: #23a2a3;
  --color-primary-fixed: #86f4f5;
  --color-on-primary: #ffffff;

  /* Colors — Text */
  --color-on-surface: #171d1c;
  --color-on-surface-variant: #3d4949;

  /* Colors — Secondary */
  --color-secondary-container: #c1eaea;
  --color-on-secondary-container: #456b6b;

  /* Colors — Outline */
  --color-outline-variant: #bcc9c8;

  /* Colors — Semantic */
  --color-error: #d32f2f;
  --color-error-container: #ffebee;
  --color-warning: #e65100;
  --color-warning-container: #fff3e0;
  --color-success: #2e7d32;
  --color-success-container: #e8f5e9;

  /* Typography */
  --font-family-sans: 'Manrope', sans-serif;

  /* Shadows */
  --shadow-ambient: 0 10px 40px rgba(23, 29, 28, 0.06);
}
```

Usage in components: `bg-surface-container-low`, `text-on-surface`, `text-primary`, etc.

### Typography Scale
- Display lg/md/sm: tight letter-spacing (-0.02em)
- Body: 0.875rem
- Labels: 0.75rem / 0.6875rem — always `text-on-surface-variant`, never pure black

### Spacing
- 8px grid base
- `spacing-3`: 0.75rem, `spacing-4`: 1rem, `spacing-5`: 1.25rem, `spacing-6`: 1.5rem, `spacing-8`: 2rem

### Borders & Radii
- Default radius: 0.5rem (`rounded-lg`)
- XL radius: 1.5rem (`rounded-3xl`) — hero sections, sidebar
- Full radius: 2rem (`rounded-full`) — search bar
- No 1px solid borders — tonal layering only
- Ghost border fallback: `outline-variant` at 20% opacity

### Glassmorphism
- Semi-transparent `surface-container-lowest` + `backdrop-blur-[16px]`

### Gradients
- Primary CTA: `bg-gradient-to-br from-primary to-primary-container` (135deg)

---

## 4. Task Breakdown

### Approach: Foundation + Vertical Slices

Build a shared foundation layer first (design system, shell, auth, shared components), then implement each screen as an independent vertical slice.

---

### Foundation Tasks

#### F-01 · Design System & Tailwind v4 Setup
- Install `tailwindcss` v4 and `@tailwindcss/vite` plugin
- Add Vite plugin to `vite.config.ts`
- Define all design tokens in `src/index.css` using `@theme` directive (colors, fonts, shadows — see Section 3)
- Import Manrope font (Google Fonts `<link>` in `index.html`)
- Set up base CSS: default text color `on-surface`, font family, no `#000000` anywhere
- Create `cn()` utility (clsx + tailwind-merge) for conditional class composition

#### F-02 · Shared UI Components
Build all design system primitives in `src/components/ui/`:
- **Button** — primary (gradient), secondary (ghost border), tertiary (text), red variant. Sizes: sm, md, lg. Loading state with spinner.
- **Card** — tonal layering background, configurable surface tier, 0.5rem radius, no borders.
- **Chip** — color variants for product, status, role, SLA. Maps to the color coding in Stitch designs.
- **Input / Textarea / Select** — surface fill, focus glow (teal 4px blur), validation error state (red underline + message), label + helper text pattern.
- **Modal** — Radix Dialog, glassmorphism overlay (backdrop-blur 16px, semi-transparent bg). Confirm/cancel pattern.
- **Table** — alternating row tones (surface-container-lowest / surface), sortable column headers, no borders, 52px row height, hover teal tint.
- **Tabs** — Radix Tabs, underline indicator (teal 2px, animated slide).
- **Dropdown** — Radix Select/DropdownMenu, styled to match chip-based filter dropdowns.
- **Toggle** — switch component for T-03 API opt-in.
- **FileUpload** — drag-and-drop zone (dashed outline-variant at 20%), click to upload, file list with remove. Accepts PDF, DOCX, XLSX, PNG, JPG. Max 10MB validation.
- **Stepper** — horizontal step indicator. Completed (teal filled), current (teal + pulse), future (gray outline).
- **Toast** — Radix Toast or simple custom. Bottom-right, auto-dismiss 5s. Success/error/info color tints with glassmorphism.
- **EmptyState** — centered illustration placeholder + heading + description.
- **Pagination** — simple prev/next with page numbers, 20 per page default.

Also build shared domain components in `src/components/shared/`:
- **SlaIndicator** — green/amber/red dot + time remaining text.
- **StatusChip** — maps `TicketStatus` enum to colored chip.
- **ProductChip** — product name + code in secondary-container style.
- **TicketRow** — reusable row used in dashboard, team queue, my tickets, search.
- **WorkflowProgress** — horizontal stage visualization with completed/current/future states. Handles T-02 phases and T-03 parallel branches.

#### F-03 · App Shell & Routing
- **AppShell** component: top bar + sidebar + `<Outlet />` content area.
- **TopBar**: logo ("Tixora" + tagline), global search bar (rounded input), notification bell (unread badge), user avatar dropdown (name, role chip, sign out).
- **Sidebar**: role-adaptive nav items per Stitch spec `00-shared-layout.md`. Floating bottom effect (24px gap). Collapsible at 1024px (icon-only 64px), hamburger overlay at 768px. Active item: teal text + left accent bar.
- **React Router** nested routes: `/login` (no shell), `/` (shell layout with child routes for dashboard, tickets, etc.).
- **Error boundaries**: Route-level `<ErrorBoundary>` wrapping each page outlet — catches bad ticket IDs, permission errors, failed API loads. Shows "Something went wrong" card with retry button. Global `<GlobalFallback>` at app root prevents white screen on uncaught errors.
- **Page transition**: 200ms fade-in on route change.

#### F-04 · Auth & API Layer
- **AuthContext**: stores current user (name, email, role, JWT). `login()` / `logout()` methods. Persists token in localStorage.
- **Login page**: matches Stitch login screen. Email/password form → `POST /api/auth/login` → store JWT → redirect to dashboard.
- **ProtectedRoute**: wraps shell routes, redirects to `/login` if no token.
- **API client**: Axios instance with `baseURL`, auth header interceptor (`Authorization: Bearer {token}`), 401 interceptor (auto-logout). Configurable base URL via env var.
- **TanStack Query provider**: default staleTime 30s, retry 1, refetchOnWindowFocus true. Wrapped in `main.tsx`.

---

### Screen Slices (priority order)

#### S-01 · Dashboard
- Role-adaptive stat cards row (4 cards, content varies by role per Stitch spec).
- Action Required section (left 60%): ticket list (max 5) with SLA indicators, "View All" link. Content varies by role.
- Recent Activity section (right 40%): vertical timeline feed, teal dots, max 10 entries.
- Quick Action CTA (requester only): gradient "Create New Request" button.
- **APIs**: `GET /api/dashboard/stats`, `GET /api/dashboard/action-required`, `GET /api/dashboard/activity`

#### S-02 · New Request (Ticket Creation Wizard)
- 4-step wizard with Stepper component.
- **Step 1 — Product Selection**: 2x2 grid of product cards. Hover lift, selected teal accent. Auto-advance on click.
- **Step 2 — Task Selection**: vertical task card list. Disabled cards for lifecycle prereqs not met (grayed + tooltip). Back button.
- **Step 3 — Dynamic Form**: React Hook Form drives the form state. API form schema (`GET /api/products/{code}/form-schema/{taskType}`) is translated into Zod validation schemas at runtime. Conditional fields (T-03 API toggle for Both products, T-04 issue type) use RHF's `watch()` for show/hide. Document upload per required doc. `formState.errors` powers inline validation and mandatory field counter. Auto-save draft every 60s via `watch()` + debounced localStorage/API persist.
- **Step 4 — Review & Submit**: read-only summary. Edit button returns to step 3. Submit posts to API.
- **Step 5 — Confirmation**: centered card, ticket ID, routed-to stage, view/create-another buttons.
- **APIs**: `GET /api/products`, `GET /api/products/{code}/tasks`, `GET /api/products/{code}/form-schema/{taskType}`, `POST /api/tickets`

#### S-03 · Ticket Detail
- **Header**: ticket ID (display-sm), chips row (product, task, status, SLA, access path for T-03). Cancel button if status=Submitted and user=requester.
- **Workflow Progress Bar**: uses WorkflowProgress shared component.
- **Main content (left 65%)**: ticket details card (read-only form data), fulfilment record card (post-provisioning), clarification exchange (yellow card with response textarea).
- **Right panel (35%, sticky)**: actions card (role-dependent buttons → modals), SLA details card (progress bar, time remaining), partner info card (lifecycle state, open tickets), quick facts card.
- **Bottom tabs**: Comments (chronological, add comment form), Documents (grid, download, upload), Audit Trail (timeline log, export CSV/PDF).
- **Action modals**: Approve & Advance, Reject, Return for Clarification, Reassign, Close Phase (T-02), Mark Complete, Signal UAT Complete. Each requires comment/reason.
- **APIs**: `GET /api/tickets/{id}`, `GET /api/tickets/{id}/comments`, `GET /api/tickets/{id}/audit`, `PUT /api/tickets/{id}/advance`, `/reject`, `/return`, `/respond`, `/cancel`, `/reassign`

#### S-04 · Team Queue
- **Pinned sections**: Breached (red tint, pinned top), At Risk (amber tint).
- **Filter bar**: inline chip dropdowns — product, task, stage, SLA status, access path (T-03). Clear all link.
- **Ticket table**: columns per Stitch spec. Sortable by ticket ID, partner, SLA status, time remaining. Alternating rows, click → ticket detail.
- **Pagination**: 20 per page.
- **API**: `GET /api/dashboard/team-queue`

#### S-05 · My Tickets
- Requester's ticket list.
- Sortable by date, status, product, task.
- Pending action tickets surfaced with CTA.
- T-02 tickets show current phase.
- **API**: `GET /api/dashboard/my-tickets`

#### S-06 · Partner Lookup & Profile
- **Lookup view**: search bar, results list (partner name, products, lifecycle states).
- **Profile view**: partner header (name, products, lifecycle per product), chronological ticket timeline (clickable), agreement status, UAT status, active accounts/users. Read-only.
- **APIs**: `GET /api/partners`, `GET /api/partners/{id}`

#### S-07 · Notifications
- Full notification list (paginated).
- Each: icon + title + timestamp + unread dot.
- Mark as read (individual + bulk).
- Click → navigate to linked ticket.
- **APIs**: `GET /api/notifications`, `PUT /api/notifications/{id}/read`, `PUT /api/notifications/read-all`

#### S-08 · Advanced Search
- Multi-filter form: product, task, status, lifecycle state, SLA status, date range, requester, assigned team, partner name, access path.
- AND logic, clear individually or all.
- Results table (same as team queue columns).
- CSV export button.
- Saved filters: save/recall/delete by name.
- **APIs**: `GET /api/tickets/search`, `GET/POST/DELETE /api/saved-filters`

#### S-09 · Reports Dashboard
- Metrics per spec: total requests by period, product/task breakdown, avg resolution time, SLA compliance rate, volume per stage, rejection rate + top reasons, API vs portal split (T-03), T-02 phase durations.
- Date range filter: 7/30/90 days or custom.
- Charts via Recharts (bar, line, pie as appropriate).
- CSV export.
- **APIs**: `GET /api/reports/summary`, `GET /api/reports/sla`, `GET /api/reports/volume`, etc.

#### S-10 · Admin: User Management
- User table: name, email, role (chip), status (active/inactive).
- Search bar with real-time filter.
- Click row → edit user modal.
- Add User button → add user modal.
- Modal form fields per `Docs/stitch-prompts/12-user-form.md`.
- **APIs**: `GET /api/admin/users`, `POST /api/admin/users`, `PUT /api/admin/users/{id}`

#### S-11 · Admin: Workflow Configuration
- Product tabs (Rabet, Rhoon, Wtheeq, Mulem).
- Workflow card per task: stage pipeline visualization with arrows.
- T-03 shows portal + API paths.
- Edit button → modal: reorder stages (drag), add/remove stages, assign roles per stage.
- "Changes apply to new tickets only" note.
- **APIs**: `GET /api/admin/workflow-config`, `PUT /api/admin/workflow-config/{productCode}/{taskType}`

#### S-12 · Admin: SLA Settings
- Product tabs.
- Editable table: task, stage, SLA hours, 75% threshold, 90% threshold. Inline number inputs.
- Grouped by task type.
- Save button. "Applies to new tickets only" note.
- **APIs**: `GET /api/admin/sla-config`, `PUT /api/admin/sla-config/{productCode}/{taskType}`

#### S-13 · Admin: Business Hours & Holidays
- **Business hours card** (left 50%): day checkboxes (Sun-Sat), start/end time pickers, timezone display (GST/UTC+4). Save button.
- **Holiday calendar card** (right 50%): year selector, chronological holiday list (date + name + delete), Add Holiday modal (date picker + name).
- **Delegate approvers section** (full width below): table (primary, delegate, scope, period, delete), Add Delegate modal.
- **APIs**: `GET/PUT /api/admin/business-hours`, `POST/DELETE /api/admin/holidays`, `GET/POST/DELETE /api/admin/delegates`

---

## 5. Dependencies

```json
{
  "dependencies": {
    "react": "^19.x",
    "react-dom": "^19.x",
    "react-router": "^7.x",
    "@tanstack/react-query": "^5.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-tabs": "^1.x",
    "@radix-ui/react-dropdown-menu": "^1.x",
    "@radix-ui/react-select": "^1.x",
    "@radix-ui/react-toast": "^1.x",
    "@radix-ui/react-toggle": "^1.x",
    "axios": "^1.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "zod": "^3.x",
    "recharts": "^2.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "tailwindcss": "^4.x",
    "@tailwindcss/vite": "^4.x",
    "typescript": "^5.x"
  }
}
```

---

## 6. API Base URL

Configurable via environment variable:
- Development: `VITE_API_URL=http://localhost:5000/api`
- Production: set at deployment

---

## 7. Implementation Order

```
F-01 Design System & Tailwind Config
 └─► F-02 Shared UI Components
      └─► F-03 App Shell & Routing
           └─► F-04 Auth & API Layer
                └─► S-01 Dashboard
                     └─► S-02 New Request
                          └─► S-03 Ticket Detail
                               └─► S-04 Team Queue
                                    └─► S-05 My Tickets
                                         └─► S-06 Partner Lookup & Profile
                                              └─► S-07 Notifications
                                                   └─► S-08 Advanced Search
                                                        └─► S-09 Reports
                                                             └─► S-10 Admin: Users
                                                                  └─► S-11 Admin: Workflows
                                                                       └─► S-12 Admin: SLA Settings
                                                                            └─► S-13 Admin: Business Hours
```

Foundation tasks are sequential (each builds on the previous). Screen slices are sequential by priority but could be parallelized after F-04 if multiple developers are available.
