// File: src/Tixora.Infrastructure/Data/Seed/SeedUsers.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Data.Seed;

public static class SeedUsers
{
    // Pre-computed BCrypt hash of "Password1!" — avoids slow hashing during HasData seeding.
    private const string PasswordHash = "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2";

    public static readonly Guid ParankushId = new("a1b2c3d4-0001-0001-0001-000000000001");
    public static readonly Guid BahnasId = new("a1b2c3d4-0001-0001-0001-000000000002");
    public static readonly Guid LeenaId = new("a1b2c3d4-0001-0001-0001-000000000005");
    public static readonly Guid FaizId = new("a1b2c3d4-0001-0001-0001-000000000006");
    public static readonly Guid KarthikId = new("a1b2c3d4-0001-0001-0001-000000000007");
    public static readonly Guid FaresId = new("a1b2c3d4-0001-0001-0001-000000000008");
    public static readonly Guid VileenaId = new("a1b2c3d4-0001-0001-0001-000000000009");
    public static readonly Guid AlbahaId = new("a1b2c3d4-0001-0001-0001-000000000004");
    public static readonly Guid AdminUserId = new("a1b2c3d4-0001-0001-0001-00000000000c");

    public static void Seed(ModelBuilder modelBuilder)
    {
        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = ParankushId,
                FullName = "Parankush",
                Email = "parankush@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.PartnershipTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = BahnasId,
                FullName = "Bahnas",
                Email = "bahnas@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.LegalTeam,
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
                Id = LeenaId,
                FullName = "Leena",
                Email = "leena@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.ExecutiveAuthority,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = FaizId,
                FullName = "Faiz Siddiqui",
                Email = "faiz@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.IntegrationTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = KarthikId,
                FullName = "Karthik",
                Email = "karthik@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.DevTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = FaresId,
                FullName = "Fares Alotaibi",
                Email = "fares@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.BusinessTeam,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = VileenaId,
                FullName = "Vileena",
                Email = "vileena@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.PartnerOps,
                IsActive = true,
                CreatedAt = now
            },
            new User
            {
                Id = AdminUserId,
                FullName = "Admin",
                Email = "admin@tixora.ae",
                PasswordHash = PasswordHash,
                Role = UserRole.SystemAdministrator,
                IsActive = true,
                CreatedAt = now
            }
        );
    }
}
