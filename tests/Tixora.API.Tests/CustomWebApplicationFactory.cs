// File: tests/Tixora.API.Tests/CustomWebApplicationFactory.cs
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Tixora.Infrastructure.Data;

namespace Tixora.API.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"TixoraTest_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TixoraDev_SuperSecret_Key_2026_MustBe32Chars!!",
                ["Jwt:Issuer"] = "Tixora.API",
                ["Jwt:Audience"] = "Tixora.Client",
                ["Jwt:ExpiryHours"] = "24"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove ALL registrations related to TixoraDbContext and EF Core infrastructure
            // to avoid "both SqlServer and InMemory providers registered" error
            var descriptorsToRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<TixoraDbContext>) ||
                    d.ServiceType == typeof(DbContextOptions) ||
                    d.ServiceType == typeof(TixoraDbContext) ||
                    d.ServiceType == typeof(IDbContextOptionsConfiguration<TixoraDbContext>))
                .ToList();
            foreach (var d in descriptorsToRemove) services.Remove(d);

            // Add InMemory database
            services.AddDbContext<TixoraDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));

            // Re-register ITixoraDbContext to resolve from the new InMemory TixoraDbContext
            var itixoraDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(Tixora.Application.Interfaces.ITixoraDbContext));
            if (itixoraDescriptor != null) services.Remove(itixoraDescriptor);
            services.AddScoped<Tixora.Application.Interfaces.ITixoraDbContext>(
                provider => provider.GetRequiredService<TixoraDbContext>());
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        // Seed the InMemory database after the host is fully built
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TixoraDbContext>();
        db.Database.EnsureCreated();

        return host;
    }
}
