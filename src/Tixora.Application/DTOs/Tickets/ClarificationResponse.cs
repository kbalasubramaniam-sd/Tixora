namespace Tixora.Application.DTOs.Tickets;

public record ClarificationResponse(
    string RequestedBy,
    DateTime RequestedAt,
    string Note,
    string? Response = null,
    DateTime? RespondedAt = null
);
