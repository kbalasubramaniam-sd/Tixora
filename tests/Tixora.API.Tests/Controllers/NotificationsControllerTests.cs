using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Notifications;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class NotificationsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    // Known seed data IDs from SeedPartners.cs
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public NotificationsControllerTests(CustomWebApplicationFactory factory)
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
            FormData: "{\"agreementNumber\": \"AGR-NOTIF-TEST\"}"
        );

        var response = await client.PostAsJsonAsync("/api/tickets", request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TicketResponse>())!;
    }

    [Fact]
    public async Task CreateTicket_SendsNotificationToAssignee()
    {
        // Arrange — create ticket as sarah.ahmad (PartnershipTeam)
        var client = _factory.CreateClient();
        await CreateT01TicketAsync(client);

        // Act — check notifications for Omar Khalid (LegalTeam = T-01 stage 1 assignee)
        var token = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var response = await client.GetAsync("/api/notifications");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var notifications = await response.Content.ReadFromJsonAsync<List<NotificationResponse>>();
        Assert.NotNull(notifications);
        Assert.Contains(notifications, n => n.Type == "RequestSubmitted");
    }

    [Fact]
    public async Task GetNotifications_ReturnsListForUser()
    {
        // Arrange
        var client = _factory.CreateClient();
        await CreateT01TicketAsync(client);

        // Act — get notifications for assigned user (LegalTeam)
        var token = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var response = await client.GetAsync("/api/notifications");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var notifications = await response.Content.ReadFromJsonAsync<List<NotificationResponse>>();
        Assert.NotNull(notifications);
        Assert.NotEmpty(notifications);
        Assert.All(notifications, n =>
        {
            Assert.False(string.IsNullOrWhiteSpace(n.Title));
            Assert.False(string.IsNullOrWhiteSpace(n.Message));
        });
    }

    [Fact]
    public async Task MarkRead_SetsIsReadTrue()
    {
        // Arrange — create ticket and get notifications for assigned user
        var client = _factory.CreateClient();
        await CreateT01TicketAsync(client);

        var token = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var getResponse = await client.GetAsync("/api/notifications");
        var notifications = await getResponse.Content.ReadFromJsonAsync<List<NotificationResponse>>();
        Assert.NotNull(notifications);
        Assert.NotEmpty(notifications);

        var notificationId = notifications[0].Id;

        // Act — mark as read
        var markResponse = await client.PutAsync($"/api/notifications/{notificationId}/read", null);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, markResponse.StatusCode);

        // Verify it's now read
        var getResponse2 = await client.GetAsync("/api/notifications");
        var notifications2 = await getResponse2.Content.ReadFromJsonAsync<List<NotificationResponse>>();
        var updated = notifications2!.FirstOrDefault(n => n.Id == notificationId);
        Assert.NotNull(updated);
        Assert.True(updated.IsRead);
    }

    [Fact]
    public async Task MarkAllRead_UpdatesAllUnread()
    {
        // Arrange — create multiple tickets to generate multiple notifications
        var client = _factory.CreateClient();
        await CreateT01TicketAsync(client);
        await CreateT01TicketAsync(client);

        var token = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        // Act
        var markAllResponse = await client.PutAsync("/api/notifications/read-all", null);
        Assert.Equal(HttpStatusCode.NoContent, markAllResponse.StatusCode);

        // Assert — unread count should be 0
        var countResponse = await client.GetAsync("/api/notifications/unread-count");
        var count = await countResponse.Content.ReadFromJsonAsync<UnreadCountResponse>();
        Assert.NotNull(count);
        Assert.Equal(0, count.Count);
    }

    [Fact]
    public async Task GetUnreadCount_ReturnsCorrectCount()
    {
        // Arrange
        var client = _factory.CreateClient();
        await CreateT01TicketAsync(client);

        // Act — check unread count for Omar Khalid (LegalTeam)
        var token = await TestHelpers.GetAuthTokenAsync(client, "omar.khalid@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);

        var response = await client.GetAsync("/api/notifications/unread-count");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var count = await response.Content.ReadFromJsonAsync<UnreadCountResponse>();
        Assert.NotNull(count);
        Assert.True(count.Count > 0);
    }
}
