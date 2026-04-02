namespace Tixora.Domain.Entities;

public class Holiday
{
    public Guid Id { get; set; }
    public DateOnly Date { get; set; }
    public string Name { get; set; } = string.Empty;
}
