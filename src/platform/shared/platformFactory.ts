/**
 * Platform-specific service factory
 * Automatically selects the appropriate service based on the platform
 */

import { Platform } from 'react-native';

// SignalR Services
import { androidSignalRService } from '../android/signalR.android';
import { iosSignalRService } from '../ios/signalR.ios';

// Notification Services
import { AndroidNotificationService } from '../android/notifications.android';
import { IOSNotificationService } from '../ios/notifications.ios';

// Auth Services
import { AndroidAuthService } from '../android/auth.android';
import { IOSAuthService } from '../ios/auth.ios';

export class PlatformServiceFactory {
  // SignalR Service Factory
  static getSignalRService() {
    if (Platform.OS === 'android') {
      return androidSignalRService;
    } else if (Platform.OS === 'ios') {
      return iosSignalRService;
    } else {
      throw new Error(`Unsupported platform: ${Platform.OS}`);
    }
  }

  // Notification Service Factory
  static getNotificationService() {
    if (Platform.OS === 'android') {
      return AndroidNotificationService;
    } else if (Platform.OS === 'ios') {
      return IOSNotificationService;
    } else {
      throw new Error(`Unsupported platform: ${Platform.OS}`);
    }
  }

  // Auth Service Factory
  static getAuthService() {
    if (Platform.OS === 'android') {
      return AndroidAuthService;
    } else if (Platform.OS === 'ios') {
      return IOSAuthService;
    } else {
      throw new Error(`Unsupported platform: ${Platform.OS}`);
    }
  }

  // Platform Detection
  static isAndroid(): boolean {
    return Platform.OS === 'android';
  }

  static isIOS(): boolean {
    return Platform.OS === 'ios';
  }

  static getPlatform(): string {
    return Platform.OS;
  }

  // Platform-specific configurations
  static getPlatformConfig() {
    const config = {
      android: {
        signalR: {
          timeout: 60000,
          keepAliveInterval: 15000,
          maxReconnectAttempts: 5,
          retryDelays: [0, 1000, 3000, 8000, 15000, 30000],
        },
        notifications: {
          priority: 'high',
          channelId: '241runners_default',
          sound: 'default',
        },
        auth: {
          biometricTimeout: 30000,
          secureStorageType: 'keystore',
        }
      },
      ios: {
        signalR: {
          timeout: 30000,
          keepAliveInterval: 30000,
          maxReconnectAttempts: 3,
          retryDelays: [0, 2000, 5000, 10000, 30000],
        },
        notifications: {
          priority: 'normal',
          sound: 'default',
          badge: true,
        },
        auth: {
          biometricTimeout: 30000,
          secureStorageType: 'keychain',
        }
      }
    };

    return Platform.OS === 'android' ? config.android : config.ios;
  }

  // Initialize platform-specific services
  static async initializePlatformServices(): Promise<void> {
    try {
      console.log(`🚀 Initializing platform-specific services for ${Platform.OS}`);

      const signalRService = this.getSignalRService();
      const notificationService = this.getNotificationService();
      const authService = this.getAuthService();

      // Initialize platform-specific authentication
      if (this.isAndroid()) {
        await authService.setupSecureStorage();
        await authService.validateAndroidPermissions();
      } else if (this.isIOS()) {
        await authService.setupKeychainStorage();
        await authService.validateIOSPermissions();
      }

      console.log(`✅ Platform-specific services initialized for ${Platform.OS}`);
    } catch (error) {
      console.error(`❌ Failed to initialize platform-specific services for ${Platform.OS}:`, error);
      throw error;
    }
  }

  // Get platform-specific error messages
  static getPlatformErrorMessage(error: any): string {
    const baseMessage = error.message || 'An unknown error occurred';
    
    if (this.isAndroid()) {
      if (error.code === 'NETWORK_ERROR') {
        return 'Android: Network connection failed. Please check your internet connection.';
      } else if (error.code === 'WEBSOCKET_ERROR') {
        return 'Android: Real-time connection failed. The app will work without live updates.';
      }
    } else if (this.isIOS()) {
      if (error.code === 'NETWORK_ERROR') {
        return 'iOS: Network connection failed. Please check your internet connection.';
      } else if (error.code === 'WEBSOCKET_ERROR') {
        return 'iOS: Real-time connection failed. The app will work without live updates.';
      }
    }

    return baseMessage;
  }

  // Platform-specific logging
  static logPlatformEvent(eventName: string, data?: any): void {
    const platformData = {
      platform: Platform.OS,
      version: Platform.Version,
      ...data
    };

    console.log(`[${Platform.OS.toUpperCase()}] ${eventName}:`, platformData);
  }
}
