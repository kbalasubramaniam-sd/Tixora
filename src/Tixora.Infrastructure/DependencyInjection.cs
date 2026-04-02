using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Tixora.Application.Interfaces;
using Tixora.Infrastructure.Data;
using Tixora.Infrastructure.Services;

namespace Tixora.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<TixoraDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(TixoraDbContext).Assembly.FullName)));

        services.AddScoped<ITixoraDbContext>(provider => provider.GetRequiredService<TixoraDbContext>());
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IWorkflowEngine, WorkflowEngine>();

        return services;
    }
}
