using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using 241RunnersAPI.Models;
using 241RunnersAPI.Services;
using 241RunnersAPI.DTOs;

namespace 241RunnersAPI.Controllers
{
    /// <summary>
    /// Controller for managing runner profiles
    /// </summary>
    [ApiController]
    [Route("api/v1/runner-profile")]
    [Authorize]
    public class RunnerProfileController : ControllerBase
    {
        private readonly IRunnerProfileService _runnerProfileService;
        private readonly IPhotoService _photoService;
        private readonly ILogger<RunnerProfileController> _logger;

        public RunnerProfileController(
            IRunnerProfileService runnerProfileService,
            IPhotoService photoService,
            ILogger<RunnerProfileController> logger)
        {
            _runnerProfileService = runnerProfileService;
            _photoService = photoService;
            _logger = logger;
        }

        /// <summary>
        /// Get the current user's runner profile
        /// </summary>
        /// <returns>Runner profile with photos</returns>
        [HttpGet]
        public async Task<ActionResult<RunnerProfileDto>> GetRunnerProfile()
        {
            try
            {
                var userId = GetCurrentUserId();
                var profile = await _runnerProfileService.GetByUserIdAsync(userId);
                
                if (profile == null)
                    return NotFound(new { message = "Runner profile not found" });

                return Ok(profile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting runner profile for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Check if the current user has a runner profile
        /// </summary>
        /// <returns>Boolean indicating if profile exists</returns>
        [HttpGet("exists")]
        public async Task<ActionResult<object>> CheckRunnerProfileExists()
        {
            try
            {
                var userId = GetCurrentUserId();
                var exists = await _runnerProfileService.ExistsByUserIdAsync(userId);
                return Ok(new { exists });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking runner profile existence for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Create a new runner profile for the current user
        /// </summary>
        /// <param name="dto">Runner profile data</param>
        /// <returns>Created runner profile</returns>
        [HttpPost]
        public async Task<ActionResult<RunnerProfileDto>> CreateRunnerProfile([FromBody] CreateRunnerProfileDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Validate input
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var profile = await _runnerProfileService.CreateAsync(userId, dto);
                return CreatedAtAction(nameof(GetRunnerProfile), profile);
            }
            catch (ValidationException ex)
            {
                _logger.LogWarning(ex, "Validation error creating runner profile for user {UserId}", GetCurrentUserId());
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating runner profile for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update the current user's runner profile
        /// </summary>
        /// <param name="dto">Updated runner profile data</param>
        /// <returns>Updated runner profile</returns>
        [HttpPut]
        public async Task<ActionResult<RunnerProfileDto>> UpdateRunnerProfile([FromBody] UpdateRunnerProfileDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Validate input
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var profile = await _runnerProfileService.UpdateAsync(userId, dto);
                return Ok(profile);
            }
            catch (ValidationException ex)
            {
                _logger.LogWarning(ex, "Validation error updating runner profile for user {UserId}", GetCurrentUserId());
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (NotFoundException ex)
            {
                _logger.LogWarning(ex, "Runner profile not found for user {UserId}", GetCurrentUserId());
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating runner profile for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Delete the current user's runner profile
        /// </summary>
        /// <returns>Success message</returns>
        [HttpDelete]
        public async Task<ActionResult> DeleteRunnerProfile()
        {
            try
            {
                var userId = GetCurrentUserId();
                await _runnerProfileService.DeleteAsync(userId);
                return Ok(new { message = "Runner profile deleted successfully" });
            }
            catch (NotFoundException ex)
            {
                _logger.LogWarning(ex, "Runner profile not found for user {UserId}", GetCurrentUserId());
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting runner profile for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get all photos for the current user's runner profile
        /// </summary>
        /// <returns>List of photos</returns>
        [HttpGet("photos")]
        public async Task<ActionResult<IEnumerable<RunnerPhotoDto>>> GetPhotos()
        {
            try
            {
                var userId = GetCurrentUserId();
                var photos = await _photoService.GetPhotosByUserIdAsync(userId);
                return Ok(photos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting photos for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Upload a photo for the current user's runner profile
        /// </summary>
        /// <param name="photo">Photo file</param>
        /// <returns>Uploaded photo information</returns>
        [HttpPost("photos")]
        public async Task<ActionResult<RunnerPhotoDto>> UploadPhoto(IFormFile photo)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Validate file
                if (photo == null || photo.Length == 0)
                {
                    return BadRequest(new { message = "No photo provided" });
                }

                // Check file size (max 10MB)
                if (photo.Length > 10 * 1024 * 1024)
                {
                    return BadRequest(new { message = "Photo size cannot exceed 10MB" });
                }

                // Check file type
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(photo.ContentType))
                {
                    return BadRequest(new { message = "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed" });
                }

                var result = await _photoService.UploadPhotoAsync(userId, photo);
                return Ok(result);
            }
            catch (ValidationException ex)
            {
                _logger.LogWarning(ex, "Validation error uploading photo for user {UserId}", GetCurrentUserId());
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading photo for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Delete a specific photo from the current user's runner profile
        /// </summary>
        /// <param name="photoId">Photo ID to delete</param>
        /// <returns>Success message</returns>
        [HttpDelete("photos/{photoId}")]
        public async Task<ActionResult> DeletePhoto(Guid photoId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _photoService.DeletePhotoAsync(userId, photoId);
                return Ok(new { message = "Photo deleted successfully" });
            }
            catch (NotFoundException ex)
            {
                _logger.LogWarning(ex, "Photo not found for user {UserId}", GetCurrentUserId());
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting photo for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Set a photo as the primary photo for the current user's runner profile
        /// </summary>
        /// <param name="photoId">Photo ID to set as primary</param>
        /// <returns>Success message</returns>
        [HttpPut("photos/{photoId}/primary")]
        public async Task<ActionResult> SetPrimaryPhoto(Guid photoId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _photoService.SetPrimaryPhotoAsync(userId, photoId);
                return Ok(new { message = "Primary photo updated successfully" });
            }
            catch (NotFoundException ex)
            {
                _logger.LogWarning(ex, "Photo not found for user {UserId}", GetCurrentUserId());
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary photo for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get notification settings for the current user
        /// </summary>
        /// <returns>Notification settings</returns>
        [HttpGet("notification-settings")]
        public async Task<ActionResult<NotificationSettingsDto>> GetNotificationSettings()
        {
            try
            {
                var userId = GetCurrentUserId();
                var settings = await _runnerProfileService.GetNotificationSettingsAsync(userId);
                return Ok(settings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification settings for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update notification settings for the current user
        /// </summary>
        /// <param name="settings">Notification settings</param>
        /// <returns>Updated notification settings</returns>
        [HttpPut("notification-settings")]
        public async Task<ActionResult<NotificationSettingsDto>> UpdateNotificationSettings([FromBody] NotificationSettingsDto settings)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var updatedSettings = await _runnerProfileService.UpdateNotificationSettingsAsync(userId, settings);
                return Ok(updatedSettings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification settings for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get photo update reminders for the current user
        /// </summary>
        /// <returns>List of photo update reminders</returns>
        [HttpGet("photo-reminders")]
        public async Task<ActionResult<IEnumerable<PhotoUpdateReminderDto>>> GetPhotoReminders()
        {
            try
            {
                var userId = GetCurrentUserId();
                var reminders = await _runnerProfileService.GetPhotoRemindersAsync(userId);
                return Ok(reminders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting photo reminders for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Dismiss a photo update reminder
        /// </summary>
        /// <param name="reminderId">Reminder ID to dismiss</param>
        /// <returns>Success message</returns>
        [HttpPut("photo-reminders/{reminderId}/dismiss")]
        public async Task<ActionResult> DismissPhotoReminder(Guid reminderId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _runnerProfileService.DismissPhotoReminderAsync(userId, reminderId);
                return Ok(new { message = "Reminder dismissed successfully" });
            }
            catch (NotFoundException ex)
            {
                _logger.LogWarning(ex, "Reminder not found for user {UserId}", GetCurrentUserId());
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error dismissing photo reminder for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get the current user ID from the JWT token
        /// </summary>
        /// <returns>User ID</returns>
        private string GetCurrentUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }
            return userId;
        }
    }
}
