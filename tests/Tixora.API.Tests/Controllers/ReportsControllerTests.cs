using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Reports;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class ReportsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public ReportsControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> CreateAuthenticatedClient(string email = "admin@tixora.ae")
    {
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, email, "Password1!");
        TestHelpers.SetAuthToken(client, token);
        return client;
    }

    private async Task CreateTicket(HttpClient client)
    {
        await client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T01", PartnerId: AlAinInsuranceId,
            ProvisioningPath: null, IssueType: null, FormData: "{}"));
    }

    [Fact]
    public async Task GetOverview_ReturnsMetrics()
    {
        var client = await CreateAuthenticatedClient("sarah.ahmad@tixora.ae");
        await CreateTicket(client);

        var adminClient = await CreateAuthenticatedClient();

        var response = await adminClient.GetAsync("/api/reports/overview");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var overview = await response.Content.ReadFromJsonAsync<ReportOverviewResponse>();
        Assert.NotNull(overview);
        Assert.True(overview.TotalTickets > 0);
        Assert.True(overview.OpenTickets >= 0);
        Assert.True(overview.SlaCompliancePercent >= 0 && overview.SlaCompliancePercent <= 100);
        Assert.NotNull(overview.ByProduct);
        Assert.NotNull(overview.ByTaskType);
        Assert.NotNull(overview.ByStatus);
    }

    [Fact]
    public async Task GetOverview_WithDateFilter_FiltersResults()
    {
        var client = await CreateAuthenticatedClient("sarah.ahmad@tixora.ae");
        await CreateTicket(client);

        var adminClient = await CreateAuthenticatedClient();

        // Use a future date range that should exclude all tickets
        var futureDate = DateTime.UtcNow.AddYears(1).ToString("yyyy-MM-dd");
        var response = await adminClient.GetAsync($"/api/reports/overview?dateFrom={futureDate}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var overview = await response.Content.ReadFromJsonAsync<ReportOverviewResponse>();
        Assert.NotNull(overview);
        Assert.Equal(0, overview.TotalTickets);
    }

    [Fact]
    public async Task ExportCsv_ReturnsCsvFile()
    {
        var client = await CreateAuthenticatedClient("sarah.ahmad@tixora.ae");
        await CreateTicket(client);

        var adminClient = await CreateAuthenticatedClient();

        var response = await adminClient.GetAsync("/api/reports/export");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/csv", response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();
        Assert.StartsWith("TicketId,ProductCode,TaskType,PartnerName,RequesterName,Status,CurrentStage,SlaStatus,CreatedAt,UpdatedAt", content);
        // Should have at least header + one data row
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        Assert.True(lines.Length >= 2);
    }

    [Fact]
    public async Task ExportCsv_WithProductFilter_FiltersResults()
    {
        var client = await CreateAuthenticatedClient("sarah.ahmad@tixora.ae");
        await CreateTicket(client); // Creates RBT ticket

        var adminClient = await CreateAuthenticatedClient();

        // Filter for a product with no tickets
        var response = await adminClient.GetAsync("/api/reports/export?productCode=WTQ");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        // Only header row — no WTQ tickets
        Assert.Single(lines);
    }
}
