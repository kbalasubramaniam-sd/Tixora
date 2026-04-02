using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.DTOs.Admin;
using Tixora.Application.Interfaces;
using Tixora.Domain.Enums;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    private UserRole? GetCurrentUserRole()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        if (roleClaim != null && Enum.TryParse<UserRole>(roleClaim, out var role))
            return role;
        return null;
    }

    private IActionResult? RequireAdmin()
    {
        if (GetCurrentUserRole() != UserRole.SystemAdministrator)
            return Forbid();
        return null;
    }

    // --- SLA Config ---

    /// <summary>
    /// Get SLA configuration for all active workflows.
    /// </summary>
    [HttpGet("sla-config")]
    public async Task<IActionResult> GetSlaConfig()
    {
        if (RequireAdmin() is { } forbidden) return forbidden;
        var result = await _adminService.GetSlaConfigAsync();
        return Ok(result);
    }

    /// <summary>
    /// Update SLA business hours for specific stages.
    /// </summary>
    [HttpPut("sla-config")]
    public async Task<IActionResult> UpdateSlaConfig([FromBody] UpdateSlaConfigRequest request)
    {
        if (RequireAdmin() is { } forbidden) return forbidden;
        await _adminService.UpdateSlaConfigAsync(request);
        return NoContent();
    }

    // --- Business Hours ---

    /// <summary>
    /// Get business hours configuration for all 7 days.
    /// </summary>
    [HttpGet("business-hours")]
    public async Task<IActionResult> GetBusinessHours()
    {
        if (RequireAdmin() is { } forbidden) return forbidden;
        var result = await _adminService.GetBusinessHoursAsync();
        return Ok(result);
    }

    /// <summary>
    /// Update business hours configuration.
    /// </summary>
    [HttpPut("business-hours")]
    public async Task<IActionResult> UpdateBusinessHours([FromBody] UpdateBusinessHoursRequest request)
    {
        if (RequireAdmin() is { } forbidden) return forbidden;
        await _adminService.UpdateBusinessHoursAsync(request);
        return NoContent();
    }

    // --- Holidays ---

    /// <summary>
    /// List all holidays.
    /// </summary>
    [HttpGet("holidays")]
    public async Task<IActionResult> GetHolidays()
    {
        if (RequireAdmin() is { } forbidden) return forbidden;
        var result = await _adminService.GetHolidaysAsync();
        return Ok(result);
    }

    /// <summary>
    /// Add a new holiday.
    /// </summary>
    [HttpPost("holidays")]
    public async Task<IActionResult> CreateHoliday([FromBody] CreateHolidayRequest request)
    {
        if (RequireAdmin() is { } forbidden) return forbidden;
        var result = await _adminService.CreateHolidayAsync(request);
        return Created($"/api/admin/holidays/{result.Id}", result);
    }

    /// <summary>
    /// Remove a holiday.
    /// </summary>
    [HttpDelete("holidays/{id:guid}")]
    public async Task<IActionResult> DeleteHoliday(Guid id)
    {
        if (RequireAdmin() is { } forbidden) return forbidden;
        await _adminService.DeleteHolidayAsync(id);
        return NoContent();
    }

    // --- Delegates ---

    /// <summary>
    /// List active delegate approvers.
    /// </summary>
    [HttpGet("delegates")]
    public async Task<IActionResult> GetDelegates()
    {
        if (RequireAdmin() is { } forbidden) return forbidden;
        var result = await _adminService.GetDelegatesAsync();
        return Ok(result);
    }

    /// <summary>
    /// Create a delegate approver.
    /// </summary>
    [HttpPost("delegates")]
    public async Task<IActionResult> CreateDelegate([FromBody] CreateDelegateRequest request)
    {
        if (RequireAdmin() is { } forbidden) return forbidden;
        var result = await _adminService.CreateDelegateAsync(request);
        return Created($"/api/admin/delegates/{result.Id}", result);
    }

    /// <summary>
    /// Deactivate a delegate approver.
    /// </summary>
    [HttpDelete("delegates/{id:guid}")]
    public async Task<IActionResult> DeleteDelegate(Guid id)
    {
        if (RequireAdmin() is { } forbidden) return forbidden;
        await _adminService.DeleteDelegateAsync(id);
        return NoContent();
    }

    // --- Workflow Config ---

    /// <summary>
    /// Get all active workflow definitions with stages (read-only).
    /// </summary>
    [HttpGet("workflow-config")]
    public async Task<IActionResult> GetWorkflowConfig()
    {
        if (RequireAdmin() is { } forbidden) return forbidden;
        var result = await _adminService.GetWorkflowConfigAsync();
        return Ok(result);
    }
}
