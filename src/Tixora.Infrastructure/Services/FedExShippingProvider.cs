using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Tixora.Application.DTOs.Shipments;
using Tixora.Application.Interfaces;

namespace Tixora.Infrastructure.Services;

public class FedExSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://apis-sandbox.fedex.com";
    public string ShipperAddressLine1 { get; set; } = string.Empty;
    public string ShipperCity { get; set; } = string.Empty;
    public string ShipperStateProvince { get; set; } = string.Empty;
    public string ShipperPostalCode { get; set; } = string.Empty;
    public string ShipperCountryCode { get; set; } = "AE";
    public string ShipperPhone { get; set; } = string.Empty;
    public string ShipperCompany { get; set; } = "Tixora";
}

public class FedExShippingProvider : IShippingProvider
{
    private readonly HttpClient _httpClient;
    private readonly FedExSettings _settings;
    private readonly ILogger<FedExShippingProvider> _logger;
    private string? _accessToken;
    private DateTime _tokenExpiry;

    public FedExShippingProvider(HttpClient httpClient, IOptions<FedExSettings> settings, ILogger<FedExShippingProvider> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    private async Task EnsureTokenAsync()
    {
        if (_accessToken != null && DateTime.UtcNow < _tokenExpiry)
            return;

        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("grant_type", "client_credentials"),
            new KeyValuePair<string, string>("client_id", _settings.ClientId),
            new KeyValuePair<string, string>("client_secret", _settings.ClientSecret),
        });

        var response = await _httpClient.PostAsync($"{_settings.BaseUrl}/oauth/token", content);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        _accessToken = json.GetProperty("access_token").GetString();
        var expiresIn = json.GetProperty("expires_in").GetInt32();
        _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 60);
    }

    public async Task<ValidateAddressResponse> ValidateAddressAsync(ValidateAddressRequest request)
    {
        await EnsureTokenAsync();

        var payload = new
        {
            addressesToValidate = new[]
            {
                new
                {
                    address = new
                    {
                        streetLines = new[] { request.AddressLine1, request.AddressLine2 ?? "" }.Where(s => !string.IsNullOrEmpty(s)).ToArray(),
                        city = request.City,
                        stateOrProvinceCode = request.StateProvince,
                        postalCode = request.PostalCode,
                        countryCode = request.CountryCode
                    }
                }
            }
        };

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{_settings.BaseUrl}/address/v1/addresses/resolve");
        httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _accessToken);
        httpRequest.Content = JsonContent.Create(payload);

        var response = await _httpClient.SendAsync(httpRequest);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("FedEx address validation failed: {Status} {Body}", response.StatusCode, body);
            return new ValidateAddressResponse(false, null, null, null, null, $"FedEx API error: {response.StatusCode}");
        }

        var json = JsonDocument.Parse(body);
        var output = json.RootElement.GetProperty("output");
        var resolved = output.GetProperty("resolvedAddresses")[0];

        var classification = resolved.TryGetProperty("classification", out var cls) ? cls.GetString() : null;
        // Validation is advisory for MVP 1 — always return valid, show corrected address
        var isValid = true;

        var streetLines = resolved.TryGetProperty("streetLinesToken", out var sl)
            ? sl.EnumerateArray().Select(s => s.GetString()).ToArray()
            : Array.Empty<string?>();

        return new ValidateAddressResponse(
            IsValid: isValid,
            CorrectedAddressLine1: streetLines.Length > 0 ? streetLines[0] : request.AddressLine1,
            CorrectedCity: resolved.TryGetProperty("city", out var city) ? city.GetString() : request.City,
            CorrectedStateProvince: resolved.TryGetProperty("stateOrProvinceCode", out var state) ? state.GetString() : request.StateProvince,
            CorrectedPostalCode: resolved.TryGetProperty("postalCode", out var postal) ? postal.GetString() : request.PostalCode,
            Message: isValid ? "Address validated successfully" : "Address could not be validated"
        );
    }

    public async Task<(string TrackingNumber, byte[] LabelPdf)> CreateShipmentAsync(BookShipmentRequest request)
    {
        await EnsureTokenAsync();

        var payload = new
        {
            labelResponseOptions = "LABEL",
            accountNumber = new { value = _settings.AccountNumber },
            requestedShipment = new
            {
                shipper = new
                {
                    contact = new { companyName = _settings.ShipperCompany, phoneNumber = _settings.ShipperPhone },
                    address = new
                    {
                        streetLines = new[] { _settings.ShipperAddressLine1 },
                        city = _settings.ShipperCity,
                        stateOrProvinceCode = _settings.ShipperStateProvince,
                        postalCode = _settings.ShipperPostalCode,
                        countryCode = _settings.ShipperCountryCode
                    }
                },
                recipients = new[]
                {
                    new
                    {
                        contact = new { personName = request.RecipientName, companyName = request.RecipientCompany, phoneNumber = request.RecipientPhone },
                        address = new
                        {
                            streetLines = new[] { request.AddressLine1, request.AddressLine2 ?? "" }.Where(s => !string.IsNullOrEmpty(s)).ToArray(),
                            city = request.City,
                            stateOrProvinceCode = request.StateProvince,
                            postalCode = request.PostalCode,
                            countryCode = request.CountryCode
                        }
                    }
                },
                pickupType = "USE_SCHEDULED_PICKUP",
                serviceType = request.ServiceType,
                packagingType = "FEDEX_ENVELOPE",
                shippingChargesPayment = new { paymentType = "SENDER" },
                labelSpecification = new
                {
                    labelFormatType = "COMMON2D",
                    imageType = "PDF",
                    labelStockType = "PAPER_4X6"
                },
                requestedPackageLineItems = new[]
                {
                    new
                    {
                        weight = new { units = "KG", value = request.WeightKg }
                    }
                }
            }
        };

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{_settings.BaseUrl}/ship/v1/shipments");
        httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _accessToken);
        httpRequest.Content = JsonContent.Create(payload);

        var response = await _httpClient.SendAsync(httpRequest);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("FedEx create shipment failed: {Status} {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"FedEx shipment creation failed: {response.StatusCode}");
        }

        var json = JsonDocument.Parse(body);
        var output = json.RootElement.GetProperty("output");
        var transaction = output.GetProperty("transactionShipments")[0];
        var trackingNumber = transaction.GetProperty("masterTrackingNumber").GetProperty("trackingNumber").GetString()!;

        var labelBase64 = transaction
            .GetProperty("pieceResponses")[0]
            .GetProperty("packageDocuments")[0]
            .GetProperty("encodedLabel").GetString()!;

        var labelPdf = Convert.FromBase64String(labelBase64);

        return (trackingNumber, labelPdf);
    }
}
