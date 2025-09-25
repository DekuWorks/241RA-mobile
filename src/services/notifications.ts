import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { ApiClient } from './apiClient';

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
  type: 'new_case' | 'case_update' | 'sighting_reported' | 'general';
  title: string;
  body: string;
}

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
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
  }

  static async getExpoPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Push notification permissions not granted');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'bb791d4e-1e0d-4c6c-a23d-a619d34d3d7e', // EAS Project ID
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async registerDevice(): Promise<void> {
    try {
      const token = await this.getExpoPushToken();
      if (!token) return;

      // Send token to your API
      await ApiClient.post('/api/Devices/register', {
        platform: Platform.OS,
        fcmToken: token,
        appVersion: '1.0.0',
      });

      console.log('Device registered for push notifications');
    } catch (error) {
      console.error('Error registering device:', error);
    }
  }

  static async unregisterDevice(): Promise<void> {
    try {
      // TODO: Implement device unregistration endpoint in backend
      // await ApiClient.delete('/api/Devices/unregister');
      console.log('Device unregistration not yet implemented');
    } catch (error) {
      console.error('Error unregistering device:', error);
    }
  }

  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
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
    // Handle notification received while app is running
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can show an in-app notification here
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as unknown as NotificationData;

      if (data.caseId) {
        // Navigate to case detail
        router.push(`/cases/${data.caseId}`);
      } else {
        // Navigate to cases list or other appropriate screen
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
