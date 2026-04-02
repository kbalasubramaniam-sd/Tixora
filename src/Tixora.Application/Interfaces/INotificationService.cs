using Tixora.Application.DTOs.Notifications;
using Tixora.Domain.Enums;

namespace Tixora.Application.Interfaces;

public interface INotificationService
{
    Task SendAsync(Guid recipientUserId, NotificationType type, string title, string message, Guid? ticketId = null);
    Task SendToRoleAsync(UserRole role, NotificationType type, string title, string message, Guid? ticketId = null);
    Task<List<NotificationResponse>> GetNotificationsAsync(Guid userId, bool unreadOnly = false);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task MarkReadAsync(Guid notificationId, Guid userId);
    Task MarkAllReadAsync(Guid userId);
}
