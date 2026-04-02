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

        // 9b. Validate re-raise reference (if provided)
        if (request.RejectedTicketRef.HasValue)
        {
            var rejectedTicket = await _db.Tickets
                .FirstOrDefaultAsync(t => t.Id == request.RejectedTicketRef.Value);

            if (rejectedTicket is null)
                throw new InvalidOperationException("Referenced rejected ticket does not exist.");

            if (rejectedTicket.Status != TicketStatus.Rejected)
                throw new InvalidOperationException("Referenced ticket is not rejected. Only rejected tickets can be re-raised.");

            if (rejectedTicket.ProductCode != productCode || rejectedTicket.TaskType != taskType)
                throw new InvalidOperationException("Re-raised ticket must have the same product and task type as the rejected ticket.");
        }

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
            RejectedTicketRef = request.RejectedTicketRef,
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

        // 11b. Re-raise audit entry
        if (request.RejectedTicketRef.HasValue)
        {
            var rejectedTicketDisplayId = await _db.Tickets
                .Where(t => t.Id == request.RejectedTicketRef.Value)
                .Select(t => t.TicketId)
                .FirstOrDefaultAsync();

            _db.AuditEntries.Add(new AuditEntry
            {
                Id = Guid.CreateVersion7(),
                TicketId = ticket.Id,
                ActorUserId = createdByUserId,
                ActionType = "ReRaised",
                Details = $"Re-raised from rejected ticket {rejectedTicketDisplayId}.",
                TimestampUtc = now
            });
        }

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
}
