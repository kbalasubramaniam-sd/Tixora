// File: tests/Tixora.API.Tests/Controllers/ProductsControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Products;

namespace Tixora.API.Tests.Controllers;

public class ProductsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ProductsControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetProducts_Returns4Products()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/products");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var products = await response.Content.ReadFromJsonAsync<List<ProductResponse>>();
        Assert.NotNull(products);
        Assert.Equal(4, products.Count);
    }
}
