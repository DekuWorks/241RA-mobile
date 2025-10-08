using Microsoft.EntityFrameworkCore;
using 241RunnersAPI.Data;
using 241RunnersAPI.Models;

namespace 241RunnersAPI.Services
{
    /// <summary>
    /// Background service for processing photo update reminders
    /// </summary>
    public class PhotoReminderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<PhotoReminderService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(24); // Check daily

        public PhotoReminderService(IServiceProvider serviceProvider, ILogger<PhotoReminderService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Photo Reminder Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessReminders();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing photo reminders");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("Photo Reminder Service stopped");
        }

        private async Task ProcessReminders()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
            var pushNotificationService = scope.ServiceProvider.GetRequiredService<IPushNotificationService>();

            try
            {
                // Get profiles with photos older than 6 months
                var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
                
                var profilesNeedingReminders = await context.RunnerProfiles
                    .Include(rp => rp.Photos)
                    .Where(rp => rp.IsActive && 
                                rp.LastPhotoUpdate.HasValue && 
                                rp.LastPhotoUpdate < sixMonthsAgo)
                    .ToListAsync();

                _logger.LogInformation("Found {Count} profiles needing photo updates", profilesNeedingReminders.Count);

                foreach (var profile in profilesNeedingReminders)
                {
                    await ProcessProfileReminder(profile, context, emailService, pushNotificationService);
                }

                // Clean up old reminders (older than 30 days)
                var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
                var oldReminders = await context.PhotoUpdateReminders
                    .Where(pr => pr.CreatedAt < thirtyDaysAgo)
                    .ToListAsync();

                if (oldReminders.Any())
                {
                    context.PhotoUpdateReminders.RemoveRange(oldReminders);
                    await context.SaveChangesAsync();
                    _logger.LogInformation("Cleaned up {Count} old reminders", oldReminders.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing photo reminders");
            }
        }

        private async Task ProcessProfileReminder(
            RunnerProfile profile, 
            ApplicationDbContext context, 
            IEmailService emailService, 
            IPushNotificationService pushNotificationService)
        {
            try
            {
                // Check if we've already sent a reminder recently (within 7 days)
                var recentReminder = await context.PhotoUpdateReminders
                    .Where(pr => pr.RunnerProfileId == profile.Id && 
                                pr.CreatedAt > DateTime.UtcNow.AddDays(-7))
                    .FirstOrDefaultAsync();

                if (recentReminder != null)
                {
                    _logger.LogDebug("Skipping reminder for profile {ProfileId} - already sent recently", profile.Id);
                    return;
                }

                // Get user's notification settings
                var notificationSettings = await context.NotificationSettings
                    .FirstOrDefaultAsync(ns => ns.UserId == profile.UserId);

                if (notificationSettings == null)
                {
                    _logger.LogWarning("No notification settings found for user {UserId}", profile.UserId);
                    return;
                }

                // Create reminder record
                var reminder = new PhotoUpdateReminder
                {
                    Id = Guid.NewGuid(),
                    RunnerProfileId = profile.Id,
                    ReminderDate = DateTime.UtcNow,
                    ReminderType = GetReminderType(notificationSettings),
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow
                };

                context.PhotoUpdateReminders.Add(reminder);

                // Send notifications based on user preferences
                var tasks = new List<Task>();

                if (notificationSettings.EmailNotifications)
                {
                    tasks.Add(SendEmailReminder(profile, emailService, reminder));
                }

                if (notificationSettings.PushNotifications)
                {
                    tasks.Add(SendPushReminder(profile, pushNotificationService, reminder));
                }

                // Wait for all notifications to be sent
                await Task.WhenAll(tasks);

                // Update reminder status
                reminder.Status = "sent";
                reminder.SentAt = DateTime.UtcNow;

                // Update profile reminder count
                profile.ReminderCount++;
                profile.UpdatedAt = DateTime.UtcNow;

                await context.SaveChangesAsync();

                _logger.LogInformation("Sent photo update reminder for profile {ProfileId}", profile.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing reminder for profile {ProfileId}", profile.Id);
            }
        }

        private async Task SendEmailReminder(RunnerProfile profile, IEmailService emailService, PhotoUpdateReminder reminder)
        {
            try
            {
                var subject = "Photo Update Reminder - 241 Runners";
                var body = $@"
                    <h2>Photo Update Reminder</h2>
                    <p>Hello {profile.FirstName},</p>
                    <p>It's been 6 months since you last updated your runner profile photos. 
                    Please log in to the 241 Runners app to upload new photos to keep your profile current.</p>
                    <p>This helps ensure accurate identification in case of an emergency.</p>
                    <p>Thank you for keeping your profile up to date!</p>
                    <p>- 241 Runners Team</p>
                ";

                await emailService.SendEmailAsync(profile.UserId, subject, body);
                _logger.LogInformation("Sent email reminder for profile {ProfileId}", profile.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email reminder for profile {ProfileId}", profile.Id);
                reminder.Status = "failed";
            }
        }

        private async Task SendPushReminder(RunnerProfile profile, IPushNotificationService pushNotificationService, PhotoUpdateReminder reminder)
        {
            try
            {
                var title = "Photo Update Reminder";
                var message = "It's time to update your runner profile photos. Please upload new photos to keep your profile current.";

                await pushNotificationService.SendNotificationAsync(profile.UserId, title, message);
                _logger.LogInformation("Sent push reminder for profile {ProfileId}", profile.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending push reminder for profile {ProfileId}", profile.Id);
                reminder.Status = "failed";
            }
        }

        private string GetReminderType(NotificationSettings settings)
        {
            if (settings.EmailNotifications && settings.PushNotifications)
                return "both";
            else if (settings.EmailNotifications)
                return "email";
            else if (settings.PushNotifications)
                return "push";
            else
                return "none";
        }
    }

    /// <summary>
    /// Interface for email service
    /// </summary>
    public interface IEmailService
    {
        Task SendEmailAsync(string userId, string subject, string body);
        Task SendBulkEmailAsync(List<string> userIds, string subject, string body);
    }

    /// <summary>
    /// Interface for push notification service
    /// </summary>
    public interface IPushNotificationService
    {
        Task SendNotificationAsync(string userId, string title, string message);
        Task SendBulkNotificationAsync(List<string> userIds, string title, string message);
    }
}
