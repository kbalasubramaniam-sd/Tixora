namespace Tixora.Application.DTOs.Admin;

public record WorkflowConfigResponse(List<WorkflowEntry> Workflows);

public record WorkflowEntry(
    string Id,
    string ProductCode,
    string TaskType,
    string? ProvisioningPath,
    List<StageEntry> Stages
);

public record StageEntry(
    string Id,
    int StageOrder,
    string StageName,
    string StageType,
    string AssignedRole,
    int SlaBusinessHours
);
