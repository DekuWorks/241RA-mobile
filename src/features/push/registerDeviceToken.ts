import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import { http } from "../../lib/http";
import { logEvent, recordError } from "../../lib/crash";

export async function registerDeviceToken() {
  try {
    // Request permission for push notifications
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('Push notification permission not granted');
      logEvent('push_permission_denied');
      return;
    }

    // Get FCM token
    const token = await messaging().getToken();
    if (!token) {
      console.warn('Failed to get FCM token');
      logEvent('fcm_token_failed');
      return;
    }

    console.log('FCM Token:', token);

    // Register token with API
    await http.post("/api/devices", { 
      platform: Platform.OS, 
      fcmToken: token 
    });

    logEvent('device_token_registered', {
      platform: Platform.OS,
      tokenLength: token.length
    });

    console.log('Device token registered successfully');
  } catch (error) {
    console.error('Failed to register device token:', error);
    recordError(error);
    logEvent('device_token_registration_failed');
  }
}

// Attach foreground message handler (optional)
export function attachForegroundMessaging() {
  messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground message received:', remoteMessage);
    
    // Log the message event (without sensitive data)
    logEvent('foreground_message_received', {
      messageId: remoteMessage.messageId,
      from: remoteMessage.from,
      hasData: !!remoteMessage.data,
      hasNotification: !!remoteMessage.notification
    });

    // You can show in-app notifications here
    // For now, just log the message
    if (remoteMessage.notification) {
      console.log('Notification:', remoteMessage.notification.title, remoteMessage.notification.body);
    }
  });
}

// Handle background/quit state messages
export function setupBackgroundMessageHandler() {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage);
    
    // Log the background message event
    logEvent('background_message_received', {
      messageId: remoteMessage.messageId,
      from: remoteMessage.from,
      hasData: !!remoteMessage.data
    });
  });
}
