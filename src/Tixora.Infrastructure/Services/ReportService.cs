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
        var query = _db.Tickets.AsNoTracking().AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(t => t.CreatedAt >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(t => t.CreatedAt <= dateTo.Value);

        // Server-side counts
        var totalTickets = await query.CountAsync();
        var completedTickets = await query.CountAsync(t => t.Status == TicketStatus.Completed);
        var rejectedTickets = await query.CountAsync(t => t.Status == TicketStatus.Rejected);
        var cancelledTickets = await query.CountAsync(t => t.Status == TicketStatus.Cancelled);
        var openTickets = totalTickets - completedTickets - rejectedTickets - cancelledTickets;

        // Server-side groupings — group by enum, project count, then map to string after materialization
        var byProduct = (await query
            .GroupBy(t => t.ProductCode)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync())
            .Select(g => new ProductBreakdown(g.Key.ToString(), g.Count))
            .OrderBy(b => b.ProductCode)
            .ToList();

        var byTaskType = (await query
            .GroupBy(t => t.TaskType)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync())
            .Select(g => new TaskTypeBreakdown(g.Key.ToString(), g.Count))
            .OrderBy(b => b.TaskType)
            .ToList();

        var byStatus = (await query
            .GroupBy(t => t.Status)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync())
            .Select(g => new StatusBreakdown(g.Key.ToString(), g.Count))
            .OrderBy(b => b.Status)
            .ToList();

        // Only materialize ticket IDs for SLA lookups
        var ticketIds = await query.Select(t => t.Id).ToListAsync();

        // SLA metrics from trackers — server-side aggregation
        var slaQuery = _db.SlaTrackers.AsNoTracking()
            .Where(s => ticketIds.Contains(s.TicketId) && s.CompletedAtUtc != null);

        var totalCompletedTrackers = await slaQuery.CountAsync();
        var breachedTrackers = await slaQuery.CountAsync(s => s.Status == SlaStatus.Breached);
        var slaCompliancePercent = totalCompletedTrackers > 0
            ? Math.Round((double)(totalCompletedTrackers - breachedTrackers) / totalCompletedTrackers * 100, 1)
            : 100.0;

        // Breach count = tickets that had at least one breached tracker
        var slaBreachCount = await _db.SlaTrackers.AsNoTracking()
            .Where(s => ticketIds.Contains(s.TicketId) && s.Status == SlaStatus.Breached)
            .Select(s => s.TicketId)
            .Distinct()
            .CountAsync();

        var avgResolutionHours = totalCompletedTrackers > 0
            ? Math.Round(await slaQuery.AverageAsync(s => s.BusinessHoursElapsed), 1)
            : 0.0;

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
        var query = _db.Tickets.AsNoTracking().AsQueryable();

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

        var rows = await query
            .OrderByDescending(t => t.CreatedAt)
            .Take(10000)
            .Select(t => new
            {
                t.TicketId,
                ProductCode = t.ProductCode.ToString(),
                TaskType = t.TaskType.ToString(),
                PartnerName = t.PartnerProduct.Partner.Name,
                RequesterName = t.CreatedBy.FullName,
                Status = t.Status.ToString(),
                CurrentStage = t.WorkflowDefinition.Stages
                    .Where(s => s.StageOrder == t.CurrentStageOrder)
                    .Select(s => s.StageName).FirstOrDefault() ?? "",
                SlaStatus = t.SlaTrackers.Any(s => s.IsActive && s.Status == SlaStatus.Breached) ? "Breached" :
                            t.SlaTrackers.Any(s => s.IsActive && s.Status == SlaStatus.Critical) ? "Critical" :
                            t.SlaTrackers.Any(s => s.IsActive && s.Status == SlaStatus.AtRisk) ? "AtRisk" : "OnTrack",
                CreatedAt = t.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                UpdatedAt = t.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss")
            })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("TicketId,ProductCode,TaskType,PartnerName,RequesterName,Status,CurrentStage,SlaStatus,CreatedAt,UpdatedAt");

        foreach (var r in rows)
        {
            sb.AppendLine(string.Join(",",
                EscapeCsv(r.TicketId),
                EscapeCsv(r.ProductCode),
                EscapeCsv(r.TaskType),
                EscapeCsv(r.PartnerName),
                EscapeCsv(r.RequesterName),
                EscapeCsv(r.Status),
                EscapeCsv(r.CurrentStage),
                EscapeCsv(r.SlaStatus),
                EscapeCsv(r.CreatedAt),
                EscapeCsv(r.UpdatedAt)
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
}
