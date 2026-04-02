using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Common;
using Tixora.Application.DTOs.Notifications;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ITixoraDbContext _db;

    public NotificationService(ITixoraDbContext db)
    {
        _db = db;
    }

    public async Task SendAsync(Guid recipientUserId, NotificationType type, string title, string message, Guid? ticketId = null)
    {
        var notification = new Notification
        {
            Id = Guid.CreateVersion7(),
            RecipientUserId = recipientUserId,
            Type = type,
            Title = title,
            Message = message,
            TicketId = ticketId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();
    }

    public async Task SendToRoleAsync(UserRole role, NotificationType type, string title, string message, Guid? ticketId = null)
    {
        var userIds = await _db.Users
            .Where(u => u.Role == role && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var userId in userIds)
        {
            _db.Notifications.Add(new Notification
            {
                Id = Guid.CreateVersion7(),
                RecipientUserId = userId,
                Type = type,
                Title = title,
                Message = message,
                TicketId = ticketId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (userIds.Count > 0)
            await _db.SaveChangesAsync();
    }

    public async Task<PagedResult<NotificationResponse>> GetNotificationsAsync(Guid userId, bool unreadOnly = false, int page = 1, int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var query = _db.Notifications
            .Where(n => n.RecipientUserId == userId);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationResponse(
                n.Id.ToString(),
                n.Type.ToString(),
                n.Title,
                n.Message,
                n.TicketId.HasValue ? n.TicketId.Value.ToString() : null,
                n.Ticket != null ? n.Ticket.TicketId : null,
                n.IsRead,
                n.ReadAt,
                n.CreatedAt
            ))
            .ToListAsync();

        return new PagedResult<NotificationResponse>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _db.Notifications
            .CountAsync(n => n.RecipientUserId == userId && !n.IsRead);
    }

    public async Task MarkReadAsync(Guid notificationId, Guid userId)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientUserId == userId);

        if (notification is null)
            throw new InvalidOperationException("Notification not found.");

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        var unread = await _db.Notifications
            .Where(n => n.RecipientUserId == userId && !n.IsRead)
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = now;
        }

        if (unread.Count > 0)
            await _db.SaveChangesAsync();
    }
}
