# Platform-Specific Services

This directory contains platform-specific implementations for Android and iOS, providing optimized functionality for each platform.

## Structure

```
src/platform/
├── android/                    # Android-specific implementations
│   ├── signalR.android.ts     # Android SignalR service
│   ├── notifications.android.ts # Android notification handling
│   ├── auth.android.ts        # Android authentication
│   └── index.ts               # Android exports
├── ios/                       # iOS-specific implementations
│   ├── signalR.ios.ts        # iOS SignalR service
│   ├── notifications.ios.ts   # iOS notification handling
│   ├── auth.ios.ts           # iOS authentication
│   └── index.ts              # iOS exports
├── shared/                    # Shared platform utilities
│   └── platformFactory.ts    # Platform service factory
├── index.ts                   # Main platform exports
└── README.md                  # This file
```

## Usage

### Using Platform-Specific Services

```typescript
import { PlatformServiceFactory } from '../platform/shared/platformFactory';

// Get platform-specific SignalR service
const signalRService = PlatformServiceFactory.getSignalRService();
await signalRService.startConnection();

// Get platform-specific notification service
const notificationService = PlatformServiceFactory.getNotificationService();
await notificationService.requestPermissions();

// Get platform-specific auth service
const authService = PlatformServiceFactory.getAuthService();
await authService.setupBiometricAuth();
```

### Platform Detection

```typescript
import { PlatformServiceFactory } from '../platform/shared/platformFactory';

if (PlatformServiceFactory.isAndroid()) {
  // Android-specific code
} else if (PlatformServiceFactory.isIOS()) {
  // iOS-specific code
}

const platform = PlatformServiceFactory.getPlatform(); // 'android' | 'ios'
```

### Platform Configuration

```typescript
import { PlatformServiceFactory } from '../platform/shared/platformFactory';

const config = PlatformServiceFactory.getPlatformConfig();
console.log(config.signalR.timeout); // Platform-specific timeout
```

## Android-Specific Features

### SignalR Service
- Extended timeouts for better network reliability
- Aggressive reconnection strategy
- Android-specific WebSocket headers
- Enhanced error handling for network issues

### Notifications
- Firebase Messaging integration
- Android-specific notification channels
- Background message handling
- Device token management

### Authentication
- Android Keystore integration
- Biometric authentication support
- Device security validation
- Permission management

## iOS-Specific Features

### SignalR Service
- Standard timeouts for iOS reliability
- Conservative reconnection strategy
- iOS-specific WebSocket configuration
- Server-Sent Events support

### Notifications
- Firebase Messaging integration
- iOS-specific notification settings
- App Tracking Transparency support
- Keychain integration

### Authentication
- iOS Keychain integration
- Face ID/Touch ID support
- App Tracking Transparency
- iOS-specific permission handling

## Adding New Platform-Specific Services

1. Create the service file in the appropriate platform directory:
   - `android/serviceName.android.ts`
   - `ios/serviceName.ios.ts`

2. Implement the service class with platform-specific logic

3. Export the service in the platform's `index.ts` file

4. Add the service to `PlatformServiceFactory` if needed

5. Update this README with the new service documentation

## Benefits

- **Platform Optimization**: Each platform gets optimized implementations
- **Better Error Handling**: Platform-specific error messages and handling
- **Maintainability**: Clear separation of platform-specific code
- **Performance**: Platform-specific optimizations and configurations
- **Scalability**: Easy to add new platform-specific features

## Migration from Legacy Services

The legacy services in `src/services/` still work, but new development should use the platform-specific services. The platform factory automatically selects the appropriate implementation based on the current platform.

To migrate existing code:

1. Replace direct service imports with `PlatformServiceFactory` calls
2. Update error handling to use platform-specific error messages
3. Use platform-specific configurations where applicable
4. Test on both platforms to ensure compatibility
