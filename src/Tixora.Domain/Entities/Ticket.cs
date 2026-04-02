using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class Ticket
{
    public Guid Id { get; set; }
    public string TicketId { get; set; } = string.Empty;
    public Guid PartnerProductId { get; set; }
    public TaskType TaskType { get; set; }
    public ProductCode ProductCode { get; set; }
    public TicketStatus Status { get; set; }
    public int CurrentStageOrder { get; set; }
    public ProvisioningPath? ProvisioningPath { get; set; }
    public IssueType? IssueType { get; set; }
    public string FormData { get; set; } = "{}";
    public Guid CreatedByUserId { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public Guid WorkflowDefinitionId { get; set; }
    public Guid? RejectedTicketRef { get; set; }
    public string? CancellationReason { get; set; }
    public int SequenceNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public PartnerProduct PartnerProduct { get; set; } = null!;
    public WorkflowDefinition WorkflowDefinition { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
    public User? AssignedTo { get; set; }
    public ICollection<StageLog> StageLogs { get; set; } = new List<StageLog>();
    public ICollection<AuditEntry> AuditEntries { get; set; } = new List<AuditEntry>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
