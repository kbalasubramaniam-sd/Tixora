namespace Tixora.Application.DTOs.Search;

public record AdvancedSearchRequest(
    string? ProductCode = null,
    string? TaskType = null,
    string? Status = null,
    string? SlaStatus = null,
    Guid? AssignedTo = null,
    Guid? PartnerId = null,
    DateTime? DateFrom = null,
    DateTime? DateTo = null,
    int Page = 1,
    int PageSize = 20
);
