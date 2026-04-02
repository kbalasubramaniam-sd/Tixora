namespace Tixora.Application.DTOs.Tickets;

public record TicketSummaryResponse(
    string Id,
    string TicketId,
    string ProductCode,
    string TaskType,
    string PartnerName,
    string RequesterName,
    string Status,
    string CurrentStage,
    string SlaStatus,
    double SlaHoursRemaining,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
