namespace Tixora.Application.DTOs.Dashboard;

public record ActivityEntryResponse(
    string Id,
    string Title,
    string Description,
    string Timestamp,
    string Icon,
    string IconBg,
    string IconColor
);
