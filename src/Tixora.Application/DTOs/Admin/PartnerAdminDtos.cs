namespace Tixora.Application.DTOs.Admin;

public record PartnerAdminResponse(
    string Id,
    string Name,
    string? Alias,
    DateTime CreatedAt,
    List<PartnerProductAdminResponse> Products
);

public record PartnerProductAdminResponse(
    string Id,
    string ProductCode,
    string ProductName,
    string LifecycleState,
    string CompanyCode,
    DateTime CreatedAt
);

public record CreatePartnerRequest(string Name, string? Alias);

public record UpdatePartnerRequest(string Name, string? Alias);

public record LinkProductRequest(string ProductCode, string CompanyCode);
