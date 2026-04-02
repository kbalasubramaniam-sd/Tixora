using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tixora.Application.DTOs.Search;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    /// <summary>
    /// Global search across tickets and partners.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GlobalSearch([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return BadRequest(new { message = "Search query must be at least 2 characters." });

        var results = await _searchService.GlobalSearchAsync(q.Trim());
        return Ok(results);
    }

    /// <summary>
    /// Advanced multi-filter search with pagination.
    /// </summary>
    [HttpPost("advanced")]
    public async Task<IActionResult> AdvancedSearch([FromBody] AdvancedSearchRequest request)
    {
        var results = await _searchService.AdvancedSearchAsync(request);
        return Ok(results);
    }
}
