using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Documents;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class DocumentsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    // Known seed data IDs from SeedPartners.cs
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public DocumentsControllerTests(CustomWebApplicationFactory factory)
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
    public async Task Upload_ValidPdf_Returns201()
    {
        // Arrange
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x25, 0x50, 0x44, 0x46 }); // %PDF header bytes
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "file", "test-document.pdf");

        // Act
        var response = await client.PostAsync($"/api/tickets/{ticket.Id}/documents", content);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DocumentResponse>();
        Assert.NotNull(result);
        Assert.Equal("test-document.pdf", result.FileName);
        Assert.Equal("application/pdf", result.ContentType);
        Assert.Equal(4, result.SizeBytes);
        Assert.False(string.IsNullOrEmpty(result.Id));
    }

    [Fact]
    public async Task GetDocuments_ReturnsUploadedFiles()
    {
        // Arrange
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0x25, 0x50, 0x44, 0x46 });
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "file", "uploaded-file.pdf");

        var uploadResponse = await client.PostAsync($"/api/tickets/{ticket.Id}/documents", content);
        uploadResponse.EnsureSuccessStatusCode();

        // Act
        var response = await client.GetAsync($"/api/tickets/{ticket.Id}/documents");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var documents = await response.Content.ReadFromJsonAsync<List<DocumentResponse>>();
        Assert.NotNull(documents);
        Assert.Single(documents);
        Assert.Equal("uploaded-file.pdf", documents[0].FileName);
    }

    [Fact]
    public async Task Download_ExistingDocument_ReturnsFile()
    {
        // Arrange
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        var fileBytes = new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34 }; // %PDF-1.4
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(fileBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "file", "download-test.pdf");

        var uploadResponse = await client.PostAsync($"/api/tickets/{ticket.Id}/documents", content);
        uploadResponse.EnsureSuccessStatusCode();
        var uploaded = await uploadResponse.Content.ReadFromJsonAsync<DocumentResponse>();

        // Act
        var response = await client.GetAsync($"/api/documents/{uploaded!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);

        var downloadedBytes = await response.Content.ReadAsByteArrayAsync();
        Assert.Equal(fileBytes, downloadedBytes);
    }

    [Fact]
    public async Task Upload_NoFile_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();
        var ticket = await CreateT01TicketAsync(client);

        var content = new MultipartFormDataContent();
        // No file added

        // Act
        var response = await client.PostAsync($"/api/tickets/{ticket.Id}/documents", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
