using Microsoft.EntityFrameworkCore;
using 241RunnersAPI.Data;
using 241RunnersAPI.DTOs;
using 241RunnersAPI.Models;

namespace 241RunnersAPI.Services
{
    /// <summary>
    /// Service for managing runner profiles
    /// </summary>
    public class RunnerProfileService : IRunnerProfileService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RunnerProfileService> _logger;

        public RunnerProfileService(ApplicationDbContext context, ILogger<RunnerProfileService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<RunnerProfileDto?> GetByUserIdAsync(string userId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .Include(rp => rp.Photos)
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                    return null;

                return MapToDto(profile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting runner profile for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> ExistsByUserIdAsync(string userId)
        {
            try
            {
                return await _context.RunnerProfiles
                    .AnyAsync(rp => rp.UserId == userId && rp.IsActive);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking runner profile existence for user {UserId}", userId);
                throw;
            }
        }

        public async Task<RunnerProfileDto> CreateAsync(string userId, CreateRunnerProfileDto dto)
        {
            try
            {
                // Check if profile already exists
                if (await ExistsByUserIdAsync(userId))
                {
                    throw new ValidationException("Runner profile already exists for this user");
                }

                // Validate date of birth
                if (dto.DateOfBirth > DateTime.UtcNow)
                {
                    throw new ValidationException("Date of birth cannot be in the future");
                }

                if (dto.DateOfBirth < DateTime.UtcNow.AddYears(-120))
                {
                    throw new ValidationException("Date of birth is too old");
                }

                var profile = new RunnerProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    DateOfBirth = dto.DateOfBirth,
                    Height = dto.Height,
                    Weight = dto.Weight,
                    EyeColor = dto.EyeColor,
                    MedicalConditions = System.Text.Json.JsonSerializer.Serialize(dto.MedicalConditions),
                    AdditionalNotes = dto.AdditionalNotes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.RunnerProfiles.Add(profile);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created runner profile for user {UserId}", userId);
                return MapToDto(profile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating runner profile for user {UserId}", userId);
                throw;
            }
        }

        public async Task<RunnerProfileDto> UpdateAsync(string userId, UpdateRunnerProfileDto dto)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                {
                    throw new NotFoundException("Runner profile not found");
                }

                // Update fields if provided
                if (!string.IsNullOrEmpty(dto.FirstName))
                    profile.FirstName = dto.FirstName;

                if (!string.IsNullOrEmpty(dto.LastName))
                    profile.LastName = dto.LastName;

                if (dto.DateOfBirth.HasValue)
                {
                    if (dto.DateOfBirth.Value > DateTime.UtcNow)
                        throw new ValidationException("Date of birth cannot be in the future");
                    
                    profile.DateOfBirth = dto.DateOfBirth.Value;
                }

                if (!string.IsNullOrEmpty(dto.Height))
                    profile.Height = dto.Height;

                if (!string.IsNullOrEmpty(dto.Weight))
                    profile.Weight = dto.Weight;

                if (!string.IsNullOrEmpty(dto.EyeColor))
                    profile.EyeColor = dto.EyeColor;

                if (dto.MedicalConditions != null)
                    profile.MedicalConditions = System.Text.Json.JsonSerializer.Serialize(dto.MedicalConditions);

                if (dto.AdditionalNotes != null)
                    profile.AdditionalNotes = dto.AdditionalNotes;

                profile.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated runner profile for user {UserId}", userId);
                return await GetByUserIdAsync(userId) ?? throw new NotFoundException("Profile not found after update");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating runner profile for user {UserId}", userId);
                throw;
            }
        }

        public async Task DeleteAsync(string userId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                {
                    throw new NotFoundException("Runner profile not found");
                }

                profile.IsActive = false;
                profile.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted runner profile for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting runner profile for user {UserId}", userId);
                throw;
            }
        }

        public int CalculateAge(DateTime dateOfBirth)
        {
            var today = DateTime.UtcNow;
            var age = today.Year - dateOfBirth.Year;
            
            if (dateOfBirth.Date > today.AddYears(-age))
                age--;
                
            return age;
        }

        public async Task<bool> NeedsPhotoUpdateAsync(string userId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile?.LastPhotoUpdate == null)
                    return true;

                var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
                return profile.LastPhotoUpdate < sixMonthsAgo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking photo update need for user {UserId}", userId);
                throw;
            }
        }

        public async Task<int> GetDaysSinceLastPhotoUpdateAsync(string userId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile?.LastPhotoUpdate == null)
                    return int.MaxValue; // No photos ever uploaded

                return (DateTime.UtcNow - profile.LastPhotoUpdate.Value).Days;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting days since last photo update for user {UserId}", userId);
                throw;
            }
        }

        public async Task<NotificationSettingsDto> GetNotificationSettingsAsync(string userId)
        {
            try
            {
                var settings = await _context.NotificationSettings
                    .FirstOrDefaultAsync(ns => ns.UserId == userId);

                if (settings == null)
                {
                    // Create default settings
                    settings = new NotificationSettings
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        EmailNotifications = true,
                        PushNotifications = true,
                        ReminderFrequency = "weekly",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.NotificationSettings.Add(settings);
                    await _context.SaveChangesAsync();
                }

                return new NotificationSettingsDto
                {
                    EmailNotifications = settings.EmailNotifications,
                    PushNotifications = settings.PushNotifications,
                    ReminderFrequency = settings.ReminderFrequency
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification settings for user {UserId}", userId);
                throw;
            }
        }

        public async Task<NotificationSettingsDto> UpdateNotificationSettingsAsync(string userId, NotificationSettingsDto settings)
        {
            try
            {
                var existingSettings = await _context.NotificationSettings
                    .FirstOrDefaultAsync(ns => ns.UserId == userId);

                if (existingSettings == null)
                {
                    existingSettings = new NotificationSettings
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.NotificationSettings.Add(existingSettings);
                }

                existingSettings.EmailNotifications = settings.EmailNotifications;
                existingSettings.PushNotifications = settings.PushNotifications;
                existingSettings.ReminderFrequency = settings.ReminderFrequency;
                existingSettings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return settings;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification settings for user {UserId}", userId);
                throw;
            }
        }

        public async Task<IEnumerable<PhotoUpdateReminderDto>> GetPhotoRemindersAsync(string userId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                    return Enumerable.Empty<PhotoUpdateReminderDto>();

                var reminders = await _context.PhotoUpdateReminders
                    .Where(pr => pr.RunnerProfileId == profile.Id)
                    .OrderByDescending(pr => pr.CreatedAt)
                    .ToListAsync();

                return reminders.Select(MapToReminderDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting photo reminders for user {UserId}", userId);
                throw;
            }
        }

        public async Task DismissPhotoReminderAsync(string userId, Guid reminderId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                    throw new NotFoundException("Runner profile not found");

                var reminder = await _context.PhotoUpdateReminders
                    .FirstOrDefaultAsync(pr => pr.Id == reminderId && pr.RunnerProfileId == profile.Id);

                if (reminder == null)
                    throw new NotFoundException("Photo reminder not found");

                reminder.Status = "dismissed";
                await _context.SaveChangesAsync();

                _logger.LogInformation("Dismissed photo reminder {ReminderId} for user {UserId}", reminderId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error dismissing photo reminder for user {UserId}", userId);
                throw;
            }
        }

        public async Task CreatePhotoReminderAsync(string userId, DateTime reminderDate, string reminderType)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                    throw new NotFoundException("Runner profile not found");

                var reminder = new PhotoUpdateReminder
                {
                    Id = Guid.NewGuid(),
                    RunnerProfileId = profile.Id,
                    ReminderDate = reminderDate,
                    ReminderType = reminderType,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow
                };

                _context.PhotoUpdateReminders.Add(reminder);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created photo reminder for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating photo reminder for user {UserId}", userId);
                throw;
            }
        }

        public async Task UpdateLastPhotoUpdateAsync(string userId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile != null)
                {
                    profile.LastPhotoUpdate = DateTime.UtcNow;
                    profile.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating last photo update for user {UserId}", userId);
                throw;
            }
        }

        private RunnerProfileDto MapToDto(RunnerProfile profile)
        {
            return new RunnerProfileDto
            {
                Id = profile.Id,
                UserId = profile.UserId,
                FirstName = profile.FirstName,
                LastName = profile.LastName,
                DateOfBirth = profile.DateOfBirth,
                Age = CalculateAge(profile.DateOfBirth),
                Height = profile.Height,
                Weight = profile.Weight,
                EyeColor = profile.EyeColor,
                MedicalConditions = string.IsNullOrEmpty(profile.MedicalConditions) 
                    ? new List<string>() 
                    : System.Text.Json.JsonSerializer.Deserialize<List<string>>(profile.MedicalConditions) ?? new List<string>(),
                AdditionalNotes = profile.AdditionalNotes,
                Photos = profile.Photos?.Select(MapToPhotoDto).ToList() ?? new List<RunnerPhotoDto>(),
                LastPhotoUpdate = profile.LastPhotoUpdate,
                ReminderCount = profile.ReminderCount,
                CreatedAt = profile.CreatedAt,
                UpdatedAt = profile.UpdatedAt,
                IsActive = profile.IsActive
            };
        }

        private RunnerPhotoDto MapToPhotoDto(RunnerPhoto photo)
        {
            return new RunnerPhotoDto
            {
                Id = photo.Id,
                RunnerProfileId = photo.RunnerProfileId,
                FileName = photo.FileName,
                FileUrl = photo.FileUrl,
                FileSize = photo.FileSize,
                MimeType = photo.MimeType,
                UploadedAt = photo.UploadedAt,
                IsPrimary = photo.IsPrimary
            };
        }

        private PhotoUpdateReminderDto MapToReminderDto(PhotoUpdateReminder reminder)
        {
            return new PhotoUpdateReminderDto
            {
                Id = reminder.Id,
                RunnerProfileId = reminder.RunnerProfileId,
                ReminderDate = reminder.ReminderDate,
                ReminderType = reminder.ReminderType,
                SentAt = reminder.SentAt,
                Status = reminder.Status,
                CreatedAt = reminder.CreatedAt
            };
        }
    }
}
