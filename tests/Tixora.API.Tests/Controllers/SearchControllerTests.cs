using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Common;
using Tixora.Application.DTOs.Search;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class SearchControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public SearchControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> CreateAuthenticatedClient(string email = "sarah.ahmad@tixora.ae")
    {
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, email, "Password1!");
        TestHelpers.SetAuthToken(client, token);
        return client;
    }

    private async Task<string> CreateTicketAndGetId(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T01", PartnerId: AlAinInsuranceId,
            ProvisioningPath: null, IssueType: null, FormData: "{}"));
        response.EnsureSuccessStatusCode();
        var ticket = await response.Content.ReadFromJsonAsync<TicketResponse>();
        return ticket!.TicketId;
    }

    [Fact]
    public async Task GlobalSearch_ByTicketId_ReturnsTicket()
    {
        var client = await CreateAuthenticatedClient();
        var ticketId = await CreateTicketAndGetId(client);

        // Search by a fragment of the ticket ID (e.g., "SPM-RBT")
        var fragment = ticketId[..7]; // "SPM-RBT"
        var response = await client.GetAsync($"/api/search?q={fragment}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var results = await response.Content.ReadFromJsonAsync<List<SearchResultResponse>>();
        Assert.NotNull(results);
        Assert.NotEmpty(results);
        Assert.Contains(results, r => r.Type == "Ticket" && r.DisplayId == ticketId);
    }

    [Fact]
    public async Task GlobalSearch_ByPartnerName_ReturnsPartner()
    {
        var client = await CreateAuthenticatedClient();

        // "Al Ain" is a known seeded partner name
        var response = await client.GetAsync("/api/search?q=Al Ain");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var results = await response.Content.ReadFromJsonAsync<List<SearchResultResponse>>();
        Assert.NotNull(results);
        Assert.Contains(results, r => r.Type == "Partner");
    }

    [Fact]
    public async Task GlobalSearch_NoResults_ReturnsEmpty()
    {
        var client = await CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/search?q=zzzznonexistent999");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var results = await response.Content.ReadFromJsonAsync<List<SearchResultResponse>>();
        Assert.NotNull(results);
        Assert.Empty(results);
    }

    [Fact]
    public async Task AdvancedSearch_FilterByProduct_ReturnsPaginated()
    {
        var client = await CreateAuthenticatedClient();
        await CreateTicketAndGetId(client);

        var response = await client.PostAsJsonAsync("/api/search/advanced", new AdvancedSearchRequest(
            ProductCode: "RBT"
        ));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<PagedResult<TicketSummaryResponse>>();
        Assert.NotNull(result);
        Assert.True(result.TotalCount > 0);
        Assert.All(result.Items, t => Assert.Equal("RBT", t.ProductCode));
        Assert.Equal(1, result.Page);
        Assert.True(result.TotalPages >= 1);
    }

    [Fact]
    public async Task AdvancedSearch_NoFilters_ReturnsAll()
    {
        var client = await CreateAuthenticatedClient();
        await CreateTicketAndGetId(client);

        var response = await client.PostAsJsonAsync("/api/search/advanced", new AdvancedSearchRequest());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<PagedResult<TicketSummaryResponse>>();
        Assert.NotNull(result);
        Assert.True(result.TotalCount > 0);
        Assert.NotEmpty(result.Items);
    }
}
