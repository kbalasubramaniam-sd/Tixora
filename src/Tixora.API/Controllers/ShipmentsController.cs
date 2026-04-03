using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.DTOs.Shipments;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Authorize]
[Route("api/shipments")]
public class ShipmentsController : ControllerBase
{
    private readonly IShipmentService _shipmentService;

    public ShipmentsController(IShipmentService shipmentService)
    {
        _shipmentService = shipmentService;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }

    [HttpPost("validate-address")]
    [ProducesResponseType(typeof(ValidateAddressResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateAddress([FromBody] ValidateAddressRequest request)
    {
        var result = await _shipmentService.ValidateAddressAsync(request);
        return Ok(result);
    }

    [HttpPost("book")]
    [ProducesResponseType(typeof(ShipmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Book([FromBody] BookShipmentRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token." });

        try
        {
            var shipment = await _shipmentService.BookShipmentAsync(request, userId.Value);
            return CreatedAtAction(nameof(GetByTicket), new { ticketId = shipment.TicketId }, shipment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("by-ticket/{ticketId:guid}")]
    [ProducesResponseType(typeof(ShipmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByTicket(Guid ticketId)
    {
        var shipment = await _shipmentService.GetByTicketAsync(ticketId);
        if (shipment is null)
            return NotFound(new { message = "No shipment found for this ticket." });

        return Ok(shipment);
    }

    [HttpGet("{id:guid}/label")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLabel(Guid id)
    {
        var result = await _shipmentService.GetLabelAsync(id);
        if (result is null)
            return NotFound(new { message = "Label not found." });

        var (content, fileName) = result.Value;
        return File(content, "application/pdf", fileName);
    }
}
