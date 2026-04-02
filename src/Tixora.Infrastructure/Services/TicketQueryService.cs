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

    public Task<TicketDetailResponse?> GetTicketDetailAsync(Guid ticketId)
        => throw new NotImplementedException();
}
