// File: src/Tixora.Infrastructure/Data/Seed/SeedPartners.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Data.Seed;

public static class SeedPartners
{
    // Partner IDs
    public static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");
    public static readonly Guid DubaiIslamicBankId = new("b2c3d4e5-0002-0002-0002-000000000002");
    public static readonly Guid EmiratesInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000003");

    // PartnerProduct IDs
    public static readonly Guid AaiRabetId = new("c3d4e5f6-0003-0003-0003-000000000001");
    public static readonly Guid AaiWtheeqId = new("c3d4e5f6-0003-0003-0003-000000000002");
    public static readonly Guid DibRhoonId = new("c3d4e5f6-0003-0003-0003-000000000003");
    public static readonly Guid DibMulemId = new("c3d4e5f6-0003-0003-0003-000000000004");
    public static readonly Guid EicRabetId = new("c3d4e5f6-0003-0003-0003-000000000005");
    public static readonly Guid EicRhoonId = new("c3d4e5f6-0003-0003-0003-000000000006");

    public static void Seed(ModelBuilder modelBuilder)
    {
        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // Partners
        modelBuilder.Entity<Partner>().HasData(
            new Partner
            {
                Id = AlAinInsuranceId,
                Name = "Al Ain Insurance",
                Alias = "AAI",
                CreatedAt = now
            },
            new Partner
            {
                Id = DubaiIslamicBankId,
                Name = "Dubai Islamic Bank",
                Alias = "DIB",
                CreatedAt = now
            },
            new Partner
            {
                Id = EmiratesInsuranceId,
                Name = "Emirates Insurance",
                Alias = "EIC",
                CreatedAt = now
            }
        );

        // PartnerProducts — all start at LifecycleState.None, no CompanyCode
        modelBuilder.Entity<PartnerProduct>().HasData(
            // Al Ain Insurance → Rabet
            new PartnerProduct
            {
                Id = AaiRabetId,
                PartnerId = AlAinInsuranceId,
                ProductCode = ProductCode.RBT,
                LifecycleState = LifecycleState.None,
                CompanyCode = null,
                StateChangedAt = now,
                CreatedAt = now
            },
            // Al Ain Insurance → Wtheeq
            new PartnerProduct
            {
                Id = AaiWtheeqId,
                PartnerId = AlAinInsuranceId,
                ProductCode = ProductCode.WTQ,
                LifecycleState = LifecycleState.None,
                CompanyCode = null,
                StateChangedAt = now,
                CreatedAt = now
            },
            // Dubai Islamic Bank → Rhoon
            new PartnerProduct
            {
                Id = DibRhoonId,
                PartnerId = DubaiIslamicBankId,
                ProductCode = ProductCode.RHN,
                LifecycleState = LifecycleState.None,
                CompanyCode = null,
                StateChangedAt = now,
                CreatedAt = now
            },
            // Dubai Islamic Bank → Mulem
            new PartnerProduct
            {
                Id = DibMulemId,
                PartnerId = DubaiIslamicBankId,
                ProductCode = ProductCode.MLM,
                LifecycleState = LifecycleState.None,
                CompanyCode = null,
                StateChangedAt = now,
                CreatedAt = now
            },
            // Emirates Insurance → Rabet
            new PartnerProduct
            {
                Id = EicRabetId,
                PartnerId = EmiratesInsuranceId,
                ProductCode = ProductCode.RBT,
                LifecycleState = LifecycleState.None,
                CompanyCode = null,
                StateChangedAt = now,
                CreatedAt = now
            },
            // Emirates Insurance → Rhoon
            new PartnerProduct
            {
                Id = EicRhoonId,
                PartnerId = EmiratesInsuranceId,
                ProductCode = ProductCode.RHN,
                LifecycleState = LifecycleState.None,
                CompanyCode = null,
                StateChangedAt = now,
                CreatedAt = now
            }
        );
    }
}
