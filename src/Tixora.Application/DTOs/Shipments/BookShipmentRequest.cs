namespace Tixora.Application.DTOs.Shipments;

public record BookShipmentRequest(
    Guid TicketId,
    string RecipientName,
    string RecipientCompany,
    string RecipientPhone,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string StateProvince,
    string PostalCode,
    string CountryCode,
    decimal WeightKg,
    string ServiceType
);
