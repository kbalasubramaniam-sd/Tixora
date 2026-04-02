using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Common;
using Tixora.Application.DTOs.Search;
using Tixora.Application.DTOs.Tickets;
using Tixora.Application.Interfaces;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Services;

public class SearchService : ISearchService
{
    private readonly ITixoraDbContext _db;

    private static readonly TicketStatus[] TerminalStatuses =
        [TicketStatus.Completed, TicketStatus.Rejected, TicketStatus.Cancelled];

    public SearchService(ITixoraDbContext db)
    {
        _db = db;
    }

    public async Task<List<SearchResultResponse>> GlobalSearchAsync(string query)
    {
        var results = new List<SearchResultResponse>();

        // Search tickets by TicketId
        var ticketResults = await _db.Tickets
            .AsNoTracking()
            .Where(t => t.TicketId.Contains(query))
            .OrderByDescending(t => t.CreatedAt)
            .Take(20)
            .Select(t => new SearchResultResponse(
                "Ticket",
                t.Id.ToString(),
                t.TicketId,
                $"{t.PartnerProduct.Partner.Name} — {t.TaskType.ToString()}",
                $"{t.Status.ToString()} | {(TerminalStatuses.Contains(t.Status) ? "" : t.WorkflowDefinition.Stages.Where(s => s.StageOrder == t.CurrentStageOrder).Select(s => s.StageName).FirstOrDefault() ?? "")}"
            ))
            .ToListAsync();

        results.AddRange(ticketResults);

        // Search partners by Name or Alias
        var partnerResults = await _db.Partners
            .AsNoTracking()
            .Where(p => p.Name.Contains(query) || (p.Alias != null && p.Alias.Contains(query)))
            .OrderBy(p => p.Name)
            .Take(20 - results.Count)
            .Select(p => new SearchResultResponse(
                "Partner",
                p.Id.ToString(),
                p.Name,
                p.Name,
                $"{(p.Alias ?? "")} | {p.PartnerProducts.Count} products"
            ))
            .ToListAsync();

        results.AddRange(partnerResults);

        return results.Take(20).ToList();
    }

    public async Task<PagedResult<TicketSummaryResponse>> AdvancedSearchAsync(AdvancedSearchRequest request)
    {
        var query = _db.Tickets.AsNoTracking().AsQueryable();

        // Apply filters conditionally
        if (!string.IsNullOrEmpty(request.ProductCode) && Enum.TryParse<ProductCode>(request.ProductCode, out var pc))
            query = query.Where(t => t.ProductCode == pc);

        if (!string.IsNullOrEmpty(request.TaskType) && Enum.TryParse<TaskType>(request.TaskType, out var tt))
            query = query.Where(t => t.TaskType == tt);

        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<TicketStatus>(request.Status, out var ts))
            query = query.Where(t => t.Status == ts);

        if (request.AssignedTo.HasValue)
            query = query.Where(t => t.AssignedToUserId == request.AssignedTo.Value);

        if (request.PartnerId.HasValue)
            query = query.Where(t => t.PartnerProduct.Partner.Id == request.PartnerId.Value);

        if (request.DateFrom.HasValue)
            query = query.Where(t => t.CreatedAt >= request.DateFrom.Value);

        if (request.DateTo.HasValue)
            query = query.Where(t => t.CreatedAt <= request.DateTo.Value);

        // Pre-filter by SLA status before counting/paginating
        if (!string.IsNullOrEmpty(request.SlaStatus) && Enum.TryParse<SlaStatus>(request.SlaStatus, out var slaFilter))
        {
            var slaMatchedIds = await _db.SlaTrackers
                .AsNoTracking()
                .Where(s => s.IsActive && s.Status == slaFilter)
                .Select(s => s.TicketId)
                .Distinct()
                .ToListAsync();

            query = query.Where(t => slaMatchedIds.Contains(t.Id));
        }

        var totalCount = await query.CountAsync();

        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var page = Math.Max(1, request.Page);
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var tickets = await query
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

        // Get SLA data for the page of tickets
        var ticketIds = tickets.Select(t => t.Id).ToList();
        var slaMap = await GetSlaMapAsync(ticketIds);

        var items = tickets.Select(t =>
        {
            var (slaStatus, remaining) = slaMap.GetValueOrDefault(t.Id, (SlaStatus.OnTrack, 0));
            return new TicketSummaryResponse(
                t.Id.ToString(), t.TicketId, t.ProductCode, t.TaskType,
                t.PartnerName, t.RequesterName, t.Status, t.CurrentStage,
                slaStatus.ToString(), remaining, t.CreatedAt, t.UpdatedAt);
        }).ToList();

        return new PagedResult<TicketSummaryResponse>(
            Items: items,
            TotalCount: totalCount,
            Page: page,
            PageSize: pageSize,
            TotalPages: totalPages
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
}
