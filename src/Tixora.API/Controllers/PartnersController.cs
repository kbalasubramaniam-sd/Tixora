// File: src/Tixora.API/Controllers/PartnersController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Partners;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PartnersController : ControllerBase
{
    private readonly ITixoraDbContext _db;

    public PartnersController(ITixoraDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Get all partners with their product associations.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<PartnerListResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll()
    {
        var partners = await _db.Partners
            .AsNoTracking()
            .Include(p => p.PartnerProducts)
                .ThenInclude(pp => pp.Product)
            .OrderBy(p => p.Name)
            .Select(p => new PartnerListResponse(
                p.Id,
                p.Name,
                p.Alias,
                p.PartnerProducts.Select(pp => new PartnerProductInfo(
                    pp.ProductCode.ToString(),
                    pp.Product.Name,
                    pp.LifecycleState.ToString(),
                    pp.CompanyCode
                )).ToList()))
            .ToListAsync();

        return Ok(partners);
    }
}
