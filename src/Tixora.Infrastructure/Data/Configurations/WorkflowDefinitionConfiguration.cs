// File: src/Tixora.Infrastructure/Data/Configurations/WorkflowDefinitionConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class WorkflowDefinitionConfiguration : IEntityTypeConfiguration<WorkflowDefinition>
{
    public void Configure(EntityTypeBuilder<WorkflowDefinition> builder)
    {
        builder.HasKey(w => w.Id);

        builder.Property(w => w.ProductCode).HasConversion<int>();
        builder.Property(w => w.TaskType).HasConversion<int>();
        builder.Property(w => w.ProvisioningPath).HasConversion<int>();

        builder.HasMany(w => w.Stages)
            .WithOne(s => s.WorkflowDefinition)
            .HasForeignKey(s => s.WorkflowDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(w => new { w.ProductCode, w.TaskType, w.ProvisioningPath })
            .IsUnique()
            .HasFilter("[IsActive] = 1");
    }
}
