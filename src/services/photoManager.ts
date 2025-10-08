import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert } from 'react-native';
import {
  EnhancedRunnerPhoto,
  PhotoUploadOptions,
  PhotoUploadProgress,
  PhotoValidationResult,
  ProcessedPhoto,
  PhotoProcessingOptions,
  DEFAULT_PHOTO_OPTIONS,
  PHOTO_UPDATE_THRESHOLD_DAYS,
} from '../types/enhancedRunnerProfile';

/**
 * Photo Manager Service
 * Handles all photo-related operations including selection, processing, and validation
 */
export class PhotoManager {
  private static options: PhotoUploadOptions = DEFAULT_PHOTO_OPTIONS;

  /**
   * Request camera and media library permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library access is required to upload photos for your runner profile.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Pick images from gallery
   */
  static async pickImages(
    maxSelection: number = 10,
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<string[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: maxSelection,
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets) {
        return [];
      }

      const imageUris: string[] = [];
      
      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        const fileName = `photo_${Date.now()}_${i}.jpg`;
        
        if (onProgress) {
          onProgress({
            fileName,
            progress: 0,
            status: 'uploading'
          });
        }

        // Validate the image
        const validation = await this.validateImage(asset.uri);
        if (!validation.isValid) {
          console.warn(`Image validation failed for ${fileName}:`, validation.errors);
          continue;
        }

        // Process the image if needed
        const processedImage = await this.processImage(asset.uri, {
          resize: true,
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8,
          format: 'jpeg'
        });

        imageUris.push(processedImage.uri);

        if (onProgress) {
          onProgress({
            fileName,
            progress: 100,
            status: 'completed'
          });
        }
      }

      return imageUris;
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
      return [];
    }
  }

  /**
   * Take a photo with camera
   */
  static async takePhoto(
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const fileName = `camera_photo_${Date.now()}.jpg`;

      if (onProgress) {
        onProgress({
          fileName,
          progress: 0,
          status: 'uploading'
        });
      }

      // Validate the image
      const validation = await this.validateImage(asset.uri);
      if (!validation.isValid) {
        Alert.alert('Invalid Photo', validation.errors.join('\n'));
        return null;
      }

      // Process the image
      const processedImage = await this.processImage(asset.uri, {
        resize: true,
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
        format: 'jpeg'
      });

      if (onProgress) {
        onProgress({
          fileName,
          progress: 100,
          status: 'completed'
        });
      }

      return processedImage.uri;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    }
  }

  /**
   * Validate an image file
   */
  static async validateImage(imageUri: string): Promise<PhotoValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        errors.push('File does not exist');
        return { isValid: false, errors, warnings };
      }

      // Check file size
      if (fileInfo.size && fileInfo.size > this.options.maxFileSize) {
        errors.push(`File size exceeds limit of ${Math.round(this.options.maxFileSize / 1024 / 1024)}MB`);
      }

      // Check file type
      const mimeType = await this.getMimeType(imageUri);
      if (mimeType && !this.options.allowedTypes.includes(mimeType)) {
        errors.push(`File type ${mimeType} is not allowed`);
      }

      // Get image dimensions
      const dimensions = await this.getImageDimensions(imageUri);
      if (dimensions) {
        if (dimensions.width < 100 || dimensions.height < 100) {
          warnings.push('Image is very small and may not be suitable for identification');
        }
        if (dimensions.width > 4000 || dimensions.height > 4000) {
          warnings.push('Image is very large and will be resized');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Error validating image:', error);
      return {
        isValid: false,
        errors: ['Failed to validate image'],
        warnings
      };
    }
  }

  /**
   * Process an image (resize, compress, etc.)
   */
  static async processImage(
    imageUri: string,
    options: PhotoProcessingOptions
  ): Promise<ProcessedPhoto> {
    try {
      const dimensions = await this.getImageDimensions(imageUri);
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      let processedUri = imageUri;
      
      if (options.resize && dimensions) {
        const { width, height } = dimensions;
        const maxWidth = options.maxWidth;
        const maxHeight = options.maxHeight;
        
        if (width > maxWidth || height > maxHeight) {
          // Calculate new dimensions maintaining aspect ratio
          const aspectRatio = width / height;
          let newWidth = maxWidth;
          let newHeight = maxHeight;
          
          if (aspectRatio > 1) {
            newHeight = maxWidth / aspectRatio;
          } else {
            newWidth = maxHeight * aspectRatio;
          }
          
          // For now, we'll use the original image
          // In a real implementation, you'd use a library like react-native-image-resizer
          console.log(`Would resize image to ${newWidth}x${newHeight}`);
        }
      }

      return {
        uri: processedUri,
        fileName: `processed_${Date.now()}.jpg`,
        fileSize: fileInfo.size || 0,
        mimeType: 'image/jpeg',
        dimensions: dimensions || { width: 0, height: 0 }
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Get image dimensions
   */
  static async getImageDimensions(imageUri: string): Promise<{ width: number; height: number } | null> {
    try {
      // This is a simplified implementation
      // In a real app, you'd use a library like react-native-image-size
      return { width: 1920, height: 1080 }; // Placeholder
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return null;
    }
  }

  /**
   * Get MIME type of a file
   */
  static async getMimeType(fileUri: string): Promise<string | null> {
    try {
      const extension = fileUri.split('.').pop()?.toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
      };
      
      return extension ? mimeTypes[extension] || null : null;
    } catch (error) {
      console.error('Error getting MIME type:', error);
      return null;
    }
  }

  /**
   * Check if a photo needs updating based on age
   */
  static needsPhotoUpdate(uploadedAt: string): boolean {
    const uploadDate = new Date(uploadedAt);
    const now = new Date();
    const daysSinceUpload = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceUpload >= PHOTO_UPDATE_THRESHOLD_DAYS;
  }

  /**
   * Get days since photo was uploaded
   */
  static getDaysSinceUpload(uploadedAt: string): number {
    const uploadDate = new Date(uploadedAt);
    const now = new Date();
    return Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get photo metadata
   */
  static async getPhotoMetadata(photo: EnhancedRunnerPhoto): Promise<{
    daysSinceUpload: number;
    needsUpdate: boolean;
    formattedSize: string;
    formattedUploadDate: string;
  }> {
    const daysSinceUpload = this.getDaysSinceUpload(photo.uploadedAt);
    const needsUpdate = this.needsPhotoUpdate(photo.uploadedAt);
    const formattedSize = this.formatFileSize(photo.fileSize);
    const formattedUploadDate = new Date(photo.uploadedAt).toLocaleDateString();

    return {
      daysSinceUpload,
      needsUpdate,
      formattedSize,
      formattedUploadDate
    };
  }

  /**
   * Show photo selection options
   */
  static async showPhotoOptions(): Promise<'camera' | 'gallery' | 'cancel'> {
    return new Promise((resolve) => {
      Alert.alert(
        'Add Photo',
        'Choose how you want to add a photo to your runner profile',
        [
          { text: 'Camera', onPress: () => resolve('camera') },
          { text: 'Gallery', onPress: () => resolve('gallery') },
          { text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel') }
        ]
      );
    });
  }

  /**
   * Show photo deletion confirmation
   */
  static async confirmPhotoDeletion(photoName: string): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Delete Photo',
        `Are you sure you want to delete "${photoName}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
        ]
      );
    });
  }

  /**
   * Show primary photo confirmation
   */
  static async confirmSetPrimaryPhoto(photoName: string): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Set Primary Photo',
        `Set "${photoName}" as your primary profile photo?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Set Primary', onPress: () => resolve(true) }
        ]
      );
    });
  }

  /**
   * Update photo upload options
   */
  static updateOptions(newOptions: Partial<PhotoUploadOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current photo upload options
   */
  static getOptions(): PhotoUploadOptions {
    return { ...this.options };
  }
}
