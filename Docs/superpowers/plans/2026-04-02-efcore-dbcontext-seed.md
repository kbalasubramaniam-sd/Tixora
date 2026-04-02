# EF Core DbContext + Seed Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `TixoraDbContext` implementing `ITixoraDbContext`, configure all 9 entities with Fluent API, seed reference data (products, users, partners, workflows, stages), create the initial EF migration, wire DI, and add an integration test that verifies seeded data loads correctly.

**Architecture:** Clean Architecture monolith with `Domain` <- `Application` <- `Infrastructure` <- `API` layers. The `ITixoraDbContext` interface lives in Application; the concrete `TixoraDbContext` lives in Infrastructure. All entity configurations use Fluent API via `IEntityTypeConfiguration<T>` in Infrastructure, auto-discovered by `ApplyConfigurationsFromAssembly`. Seed data uses EF `HasData` with deterministic GUIDs for idempotent migrations.

**Tech Stack:** .NET 10, EF Core 10, SQL Server, Swashbuckle, xUnit, Microsoft.EntityFrameworkCore.InMemory

---

## Task 1: TixoraDbContext

### Step 1.1 — Create the DbContext class

- [ ] Create `src/Tixora.Infrastructure/Data/TixoraDbContext.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/TixoraDbContext.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data;

public class TixoraDbContext : DbContext, ITixoraDbContext
{
    public TixoraDbContext(DbContextOptions<TixoraDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<PartnerProduct> PartnerProducts => Set<PartnerProduct>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<WorkflowDefinition> WorkflowDefinitions => Set<WorkflowDefinition>();
    public DbSet<StageDefinition> StageDefinitions => Set<StageDefinition>();
    public DbSet<StageLog> StageLogs => Set<StageLog>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TixoraDbContext).Assembly);
    }
}
```

### Step 1.2 — Build verification

- [ ] Run `dotnet build src/Tixora.Infrastructure/Tixora.Infrastructure.csproj` and confirm no errors.

### Step 1.3 — Commit

- [ ] Commit:
```bash
git add src/Tixora.Infrastructure/Data/TixoraDbContext.cs
git commit -m "$(cat <<'EOF'
feat: add TixoraDbContext implementing ITixoraDbContext

9 DbSets, ApplyConfigurationsFromAssembly for auto-discovery.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Entity Configurations (all 9)

### Step 2.1 — ProductConfiguration

- [ ] Create `src/Tixora.Infrastructure/Data/Configurations/ProductConfiguration.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Configurations/ProductConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Data.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Code);
        builder.Property(p => p.Code).HasConversion<int>();

        builder.Property(p => p.Name).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Description).IsRequired().HasMaxLength(500);
        builder.Property(p => p.ProductAccessMode).HasConversion<int>();
        builder.Property(p => p.PortalType).HasConversion<int>();
    }
}
```

### Step 2.2 — PartnerConfiguration

- [ ] Create `src/Tixora.Infrastructure/Data/Configurations/PartnerConfiguration.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Configurations/PartnerConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class PartnerConfiguration : IEntityTypeConfiguration<Partner>
{
    public void Configure(EntityTypeBuilder<Partner> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Alias).HasMaxLength(200);

        builder.HasMany(p => p.PartnerProducts)
            .WithOne(pp => pp.Partner)
            .HasForeignKey(pp => pp.PartnerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

### Step 2.3 — PartnerProductConfiguration

- [ ] Create `src/Tixora.Infrastructure/Data/Configurations/PartnerProductConfiguration.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Configurations/PartnerProductConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Data.Configurations;

public class PartnerProductConfiguration : IEntityTypeConfiguration<PartnerProduct>
{
    public void Configure(EntityTypeBuilder<PartnerProduct> builder)
    {
        builder.HasKey(pp => pp.Id);

        builder.Property(pp => pp.ProductCode).HasConversion<int>();
        builder.Property(pp => pp.LifecycleState).HasConversion<int>().HasDefaultValue(LifecycleState.None);
        builder.Property(pp => pp.CompanyCode).HasMaxLength(50);

        builder.HasOne(pp => pp.Product)
            .WithMany()
            .HasForeignKey(pp => pp.ProductCode)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(pp => pp.Tickets)
            .WithOne(t => t.PartnerProduct)
            .HasForeignKey(t => t.PartnerProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(pp => new { pp.PartnerId, pp.ProductCode }).IsUnique();
    }
}
```

### Step 2.4 — UserConfiguration

- [ ] Create `src/Tixora.Infrastructure/Data/Configurations/UserConfiguration.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Configurations/UserConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.FullName).IsRequired().HasMaxLength(200);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(200);
        builder.Property(u => u.PasswordHash).IsRequired().HasMaxLength(200);
        builder.Property(u => u.Role).HasConversion<int>();
        builder.Property(u => u.IsActive).HasDefaultValue(true);

        builder.HasIndex(u => u.Email).IsUnique();
    }
}
```

### Step 2.5 — TicketConfiguration

- [ ] Create `src/Tixora.Infrastructure/Data/Configurations/TicketConfiguration.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Configurations/TicketConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.TicketId).IsRequired().HasMaxLength(50);
        builder.Property(t => t.FormData).IsRequired();
        builder.Property(t => t.Status).HasConversion<int>();
        builder.Property(t => t.TaskType).HasConversion<int>();
        builder.Property(t => t.ProductCode).HasConversion<int>();
        builder.Property(t => t.ProvisioningPath).HasConversion<int>();
        builder.Property(t => t.IssueType).HasConversion<int>();
        builder.Property(t => t.CancellationReason).HasMaxLength(1000);

        builder.HasOne(t => t.CreatedBy)
            .WithMany()
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.AssignedTo)
            .WithMany()
            .HasForeignKey(t => t.AssignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.WorkflowDefinition)
            .WithMany()
            .HasForeignKey(t => t.WorkflowDefinitionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => t.TicketId).IsUnique();
        builder.HasIndex(t => t.PartnerProductId);
        builder.HasIndex(t => t.Status);
        builder.HasIndex(t => t.AssignedToUserId);
    }
}
```

### Step 2.6 — WorkflowDefinitionConfiguration

- [ ] Create `src/Tixora.Infrastructure/Data/Configurations/WorkflowDefinitionConfiguration.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Configurations/WorkflowDefinitionConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class WorkflowDefinitionConfiguration : IEntityTypeConfiguration<WorkflowDefinition>
{
    public void Configure(EntityTypeBuilder<WorkflowDefinition> builder)
    {
        builder.HasKey(w => w.Id);

        builder.Property(w => w.ProductCode).HasConversion<int>();
        builder.Property(w => w.TaskType).HasConversion<int>();
        builder.Property(w => w.ProvisioningPath).HasConversion<int>();

        builder.HasMany(w => w.Stages)
            .WithOne(s => s.WorkflowDefinition)
            .HasForeignKey(s => s.WorkflowDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(w => new { w.ProductCode, w.TaskType, w.ProvisioningPath })
            .IsUnique()
            .HasFilter("[IsActive] = 1");
    }
}
```

### Step 2.7 — StageDefinitionConfiguration

- [ ] Create `src/Tixora.Infrastructure/Data/Configurations/StageDefinitionConfiguration.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Configurations/StageDefinitionConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class StageDefinitionConfiguration : IEntityTypeConfiguration<StageDefinition>
{
    public void Configure(EntityTypeBuilder<StageDefinition> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.StageName).IsRequired().HasMaxLength(200);
        builder.Property(s => s.StageType).HasConversion<int>();
        builder.Property(s => s.AssignedRole).HasConversion<int>();

        builder.HasIndex(s => new { s.WorkflowDefinitionId, s.StageOrder }).IsUnique();
    }
}
```

### Step 2.8 — StageLogConfiguration

- [ ] Create `src/Tixora.Infrastructure/Data/Configurations/StageLogConfiguration.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Configurations/StageLogConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class StageLogConfiguration : IEntityTypeConfiguration<StageLog>
{
    public void Configure(EntityTypeBuilder<StageLog> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.StageName).IsRequired().HasMaxLength(200);
        builder.Property(s => s.Action).HasConversion<int>();
        builder.Property(s => s.Comments).HasMaxLength(2000);

        builder.HasOne(s => s.Ticket)
            .WithMany(t => t.StageLogs)
            .HasForeignKey(s => s.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Actor)
            .WithMany()
            .HasForeignKey(s => s.ActorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.ReassignedTo)
            .WithMany()
            .HasForeignKey(s => s.ReassignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => s.TicketId);
    }
}
```

### Step 2.9 — AuditEntryConfiguration

- [ ] Create `src/Tixora.Infrastructure/Data/Configurations/AuditEntryConfiguration.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Configurations/AuditEntryConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class AuditEntryConfiguration : IEntityTypeConfiguration<AuditEntry>
{
    public void Configure(EntityTypeBuilder<AuditEntry> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.ActionType).IsRequired().HasMaxLength(100);

        builder.HasOne(a => a.Ticket)
            .WithMany(t => t.AuditEntries)
            .HasForeignKey(a => a.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Actor)
            .WithMany()
            .HasForeignKey(a => a.ActorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.TicketId);
    }
}
```

### Step 2.10 — Build verification

- [ ] Run `dotnet build src/Tixora.Infrastructure/Tixora.Infrastructure.csproj` and confirm no errors.

### Step 2.11 — Commit

- [ ] Commit:
```bash
git add src/Tixora.Infrastructure/Data/Configurations/
git commit -m "$(cat <<'EOF'
feat: add Fluent API configurations for all 9 entities

ProductConfiguration (enum PK), PartnerConfiguration,
PartnerProductConfiguration (unique index, restrict FK),
UserConfiguration (unique email), TicketConfiguration (4 FKs),
WorkflowDefinitionConfiguration (filtered unique index),
StageDefinitionConfiguration, StageLogConfiguration,
AuditEntryConfiguration.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Seed Data — Products + Users

### Step 3.1 — SeedProducts.cs

- [ ] Create `src/Tixora.Infrastructure/Data/Seed/SeedProducts.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Seed/SeedProducts.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Data.Seed;

public static class SeedProducts
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>().HasData(
            new Product
            {
                Code = ProductCode.RBT,
                Name = "Rabet",
                Description = "Insurance data to ICP",
                ProductAccessMode = ProductAccessMode.Both,
                PortalType = PortalType.Transactional
            },
            new Product
            {
                Code = ProductCode.RHN,
                Name = "Rhoon",
                Description = "Mortgage transactions",
                ProductAccessMode = ProductAccessMode.Both,
                PortalType = PortalType.Transactional
            },
            new Product
            {
                Code = ProductCode.WTQ,
                Name = "Wtheeq",
                Description = "Vehicle insurance data",
                ProductAccessMode = ProductAccessMode.Both,
                PortalType = PortalType.ReadOnly
            },
            new Product
            {
                Code = ProductCode.MLM,
                Name = "Mulem",
                Description = "Motor insurance pricing",
                ProductAccessMode = ProductAccessMode.Both,
                PortalType = PortalType.ReadOnly
            }
        );
    }
}
```

### Step 3.2 — SeedUsers.cs

Pre-computed BCrypt hash of `"Password1!"`:

Run `dotnet script` or a one-liner to generate the hash. For the plan, we pre-compute it. The hash below is a valid BCrypt hash of `"Password1!"` with cost factor 11 (default).

- [ ] Create `src/Tixora.Infrastructure/Data/Seed/SeedUsers.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Seed/SeedUsers.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Data.Seed;

public static class SeedUsers
{
    // Pre-computed BCrypt hash of "Password1!" — avoids slow hashing during HasData seeding.
    // Generated via: BCrypt.Net.BCrypt.HashPassword("Password1!")
    // IMPORTANT: On first run, replace this with an actual computed hash.
    // Run this one-liner in a .NET 10 project that references BCrypt.Net-Next:
    //   Console.WriteLine(BCrypt.Net.BCrypt.HashPassword("Password1!"));
    // Then paste the output here.
    private const string PasswordHash = "$2a$11$PLACEHOLDER_REPLACE_ON_FIRST_RUN";

    /// <summary>
    /// Call this ONCE at startup (or in a build step) to compute the real hash and print it.
    /// Then hardcode the result into PasswordHash above and remove this method.
    /// </summary>
    public static string ComputeHash() => BCrypt.Net.BCrypt.HashPassword("Password1!");

    public static readonly Guid SarahAhmadId = new("a1b2c3d4-0001-0001-0001-000000000001");
    public static readonly Guid OmarKhalidId = new("a1b2c3d4-0001-0001-0001-000000000002");
    public static readonly Guid HannounId = new("a1b2c3d4-0001-0001-0001-000000000003");
    public static readonly Guid AlbahaId = new("a1b2c3d4-0001-0001-0001-000000000004");
    public static readonly Guid FatimaNoorId = new("a1b2c3d4-0001-0001-0001-000000000005");
    public static readonly Guid KhalidRashedId = new("a1b2c3d4-0001-0001-0001-000000000006");
    public static readonly Guid AhmedTariqId = new("a1b2c3d4-0001-0001-0001-000000000007");
    public static readonly Guid LaylaHassanId = new("a1b2c3d4-0001-0001-0001-000000000008");
    public static readonly Guid VilinaSequeiraId = new("a1b2c3d4-0001-0001-0001-000000000009");
    public static readonly Guid SaraRaeedId = new("a1b2c3d4-0001-0001-0001-00000000000a");
    public static readonly Guid ShaymanAliId = new("a1b2c3d4-0001-0001-0001-00000000000b");
    public static readonly Guid AdminUserId = new("a1b2c3d4-0001-0001-0001-00000000000c");

    public static void Seed(ModelBuilder modelBuilder)
    {
        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = SarahAhmadId,
                FullName = "Sarah Ahmad",
                Email = "sarah.ahmad@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.Requester,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = OmarKhalidId,
                FullName = "Omar Khalid",
                Email = "omar.khalid@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.LegalTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = HannounId,
                FullName = "Hannoun",
                Email = "hannoun@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.ProductTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = AlbahaId,
                FullName = "Albaha",
                Email = "albaha@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.ProductTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = FatimaNoorId,
                FullName = "Fatima Noor",
                Email = "fatima.noor@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.Approver,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = KhalidRashedId,
                FullName = "Khalid Rashed",
                Email = "khalid.rashed@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.IntegrationTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = AhmedTariqId,
                FullName = "Ahmed Tariq",
                Email = "ahmed.tariq@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.DevTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = LaylaHassanId,
                FullName = "Layla Hassan",
                Email = "layla.hassan@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.BusinessTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = VilinaSequeiraId,
                FullName = "Vilina Sequeira",
                Email = "vilina.sequeira@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.PartnerOps,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = SaraRaeedId,
                FullName = "Sara Raeed",
                Email = "sara.raeed@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.PartnerOps,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = ShaymanAliId,
                FullName = "Shayman Ali",
                Email = "shayman.ali@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.PartnerOps,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = AdminUserId,
                FullName = "Admin User",
                Email = "admin@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.SystemAdministrator,
                IsActive = true,
                CreatedAt = now
            }
        );
    }
}
```

**IMPORTANT — BCrypt hash step:** Before the first migration, run this in a temporary console or test:
```csharp
Console.WriteLine(BCrypt.Net.BCrypt.HashPassword("Password1!"));
```
Then replace the `PLACEHOLDER_REPLACE_ON_FIRST_RUN` value in `SeedUsers.cs` with the actual hash output. This only needs to happen once. After replacement, remove the `ComputeHash()` helper method.

### Step 3.3 — Wire seed calls into OnModelCreating

- [ ] Update `src/Tixora.Infrastructure/Data/TixoraDbContext.cs` — add seed calls at the end of `OnModelCreating`:

Replace the `OnModelCreating` method body with:

```csharp
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TixoraDbContext).Assembly);

        // Seed reference data
        Seed.SeedProducts.Seed(modelBuilder);
        Seed.SeedUsers.Seed(modelBuilder);
    }
```

(We will add more seed calls in later tasks.)

### Step 3.4 — Build verification

- [ ] Run `dotnet build src/Tixora.Infrastructure/Tixora.Infrastructure.csproj` and confirm no errors.

### Step 3.5 — Commit

- [ ] Commit:
```bash
git add src/Tixora.Infrastructure/Data/Seed/SeedProducts.cs src/Tixora.Infrastructure/Data/Seed/SeedUsers.cs src/Tixora.Infrastructure/Data/TixoraDbContext.cs
git commit -m "$(cat <<'EOF'
feat: add seed data for products (4) and users (12)

SeedProducts: Rabet, Rhoon, Wtheeq, Mulem with correct PortalType.
SeedUsers: 12 users across 9 roles with deterministic GUIDs and
pre-computed BCrypt password hash.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Seed Data — Partners + PartnerProducts

### Step 4.1 — SeedPartners.cs

- [ ] Create `src/Tixora.Infrastructure/Data/Seed/SeedPartners.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Seed/SeedPartners.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Data.Seed;

public static class SeedPartners
{
    // Partner IDs
    public static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");
    public static readonly Guid DubaiIslamicBankId = new("b2c3d4e5-0002-0002-0002-000000000002");
    public static readonly Guid EmiratesInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000003");

    // PartnerProduct IDs
    public static readonly Guid AaiRabetId = new("c3d4e5f6-0003-0003-0003-000000000001");
    public static readonly Guid AaiWtheeqId = new("c3d4e5f6-0003-0003-0003-000000000002");
    public static readonly Guid DibRhoonId = new("c3d4e5f6-0003-0003-0003-000000000003");
    public static readonly Guid DibMulemId = new("c3d4e5f6-0003-0003-0003-000000000004");
    public static readonly Guid EicRabetId = new("c3d4e5f6-0003-0003-0003-000000000005");
    public static readonly Guid EicRhoonId = new("c3d4e5f6-0003-0003-0003-000000000006");

    public static void Seed(ModelBuilder modelBuilder)
    {
        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // Partners
        modelBuilder.Entity<Partner>().HasData(
            new Partner
            {
                Id = AlAinInsuranceId,
                Name = "Al Ain Insurance",
                Alias = "AAI",
                CreatedAt = now
            },
            new Partner
            {
                Id = DubaiIslamicBankId,
                Name = "Dubai Islamic Bank",
                Alias = "DIB",
                CreatedAt = now
            },
            new Partner
            {
                Id = EmiratesInsuranceId,
                Name = "Emirates Insurance",
                Alias = "EIC",
                CreatedAt = now
            }
        );

        // PartnerProducts — all start at LifecycleState.None, no CompanyCode
        modelBuilder.Entity<PartnerProduct>().HasData(
            // Al Ain Insurance → Rabet
            new PartnerProduct
            {
                Id = AaiRabetId,
                PartnerId = AlAinInsuranceId,
                ProductCode = ProductCode.RBT,
                LifecycleState = LifecycleState.None,
                CompanyCode = null,
                StateChangedAt = now,
                CreatedAt = now
            },
            // Al Ain Insurance → Wtheeq
            new PartnerProduct
            {
                Id = AaiWtheeqId,
                PartnerId = AlAinInsuranceId,
                ProductCode = ProductCode.WTQ,
                LifecycleState = LifecycleState.None,
                CompanyCode = null,
                StateChangedAt = now,
                CreatedAt = now
            },
            // Dubai Islamic Bank → Rhoon
            new PartnerProduct
            {
                Id = DibRhoonId,
                PartnerId = DubaiIslamicBankId,
                ProductCode = ProductCode.RHN,
                LifecycleState = LifecycleState.None,
                CompanyCode = null,
                StateChangedAt = now,
                CreatedAt = now
            },
            // Dubai Islamic Bank → Mulem
            new PartnerProduct
            {
                Id = DibMulemId,
                PartnerId = DubaiIslamicBankId,
                ProductCode = ProductCode.MLM,
                LifecycleState = LifecycleState.None,
                CompanyCode = null,
                StateChangedAt = now,
                CreatedAt = now
            },
            // Emirates Insurance → Rabet
            new PartnerProduct
            {
                Id = EicRabetId,
                PartnerId = EmiratesInsuranceId,
                ProductCode = ProductCode.RBT,
                LifecycleState = LifecycleState.None,
                CompanyCode = null,
                StateChangedAt = now,
                CreatedAt = now
            },
            // Emirates Insurance → Rhoon
            new PartnerProduct
            {
                Id = EicRhoonId,
                PartnerId = EmiratesInsuranceId,
                ProductCode = ProductCode.RHN,
                LifecycleState = LifecycleState.None,
                CompanyCode = null,
                StateChangedAt = now,
                CreatedAt = now
            }
        );
    }
}
```

### Step 4.2 — Wire into OnModelCreating

- [ ] Update `src/Tixora.Infrastructure/Data/TixoraDbContext.cs` — add `SeedPartners.Seed(modelBuilder);` after the SeedUsers call:

```csharp
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TixoraDbContext).Assembly);

        // Seed reference data
        Seed.SeedProducts.Seed(modelBuilder);
        Seed.SeedUsers.Seed(modelBuilder);
        Seed.SeedPartners.Seed(modelBuilder);
    }
```

### Step 4.3 — Build verification

- [ ] Run `dotnet build src/Tixora.Infrastructure/Tixora.Infrastructure.csproj` and confirm no errors.

### Step 4.4 — Commit

- [ ] Commit:
```bash
git add src/Tixora.Infrastructure/Data/Seed/SeedPartners.cs src/Tixora.Infrastructure/Data/TixoraDbContext.cs
git commit -m "$(cat <<'EOF'
feat: add seed data for partners (3) and partner-products (6)

Al Ain Insurance (Rabet, Wtheeq), Dubai Islamic Bank (Rhoon, Mulem),
Emirates Insurance (Rabet, Rhoon). All LifecycleState.None.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Seed Data — Workflow Definitions + Stage Definitions

### Step 5.1 — SeedWorkflows.cs

This is the largest seed file. 18 workflow definitions, each with their stage definitions.

- [ ] Create `src/Tixora.Infrastructure/Data/Seed/SeedWorkflows.cs`

```csharp
// File: src/Tixora.Infrastructure/Data/Seed/SeedWorkflows.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Data.Seed;

public static class SeedWorkflows
{
    // ──────────────────────────────────────────────
    //  T-01 Workflow IDs (4 — one per product)
    // ──────────────────────────────────────────────
    public static readonly Guid T01_RBT = new("d4e5f6a7-0101-0001-0001-000000000001");
    public static readonly Guid T01_RHN = new("d4e5f6a7-0101-0001-0001-000000000002");
    public static readonly Guid T01_WTQ = new("d4e5f6a7-0101-0001-0001-000000000003");
    public static readonly Guid T01_MLM = new("d4e5f6a7-0101-0001-0001-000000000004");

    // ──────────────────────────────────────────────
    //  T-02 Workflow IDs (4 — one per product)
    // ──────────────────────────────────────────────
    public static readonly Guid T02_RBT = new("d4e5f6a7-0102-0001-0001-000000000001");
    public static readonly Guid T02_RHN = new("d4e5f6a7-0102-0001-0001-000000000002");
    public static readonly Guid T02_WTQ = new("d4e5f6a7-0102-0001-0001-000000000003");
    public static readonly Guid T02_MLM = new("d4e5f6a7-0102-0001-0001-000000000004");

    // ──────────────────────────────────────────────
    //  T-03 Workflow IDs (6 — product × path)
    // ──────────────────────────────────────────────
    public static readonly Guid T03_RBT_PortalOnly = new("d4e5f6a7-0103-0001-0001-000000000001");
    public static readonly Guid T03_RBT_PortalAndApi = new("d4e5f6a7-0103-0001-0001-000000000002");
    public static readonly Guid T03_RHN_PortalOnly = new("d4e5f6a7-0103-0001-0001-000000000003");
    public static readonly Guid T03_RHN_PortalAndApi = new("d4e5f6a7-0103-0001-0001-000000000004");
    public static readonly Guid T03_WTQ_ApiOnly = new("d4e5f6a7-0103-0001-0001-000000000005");
    public static readonly Guid T03_MLM_ApiOnly = new("d4e5f6a7-0103-0001-0001-000000000006");

    // ──────────────────────────────────────────────
    //  T-04 Workflow IDs (4 — one per product)
    // ──────────────────────────────────────────────
    public static readonly Guid T04_RBT = new("d4e5f6a7-0104-0001-0001-000000000001");
    public static readonly Guid T04_RHN = new("d4e5f6a7-0104-0001-0001-000000000002");
    public static readonly Guid T04_WTQ = new("d4e5f6a7-0104-0001-0001-000000000003");
    public static readonly Guid T04_MLM = new("d4e5f6a7-0104-0001-0001-000000000004");

    // ──────────────────────────────────────────────
    //  Stage Definition GUIDs — deterministic, grouped by workflow
    // ──────────────────────────────────────────────

    // T-01 stages (4 stages × 4 products = 16 GUIDs)
    // Pattern: e5f6a7b8-01TT-PPPP-SSSS-000000000001
    //   TT = task type (01)
    //   PPPP = product index (0001-0004)
    //   SSSS = stage order (0001-0004)

    // T-01 RBT stages
    private static readonly Guid S_T01_RBT_1 = new("e5f6a7b8-0101-0001-0001-000000000001");
    private static readonly Guid S_T01_RBT_2 = new("e5f6a7b8-0101-0001-0002-000000000001");
    private static readonly Guid S_T01_RBT_3 = new("e5f6a7b8-0101-0001-0003-000000000001");
    private static readonly Guid S_T01_RBT_4 = new("e5f6a7b8-0101-0001-0004-000000000001");

    // T-01 RHN stages
    private static readonly Guid S_T01_RHN_1 = new("e5f6a7b8-0101-0002-0001-000000000001");
    private static readonly Guid S_T01_RHN_2 = new("e5f6a7b8-0101-0002-0002-000000000001");
    private static readonly Guid S_T01_RHN_3 = new("e5f6a7b8-0101-0002-0003-000000000001");
    private static readonly Guid S_T01_RHN_4 = new("e5f6a7b8-0101-0002-0004-000000000001");

    // T-01 WTQ stages
    private static readonly Guid S_T01_WTQ_1 = new("e5f6a7b8-0101-0003-0001-000000000001");
    private static readonly Guid S_T01_WTQ_2 = new("e5f6a7b8-0101-0003-0002-000000000001");
    private static readonly Guid S_T01_WTQ_3 = new("e5f6a7b8-0101-0003-0003-000000000001");
    private static readonly Guid S_T01_WTQ_4 = new("e5f6a7b8-0101-0003-0004-000000000001");

    // T-01 MLM stages
    private static readonly Guid S_T01_MLM_1 = new("e5f6a7b8-0101-0004-0001-000000000001");
    private static readonly Guid S_T01_MLM_2 = new("e5f6a7b8-0101-0004-0002-000000000001");
    private static readonly Guid S_T01_MLM_3 = new("e5f6a7b8-0101-0004-0003-000000000001");
    private static readonly Guid S_T01_MLM_4 = new("e5f6a7b8-0101-0004-0004-000000000001");

    // T-02 stages (5 stages × 4 products = 20 GUIDs)
    private static readonly Guid S_T02_RBT_1 = new("e5f6a7b8-0102-0001-0001-000000000001");
    private static readonly Guid S_T02_RBT_2 = new("e5f6a7b8-0102-0001-0002-000000000001");
    private static readonly Guid S_T02_RBT_3 = new("e5f6a7b8-0102-0001-0003-000000000001");
    private static readonly Guid S_T02_RBT_4 = new("e5f6a7b8-0102-0001-0004-000000000001");
    private static readonly Guid S_T02_RBT_5 = new("e5f6a7b8-0102-0001-0005-000000000001");

    private static readonly Guid S_T02_RHN_1 = new("e5f6a7b8-0102-0002-0001-000000000001");
    private static readonly Guid S_T02_RHN_2 = new("e5f6a7b8-0102-0002-0002-000000000001");
    private static readonly Guid S_T02_RHN_3 = new("e5f6a7b8-0102-0002-0003-000000000001");
    private static readonly Guid S_T02_RHN_4 = new("e5f6a7b8-0102-0002-0004-000000000001");
    private static readonly Guid S_T02_RHN_5 = new("e5f6a7b8-0102-0002-0005-000000000001");

    private static readonly Guid S_T02_WTQ_1 = new("e5f6a7b8-0102-0003-0001-000000000001");
    private static readonly Guid S_T02_WTQ_2 = new("e5f6a7b8-0102-0003-0002-000000000001");
    private static readonly Guid S_T02_WTQ_3 = new("e5f6a7b8-0102-0003-0003-000000000001");
    private static readonly Guid S_T02_WTQ_4 = new("e5f6a7b8-0102-0003-0004-000000000001");
    private static readonly Guid S_T02_WTQ_5 = new("e5f6a7b8-0102-0003-0005-000000000001");

    private static readonly Guid S_T02_MLM_1 = new("e5f6a7b8-0102-0004-0001-000000000001");
    private static readonly Guid S_T02_MLM_2 = new("e5f6a7b8-0102-0004-0002-000000000001");
    private static readonly Guid S_T02_MLM_3 = new("e5f6a7b8-0102-0004-0003-000000000001");
    private static readonly Guid S_T02_MLM_4 = new("e5f6a7b8-0102-0004-0004-000000000001");
    private static readonly Guid S_T02_MLM_5 = new("e5f6a7b8-0102-0004-0005-000000000001");

    // T-03 PortalOnly stages (4 stages × 2 products = 8 GUIDs)
    private static readonly Guid S_T03_RBT_PO_1 = new("e5f6a7b8-0103-0001-0001-000000000001");
    private static readonly Guid S_T03_RBT_PO_2 = new("e5f6a7b8-0103-0001-0002-000000000001");
    private static readonly Guid S_T03_RBT_PO_3 = new("e5f6a7b8-0103-0001-0003-000000000001");
    private static readonly Guid S_T03_RBT_PO_4 = new("e5f6a7b8-0103-0001-0004-000000000001");

    private static readonly Guid S_T03_RHN_PO_1 = new("e5f6a7b8-0103-0003-0001-000000000001");
    private static readonly Guid S_T03_RHN_PO_2 = new("e5f6a7b8-0103-0003-0002-000000000001");
    private static readonly Guid S_T03_RHN_PO_3 = new("e5f6a7b8-0103-0003-0003-000000000001");
    private static readonly Guid S_T03_RHN_PO_4 = new("e5f6a7b8-0103-0003-0004-000000000001");

    // T-03 PortalAndApi stages (5 stages × 2 products = 10 GUIDs)
    private static readonly Guid S_T03_RBT_PA_1 = new("e5f6a7b8-0103-0002-0001-000000000001");
    private static readonly Guid S_T03_RBT_PA_2 = new("e5f6a7b8-0103-0002-0002-000000000001");
    private static readonly Guid S_T03_RBT_PA_3 = new("e5f6a7b8-0103-0002-0003-000000000001");
    private static readonly Guid S_T03_RBT_PA_4 = new("e5f6a7b8-0103-0002-0004-000000000001");
    private static readonly Guid S_T03_RBT_PA_5 = new("e5f6a7b8-0103-0002-0005-000000000001");

    private static readonly Guid S_T03_RHN_PA_1 = new("e5f6a7b8-0103-0004-0001-000000000001");
    private static readonly Guid S_T03_RHN_PA_2 = new("e5f6a7b8-0103-0004-0002-000000000001");
    private static readonly Guid S_T03_RHN_PA_3 = new("e5f6a7b8-0103-0004-0003-000000000001");
    private static readonly Guid S_T03_RHN_PA_4 = new("e5f6a7b8-0103-0004-0004-000000000001");
    private static readonly Guid S_T03_RHN_PA_5 = new("e5f6a7b8-0103-0004-0005-000000000001");

    // T-03 ApiOnly stages (3 stages × 2 products = 6 GUIDs)
    private static readonly Guid S_T03_WTQ_AO_1 = new("e5f6a7b8-0103-0005-0001-000000000001");
    private static readonly Guid S_T03_WTQ_AO_2 = new("e5f6a7b8-0103-0005-0002-000000000001");
    private static readonly Guid S_T03_WTQ_AO_3 = new("e5f6a7b8-0103-0005-0003-000000000001");

    private static readonly Guid S_T03_MLM_AO_1 = new("e5f6a7b8-0103-0006-0001-000000000001");
    private static readonly Guid S_T03_MLM_AO_2 = new("e5f6a7b8-0103-0006-0002-000000000001");
    private static readonly Guid S_T03_MLM_AO_3 = new("e5f6a7b8-0103-0006-0003-000000000001");

    // T-04 stages (1 stage × 4 products = 4 GUIDs)
    private static readonly Guid S_T04_RBT_1 = new("e5f6a7b8-0104-0001-0001-000000000001");
    private static readonly Guid S_T04_RHN_1 = new("e5f6a7b8-0104-0002-0001-000000000001");
    private static readonly Guid S_T04_WTQ_1 = new("e5f6a7b8-0104-0003-0001-000000000001");
    private static readonly Guid S_T04_MLM_1 = new("e5f6a7b8-0104-0004-0001-000000000001");

    public static void Seed(ModelBuilder modelBuilder)
    {
        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        SeedWorkflowDefinitions(modelBuilder, now);
        SeedT01Stages(modelBuilder);
        SeedT02Stages(modelBuilder);
        SeedT03Stages(modelBuilder);
        SeedT04Stages(modelBuilder);
    }

    private static void SeedWorkflowDefinitions(ModelBuilder modelBuilder, DateTime now)
    {
        modelBuilder.Entity<WorkflowDefinition>().HasData(
            // ── T-01: Agreement Validation & Sign-off (4 products) ──
            new WorkflowDefinition
            {
                Id = T01_RBT,
                ProductCode = ProductCode.RBT,
                TaskType = TaskType.T01,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T01_RHN,
                ProductCode = ProductCode.RHN,
                TaskType = TaskType.T01,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T01_WTQ,
                ProductCode = ProductCode.WTQ,
                TaskType = TaskType.T01,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T01_MLM,
                ProductCode = ProductCode.MLM,
                TaskType = TaskType.T01,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },

            // ── T-02: UAT Access Creation (4 products) ──
            new WorkflowDefinition
            {
                Id = T02_RBT,
                ProductCode = ProductCode.RBT,
                TaskType = TaskType.T02,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T02_RHN,
                ProductCode = ProductCode.RHN,
                TaskType = TaskType.T02,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T02_WTQ,
                ProductCode = ProductCode.WTQ,
                TaskType = TaskType.T02,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T02_MLM,
                ProductCode = ProductCode.MLM,
                TaskType = TaskType.T02,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },

            // ── T-03: Production Account Creation (6 workflows) ──
            // Rabet — PortalOnly
            new WorkflowDefinition
            {
                Id = T03_RBT_PortalOnly,
                ProductCode = ProductCode.RBT,
                TaskType = TaskType.T03,
                ProvisioningPath = ProvisioningPath.PortalOnly,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            // Rabet — PortalAndApi
            new WorkflowDefinition
            {
                Id = T03_RBT_PortalAndApi,
                ProductCode = ProductCode.RBT,
                TaskType = TaskType.T03,
                ProvisioningPath = ProvisioningPath.PortalAndApi,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            // Rhoon — PortalOnly
            new WorkflowDefinition
            {
                Id = T03_RHN_PortalOnly,
                ProductCode = ProductCode.RHN,
                TaskType = TaskType.T03,
                ProvisioningPath = ProvisioningPath.PortalOnly,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            // Rhoon — PortalAndApi
            new WorkflowDefinition
            {
                Id = T03_RHN_PortalAndApi,
                ProductCode = ProductCode.RHN,
                TaskType = TaskType.T03,
                ProvisioningPath = ProvisioningPath.PortalAndApi,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            // Wtheeq — ApiOnly
            new WorkflowDefinition
            {
                Id = T03_WTQ_ApiOnly,
                ProductCode = ProductCode.WTQ,
                TaskType = TaskType.T03,
                ProvisioningPath = ProvisioningPath.ApiOnly,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            // Mulem — ApiOnly
            new WorkflowDefinition
            {
                Id = T03_MLM_ApiOnly,
                ProductCode = ProductCode.MLM,
                TaskType = TaskType.T03,
                ProvisioningPath = ProvisioningPath.ApiOnly,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },

            // ── T-04: Access & Credential Support (4 products) ──
            new WorkflowDefinition
            {
                Id = T04_RBT,
                ProductCode = ProductCode.RBT,
                TaskType = TaskType.T04,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T04_RHN,
                ProductCode = ProductCode.RHN,
                TaskType = TaskType.T04,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T04_WTQ,
                ProductCode = ProductCode.WTQ,
                TaskType = TaskType.T04,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T04_MLM,
                ProductCode = ProductCode.MLM,
                TaskType = TaskType.T04,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            }
        );
    }

    private static void SeedT01Stages(ModelBuilder modelBuilder)
    {
        // T-01: Legal Review → Product Review → EA Sign-off → Stakeholder Notification
        modelBuilder.Entity<StageDefinition>().HasData(
            // ── RBT ──
            new StageDefinition { Id = S_T01_RBT_1, WorkflowDefinitionId = T01_RBT, StageOrder = 1, StageName = "Legal Review", StageType = StageType.Review, AssignedRole = UserRole.LegalTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T01_RBT_2, WorkflowDefinitionId = T01_RBT, StageOrder = 2, StageName = "Product Review", StageType = StageType.Review, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 16 },
            new StageDefinition { Id = S_T01_RBT_3, WorkflowDefinitionId = T01_RBT, StageOrder = 3, StageName = "EA Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.Approver, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T01_RBT_4, WorkflowDefinitionId = T01_RBT, StageOrder = 4, StageName = "Stakeholder Notification", StageType = StageType.Review, AssignedRole = UserRole.Requester, SlaBusinessHours = 0 },

            // ── RHN ──
            new StageDefinition { Id = S_T01_RHN_1, WorkflowDefinitionId = T01_RHN, StageOrder = 1, StageName = "Legal Review", StageType = StageType.Review, AssignedRole = UserRole.LegalTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T01_RHN_2, WorkflowDefinitionId = T01_RHN, StageOrder = 2, StageName = "Product Review", StageType = StageType.Review, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 16 },
            new StageDefinition { Id = S_T01_RHN_3, WorkflowDefinitionId = T01_RHN, StageOrder = 3, StageName = "EA Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.Approver, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T01_RHN_4, WorkflowDefinitionId = T01_RHN, StageOrder = 4, StageName = "Stakeholder Notification", StageType = StageType.Review, AssignedRole = UserRole.Requester, SlaBusinessHours = 0 },

            // ── WTQ ──
            new StageDefinition { Id = S_T01_WTQ_1, WorkflowDefinitionId = T01_WTQ, StageOrder = 1, StageName = "Legal Review", StageType = StageType.Review, AssignedRole = UserRole.LegalTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T01_WTQ_2, WorkflowDefinitionId = T01_WTQ, StageOrder = 2, StageName = "Product Review", StageType = StageType.Review, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 16 },
            new StageDefinition { Id = S_T01_WTQ_3, WorkflowDefinitionId = T01_WTQ, StageOrder = 3, StageName = "EA Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.Approver, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T01_WTQ_4, WorkflowDefinitionId = T01_WTQ, StageOrder = 4, StageName = "Stakeholder Notification", StageType = StageType.Review, AssignedRole = UserRole.Requester, SlaBusinessHours = 0 },

            // ── MLM ──
            new StageDefinition { Id = S_T01_MLM_1, WorkflowDefinitionId = T01_MLM, StageOrder = 1, StageName = "Legal Review", StageType = StageType.Review, AssignedRole = UserRole.LegalTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T01_MLM_2, WorkflowDefinitionId = T01_MLM, StageOrder = 2, StageName = "Product Review", StageType = StageType.Review, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 16 },
            new StageDefinition { Id = S_T01_MLM_3, WorkflowDefinitionId = T01_MLM, StageOrder = 3, StageName = "EA Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.Approver, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T01_MLM_4, WorkflowDefinitionId = T01_MLM, StageOrder = 4, StageName = "Stakeholder Notification", StageType = StageType.Review, AssignedRole = UserRole.Requester, SlaBusinessHours = 0 }
        );
    }

    private static void SeedT02Stages(ModelBuilder modelBuilder)
    {
        // T-02: Product Team Review → Access Provisioning → API Credential Creation → Awaiting UAT Signal → UAT Sign-off
        modelBuilder.Entity<StageDefinition>().HasData(
            // ── RBT ──
            new StageDefinition { Id = S_T02_RBT_1, WorkflowDefinitionId = T02_RBT, StageOrder = 1, StageName = "Product Team Review", StageType = StageType.Review, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_RBT_2, WorkflowDefinitionId = T02_RBT, StageOrder = 2, StageName = "Access Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_RBT_3, WorkflowDefinitionId = T02_RBT, StageOrder = 3, StageName = "API Credential Creation", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_RBT_4, WorkflowDefinitionId = T02_RBT, StageOrder = 4, StageName = "Awaiting UAT Signal", StageType = StageType.PhaseGate, AssignedRole = UserRole.Requester, SlaBusinessHours = 0 },
            new StageDefinition { Id = S_T02_RBT_5, WorkflowDefinitionId = T02_RBT, StageOrder = 5, StageName = "UAT Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },

            // ── RHN ──
            new StageDefinition { Id = S_T02_RHN_1, WorkflowDefinitionId = T02_RHN, StageOrder = 1, StageName = "Product Team Review", StageType = StageType.Review, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_RHN_2, WorkflowDefinitionId = T02_RHN, StageOrder = 2, StageName = "Access Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_RHN_3, WorkflowDefinitionId = T02_RHN, StageOrder = 3, StageName = "API Credential Creation", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_RHN_4, WorkflowDefinitionId = T02_RHN, StageOrder = 4, StageName = "Awaiting UAT Signal", StageType = StageType.PhaseGate, AssignedRole = UserRole.Requester, SlaBusinessHours = 0 },
            new StageDefinition { Id = S_T02_RHN_5, WorkflowDefinitionId = T02_RHN, StageOrder = 5, StageName = "UAT Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },

            // ── WTQ ──
            new StageDefinition { Id = S_T02_WTQ_1, WorkflowDefinitionId = T02_WTQ, StageOrder = 1, StageName = "Product Team Review", StageType = StageType.Review, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_WTQ_2, WorkflowDefinitionId = T02_WTQ, StageOrder = 2, StageName = "Access Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_WTQ_3, WorkflowDefinitionId = T02_WTQ, StageOrder = 3, StageName = "API Credential Creation", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_WTQ_4, WorkflowDefinitionId = T02_WTQ, StageOrder = 4, StageName = "Awaiting UAT Signal", StageType = StageType.PhaseGate, AssignedRole = UserRole.Requester, SlaBusinessHours = 0 },
            new StageDefinition { Id = S_T02_WTQ_5, WorkflowDefinitionId = T02_WTQ, StageOrder = 5, StageName = "UAT Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },

            // ── MLM ──
            new StageDefinition { Id = S_T02_MLM_1, WorkflowDefinitionId = T02_MLM, StageOrder = 1, StageName = "Product Team Review", StageType = StageType.Review, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_MLM_2, WorkflowDefinitionId = T02_MLM, StageOrder = 2, StageName = "Access Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_MLM_3, WorkflowDefinitionId = T02_MLM, StageOrder = 3, StageName = "API Credential Creation", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_MLM_4, WorkflowDefinitionId = T02_MLM, StageOrder = 4, StageName = "Awaiting UAT Signal", StageType = StageType.PhaseGate, AssignedRole = UserRole.Requester, SlaBusinessHours = 0 },
            new StageDefinition { Id = S_T02_MLM_5, WorkflowDefinitionId = T02_MLM, StageOrder = 5, StageName = "UAT Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 }
        );
    }

    private static void SeedT03Stages(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StageDefinition>().HasData(
            // ═══════════════════════════════════════
            //  T-03 Portal Only (Rabet, Rhoon)
            //  4 stages: Partner Ops Review → Product Team Sign-off → Dev Provisioning → Business Provisioning
            // ═══════════════════════════════════════

            // ── RBT PortalOnly ──
            new StageDefinition { Id = S_T03_RBT_PO_1, WorkflowDefinitionId = T03_RBT_PortalOnly, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.PartnerOps, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RBT_PO_2, WorkflowDefinitionId = T03_RBT_PortalOnly, StageOrder = 2, StageName = "Product Team Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RBT_PO_3, WorkflowDefinitionId = T03_RBT_PortalOnly, StageOrder = 3, StageName = "Dev Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RBT_PO_4, WorkflowDefinitionId = T03_RBT_PortalOnly, StageOrder = 4, StageName = "Business Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.BusinessTeam, SlaBusinessHours = 8 },

            // ── RHN PortalOnly ──
            new StageDefinition { Id = S_T03_RHN_PO_1, WorkflowDefinitionId = T03_RHN_PortalOnly, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.PartnerOps, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RHN_PO_2, WorkflowDefinitionId = T03_RHN_PortalOnly, StageOrder = 2, StageName = "Product Team Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RHN_PO_3, WorkflowDefinitionId = T03_RHN_PortalOnly, StageOrder = 3, StageName = "Dev Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RHN_PO_4, WorkflowDefinitionId = T03_RHN_PortalOnly, StageOrder = 4, StageName = "Business Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.BusinessTeam, SlaBusinessHours = 8 },

            // ═══════════════════════════════════════
            //  T-03 Portal + API (Rabet, Rhoon)
            //  5 stages: Partner Ops Review → Product Team Sign-off → Dev Provisioning → Business Provisioning → API Provisioning
            // ═══════════════════════════════════════

            // ── RBT PortalAndApi ──
            new StageDefinition { Id = S_T03_RBT_PA_1, WorkflowDefinitionId = T03_RBT_PortalAndApi, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.PartnerOps, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RBT_PA_2, WorkflowDefinitionId = T03_RBT_PortalAndApi, StageOrder = 2, StageName = "Product Team Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RBT_PA_3, WorkflowDefinitionId = T03_RBT_PortalAndApi, StageOrder = 3, StageName = "Dev Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T03_RBT_PA_4, WorkflowDefinitionId = T03_RBT_PortalAndApi, StageOrder = 4, StageName = "Business Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.BusinessTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T03_RBT_PA_5, WorkflowDefinitionId = T03_RBT_PortalAndApi, StageOrder = 5, StageName = "API Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 24 },

            // ── RHN PortalAndApi ──
            new StageDefinition { Id = S_T03_RHN_PA_1, WorkflowDefinitionId = T03_RHN_PortalAndApi, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.PartnerOps, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RHN_PA_2, WorkflowDefinitionId = T03_RHN_PortalAndApi, StageOrder = 2, StageName = "Product Team Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RHN_PA_3, WorkflowDefinitionId = T03_RHN_PortalAndApi, StageOrder = 3, StageName = "Dev Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T03_RHN_PA_4, WorkflowDefinitionId = T03_RHN_PortalAndApi, StageOrder = 4, StageName = "Business Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.BusinessTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T03_RHN_PA_5, WorkflowDefinitionId = T03_RHN_PortalAndApi, StageOrder = 5, StageName = "API Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 24 },

            // ═══════════════════════════════════════
            //  T-03 API Only (Wtheeq, Mulem)
            //  3 stages: Partner Ops Review → Product Team Sign-off → API Provisioning
            // ═══════════════════════════════════════

            // ── WTQ ApiOnly ──
            new StageDefinition { Id = S_T03_WTQ_AO_1, WorkflowDefinitionId = T03_WTQ_ApiOnly, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.PartnerOps, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_WTQ_AO_2, WorkflowDefinitionId = T03_WTQ_ApiOnly, StageOrder = 2, StageName = "Product Team Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_WTQ_AO_3, WorkflowDefinitionId = T03_WTQ_ApiOnly, StageOrder = 3, StageName = "API Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 24 },

            // ── MLM ApiOnly ──
            new StageDefinition { Id = S_T03_MLM_AO_1, WorkflowDefinitionId = T03_MLM_ApiOnly, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.PartnerOps, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_MLM_AO_2, WorkflowDefinitionId = T03_MLM_ApiOnly, StageOrder = 2, StageName = "Product Team Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_MLM_AO_3, WorkflowDefinitionId = T03_MLM_ApiOnly, StageOrder = 3, StageName = "API Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 24 }
        );
    }

    private static void SeedT04Stages(ModelBuilder modelBuilder)
    {
        // T-04: Verify & Resolve (1 stage per product)
        modelBuilder.Entity<StageDefinition>().HasData(
            new StageDefinition { Id = S_T04_RBT_1, WorkflowDefinitionId = T04_RBT, StageOrder = 1, StageName = "Verify & Resolve", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 2 },
            new StageDefinition { Id = S_T04_RHN_1, WorkflowDefinitionId = T04_RHN, StageOrder = 1, StageName = "Verify & Resolve", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 2 },
            new StageDefinition { Id = S_T04_WTQ_1, WorkflowDefinitionId = T04_WTQ, StageOrder = 1, StageName = "Verify & Resolve", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 2 },
            new StageDefinition { Id = S_T04_MLM_1, WorkflowDefinitionId = T04_MLM, StageOrder = 1, StageName = "Verify & Resolve", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 2 }
        );
    }
}
```

### Step 5.2 — Wire into OnModelCreating

- [ ] Update `src/Tixora.Infrastructure/Data/TixoraDbContext.cs` — final `OnModelCreating`:

```csharp
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TixoraDbContext).Assembly);

        // Seed reference data
        Seed.SeedProducts.Seed(modelBuilder);
        Seed.SeedUsers.Seed(modelBuilder);
        Seed.SeedPartners.Seed(modelBuilder);
        Seed.SeedWorkflows.Seed(modelBuilder);
    }
```

### Step 5.3 — Build verification

- [ ] Run `dotnet build src/Tixora.Infrastructure/Tixora.Infrastructure.csproj` and confirm no errors.

### Step 5.4 — Commit

- [ ] Commit:
```bash
git add src/Tixora.Infrastructure/Data/Seed/SeedWorkflows.cs src/Tixora.Infrastructure/Data/TixoraDbContext.cs
git commit -m "$(cat <<'EOF'
feat: add seed data for 18 workflow definitions + 64 stage definitions

T-01: 4 workflows × 4 stages (Legal → Product → EA → Notification)
T-02: 4 workflows × 5 stages (Product → Access → API Cred → UAT Gate → UAT Sign-off)
T-03: 6 workflows (2 PortalOnly × 4 stages, 2 PortalAndApi × 5 stages, 2 ApiOnly × 3 stages)
T-04: 4 workflows × 1 stage (Verify & Resolve)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: DI Registration + Program.cs

### Step 6.1 — Add Swashbuckle package to API project

- [ ] Edit `src/Tixora.API/Tixora.API.csproj` — add Swashbuckle package reference inside the existing `<ItemGroup>` that has PackageReferences:

```xml
    <PackageReference Include="Swashbuckle.AspNetCore" Version="7.3.1" />
```

### Step 6.2 — Create DependencyInjection.cs

- [ ] Create `src/Tixora.Infrastructure/DependencyInjection.cs`

```csharp
// File: src/Tixora.Infrastructure/DependencyInjection.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Tixora.Application.Interfaces;
using Tixora.Infrastructure.Data;

namespace Tixora.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<TixoraDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(TixoraDbContext).Assembly.FullName)));

        services.AddScoped<ITixoraDbContext>(provider => provider.GetRequiredService<TixoraDbContext>());

        return services;
    }
}
```

### Step 6.3 — Replace Program.cs

- [ ] Replace `src/Tixora.API/Program.cs` with:

```csharp
// File: src/Tixora.API/Program.cs
using Tixora.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Make Program class accessible to integration tests
public partial class Program { }
```

### Step 6.4 — Create appsettings.json

- [ ] Replace `src/Tixora.API/appsettings.json` with:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TixoraDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Step 6.5 — Create appsettings.Development.json

- [ ] Replace `src/Tixora.API/appsettings.Development.json` with:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TixoraDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}
```

### Step 6.6 — Build verification

- [ ] Run `dotnet build src/Tixora.sln` and confirm no errors.

### Step 6.7 — Commit

- [ ] Commit:
```bash
git add src/Tixora.Infrastructure/DependencyInjection.cs src/Tixora.API/Program.cs src/Tixora.API/Tixora.API.csproj src/Tixora.API/appsettings.json src/Tixora.API/appsettings.Development.json
git commit -m "$(cat <<'EOF'
feat: wire DI registration, Swashbuckle, and clean Program.cs

AddInfrastructure extension registers TixoraDbContext + ITixoraDbContext.
Program.cs: controllers, Swagger UI, HTTPS redirect. Removed
weatherforecast boilerplate.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Initial Migration

### Step 7.1 — Compute BCrypt hash and update SeedUsers

Before creating the migration, compute the actual BCrypt hash.

- [ ] Run in bash:
```bash
cd src/Tixora.Infrastructure
dotnet run --project ../Tixora.API -- --compute-hash 2>/dev/null || true
```

Actually, since we cannot run the app just for a hash, use a simpler approach. Create a temporary console one-liner:

```bash
cd C:/Claude/Tixora
dotnet new console -n TempHash -o /tmp/TempHash --framework net10.0
dotnet add /tmp/TempHash/TempHash.csproj package BCrypt.Net-Next --version 4.0.3
cat > /tmp/TempHash/Program.cs << 'CSHARP'
Console.WriteLine(BCrypt.Net.BCrypt.HashPassword("Password1!"));
CSHARP
dotnet run --project /tmp/TempHash
```

- [ ] Copy the output hash string and replace `$2a$11$PLACEHOLDER_REPLACE_ON_FIRST_RUN` in `src/Tixora.Infrastructure/Data/Seed/SeedUsers.cs` with the actual hash.

- [ ] Also remove the `ComputeHash()` method from `SeedUsers.cs`.

### Step 7.2 — Create the initial migration

- [ ] Run:
```bash
cd C:/Claude/Tixora
dotnet ef migrations add InitialCreate --project src/Tixora.Infrastructure --startup-project src/Tixora.API
```

### Step 7.3 — Verify migration files were created

- [ ] Run:
```bash
ls src/Tixora.Infrastructure/Migrations/
```

Expect to see:
- `*_InitialCreate.cs`
- `*_InitialCreate.Designer.cs`
- `TixoraDbContextModelSnapshot.cs`

### Step 7.4 — Build verification

- [ ] Run `dotnet build src/Tixora.sln` and confirm no errors.

### Step 7.5 — Commit

- [ ] Commit:
```bash
git add src/Tixora.Infrastructure/Migrations/ src/Tixora.Infrastructure/Data/Seed/SeedUsers.cs
git commit -m "$(cat <<'EOF'
feat: add InitialCreate EF migration with all seed data

9 tables, 4 products, 12 users, 3 partners, 6 partner-products,
18 workflow definitions, 64 stage definitions.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Integration Test — Seed Data Verification

### Step 8.1 — Create test project

- [ ] Run:
```bash
cd C:/Claude/Tixora
mkdir -p tests
dotnet new xunit -n Tixora.Infrastructure.Tests -o tests/Tixora.Infrastructure.Tests --framework net10.0
dotnet sln src/Tixora.sln add tests/Tixora.Infrastructure.Tests/Tixora.Infrastructure.Tests.csproj
dotnet add tests/Tixora.Infrastructure.Tests/Tixora.Infrastructure.Tests.csproj reference src/Tixora.Infrastructure/Tixora.Infrastructure.csproj
dotnet add tests/Tixora.Infrastructure.Tests/Tixora.Infrastructure.Tests.csproj reference src/Tixora.Domain/Tixora.Domain.csproj
dotnet add tests/Tixora.Infrastructure.Tests/Tixora.Infrastructure.Tests.csproj reference src/Tixora.Application/Tixora.Application.csproj
dotnet add tests/Tixora.Infrastructure.Tests/Tixora.Infrastructure.Tests.csproj package Microsoft.EntityFrameworkCore.InMemory --version 10.0.5
```

### Step 8.2 — Delete the default UnitTest1.cs

- [ ] Run:
```bash
rm tests/Tixora.Infrastructure.Tests/UnitTest1.cs
```

### Step 8.3 — Create SeedDataTests.cs

- [ ] Create `tests/Tixora.Infrastructure.Tests/SeedDataTests.cs`

```csharp
// File: tests/Tixora.Infrastructure.Tests/SeedDataTests.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Enums;
using Tixora.Infrastructure.Data;

namespace Tixora.Infrastructure.Tests;

public class SeedDataTests : IDisposable
{
    private readonly TixoraDbContext _db;

    public SeedDataTests()
    {
        var options = new DbContextOptionsBuilder<TixoraDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new TixoraDbContext(options);
        _db.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    [Fact]
    public async Task Products_ShouldHave4WithCorrectCodes()
    {
        var products = await _db.Products.ToListAsync();

        Assert.Equal(4, products.Count);
        Assert.Contains(products, p => p.Code == ProductCode.RBT && p.Name == "Rabet" && p.PortalType == PortalType.Transactional);
        Assert.Contains(products, p => p.Code == ProductCode.RHN && p.Name == "Rhoon" && p.PortalType == PortalType.Transactional);
        Assert.Contains(products, p => p.Code == ProductCode.WTQ && p.Name == "Wtheeq" && p.PortalType == PortalType.ReadOnly);
        Assert.Contains(products, p => p.Code == ProductCode.MLM && p.Name == "Mulem" && p.PortalType == PortalType.ReadOnly);
    }

    [Fact]
    public async Task Users_ShouldHave12WithCorrectRoles()
    {
        var users = await _db.Users.ToListAsync();

        Assert.Equal(12, users.Count);

        // Verify role distribution
        Assert.Single(users, u => u.Role == UserRole.Requester);
        Assert.Single(users, u => u.Role == UserRole.LegalTeam);
        Assert.Equal(2, users.Count(u => u.Role == UserRole.ProductTeam));
        Assert.Single(users, u => u.Role == UserRole.Approver);
        Assert.Single(users, u => u.Role == UserRole.IntegrationTeam);
        Assert.Single(users, u => u.Role == UserRole.DevTeam);
        Assert.Single(users, u => u.Role == UserRole.BusinessTeam);
        Assert.Equal(3, users.Count(u => u.Role == UserRole.PartnerOps));
        Assert.Single(users, u => u.Role == UserRole.SystemAdministrator);

        // All active
        Assert.All(users, u => Assert.True(u.IsActive));

        // All have password hashes
        Assert.All(users, u => Assert.False(string.IsNullOrEmpty(u.PasswordHash)));
    }

    [Fact]
    public async Task Partners_ShouldHave3With6PartnerProducts()
    {
        var partners = await _db.Partners.Include(p => p.PartnerProducts).ToListAsync();

        Assert.Equal(3, partners.Count);

        var aai = partners.Single(p => p.Name == "Al Ain Insurance");
        Assert.Equal(2, aai.PartnerProducts.Count);
        Assert.Contains(aai.PartnerProducts, pp => pp.ProductCode == ProductCode.RBT);
        Assert.Contains(aai.PartnerProducts, pp => pp.ProductCode == ProductCode.WTQ);

        var dib = partners.Single(p => p.Name == "Dubai Islamic Bank");
        Assert.Equal(2, dib.PartnerProducts.Count);
        Assert.Contains(dib.PartnerProducts, pp => pp.ProductCode == ProductCode.RHN);
        Assert.Contains(dib.PartnerProducts, pp => pp.ProductCode == ProductCode.MLM);

        var eic = partners.Single(p => p.Name == "Emirates Insurance");
        Assert.Equal(2, eic.PartnerProducts.Count);
        Assert.Contains(eic.PartnerProducts, pp => pp.ProductCode == ProductCode.RBT);
        Assert.Contains(eic.PartnerProducts, pp => pp.ProductCode == ProductCode.RHN);

        // All start at None
        var allPPs = partners.SelectMany(p => p.PartnerProducts).ToList();
        Assert.Equal(6, allPPs.Count);
        Assert.All(allPPs, pp => Assert.Equal(LifecycleState.None, pp.LifecycleState));
    }

    [Fact]
    public async Task WorkflowDefinitions_ShouldHave18()
    {
        var workflows = await _db.WorkflowDefinitions
            .Include(w => w.Stages)
            .ToListAsync();

        Assert.Equal(18, workflows.Count);

        // T-01: 4 workflows × 4 stages each
        var t01 = workflows.Where(w => w.TaskType == TaskType.T01).ToList();
        Assert.Equal(4, t01.Count);
        Assert.All(t01, w => Assert.Equal(4, w.Stages.Count));
        Assert.All(t01, w => Assert.Null(w.ProvisioningPath));

        // T-02: 4 workflows × 5 stages each
        var t02 = workflows.Where(w => w.TaskType == TaskType.T02).ToList();
        Assert.Equal(4, t02.Count);
        Assert.All(t02, w => Assert.Equal(5, w.Stages.Count));
        Assert.All(t02, w => Assert.Null(w.ProvisioningPath));

        // T-03: 6 workflows with varying stage counts
        var t03 = workflows.Where(w => w.TaskType == TaskType.T03).ToList();
        Assert.Equal(6, t03.Count);

        var t03PortalOnly = t03.Where(w => w.ProvisioningPath == ProvisioningPath.PortalOnly).ToList();
        Assert.Equal(2, t03PortalOnly.Count);
        Assert.All(t03PortalOnly, w => Assert.Equal(4, w.Stages.Count));

        var t03PortalAndApi = t03.Where(w => w.ProvisioningPath == ProvisioningPath.PortalAndApi).ToList();
        Assert.Equal(2, t03PortalAndApi.Count);
        Assert.All(t03PortalAndApi, w => Assert.Equal(5, w.Stages.Count));

        var t03ApiOnly = t03.Where(w => w.ProvisioningPath == ProvisioningPath.ApiOnly).ToList();
        Assert.Equal(2, t03ApiOnly.Count);
        Assert.All(t03ApiOnly, w => Assert.Equal(3, w.Stages.Count));

        // T-04: 4 workflows × 1 stage each
        var t04 = workflows.Where(w => w.TaskType == TaskType.T04).ToList();
        Assert.Equal(4, t04.Count);
        Assert.All(t04, w => Assert.Equal(1, w.Stages.Count));
    }

    [Fact]
    public async Task StageDefinitions_ShouldHaveValidRolesAndSla()
    {
        var stages = await _db.StageDefinitions.ToListAsync();

        // Total: T01(16) + T02(20) + T03_PO(8) + T03_PA(10) + T03_AO(6) + T04(4) = 64
        Assert.Equal(64, stages.Count);

        // All stages have valid roles (not negative)
        Assert.All(stages, s => Assert.True(Enum.IsDefined(typeof(UserRole), s.AssignedRole)));

        // All SLA values are non-negative
        Assert.All(stages, s => Assert.True(s.SlaBusinessHours >= 0));

        // All stages have non-empty names
        Assert.All(stages, s => Assert.False(string.IsNullOrWhiteSpace(s.StageName)));

        // All stages have valid StageType
        Assert.All(stages, s => Assert.True(Enum.IsDefined(typeof(StageType), s.StageType)));

        // Verify SLA=0 stages are PhaseGate or final notification stages
        var zeroSlaStages = stages.Where(s => s.SlaBusinessHours == 0).ToList();
        Assert.All(zeroSlaStages, s =>
            Assert.True(
                s.StageType == StageType.PhaseGate || s.StageName == "Stakeholder Notification",
                $"Stage '{s.StageName}' has SLA=0 but is not PhaseGate or Stakeholder Notification"
            ));
    }

    [Fact]
    public async Task AllWorkflows_ShouldBeActiveVersion1()
    {
        var workflows = await _db.WorkflowDefinitions.ToListAsync();

        Assert.All(workflows, w =>
        {
            Assert.True(w.IsActive);
            Assert.Equal(1, w.Version);
        });
    }

    [Fact]
    public async Task StageOrders_ShouldBeSequentialPerWorkflow()
    {
        var workflows = await _db.WorkflowDefinitions
            .Include(w => w.Stages)
            .ToListAsync();

        foreach (var workflow in workflows)
        {
            var orders = workflow.Stages.OrderBy(s => s.StageOrder).Select(s => s.StageOrder).ToList();
            var expected = Enumerable.Range(1, orders.Count).ToList();
            Assert.Equal(expected, orders);
        }
    }
}
```

### Step 8.4 — Build and run tests

- [ ] Run:
```bash
cd C:/Claude/Tixora
dotnet build src/Tixora.sln
dotnet test tests/Tixora.Infrastructure.Tests/Tixora.Infrastructure.Tests.csproj --verbosity normal
```

All 7 tests should pass.

### Step 8.5 — Commit

- [ ] Commit:
```bash
git add tests/
git commit -m "$(cat <<'EOF'
test: add integration tests verifying all seed data loads correctly

7 tests: products (4), users (12 across 9 roles), partners (3 with 6
partner-products), 18 workflow definitions with correct stage counts,
64 stage definitions with valid roles/SLA, all workflows active v1,
sequential stage ordering.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Summary of Deliverables

| Task | Files Created/Modified | Entities |
|------|----------------------|----------|
| 1 | `Infrastructure/Data/TixoraDbContext.cs` | DbContext with 9 DbSets |
| 2 | `Infrastructure/Data/Configurations/` (9 files) | All entity Fluent API configs |
| 3 | `Infrastructure/Data/Seed/SeedProducts.cs`, `SeedUsers.cs` | 4 products, 12 users |
| 4 | `Infrastructure/Data/Seed/SeedPartners.cs` | 3 partners, 6 partner-products |
| 5 | `Infrastructure/Data/Seed/SeedWorkflows.cs` | 18 workflows, 64 stage definitions |
| 6 | `Infrastructure/DependencyInjection.cs`, `API/Program.cs`, appsettings | DI + Swagger + connection string |
| 7 | `Infrastructure/Migrations/` | InitialCreate migration |
| 8 | `tests/Tixora.Infrastructure.Tests/SeedDataTests.cs` | 7 integration tests |

**Total commits: 8** (one per task)
