// File: tests/Tixora.API.Tests/Controllers/DashboardControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Dashboard;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class DashboardControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public DashboardControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> CreateClientWithTicket()
    {
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        await client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T01", PartnerId: AlAinInsuranceId,
            ProvisioningPath: null, IssueType: null, FormData: "{}"));

        return client;
    }

    [Fact]
    public async Task GetStats_AsPartnershipTeam_Returns4Stats()
    {
        var client = await CreateClientWithTicket();

        var response = await client.GetAsync("/api/dashboard/stats");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var stats = await response.Content.ReadFromJsonAsync<DashboardStatsResponse>();
        Assert.NotNull(stats);
        Assert.Equal("My Open Requests", stats.Stat1.Label);
        Assert.Equal("Pending My Action", stats.Stat2.Label);
        Assert.Equal("Completed This Month", stats.Stat3.Label);
        Assert.Equal("Avg Resolution Time", stats.Stat4.Label);
    }

    [Fact]
    public async Task GetStats_AsAdmin_ReturnsTotalOpenTickets()
    {
        var client = _factory.CreateClient();
        var sarahToken = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, sarahToken);
        await client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T01", PartnerId: AlAinInsuranceId,
            ProvisioningPath: null, IssueType: null, FormData: "{}"));

        var adminToken = await TestHelpers.GetAuthTokenAsync(client, "admin@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, adminToken);

        var response = await client.GetAsync("/api/dashboard/stats");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var stats = await response.Content.ReadFromJsonAsync<DashboardStatsResponse>();
        Assert.NotNull(stats);
        Assert.Equal("Total Open Tickets", stats.Stat1.Label);
    }

    [Fact]
    public async Task GetActionRequired_ReturnsAssignedTickets()
    {
        var client = await CreateClientWithTicket();

        var omarToken = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, omarToken);

        var response = await client.GetAsync("/api/dashboard/action-required");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tickets = await response.Content.ReadFromJsonAsync<List<TicketSummaryResponse>>();
        Assert.NotNull(tickets);
        Assert.NotEmpty(tickets);
        Assert.All(tickets, t => Assert.NotEmpty(t.TicketId));
    }

    [Fact]
    public async Task GetActivity_ReturnsRecentEntries()
    {
        var client = await CreateClientWithTicket();

        var response = await client.GetAsync("/api/dashboard/activity");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var activity = await response.Content.ReadFromJsonAsync<List<ActivityEntryResponse>>();
        Assert.NotNull(activity);
        Assert.NotEmpty(activity);
        Assert.All(activity, a =>
        {
            Assert.NotEmpty(a.Title);
            Assert.NotEmpty(a.Icon);
        });
    }

    [Fact]
    public async Task GetTeamQueue_AsLegalTeam_ReturnsVisibleTickets()
    {
        var client = await CreateClientWithTicket();

        var omarToken = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, omarToken);

        var response = await client.GetAsync("/api/dashboard/team-queue");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tickets = await response.Content.ReadFromJsonAsync<List<TicketSummaryResponse>>();
        Assert.NotNull(tickets);
        Assert.NotEmpty(tickets);
    }

    [Fact]
    public async Task GetTeamQueue_WithProductFilter_FiltersResults()
    {
        var client = await CreateClientWithTicket();

        var adminToken = await TestHelpers.GetAuthTokenAsync(client, "admin@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, adminToken);

        var response = await client.GetAsync("/api/dashboard/team-queue?product=WTQ");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tickets = await response.Content.ReadFromJsonAsync<List<TicketSummaryResponse>>();
        Assert.NotNull(tickets);
        Assert.Empty(tickets);
    }

    [Fact]
    public async Task GetStats_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/dashboard/stats");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
