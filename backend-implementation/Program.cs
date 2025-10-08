using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using 241RunnersAPI.Startup;

namespace 241RunnersAPI
{
    /// <summary>
    /// Main program entry point for the 241 Runners API
    /// </summary>
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Configure services
            builder.Services.ConfigureServices(builder.Configuration);

            var app = builder.Build();

            // Configure pipeline
            app.ConfigurePipeline(app.Environment);

            // Configure database
            await app.ConfigureDatabaseAsync();

            // Run the application
            await app.RunAsync();
        }
    }
}
