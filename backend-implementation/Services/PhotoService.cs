using Microsoft.EntityFrameworkCore;
using 241RunnersAPI.Data;
using 241RunnersAPI.DTOs;
using 241RunnersAPI.Models;

namespace 241RunnersAPI.Services
{
    /// <summary>
    /// Service for managing runner photos
    /// </summary>
    public class PhotoService : IPhotoService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBlobStorageService _blobStorageService;
        private readonly ILogger<PhotoService> _logger;

        public PhotoService(
            ApplicationDbContext context,
            IBlobStorageService blobStorageService,
            ILogger<PhotoService> logger)
        {
            _context = context;
            _blobStorageService = blobStorageService;
            _logger = logger;
        }

        public async Task<RunnerPhotoDto> UploadPhotoAsync(string userId, IFormFile photo)
        {
            try
            {
                // Validate photo
                if (!await ValidatePhotoAsync(photo))
                {
                    throw new ValidationException("Invalid photo file");
                }

                // Get runner profile
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                {
                    throw new NotFoundException("Runner profile not found");
                }

                // Check photo limit
                if (await HasReachedPhotoLimitAsync(userId))
                {
                    throw new ValidationException("Maximum number of photos reached (10)");
                }

                // Generate unique file name
                var fileName = GenerateUniqueFileName(photo.FileName);
                
                // Upload to blob storage
                var fileUrl = await _blobStorageService.UploadPhotoAsync(photo, fileName);

                // Save to database
                var runnerPhoto = new RunnerPhoto
                {
                    Id = Guid.NewGuid(),
                    RunnerProfileId = profile.Id,
                    FileName = fileName,
                    FileUrl = fileUrl,
                    FileSize = photo.Length,
                    MimeType = photo.ContentType,
                    UploadedAt = DateTime.UtcNow,
                    IsPrimary = false // Will be set to true if it's the first photo
                };

                // If this is the first photo, set it as primary
                var existingPhotos = await _context.RunnerPhotos
                    .Where(rp => rp.RunnerProfileId == profile.Id)
                    .CountAsync();

                if (existingPhotos == 0)
                {
                    runnerPhoto.IsPrimary = true;
                }

                _context.RunnerPhotos.Add(runnerPhoto);

                // Update last photo update timestamp
                profile.LastPhotoUpdate = DateTime.UtcNow;
                profile.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Uploaded photo for user {UserId}", userId);

                return new RunnerPhotoDto
                {
                    Id = runnerPhoto.Id,
                    RunnerProfileId = runnerPhoto.RunnerProfileId,
                    FileName = runnerPhoto.FileName,
                    FileUrl = runnerPhoto.FileUrl,
                    FileSize = runnerPhoto.FileSize,
                    MimeType = runnerPhoto.MimeType,
                    UploadedAt = runnerPhoto.UploadedAt,
                    IsPrimary = runnerPhoto.IsPrimary
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading photo for user {UserId}", userId);
                throw;
            }
        }

        public async Task<BulkPhotoUploadResponse> UploadMultiplePhotosAsync(string userId, IFormFile[] photos)
        {
            var response = new BulkPhotoUploadResponse
            {
                TotalFiles = photos.Length,
                SuccessfulUploads = 0,
                FailedUploads = 0,
                UploadedPhotos = new List<RunnerPhotoDto>(),
                Errors = new List<string>()
            };

            foreach (var photo in photos)
            {
                try
                {
                    var uploadedPhoto = await UploadPhotoAsync(userId, photo);
                    response.UploadedPhotos.Add(uploadedPhoto);
                    response.SuccessfulUploads++;
                }
                catch (Exception ex)
                {
                    response.FailedUploads++;
                    response.Errors.Add($"Failed to upload {photo.FileName}: {ex.Message}");
                    _logger.LogError(ex, "Error uploading photo {FileName} for user {UserId}", photo.FileName, userId);
                }
            }

            return response;
        }

        public async Task<IEnumerable<RunnerPhotoDto>> GetPhotosByUserIdAsync(string userId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                    return Enumerable.Empty<RunnerPhotoDto>();

                var photos = await _context.RunnerPhotos
                    .Where(rp => rp.RunnerProfileId == profile.Id)
                    .OrderByDescending(rp => rp.IsPrimary)
                    .ThenByDescending(rp => rp.UploadedAt)
                    .ToListAsync();

                return photos.Select(MapToDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting photos for user {UserId}", userId);
                throw;
            }
        }

        public async Task<IEnumerable<RunnerPhotoDto>> GetPhotosByProfileIdAsync(Guid runnerProfileId)
        {
            try
            {
                var photos = await _context.RunnerPhotos
                    .Where(rp => rp.RunnerProfileId == runnerProfileId)
                    .OrderByDescending(rp => rp.IsPrimary)
                    .ThenByDescending(rp => rp.UploadedAt)
                    .ToListAsync();

                return photos.Select(MapToDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting photos for profile {ProfileId}", runnerProfileId);
                throw;
            }
        }

        public async Task DeletePhotoAsync(string userId, Guid photoId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                    throw new NotFoundException("Runner profile not found");

                var photo = await _context.RunnerPhotos
                    .FirstOrDefaultAsync(rp => rp.Id == photoId && rp.RunnerProfileId == profile.Id);

                if (photo == null)
                    throw new NotFoundException("Photo not found");

                // Delete from blob storage
                await _blobStorageService.DeletePhotoAsync(photo.FileName);

                // If this was the primary photo, set another photo as primary
                if (photo.IsPrimary)
                {
                    var otherPhoto = await _context.RunnerPhotos
                        .Where(rp => rp.RunnerProfileId == profile.Id && rp.Id != photoId)
                        .FirstOrDefaultAsync();

                    if (otherPhoto != null)
                    {
                        otherPhoto.IsPrimary = true;
                    }
                }

                _context.RunnerPhotos.Remove(photo);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted photo {PhotoId} for user {UserId}", photoId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting photo {PhotoId} for user {UserId}", photoId, userId);
                throw;
            }
        }

        public async Task SetPrimaryPhotoAsync(string userId, Guid photoId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                    throw new NotFoundException("Runner profile not found");

                var photo = await _context.RunnerPhotos
                    .FirstOrDefaultAsync(rp => rp.Id == photoId && rp.RunnerProfileId == profile.Id);

                if (photo == null)
                    throw new NotFoundException("Photo not found");

                // Remove primary status from all other photos
                var otherPhotos = await _context.RunnerPhotos
                    .Where(rp => rp.RunnerProfileId == profile.Id && rp.Id != photoId)
                    .ToListAsync();

                foreach (var otherPhoto in otherPhotos)
                {
                    otherPhoto.IsPrimary = false;
                }

                // Set this photo as primary
                photo.IsPrimary = true;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Set primary photo {PhotoId} for user {UserId}", photoId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary photo {PhotoId} for user {UserId}", photoId, userId);
                throw;
            }
        }

        public async Task<bool> ValidatePhotoAsync(IFormFile photo)
        {
            try
            {
                // Check if file is provided
                if (photo == null || photo.Length == 0)
                    return false;

                // Check file size (max 10MB)
                if (photo.Length > 10 * 1024 * 1024)
                    return false;

                // Check file type
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(photo.ContentType))
                    return false;

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating photo");
                return false;
            }
        }

        public string GenerateUniqueFileName(string originalFileName)
        {
            var extension = Path.GetExtension(originalFileName);
            var fileName = Path.GetFileNameWithoutExtension(originalFileName);
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var guid = Guid.NewGuid().ToString("N")[..8];
            
            return $"{fileName}_{timestamp}_{guid}{extension}";
        }

        public async Task<RunnerPhotoDto?> GetPhotoByIdAsync(Guid photoId)
        {
            try
            {
                var photo = await _context.RunnerPhotos
                    .FirstOrDefaultAsync(rp => rp.Id == photoId);

                return photo != null ? MapToDto(photo) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting photo {PhotoId}", photoId);
                throw;
            }
        }

        public async Task<RunnerPhotoDto?> GetPrimaryPhotoAsync(string userId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                    return null;

                var photo = await _context.RunnerPhotos
                    .FirstOrDefaultAsync(rp => rp.RunnerProfileId == profile.Id && rp.IsPrimary);

                return photo != null ? MapToDto(photo) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting primary photo for user {UserId}", userId);
                throw;
            }
        }

        public async Task<int> GetPhotoCountAsync(string userId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                    return 0;

                return await _context.RunnerPhotos
                    .CountAsync(rp => rp.RunnerProfileId == profile.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting photo count for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> HasReachedPhotoLimitAsync(string userId, int maxPhotos = 10)
        {
            try
            {
                var currentCount = await GetPhotoCountAsync(userId);
                return currentCount >= maxPhotos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking photo limit for user {UserId}", userId);
                throw;
            }
        }

        public async Task DeleteAllPhotosAsync(string userId)
        {
            try
            {
                var profile = await _context.RunnerProfiles
                    .FirstOrDefaultAsync(rp => rp.UserId == userId && rp.IsActive);

                if (profile == null)
                    return;

                var photos = await _context.RunnerPhotos
                    .Where(rp => rp.RunnerProfileId == profile.Id)
                    .ToListAsync();

                // Delete from blob storage
                foreach (var photo in photos)
                {
                    await _blobStorageService.DeletePhotoAsync(photo.FileName);
                }

                _context.RunnerPhotos.RemoveRange(photos);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted all photos for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting all photos for user {UserId}", userId);
                throw;
            }
        }

        public async Task<IEnumerable<RunnerPhotoDto>> GetPhotosNeedingUpdateAsync()
        {
            try
            {
                var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
                
                var photos = await _context.RunnerPhotos
                    .Where(rp => rp.UploadedAt < sixMonthsAgo)
                    .OrderBy(rp => rp.UploadedAt)
                    .ToListAsync();

                return photos.Select(MapToDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting photos needing update");
                throw;
            }
        }

        public async Task UpdatePhotoMetadataAsync(Guid photoId, Dictionary<string, object> metadata)
        {
            try
            {
                var photo = await _context.RunnerPhotos
                    .FirstOrDefaultAsync(rp => rp.Id == photoId);

                if (photo == null)
                    throw new NotFoundException("Photo not found");

                // Update metadata fields as needed
                // This is a placeholder for future metadata updates
                
                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated metadata for photo {PhotoId}", photoId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating photo metadata for {PhotoId}", photoId);
                throw;
            }
        }

        private RunnerPhotoDto MapToDto(RunnerPhoto photo)
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
    }
}
