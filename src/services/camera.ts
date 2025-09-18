import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface CameraResult {
  uri: string;
  width: number;
  height: number;
  type: 'image';
}

export class CameraService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library access are required to report sightings with photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() },
        ]
      );
      return false;
    }

    return true;
  }

  static async takePhoto(): Promise<CameraResult | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        type: 'image',
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    }
  }

  static async pickImage(): Promise<CameraResult | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        type: 'image',
      };
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      return null;
    }
  }

  static async showImageOptions(): Promise<CameraResult | null> {
    return new Promise(resolve => {
      Alert.alert('Select Image', 'Choose how you want to add an image', [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await this.takePhoto();
            resolve(result);
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const result = await this.pickImage();
            resolve(result);
          },
        },
      ]);
    });
  }
}
