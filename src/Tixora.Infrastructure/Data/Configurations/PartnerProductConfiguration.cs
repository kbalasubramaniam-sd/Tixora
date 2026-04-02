// File: src/Tixora.Infrastructure/Data/Configurations/PartnerProductConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Data.Configurations;

public class PartnerProductConfiguration : IEntityTypeConfiguration<PartnerProduct>
{
    public void Configure(EntityTypeBuilder<PartnerProduct> builder)
    {
        builder.HasKey(pp => pp.Id);

        builder.Property(pp => pp.ProductCode).HasConversion<int>();
        builder.Property(pp => pp.LifecycleState).HasConversion<int>().HasDefaultValue(LifecycleState.None);
        builder.Property(pp => pp.CompanyCode).IsRequired().HasMaxLength(50);

        builder.HasOne(pp => pp.Product)
            .WithMany()
            .HasForeignKey(pp => pp.ProductCode)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(pp => pp.Tickets)
            .WithOne(t => t.PartnerProduct)
            .HasForeignKey(t => t.PartnerProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(pp => new { pp.PartnerId, pp.ProductCode }).IsUnique();
    }
}
