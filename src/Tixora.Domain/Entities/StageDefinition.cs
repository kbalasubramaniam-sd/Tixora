using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class StageDefinition
{
    public Guid Id { get; set; }
    public Guid WorkflowDefinitionId { get; set; }
    public int StageOrder { get; set; }
    public string StageName { get; set; } = string.Empty;
    public StageType StageType { get; set; }
    public UserRole AssignedRole { get; set; }
    public int SlaBusinessHours { get; set; }

    public WorkflowDefinition WorkflowDefinition { get; set; } = null!;
}
