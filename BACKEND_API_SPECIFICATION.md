# 241 Runners API - Runner Profile Endpoints Specification

## Base URL
`https://241runners-api-v2.azurewebsites.net`

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <access_token>
```

## Runner Profile Endpoints

### 1. Get Runner Profile
**GET** `/api/v1/runner-profile`

Returns the current user's runner profile.

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "age": 34,
  "height": "5'8\"",
  "weight": "150 lbs",
  "eyeColor": "Brown",
  "medicalConditions": ["Diabetes", "Asthma"],
  "additionalNotes": "Prefers morning runs",
  "photos": [
    {
      "id": "uuid",
      "fileName": "profile_photo.jpg",
      "fileUrl": "https://storage.../profile_photo.jpg",
      "fileSize": 1024000,
      "mimeType": "image/jpeg",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "isPrimary": true
    }
  ],
  "lastPhotoUpdate": "2024-01-15T10:30:00Z",
  "reminderCount": 0,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "isActive": true
}
```

### 2. Check Runner Profile Exists
**GET** `/api/v1/runner-profile/exists`

Returns whether the current user has a runner profile.

**Response:**
```json
{
  "exists": true
}
```

### 3. Create Runner Profile
**POST** `/api/v1/runner-profile`

Creates a new runner profile for the current user.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "height": "5'8\"",
  "weight": "150 lbs",
  "eyeColor": "Brown",
  "medicalConditions": ["Diabetes", "Asthma"],
  "additionalNotes": "Prefers morning runs"
}
```

**Response:** Same as Get Runner Profile

### 4. Update Runner Profile
**PUT** `/api/v1/runner-profile`

Updates the current user's runner profile.

**Request Body:** Same as Create Runner Profile (all fields optional)

**Response:** Same as Get Runner Profile

### 5. Delete Runner Profile
**DELETE** `/api/v1/runner-profile`

Deletes the current user's runner profile.

**Response:**
```json
{
  "success": true,
  "message": "Runner profile deleted successfully"
}
```

## Photo Management Endpoints

### 6. Upload Photo
**POST** `/api/v1/runner-profile/photos`

Uploads a new photo for the runner profile.

**Request:** Multipart form data
- `photo`: Image file (JPEG, PNG, GIF, WebP, max 10MB)

**Response:**
```json
{
  "id": "uuid",
  "fileName": "profile_photo.jpg",
  "fileUrl": "https://storage.../profile_photo.jpg",
  "fileSize": 1024000,
  "mimeType": "image/jpeg",
  "uploadedAt": "2024-01-15T10:30:00Z",
  "isPrimary": false
}
```

### 7. Get Photos
**GET** `/api/v1/runner-profile/photos`

Returns all photos for the current user's runner profile.

**Response:**
```json
[
  {
    "id": "uuid",
    "fileName": "profile_photo.jpg",
    "fileUrl": "https://storage.../profile_photo.jpg",
    "fileSize": 1024000,
    "mimeType": "image/jpeg",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "isPrimary": true
  }
]
```

### 8. Delete Photo
**DELETE** `/api/v1/runner-profile/photos/{photoId}`

Deletes a specific photo.

**Response:**
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

### 9. Set Primary Photo
**PUT** `/api/v1/runner-profile/photos/{photoId}/primary`

Sets a photo as the primary profile photo.

**Response:**
```json
{
  "success": true,
  "message": "Primary photo updated successfully"
}
```

## Notification Settings Endpoints

### 10. Get Notification Settings
**GET** `/api/v1/runner-profile/notification-settings`

Returns the user's notification preferences.

**Response:**
```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "reminderFrequency": "weekly"
}
```

### 11. Update Notification Settings
**PUT** `/api/v1/runner-profile/notification-settings`

Updates the user's notification preferences.

**Request Body:**
```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "reminderFrequency": "weekly"
}
```

**Response:** Same as Get Notification Settings

## Photo Update Reminders Endpoints

### 12. Get Photo Update Reminders
**GET** `/api/v1/runner-profile/photo-reminders`

Returns active photo update reminders.

**Response:**
```json
[
  {
    "id": "uuid",
    "runnerProfileId": "uuid",
    "reminderDate": "2024-01-15T00:00:00Z",
    "reminderType": "email",
    "sentAt": "2024-01-15T09:00:00Z",
    "status": "sent"
  }
]
```

### 13. Dismiss Photo Reminder
**PUT** `/api/v1/runner-profile/photo-reminders/{reminderId}/dismiss`

Dismisses a specific photo update reminder.

**Response:**
```json
{
  "success": true,
  "message": "Reminder dismissed successfully"
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": {
    "firstName": "First name is required"
  }
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Runner profile not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Database Schema

### RunnerProfiles Table
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
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);
```

### RunnerPhotos Table
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
    FOREIGN KEY (RunnerProfileId) REFERENCES RunnerProfiles(Id)
);
```

### PhotoUpdateReminders Table
```sql
CREATE TABLE PhotoUpdateReminders (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RunnerProfileId UNIQUEIDENTIFIER NOT NULL,
    ReminderDate DATETIME2 NOT NULL,
    ReminderType NVARCHAR(20) NOT NULL, -- 'email', 'push', 'both'
    SentAt DATETIME2,
    Status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (RunnerProfileId) REFERENCES RunnerProfiles(Id)
);
```

## Background Services

### Photo Update Reminder Service
- Runs daily to check for profiles with photos older than 6 months
- Creates reminder records for overdue profiles
- Sends email and push notifications based on user preferences
- Tracks reminder count to prevent spam

### File Storage
- Photos should be stored in Azure Blob Storage or similar
- Generate unique file names to prevent conflicts
- Implement proper access controls and CDN integration
- Support for image resizing and optimization

## Security Considerations

1. **File Upload Security:**
   - Validate file types and sizes
   - Scan for malware
   - Implement rate limiting

2. **Data Privacy:**
   - Encrypt sensitive medical information
   - Implement proper access controls
   - Follow GDPR/privacy regulations

3. **Authentication:**
   - Validate JWT tokens
   - Implement proper authorization checks
   - Rate limiting for API endpoints

## Implementation Notes

1. **Age Calculation:** Calculate age from dateOfBirth on the server side
2. **Photo Limits:** Enforce maximum of 10 photos per profile
3. **File Validation:** Validate file types, sizes, and content
4. **Notifications:** Implement proper email and push notification services
5. **Background Jobs:** Use Azure Functions or similar for reminder processing
6. **Caching:** Implement Redis caching for frequently accessed data
7. **Logging:** Comprehensive logging for debugging and monitoring
