using Tixora.Application.DTOs.Shipments;
using Tixora.Application.Interfaces;

namespace Tixora.Infrastructure.Services;

public class NoOpShippingProvider : IShippingProvider
{
    public Task<ValidateAddressResponse> ValidateAddressAsync(ValidateAddressRequest request)
    {
        return Task.FromResult(new ValidateAddressResponse(
            IsValid: true,
            CorrectedAddressLine1: request.AddressLine1,
            CorrectedCity: request.City,
            CorrectedStateProvince: request.StateProvince,
            CorrectedPostalCode: request.PostalCode,
            Message: "Address validation skipped (no shipping provider configured)"
        ));
    }

    public Task<(string TrackingNumber, byte[] LabelPdf)> CreateShipmentAsync(BookShipmentRequest request)
    {
        var fakeTracking = $"NOOP-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";
        var fakePdf = System.Text.Encoding.UTF8.GetBytes("%PDF-1.4 fake label for testing");
        return Task.FromResult((fakeTracking, fakePdf));
    }
}
