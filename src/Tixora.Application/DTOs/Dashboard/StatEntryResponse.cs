namespace Tixora.Application.DTOs.Dashboard;

public record StatEntryResponse(
    string Label,
    object Value,
    string Icon,
    string IconBg,
    string IconColor,
    string? Badge = null,
    string? BadgeStyle = null,
    string? ValueColor = null
);
