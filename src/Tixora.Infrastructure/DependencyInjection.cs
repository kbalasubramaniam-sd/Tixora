using Amazon;
using Amazon.S3;
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
        services.AddScoped<ITicketQueryService, TicketQueryService>();
        services.AddScoped<ICommentService, CommentService>();
        var storageProvider = configuration.GetValue<string>("Storage:Provider") ?? "Local";
        if (storageProvider.Equals("S3", StringComparison.OrdinalIgnoreCase))
        {
            services.Configure<S3StorageSettings>(configuration.GetSection("Storage:S3"));
            var s3Settings = configuration.GetSection("Storage:S3").Get<S3StorageSettings>();
            services.AddSingleton<IAmazonS3>(sp =>
            {
                var config = new AmazonS3Config
                {
                    RegionEndpoint = RegionEndpoint.GetBySystemName(s3Settings?.Region ?? "me-south-1")
                };
                return new AmazonS3Client(config); // uses default credential chain (env vars, IAM role, etc.)
            });
            services.AddSingleton<IFileStorage, S3FileStorage>();
        }
        else
        {
            services.AddSingleton<IFileStorage>(new LocalFileStorage(
                Path.Combine(Directory.GetCurrentDirectory(), "uploads")));
        }
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<ISlaService, SlaService>();
        services.AddScoped<INotificationService, NotificationService>();

        var emailProvider = configuration.GetValue<string>("Email:Provider") ?? "None";
        if (emailProvider.Equals("Brevo", StringComparison.OrdinalIgnoreCase))
        {
            services.Configure<BrevoEmailSettings>(configuration.GetSection("Email:Brevo"));
            services.AddHttpClient<IEmailSender, BrevoEmailSender>();
        }
        else
        {
            services.AddSingleton<IEmailSender, NoOpEmailSender>();
        }

        var shippingProvider = configuration.GetValue<string>("Shipping:Provider") ?? "None";
        if (shippingProvider.Equals("FedEx", StringComparison.OrdinalIgnoreCase))
        {
            services.Configure<FedExSettings>(configuration.GetSection("Shipping:FedEx"));
            services.AddHttpClient<IShippingProvider, FedExShippingProvider>();
        }
        else
        {
            services.AddSingleton<IShippingProvider, NoOpShippingProvider>();
        }
        services.AddScoped<IShipmentService, ShipmentService>();

        services.AddScoped<ISearchService, SearchService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IAdminService, AdminService>();

        return services;
    }
}
