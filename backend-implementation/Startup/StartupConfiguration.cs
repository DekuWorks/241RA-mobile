using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using 241RunnersAPI.Configuration;
using 241RunnersAPI.Data;
using 241RunnersAPI.Services;

namespace 241RunnersAPI.Startup
{
    /// <summary>
    /// Startup configuration for the 241 Runners API
    /// </summary>
    public static class StartupConfiguration
    {
        /// <summary>
        /// Configure services
        /// </summary>
        public static IServiceCollection ConfigureServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Database services
            services.AddDatabaseServices(configuration);

            // Runner profile services
            services.AddRunnerProfileServices();

            // Notification services
            services.AddNotificationServices(configuration);

            // Azure services
            services.AddAzureServices(configuration);

            // CORS services
            services.AddCorsServices();

            // Authentication services
            services.AddAuthenticationServices(configuration);

            // Logging services
            services.AddLoggingServices();

            // Health check services
            services.AddHealthCheckServices();

            // API controllers
            services.AddControllers();

            // Swagger/OpenAPI
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "241 Runners API",
                    Version = "v1",
                    Description = "API for the 241 Runners mobile application",
                    Contact = new OpenApiContact
                    {
                        Name = "241 Runners Team",
                        Email = "support@241runnersawareness.org"
                    }
                });

                // Add JWT authentication to Swagger
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
            });

            // AutoMapper (if you're using it)
            services.AddAutoMapper(typeof(Startup));

            return services;
        }

        /// <summary>
        /// Configure the application pipeline
        /// </summary>
        public static IApplicationBuilder ConfigurePipeline(this IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "241 Runners API v1");
                    c.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
                });
            }
            else
            {
                app.UseExceptionHandler("/Error");
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();

            // CORS must be before authentication
            app.UseCors("AllowMobileApp");

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapHealthChecks("/health");
            });

            return app;
        }

        /// <summary>
        /// Configure database migration and seeding
        /// </summary>
        public static async Task ConfigureDatabaseAsync(this IApplicationBuilder app)
        {
            using var scope = app.ApplicationServices.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            try
            {
                // Ensure database is created
                await context.Database.EnsureCreatedAsync();

                // Run any pending migrations
                if (context.Database.GetPendingMigrations().Any())
                {
                    await context.Database.MigrateAsync();
                }

                // Seed initial data if needed
                await SeedInitialDataAsync(context);
            }
            catch (Exception ex)
            {
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "An error occurred while configuring the database");
                throw;
            }
        }

        /// <summary>
        /// Seed initial data
        /// </summary>
        private static async Task SeedInitialDataAsync(ApplicationDbContext context)
        {
            // Add any initial data seeding here
            // For example, default notification settings for existing users
            
            if (!context.NotificationSettings.Any())
            {
                // This would typically be done when users are created
                // But you might want to add default settings here
            }

            await context.SaveChangesAsync();
        }
    }
}
