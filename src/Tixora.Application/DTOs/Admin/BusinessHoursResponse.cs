namespace Tixora.Application.DTOs.Admin;

public record BusinessHoursResponse(List<DayConfig> Days);

public record DayConfig(
    string Id,
    string DayOfWeek,
    bool IsWorkingDay,
    string StartTime,
    string EndTime
);

public record UpdateBusinessHoursRequest(List<UpdateDayConfig> Days);

public record UpdateDayConfig(Guid Id, bool IsWorkingDay, string StartTime, string EndTime);
