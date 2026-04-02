// File: src/Tixora.API/Controllers/DashboardController.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.Interfaces;
using Tixora.Domain.Enums;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ITicketQueryService _queryService;

    public DashboardController(ITicketQueryService queryService)
    {
        _queryService = queryService;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }

    private UserRole? GetCurrentUserRole()
    {
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        if (roleClaim is null || !int.TryParse(roleClaim, out var roleInt))
            return null;
        return (UserRole)roleInt;
    }

    /// <summary>
    /// Dashboard stat cards — role-specific metrics.
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        if (userId is null || role is null)
            return Unauthorized(new { message = "Invalid token." });

        var stats = await _queryService.GetDashboardStatsAsync(userId.Value, role.Value);
        return Ok(stats);
    }

    /// <summary>
    /// Tickets requiring the current user's action.
    /// </summary>
    [HttpGet("action-required")]
    public async Task<IActionResult> GetActionRequired()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        if (userId is null || role is null)
            return Unauthorized(new { message = "Invalid token." });

        var tickets = await _queryService.GetActionRequiredAsync(userId.Value, role.Value);
        return Ok(tickets);
    }

    /// <summary>
    /// Recent activity for tickets the user is involved in.
    /// </summary>
    [HttpGet("activity")]
    public async Task<IActionResult> GetActivity()
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token." });

        var activity = await _queryService.GetRecentActivityAsync(userId.Value);
        return Ok(activity);
    }

    /// <summary>
    /// Team queue — tickets visible to current user's role, with optional filters.
    /// </summary>
    [HttpGet("team-queue")]
    public async Task<IActionResult> GetTeamQueue(
        [FromQuery] string? product,
        [FromQuery] string? task,
        [FromQuery] string? slaStatus,
        [FromQuery] string? partner,
        [FromQuery] string? requester,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        if (userId is null || role is null)
            return Unauthorized(new { message = "Invalid token." });

        var result = await _queryService.GetTeamQueueAsync(userId.Value, role.Value, product, task, partner, requester, status, page, pageSize);
        return Ok(result);
    }
}
