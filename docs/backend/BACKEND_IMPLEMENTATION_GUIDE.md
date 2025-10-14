# 241 Runners Backend Implementation Guide

## Overview
This guide provides the complete implementation details for the runner profile system backend API endpoints that need to be added to the main 241RunnersAwareness repository.

## Current Status
- **Backend API**: https://241runners-api-v2.azurewebsites.net
- **Mobile App**: Ready for integration
- **Required**: Backend API endpoints implementation

## Database Schema Implementation

### 1. RunnerProfiles Table
```sql
CREATE TABLE RunnerProfiles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Height NVARCHAR(20) NOT NULL,
    Weight NVARCHAR(20) NOT NULL,
    EyeColor NVARCHAR(20) NOT NULL,
    MedicalConditions NVARCHAR(MAX), -- JSON array
    AdditionalNotes NVARCHAR(1000),
    LastPhotoUpdate DATETIME2,
    ReminderCount INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    INDEX IX_RunnerProfiles_UserId (UserId),
    INDEX IX_RunnerProfiles_IsActive (IsActive)
);
```

### 2. RunnerPhotos Table
```sql
CREATE TABLE RunnerPhotos (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RunnerProfileId UNIQUEIDENTIFIER NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    FileUrl NVARCHAR(500) NOT NULL,
    FileSize BIGINT NOT NULL,
    MimeType NVARCHAR(100) NOT NULL,
    UploadedAt DATETIME2 DEFAULT GETUTCDATE(),
    IsPrimary BIT DEFAULT 0,
    FOREIGN KEY (RunnerProfileId) REFERENCES RunnerProfiles(Id) ON DELETE CASCADE,
    INDEX IX_RunnerPhotos_RunnerProfileId (RunnerProfileId),
    INDEX IX_RunnerPhotos_IsPrimary (IsPrimary)
);
```

### 3. PhotoUpdateReminders Table
```sql
CREATE TABLE PhotoUpdateReminders (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RunnerProfileId UNIQUEIDENTIFIER NOT NULL,
    ReminderDate DATETIME2 NOT NULL,
    ReminderType NVARCHAR(20) NOT NULL, -- 'email', 'push', 'both'
    SentAt DATETIME2,
    Status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (RunnerProfileId) REFERENCES RunnerProfiles(Id) ON DELETE CASCADE,
    INDEX IX_PhotoUpdateReminders_RunnerProfileId (RunnerProfileId),
    INDEX IX_PhotoUpdateReminders_Status (Status),
    INDEX IX_PhotoUpdateReminders_ReminderDate (ReminderDate)
);
```

## API Controllers Implementation

### 1. RunnerProfileController.cs
```csharp
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
            _logger.LogError(ex, "Error getting runner profile");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

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
            _logger.LogError(ex, "Error checking runner profile existence");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<RunnerProfileDto>> CreateRunnerProfile([FromBody] CreateRunnerProfileDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var profile = await _runnerProfileService.CreateAsync(userId, dto);
            return CreatedAtAction(nameof(GetRunnerProfile), profile);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { message = ex.Message, errors = ex.Errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating runner profile");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut]
    public async Task<ActionResult<RunnerProfileDto>> UpdateRunnerProfile([FromBody] UpdateRunnerProfileDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var profile = await _runnerProfileService.UpdateAsync(userId, dto);
            return Ok(profile);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { message = ex.Message, errors = ex.Errors });
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating runner profile");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

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
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting runner profile");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? throw new UnauthorizedAccessException("User ID not found");
    }
}
```

### 2. PhotoController.cs
```csharp
[ApiController]
[Route("api/v1/runner-profile/photos")]
[Authorize]
public class PhotoController : ControllerBase
{
    private readonly IPhotoService _photoService;
    private readonly ILogger<PhotoController> _logger;

    public PhotoController(IPhotoService photoService, ILogger<PhotoController> logger)
    {
        _photoService = photoService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<RunnerPhotoDto>> UploadPhoto(IFormFile photo)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _photoService.UploadPhotoAsync(userId, photo);
            return Ok(result);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { message = ex.Message, errors = ex.Errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading photo");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet]
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
            _logger.LogError(ex, "Error getting photos");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{photoId}")]
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
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting photo");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{photoId}/primary")]
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
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting primary photo");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? throw new UnauthorizedAccessException("User ID not found");
    }
}
```

## DTOs (Data Transfer Objects)

### 1. RunnerProfileDto.cs
```csharp
public class RunnerProfileDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public int Age { get; set; }
    public string Height { get; set; }
    public string Weight { get; set; }
    public string EyeColor { get; set; }
    public List<string> MedicalConditions { get; set; }
    public string AdditionalNotes { get; set; }
    public List<RunnerPhotoDto> Photos { get; set; }
    public DateTime? LastPhotoUpdate { get; set; }
    public int ReminderCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsActive { get; set; }
}
```

### 2. CreateRunnerProfileDto.cs
```csharp
public class CreateRunnerProfileDto
{
    [Required]
    [StringLength(50)]
    public string FirstName { get; set; }

    [Required]
    [StringLength(50)]
    public string LastName { get; set; }

    [Required]
    public DateTime DateOfBirth { get; set; }

    [Required]
    [StringLength(20)]
    public string Height { get; set; }

    [Required]
    [StringLength(20)]
    public string Weight { get; set; }

    [Required]
    [StringLength(20)]
    public string EyeColor { get; set; }

    public List<string> MedicalConditions { get; set; } = new();

    [StringLength(1000)]
    public string AdditionalNotes { get; set; }
}
```

### 3. UpdateRunnerProfileDto.cs
```csharp
public class UpdateRunnerProfileDto
{
    [StringLength(50)]
    public string FirstName { get; set; }

    [StringLength(50)]
    public string LastName { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [StringLength(20)]
    public string Height { get; set; }

    [StringLength(20)]
    public string Weight { get; set; }

    [StringLength(20)]
    public string EyeColor { get; set; }

    public List<string> MedicalConditions { get; set; }

    [StringLength(1000)]
    public string AdditionalNotes { get; set; }
}
```

### 4. RunnerPhotoDto.cs
```csharp
public class RunnerPhotoDto
{
    public Guid Id { get; set; }
    public Guid RunnerProfileId { get; set; }
    public string FileName { get; set; }
    public string FileUrl { get; set; }
    public long FileSize { get; set; }
    public string MimeType { get; set; }
    public DateTime UploadedAt { get; set; }
    public bool IsPrimary { get; set; }
}
```

## Service Layer Implementation

### 1. IRunnerProfileService.cs
```csharp
public interface IRunnerProfileService
{
    Task<RunnerProfileDto> GetByUserIdAsync(string userId);
    Task<bool> ExistsByUserIdAsync(string userId);
    Task<RunnerProfileDto> CreateAsync(string userId, CreateRunnerProfileDto dto);
    Task<RunnerProfileDto> UpdateAsync(string userId, UpdateRunnerProfileDto dto);
    Task DeleteAsync(string userId);
    Task<int> CalculateAge(DateTime dateOfBirth);
    Task<bool> NeedsPhotoUpdate(string userId);
    Task<int> GetDaysSinceLastPhotoUpdate(string userId);
}
```

### 2. IPhotoService.cs
```csharp
public interface IPhotoService
{
    Task<RunnerPhotoDto> UploadPhotoAsync(string userId, IFormFile photo);
    Task<IEnumerable<RunnerPhotoDto>> GetPhotosByUserIdAsync(string userId);
    Task DeletePhotoAsync(string userId, Guid photoId);
    Task SetPrimaryPhotoAsync(string userId, Guid photoId);
    Task<bool> ValidatePhotoAsync(IFormFile photo);
    Task<string> GenerateUniqueFileName(string originalFileName);
}
```

## Background Services

### 1. PhotoUpdateReminderService.cs
```csharp
public class PhotoUpdateReminderService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PhotoUpdateReminderService> _logger;

    public PhotoUpdateReminderService(
        IServiceProvider serviceProvider,
        ILogger<PhotoUpdateReminderService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var reminderService = scope.ServiceProvider.GetRequiredService<IPhotoReminderService>();
                
                await reminderService.ProcessRemindersAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing photo update reminders");
            }

            // Run daily
            await Task.Delay(TimeSpan.FromDays(1), stoppingToken);
        }
    }
}
```

## File Storage Configuration

### 1. Azure Blob Storage Setup
```csharp
public class BlobStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _containerName;

    public BlobStorageService(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("AzureStorage");
        _blobServiceClient = new BlobServiceClient(connectionString);
        _containerName = "runner-photos";
    }

    public async Task<string> UploadPhotoAsync(IFormFile photo, string fileName)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(fileName);

        using var stream = photo.OpenReadStream();
        await blobClient.UploadAsync(stream, overwrite: true);

        return blobClient.Uri.ToString();
    }

    public async Task DeletePhotoAsync(string fileName)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(fileName);
        await blobClient.DeleteIfExistsAsync();
    }
}
```

## Validation Rules

### 1. Photo Validation
- File size: Maximum 10MB
- File types: JPEG, PNG, GIF, WebP
- Image dimensions: Maximum 4000x4000 pixels
- Maximum photos per profile: 10

### 2. Profile Validation
- First/Last name: 2-50 characters, letters only
- Date of birth: Not in future, not more than 120 years ago
- Height: Valid format (e.g., "5'8\"", "175cm")
- Weight: Valid format (e.g., "150 lbs", "68 kg")
- Eye color: Must be from predefined list
- Medical conditions: Each condition 1-100 characters
- Additional notes: Maximum 1000 characters

## Error Handling

### 1. Custom Exceptions
```csharp
public class ValidationException : Exception
{
    public Dictionary<string, string[]> Errors { get; }

    public ValidationException(Dictionary<string, string[]> errors) 
        : base("Validation failed")
    {
        Errors = errors;
    }
}

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}
```

### 2. Global Exception Handler
```csharp
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = exception switch
        {
            ValidationException ex => new { message = ex.Message, errors = ex.Errors },
            NotFoundException ex => new { message = ex.Message },
            _ => new { message = "An error occurred while processing your request" }
        };

        context.Response.StatusCode = exception switch
        {
            ValidationException => 400,
            NotFoundException => 404,
            _ => 500
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
```

## Testing Strategy

### 1. Unit Tests
- Service layer tests
- Validation tests
- Repository tests

### 2. Integration Tests
- API endpoint tests
- Database integration tests
- File upload tests

### 3. Performance Tests
- Load testing
- File upload performance
- Database query optimization

## Deployment Checklist

### 1. Database Migration
- [ ] Create RunnerProfiles table
- [ ] Create RunnerPhotos table
- [ ] Create PhotoUpdateReminders table
- [ ] Add indexes for performance
- [ ] Run migration scripts

### 2. Azure Configuration
- [ ] Configure Blob Storage
- [ ] Set up container for photos
- [ ] Configure CORS for file access
- [ ] Set up CDN if needed

### 3. API Configuration
- [ ] Add new controllers
- [ ] Configure dependency injection
- [ ] Add background services
- [ ] Configure logging

### 4. Security
- [ ] Validate file uploads
- [ ] Implement rate limiting
- [ ] Add authentication checks
- [ ] Configure CORS properly

## Monitoring and Logging

### 1. Application Insights
- Track API performance
- Monitor error rates
- Track file upload metrics

### 2. Custom Metrics
- Photo upload success rate
- Profile creation completion rate
- Reminder delivery success rate

## Next Steps

1. **Implement Database Schema**
   - Create tables with proper indexes
   - Add foreign key constraints
   - Set up data migration scripts

2. **Implement API Controllers**
   - Add authentication middleware
   - Implement validation
   - Add error handling

3. **Implement Services**
   - File upload service
   - Photo management service
   - Reminder service

4. **Add Background Jobs**
   - Photo update reminders
   - Email notifications
   - Push notifications

5. **Testing and Deployment**
   - Unit tests
   - Integration tests
   - Performance testing
   - Production deployment

This implementation guide provides everything needed to implement the runner profile system backend API endpoints that will integrate seamlessly with the mobile application.