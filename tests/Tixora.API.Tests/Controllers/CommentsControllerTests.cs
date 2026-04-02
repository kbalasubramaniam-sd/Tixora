using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Comments;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class CommentsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    // Known seed data IDs from SeedPartners.cs
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public CommentsControllerTests(CustomWebApplicationFactory factory)
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
            FormData: "{\"agreementNumber\": \"AGR-TEST\"}"
        );

        var response = await client.PostAsJsonAsync("/api/tickets", request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TicketResponse>())!;
    }

    [Fact]
    public async Task AddComment_ValidRequest_Returns201()
    {
        // Arrange
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        var commentRequest = new CommentRequest("This is a test comment.");

        // Act
        var response = await client.PostAsJsonAsync($"/api/tickets/{ticket.Id}/comments", commentRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<CommentResponse>();
        Assert.NotNull(result);
        Assert.Equal("This is a test comment.", result.Content);
        Assert.Equal("Sarah Ahmad", result.AuthorName);
        Assert.False(string.IsNullOrEmpty(result.Id));
    }

    [Fact]
    public async Task GetComments_ReturnsOrderedList()
    {
        // Arrange
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        await client.PostAsJsonAsync($"/api/tickets/{ticket.Id}/comments", new CommentRequest("First comment"));
        await client.PostAsJsonAsync($"/api/tickets/{ticket.Id}/comments", new CommentRequest("Second comment"));

        // Act
        var response = await client.GetAsync($"/api/tickets/{ticket.Id}/comments");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var comments = await response.Content.ReadFromJsonAsync<List<CommentResponse>>();
        Assert.NotNull(comments);
        Assert.Equal(2, comments.Count);
        Assert.Equal("First comment", comments[0].Content);
        Assert.Equal("Second comment", comments[1].Content);
    }

    [Fact]
    public async Task AddComment_EmptyContent_Returns400()
    {
        // Arrange
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        var commentRequest = new CommentRequest("   ");

        // Act
        var response = await client.PostAsJsonAsync($"/api/tickets/{ticket.Id}/comments", commentRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetComments_NoComments_ReturnsEmptyList()
    {
        // Arrange
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        // Act
        var response = await client.GetAsync($"/api/tickets/{ticket.Id}/comments");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var comments = await response.Content.ReadFromJsonAsync<List<CommentResponse>>();
        Assert.NotNull(comments);
        Assert.Empty(comments);
    }
}
