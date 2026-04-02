using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Tixora.Domain.Entities;

namespace Tixora.Application.Interfaces;

public interface ITixoraDbContext
{
    DbSet<Ticket> Tickets { get; }
    DbSet<Partner> Partners { get; }
    DbSet<PartnerProduct> PartnerProducts { get; }
    DbSet<Product> Products { get; }
    DbSet<User> Users { get; }
    DbSet<WorkflowDefinition> WorkflowDefinitions { get; }
    DbSet<StageDefinition> StageDefinitions { get; }
    DbSet<StageLog> StageLogs { get; }
    DbSet<AuditEntry> AuditEntries { get; }
    DbSet<Comment> Comments { get; }
    DbSet<Document> Documents { get; }
    DbSet<SlaTracker> SlaTrackers { get; }
    DbSet<SlaPause> SlaPauses { get; }
    DbSet<BusinessHoursConfig> BusinessHoursConfigs { get; }
    DbSet<Holiday> Holidays { get; }
    DbSet<Notification> Notifications { get; }

    DatabaseFacade Database { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
