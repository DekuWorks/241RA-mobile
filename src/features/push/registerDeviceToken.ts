// import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import { http } from "../../lib/http";
import { logEvent, recordError } from "../../lib/crash";

// Stub functions for build testing
const messaging = () => ({
  requestPermission: async () => ({ authorizationStatus: 1 }),
  getToken: async () => 'mock-fcm-token-123',
  onMessage: (callback: (message: any) => void) => console.log('Message handler registered'),
  setBackgroundMessageHandler: (callback: (message: any) => void) => console.log('Background handler registered'),
  AuthorizationStatus: {
    AUTHORIZED: 1,
    DENIED: 0,
    PROVISIONAL: 2
  }
});

interface RegisterDeviceDto {
  platform: string;
  fcmToken: string;
  appVersion: string;
}

export async function registerDeviceToken(): Promise<void> {
  try {
    // Request permission for push notifications
    const authStatus = await messaging().requestPermission();
    
    if (authStatus === messaging.AuthorizationStatus.DENIED) {
      console.warn('Push notification permission denied');
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

    // Register with backend using new endpoint
    const registerData: RegisterDeviceDto = {
      platform: Platform.OS,
      fcmToken: token,
      appVersion: '1.0.0' // You can get this from app config
    };

    await http.post("/devices/register", registerData);

    logEvent('device_token_registered', {
      platform: Platform.OS,
      tokenLength: token.length
    });

    console.log('Device registered successfully:', Platform.OS);
  } catch (error) {
    console.error('Failed to register device token:', error);
    recordError(error);
    logEvent('device_token_registration_failed');
  }
}

// Attach foreground message handler
export function attachForegroundMessaging() {
  messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground message received:', remoteMessage);
    
    // Handle data-only messages
    if (remoteMessage.data) {
      handleDataMessage(remoteMessage.data);
    }

    // Log the message event (without sensitive data)
    logEvent('foreground_message_received', {
      messageId: remoteMessage.messageId,
      from: remoteMessage.from,
      hasData: !!remoteMessage.data,
      hasNotification: !!remoteMessage.notification
    });

    // Show in-app notification if needed
    if (remoteMessage.notification) {
      console.log('Notification:', remoteMessage.notification.title, remoteMessage.notification.body);
      // You can show a toast or in-app notification here
    }
  });
}

// Handle background/quit state messages
export function setupBackgroundMessageHandler() {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage);
    
    // Handle data-only messages in background
    if (remoteMessage.data) {
      handleDataMessage(remoteMessage.data);
    }
    
    // Log the background message event
    logEvent('background_message_received', {
      messageId: remoteMessage.messageId,
      from: remoteMessage.from,
      hasData: !!remoteMessage.data
    });
  });
}

// Handle different types of data messages
function handleDataMessage(data: { [key: string]: string }) {
  const messageType = data.type;
  
  switch (messageType) {
    case 'case_updated':
      // Invalidate case queries - you can use React Query or similar
      console.log('Case updated:', data.caseId);
      // Example: queryClient.invalidateQueries(['case', data.caseId]);
      break;
    case 'urgent_notification':
      // Handle urgent admin notifications
      console.log('Urgent notification:', data);
      break;
    case 'system_maintenance':
      // Handle system maintenance notifications
      console.log('System maintenance:', data);
      break;
    default:
      console.log('Unknown message type:', messageType);
  }
}
