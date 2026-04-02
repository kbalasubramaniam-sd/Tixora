# Ticket Actions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add all 6 ticket workflow actions to the WorkflowEngine: approve (advance stage), reject, return for clarification, respond to clarification, cancel, and reassign. Each action creates StageLog + AuditEntry records. Final-stage approval advances the partner's lifecycle state. Expose all actions as POST endpoints on the TicketsController.

**Architecture:** Clean Architecture monolith with `Domain` <- `Application` <- `Infrastructure` <- `API` layers. Extends `IWorkflowEngine` interface in Application; extends `WorkflowEngine` implementation in Infrastructure. New DTOs in Application/DTOs/Tickets. Extends TicketsController in API/Controllers.

**Tech Stack:** .NET 10, EF Core 10, SQL Server, JWT Bearer Auth, xUnit, WebApplicationFactory, InMemory provider

**Source Spec:** `Docs/superpowers/specs/2026-04-02-ticket-actions-design.md`

---

## Task 1: Action DTOs

### Step 1.1 — Create ActionRequest DTO

- [ ] Create `src/Tixora.Application/DTOs/Tickets/ActionRequest.cs`

```csharp
// File: src/Tixora.Application/DTOs/Tickets/ActionRequest.cs
namespace Tixora.Application.DTOs.Tickets;

public record ActionRequest(string? Comments);
```

### Step 1.2 — Create CancelRequest DTO

- [ ] Create `src/Tixora.Application/DTOs/Tickets/CancelRequest.cs`

```csharp
// File: src/Tixora.Application/DTOs/Tickets/CancelRequest.cs
namespace Tixora.Application.DTOs.Tickets;

public record CancelRequest(string Reason);
```

### Step 1.3 — Create ReassignRequest DTO

- [ ] Create `src/Tixora.Application/DTOs/Tickets/ReassignRequest.cs`

```csharp
// File: src/Tixora.Application/DTOs/Tickets/ReassignRequest.cs
namespace Tixora.Application.DTOs.Tickets;

public record ReassignRequest(Guid NewAssigneeUserId);
```

### Step 1.4 — Commit

```bash
git add src/Tixora.Application/DTOs/Tickets/ActionRequest.cs src/Tixora.Application/DTOs/Tickets/CancelRequest.cs src/Tixora.Application/DTOs/Tickets/ReassignRequest.cs
git commit -m "$(cat <<'EOF'
feat: add Action, Cancel, and Reassign request DTOs for ticket actions

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Extend IWorkflowEngine

### Step 2.1 — Add 6 action method signatures to IWorkflowEngine

- [ ] Edit `src/Tixora.Application/Interfaces/IWorkflowEngine.cs`

Replace the entire file with:

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

    /// <summary>
    /// Approves the current stage. If last stage, completes the ticket and advances
    /// the partner-product lifecycle. Otherwise advances to the next stage with auto-assignment.
    /// Throws InvalidOperationException if ticket is not active or actor is not the assigned user.
    /// </summary>
    Task<TicketResponse> ApproveStageAsync(Guid ticketId, Guid actorUserId, string? comments);

    /// <summary>
    /// Rejects the ticket (terminal). Only the assigned stage owner can reject.
    /// Throws InvalidOperationException if ticket is not active or actor is not the assigned user.
    /// </summary>
    Task<TicketResponse> RejectAsync(Guid ticketId, Guid actorUserId, string? comments);

    /// <summary>
    /// Returns the ticket to the requester for more information. Status becomes PendingRequesterAction.
    /// Throws InvalidOperationException if ticket is not active or actor is not the assigned user.
    /// </summary>
    Task<TicketResponse> ReturnForClarificationAsync(Guid ticketId, Guid actorUserId, string comments);

    /// <summary>
    /// Requester responds to a clarification request. Status restores to previous active status
    /// based on current stage type. Throws InvalidOperationException if status is not
    /// PendingRequesterAction or actor is not the original requester.
    /// </summary>
    Task<TicketResponse> RespondToClarificationAsync(Guid ticketId, Guid actorUserId, string comments);

    /// <summary>
    /// Cancels the ticket (terminal). Only allowed when status is Submitted (pre-action).
    /// Only the original requester can cancel. Throws InvalidOperationException otherwise.
    /// </summary>
    Task<TicketResponse> CancelAsync(Guid ticketId, Guid actorUserId, string reason);

    /// <summary>
    /// Reassigns the ticket to a different user within the same role as the current stage requires.
    /// Throws InvalidOperationException if ticket is not active, the new assignee doesn't exist,
    /// or the new assignee doesn't have the required role.
    /// </summary>
    Task<TicketResponse> ReassignAsync(Guid ticketId, Guid actorUserId, Guid newAssigneeUserId);
}
```

### Step 2.2 — Commit

```bash
git add src/Tixora.Application/Interfaces/IWorkflowEngine.cs
git commit -m "$(cat <<'EOF'
feat: add 6 action method signatures to IWorkflowEngine interface

Approve, Reject, ReturnForClarification, RespondToClarification,
Cancel, and Reassign — all return Task<TicketResponse>.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Implement WorkflowEngine helpers + ApproveStageAsync

This is the biggest task. We add shared helpers and the most complex action method.

### Step 3.1 — Add helper methods and ApproveStageAsync to WorkflowEngine

- [ ] Edit `src/Tixora.Infrastructure/Services/WorkflowEngine.cs`

Replace the entire file with:

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

    // ─────────────────────────────────────────────────────
    //  Shared: Active status set (any non-terminal status)
    // ─────────────────────────────────────────────────────

    private static readonly HashSet<TicketStatus> ActiveStatuses = new()
    {
        TicketStatus.Submitted,
        TicketStatus.InReview,
        TicketStatus.InProvisioning,
        TicketStatus.Phase1Complete,
        TicketStatus.AwaitingUatSignal,
        TicketStatus.Phase2InReview,
        TicketStatus.PendingRequesterAction
    };

    // ─────────────────────────────────────────────────────
    //  Shared: Load ticket with all navigation properties
    // ─────────────────────────────────────────────────────

    private async Task<Ticket> LoadTicketAsync(Guid ticketId)
    {
        var ticket = await _db.Tickets
            .Include(t => t.WorkflowDefinition)
                .ThenInclude(w => w.Stages)
            .Include(t => t.PartnerProduct)
                .ThenInclude(pp => pp.Partner)
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket is null)
            throw new InvalidOperationException($"Ticket '{ticketId}' not found.");

        return ticket;
    }

    // ─────────────────────────────────────────────────────
    //  Shared: Get current stage definition from ticket
    // ─────────────────────────────────────────────────────

    private static StageDefinition GetCurrentStage(Ticket ticket)
    {
        var stage = ticket.WorkflowDefinition.Stages
            .FirstOrDefault(s => s.StageOrder == ticket.CurrentStageOrder);

        if (stage is null)
            throw new InvalidOperationException(
                $"No stage definition found for StageOrder {ticket.CurrentStageOrder} " +
                $"in workflow '{ticket.WorkflowDefinitionId}'.");

        return stage;
    }

    // ─────────────────────────────────────────────────────
    //  Shared: Map StageType to TicketStatus
    // ─────────────────────────────────────────────────────

    private static TicketStatus GetStatusForStageType(StageType stageType)
    {
        return stageType switch
        {
            StageType.Review => TicketStatus.InReview,
            StageType.Approval => TicketStatus.InReview,
            StageType.Provisioning => TicketStatus.InProvisioning,
            StageType.PhaseGate => TicketStatus.AwaitingUatSignal,
            _ => throw new InvalidOperationException($"Unknown stage type: {stageType}")
        };
    }

    // ─────────────────────────────────────────────────────
    //  Shared: Build TicketResponse from loaded Ticket
    // ─────────────────────────────────────────────────────

    private static TicketResponse BuildResponse(Ticket ticket, string? currentStageName, string? assignedToName)
    {
        return new TicketResponse(
            Id: ticket.Id,
            TicketId: ticket.TicketId,
            ProductCode: ticket.ProductCode.ToString(),
            TaskType: ticket.TaskType.ToString(),
            Status: ticket.Status.ToString(),
            CurrentStageOrder: ticket.CurrentStageOrder,
            CurrentStageName: currentStageName,
            AssignedToName: assignedToName,
            PartnerName: ticket.PartnerProduct.Partner.Name,
            ProvisioningPath: ticket.ProvisioningPath?.ToString(),
            IssueType: ticket.IssueType?.ToString(),
            CreatedAt: ticket.CreatedAt
        );
    }

    // ─────────────────────────────────────────────────────
    //  Shared: Build TicketResponse using loaded navigations
    // ─────────────────────────────────────────────────────

    private TicketResponse BuildResponseFromTicket(Ticket ticket)
    {
        string? stageName = null;
        if (ticket.Status != TicketStatus.Completed &&
            ticket.Status != TicketStatus.Rejected &&
            ticket.Status != TicketStatus.Cancelled)
        {
            var stage = ticket.WorkflowDefinition.Stages
                .FirstOrDefault(s => s.StageOrder == ticket.CurrentStageOrder);
            stageName = stage?.StageName;
        }

        return BuildResponse(ticket, stageName, ticket.AssignedTo?.FullName);
    }

    // ─────────────────────────────────────────────────────
    //  Shared: Lifecycle advancement on ticket completion
    // ─────────────────────────────────────────────────────

    private static LifecycleState? GetCompletionLifecycleState(TaskType taskType)
    {
        return taskType switch
        {
            TaskType.T01 => LifecycleState.Onboarded,
            TaskType.T02 => LifecycleState.UatCompleted,
            TaskType.T03 => LifecycleState.Live,
            TaskType.T04 => null, // support ticket, no lifecycle change
            _ => throw new InvalidOperationException($"Unknown task type: {taskType}")
        };
    }

    // ─────────────────────────────────────────────────────
    //  Shared: Required lifecycle state for ticket creation
    // ─────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────
    //  Shared: Validate ticket is in an active (non-terminal) status
    // ─────────────────────────────────────────────────────

    private static void ValidateActive(Ticket ticket)
    {
        if (!ActiveStatuses.Contains(ticket.Status))
            throw new InvalidOperationException(
                $"Ticket '{ticket.TicketId}' has status '{ticket.Status}' and cannot be acted upon.");
    }

    // ─────────────────────────────────────────────────────
    //  Shared: Validate actor is the assigned stage owner
    // ─────────────────────────────────────────────────────

    private static void ValidateAssignedUser(Ticket ticket, Guid actorUserId)
    {
        if (ticket.AssignedToUserId != actorUserId)
            throw new InvalidOperationException(
                $"User '{actorUserId}' is not the assigned owner of ticket '{ticket.TicketId}'.");
    }

    // ═════════════════════════════════════════════════════
    //  CreateTicketAsync (existing, unchanged logic)
    // ═════════════════════════════════════════════════════

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

    // ═════════════════════════════════════════════════════
    //  ApproveStageAsync
    // ═════════════════════════════════════════════════════

    public async Task<TicketResponse> ApproveStageAsync(Guid ticketId, Guid actorUserId, string? comments)
    {
        var ticket = await LoadTicketAsync(ticketId);
        ValidateActive(ticket);
        ValidateAssignedUser(ticket, actorUserId);

        var now = DateTime.UtcNow;
        var currentStage = GetCurrentStage(ticket);
        var stages = ticket.WorkflowDefinition.Stages.OrderBy(s => s.StageOrder).ToList();
        var isLastStage = currentStage.StageOrder == stages.Last().StageOrder;

        // StageLog: Approve
        _db.StageLogs.Add(new StageLog
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            StageOrder = currentStage.StageOrder,
            StageName = currentStage.StageName,
            Action = StageAction.Approve,
            ActorUserId = actorUserId,
            Comments = comments,
            Timestamp = now
        });

        // AuditEntry: StageApproved
        _db.AuditEntries.Add(new AuditEntry
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            ActorUserId = actorUserId,
            ActionType = "StageApproved",
            Details = $"Stage {currentStage.StageOrder} '{currentStage.StageName}' approved.",
            TimestampUtc = now
        });

        // T-02 mid-workflow lifecycle: Stage 2 (Access Provisioning) completion → UatActive
        if (ticket.TaskType == TaskType.T02 &&
            currentStage.StageOrder == 2 &&
            currentStage.StageType == StageType.Provisioning &&
            !isLastStage)
        {
            ticket.PartnerProduct.LifecycleState = LifecycleState.UatActive;
            ticket.PartnerProduct.StateChangedAt = now;

            _db.AuditEntries.Add(new AuditEntry
            {
                Id = Guid.CreateVersion7(),
                TicketId = ticket.Id,
                ActorUserId = actorUserId,
                ActionType = "LifecycleAdvanced",
                Details = $"Partner-product lifecycle advanced to UatActive (T-02 Phase 1 complete).",
                TimestampUtc = now
            });
        }

        if (isLastStage)
        {
            // ── Complete the ticket ──
            ticket.Status = TicketStatus.Completed;
            ticket.AssignedToUserId = null;
            ticket.AssignedTo = null;
            ticket.UpdatedAt = now;

            // Advance lifecycle
            var newLifecycle = GetCompletionLifecycleState(ticket.TaskType);
            if (newLifecycle.HasValue)
            {
                ticket.PartnerProduct.LifecycleState = newLifecycle.Value;
                ticket.PartnerProduct.StateChangedAt = now;
            }

            _db.AuditEntries.Add(new AuditEntry
            {
                Id = Guid.CreateVersion7(),
                TicketId = ticket.Id,
                ActorUserId = actorUserId,
                ActionType = "TicketCompleted",
                Details = $"Ticket '{ticket.TicketId}' completed." +
                    (newLifecycle.HasValue ? $" Lifecycle advanced to {newLifecycle.Value}." : ""),
                TimestampUtc = now
            });
        }
        else
        {
            // ── Advance to next stage ──
            var nextStage = stages.First(s => s.StageOrder > currentStage.StageOrder);
            ticket.CurrentStageOrder = nextStage.StageOrder;

            // T-02 special: after Phase 1 completes (stage 2), status is Phase1Complete
            // But actually the next stage determines status, so:
            // - If next stage is PhaseGate (T-02 stage 4) → AwaitingUatSignal
            // - Normal flow: map from stage type
            ticket.Status = GetStatusForStageType(nextStage.StageType);

            // T-02 special status overrides:
            // After stage 2 completes, we already set lifecycle to UatActive above.
            // The status mapping via GetStatusForStageType handles PhaseGate→AwaitingUatSignal.

            // Auto-assign next stage owner
            var nextAssignee = await _db.Users
                .FirstOrDefaultAsync(u => u.Role == nextStage.AssignedRole && u.IsActive);

            ticket.AssignedToUserId = nextAssignee?.Id;
            ticket.AssignedTo = nextAssignee;
            ticket.UpdatedAt = now;
        }

        await _db.SaveChangesAsync();
        return BuildResponseFromTicket(ticket);
    }

    // Stub implementations — will be added in Tasks 4 and 5
    public Task<TicketResponse> RejectAsync(Guid ticketId, Guid actorUserId, string? comments)
        => throw new NotImplementedException();
    public Task<TicketResponse> ReturnForClarificationAsync(Guid ticketId, Guid actorUserId, string comments)
        => throw new NotImplementedException();
    public Task<TicketResponse> RespondToClarificationAsync(Guid ticketId, Guid actorUserId, string comments)
        => throw new NotImplementedException();
    public Task<TicketResponse> CancelAsync(Guid ticketId, Guid actorUserId, string reason)
        => throw new NotImplementedException();
    public Task<TicketResponse> ReassignAsync(Guid ticketId, Guid actorUserId, Guid newAssigneeUserId)
        => throw new NotImplementedException();
}
```

### Step 3.2 — Build verification

```bash
dotnet build src/Tixora.sln
```

### Step 3.3 — Commit

```bash
git add src/Tixora.Infrastructure/Services/WorkflowEngine.cs
git commit -m "$(cat <<'EOF'
feat: implement ApproveStageAsync with helpers in WorkflowEngine

Adds shared helpers: LoadTicketAsync, GetCurrentStage, GetStatusForStageType,
BuildResponseFromTicket, ValidateActive, ValidateAssignedUser.

ApproveStageAsync handles: stage advancement, auto-assignment, T-02 mid-workflow
lifecycle (UatActive at stage 2), and final-stage completion with lifecycle
advancement. Remaining 5 actions stubbed with NotImplementedException.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Implement Reject, ReturnForClarification, RespondToClarification, Cancel

### Step 4.1 — Replace the 4 stub methods in WorkflowEngine

- [ ] Edit `src/Tixora.Infrastructure/Services/WorkflowEngine.cs` — replace the 4 stub methods (keep ReassignAsync stub)

Replace:

```csharp
    // Stub implementations — will be added in Tasks 4 and 5
    public Task<TicketResponse> RejectAsync(Guid ticketId, Guid actorUserId, string? comments)
        => throw new NotImplementedException();
    public Task<TicketResponse> ReturnForClarificationAsync(Guid ticketId, Guid actorUserId, string comments)
        => throw new NotImplementedException();
    public Task<TicketResponse> RespondToClarificationAsync(Guid ticketId, Guid actorUserId, string comments)
        => throw new NotImplementedException();
    public Task<TicketResponse> CancelAsync(Guid ticketId, Guid actorUserId, string reason)
        => throw new NotImplementedException();
    public Task<TicketResponse> ReassignAsync(Guid ticketId, Guid actorUserId, Guid newAssigneeUserId)
        => throw new NotImplementedException();
```

With:

```csharp
    // ═════════════════════════════════════════════════════
    //  RejectAsync
    // ═════════════════════════════════════════════════════

    public async Task<TicketResponse> RejectAsync(Guid ticketId, Guid actorUserId, string? comments)
    {
        var ticket = await LoadTicketAsync(ticketId);
        ValidateActive(ticket);
        ValidateAssignedUser(ticket, actorUserId);

        var now = DateTime.UtcNow;
        var currentStage = GetCurrentStage(ticket);

        ticket.Status = TicketStatus.Rejected;
        ticket.UpdatedAt = now;

        _db.StageLogs.Add(new StageLog
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            StageOrder = currentStage.StageOrder,
            StageName = currentStage.StageName,
            Action = StageAction.Reject,
            ActorUserId = actorUserId,
            Comments = comments,
            Timestamp = now
        });

        _db.AuditEntries.Add(new AuditEntry
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            ActorUserId = actorUserId,
            ActionType = "TicketRejected",
            Details = $"Ticket '{ticket.TicketId}' rejected at stage {currentStage.StageOrder} '{currentStage.StageName}'.",
            TimestampUtc = now
        });

        await _db.SaveChangesAsync();
        return BuildResponseFromTicket(ticket);
    }

    // ═════════════════════════════════════════════════════
    //  ReturnForClarificationAsync
    // ═════════════════════════════════════════════════════

    public async Task<TicketResponse> ReturnForClarificationAsync(Guid ticketId, Guid actorUserId, string comments)
    {
        var ticket = await LoadTicketAsync(ticketId);
        ValidateActive(ticket);
        ValidateAssignedUser(ticket, actorUserId);

        // Don't allow return-for-clarification if already pending requester action
        if (ticket.Status == TicketStatus.PendingRequesterAction)
            throw new InvalidOperationException(
                $"Ticket '{ticket.TicketId}' is already pending requester action.");

        var now = DateTime.UtcNow;
        var currentStage = GetCurrentStage(ticket);

        ticket.Status = TicketStatus.PendingRequesterAction;
        ticket.UpdatedAt = now;

        _db.StageLogs.Add(new StageLog
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            StageOrder = currentStage.StageOrder,
            StageName = currentStage.StageName,
            Action = StageAction.ReturnForClarification,
            ActorUserId = actorUserId,
            Comments = comments,
            Timestamp = now
        });

        _db.AuditEntries.Add(new AuditEntry
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            ActorUserId = actorUserId,
            ActionType = "ReturnedForClarification",
            Details = $"Ticket '{ticket.TicketId}' returned for clarification at stage {currentStage.StageOrder} '{currentStage.StageName}'.",
            TimestampUtc = now
        });

        await _db.SaveChangesAsync();
        return BuildResponseFromTicket(ticket);
    }

    // ═════════════════════════════════════════════════════
    //  RespondToClarificationAsync
    // ═════════════════════════════════════════════════════

    public async Task<TicketResponse> RespondToClarificationAsync(Guid ticketId, Guid actorUserId, string comments)
    {
        var ticket = await LoadTicketAsync(ticketId);

        if (ticket.Status != TicketStatus.PendingRequesterAction)
            throw new InvalidOperationException(
                $"Ticket '{ticket.TicketId}' is not pending requester action (status: {ticket.Status}).");

        if (ticket.CreatedByUserId != actorUserId)
            throw new InvalidOperationException(
                $"User '{actorUserId}' is not the original requester of ticket '{ticket.TicketId}'.");

        var now = DateTime.UtcNow;
        var currentStage = GetCurrentStage(ticket);

        // Restore status based on current stage type
        ticket.Status = GetStatusForStageType(currentStage.StageType);
        ticket.UpdatedAt = now;

        _db.StageLogs.Add(new StageLog
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            StageOrder = currentStage.StageOrder,
            StageName = currentStage.StageName,
            Action = StageAction.RespondToClarification,
            ActorUserId = actorUserId,
            Comments = comments,
            Timestamp = now
        });

        _db.AuditEntries.Add(new AuditEntry
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            ActorUserId = actorUserId,
            ActionType = "ClarificationResponded",
            Details = $"Requester responded to clarification on ticket '{ticket.TicketId}' at stage {currentStage.StageOrder} '{currentStage.StageName}'.",
            TimestampUtc = now
        });

        await _db.SaveChangesAsync();
        return BuildResponseFromTicket(ticket);
    }

    // ═════════════════════════════════════════════════════
    //  CancelAsync
    // ═════════════════════════════════════════════════════

    public async Task<TicketResponse> CancelAsync(Guid ticketId, Guid actorUserId, string reason)
    {
        var ticket = await LoadTicketAsync(ticketId);

        if (ticket.Status != TicketStatus.Submitted)
            throw new InvalidOperationException(
                $"Ticket '{ticket.TicketId}' can only be cancelled when status is Submitted (current: {ticket.Status}).");

        if (ticket.CreatedByUserId != actorUserId)
            throw new InvalidOperationException(
                $"User '{actorUserId}' is not the original requester of ticket '{ticket.TicketId}'.");

        var now = DateTime.UtcNow;
        var currentStage = GetCurrentStage(ticket);

        ticket.Status = TicketStatus.Cancelled;
        ticket.CancellationReason = reason;
        ticket.UpdatedAt = now;

        _db.StageLogs.Add(new StageLog
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            StageOrder = currentStage.StageOrder,
            StageName = currentStage.StageName,
            Action = StageAction.Cancel,
            ActorUserId = actorUserId,
            Comments = reason,
            Timestamp = now
        });

        _db.AuditEntries.Add(new AuditEntry
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            ActorUserId = actorUserId,
            ActionType = "TicketCancelled",
            Details = $"Ticket '{ticket.TicketId}' cancelled. Reason: {reason}",
            TimestampUtc = now
        });

        await _db.SaveChangesAsync();
        return BuildResponseFromTicket(ticket);
    }

    // Stub — will be implemented in Task 5
    public Task<TicketResponse> ReassignAsync(Guid ticketId, Guid actorUserId, Guid newAssigneeUserId)
        => throw new NotImplementedException();
```

### Step 4.2 — Build verification

```bash
dotnet build src/Tixora.sln
```

### Step 4.3 — Commit

```bash
git add src/Tixora.Infrastructure/Services/WorkflowEngine.cs
git commit -m "$(cat <<'EOF'
feat: implement Reject, ReturnForClarification, RespondToClarification, Cancel

Reject: terminal status, only assigned user can reject.
ReturnForClarification: sets PendingRequesterAction, only assigned user.
RespondToClarification: restores status from stage type, only requester.
Cancel: only when Submitted, only requester, records CancellationReason.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Implement ReassignAsync

### Step 5.1 — Replace ReassignAsync stub

- [ ] Edit `src/Tixora.Infrastructure/Services/WorkflowEngine.cs` — replace the ReassignAsync stub

Replace:

```csharp
    // Stub — will be implemented in Task 5
    public Task<TicketResponse> ReassignAsync(Guid ticketId, Guid actorUserId, Guid newAssigneeUserId)
        => throw new NotImplementedException();
```

With:

```csharp
    // ═════════════════════════════════════════════════════
    //  ReassignAsync
    // ═════════════════════════════════════════════════════

    public async Task<TicketResponse> ReassignAsync(Guid ticketId, Guid actorUserId, Guid newAssigneeUserId)
    {
        var ticket = await LoadTicketAsync(ticketId);
        ValidateActive(ticket);

        var currentStage = GetCurrentStage(ticket);

        // Validate new assignee exists and has the correct role
        var newAssignee = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == newAssigneeUserId && u.IsActive);

        if (newAssignee is null)
            throw new InvalidOperationException(
                $"User '{newAssigneeUserId}' not found or is inactive.");

        if (newAssignee.Role != currentStage.AssignedRole)
            throw new InvalidOperationException(
                $"User '{newAssignee.FullName}' has role '{newAssignee.Role}' but stage " +
                $"'{currentStage.StageName}' requires role '{currentStage.AssignedRole}'.");

        var now = DateTime.UtcNow;

        ticket.AssignedToUserId = newAssigneeUserId;
        ticket.AssignedTo = newAssignee;
        ticket.UpdatedAt = now;

        _db.StageLogs.Add(new StageLog
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            StageOrder = currentStage.StageOrder,
            StageName = currentStage.StageName,
            Action = StageAction.Reassign,
            ActorUserId = actorUserId,
            ReassignedToUserId = newAssigneeUserId,
            Comments = $"Reassigned from {ticket.AssignedTo?.FullName ?? "unassigned"} to {newAssignee.FullName}.",
            Timestamp = now
        });

        _db.AuditEntries.Add(new AuditEntry
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticket.Id,
            ActorUserId = actorUserId,
            ActionType = "TicketReassigned",
            Details = $"Ticket '{ticket.TicketId}' reassigned to {newAssignee.FullName} at stage {currentStage.StageOrder} '{currentStage.StageName}'.",
            TimestampUtc = now
        });

        await _db.SaveChangesAsync();
        return BuildResponseFromTicket(ticket);
    }
```

### Step 5.2 — Build verification

```bash
dotnet build src/Tixora.sln
```

### Step 5.3 — Commit

```bash
git add src/Tixora.Infrastructure/Services/WorkflowEngine.cs
git commit -m "$(cat <<'EOF'
feat: implement ReassignAsync in WorkflowEngine

Validates new assignee exists, is active, and has the same role as the
current stage requires. Updates assignment and creates StageLog + AuditEntry.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Extend TicketsController with 6 action endpoints

### Step 6.1 — Add action endpoints to TicketsController

- [ ] Edit `src/Tixora.API/Controllers/TicketsController.cs`

Replace the entire file with:

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

    // ─────────────────────────────────────────────────────
    //  Shared: Extract userId from JWT sub claim
    // ─────────────────────────────────────────────────────

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }

    // ─────────────────────────────────────────────────────
    //  Shared: Extract role from JWT
    // ─────────────────────────────────────────────────────

    private UserRole? GetCurrentUserRole()
    {
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        if (roleClaim is null || !int.TryParse(roleClaim, out var roleInt))
            return null;
        return (UserRole)roleInt;
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
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        var role = GetCurrentUserRole();
        if (role is null)
            return Unauthorized(new { message = "Invalid token: missing role claim." });

        if (role != UserRole.PartnershipTeam && role != UserRole.SystemAdministrator)
            return Forbid();

        try
        {
            var response = await _workflowEngine.CreateTicketAsync(request, userId.Value);
            return CreatedAtAction(nameof(Create), new { id = response.Id }, response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Approve the current stage. Advances to next stage or completes the ticket.
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ActionRequest? request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        try
        {
            var response = await _workflowEngine.ApproveStageAsync(id, userId.Value, request?.Comments);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Reject the ticket (terminal). Only the assigned stage owner can reject.
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Reject(Guid id, [FromBody] ActionRequest? request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        try
        {
            var response = await _workflowEngine.RejectAsync(id, userId.Value, request?.Comments);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Return ticket to requester for clarification.
    /// </summary>
    [HttpPost("{id:guid}/return")]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ReturnForClarification(Guid id, [FromBody] ActionRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        if (string.IsNullOrWhiteSpace(request.Comments))
            return BadRequest(new { message = "Comments are required when returning for clarification." });

        try
        {
            var response = await _workflowEngine.ReturnForClarificationAsync(id, userId.Value, request.Comments);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Requester responds to a clarification request.
    /// </summary>
    [HttpPost("{id:guid}/respond")]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RespondToClarification(Guid id, [FromBody] ActionRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        if (string.IsNullOrWhiteSpace(request.Comments))
            return BadRequest(new { message = "Comments are required when responding to clarification." });

        try
        {
            var response = await _workflowEngine.RespondToClarificationAsync(id, userId.Value, request.Comments);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cancel a ticket. Only allowed when status is Submitted.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest(new { message = "Cancellation reason is required." });

        try
        {
            var response = await _workflowEngine.CancelAsync(id, userId.Value, request.Reason);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Reassign the ticket to a different user within the same role.
    /// </summary>
    [HttpPost("{id:guid}/reassign")]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Reassign(Guid id, [FromBody] ReassignRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        try
        {
            var response = await _workflowEngine.ReassignAsync(id, userId.Value, request.NewAssigneeUserId);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
```

### Step 6.2 — Build verification

```bash
dotnet build src/Tixora.sln
```

### Step 6.3 — Commit

```bash
git add src/Tixora.API/Controllers/TicketsController.cs
git commit -m "$(cat <<'EOF'
feat: add 6 ticket action endpoints to TicketsController

POST /api/tickets/{id}/approve — advance stage or complete ticket
POST /api/tickets/{id}/reject — reject ticket (terminal)
POST /api/tickets/{id}/return — return for clarification
POST /api/tickets/{id}/respond — respond to clarification
POST /api/tickets/{id}/cancel — cancel submitted ticket
POST /api/tickets/{id}/reassign — reassign to different user

Extracted shared GetCurrentUserId/GetCurrentUserRole helpers.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Unit Tests for WorkflowEngine Actions

### Step 7.1 — Add action tests to WorkflowEngineTests

- [ ] Edit `tests/Tixora.Infrastructure.Tests/Services/WorkflowEngineTests.cs`

Replace the entire file with:

```csharp
// File: tests/Tixora.Infrastructure.Tests/Services/WorkflowEngineTests.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Tickets;
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
    private static readonly Guid Stage2Id = new("aaaaaaaa-0004-0004-0004-000000000002");
    private static readonly Guid Stage3Id = new("aaaaaaaa-0004-0004-0004-000000000003");
    private static readonly Guid Stage4Id = new("aaaaaaaa-0004-0004-0004-000000000004");
    private static readonly Guid LegalUserId = new("aaaaaaaa-0005-0005-0005-000000000001");
    private static readonly Guid ProductUserId = new("aaaaaaaa-0005-0005-0005-000000000002");
    private static readonly Guid EaUserId = new("aaaaaaaa-0005-0005-0005-000000000003");
    private static readonly Guid PartnershipUserId = new("aaaaaaaa-0006-0006-0006-000000000001");
    private static readonly Guid AnotherLegalUserId = new("aaaaaaaa-0005-0005-0005-000000000004");

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

        // WorkflowDefinition for T-01 RBT — 4 stages
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

        // Stage 2 — Product Review
        _db.StageDefinitions.Add(new StageDefinition
        {
            Id = Stage2Id,
            WorkflowDefinitionId = WorkflowId,
            StageOrder = 2,
            StageName = "Product Review",
            StageType = StageType.Review,
            AssignedRole = UserRole.ProductTeam,
            SlaBusinessHours = 16
        });

        // Stage 3 — EA Sign-off
        _db.StageDefinitions.Add(new StageDefinition
        {
            Id = Stage3Id,
            WorkflowDefinitionId = WorkflowId,
            StageOrder = 3,
            StageName = "EA Sign-off",
            StageType = StageType.Approval,
            AssignedRole = UserRole.ExecutiveAuthority,
            SlaBusinessHours = 8
        });

        // Stage 4 — Stakeholder Notification
        _db.StageDefinitions.Add(new StageDefinition
        {
            Id = Stage4Id,
            WorkflowDefinitionId = WorkflowId,
            StageOrder = 4,
            StageName = "Stakeholder Notification",
            StageType = StageType.Review,
            AssignedRole = UserRole.PartnershipTeam,
            SlaBusinessHours = 0
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
            Id = AnotherLegalUserId,
            FullName = "Another Legal User",
            Email = "legal2@test.ae",
            PasswordHash = "not-used",
            Role = UserRole.LegalTeam,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        _db.Users.Add(new User
        {
            Id = ProductUserId,
            FullName = "Test Product User",
            Email = "product@test.ae",
            PasswordHash = "not-used",
            Role = UserRole.ProductTeam,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        _db.Users.Add(new User
        {
            Id = EaUserId,
            FullName = "Test EA User",
            Email = "ea@test.ae",
            PasswordHash = "not-used",
            Role = UserRole.ExecutiveAuthority,
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

    private async Task<TicketResponse> CreateTestTicket()
    {
        var request = new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}");
        return await _engine.CreateTicketAsync(request, PartnershipUserId);
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    // ═════════════════════════════════════════════════════
    //  CreateTicketAsync tests (existing)
    // ═════════════════════════════════════════════════════

    [Fact]
    public async Task CreateTicketAsync_ValidT01_CreatesTicketWithCorrectFields()
    {
        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: PartnerId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{\"agreementNumber\": \"AGR-001\"}"
        );

        var result = await _engine.CreateTicketAsync(request, PartnershipUserId);

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
        Assert.StartsWith("SPM-RBT-T01-", result.TicketId);
        Assert.EndsWith("-001", result.TicketId);
    }

    [Fact]
    public async Task CreateTicketAsync_ValidT01_CreatesAuditEntry()
    {
        var request = new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}");

        var result = await _engine.CreateTicketAsync(request, PartnershipUserId);

        var audit = await _db.AuditEntries.FirstOrDefaultAsync(a => a.TicketId == result.Id);
        Assert.NotNull(audit);
        Assert.Equal("TicketCreated", audit.ActionType);
        Assert.Equal(PartnershipUserId, audit.ActorUserId);
    }

    [Fact]
    public async Task CreateTicketAsync_WrongLifecycleState_Throws()
    {
        var request = new CreateTicketRequest("RBT", "T02", PartnerId, null, null, "{}");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("lifecycle state", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Onboarded", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_InvalidPartnerProduct_Throws()
    {
        var request = new CreateTicketRequest("RBT", "T01", Guid.NewGuid(), null, null, "{}");

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
        var request = new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}");

        var result1 = await _engine.CreateTicketAsync(request, PartnershipUserId);
        var result2 = await _engine.CreateTicketAsync(request, PartnershipUserId);

        Assert.EndsWith("-001", result1.TicketId);
        Assert.EndsWith("-002", result2.TicketId);
    }

    // ═════════════════════════════════════════════════════
    //  ApproveStageAsync tests
    // ═════════════════════════════════════════════════════

    [Fact]
    public async Task ApproveStageAsync_Stage1_AdvancesToStage2()
    {
        var ticket = await CreateTestTicket();

        var result = await _engine.ApproveStageAsync(ticket.Id, LegalUserId, "Looks good");

        Assert.Equal(2, result.CurrentStageOrder);
        Assert.Equal("Product Review", result.CurrentStageName);
        Assert.Equal("InReview", result.Status);
        Assert.Equal("Test Product User", result.AssignedToName);
    }

    [Fact]
    public async Task ApproveStageAsync_Stage1_CreatesStageLogAndAudit()
    {
        var ticket = await CreateTestTicket();

        await _engine.ApproveStageAsync(ticket.Id, LegalUserId, "Approved");

        var stageLog = await _db.StageLogs
            .FirstOrDefaultAsync(sl => sl.TicketId == ticket.Id && sl.Action == StageAction.Approve);
        Assert.NotNull(stageLog);
        Assert.Equal(1, stageLog.StageOrder);
        Assert.Equal("Legal Review", stageLog.StageName);
        Assert.Equal(LegalUserId, stageLog.ActorUserId);
        Assert.Equal("Approved", stageLog.Comments);

        var audit = await _db.AuditEntries
            .FirstOrDefaultAsync(a => a.TicketId == ticket.Id && a.ActionType == "StageApproved");
        Assert.NotNull(audit);
    }

    [Fact]
    public async Task ApproveStageAsync_FinalStage_CompletesTicketAndAdvancesLifecycle()
    {
        var ticket = await CreateTestTicket();

        // Approve stage 1 (Legal Review) → stage 2
        await _engine.ApproveStageAsync(ticket.Id, LegalUserId, null);
        // Approve stage 2 (Product Review) → stage 3
        await _engine.ApproveStageAsync(ticket.Id, ProductUserId, null);
        // Approve stage 3 (EA Sign-off) → stage 4
        await _engine.ApproveStageAsync(ticket.Id, EaUserId, null);
        // Approve stage 4 (Stakeholder Notification) → Completed
        var result = await _engine.ApproveStageAsync(ticket.Id, PartnershipUserId, null);

        Assert.Equal("Completed", result.Status);
        Assert.Null(result.AssignedToName);

        // Verify lifecycle advanced to Onboarded
        var pp = await _db.PartnerProducts.FindAsync(PartnerProductId);
        Assert.NotNull(pp);
        Assert.Equal(LifecycleState.Onboarded, pp.LifecycleState);

        // Verify TicketCompleted audit entry
        var audit = await _db.AuditEntries
            .FirstOrDefaultAsync(a => a.TicketId == ticket.Id && a.ActionType == "TicketCompleted");
        Assert.NotNull(audit);
        Assert.Contains("Onboarded", audit.Details);
    }

    [Fact]
    public async Task ApproveStageAsync_WrongUser_Throws()
    {
        var ticket = await CreateTestTicket();

        // Ticket is assigned to LegalUserId, try to approve as PartnershipUserId
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.ApproveStageAsync(ticket.Id, PartnershipUserId, null));

        Assert.Contains("not the assigned owner", ex.Message);
    }

    [Fact]
    public async Task ApproveStageAsync_CompletedTicket_Throws()
    {
        var ticket = await CreateTestTicket();

        // Complete all 4 stages
        await _engine.ApproveStageAsync(ticket.Id, LegalUserId, null);
        await _engine.ApproveStageAsync(ticket.Id, ProductUserId, null);
        await _engine.ApproveStageAsync(ticket.Id, EaUserId, null);
        await _engine.ApproveStageAsync(ticket.Id, PartnershipUserId, null);

        // Try to approve again
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.ApproveStageAsync(ticket.Id, PartnershipUserId, null));

        Assert.Contains("cannot be acted upon", ex.Message);
    }

    // ═════════════════════════════════════════════════════
    //  RejectAsync tests
    // ═════════════════════════════════════════════════════

    [Fact]
    public async Task RejectAsync_ActiveTicket_SetsRejectedStatus()
    {
        var ticket = await CreateTestTicket();

        var result = await _engine.RejectAsync(ticket.Id, LegalUserId, "Incomplete documents");

        Assert.Equal("Rejected", result.Status);

        var stageLog = await _db.StageLogs
            .FirstOrDefaultAsync(sl => sl.TicketId == ticket.Id && sl.Action == StageAction.Reject);
        Assert.NotNull(stageLog);
        Assert.Equal("Incomplete documents", stageLog.Comments);

        var audit = await _db.AuditEntries
            .FirstOrDefaultAsync(a => a.TicketId == ticket.Id && a.ActionType == "TicketRejected");
        Assert.NotNull(audit);
    }

    [Fact]
    public async Task RejectAsync_WrongUser_Throws()
    {
        var ticket = await CreateTestTicket();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.RejectAsync(ticket.Id, PartnershipUserId, "Nope"));

        Assert.Contains("not the assigned owner", ex.Message);
    }

    // ═════════════════════════════════════════════════════
    //  ReturnForClarification + Respond tests
    // ═════════════════════════════════════════════════════

    [Fact]
    public async Task ReturnForClarificationAsync_ActiveTicket_SetsPendingRequesterAction()
    {
        var ticket = await CreateTestTicket();

        var result = await _engine.ReturnForClarificationAsync(ticket.Id, LegalUserId, "Need more info");

        Assert.Equal("PendingRequesterAction", result.Status);

        var stageLog = await _db.StageLogs
            .FirstOrDefaultAsync(sl => sl.TicketId == ticket.Id && sl.Action == StageAction.ReturnForClarification);
        Assert.NotNull(stageLog);
    }

    [Fact]
    public async Task RespondToClarificationAsync_PendingTicket_RestoresStatus()
    {
        var ticket = await CreateTestTicket();

        // First return for clarification
        await _engine.ReturnForClarificationAsync(ticket.Id, LegalUserId, "Need more info");

        // Requester responds
        var result = await _engine.RespondToClarificationAsync(ticket.Id, PartnershipUserId, "Here is more info");

        // Stage 1 is Review → should restore to InReview
        Assert.Equal("InReview", result.Status);

        var stageLog = await _db.StageLogs
            .FirstOrDefaultAsync(sl => sl.TicketId == ticket.Id && sl.Action == StageAction.RespondToClarification);
        Assert.NotNull(stageLog);
    }

    [Fact]
    public async Task RespondToClarificationAsync_NotPending_Throws()
    {
        var ticket = await CreateTestTicket();

        // Ticket is Submitted, not PendingRequesterAction
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.RespondToClarificationAsync(ticket.Id, PartnershipUserId, "Response"));

        Assert.Contains("not pending requester action", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RespondToClarificationAsync_WrongUser_Throws()
    {
        var ticket = await CreateTestTicket();
        await _engine.ReturnForClarificationAsync(ticket.Id, LegalUserId, "Need info");

        // Try to respond as LegalUserId (not the requester)
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.RespondToClarificationAsync(ticket.Id, LegalUserId, "Response"));

        Assert.Contains("not the original requester", ex.Message);
    }

    // ═════════════════════════════════════════════════════
    //  CancelAsync tests
    // ═════════════════════════════════════════════════════

    [Fact]
    public async Task CancelAsync_SubmittedTicket_SetsCancelledStatus()
    {
        var ticket = await CreateTestTicket();

        var result = await _engine.CancelAsync(ticket.Id, PartnershipUserId, "No longer needed");

        Assert.Equal("Cancelled", result.Status);

        // Verify CancellationReason persisted
        var dbTicket = await _db.Tickets.FindAsync(ticket.Id);
        Assert.NotNull(dbTicket);
        Assert.Equal("No longer needed", dbTicket.CancellationReason);
    }

    [Fact]
    public async Task CancelAsync_InProgressTicket_Throws()
    {
        var ticket = await CreateTestTicket();

        // Approve stage 1 → now InReview at stage 2
        await _engine.ApproveStageAsync(ticket.Id, LegalUserId, null);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CancelAsync(ticket.Id, PartnershipUserId, "Changed mind"));

        Assert.Contains("Submitted", ex.Message);
    }

    [Fact]
    public async Task CancelAsync_WrongUser_Throws()
    {
        var ticket = await CreateTestTicket();

        // LegalUserId is not the requester (PartnershipUserId created it)
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CancelAsync(ticket.Id, LegalUserId, "Cancel"));

        Assert.Contains("not the original requester", ex.Message);
    }

    // ═════════════════════════════════════════════════════
    //  ReassignAsync tests
    // ═════════════════════════════════════════════════════

    [Fact]
    public async Task ReassignAsync_SameRole_UpdatesAssignment()
    {
        var ticket = await CreateTestTicket();

        // Reassign from LegalUserId to AnotherLegalUserId (both LegalTeam)
        var result = await _engine.ReassignAsync(ticket.Id, LegalUserId, AnotherLegalUserId);

        Assert.Equal("Another Legal User", result.AssignedToName);

        var stageLog = await _db.StageLogs
            .FirstOrDefaultAsync(sl => sl.TicketId == ticket.Id && sl.Action == StageAction.Reassign);
        Assert.NotNull(stageLog);
        Assert.Equal(AnotherLegalUserId, stageLog.ReassignedToUserId);
    }

    [Fact]
    public async Task ReassignAsync_WrongRole_Throws()
    {
        var ticket = await CreateTestTicket();

        // Stage 1 requires LegalTeam, try to assign ProductUserId (ProductTeam)
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.ReassignAsync(ticket.Id, LegalUserId, ProductUserId));

        Assert.Contains("role", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ReassignAsync_NonExistentUser_Throws()
    {
        var ticket = await CreateTestTicket();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.ReassignAsync(ticket.Id, LegalUserId, Guid.NewGuid()));

        Assert.Contains("not found", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ═════════════════════════════════════════════════════
    //  Full T-01 Flow
    // ═════════════════════════════════════════════════════

    [Fact]
    public async Task FullT01Flow_Create_Approve4Stages_CompletedWithOnboardedLifecycle()
    {
        // Create
        var ticket = await CreateTestTicket();
        Assert.Equal("Submitted", ticket.Status);
        Assert.Equal(1, ticket.CurrentStageOrder);

        // Stage 1: Legal Review → approved by LegalTeam
        var s1 = await _engine.ApproveStageAsync(ticket.Id, LegalUserId, null);
        Assert.Equal("InReview", s1.Status);
        Assert.Equal(2, s1.CurrentStageOrder);
        Assert.Equal("Product Review", s1.CurrentStageName);

        // Stage 2: Product Review → approved by ProductTeam
        var s2 = await _engine.ApproveStageAsync(ticket.Id, ProductUserId, null);
        Assert.Equal("InReview", s2.Status);
        Assert.Equal(3, s2.CurrentStageOrder);
        Assert.Equal("EA Sign-off", s2.CurrentStageName);

        // Stage 3: EA Sign-off → approved by ExecutiveAuthority
        var s3 = await _engine.ApproveStageAsync(ticket.Id, EaUserId, null);
        Assert.Equal("InReview", s3.Status);
        Assert.Equal(4, s3.CurrentStageOrder);
        Assert.Equal("Stakeholder Notification", s3.CurrentStageName);

        // Stage 4: Stakeholder Notification → approved by PartnershipTeam → Completed
        var s4 = await _engine.ApproveStageAsync(ticket.Id, PartnershipUserId, null);
        Assert.Equal("Completed", s4.Status);
        Assert.Null(s4.AssignedToName);

        // Verify lifecycle
        var pp = await _db.PartnerProducts.FindAsync(PartnerProductId);
        Assert.NotNull(pp);
        Assert.Equal(LifecycleState.Onboarded, pp.LifecycleState);

        // Verify stage logs (4 Approve entries + 1 TicketCreated audit)
        var stageLogs = await _db.StageLogs
            .Where(sl => sl.TicketId == ticket.Id && sl.Action == StageAction.Approve)
            .ToListAsync();
        Assert.Equal(4, stageLogs.Count);

        // Verify audit entries (TicketCreated + 4 StageApproved + TicketCompleted = 6)
        var audits = await _db.AuditEntries
            .Where(a => a.TicketId == ticket.Id)
            .ToListAsync();
        Assert.Equal(6, audits.Count);
    }
}
```

### Step 7.2 — Run unit tests

```bash
dotnet test tests/Tixora.Infrastructure.Tests --verbosity normal
```

### Step 7.3 — Commit

```bash
git add tests/Tixora.Infrastructure.Tests/Services/WorkflowEngineTests.cs
git commit -m "$(cat <<'EOF'
test: add unit tests for all 6 WorkflowEngine ticket actions

Tests cover: approve stage advancement, approve final stage with lifecycle,
approve wrong user, reject, return for clarification, respond to clarification,
cancel submitted, cancel in-progress, reassign same role, reassign wrong role,
and a full T-01 4-stage flow end-to-end.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Integration Tests for Ticket Action Endpoints

### Step 8.1 — Add action endpoint tests to TicketsControllerTests

- [ ] Edit `tests/Tixora.API.Tests/Controllers/TicketsControllerTests.cs`

Replace the entire file with:

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

    private async Task<(HttpClient client, TicketResponse ticket)> CreateAuthenticatedTicketAsync(
        string email = "sarah.ahmad@tixora.ae")
    {
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, email, "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{\"agreementNumber\": \"AGR-001\"}"
        );

        var response = await client.PostAsJsonAsync("/api/tickets", request);
        response.EnsureSuccessStatusCode();
        var ticket = await response.Content.ReadFromJsonAsync<TicketResponse>();

        return (client, ticket!);
    }

    // ═════════════════════════════════════════════════════
    //  Create ticket tests (existing)
    // ═════════════════════════════════════════════════════

    [Fact]
    public async Task CreateTicket_ValidT01_Returns201()
    {
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

        var response = await client.PostAsJsonAsync("/api/tickets", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<TicketResponse>();
        Assert.NotNull(result);
        Assert.Equal("RBT", result.ProductCode);
        Assert.Equal("T01", result.TaskType);
        Assert.Equal("Submitted", result.Status);
        Assert.Equal(1, result.CurrentStageOrder);
        Assert.Equal("Legal Review", result.CurrentStageName);
        Assert.Equal("Al Ain Insurance", result.PartnerName);
        Assert.StartsWith("SPM-RBT-T01-", result.TicketId);
    }

    [Fact]
    public async Task CreateTicket_AsSystemAdmin_Returns201()
    {
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

        var response = await client.PostAsJsonAsync("/api/tickets", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_AsDevTeam_Returns403()
    {
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

        var response = await client.PostAsJsonAsync("/api/tickets", request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{}"
        );

        var response = await client.PostAsJsonAsync("/api/tickets", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_LifecycleViolation_Returns400()
    {
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

        var response = await client.PostAsJsonAsync("/api/tickets", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_InvalidProductCode_Returns400()
    {
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

        var response = await client.PostAsJsonAsync("/api/tickets", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ═════════════════════════════════════════════════════
    //  Approve endpoint tests
    // ═════════════════════════════════════════════════════

    [Fact]
    public async Task ApproveTicket_AsAssignedUser_Returns200()
    {
        // Create ticket as Sarah (PartnershipTeam) — assigned to Omar (LegalTeam)
        var (_, ticket) = await CreateAuthenticatedTicketAsync();

        // Login as Omar (LegalTeam) to approve
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var response = await client.PostAsJsonAsync(
            $"/api/tickets/{ticket.Id}/approve",
            new ActionRequest("Approved"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<TicketResponse>();
        Assert.NotNull(result);
        Assert.Equal("InReview", result.Status);
        Assert.Equal(2, result.CurrentStageOrder);
    }

    // ═════════════════════════════════════════════════════
    //  Reject endpoint tests
    // ═════════════════════════════════════════════════════

    [Fact]
    public async Task RejectTicket_AsAssignedUser_Returns200()
    {
        var (_, ticket) = await CreateAuthenticatedTicketAsync();

        // Login as Omar (LegalTeam) to reject
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var response = await client.PostAsJsonAsync(
            $"/api/tickets/{ticket.Id}/reject",
            new ActionRequest("Non-compliant"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<TicketResponse>();
        Assert.NotNull(result);
        Assert.Equal("Rejected", result.Status);
    }

    // ═════════════════════════════════════════════════════
    //  Cancel endpoint tests
    // ═════════════════════════════════════════════════════

    [Fact]
    public async Task CancelTicket_AsRequester_Returns200()
    {
        var (client, ticket) = await CreateAuthenticatedTicketAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/tickets/{ticket.Id}/cancel",
            new CancelRequest("No longer needed"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<TicketResponse>();
        Assert.NotNull(result);
        Assert.Equal("Cancelled", result.Status);
    }

    // ═════════════════════════════════════════════════════
    //  Approve on completed ticket
    // ═════════════════════════════════════════════════════

    [Fact]
    public async Task ApproveTicket_AlreadyRejected_Returns400()
    {
        var (_, ticket) = await CreateAuthenticatedTicketAsync();

        // Login as Omar (LegalTeam) to reject first
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        await client.PostAsJsonAsync(
            $"/api/tickets/{ticket.Id}/reject",
            new ActionRequest("Rejected"));

        // Now try to approve the rejected ticket
        var response = await client.PostAsJsonAsync(
            $"/api/tickets/{ticket.Id}/approve",
            new ActionRequest(null));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
```

### Step 8.2 — Run integration tests

```bash
dotnet test tests/Tixora.API.Tests --verbosity normal
```

### Step 8.3 — Commit

```bash
git add tests/Tixora.API.Tests/Controllers/TicketsControllerTests.cs
git commit -m "$(cat <<'EOF'
test: add integration tests for ticket action endpoints

Tests: approve returns 200, reject returns 200, cancel returns 200,
approve on rejected ticket returns 400. Uses seed data users with
role-appropriate authentication.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Build + Test Verification

### Step 9.1 — Full build

```bash
dotnet build src/Tixora.sln
```

### Step 9.2 — Run all tests

```bash
dotnet test --verbosity normal
```

### Step 9.3 — Verify no regressions

If tests fail, fix issues and create a new commit:

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: resolve test failures from ticket actions implementation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Summary

| Task | Files | What |
|------|-------|------|
| 1 | `Application/DTOs/Tickets/{ActionRequest,CancelRequest,ReassignRequest}.cs` | 3 new DTOs |
| 2 | `Application/Interfaces/IWorkflowEngine.cs` | 6 new method signatures |
| 3 | `Infrastructure/Services/WorkflowEngine.cs` | Helpers + ApproveStageAsync (with T-02 mid-workflow lifecycle) |
| 4 | `Infrastructure/Services/WorkflowEngine.cs` | Reject, ReturnForClarification, RespondToClarification, Cancel |
| 5 | `Infrastructure/Services/WorkflowEngine.cs` | ReassignAsync |
| 6 | `API/Controllers/TicketsController.cs` | 6 POST endpoints + shared helpers |
| 7 | `tests/.../WorkflowEngineTests.cs` | 16 unit tests covering all actions + full T-01 flow |
| 8 | `tests/.../TicketsControllerTests.cs` | 4 new integration tests for action endpoints |
| 9 | — | Build + test verification |

**Key design decisions:**
- `ActiveStatuses` HashSet for consistent "is ticket actionable?" checks
- `LoadTicketAsync` eagerly loads WorkflowDefinition.Stages + PartnerProduct.Partner + AssignedTo
- `BuildResponseFromTicket` derives stage name and assigned user from loaded navigation properties
- T-02 mid-workflow lifecycle detection: `TaskType==T02 AND StageOrder==2 AND StageType==Provisioning`
- ReassignAsync validates new assignee role matches the current stage's `AssignedRole`
- Cancel restricted to `Submitted` status only (pre-action)
- RespondToClarification restores status by deriving from current stage's `StageType`
