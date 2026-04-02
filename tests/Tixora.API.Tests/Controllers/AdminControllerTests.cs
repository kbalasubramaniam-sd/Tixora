using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Admin;

namespace Tixora.API.Tests.Controllers;

public class AdminControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AdminControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> CreateAdminClient()
    {
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "admin@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);
        return client;
    }

    private async Task<HttpClient> CreateNonAdminClient()
    {
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);
        return client;
    }

    [Fact]
    public async Task GetSlaConfig_ReturnsAllWorkflows()
    {
        var client = await CreateAdminClient();

        var response = await client.GetAsync("/api/admin/sla-config");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<SlaConfigResponse>();
        Assert.NotNull(result);
        Assert.True(result.Entries.Count > 0);

        // Each entry should have stages
        foreach (var entry in result.Entries)
        {
            Assert.NotNull(entry.ProductCode);
            Assert.NotNull(entry.TaskType);
            Assert.True(entry.Stages.Count > 0);
            foreach (var stage in entry.Stages)
            {
                Assert.NotNull(stage.StageId);
                Assert.NotNull(stage.StageName);
                Assert.True(stage.SlaBusinessHours >= 0);
            }
        }
    }

    [Fact]
    public async Task UpdateSlaConfig_ChangesHours()
    {
        var client = await CreateAdminClient();

        // GET current config
        var getResponse = await client.GetAsync("/api/admin/sla-config");
        var config = await getResponse.Content.ReadFromJsonAsync<SlaConfigResponse>();
        Assert.NotNull(config);

        var firstStage = config.Entries.First().Stages.First();
        var originalHours = firstStage.SlaBusinessHours;
        var newHours = originalHours + 10;

        // PUT updated hours
        var updateRequest = new UpdateSlaConfigRequest(
        [
            new UpdateStageSla(Guid.Parse(firstStage.StageId), newHours)
        ]);

        var putResponse = await client.PutAsJsonAsync("/api/admin/sla-config", updateRequest);
        Assert.Equal(HttpStatusCode.NoContent, putResponse.StatusCode);

        // GET again and verify
        var verifyResponse = await client.GetAsync("/api/admin/sla-config");
        var updated = await verifyResponse.Content.ReadFromJsonAsync<SlaConfigResponse>();
        Assert.NotNull(updated);

        var updatedStage = updated.Entries.First().Stages.First(s => s.StageId == firstStage.StageId);
        Assert.Equal(newHours, updatedStage.SlaBusinessHours);
    }

    [Fact]
    public async Task GetBusinessHours_Returns7Days()
    {
        var client = await CreateAdminClient();

        var response = await client.GetAsync("/api/admin/business-hours");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<BusinessHoursResponse>();
        Assert.NotNull(result);
        Assert.Equal(7, result.Days.Count);
    }

    [Fact]
    public async Task CreateAndDeleteHoliday_Works()
    {
        var client = await CreateAdminClient();

        // Create holiday
        var createRequest = new CreateHolidayRequest("2026-12-25", "Christmas");
        var createResponse = await client.PostAsJsonAsync("/api/admin/holidays", createRequest);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var holiday = await createResponse.Content.ReadFromJsonAsync<HolidayResponse>();
        Assert.NotNull(holiday);
        Assert.Equal("2026-12-25", holiday.Date);
        Assert.Equal("Christmas", holiday.Name);

        // Verify it appears in GET
        var listResponse = await client.GetAsync("/api/admin/holidays");
        var holidays = await listResponse.Content.ReadFromJsonAsync<List<HolidayResponse>>();
        Assert.NotNull(holidays);
        Assert.Contains(holidays, h => h.Id == holiday.Id);

        // Delete holiday
        var deleteResponse = await client.DeleteAsync($"/api/admin/holidays/{holiday.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task CreateDelegate_ReturnsCreated()
    {
        var client = await CreateAdminClient();

        // Use seeded user IDs: Sarah Ahmad (primary) and Omar Khalid (delegate)
        var primaryUserId = new Guid("a1b2c3d4-0001-0001-0001-000000000001");
        var delegateUserId = new Guid("a1b2c3d4-0001-0001-0001-000000000002");

        var request = new CreateDelegateRequest(primaryUserId, delegateUserId, DateTime.UtcNow, DateTime.UtcNow.AddDays(30));

        var response = await client.PostAsJsonAsync("/api/admin/delegates", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DelegateResponse>();
        Assert.NotNull(result);
        Assert.Equal("Sarah Ahmad", result.PrimaryUserName);
        Assert.Equal("Omar Khalid", result.DelegateUserName);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task GetWorkflowConfig_ReturnsAllWorkflows()
    {
        var client = await CreateAdminClient();

        var response = await client.GetAsync("/api/admin/workflow-config");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<WorkflowConfigResponse>();
        Assert.NotNull(result);
        Assert.True(result.Workflows.Count > 0);

        foreach (var workflow in result.Workflows)
        {
            Assert.NotNull(workflow.Id);
            Assert.NotNull(workflow.ProductCode);
            Assert.NotNull(workflow.TaskType);
            Assert.True(workflow.Stages.Count > 0);

            foreach (var stage in workflow.Stages)
            {
                Assert.NotNull(stage.Id);
                Assert.NotNull(stage.StageName);
                Assert.NotNull(stage.StageType);
                Assert.NotNull(stage.AssignedRole);
                Assert.True(stage.StageOrder > 0);
            }
        }
    }

    [Fact]
    public async Task AdminEndpoints_NonAdmin_Returns403()
    {
        var client = await CreateNonAdminClient();

        var response = await client.GetAsync("/api/admin/sla-config");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
