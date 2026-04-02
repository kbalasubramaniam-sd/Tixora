// File: src/Tixora.Infrastructure/Services/TicketQueryService.cs
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
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

    // ─── Stubs (implemented in later tasks) ──────────────

    public Task<DashboardStatsResponse> GetDashboardStatsAsync(Guid userId, UserRole role)
        => throw new NotImplementedException();

    public Task<List<ActivityEntryResponse>> GetRecentActivityAsync(Guid userId)
        => throw new NotImplementedException();

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

                if (sd.StageOrder < ticket.CurrentStageOrder || (isTerminal && sd.StageOrder <= ticket.CurrentStageOrder))
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
        try { formData = JsonSerializer.Deserialize<JsonElement>(ticket.FormData); }
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
}
