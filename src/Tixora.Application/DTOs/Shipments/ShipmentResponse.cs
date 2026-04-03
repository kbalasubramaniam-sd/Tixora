namespace Tixora.Application.DTOs.Shipments;

public record ShipmentResponse(
    string Id,
    string TicketId,
    string TicketDisplayId,
    string Status,
    string? TrackingNumber,
    string RecipientName,
    string RecipientCompany,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string StateProvince,
    string PostalCode,
    string CountryCode,
    decimal WeightKg,
    string ServiceType,
    bool HasLabel,
    DateTime CreatedAt,
    DateTime? ShippedAt
);
