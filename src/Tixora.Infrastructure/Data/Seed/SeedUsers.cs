// File: src/Tixora.Infrastructure/Data/Seed/SeedUsers.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Data.Seed;

public static class SeedUsers
{
    // Pre-computed BCrypt hash of "Password1!" — avoids slow hashing during HasData seeding.
    // Generated via: BCrypt.Net.BCrypt.HashPassword("Password1!")
    private const string PasswordHash = "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2";

    public static readonly Guid SarahAhmadId = new("a1b2c3d4-0001-0001-0001-000000000001");
    public static readonly Guid OmarKhalidId = new("a1b2c3d4-0001-0001-0001-000000000002");
    public static readonly Guid HannounId = new("a1b2c3d4-0001-0001-0001-000000000003");
    public static readonly Guid AlbahaId = new("a1b2c3d4-0001-0001-0001-000000000004");
    public static readonly Guid FatimaNoorId = new("a1b2c3d4-0001-0001-0001-000000000005");
    public static readonly Guid KhalidRashedId = new("a1b2c3d4-0001-0001-0001-000000000006");
    public static readonly Guid AhmedTariqId = new("a1b2c3d4-0001-0001-0001-000000000007");
    public static readonly Guid LaylaHassanId = new("a1b2c3d4-0001-0001-0001-000000000008");
    public static readonly Guid VilinaSequeiraId = new("a1b2c3d4-0001-0001-0001-000000000009");
    public static readonly Guid SaraRaeedId = new("a1b2c3d4-0001-0001-0001-00000000000a");
    public static readonly Guid ShaymanAliId = new("a1b2c3d4-0001-0001-0001-00000000000b");
    public static readonly Guid AdminUserId = new("a1b2c3d4-0001-0001-0001-00000000000c");

    public static void Seed(ModelBuilder modelBuilder)
    {
        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = SarahAhmadId,
                FullName = "Sarah Ahmad",
                Email = "sarah.ahmad@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.Requester,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = OmarKhalidId,
                FullName = "Omar Khalid",
                Email = "omar.khalid@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.LegalTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = HannounId,
                FullName = "Hannoun",
                Email = "hannoun@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.ProductTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = AlbahaId,
                FullName = "Albaha",
                Email = "albaha@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.ProductTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = FatimaNoorId,
                FullName = "Fatima Noor",
                Email = "fatima.noor@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.Approver,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = KhalidRashedId,
                FullName = "Khalid Rashed",
                Email = "khalid.rashed@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.IntegrationTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = AhmedTariqId,
                FullName = "Ahmed Tariq",
                Email = "ahmed.tariq@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.DevTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = LaylaHassanId,
                FullName = "Layla Hassan",
                Email = "layla.hassan@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.BusinessTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = VilinaSequeiraId,
                FullName = "Vilina Sequeira",
                Email = "vilina.sequeira@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.PartnerOps,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = SaraRaeedId,
                FullName = "Sara Raeed",
                Email = "sara.raeed@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.PartnerOps,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = ShaymanAliId,
                FullName = "Shayman Ali",
                Email = "shayman.ali@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.PartnerOps,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = AdminUserId,
                FullName = "Admin User",
                Email = "admin@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.SystemAdministrator,
                IsActive = true,
                CreatedAt = now
            }
        );
    }
}
