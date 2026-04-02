// File: src/Tixora.Infrastructure/Data/Configurations/PartnerConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class PartnerConfiguration : IEntityTypeConfiguration<Partner>
{
    public void Configure(EntityTypeBuilder<Partner> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Alias).HasMaxLength(200);

        builder.HasMany(p => p.PartnerProducts)
            .WithOne(pp => pp.Partner)
            .HasForeignKey(pp => pp.PartnerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
