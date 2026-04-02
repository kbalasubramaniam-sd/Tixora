// File: src/Tixora.Infrastructure/Data/Configurations/AuditEntryConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class AuditEntryConfiguration : IEntityTypeConfiguration<AuditEntry>
{
    public void Configure(EntityTypeBuilder<AuditEntry> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.ActionType).IsRequired().HasMaxLength(100);

        builder.HasOne(a => a.Ticket)
            .WithMany(t => t.AuditEntries)
            .HasForeignKey(a => a.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Actor)
            .WithMany()
            .HasForeignKey(a => a.ActorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.TicketId);
    }
}
