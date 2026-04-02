using System.Text;
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Reports;
using Tixora.Application.Interfaces;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly ITixoraDbContext _db;

    public ReportService(ITixoraDbContext db)
    {
        _db = db;
    }

    public async Task<ReportOverviewResponse> GetOverviewAsync(DateTime? dateFrom, DateTime? dateTo)
    {
        var query = _db.Tickets.AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(t => t.CreatedAt >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(t => t.CreatedAt <= dateTo.Value);

        var tickets = await query.ToListAsync();

        var totalTickets = tickets.Count;
        var completedTickets = tickets.Count(t => t.Status == TicketStatus.Completed);
        var rejectedTickets = tickets.Count(t => t.Status == TicketStatus.Rejected);
        var cancelledTickets = tickets.Count(t => t.Status == TicketStatus.Cancelled);
        var openTickets = totalTickets - completedTickets - rejectedTickets - cancelledTickets;

        // SLA metrics from trackers
        var ticketIds = tickets.Select(t => t.Id).ToList();
        var trackers = await _db.SlaTrackers
            .Where(s => ticketIds.Contains(s.TicketId) && s.CompletedAtUtc != null)
            .ToListAsync();

        var totalCompletedTrackers = trackers.Count;
        var breachedTrackers = trackers.Count(s => s.Status == SlaStatus.Breached);
        var slaCompliancePercent = totalCompletedTrackers > 0
            ? Math.Round((double)(totalCompletedTrackers - breachedTrackers) / totalCompletedTrackers * 100, 1)
            : 100.0;

        // Breach count = tickets that had at least one breached tracker
        var slaBreachCount = await _db.SlaTrackers
            .Where(s => ticketIds.Contains(s.TicketId) && s.Status == SlaStatus.Breached)
            .Select(s => s.TicketId)
            .Distinct()
            .CountAsync();

        var avgResolutionHours = trackers.Count > 0
            ? Math.Round(trackers.Average(s => s.BusinessHoursElapsed), 1)
            : 0.0;

        var byProduct = tickets
            .GroupBy(t => t.ProductCode.ToString())
            .Select(g => new ProductBreakdown(g.Key, g.Count()))
            .OrderBy(b => b.ProductCode)
            .ToList();

        var byTaskType = tickets
            .GroupBy(t => t.TaskType.ToString())
            .Select(g => new TaskTypeBreakdown(g.Key, g.Count()))
            .OrderBy(b => b.TaskType)
            .ToList();

        var byStatus = tickets
            .GroupBy(t => t.Status.ToString())
            .Select(g => new StatusBreakdown(g.Key, g.Count()))
            .OrderBy(b => b.Status)
            .ToList();

        return new ReportOverviewResponse(
            TotalTickets: totalTickets,
            OpenTickets: openTickets,
            CompletedTickets: completedTickets,
            RejectedTickets: rejectedTickets,
            CancelledTickets: cancelledTickets,
            SlaCompliancePercent: slaCompliancePercent,
            SlaBreachCount: slaBreachCount,
            AvgResolutionHours: avgResolutionHours,
            ByProduct: byProduct,
            ByTaskType: byTaskType,
            ByStatus: byStatus
        );
    }

    public async Task<string> ExportCsvAsync(DateTime? dateFrom, DateTime? dateTo, string? productCode, string? taskType, string? status)
    {
        var query = _db.Tickets
            .Include(t => t.PartnerProduct)
                .ThenInclude(pp => pp.Partner)
            .Include(t => t.CreatedBy)
            .Include(t => t.SlaTrackers)
            .Include(t => t.WorkflowDefinition)
                .ThenInclude(w => w.Stages)
            .AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(t => t.CreatedAt >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(t => t.CreatedAt <= dateTo.Value);
        if (!string.IsNullOrWhiteSpace(productCode) && Enum.TryParse<ProductCode>(productCode, true, out var pc))
            query = query.Where(t => t.ProductCode == pc);
        if (!string.IsNullOrWhiteSpace(taskType) && Enum.TryParse<TaskType>(taskType, true, out var tt))
            query = query.Where(t => t.TaskType == tt);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<TicketStatus>(status, true, out var ts))
            query = query.Where(t => t.Status == ts);

        var tickets = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("TicketId,ProductCode,TaskType,PartnerName,RequesterName,Status,CurrentStage,SlaStatus,CreatedAt,UpdatedAt");

        foreach (var ticket in tickets)
        {
            var partnerName = EscapeCsv(ticket.PartnerProduct.Partner.Name);
            var requesterName = EscapeCsv(ticket.CreatedBy.FullName);
            var currentStage = ticket.WorkflowDefinition.Stages
                .FirstOrDefault(s => s.StageOrder == ticket.CurrentStageOrder)?.StageName ?? "";
            var slaStatus = GetOverallSlaStatus(ticket.SlaTrackers);

            sb.AppendLine(string.Join(",",
                EscapeCsv(ticket.TicketId),
                EscapeCsv(ticket.ProductCode.ToString()),
                EscapeCsv(ticket.TaskType.ToString()),
                partnerName,
                requesterName,
                EscapeCsv(ticket.Status.ToString()),
                EscapeCsv(currentStage),
                EscapeCsv(slaStatus),
                EscapeCsv(ticket.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")),
                EscapeCsv(ticket.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss"))
            ));
        }

        return sb.ToString();
    }

    private static string EscapeCsv(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }

    private static string GetOverallSlaStatus(ICollection<Domain.Entities.SlaTracker> trackers)
    {
        if (!trackers.Any())
            return "N/A";
        if (trackers.Any(t => t.Status == SlaStatus.Breached))
            return "Breached";
        if (trackers.Any(t => t.Status == SlaStatus.Critical))
            return "Critical";
        if (trackers.Any(t => t.Status == SlaStatus.AtRisk))
            return "AtRisk";
        return "OnTrack";
    }
}
