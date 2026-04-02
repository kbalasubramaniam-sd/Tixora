namespace Tixora.Application.DTOs.Notifications;

public record NotificationResponse(
    string Id,
    string Type,
    string Title,
    string Message,
    string? TicketId,
    string? TicketDisplayId,
    bool IsRead,
    DateTime? ReadAt,
    DateTime CreatedAt
);

public record UnreadCountResponse(int Count);
