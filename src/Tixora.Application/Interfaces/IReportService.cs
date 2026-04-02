using Tixora.Application.DTOs.Reports;

namespace Tixora.Application.Interfaces;

public interface IReportService
{
    Task<ReportOverviewResponse> GetOverviewAsync(DateTime? dateFrom, DateTime? dateTo);
    Task<string> ExportCsvAsync(DateTime? dateFrom, DateTime? dateTo, string? productCode, string? taskType, string? status);
}
