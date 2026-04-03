using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Shipments;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class ShipmentsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public ShipmentsControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync()
    {
        var client = _factory.CreateClient();
        var token = await TestHelpers.GetAuthTokenAsync(client, "sarah.ahmad@tixora.ae", "Password1!");
        TestHelpers.SetAuthToken(client, token);
        return client;
    }

    private async Task<TicketResponse> CreateT01TicketAsync(HttpClient client)
    {
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

    private static BookShipmentRequest CreateBookRequest(Guid ticketId) => new(
        TicketId: ticketId,
        RecipientName: "John Doe",
        RecipientCompany: "Al Ain Insurance",
        RecipientPhone: "+971501234567",
        AddressLine1: "123 Sheikh Zayed Road",
        AddressLine2: "Suite 400",
        City: "Dubai",
        StateProvince: "DU",
        PostalCode: "00000",
        CountryCode: "AE",
        WeightKg: 0.5m,
        ServiceType: "STANDARD_OVERNIGHT"
    );

    [Fact]
    public async Task ValidateAddress_ReturnsValid()
    {
        // Arrange
        var client = await CreateAuthenticatedClientAsync();
        var request = new ValidateAddressRequest(
            AddressLine1: "123 Sheikh Zayed Road",
            AddressLine2: null,
            City: "Dubai",
            StateProvince: "DU",
            PostalCode: "00000",
            CountryCode: "AE"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/shipments/validate-address", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ValidateAddressResponse>();
        Assert.NotNull(result);
        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task BookShipment_T01Ticket_Returns201()
    {
        // Arrange
        var client = await CreateAuthenticatedClientAsync();
        var ticket = await CreateT01TicketAsync(client);
        var bookRequest = CreateBookRequest(ticket.Id);

        // Act
        var response = await client.PostAsJsonAsync("/api/shipments/book", bookRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ShipmentResponse>();
        Assert.NotNull(result);
        Assert.NotNull(result.TrackingNumber);
        Assert.StartsWith("NOOP-", result.TrackingNumber);
        Assert.Equal("LabelReady", result.Status);
        Assert.True(result.HasLabel);
    }

    [Fact]
    public async Task BookShipment_NonExistentTicket_Returns400()
    {
        // Arrange
        var client = await CreateAuthenticatedClientAsync();
        var bookRequest = CreateBookRequest(Guid.NewGuid());

        // Act
        var response = await client.PostAsJsonAsync("/api/shipments/book", bookRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetByTicket_ReturnsShipment()
    {
        // Arrange
        var client = await CreateAuthenticatedClientAsync();
        var ticket = await CreateT01TicketAsync(client);
        var bookRequest = CreateBookRequest(ticket.Id);

        var bookResponse = await client.PostAsJsonAsync("/api/shipments/book", bookRequest);
        bookResponse.EnsureSuccessStatusCode();

        // Act
        var response = await client.GetAsync($"/api/shipments/by-ticket/{ticket.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ShipmentResponse>();
        Assert.NotNull(result);
        Assert.Equal(ticket.Id.ToString(), result.TicketId);
        Assert.Equal("John Doe", result.RecipientName);
    }

    [Fact]
    public async Task GetLabel_ReturnsFile()
    {
        // Arrange
        var client = await CreateAuthenticatedClientAsync();
        var ticket = await CreateT01TicketAsync(client);
        var bookRequest = CreateBookRequest(ticket.Id);

        var bookResponse = await client.PostAsJsonAsync("/api/shipments/book", bookRequest);
        bookResponse.EnsureSuccessStatusCode();
        var shipment = await bookResponse.Content.ReadFromJsonAsync<ShipmentResponse>();

        // Act
        var response = await client.GetAsync($"/api/shipments/{shipment!.Id}/label");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);

        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.True(bytes.Length > 0);
    }
}
