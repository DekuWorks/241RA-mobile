# Backend Implementation: /api/devices Endpoint

## Overview
This endpoint handles Firebase Cloud Messaging (FCM) device token registration for push notifications.

## Endpoint Specification

### POST /api/devices
Registers or updates a device token for push notifications.

#### Request
```http
POST /api/devices
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "platform": "ios",
  "fcmToken": "fG...long-token-string..."
}
```

#### Response (Success)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "deviceId": "uuid-string",
  "message": "Device token registered successfully"
}
```

#### Response (Error)
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": "Invalid request data"
}
```

## Implementation Examples

### ASP.NET Core (.NET 8)
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DevicesController : ControllerBase
{
    private readonly IDeviceService _deviceService;
    private readonly ILogger<DevicesController> _logger;

    public DevicesController(IDeviceService deviceService, ILogger<DevicesController> logger)
    {
        _deviceService = deviceService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> RegisterDevice([FromBody] DeviceRegistrationRequest request)
    {
        try
        {
            // Get user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized("Invalid token");

            var userId = userIdClaim.Value;

            // Validate request
            if (string.IsNullOrEmpty(request.Platform) || string.IsNullOrEmpty(request.FcmToken))
                return BadRequest(new { success = false, error = "Platform and FCM token are required" });

            if (request.Platform != "ios" && request.Platform != "android")
                return BadRequest(new { success = false, error = "Platform must be 'ios' or 'android'" });

            // Register or update device
            var device = await _deviceService.RegisterDeviceAsync(userId, request.Platform, request.FcmToken);

            _logger.LogInformation("Device registered for user {UserId}: {DeviceId}", userId, device.Id);

            return Ok(new 
            { 
                success = true, 
                deviceId = device.Id, 
                message = "Device token registered successfully" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering device for user {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            return StatusCode(500, new { success = false, error = "Internal server error" });
        }
    }
}

public class DeviceRegistrationRequest
{
    public string Platform { get; set; } = string.Empty;
    public string FcmToken { get; set; } = string.Empty;
}
```

### Service Implementation
```csharp
public interface IDeviceService
{
    Task<Device> RegisterDeviceAsync(string userId, string platform, string fcmToken);
}

public class DeviceService : IDeviceService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DeviceService> _logger;

    public DeviceService(ApplicationDbContext context, ILogger<DeviceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Device> RegisterDeviceAsync(string userId, string platform, string fcmToken)
    {
        // Check if device already exists for this user
        var existingDevice = await _context.Devices
            .FirstOrDefaultAsync(d => d.UserId == userId && d.Platform == platform);

        if (existingDevice != null)
        {
            // Update existing device
            existingDevice.FcmToken = fcmToken;
            existingDevice.UpdatedAt = DateTime.UtcNow;
            existingDevice.IsActive = true;
            
            await _context.SaveChangesAsync();
            return existingDevice;
        }
        else
        {
            // Create new device
            var device = new Device
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Platform = platform,
                FcmToken = fcmToken,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Devices.Add(device);
            await _context.SaveChangesAsync();
            return device;
        }
    }
}
```

### Entity Model
```csharp
public class Device
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty; // "ios" or "android"
    public string FcmToken { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsActive { get; set; }

    // Navigation property
    public ApplicationUser User { get; set; } = null!;
}
```

### Database Migration
```sql
CREATE TABLE Devices (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId NVARCHAR(450) NOT NULL,
    Platform NVARCHAR(10) NOT NULL CHECK (Platform IN ('ios', 'android')),
    FcmToken NVARCHAR(500) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1,
    
    CONSTRAINT FK_Devices_Users_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Devices_UserId ON Devices(UserId);
CREATE INDEX IX_Devices_FcmToken ON Devices(FcmToken);
CREATE INDEX IX_Devices_IsActive ON Devices(IsActive);
```

## Testing the Endpoint

### Using curl
```bash
curl -X POST https://your-api-domain.com/api/devices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "fcmToken": "test-fcm-token-123"
  }'
```

### Using Postman
1. **Method**: POST
2. **URL**: `https://your-api-domain.com/api/devices`
3. **Headers**:
   - `Authorization`: `Bearer YOUR_JWT_TOKEN`
   - `Content-Type`: `application/json`
4. **Body** (raw JSON):
   ```json
   {
     "platform": "ios",
     "fcmToken": "test-fcm-token-123"
   }
   ```

## Security Considerations
1. **Authentication**: Require valid JWT token
2. **Input Validation**: Validate platform and FCM token format
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Token Cleanup**: Periodically clean up inactive/old tokens
5. **Logging**: Log device registrations for monitoring

## Integration with Push Notification Service
This endpoint should integrate with your push notification service (Firebase Admin SDK, OneSignal, etc.) to:
1. Validate FCM tokens
2. Send test notifications
3. Handle token refresh
4. Manage notification preferences
