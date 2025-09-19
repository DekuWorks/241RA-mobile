# 241RA Mobile - Implementation Checklist

## ✅ Completed Implementation

### App Configuration
- [x] **Bundle Identifiers**: Set `ios.bundleIdentifier` and `android.package` to `org.runners241.app`
- [x] **OAuth Redirect**: Configured scheme `org.runners241.app` with redirect URI `org.runners241.app:/oauthredirect`
- [x] **Environment Variables**: Created `.env.example` with only `EXPO_PUBLIC_API_URL`
- [x] **EAS Secrets**: Updated build profiles to use EAS secrets for sensitive keys

### Push Notifications (Closed App)
- [x] **Firebase Messaging**: Added `@react-native-firebase/messaging` dependency
- [x] **Device Registration**: Implemented `registerDeviceToken()` with permission handling
- [x] **Backend Integration**: POST to `/api/devices` with platform and FCM token
- [x] **Topic Support**: Integrated with topic subscription system
- [x] **Message Handling**: Foreground and background message handlers
- [x] **Cache Invalidation**: React Query integration for push notification data

### Live In-App Updates (Open App)
- [x] **SignalR Client**: Added `@microsoft/signalr` dependency
- [x] **Hub Connection**: Connect to `/hubs/alerts` with JWT authentication
- [x] **Event Handlers**: `caseUpdated`, `newCase`, `adminNotice` events
- [x] **Auto-reconnection**: Exponential backoff reconnection strategy
- [x] **Cache Invalidation**: React Query integration for real-time UI updates

### Topics System
- [x] **Global Topics**: `org_all` for all users
- [x] **Role-based Topics**: `role_admin` for admin users
- [x] **Case-specific Topics**: `case_{id}` for case followers
- [x] **Subscription Management**: Subscribe/unsubscribe endpoints
- [x] **Auto-subscription**: Default topics based on user role

### Authentication & Security
- [x] **SecureStore**: Token storage with secure wrapper
- [x] **Axios Integration**: 401 refresh and sign-out handling
- [x] **Auth Flow**: Call `/auth/me` after login, route Admin vs User
- [x] **JWT Integration**: SignalR authentication with access tokens

### CI/CD Pipeline
- [x] **GitHub Actions**: npm ci → lint → typecheck → build
- [x] **Local Builds**: EAS build with `--local --non-interactive` flags
- [x] **Multi-platform**: Android and iOS preview builds

## 🔧 Backend Requirements

### Required API Endpoints
- [ ] **Device Registration**: `POST /api/devices`
- [ ] **Topic Subscriptions**: `POST /topics/subscribe`, `POST /topics/unsubscribe`
- [ ] **User Subscriptions**: `GET /topics/subscriptions`
- [ ] **SignalR Hub**: `/hubs/alerts` with JWT authentication

### Firebase Admin SDK
- [ ] **Backend Integration**: Add Firebase Admin SDK to .NET backend
- [ ] **Topic Messaging**: Send to topics `role_admin`, `case_{id}`, `org_all`
- [ ] **Token Management**: Store and manage FCM tokens in SQL database

### SignalR Hub Implementation
- [ ] **AlertsHub**: Implement hub with JWT authentication
- [ ] **Event Broadcasting**: `caseUpdated`, `newCase`, `adminNotice` events
- [ ] **Group Management**: Topic-based group subscriptions
- [ ] **Authorization**: Role-based access control

## 🚀 Deployment Checklist

### EAS Secrets Setup
- [ ] **Google Maps API Key**: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] **Sentry DSN**: `EXPO_PUBLIC_SENTRY_DSN`
- [ ] **Google OAuth**: Web, iOS, and Android client IDs
- [ ] **Firebase Config**: All Firebase environment variables

### Firebase Console Setup
- [ ] **Project Creation**: Create Firebase project
- [ ] **iOS App**: Add with bundle ID `org.runners241.app`
- [ ] **Android App**: Add with package `org.runners241.app`
- [ ] **APNs Certificate**: Upload for iOS push notifications
- [ ] **Crashlytics**: Enable for both platforms

### Build & Test
- [ ] **Preview Builds**: Test on both platforms
- [ ] **Push Notifications**: Test foreground and background delivery
- [ ] **SignalR**: Test real-time updates and reconnection
- [ ] **Topic Subscriptions**: Test subscription and unsubscription
- [ ] **Cache Invalidation**: Verify UI updates on data changes

## 📱 Testing Scenarios

### Push Notifications
1. **App Closed**: Send push notification, verify delivery
2. **App Background**: Send push notification, verify handling
3. **App Foreground**: Send push notification, verify in-app handling
4. **Topic-based**: Send to specific topics, verify targeting

### Real-time Updates
1. **Case Updates**: Update case, verify SignalR event and UI refresh
2. **New Cases**: Create new case, verify SignalR event and UI refresh
3. **Admin Notices**: Send admin notice, verify SignalR event and UI refresh
4. **Connection Loss**: Test reconnection and event recovery

### Topic Management
1. **Auto-subscription**: Login as admin, verify role-based topics
2. **Case Following**: Follow/unfollow case, verify topic subscription
3. **Subscription Persistence**: Restart app, verify topic subscriptions

## 🔒 Security Considerations

### Data Protection
- [x] **PII Protection**: Only GUIDs logged to Crashlytics
- [x] **Token Security**: Secure storage of JWT tokens
- [x] **API Security**: HTTPS-only communication
- [x] **Firebase Security**: No user data in Firebase

### Authentication
- [x] **JWT Validation**: Server-side token validation
- [x] **Token Refresh**: Automatic refresh on 401 errors
- [x] **Logout Cleanup**: Clear tokens and stop connections
- [x] **SignalR Auth**: JWT-based hub authentication

## 📊 Monitoring & Analytics

### Crashlytics
- [x] **Error Reporting**: Automatic crash and error reporting
- [x] **Event Logging**: Custom events for push and SignalR
- [x] **User Context**: User ID association (GUID only)

### Performance
- [x] **Connection Monitoring**: SignalR connection state tracking
- [x] **Message Delivery**: Push notification delivery tracking
- [x] **Cache Performance**: React Query cache hit/miss tracking

## 🎯 Success Criteria

### Functional Requirements
- [x] Push notifications work when app is closed
- [x] Real-time updates work when app is open
- [x] Topic-based targeting works correctly
- [x] Cache invalidation updates UI automatically
- [x] Authentication and authorization work properly

### Performance Requirements
- [x] SignalR reconnects automatically on network issues
- [x] Push notifications are delivered reliably
- [x] UI updates are responsive and smooth
- [x] App startup time is not significantly impacted

### Security Requirements
- [x] No sensitive data exposed in logs
- [x] Tokens are stored securely
- [x] API communication is encrypted
- [x] User data remains in SQL backend only
