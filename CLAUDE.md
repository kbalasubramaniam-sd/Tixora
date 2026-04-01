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

### 3. Post-Build Visual Audit
- After building, a review subagent compares the Stitch HTML element-by-element against the React output
- Check: colors, font sizes/weights, spacing (padding/margin/gap), border-radius, shadows, hover effects
- Any mismatch = fix before committing

### Stitch Reference Files
- Location: `frontend/.stitch-ref/` (gitignored, ephemeral)
- Screen map is in `Docs/superpowers/specs/2026-04-01-frontend-architecture-design.md` Section 1

## Docs

- Product spec: `Docs/spm_portal_story.md`
- Design system: `Docs/Stitch_initialDesign.md`
- Stitch UI prompts: `Docs/stitch-prompts/`
- Implementation plans: `docs/superpowers/plans/`
