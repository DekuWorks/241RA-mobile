# Backend Implementation Guide (.NET on Azure)

## Overview
This guide outlines the backend implementation required to support the 241RA mobile app's push notifications and real-time updates system.

## 1. Database Schema

### Device Registry Table
```sql
CREATE TABLE Devices (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Platform NVARCHAR(10) NOT NULL, -- 'ios' or 'android'
    FcmToken NVARCHAR(500) NOT NULL,
    AppVersion NVARCHAR(20),
    LastSeenAt DATETIME2 DEFAULT GETUTCDATE(),
    TopicsJson NVARCHAR(MAX), -- JSON array of subscribed topics
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    INDEX IX_Devices_UserId (UserId),
    INDEX IX_Devices_Platform (Platform),
    INDEX IX_Devices_IsActive (IsActive)
);
```

### Topic Subscriptions Table (Optional - can use JSON in Devices table)
```sql
CREATE TABLE TopicSubscriptions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Topic NVARCHAR(100) NOT NULL, -- 'org_all', 'role_admin', 'case_{id}'
    IsSubscribed BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    UNIQUE INDEX IX_TopicSubscriptions_UserId_Topic (UserId, Topic)
);
```

## 2. API Endpoints

### Device Registration
```csharp
[ApiController]
[Route("api/[controller]")]
public class DevicesController : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> RegisterDevice([FromBody] RegisterDeviceRequest request)
    {
        var userId = GetCurrentUserId(); // From JWT token
        
        var device = new Device
        {
            UserId = userId,
            Platform = request.Platform,
            FcmToken = request.FcmToken,
            AppVersion = request.AppVersion,
            LastSeenAt = DateTime.UtcNow,
            IsActive = true
        };
        
        // Upsert by UserId + Platform
        await _deviceService.UpsertDeviceAsync(device);
        
        return Ok(new { success = true });
    }
    
    [HttpDelete("unregister")]
    public async Task<IActionResult> UnregisterDevice()
    {
        var userId = GetCurrentUserId();
        await _deviceService.DeactivateUserDevicesAsync(userId);
        return Ok(new { success = true });
    }
}

public class RegisterDeviceRequest
{
    public string Platform { get; set; } // "ios" or "android"
    public string FcmToken { get; set; }
    public string AppVersion { get; set; }
}
```

### Topic Subscriptions
```csharp
[ApiController]
[Route("api/[controller]")]
public class TopicsController : ControllerBase
{
    [HttpPost("subscribe")]
    public async Task<IActionResult> SubscribeToTopic([FromBody] TopicSubscriptionRequest request)
    {
        var userId = GetCurrentUserId();
        await _topicService.SubscribeToTopicAsync(userId, request.Topic);
        return Ok(new { success = true });
    }
    
    [HttpPost("unsubscribe")]
    public async Task<IActionResult> UnsubscribeFromTopic([FromBody] TopicSubscriptionRequest request)
    {
        var userId = GetCurrentUserId();
        await _topicService.UnsubscribeFromTopicAsync(userId, request.Topic);
        return Ok(new { success = true });
    }
    
    [HttpGet("subscriptions")]
    public async Task<IActionResult> GetUserSubscriptions()
    {
        var userId = GetCurrentUserId();
        var subscriptions = await _topicService.GetUserSubscriptionsAsync(userId);
        return Ok(subscriptions);
    }
}

public class TopicSubscriptionRequest
{
    public string Topic { get; set; }
}
```

## 3. Firebase Admin SDK Integration

### Configuration
```csharp
// Program.cs or Startup.cs
services.AddSingleton<FirebaseMessaging>(provider =>
{
    var firebaseConfig = provider.GetRequiredService<IConfiguration>();
    var serviceAccountJson = firebaseConfig["Firebase:ServiceAccountJson"];
    
    var app = FirebaseApp.Create(new AppOptions
    {
        Credential = GoogleCredential.FromJson(serviceAccountJson)
    });
    
    return FirebaseMessaging.GetMessaging(app);
});
```

### Notification Service
```csharp
public interface INotificationService
{
    Task NotifyTopicAsync(string topic, NotificationData data);
    Task NotifyTokensAsync(string[] tokens, NotificationData data);
    Task NotifyUserAsync(Guid userId, NotificationData data);
}

public class NotificationService : INotificationService
{
    private readonly FirebaseMessaging _firebaseMessaging;
    private readonly IDeviceService _deviceService;
    
    public async Task NotifyTopicAsync(string topic, NotificationData data)
    {
        var message = new Message
        {
            Topic = topic,
            Notification = new Notification
            {
                Title = data.Title,
                Body = data.Body
            },
            Data = data.Data?.ToDictionary(kvp => kvp.Key, kvp => kvp.Value),
            Android = new AndroidConfig
            {
                Priority = Priority.High,
                Notification = new AndroidNotification
                {
                    Icon = "ic_notification",
                    Color = "#000000"
                }
            },
            Apns = new ApnsConfig
            {
                Aps = new Aps
                {
                    Alert = new ApsAlert
                    {
                        Title = data.Title,
                        Body = data.Body
                    },
                    Badge = 1,
                    Sound = "default"
                }
            }
        };
        
        var response = await _firebaseMessaging.SendAsync(message);
        // Log response for audit
    }
    
    public async Task NotifyUserAsync(Guid userId, NotificationData data)
    {
        var devices = await _deviceService.GetActiveUserDevicesAsync(userId);
        var tokens = devices.Select(d => d.FcmToken).ToArray();
        
        if (tokens.Any())
        {
            await NotifyTokensAsync(tokens, data);
        }
    }
}

public class NotificationData
{
    public string Title { get; set; }
    public string Body { get; set; }
    public Dictionary<string, string> Data { get; set; }
}
```

## 4. SignalR Hub Implementation

### AlertsHub
```csharp
[Authorize]
public class AlertsHub : Hub
{
    private readonly IUserService _userService;
    private readonly ITopicService _topicService;
    
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var user = await _userService.GetUserAsync(userId);
        
        // Join user-specific group
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
        
        // Join role-based groups
        if (user.Role == "admin")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "role:admin");
        }
        
        // Join topic-based groups
        var topics = await _topicService.GetUserSubscriptionsAsync(userId);
        foreach (var topic in topics.Where(t => t.IsSubscribed))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"topic:{topic.Topic}");
        }
        
        await base.OnConnectedAsync();
    }
    
    public override async Task OnDisconnectedAsync(Exception exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
    
    // Hub methods for client to call
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }
    
    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }
    
    private Guid GetUserId()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim);
    }
}
```

### SignalR Service for Broadcasting
```csharp
public interface ISignalRService
{
    Task BroadcastCaseUpdatedAsync(Guid caseId, object caseData);
    Task BroadcastNewCaseAsync(Guid caseId, object caseData);
    Task BroadcastAdminNoticeAsync(string message, object data);
}

public class SignalRService : ISignalRService
{
    private readonly IHubContext<AlertsHub> _hubContext;
    private readonly INotificationService _notificationService;
    
    public async Task BroadcastCaseUpdatedAsync(Guid caseId, object caseData)
    {
        // Send via SignalR to connected clients
        await _hubContext.Clients.Group($"topic:case_{caseId}")
            .SendAsync("caseUpdated", new { id = caseId, data = caseData });
        
        // Send push notification to topic subscribers
        await _notificationService.NotifyTopicAsync($"case_{caseId}", new NotificationData
        {
            Title = "Case Updated",
            Body = "A case you're following has been updated",
            Data = new Dictionary<string, string>
            {
                ["type"] = "case_updated",
                ["caseId"] = caseId.ToString()
            }
        });
    }
    
    public async Task BroadcastNewCaseAsync(Guid caseId, object caseData)
    {
        // Send via SignalR to all connected clients
        await _hubContext.Clients.All.SendAsync("newCase", new { id = caseId, data = caseData });
        
        // Send push notification to all users
        await _notificationService.NotifyTopicAsync("org_all", new NotificationData
        {
            Title = "New Case Reported",
            Body = "A new case has been reported in your area",
            Data = new Dictionary<string, string>
            {
                ["type"] = "new_case",
                ["caseId"] = caseId.ToString()
            }
        });
    }
    
    public async Task BroadcastAdminNoticeAsync(string message, object data)
    {
        // Send via SignalR to admin users
        await _hubContext.Clients.Group("role:admin")
            .SendAsync("adminNotice", new { message, data });
        
        // Send push notification to admin users
        await _notificationService.NotifyTopicAsync("role_admin", new NotificationData
        {
            Title = "Admin Notice",
            Body = message,
            Data = new Dictionary<string, string>
            {
                ["type"] = "admin_notice"
            }
        });
    }
}
```

## 5. Azure Configuration

### App Settings
```json
{
  "Firebase": {
    "ServiceAccountJson": "{\"type\":\"service_account\",\"project_id\":\"...\"}"
  },
  "SignalR": {
    "ConnectionString": "Endpoint=https://your-signalr.service.signalr.net;AccessKey=...;Version=1.0;"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:your-server.database.windows.net,1433;Initial Catalog=241Runners;..."
  }
}
```

### Azure Key Vault (Recommended)
Store sensitive configuration in Azure Key Vault:
- Firebase service account JSON
- Database connection strings
- SignalR connection strings

## 6. Integration Points

### Case Updates
```csharp
// In your case service
public async Task UpdateCaseAsync(Guid caseId, UpdateCaseRequest request)
{
    // Update case in database
    var updatedCase = await _caseRepository.UpdateAsync(caseId, request);
    
    // Broadcast update via SignalR and push notification
    await _signalRService.BroadcastCaseUpdatedAsync(caseId, updatedCase);
    
    return updatedCase;
}
```

### New Case Creation
```csharp
public async Task<Case> CreateCaseAsync(CreateCaseRequest request)
{
    var newCase = await _caseRepository.CreateAsync(request);
    
    // Broadcast new case
    await _signalRService.BroadcastNewCaseAsync(newCase.Id, newCase);
    
    return newCase;
}
```

## 7. Testing

### Unit Tests
- Test notification service methods
- Test SignalR hub methods
- Test topic subscription logic

### Integration Tests
- Test device registration flow
- Test push notification delivery
- Test SignalR connection and messaging

### Manual Testing
- Register device via API
- Send test notifications via Firebase Console
- Test SignalR connection from mobile app
- Verify topic subscriptions work correctly

## 8. Monitoring & Logging

### Application Insights
- Track notification delivery success/failure rates
- Monitor SignalR connection counts
- Log device registration events

### Firebase Analytics
- Monitor push notification delivery
- Track notification open rates
- Monitor token refresh events

This implementation provides a complete backend system to support your mobile app's push notifications and real-time updates functionality.
