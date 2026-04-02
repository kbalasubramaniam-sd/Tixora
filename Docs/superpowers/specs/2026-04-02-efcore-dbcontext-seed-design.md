# EF Core DbContext + Seed Data — Design Spec

## Goal

Create `TixoraDbContext` implementing `ITixoraDbContext`, configure all 9 existing entities with Fluent API, seed reference data (products, users, partners, workflows, stages), create the initial EF migration, wire DI, and add an integration test that verifies seeded data loads correctly.

## Tech Stack

- .NET 10, EF Core 10, SQL Server
- `ITixoraDbContext` already defined in `Application/Interfaces/`
- EF Core packages already in `Infrastructure.csproj`
- `Microsoft.EntityFrameworkCore.Design` already in `API.csproj`

---

## 1. TixoraDbContext

**File:** `src/Tixora.Infrastructure/Data/TixoraDbContext.cs`

- Extends `DbContext`, implements `ITixoraDbContext`
- 9 DbSets: `Products`, `Partners`, `PartnerProducts`, `Users`, `Tickets`, `WorkflowDefinitions`, `StageDefinitions`, `StageLogs`, `AuditEntries`
- `OnModelCreating` calls `modelBuilder.ApplyConfigurationsFromAssembly(typeof(TixoraDbContext).Assembly)` to auto-discover all `IEntityTypeConfiguration<T>`

## 2. Entity Configurations

One file per entity in `src/Tixora.Infrastructure/Data/Configurations/`. All implement `IEntityTypeConfiguration<T>`.

### ProductConfiguration
- PK: `Code` (enum `ProductCode`, stored as int)
- `Name`: required, max 100
- `Description`: required, max 500
- `ProductAccessMode`: stored as int
- `PortalType`: stored as int

### PartnerConfiguration
- PK: `Id` (Guid)
- `Name`: required, max 200
- `Alias`: optional, max 200
- Has many `PartnerProducts`

### PartnerProductConfiguration
- PK: `Id` (Guid)
- FK: `PartnerId` → Partner (cascade delete)
- FK: `ProductCode` → Product (restrict — can't delete a product)
- `CompanyCode`: optional, max 50
- `LifecycleState`: stored as int, default `None`
- Unique index: `(PartnerId, ProductCode)`

### UserConfiguration
- PK: `Id` (Guid)
- `FullName`: required, max 200
- `Email`: required, max 200, unique index
- `PasswordHash`: required, max 200
- `Role`: stored as int
- `IsActive`: default true

### TicketConfiguration
- PK: `Id` (Guid)
- `TicketId`: required, max 50, unique index
- FK: `PartnerProductId` → PartnerProduct (restrict)
- FK: `CreatedByUserId` → User (restrict)
- FK: `AssignedToUserId` → User (restrict, optional)
- FK: `WorkflowDefinitionId` → WorkflowDefinition (restrict)
- `FormData`: required (nvarchar(max))
- `Status`: stored as int
- `TaskType`: stored as int
- `ProductCode`: stored as int
- `ProvisioningPath`: stored as int (optional)
- `IssueType`: stored as int (optional)
- `RejectedTicketRef`: optional Guid (no FK — soft reference)
- `CancellationReason`: optional, max 1000
- Indexes: `PartnerProductId`, `Status`, `AssignedToUserId`

### WorkflowDefinitionConfiguration
- PK: `Id` (Guid)
- `ProductCode`: stored as int
- `TaskType`: stored as int
- `ProvisioningPath`: stored as int (optional)
- `Version`: required int
- `IsActive`: required bool
- Filtered unique index: `(ProductCode, TaskType, ProvisioningPath)` WHERE `IsActive = true`
- Has many `Stages`

### StageDefinitionConfiguration
- PK: `Id` (Guid)
- FK: `WorkflowDefinitionId` → WorkflowDefinition (cascade delete)
- `StageName`: required, max 200
- `StageType`: stored as int
- `AssignedRole`: stored as int
- `SlaBusinessHours`: required int
- Unique index: `(WorkflowDefinitionId, StageOrder)`

### StageLogConfiguration
- PK: `Id` (Guid)
- FK: `TicketId` → Ticket (cascade delete)
- FK: `ActorUserId` → User (restrict)
- FK: `ReassignedToUserId` → User (restrict, optional)
- `StageName`: required, max 200
- `Action`: stored as int
- `Comments`: optional, max 2000
- Index: `TicketId`

### AuditEntryConfiguration
- PK: `Id` (Guid)
- FK: `TicketId` → Ticket (cascade delete)
- FK: `ActorUserId` → User (restrict)
- `ActionType`: required, max 100
- `Details`: optional (nvarchar(max))
- Index: `TicketId`

## 3. Seed Data

Split into focused files in `src/Tixora.Infrastructure/Data/Seed/`. Each is a static class with a `Seed(ModelBuilder)` method called from `OnModelCreating` via `HasData`.

### SeedProducts.cs — 4 products

| Code | Name | Description | AccessMode | PortalType |
|------|------|-------------|------------|------------|
| RBT | Rabet | Insurance data to ICP | Both | Transactional |
| RHN | Rhoon | Mortgage transactions | Both | Transactional |
| WTQ | Wtheeq | Vehicle insurance data | Both | ReadOnly |
| MLM | Mulem | Motor insurance pricing | Both | ReadOnly |

### SeedUsers.cs — 12 users

All use `Guid.CreateVersion7()` for IDs, BCrypt-hashed passwords (all `"Password1!"` for dev), `IsActive = true`.

| FullName | Email | Role |
|----------|-------|------|
| Sarah Ahmad | sarah.ahmad@tixora.ae | Requester |
| Omar Khalid | omar.khalid@tixora.ae | LegalTeam |
| Hannoun | hannoun@tixora.ae | ProductTeam |
| Albaha | albaha@tixora.ae | ProductTeam |
| Fatima Noor | fatima.noor@tixora.ae | Approver |
| Khalid Rashed | khalid.rashed@tixora.ae | IntegrationTeam |
| Ahmed Tariq | ahmed.tariq@tixora.ae | DevTeam |
| Layla Hassan | layla.hassan@tixora.ae | BusinessTeam |
| Vilina Sequeira | vilina.sequeira@tixora.ae | PartnerOps |
| Sara Raeed | sara.raeed@tixora.ae | PartnerOps |
| Shayman Ali | shayman.ali@tixora.ae | PartnerOps |
| Admin User | admin@tixora.ae | SystemAdministrator |

### SeedPartners.cs — 3 partners + 6 partner-products

| Partner Name | Alias | Products |
|-------------|-------|----------|
| Al Ain Insurance | AAI | Rabet (None), Wtheeq (None) |
| Dubai Islamic Bank | DIB | Rhoon (None), Mulem (None) |
| Emirates Insurance | EIC | Rabet (None), Rhoon (None) |

All start at `LifecycleState.None`, no CompanyCode yet.

### SeedWorkflows.cs — workflow definitions + stage definitions

**6 workflow definitions** (one per unique ProductCode × TaskType × ProvisioningPath):

Since all products share the same workflows per task type, we seed one workflow definition per task type variant. The `ProductCode` on the workflow definition means we need one per product — but for MVP 1, since workflows are identical across products within each task type, we can seed **per product** or use a shared pattern. 

**Decision: seed per product.** Each product gets its own WorkflowDefinition for each applicable TaskType. This gives us:
- 4 products × T-01 = 4 workflow definitions
- 4 products × T-02 = 4 workflow definitions
- Rabet T-03 × 2 paths (PortalOnly, PortalAndApi) = 2
- Rhoon T-03 × 2 paths = 2
- Wtheeq T-03 × 1 path (ApiOnly) = 1
- Mulem T-03 × 1 path (ApiOnly) = 1
- 4 products × T-04 = 4 workflow definitions
- **Total: 18 workflow definitions**

Stage definitions per workflow (from `workflow-visual-v2.html`):

**T-01 stages (4 per workflow):**

| Order | Name | Type | Role | SLA hrs |
|-------|------|------|------|---------|
| 1 | Legal Review | Review | LegalTeam | 24 |
| 2 | Product Review | Review | ProductTeam | 16 |
| 3 | EA Sign-off | Approval | Approver | 8 |
| 4 | Stakeholder Notification | Review | Requester | 0 |

**T-02 stages (5 per workflow):**

| Order | Name | Type | Role | SLA hrs |
|-------|------|------|------|---------|
| 1 | Product Team Review | Review | ProductTeam | 8 |
| 2 | Access Provisioning | Provisioning | IntegrationTeam | 8 |
| 3 | API Credential Creation | Provisioning | DevTeam | 8 |
| 4 | Awaiting UAT Signal | PhaseGate | Requester | 0 |
| 5 | UAT Sign-off | Approval | IntegrationTeam | 8 |

**T-03 Portal Only stages (4):**

| Order | Name | Type | Role | SLA hrs |
|-------|------|------|------|---------|
| 1 | Partner Ops Review | Review | PartnerOps | 8 |
| 2 | Product Team Sign-off | Approval | ProductTeam | 8 |
| 3 | Dev Provisioning | Provisioning | DevTeam | 8 |
| 4 | Business Provisioning | Provisioning | BusinessTeam | 8 |

**T-03 Portal + API stages (5):**

| Order | Name | Type | Role | SLA hrs |
|-------|------|------|------|---------|
| 1 | Partner Ops Review | Review | PartnerOps | 8 |
| 2 | Product Team Sign-off | Approval | ProductTeam | 8 |
| 3 | Dev Provisioning | Provisioning | DevTeam | 24 |
| 4 | Business Provisioning | Provisioning | BusinessTeam | 24 |
| 5 | API Provisioning | Provisioning | IntegrationTeam | 24 |

**T-03 API Only stages (3):**

| Order | Name | Type | Role | SLA hrs |
|-------|------|------|------|---------|
| 1 | Partner Ops Review | Review | PartnerOps | 8 |
| 2 | Product Team Sign-off | Approval | ProductTeam | 8 |
| 3 | API Provisioning | Provisioning | IntegrationTeam | 24 |

**T-04 stages (1):**

| Order | Name | Type | Role | SLA hrs |
|-------|------|------|------|---------|
| 1 | Verify & Resolve | Provisioning | DevTeam | 2 |

Note: T-04 supports assignment to DevTeam, IntegrationTeam, or BusinessTeam. The `AssignedRole` defaults to DevTeam. Cross-team reassignment is handled by the workflow engine at runtime, not in stage definition.

## 4. DI Registration

**File:** `src/Tixora.Infrastructure/DependencyInjection.cs`

Static extension method `AddInfrastructure(this IServiceCollection, IConfiguration)`:
- Registers `TixoraDbContext` with SQL Server connection string from `ConnectionStrings:DefaultConnection`
- Registers `ITixoraDbContext` as scoped → `TixoraDbContext`

**File:** `src/Tixora.API/Program.cs`
- Remove weatherforecast boilerplate
- Call `builder.Services.AddInfrastructure(builder.Configuration)`
- Add `app.UseHttpsRedirection()`
- Add Swashbuckle (per CLAUDE.md — project uses Swashbuckle for Swagger UI)

**File:** `src/Tixora.API/appsettings.json`
- Add `ConnectionStrings:DefaultConnection` pointing to local SQL Server

## 5. Initial Migration

```bash
dotnet ef migrations add InitialCreate --project src/Tixora.Infrastructure --startup-project src/Tixora.API
```

## 6. Integration Test

**File:** `tests/Tixora.Infrastructure.Tests/` — new test project

Actually, we'll use the existing `tests/Tixora.API.Tests/` project with `WebApplicationFactory<Program>` for a true integration test against an in-memory database (or SQL Server if available).

**Test:** Boot the app, query `/` or use DbContext directly to verify:
- 4 products seeded with correct codes and portal types
- 12 users seeded with correct roles
- 3 partners with 6 partner-products
- 18 workflow definitions with correct stage counts
- All stage definitions have valid roles and SLA values

Using `Microsoft.EntityFrameworkCore.InMemory` for test speed (add package to test project). One test class: `SeedDataTests.cs`.
