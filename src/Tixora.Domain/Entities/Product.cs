using Tixora.Domain.Enums;

namespace Tixora.Domain.Entities;

public class Product
{
    public ProductCode Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProductAccessMode ProductAccessMode { get; set; }
    public PortalType PortalType { get; set; }
}
