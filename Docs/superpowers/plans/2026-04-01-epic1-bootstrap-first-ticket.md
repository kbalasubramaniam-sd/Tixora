# Epic 1: Bootstrap & First Ticket — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the .NET 8 solution, build the domain model for T-01, configure EF Core, seed reference data, wire fake JWT auth, implement the workflow engine for linear stage progression, and expose ticket lifecycle endpoints — producing a running API that handles T-01 (Agreement Validation & Sign-off) end-to-end.

**Architecture:** Clean Architecture Monolith — Domain ← Application ← Infrastructure ← API. Domain has zero dependencies. Application depends on Domain. Infrastructure depends on Application + Domain. API references all layers and wires DI.

**Tech Stack:** .NET 8, ASP.NET Core Web API, Entity Framework Core 8, SQL Server, BCrypt.Net-Next, System.IdentityModel.Tokens.Jwt, xUnit, Moq, Microsoft.AspNetCore.Mvc.Testing

---

## Task 1: Solution Scaffold (Story 1.1)

### Step 1.1.1 — Create solution and projects via CLI

- [ ] Run the following commands from the repo root to scaffold the solution and all four projects:

```bash
cd C:/Claude/Tixora

# Create solution
dotnet new sln -n Tixora -o src

# Create projects
dotnet new classlib -n Tixora.Domain -o src/Tixora.Domain --framework net8.0
dotnet new classlib -n Tixora.Application -o src/Tixora.Application --framework net8.0
dotnet new classlib -n Tixora.Infrastructure -o src/Tixora.Infrastructure --framework net8.0
dotnet new webapi -n Tixora.API -o src/Tixora.API --framework net8.0 --no-openapi

# Add projects to solution
dotnet sln src/Tixora.sln add src/Tixora.Domain/Tixora.Domain.csproj
dotnet sln src/Tixora.sln add src/Tixora.Application/Tixora.Application.csproj
dotnet sln src/Tixora.sln add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj
dotnet sln src/Tixora.sln add src/Tixora.API/Tixora.API.csproj

# Add project references (Clean Architecture dependency flow)
dotnet add src/Tixora.Application/Tixora.Application.csproj reference src/Tixora.Domain/Tixora.Domain.csproj
dotnet add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj reference src/Tixora.Application/Tixora.Application.csproj
dotnet add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj reference src/Tixora.Domain/Tixora.Domain.csproj
dotnet add src/Tixora.API/Tixora.API.csproj reference src/Tixora.Domain/Tixora.Domain.csproj
dotnet add src/Tixora.API/Tixora.API.csproj reference src/Tixora.Application/Tixora.Application.csproj
dotnet add src/Tixora.API/Tixora.API.csproj reference src/Tixora.Infrastructure/Tixora.Infrastructure.csproj
```

### Step 1.1.2 — Install NuGet packages

- [ ] Run the following commands to add required packages:

```bash
cd C:/Claude/Tixora

# Domain — no packages (zero dependencies)

# Application
dotnet add src/Tixora.Application/Tixora.Application.csproj package Microsoft.Extensions.DependencyInjection.Abstractions --version 8.0.2

# Infrastructure
dotnet add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj package Microsoft.EntityFrameworkCore --version 8.0.11
dotnet add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj package Microsoft.EntityFrameworkCore.SqlServer --version 8.0.11
dotnet add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj package Microsoft.EntityFrameworkCore.Tools --version 8.0.11
dotnet add src/Tixora.Infrastructure/Tixora.Infrastructure.csproj package BCrypt.Net-Next --version 4.0.3

# API
dotnet add src/Tixora.API/Tixora.API.csproj package Microsoft.EntityFrameworkCore.Design --version 8.0.11
dotnet add src/Tixora.API/Tixora.API.csproj package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.11
dotnet add src/Tixora.API/Tixora.API.csproj package System.IdentityModel.Tokens.Jwt --version 8.3.0
dotnet add src/Tixora.API/Tixora.API.csproj package Swashbuckle.AspNetCore --version 6.9.0
```

### Step 1.1.3 — Clean up auto-generated files

- [ ] Remove the auto-generated `Class1.cs` from Domain, Application, Infrastructure and the default weather controller from API:

```bash
cd C:/Claude/Tixora
rm -f src/Tixora.Domain/Class1.cs
rm -f src/Tixora.Application/Class1.cs
rm -f src/Tixora.Infrastructure/Class1.cs
rm -f src/Tixora.API/Controllers/WeatherForecastController.cs 2>/dev/null
```

### Step 1.1.4 — Verify build

- [ ] Build the solution to confirm scaffold is correct:

```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
```

### Step 1.1.5 — Commit

- [ ] Commit the scaffold:

```bash
cd C:/Claude/Tixora
git add -A
git commit -m "feat(E1-1.1): scaffold .NET 8 solution with Clean Architecture layers"
```

---

## Task 2: Core Domain Model (Story 1.2)

### Step 2.1 — Create Domain Enums

- [ ] Create file `src/Tixora.Domain/Enums/ProductCode.cs`:

```csharp
namespace Tixora.Domain.Enums;

public enum ProductCode
{
    RBT,
    RHN,
    WTQ,
    MLM
}
```

- [ ] Create file `src/Tixora.Domain/Enums/TaskType.cs`:

```csharp
namespace Tixora.Domain.Enums;

public enum TaskType
{
    T01,
    T02,
    T03,
    T04,
    T04
}
```

- [ ] Create file `src/Tixora.Domain/Enums/ProductAccessMode.cs`:

```csharp
namespace Tixora.Domain.Enums;

public enum ProductAccessMode
{
    Both,
    ApiOnly
}
```

- [ ] Create file `src/Tixora.Domain/Enums/ProvisioningPath.cs`:

```csharp
namespace Tixora.Domain.Enums;

public enum ProvisioningPath
{
    PortalOnly,
    PortalAndApi,
    ApiOnly
}
```

- [ ] Create file `src/Tixora.Domain/Enums/TicketStatus.cs`:

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

- [ ] Create file `src/Tixora.Domain/Enums/LifecycleState.cs`:

```csharp
namespace Tixora.Domain.Enums;

public enum LifecycleState
{
    None,
    Agreed,
    UatActive,
    Onboarded,
    Live
}
```

- [ ] Create file `src/Tixora.Domain/Enums/StageType.cs`:

```csharp
namespace Tixora.Domain.Enums;

public enum StageType
{
    Review,
    Approval,
    Provisioning,
    PhaseGate
}
```

- [ ] Create file `src/Tixora.Domain/Enums/StageAction.cs`:

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

- [ ] Create file `src/Tixora.Domain/Enums/SlaStatus.cs`:

```csharp
namespace Tixora.Domain.Enums;

public enum SlaStatus
{
    OnTrack,
    AtRisk,
    Critical,
    Breached
}
```

- [ ] Create file `src/Tixora.Domain/Enums/UserRole.cs`:

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

- [ ] Create file `src/Tixora.Domain/Enums/NotificationType.cs`:

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

- [ ] Create file `src/Tixora.Domain/Enums/IssueType.cs`:

```csharp
namespace Tixora.Domain.Enums;

public enum IssueType
{
    PortalLoginIssue,
    ApiCredentialIssue,
    PortalPasswordReset
}
```

### Step 2.2 — Create Domain Entities

- [ ] Create file `src/Tixora.Domain/Entities/Product.cs`:

```csharp
using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class Product
{
    public ProductCode Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProductAccessMode ProductAccessMode { get; set; }
    public string PortalType { get; set; } = string.Empty;
}
```

- [ ] Create file `src/Tixora.Domain/Entities/Partner.cs`:

```csharp
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

- [ ] Create file `src/Tixora.Domain/Entities/PartnerProduct.cs`:

```csharp
using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class PartnerProduct
{
    public Guid Id { get; set; }
    public Guid PartnerId { get; set; }
    public ProductCode ProductCode { get; set; }
    public LifecycleState LifecycleState { get; set; } = LifecycleState.None;
    public DateTime StateChangedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Partner Partner { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
```

- [ ] Create file `src/Tixora.Domain/Entities/Ticket.cs`:

```csharp
using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

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
}
```

- [ ] Create file `src/Tixora.Domain/Entities/StageLog.cs`:

```csharp
using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

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

- [ ] Create file `src/Tixora.Domain/Entities/AuditEntry.cs`:

```csharp
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

- [ ] Create file `src/Tixora.Domain/Entities/User.cs`:

```csharp
using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

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

- [ ] Create file `src/Tixora.Domain/Entities/WorkflowDefinition.cs`:

```csharp
using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

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

- [ ] Create file `src/Tixora.Domain/Entities/StageDefinition.cs`:

```csharp
using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class StageDefinition
{
    public Guid Id { get; set; }
    public Guid WorkflowDefinitionId { get; set; }
    public int StageOrder { get; set; }
    public string StageName { get; set; } = string.Empty;
    public StageType StageType { get; set; }
    public UserRole AssignedRole { get; set; }
    public int SlaBusinessHours { get; set; }

    public WorkflowDefinition WorkflowDefinition { get; set; } = null!;
}
```

### Step 2.3 — Create Repository Interfaces in Domain

- [ ] Create file `src/Tixora.Domain/Interfaces/ITicketRepository.cs`:

```csharp
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Domain.Interfaces;

public interface ITicketRepository
{
    Task<Ticket?> GetByIdAsync(Guid id);
    Task<Ticket?> GetByTicketIdAsync(string ticketId);
    Task<Ticket> CreateAsync(Ticket ticket);
    Task UpdateAsync(Ticket ticket);
    Task<int> GetDailySequenceAsync(ProductCode productCode, TaskType taskType, DateTime date);
}
```

- [ ] Create file `src/Tixora.Domain/Interfaces/IPartnerRepository.cs`:

```csharp
using Tixora.Domain.Entities;

namespace Tixora.Domain.Interfaces;

public interface IPartnerRepository
{
    Task<List<Partner>> GetAllAsync();
    Task<Partner?> GetByIdAsync(Guid id);
}
```

- [ ] Create file `src/Tixora.Domain/Interfaces/IUserRepository.cs`:

```csharp
using Tixora.Domain.Entities;

namespace Tixora.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByEmailAsync(string email);
}
```

- [ ] Create file `src/Tixora.Domain/Interfaces/IWorkflowRepository.cs`:

```csharp
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Domain.Interfaces;

public interface IWorkflowRepository
{
    Task<WorkflowDefinition?> GetActiveDefinitionAsync(ProductCode productCode, TaskType taskType, ProvisioningPath? provisioningPath = null);
}
```

### Step 2.4 — Verify build

- [ ] Build to confirm domain compiles:

```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
```

### Step 2.5 — Commit

- [ ] Commit domain model:

```bash
cd C:/Claude/Tixora
git add -A
git commit -m "feat(E1-1.2): add core domain model — entities, enums, repository interfaces"
```

---

## Task 3: EF Core + DbContext (Story 1.3)

### Step 3.1 — Create TixoraDbContext

- [ ] Create file `src/Tixora.Infrastructure/Persistence/TixoraDbContext.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Persistence;

public class TixoraDbContext : DbContext
{
    public TixoraDbContext(DbContextOptions<TixoraDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<PartnerProduct> PartnerProducts => Set<PartnerProduct>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<StageLog> StageLogs => Set<StageLog>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<User> Users => Set<User>();
    public DbSet<WorkflowDefinition> WorkflowDefinitions => Set<WorkflowDefinition>();
    public DbSet<StageDefinition> StageDefinitions => Set<StageDefinition>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TixoraDbContext).Assembly);
    }
}
```

### Step 3.2 — Create Entity Configurations

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Configurations/ProductConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(p => p.Code);

        builder.Property(p => p.Code)
            .HasConversion<string>()
            .HasMaxLength(3);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(p => p.ProductAccessMode)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(p => p.PortalType)
            .IsRequired()
            .HasMaxLength(50);
    }
}
```

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Configurations/PartnerConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Persistence.Configurations;

public class PartnerConfiguration : IEntityTypeConfiguration<Partner>
{
    public void Configure(EntityTypeBuilder<Partner> builder)
    {
        builder.ToTable("Partners");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Alias)
            .HasMaxLength(50);

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.HasMany(p => p.PartnerProducts)
            .WithOne(pp => pp.Partner)
            .HasForeignKey(pp => pp.PartnerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Configurations/PartnerProductConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Persistence.Configurations;

public class PartnerProductConfiguration : IEntityTypeConfiguration<PartnerProduct>
{
    public void Configure(EntityTypeBuilder<PartnerProduct> builder)
    {
        builder.ToTable("PartnerProducts");

        builder.HasKey(pp => pp.Id);

        builder.Property(pp => pp.ProductCode)
            .HasConversion<string>()
            .HasMaxLength(3);

        builder.Property(pp => pp.LifecycleState)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(pp => pp.StateChangedAt).IsRequired();
        builder.Property(pp => pp.CreatedAt).IsRequired();

        builder.HasOne(pp => pp.Product)
            .WithMany()
            .HasForeignKey(pp => pp.ProductCode)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(pp => pp.Tickets)
            .WithOne(t => t.PartnerProduct)
            .HasForeignKey(t => t.PartnerProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(pp => new { pp.PartnerId, pp.ProductCode })
            .IsUnique();
    }
}
```

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Configurations/TicketConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Persistence.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("Tickets");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TicketId)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(t => t.TicketId)
            .IsUnique();

        builder.Property(t => t.TaskType)
            .HasConversion<string>()
            .HasMaxLength(10);

        builder.Property(t => t.ProductCode)
            .HasConversion<string>()
            .HasMaxLength(3);

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(t => t.ProvisioningPath)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(t => t.IssueType)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(t => t.FormData)
            .IsRequired()
            .HasColumnType("nvarchar(max)");

        builder.Property(t => t.CancellationReason)
            .HasMaxLength(500);

        builder.Property(t => t.CreatedAt).IsRequired();
        builder.Property(t => t.UpdatedAt).IsRequired();

        builder.HasOne(t => t.CreatedBy)
            .WithMany()
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.AssignedTo)
            .WithMany()
            .HasForeignKey(t => t.AssignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.StageLogs)
            .WithOne(sl => sl.Ticket)
            .HasForeignKey(sl => sl.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.AuditEntries)
            .WithOne(ae => ae.Ticket)
            .HasForeignKey(ae => ae.TicketId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Configurations/StageLogConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Persistence.Configurations;

public class StageLogConfiguration : IEntityTypeConfiguration<StageLog>
{
    public void Configure(EntityTypeBuilder<StageLog> builder)
    {
        builder.ToTable("StageLogs");

        builder.HasKey(sl => sl.Id);

        builder.Property(sl => sl.StageName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(sl => sl.Action)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(sl => sl.Comments)
            .HasMaxLength(2000);

        builder.Property(sl => sl.Timestamp).IsRequired();

        builder.HasOne(sl => sl.Actor)
            .WithMany()
            .HasForeignKey(sl => sl.ActorUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Configurations/AuditEntryConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Persistence.Configurations;

public class AuditEntryConfiguration : IEntityTypeConfiguration<AuditEntry>
{
    public void Configure(EntityTypeBuilder<AuditEntry> builder)
    {
        builder.ToTable("AuditEntries");

        builder.HasKey(ae => ae.Id);

        builder.Property(ae => ae.ActorName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(ae => ae.ActorRole)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(ae => ae.ActionType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(ae => ae.Details)
            .HasMaxLength(2000);

        builder.Property(ae => ae.TimestampUtc).IsRequired();
    }
}
```

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Configurations/UserConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(u => u.CreatedAt).IsRequired();
    }
}
```

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Configurations/WorkflowDefinitionConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Persistence.Configurations;

public class WorkflowDefinitionConfiguration : IEntityTypeConfiguration<WorkflowDefinition>
{
    public void Configure(EntityTypeBuilder<WorkflowDefinition> builder)
    {
        builder.ToTable("WorkflowDefinitions");

        builder.HasKey(wd => wd.Id);

        builder.Property(wd => wd.ProductCode)
            .HasConversion<string>()
            .HasMaxLength(3);

        builder.Property(wd => wd.TaskType)
            .HasConversion<string>()
            .HasMaxLength(10);

        builder.Property(wd => wd.ProvisioningPath)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(wd => wd.CreatedAt).IsRequired();

        builder.HasIndex(wd => new { wd.ProductCode, wd.TaskType, wd.ProvisioningPath })
            .HasFilter("[IsActive] = 1")
            .IsUnique();

        builder.HasMany(wd => wd.Stages)
            .WithOne(sd => sd.WorkflowDefinition)
            .HasForeignKey(sd => sd.WorkflowDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Configurations/StageDefinitionConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Persistence.Configurations;

public class StageDefinitionConfiguration : IEntityTypeConfiguration<StageDefinition>
{
    public void Configure(EntityTypeBuilder<StageDefinition> builder)
    {
        builder.ToTable("StageDefinitions");

        builder.HasKey(sd => sd.Id);

        builder.Property(sd => sd.StageName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(sd => sd.StageType)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(sd => sd.AssignedRole)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasIndex(sd => new { sd.WorkflowDefinitionId, sd.StageOrder })
            .IsUnique();
    }
}
```

### Step 3.3 — Verify build

- [ ] Build to confirm EF configuration compiles:

```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
```

### Step 3.4 — Commit

- [ ] Commit EF Core setup:

```bash
cd C:/Claude/Tixora
git add -A
git commit -m "feat(E1-1.3): add EF Core DbContext with Fluent API entity configurations"
```

---

## Task 4: Seed Data (Story 1.4)

### Step 4.1 — Create Seed Data class

- [ ] Create file `src/Tixora.Infrastructure/Persistence/SeedData.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Persistence;

public static class SeedData
{
    // Pre-generated bcrypt hash for "Pass123!"
    private const string PasswordHash = "$2a$11$K3rFbR5xMpVGdLg7AZJL8eXSTGfAZ3Vy9KbD0F1HOkf1BJ7T8pJfG";

    // Fixed GUIDs for deterministic seeding
    private static readonly Guid RequesterId = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567801");
    private static readonly Guid ReviewerId = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567802");
    private static readonly Guid ApproverId = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567803");
    private static readonly Guid IntegrationId = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567804");
    private static readonly Guid ProvisioningId = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567805");
    private static readonly Guid AdminId = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567806");

    private static readonly Guid PartnerAId = Guid.Parse("b1b2c3d4-e5f6-7890-abcd-ef1234567801");
    private static readonly Guid PartnerBId = Guid.Parse("b1b2c3d4-e5f6-7890-abcd-ef1234567802");
    private static readonly Guid PartnerCId = Guid.Parse("b1b2c3d4-e5f6-7890-abcd-ef1234567803");

    private static readonly Guid PartnerProductAId = Guid.Parse("c1b2c3d4-e5f6-7890-abcd-ef1234567801");
    private static readonly Guid PartnerProductBId = Guid.Parse("c1b2c3d4-e5f6-7890-abcd-ef1234567802");
    private static readonly Guid PartnerProductCId = Guid.Parse("c1b2c3d4-e5f6-7890-abcd-ef1234567803");

    public static async Task InitializeAsync(TixoraDbContext context)
    {
        // Only seed if database is empty
        if (await context.Products.AnyAsync())
            return;

        await SeedProducts(context);
        await SeedUsers(context);
        await SeedPartners(context);
        await SeedWorkflowDefinitions(context);

        await context.SaveChangesAsync();
    }

    private static async Task SeedProducts(TixoraDbContext context)
    {
        var products = new List<Product>
        {
            new()
            {
                Code = ProductCode.RBT,
                Name = "Rabet",
                Description = "Platform for the Federal Authority for Identity, Citizenship, Customs & Port Security (ICP)",
                ProductAccessMode = ProductAccessMode.Both,
                PortalType = "Transactional"
            },
            new()
            {
                Code = ProductCode.RHN,
                Name = "Rhoon",
                Description = "Platform for Abu Dhabi Police (ADP) and Integrated Transport Centre (ITC)",
                ProductAccessMode = ProductAccessMode.Both,
                PortalType = "Transactional"
            },
            new()
            {
                Code = ProductCode.WTQ,
                Name = "Wtheeq",
                Description = "Electronic platform for vehicle insurance data transfer to ADP and ITC",
                ProductAccessMode = ProductAccessMode.ApiOnly,
                PortalType = "Read-only"
            },
            new()
            {
                Code = ProductCode.MLM,
                Name = "Mulem",
                Description = "Unified motor insurance data platform for pricing, quoting, and issuing policies",
                ProductAccessMode = ProductAccessMode.ApiOnly,
                PortalType = "Read-only"
            }
        };

        await context.Products.AddRangeAsync(products);
    }

    private static async Task SeedUsers(TixoraDbContext context)
    {
        var now = DateTime.UtcNow;
        var users = new List<User>
        {
            new()
            {
                Id = RequesterId,
                FullName = "Test Requester",
                Email = "requester@tixora.local",
                PasswordHash = PasswordHash,
                Role = UserRole.Requester,
                IsActive = true,
                CreatedAt = now
            },
            new()
            {
                Id = ReviewerId,
                FullName = "Test Reviewer",
                Email = "reviewer@tixora.local",
                PasswordHash = PasswordHash,
                Role = UserRole.Reviewer,
                IsActive = true,
                CreatedAt = now
            },
            new()
            {
                Id = ApproverId,
                FullName = "Test Approver",
                Email = "approver@tixora.local",
                PasswordHash = PasswordHash,
                Role = UserRole.Approver,
                IsActive = true,
                CreatedAt = now
            },
            new()
            {
                Id = IntegrationId,
                FullName = "Test Integration",
                Email = "integration@tixora.local",
                PasswordHash = PasswordHash,
                Role = UserRole.IntegrationTeam,
                IsActive = true,
                CreatedAt = now
            },
            new()
            {
                Id = ProvisioningId,
                FullName = "Test Provisioning",
                Email = "provisioning@tixora.local",
                PasswordHash = PasswordHash,
                Role = UserRole.ProvisioningAgent,
                IsActive = true,
                CreatedAt = now
            },
            new()
            {
                Id = AdminId,
                FullName = "Test Admin",
                Email = "admin@tixora.local",
                PasswordHash = PasswordHash,
                Role = UserRole.SystemAdministrator,
                IsActive = true,
                CreatedAt = now
            }
        };

        await context.Users.AddRangeAsync(users);
    }

    private static async Task SeedPartners(TixoraDbContext context)
    {
        var now = DateTime.UtcNow;

        var partners = new List<Partner>
        {
            new()
            {
                Id = PartnerAId,
                Name = "Alpha Insurance",
                Alias = "ALPHA",
                CreatedAt = now,
                PartnerProducts = new List<PartnerProduct>
                {
                    new()
                    {
                        Id = PartnerProductAId,
                        PartnerId = PartnerAId,
                        ProductCode = ProductCode.RBT,
                        LifecycleState = LifecycleState.Live,
                        StateChangedAt = now,
                        CreatedAt = now
                    }
                }
            },
            new()
            {
                Id = PartnerBId,
                Name = "Beta Trading",
                Alias = "BETA",
                CreatedAt = now,
                PartnerProducts = new List<PartnerProduct>
                {
                    new()
                    {
                        Id = PartnerProductBId,
                        PartnerId = PartnerBId,
                        ProductCode = ProductCode.RHN,
                        LifecycleState = LifecycleState.UatActive,
                        StateChangedAt = now,
                        CreatedAt = now
                    }
                }
            },
            new()
            {
                Id = PartnerCId,
                Name = "Gamma Holdings",
                Alias = "GAMMA",
                CreatedAt = now,
                PartnerProducts = new List<PartnerProduct>
                {
                    new()
                    {
                        Id = PartnerProductCId,
                        PartnerId = PartnerCId,
                        ProductCode = ProductCode.WTQ,
                        LifecycleState = LifecycleState.None,
                        StateChangedAt = now,
                        CreatedAt = now
                    }
                }
            }
        };

        await context.Partners.AddRangeAsync(partners);
    }

    private static async Task SeedWorkflowDefinitions(TixoraDbContext context)
    {
        var now = DateTime.UtcNow;
        var productCodes = new[] { ProductCode.RBT, ProductCode.RHN, ProductCode.WTQ, ProductCode.MLM };

        foreach (var productCode in productCodes)
        {
            var workflowId = Guid.NewGuid();
            var workflow = new WorkflowDefinition
            {
                Id = workflowId,
                ProductCode = productCode,
                TaskType = TaskType.T01,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now,
                Stages = new List<StageDefinition>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        WorkflowDefinitionId = workflowId,
                        StageOrder = 1,
                        StageName = "Legal Review",
                        StageType = StageType.Review,
                        AssignedRole = UserRole.Reviewer,
                        SlaBusinessHours = 16
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        WorkflowDefinitionId = workflowId,
                        StageOrder = 2,
                        StageName = "Product Review",
                        StageType = StageType.Review,
                        AssignedRole = UserRole.Approver,
                        SlaBusinessHours = 16
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        WorkflowDefinitionId = workflowId,
                        StageOrder = 3,
                        StageName = "EA Sign-off",
                        StageType = StageType.Approval,
                        AssignedRole = UserRole.Approver,
                        SlaBusinessHours = 16
                    }
                }
            };

            await context.WorkflowDefinitions.AddAsync(workflow);
        }
    }
}
```

### Step 4.2 — Verify build

- [ ] Build:

```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
```

### Step 4.3 — Commit

- [ ] Commit seed data:

```bash
cd C:/Claude/Tixora
git add -A
git commit -m "feat(E1-1.4): add seed data for products, users, partners, and T-01 workflows"
```

---

## Task 5: Fake Auth — JWT + Middleware (Story 1.5)

### Step 5.1 — Create Application-layer DTOs for Auth

- [ ] Create file `src/Tixora.Application/DTOs/LoginRequest.cs`:

```csharp
namespace Tixora.Application.DTOs;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
```

- [ ] Create file `src/Tixora.Application/DTOs/LoginResponse.cs`:

```csharp
namespace Tixora.Application.DTOs;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
```

### Step 5.2 — Create IAuthService interface and implementation

- [ ] Create file `src/Tixora.Application/Interfaces/IAuthService.cs`:

```csharp
using Tixora.Application.DTOs;

namespace Tixora.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
}
```

- [ ] Create file `src/Tixora.Application/Services/AuthService.cs`:

```csharp
using Tixora.Application.DTOs;
using Tixora.Application.Interfaces;
using Tixora.Domain.Interfaces;

namespace Tixora.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(IUserRepository userRepository, IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null || !user.IsActive)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new LoginResponse
        {
            Token = token.Token,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            ExpiresAt = token.ExpiresAt
        };
    }
}
```

### Step 5.3 — Create IJwtTokenGenerator interface

- [ ] Create file `src/Tixora.Application/Interfaces/IJwtTokenGenerator.cs`:

```csharp
using Tixora.Domain.Entities;

namespace Tixora.Application.Interfaces;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAt) GenerateToken(User user);
}
```

### Step 5.4 — Add BCrypt package to Application layer

- [ ] Add BCrypt to Application project:

```bash
cd C:/Claude/Tixora
dotnet add src/Tixora.Application/Tixora.Application.csproj package BCrypt.Net-Next --version 4.0.3
```

### Step 5.5 — Create JwtTokenGenerator in Infrastructure

- [ ] Create file `src/Tixora.Infrastructure/Auth/JwtTokenGenerator.cs`:

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Auth;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, DateTime ExpiresAt) GenerateToken(User user)
    {
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT key not configured");
        var issuer = _configuration["Jwt:Issuer"] ?? "Tixora";
        var audience = _configuration["Jwt:Audience"] ?? "TixoraApp";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var allProducts = string.Join(",", Enum.GetNames<ProductCode>());

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("name", user.FullName),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("role", user.Role.ToString()),
            new("products", allProducts),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var expiresAt = DateTime.UtcNow.AddHours(8);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
```

### Step 5.6 — Configure JWT in API appsettings

- [ ] Create/replace file `src/Tixora.API/appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TixoraDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Key": "TixoraDevSecret2026!AtLeast32CharactersLong",
    "Issuer": "Tixora",
    "Audience": "TixoraApp"
  }
}
```

- [ ] Create/replace file `src/Tixora.API/appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}
```

### Step 5.7 — Create AuthController

- [ ] Create directory and file `src/Tixora.API/Controllers/AuthController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.DTOs;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Validation failed", details = "Email and password are required." });

        var result = await _authService.LoginAsync(request);
        if (result == null)
            return Unauthorized(new { error = "Authentication failed", details = "Invalid email or password." });

        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var userId = User.FindFirst(System.Security.Claims.JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(System.Security.Claims.JwtRegisteredClaimNames.Email)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var name = User.FindFirst("name")?.Value;
        var role = User.FindFirst("role")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var products = User.FindFirst("products")?.Value;

        return Ok(new
        {
            userId,
            email,
            name,
            role,
            products = products?.Split(',') ?? Array.Empty<string>()
        });
    }
}
```

### Step 5.8 — Verify build

- [ ] Build:

```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
```

### Step 5.9 — Commit

- [ ] Commit auth:

```bash
cd C:/Claude/Tixora
git add -A
git commit -m "feat(E1-1.5): add fake JWT auth — login endpoint, token generation, me endpoint"
```

---

## Task 6: Repository Implementations (Story 1.3 continued)

### Step 6.1 — Create TicketRepository

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Repositories/TicketRepository.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Domain.Interfaces;

namespace Tixora.Infrastructure.Persistence.Repositories;

public class TicketRepository : ITicketRepository
{
    private readonly TixoraDbContext _context;

    public TicketRepository(TixoraDbContext context)
    {
        _context = context;
    }

    public async Task<Ticket?> GetByIdAsync(Guid id)
    {
        return await _context.Tickets
            .Include(t => t.PartnerProduct)
                .ThenInclude(pp => pp.Partner)
            .Include(t => t.PartnerProduct)
                .ThenInclude(pp => pp.Product)
            .Include(t => t.CreatedBy)
            .Include(t => t.AssignedTo)
            .Include(t => t.StageLogs.OrderBy(sl => sl.Timestamp))
                .ThenInclude(sl => sl.Actor)
            .Include(t => t.AuditEntries.OrderBy(ae => ae.TimestampUtc))
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<Ticket?> GetByTicketIdAsync(string ticketId)
    {
        return await _context.Tickets
            .Include(t => t.PartnerProduct)
                .ThenInclude(pp => pp.Partner)
            .Include(t => t.PartnerProduct)
                .ThenInclude(pp => pp.Product)
            .Include(t => t.CreatedBy)
            .Include(t => t.AssignedTo)
            .Include(t => t.StageLogs.OrderBy(sl => sl.Timestamp))
                .ThenInclude(sl => sl.Actor)
            .Include(t => t.AuditEntries.OrderBy(ae => ae.TimestampUtc))
            .FirstOrDefaultAsync(t => t.TicketId == ticketId);
    }

    public async Task<Ticket> CreateAsync(Ticket ticket)
    {
        await _context.Tickets.AddAsync(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }

    public async Task UpdateAsync(Ticket ticket)
    {
        _context.Tickets.Update(ticket);
        await _context.SaveChangesAsync();
    }

    public async Task<int> GetDailySequenceAsync(ProductCode productCode, TaskType taskType, DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);

        var count = await _context.Tickets
            .CountAsync(t =>
                t.ProductCode == productCode &&
                t.TaskType == taskType &&
                t.CreatedAt >= startOfDay &&
                t.CreatedAt < endOfDay);

        return count + 1;
    }
}
```

### Step 6.2 — Create PartnerRepository

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Repositories/PartnerRepository.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Interfaces;

namespace Tixora.Infrastructure.Persistence.Repositories;

public class PartnerRepository : IPartnerRepository
{
    private readonly TixoraDbContext _context;

    public PartnerRepository(TixoraDbContext context)
    {
        _context = context;
    }

    public async Task<List<Partner>> GetAllAsync()
    {
        return await _context.Partners
            .Include(p => p.PartnerProducts)
                .ThenInclude(pp => pp.Product)
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    public async Task<Partner?> GetByIdAsync(Guid id)
    {
        return await _context.Partners
            .Include(p => p.PartnerProducts)
                .ThenInclude(pp => pp.Product)
            .Include(p => p.PartnerProducts)
                .ThenInclude(pp => pp.Tickets)
            .FirstOrDefaultAsync(p => p.Id == id);
    }
}
```

### Step 6.3 — Create UserRepository

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Repositories/UserRepository.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Interfaces;

namespace Tixora.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly TixoraDbContext _context;

    public UserRepository(TixoraDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    }
}
```

### Step 6.4 — Create WorkflowRepository

- [ ] Create file `src/Tixora.Infrastructure/Persistence/Repositories/WorkflowRepository.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Domain.Interfaces;

namespace Tixora.Infrastructure.Persistence.Repositories;

public class WorkflowRepository : IWorkflowRepository
{
    private readonly TixoraDbContext _context;

    public WorkflowRepository(TixoraDbContext context)
    {
        _context = context;
    }

    public async Task<WorkflowDefinition?> GetActiveDefinitionAsync(
        ProductCode productCode,
        TaskType taskType,
        ProvisioningPath? provisioningPath = null)
    {
        return await _context.WorkflowDefinitions
            .Include(wd => wd.Stages.OrderBy(s => s.StageOrder))
            .FirstOrDefaultAsync(wd =>
                wd.ProductCode == productCode &&
                wd.TaskType == taskType &&
                wd.ProvisioningPath == provisioningPath &&
                wd.IsActive);
    }
}
```

### Step 6.5 — Verify build and commit

- [ ] Build and commit:

```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
git add -A
git commit -m "feat(E1-1.3): add repository implementations for Ticket, Partner, User, Workflow"
```

---

## Task 7: Application Layer Services — Product & Partner (Story 1.6)

### Step 7.1 — Create Product DTOs

- [ ] Create file `src/Tixora.Application/DTOs/ProductResponse.cs`:

```csharp
namespace Tixora.Application.DTOs;

public class ProductResponse
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AccessMode { get; set; } = string.Empty;
    public string PortalType { get; set; } = string.Empty;
}
```

- [ ] Create file `src/Tixora.Application/DTOs/TaskInfoResponse.cs`:

```csharp
namespace Tixora.Application.DTOs;

public class TaskInfoResponse
{
    public string TaskType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
```

### Step 7.2 — Create Partner DTOs

- [ ] Create file `src/Tixora.Application/DTOs/PartnerListResponse.cs`:

```csharp
namespace Tixora.Application.DTOs;

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

- [ ] Create file `src/Tixora.Application/DTOs/PartnerProfileResponse.cs`:

```csharp
namespace Tixora.Application.DTOs;

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
    public int TicketCount { get; set; }
}
```

### Step 7.3 — Create ProductService

- [ ] Create file `src/Tixora.Application/Services/ProductService.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs;
using Tixora.Domain.Enums;

namespace Tixora.Application.Services;

public class ProductService
{
    private static readonly Dictionary<string, List<TaskInfoResponse>> TasksByProduct = new()
    {
        ["RBT"] = AllTasks(),
        ["RHN"] = AllTasks(),
        ["WTQ"] = AllTasks(),
        ["MLM"] = AllTasks()
    };

    private static List<TaskInfoResponse> AllTasks() => new()
    {
        new() { TaskType = "T01", Name = "Agreement Validation & Sign-off", Description = "Validate and sign off on a partner agreement before onboarding begins." },
        new() { TaskType = "T02", Name = "UAT Access Creation", Description = "Create UAT environment access for a partner contact." },
        new() { TaskType = "T03", Name = "Partner Account Creation", Description = "Create a partner account with optional API access." },
        new() { TaskType = "T04", Name = "User Account Creation", Description = "Create admin user accounts for an existing partner." },
        new() { TaskType = "T04", Name = "Access & Credential Support", Description = "Resolve access and credential issues for a partner user." }
    };

    public List<ProductResponse> GetAllProducts()
    {
        return new List<ProductResponse>
        {
            new() { Code = "RBT", Name = "Rabet", Description = "Platform for the Federal Authority for Identity, Citizenship, Customs & Port Security (ICP)", AccessMode = "Both", PortalType = "Transactional" },
            new() { Code = "RHN", Name = "Rhoon", Description = "Platform for Abu Dhabi Police (ADP) and Integrated Transport Centre (ITC)", AccessMode = "Both", PortalType = "Transactional" },
            new() { Code = "WTQ", Name = "Wtheeq", Description = "Electronic platform for vehicle insurance data transfer to ADP and ITC", AccessMode = "ApiOnly", PortalType = "Read-only" },
            new() { Code = "MLM", Name = "Mulem", Description = "Unified motor insurance data platform for pricing, quoting, and issuing policies", AccessMode = "ApiOnly", PortalType = "Read-only" }
        };
    }

    public List<TaskInfoResponse>? GetTasksForProduct(string productCode)
    {
        return TasksByProduct.TryGetValue(productCode.ToUpperInvariant(), out var tasks) ? tasks : null;
    }
}
```

### Step 7.4 — Create PartnerService

- [ ] Create file `src/Tixora.Application/Services/PartnerService.cs`:

```csharp
using Tixora.Application.DTOs;
using Tixora.Domain.Interfaces;

namespace Tixora.Application.Services;

public class PartnerService
{
    private readonly IPartnerRepository _partnerRepository;

    public PartnerService(IPartnerRepository partnerRepository)
    {
        _partnerRepository = partnerRepository;
    }

    public async Task<List<PartnerListResponse>> GetAllPartnersAsync()
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

    public async Task<PartnerProfileResponse?> GetPartnerByIdAsync(Guid id)
    {
        var partner = await _partnerRepository.GetByIdAsync(id);
        if (partner == null)
            return null;

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
                TicketCount = pp.Tickets.Count
            }).ToList()
        };
    }
}
```

### Step 7.5 — Create ProductsController and PartnersController

- [ ] Create file `src/Tixora.API/Controllers/ProductsController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.Services;

namespace Tixora.API.Controllers;

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
    public IActionResult GetAll()
    {
        var products = _productService.GetAllProducts();
        return Ok(products);
    }

    [HttpGet("{code}/tasks")]
    public IActionResult GetTasks(string code)
    {
        var tasks = _productService.GetTasksForProduct(code);
        if (tasks == null)
            return NotFound(new { error = "Not found", details = $"Product '{code}' does not exist." });

        return Ok(tasks);
    }
}
```

- [ ] Create file `src/Tixora.API/Controllers/PartnersController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.Services;

namespace Tixora.API.Controllers;

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
        var partners = await _partnerService.GetAllPartnersAsync();
        return Ok(partners);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var partner = await _partnerService.GetPartnerByIdAsync(id);
        if (partner == null)
            return NotFound(new { error = "Not found", details = $"Partner with ID '{id}' does not exist." });

        return Ok(partner);
    }
}
```

### Step 7.6 — Verify build and commit

- [ ] Build and commit:

```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
git add -A
git commit -m "feat(E1-1.6): add Product and Partner services and read endpoints"
```

---

## Task 8: Ticket Creation (Story 1.7)

### Step 8.1 — Create Ticket DTOs

- [ ] Create file `src/Tixora.Application/DTOs/CreateTicketRequest.cs`:

```csharp
using Tixora.Domain.Enums;

namespace Tixora.Application.DTOs;

public class CreateTicketRequest
{
    public Guid PartnerProductId { get; set; }
    public string TaskType { get; set; } = string.Empty;
    public string? ProvisioningPath { get; set; }
    public string? IssueType { get; set; }
    public string FormData { get; set; } = "{}";
}
```

- [ ] Create file `src/Tixora.Application/DTOs/TicketDetailResponse.cs`:

```csharp
namespace Tixora.Application.DTOs;

public class TicketDetailResponse
{
    public Guid Id { get; set; }
    public string TicketId { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string TaskType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int CurrentStageOrder { get; set; }
    public string? CurrentStageName { get; set; }
    public string? ProvisioningPath { get; set; }
    public string? IssueType { get; set; }
    public string FormData { get; set; } = "{}";
    public string PartnerName { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public string? AssignedToName { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<StageLogEntry> StageLogs { get; set; } = new();
    public List<AuditLogEntry> AuditLog { get; set; } = new();
}

public class StageLogEntry
{
    public int StageOrder { get; set; }
    public string StageName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string ActorName { get; set; } = string.Empty;
    public string? Comments { get; set; }
    public DateTime Timestamp { get; set; }
}

public class AuditLogEntry
{
    public string ActorName { get; set; } = string.Empty;
    public string ActorRole { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime TimestampUtc { get; set; }
}
```

### Step 8.2 — Create ITicketService and TicketService

- [ ] Create file `src/Tixora.Application/Interfaces/ITicketService.cs`:

```csharp
using Tixora.Application.DTOs;

namespace Tixora.Application.Interfaces;

public interface ITicketService
{
    Task<TicketDetailResponse> CreateTicketAsync(CreateTicketRequest request, Guid userId);
    Task<TicketDetailResponse?> GetTicketByIdAsync(Guid id);
}
```

- [ ] Create file `src/Tixora.Application/Services/TicketService.cs`:

```csharp
using Tixora.Application.DTOs;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Domain.Interfaces;

namespace Tixora.Application.Services;

public class TicketService : ITicketService
{
    private readonly ITicketRepository _ticketRepository;
    private readonly IWorkflowRepository _workflowRepository;
    private readonly IPartnerRepository _partnerRepository;
    private readonly IUserRepository _userRepository;

    public TicketService(
        ITicketRepository ticketRepository,
        IWorkflowRepository workflowRepository,
        IPartnerRepository partnerRepository,
        IUserRepository userRepository)
    {
        _ticketRepository = ticketRepository;
        _workflowRepository = workflowRepository;
        _partnerRepository = partnerRepository;
        _userRepository = userRepository;
    }

    public async Task<TicketDetailResponse> CreateTicketAsync(CreateTicketRequest request, Guid userId)
    {
        if (!Enum.TryParse<TaskType>(request.TaskType, true, out var taskType))
            throw new ArgumentException($"Invalid task type: {request.TaskType}");

        ProvisioningPath? provPath = null;
        if (!string.IsNullOrEmpty(request.ProvisioningPath))
        {
            if (!Enum.TryParse<ProvisioningPath>(request.ProvisioningPath, true, out var pp))
                throw new ArgumentException($"Invalid provisioning path: {request.ProvisioningPath}");
            provPath = pp;
        }

        IssueType? issueType = null;
        if (!string.IsNullOrEmpty(request.IssueType))
        {
            if (!Enum.TryParse<IssueType>(request.IssueType, true, out var it))
                throw new ArgumentException($"Invalid issue type: {request.IssueType}");
            issueType = it;
        }

        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new ArgumentException("User not found.");

        // Resolve partner product to get product code
        var partners = await _partnerRepository.GetAllAsync();
        var partnerProduct = partners
            .SelectMany(p => p.PartnerProducts)
            .FirstOrDefault(pp => pp.Id == request.PartnerProductId)
            ?? throw new ArgumentException($"Partner product with ID '{request.PartnerProductId}' not found.");

        var productCode = partnerProduct.ProductCode;

        // Validate workflow exists
        var workflow = await _workflowRepository.GetActiveDefinitionAsync(productCode, taskType, provPath)
            ?? throw new InvalidOperationException($"No active workflow found for {productCode}/{taskType}.");

        // Generate ticket ID
        var now = DateTime.UtcNow;
        var seq = await _ticketRepository.GetDailySequenceAsync(productCode, taskType, now);
        var ticketId = $"SPM-{productCode}-{taskType}-{now:yyyyMMdd}-{seq:D4}";

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            PartnerProductId = request.PartnerProductId,
            TaskType = taskType,
            ProductCode = productCode,
            Status = TicketStatus.Submitted,
            CurrentStageOrder = 0,
            ProvisioningPath = provPath,
            IssueType = issueType,
            FormData = request.FormData,
            CreatedByUserId = userId,
            AssignedToUserId = null,
            CreatedAt = now,
            UpdatedAt = now
        };

        // Add initial audit entry
        ticket.AuditEntries.Add(new AuditEntry
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorUserId = userId,
            ActorName = user.FullName,
            ActorRole = user.Role.ToString(),
            ActionType = "TicketCreated",
            Details = $"Ticket {ticketId} created for {productCode}/{taskType}",
            TimestampUtc = now
        });

        await _ticketRepository.CreateAsync(ticket);

        // Re-fetch with includes for response mapping
        var created = await _ticketRepository.GetByIdAsync(ticket.Id);
        return MapToDetailResponse(created!, workflow);
    }

    public async Task<TicketDetailResponse?> GetTicketByIdAsync(Guid id)
    {
        var ticket = await _ticketRepository.GetByIdAsync(id);
        if (ticket == null)
            return null;

        var workflow = await _workflowRepository.GetActiveDefinitionAsync(
            ticket.ProductCode, ticket.TaskType, ticket.ProvisioningPath);

        return MapToDetailResponse(ticket, workflow);
    }

    private static TicketDetailResponse MapToDetailResponse(Ticket ticket, WorkflowDefinition? workflow)
    {
        var currentStage = workflow?.Stages
            .FirstOrDefault(s => s.StageOrder == ticket.CurrentStageOrder);

        return new TicketDetailResponse
        {
            Id = ticket.Id,
            TicketId = ticket.TicketId,
            ProductCode = ticket.ProductCode.ToString(),
            ProductName = ticket.PartnerProduct?.Product?.Name ?? ticket.ProductCode.ToString(),
            TaskType = ticket.TaskType.ToString(),
            Status = ticket.Status.ToString(),
            CurrentStageOrder = ticket.CurrentStageOrder,
            CurrentStageName = currentStage?.StageName,
            ProvisioningPath = ticket.ProvisioningPath?.ToString(),
            IssueType = ticket.IssueType?.ToString(),
            FormData = ticket.FormData,
            PartnerName = ticket.PartnerProduct?.Partner?.Name ?? "Unknown",
            CreatedByName = ticket.CreatedBy?.FullName ?? "Unknown",
            AssignedToName = ticket.AssignedTo?.FullName,
            CancellationReason = ticket.CancellationReason,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt,
            StageLogs = ticket.StageLogs.Select(sl => new StageLogEntry
            {
                StageOrder = sl.StageOrder,
                StageName = sl.StageName,
                Action = sl.Action.ToString(),
                ActorName = sl.Actor?.FullName ?? "Unknown",
                Comments = sl.Comments,
                Timestamp = sl.Timestamp
            }).ToList(),
            AuditLog = ticket.AuditEntries.Select(ae => new AuditLogEntry
            {
                ActorName = ae.ActorName,
                ActorRole = ae.ActorRole,
                ActionType = ae.ActionType,
                Details = ae.Details,
                TimestampUtc = ae.TimestampUtc
            }).ToList()
        };
    }
}
```

### Step 8.3 — Create TicketsController (create + get)

- [ ] Create file `src/Tixora.API/Controllers/TicketsController.cs`:

```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.DTOs;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly IWorkflowEngine _workflowEngine;

    public TicketsController(ITicketService ticketService, IWorkflowEngine workflowEngine)
    {
        _ticketService = ticketService;
        _workflowEngine = workflowEngine;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { error = "Unauthorized", details = "Invalid user token." });

        try
        {
            var ticket = await _ticketService.CreateTicketAsync(request, userId.Value);
            return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "Validation failed", details = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = "Operation failed", details = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var ticket = await _ticketService.GetTicketByIdAsync(id);
        if (ticket == null)
            return NotFound(new { error = "Not found", details = $"Ticket with ID '{id}' not found." });

        return Ok(ticket);
    }

    [HttpPut("{id:guid}/advance")]
    public async Task<IActionResult> Advance(Guid id, [FromBody] StageActionRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { error = "Unauthorized", details = "Invalid user token." });

        try
        {
            var ticket = await _workflowEngine.AdvanceAsync(id, userId.Value, request.Comments);
            return Ok(ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "Validation failed", details = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = "Operation failed", details = ex.Message });
        }
    }

    [HttpPut("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] StageActionRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { error = "Unauthorized", details = "Invalid user token." });

        try
        {
            var ticket = await _workflowEngine.RejectAsync(id, userId.Value, request.Comments);
            return Ok(ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "Validation failed", details = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = "Operation failed", details = ex.Message });
        }
    }

    [HttpPut("{id:guid}/return")]
    public async Task<IActionResult> ReturnForClarification(Guid id, [FromBody] StageActionRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { error = "Unauthorized", details = "Invalid user token." });

        try
        {
            var ticket = await _workflowEngine.ReturnForClarificationAsync(id, userId.Value, request.Comments);
            return Ok(ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "Validation failed", details = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = "Operation failed", details = ex.Message });
        }
    }

    [HttpPut("{id:guid}/respond")]
    public async Task<IActionResult> Respond(Guid id, [FromBody] StageActionRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { error = "Unauthorized", details = "Invalid user token." });

        try
        {
            var ticket = await _workflowEngine.RespondToClarificationAsync(id, userId.Value, request.Comments);
            return Ok(ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "Validation failed", details = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = "Operation failed", details = ex.Message });
        }
    }

    [HttpPut("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] StageActionRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { error = "Unauthorized", details = "Invalid user token." });

        try
        {
            var ticket = await _workflowEngine.CancelAsync(id, userId.Value, request.Comments);
            return Ok(ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "Validation failed", details = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = "Operation failed", details = ex.Message });
        }
    }

    [HttpPut("{id:guid}/reassign")]
    public async Task<IActionResult> Reassign(Guid id, [FromBody] ReassignRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { error = "Unauthorized", details = "Invalid user token." });

        try
        {
            var ticket = await _workflowEngine.ReassignAsync(id, userId.Value, request.NewUserId, request.Reason);
            return Ok(ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "Validation failed", details = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = "Operation failed", details = ex.Message });
        }
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
```

### Step 8.4 — Create action DTOs

- [ ] Create file `src/Tixora.Application/DTOs/StageActionRequest.cs`:

```csharp
namespace Tixora.Application.DTOs;

public class StageActionRequest
{
    public string? Comments { get; set; }
}
```

- [ ] Create file `src/Tixora.Application/DTOs/ReassignRequest.cs`:

```csharp
namespace Tixora.Application.DTOs;

public class ReassignRequest
{
    public Guid NewUserId { get; set; }
    public string? Reason { get; set; }
}
```

### Step 8.5 — Verify build and commit

- [ ] Build and commit:

```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
git add -A
git commit -m "feat(E1-1.7): add ticket creation service, DTOs, and tickets controller"
```

---

## Task 9: Workflow Engine Core (Story 1.8)

### Step 9.1 — Create IWorkflowEngine interface

- [ ] Create file `src/Tixora.Application/Interfaces/IWorkflowEngine.cs`:

```csharp
using Tixora.Application.DTOs;

namespace Tixora.Application.Interfaces;

public interface IWorkflowEngine
{
    Task<TicketDetailResponse> InitializeAsync(Guid ticketId, Guid actorUserId);
    Task<TicketDetailResponse> AdvanceAsync(Guid ticketId, Guid actorUserId, string? comments = null);
    Task<TicketDetailResponse> RejectAsync(Guid ticketId, Guid actorUserId, string? comments = null);
    Task<TicketDetailResponse> ReturnForClarificationAsync(Guid ticketId, Guid actorUserId, string? comments = null);
    Task<TicketDetailResponse> RespondToClarificationAsync(Guid ticketId, Guid actorUserId, string? comments = null);
    Task<TicketDetailResponse> CancelAsync(Guid ticketId, Guid actorUserId, string? reason = null);
    Task<TicketDetailResponse> ReassignAsync(Guid ticketId, Guid actorUserId, Guid newUserId, string? reason = null);
}
```

### Step 9.2 — Create WorkflowEngine implementation

- [ ] Create file `src/Tixora.Application/Services/WorkflowEngine.cs`:

```csharp
using Tixora.Application.DTOs;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Domain.Interfaces;

namespace Tixora.Application.Services;

public class WorkflowEngine : IWorkflowEngine
{
    private readonly ITicketRepository _ticketRepository;
    private readonly IWorkflowRepository _workflowRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITicketService _ticketService;

    public WorkflowEngine(
        ITicketRepository ticketRepository,
        IWorkflowRepository workflowRepository,
        IUserRepository userRepository,
        ITicketService ticketService)
    {
        _ticketRepository = ticketRepository;
        _workflowRepository = workflowRepository;
        _userRepository = userRepository;
        _ticketService = ticketService;
    }

    public async Task<TicketDetailResponse> InitializeAsync(Guid ticketId, Guid actorUserId)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId)
            ?? throw new ArgumentException($"Ticket '{ticketId}' not found.");

        var actor = await _userRepository.GetByIdAsync(actorUserId)
            ?? throw new ArgumentException("Actor user not found.");

        var workflow = await _workflowRepository.GetActiveDefinitionAsync(
            ticket.ProductCode, ticket.TaskType, ticket.ProvisioningPath)
            ?? throw new InvalidOperationException("No active workflow definition found.");

        var firstStage = workflow.Stages.OrderBy(s => s.StageOrder).First();

        ticket.CurrentStageOrder = firstStage.StageOrder;
        ticket.Status = TicketStatus.InReview;
        ticket.UpdatedAt = DateTime.UtcNow;

        AddAuditEntry(ticket, actor, "WorkflowInitialized",
            $"Workflow initialized. First stage: {firstStage.StageName} (Stage {firstStage.StageOrder})");

        await _ticketRepository.UpdateAsync(ticket);

        return (await _ticketService.GetTicketByIdAsync(ticket.Id))!;
    }

    public async Task<TicketDetailResponse> AdvanceAsync(Guid ticketId, Guid actorUserId, string? comments = null)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId)
            ?? throw new ArgumentException($"Ticket '{ticketId}' not found.");

        if (ticket.Status != TicketStatus.InReview && ticket.Status != TicketStatus.Submitted)
            throw new InvalidOperationException($"Cannot advance ticket in status '{ticket.Status}'.");

        var actor = await _userRepository.GetByIdAsync(actorUserId)
            ?? throw new ArgumentException("Actor user not found.");

        var workflow = await _workflowRepository.GetActiveDefinitionAsync(
            ticket.ProductCode, ticket.TaskType, ticket.ProvisioningPath)
            ?? throw new InvalidOperationException("No active workflow definition found.");

        // If ticket is Submitted, initialize first
        if (ticket.Status == TicketStatus.Submitted)
        {
            var firstStage = workflow.Stages.OrderBy(s => s.StageOrder).First();
            ticket.CurrentStageOrder = firstStage.StageOrder;
            ticket.Status = TicketStatus.InReview;
        }

        var currentStage = workflow.Stages.FirstOrDefault(s => s.StageOrder == ticket.CurrentStageOrder)
            ?? throw new InvalidOperationException("Current stage not found in workflow definition.");

        var now = DateTime.UtcNow;

        // Log stage action
        ticket.StageLogs.Add(new StageLog
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            StageOrder = currentStage.StageOrder,
            StageName = currentStage.StageName,
            Action = StageAction.Approve,
            ActorUserId = actorUserId,
            Comments = comments,
            Timestamp = now
        });

        AddAuditEntry(ticket, actor, "StageApproved",
            $"Stage '{currentStage.StageName}' approved.{(comments != null ? $" Comments: {comments}" : "")}");

        // Check if there's a next stage
        var nextStage = workflow.Stages
            .Where(s => s.StageOrder > currentStage.StageOrder)
            .OrderBy(s => s.StageOrder)
            .FirstOrDefault();

        if (nextStage != null)
        {
            ticket.CurrentStageOrder = nextStage.StageOrder;
            ticket.Status = TicketStatus.InReview;
            ticket.AssignedToUserId = null; // Reset assignment for next stage

            AddAuditEntry(ticket, actor, "StageAdvanced",
                $"Advanced to stage '{nextStage.StageName}' (Stage {nextStage.StageOrder}).");
        }
        else
        {
            // Final stage completed — mark ticket as Completed
            ticket.Status = TicketStatus.Completed;

            AddAuditEntry(ticket, actor, "TicketCompleted",
                $"All stages completed. Ticket marked as Completed.");

            // Advance partner lifecycle for T-01
            await AdvancePartnerLifecycleAsync(ticket);
        }

        ticket.UpdatedAt = now;
        await _ticketRepository.UpdateAsync(ticket);

        return (await _ticketService.GetTicketByIdAsync(ticket.Id))!;
    }

    public async Task<TicketDetailResponse> RejectAsync(Guid ticketId, Guid actorUserId, string? comments = null)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId)
            ?? throw new ArgumentException($"Ticket '{ticketId}' not found.");

        if (ticket.Status != TicketStatus.InReview)
            throw new InvalidOperationException($"Cannot reject ticket in status '{ticket.Status}'.");

        var actor = await _userRepository.GetByIdAsync(actorUserId)
            ?? throw new ArgumentException("Actor user not found.");

        var workflow = await _workflowRepository.GetActiveDefinitionAsync(
            ticket.ProductCode, ticket.TaskType, ticket.ProvisioningPath);

        var currentStage = workflow?.Stages.FirstOrDefault(s => s.StageOrder == ticket.CurrentStageOrder);
        var now = DateTime.UtcNow;

        ticket.StageLogs.Add(new StageLog
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            StageOrder = ticket.CurrentStageOrder,
            StageName = currentStage?.StageName ?? "Unknown",
            Action = StageAction.Reject,
            ActorUserId = actorUserId,
            Comments = comments,
            Timestamp = now
        });

        ticket.Status = TicketStatus.Rejected;
        ticket.UpdatedAt = now;

        AddAuditEntry(ticket, actor, "TicketRejected",
            $"Ticket rejected at stage '{currentStage?.StageName}'.{(comments != null ? $" Reason: {comments}" : "")}");

        await _ticketRepository.UpdateAsync(ticket);

        return (await _ticketService.GetTicketByIdAsync(ticket.Id))!;
    }

    public async Task<TicketDetailResponse> ReturnForClarificationAsync(Guid ticketId, Guid actorUserId, string? comments = null)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId)
            ?? throw new ArgumentException($"Ticket '{ticketId}' not found.");

        if (ticket.Status != TicketStatus.InReview)
            throw new InvalidOperationException($"Cannot return ticket for clarification in status '{ticket.Status}'.");

        var actor = await _userRepository.GetByIdAsync(actorUserId)
            ?? throw new ArgumentException("Actor user not found.");

        var workflow = await _workflowRepository.GetActiveDefinitionAsync(
            ticket.ProductCode, ticket.TaskType, ticket.ProvisioningPath);

        var currentStage = workflow?.Stages.FirstOrDefault(s => s.StageOrder == ticket.CurrentStageOrder);
        var now = DateTime.UtcNow;

        ticket.StageLogs.Add(new StageLog
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            StageOrder = ticket.CurrentStageOrder,
            StageName = currentStage?.StageName ?? "Unknown",
            Action = StageAction.ReturnForClarification,
            ActorUserId = actorUserId,
            Comments = comments,
            Timestamp = now
        });

        ticket.Status = TicketStatus.PendingRequesterAction;
        ticket.UpdatedAt = now;

        AddAuditEntry(ticket, actor, "ClarificationRequested",
            $"Returned for clarification at stage '{currentStage?.StageName}'.{(comments != null ? $" Comments: {comments}" : "")}");

        await _ticketRepository.UpdateAsync(ticket);

        return (await _ticketService.GetTicketByIdAsync(ticket.Id))!;
    }

    public async Task<TicketDetailResponse> RespondToClarificationAsync(Guid ticketId, Guid actorUserId, string? comments = null)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId)
            ?? throw new ArgumentException($"Ticket '{ticketId}' not found.");

        if (ticket.Status != TicketStatus.PendingRequesterAction)
            throw new InvalidOperationException($"Cannot respond to clarification in status '{ticket.Status}'.");

        var actor = await _userRepository.GetByIdAsync(actorUserId)
            ?? throw new ArgumentException("Actor user not found.");

        var workflow = await _workflowRepository.GetActiveDefinitionAsync(
            ticket.ProductCode, ticket.TaskType, ticket.ProvisioningPath);

        var currentStage = workflow?.Stages.FirstOrDefault(s => s.StageOrder == ticket.CurrentStageOrder);
        var now = DateTime.UtcNow;

        ticket.StageLogs.Add(new StageLog
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            StageOrder = ticket.CurrentStageOrder,
            StageName = currentStage?.StageName ?? "Unknown",
            Action = StageAction.RespondToClarification,
            ActorUserId = actorUserId,
            Comments = comments,
            Timestamp = now
        });

        ticket.Status = TicketStatus.InReview;
        ticket.UpdatedAt = now;

        AddAuditEntry(ticket, actor, "ClarificationResponded",
            $"Requester responded to clarification at stage '{currentStage?.StageName}'.{(comments != null ? $" Response: {comments}" : "")}");

        await _ticketRepository.UpdateAsync(ticket);

        return (await _ticketService.GetTicketByIdAsync(ticket.Id))!;
    }

    public async Task<TicketDetailResponse> CancelAsync(Guid ticketId, Guid actorUserId, string? reason = null)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId)
            ?? throw new ArgumentException($"Ticket '{ticketId}' not found.");

        if (ticket.Status != TicketStatus.Submitted)
            throw new InvalidOperationException("Tickets can only be cancelled when in 'Submitted' status.");

        var actor = await _userRepository.GetByIdAsync(actorUserId)
            ?? throw new ArgumentException("Actor user not found.");

        var now = DateTime.UtcNow;

        ticket.StageLogs.Add(new StageLog
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            StageOrder = ticket.CurrentStageOrder,
            StageName = "N/A",
            Action = StageAction.Cancel,
            ActorUserId = actorUserId,
            Comments = reason,
            Timestamp = now
        });

        ticket.Status = TicketStatus.Cancelled;
        ticket.CancellationReason = reason;
        ticket.UpdatedAt = now;

        AddAuditEntry(ticket, actor, "TicketCancelled",
            $"Ticket cancelled.{(reason != null ? $" Reason: {reason}" : "")}");

        await _ticketRepository.UpdateAsync(ticket);

        return (await _ticketService.GetTicketByIdAsync(ticket.Id))!;
    }

    public async Task<TicketDetailResponse> ReassignAsync(Guid ticketId, Guid actorUserId, Guid newUserId, string? reason = null)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId)
            ?? throw new ArgumentException($"Ticket '{ticketId}' not found.");

        if (ticket.Status == TicketStatus.Completed || ticket.Status == TicketStatus.Rejected || ticket.Status == TicketStatus.Cancelled)
            throw new InvalidOperationException($"Cannot reassign ticket in status '{ticket.Status}'.");

        var actor = await _userRepository.GetByIdAsync(actorUserId)
            ?? throw new ArgumentException("Actor user not found.");

        var newUser = await _userRepository.GetByIdAsync(newUserId)
            ?? throw new ArgumentException($"Target user '{newUserId}' not found.");

        var workflow = await _workflowRepository.GetActiveDefinitionAsync(
            ticket.ProductCode, ticket.TaskType, ticket.ProvisioningPath);

        var currentStage = workflow?.Stages.FirstOrDefault(s => s.StageOrder == ticket.CurrentStageOrder);
        var now = DateTime.UtcNow;

        ticket.StageLogs.Add(new StageLog
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            StageOrder = ticket.CurrentStageOrder,
            StageName = currentStage?.StageName ?? "N/A",
            Action = StageAction.Reassign,
            ActorUserId = actorUserId,
            Comments = reason,
            ReassignedToUserId = newUserId,
            Timestamp = now
        });

        ticket.AssignedToUserId = newUserId;
        ticket.UpdatedAt = now;

        AddAuditEntry(ticket, actor, "TicketReassigned",
            $"Reassigned from '{actor.FullName}' to '{newUser.FullName}'.{(reason != null ? $" Reason: {reason}" : "")}");

        await _ticketRepository.UpdateAsync(ticket);

        return (await _ticketService.GetTicketByIdAsync(ticket.Id))!;
    }

    private async Task AdvancePartnerLifecycleAsync(Ticket ticket)
    {
        if (ticket.TaskType == TaskType.T01 && ticket.PartnerProduct != null)
        {
            ticket.PartnerProduct.LifecycleState = LifecycleState.Agreed;
            ticket.PartnerProduct.StateChangedAt = DateTime.UtcNow;
        }
    }

    private static void AddAuditEntry(Ticket ticket, User actor, string actionType, string? details)
    {
        ticket.AuditEntries.Add(new AuditEntry
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            ActorUserId = actor.Id,
            ActorName = actor.FullName,
            ActorRole = actor.Role.ToString(),
            ActionType = actionType,
            Details = details,
            TimestampUtc = DateTime.UtcNow
        });
    }
}
```

### Step 9.3 — Verify build and commit

- [ ] Build and commit:

```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
git add -A
git commit -m "feat(E1-1.8): add WorkflowEngine — advance, reject, clarification, cancel, reassign"
```

---

## Task 10: Error Handling Middleware (Story 1.12)

### Step 10.1 — Create global exception handler middleware

- [ ] Create file `src/Tixora.API/Middleware/ExceptionHandlingMiddleware.cs`:

```csharp
using System.Net;
using System.Text.Json;

namespace Tixora.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
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
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error: {Message}", ex.Message);
            await WriteErrorResponseAsync(context, HttpStatusCode.BadRequest, "Validation failed", ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Operation error: {Message}", ex.Message);
            await WriteErrorResponseAsync(context, HttpStatusCode.BadRequest, "Operation failed", ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized: {Message}", ex.Message);
            await WriteErrorResponseAsync(context, HttpStatusCode.Forbidden, "Forbidden", ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Not found: {Message}", ex.Message);
            await WriteErrorResponseAsync(context, HttpStatusCode.NotFound, "Not found", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await WriteErrorResponseAsync(context, HttpStatusCode.InternalServerError, "Server error", "An unexpected error occurred.");
        }
    }

    private static async Task WriteErrorResponseAsync(HttpContext context, HttpStatusCode statusCode, string error, string? details)
    {
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var response = new { error, details };
        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
```

### Step 10.2 — Verify build and commit

- [ ] Build and commit:

```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
git add -A
git commit -m "feat(E1-1.12): add global exception handling middleware"
```

---

## Task 11: DI Wiring + Program.cs (Story 1.1 completion)

### Step 11.1 — Create InfrastructureServiceRegistration

- [ ] Create file `src/Tixora.Infrastructure/DependencyInjection.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Tixora.Application.Interfaces;
using Tixora.Domain.Interfaces;
using Tixora.Infrastructure.Auth;
using Tixora.Infrastructure.Persistence;
using Tixora.Infrastructure.Persistence.Repositories;

namespace Tixora.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<TixoraDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(TixoraDbContext).Assembly.FullName)));

        services.AddScoped<ITicketRepository, TicketRepository>();
        services.AddScoped<IPartnerRepository, PartnerRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IWorkflowRepository, WorkflowRepository>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

        return services;
    }
}
```

### Step 11.2 — Create ApplicationServiceRegistration

- [ ] Create file `src/Tixora.Application/DependencyInjection.cs`:

```csharp
using Microsoft.Extensions.DependencyInjection;
using Tixora.Application.Interfaces;
using Tixora.Application.Services;

namespace Tixora.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITicketService, TicketService>();
        services.AddScoped<IWorkflowEngine, WorkflowEngine>();
        services.AddScoped<ProductService>();
        services.AddScoped<PartnerService>();

        return services;
    }
}
```

### Step 11.3 — Wire up Program.cs

- [ ] Replace file `src/Tixora.API/Program.cs` with:

```csharp
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Tixora.API.Middleware;
using Tixora.Application;
using Tixora.Infrastructure;
using Tixora.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Clean Architecture DI
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT key not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "Tixora",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "TixoraApp",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

// CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TixoraDbContext>();
    await context.Database.MigrateAsync();
    await SeedData.InitializeAsync(context);
}

// Middleware pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
```

### Step 11.4 — Verify build

- [ ] Build:

```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
```

### Step 11.5 — Create initial EF migration

- [ ] Run migration command:

```bash
cd C:/Claude/Tixora
dotnet ef migrations add InitialCreate --project src/Tixora.Infrastructure --startup-project src/Tixora.API
```

### Step 11.6 — Commit

- [ ] Commit DI wiring and migration:

```bash
cd C:/Claude/Tixora
git add -A
git commit -m "feat(E1-1.1): wire DI, Program.cs, JWT auth, CORS, initial EF migration"
```

---

## Task 12: Smoke Test — Run the API (Story 1.1 validation)

### Step 12.1 — Update database and run

- [ ] Apply migration and run the API:

```bash
cd C:/Claude/Tixora
dotnet ef database update --project src/Tixora.Infrastructure --startup-project src/Tixora.API
dotnet run --project src/Tixora.API
```

### Step 12.2 — Test endpoints manually (optional sanity check)

- [ ] Test login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"requester@tixora.local","password":"Pass123!"}'
```

- [ ] Test products (using token from login):

```bash
curl http://localhost:5000/api/products \
  -H "Authorization: Bearer <TOKEN>"
```

### Step 12.3 — Commit (if any fixes were needed)

- [ ] Commit any fixes:

```bash
cd C:/Claude/Tixora
git add -A
git commit -m "fix(E1): smoke test fixes"
```

---

## Task 13: Automated Tests (Story 1.13)

### Step 13.1 — Create test project

- [ ] Scaffold the test project:

```bash
cd C:/Claude/Tixora

# Create test project
dotnet new xunit -n Tixora.Tests -o tests/Tixora.Tests --framework net8.0

# Add to solution
dotnet sln src/Tixora.sln add tests/Tixora.Tests/Tixora.Tests.csproj

# Add references
dotnet add tests/Tixora.Tests/Tixora.Tests.csproj reference src/Tixora.Domain/Tixora.Domain.csproj
dotnet add tests/Tixora.Tests/Tixora.Tests.csproj reference src/Tixora.Application/Tixora.Application.csproj
dotnet add tests/Tixora.Tests/Tixora.Tests.csproj reference src/Tixora.Infrastructure/Tixora.Infrastructure.csproj
dotnet add tests/Tixora.Tests/Tixora.Tests.csproj reference src/Tixora.API/Tixora.API.csproj

# Add test packages
dotnet add tests/Tixora.Tests/Tixora.Tests.csproj package Moq --version 4.20.72
dotnet add tests/Tixora.Tests/Tixora.Tests.csproj package Microsoft.AspNetCore.Mvc.Testing --version 8.0.11
dotnet add tests/Tixora.Tests/Tixora.Tests.csproj package Microsoft.EntityFrameworkCore.InMemory --version 8.0.11

# Remove default test file
rm -f tests/Tixora.Tests/UnitTest1.cs
```

### Step 13.2 — Create TicketId generation domain test

- [ ] Create file `tests/Tixora.Tests/Domain/TicketIdGenerationTests.cs`:

```csharp
using Tixora.Domain.Enums;

namespace Tixora.Tests.Domain;

public class TicketIdGenerationTests
{
    [Fact]
    public void TicketId_Format_IsCorrect()
    {
        var productCode = ProductCode.RBT;
        var taskType = TaskType.T01;
        var date = new DateTime(2026, 4, 1);
        var seq = 1;

        var ticketId = $"SPM-{productCode}-{taskType}-{date:yyyyMMdd}-{seq:D4}";

        Assert.Equal("SPM-RBT-T01-20260401-0001", ticketId);
    }

    [Fact]
    public void TicketId_SequenceFormatting_PadsCorrectly()
    {
        var productCode = ProductCode.WTQ;
        var taskType = TaskType.T04;
        var date = new DateTime(2026, 12, 25);

        for (int seq = 1; seq <= 3; seq++)
        {
            var ticketId = $"SPM-{productCode}-{taskType}-{date:yyyyMMdd}-{seq:D4}";
            Assert.StartsWith("SPM-WTQ-T04-20261225-", ticketId);
        }

        var id1 = $"SPM-{productCode}-{taskType}-{date:yyyyMMdd}-{1:D4}";
        var id99 = $"SPM-{productCode}-{taskType}-{date:yyyyMMdd}-{99:D4}";
        var id9999 = $"SPM-{productCode}-{taskType}-{date:yyyyMMdd}-{9999:D4}";

        Assert.Equal("SPM-WTQ-T04-20261225-0001", id1);
        Assert.Equal("SPM-WTQ-T04-20261225-0099", id99);
        Assert.Equal("SPM-WTQ-T04-20261225-9999", id9999);
    }

    [Theory]
    [InlineData(ProductCode.RBT, TaskType.T01, "SPM-RBT-T01-")]
    [InlineData(ProductCode.RHN, TaskType.T02, "SPM-RHN-T02-")]
    [InlineData(ProductCode.WTQ, TaskType.T03, "SPM-WTQ-T03-")]
    [InlineData(ProductCode.MLM, TaskType.T04, "SPM-MLM-T04-")]
    public void TicketId_AllProducts_GeneratesCorrectPrefix(ProductCode product, TaskType task, string expectedPrefix)
    {
        var date = new DateTime(2026, 4, 1);
        var ticketId = $"SPM-{product}-{task}-{date:yyyyMMdd}-{1:D4}";

        Assert.StartsWith(expectedPrefix, ticketId);
    }
}
```

### Step 13.3 — Create WorkflowEngine unit tests

- [ ] Create file `tests/Tixora.Tests/Application/WorkflowEngineTests.cs`:

```csharp
using Moq;
using Tixora.Application.DTOs;
using Tixora.Application.Interfaces;
using Tixora.Application.Services;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Domain.Interfaces;

namespace Tixora.Tests.Application;

public class WorkflowEngineTests
{
    private readonly Mock<ITicketRepository> _ticketRepoMock;
    private readonly Mock<IWorkflowRepository> _workflowRepoMock;
    private readonly Mock<IUserRepository> _userRepoMock;
    private readonly Mock<ITicketService> _ticketServiceMock;
    private readonly WorkflowEngine _engine;

    private readonly User _reviewer;
    private readonly User _approver;
    private readonly User _requester;
    private readonly WorkflowDefinition _t01Workflow;

    public WorkflowEngineTests()
    {
        _ticketRepoMock = new Mock<ITicketRepository>();
        _workflowRepoMock = new Mock<IWorkflowRepository>();
        _userRepoMock = new Mock<IUserRepository>();
        _ticketServiceMock = new Mock<ITicketService>();

        _engine = new WorkflowEngine(
            _ticketRepoMock.Object,
            _workflowRepoMock.Object,
            _userRepoMock.Object,
            _ticketServiceMock.Object);

        _requester = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Test Requester",
            Email = "requester@tixora.local",
            Role = UserRole.Requester,
            IsActive = true
        };

        _reviewer = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Test Reviewer",
            Email = "reviewer@tixora.local",
            Role = UserRole.Reviewer,
            IsActive = true
        };

        _approver = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Test Approver",
            Email = "approver@tixora.local",
            Role = UserRole.Approver,
            IsActive = true
        };

        var wfId = Guid.NewGuid();
        _t01Workflow = new WorkflowDefinition
        {
            Id = wfId,
            ProductCode = ProductCode.RBT,
            TaskType = TaskType.T01,
            Version = 1,
            IsActive = true,
            Stages = new List<StageDefinition>
            {
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfId, StageOrder = 1, StageName = "Legal Review", StageType = StageType.Review, AssignedRole = UserRole.Reviewer, SlaBusinessHours = 16 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfId, StageOrder = 2, StageName = "Product Review", StageType = StageType.Review, AssignedRole = UserRole.Approver, SlaBusinessHours = 16 },
                new() { Id = Guid.NewGuid(), WorkflowDefinitionId = wfId, StageOrder = 3, StageName = "EA Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.Approver, SlaBusinessHours = 16 }
            }
        };
    }

    private Ticket CreateTestTicket(TicketStatus status = TicketStatus.InReview, int stageOrder = 1)
    {
        return new Ticket
        {
            Id = Guid.NewGuid(),
            TicketId = "SPM-RBT-T01-20260401-0001",
            PartnerProductId = Guid.NewGuid(),
            TaskType = TaskType.T01,
            ProductCode = ProductCode.RBT,
            Status = status,
            CurrentStageOrder = stageOrder,
            FormData = "{}",
            CreatedByUserId = _requester.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            PartnerProduct = new PartnerProduct
            {
                Id = Guid.NewGuid(),
                ProductCode = ProductCode.RBT,
                LifecycleState = LifecycleState.None,
                StateChangedAt = DateTime.UtcNow,
                Partner = new Partner { Name = "Test Partner" },
                Product = new Product { Code = ProductCode.RBT, Name = "Rabet" }
            },
            StageLogs = new List<StageLog>(),
            AuditEntries = new List<AuditEntry>()
        };
    }

    private void SetupMocks(Ticket ticket, User actor)
    {
        _ticketRepoMock.Setup(r => r.GetByIdAsync(ticket.Id)).ReturnsAsync(ticket);
        _userRepoMock.Setup(r => r.GetByIdAsync(actor.Id)).ReturnsAsync(actor);
        _workflowRepoMock.Setup(r => r.GetActiveDefinitionAsync(ProductCode.RBT, TaskType.T01, null)).ReturnsAsync(_t01Workflow);
        _ticketRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Ticket>())).Returns(Task.CompletedTask);
        _ticketServiceMock.Setup(s => s.GetTicketByIdAsync(ticket.Id)).ReturnsAsync(new TicketDetailResponse
        {
            Id = ticket.Id,
            TicketId = ticket.TicketId,
            Status = ticket.Status.ToString()
        });
    }

    [Fact]
    public async Task Advance_FromStage1_MovesToStage2()
    {
        var ticket = CreateTestTicket(TicketStatus.InReview, 1);
        SetupMocks(ticket, _reviewer);

        await _engine.AdvanceAsync(ticket.Id, _reviewer.Id, "Looks good");

        Assert.Equal(2, ticket.CurrentStageOrder);
        Assert.Equal(TicketStatus.InReview, ticket.Status);
        Assert.Null(ticket.AssignedToUserId);
        _ticketRepoMock.Verify(r => r.UpdateAsync(ticket), Times.Once);
    }

    [Fact]
    public async Task Advance_FromStage2_MovesToStage3()
    {
        var ticket = CreateTestTicket(TicketStatus.InReview, 2);
        SetupMocks(ticket, _approver);

        await _engine.AdvanceAsync(ticket.Id, _approver.Id, "Approved");

        Assert.Equal(3, ticket.CurrentStageOrder);
        Assert.Equal(TicketStatus.InReview, ticket.Status);
        _ticketRepoMock.Verify(r => r.UpdateAsync(ticket), Times.Once);
    }

    [Fact]
    public async Task Advance_FromFinalStage_CompletesTicket()
    {
        var ticket = CreateTestTicket(TicketStatus.InReview, 3);
        SetupMocks(ticket, _approver);

        await _engine.AdvanceAsync(ticket.Id, _approver.Id, "Final approval");

        Assert.Equal(TicketStatus.Completed, ticket.Status);
        Assert.Equal(LifecycleState.Agreed, ticket.PartnerProduct.LifecycleState);
        _ticketRepoMock.Verify(r => r.UpdateAsync(ticket), Times.Once);
    }

    [Fact]
    public async Task Advance_FullHappyPath_ThreeStages()
    {
        var ticket = CreateTestTicket(TicketStatus.InReview, 1);

        _ticketRepoMock.Setup(r => r.GetByIdAsync(ticket.Id)).ReturnsAsync(ticket);
        _userRepoMock.Setup(r => r.GetByIdAsync(_reviewer.Id)).ReturnsAsync(_reviewer);
        _userRepoMock.Setup(r => r.GetByIdAsync(_approver.Id)).ReturnsAsync(_approver);
        _workflowRepoMock.Setup(r => r.GetActiveDefinitionAsync(ProductCode.RBT, TaskType.T01, null)).ReturnsAsync(_t01Workflow);
        _ticketRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Ticket>())).Returns(Task.CompletedTask);
        _ticketServiceMock.Setup(s => s.GetTicketByIdAsync(ticket.Id)).ReturnsAsync(new TicketDetailResponse { Id = ticket.Id });

        // Stage 1: Reviewer approves
        await _engine.AdvanceAsync(ticket.Id, _reviewer.Id, "Legal ok");
        Assert.Equal(2, ticket.CurrentStageOrder);

        // Stage 2: Approver approves
        await _engine.AdvanceAsync(ticket.Id, _approver.Id, "Product ok");
        Assert.Equal(3, ticket.CurrentStageOrder);

        // Stage 3: Approver final sign-off
        await _engine.AdvanceAsync(ticket.Id, _approver.Id, "EA approved");
        Assert.Equal(TicketStatus.Completed, ticket.Status);
        Assert.Equal(LifecycleState.Agreed, ticket.PartnerProduct.LifecycleState);

        // Verify 3 StageLogs were created
        Assert.Equal(3, ticket.StageLogs.Count(sl => sl.Action == StageAction.Approve));
    }

    [Fact]
    public async Task Reject_SetsStatusToRejected()
    {
        var ticket = CreateTestTicket(TicketStatus.InReview, 1);
        SetupMocks(ticket, _reviewer);

        await _engine.RejectAsync(ticket.Id, _reviewer.Id, "Incomplete docs");

        Assert.Equal(TicketStatus.Rejected, ticket.Status);
        Assert.Single(ticket.StageLogs);
        Assert.Equal(StageAction.Reject, ticket.StageLogs.First().Action);
        _ticketRepoMock.Verify(r => r.UpdateAsync(ticket), Times.Once);
    }

    [Fact]
    public async Task Reject_WhenNotInReview_ThrowsException()
    {
        var ticket = CreateTestTicket(TicketStatus.Submitted, 0);
        SetupMocks(ticket, _reviewer);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.RejectAsync(ticket.Id, _reviewer.Id, "Cannot reject"));
    }

    [Fact]
    public async Task ReturnForClarification_SetsStatusToPendingRequesterAction()
    {
        var ticket = CreateTestTicket(TicketStatus.InReview, 1);
        SetupMocks(ticket, _reviewer);

        await _engine.ReturnForClarificationAsync(ticket.Id, _reviewer.Id, "Need more info");

        Assert.Equal(TicketStatus.PendingRequesterAction, ticket.Status);
        Assert.Equal(1, ticket.CurrentStageOrder); // stays on same stage
        Assert.Single(ticket.StageLogs);
        Assert.Equal(StageAction.ReturnForClarification, ticket.StageLogs.First().Action);
    }

    [Fact]
    public async Task RespondToClarification_ReturnsToInReview()
    {
        var ticket = CreateTestTicket(TicketStatus.PendingRequesterAction, 1);
        SetupMocks(ticket, _requester);

        await _engine.RespondToClarificationAsync(ticket.Id, _requester.Id, "Here is the info");

        Assert.Equal(TicketStatus.InReview, ticket.Status);
        Assert.Equal(1, ticket.CurrentStageOrder); // same stage
        Assert.Single(ticket.StageLogs);
        Assert.Equal(StageAction.RespondToClarification, ticket.StageLogs.First().Action);
    }

    [Fact]
    public async Task RespondToClarification_WhenNotPending_ThrowsException()
    {
        var ticket = CreateTestTicket(TicketStatus.InReview, 1);
        SetupMocks(ticket, _requester);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.RespondToClarificationAsync(ticket.Id, _requester.Id, "response"));
    }

    [Fact]
    public async Task ClarificationRoundTrip_PreservesStageOrder()
    {
        var ticket = CreateTestTicket(TicketStatus.InReview, 2);

        _ticketRepoMock.Setup(r => r.GetByIdAsync(ticket.Id)).ReturnsAsync(ticket);
        _userRepoMock.Setup(r => r.GetByIdAsync(_approver.Id)).ReturnsAsync(_approver);
        _userRepoMock.Setup(r => r.GetByIdAsync(_requester.Id)).ReturnsAsync(_requester);
        _workflowRepoMock.Setup(r => r.GetActiveDefinitionAsync(ProductCode.RBT, TaskType.T01, null)).ReturnsAsync(_t01Workflow);
        _ticketRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Ticket>())).Returns(Task.CompletedTask);
        _ticketServiceMock.Setup(s => s.GetTicketByIdAsync(ticket.Id)).ReturnsAsync(new TicketDetailResponse { Id = ticket.Id });

        // Return for clarification
        await _engine.ReturnForClarificationAsync(ticket.Id, _approver.Id, "Need docs");
        Assert.Equal(TicketStatus.PendingRequesterAction, ticket.Status);
        Assert.Equal(2, ticket.CurrentStageOrder);

        // Respond
        await _engine.RespondToClarificationAsync(ticket.Id, _requester.Id, "Docs attached");
        Assert.Equal(TicketStatus.InReview, ticket.Status);
        Assert.Equal(2, ticket.CurrentStageOrder);
    }

    [Fact]
    public async Task Cancel_WhenSubmitted_Succeeds()
    {
        var ticket = CreateTestTicket(TicketStatus.Submitted, 0);
        SetupMocks(ticket, _requester);

        await _engine.CancelAsync(ticket.Id, _requester.Id, "No longer needed");

        Assert.Equal(TicketStatus.Cancelled, ticket.Status);
        Assert.Equal("No longer needed", ticket.CancellationReason);
    }

    [Fact]
    public async Task Cancel_WhenInReview_ThrowsException()
    {
        var ticket = CreateTestTicket(TicketStatus.InReview, 1);
        SetupMocks(ticket, _requester);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CancelAsync(ticket.Id, _requester.Id, "Too late"));
    }

    [Fact]
    public async Task Reassign_UpdatesAssignedUser()
    {
        var ticket = CreateTestTicket(TicketStatus.InReview, 1);
        var newReviewer = new User
        {
            Id = Guid.NewGuid(),
            FullName = "New Reviewer",
            Email = "new@tixora.local",
            Role = UserRole.Reviewer,
            IsActive = true
        };

        SetupMocks(ticket, _reviewer);
        _userRepoMock.Setup(r => r.GetByIdAsync(newReviewer.Id)).ReturnsAsync(newReviewer);

        await _engine.ReassignAsync(ticket.Id, _reviewer.Id, newReviewer.Id, "Out of office");

        Assert.Equal(newReviewer.Id, ticket.AssignedToUserId);
        Assert.Single(ticket.StageLogs);
        Assert.Equal(StageAction.Reassign, ticket.StageLogs.First().Action);
        Assert.Equal(newReviewer.Id, ticket.StageLogs.First().ReassignedToUserId);
    }

    [Fact]
    public async Task Reassign_WhenCompleted_ThrowsException()
    {
        var ticket = CreateTestTicket(TicketStatus.Completed, 3);
        SetupMocks(ticket, _reviewer);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.ReassignAsync(ticket.Id, _reviewer.Id, Guid.NewGuid(), "Too late"));
    }
}
```

### Step 13.4 — Create API Integration Test

- [ ] Create file `tests/Tixora.Tests/Integration/ApiIntegrationTests.cs`:

```csharp
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Tixora.Application.DTOs;
using Tixora.Infrastructure.Persistence;

namespace Tixora.Tests.Integration;

public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public ApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext registration
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<TixoraDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                // Add InMemory database
                services.AddDbContext<TixoraDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TixoraTestDb_" + Guid.NewGuid());
                });

                // Seed the in-memory database
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<TixoraDbContext>();
                context.Database.EnsureCreated();
                SeedData.InitializeAsync(context).GetAwaiter().GetResult();
            });
        });

        _client = _factory.CreateClient();
    }

    private async Task<string> GetAuthTokenAsync()
    {
        var loginRequest = new LoginRequest
        {
            Email = "requester@tixora.local",
            Password = "Pass123!"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        return json.RootElement.GetProperty("token").GetString()!;
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        var loginRequest = new LoginRequest
        {
            Email = "requester@tixora.local",
            Password = "Pass123!"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.True(json.RootElement.TryGetProperty("token", out _));
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_Returns401()
    {
        var loginRequest = new LoginRequest
        {
            Email = "requester@tixora.local",
            Password = "WrongPassword"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetProducts_WithAuth_ReturnsProducts()
    {
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/products");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var products = JsonSerializer.Deserialize<JsonElement>(content);
        Assert.Equal(4, products.GetArrayLength());
    }

    [Fact]
    public async Task GetProducts_WithoutAuth_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.GetAsync("/api/products");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetPartners_WithAuth_ReturnsPartners()
    {
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/partners");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var partners = JsonSerializer.Deserialize<JsonElement>(content);
        Assert.Equal(3, partners.GetArrayLength());
    }

    [Fact]
    public async Task GetProductTasks_ReturnsTaskList()
    {
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/products/RBT/tasks");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var tasks = JsonSerializer.Deserialize<JsonElement>(content);
        Assert.Equal(5, tasks.GetArrayLength());
    }

    [Fact]
    public async Task Me_WithAuth_ReturnsCurrentUser()
    {
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        Assert.Equal("requester@tixora.local", json.RootElement.GetProperty("email").GetString());
        Assert.Equal("Requester", json.RootElement.GetProperty("role").GetString());
    }
}
```

### Step 13.5 — Run tests

- [ ] Run all tests:

```bash
cd C:/Claude/Tixora
dotnet test tests/Tixora.Tests/Tixora.Tests.csproj --verbosity normal
```

### Step 13.6 — Commit

- [ ] Commit tests:

```bash
cd C:/Claude/Tixora
git add -A
git commit -m "test(E1-1.13): add domain, workflow engine, and API integration tests"
```

---

## Task 14: Final Verification

### Step 14.1 — Full build and test

- [ ] Run complete build and test suite:

```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
dotnet test --verbosity normal
```

### Step 14.2 — Final commit

- [ ] Tag the Epic 1 completion:

```bash
cd C:/Claude/Tixora
git add -A
git commit -m "chore(E1): Epic 1 complete — bootstrap, domain model, EF Core, auth, workflow engine, tests"
```

---

## Summary of Files Created

### Domain Layer (`src/Tixora.Domain/`)
- `Enums/` — 12 enum files (ProductCode, TaskType, TicketStatus, etc.)
- `Entities/` — 9 entity files (Product, Partner, Ticket, User, etc.)
- `Interfaces/` — 4 repository interface files

### Application Layer (`src/Tixora.Application/`)
- `DTOs/` — 10 DTO files (LoginRequest, TicketDetailResponse, etc.)
- `Interfaces/` — 3 service interface files (IAuthService, ITicketService, IWorkflowEngine)
- `Services/` — 4 service files (AuthService, TicketService, WorkflowEngine, ProductService, PartnerService)
- `DependencyInjection.cs`

### Infrastructure Layer (`src/Tixora.Infrastructure/`)
- `Persistence/TixoraDbContext.cs`
- `Persistence/SeedData.cs`
- `Persistence/Configurations/` — 9 entity configuration files
- `Persistence/Repositories/` — 4 repository implementation files
- `Auth/JwtTokenGenerator.cs`
- `DependencyInjection.cs`

### API Layer (`src/Tixora.API/`)
- `Controllers/` — 4 controller files (Auth, Products, Partners, Tickets)
- `Middleware/ExceptionHandlingMiddleware.cs`
- `Program.cs`
- `appsettings.json`, `appsettings.Development.json`

### Tests (`tests/Tixora.Tests/`)
- `Domain/TicketIdGenerationTests.cs`
- `Application/WorkflowEngineTests.cs`
- `Integration/ApiIntegrationTests.cs`

### API Endpoints Delivered
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | No | Authenticate and get JWT |
| GET | `/api/auth/me` | Yes | Current user info |
| GET | `/api/products` | Yes | List all products |
| GET | `/api/products/{code}/tasks` | Yes | Task types for product |
| GET | `/api/partners` | Yes | List all partners |
| GET | `/api/partners/{id}` | Yes | Partner profile with lifecycle |
| POST | `/api/tickets` | Yes | Create ticket |
| GET | `/api/tickets/{id}` | Yes | Ticket detail |
| PUT | `/api/tickets/{id}/advance` | Yes | Approve & advance stage |
| PUT | `/api/tickets/{id}/reject` | Yes | Reject ticket |
| PUT | `/api/tickets/{id}/return` | Yes | Return for clarification |
| PUT | `/api/tickets/{id}/respond` | Yes | Respond to clarification |
| PUT | `/api/tickets/{id}/cancel` | Yes | Cancel (Submitted only) |
| PUT | `/api/tickets/{id}/reassign` | Yes | Reassign to another user |
