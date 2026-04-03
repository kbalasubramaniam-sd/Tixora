// File: src/Tixora.Infrastructure/Services/TicketQueryService.cs
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Tixora.Application.DTOs.Common;
using Tixora.Application.DTOs.Dashboard;
using Tixora.Application.DTOs.Tickets;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Services;

public class TicketQueryService : ITicketQueryService
{
    private readonly ITixoraDbContext _db;
    private readonly ISlaService _slaService;

    private static readonly TicketStatus[] TerminalStatuses =
        [TicketStatus.Completed, TicketStatus.Rejected, TicketStatus.Cancelled];

    public TicketQueryService(ITixoraDbContext db, ISlaService slaService)
    {
        _db = db;
        _slaService = slaService;
    }

    // ─── GetMyTicketsAsync ───────────────────────────────

    public async Task<PagedResult<TicketSummaryResponse>> GetMyTicketsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var baseQuery = _db.Tickets
            .AsNoTracking()
            .Include(t => t.PartnerProduct).ThenInclude(pp => pp.Partner)
            .Include(t => t.CreatedBy)
            .Include(t => t.WorkflowDefinition).ThenInclude(w => w.Stages)
            .Where(t => t.CreatedByUserId == userId);

        var totalCount = await baseQuery.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var tickets = await baseQuery
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                t.Id,
                t.TicketId,
                ProductCode = t.ProductCode.ToString(),
                TaskType = t.TaskType.ToString(),
                PartnerName = t.PartnerProduct.Partner.Name,
                RequesterName = t.CreatedBy.FullName,
                Status = t.Status.ToString(),
                CurrentStage = TerminalStatuses.Contains(t.Status) ? "" :
                    t.WorkflowDefinition.Stages
                        .Where(s => s.StageOrder == t.CurrentStageOrder)
                        .Select(s => s.StageName).FirstOrDefault() ?? "",
                t.CreatedAt,
                t.UpdatedAt
            })
            .ToListAsync();

        var slaMap = await GetSlaMapAsync(tickets.Select(t => t.Id).ToList());

        var items = tickets.Select(t =>
        {
            var (status, remaining) = slaMap.GetValueOrDefault(t.Id, (SlaStatus.OnTrack, 0));
            return new TicketSummaryResponse(
                t.Id.ToString(), t.TicketId, t.ProductCode, t.TaskType,
                t.PartnerName, t.RequesterName, t.Status, t.CurrentStage,
                status.ToString(), remaining, t.CreatedAt, t.UpdatedAt);
        }).ToList();

        return new PagedResult<TicketSummaryResponse>(items, totalCount, page, pageSize, totalPages);
    }

    // ─── GetTeamQueueAsync ───────────────────────────────

    public async Task<PagedResult<TicketSummaryResponse>> GetTeamQueueAsync(
        Guid userId, UserRole role, string? product, string? task, string? partner, string? requester, string? status,
        int page = 1, int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var query = _db.Tickets
            .AsNoTracking()
            .Include(t => t.PartnerProduct).ThenInclude(pp => pp.Partner)
            .Include(t => t.CreatedBy)
            .Include(t => t.WorkflowDefinition).ThenInclude(w => w.Stages)
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
        if (!string.IsNullOrEmpty(status) && status != "All" && Enum.TryParse<TicketStatus>(status, out var ts))
            query = query.Where(t => t.Status == ts);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        // Materializes to memory before pagination because SLA urgency ordering
        // uses an in-memory helper (SlaUrgencyOrder) that can't be translated to SQL.
        // Safety cap of 500 prevents loading unbounded results.
        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .Take(500)
            .Select(t => new
            {
                t.Id,
                t.TicketId,
                ProductCode = t.ProductCode.ToString(),
                TaskType = t.TaskType.ToString(),
                PartnerName = t.PartnerProduct.Partner.Name,
                RequesterName = t.CreatedBy.FullName,
                Status = t.Status.ToString(),
                CurrentStage = t.WorkflowDefinition.Stages
                    .Where(s => s.StageOrder == t.CurrentStageOrder)
                    .Select(s => s.StageName).FirstOrDefault() ?? "",
                t.CreatedAt,
                t.UpdatedAt
            })
            .ToListAsync();

        var slaMap = await GetSlaMapAsync(tickets.Select(t => t.Id).ToList());

        var items = tickets.Select(t =>
        {
            var (slaStatus, remaining) = slaMap.GetValueOrDefault(t.Id, (SlaStatus.OnTrack, 0));
            return new TicketSummaryResponse(
                t.Id.ToString(), t.TicketId, t.ProductCode, t.TaskType,
                t.PartnerName, t.RequesterName, t.Status, t.CurrentStage,
                slaStatus.ToString(), remaining, t.CreatedAt, t.UpdatedAt);
        })
        .OrderBy(t => SlaUrgencyOrder(t.SlaStatus))
        .ThenBy(t => t.SlaHoursRemaining)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToList();

        return new PagedResult<TicketSummaryResponse>(items, totalCount, page, pageSize, totalPages);
    }

    // ─── GetActionRequiredAsync ──────────────────────────

    public async Task<List<TicketSummaryResponse>> GetActionRequiredAsync(Guid userId, UserRole role)
    {
        var query = _db.Tickets
            .AsNoTracking()
            .Include(t => t.PartnerProduct).ThenInclude(pp => pp.Partner)
            .Include(t => t.CreatedBy)
            .Include(t => t.WorkflowDefinition).ThenInclude(w => w.Stages)
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

        // Materializes to memory because SLA urgency ordering uses an in-memory
        // helper (SlaUrgencyOrder) that can't be translated to SQL.
        // Safety cap of 500 prevents loading unbounded results.
        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .Take(500)
            .Select(t => new
            {
                t.Id,
                t.TicketId,
                ProductCode = t.ProductCode.ToString(),
                TaskType = t.TaskType.ToString(),
                PartnerName = t.PartnerProduct.Partner.Name,
                RequesterName = t.CreatedBy.FullName,
                Status = t.Status.ToString(),
                CurrentStage = t.WorkflowDefinition.Stages
                    .Where(s => s.StageOrder == t.CurrentStageOrder)
                    .Select(s => s.StageName).FirstOrDefault() ?? "",
                t.CreatedAt,
                t.UpdatedAt
            })
            .ToListAsync();

        var slaMap = await GetSlaMapAsync(tickets.Select(t => t.Id).ToList());

        return tickets.Select(t =>
        {
            var (slaStatus, remaining) = slaMap.GetValueOrDefault(t.Id, (SlaStatus.OnTrack, 0));
            return new TicketSummaryResponse(
                t.Id.ToString(), t.TicketId, t.ProductCode, t.TaskType,
                t.PartnerName, t.RequesterName, t.Status, t.CurrentStage,
                slaStatus.ToString(), remaining, t.CreatedAt, t.UpdatedAt);
        })
        .OrderBy(t => SlaUrgencyOrder(t.SlaStatus))
        .ThenBy(t => t.SlaHoursRemaining)
        .Take(5)
        .ToList();
    }

    // ─── GetDashboardStatsAsync ──────────────────────────

    public async Task<DashboardStatsResponse> GetDashboardStatsAsync(Guid userId, UserRole role)
    {
        // Build role-scoped ticket filter as an IQueryable (stays as SQL subquery)
        var scopedTickets = _db.Tickets.AsNoTracking()
            .Where(t => !TerminalStatuses.Contains(t.Status));

        if (role == UserRole.PartnershipTeam)
            scopedTickets = scopedTickets.Where(t => t.CreatedByUserId == userId);
        else if (role != UserRole.SystemAdministrator)
            scopedTickets = scopedTickets.Where(t => t.WorkflowDefinition.Stages.Any(s => s.AssignedRole == role));

        // Sequential: DbContext is not thread-safe, can't use Task.WhenAll
        var openCount = await scopedTickets.CountAsync();

        // Single query for all SLA stats: breach count, compliance, avg resolution
        var sla = await _db.SlaTrackers.AsNoTracking()
            .Where(s => role == UserRole.PartnershipTeam
                ? s.Ticket.CreatedByUserId == userId
                : role == UserRole.SystemAdministrator
                    ? true
                    : s.Ticket.WorkflowDefinition.Stages.Any(st => st.AssignedRole == role))
            .GroupBy(_ => 1)
            .Select(g => new
            {
                BreachCount = g.Count(s => s.IsActive && s.Status == SlaStatus.Breached),
                TotalCompleted = g.Count(s => !s.IsActive && s.CompletedAtUtc != null),
                CompliantCount = g.Count(s => !s.IsActive && s.CompletedAtUtc != null && s.Status != SlaStatus.Breached),
                AvgHours = g.Where(s => !s.IsActive && s.CompletedAtUtc != null)
                    .Average(s => (double?)s.BusinessHoursElapsed)
            })
            .FirstOrDefaultAsync();

        var breachCount = sla?.BreachCount ?? 0;
        var totalCompleted = sla?.TotalCompleted ?? 0;
        var compliantCount = sla?.CompliantCount ?? 0;
        var compliancePercent = totalCompleted > 0
            ? Math.Round((double)compliantCount / totalCompleted * 100, 1)
            : 100.0;
        var avgHours = sla?.AvgHours != null ? Math.Round(sla.AvgHours.Value, 1) : 0.0;
        var avgDisplay = totalCompleted > 0 ? $"{avgHours}h" : "—";

        return new DashboardStatsResponse(
            Stat1: new StatEntryResponse("Open Tickets", openCount, "inbox", "bg-primary-container/10", "text-primary", "Active", "text-xs font-bold text-primary"),
            Stat2: new StatEntryResponse("SLA Breaches", breachCount, "warning", "bg-error-container/20", "text-error",
                breachCount > 0 ? "ALERT" : null,
                breachCount > 0 ? "bg-error text-white px-2 py-0.5 rounded text-[10px] font-bold" : null,
                breachCount > 0 ? "text-error" : null),
            Stat3: new StatEntryResponse("SLA Compliance", $"{compliancePercent}%", "verified", "bg-success-container/30", "text-success", "Rate"),
            Stat4: new StatEntryResponse("Avg Resolution", avgDisplay, "schedule", "bg-secondary-container/30", "text-secondary", "Avg")
        );
    }

    // ─── GetRecentActivityAsync ──────────────────────────

    public async Task<List<ActivityEntryResponse>> GetRecentActivityAsync(Guid userId)
    {
        // Single query: filter audit entries where the user is involved via subqueries (no memory materialization)
        var entries = await _db.AuditEntries.AsNoTracking()
            .Where(a =>
                _db.Tickets.Any(t => t.Id == a.TicketId && (t.CreatedByUserId == userId || t.AssignedToUserId == userId))
                || _db.StageLogs.Any(sl => sl.TicketId == a.TicketId && sl.ActorUserId == userId))
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
        "TicketCompleted" => "Ticket Completed",
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

    public async Task<TicketDetailResponse?> GetTicketDetailAsync(Guid ticketId, Guid actorUserId, UserRole actorRole)
    {
        var ticket = await _db.Tickets
            .AsNoTracking()
            .AsSplitQuery()
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

        // Resolve re-raise reference display ID
        string? rejectedTicketRef = null;
        if (ticket.RejectedTicketRef.HasValue)
        {
            rejectedTicketRef = await _db.Tickets.AsNoTracking()
                .Where(t => t.Id == ticket.RejectedTicketRef.Value)
                .Select(t => t.TicketId)
                .FirstOrDefaultAsync();
        }

        // Compute allowed actions for the current user
        var allowedActions = ComputeAllowedActions(ticket, actorUserId, actorRole);

        // Get real SLA data
        var (slaStatus, slaHoursRemaining) = await _slaService.GetCurrentSlaAsync(ticket.Id);

        return new TicketDetailResponse(
            Id: ticket.Id.ToString(),
            TicketId: ticket.TicketId,
            ProductCode: ticket.ProductCode.ToString(),
            TaskType: ticket.TaskType.ToString(),
            PartnerName: ticket.PartnerProduct.Partner.Name,
            RequesterName: ticket.CreatedBy.FullName,
            Status: ticket.Status.ToString(),
            CurrentStage: currentStageName,
            SlaStatus: slaStatus.ToString(),
            SlaHoursRemaining: slaHoursRemaining,
            CreatedAt: ticket.CreatedAt,
            UpdatedAt: ticket.UpdatedAt,
            CompanyCode: ticket.PartnerProduct.CompanyCode ?? "",
            FormData: formData,
            Documents: [],
            WorkflowStages: stages.ToArray(),
            Comments: [],
            AuditTrail: auditTrail,
            Clarification: clarification,
            AssignedTo: ticket.AssignedTo?.FullName,
            CreatedBy: ticket.CreatedBy.FullName,
            AccessPath: accessPath,
            LifecycleState: ticket.PartnerProduct.LifecycleState.ToString(),
            AllowedActions: allowedActions,
            RejectedTicketRef: rejectedTicketRef
        );
    }

    private async Task<Dictionary<Guid, (SlaStatus Status, double HoursRemaining)>> GetSlaMapAsync(List<Guid> ticketIds)
    {
        if (ticketIds.Count == 0) return new();

        var activeTrackers = await _db.SlaTrackers
            .AsNoTracking()
            .Where(s => s.IsActive && ticketIds.Contains(s.TicketId))
            .Select(s => new { s.TicketId, s.Status, s.TargetBusinessHours, s.BusinessHoursElapsed })
            .ToListAsync();

        return activeTrackers.ToDictionary(
            t => t.TicketId,
            t => (t.Status, Math.Max(0, Math.Round(t.TargetBusinessHours - t.BusinessHoursElapsed, 2))));
    }

    private static string[] ComputeAllowedActions(Ticket ticket, Guid actorUserId, UserRole actorRole)
    {
        var actions = new List<string>();

        // Terminal tickets — no actions allowed
        if (TerminalStatuses.Contains(ticket.Status))
            return [];

        // Assigned stage owner can approve, reject, return for clarification
        if (ticket.AssignedToUserId == actorUserId)
        {
            actions.Add("approve");
            actions.Add("reject");
            actions.Add("return");
        }

        // Original requester actions
        if (ticket.CreatedByUserId == actorUserId)
        {
            if (ticket.Status == TicketStatus.Submitted)
                actions.Add("cancel");

            if (ticket.Status == TicketStatus.PendingRequesterAction)
                actions.Add("respond");
        }

        // System administrators can reassign
        if (actorRole == UserRole.SystemAdministrator)
            actions.Add("reassign");

        return actions.ToArray();
    }

    private static string GetStageIcon(StageType stageType) => stageType switch
    {
        StageType.Review => "rate_review",
        StageType.Approval => "verified",
        StageType.Provisioning => "settings",
        StageType.PhaseGate => "flag",
        _ => "circle"
    };

    private static int SlaUrgencyOrder(string slaStatus) => slaStatus switch
    {
        nameof(SlaStatus.Breached) => 0,
        nameof(SlaStatus.Critical) => 1,
        nameof(SlaStatus.AtRisk) => 2,
        nameof(SlaStatus.OnTrack) => 3,
        _ => 4
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
