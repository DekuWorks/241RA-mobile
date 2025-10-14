# Backend Implementation Plan

## 🎯 Priority Implementation Roadmap

### **Phase 1: Core Authentication System (CRITICAL - Week 1)**

#### **1.1 Create Core Models**
```csharp
// Models/User.cs
public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Role { get; set; } = "user";
    public bool IsEmailVerified { get; set; }
    public bool TwoFactorEnabled { get; set; }
    public string? TwoFactorSecret { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}

// Models/AuthModels.cs
public class LoginRequest
{
    public string Email { get; set; }
    public string Password { get; set; }
    public string? TwoFactorCode { get; set; }
}

public class RegisterRequest
{
    public string Email { get; set; }
    public string Password { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Role { get; set; } = "user";
}
```

#### **1.2 Authentication Controller**
```csharp
// Controllers/AuthController.cs
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    // POST /api/v1/auth/login
    // POST /api/v1/auth/register
    // POST /api/v1/auth/refresh
    // POST /api/v1/auth/logout
    // POST /api/v1/auth/forgot-password
    // POST /api/v1/auth/reset-password
    // POST /api/v1/auth/verify-email
    // POST /api/v1/auth/enable-2fa
    // POST /api/v1/auth/verify-2fa
}
```

#### **1.3 Authentication Service**
```csharp
// Services/IAuthService.cs
public interface IAuthService
{
    Task<AuthResult> LoginAsync(LoginRequest request);
    Task<AuthResult> RegisterAsync(RegisterRequest request);
    Task<AuthResult> RefreshTokenAsync(string refreshToken);
    Task<bool> LogoutAsync(string userId);
    Task<bool> EnableTwoFactorAsync(string userId);
    Task<bool> VerifyTwoFactorAsync(string userId, string code);
}
```

### **Phase 2: User Management (HIGH - Week 2)**

#### **2.1 User Controller**
```csharp
// Controllers/UserController.cs
[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UserController : ControllerBase
{
    // GET /api/v1/users/profile
    // PUT /api/v1/users/profile
    // DELETE /api/v1/users/account
    // POST /api/v1/users/change-password
    // GET /api/v1/users/me
}
```

#### **2.2 User Service**
```csharp
// Services/IUserService.cs
public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(string userId);
    Task<UserProfileDto> UpdateProfileAsync(string userId, UpdateProfileRequest request);
    Task<bool> ChangePasswordAsync(string userId, ChangePasswordRequest request);
    Task<bool> DeleteAccountAsync(string userId);
    Task<UserDto> GetCurrentUserAsync(string userId);
}
```

### **Phase 3: Cases System (MEDIUM - Week 3)**

#### **3.1 Case Models**
```csharp
// Models/Case.cs
public class Case
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; }
    public string Description { get; set; }
    public string Status { get; set; } = "open";
    public string Priority { get; set; } = "medium";
    public string RunnerId { get; set; }
    public string ReporterId { get; set; }
    public DateTime LastSeen { get; set; }
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public string Location { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

// Models/Sighting.cs
public class Sighting
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string CaseId { get; set; }
    public string ReporterId { get; set; }
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    public string Location { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Description { get; set; }
    public string? PhotoUrl { get; set; }
    public string Status { get; set; } = "pending";
}
```

#### **3.2 Cases Controller**
```csharp
// Controllers/CasesController.cs
[ApiController]
[Route("api/v1/cases")]
[Authorize]
public class CasesController : ControllerBase
{
    // GET /api/v1/cases
    // GET /api/v1/cases/{id}
    // POST /api/v1/cases
    // PUT /api/v1/cases/{id}
    // DELETE /api/v1/cases/{id}
    // POST /api/v1/cases/{id}/sightings
}
```

### **Phase 4: Admin System (MEDIUM - Week 4)**

#### **4.1 Admin Controller**
```csharp
// Controllers/AdminController.cs
[ApiController]
[Route("api/v1/admin")]
[Authorize(Roles = "admin,super_admin,moderator")]
public class AdminController : ControllerBase
{
    // GET /api/v1/admin/stats
    // GET /api/v1/admin/users
    // PUT /api/v1/admin/users/{id}/role
    // DELETE /api/v1/admin/users/{id}
    // GET /api/v1/admin/cases
    // PUT /api/v1/admin/cases/{id}/status
    // GET /api/v1/admin/analytics
}
```

### **Phase 5: Device Management (LOW - Week 5)**

#### **5.1 Device Models**
```csharp
// Models/Device.cs
public class Device
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; }
    public string FcmToken { get; set; }
    public string Platform { get; set; }
    public string AppVersion { get; set; }
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}
```

#### **5.2 Device Controller**
```csharp
// Controllers/DeviceController.cs
[ApiController]
[Route("api/v1/devices")]
[Authorize]
public class DeviceController : ControllerBase
{
    // POST /api/v1/devices/register
    // DELETE /api/v1/devices/unregister
    // PUT /api/v1/devices/token
}
```

### **Phase 6: SignalR Hubs (LOW - Week 6)**

#### **6.1 Admin Hub**
```csharp
// Hubs/AdminHub.cs
public class AdminHub : Hub
{
    public async Task JoinAdminGroup()
    public async Task LeaveAdminGroup()
    public async Task SendCaseUpdate(string caseId, object update)
    public async Task SendUserUpdate(string userId, object update)
    public async Task SendSystemNotification(string message)
}
```

#### **6.2 Alerts Hub**
```csharp
// Hubs/AlertsHub.cs
public class AlertsHub : Hub
{
    public async Task JoinUserGroup(string userId)
    public async Task LeaveUserGroup(string userId)
    public async Task SendCaseAlert(string userId, object alert)
    public async Task SendSightingAlert(string userId, object sighting)
}
```

## 🔧 **Implementation Details**

### **Database Context Updates**
```csharp
// Data/ApplicationDbContext.cs
public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Case> Cases { get; set; }
    public DbSet<Sighting> Sightings { get; set; }
    public DbSet<Device> Devices { get; set; }
    public DbSet<RunnerProfile> RunnerProfiles { get; set; }
    public DbSet<RunnerPhoto> RunnerPhotos { get; set; }
    public DbSet<NotificationSettings> NotificationSettings { get; set; }
    
    // Existing tables...
}
```

### **JWT Configuration**
```csharp
// Configuration/JwtConfiguration.cs
public static class JwtConfiguration
{
    public static void AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]);
        
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtSettings["Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });
    }
}
```

### **CORS Configuration**
```csharp
// Configuration/CorsConfiguration.cs
public static class CorsConfiguration
{
    public static void AddCorsServices(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("AllowMobileApp", builder =>
            {
                builder
                    .AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .SetIsOriginAllowed(origin => true);
            });
        });
    }
}
```

## 📋 **Implementation Checklist**

### **Week 1: Authentication**
- [ ] Create User model and database migration
- [ ] Implement AuthController with login/register endpoints
- [ ] Set up JWT authentication middleware
- [ ] Create AuthService with password hashing
- [ ] Test authentication flow with frontend
- [ ] Add two-factor authentication support

### **Week 2: User Management**
- [ ] Create UserController for profile management
- [ ] Implement UserService with CRUD operations
- [ ] Add password change functionality
- [ ] Implement account deletion
- [ ] Test user management with frontend

### **Week 3: Cases System**
- [ ] Create Case and Sighting models
- [ ] Implement CasesController with CRUD operations
- [ ] Add sighting reporting functionality
- [ ] Create case status management
- [ ] Test cases functionality with frontend

### **Week 4: Admin System**
- [ ] Create AdminController for admin operations
- [ ] Implement user management endpoints
- [ ] Add admin statistics and analytics
- [ ] Create admin audit logging
- [ ] Test admin features with frontend

### **Week 5: Device Management**
- [ ] Create Device model and controller
- [ ] Implement FCM token registration
- [ ] Add device management functionality
- [ ] Set up push notification sending
- [ ] Test push notifications

### **Week 6: SignalR Hubs**
- [ ] Implement AdminHub for admin users
- [ ] Implement AlertsHub for regular users
- [ ] Set up real-time notifications
- [ ] Add live case updates
- [ ] Test real-time features

## 🚀 **Deployment Considerations**

### **Environment Variables**
```json
{
  "JwtSettings": {
    "SecretKey": "your-super-secret-key-here",
    "Issuer": "241RunnersAPI",
    "Audience": "241RunnersMobile",
    "ExpiryMinutes": 60
  },
  "ConnectionStrings": {
    "DefaultConnection": "your-database-connection-string"
  },
  "Firebase": {
    "ServerKey": "your-firebase-server-key",
    "SenderId": "your-firebase-sender-id"
  }
}
```

### **Production Readiness**
- [ ] Set up proper logging (Serilog)
- [ ] Configure health checks
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting
- [ ] Set up database backup strategy
- [ ] Configure SSL certificates
- [ ] Set up CI/CD pipeline

This implementation plan provides a clear roadmap to get the backend up to par with the existing frontend functionality.
