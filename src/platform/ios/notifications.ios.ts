/**
 * iOS-specific notification handling
 * Enhanced push notification support for iOS devices
 */

// Platform import removed as it's not used
import { logEvent, recordError } from '../../lib/crash';

// Conditional Firebase import for iOS builds
let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch {
  console.warn('Firebase Messaging not available in iOS build');
}

export class IOSNotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (!messaging) {
      console.warn('iOS: Firebase Messaging not available');
      return false;
    }

    try {
      const authStatus = await messaging().requestPermission({
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      });

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('iOS notification permission status:', authStatus);
      logEvent('ios_notification_permission_requested', {
        status: authStatus,
        enabled: enabled,
      });

      return enabled;
    } catch (error) {
      console.error('iOS: Failed to request notification permissions:', error);
      recordError(error);
      return false;
    }
  }

  static async getToken(): Promise<string | null> {
    if (!messaging) {
      console.warn('iOS: Firebase Messaging not available');
      return null;
    }

    try {
      const token = await messaging().getToken();
      console.log('iOS FCM token:', token ? `${token.substring(0, 20)}...` : 'null');
      logEvent('ios_fcm_token_retrieved', {
        tokenLength: token?.length || 0,
      });
      return token;
    } catch (error) {
      console.error('iOS: Failed to get FCM token:', error);
      recordError(error);
      return null;
    }
  }

  static async setupForegroundHandler(): Promise<void> {
    if (!messaging) {
      console.warn('iOS: Firebase Messaging not available');
      return;
    }

    try {
      messaging().onMessage(async (remoteMessage: any) => {
        console.log('iOS: Foreground message received:', remoteMessage);
        logEvent('ios_foreground_message_received', {
          messageId: remoteMessage.messageId,
          from: remoteMessage.from,
        });

        // iOS-specific foreground notification handling
        // iOS handles notifications differently in foreground
      });
    } catch (error) {
      console.error('iOS: Failed to setup foreground handler:', error);
      recordError(error);
    }
  }

  static async setupBackgroundHandler(): Promise<void> {
    if (!messaging) {
      console.warn('iOS: Firebase Messaging not available');
      return;
    }

    try {
      messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
        console.log('iOS: Background message received:', remoteMessage);
        logEvent('ios_background_message_received', {
          messageId: remoteMessage.messageId,
          from: remoteMessage.from,
        });

        // iOS-specific background message handling
        // iOS has different background processing capabilities
      });
    } catch (error) {
      console.error('iOS: Failed to setup background handler:', error);
      recordError(error);
    }
  }

  static async testNotification(): Promise<void> {
    if (!messaging) {
      console.warn('iOS: Firebase Messaging not available');
      return;
    }

    try {
      // iOS-specific test notification
      console.log('iOS: Sending test notification');
      logEvent('ios_test_notification_sent');

      // iOS might require different test notification handling
    } catch (error) {
      console.error('iOS: Failed to send test notification:', error);
      recordError(error);
    }
  }

  static async unregisterDevice(): Promise<void> {
    if (!messaging) {
      console.warn('iOS: Firebase Messaging not available');
      return;
    }

    try {
      await messaging().deleteToken();
      console.log('iOS: Device token deleted');
      logEvent('ios_device_unregistered');
    } catch (error) {
      console.error('iOS: Failed to unregister device:', error);
      recordError(error);
    }
  }

  static async checkInitialNotification(): Promise<any> {
    if (!messaging) {
      console.warn('iOS: Firebase Messaging not available');
      return null;
    }

    try {
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log('iOS: Initial notification found:', initialNotification);
        logEvent('ios_initial_notification_found', {
          messageId: initialNotification.messageId,
        });
      }
      return initialNotification;
    } catch (error) {
      console.error('iOS: Failed to check initial notification:', error);
      recordError(error);
      return null;
    }
  }

  static async requestProvisionalAuthorization(): Promise<boolean> {
    if (!messaging) {
      console.warn('iOS: Firebase Messaging not available');
      return false;
    }

    try {
      const authStatus = await messaging().requestPermission({
        provisional: true,
      });

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('iOS provisional notification permission:', authStatus);
      logEvent('ios_provisional_notification_permission', {
        status: authStatus,
        enabled: enabled,
      });

      return enabled;
    } catch (error) {
      console.error('iOS: Failed to request provisional notification permissions:', error);
      recordError(error);
      return false;
    }
  }
}
