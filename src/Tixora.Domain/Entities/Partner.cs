namespace Tixora.Domain.Entities;

public class Partner
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<PartnerProduct> PartnerProducts { get; set; } = new List<PartnerProduct>();
}
