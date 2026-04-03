using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Infrastructure.Data;
using Tixora.Infrastructure.Services;

namespace Tixora.Infrastructure.Tests.Services;

public class SlaServiceTests : IDisposable
{
    private readonly TixoraDbContext _db;
    private readonly SlaService _slaService;

    // GST = UTC+4
    private static readonly TimeZoneInfo GstZone = TimeZoneInfo.CreateCustomTimeZone("GST", TimeSpan.FromHours(4), "Gulf Standard Time", "Gulf Standard Time");

    // Deterministic GUIDs
    private static readonly Guid TicketId = new("bbbbbbbb-0001-0001-0001-000000000001");
    private static readonly Guid PartnerId = new("bbbbbbbb-0002-0002-0002-000000000001");
    private static readonly Guid PartnerProductId = new("bbbbbbbb-0003-0003-0003-000000000001");
    private static readonly Guid WorkflowId = new("bbbbbbbb-0004-0004-0004-000000000001");
    private static readonly Guid UserId = new("bbbbbbbb-0005-0005-0005-000000000001");

    public SlaServiceTests()
    {
        var options = new DbContextOptionsBuilder<TixoraDbContext>()
            .UseInMemoryDatabase($"SlaServiceTests_{Guid.NewGuid()}")
            .Options;

        _db = new TixoraDbContext(options);
        _slaService = new SlaService(_db, new MemoryCache(new MemoryCacheOptions()));

        SeedBusinessHoursConfig();
        SeedTicketData();
    }

    private void SeedBusinessHoursConfig()
    {
        // Sun-Thu working, Fri-Sat off
        _db.BusinessHoursConfigs.AddRange(
            new BusinessHoursConfig { Id = Guid.NewGuid(), DayOfWeek = DayOfWeek.Sunday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.NewGuid(), DayOfWeek = DayOfWeek.Monday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.NewGuid(), DayOfWeek = DayOfWeek.Tuesday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.NewGuid(), DayOfWeek = DayOfWeek.Wednesday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.NewGuid(), DayOfWeek = DayOfWeek.Thursday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.NewGuid(), DayOfWeek = DayOfWeek.Friday, IsWorkingDay = false, StartTime = new TimeOnly(0, 0), EndTime = new TimeOnly(0, 0) },
            new BusinessHoursConfig { Id = Guid.NewGuid(), DayOfWeek = DayOfWeek.Saturday, IsWorkingDay = false, StartTime = new TimeOnly(0, 0), EndTime = new TimeOnly(0, 0) }
        );
        _db.SaveChanges();
    }

    private void SeedTicketData()
    {
        _db.Partners.Add(new Partner
        {
            Id = PartnerId,
            Name = "SLA Test Partner",
            Alias = "STP",
            CreatedAt = DateTime.UtcNow
        });

        _db.PartnerProducts.Add(new PartnerProduct
        {
            Id = PartnerProductId,
            PartnerId = PartnerId,
            ProductCode = ProductCode.RBT,
            CompanyCode = "STP-RBT",
            LifecycleState = LifecycleState.None,
            StateChangedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        _db.WorkflowDefinitions.Add(new WorkflowDefinition
        {
            Id = WorkflowId,
            ProductCode = ProductCode.RBT,
            TaskType = TaskType.T01,
            Version = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        _db.Users.Add(new User
        {
            Id = UserId,
            FullName = "SLA Test User",
            Email = "sla@test.ae",
            PasswordHash = "not-used",
            Role = UserRole.LegalTeam,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        _db.Tickets.Add(new Ticket
        {
            Id = TicketId,
            TicketId = "SPM-RBT-T01-20260403-001",
            PartnerProductId = PartnerProductId,
            TaskType = TaskType.T01,
            ProductCode = ProductCode.RBT,
            Status = TicketStatus.InReview,
            CurrentStageOrder = 1,
            FormData = "{}",
            CreatedByUserId = UserId,
            AssignedToUserId = UserId,
            WorkflowDefinitionId = WorkflowId,
            SequenceNumber = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        _db.SaveChanges();
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    /// <summary>
    /// Convert GST time to UTC for test inputs.
    /// </summary>
    private static DateTime GstToUtc(int year, int month, int day, int hour, int minute)
    {
        var gst = new DateTime(year, month, day, hour, minute, 0, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(gst, GstZone);
    }

    // ─── Test 1: Same working day ───────────────────────

    [Fact]
    public async Task SameWorkingDay_ReturnsCorrectHours()
    {
        // Sunday 10:00 GST to Sunday 14:00 GST = 4 hours
        // 2026-04-05 is a Sunday
        var start = GstToUtc(2026, 4, 5, 10, 0);
        var end = GstToUtc(2026, 4, 5, 14, 0);

        var hours = await _slaService.CalculateBusinessHoursAsync(start, end);

        Assert.Equal(4, hours);
    }

    // ─── Test 2: Cross weekend ──────────────────────────

    [Fact]
    public async Task CrossWeekend_SkipsFridaySaturday()
    {
        // Thursday 16:00 GST to Sunday 10:00 GST
        // 2026-04-02 is Thursday, 2026-04-05 is Sunday
        // Thu 16:00-17:00 = 1h, Fri off, Sat off, Sun 08:00-10:00 = 2h = 3h total
        var start = GstToUtc(2026, 4, 2, 16, 0);
        var end = GstToUtc(2026, 4, 5, 10, 0);

        var hours = await _slaService.CalculateBusinessHoursAsync(start, end);

        Assert.Equal(3, hours);
    }

    // ─── Test 3: Before business hours clamps to start ──

    [Fact]
    public async Task BeforeBusinessHours_ClampsToStart()
    {
        // Sunday 06:00 GST to Sunday 10:00 GST = only 08:00-10:00 = 2 hours
        // 2026-04-05 is a Sunday
        var start = GstToUtc(2026, 4, 5, 6, 0);
        var end = GstToUtc(2026, 4, 5, 10, 0);

        var hours = await _slaService.CalculateBusinessHoursAsync(start, end);

        Assert.Equal(2, hours);
    }

    // ─── Test 4: After business hours clamps to end ─────

    [Fact]
    public async Task AfterBusinessHours_ClampsToEnd()
    {
        // Sunday 18:00 GST to Monday 10:00 GST = Mon 08:00-10:00 = 2 hours
        // 2026-04-05 is Sunday, 2026-04-06 is Monday
        var start = GstToUtc(2026, 4, 5, 18, 0);
        var end = GstToUtc(2026, 4, 6, 10, 0);

        var hours = await _slaService.CalculateBusinessHoursAsync(start, end);

        Assert.Equal(2, hours);
    }

    // ─── Test 5: Multiple full working days ─────────────

    [Fact]
    public async Task MultipleFullDays_CalculatesCorrectly()
    {
        // Sunday 08:00 to Wednesday 17:00 = 4 days * 9h = 36 hours
        // 2026-04-05 (Sun) to 2026-04-08 (Wed)
        var start = GstToUtc(2026, 4, 5, 8, 0);
        var end = GstToUtc(2026, 4, 8, 17, 0);

        var hours = await _slaService.CalculateBusinessHoursAsync(start, end);

        Assert.Equal(36, hours);
    }

    // ─── Test 6: Holiday skips day ──────────────────────

    [Fact]
    public async Task Holiday_SkipsDay()
    {
        // Add Monday 2026-04-06 as a holiday
        _db.Holidays.Add(new Holiday
        {
            Id = Guid.NewGuid(),
            Date = new DateOnly(2026, 4, 6),
            Name = "Test Holiday"
        });
        _db.SaveChanges();

        // Sunday 17:00 GST to Tuesday 08:00 GST
        // Sun done at 17:00, Mon is holiday, Tue 08:00 = start of day = 0h
        var start = GstToUtc(2026, 4, 5, 17, 0);
        var end = GstToUtc(2026, 4, 7, 8, 0);

        var hours = await _slaService.CalculateBusinessHoursAsync(start, end);

        Assert.Equal(0, hours);
    }

    // ─── Test 7: StartTracking creates tracker ──────────

    [Fact]
    public async Task StartTracking_CreatesTracker()
    {
        await _slaService.StartTrackingAsync(TicketId, 1, 24);

        var tracker = await _db.SlaTrackers.FirstOrDefaultAsync(s => s.TicketId == TicketId);

        Assert.NotNull(tracker);
        Assert.Equal(1, tracker.StageOrder);
        Assert.Equal(24, tracker.TargetBusinessHours);
        Assert.Equal(0, tracker.BusinessHoursElapsed);
        Assert.Equal(SlaStatus.OnTrack, tracker.Status);
        Assert.True(tracker.IsActive);
        Assert.Null(tracker.CompletedAtUtc);
    }

    // ─── Test 8: Pause/Resume subtracts paused hours ────

    [Fact]
    public async Task PauseResume_SubtractsPausedHours()
    {
        // Create a tracker
        var trackerId = Guid.CreateVersion7();
        _db.SlaTrackers.Add(new SlaTracker
        {
            Id = trackerId,
            TicketId = TicketId,
            StageOrder = 1,
            TargetBusinessHours = 24,
            BusinessHoursElapsed = 0,
            Status = SlaStatus.OnTrack,
            StartedAtUtc = DateTime.UtcNow,
            IsActive = true
        });
        await _db.SaveChangesAsync();

        // Pause
        await _slaService.PauseAsync(TicketId, 1);

        var pause = await _db.SlaPauses.FirstOrDefaultAsync(p => p.SlaTrackerId == trackerId);
        Assert.NotNull(pause);
        Assert.Null(pause.ResumedAtUtc);

        // Resume
        await _slaService.ResumeAsync(TicketId, 1);

        var resumedPause = await _db.SlaPauses.FirstOrDefaultAsync(p => p.SlaTrackerId == trackerId);
        Assert.NotNull(resumedPause);
        Assert.NotNull(resumedPause.ResumedAtUtc);
    }

    // ─── Test 9: StartTracking with zero hours does nothing ─

    [Fact]
    public async Task StartTracking_ZeroHours_DoesNotCreateTracker()
    {
        var testTicketId = Guid.NewGuid();
        await _slaService.StartTrackingAsync(testTicketId, 1, 0);

        var tracker = await _db.SlaTrackers.FirstOrDefaultAsync(s => s.TicketId == testTicketId);
        Assert.Null(tracker);
    }

    // ─── Test 10: GetCurrentSla returns OnTrack with 0 for no tracker ─

    [Fact]
    public async Task GetCurrentSla_NoTracker_ReturnsOnTrackZero()
    {
        var nonExistentId = Guid.NewGuid();
        var (status, remaining) = await _slaService.GetCurrentSlaAsync(nonExistentId);

        Assert.Equal(SlaStatus.OnTrack, status);
        Assert.Equal(0, remaining);
    }
}
