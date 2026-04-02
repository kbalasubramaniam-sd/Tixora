// File: src/Tixora.Infrastructure/Data/Seed/SeedProducts.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Data.Seed;

public static class SeedProducts
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>().HasData(
            new Product
            {
                Code = ProductCode.RBT,
                Name = "Rabet",
                Description = "Insurance data to ICP",
                ProductAccessMode = ProductAccessMode.Both,
                PortalType = PortalType.Transactional
            },
            new Product
            {
                Code = ProductCode.RHN,
                Name = "Rhoon",
                Description = "Mortgage transactions",
                ProductAccessMode = ProductAccessMode.Both,
                PortalType = PortalType.Transactional
            },
            new Product
            {
                Code = ProductCode.WTQ,
                Name = "Wtheeq",
                Description = "Vehicle insurance data",
                ProductAccessMode = ProductAccessMode.Both,
                PortalType = PortalType.ReadOnly
            },
            new Product
            {
                Code = ProductCode.MLM,
                Name = "Mulem",
                Description = "Motor insurance pricing",
                ProductAccessMode = ProductAccessMode.Both,
                PortalType = PortalType.ReadOnly
            }
        );
    }
}
