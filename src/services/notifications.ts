import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { QueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { ApiClient } from './apiClient';
import { logEvent, recordError } from '../lib/crash';

let globalQueryClient: QueryClient | null = null;

export function setPushQueryClient(queryClient: QueryClient): void {
  globalQueryClient = queryClient;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  caseId?: string;
  type?: string;
  title: string;
  body: string;
}

function handlePushData(data: Record<string, unknown>) {
  const messageType = data.type as string | undefined;

  switch (messageType) {
    case 'case_updated':
    case 'case_update':
      if (globalQueryClient) {
        globalQueryClient.invalidateQueries({ queryKey: ['cases'] });
        if (data.caseId) {
          globalQueryClient.invalidateQueries({ queryKey: ['case', data.caseId] });
        }
      }
      break;
    case 'new_case':
      globalQueryClient?.invalidateQueries({ queryKey: ['cases'] });
      break;
    case 'admin_notice':
      globalQueryClient?.invalidateQueries({ queryKey: ['user'] });
      break;
    case 'urgent_notification':
      if (globalQueryClient && data.targetType === 'cases') {
        globalQueryClient.invalidateQueries({ queryKey: ['cases'] });
      } else if (globalQueryClient && data.targetType === 'user') {
        globalQueryClient.invalidateQueries({ queryKey: ['user'] });
      }
      break;
    case 'system_maintenance':
      globalQueryClient?.invalidateQueries();
      break;
    default:
      break;
  }
}

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.warn('Push notification permission request failed:', error);
      recordError(error);
      return false;
    }
  }

  static async getExpoPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Push notification permissions not granted');
        return null;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? 'bb791d4e-1e0d-4c6c-a23d-a619d34d3d7e';

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      recordError(error);
      return null;
    }
  }

  static async registerDevice(): Promise<void> {
    try {
      const token = await this.getExpoPushToken();
      if (!token) return;

      await ApiClient.post('/api/Devices/register', {
        platform: Platform.OS,
        fcmToken: token,
        appVersion: Constants.expoConfig?.version ?? '1.0.0',
      });

      logEvent('device_token_registered', {
        platform: Platform.OS,
        tokenLength: token.length,
      });
      console.log('Device registered for push notifications');
    } catch (error) {
      console.error('Error registering device:', error);
      recordError(error);
      logEvent('device_token_registration_failed');
    }
  }

  static async unregisterDevice(): Promise<void> {
    try {
      await ApiClient.delete('/api/Devices/unregister', {
        params: { platform: Platform.OS },
      });
    } catch (error) {
      console.error('Error unregistering device:', error);
      recordError(error);
    }
  }

  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    seconds: number = 0
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: seconds > 0 ? { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds } : null,
    });
  }

  static setupNotificationHandlers(): void {
    Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data as Record<string, unknown>;
      if (data && Object.keys(data).length > 0) {
        handlePushData(data);
      }
      logEvent('notification_received', { hasData: Object.keys(data ?? {}).length > 0 });
    });

    Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown>;

      if (data && Object.keys(data).length > 0) {
        handlePushData(data);
      }

      if (data?.caseId) {
        router.push(`/cases/${data.caseId}`);
      } else {
        router.push('/cases');
      }
    });
  }

  static async testNotification(): Promise<void> {
    await this.scheduleLocalNotification(
      'Test Notification',
      'This is a test notification from 241Runners app',
      { type: 'test' }
    );
  }

  static async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  static async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  static async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }
}

/** @deprecated Use NotificationService.registerDevice */
export const registerDeviceToken = () => NotificationService.registerDevice();
