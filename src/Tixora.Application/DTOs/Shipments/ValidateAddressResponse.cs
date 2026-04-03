namespace Tixora.Application.DTOs.Shipments;

public record ValidateAddressResponse(
    bool IsValid,
    string? CorrectedAddressLine1,
    string? CorrectedCity,
    string? CorrectedStateProvince,
    string? CorrectedPostalCode,
    string? Message
);
