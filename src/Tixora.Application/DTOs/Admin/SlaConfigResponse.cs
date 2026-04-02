namespace Tixora.Application.DTOs.Admin;

public record SlaConfigResponse(List<SlaConfigEntry> Entries);

public record SlaConfigEntry(
    string ProductCode,
    string TaskType,
    string? ProvisioningPath,
    List<StageSlaConfig> Stages
);

public record StageSlaConfig(
    string StageId,
    string StageName,
    int SlaBusinessHours
);

public record UpdateSlaConfigRequest(List<UpdateStageSla> Stages);

public record UpdateStageSla(Guid StageId, int SlaBusinessHours);
