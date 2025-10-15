import * as TrackingTransparency from 'expo-tracking-transparency';
import { Alert, Platform } from 'react-native';

export class TrackingTransparencyService {
  /**
   * Request tracking permission from the user
   * Required for iOS 14.5+ when collecting data for tracking purposes
   */
  static async requestTrackingPermission(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      // Android doesn't require ATT
      return true;
    }

    try {
      const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();

      if (status === 'granted') {
        console.log('Tracking permission granted');
        return true;
      } else {
        console.log('Tracking permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting tracking permission:', error);
      return false;
    }
  }

  /**
   * Get current tracking permission status
   */
  static async getTrackingStatus(): Promise<string> {
    if (Platform.OS !== 'ios') {
      return 'granted'; // Android doesn't require ATT
    }

    try {
      const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error getting tracking status:', error);
      return 'undetermined';
    }
  }

  /**
   * Show tracking permission dialog with explanation
   */
  static async requestWithExplanation(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return true;
    }

    // Show explanation dialog first
    return new Promise(resolve => {
      Alert.alert(
        'Help Us Improve 241Runners',
        'We use anonymous usage data to improve the app and help find missing persons more effectively. This data is never shared with third parties for advertising.\n\nYou can change this setting anytime in your device settings.',
        [
          {
            text: 'Ask App Not to Track',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Allow',
            onPress: async () => {
              const granted = await this.requestTrackingPermission();
              resolve(granted);
            },
          },
        ]
      );
    });
  }
}
