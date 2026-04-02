using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Tixora.Application.Interfaces;

namespace Tixora.Infrastructure.Services;

public class SlaMonitoringService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SlaMonitoringService> _logger;

    public SlaMonitoringService(IServiceScopeFactory scopeFactory, ILogger<SlaMonitoringService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ITixoraDbContext>();
                var slaService = scope.ServiceProvider.GetRequiredService<ISlaService>();

                var activeTrackers = await db.SlaTrackers
                    .Where(s => s.IsActive)
                    .Select(s => s.Id)
                    .ToListAsync(stoppingToken);

                foreach (var trackerId in activeTrackers)
                {
                    await slaService.RecalculateAsync(trackerId);
                }

                _logger.LogInformation("SLA monitoring: recalculated {Count} active trackers", activeTrackers.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SLA monitoring error");
            }

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}
