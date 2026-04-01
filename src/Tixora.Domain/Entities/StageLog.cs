using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class StageLog
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public int StageOrder { get; set; }
    public string StageName { get; set; } = string.Empty;
    public StageAction Action { get; set; }
    public Guid ActorUserId { get; set; }
    public string? Comments { get; set; }
    public Guid? ReassignedToUserId { get; set; }
    public DateTime Timestamp { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public User Actor { get; set; } = null!;
}
