namespace Tixora.Application.DTOs.Tickets;

public record AuditEntryResponse(
    string Id,
    string Type,
    string Description,
    DateTime Timestamp
);
