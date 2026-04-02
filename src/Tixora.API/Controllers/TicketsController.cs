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

    // ─────────────────────────────────────────────────────
    //  Shared: Extract userId from JWT sub claim
    // ─────────────────────────────────────────────────────

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }

    // ─────────────────────────────────────────────────────
    //  Shared: Extract role from JWT
    // ─────────────────────────────────────────────────────

    private UserRole? GetCurrentUserRole()
    {
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        if (roleClaim is null || !int.TryParse(roleClaim, out var roleInt))
            return null;
        return (UserRole)roleInt;
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
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        var role = GetCurrentUserRole();
        if (role is null)
            return Unauthorized(new { message = "Invalid token: missing role claim." });

        if (role != UserRole.PartnershipTeam && role != UserRole.SystemAdministrator)
            return Forbid();

        try
        {
            var response = await _workflowEngine.CreateTicketAsync(request, userId.Value);
            return CreatedAtAction(nameof(Create), new { id = response.Id }, response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Approve the current stage. Advances to next stage or completes the ticket.
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ActionRequest? request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        try
        {
            var response = await _workflowEngine.ApproveStageAsync(id, userId.Value, request?.Comments);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Reject the ticket (terminal). Only the assigned stage owner can reject.
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Reject(Guid id, [FromBody] ActionRequest? request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        try
        {
            var response = await _workflowEngine.RejectAsync(id, userId.Value, request?.Comments);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Return ticket to requester for clarification.
    /// </summary>
    [HttpPost("{id:guid}/return")]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ReturnForClarification(Guid id, [FromBody] ActionRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        if (string.IsNullOrWhiteSpace(request.Comments))
            return BadRequest(new { message = "Comments are required when returning for clarification." });

        try
        {
            var response = await _workflowEngine.ReturnForClarificationAsync(id, userId.Value, request.Comments);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Requester responds to a clarification request.
    /// </summary>
    [HttpPost("{id:guid}/respond")]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RespondToClarification(Guid id, [FromBody] ActionRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        if (string.IsNullOrWhiteSpace(request.Comments))
            return BadRequest(new { message = "Comments are required when responding to clarification." });

        try
        {
            var response = await _workflowEngine.RespondToClarificationAsync(id, userId.Value, request.Comments);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cancel a ticket. Only allowed when status is Submitted.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest(new { message = "Cancellation reason is required." });

        try
        {
            var response = await _workflowEngine.CancelAsync(id, userId.Value, request.Reason);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Reassign the ticket to a different user within the same role.
    /// </summary>
    [HttpPost("{id:guid}/reassign")]
    [Authorize]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Reassign(Guid id, [FromBody] ReassignRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token: missing sub claim." });

        try
        {
            var response = await _workflowEngine.ReassignAsync(id, userId.Value, request.NewAssigneeUserId);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
