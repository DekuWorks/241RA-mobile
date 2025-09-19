// Conditional Firebase import for builds
let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.warn('Firebase Messaging not available in this build');
}

import { Platform } from 'react-native';
import { http } from '../../lib/http';
import { logEvent, recordError } from '../../lib/crash';
import { QueryClient } from '@tanstack/react-query';

interface RegisterDeviceDto {
  platform: string;
  fcmToken: string;
  appVersion: string;
}

// Global query client reference for cache invalidation
let globalQueryClient: QueryClient | null = null;

export function setQueryClient(queryClient: QueryClient): void {
  globalQueryClient = queryClient;
}

export async function registerDeviceToken(): Promise<void> {
  if (!messaging) {
    console.warn('Firebase Messaging not available');
    return;
  }
  
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
      appVersion: '1.0.0', // You can get this from app config
    };

    await http.post('/api/devices', registerData);

    logEvent('device_token_registered', {
      platform: Platform.OS,
      tokenLength: token.length,
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
  if (!messaging) {
    console.warn('Firebase Messaging not available');
    return;
  }
  
  messaging().onMessage(async remoteMessage => {
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
      hasNotification: !!remoteMessage.notification,
    });

    // Show in-app notification if needed
    if (remoteMessage.notification) {
      console.log(
        'Notification:',
        remoteMessage.notification.title,
        remoteMessage.notification.body
      );
      // You can show a toast or in-app notification here
    }
  });
}

// Handle background/quit state messages
export function setupBackgroundMessageHandler() {
  if (!messaging) {
    console.warn('Firebase Messaging not available');
    return;
  }
  
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message received:', remoteMessage);

    // Handle data-only messages in background
    if (remoteMessage.data) {
      handleDataMessage(remoteMessage.data);
    }

    // Log the background message event
    logEvent('background_message_received', {
      messageId: remoteMessage.messageId,
      from: remoteMessage.from,
      hasData: !!remoteMessage.data,
    });
  });
}

// Handle different types of data messages
function handleDataMessage(data: { [key: string]: string | object }) {
  const messageType = data.type as string;

  switch (messageType) {
    case 'case_updated':
      console.log('Case updated:', data.caseId);
      // Invalidate case queries
      if (globalQueryClient) {
        globalQueryClient.invalidateQueries({ queryKey: ['cases'] });
        globalQueryClient.invalidateQueries({ queryKey: ['case', data.caseId] });
      }
      break;
    case 'new_case':
      console.log('New case:', data.caseId);
      // Invalidate cases list
      if (globalQueryClient) {
        globalQueryClient.invalidateQueries({ queryKey: ['cases'] });
      }
      break;
    case 'admin_notice':
      console.log('Admin notice:', data);
      // Invalidate user data
      if (globalQueryClient) {
        globalQueryClient.invalidateQueries({ queryKey: ['user'] });
      }
      break;
    case 'urgent_notification':
      console.log('Urgent notification:', data);
      // Invalidate relevant queries based on notification type
      if (globalQueryClient && data.targetType) {
        switch (data.targetType) {
          case 'cases':
            globalQueryClient.invalidateQueries({ queryKey: ['cases'] });
            break;
          case 'user':
            globalQueryClient.invalidateQueries({ queryKey: ['user'] });
            break;
        }
      }
      break;
    case 'system_maintenance':
      console.log('System maintenance:', data);
      // Invalidate all queries for fresh data after maintenance
      if (globalQueryClient) {
        globalQueryClient.invalidateQueries();
      }
      break;
    default:
      console.log('Unknown message type:', messageType);
  }
}
