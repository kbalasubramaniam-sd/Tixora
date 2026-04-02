using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.DTOs.Documents;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }

    [HttpGet("api/tickets/{ticketId:guid}/documents")]
    [ProducesResponseType(typeof(List<DocumentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocuments(Guid ticketId)
    {
        var documents = await _documentService.GetByTicketAsync(ticketId);
        return Ok(documents);
    }

    [HttpPost("api/tickets/{ticketId:guid}/documents")]
    [ProducesResponseType(typeof(DocumentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Upload(Guid ticketId, IFormFile file)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(new { message = "Invalid token." });

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "File is required." });

        try
        {
            using var stream = file.OpenReadStream();
            var doc = await _documentService.UploadAsync(
                ticketId, userId.Value, file.FileName, file.ContentType, file.Length, stream);
            return CreatedAtAction(nameof(Download), new { id = doc.Id }, doc);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("api/documents/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(Guid id)
    {
        var result = await _documentService.DownloadAsync(id);
        if (result is null)
            return NotFound(new { message = "Document not found." });

        var (content, fileName, contentType) = result.Value;
        return File(content, contentType, fileName);
    }
}
