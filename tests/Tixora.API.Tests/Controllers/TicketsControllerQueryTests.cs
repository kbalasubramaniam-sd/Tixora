// File: tests/Tixora.API.Tests/Controllers/TicketsControllerQueryTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class TicketsControllerQueryTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public TicketsControllerQueryTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<TicketResponse> CreateT01TicketAsync(HttpClient client)
    {
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{\"agreementNumber\": \"AGR-QUERY-TEST\"}"
        );

        var response = await client.PostAsJsonAsync("/api/tickets", request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TicketResponse>())!;
    }

    [Fact]
    public async Task GetMyTickets_AsSarah_ReturnsCreatedTickets()
    {
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        var response = await client.GetAsync("/api/tickets/my");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tickets = await response.Content.ReadFromJsonAsync<List<TicketSummaryResponse>>();
        Assert.NotNull(tickets);
        Assert.Contains(tickets, t => t.TicketId == ticket.TicketId);
    }

    [Fact]
    public async Task GetMyTickets_AsOmar_DoesNotReturnSarahTickets()
    {
        var client = _factory.CreateClient();
        await CreateT01TicketAsync(client);

        var omarToken = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, omarToken);

        var response = await client.GetAsync("/api/tickets/my");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tickets = await response.Content.ReadFromJsonAsync<List<TicketSummaryResponse>>();
        Assert.NotNull(tickets);
        Assert.Empty(tickets);
    }

    [Fact]
    public async Task GetTicketDetail_ReturnsFullDetail()
    {
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        var response = await client.GetAsync($"/api/tickets/{ticket.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var detail = await response.Content.ReadFromJsonAsync<TicketDetailResponse>();
        Assert.NotNull(detail);
        Assert.Equal(ticket.TicketId, detail.TicketId);
        Assert.Equal("RBT", detail.ProductCode);
        Assert.Equal("T01", detail.TaskType);
        Assert.Equal("Al Ain Insurance", detail.PartnerName);
        Assert.Equal("Sarah Ahmad", detail.CreatedBy);
        Assert.NotEmpty(detail.WorkflowStages);
        Assert.NotEmpty(detail.AuditTrail);
        Assert.Equal("None", detail.LifecycleState);
    }

    [Fact]
    public async Task GetTicketDetail_NonExistent_Returns404()
    {
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var response = await client.GetAsync($"/api/tickets/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetMyTickets_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/tickets/my");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
