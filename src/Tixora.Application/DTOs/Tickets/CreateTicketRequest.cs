// File: src/Tixora.Application/DTOs/Tickets/CreateTicketRequest.cs
namespace Tixora.Application.DTOs.Tickets;

public record CreateTicketRequest(
    string ProductCode,
    string TaskType,
    Guid PartnerId,
    string? ProvisioningPath,
    string? IssueType,
    string FormData,
    Guid? RejectedTicketRef = null
);
