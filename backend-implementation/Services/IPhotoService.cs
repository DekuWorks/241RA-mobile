using 241RunnersAPI.DTOs;

namespace 241RunnersAPI.Services
{
    /// <summary>
    /// Service interface for managing runner photos
    /// </summary>
    public interface IPhotoService
    {
        /// <summary>
        /// Upload a photo for a user's runner profile
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="photo">Photo file</param>
        /// <returns>Uploaded photo information</returns>
        Task<RunnerPhotoDto> UploadPhotoAsync(string userId, IFormFile photo);

        /// <summary>
        /// Upload multiple photos for a user's runner profile
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="photos">Photo files</param>
        /// <returns>Bulk upload response</returns>
        Task<BulkPhotoUploadResponse> UploadMultiplePhotosAsync(string userId, IFormFile[] photos);

        /// <summary>
        /// Get all photos for a user's runner profile
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>List of photos</returns>
        Task<IEnumerable<RunnerPhotoDto>> GetPhotosByUserIdAsync(string userId);

        /// <summary>
        /// Get photos by runner profile ID
        /// </summary>
        /// <param name="runnerProfileId">Runner profile ID</param>
        /// <returns>List of photos</returns>
        Task<IEnumerable<RunnerPhotoDto>> GetPhotosByProfileIdAsync(Guid runnerProfileId);

        /// <summary>
        /// Delete a specific photo
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="photoId">Photo ID</param>
        Task DeletePhotoAsync(string userId, Guid photoId);

        /// <summary>
        /// Set a photo as the primary photo
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="photoId">Photo ID</param>
        Task SetPrimaryPhotoAsync(string userId, Guid photoId);

        /// <summary>
        /// Validate photo file
        /// </summary>
        /// <param name="photo">Photo file</param>
        /// <returns>True if valid</returns>
        Task<bool> ValidatePhotoAsync(IFormFile photo);

        /// <summary>
        /// Generate unique file name
        /// </summary>
        /// <param name="originalFileName">Original file name</param>
        /// <returns>Unique file name</returns>
        string GenerateUniqueFileName(string originalFileName);

        /// <summary>
        /// Get photo by ID
        /// </summary>
        /// <param name="photoId">Photo ID</param>
        /// <returns>Photo information</returns>
        Task<RunnerPhotoDto?> GetPhotoByIdAsync(Guid photoId);

        /// <summary>
        /// Get primary photo for a user's runner profile
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>Primary photo or null</returns>
        Task<RunnerPhotoDto?> GetPrimaryPhotoAsync(string userId);

        /// <summary>
        /// Get photo count for a user's runner profile
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>Photo count</returns>
        Task<int> GetPhotoCountAsync(string userId);

        /// <summary>
        /// Check if user has reached photo limit
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="maxPhotos">Maximum number of photos allowed</param>
        /// <returns>True if limit reached</returns>
        Task<bool> HasReachedPhotoLimitAsync(string userId, int maxPhotos = 10);

        /// <summary>
        /// Delete all photos for a user's runner profile
        /// </summary>
        /// <param name="userId">User ID</param>
        Task DeleteAllPhotosAsync(string userId);

        /// <summary>
        /// Get photos that need updating (older than 6 months)
        /// </summary>
        /// <returns>List of photos needing updates</returns>
        Task<IEnumerable<RunnerPhotoDto>> GetPhotosNeedingUpdateAsync();

        /// <summary>
        /// Update photo metadata
        /// </summary>
        /// <param name="photoId">Photo ID</param>
        /// <param name="metadata">Updated metadata</param>
        Task UpdatePhotoMetadataAsync(Guid photoId, Dictionary<string, object> metadata);
    }
}
