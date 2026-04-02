using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Seed;

public static class SeedBusinessHours
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BusinessHoursConfig>().HasData(
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000001"), DayOfWeek = DayOfWeek.Sunday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000002"), DayOfWeek = DayOfWeek.Monday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000003"), DayOfWeek = DayOfWeek.Tuesday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000004"), DayOfWeek = DayOfWeek.Wednesday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000005"), DayOfWeek = DayOfWeek.Thursday, IsWorkingDay = true, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(17, 0) },
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000006"), DayOfWeek = DayOfWeek.Friday, IsWorkingDay = false, StartTime = new TimeOnly(0, 0), EndTime = new TimeOnly(0, 0) },
            new BusinessHoursConfig { Id = Guid.Parse("a0000000-0000-0000-0000-000000000007"), DayOfWeek = DayOfWeek.Saturday, IsWorkingDay = false, StartTime = new TimeOnly(0, 0), EndTime = new TimeOnly(0, 0) }
        );
    }
}
