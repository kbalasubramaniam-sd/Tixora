using Microsoft.EntityFrameworkCore;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Services;

public class SlaService : ISlaService
{
    private readonly ITixoraDbContext _db;
    private static readonly TimeZoneInfo GstZone = TimeZoneInfo.CreateCustomTimeZone("GST", TimeSpan.FromHours(4), "Gulf Standard Time", "Gulf Standard Time");

    public SlaService(ITixoraDbContext db)
    {
        _db = db;
    }

    public async Task<double> CalculateBusinessHoursAsync(DateTime startUtc, DateTime endUtc)
    {
        if (endUtc <= startUtc) return 0;

        var configs = await _db.BusinessHoursConfigs.ToListAsync();
        var configByDay = configs.ToDictionary(c => c.DayOfWeek);

        // Convert to GST for business hours calculation
        var startGst = TimeZoneInfo.ConvertTimeFromUtc(startUtc, GstZone);
        var endGst = TimeZoneInfo.ConvertTimeFromUtc(endUtc, GstZone);
        var startDate = DateOnly.FromDateTime(startGst);
        var endDate = DateOnly.FromDateTime(endGst);

        var holidays = await _db.Holidays
            .Where(h => h.Date >= startDate && h.Date <= endDate)
            .Select(h => h.Date)
            .ToListAsync();
        var holidaySet = new HashSet<DateOnly>(holidays);

        double totalHours = 0;
        var currentDate = startDate;

        while (currentDate <= endDate)
        {
            if (!holidaySet.Contains(currentDate) &&
                configByDay.TryGetValue(currentDate.DayOfWeek, out var config) &&
                config.IsWorkingDay)
            {
                var dayStart = currentDate.ToDateTime(config.StartTime);
                var dayEnd = currentDate.ToDateTime(config.EndTime);

                var effectiveStart = currentDate == startDate ? Math.Max(dayStart.Ticks, startGst.Ticks) : dayStart.Ticks;
                var effectiveEnd = currentDate == endDate ? Math.Min(dayEnd.Ticks, endGst.Ticks) : dayEnd.Ticks;

                var effStart = new DateTime(Math.Max(effectiveStart, dayStart.Ticks));
                var effEnd = new DateTime(Math.Min(effectiveEnd, dayEnd.Ticks));

                if (effEnd > effStart)
                {
                    totalHours += (effEnd - effStart).TotalHours;
                }
            }
            currentDate = currentDate.AddDays(1);
        }

        return Math.Round(totalHours, 2);
    }

    public async Task StartTrackingAsync(Guid ticketId, int stageOrder, int targetBusinessHours)
    {
        if (targetBusinessHours <= 0) return; // SLA = 0 means no tracking

        var tracker = new SlaTracker
        {
            Id = Guid.CreateVersion7(),
            TicketId = ticketId,
            StageOrder = stageOrder,
            TargetBusinessHours = targetBusinessHours,
            BusinessHoursElapsed = 0,
            Status = SlaStatus.OnTrack,
            StartedAtUtc = DateTime.UtcNow,
            IsActive = true
        };

        _db.SlaTrackers.Add(tracker);
        await _db.SaveChangesAsync();
    }

    public async Task CompleteTrackingAsync(Guid ticketId, int stageOrder)
    {
        var tracker = await _db.SlaTrackers
            .FirstOrDefaultAsync(s => s.TicketId == ticketId && s.StageOrder == stageOrder && s.IsActive);

        if (tracker is null) return;

        tracker.CompletedAtUtc = DateTime.UtcNow;
        tracker.IsActive = false;

        // Final recalculation
        var pausedHours = await _db.SlaPauses
            .Where(p => p.SlaTrackerId == tracker.Id)
            .SumAsync(p => p.PausedBusinessHours);

        var totalElapsed = await CalculateBusinessHoursAsync(tracker.StartedAtUtc, tracker.CompletedAtUtc.Value);
        tracker.BusinessHoursElapsed = Math.Max(0, totalElapsed - pausedHours);

        await _db.SaveChangesAsync();
    }

    public async Task PauseAsync(Guid ticketId, int stageOrder)
    {
        var tracker = await _db.SlaTrackers
            .FirstOrDefaultAsync(s => s.TicketId == ticketId && s.StageOrder == stageOrder && s.IsActive);

        if (tracker is null) return;

        // Check there's no open pause already
        var openPause = await _db.SlaPauses
            .AnyAsync(p => p.SlaTrackerId == tracker.Id && p.ResumedAtUtc == null);
        if (openPause) return;

        _db.SlaPauses.Add(new SlaPause
        {
            Id = Guid.CreateVersion7(),
            SlaTrackerId = tracker.Id,
            PausedAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
    }

    public async Task ResumeAsync(Guid ticketId, int stageOrder)
    {
        var tracker = await _db.SlaTrackers
            .FirstOrDefaultAsync(s => s.TicketId == ticketId && s.StageOrder == stageOrder && s.IsActive);

        if (tracker is null) return;

        var openPause = await _db.SlaPauses
            .FirstOrDefaultAsync(p => p.SlaTrackerId == tracker.Id && p.ResumedAtUtc == null);

        if (openPause is null) return;

        openPause.ResumedAtUtc = DateTime.UtcNow;
        openPause.PausedBusinessHours = await CalculateBusinessHoursAsync(openPause.PausedAtUtc, openPause.ResumedAtUtc.Value);

        await _db.SaveChangesAsync();
    }

    public async Task RecalculateAsync(Guid slaTrackerId)
    {
        var tracker = await _db.SlaTrackers
            .Include(s => s.Pauses)
            .FirstOrDefaultAsync(s => s.Id == slaTrackerId);

        if (tracker is null || !tracker.IsActive) return;

        var now = DateTime.UtcNow;
        var totalElapsed = await CalculateBusinessHoursAsync(tracker.StartedAtUtc, now);

        // Subtract completed pause hours
        var completedPauseHours = tracker.Pauses
            .Where(p => p.ResumedAtUtc != null)
            .Sum(p => p.PausedBusinessHours);

        // For any open (active) pause, calculate hours from pause start to now
        var activePause = tracker.Pauses.FirstOrDefault(p => p.ResumedAtUtc == null);
        if (activePause != null)
        {
            var activePauseHours = await CalculateBusinessHoursAsync(activePause.PausedAtUtc, now);
            completedPauseHours += activePauseHours;
        }

        tracker.BusinessHoursElapsed = Math.Max(0, totalElapsed - completedPauseHours);

        // Update status based on percentage
        if (tracker.TargetBusinessHours > 0)
        {
            var pct = (tracker.BusinessHoursElapsed / tracker.TargetBusinessHours) * 100;
            tracker.Status = pct switch
            {
                >= 100 => SlaStatus.Breached,
                >= 90 => SlaStatus.Critical,
                >= 75 => SlaStatus.AtRisk,
                _ => SlaStatus.OnTrack
            };
        }

        await _db.SaveChangesAsync();
    }

    public async Task<(SlaStatus Status, double HoursRemaining)> GetCurrentSlaAsync(Guid ticketId)
    {
        var tracker = await _db.SlaTrackers
            .FirstOrDefaultAsync(s => s.TicketId == ticketId && s.IsActive);

        if (tracker is null)
            return (SlaStatus.OnTrack, 0);

        // Recalculate on read for freshness
        await RecalculateAsync(tracker.Id);

        var remaining = Math.Max(0, tracker.TargetBusinessHours - tracker.BusinessHoursElapsed);
        return (tracker.Status, Math.Round(remaining, 2));
    }
}
