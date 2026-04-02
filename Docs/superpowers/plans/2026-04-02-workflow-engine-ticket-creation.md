# Workflow Engine + Ticket Creation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the workflow engine service that drives ticket creation and initial stage assignment, then expose a `POST /api/tickets` endpoint. This is the core backend feature — every ticket in Tixora flows through the workflow engine.

**Architecture:** Clean Architecture monolith with `Domain` <- `Application` <- `Infrastructure` <- `API` layers. `IWorkflowEngine` interface in Application; `WorkflowEngine` implementation in Infrastructure. DTOs in Application/DTOs/Tickets. Controller in API/Controllers.

**Tech Stack:** .NET 10, EF Core 10, SQL Server, JWT Bearer Auth, xUnit, WebApplicationFactory, InMemory provider

**Source Spec:** `Docs/superpowers/specs/2026-04-02-workflow-engine-ticket-creation-design.md`

---

## Task 1: Ticket DTOs

### Step 1.1 — Create CreateTicketRequest DTO

- [ ] Create `src/Tixora.Application/DTOs/Tickets/CreateTicketRequest.cs`

```csharp
// File: src/Tixora.Application/DTOs/Tickets/CreateTicketRequest.cs
namespace Tixora.Application.DTOs.Tickets;

public record CreateTicketRequest(
    string ProductCode,
    string TaskType,
    Guid PartnerId,
    string? ProvisioningPath,
    string? IssueType,
    string FormData
);
```

### Step 1.2 — Create TicketResponse DTO

- [ ] Create `src/Tixora.Application/DTOs/Tickets/TicketResponse.cs`

```csharp
// File: src/Tixora.Application/DTOs/Tickets/TicketResponse.cs
namespace Tixora.Application.DTOs.Tickets;

public record TicketResponse(
    Guid Id,
    string TicketId,
    string ProductCode,
    string TaskType,
    string Status,
    int CurrentStageOrder,
    string? CurrentStageName,
    string? AssignedToName,
    string PartnerName,
    string? ProvisioningPath,
    string? IssueType,
    DateTime CreatedAt
);
```

### Step 1.3 — Commit

```bash
git add src/Tixora.Application/DTOs/Tickets/CreateTicketRequest.cs src/Tixora.Application/DTOs/Tickets/TicketResponse.cs
git commit -m "$(cat <<'EOF'
feat: add CreateTicketRequest and TicketResponse DTOs

DTOs for the ticket creation endpoint. CreateTicketRequest accepts
string-based enum values (parsed in the engine). TicketResponse
returns all display fields for the created ticket.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: IWorkflowEngine Interface

### Step 2.1 — Create IWorkflowEngine interface

- [ ] Create `src/Tixora.Application/Interfaces/IWorkflowEngine.cs`

```csharp
// File: src/Tixora.Application/Interfaces/IWorkflowEngine.cs
using Tixora.Application.DTOs.Tickets;

namespace Tixora.Application.Interfaces;

public interface IWorkflowEngine
{
    /// <summary>
    /// Creates a new ticket, resolves the correct workflow, assigns stage 1,
    /// and records an audit entry. Throws InvalidOperationException for
    /// validation failures (lifecycle mismatch, missing partner-product, etc.).
    /// </summary>
    Task<TicketResponse> CreateTicketAsync(CreateTicketRequest request, Guid createdByUserId);
}
```

### Step 2.2 — Commit

```bash
git add src/Tixora.Application/Interfaces/IWorkflowEngine.cs
git commit -m "$(cat <<'EOF'
feat: add IWorkflowEngine interface in Application layer

Single method for MVP 1: CreateTicketAsync. Throws
InvalidOperationException for validation failures — the controller
maps these to 400 responses. Stage progression methods will be
added in a later sprint.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: WorkflowEngine Implementation

This is the core service. It validates inputs, resolves the workflow, generates the ticket ID, auto-assigns stage 1, creates the ticket + audit entry, and returns a response.

### Step 3.1 — Create WorkflowEngine service

- [ ] Create `src/Tixora.Infrastructure/Services/WorkflowEngine.cs`

```csharp
// File: src/Tixora.Infrastructure/Services/WorkflowEngine.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Tickets;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Services;

public class WorkflowEngine : IWorkflowEngine
{
    private readonly ITixoraDbContext _db;

    public WorkflowEngine(ITixoraDbContext db)
    {
        _db = db;
    }

    public async Task<TicketResponse> CreateTicketAsync(CreateTicketRequest request, Guid createdByUserId)
    {
        // 1. Parse and validate enum inputs
        if (!Enum.TryParse<ProductCode>(request.ProductCode, ignoreCase: true, out var productCode))
            throw new InvalidOperationException($"Invalid product code: '{request.ProductCode}'.");

        if (!Enum.TryParse<TaskType>(request.TaskType, ignoreCase: true, out var taskType))
            throw new InvalidOperationException($"Invalid task type: '{request.TaskType}'.");

        ProvisioningPath? provisioningPath = null;
        if (request.ProvisioningPath is not null)
        {
            if (!Enum.TryParse<ProvisioningPath>(request.ProvisioningPath, ignoreCase: true, out var pp))
                throw new InvalidOperationException($"Invalid provisioning path: '{request.ProvisioningPath}'.");
            provisioningPath = pp;
        }

        IssueType? issueType = null;
        if (request.IssueType is not null)
        {
            if (!Enum.TryParse<IssueType>(request.IssueType, ignoreCase: true, out var it))
                throw new InvalidOperationException($"Invalid issue type: '{request.IssueType}'.");
            issueType = it;
        }

        // 2. Validate task-type-specific required fields
        if (taskType == TaskType.T03 && provisioningPath is null)
            throw new InvalidOperationException("ProvisioningPath is required for T-03 tickets.");

        if (taskType == TaskType.T04 && issueType is null)
            throw new InvalidOperationException("IssueType is required for T-04 tickets.");

        // 3. Find PartnerProduct
        var partnerProduct = await _db.PartnerProducts
            .Include(pp => pp.Partner)
            .FirstOrDefaultAsync(pp => pp.PartnerId == request.PartnerId && pp.ProductCode == productCode);

        if (partnerProduct is null)
            throw new InvalidOperationException(
                $"No partner-product found for PartnerId '{request.PartnerId}' and ProductCode '{productCode}'.");

        // 4. Validate lifecycle state
        var requiredState = GetRequiredLifecycleState(taskType);
        if (partnerProduct.LifecycleState != requiredState)
            throw new InvalidOperationException(
                $"Partner-product lifecycle state is '{partnerProduct.LifecycleState}' but " +
                $"'{requiredState}' is required for task type {taskType}.");

        // 5. Resolve active WorkflowDefinition
        var workflow = await _db.WorkflowDefinitions
            .Include(w => w.Stages)
            .FirstOrDefaultAsync(w =>
                w.ProductCode == productCode &&
                w.TaskType == taskType &&
                w.ProvisioningPath == provisioningPath &&
                w.IsActive);

        if (workflow is null)
            throw new InvalidOperationException(
                $"No active workflow found for ProductCode={productCode}, TaskType={taskType}" +
                (provisioningPath.HasValue ? $", ProvisioningPath={provisioningPath}" : "") + ".");

        // 6. Get stage 1
        var stage1 = workflow.Stages
            .OrderBy(s => s.StageOrder)
            .FirstOrDefault();

        if (stage1 is null)
            throw new InvalidOperationException(
                $"Workflow '{workflow.Id}' has no stage definitions.");

        // 7. Generate SequenceNumber (per day, per product, per task type)
        var todayUtc = DateTime.UtcNow.Date;
        var tomorrowUtc = todayUtc.AddDays(1);

        var maxSeq = await _db.Tickets
            .Where(t =>
                t.ProductCode == productCode &&
                t.TaskType == taskType &&
                t.CreatedAt >= todayUtc &&
                t.CreatedAt < tomorrowUtc)
            .MaxAsync(t => (int?)t.SequenceNumber) ?? 0;

        var sequenceNumber = maxSeq + 1;

        // 8. Build TicketId string: SPM-{ProductCode}-{TaskType}-{YYYYMMDD}-{SEQ:000}
        var dateStr = DateTime.UtcNow.ToString("yyyyMMdd");
        var taskTypeStr = taskType.ToString().ToUpperInvariant(); // T01, T02, etc.
        var productCodeStr = productCode.ToString().ToUpperInvariant(); // RBT, RHN, etc.
        var ticketId = $"SPM-{productCodeStr}-{taskTypeStr}-{dateStr}-{sequenceNumber:000}";

        // 9. Auto-assign: find first active user with stage 1's assigned role
        var assignedUser = await _db.Users
            .FirstOrDefaultAsync(u => u.Role == stage1.AssignedRole && u.IsActive);

        // 10. Create Ticket entity
        var now = DateTime.UtcNow;
        var ticket = new Ticket
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticketId,
            PartnerProductId = partnerProduct.Id,
            TaskType = taskType,
            ProductCode = productCode,
            Status = TicketStatus.Submitted,
            CurrentStageOrder = 1,
            ProvisioningPath = provisioningPath,
            IssueType = issueType,
            FormData = request.FormData,
            CreatedByUserId = createdByUserId,
            AssignedToUserId = assignedUser?.Id,
            WorkflowDefinitionId = workflow.Id,
            SequenceNumber = sequenceNumber,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Tickets.Add(ticket);

        // 11. Create AuditEntry
        var audit = new AuditEntry
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            ActorUserId = createdByUserId,
            ActionType = "TicketCreated",
            Details = $"Ticket {ticketId} created. Assigned to {assignedUser?.FullName ?? "unassigned"} at stage '{stage1.StageName}'.",
            TimestampUtc = now
        };

        _db.AuditEntries.Add(audit);

        // 12. SaveChanges
        await _db.SaveChangesAsync();

        // 13. Return TicketResponse
        return new TicketResponse(
            Id: ticket.Id,
            TicketId: ticket.TicketId,
            ProductCode: productCode.ToString(),
            TaskType: taskType.ToString(),
            Status: ticket.Status.ToString(),
            CurrentStageOrder: ticket.CurrentStageOrder,
            CurrentStageName: stage1.StageName,
            AssignedToName: assignedUser?.FullName,
            PartnerName: partnerProduct.Partner.Name,
            ProvisioningPath: provisioningPath?.ToString(),
            IssueType: issueType?.ToString(),
            CreatedAt: ticket.CreatedAt
        );
    }

    private static LifecycleState GetRequiredLifecycleState(TaskType taskType)
    {
        return taskType switch
        {
            TaskType.T01 => LifecycleState.None,
            TaskType.T02 => LifecycleState.Onboarded,
            TaskType.T03 => LifecycleState.UatCompleted,
            TaskType.T04 => LifecycleState.Live,
            _ => throw new InvalidOperationException($"Unknown task type: {taskType}")
        };
    }
}
```

### Step 3.2 — Commit

```bash
git add src/Tixora.Infrastructure/Services/WorkflowEngine.cs
git commit -m "$(cat <<'EOF'
feat: implement WorkflowEngine.CreateTicketAsync

Core workflow engine that handles ticket creation:
- Parses and validates enum inputs from string values
- Validates PartnerProduct exists and lifecycle state matches
- Resolves the correct WorkflowDefinition (product + task + path)
- Generates sequential ticket IDs (SPM-RBT-T01-20260402-001)
- Auto-assigns to first active user with stage 1's role
- Creates audit trail entry
- Throws InvalidOperationException for all validation failures

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: TicketsController

### Step 4.1 — Create TicketsController

- [ ] Create `src/Tixora.API/Controllers/TicketsController.cs`

The controller reads `userId` from the JWT `sub` claim and `role` from the `ClaimTypes.Role` claim, following the same pattern as `AuthController.Me`. Role is stored as an int in the JWT (see `AuthService.GenerateJwtToken`), so we parse the int and compare against allowed roles.

```csharp
// File: src/Tixora.API/Controllers/TicketsController.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.DTOs.Tickets;
using Tixora.Application.Interfaces;
using Tixora.Domain.Enums;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly IWorkflowEngine _workflowEngine;

    public TicketsController(IWorkflowEngine workflowEngine)
    {
        _workflowEngine = workflowEngine;
    }

    /// <summary>
    /// Create a new ticket. Only PartnershipTeam and SystemAdministrator roles are allowed.
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest request)
    {
        // Extract userId from JWT "sub" claim
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        // Extract role from JWT and validate authorization
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        if (roleClaim is null || !int.TryParse(roleClaim, out var roleInt))
            return Unauthorized(new { message = "Invalid token: missing role claim." });

        var role = (UserRole)roleInt;
        if (role != UserRole.PartnershipTeam && role != UserRole.SystemAdministrator)
            return Forbid();

        try
        {
            var response = await _workflowEngine.CreateTicketAsync(request, userId);
            return CreatedAtAction(nameof(Create), new { id = response.Id }, response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
```

### Step 4.2 — Commit

```bash
git add src/Tixora.API/Controllers/TicketsController.cs
git commit -m "$(cat <<'EOF'
feat: add TicketsController with POST /api/tickets endpoint

Requires JWT auth. Only PartnershipTeam and SystemAdministrator
roles can create tickets. Delegates to WorkflowEngine and maps
InvalidOperationException to 400 responses.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: DI Registration

### Step 5.1 — Register IWorkflowEngine in DependencyInjection.cs

- [ ] Edit `src/Tixora.Infrastructure/DependencyInjection.cs`

Add the `IWorkflowEngine` → `WorkflowEngine` registration alongside the existing `IAuthService` → `AuthService` line.

```csharp
// File: src/Tixora.Infrastructure/DependencyInjection.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Tixora.Application.Interfaces;
using Tixora.Infrastructure.Data;
using Tixora.Infrastructure.Services;

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
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IWorkflowEngine, WorkflowEngine>();

        return services;
    }
}
```

The only change is adding this line after the `IAuthService` registration:

```csharp
services.AddScoped<IWorkflowEngine, WorkflowEngine>();
```

### Step 5.2 — Commit

```bash
git add src/Tixora.Infrastructure/DependencyInjection.cs
git commit -m "$(cat <<'EOF'
feat: register IWorkflowEngine in DI container

Scoped lifetime, same as other services.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Unit Tests — WorkflowEngine

These tests use an InMemory DbContext directly (no WebApplicationFactory). They test the `WorkflowEngine` service in isolation by seeding the InMemory database with the minimum required entities.

### Step 6.1 — Create WorkflowEngineTests

- [ ] Create `tests/Tixora.Infrastructure.Tests/Services/WorkflowEngineTests.cs`

```csharp
// File: tests/Tixora.Infrastructure.Tests/Services/WorkflowEngineTests.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Tickets;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Infrastructure.Data;
using Tixora.Infrastructure.Services;

namespace Tixora.Infrastructure.Tests.Services;

public class WorkflowEngineTests : IDisposable
{
    private readonly TixoraDbContext _db;
    private readonly WorkflowEngine _engine;

    // Deterministic GUIDs for test data
    private static readonly Guid PartnerId = new("aaaaaaaa-0001-0001-0001-000000000001");
    private static readonly Guid PartnerProductId = new("aaaaaaaa-0002-0002-0002-000000000001");
    private static readonly Guid WorkflowId = new("aaaaaaaa-0003-0003-0003-000000000001");
    private static readonly Guid Stage1Id = new("aaaaaaaa-0004-0004-0004-000000000001");
    private static readonly Guid LegalUserId = new("aaaaaaaa-0005-0005-0005-000000000001");
    private static readonly Guid PartnershipUserId = new("aaaaaaaa-0006-0006-0006-000000000001");

    public WorkflowEngineTests()
    {
        var options = new DbContextOptionsBuilder<TixoraDbContext>()
            .UseInMemoryDatabase($"WorkflowEngineTests_{Guid.NewGuid()}")
            .Options;

        _db = new TixoraDbContext(options);
        _engine = new WorkflowEngine(_db);

        SeedTestData();
    }

    private void SeedTestData()
    {
        // Partner
        _db.Partners.Add(new Partner
        {
            Id = PartnerId,
            Name = "Test Partner",
            Alias = "TST",
            CreatedAt = DateTime.UtcNow
        });

        // PartnerProduct — lifecycle = None (ready for T-01)
        _db.PartnerProducts.Add(new PartnerProduct
        {
            Id = PartnerProductId,
            PartnerId = PartnerId,
            ProductCode = ProductCode.RBT,
            LifecycleState = LifecycleState.None,
            StateChangedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        // WorkflowDefinition for T-01 RBT
        _db.WorkflowDefinitions.Add(new WorkflowDefinition
        {
            Id = WorkflowId,
            ProductCode = ProductCode.RBT,
            TaskType = TaskType.T01,
            ProvisioningPath = null,
            Version = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        // Stage 1 — Legal Review
        _db.StageDefinitions.Add(new StageDefinition
        {
            Id = Stage1Id,
            WorkflowDefinitionId = WorkflowId,
            StageOrder = 1,
            StageName = "Legal Review",
            StageType = StageType.Review,
            AssignedRole = UserRole.LegalTeam,
            SlaBusinessHours = 24
        });

        // Users
        _db.Users.Add(new User
        {
            Id = LegalUserId,
            FullName = "Test Legal User",
            Email = "legal@test.ae",
            PasswordHash = "not-used",
            Role = UserRole.LegalTeam,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        _db.Users.Add(new User
        {
            Id = PartnershipUserId,
            FullName = "Test Partnership User",
            Email = "partnership@test.ae",
            PasswordHash = "not-used",
            Role = UserRole.PartnershipTeam,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        _db.SaveChanges();
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    [Fact]
    public async Task CreateTicketAsync_ValidT01_CreatesTicketWithCorrectFields()
    {
        // Arrange
        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: PartnerId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{\"agreementNumber\": \"AGR-001\"}"
        );

        // Act
        var result = await _engine.CreateTicketAsync(request, PartnershipUserId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("RBT", result.ProductCode);
        Assert.Equal("T01", result.TaskType);
        Assert.Equal("Submitted", result.Status);
        Assert.Equal(1, result.CurrentStageOrder);
        Assert.Equal("Legal Review", result.CurrentStageName);
        Assert.Equal("Test Legal User", result.AssignedToName);
        Assert.Equal("Test Partner", result.PartnerName);
        Assert.Null(result.ProvisioningPath);
        Assert.Null(result.IssueType);

        // Verify TicketId format: SPM-RBT-T01-YYYYMMDD-001
        Assert.StartsWith("SPM-RBT-T01-", result.TicketId);
        Assert.EndsWith("-001", result.TicketId);
    }

    [Fact]
    public async Task CreateTicketAsync_ValidT01_CreatesAuditEntry()
    {
        // Arrange
        var request = new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}");

        // Act
        var result = await _engine.CreateTicketAsync(request, PartnershipUserId);

        // Assert
        var audit = await _db.AuditEntries.FirstOrDefaultAsync(a => a.TicketId == result.Id);
        Assert.NotNull(audit);
        Assert.Equal("TicketCreated", audit.ActionType);
        Assert.Equal(PartnershipUserId, audit.ActorUserId);
    }

    [Fact]
    public async Task CreateTicketAsync_WrongLifecycleState_Throws()
    {
        // Arrange — partner-product is in None state, but T-02 requires Onboarded
        var request = new CreateTicketRequest("RBT", "T02", PartnerId, null, null, "{}");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("lifecycle state", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Onboarded", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_InvalidPartnerProduct_Throws()
    {
        // Arrange — non-existent partner ID
        var request = new CreateTicketRequest("RBT", "T01", Guid.NewGuid(), null, null, "{}");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("No partner-product found", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_InvalidProductCode_Throws()
    {
        var request = new CreateTicketRequest("INVALID", "T01", PartnerId, null, null, "{}");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("Invalid product code", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_InvalidTaskType_Throws()
    {
        var request = new CreateTicketRequest("RBT", "T99", PartnerId, null, null, "{}");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("Invalid task type", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_T03WithoutProvisioningPath_Throws()
    {
        var request = new CreateTicketRequest("RBT", "T03", PartnerId, null, null, "{}");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("ProvisioningPath is required", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_T04WithoutIssueType_Throws()
    {
        var request = new CreateTicketRequest("RBT", "T04", PartnerId, null, null, "{}");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("IssueType is required", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_TwoTicketsSameDay_SequentialNumbers()
    {
        // Arrange
        var request = new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}");

        // Act — create two tickets
        var result1 = await _engine.CreateTicketAsync(request, PartnershipUserId);
        var result2 = await _engine.CreateTicketAsync(request, PartnershipUserId);

        // Assert
        Assert.EndsWith("-001", result1.TicketId);
        Assert.EndsWith("-002", result2.TicketId);
    }
}
```

### Step 6.2 — Commit

```bash
git add tests/Tixora.Infrastructure.Tests/Services/WorkflowEngineTests.cs
git commit -m "$(cat <<'EOF'
test: add unit tests for WorkflowEngine.CreateTicketAsync

8 tests covering:
- Valid T-01 creation with correct fields and audit entry
- Lifecycle state validation (wrong state throws)
- Invalid partner-product throws
- Invalid product code / task type throws
- T-03 without provisioning path throws
- T-04 without issue type throws
- Sequential ticket ID numbering

Uses InMemory DbContext with minimal seed data.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Integration Tests — TicketsController

These tests use `CustomWebApplicationFactory` (WebApplicationFactory with InMemory DB). They test the full HTTP pipeline including auth, role checks, and the workflow engine.

The seeded database (via `EnsureCreated` in `CustomWebApplicationFactory`) already has all seed users, partners, partner-products, and workflow definitions from the HasData seed methods. So integration tests can use the real seed data.

Key seed data for tests:
- **Sarah Ahmad** (`sarah.ahmad@tixora.ae`) — PartnershipTeam role, can create tickets
- **Ahmed Tariq** (`ahmed.tariq@tixora.ae`) — DevTeam role, cannot create tickets
- **Admin User** (`admin@tixora.ae`) — SystemAdministrator role, can create tickets
- **Al Ain Insurance + Rabet** — PartnerProduct at LifecycleState.None (ready for T-01)
- **T-01 RBT workflow** — seeded and active

### Step 7.1 — Create TicketsControllerTests

- [ ] Create `tests/Tixora.API.Tests/Controllers/TicketsControllerTests.cs`

```csharp
// File: tests/Tixora.API.Tests/Controllers/TicketsControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class TicketsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    // Known seed data IDs from SeedPartners.cs
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public TicketsControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateTicket_ValidT01_Returns201()
    {
        // Arrange — login as Sarah Ahmad (PartnershipTeam)
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{\"agreementNumber\": \"AGR-001\"}"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/tickets", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<TicketResponse>();
        Assert.NotNull(result);
        Assert.Equal("RBT", result.ProductCode);
        Assert.Equal("T01", result.TaskType);
        Assert.Equal("Submitted", result.Status);
        Assert.Equal(1, result.CurrentStageOrder);
        Assert.Equal("Legal Review", result.CurrentStageName);
        Assert.Equal("Test Partner", result.PartnerName); // Will be "Al Ain Insurance" from seed
        Assert.StartsWith("SPM-RBT-T01-", result.TicketId);
    }

    [Fact]
    public async Task CreateTicket_AsSystemAdmin_Returns201()
    {
        // Arrange — login as Admin User (SystemAdministrator)
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "admin@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{}"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/tickets", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_AsDevTeam_Returns403()
    {
        // Arrange — login as Ahmed Tariq (DevTeam)
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "ahmed.tariq@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{}"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/tickets", request);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_Unauthenticated_Returns401()
    {
        // Arrange — no auth token
        var client = _factory.CreateClient();

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{}"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/tickets", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_LifecycleViolation_Returns400()
    {
        // Arrange — partner-product is at None, but T-02 requires Onboarded
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T02",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{}"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/tickets", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_InvalidProductCode_Returns400()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "INVALID",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{}"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/tickets", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
```

**Important note on Step 7.1:** The first test asserts `result.PartnerName` equals `"Test Partner"` — but from the seed data it will actually be `"Al Ain Insurance"`. Fix the assertion in the first test:

Replace this line in the `CreateTicket_ValidT01_Returns201` test:
```csharp
Assert.Equal("Test Partner", result.PartnerName); // Will be "Al Ain Insurance" from seed
```
With:
```csharp
Assert.Equal("Al Ain Insurance", result.PartnerName);
```

The corrected first test assertion block should read:

```csharp
        Assert.NotNull(result);
        Assert.Equal("RBT", result.ProductCode);
        Assert.Equal("T01", result.TaskType);
        Assert.Equal("Submitted", result.Status);
        Assert.Equal(1, result.CurrentStageOrder);
        Assert.Equal("Legal Review", result.CurrentStageName);
        Assert.Equal("Al Ain Insurance", result.PartnerName);
        Assert.StartsWith("SPM-RBT-T01-", result.TicketId);
```

### Step 7.2 — Commit

```bash
git add tests/Tixora.API.Tests/Controllers/TicketsControllerTests.cs
git commit -m "$(cat <<'EOF'
test: add integration tests for POST /api/tickets

6 tests covering:
- Valid T-01 creation returns 201 with correct response
- SystemAdministrator can create tickets (201)
- DevTeam role is forbidden (403)
- Unauthenticated request returns 401
- Lifecycle violation returns 400
- Invalid product code returns 400

Uses CustomWebApplicationFactory with seeded InMemory database.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Build + Test Verification

### Step 8.1 — Build the solution

- [ ] Run `dotnet build src/Tixora.sln` and verify zero errors

```bash
dotnet build src/Tixora.sln
```

If there are build errors, fix them before proceeding.

### Step 8.2 — Run all tests

- [ ] Run `dotnet test` and verify all tests pass

```bash
dotnet test
```

Expected results:
- 8 unit tests in `Tixora.Infrastructure.Tests` (the new `WorkflowEngineTests`)
- 6 integration tests in `Tixora.API.Tests` (the new `TicketsControllerTests`)
- Plus any pre-existing tests from before

If any tests fail, diagnose and fix before the final commit.

### Step 8.3 — Final commit (only if fixes were needed)

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: address build/test issues from workflow engine implementation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Checklist Summary

| Task | Files | Tests |
|------|-------|-------|
| 1. DTOs | `Application/DTOs/Tickets/CreateTicketRequest.cs`, `TicketResponse.cs` | — |
| 2. Interface | `Application/Interfaces/IWorkflowEngine.cs` | — |
| 3. Engine | `Infrastructure/Services/WorkflowEngine.cs` | — |
| 4. Controller | `API/Controllers/TicketsController.cs` | — |
| 5. DI | `Infrastructure/DependencyInjection.cs` (edit) | — |
| 6. Unit tests | `Infrastructure.Tests/Services/WorkflowEngineTests.cs` | 8 tests |
| 7. Integration tests | `API.Tests/Controllers/TicketsControllerTests.cs` | 6 tests |
| 8. Verification | — | Build + all tests green |
