using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class ShipmentConfiguration : IEntityTypeConfiguration<Shipment>
{
    public void Configure(EntityTypeBuilder<Shipment> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Status).HasConversion<int>();
        builder.Property(s => s.RecipientName).IsRequired().HasMaxLength(200);
        builder.Property(s => s.RecipientCompany).IsRequired().HasMaxLength(200);
        builder.Property(s => s.RecipientPhone).IsRequired().HasMaxLength(50);
        builder.Property(s => s.AddressLine1).IsRequired().HasMaxLength(500);
        builder.Property(s => s.AddressLine2).HasMaxLength(500);
        builder.Property(s => s.City).IsRequired().HasMaxLength(100);
        builder.Property(s => s.StateProvince).IsRequired().HasMaxLength(100);
        builder.Property(s => s.PostalCode).IsRequired().HasMaxLength(20);
        builder.Property(s => s.CountryCode).IsRequired().HasMaxLength(2);
        builder.Property(s => s.ServiceType).IsRequired().HasMaxLength(50);
        builder.Property(s => s.TrackingNumber).HasMaxLength(50);
        builder.Property(s => s.LabelPath).HasMaxLength(500);
        builder.Property(s => s.WeightKg).HasPrecision(10, 2);

        builder.HasOne(s => s.Ticket).WithMany().HasForeignKey(s => s.TicketId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(s => s.CreatedBy).WithMany().HasForeignKey(s => s.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => s.TicketId);
        builder.HasIndex(s => s.TrackingNumber);
    }
}
