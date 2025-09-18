# Firebase Integration Setup for 241RA Mobile App

## Overview
This document outlines the Firebase integration implemented for the 241RA mobile app, including Crashlytics for crash reporting and Firebase Cloud Messaging (FCM) for push notifications.

## What's Implemented

### 1. Firebase Dependencies
- `@react-native-firebase/app` - Core Firebase SDK
- `@react-native-firebase/messaging` - Push notifications
- `@react-native-firebase/crashlytics` - Crash reporting

### 2. Configuration Files

#### app.config.ts
- Added Firebase plugins
- Configured iOS GoogleService-Info.plist path
- Configured Android google-services.json path
- Added environment variables for API base and crash reporting

#### eas.json
- Updated build profiles with Firebase environment variables
- Added latest build images for iOS and Android

### 3. Core Services

#### API Configuration (src/config/api.ts)
- Centralized API base URL configuration
- Environment variable support

#### HTTP Client (src/lib/http.ts)
- Axios-based HTTP client with JWT token handling
- Automatic token refresh on 401 errors
- Integration with existing secure token service

#### Crashlytics Utilities (src/lib/crash.ts)
- `initCrashlytics(userId)` - Initialize with user GUID (no PII)
- `recordError(error)` - Record errors with PII protection
- `logEvent(name, data)` - Log events with data sanitization
- `forceTestCrash()` - Development testing helper

### 4. Push Notifications (src/features/push/registerDeviceToken.ts)
- `registerDeviceToken()` - Register FCM token with API
- `attachForegroundMessaging()` - Handle foreground messages
- `setupBackgroundMessageHandler()` - Handle background messages
- Automatic device token registration after login

### 5. Integration Points

#### Auth Service Integration
- Crashlytics initialized with user ID after successful login
- Device token registration after authentication
- Works with both regular login and Google login

#### Error Boundary Integration
- Automatic error reporting to Crashlytics
- Maintains existing error handling UI

#### App Layout Integration
- Firebase messaging handlers initialized at app startup
- Background message handling setup

## Security & Privacy

### PII/PHI Protection
- Only user GUIDs are logged to Crashlytics (no emails, names, etc.)
- All log data is sanitized to remove sensitive information
- Device tokens are stored via existing API endpoints
- No user data is stored in Firebase

### Data Flow
- All user data remains in existing SQL backend
- Firebase only handles:
  - Crash reporting
  - Push notification delivery
  - Device token management (via API)

## Required Setup Steps

### 1. Firebase Console Setup
1. Create/select Firebase project
2. Add iOS app with bundle ID: `org.runners241.app`
3. Download `GoogleService-Info.plist` → place in `ios/` directory
4. Add Android app with package: `org.runners241.app`
5. Download `google-services.json` → place in `android/app/` directory
6. Enable Crashlytics for both platforms

### 2. API Endpoint
Ensure your backend has the `/api/devices` endpoint to handle device token registration:
```json
POST /api/devices
{
  "platform": "ios|android",
  "fcmToken": "firebase_token_string"
}
```

### 3. Build & Test
```bash
# Build for testing
eas build -p ios --profile preview
eas build -p android --profile preview

# Build for production
eas build -p ios --profile production
eas build -p android --profile production
```

## Testing

### Crashlytics Testing
1. Install test build on device
2. Use hidden dev button to trigger test crash:
   ```typescript
   import { forceTestCrash } from '../lib/crash';
   forceTestCrash(); // Only in development builds
   ```
3. Verify crash appears in Firebase Crashlytics dashboard

### Push Notifications Testing
1. Send test notification from Firebase Console
2. Verify foreground message handling
3. Verify background message handling
4. Check device token registration in API logs

## Environment Variables

### Development
- `EXPO_PUBLIC_API_BASE`: API base URL
- `EXPO_PUBLIC_ENABLE_CRASH`: "true" to enable crash reporting

### Production
- Same variables set in EAS build profiles

## Notes

- **Single Backend**: All CRUD operations still hit `https://241runners-api-v2.azurewebsites.net`
- **No Firestore/RTDB**: No user data stored in Firebase
- **Device Tokens**: Stored in SQL via `/api/devices` endpoint only
- **Static Site**: No changes required for web analytics/crash reporting
- **PII Protection**: Comprehensive sanitization prevents sensitive data logging

## Troubleshooting

### Common Issues
1. **Google Services files missing**: Ensure both `GoogleService-Info.plist` and `google-services.json` are in correct locations
2. **Build failures**: Check that Firebase plugins are properly configured in app.config.ts
3. **Push not working**: Verify device token registration in API logs and Firebase Console
4. **Crashes not appearing**: Check `EXPO_PUBLIC_ENABLE_CRASH` is set to "true"

### Debug Commands
```bash
# Check environment variables
npx expo config --type public

# Verify Firebase configuration
npx expo install --check
```
