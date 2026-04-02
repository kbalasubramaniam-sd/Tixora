// File: tests/Tixora.API.Tests/Controllers/TicketsControllerQueryTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Common;
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

        var result = await response.Content.ReadFromJsonAsync<PagedResult<TicketSummaryResponse>>();
        Assert.NotNull(result);
        Assert.Contains(result.Items, t => t.TicketId == ticket.TicketId);
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

        var result = await response.Content.ReadFromJsonAsync<PagedResult<TicketSummaryResponse>>();
        Assert.NotNull(result);
        Assert.Empty(result.Items);
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
    public async Task GetTicketDetail_AsRequester_AllowedActionsIncludesCancel()
    {
        // Sarah creates ticket → she should see "cancel" (status is Submitted)
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        var response = await client.GetAsync($"/api/tickets/{ticket.Id}");
        var detail = await response.Content.ReadFromJsonAsync<TicketDetailResponse>();

        Assert.NotNull(detail);
        Assert.Contains("cancel", detail.AllowedActions);
        // Requester is not the assigned stage owner
        Assert.DoesNotContain("approve", detail.AllowedActions);
        Assert.DoesNotContain("reject", detail.AllowedActions);
    }

    [Fact]
    public async Task GetTicketDetail_AsAssignedOwner_AllowedActionsIncludesApproveRejectReturn()
    {
        // Create ticket as sarah → assigned to omar (LegalTeam, stage 1)
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        // Switch to omar
        var omarToken = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, omarToken);

        var response = await client.GetAsync($"/api/tickets/{ticket.Id}");
        var detail = await response.Content.ReadFromJsonAsync<TicketDetailResponse>();

        Assert.NotNull(detail);
        Assert.Contains("approve", detail.AllowedActions);
        Assert.Contains("reject", detail.AllowedActions);
        Assert.Contains("return", detail.AllowedActions);
        // Omar is not the requester
        Assert.DoesNotContain("cancel", detail.AllowedActions);
    }

    [Fact]
    public async Task GetTicketDetail_OnRejectedTicket_AllowedActionsEmpty()
    {
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        // Reject as omar
        var omarToken = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, omarToken);
        await client.PostAsJsonAsync($"/api/tickets/{ticket.Id}/reject",
            new ActionRequest(Comments: "Rejected"));

        // Check detail as sarah
        var sarahToken = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, sarahToken);

        var response = await client.GetAsync($"/api/tickets/{ticket.Id}");
        var detail = await response.Content.ReadFromJsonAsync<TicketDetailResponse>();

        Assert.NotNull(detail);
        Assert.Empty(detail.AllowedActions);
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
