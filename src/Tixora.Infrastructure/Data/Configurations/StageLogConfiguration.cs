// File: src/Tixora.Infrastructure/Data/Configurations/StageLogConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class StageLogConfiguration : IEntityTypeConfiguration<StageLog>
{
    public void Configure(EntityTypeBuilder<StageLog> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.StageName).IsRequired().HasMaxLength(200);
        builder.Property(s => s.Action).HasConversion<int>();
        builder.Property(s => s.Comments).HasMaxLength(2000);

        builder.HasOne(s => s.Ticket)
            .WithMany(t => t.StageLogs)
            .HasForeignKey(s => s.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Actor)
            .WithMany()
            .HasForeignKey(s => s.ActorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.ReassignedTo)
            .WithMany()
            .HasForeignKey(s => s.ReassignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => s.TicketId);
    }
}
