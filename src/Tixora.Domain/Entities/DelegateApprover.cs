namespace Tixora.Domain.Entities;

public class DelegateApprover
{
    public Guid Id { get; set; }
    public Guid PrimaryUserId { get; set; }
    public Guid DelegateUserId { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    public User PrimaryUser { get; set; } = null!;
    public User DelegateUser { get; set; } = null!;
}
