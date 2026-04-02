// File: src/Tixora.API/Controllers/TicketsController.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.DTOs.Tickets;
using Tixora.Application.Interfaces;
using Tixora.Domain.Enums;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly IWorkflowEngine _workflowEngine;

    public TicketsController(IWorkflowEngine workflowEngine)
    {
        _workflowEngine = workflowEngine;
    }

    /// <summary>
    /// Create a new ticket. Only PartnershipTeam and SystemAdministrator roles are allowed.
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest request)
    {
        // Extract userId from JWT "sub" claim
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        // Extract role from JWT and validate authorization
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        if (roleClaim is null || !int.TryParse(roleClaim, out var roleInt))
            return Unauthorized(new { message = "Invalid token: missing role claim." });

        var role = (UserRole)roleInt;
        if (role != UserRole.PartnershipTeam && role != UserRole.SystemAdministrator)
            return Forbid();

        try
        {
            var response = await _workflowEngine.CreateTicketAsync(request, userId);
            return CreatedAtAction(nameof(Create), new { id = response.Id }, response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
