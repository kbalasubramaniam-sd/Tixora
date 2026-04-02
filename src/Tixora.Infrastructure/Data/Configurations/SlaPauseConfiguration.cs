using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class SlaPauseConfiguration : IEntityTypeConfiguration<SlaPause>
{
    public void Configure(EntityTypeBuilder<SlaPause> builder)
    {
        builder.HasKey(p => p.Id);
        builder.HasOne(p => p.SlaTracker).WithMany(s => s.Pauses).HasForeignKey(p => p.SlaTrackerId).OnDelete(DeleteBehavior.Cascade);
    }
}
