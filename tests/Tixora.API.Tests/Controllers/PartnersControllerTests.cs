// File: tests/Tixora.API.Tests/Controllers/PartnersControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Partners;

namespace Tixora.API.Tests.Controllers;

public class PartnersControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public PartnersControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetPartners_WithToken_Returns3Partners()
    {
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client);
        TestHelpers.SetAuthToken(client, token);

        var response = await client.GetAsync("/api/partners");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var partners = await response.Content.ReadFromJsonAsync<List<PartnerListResponse>>();
        Assert.NotNull(partners);
        Assert.Equal(3, partners.Count);
    }

    [Fact]
    public async Task GetPartners_WithoutToken_Returns401()
    {
        // Fresh client with no auth header — factory.CreateClient() has no default auth
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/partners");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
