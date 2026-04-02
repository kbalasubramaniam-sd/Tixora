namespace Tixora.Application.DTOs.Comments;

public record CommentResponse(
    string Id,
    string AuthorName,
    string AuthorRole,
    string Content,
    DateTime CreatedAt
);
