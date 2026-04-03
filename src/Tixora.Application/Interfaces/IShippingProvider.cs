using Tixora.Application.DTOs.Shipments;

namespace Tixora.Application.Interfaces;

public interface IShippingProvider
{
    Task<ValidateAddressResponse> ValidateAddressAsync(ValidateAddressRequest request);
    Task<(string TrackingNumber, byte[] LabelPdf)> CreateShipmentAsync(BookShipmentRequest request);
}
