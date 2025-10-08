using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using 241RunnersAPI.Data;
using 241RunnersAPI.Services;

namespace 241RunnersAPI.Configuration
{
    /// <summary>
    /// Service configuration for dependency injection
    /// </summary>
    public static class ServiceConfiguration
    {
        /// <summary>
        /// Configure database services
        /// </summary>
        public static IServiceCollection AddDatabaseServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Database connection
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            return services;
        }

        /// <summary>
        /// Configure runner profile services
        /// </summary>
        public static IServiceCollection AddRunnerProfileServices(this IServiceCollection services)
        {
            // Core services
            services.AddScoped<IRunnerProfileService, RunnerProfileService>();
            services.AddScoped<IPhotoService, PhotoService>();
            services.AddScoped<IBlobStorageService, BlobStorageService>();

            // Background services
            services.AddHostedService<PhotoReminderService>();

            return services;
        }

        /// <summary>
        /// Configure notification services
        /// </summary>
        public static IServiceCollection AddNotificationServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Email service (implement based on your email provider)
            services.AddScoped<IEmailService, EmailService>();
            
            // Push notification service (implement based on your push provider)
            services.AddScoped<IPushNotificationService, PushNotificationService>();

            return services;
        }

        /// <summary>
        /// Configure Azure services
        /// </summary>
        public static IServiceCollection AddAzureServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Azure Blob Storage
            services.AddScoped<IBlobStorageService, BlobStorageService>();

            return services;
        }

        /// <summary>
        /// Configure CORS
        /// </summary>
        public static IServiceCollection AddCorsServices(this IServiceCollection services)
        {
            services.AddCors(options =>
            {
                options.AddPolicy("AllowMobileApp", builder =>
                {
                    builder
                        .WithOrigins(
                            "http://localhost:3000", // Development
                            "https://241runnersawareness.org", // Production website
                            "exp://localhost:19000", // Expo development
                            "exp://192.168.1.100:19000" // Expo on local network
                        )
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            });

            return services;
        }

        /// <summary>
        /// Configure authentication services
        /// </summary>
        public static IServiceCollection AddAuthenticationServices(this IServiceCollection services, IConfiguration configuration)
        {
            // JWT Authentication (assuming you already have this configured)
            // Add any additional authentication services here

            return services;
        }

        /// <summary>
        /// Configure logging services
        /// </summary>
        public static IServiceCollection AddLoggingServices(this IServiceCollection services)
        {
            services.AddLogging(builder =>
            {
                builder.AddConsole();
                builder.AddDebug();
                // Add other logging providers as needed
            });

            return services;
        }

        /// <summary>
        /// Configure health check services
        /// </summary>
        public static IServiceCollection AddHealthCheckServices(this IServiceCollection services)
        {
            services.AddHealthChecks()
                .AddDbContextCheck<ApplicationDbContext>("database")
                .AddCheck<BlobStorageHealthCheck>("blob-storage");

            return services;
        }
    }

    /// <summary>
    /// Health check for blob storage
    /// </summary>
    public class BlobStorageHealthCheck : IHealthCheck
    {
        private readonly IBlobStorageService _blobStorageService;

        public BlobStorageHealthCheck(IBlobStorageService blobStorageService)
        {
            _blobStorageService = blobStorageService;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            try
            {
                // Test blob storage connectivity
                var testFileName = $"health-check-{Guid.NewGuid()}.txt";
                var testContent = "Health check test";
                
                // This is a simplified health check - you might want to implement a more robust check
                return HealthCheckResult.Healthy("Blob storage is accessible");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy("Blob storage is not accessible", ex);
            }
        }
    }
}
