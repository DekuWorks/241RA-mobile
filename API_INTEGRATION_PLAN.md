# 241 Runners Mobile App - API Integration Plan

## Current Status
- **Backend API**: https://241runners-api-v2.azurewebsites.net
- **Main Repository**: https://github.com/DekuWorks/241RunnersAwareness
- **Mobile App**: React Native with Expo

## API Endpoints Required for Runner Profile System

### 1. User Profile Endpoints (Already Implemented)
- `GET /api/v1/user-profile` - Get user profile
- `PATCH /api/v1/user-profile` - Update user profile
- `POST /api/v1/user-profile/upload-image` - Upload profile image
- `GET /api/v1/user-profile/case-statistics` - Get case statistics
- `GET /api/v1/user-profile/has-runner-profile` - Check if runner profile exists

### 2. Runner Profile Endpoints (Need Implementation)
- `GET /api/v1/runner-profile` - Get runner profile
- `POST /api/v1/runner-profile` - Create runner profile
- `PATCH /api/v1/runner-profile` - Update runner profile
- `DELETE /api/v1/runner-profile` - Delete runner profile

### 3. Photo Management Endpoints (Need Implementation)
- `POST /api/v1/runner-profile/photos` - Upload photos
- `GET /api/v1/runner-profile/photos` - Get all photos
- `DELETE /api/v1/runner-profile/photos/{photoId}` - Delete photo
- `POST /api/v1/runner-profile/photos/{photoId}/set-primary` - Set primary photo

### 4. Notification Endpoints (Need Implementation)
- `GET /api/v1/runner-profile/notification-settings` - Get notification settings
- `PUT /api/v1/runner-profile/notification-settings` - Update notification settings
- `GET /api/v1/runner-profile/photo-reminders` - Get photo reminders
- `PUT /api/v1/runner-profile/photo-reminders/{reminderId}/dismiss` - Dismiss reminder

## Mobile App Integration Status

### ✅ Completed
1. **API Client Configuration**
   - Base URL: `https://241runners-api-v2.azurewebsites.net`
   - Authentication: Bearer token with auto-refresh
   - Error handling: Comprehensive error management
   - File upload: Progress tracking support

2. **User Profile System**
   - UserProfileService implemented
   - Profile editing with validation
   - Image upload functionality
   - Case statistics integration

3. **Runner Profile System**
   - RunnerProfileService implemented
   - PhotoUpload component
   - RunnerProfileForm component
   - Validation utilities
   - TypeScript interfaces

### 🔄 In Progress
1. **Backend API Implementation**
   - Need to implement runner profile endpoints
   - Need to implement photo management endpoints
   - Need to implement notification system

### 📋 Next Steps

#### Backend Implementation Required
1. **Database Schema**
   ```sql
   -- RunnerProfiles table
   CREATE TABLE RunnerProfiles (
       Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
       UserId UNIQUEIDENTIFIER NOT NULL,
       FirstName NVARCHAR(50) NOT NULL,
       LastName NVARCHAR(50) NOT NULL,
       DateOfBirth DATE NOT NULL,
       Height NVARCHAR(20) NOT NULL,
       Weight NVARCHAR(20) NOT NULL,
       EyeColor NVARCHAR(20) NOT NULL,
       MedicalConditions NVARCHAR(MAX),
       AdditionalNotes NVARCHAR(1000),
       LastPhotoUpdate DATETIME2,
       ReminderCount INT DEFAULT 0,
       CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
       UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
       IsActive BIT DEFAULT 1,
       FOREIGN KEY (UserId) REFERENCES Users(Id)
   );

   -- RunnerPhotos table
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

2. **API Controllers**
   - RunnerProfileController
   - PhotoController
   - NotificationController

3. **Background Services**
   - Photo update reminder service
   - Email notification service
   - Push notification service

#### Mobile App Testing
1. **API Integration Testing**
   - Test all endpoints with mock data
   - Verify error handling
   - Test file upload functionality

2. **Cross-Platform Testing**
   - Test on Android devices
   - Test on iOS devices
   - Verify consistent behavior

3. **User Experience Testing**
   - Test profile creation flow
   - Test photo upload process
   - Test validation and error messages

## Implementation Priority

### High Priority
1. ✅ Mobile app runner profile system (COMPLETED)
2. 🔄 Backend runner profile endpoints
3. 🔄 Photo upload and management
4. 🔄 Database schema implementation

### Medium Priority
1. 📋 Notification system
2. 📋 Photo update reminders
3. 📋 Background services

### Low Priority
1. 📋 Advanced photo features
2. 📋 Analytics and reporting
3. 📋 Admin dashboard features

## Testing Strategy

### Unit Tests
- Service layer tests
- Validation tests
- API client tests

### Integration Tests
- End-to-end API testing
- File upload testing
- Authentication testing

### User Acceptance Tests
- Profile creation flow
- Photo upload process
- Cross-platform compatibility

## Deployment Plan

### Phase 1: Backend API Implementation
1. Implement database schema
2. Create API controllers
3. Add authentication middleware
4. Test endpoints

### Phase 2: Mobile App Integration
1. Test API integration
2. Fix any compatibility issues
3. Optimize performance
4. Add error handling

### Phase 3: Production Deployment
1. Deploy backend changes
2. Update mobile app
3. Monitor system performance
4. Gather user feedback

## Monitoring and Maintenance

### API Monitoring
- Response time tracking
- Error rate monitoring
- Usage analytics

### Mobile App Monitoring
- Crash reporting
- Performance metrics
- User engagement tracking

### Security Considerations
- File upload security
- Data encryption
- Access control
- Rate limiting

## Success Metrics

### Technical Metrics
- API response times < 2 seconds
- File upload success rate > 95%
- Mobile app crash rate < 1%

### User Experience Metrics
- Profile creation completion rate > 90%
- Photo upload success rate > 95%
- User satisfaction score > 4.5/5

## Risk Mitigation

### Technical Risks
- API compatibility issues
- File upload failures
- Cross-platform inconsistencies

### Mitigation Strategies
- Comprehensive testing
- Fallback mechanisms
- Progressive rollout
- User feedback collection
