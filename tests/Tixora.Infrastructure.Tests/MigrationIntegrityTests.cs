using Microsoft.EntityFrameworkCore;
using Tixora.Infrastructure.Data;

namespace Tixora.Infrastructure.Tests;

/// <summary>
/// Verifies EF Core migrations are complete — every entity's table has a
/// corresponding CreateTable in the migration files. Catches the exact bug
/// where SlaTrackers was in the DbContext model but missing from migrations.
/// </summary>
public class MigrationIntegrityTests
{
    [Fact]
    public void AllModelTables_HaveCreateTable_InMigrations()
    {
        var options = new DbContextOptionsBuilder<TixoraDbContext>()
            .UseInMemoryDatabase($"MigrationTest_{Guid.NewGuid()}")
            .Options;

        using var db = new TixoraDbContext(options);

        // Collect all CreateTable("XYZ") calls from migration .cs files
        var migrationsDir = FindMigrationsDirectory();
        Assert.NotNull(migrationsDir);

        var migrationContent = Directory.GetFiles(migrationsDir, "*.cs")
            .Where(f => !f.Contains(".Designer.") && !f.Contains("ModelSnapshot"))
            .Select(File.ReadAllText)
            .Aggregate("", (a, b) => a + b);

        var createdTables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (System.Text.RegularExpressions.Match m in System.Text.RegularExpressions.Regex.Matches(
            migrationContent, @"CreateTable\s*\(\s*\n?\s*name:\s*""([^""]+)"""))
        {
            createdTables.Add(m.Groups[1].Value);
        }

        // Get all DbSet property names from TixoraDbContext — these ARE the table names
        var dbSetTables = typeof(TixoraDbContext)
            .GetProperties()
            .Where(p => p.PropertyType.IsGenericType &&
                        p.PropertyType.GetGenericTypeDefinition().Name.StartsWith("DbSet"))
            .Select(p => p.Name)
            .ToList();

        var missingTables = dbSetTables
            .Where(t => !createdTables.Contains(t))
            .OrderBy(t => t)
            .ToList();

        Assert.True(
            missingTables.Count == 0,
            $"DbSet tables with no CreateTable in any migration: [{string.Join(", ", missingTables)}]. " +
            "A migration's Up() is missing CreateTable. Run: " +
            "dotnet ef migrations add <Name> --project src/Tixora.Infrastructure --startup-project src/Tixora.API"
        );
    }

    [Fact]
    public void AllDbSets_AreQueryable()
    {
        var options = new DbContextOptionsBuilder<TixoraDbContext>()
            .UseInMemoryDatabase($"MigrationTest_{Guid.NewGuid()}")
            .Options;

        using var db = new TixoraDbContext(options);
        db.Database.EnsureCreated();

        var failures = new List<string>();

        TryQuery(() => db.Users.Count(), "Users", failures);
        TryQuery(() => db.Products.Count(), "Products", failures);
        TryQuery(() => db.Partners.Count(), "Partners", failures);
        TryQuery(() => db.Tickets.Count(), "Tickets", failures);
        TryQuery(() => db.WorkflowDefinitions.Count(), "WorkflowDefinitions", failures);
        TryQuery(() => db.StageDefinitions.Count(), "StageDefinitions", failures);
        TryQuery(() => db.StageLogs.Count(), "StageLogs", failures);
        TryQuery(() => db.AuditEntries.Count(), "AuditEntries", failures);
        TryQuery(() => db.SlaTrackers.Count(), "SlaTrackers", failures);
        TryQuery(() => db.SlaPauses.Count(), "SlaPauses", failures);
        TryQuery(() => db.Shipments.Count(), "Shipments", failures);

        Assert.True(
            failures.Count == 0,
            $"DbSets that failed to query: [{string.Join(", ", failures)}]"
        );
    }

    private static string? FindMigrationsDirectory()
    {
        var dir = AppContext.BaseDirectory;
        for (var i = 0; i < 10; i++)
        {
            var candidate = Path.Combine(dir, "src", "Tixora.Infrastructure", "Migrations");
            if (Directory.Exists(candidate)) return candidate;
            dir = Path.GetDirectoryName(dir)!;
        }
        return null;
    }

    private static void TryQuery(Func<int> query, string name, List<string> failures)
    {
        try { query(); }
        catch { failures.Add(name); }
    }
}
