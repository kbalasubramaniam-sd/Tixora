namespace Tixora.Application.DTOs.Dashboard;

public record DashboardStatsResponse(
    StatEntryResponse Stat1,
    StatEntryResponse Stat2,
    StatEntryResponse Stat3,
    StatEntryResponse Stat4
);
