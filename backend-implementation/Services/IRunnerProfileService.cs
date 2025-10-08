using 241RunnersAPI.DTOs;

namespace 241RunnersAPI.Services
{
    /// <summary>
    /// Service interface for managing runner profiles
    /// </summary>
    public interface IRunnerProfileService
    {
        /// <summary>
        /// Get runner profile by user ID
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>Runner profile or null if not found</returns>
        Task<RunnerProfileDto?> GetByUserIdAsync(string userId);

        /// <summary>
        /// Check if runner profile exists for user
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>True if profile exists</returns>
        Task<bool> ExistsByUserIdAsync(string userId);

        /// <summary>
        /// Create a new runner profile
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="dto">Profile data</param>
        /// <returns>Created profile</returns>
        Task<RunnerProfileDto> CreateAsync(string userId, CreateRunnerProfileDto dto);

        /// <summary>
        /// Update existing runner profile
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="dto">Updated profile data</param>
        /// <returns>Updated profile</returns>
        Task<RunnerProfileDto> UpdateAsync(string userId, UpdateRunnerProfileDto dto);

        /// <summary>
        /// Delete runner profile
        /// </summary>
        /// <param name="userId">User ID</param>
        Task DeleteAsync(string userId);

        /// <summary>
        /// Calculate age from date of birth
        /// </summary>
        /// <param name="dateOfBirth">Date of birth</param>
        /// <returns>Age in years</returns>
        int CalculateAge(DateTime dateOfBirth);

        /// <summary>
        /// Check if photos need updating (older than 6 months)
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>True if photos need updating</returns>
        Task<bool> NeedsPhotoUpdateAsync(string userId);

        /// <summary>
        /// Get days since last photo update
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>Days since last update</returns>
        Task<int> GetDaysSinceLastPhotoUpdateAsync(string userId);

        /// <summary>
        /// Get notification settings for user
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>Notification settings</returns>
        Task<NotificationSettingsDto> GetNotificationSettingsAsync(string userId);

        /// <summary>
        /// Update notification settings for user
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="settings">Notification settings</param>
        /// <returns>Updated settings</returns>
        Task<NotificationSettingsDto> UpdateNotificationSettingsAsync(string userId, NotificationSettingsDto settings);

        /// <summary>
        /// Get photo update reminders for user
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>List of reminders</returns>
        Task<IEnumerable<PhotoUpdateReminderDto>> GetPhotoRemindersAsync(string userId);

        /// <summary>
        /// Dismiss a photo update reminder
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="reminderId">Reminder ID</param>
        Task DismissPhotoReminderAsync(string userId, Guid reminderId);

        /// <summary>
        /// Create photo update reminder
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="reminderDate">Reminder date</param>
        /// <param name="reminderType">Type of reminder</param>
        Task CreatePhotoReminderAsync(string userId, DateTime reminderDate, string reminderType);

        /// <summary>
        /// Update last photo update timestamp
        /// </summary>
        /// <param name="userId">User ID</param>
        Task UpdateLastPhotoUpdateAsync(string userId);
    }
}
