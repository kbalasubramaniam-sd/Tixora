// File: src/Tixora.Application/DTOs/Tickets/TicketResponse.cs
namespace Tixora.Application.DTOs.Tickets;

public record TicketResponse(
    Guid Id,
    string TicketId,
    string ProductCode,
    string TaskType,
    string Status,
    int CurrentStageOrder,
    string? CurrentStageName,
    string? AssignedToName,
    string PartnerName,
    string? ProvisioningPath,
    string? IssueType,
    DateTime CreatedAt
);
