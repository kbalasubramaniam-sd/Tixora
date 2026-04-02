using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class SlaTrackerConfiguration : IEntityTypeConfiguration<SlaTracker>
{
    public void Configure(EntityTypeBuilder<SlaTracker> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Status).HasConversion<int>();
        builder.HasOne(s => s.Ticket).WithMany(t => t.SlaTrackers).HasForeignKey(s => s.TicketId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(s => new { s.TicketId, s.StageOrder });
    }
}
