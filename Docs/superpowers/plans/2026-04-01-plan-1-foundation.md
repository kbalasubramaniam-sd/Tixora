# Plan 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the .NET solution scaffold, define the full domain model (entities, enums, value objects, interfaces), configure EF Core with all entity configurations, seed reference data, wire up fake JWT auth, and expose basic Product & Partner read endpoints — producing a running API that returns seeded data.

**Architecture:** Clean Architecture Monolith — Domain ← Application ← Infrastructure ← API. Domain has zero dependencies. Application depends on Domain. Infrastructure depends on Application + Domain. API references all layers and wires DI.

**Tech Stack:** .NET 10, ASP.NET Core Web API, Entity Framework Core 10, SQL Server, BCrypt.Net, System.IdentityModel.Tokens.Jwt

---

## File Map

### Tixora.Domain

| File | Responsibility |
|------|---------------|
| `src/Tixora.Domain/Tixora.Domain.csproj` | Project file (no dependencies) |
| `src/Tixora.Domain/Enums/ProductCode.cs` | RBT, RHN, WTQ, MLM |
| `src/Tixora.Domain/Enums/TaskType.cs` | T01–T04 |
| `src/Tixora.Domain/Enums/ProductAccessMode.cs` | Both, ApiOnly |
| `src/Tixora.Domain/Enums/ProvisioningPath.cs` | PortalOnly, PortalAndApi, ApiOnly |
| `src/Tixora.Domain/Enums/TicketStatus.cs` | Submitted through Cancelled |
| `src/Tixora.Domain/Enums/LifecycleState.cs` | Agreed–Live |
| `src/Tixora.Domain/Enums/StageType.cs` | Review, Approval, Provisioning, PhaseGate |
| `src/Tixora.Domain/Enums/StageAction.cs` | Approve through Reassign |
| `src/Tixora.Domain/Enums/SlaStatus.cs` | OnTrack–Breached |
| `src/Tixora.Domain/Enums/UserRole.cs` | 6 roles |
| `src/Tixora.Domain/Enums/NotificationType.cs` | 19 notification types |
| `src/Tixora.Domain/Enums/IssueType.cs` | 3 issue types for T-04 |
| `src/Tixora.Domain/Entities/Product.cs` | Seeded, immutable product definition |
| `src/Tixora.Domain/Entities/Partner.cs` | Partner with PartnerProducts collection |
| `src/Tixora.Domain/Entities/PartnerProduct.cs` | Lifecycle state per product per partner |
| `src/Tixora.Domain/Entities/Ticket.cs` | Core ticket entity |
| `src/Tixora.Domain/Entities/StageLog.cs` | Stage action log |
| `src/Tixora.Domain/Entities/AuditEntry.cs` | Immutable audit trail |
| `src/Tixora.Domain/Entities/SlaTracker.cs` | SLA tracking per stage |
| `src/Tixora.Domain/Entities/Document.cs` | Uploaded file metadata |
| `src/Tixora.Domain/Entities/Comment.cs` | Ticket comment |
| `src/Tixora.Domain/Entities/Notification.cs` | In-app notification |
| `src/Tixora.Domain/Entities/FulfilmentRecord.cs` | Completion record |
| `src/Tixora.Domain/Entities/User.cs` | Internal user |
| `src/Tixora.Domain/Entities/DelegateApprover.cs` | Delegate approval mapping |
| `src/Tixora.Domain/Entities/WorkflowDefinition.cs` | Product×Task workflow definition |
| `src/Tixora.Domain/Entities/StageDefinition.cs` | Stage within a workflow |
| `src/Tixora.Domain/Entities/BusinessHoursConfig.cs` | Working hours config |
| `src/Tixora.Domain/Entities/Holiday.cs` | Holiday exclusion |
| `src/Tixora.Domain/Entities/SavedFilter.cs` | User's saved search filter |
| `src/Tixora.Domain/Interfaces/IProductRepository.cs` | Product data access |
| `src/Tixora.Domain/Interfaces/IPartnerRepository.cs` | Partner data access |
| `src/Tixora.Domain/Interfaces/IUserRepository.cs` | User data access |

### Tixora.Application

| File | Responsibility |
|------|---------------|
| `src/Tixora.Application/Tixora.Application.csproj` | References Domain |
| `src/Tixora.Application/DTOs/Auth/LoginRequest.cs` | Login DTO |
| `src/Tixora.Application/DTOs/Auth/LoginResponse.cs` | JWT response DTO |
| `src/Tixora.Application/DTOs/Products/ProductResponse.cs` | Product list response |
| `src/Tixora.Application/DTOs/Products/TaskInfoResponse.cs` | Available tasks per product |
| `src/Tixora.Application/DTOs/Partners/PartnerListResponse.cs` | Partner list response |
| `src/Tixora.Application/DTOs/Partners/PartnerProfileResponse.cs` | Partner detail with lifecycle |
| `src/Tixora.Application/Interfaces/IAuthService.cs` | Auth service interface |
| `src/Tixora.Application/Services/AuthService.cs` | JWT login logic |
| `src/Tixora.Application/Services/ProductService.cs` | Product queries |
| `src/Tixora.Application/Services/PartnerService.cs` | Partner queries |

### Tixora.Infrastructure

| File | Responsibility |
|------|---------------|
| `src/Tixora.Infrastructure/Tixora.Infrastructure.csproj` | EF Core + BCrypt packages |
| `src/Tixora.Infrastructure/Data/AppDbContext.cs` | DbContext with all DbSets |
| `src/Tixora.Infrastructure/Data/Configurations/ProductConfiguration.cs` | Product EF config |
| `src/Tixora.Infrastructure/Data/Configurations/PartnerConfiguration.cs` | Partner EF config |
| `src/Tixora.Infrastructure/Data/Configurations/PartnerProductConfiguration.cs` | PartnerProduct EF config |
| `src/Tixora.Infrastructure/Data/Configurations/TicketConfiguration.cs` | Ticket EF config |
| `src/Tixora.Infrastructure/Data/Configurations/StageLogConfiguration.cs` | StageLog EF config |
| `src/Tixora.Infrastructure/Data/Configurations/AuditEntryConfiguration.cs` | AuditEntry EF config |
| `src/Tixora.Infrastructure/Data/Configurations/SlaTrackerConfiguration.cs` | SlaTracker EF config |
| `src/Tixora.Infrastructure/Data/Configurations/DocumentConfiguration.cs` | Document EF config |
| `src/Tixora.Infrastructure/Data/Configurations/CommentConfiguration.cs` | Comment EF config |
| `src/Tixora.Infrastructure/Data/Configurations/NotificationConfiguration.cs` | Notification EF config |
| `src/Tixora.Infrastructure/Data/Configurations/FulfilmentRecordConfiguration.cs` | FulfilmentRecord EF config |
| `src/Tixora.Infrastructure/Data/Configurations/UserConfiguration.cs` | User EF config |
| `src/Tixora.Infrastructure/Data/Configurations/WorkflowDefinitionConfiguration.cs` | WorkflowDefinition EF config |
| `src/Tixora.Infrastructure/Data/Configurations/StageDefinitionConfiguration.cs` | StageDefinition EF config |
| `src/Tixora.Infrastructure/Data/Configurations/DelegateApproverConfiguration.cs` | DelegateApprover EF config |
| `src/Tixora.Infrastructure/Data/Configurations/BusinessHoursConfigConfiguration.cs` | BusinessHoursConfig EF config |
| `src/Tixora.Infrastructure/Data/Configurations/HolidayConfiguration.cs` | Holiday EF config |
| `src/Tixora.Infrastructure/Data/Configurations/SavedFilterConfiguration.cs` | SavedFilter EF config |
| `src/Tixora.Infrastructure/Repositories/ProductRepository.cs` | Product data access impl |
| `src/Tixora.Infrastructure/Repositories/PartnerRepository.cs` | Partner data access impl |
| `src/Tixora.Infrastructure/Repositories/UserRepository.cs` | User data access impl |
| `src/Tixora.Infrastructure/Seed/SeedData.cs` | Orchestrates all seeding |
| `src/Tixora.Infrastructure/Seed/SeedProducts.cs` | 4 products |
| `src/Tixora.Infrastructure/Seed/SeedUsers.cs` | 6 users |
| `src/Tixora.Infrastructure/Seed/SeedWorkflows.cs` | Workflow definitions + stages |
| `src/Tixora.Infrastructure/Seed/SeedBusinessHours.cs` | Default business hours |
| `src/Tixora.Infrastructure/Seed/SeedPartners.cs` | 3 sample partners |

### Tixora.API

| File | Responsibility |
|------|---------------|
| `src/Tixora.API/Tixora.API.csproj` | References all layers |
| `src/Tixora.API/Program.cs` | DI, middleware pipeline, seed trigger |
| `src/Tixora.API/appsettings.json` | Connection string, JWT settings |
| `src/Tixora.API/Middleware/ErrorHandlingMiddleware.cs` | Global exception handler |
| `src/Tixora.API/Controllers/AuthController.cs` | Login + /me |
| `src/Tixora.API/Controllers/ProductsController.cs` | Product list, tasks, form schema |
| `src/Tixora.API/Controllers/PartnersController.cs` | Partner list + profile |

### Tests

| File | Responsibility |
|------|---------------|
| `tests/Tixora.Domain.Tests/Tixora.Domain.Tests.csproj` | Domain test project |
| `tests/Tixora.Domain.Tests/Entities/PartnerProductTests.cs` | Lifecycle state tests |
| `tests/Tixora.Application.Tests/Tixora.Application.Tests.csproj` | Application test project |
| `tests/Tixora.Application.Tests/Services/AuthServiceTests.cs` | Auth service tests |
| `tests/Tixora.API.Tests/Tixora.API.Tests.csproj` | API integration test project |
| `tests/Tixora.API.Tests/Controllers/ProductsControllerTests.cs` | Products endpoint tests |
| `tests/Tixora.API.Tests/Controllers/PartnersControllerTests.cs` | Partners endpoint tests |

### Solution

| File | Responsibility |
|------|---------------|
| `src/Tixora.sln` | Solution file binding all projects |

---

## Task 1: Solution Scaffold

**Files:**
- Create: `src/Tixora.sln`
- Create: `src/Tixora.Domain/Tixora.Domain.csproj`
- Create: `src/Tixora.Application/Tixora.Application.csproj`
- Create: `src/Tixora.Infrastructure/Tixora.Infrastructure.csproj`
- Create: `src/Tixora.API/Tixora.API.csproj`
- Create: `tests/Tixora.Domain.Tests/Tixora.Domain.Tests.csproj`
- Create: `tests/Tixora.Application.Tests/Tixora.Application.Tests.csproj`
- Create: `tests/Tixora.API.Tests/Tixora.API.Tests.csproj`

- [ ] **Step 1: Create the solution and projects**

```bash
cd C:/Claude/Tixora

# Create class library projects
dotnet new classlib -n Tixora.Domain -o src/Tixora.Domain --framework net10.0
dotnet new classlib -n Tixora.Application -o src/Tixora.Application --framework net10.0
dotnet new classlib -n Tixora.Infrastructure -o src/Tixora.Infrastructure --framework net10.0

# Create web API project
dotnet new webapi -n Tixora.API -o src/Tixora.API --framework net10.0 --no-openapi

# Create test projects
dotnet new xunit -n Tixora.Domain.Tests -o tests/Tixora.Domain.Tests --framework net10.0
dotnet new xunit -n Tixora.Application.Tests -o tests/Tixora.Application.Tests --framework net10.0
dotnet new xunit -n Tixora.API.Tests -o tests/Tixora.API.Tests --framework net10.0

# Create solution and add all projects
dotnet new sln -n Tixora -o src
dotnet sln src/Tixora.sln add src/Tixora.Domain/Tixora.Domain.csproj
dotnet sln src/Tixora.sln add src/Tixora.Application/Tixora.Application.csproj
dotnet sln src/Tixora.sln add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj
dotnet sln src/Tixora.sln add src/Tixora.API/Tixora.API.csproj
dotnet sln src/Tixora.sln add tests/Tixora.Domain.Tests/Tixora.Domain.Tests.csproj
dotnet sln src/Tixora.sln add tests/Tixora.Application.Tests/Tixora.Application.Tests.csproj
dotnet sln src/Tixora.sln add tests/Tixora.API.Tests/Tixora.API.Tests.csproj
```

- [ ] **Step 2: Add project references (dependency rule)**

```bash
# Application → Domain
dotnet add src/Tixora.Application/Tixora.Application.csproj reference src/Tixora.Domain/Tixora.Domain.csproj

# Infrastructure → Application + Domain
dotnet add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj reference src/Tixora.Application/Tixora.Application.csproj
dotnet add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj reference src/Tixora.Domain/Tixora.Domain.csproj

# API → All
dotnet add src/Tixora.API/Tixora.API.csproj reference src/Tixora.Domain/Tixora.Domain.csproj
dotnet add src/Tixora.API/Tixora.API.csproj reference src/Tixora.Application/Tixora.Application.csproj
dotnet add src/Tixora.API/Tixora.API.csproj reference src/Tixora.Infrastructure/Tixora.Infrastructure.csproj

# Test projects → project under test
dotnet add tests/Tixora.Domain.Tests/Tixora.Domain.Tests.csproj reference src/Tixora.Domain/Tixora.Domain.csproj
dotnet add tests/Tixora.Application.Tests/Tixora.Application.Tests.csproj reference src/Tixora.Application/Tixora.Application.csproj
dotnet add tests/Tixora.Application.Tests/Tixora.Application.Tests.csproj reference src/Tixora.Domain/Tixora.Domain.csproj
dotnet add tests/Tixora.API.Tests/Tixora.API.Tests.csproj reference src/Tixora.API/Tixora.API.csproj
dotnet add tests/Tixora.API.Tests/Tixora.API.Tests.csproj reference src/Tixora.Infrastructure/Tixora.Infrastructure.csproj
dotnet add tests/Tixora.API.Tests/Tixora.API.Tests.csproj reference src/Tixora.Domain/Tixora.Domain.csproj
```

- [ ] **Step 3: Add NuGet packages**

```bash
# Infrastructure: EF Core + SQL Server + BCrypt
dotnet add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj package Microsoft.EntityFrameworkCore.SqlServer
dotnet add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj package Microsoft.EntityFrameworkCore.Tools
dotnet add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj package BCrypt.Net-Next

# API: EF Core Design (for migrations) + JWT
dotnet add src/Tixora.API/Tixora.API.csproj package Microsoft.EntityFrameworkCore.Design
dotnet add src/Tixora.API/Tixora.API.csproj package Microsoft.AspNetCore.Authentication.JwtBearer

# Application: BCrypt for auth service password verification
dotnet add src/Tixora.Application/Tixora.Application.csproj package BCrypt.Net-Next

# Test projects: Moq for mocking
dotnet add tests/Tixora.Application.Tests/Tixora.Application.Tests.csproj package Moq
dotnet add tests/Tixora.API.Tests/Tixora.API.Tests.csproj package Moq
dotnet add tests/Tixora.API.Tests/Tixora.API.Tests.csproj package Microsoft.AspNetCore.Mvc.Testing
dotnet add tests/Tixora.API.Tests/Tixora.API.Tests.csproj package Microsoft.EntityFrameworkCore.InMemory
```

- [ ] **Step 4: Delete auto-generated template files**

```bash
rm -f src/Tixora.Domain/Class1.cs
rm -f src/Tixora.Application/Class1.cs
rm -f src/Tixora.Infrastructure/Class1.cs
rm -f tests/Tixora.Domain.Tests/UnitTest1.cs
rm -f tests/Tixora.Application.Tests/UnitTest1.cs
rm -f tests/Tixora.API.Tests/UnitTest1.cs
```

- [ ] **Step 5: Build and verify**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/ tests/ .gitignore CLAUDE.md
git commit -m "chore: scaffold solution with clean architecture projects and test projects"
```

---

## Task 2: Domain Enums

**Files:**
- Create: `src/Tixora.Domain/Enums/ProductCode.cs`
- Create: `src/Tixora.Domain/Enums/TaskType.cs`
- Create: `src/Tixora.Domain/Enums/ProductAccessMode.cs`
- Create: `src/Tixora.Domain/Enums/ProvisioningPath.cs`
- Create: `src/Tixora.Domain/Enums/TicketStatus.cs`
- Create: `src/Tixora.Domain/Enums/LifecycleState.cs`
- Create: `src/Tixora.Domain/Enums/StageType.cs`
- Create: `src/Tixora.Domain/Enums/StageAction.cs`
- Create: `src/Tixora.Domain/Enums/SlaStatus.cs`
- Create: `src/Tixora.Domain/Enums/UserRole.cs`
- Create: `src/Tixora.Domain/Enums/NotificationType.cs`
- Create: `src/Tixora.Domain/Enums/IssueType.cs`

- [ ] **Step 1: Create all enum files**

`src/Tixora.Domain/Enums/ProductCode.cs`:
```csharp
namespace Tixora.Domain.Enums;

public enum ProductCode { RBT, RHN, WTQ, MLM }
```

`src/Tixora.Domain/Enums/TaskType.cs`:
```csharp
namespace Tixora.Domain.Enums;

public enum TaskType { T01, T02, T03, T04, T04 }
```

`src/Tixora.Domain/Enums/ProductAccessMode.cs`:
```csharp
namespace Tixora.Domain.Enums;

public enum ProductAccessMode { Both, ApiOnly }
```

`src/Tixora.Domain/Enums/ProvisioningPath.cs`:
```csharp
namespace Tixora.Domain.Enums;

public enum ProvisioningPath { PortalOnly, PortalAndApi, ApiOnly }
```

`src/Tixora.Domain/Enums/TicketStatus.cs`:
```csharp
namespace Tixora.Domain.Enums;

public enum TicketStatus
{
    Submitted,
    InReview,
    PendingRequesterAction,
    InProvisioning,
    Phase1Complete,
    AwaitingUatSignal,
    Phase2InReview,
    Completed,
    Rejected,
    Cancelled
}
```

`src/Tixora.Domain/Enums/LifecycleState.cs`:
```csharp
namespace Tixora.Domain.Enums;

public enum LifecycleState { Agreed, UatActive, Onboarded, Live }
```

`src/Tixora.Domain/Enums/StageType.cs`:
```csharp
namespace Tixora.Domain.Enums;

public enum StageType { Review, Approval, Provisioning, PhaseGate }
```

`src/Tixora.Domain/Enums/StageAction.cs`:
```csharp
namespace Tixora.Domain.Enums;

public enum StageAction
{
    Approve,
    Reject,
    ReturnForClarification,
    RespondToClarification,
    ClosePh1,
    SignalUatComplete,
    ClosePh2,
    Complete,
    Cancel,
    Reassign
}
```

`src/Tixora.Domain/Enums/SlaStatus.cs`:
```csharp
namespace Tixora.Domain.Enums;

public enum SlaStatus { OnTrack, AtRisk, Critical, Breached }
```

`src/Tixora.Domain/Enums/UserRole.cs`:
```csharp
namespace Tixora.Domain.Enums;

public enum UserRole
{
    Requester,
    Reviewer,
    Approver,
    IntegrationTeam,
    ProvisioningAgent,
    SystemAdministrator
}
```

`src/Tixora.Domain/Enums/NotificationType.cs`:
```csharp
namespace Tixora.Domain.Enums;

public enum NotificationType
{
    RequestSubmitted,
    StageAdvanced,
    ClarificationRequested,
    ClarificationResponded,
    UatPhase1Complete,
    UatTestingSignalled,
    UatPhase2Complete,
    UatCompletionReminder,
    PortalAccountProvisioned,
    ApiCredentialsIssued,
    AccessIssueResolved,
    RequestRejected,
    RequestCancelled,
    TicketReassigned,
    DelegateApprovalTriggered,
    SlaWarning75,
    SlaWarning90,
    SlaBreach,
    RequestCompleted
}
```

`src/Tixora.Domain/Enums/IssueType.cs`:
```csharp
namespace Tixora.Domain.Enums;

public enum IssueType
{
    PortalLoginIssue,
    ApiCredentialIssue,
    PortalPasswordReset
}
```

- [ ] **Step 2: Build to verify**

Run: `dotnet build src/Tixora.Domain/Tixora.Domain.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add src/Tixora.Domain/Enums/
git commit -m "feat: add all domain enums (12 enum types)"
```

---

## Task 3: Domain Entities

**Files:**
- Create: All 18 entity files in `src/Tixora.Domain/Entities/`

- [ ] **Step 1: Create Product.cs**

```csharp
// src/Tixora.Domain/Entities/Product.cs
namespace Tixora.Domain.Entities;

using Tixora.Domain.Enums;

public class Product
{
    public ProductCode Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProductAccessMode ProductAccessMode { get; set; }
    public string PortalType { get; set; } = string.Empty;
}
```

- [ ] **Step 2: Create Partner.cs**

```csharp
// src/Tixora.Domain/Entities/Partner.cs
namespace Tixora.Domain.Entities;

public class Partner
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<PartnerProduct> PartnerProducts { get; set; } = new List<PartnerProduct>();
}
```

- [ ] **Step 3: Create PartnerProduct.cs**

```csharp
// src/Tixora.Domain/Entities/PartnerProduct.cs
namespace Tixora.Domain.Entities;

using Tixora.Domain.Enums;

public class PartnerProduct
{
    public Guid Id { get; set; }
    public Guid PartnerId { get; set; }
    public ProductCode ProductCode { get; set; }
    public LifecycleState LifecycleState { get; set; }
    public DateTime StateChangedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Partner Partner { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
```

- [ ] **Step 4: Create Ticket.cs**

```csharp
// src/Tixora.Domain/Entities/Ticket.cs
namespace Tixora.Domain.Entities;

using Tixora.Domain.Enums;

public class Ticket
{
    public Guid Id { get; set; }
    public string TicketId { get; set; } = string.Empty;
    public Guid PartnerProductId { get; set; }
    public TaskType TaskType { get; set; }
    public ProductCode ProductCode { get; set; }
    public TicketStatus Status { get; set; }
    public int CurrentStageOrder { get; set; }
    public ProvisioningPath? ProvisioningPath { get; set; }
    public IssueType? IssueType { get; set; }
    public string FormData { get; set; } = "{}";
    public Guid CreatedByUserId { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public Guid? RejectedTicketRef { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public PartnerProduct PartnerProduct { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
    public User? AssignedTo { get; set; }
    public ICollection<StageLog> StageLogs { get; set; } = new List<StageLog>();
    public ICollection<AuditEntry> AuditEntries { get; set; } = new List<AuditEntry>();
    public ICollection<SlaTracker> SlaTrackers { get; set; } = new List<SlaTracker>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public FulfilmentRecord? FulfilmentRecord { get; set; }
}
```

- [ ] **Step 5: Create StageLog.cs**

```csharp
// src/Tixora.Domain/Entities/StageLog.cs
namespace Tixora.Domain.Entities;

using Tixora.Domain.Enums;

public class StageLog
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public int StageOrder { get; set; }
    public string StageName { get; set; } = string.Empty;
    public StageAction Action { get; set; }
    public Guid ActorUserId { get; set; }
    public string? Comments { get; set; }
    public Guid? ReassignedToUserId { get; set; }
    public DateTime Timestamp { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public User Actor { get; set; } = null!;
}
```

- [ ] **Step 6: Create AuditEntry.cs**

```csharp
// src/Tixora.Domain/Entities/AuditEntry.cs
namespace Tixora.Domain.Entities;

public class AuditEntry
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid ActorUserId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string ActorRole { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime TimestampUtc { get; set; }

    public Ticket Ticket { get; set; } = null!;
}
```

- [ ] **Step 7: Create SlaTracker.cs**

```csharp
// src/Tixora.Domain/Entities/SlaTracker.cs
namespace Tixora.Domain.Entities;

using Tixora.Domain.Enums;

public class SlaTracker
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public int StageOrder { get; set; }
    public string StageName { get; set; } = string.Empty;
    public int TargetBusinessHours { get; set; }
    public double BusinessHoursElapsed { get; set; }
    public SlaStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? PausedAt { get; set; }
    public DateTime? ResumedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsBreach { get; set; }
    public int WarningThreshold75 { get; set; }
    public int WarningThreshold90 { get; set; }
    public bool Warning75Sent { get; set; }
    public bool Warning90Sent { get; set; }
    public bool BreachSent { get; set; }

    public Ticket Ticket { get; set; } = null!;
}
```

- [ ] **Step 8: Create Document.cs**

```csharp
// src/Tixora.Domain/Entities/Document.cs
namespace Tixora.Domain.Entities;

public class Document
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public Guid UploadedByUserId { get; set; }
    public DateTime UploadedAt { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public User UploadedBy { get; set; } = null!;
}
```

- [ ] **Step 9: Create Comment.cs**

```csharp
// src/Tixora.Domain/Entities/Comment.cs
namespace Tixora.Domain.Entities;

public class Comment
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid AuthorUserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid? AttachmentDocumentId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public User Author { get; set; } = null!;
    public Document? Attachment { get; set; }
}
```

- [ ] **Step 10: Create Notification.cs**

```csharp
// src/Tixora.Domain/Entities/Notification.cs
namespace Tixora.Domain.Entities;

using Tixora.Domain.Enums;

public class Notification
{
    public Guid Id { get; set; }
    public Guid? TicketId { get; set; }
    public Guid RecipientUserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public bool IsRead { get; set; }
    public bool EmailSent { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }

    public Ticket? Ticket { get; set; }
    public User Recipient { get; set; } = null!;
}
```

- [ ] **Step 11: Create FulfilmentRecord.cs**

```csharp
// src/Tixora.Domain/Entities/FulfilmentRecord.cs
namespace Tixora.Domain.Entities;

public class FulfilmentRecord
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public string RecordData { get; set; } = "{}";
    public Guid RecordedByUserId { get; set; }
    public DateTime RecordedAt { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public User RecordedBy { get; set; } = null!;
}
```

- [ ] **Step 12: Create User.cs**

```csharp
// src/Tixora.Domain/Entities/User.cs
namespace Tixora.Domain.Entities;

using Tixora.Domain.Enums;

public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

- [ ] **Step 13: Create DelegateApprover.cs**

```csharp
// src/Tixora.Domain/Entities/DelegateApprover.cs
namespace Tixora.Domain.Entities;

using Tixora.Domain.Enums;

public class DelegateApprover
{
    public Guid Id { get; set; }
    public Guid PrimaryUserId { get; set; }
    public Guid DelegateUserId { get; set; }
    public UserRole ApprovalScope { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public DateTime CreatedAt { get; set; }

    public User PrimaryUser { get; set; } = null!;
    public User DelegateUser { get; set; } = null!;
}
```

- [ ] **Step 14: Create WorkflowDefinition.cs and StageDefinition.cs**

```csharp
// src/Tixora.Domain/Entities/WorkflowDefinition.cs
namespace Tixora.Domain.Entities;

using Tixora.Domain.Enums;

public class WorkflowDefinition
{
    public Guid Id { get; set; }
    public ProductCode ProductCode { get; set; }
    public TaskType TaskType { get; set; }
    public ProvisioningPath? ProvisioningPath { get; set; }
    public int Version { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<StageDefinition> Stages { get; set; } = new List<StageDefinition>();
}
```

```csharp
// src/Tixora.Domain/Entities/StageDefinition.cs
namespace Tixora.Domain.Entities;

using Tixora.Domain.Enums;

public class StageDefinition
{
    public Guid Id { get; set; }
    public Guid WorkflowDefinitionId { get; set; }
    public int StageOrder { get; set; }
    public string StageName { get; set; } = string.Empty;
    public StageType StageType { get; set; }
    public UserRole AssignedRole { get; set; }
    public int SlaBusinessHours { get; set; }
    public bool IsParallel { get; set; }
    public string? ParallelGroup { get; set; }

    public WorkflowDefinition WorkflowDefinition { get; set; } = null!;
}
```

- [ ] **Step 15: Create BusinessHoursConfig.cs and Holiday.cs**

```csharp
// src/Tixora.Domain/Entities/BusinessHoursConfig.cs
namespace Tixora.Domain.Entities;

public class BusinessHoursConfig
{
    public Guid Id { get; set; }
    public string WorkingDays { get; set; } = string.Empty;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string Timezone { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}
```

```csharp
// src/Tixora.Domain/Entities/Holiday.cs
namespace Tixora.Domain.Entities;

public class Holiday
{
    public Guid Id { get; set; }
    public DateOnly Date { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
```

- [ ] **Step 16: Create SavedFilter.cs**

```csharp
// src/Tixora.Domain/Entities/SavedFilter.cs
namespace Tixora.Domain.Entities;

public class SavedFilter
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FilterData { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
}
```

- [ ] **Step 17: Build to verify**

Run: `dotnet build src/Tixora.Domain/Tixora.Domain.csproj`
Expected: Build succeeded.

- [ ] **Step 18: Commit**

```bash
git add src/Tixora.Domain/Entities/
git commit -m "feat: add all 18 domain entities"
```

---

## Task 4: Domain Interfaces (Repositories)

**Files:**
- Create: `src/Tixora.Domain/Interfaces/IProductRepository.cs`
- Create: `src/Tixora.Domain/Interfaces/IPartnerRepository.cs`
- Create: `src/Tixora.Domain/Interfaces/IUserRepository.cs`

Only the repositories needed for Plan 1 endpoints. More repositories (ITicketRepository, IWorkflowRepository, etc.) will be added in Plan 2.

- [ ] **Step 1: Create IProductRepository.cs**

```csharp
// src/Tixora.Domain/Interfaces/IProductRepository.cs
namespace Tixora.Domain.Interfaces;

using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByCodeAsync(ProductCode code);
}
```

- [ ] **Step 2: Create IPartnerRepository.cs**

```csharp
// src/Tixora.Domain/Interfaces/IPartnerRepository.cs
namespace Tixora.Domain.Interfaces;

using Tixora.Domain.Entities;

public interface IPartnerRepository
{
    Task<List<Partner>> GetAllAsync();
    Task<Partner?> GetByIdAsync(Guid id);
    Task<Partner?> GetByIdWithProductsAsync(Guid id);
}
```

- [ ] **Step 3: Create IUserRepository.cs**

```csharp
// src/Tixora.Domain/Interfaces/IUserRepository.cs
namespace Tixora.Domain.Interfaces;

using Tixora.Domain.Entities;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(Guid id);
}
```

- [ ] **Step 4: Build to verify**

Run: `dotnet build src/Tixora.Domain/Tixora.Domain.csproj`
Expected: Build succeeded.

- [ ] **Step 5: Commit**

```bash
git add src/Tixora.Domain/Interfaces/
git commit -m "feat: add repository interfaces for Product, Partner, User"
```

---

## Task 5: Application DTOs

**Files:**
- Create: `src/Tixora.Application/DTOs/Auth/LoginRequest.cs`
- Create: `src/Tixora.Application/DTOs/Auth/LoginResponse.cs`
- Create: `src/Tixora.Application/DTOs/Products/ProductResponse.cs`
- Create: `src/Tixora.Application/DTOs/Products/TaskInfoResponse.cs`
- Create: `src/Tixora.Application/DTOs/Partners/PartnerListResponse.cs`
- Create: `src/Tixora.Application/DTOs/Partners/PartnerProfileResponse.cs`

- [ ] **Step 1: Create Auth DTOs**

```csharp
// src/Tixora.Application/DTOs/Auth/LoginRequest.cs
namespace Tixora.Application.DTOs.Auth;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
```

```csharp
// src/Tixora.Application/DTOs/Auth/LoginResponse.cs
namespace Tixora.Application.DTOs.Auth;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid UserId { get; set; }
}
```

- [ ] **Step 2: Create Product DTOs**

```csharp
// src/Tixora.Application/DTOs/Products/ProductResponse.cs
namespace Tixora.Application.DTOs.Products;

public class ProductResponse
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AccessMode { get; set; } = string.Empty;
    public string PortalType { get; set; } = string.Empty;
}
```

```csharp
// src/Tixora.Application/DTOs/Products/TaskInfoResponse.cs
namespace Tixora.Application.DTOs.Products;

public class TaskInfoResponse
{
    public string TaskType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
```

- [ ] **Step 3: Create Partner DTOs**

```csharp
// src/Tixora.Application/DTOs/Partners/PartnerListResponse.cs
namespace Tixora.Application.DTOs.Partners;

public class PartnerListResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<PartnerProductSummary> Products { get; set; } = new();
}

public class PartnerProductSummary
{
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string LifecycleState { get; set; } = string.Empty;
}
```

```csharp
// src/Tixora.Application/DTOs/Partners/PartnerProfileResponse.cs
namespace Tixora.Application.DTOs.Partners;

public class PartnerProfileResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<PartnerProductDetail> Products { get; set; } = new();
}

public class PartnerProductDetail
{
    public Guid PartnerProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string LifecycleState { get; set; } = string.Empty;
    public DateTime StateChangedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

- [ ] **Step 4: Build to verify**

Run: `dotnet build src/Tixora.Application/Tixora.Application.csproj`
Expected: Build succeeded.

- [ ] **Step 5: Commit**

```bash
git add src/Tixora.Application/DTOs/
git commit -m "feat: add DTOs for auth, products, and partners"
```

---

## Task 6: Application Services and Interfaces

**Files:**
- Create: `src/Tixora.Application/Interfaces/IAuthService.cs`
- Create: `src/Tixora.Application/Services/AuthService.cs`
- Create: `src/Tixora.Application/Services/ProductService.cs`
- Create: `src/Tixora.Application/Services/PartnerService.cs`
- Test: `tests/Tixora.Application.Tests/Services/AuthServiceTests.cs`

- [ ] **Step 1: Write failing AuthService test**

```csharp
// tests/Tixora.Application.Tests/Services/AuthServiceTests.cs
namespace Tixora.Application.Tests.Services;

using Moq;
using Tixora.Application.DTOs.Auth;
using Tixora.Application.Services;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Domain.Interfaces;
using Xunit;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepo = new();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _sut = new AuthService(_userRepo.Object, "ThisIsAFakeJwtSecretKeyForTixoraDev2026!!");
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "requester@tixora.local",
            FullName = "Test Requester",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass123!"),
            Role = UserRole.Requester,
            IsActive = true
        };
        _userRepo.Setup(r => r.GetByEmailAsync("requester@tixora.local"))
            .ReturnsAsync(user);

        var result = await _sut.LoginAsync(new LoginRequest
        {
            Email = "requester@tixora.local",
            Password = "Pass123!"
        });

        Assert.NotNull(result);
        Assert.NotEmpty(result!.Token);
        Assert.Equal("requester@tixora.local", result.Email);
        Assert.Equal("Requester", result.Role);
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsNull()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "requester@tixora.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass123!"),
            Role = UserRole.Requester,
            IsActive = true
        };
        _userRepo.Setup(r => r.GetByEmailAsync("requester@tixora.local"))
            .ReturnsAsync(user);

        var result = await _sut.LoginAsync(new LoginRequest
        {
            Email = "requester@tixora.local",
            Password = "WrongPassword"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task Login_UserNotFound_ReturnsNull()
    {
        _userRepo.Setup(r => r.GetByEmailAsync("nobody@tixora.local"))
            .ReturnsAsync((User?)null);

        var result = await _sut.LoginAsync(new LoginRequest
        {
            Email = "nobody@tixora.local",
            Password = "Pass123!"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task Login_InactiveUser_ReturnsNull()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "requester@tixora.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass123!"),
            Role = UserRole.Requester,
            IsActive = false
        };
        _userRepo.Setup(r => r.GetByEmailAsync("requester@tixora.local"))
            .ReturnsAsync(user);

        var result = await _sut.LoginAsync(new LoginRequest
        {
            Email = "requester@tixora.local",
            Password = "Pass123!"
        });

        Assert.Null(result);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Tixora.Application.Tests/ --filter "AuthServiceTests" -v n`
Expected: FAIL — `AuthService` class does not exist yet.

- [ ] **Step 3: Create IAuthService.cs**

```csharp
// src/Tixora.Application/Interfaces/IAuthService.cs
namespace Tixora.Application.Interfaces;

using Tixora.Application.DTOs.Auth;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
}
```

- [ ] **Step 4: Implement AuthService.cs**

```csharp
// src/Tixora.Application/Services/AuthService.cs
namespace Tixora.Application.Services;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Tixora.Application.DTOs.Auth;
using Tixora.Application.Interfaces;
using Tixora.Domain.Interfaces;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly string _jwtSecret;

    public AuthService(IUserRepository userRepository, string jwtSecret)
    {
        _userRepository = userRepository;
        _jwtSecret = jwtSecret;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null || !user.IsActive)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("name", user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "tixora",
            audience: "tixora",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new LoginResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            UserId = user.Id
        };
    }
}
```

Note: Add `System.IdentityModel.Tokens.Jwt` and `Microsoft.IdentityModel.Tokens` packages to Application:

```bash
dotnet add src/Tixora.Application/Tixora.Application.csproj package System.IdentityModel.Tokens.Jwt
dotnet add src/Tixora.Application/Tixora.Application.csproj package Microsoft.IdentityModel.Tokens
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `dotnet test tests/Tixora.Application.Tests/ --filter "AuthServiceTests" -v n`
Expected: 4 tests PASS.

- [ ] **Step 6: Create ProductService.cs**

```csharp
// src/Tixora.Application/Services/ProductService.cs
namespace Tixora.Application.Services;

using Tixora.Application.DTOs.Products;
using Tixora.Domain.Enums;
using Tixora.Domain.Interfaces;

public class ProductService
{
    private readonly IProductRepository _productRepository;

    public ProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<List<ProductResponse>> GetAllAsync()
    {
        var products = await _productRepository.GetAllAsync();
        return products.Select(p => new ProductResponse
        {
            Code = p.Code.ToString(),
            Name = p.Name,
            Description = p.Description,
            AccessMode = p.ProductAccessMode.ToString(),
            PortalType = p.PortalType
        }).ToList();
    }

    public async Task<ProductResponse?> GetByCodeAsync(string code)
    {
        if (!Enum.TryParse<ProductCode>(code, true, out var productCode))
            return null;

        var product = await _productRepository.GetByCodeAsync(productCode);
        if (product == null) return null;

        return new ProductResponse
        {
            Code = product.Code.ToString(),
            Name = product.Name,
            Description = product.Description,
            AccessMode = product.ProductAccessMode.ToString(),
            PortalType = product.PortalType
        };
    }

    public List<TaskInfoResponse> GetTasksForProduct(ProductCode productCode)
    {
        var tasks = new List<TaskInfoResponse>
        {
            new() { TaskType = "T01", Name = "Agreement Validation & Sign-off", Description = "Validate and sign off partner agreement" },
            new() { TaskType = "T02", Name = "UAT Access Creation", Description = "Create UAT access and manage two-phase sign-off" },
            new() { TaskType = "T03", Name = "Partner Account Creation", Description = "Create partner account with product-driven access path" },
            new() { TaskType = "T04", Name = "User Account Creation", Description = "Create individual user account for partner" },
            new() { TaskType = "T04", Name = "Access & Credential Support", Description = "Resolve access issues and credential support" },
        };
        return tasks;
    }
}
```

- [ ] **Step 7: Create PartnerService.cs**

```csharp
// src/Tixora.Application/Services/PartnerService.cs
namespace Tixora.Application.Services;

using Tixora.Application.DTOs.Partners;
using Tixora.Domain.Interfaces;

public class PartnerService
{
    private readonly IPartnerRepository _partnerRepository;

    public PartnerService(IPartnerRepository partnerRepository)
    {
        _partnerRepository = partnerRepository;
    }

    public async Task<List<PartnerListResponse>> GetAllAsync()
    {
        var partners = await _partnerRepository.GetAllAsync();
        return partners.Select(p => new PartnerListResponse
        {
            Id = p.Id,
            Name = p.Name,
            Alias = p.Alias,
            CreatedAt = p.CreatedAt,
            Products = p.PartnerProducts.Select(pp => new PartnerProductSummary
            {
                ProductCode = pp.ProductCode.ToString(),
                ProductName = pp.Product.Name,
                LifecycleState = pp.LifecycleState.ToString()
            }).ToList()
        }).ToList();
    }

    public async Task<PartnerProfileResponse?> GetByIdAsync(Guid id)
    {
        var partner = await _partnerRepository.GetByIdWithProductsAsync(id);
        if (partner == null) return null;

        return new PartnerProfileResponse
        {
            Id = partner.Id,
            Name = partner.Name,
            Alias = partner.Alias,
            CreatedAt = partner.CreatedAt,
            Products = partner.PartnerProducts.Select(pp => new PartnerProductDetail
            {
                PartnerProductId = pp.Id,
                ProductCode = pp.ProductCode.ToString(),
                ProductName = pp.Product.Name,
                LifecycleState = pp.LifecycleState.ToString(),
                StateChangedAt = pp.StateChangedAt,
                CreatedAt = pp.CreatedAt
            }).ToList()
        };
    }
}
```

- [ ] **Step 8: Build to verify**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded.

- [ ] **Step 9: Commit**

```bash
git add src/Tixora.Application/ tests/Tixora.Application.Tests/
git commit -m "feat: add auth, product, and partner services with auth tests"
```

---

## Task 7: Infrastructure — DbContext and Entity Configurations

**Files:**
- Create: `src/Tixora.Infrastructure/Data/AppDbContext.cs`
- Create: 19 configuration files in `src/Tixora.Infrastructure/Data/Configurations/`

- [ ] **Step 1: Create AppDbContext.cs**

```csharp
// src/Tixora.Infrastructure/Data/AppDbContext.cs
namespace Tixora.Infrastructure.Data;

using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<PartnerProduct> PartnerProducts => Set<PartnerProduct>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<StageLog> StageLogs => Set<StageLog>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<SlaTracker> SlaTrackers => Set<SlaTracker>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<FulfilmentRecord> FulfilmentRecords => Set<FulfilmentRecord>();
    public DbSet<User> Users => Set<User>();
    public DbSet<DelegateApprover> DelegateApprovers => Set<DelegateApprover>();
    public DbSet<WorkflowDefinition> WorkflowDefinitions => Set<WorkflowDefinition>();
    public DbSet<StageDefinition> StageDefinitions => Set<StageDefinition>();
    public DbSet<BusinessHoursConfig> BusinessHoursConfigs => Set<BusinessHoursConfig>();
    public DbSet<Holiday> Holidays => Set<Holiday>();
    public DbSet<SavedFilter> SavedFilters => Set<SavedFilter>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
```

- [ ] **Step 2: Create ProductConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/ProductConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Code);
        builder.Property(p => p.Code).HasConversion<string>().HasMaxLength(3);
        builder.Property(p => p.Name).HasMaxLength(100).IsRequired();
        builder.Property(p => p.Description).HasMaxLength(500);
        builder.Property(p => p.ProductAccessMode).HasConversion<string>().HasMaxLength(20);
        builder.Property(p => p.PortalType).HasMaxLength(50);
    }
}
```

- [ ] **Step 3: Create PartnerConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/PartnerConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class PartnerConfiguration : IEntityTypeConfiguration<Partner>
{
    public void Configure(EntityTypeBuilder<Partner> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Alias).HasMaxLength(50);
        builder.HasMany(p => p.PartnerProducts).WithOne(pp => pp.Partner).HasForeignKey(pp => pp.PartnerId);
    }
}
```

- [ ] **Step 4: Create PartnerProductConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/PartnerProductConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class PartnerProductConfiguration : IEntityTypeConfiguration<PartnerProduct>
{
    public void Configure(EntityTypeBuilder<PartnerProduct> builder)
    {
        builder.HasKey(pp => pp.Id);
        builder.Property(pp => pp.ProductCode).HasConversion<string>().HasMaxLength(3);
        builder.Property(pp => pp.LifecycleState).HasConversion<string>().HasMaxLength(20);
        builder.HasOne(pp => pp.Product).WithMany().HasForeignKey(pp => pp.ProductCode);
        builder.HasMany(pp => pp.Tickets).WithOne(t => t.PartnerProduct).HasForeignKey(t => t.PartnerProductId);
        builder.HasIndex(pp => new { pp.PartnerId, pp.ProductCode }).IsUnique();
    }
}
```

- [ ] **Step 5: Create TicketConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/TicketConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.TicketId).HasMaxLength(30).IsRequired();
        builder.HasIndex(t => t.TicketId).IsUnique();
        builder.Property(t => t.TaskType).HasConversion<string>().HasMaxLength(5);
        builder.Property(t => t.ProductCode).HasConversion<string>().HasMaxLength(3);
        builder.Property(t => t.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(t => t.ProvisioningPath).HasConversion<string>().HasMaxLength(20);
        builder.Property(t => t.IssueType).HasConversion<string>().HasMaxLength(30);
        builder.Property(t => t.FormData).HasColumnType("nvarchar(max)");
        builder.Property(t => t.CancellationReason).HasMaxLength(1000);
        builder.HasOne(t => t.CreatedBy).WithMany().HasForeignKey(t => t.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(t => t.AssignedTo).WithMany().HasForeignKey(t => t.AssignedToUserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(t => t.FulfilmentRecord).WithOne(f => f.Ticket).HasForeignKey<FulfilmentRecord>(f => f.TicketId);
    }
}
```

- [ ] **Step 6: Create StageLogConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/StageLogConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class StageLogConfiguration : IEntityTypeConfiguration<StageLog>
{
    public void Configure(EntityTypeBuilder<StageLog> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.StageName).HasMaxLength(100).IsRequired();
        builder.Property(s => s.Action).HasConversion<string>().HasMaxLength(30);
        builder.Property(s => s.Comments).HasMaxLength(2000);
        builder.HasOne(s => s.Ticket).WithMany(t => t.StageLogs).HasForeignKey(s => s.TicketId);
        builder.HasOne(s => s.Actor).WithMany().HasForeignKey(s => s.ActorUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] **Step 7: Create AuditEntryConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/AuditEntryConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class AuditEntryConfiguration : IEntityTypeConfiguration<AuditEntry>
{
    public void Configure(EntityTypeBuilder<AuditEntry> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.ActorName).HasMaxLength(200).IsRequired();
        builder.Property(a => a.ActorRole).HasMaxLength(50).IsRequired();
        builder.Property(a => a.ActionType).HasMaxLength(100).IsRequired();
        builder.Property(a => a.Details).HasColumnType("nvarchar(max)");
        builder.HasOne(a => a.Ticket).WithMany(t => t.AuditEntries).HasForeignKey(a => a.TicketId);
    }
}
```

- [ ] **Step 8: Create SlaTrackerConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/SlaTrackerConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class SlaTrackerConfiguration : IEntityTypeConfiguration<SlaTracker>
{
    public void Configure(EntityTypeBuilder<SlaTracker> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.StageName).HasMaxLength(100).IsRequired();
        builder.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasOne(s => s.Ticket).WithMany(t => t.SlaTrackers).HasForeignKey(s => s.TicketId);
    }
}
```

- [ ] **Step 9: Create DocumentConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/DocumentConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.FileName).HasMaxLength(255).IsRequired();
        builder.Property(d => d.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(d => d.StoragePath).HasMaxLength(500).IsRequired();
        builder.Property(d => d.DocumentType).HasMaxLength(50).IsRequired();
        builder.HasOne(d => d.Ticket).WithMany(t => t.Documents).HasForeignKey(d => d.TicketId);
        builder.HasOne(d => d.UploadedBy).WithMany().HasForeignKey(d => d.UploadedByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] **Step 10: Create CommentConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/CommentConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Content).HasMaxLength(4000).IsRequired();
        builder.HasOne(c => c.Ticket).WithMany(t => t.Comments).HasForeignKey(c => c.TicketId);
        builder.HasOne(c => c.Author).WithMany().HasForeignKey(c => c.AuthorUserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(c => c.Attachment).WithMany().HasForeignKey(c => c.AttachmentDocumentId).OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] **Step 11: Create NotificationConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/NotificationConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Type).HasConversion<string>().HasMaxLength(50);
        builder.Property(n => n.Title).HasMaxLength(200).IsRequired();
        builder.Property(n => n.Body).HasMaxLength(2000);
        builder.HasOne(n => n.Ticket).WithMany(t => t.Notifications).HasForeignKey(n => n.TicketId);
        builder.HasOne(n => n.Recipient).WithMany().HasForeignKey(n => n.RecipientUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] **Step 12: Create FulfilmentRecordConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/FulfilmentRecordConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class FulfilmentRecordConfiguration : IEntityTypeConfiguration<FulfilmentRecord>
{
    public void Configure(EntityTypeBuilder<FulfilmentRecord> builder)
    {
        builder.HasKey(f => f.Id);
        builder.Property(f => f.RecordData).HasColumnType("nvarchar(max)").IsRequired();
        builder.HasOne(f => f.RecordedBy).WithMany().HasForeignKey(f => f.RecordedByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] **Step 13: Create UserConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/UserConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.FullName).HasMaxLength(200).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(200).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.PasswordHash).HasMaxLength(200).IsRequired();
        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(30);
    }
}
```

- [ ] **Step 14: Create WorkflowDefinitionConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/WorkflowDefinitionConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class WorkflowDefinitionConfiguration : IEntityTypeConfiguration<WorkflowDefinition>
{
    public void Configure(EntityTypeBuilder<WorkflowDefinition> builder)
    {
        builder.HasKey(w => w.Id);
        builder.Property(w => w.ProductCode).HasConversion<string>().HasMaxLength(3);
        builder.Property(w => w.TaskType).HasConversion<string>().HasMaxLength(5);
        builder.Property(w => w.ProvisioningPath).HasConversion<string>().HasMaxLength(20);
        builder.HasMany(w => w.Stages).WithOne(s => s.WorkflowDefinition).HasForeignKey(s => s.WorkflowDefinitionId);
    }
}
```

- [ ] **Step 15: Create StageDefinitionConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/StageDefinitionConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class StageDefinitionConfiguration : IEntityTypeConfiguration<StageDefinition>
{
    public void Configure(EntityTypeBuilder<StageDefinition> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.StageName).HasMaxLength(100).IsRequired();
        builder.Property(s => s.StageType).HasConversion<string>().HasMaxLength(20);
        builder.Property(s => s.AssignedRole).HasConversion<string>().HasMaxLength(30);
        builder.Property(s => s.ParallelGroup).HasMaxLength(50);
    }
}
```

- [ ] **Step 16: Create DelegateApproverConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/DelegateApproverConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class DelegateApproverConfiguration : IEntityTypeConfiguration<DelegateApprover>
{
    public void Configure(EntityTypeBuilder<DelegateApprover> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.ApprovalScope).HasConversion<string>().HasMaxLength(30);
        builder.HasOne(d => d.PrimaryUser).WithMany().HasForeignKey(d => d.PrimaryUserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(d => d.DelegateUser).WithMany().HasForeignKey(d => d.DelegateUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] **Step 17: Create BusinessHoursConfigConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/BusinessHoursConfigConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class BusinessHoursConfigConfiguration : IEntityTypeConfiguration<BusinessHoursConfig>
{
    public void Configure(EntityTypeBuilder<BusinessHoursConfig> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.WorkingDays).HasMaxLength(200).IsRequired();
        builder.Property(b => b.Timezone).HasMaxLength(50).IsRequired();
    }
}
```

- [ ] **Step 18: Create HolidayConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/HolidayConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class HolidayConfiguration : IEntityTypeConfiguration<Holiday>
{
    public void Configure(EntityTypeBuilder<Holiday> builder)
    {
        builder.HasKey(h => h.Id);
        builder.Property(h => h.Name).HasMaxLength(200).IsRequired();
        builder.HasIndex(h => h.Date).IsUnique();
    }
}
```

- [ ] **Step 19: Create SavedFilterConfiguration.cs**

```csharp
// src/Tixora.Infrastructure/Data/Configurations/SavedFilterConfiguration.cs
namespace Tixora.Infrastructure.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

public class SavedFilterConfiguration : IEntityTypeConfiguration<SavedFilter>
{
    public void Configure(EntityTypeBuilder<SavedFilter> builder)
    {
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Name).HasMaxLength(100).IsRequired();
        builder.Property(f => f.FilterData).HasColumnType("nvarchar(max)").IsRequired();
        builder.HasOne(f => f.User).WithMany().HasForeignKey(f => f.UserId);
    }
}
```

- [ ] **Step 20: Build to verify**

Run: `dotnet build src/Tixora.Infrastructure/Tixora.Infrastructure.csproj`
Expected: Build succeeded.

- [ ] **Step 21: Commit**

```bash
git add src/Tixora.Infrastructure/Data/
git commit -m "feat: add AppDbContext and all 19 entity configurations"
```

---

## Task 8: Infrastructure — Repositories

**Files:**
- Create: `src/Tixora.Infrastructure/Repositories/ProductRepository.cs`
- Create: `src/Tixora.Infrastructure/Repositories/PartnerRepository.cs`
- Create: `src/Tixora.Infrastructure/Repositories/UserRepository.cs`

- [ ] **Step 1: Create ProductRepository.cs**

```csharp
// src/Tixora.Infrastructure/Repositories/ProductRepository.cs
namespace Tixora.Infrastructure.Repositories;

using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Domain.Interfaces;
using Tixora.Infrastructure.Data;

public class ProductRepository : IProductRepository
{
    private readonly AppDbContext _db;

    public ProductRepository(AppDbContext db) => _db = db;

    public async Task<List<Product>> GetAllAsync()
        => await _db.Products.OrderBy(p => p.Name).ToListAsync();

    public async Task<Product?> GetByCodeAsync(ProductCode code)
        => await _db.Products.FindAsync(code);
}
```

- [ ] **Step 2: Create PartnerRepository.cs**

```csharp
// src/Tixora.Infrastructure/Repositories/PartnerRepository.cs
namespace Tixora.Infrastructure.Repositories;

using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Interfaces;
using Tixora.Infrastructure.Data;

public class PartnerRepository : IPartnerRepository
{
    private readonly AppDbContext _db;

    public PartnerRepository(AppDbContext db) => _db = db;

    public async Task<List<Partner>> GetAllAsync()
        => await _db.Partners
            .Include(p => p.PartnerProducts)
                .ThenInclude(pp => pp.Product)
            .OrderBy(p => p.Name)
            .ToListAsync();

    public async Task<Partner?> GetByIdAsync(Guid id)
        => await _db.Partners.FindAsync(id);

    public async Task<Partner?> GetByIdWithProductsAsync(Guid id)
        => await _db.Partners
            .Include(p => p.PartnerProducts)
                .ThenInclude(pp => pp.Product)
            .FirstOrDefaultAsync(p => p.Id == id);
}
```

- [ ] **Step 3: Create UserRepository.cs**

```csharp
// src/Tixora.Infrastructure/Repositories/UserRepository.cs
namespace Tixora.Infrastructure.Repositories;

using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Interfaces;
using Tixora.Infrastructure.Data;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db) => _db = db;

    public async Task<User?> GetByEmailAsync(string email)
        => await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<User?> GetByIdAsync(Guid id)
        => await _db.Users.FindAsync(id);
}
```

- [ ] **Step 4: Build to verify**

Run: `dotnet build src/Tixora.Infrastructure/Tixora.Infrastructure.csproj`
Expected: Build succeeded.

- [ ] **Step 5: Commit**

```bash
git add src/Tixora.Infrastructure/Repositories/
git commit -m "feat: add Product, Partner, and User repository implementations"
```

---

## Task 9: Infrastructure — Seed Data

**Files:**
- Create: `src/Tixora.Infrastructure/Seed/SeedData.cs`
- Create: `src/Tixora.Infrastructure/Seed/SeedProducts.cs`
- Create: `src/Tixora.Infrastructure/Seed/SeedUsers.cs`
- Create: `src/Tixora.Infrastructure/Seed/SeedWorkflows.cs`
- Create: `src/Tixora.Infrastructure/Seed/SeedBusinessHours.cs`
- Create: `src/Tixora.Infrastructure/Seed/SeedPartners.cs`

- [ ] **Step 1: Create SeedProducts.cs**

```csharp
// src/Tixora.Infrastructure/Seed/SeedProducts.cs
namespace Tixora.Infrastructure.Seed;

using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Infrastructure.Data;

public static class SeedProducts
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (db.Products.Any()) return;

        db.Products.AddRange(
            new Product { Code = ProductCode.RBT, Name = "Rabet", Description = "Transactional portal with API access", ProductAccessMode = ProductAccessMode.Both, PortalType = "Transactional" },
            new Product { Code = ProductCode.RHN, Name = "Rhoon", Description = "Transactional portal with API access", ProductAccessMode = ProductAccessMode.Both, PortalType = "Transactional" },
            new Product { Code = ProductCode.WTQ, Name = "Wtheeq", Description = "API-primary with read-only portal", ProductAccessMode = ProductAccessMode.ApiOnly, PortalType = "Read-only" },
            new Product { Code = ProductCode.MLM, Name = "Mulem", Description = "API-primary with read-only portal", ProductAccessMode = ProductAccessMode.ApiOnly, PortalType = "Read-only" }
        );
        await db.SaveChangesAsync();
    }
}
```

- [ ] **Step 2: Create SeedUsers.cs**

```csharp
// src/Tixora.Infrastructure/Seed/SeedUsers.cs
namespace Tixora.Infrastructure.Seed;

using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Infrastructure.Data;

public static class SeedUsers
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (db.Users.Any()) return;

        var hash = BCrypt.Net.BCrypt.HashPassword("Pass123!");
        var now = DateTime.UtcNow;

        db.Users.AddRange(
            new User { Id = Guid.Parse("a1000000-0000-0000-0000-000000000001"), FullName = "Test Requester", Email = "requester@tixora.local", PasswordHash = hash, Role = UserRole.Requester, IsActive = true, CreatedAt = now },
            new User { Id = Guid.Parse("a1000000-0000-0000-0000-000000000002"), FullName = "Test Reviewer", Email = "reviewer@tixora.local", PasswordHash = hash, Role = UserRole.Reviewer, IsActive = true, CreatedAt = now },
            new User { Id = Guid.Parse("a1000000-0000-0000-0000-000000000003"), FullName = "Test Approver", Email = "approver@tixora.local", PasswordHash = hash, Role = UserRole.Approver, IsActive = true, CreatedAt = now },
            new User { Id = Guid.Parse("a1000000-0000-0000-0000-000000000004"), FullName = "Test Integration", Email = "integration@tixora.local", PasswordHash = hash, Role = UserRole.IntegrationTeam, IsActive = true, CreatedAt = now },
            new User { Id = Guid.Parse("a1000000-0000-0000-0000-000000000005"), FullName = "Test Provisioning", Email = "provisioning@tixora.local", PasswordHash = hash, Role = UserRole.ProvisioningAgent, IsActive = true, CreatedAt = now },
            new User { Id = Guid.Parse("a1000000-0000-0000-0000-000000000006"), FullName = "Test Admin", Email = "admin@tixora.local", PasswordHash = hash, Role = UserRole.SystemAdministrator, IsActive = true, CreatedAt = now }
        );
        await db.SaveChangesAsync();
    }
}
```

- [ ] **Step 3: Create SeedWorkflows.cs**

```csharp
// src/Tixora.Infrastructure/Seed/SeedWorkflows.cs
namespace Tixora.Infrastructure.Seed;

using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Infrastructure.Data;

public static class SeedWorkflows
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (db.WorkflowDefinitions.Any()) return;

        var now = DateTime.UtcNow;
        var products = new[] { ProductCode.RBT, ProductCode.RHN, ProductCode.WTQ, ProductCode.MLM };

        // T-01: Agreement Validation — same for all products
        foreach (var pc in products)
        {
            var wf = new WorkflowDefinition { Id = Guid.NewGuid(), ProductCode = pc, TaskType = TaskType.T01, Version = 1, IsActive = true, CreatedAt = now };
            wf.Stages = new List<StageDefinition>
            {
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wf.Id, StageOrder = 1, StageName = "Legal Review", StageType = StageType.Review, AssignedRole = UserRole.Reviewer, SlaBusinessHours = 16 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wf.Id, StageOrder = 2, StageName = "Product Review", StageType = StageType.Review, AssignedRole = UserRole.Reviewer, SlaBusinessHours = 16 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wf.Id, StageOrder = 3, StageName = "EA Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.Approver, SlaBusinessHours = 16 },
            };
            db.WorkflowDefinitions.Add(wf);
        }

        // T-02: UAT Access — same for all products
        foreach (var pc in products)
        {
            var wf = new WorkflowDefinition { Id = Guid.NewGuid(), ProductCode = pc, TaskType = TaskType.T02, Version = 1, IsActive = true, CreatedAt = now };
            wf.Stages = new List<StageDefinition>
            {
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wf.Id, StageOrder = 1, StageName = "Product Review", StageType = StageType.Review, AssignedRole = UserRole.Reviewer, SlaBusinessHours = 8 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wf.Id, StageOrder = 2, StageName = "Integration Phase 1", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wf.Id, StageOrder = 3, StageName = "UAT Signal", StageType = StageType.PhaseGate, AssignedRole = UserRole.Requester, SlaBusinessHours = 0 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wf.Id, StageOrder = 4, StageName = "Integration Phase 2", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 24 },
            };
            db.WorkflowDefinitions.Add(wf);
        }

        // T-03: Partner Account Creation — varies by product access mode and provisioning path
        // "Both" products (RBT, RHN): PortalOnly, PortalAndApi
        foreach (var pc in new[] { ProductCode.RBT, ProductCode.RHN })
        {
            // PortalOnly
            var wfPortal = new WorkflowDefinition { Id = Guid.NewGuid(), ProductCode = pc, TaskType = TaskType.T03, ProvisioningPath = ProvisioningPath.PortalOnly, Version = 1, IsActive = true, CreatedAt = now };
            wfPortal.Stages = new List<StageDefinition>
            {
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfPortal.Id, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.Reviewer, SlaBusinessHours = 8 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfPortal.Id, StageOrder = 2, StageName = "Director Approval", StageType = StageType.Approval, AssignedRole = UserRole.Approver, SlaBusinessHours = 8 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfPortal.Id, StageOrder = 3, StageName = "Portal Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.ProvisioningAgent, SlaBusinessHours = 8 },
            };
            db.WorkflowDefinitions.Add(wfPortal);

            // PortalAndApi
            var wfBoth = new WorkflowDefinition { Id = Guid.NewGuid(), ProductCode = pc, TaskType = TaskType.T03, ProvisioningPath = ProvisioningPath.PortalAndApi, Version = 1, IsActive = true, CreatedAt = now };
            wfBoth.Stages = new List<StageDefinition>
            {
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfBoth.Id, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.Reviewer, SlaBusinessHours = 8 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfBoth.Id, StageOrder = 2, StageName = "Director Approval", StageType = StageType.Approval, AssignedRole = UserRole.Approver, SlaBusinessHours = 8 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfBoth.Id, StageOrder = 3, StageName = "Portal Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.ProvisioningAgent, SlaBusinessHours = 16, IsParallel = true, ParallelGroup = "T03-provision" },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfBoth.Id, StageOrder = 3, StageName = "API Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 16, IsParallel = true, ParallelGroup = "T03-provision" },
            };
            db.WorkflowDefinitions.Add(wfBoth);
        }

        // "ApiOnly" products (WTQ, MLM): ApiOnly path only
        foreach (var pc in new[] { ProductCode.WTQ, ProductCode.MLM })
        {
            var wfApi = new WorkflowDefinition { Id = Guid.NewGuid(), ProductCode = pc, TaskType = TaskType.T03, ProvisioningPath = ProvisioningPath.ApiOnly, Version = 1, IsActive = true, CreatedAt = now };
            wfApi.Stages = new List<StageDefinition>
            {
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfApi.Id, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.Reviewer, SlaBusinessHours = 8 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfApi.Id, StageOrder = 2, StageName = "Director Approval", StageType = StageType.Approval, AssignedRole = UserRole.Approver, SlaBusinessHours = 8 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfApi.Id, StageOrder = 3, StageName = "API Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 16 },
            };
            db.WorkflowDefinitions.Add(wfApi);
        }

        // T-04: User Account Creation — same for all products
        foreach (var pc in products)
        {
            var wf = new WorkflowDefinition { Id = Guid.NewGuid(), ProductCode = pc, TaskType = TaskType.T04, Version = 1, IsActive = true, CreatedAt = now };
            wf.Stages = new List<StageDefinition>
            {
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wf.Id, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.Reviewer, SlaBusinessHours = 4 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wf.Id, StageOrder = 2, StageName = "Account Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.ProvisioningAgent, SlaBusinessHours = 4 },
            };
            db.WorkflowDefinitions.Add(wf);
        }

        // T-04: Access & Credential Support — same for all products
        foreach (var pc in products)
        {
            var wf = new WorkflowDefinition { Id = Guid.NewGuid(), ProductCode = pc, TaskType = TaskType.T04, Version = 1, IsActive = true, CreatedAt = now };
            wf.Stages = new List<StageDefinition>
            {
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wf.Id, StageOrder = 1, StageName = "Verify & Resolve", StageType = StageType.Provisioning, AssignedRole = UserRole.ProvisioningAgent, SlaBusinessHours = 2 },
            };
            db.WorkflowDefinitions.Add(wf);
        }

        await db.SaveChangesAsync();
    }
}
```

- [ ] **Step 4: Create SeedBusinessHours.cs**

```csharp
// src/Tixora.Infrastructure/Seed/SeedBusinessHours.cs
namespace Tixora.Infrastructure.Seed;

using Tixora.Domain.Entities;
using Tixora.Infrastructure.Data;

public static class SeedBusinessHours
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (db.BusinessHoursConfigs.Any()) return;

        db.BusinessHoursConfigs.Add(new BusinessHoursConfig
        {
            Id = Guid.NewGuid(),
            WorkingDays = "[\"Sun\",\"Mon\",\"Tue\",\"Wed\",\"Thu\"]",
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(17, 0),
            Timezone = "Asia/Dubai",
            UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }
}
```

- [ ] **Step 5: Create SeedPartners.cs**

```csharp
// src/Tixora.Infrastructure/Seed/SeedPartners.cs
namespace Tixora.Infrastructure.Seed;

using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Infrastructure.Data;

public static class SeedPartners
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (db.Partners.Any()) return;

        var now = DateTime.UtcNow;

        // Partner A: LIVE on Rabet
        var partnerA = new Partner { Id = Guid.Parse("b2000000-0000-0000-0000-000000000001"), Name = "Alpha Insurance Co.", Alias = "AIC", CreatedAt = now };
        partnerA.PartnerProducts = new List<PartnerProduct>
        {
            new() { Id = Guid.NewGuid(), PartnerId = partnerA.Id, ProductCode = ProductCode.RBT, LifecycleState = LifecycleState.Live, StateChangedAt = now, CreatedAt = now }
        };

        // Partner B: UAT_ACTIVE on Rhoon
        var partnerB = new Partner { Id = Guid.Parse("b2000000-0000-0000-0000-000000000002"), Name = "Beta Trading LLC", Alias = "BTL", CreatedAt = now };
        partnerB.PartnerProducts = new List<PartnerProduct>
        {
            new() { Id = Guid.NewGuid(), PartnerId = partnerB.Id, ProductCode = ProductCode.RHN, LifecycleState = LifecycleState.UatActive, StateChangedAt = now, CreatedAt = now }
        };

        // Partner C: AGREED on Wtheeq
        var partnerC = new Partner { Id = Guid.Parse("b2000000-0000-0000-0000-000000000003"), Name = "Gamma Services", Alias = "GMS", CreatedAt = now };
        partnerC.PartnerProducts = new List<PartnerProduct>
        {
            new() { Id = Guid.NewGuid(), PartnerId = partnerC.Id, ProductCode = ProductCode.WTQ, LifecycleState = LifecycleState.Agreed, StateChangedAt = now, CreatedAt = now }
        };

        db.Partners.AddRange(partnerA, partnerB, partnerC);
        await db.SaveChangesAsync();
    }
}
```

- [ ] **Step 6: Create SeedData.cs (orchestrator)**

```csharp
// src/Tixora.Infrastructure/Seed/SeedData.cs
namespace Tixora.Infrastructure.Seed;

using Tixora.Infrastructure.Data;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();
        await SeedProducts.SeedAsync(db);
        await SeedUsers.SeedAsync(db);
        await SeedWorkflows.SeedAsync(db);
        await SeedBusinessHours.SeedAsync(db);
        await SeedPartners.SeedAsync(db);
    }
}
```

- [ ] **Step 7: Build to verify**

Run: `dotnet build src/Tixora.Infrastructure/Tixora.Infrastructure.csproj`
Expected: Build succeeded.

- [ ] **Step 8: Commit**

```bash
git add src/Tixora.Infrastructure/Seed/
git commit -m "feat: add seed data for products, users, workflows, business hours, and sample partners"
```

---

## Task 10: API — Program.cs, appsettings.json, Error Handling Middleware

**Files:**
- Create/Replace: `src/Tixora.API/Program.cs`
- Create/Replace: `src/Tixora.API/appsettings.json`
- Create: `src/Tixora.API/Middleware/ErrorHandlingMiddleware.cs`

- [ ] **Step 1: Create appsettings.json**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TixoraDb;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Secret": "ThisIsAFakeJwtSecretKeyForTixoraDev2026!!",
    "Issuer": "tixora",
    "Audience": "tixora",
    "ExpiryHours": 8
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```

- [ ] **Step 2: Create ErrorHandlingMiddleware.cs**

```csharp
// src/Tixora.API/Middleware/ErrorHandlingMiddleware.cs
namespace Tixora.API.Middleware;

using System.Net;
using System.Text.Json;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";
            var response = JsonSerializer.Serialize(new { error = "An unexpected error occurred." });
            await context.Response.WriteAsync(response);
        }
    }
}
```

- [ ] **Step 3: Create Program.cs**

```csharp
// src/Tixora.API/Program.cs
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Tixora.API.Middleware;
using Tixora.Application.Interfaces;
using Tixora.Application.Services;
using Tixora.Domain.Interfaces;
using Tixora.Infrastructure.Data;
using Tixora.Infrastructure.Repositories;
using Tixora.Infrastructure.Seed;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Repositories
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IPartnerRepository, PartnerRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Services
var jwtSecret = builder.Configuration["Jwt:Secret"]!;
builder.Services.AddScoped<IAuthService>(sp =>
    new AuthService(sp.GetRequiredService<IUserRepository>(), jwtSecret));
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<PartnerService>();

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// Seed data on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await SeedData.InitializeAsync(db);
}

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
```

- [ ] **Step 4: Build to verify**

Run: `dotnet build src/Tixora.API/Tixora.API.csproj`
Expected: Build succeeded.

- [ ] **Step 5: Commit**

```bash
git add src/Tixora.API/
git commit -m "feat: add API Program.cs with DI, JWT auth, seed data, and error middleware"
```

---

## Task 11: API Controllers — Auth, Products, Partners

**Files:**
- Create: `src/Tixora.API/Controllers/AuthController.cs`
- Create: `src/Tixora.API/Controllers/ProductsController.cs`
- Create: `src/Tixora.API/Controllers/PartnersController.cs`

- [ ] **Step 1: Create AuthController.cs**

```csharp
// src/Tixora.API/Controllers/AuthController.cs
namespace Tixora.API.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.DTOs.Auth;
using Tixora.Application.Interfaces;
using Tixora.Domain.Interfaces;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserRepository _userRepository;

    public AuthController(IAuthService authService, IUserRepository userRepository)
    {
        _authService = authService;
        _userRepository = userRepository;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (result == null)
            return Unauthorized(new { error = "Invalid email or password." });
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null || !Guid.TryParse(userId, out var id))
            return Unauthorized();

        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return NotFound();

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FullName,
            Role = user.Role.ToString(),
            user.IsActive
        });
    }
}
```

- [ ] **Step 2: Create ProductsController.cs**

```csharp
// src/Tixora.API/Controllers/ProductsController.cs
namespace Tixora.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.Services;
using Tixora.Domain.Enums;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly ProductService _productService;

    public ProductsController(ProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var products = await _productService.GetAllAsync();
        return Ok(products);
    }

    [HttpGet("{code}/tasks")]
    public IActionResult GetTasks(string code)
    {
        if (!Enum.TryParse<ProductCode>(code, true, out var productCode))
            return NotFound(new { error = $"Product '{code}' not found." });

        var tasks = _productService.GetTasksForProduct(productCode);
        return Ok(tasks);
    }
}
```

- [ ] **Step 3: Create PartnersController.cs**

```csharp
// src/Tixora.API/Controllers/PartnersController.cs
namespace Tixora.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PartnersController : ControllerBase
{
    private readonly PartnerService _partnerService;

    public PartnersController(PartnerService partnerService)
    {
        _partnerService = partnerService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var partners = await _partnerService.GetAllAsync();
        return Ok(partners);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var partner = await _partnerService.GetByIdAsync(id);
        if (partner == null) return NotFound(new { error = "Partner not found." });
        return Ok(partner);
    }
}
```

- [ ] **Step 4: Build to verify**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded.

- [ ] **Step 5: Commit**

```bash
git add src/Tixora.API/Controllers/
git commit -m "feat: add Auth, Products, and Partners controllers"
```

---

## Task 12: Integration Tests

**Files:**
- Create: `tests/Tixora.API.Tests/Controllers/ProductsControllerTests.cs`
- Create: `tests/Tixora.API.Tests/Controllers/PartnersControllerTests.cs`

- [ ] **Step 1: Write Products integration test**

```csharp
// tests/Tixora.API.Tests/Controllers/ProductsControllerTests.cs
namespace Tixora.API.Tests.Controllers;

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Tixora.Application.DTOs.Auth;
using Tixora.Infrastructure.Data;
using Xunit;

public class ProductsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ProductsControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace SQL Server with InMemory for tests
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb_Products"));
            });
        }).CreateClient();
    }

    private async Task<string> GetTokenAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new { Email = "requester@tixora.local", Password = "Pass123!" });
        var body = await response.Content.ReadFromJsonAsync<LoginResponse>();
        return body!.Token;
    }

    [Fact]
    public async Task GetProducts_Authenticated_Returns4Products()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/products");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var products = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(4, products.GetArrayLength());
    }

    [Fact]
    public async Task GetProducts_Unauthenticated_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/products");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetTasks_ValidProduct_Returns5Tasks()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/products/RBT/tasks");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tasks = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(5, tasks.GetArrayLength());
    }
}
```

- [ ] **Step 2: Write Partners integration test**

```csharp
// tests/Tixora.API.Tests/Controllers/PartnersControllerTests.cs
namespace Tixora.API.Tests.Controllers;

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Tixora.Application.DTOs.Auth;
using Tixora.Infrastructure.Data;
using Xunit;

public class PartnersControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public PartnersControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb_Partners"));
            });
        }).CreateClient();
    }

    private async Task<string> GetTokenAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new { Email = "requester@tixora.local", Password = "Pass123!" });
        var body = await response.Content.ReadFromJsonAsync<LoginResponse>();
        return body!.Token;
    }

    [Fact]
    public async Task GetPartners_Authenticated_Returns3Partners()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/partners");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var partners = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(3, partners.GetArrayLength());
    }

    [Fact]
    public async Task GetPartnerById_ValidId_ReturnsPartner()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/partners/b2000000-0000-0000-0000-000000000001");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var partner = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Alpha Insurance Co.", partner.GetProperty("name").GetString());
    }

    [Fact]
    public async Task GetPartnerById_InvalidId_Returns404()
    {
        var token = await GetTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync($"/api/partners/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
```

- [ ] **Step 3: Run all tests**

Run: `dotnet test src/Tixora.sln -v n`
Expected: All tests PASS (4 AuthService + 3 Products + 3 Partners = 10 tests).

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "feat: add integration tests for Products and Partners endpoints"
```

---

## Task 13: Create EF Migration and Verify Full Stack

- [ ] **Step 1: Create initial migration**

```bash
dotnet ef migrations add InitialCreate --project src/Tixora.Infrastructure --startup-project src/Tixora.API
```

Expected: Migration files created in `src/Tixora.Infrastructure/Data/Migrations/`.

- [ ] **Step 2: Build full solution**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded.

- [ ] **Step 3: Run all tests to confirm nothing broke**

Run: `dotnet test src/Tixora.sln -v n`
Expected: All 10 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/Tixora.Infrastructure/Data/Migrations/
git commit -m "feat: add initial EF Core migration"
```

---

## Task 14: Final Verification — Run the API

- [ ] **Step 1: Ensure SQL Server is running and apply migrations**

```bash
dotnet ef database update --project src/Tixora.Infrastructure --startup-project src/Tixora.API
```

Expected: Database `TixoraDb` created with all tables.

- [ ] **Step 2: Start the API**

```bash
dotnet run --project src/Tixora.API
```

Expected: Server starts on https://localhost:5001 (or configured port).

- [ ] **Step 3: Test login endpoint**

```bash
curl -X POST https://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"requester@tixora.local","password":"Pass123!"}' \
  -k
```

Expected: 200 OK with JWT token in response.

- [ ] **Step 4: Test products endpoint with token**

```bash
TOKEN=$(curl -s -X POST https://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"requester@tixora.local","password":"Pass123!"}' \
  -k | jq -r '.token')

curl -s https://localhost:5001/api/products \
  -H "Authorization: Bearer $TOKEN" -k | jq .
```

Expected: JSON array with 4 products (Mulem, Rabet, Rhoon, Wtheeq).

- [ ] **Step 5: Test partners endpoint with token**

```bash
curl -s https://localhost:5001/api/partners \
  -H "Authorization: Bearer $TOKEN" -k | jq .
```

Expected: JSON array with 3 partners (Alpha Insurance, Beta Trading, Gamma Services) each with lifecycle states.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: Plan 1 Foundation complete — running API with auth, products, partners"
```

---

## Summary

**Plan 1 produces:**
- 7 projects (4 src + 3 test) in a clean architecture monolith
- 12 enums, 18 entities, 3 repository interfaces + implementations
- Full EF Core configuration with DbContext and 19 entity type configs
- Seed data: 4 products, 6 users, 7 workflow definitions (with ~30 stage definitions), business hours, 3 demo partners
- JWT-based fake auth with login + /me endpoints
- Products endpoints (list, tasks per product)
- Partners endpoints (list, profile with lifecycle)
- Global error handling middleware
- 10 automated tests (4 unit + 6 integration)
- Initial EF migration ready for SQL Server
