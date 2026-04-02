using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class SlaTracker
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public int StageOrder { get; set; }
    public int TargetBusinessHours { get; set; }
    public double BusinessHoursElapsed { get; set; }
    public SlaStatus Status { get; set; }
    public DateTime StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public bool IsActive { get; set; }
    public bool Notified75 { get; set; }
    public bool Notified90 { get; set; }
    public bool NotifiedBreach { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public ICollection<SlaPause> Pauses { get; set; } = new List<SlaPause>();
}
