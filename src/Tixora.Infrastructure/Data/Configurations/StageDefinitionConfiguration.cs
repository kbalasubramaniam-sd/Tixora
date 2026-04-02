// File: src/Tixora.Infrastructure/Data/Configurations/StageDefinitionConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class StageDefinitionConfiguration : IEntityTypeConfiguration<StageDefinition>
{
    public void Configure(EntityTypeBuilder<StageDefinition> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.StageName).IsRequired().HasMaxLength(200);
        builder.Property(s => s.StageType).HasConversion<int>();
        builder.Property(s => s.AssignedRole).HasConversion<int>();

        builder.HasIndex(s => new { s.WorkflowDefinitionId, s.StageOrder }).IsUnique();
    }
}
