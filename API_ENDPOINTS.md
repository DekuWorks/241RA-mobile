# API Endpoints Documentation

## Required Backend API Endpoints

### Device Token Registration Endpoint

**POST** `/api/devices`

This endpoint is required for Firebase push notification device token registration.

#### Request Body
```json
{
  "platform": "ios" | "android",
  "fcmToken": "string"
}
```

#### Response
```json
{
  "success": true,
  "deviceId": "string",
  "message": "Device token registered successfully"
}
```

#### Implementation Notes
- This endpoint should store the FCM token in your database
- Associate the token with the authenticated user
- Handle token updates (same device, new token)
- Clean up old/invalid tokens periodically

#### Example Implementation (ASP.NET Core)
```csharp
[HttpPost("api/devices")]
[Authorize]
public async Task<IActionResult> RegisterDevice([FromBody] DeviceRegistrationRequest request)
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    
    if (string.IsNullOrEmpty(userId))
        return Unauthorized();

    var device = await _deviceService.RegisterDeviceAsync(userId, request.Platform, request.FcmToken);
    
    return Ok(new { 
        success = true, 
        deviceId = device.Id, 
        message = "Device token registered successfully" 
    });
}

public class DeviceRegistrationRequest
{
    public string Platform { get; set; }
    public string FcmToken { get; set; }
}
```

#### Database Schema Suggestion
```sql
CREATE TABLE Devices (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Platform NVARCHAR(10) NOT NULL, -- 'ios' or 'android'
    FcmToken NVARCHAR(500) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
```

---

## Current API Endpoints (Existing)

### Authentication
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/refresh` - Token refresh
- **POST** `/api/auth/logout` - User logout

### Admin
- **GET** `/api/Admin/users` - Get all users
- **PATCH** `/api/Admin/users/{userId}` - Update user (role, status)
- **POST** `/api/Admin/users` - Create new user

### Cases
- **GET** `/api/cases` - Get cases
- **POST** `/api/cases` - Create case
- **GET** `/api/cases/{id}` - Get case by ID
- **PATCH** `/api/cases/{id}` - Update case
- **DELETE** `/api/cases/{id}` - Delete case

### Users
- **GET** `/api/users/profile` - Get user profile
- **PATCH** `/api/users/profile` - Update user profile

---

## Notes
- All endpoints require Bearer token authentication except login
- Use HTTPS in production
- Implement proper error handling and validation
- Consider rate limiting for public endpoints
- Log all API calls for monitoring and debugging
