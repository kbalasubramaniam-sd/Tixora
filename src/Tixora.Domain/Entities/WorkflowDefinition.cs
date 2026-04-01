using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class WorkflowDefinition
{
    public Guid Id { get; set; }
    public ProductCode ProductCode { get; set; }
    public TaskType TaskType { get; set; }
    public ProvisioningPath? ProvisioningPath { get; set; }
    public int Version { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<StageDefinition> Stages { get; set; } = new List<StageDefinition>();
}
