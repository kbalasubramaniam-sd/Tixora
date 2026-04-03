// File: src/Tixora.Infrastructure/Data/Configurations/TicketConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.TicketId).IsRequired().HasMaxLength(50);
        builder.Property(t => t.FormData).IsRequired();
        builder.Property(t => t.Status).HasConversion<int>();
        builder.Property(t => t.TaskType).HasConversion<int>();
        builder.Property(t => t.ProductCode).HasConversion<int>();
        builder.Property(t => t.ProvisioningPath).HasConversion<int>();
        builder.Property(t => t.IssueType).HasConversion<int>();
        builder.Property(t => t.CancellationReason).HasMaxLength(1000);

        builder.HasOne(t => t.CreatedBy)
            .WithMany()
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.AssignedTo)
            .WithMany()
            .HasForeignKey(t => t.AssignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.WorkflowDefinition)
            .WithMany()
            .HasForeignKey(t => t.WorkflowDefinitionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => t.TicketId).IsUnique();
        builder.HasIndex(t => t.PartnerProductId);
        builder.HasIndex(t => t.Status);
        builder.HasIndex(t => t.AssignedToUserId);
        builder.HasIndex(t => t.CreatedAt);
        builder.HasIndex(t => t.CreatedByUserId);

        // Compound indexes for common query patterns
        builder.HasIndex(t => new { t.CreatedByUserId, t.CreatedAt });
        builder.HasIndex(t => new { t.Status, t.CurrentStageOrder });
    }
}
