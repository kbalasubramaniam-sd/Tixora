namespace Tixora.Application.DTOs.Search;

public record SearchResultResponse(
    string Type,
    string Id,
    string DisplayId,
    string Title,
    string? Subtitle
);
