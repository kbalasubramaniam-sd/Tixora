using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Comments;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Services;

public class CommentService : ICommentService
{
    private readonly ITixoraDbContext _db;

    public CommentService(ITixoraDbContext db)
    {
        _db = db;
    }

    public async Task<CommentResponse> AddCommentAsync(Guid ticketId, Guid authorUserId, string content)
    {
        var ticket = await _db.Tickets.FindAsync(ticketId)
            ?? throw new InvalidOperationException($"Ticket '{ticketId}' not found.");

        var author = await _db.Users.FindAsync(authorUserId)
            ?? throw new InvalidOperationException($"User '{authorUserId}' not found.");

        var comment = new Comment
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticketId,
            AuthorUserId = authorUserId,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        return new CommentResponse(
            Id: comment.Id.ToString(),
            AuthorName: author.FullName,
            AuthorRole: author.Role.ToString(),
            Content: comment.Content,
            CreatedAt: comment.CreatedAt
        );
    }

    public async Task<List<CommentResponse>> GetCommentsAsync(Guid ticketId)
    {
        return await _db.Comments
            .AsNoTracking()
            .Where(c => c.TicketId == ticketId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentResponse(
                c.Id.ToString(),
                c.Author.FullName,
                c.Author.Role.ToString(),
                c.Content,
                c.CreatedAt
            ))
            .ToListAsync();
    }
}
