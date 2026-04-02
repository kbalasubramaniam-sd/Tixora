using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class PartnerProduct
{
    public Guid Id { get; set; }
    public Guid PartnerId { get; set; }
    public ProductCode ProductCode { get; set; }
    public LifecycleState LifecycleState { get; set; } = LifecycleState.None;
    /// <summary>
    /// Company code assigned to this partner for this product (e.g. AAI-RBT). Required.
    /// </summary>
    public string CompanyCode { get; set; } = null!;
    public DateTime StateChangedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Partner Partner { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
