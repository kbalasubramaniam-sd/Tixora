using Tixora.Application.DTOs.Shipments;

namespace Tixora.Application.Interfaces;

public interface IShipmentService
{
    Task<ValidateAddressResponse> ValidateAddressAsync(ValidateAddressRequest request);
    Task<ShipmentResponse> BookShipmentAsync(BookShipmentRequest request, Guid createdByUserId);
    Task<ShipmentResponse?> GetByTicketAsync(Guid ticketId);
    Task<(Stream Content, string FileName)?> GetLabelAsync(Guid shipmentId);
}
