# Tixora — Strategic Partner Management Portal

Internal operations portal for managing partner-facing requests across 4 government-integrated platforms in the UAE. All users are internal employees.

## Tech Stack

- **Backend:** C# / .NET 10 (ASP.NET Core Web API), Clean Architecture Monolith
- **Frontend:** React (built separately via Google Stitch, not in .NET solution)
- **Database:** SQL Server + Entity Framework Core 10
- **Auth:** Fake auth middleware (seeded users + JWT) — real SSO in MVP 2
- **Email:** Deferred to MVP 2 (in-app notifications only for MVP 1)

## Architecture

Clean Architecture layers: `Domain` <- `Application` <- `Infrastructure` <- `API`

Solution structure:
```
src/
  Tixora.Domain/         # Entities, enums, value objects, domain events
  Tixora.Application/    # Use cases, interfaces, DTOs, validators
  Tixora.Infrastructure/ # EF Core, DbContext, repositories, services
  Tixora.API/            # Controllers, middleware, DI config
```

## Products

| Product | Code | Access Type | Portal Type |
|---------|------|-------------|-------------|
| Rabet   | RBT  | Both        | Transactional |
| Rhoon   | RHN  | Both        | Transactional |
| Wtheeq  | WTQ  | API         | Read-only |
| Mulem   | MLM  | API         | Read-only |

## Task Types

- T-01: Agreement Validation & Sign-off
- T-02: UAT Access Creation (two-phase)
- T-03: Partner Account Creation (product-driven access path)
- T-04: User Account Creation
- T-05: Access & Credential Support

## Key Conventions

- **No external workflow packages** — custom WorkflowEngine.cs, pure service
- **Workflow rules are seeded** — no dynamic editing in MVP 1
- **Generic naming** — clear, plain language over technical jargon
- **Product-level attributes** — variations driven by product config, not per-ticket toggles
- **Fully internal** — no external user visibility, no "internal notes" concept
- **SLA in business hours** — Sun-Thu, 08:00-17:00 GST
- **Ticket ID format:** SPM-[PRODUCT]-[TASK]-[YYYYMMDD]-[SEQ]
- **Aggressive MVP scoping** — defer non-essential features to MVP 2

## Commands

```bash
# Build (once solution exists)
dotnet build src/Tixora.sln

# Run API
dotnet run --project src/Tixora.API

# Run tests
dotnet test

# EF migrations
dotnet ef migrations add <Name> --project src/Tixora.Infrastructure --startup-project src/Tixora.API
dotnet ef database update --project src/Tixora.Infrastructure --startup-project src/Tixora.API
```

## Frontend Screen Build Workflow (MANDATORY)

When building or modifying any frontend screen, follow this process exactly:

### 1. Pull Stitch Reference
- Download the Stitch HTML for the screen to `frontend/.stitch-ref/<screen-name>.html`
- Pull the Stitch screenshot and view it for visual context
- Stitch project ID: `14130211189051506529`

### 2. Build from Stitch HTML (not summaries)
- The subagent/implementer MUST read the Stitch HTML file directly
- Copy exact Tailwind classes from Stitch HTML to React components — do NOT translate or summarize
- Every element must match: font size, font weight, tracking, colors, padding, margin, gap, radius, shadow
- When Stitch uses a custom Tailwind color (e.g. `text-teal-800`), map it to the closest design token or use the exact class

### 3. Post-Build Visual Audit Checklist
After building, run through this checklist against the Stitch HTML. Every item must match.

**Icons:**
- [ ] Correct Material Symbol icon name (e.g. `hub` not `home`)
- [ ] Filled vs outlined — check `font-variation-settings: 'FILL' 1` in Stitch `style=` attributes
- [ ] Icon size class (e.g. `text-3xl`, `text-xl`, `text-lg`)
- [ ] Icon color class

**Typography:**
- [ ] Font size (e.g. `text-4xl`, `text-[11px]`, `text-sm`)
- [ ] Font weight (`font-bold`, `font-extrabold`, `font-semibold`, `font-medium`)
- [ ] Letter spacing (`tracking-tight`, `tracking-widest`, `tracking-[0.05em]`)
- [ ] Text transform (`uppercase`, none)
- [ ] Text color (exact token: `text-on-surface` vs `text-on-surface-variant` vs `text-primary`)
- [ ] Opacity modifiers (`opacity-70`, `text-on-surface-variant/50`)

**Layout & Spacing:**
- [ ] Container max-width (`max-w-4xl` vs `max-w-6xl`)
- [ ] Grid columns and gap
- [ ] Padding values (`p-6` vs `p-8`)
- [ ] Margin/gap between sections (`mb-6` vs `mb-10` vs `mb-12`)
- [ ] Element dimensions (`w-14 h-14` vs `w-12 h-12`)

**Visual Effects:**
- [ ] Default shadows (cards visible at rest, not just on hover)
- [ ] Hover effects (translate, shadow change, opacity transitions)
- [ ] Border radius (`rounded-xl`, `rounded-full`, `rounded-lg`)
- [ ] Border styles (`border-2 border-transparent hover:border-primary/20`)
- [ ] Background colors and opacity modifiers

**Interactive States:**
- [ ] Hover classes present and matching
- [ ] Focus ring styles
- [ ] Disabled/inactive states
- [ ] Cursor styles
- [ ] Transition duration and easing

### Stitch Reference Files
- Location: `frontend/.stitch-ref/` (gitignored, ephemeral)
- Screen map is in `Docs/superpowers/specs/2026-04-01-frontend-architecture-design.md` Section 1

## Docs

- Product spec: `Docs/spm_portal_story.md`
- Design system: `Docs/Stitch_initialDesign.md`
- Stitch UI prompts: `Docs/stitch-prompts/`
- Implementation plans: `docs/superpowers/plans/`
