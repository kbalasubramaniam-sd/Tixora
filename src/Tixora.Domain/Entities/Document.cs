using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class Document
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public DocumentType DocumentType { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public Guid UploadedByUserId { get; set; }
    public DateTime UploadedAt { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public User UploadedBy { get; set; } = null!;
}
