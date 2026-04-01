using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Domain.Interfaces;

public interface IWorkflowRepository
{
    Task<WorkflowDefinition?> GetActiveDefinitionAsync(ProductCode productCode, TaskType taskType, ProvisioningPath? provisioningPath = null);
}
