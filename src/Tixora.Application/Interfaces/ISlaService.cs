using Tixora.Domain.Enums;

namespace Tixora.Application.Interfaces;

public interface ISlaService
{
    Task<double> CalculateBusinessHoursAsync(DateTime startUtc, DateTime endUtc);
    Task StartTrackingAsync(Guid ticketId, int stageOrder, int targetBusinessHours);
    Task CompleteTrackingAsync(Guid ticketId, int stageOrder);
    Task PauseAsync(Guid ticketId, int stageOrder);
    Task ResumeAsync(Guid ticketId, int stageOrder);
    Task RecalculateAsync(Guid slaTrackerId);
    Task<(SlaStatus Status, double HoursRemaining)> GetCurrentSlaAsync(Guid ticketId);
}
