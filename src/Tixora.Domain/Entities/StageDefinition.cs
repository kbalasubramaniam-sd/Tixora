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
    /// <summary>
    /// Target SLA in business hours. 0 = no SLA tracking (e.g. external wait gates like UAT signal).
    /// The workflow engine skips SlaTracker creation when this is 0.
    /// </summary>
    public int SlaBusinessHours { get; set; }

    public WorkflowDefinition WorkflowDefinition { get; set; } = null!;
}
