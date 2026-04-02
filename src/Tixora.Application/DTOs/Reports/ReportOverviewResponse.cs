namespace Tixora.Application.DTOs.Reports;

public record ReportOverviewResponse(
    int TotalTickets,
    int OpenTickets,
    int CompletedTickets,
    int RejectedTickets,
    int CancelledTickets,
    double SlaCompliancePercent,
    int SlaBreachCount,
    double AvgResolutionHours,
    List<ProductBreakdown> ByProduct,
    List<TaskTypeBreakdown> ByTaskType,
    List<StatusBreakdown> ByStatus
);

public record ProductBreakdown(string ProductCode, int Count);
public record TaskTypeBreakdown(string TaskType, int Count);
public record StatusBreakdown(string Status, int Count);
