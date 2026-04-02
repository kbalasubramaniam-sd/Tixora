namespace Tixora.Domain.Entities;

public class BusinessHoursConfig
{
    public Guid Id { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public bool IsWorkingDay { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}
