using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace 241RunnersAPI.Services
{
    /// <summary>
    /// Service for managing file storage using Azure Blob Storage
    /// </summary>
    public class BlobStorageService : IBlobStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _containerName;
        private readonly ILogger<BlobStorageService> _logger;

        public BlobStorageService(IConfiguration configuration, ILogger<BlobStorageService> logger)
        {
            var connectionString = configuration.GetConnectionString("AzureStorage");
            _blobServiceClient = new BlobServiceClient(connectionString);
            _containerName = "runner-photos";
            _logger = logger;
        }

        public async Task<string> UploadPhotoAsync(IFormFile photo, string fileName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                
                // Create container if it doesn't exist
                await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);

                var blobClient = containerClient.GetBlobClient(fileName);

                using var stream = photo.OpenReadStream();
                await blobClient.UploadAsync(stream, overwrite: true);

                _logger.LogInformation("Uploaded photo {FileName} to blob storage", fileName);
                return blobClient.Uri.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading photo {FileName} to blob storage", fileName);
                throw;
            }
        }

        public async Task DeletePhotoAsync(string fileName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(fileName);
                
                await blobClient.DeleteIfExistsAsync();

                _logger.LogInformation("Deleted photo {FileName} from blob storage", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting photo {FileName} from blob storage", fileName);
                throw;
            }
        }

        public async Task<bool> PhotoExistsAsync(string fileName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(fileName);
                
                return await blobClient.ExistsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if photo {FileName} exists in blob storage", fileName);
                return false;
            }
        }

        public async Task<Stream> DownloadPhotoAsync(string fileName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(fileName);
                
                var response = await blobClient.DownloadStreamingAsync();
                return response.Value.Content;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading photo {FileName} from blob storage", fileName);
                throw;
            }
        }

        public async Task<string> GetPhotoUrlAsync(string fileName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(fileName);
                
                return blobClient.Uri.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting photo URL for {FileName}", fileName);
                throw;
            }
        }

        public async Task<List<string>> ListPhotosAsync(string prefix = "")
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobs = containerClient.GetBlobsAsync(prefix: prefix);
                
                var photoNames = new List<string>();
                await foreach (var blob in blobs)
                {
                    photoNames.Add(blob.Name);
                }

                return photoNames;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing photos with prefix {Prefix}", prefix);
                throw;
            }
        }

        public async Task<long> GetPhotoSizeAsync(string fileName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(fileName);
                
                var properties = await blobClient.GetPropertiesAsync();
                return properties.Value.ContentLength;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting photo size for {FileName}", fileName);
                throw;
            }
        }

        public async Task<string> GetPhotoContentTypeAsync(string fileName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(fileName);
                
                var properties = await blobClient.GetPropertiesAsync();
                return properties.Value.ContentType;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting photo content type for {FileName}", fileName);
                throw;
            }
        }

        public async Task<DateTime> GetPhotoLastModifiedAsync(string fileName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(fileName);
                
                var properties = await blobClient.GetPropertiesAsync();
                return properties.Value.LastModified.DateTime;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting photo last modified for {FileName}", fileName);
                throw;
            }
        }
    }

    /// <summary>
    /// Interface for blob storage service
    /// </summary>
    public interface IBlobStorageService
    {
        Task<string> UploadPhotoAsync(IFormFile photo, string fileName);
        Task DeletePhotoAsync(string fileName);
        Task<bool> PhotoExistsAsync(string fileName);
        Task<Stream> DownloadPhotoAsync(string fileName);
        Task<string> GetPhotoUrlAsync(string fileName);
        Task<List<string>> ListPhotosAsync(string prefix = "");
        Task<long> GetPhotoSizeAsync(string fileName);
        Task<string> GetPhotoContentTypeAsync(string fileName);
        Task<DateTime> GetPhotoLastModifiedAsync(string fileName);
    }
}
