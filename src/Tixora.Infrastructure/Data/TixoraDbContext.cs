// File: src/Tixora.Infrastructure/Data/TixoraDbContext.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Application.Interfaces;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data;

public class TixoraDbContext : DbContext, ITixoraDbContext
{
    public TixoraDbContext(DbContextOptions<TixoraDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<PartnerProduct> PartnerProducts => Set<PartnerProduct>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<WorkflowDefinition> WorkflowDefinitions => Set<WorkflowDefinition>();
    public DbSet<StageDefinition> StageDefinitions => Set<StageDefinition>();
    public DbSet<StageLog> StageLogs => Set<StageLog>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<SlaTracker> SlaTrackers => Set<SlaTracker>();
    public DbSet<SlaPause> SlaPauses => Set<SlaPause>();
    public DbSet<BusinessHoursConfig> BusinessHoursConfigs => Set<BusinessHoursConfig>();
    public DbSet<Holiday> Holidays => Set<Holiday>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<DelegateApprover> DelegateApprovers => Set<DelegateApprover>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TixoraDbContext).Assembly);

        // Seed reference data
        Seed.SeedProducts.Seed(modelBuilder);
        Seed.SeedUsers.Seed(modelBuilder);
        Seed.SeedPartners.Seed(modelBuilder);
        Seed.SeedWorkflows.Seed(modelBuilder);
        Seed.SeedBusinessHours.Seed(modelBuilder);
    }
}
