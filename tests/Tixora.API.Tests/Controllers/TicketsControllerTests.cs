// File: tests/Tixora.API.Tests/Controllers/TicketsControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class TicketsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    // Known seed data IDs from SeedPartners.cs
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public TicketsControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateTicket_ValidT01_Returns201()
    {
        // Arrange — login as Sarah Ahmad (PartnershipTeam)
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{\"agreementNumber\": \"AGR-001\"}"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/tickets", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<TicketResponse>();
        Assert.NotNull(result);
        Assert.Equal("RBT", result.ProductCode);
        Assert.Equal("T01", result.TaskType);
        Assert.Equal("Submitted", result.Status);
        Assert.Equal(1, result.CurrentStageOrder);
        Assert.Equal("Legal Review", result.CurrentStageName);
        Assert.Equal("Al Ain Insurance", result.PartnerName);
        Assert.StartsWith("SPM-RBT-T01-", result.TicketId);
    }

    [Fact]
    public async Task CreateTicket_AsSystemAdmin_Returns201()
    {
        // Arrange — login as Admin User (SystemAdministrator)
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "admin@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{}"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/tickets", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_AsDevTeam_Returns403()
    {
        // Arrange — login as Ahmed Tariq (DevTeam)
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "ahmed.tariq@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{}"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/tickets", request);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_Unauthenticated_Returns401()
    {
        // Arrange — no auth token
        var client = _factory.CreateClient();

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{}"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/tickets", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_LifecycleViolation_Returns400()
    {
        // Arrange — partner-product is at None, but T-02 requires Onboarded
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T02",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{}"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/tickets", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_InvalidProductCode_Returns400()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var request = new CreateTicketRequest(
            ProductCode: "INVALID",
            TaskType: "T01",
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{}"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/tickets", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
