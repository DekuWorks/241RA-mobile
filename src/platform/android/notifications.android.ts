/**
 * Android-specific notification handling
 * Enhanced push notification support for Android devices
 */

import { Platform } from 'react-native';
import { logEvent, recordError } from '../../lib/crash';

// Conditional Firebase import for Android builds
let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.warn('Firebase Messaging not available in Android build');
}

export class AndroidNotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (!messaging) {
      console.warn('Android: Firebase Messaging not available');
      return false;
    }

    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('Android notification permission status:', authStatus);
      logEvent('android_notification_permission_requested', {
        status: authStatus,
        enabled: enabled,
      });

      return enabled;
    } catch (error) {
      console.error('Android: Failed to request notification permissions:', error);
      recordError(error);
      return false;
    }
  }

  static async getToken(): Promise<string | null> {
    if (!messaging) {
      console.warn('Android: Firebase Messaging not available');
      return null;
    }

    try {
      const token = await messaging().getToken();
      console.log('Android FCM token:', token ? `${token.substring(0, 20)}...` : 'null');
      logEvent('android_fcm_token_retrieved', {
        tokenLength: token?.length || 0,
      });
      return token;
    } catch (error) {
      console.error('Android: Failed to get FCM token:', error);
      recordError(error);
      return null;
    }
  }

  static async setupForegroundHandler(): Promise<void> {
    if (!messaging) {
      console.warn('Android: Firebase Messaging not available');
      return;
    }

    try {
      messaging().onMessage(async (remoteMessage: any) => {
        console.log('Android: Foreground message received:', remoteMessage);
        logEvent('android_foreground_message_received', {
          messageId: remoteMessage.messageId,
          from: remoteMessage.from,
        });

        // Android-specific foreground notification handling
        // You can add custom notification display logic here
      });
    } catch (error) {
      console.error('Android: Failed to setup foreground handler:', error);
      recordError(error);
    }
  }

  static async setupBackgroundHandler(): Promise<void> {
    if (!messaging) {
      console.warn('Android: Firebase Messaging not available');
      return;
    }

    try {
      messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
        console.log('Android: Background message received:', remoteMessage);
        logEvent('android_background_message_received', {
          messageId: remoteMessage.messageId,
          from: remoteMessage.from,
        });

        // Android-specific background message handling
        // Process the message data here
      });
    } catch (error) {
      console.error('Android: Failed to setup background handler:', error);
      recordError(error);
    }
  }

  static async testNotification(): Promise<void> {
    if (!messaging) {
      console.warn('Android: Firebase Messaging not available');
      return;
    }

    try {
      // Android-specific test notification
      console.log('Android: Sending test notification');
      logEvent('android_test_notification_sent');

      // You can add Android-specific test notification logic here
    } catch (error) {
      console.error('Android: Failed to send test notification:', error);
      recordError(error);
    }
  }

  static async unregisterDevice(): Promise<void> {
    if (!messaging) {
      console.warn('Android: Firebase Messaging not available');
      return;
    }

    try {
      await messaging().deleteToken();
      console.log('Android: Device token deleted');
      logEvent('android_device_unregistered');
    } catch (error) {
      console.error('Android: Failed to unregister device:', error);
      recordError(error);
    }
  }

  static async checkInitialNotification(): Promise<any> {
    if (!messaging) {
      console.warn('Android: Firebase Messaging not available');
      return null;
    }

    try {
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log('Android: Initial notification found:', initialNotification);
        logEvent('android_initial_notification_found', {
          messageId: initialNotification.messageId,
        });
      }
      return initialNotification;
    } catch (error) {
      console.error('Android: Failed to check initial notification:', error);
      recordError(error);
      return null;
    }
  }
}
