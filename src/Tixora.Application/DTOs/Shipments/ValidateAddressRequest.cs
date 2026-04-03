namespace Tixora.Application.DTOs.Shipments;

public record ValidateAddressRequest(
    string AddressLine1,
    string? AddressLine2,
    string City,
    string StateProvince,
    string PostalCode,
    string CountryCode
);
