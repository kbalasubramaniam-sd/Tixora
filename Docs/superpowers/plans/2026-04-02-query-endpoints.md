# Query Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 read-only endpoints (3 dashboard + 1 team-queue + 2 tickets) that wire the frontend to real data, replacing all mock fallbacks.

**Architecture:** New `ITicketQueryService` (Application) + `TicketQueryService` (Infrastructure) handles all reads. New `DashboardController` for dashboard endpoints. Existing `TicketsController` gets 2 GET endpoints. WorkflowEngine is untouched (mutations only).

**Tech Stack:** .NET 10, EF Core 10, ASP.NET Core, xUnit, InMemory DB for tests

**Spec:** `Docs/superpowers/specs/2026-04-02-query-endpoints-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/Tixora.Application/DTOs/Dashboard/StatEntryResponse.cs` | Create | Stat card DTO |
| `src/Tixora.Application/DTOs/Dashboard/DashboardStatsResponse.cs` | Create | 4 stat cards wrapper |
| `src/Tixora.Application/DTOs/Dashboard/ActivityEntryResponse.cs` | Create | Activity timeline entry |
| `src/Tixora.Application/DTOs/Tickets/TicketSummaryResponse.cs` | Create | Ticket list item |
| `src/Tixora.Application/DTOs/Tickets/TicketDetailResponse.cs` | Create | Full ticket detail |
| `src/Tixora.Application/DTOs/Tickets/WorkflowStageResponse.cs` | Create | Stage in workflow stepper |
| `src/Tixora.Application/DTOs/Tickets/AuditEntryResponse.cs` | Create | Audit trail entry |
| `src/Tixora.Application/DTOs/Tickets/ClarificationResponse.cs` | Create | Clarification exchange |
| `src/Tixora.Application/Interfaces/ITicketQueryService.cs` | Create | Query service contract |
| `src/Tixora.Infrastructure/Services/TicketQueryService.cs` | Create | Query service implementation |
| `src/Tixora.API/Controllers/DashboardController.cs` | Create | Dashboard 4 endpoints |
| `src/Tixora.API/Controllers/TicketsController.cs` | Modify | Add GET /my and GET /{id} |
| `src/Tixora.Infrastructure/DependencyInjection.cs` | Modify | Register ITicketQueryService |
| `tests/Tixora.API.Tests/Controllers/TicketsControllerQueryTests.cs` | Create | GET endpoint tests |
| `tests/Tixora.API.Tests/Controllers/DashboardControllerTests.cs` | Create | Dashboard endpoint tests |

---

### Task 1: DTOs

All response records for the query endpoints. No logic, no dependencies — pure data shapes.

**Files:**
- Create: `src/Tixora.Application/DTOs/Dashboard/StatEntryResponse.cs`
- Create: `src/Tixora.Application/DTOs/Dashboard/DashboardStatsResponse.cs`
- Create: `src/Tixora.Application/DTOs/Dashboard/ActivityEntryResponse.cs`
- Create: `src/Tixora.Application/DTOs/Tickets/TicketSummaryResponse.cs`
- Create: `src/Tixora.Application/DTOs/Tickets/TicketDetailResponse.cs`
- Create: `src/Tixora.Application/DTOs/Tickets/WorkflowStageResponse.cs`
- Create: `src/Tixora.Application/DTOs/Tickets/AuditEntryResponse.cs`
- Create: `src/Tixora.Application/DTOs/Tickets/ClarificationResponse.cs`

- [ ] **Step 1: Create Dashboard DTOs**

```csharp
// File: src/Tixora.Application/DTOs/Dashboard/StatEntryResponse.cs
namespace Tixora.Application.DTOs.Dashboard;

public record StatEntryResponse(
    string Label,
    object Value,
    string Icon,
    string IconBg,
    string IconColor,
    string? Badge = null,
    string? BadgeStyle = null,
    string? ValueColor = null
);
```

```csharp
// File: src/Tixora.Application/DTOs/Dashboard/DashboardStatsResponse.cs
namespace Tixora.Application.DTOs.Dashboard;

public record DashboardStatsResponse(
    StatEntryResponse Stat1,
    StatEntryResponse Stat2,
    StatEntryResponse Stat3,
    StatEntryResponse Stat4
);
```

```csharp
// File: src/Tixora.Application/DTOs/Dashboard/ActivityEntryResponse.cs
namespace Tixora.Application.DTOs.Dashboard;

public record ActivityEntryResponse(
    string Id,
    string Title,
    string Description,
    string Timestamp,
    string Icon,
    string IconBg,
    string IconColor
);
```

- [ ] **Step 2: Create Ticket query DTOs**

```csharp
// File: src/Tixora.Application/DTOs/Tickets/TicketSummaryResponse.cs
namespace Tixora.Application.DTOs.Tickets;

public record TicketSummaryResponse(
    string Id,
    string TicketId,
    string ProductCode,
    string TaskType,
    string PartnerName,
    string RequesterName,
    string Status,
    string CurrentStage,
    string SlaStatus,
    double SlaHoursRemaining,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
```

```csharp
// File: src/Tixora.Application/DTOs/Tickets/WorkflowStageResponse.cs
namespace Tixora.Application.DTOs.Tickets;

public record WorkflowStageResponse(
    string Name,
    string Icon,
    string Status,
    string? AssignedTo = null,
    DateTime? CompletedAt = null
);
```

```csharp
// File: src/Tixora.Application/DTOs/Tickets/AuditEntryResponse.cs
namespace Tixora.Application.DTOs.Tickets;

public record AuditEntryResponse(
    string Id,
    string Type,
    string Description,
    DateTime Timestamp
);
```

```csharp
// File: src/Tixora.Application/DTOs/Tickets/ClarificationResponse.cs
namespace Tixora.Application.DTOs.Tickets;

public record ClarificationResponse(
    string RequestedBy,
    DateTime RequestedAt,
    string Note,
    string? Response = null,
    DateTime? RespondedAt = null
);
```

```csharp
// File: src/Tixora.Application/DTOs/Tickets/TicketDetailResponse.cs
namespace Tixora.Application.DTOs.Tickets;

public record TicketDetailResponse(
    string Id,
    string TicketId,
    string ProductCode,
    string TaskType,
    string PartnerName,
    string RequesterName,
    string Status,
    string CurrentStage,
    string SlaStatus,
    double SlaHoursRemaining,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string CompanyCode,
    object FormData,
    object[] Documents,
    WorkflowStageResponse[] WorkflowStages,
    object[] Comments,
    AuditEntryResponse[] AuditTrail,
    ClarificationResponse? Clarification,
    string? AssignedTo,
    string CreatedBy,
    string? AccessPath,
    string LifecycleState
);
```

- [ ] **Step 3: Verify build**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded, 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/Tixora.Application/DTOs/Dashboard/ src/Tixora.Application/DTOs/Tickets/TicketSummaryResponse.cs src/Tixora.Application/DTOs/Tickets/TicketDetailResponse.cs src/Tixora.Application/DTOs/Tickets/WorkflowStageResponse.cs src/Tixora.Application/DTOs/Tickets/AuditEntryResponse.cs src/Tixora.Application/DTOs/Tickets/ClarificationResponse.cs
git commit -m "feat: add DTOs for query endpoints (dashboard stats, ticket summary/detail)"
```

---

### Task 2: ITicketQueryService Interface + TicketQueryService (List Queries)

Create the query service interface and implement the list-returning methods: GetMyTicketsAsync, GetTeamQueueAsync, GetActionRequiredAsync.

**Files:**
- Create: `src/Tixora.Application/Interfaces/ITicketQueryService.cs`
- Create: `src/Tixora.Infrastructure/Services/TicketQueryService.cs`
- Modify: `src/Tixora.Infrastructure/DependencyInjection.cs`

**Context:**
- `ITixoraDbContext` is the EF Core abstraction (in `src/Tixora.Application/Interfaces/ITixoraDbContext.cs`). Inject this, NOT TixoraDbContext directly.
- Existing service pattern: see `src/Tixora.Infrastructure/Services/WorkflowEngine.cs` — constructor injects `ITixoraDbContext`.
- Enums: `TicketStatus`, `UserRole`, `TaskType`, `ProductCode` are in `Tixora.Domain.Enums`.
- Navigation: `Ticket.PartnerProduct.Partner.Name`, `Ticket.CreatedBy.FullName`, `Ticket.AssignedTo.FullName`, `Ticket.WorkflowDefinition.Stages`.
- All queries MUST use `.AsNoTracking()`.

- [ ] **Step 1: Create ITicketQueryService interface**

```csharp
// File: src/Tixora.Application/Interfaces/ITicketQueryService.cs
using Tixora.Application.DTOs.Dashboard;
using Tixora.Application.DTOs.Tickets;
using Tixora.Domain.Enums;

namespace Tixora.Application.Interfaces;

public interface ITicketQueryService
{
    Task<DashboardStatsResponse> GetDashboardStatsAsync(Guid userId, UserRole role);
    Task<List<TicketSummaryResponse>> GetActionRequiredAsync(Guid userId, UserRole role);
    Task<List<ActivityEntryResponse>> GetRecentActivityAsync(Guid userId);
    Task<List<TicketSummaryResponse>> GetTeamQueueAsync(Guid userId, UserRole role, string? product, string? task, string? partner, string? requester);
    Task<List<TicketSummaryResponse>> GetMyTicketsAsync(Guid userId);
    Task<TicketDetailResponse?> GetTicketDetailAsync(Guid ticketId);
}
```

- [ ] **Step 2: Create TicketQueryService with list queries**

```csharp
// File: src/Tixora.Infrastructure/Services/TicketQueryService.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Dashboard;
using Tixora.Application.DTOs.Tickets;
using Tixora.Application.Interfaces;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Services;

public class TicketQueryService : ITicketQueryService
{
    private readonly ITixoraDbContext _db;

    private static readonly TicketStatus[] TerminalStatuses =
        [TicketStatus.Completed, TicketStatus.Rejected, TicketStatus.Cancelled];

    public TicketQueryService(ITixoraDbContext db)
    {
        _db = db;
    }

    // ─── Shared projection ───────────────────────────────

    private static TicketSummaryResponse ToSummary(
        Domain.Entities.Ticket t,
        string partnerName,
        string requesterName,
        string currentStageName)
    {
        var isTerminal = TerminalStatuses.Contains(t.Status);
        return new TicketSummaryResponse(
            Id: t.Id.ToString(),
            TicketId: t.TicketId,
            ProductCode: t.ProductCode.ToString(),
            TaskType: t.TaskType.ToString(),
            PartnerName: partnerName,
            RequesterName: requesterName,
            Status: t.Status.ToString(),
            CurrentStage: isTerminal ? "" : currentStageName,
            SlaStatus: "OnTrack",
            SlaHoursRemaining: 0,
            CreatedAt: t.CreatedAt,
            UpdatedAt: t.UpdatedAt
        );
    }

    // ─── GetMyTicketsAsync ───────────────────────────────

    public async Task<List<TicketSummaryResponse>> GetMyTicketsAsync(Guid userId)
    {
        return await _db.Tickets
            .AsNoTracking()
            .Where(t => t.CreatedByUserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TicketSummaryResponse(
                t.Id.ToString(),
                t.TicketId,
                t.ProductCode.ToString(),
                t.TaskType.ToString(),
                t.PartnerProduct.Partner.Name,
                t.CreatedBy.FullName,
                t.Status.ToString(),
                TerminalStatuses.Contains(t.Status) ? "" :
                    t.WorkflowDefinition.Stages
                        .Where(s => s.StageOrder == t.CurrentStageOrder)
                        .Select(s => s.StageName).FirstOrDefault() ?? "",
                "OnTrack",
                0,
                t.CreatedAt,
                t.UpdatedAt
            ))
            .ToListAsync();
    }

    // ─── GetTeamQueueAsync ───────────────────────────────

    public async Task<List<TicketSummaryResponse>> GetTeamQueueAsync(
        Guid userId, UserRole role, string? product, string? task, string? partner, string? requester)
    {
        var query = _db.Tickets
            .AsNoTracking()
            .Where(t => !TerminalStatuses.Contains(t.Status));

        // Visibility by role
        if (role == UserRole.PartnershipTeam)
            query = query.Where(t => t.CreatedByUserId == userId);
        else if (role != UserRole.SystemAdministrator)
            query = query.Where(t => t.WorkflowDefinition.Stages.Any(s => s.AssignedRole == role));

        // Optional filters
        if (!string.IsNullOrEmpty(product) && product != "All" && Enum.TryParse<ProductCode>(product, out var pc))
            query = query.Where(t => t.ProductCode == pc);
        if (!string.IsNullOrEmpty(task) && task != "All" && Enum.TryParse<TaskType>(task, out var tt))
            query = query.Where(t => t.TaskType == tt);
        if (!string.IsNullOrEmpty(partner) && partner != "All")
            query = query.Where(t => t.PartnerProduct.Partner.Name.Contains(partner));
        if (!string.IsNullOrEmpty(requester) && requester != "All")
            query = query.Where(t => t.CreatedBy.FullName.Contains(requester));

        return await query
            .OrderByDescending(t => t.UpdatedAt)
            .Select(t => new TicketSummaryResponse(
                t.Id.ToString(),
                t.TicketId,
                t.ProductCode.ToString(),
                t.TaskType.ToString(),
                t.PartnerProduct.Partner.Name,
                t.CreatedBy.FullName,
                t.Status.ToString(),
                t.WorkflowDefinition.Stages
                    .Where(s => s.StageOrder == t.CurrentStageOrder)
                    .Select(s => s.StageName).FirstOrDefault() ?? "",
                "OnTrack",
                0,
                t.CreatedAt,
                t.UpdatedAt
            ))
            .ToListAsync();
    }

    // ─── GetActionRequiredAsync ──────────────────────────

    public async Task<List<TicketSummaryResponse>> GetActionRequiredAsync(Guid userId, UserRole role)
    {
        var query = _db.Tickets
            .AsNoTracking()
            .Where(t => !TerminalStatuses.Contains(t.Status));

        if (role == UserRole.PartnershipTeam)
        {
            // PartnershipTeam sees: assigned to them OR pending their response as requester
            query = query.Where(t =>
                t.AssignedToUserId == userId ||
                (t.Status == TicketStatus.PendingRequesterAction && t.CreatedByUserId == userId));
        }
        else
        {
            query = query.Where(t => t.AssignedToUserId == userId);
        }

        return await query
            .OrderBy(t => t.CreatedAt)
            .Take(20)
            .Select(t => new TicketSummaryResponse(
                t.Id.ToString(),
                t.TicketId,
                t.ProductCode.ToString(),
                t.TaskType.ToString(),
                t.PartnerProduct.Partner.Name,
                t.CreatedBy.FullName,
                t.Status.ToString(),
                t.WorkflowDefinition.Stages
                    .Where(s => s.StageOrder == t.CurrentStageOrder)
                    .Select(s => s.StageName).FirstOrDefault() ?? "",
                "OnTrack",
                0,
                t.CreatedAt,
                t.UpdatedAt
            ))
            .ToListAsync();
    }

    // ─── Stub methods (implemented in later tasks) ───────

    public Task<DashboardStatsResponse> GetDashboardStatsAsync(Guid userId, UserRole role)
        => throw new NotImplementedException();

    public Task<List<ActivityEntryResponse>> GetRecentActivityAsync(Guid userId)
        => throw new NotImplementedException();

    public Task<TicketDetailResponse?> GetTicketDetailAsync(Guid ticketId)
        => throw new NotImplementedException();
}
```

- [ ] **Step 3: Register in DI**

Modify `src/Tixora.Infrastructure/DependencyInjection.cs` — add after the `IWorkflowEngine` registration:

```csharp
services.AddScoped<ITicketQueryService, TicketQueryService>();
```

The full file becomes:

```csharp
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
        services.AddScoped<ITicketQueryService, TicketQueryService>();

        return services;
    }
}
```

- [ ] **Step 4: Verify build**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded, 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/Tixora.Application/Interfaces/ITicketQueryService.cs src/Tixora.Infrastructure/Services/TicketQueryService.cs src/Tixora.Infrastructure/DependencyInjection.cs
git commit -m "feat: add ITicketQueryService with list queries (my-tickets, team-queue, action-required)"
```

---

### Task 3: TicketQueryService — GetTicketDetailAsync

The most complex query: loads ticket with all navigations and builds the full detail response including workflow stages, audit trail, and clarification data.

**Files:**
- Modify: `src/Tixora.Infrastructure/Services/TicketQueryService.cs`

**Context:**
- `StageDefinition` has: `StageOrder`, `StageName`, `StageType`, `AssignedRole`, `SlaBusinessHours`
- `StageType` enum: `Review=0`, `Approval=1`, `Provisioning=2`, `PhaseGate=3`
- `StageLog` has: `StageOrder`, `StageName`, `Action` (StageAction enum), `ActorUserId`, `Comments`, `Timestamp`
- `StageAction` enum: `Approve=0`, `Reject=1`, `ReturnForClarification=2`, `RespondToClarification=3`, etc.
- `AuditEntry` has: `ActionType` (string), `Details`, `TimestampUtc`, `ActorUserId`
- `PartnerProduct` has: `CompanyCode`, `LifecycleState`, `Partner.Name`
- `ProvisioningPath` enum: `PortalOnly=0`, `PortalAndApi=1`, `ApiOnly=2`
- `Ticket.FormData` is a JSON string — deserialize to `JsonElement` for the response.
- The ticket detail page needs a **final "Complete" pseudo-stage** appended to the workflow stepper.

- [ ] **Step 1: Replace GetTicketDetailAsync stub with full implementation**

Replace the `GetTicketDetailAsync` stub in `TicketQueryService.cs` with:

```csharp
public async Task<TicketDetailResponse?> GetTicketDetailAsync(Guid ticketId)
{
    var ticket = await _db.Tickets
        .AsNoTracking()
        .Include(t => t.PartnerProduct).ThenInclude(pp => pp.Partner)
        .Include(t => t.CreatedBy)
        .Include(t => t.AssignedTo)
        .Include(t => t.WorkflowDefinition).ThenInclude(wd => wd.Stages)
        .Include(t => t.StageLogs).ThenInclude(sl => sl.Actor)
        .Include(t => t.AuditEntries).ThenInclude(ae => ae.Actor)
        .FirstOrDefaultAsync(t => t.Id == ticketId);

    if (ticket is null) return null;

    var isTerminal = TerminalStatuses.Contains(ticket.Status);
    var currentStageName = isTerminal ? "" :
        ticket.WorkflowDefinition.Stages
            .FirstOrDefault(s => s.StageOrder == ticket.CurrentStageOrder)?.StageName ?? "";

    // Build workflow stages
    var stages = ticket.WorkflowDefinition.Stages
        .OrderBy(s => s.StageOrder)
        .Select(sd =>
        {
            string status;
            string? assignedTo = null;
            DateTime? completedAt = null;

            if (sd.StageOrder < ticket.CurrentStageOrder || isTerminal && sd.StageOrder <= ticket.CurrentStageOrder)
            {
                status = "completed";
                completedAt = ticket.StageLogs
                    .Where(sl => sl.StageOrder == sd.StageOrder && sl.Action == StageAction.Approve)
                    .Select(sl => (DateTime?)sl.Timestamp)
                    .FirstOrDefault();
            }
            else if (sd.StageOrder == ticket.CurrentStageOrder && !isTerminal)
            {
                status = "current";
                assignedTo = ticket.AssignedTo?.FullName;
            }
            else
            {
                status = "future";
            }

            return new WorkflowStageResponse(
                Name: sd.StageName,
                Icon: GetStageIcon(sd.StageType),
                Status: status,
                AssignedTo: assignedTo,
                CompletedAt: completedAt
            );
        })
        .ToList();

    // Append "Complete" pseudo-stage
    var ticketCompleted = ticket.Status == TicketStatus.Completed;
    stages.Add(new WorkflowStageResponse(
        Name: "Complete",
        Icon: "check_circle",
        Status: ticketCompleted ? "completed" : "future",
        CompletedAt: ticketCompleted
            ? ticket.AuditEntries.Where(a => a.ActionType == "TicketCompleted").Select(a => (DateTime?)a.TimestampUtc).FirstOrDefault()
            : null
    ));

    // Build audit trail
    var auditTrail = ticket.AuditEntries
        .OrderBy(a => a.TimestampUtc)
        .Select(a => new AuditEntryResponse(
            Id: a.Id.ToString(),
            Type: MapAuditType(a.ActionType),
            Description: a.Details ?? $"{a.ActionType} by {a.Actor.FullName}",
            Timestamp: a.TimestampUtc
        ))
        .ToArray();

    // Build clarification (if PendingRequesterAction)
    ClarificationResponse? clarification = null;
    if (ticket.Status == TicketStatus.PendingRequesterAction)
    {
        var returnLog = ticket.StageLogs
            .Where(sl => sl.Action == StageAction.ReturnForClarification)
            .OrderByDescending(sl => sl.Timestamp)
            .FirstOrDefault();

        if (returnLog != null)
        {
            var responseLog = ticket.StageLogs
                .Where(sl => sl.Action == StageAction.RespondToClarification && sl.Timestamp > returnLog.Timestamp)
                .OrderBy(sl => sl.Timestamp)
                .FirstOrDefault();

            clarification = new ClarificationResponse(
                RequestedBy: returnLog.Actor.FullName,
                RequestedAt: returnLog.Timestamp,
                Note: returnLog.Comments ?? "",
                Response: responseLog?.Comments,
                RespondedAt: responseLog?.Timestamp
            );
        }
    }

    // Parse FormData JSON
    object formData;
    try { formData = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(ticket.FormData); }
    catch { formData = new { }; }

    // Map ProvisioningPath to accessPath string
    string? accessPath = ticket.ProvisioningPath switch
    {
        ProvisioningPath.PortalOnly => "portal",
        ProvisioningPath.ApiOnly => "api",
        ProvisioningPath.PortalAndApi => "both",
        _ => null
    };

    return new TicketDetailResponse(
        Id: ticket.Id.ToString(),
        TicketId: ticket.TicketId,
        ProductCode: ticket.ProductCode.ToString(),
        TaskType: ticket.TaskType.ToString(),
        PartnerName: ticket.PartnerProduct.Partner.Name,
        RequesterName: ticket.CreatedBy.FullName,
        Status: ticket.Status.ToString(),
        CurrentStage: currentStageName,
        SlaStatus: "OnTrack",
        SlaHoursRemaining: 0,
        CreatedAt: ticket.CreatedAt,
        UpdatedAt: ticket.UpdatedAt,
        CompanyCode: ticket.PartnerProduct.CompanyCode,
        FormData: formData,
        Documents: [],
        WorkflowStages: stages.ToArray(),
        Comments: [],
        AuditTrail: auditTrail,
        Clarification: clarification,
        AssignedTo: ticket.AssignedTo?.FullName,
        CreatedBy: ticket.CreatedBy.FullName,
        AccessPath: accessPath,
        LifecycleState: ticket.PartnerProduct.LifecycleState.ToString()
    );
}

private static string GetStageIcon(StageType stageType) => stageType switch
{
    StageType.Review => "rate_review",
    StageType.Approval => "verified",
    StageType.Provisioning => "settings",
    StageType.PhaseGate => "flag",
    _ => "circle"
};

private static string MapAuditType(string actionType) => actionType switch
{
    "TicketCreated" => "stage_transition",
    "StageApproved" => "approval",
    "StageRejected" => "rejection",
    "ReturnedForClarification" => "return",
    "ClarificationResponded" => "stage_transition",
    "TicketCompleted" => "approval",
    "TicketCancelled" => "rejection",
    "Reassigned" => "stage_transition",
    _ => "stage_transition"
};
```

Add these using statements to the top of the file if not already present:

```csharp
using Tixora.Domain.Enums;
using System.Text.Json;
```

- [ ] **Step 2: Verify build**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded, 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/Tixora.Infrastructure/Services/TicketQueryService.cs
git commit -m "feat: implement GetTicketDetailAsync with workflow stages, audit trail, clarification"
```

---

### Task 4: TicketQueryService — Dashboard Stats + Recent Activity

Implement `GetDashboardStatsAsync` and `GetRecentActivityAsync`. Stats are role-dependent with presentation metadata. Activity entries use relative timestamps.

**Files:**
- Modify: `src/Tixora.Infrastructure/Services/TicketQueryService.cs`

**Context:**
- Stats return 4 `StatEntryResponse` records with Tailwind CSS class names for icon styling (matches frontend mock exactly).
- SLA-related stats return placeholder values (0 or "—") — SLA tracking is E3.
- `GetRecentActivityAsync` queries AuditEntries for tickets where the user is either the creator or was an actor in any stage log.
- Timestamps are relative strings: "5 mins ago", "2 hours ago", "Yesterday, 14:20", etc.
- AuditEntry has `ActionType` (string), `Details`, `TimestampUtc`, `ActorUserId`, navigation `Actor.FullName`.
- AuditEntry.Details may be null — build description from ActionType + Actor name if so.

- [ ] **Step 1: Replace GetDashboardStatsAsync and GetRecentActivityAsync stubs**

Replace both stubs in `TicketQueryService.cs`:

```csharp
// ─── GetDashboardStatsAsync ──────────────────────────

public async Task<DashboardStatsResponse> GetDashboardStatsAsync(Guid userId, UserRole role)
{
    return role switch
    {
        UserRole.PartnershipTeam => await BuildPartnershipStats(userId),
        UserRole.SystemAdministrator => await BuildAdminStats(),
        _ => await BuildTeamMemberStats(userId, role)
    };
}

private async Task<DashboardStatsResponse> BuildPartnershipStats(Guid userId)
{
    var now = DateTime.UtcNow;
    var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

    var myOpenCount = await _db.Tickets.AsNoTracking()
        .CountAsync(t => t.CreatedByUserId == userId && !TerminalStatuses.Contains(t.Status));

    var pendingMyAction = await _db.Tickets.AsNoTracking()
        .CountAsync(t => (t.AssignedToUserId == userId && !TerminalStatuses.Contains(t.Status)) ||
                         (t.Status == TicketStatus.PendingRequesterAction && t.CreatedByUserId == userId));

    var completedThisMonth = await _db.Tickets.AsNoTracking()
        .CountAsync(t => t.CreatedByUserId == userId && t.Status == TicketStatus.Completed && t.UpdatedAt >= monthStart);

    return new DashboardStatsResponse(
        Stat1: new StatEntryResponse("My Open Requests", myOpenCount, "inbox", "bg-primary-container/10", "text-primary", "Active", "text-xs font-bold text-primary"),
        Stat2: new StatEntryResponse("Pending My Action", pendingMyAction, "pending_actions", "bg-warning-container/20", "text-warning",
            pendingMyAction > 0 ? "ACTION" : null,
            pendingMyAction > 0 ? "bg-warning text-white px-2 py-0.5 rounded text-[10px] font-bold" : null,
            pendingMyAction > 0 ? "text-warning" : null),
        Stat3: new StatEntryResponse("Completed This Month", completedThisMonth, "task_alt", "bg-success-container/30", "text-success", "This Month"),
        Stat4: new StatEntryResponse("Avg Resolution Time", "—", "schedule", "bg-secondary-container/30", "text-secondary", "Avg")
    );
}

private async Task<DashboardStatsResponse> BuildAdminStats()
{
    var today = DateTime.UtcNow.Date;

    var totalOpen = await _db.Tickets.AsNoTracking()
        .CountAsync(t => !TerminalStatuses.Contains(t.Status));

    var createdToday = await _db.Tickets.AsNoTracking()
        .CountAsync(t => t.CreatedAt >= today);

    return new DashboardStatsResponse(
        Stat1: new StatEntryResponse("Total Open Tickets", totalOpen, "inbox", "bg-primary-container/10", "text-primary", null, null),
        Stat2: new StatEntryResponse("SLA Breaches Today", 0, "warning", "bg-error-container/20", "text-error"),
        Stat3: new StatEntryResponse("Tickets Created Today", createdToday, "bolt", "bg-secondary-container/30", "text-secondary", "Today", "text-xs font-bold text-on-surface-variant"),
        Stat4: new StatEntryResponse("System Compliance", "—", "verified", "bg-primary-container/10", "text-primary", "Live", "text-xs font-bold text-on-surface-variant")
    );
}

private async Task<DashboardStatsResponse> BuildTeamMemberStats(Guid userId, UserRole role)
{
    var now = DateTime.UtcNow;
    var weekStart = now.Date.AddDays(-(int)now.DayOfWeek);

    var assignedToMe = await _db.Tickets.AsNoTracking()
        .CountAsync(t => t.AssignedToUserId == userId && !TerminalStatuses.Contains(t.Status));

    var completedThisWeek = await _db.StageLogs.AsNoTracking()
        .CountAsync(sl => sl.ActorUserId == userId && sl.Action == StageAction.Approve && sl.Timestamp >= weekStart);

    var isReviewer = role is UserRole.LegalTeam or UserRole.ProductTeam or UserRole.ExecutiveAuthority;

    return new DashboardStatsResponse(
        Stat1: new StatEntryResponse(isReviewer ? "In My Queue" : "Assigned to Me", assignedToMe, isReviewer ? "inbox" : "assignment",
            "bg-primary-container/10", "text-primary", isReviewer ? "Queue" : "Active"),
        Stat2: new StatEntryResponse(isReviewer ? "Near SLA Breach" : "SLA At Risk", 0, "warning", "bg-error-container/20", "text-error"),
        Stat3: new StatEntryResponse(isReviewer ? "Processed Today" : "Completed This Week", completedThisWeek,
            isReviewer ? "bolt" : "task_alt",
            isReviewer ? "bg-secondary-container/30" : "bg-success-container/30",
            isReviewer ? "text-secondary" : "text-success",
            isReviewer ? "Today" : "This Week"),
        Stat4: new StatEntryResponse(isReviewer ? "SLA Compliance Rate" : "Avg Completion Time", "—",
            isReviewer ? "verified" : "schedule",
            isReviewer ? "bg-primary-container/10" : "bg-secondary-container/30",
            isReviewer ? "text-primary" : "text-secondary",
            isReviewer ? "Live" : "Avg")
    );
}

// ─── GetRecentActivityAsync ──────────────────────────

public async Task<List<ActivityEntryResponse>> GetRecentActivityAsync(Guid userId)
{
    // Get ticket IDs the user is involved in
    var involvedTicketIds = await _db.Tickets.AsNoTracking()
        .Where(t => t.CreatedByUserId == userId || t.AssignedToUserId == userId)
        .Select(t => t.Id)
        .ToListAsync();

    // Also include tickets where user was an actor in stage logs
    var actedOnTicketIds = await _db.StageLogs.AsNoTracking()
        .Where(sl => sl.ActorUserId == userId)
        .Select(sl => sl.TicketId)
        .Distinct()
        .ToListAsync();

    var allTicketIds = involvedTicketIds.Union(actedOnTicketIds).Distinct().ToList();

    if (allTicketIds.Count == 0)
        return [];

    var entries = await _db.AuditEntries.AsNoTracking()
        .Where(a => allTicketIds.Contains(a.TicketId))
        .OrderByDescending(a => a.TimestampUtc)
        .Take(10)
        .Include(a => a.Actor)
        .Include(a => a.Ticket)
        .ToListAsync();

    var now = DateTime.UtcNow;

    return entries.Select(a =>
    {
        var (icon, iconBg, iconColor) = GetActivityIcon(a.ActionType);
        return new ActivityEntryResponse(
            Id: a.Id.ToString(),
            Title: GetActivityTitle(a.ActionType, a.Actor.FullName),
            Description: a.Details ?? $"Ticket {a.Ticket.TicketId}",
            Timestamp: FormatRelativeTime(a.TimestampUtc, now),
            Icon: icon,
            IconBg: iconBg,
            IconColor: iconColor
        );
    }).ToList();
}

private static (string icon, string iconBg, string iconColor) GetActivityIcon(string actionType) => actionType switch
{
    "TicketCreated" => ("add_circle", "bg-primary-container", "text-on-primary-container"),
    "StageApproved" => ("check_circle", "bg-success-container", "text-success"),
    "StageRejected" => ("cancel", "bg-error-container", "text-error"),
    "ReturnedForClarification" => ("help", "bg-warning-container", "text-warning"),
    "ClarificationResponded" => ("reply", "bg-primary-container", "text-on-primary-container"),
    "TicketCompleted" => ("task_alt", "bg-success-container", "text-success"),
    "TicketCancelled" => ("block", "bg-error-container", "text-error"),
    "Reassigned" => ("swap_horiz", "bg-secondary-container", "text-on-secondary-container"),
    _ => ("info", "bg-secondary-container", "text-on-secondary-container")
};

private static string GetActivityTitle(string actionType, string actorName) => actionType switch
{
    "TicketCreated" => $"Ticket Created by {actorName}",
    "StageApproved" => $"Stage Approved by {actorName}",
    "StageRejected" => $"Ticket Rejected by {actorName}",
    "ReturnedForClarification" => $"Returned for Clarification by {actorName}",
    "ClarificationResponded" => $"Clarification Response from {actorName}",
    "TicketCompleted" => $"Ticket Completed",
    "TicketCancelled" => $"Ticket Cancelled by {actorName}",
    "Reassigned" => $"Ticket Reassigned by {actorName}",
    _ => $"{actionType} by {actorName}"
};

private static string FormatRelativeTime(DateTime utcTime, DateTime now)
{
    var diff = now - utcTime;
    if (diff.TotalMinutes < 60) return $"{(int)diff.TotalMinutes} mins ago";
    if (diff.TotalHours < 24) return $"{(int)diff.TotalHours} hours ago";
    if (diff.TotalHours < 48) return $"Yesterday, {utcTime:HH:mm}";
    if (diff.TotalDays < 7) return utcTime.ToString("ddd, HH:mm");
    return utcTime.ToString("dd MMM, HH:mm");
}
```

- [ ] **Step 2: Verify build**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded, 0 errors

- [ ] **Step 3: Run existing tests to verify no regressions**

Run: `dotnet test`
Expected: All existing tests pass (44+)

- [ ] **Step 4: Commit**

```bash
git add src/Tixora.Infrastructure/Services/TicketQueryService.cs
git commit -m "feat: implement dashboard stats and recent activity queries"
```

---

### Task 5: Controllers (DashboardController + TicketsController GET endpoints)

Wire the query service to HTTP endpoints. New `DashboardController` with 4 endpoints. Add 2 GET endpoints to existing `TicketsController`.

**Files:**
- Create: `src/Tixora.API/Controllers/DashboardController.cs`
- Modify: `src/Tixora.API/Controllers/TicketsController.cs`

**Context:**
- Follow the existing controller pattern in `TicketsController.cs`:
  - `GetCurrentUserId()` extracts Guid from JWT `sub` claim
  - `GetCurrentUserRole()` extracts `UserRole` from JWT `role` claim (stored as int string)
  - All endpoints return `Unauthorized` if claims are missing
  - `[Authorize]` on all endpoints
- The DashboardController needs the same JWT claim helpers. Since these are private methods in TicketsController, duplicate them in DashboardController (extracting a base class would be over-engineering for 2 controllers).
- Route: `api/dashboard` for DashboardController.

- [ ] **Step 1: Create DashboardController**

```csharp
// File: src/Tixora.API/Controllers/DashboardController.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.Interfaces;
using Tixora.Domain.Enums;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ITicketQueryService _queryService;

    public DashboardController(ITicketQueryService queryService)
    {
        _queryService = queryService;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }

    private UserRole? GetCurrentUserRole()
    {
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        if (roleClaim is null || !int.TryParse(roleClaim, out var roleInt))
            return null;
        return (UserRole)roleInt;
    }

    /// <summary>
    /// Dashboard stat cards — role-specific metrics.
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        if (userId is null || role is null)
            return Unauthorized(new { message = "Invalid token." });

        var stats = await _queryService.GetDashboardStatsAsync(userId.Value, role.Value);
        return Ok(stats);
    }

    /// <summary>
    /// Tickets requiring the current user's action.
    /// </summary>
    [HttpGet("action-required")]
    public async Task<IActionResult> GetActionRequired()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        if (userId is null || role is null)
            return Unauthorized(new { message = "Invalid token." });

        var tickets = await _queryService.GetActionRequiredAsync(userId.Value, role.Value);
        return Ok(tickets);
    }

    /// <summary>
    /// Recent activity for tickets the user is involved in.
    /// </summary>
    [HttpGet("activity")]
    public async Task<IActionResult> GetActivity()
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token." });

        var activity = await _queryService.GetRecentActivityAsync(userId.Value);
        return Ok(activity);
    }

    /// <summary>
    /// Team queue — tickets visible to current user's role, with optional filters.
    /// </summary>
    [HttpGet("team-queue")]
    public async Task<IActionResult> GetTeamQueue(
        [FromQuery] string? product,
        [FromQuery] string? task,
        [FromQuery] string? slaStatus,
        [FromQuery] string? partner,
        [FromQuery] string? requester)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        if (userId is null || role is null)
            return Unauthorized(new { message = "Invalid token." });

        var tickets = await _queryService.GetTeamQueueAsync(userId.Value, role.Value, product, task, partner, requester);
        return Ok(tickets);
    }
}
```

- [ ] **Step 2: Add GET endpoints to TicketsController**

Add to `src/Tixora.API/Controllers/TicketsController.cs`. Inject `ITicketQueryService` alongside `IWorkflowEngine`:

Update the constructor and field:

```csharp
private readonly IWorkflowEngine _workflowEngine;
private readonly ITicketQueryService _queryService;

public TicketsController(IWorkflowEngine workflowEngine, ITicketQueryService queryService)
{
    _workflowEngine = workflowEngine;
    _queryService = queryService;
}
```

Add these two endpoints **before** the Create method (GET endpoints first by convention):

```csharp
/// <summary>
/// Get tickets created by the current user.
/// </summary>
[HttpGet("my")]
[Authorize]
[ProducesResponseType(typeof(List<Application.DTOs.Tickets.TicketSummaryResponse>), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public async Task<IActionResult> GetMyTickets()
{
    var userId = GetCurrentUserId();
    if (userId is null)
        return Unauthorized(new { message = "Invalid token: missing sub claim." });

    var tickets = await _queryService.GetMyTicketsAsync(userId.Value);
    return Ok(tickets);
}

/// <summary>
/// Get full ticket detail by ID.
/// </summary>
[HttpGet("{id:guid}")]
[Authorize]
[ProducesResponseType(typeof(Application.DTOs.Tickets.TicketDetailResponse), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public async Task<IActionResult> GetDetail(Guid id)
{
    var userId = GetCurrentUserId();
    if (userId is null)
        return Unauthorized(new { message = "Invalid token: missing sub claim." });

    var detail = await _queryService.GetTicketDetailAsync(id);
    if (detail is null)
        return NotFound(new { message = "Ticket not found." });

    return Ok(detail);
}
```

Add using at top:
```csharp
using Tixora.Application.DTOs.Tickets;
```

- [ ] **Step 3: Verify build**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded, 0 errors

- [ ] **Step 4: Run existing tests**

Run: `dotnet test`
Expected: All existing tests pass

- [ ] **Step 5: Commit**

```bash
git add src/Tixora.API/Controllers/DashboardController.cs src/Tixora.API/Controllers/TicketsController.cs
git commit -m "feat: add DashboardController (4 endpoints) and TicketsController GET endpoints (my, detail)"
```

---

### Task 6: Integration Tests

Test all 6 new endpoints through the HTTP layer using the existing `CustomWebApplicationFactory` and `TestHelpers` pattern.

**Files:**
- Create: `tests/Tixora.API.Tests/Controllers/DashboardControllerTests.cs`
- Create: `tests/Tixora.API.Tests/Controllers/TicketsControllerQueryTests.cs`

**Context:**
- `CustomWebApplicationFactory` uses InMemory database with seeded data (products, partners, users, workflows, stages).
- `TestHelpers.GetAuthTokenAsync(client, email, password)` logs in and returns JWT token.
- `TestHelpers.SetAuthToken(client, token)` sets Bearer header.
- Seed users: sarah.ahmad (PartnershipTeam), omar.khalid (LegalTeam), hannoun (ProductTeam), admin (SystemAdmin), ahmed.tariq (DevTeam).
- To test query endpoints, first create a ticket via `POST /api/tickets`, then query it.
- The InMemory DB is fresh per factory instance — each test class gets its own DB.

- [ ] **Step 1: Create TicketsControllerQueryTests**

```csharp
// File: tests/Tixora.API.Tests/Controllers/TicketsControllerQueryTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class TicketsControllerQueryTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public TicketsControllerQueryTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<TicketResponse> CreateT01TicketAsync(HttpClient client)
    {
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{\"agreementNumber\": \"AGR-QUERY-TEST\"}"
        );

        var response = await client.PostAsJsonAsync("/api/tickets", request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TicketResponse>())!;
    }

    [Fact]
    public async Task GetMyTickets_AsSarah_ReturnsCreatedTickets()
    {
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        // sarah is already authenticated from CreateT01TicketAsync
        var response = await client.GetAsync("/api/tickets/my");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tickets = await response.Content.ReadFromJsonAsync<List<TicketSummaryResponse>>();
        Assert.NotNull(tickets);
        Assert.Contains(tickets, t => t.TicketId == ticket.TicketId);
    }

    [Fact]
    public async Task GetMyTickets_AsOmar_DoesNotReturnSarahTickets()
    {
        var client = _factory.CreateClient();
        await CreateT01TicketAsync(client);

        // Switch to omar
        var omarToken = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, omarToken);

        var response = await client.GetAsync("/api/tickets/my");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tickets = await response.Content.ReadFromJsonAsync<List<TicketSummaryResponse>>();
        Assert.NotNull(tickets);
        Assert.Empty(tickets); // omar didn't create any tickets
    }

    [Fact]
    public async Task GetTicketDetail_ReturnsFullDetail()
    {
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        var response = await client.GetAsync($"/api/tickets/{ticket.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var detail = await response.Content.ReadFromJsonAsync<TicketDetailResponse>();
        Assert.NotNull(detail);
        Assert.Equal(ticket.TicketId, detail.TicketId);
        Assert.Equal("RBT", detail.ProductCode);
        Assert.Equal("T01", detail.TaskType);
        Assert.Equal("Al Ain Insurance", detail.PartnerName);
        Assert.Equal("Sarah Ahmad", detail.CreatedBy);
        Assert.NotEmpty(detail.WorkflowStages);
        Assert.NotEmpty(detail.AuditTrail);
        Assert.Equal("None", detail.LifecycleState);
    }

    [Fact]
    public async Task GetTicketDetail_NonExistent_Returns404()
    {
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var response = await client.GetAsync($"/api/tickets/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetMyTickets_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/tickets/my");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
```

- [ ] **Step 2: Create DashboardControllerTests**

```csharp
// File: tests/Tixora.API.Tests/Controllers/DashboardControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Dashboard;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class DashboardControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public DashboardControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> CreateClientWithTicket()
    {
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        await client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T01", PartnerId: AlAinInsuranceId,
            ProvisioningPath: null, IssueType: null, FormData: "{}"));

        return client;
    }

    [Fact]
    public async Task GetStats_AsPartnershipTeam_Returns4Stats()
    {
        var client = await CreateClientWithTicket();

        var response = await client.GetAsync("/api/dashboard/stats");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var stats = await response.Content.ReadFromJsonAsync<DashboardStatsResponse>();
        Assert.NotNull(stats);
        Assert.Equal("My Open Requests", stats.Stat1.Label);
        Assert.Equal("Pending My Action", stats.Stat2.Label);
        Assert.Equal("Completed This Month", stats.Stat3.Label);
        Assert.Equal("Avg Resolution Time", stats.Stat4.Label);
    }

    [Fact]
    public async Task GetStats_AsAdmin_ReturnsTotalOpenTickets()
    {
        var client = _factory.CreateClient();
        // Create a ticket first as sarah
        var sarahToken = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, sarahToken);
        await client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T01", PartnerId: AlAinInsuranceId,
            ProvisioningPath: null, IssueType: null, FormData: "{}"));

        // Switch to admin
        var adminToken = await TestHelpers.GetAuthTokenAsync(client, "admin@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, adminToken);

        var response = await client.GetAsync("/api/dashboard/stats");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var stats = await response.Content.ReadFromJsonAsync<DashboardStatsResponse>();
        Assert.NotNull(stats);
        Assert.Equal("Total Open Tickets", stats.Stat1.Label);
    }

    [Fact]
    public async Task GetActionRequired_ReturnsAssignedTickets()
    {
        var client = await CreateClientWithTicket();

        // T-01 stage 1 is assigned to LegalTeam (omar). Login as omar.
        var omarToken = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, omarToken);

        var response = await client.GetAsync("/api/dashboard/action-required");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tickets = await response.Content.ReadFromJsonAsync<List<TicketSummaryResponse>>();
        Assert.NotNull(tickets);
        Assert.NotEmpty(tickets);
        Assert.All(tickets, t => Assert.NotEmpty(t.TicketId));
    }

    [Fact]
    public async Task GetActivity_ReturnsRecentEntries()
    {
        var client = await CreateClientWithTicket();

        var response = await client.GetAsync("/api/dashboard/activity");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var activity = await response.Content.ReadFromJsonAsync<List<ActivityEntryResponse>>();
        Assert.NotNull(activity);
        Assert.NotEmpty(activity);
        Assert.All(activity, a =>
        {
            Assert.NotEmpty(a.Title);
            Assert.NotEmpty(a.Icon);
        });
    }

    [Fact]
    public async Task GetTeamQueue_AsLegalTeam_ReturnsVisibleTickets()
    {
        var client = await CreateClientWithTicket();

        // Login as omar (LegalTeam)
        var omarToken = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, omarToken);

        var response = await client.GetAsync("/api/dashboard/team-queue");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tickets = await response.Content.ReadFromJsonAsync<List<TicketSummaryResponse>>();
        Assert.NotNull(tickets);
        // T-01 workflow has a LegalTeam stage, so omar should see it
        Assert.NotEmpty(tickets);
    }

    [Fact]
    public async Task GetTeamQueue_WithProductFilter_FiltersResults()
    {
        var client = await CreateClientWithTicket();

        // Login as admin (sees all)
        var adminToken = await TestHelpers.GetAuthTokenAsync(client, "admin@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, adminToken);

        // Filter for WTQ (no tickets created for WTQ in this test)
        var response = await client.GetAsync("/api/dashboard/team-queue?product=WTQ");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tickets = await response.Content.ReadFromJsonAsync<List<TicketSummaryResponse>>();
        Assert.NotNull(tickets);
        Assert.Empty(tickets); // We only created RBT tickets
    }

    [Fact]
    public async Task GetStats_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/dashboard/stats");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
```

- [ ] **Step 3: Run all tests**

Run: `dotnet test`
Expected: All tests pass (existing 44 + new ~12)

- [ ] **Step 4: Commit**

```bash
git add tests/Tixora.API.Tests/Controllers/TicketsControllerQueryTests.cs tests/Tixora.API.Tests/Controllers/DashboardControllerTests.cs
git commit -m "test: add integration tests for query endpoints (dashboard + tickets GET)"
```

---

## Self-Review Checklist

| Spec Section | Plan Task | Status |
|-------------|-----------|--------|
| 2.1 GET /dashboard/stats | Task 4 (stats) + Task 5 (controller) | Covered |
| 2.1 GET /dashboard/action-required | Task 2 (query) + Task 5 (controller) | Covered |
| 2.1 GET /dashboard/activity | Task 4 (activity) + Task 5 (controller) | Covered |
| 2.1 GET /dashboard/team-queue | Task 2 (query) + Task 5 (controller) | Covered |
| 2.2 GET /tickets/my | Task 2 (query) + Task 5 (controller) | Covered |
| 2.2 GET /tickets/{id} | Task 3 (detail) + Task 5 (controller) | Covered |
| 3. DTOs | Task 1 | Covered |
| 4. ITicketQueryService | Task 2 | Covered |
| 5. Query patterns | Tasks 2-4 | Covered |
| 6. Relative timestamps | Task 4 | Covered |
| 7. Tests | Task 6 | Covered |
| DI registration | Task 2 | Covered |
