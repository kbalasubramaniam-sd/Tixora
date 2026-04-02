using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class BusinessHoursConfigConfiguration : IEntityTypeConfiguration<BusinessHoursConfig>
{
    public void Configure(EntityTypeBuilder<BusinessHoursConfig> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.DayOfWeek).HasConversion<int>();
    }
}
