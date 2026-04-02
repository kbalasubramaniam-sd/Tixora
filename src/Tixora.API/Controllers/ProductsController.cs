// File: src/Tixora.API/Controllers/ProductsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Products;
using Tixora.Application.Interfaces;

namespace Tixora.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ITixoraDbContext _db;

    public ProductsController(ITixoraDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Get all products.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var products = await _db.Products
            .AsNoTracking()
            .OrderBy(p => p.Code)
            .Select(p => new ProductResponse(
                p.Code.ToString(),
                p.Name,
                p.Description,
                p.PortalType.ToString()))
            .ToListAsync();

        return Ok(products);
    }
}
