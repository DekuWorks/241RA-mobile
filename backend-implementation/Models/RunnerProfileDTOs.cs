using System.ComponentModel.DataAnnotations;

namespace 241RunnersAPI.DTOs
{
    /// <summary>
    /// Runner profile data transfer object
    /// </summary>
    public class RunnerProfileDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public int Age { get; set; }
        public string Height { get; set; } = string.Empty;
        public string Weight { get; set; } = string.Empty;
        public string EyeColor { get; set; } = string.Empty;
        public List<string> MedicalConditions { get; set; } = new();
        public string AdditionalNotes { get; set; } = string.Empty;
        public List<RunnerPhotoDto> Photos { get; set; } = new();
        public DateTime? LastPhotoUpdate { get; set; }
        public int ReminderCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsActive { get; set; }
    }

    /// <summary>
    /// Create runner profile data transfer object
    /// </summary>
    public class CreateRunnerProfileDto
    {
        [Required(ErrorMessage = "First name is required")]
        [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Date of birth is required")]
        public DateTime DateOfBirth { get; set; }

        [Required(ErrorMessage = "Height is required")]
        [StringLength(20, ErrorMessage = "Height cannot exceed 20 characters")]
        public string Height { get; set; } = string.Empty;

        [Required(ErrorMessage = "Weight is required")]
        [StringLength(20, ErrorMessage = "Weight cannot exceed 20 characters")]
        public string Weight { get; set; } = string.Empty;

        [Required(ErrorMessage = "Eye color is required")]
        [StringLength(20, ErrorMessage = "Eye color cannot exceed 20 characters")]
        public string EyeColor { get; set; } = string.Empty;

        public List<string> MedicalConditions { get; set; } = new();

        [StringLength(1000, ErrorMessage = "Additional notes cannot exceed 1000 characters")]
        public string AdditionalNotes { get; set; } = string.Empty;
    }

    /// <summary>
    /// Update runner profile data transfer object
    /// </summary>
    public class UpdateRunnerProfileDto
    {
        [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
        public string? FirstName { get; set; }

        [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
        public string? LastName { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [StringLength(20, ErrorMessage = "Height cannot exceed 20 characters")]
        public string? Height { get; set; }

        [StringLength(20, ErrorMessage = "Weight cannot exceed 20 characters")]
        public string? Weight { get; set; }

        [StringLength(20, ErrorMessage = "Eye color cannot exceed 20 characters")]
        public string? EyeColor { get; set; }

        public List<string>? MedicalConditions { get; set; }

        [StringLength(1000, ErrorMessage = "Additional notes cannot exceed 1000 characters")]
        public string? AdditionalNotes { get; set; }
    }

    /// <summary>
    /// Runner photo data transfer object
    /// </summary>
    public class RunnerPhotoDto
    {
        public Guid Id { get; set; }
        public Guid RunnerProfileId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string MimeType { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public bool IsPrimary { get; set; }
    }

    /// <summary>
    /// Notification settings data transfer object
    /// </summary>
    public class NotificationSettingsDto
    {
        public bool EmailNotifications { get; set; } = true;
        public bool PushNotifications { get; set; } = true;
        
        [StringLength(20, ErrorMessage = "Reminder frequency cannot exceed 20 characters")]
        public string ReminderFrequency { get; set; } = "weekly";
    }

    /// <summary>
    /// Photo update reminder data transfer object
    /// </summary>
    public class PhotoUpdateReminderDto
    {
        public Guid Id { get; set; }
        public Guid RunnerProfileId { get; set; }
        public DateTime ReminderDate { get; set; }
        public string ReminderType { get; set; } = string.Empty;
        public DateTime? SentAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Validation error data transfer object
    /// </summary>
    public class ValidationErrorDto
    {
        public string Field { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// API response wrapper
    /// </summary>
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Message { get; set; }
        public List<ValidationErrorDto>? Errors { get; set; }

        public static ApiResponse<T> SuccessResponse(T data, string? message = null)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Data = data,
                Message = message
            };
        }

        public static ApiResponse<T> ErrorResponse(string message, List<ValidationErrorDto>? errors = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Errors = errors
            };
        }
    }

    /// <summary>
    /// File upload response
    /// </summary>
    public class FileUploadResponse
    {
        public bool Success { get; set; }
        public string? FileUrl { get; set; }
        public string? FileName { get; set; }
        public long FileSize { get; set; }
        public string? MimeType { get; set; }
        public string? Message { get; set; }
    }

    /// <summary>
    /// Photo upload progress
    /// </summary>
    public class PhotoUploadProgress
    {
        public string FileName { get; set; } = string.Empty;
        public int Progress { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Error { get; set; }
    }

    /// <summary>
    /// Bulk photo upload response
    /// </summary>
    public class BulkPhotoUploadResponse
    {
        public int TotalFiles { get; set; }
        public int SuccessfulUploads { get; set; }
        public int FailedUploads { get; set; }
        public List<RunnerPhotoDto> UploadedPhotos { get; set; } = new();
        public List<string> Errors { get; set; } = new();
    }
}
