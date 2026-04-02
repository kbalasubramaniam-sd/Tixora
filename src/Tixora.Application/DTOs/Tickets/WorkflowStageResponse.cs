namespace Tixora.Application.DTOs.Tickets;

public record WorkflowStageResponse(
    string Name,
    string Icon,
    string Status,
    string? AssignedTo = null,
    DateTime? CompletedAt = null
);
