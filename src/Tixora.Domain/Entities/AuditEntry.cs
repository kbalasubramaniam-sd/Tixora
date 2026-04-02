namespace Tixora.Domain.Entities;

public class AuditEntry
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid ActorUserId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime TimestampUtc { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public User Actor { get; set; } = null!;
}
