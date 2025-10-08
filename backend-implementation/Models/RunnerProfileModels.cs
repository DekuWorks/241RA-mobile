using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace 241RunnersAPI.Models
{
    /// <summary>
    /// Runner profile entity
    /// </summary>
    [Table("RunnerProfiles")]
    public class RunnerProfile
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(450)]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        [MaxLength(20)]
        public string Height { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Weight { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string EyeColor { get; set; } = string.Empty;

        public string? MedicalConditions { get; set; } // JSON array

        [MaxLength(1000)]
        public string? AdditionalNotes { get; set; }

        public DateTime? LastPhotoUpdate { get; set; }

        public int ReminderCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual ICollection<RunnerPhoto> Photos { get; set; } = new List<RunnerPhoto>();
        public virtual ICollection<PhotoUpdateReminder> PhotoReminders { get; set; } = new List<PhotoUpdateReminder>();
    }

    /// <summary>
    /// Runner photo entity
    /// </summary>
    [Table("RunnerPhotos")]
    public class RunnerPhoto
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid RunnerProfileId { get; set; }

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string FileUrl { get; set; } = string.Empty;

        [Required]
        public long FileSize { get; set; }

        [Required]
        [MaxLength(100)]
        public string MimeType { get; set; } = string.Empty;

        public DateTime UploadedAt { get; set; }

        public bool IsPrimary { get; set; } = false;

        // Navigation properties
        [ForeignKey("RunnerProfileId")]
        public virtual RunnerProfile RunnerProfile { get; set; } = null!;
    }

    /// <summary>
    /// Photo update reminder entity
    /// </summary>
    [Table("PhotoUpdateReminders")]
    public class PhotoUpdateReminder
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid RunnerProfileId { get; set; }

        [Required]
        public DateTime ReminderDate { get; set; }

        [Required]
        [MaxLength(20)]
        public string ReminderType { get; set; } = string.Empty; // 'email', 'push', 'both'

        public DateTime? SentAt { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "pending"; // 'pending', 'sent', 'failed', 'dismissed'

        public DateTime CreatedAt { get; set; }

        // Navigation properties
        [ForeignKey("RunnerProfileId")]
        public virtual RunnerProfile RunnerProfile { get; set; } = null!;
    }

    /// <summary>
    /// Notification settings entity
    /// </summary>
    [Table("NotificationSettings")]
    public class NotificationSettings
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(450)]
        public string UserId { get; set; } = string.Empty;

        public bool EmailNotifications { get; set; } = true;

        public bool PushNotifications { get; set; } = true;

        [Required]
        [MaxLength(20)]
        public string ReminderFrequency { get; set; } = "weekly"; // 'daily', 'weekly', 'monthly'

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// Custom exceptions for the runner profile system
    /// </summary>
    public class ValidationException : Exception
    {
        public Dictionary<string, string[]> Errors { get; }

        public ValidationException(string message) : base(message)
        {
            Errors = new Dictionary<string, string[]> { { "general", new[] { message } } };
        }

        public ValidationException(Dictionary<string, string[]> errors) : base("Validation failed")
        {
            Errors = errors;
        }
    }

    public class NotFoundException : Exception
    {
        public NotFoundException(string message) : base(message) { }
    }

    public class UnauthorizedAccessException : Exception
    {
        public UnauthorizedAccessException(string message) : base(message) { }
    }
}
