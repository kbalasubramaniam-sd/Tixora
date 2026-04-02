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
