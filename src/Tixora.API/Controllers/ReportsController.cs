using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Aggregated report metrics with optional date range filter.
    /// </summary>
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo)
    {
        var overview = await _reportService.GetOverviewAsync(dateFrom, dateTo);
        return Ok(overview);
    }

    /// <summary>
    /// Export tickets as CSV with optional filters.
    /// </summary>
    [HttpGet("export")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] string? productCode,
        [FromQuery] string? taskType,
        [FromQuery] string? status)
    {
        var csv = await _reportService.ExportCsvAsync(dateFrom, dateTo, productCode, taskType, status);
        var bytes = Encoding.UTF8.GetBytes(csv);
        var fileName = $"tickets-export-{DateTime.UtcNow:yyyyMMdd}.csv";
        return File(bytes, "text/csv", fileName);
    }
}
