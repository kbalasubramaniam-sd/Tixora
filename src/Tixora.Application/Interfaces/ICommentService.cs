using Tixora.Application.DTOs.Comments;

namespace Tixora.Application.Interfaces;

public interface ICommentService
{
    Task<CommentResponse> AddCommentAsync(Guid ticketId, Guid authorUserId, string content);
    Task<List<CommentResponse>> GetCommentsAsync(Guid ticketId);
}
