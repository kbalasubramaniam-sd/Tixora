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
- T-03: Production Account Creation (merged partner account + user setup, with API opt-in)
- T-04: Access & Credential Support

## Partner Lifecycle

```
None → [T-01] → Onboarded → [T-02] → UatActive → [T-03] → Live
```

- Partners are seeded data (MVP 1). Admin partner management deferred to MVP 2.
- Partner.Name = company name (shared). PartnerProduct.CompanyCode = per product.
- All ticket forms: Partner Name = dropdown, Company Code = read-only.

## Key Conventions

- **No external workflow packages** — custom WorkflowEngine.cs, pure service
- **Workflow rules are seeded** — no dynamic editing in MVP 1
- **All workflows are sequential** — no parallel stages, stage order from seed data
- **Generic naming** — clear, plain language over technical jargon
- **Product-level attributes** — variations driven by product config, not per-ticket toggles
- **Fully internal** — no external user visibility, no "internal notes" concept
- **SLA in business hours** — Sun-Thu, 08:00-17:00 GST
- **SLA = 0 means no tracking** — for external wait gates (e.g., UAT signal)
- **Ticket ID format:** SPM-[PRODUCT]-[TASK]-[YYYYMMDD]-[SEQ]
- **Aggressive MVP scoping** — defer non-essential features to MVP 2
- **Guid.CreateVersion7()** — use for all entity IDs (.NET 10 time-ordered GUIDs)
- **Explicit enum values** — all enums have hardcoded int values (DB safety)
- **Phone fields** — tel input, numeric only (digits, +, spaces, dashes)

## dotnet-claude-kit Overrides

The dotnet-claude-kit plugin is installed. These project-specific rules OVERRIDE plugin defaults:

- **USE ITixoraDbContext** — services inject `ITixoraDbContext` (in Application/Interfaces) for all data access. No repository pattern.
- **USE Swashbuckle** — the plugin prefers built-in OpenAPI. We use Swashbuckle for Swagger UI.
- **Controllers, not minimal APIs** — this project uses controller-based endpoints, not minimal APIs.

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

### 3. Post-Build Visual Audit (MANDATORY)

After building any screen, the reviewer subagent must systematically diff every HTML element in the Stitch file against the React output. This is not optional — it is a line-by-line comparison.

**How to audit:** Open the Stitch HTML file. For every element with a `class=` attribute, find the corresponding React element and verify every single class matches. If a class doesn't exist in our Tailwind config, it must be added to `@theme` in `index.css` or as a custom CSS class.

#### A. Tailwind Token Alignment
- [ ] Every color class in Stitch HTML exists in our `@theme` (e.g. `text-teal-800` may need mapping to `text-primary`)
- [ ] Every font-family class exists (`font-headline`, `font-body`, `font-label`, `font-sans`)
- [ ] Every custom gradient class exists (`.primary-gradient`, `.glass`, `.gradient-primary`)
- [ ] Every custom utility class exists (`.focus-glow`, `.ghost-border`)
- [ ] Arbitrary values in Stitch (e.g. `text-[10px]`, `tracking-[0.05em]`, `shadow-[0_20px_40px...]`) are copied exactly

#### B. Element-by-Element Comparison
For each element, verify ALL of:
- [ ] **Tag type** — `<button>` vs `<div>`, `<section>` vs `<div>`, `<a>` vs `<div>`
- [ ] **Font family** — `font-headline`, `font-body`, `font-label` on the correct elements
- [ ] **Font size** — exact class: `text-4xl`, `text-xl`, `text-lg`, `text-sm`, `text-xs`, `text-[10px]`, `text-[11px]`
- [ ] **Font weight** — `font-black`, `font-extrabold`, `font-bold`, `font-semibold`, `font-medium`
- [ ] **Letter spacing** — `tracking-tight`, `tracking-tighter`, `tracking-widest`, `tracking-wider`, `tracking-[0.05em]`, `tracking-[0.2em]`
- [ ] **Text transform** — `uppercase` present or absent
- [ ] **Text color** — exact token including opacity: `text-on-surface`, `text-primary`, `text-slate-400`, `text-on-surface-variant/50`
- [ ] **Background color** — exact token: `bg-surface-container-low`, `bg-primary/10`, `bg-white`
- [ ] **Padding** — `p-4`, `p-6`, `p-8`, `px-3 py-1.5`, etc.
- [ ] **Margin/gap** — `mb-2`, `mb-6`, `mb-8`, `gap-2`, `gap-4`, `gap-6`, `gap-8`, `space-y-4`
- [ ] **Dimensions** — `w-8 h-8`, `w-10 h-10`, `w-12 h-12`, `w-14 h-14`, `h-[80px]`
- [ ] **Border radius** — `rounded`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`
- [ ] **Borders** — `border-2 border-transparent`, `border-dashed`, `border-outline-variant/30`, `ring-4 ring-primary-container/20`
- [ ] **Shadows** — default shadow at rest AND hover shadow. `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, custom `shadow-[...]`
- [ ] **Grid/flex layout** — `grid-cols-1 md:grid-cols-2`, `flex items-center gap-4`, `justify-between`
- [ ] **Container width** — `max-w-4xl`, `max-w-5xl`, `max-w-6xl`

#### C. Icons
- [ ] Correct Material Symbol name (grep for `material-symbols-outlined` in Stitch HTML)
- [ ] Filled icons: check for `style="font-variation-settings: 'FILL' 1"` — must be replicated as inline style
- [ ] Icon size class matches exactly
- [ ] Icon color class matches exactly

#### D. Interactive States
- [ ] **Hover** — every `hover:` class in Stitch HTML is present: `hover:-translate-y-1`, `hover:shadow-xl`, `hover:bg-surface-container-high`, `hover:text-primary`, `hover:opacity-100`, `hover:border-primary/20`
- [ ] **Focus** — `focus:ring-2 focus:ring-primary/20`, `focus:bg-white`, `focus-glow`
- [ ] **Active** — `active:scale-95`, `active:scale-[0.99]`
- [ ] **Disabled** — `opacity-50 cursor-not-allowed`
- [ ] **Group hover** — `group` on parent + `group-hover:` on children (e.g. `opacity-0 group-hover:opacity-100`)
- [ ] **Transitions** — `transition-all`, `transition-colors`, `transition-transform`, `transition-opacity`, `duration-200`, `duration-300`

#### E. Component-Specific Checks
- [ ] **Stepper** — circle size, bg color (solid vs gradient), text color, ring effect, connecting line color (completed vs future), label position and styling
- [ ] **Cards** — visible at rest (shadow-md/shadow-sm, not just on hover), correct surface tier bg
- [ ] **Buttons** — gradient direction, shadow color (`shadow-primary/20`), border-radius, font weight
- [ ] **Inputs** — bg color, border style (none vs outline), focus ring, height, placeholder color
- [ ] **Chips/badges** — bg color, text color, font size, tracking, uppercase, border-radius
- [ ] **Document uploads** — pending vs uploaded state styling identical to FileUpload component

#### F. Things That Stitch Generates But We Might Miss
- [ ] Inline `style=` attributes (especially `font-variation-settings`)
- [ ] Pseudo-elements via `before:` classes (e.g. timeline lines)
- [ ] Responsive breakpoints (`md:`, `lg:`, `xl:`, `hidden md:block`)
- [ ] Dark mode classes (ignore — we only support light mode)
- [ ] Decorative elements (background blurs, gradients) — include if visible in screenshot

### Stitch Reference Files
- Location: `frontend/.stitch-ref/` (gitignored, ephemeral)
- Screen map is in `Docs/superpowers/specs/2026-04-01-frontend-architecture-design.md` Section 1

## Docs

- Product spec: `Docs/spm_portal_story.md`
- Design system: `Docs/Stitch_initialDesign.md`
- Stitch UI prompts: `Docs/stitch-prompts/`
- Implementation plans: `docs/superpowers/plans/`
