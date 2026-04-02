namespace Tixora.Domain.Entities;

public class SlaPause
{
    public Guid Id { get; set; }
    public Guid SlaTrackerId { get; set; }
    public DateTime PausedAtUtc { get; set; }
    public DateTime? ResumedAtUtc { get; set; }
    public double PausedBusinessHours { get; set; }

    public SlaTracker SlaTracker { get; set; } = null!;
}
