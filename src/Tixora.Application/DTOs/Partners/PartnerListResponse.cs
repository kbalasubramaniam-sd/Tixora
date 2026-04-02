// File: src/Tixora.Application/DTOs/Partners/PartnerListResponse.cs
namespace Tixora.Application.DTOs.Partners;

public record PartnerListResponse(Guid Id, string Name, string? Alias, List<PartnerProductInfo> Products);

public record PartnerProductInfo(string ProductCode, string ProductName, string LifecycleState, string? CompanyCode);
