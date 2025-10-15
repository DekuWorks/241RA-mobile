import { ApiClient } from './apiClient';
import {
  EnhancedRunnerProfile,
  CreateEnhancedRunnerProfileData,
  UpdateEnhancedRunnerProfileData,
  EnhancedRunnerPhoto,
  PhotoUploadResponse,
  PhotoUploadProgress,
  BulkPhotoUploadResponse,
  NotificationSettings,
  PhotoUpdateReminder,
  RunnerProfileStats,
  PhotoAnalytics,
  ApiResponse,
  ValidationError,
  PhotoUploadOptions,
  DEFAULT_PHOTO_OPTIONS,
} from '../types/enhancedRunnerProfile';

/**
 * Enhanced Runner Profile Service
 * Handles all API interactions for the enhanced runner profile system
 */
export class EnhancedRunnerProfileService {
  /**
   * Get the current user's enhanced runner profile
   */
  static async getRunnerProfile(): Promise<EnhancedRunnerProfile | null> {
    try {
      const data = await ApiClient.get('/api/v1/runner-profile');
      return data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null; // No runner profile exists
      }
      console.error('Failed to get enhanced runner profile:', error);
      throw new Error(error.message || 'Failed to load runner profile');
    }
  }

  /**
   * Check if the current user has a runner profile
   */
  static async hasRunnerProfile(): Promise<boolean> {
    try {
      const data = await ApiClient.get('/api/v1/runner-profile/exists');
      return data.exists;
    } catch (error: any) {
      console.error('Failed to check runner profile existence:', error);
      return false;
    }
  }

  /**
   * Create a new enhanced runner profile
   */
  static async createRunnerProfile(
    profileData: CreateEnhancedRunnerProfileData
  ): Promise<EnhancedRunnerProfile> {
    try {
      const data = await ApiClient.post('/api/v1/runner-profile', profileData);
      return data;
    } catch (error: any) {
      console.error('Failed to create enhanced runner profile:', error);
      throw new Error(error.message || 'Failed to create runner profile');
    }
  }

  /**
   * Update existing enhanced runner profile
   */
  static async updateRunnerProfile(
    profileData: UpdateEnhancedRunnerProfileData
  ): Promise<EnhancedRunnerProfile> {
    try {
      const data = await ApiClient.put('/api/v1/runner-profile', profileData);
      return data;
    } catch (error: any) {
      console.error('Failed to update enhanced runner profile:', error);
      throw new Error(error.message || 'Failed to update runner profile');
    }
  }

  /**
   * Delete the current user's runner profile
   */
  static async deleteRunnerProfile(): Promise<void> {
    try {
      await ApiClient.delete('/api/v1/runner-profile');
    } catch (error: any) {
      console.error('Failed to delete enhanced runner profile:', error);
      throw new Error(error.message || 'Failed to delete runner profile');
    }
  }

  /**
   * Get all photos for the current user's runner profile
   */
  static async getPhotos(): Promise<EnhancedRunnerPhoto[]> {
    try {
      const data = await ApiClient.get('/api/v1/runner-profile/photos');
      return data;
    } catch (error: any) {
      console.error('Failed to get photos:', error);
      throw new Error(error.message || 'Failed to load photos');
    }
  }

  /**
   * Upload a single photo
   */
  static async uploadPhoto(
    photoUri: string,
    onProgress?: (progress: number) => void
  ): Promise<PhotoUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: `runner_photo_${Date.now()}.jpg`,
      } as any);

      const data = await ApiClient.uploadFile(
        '/api/v1/runner-profile/photos',
        formData,
        onProgress
          ? progressEvent => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(progress);
            }
          : undefined
      );

      return { success: true, photo: data };
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload photo',
      };
    }
  }

  /**
   * Upload multiple photos with progress tracking
   */
  static async uploadMultiplePhotos(
    photoUris: string[],
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<BulkPhotoUploadResponse> {
    const response: BulkPhotoUploadResponse = {
      totalFiles: photoUris.length,
      successfulUploads: 0,
      failedUploads: 0,
      uploadedPhotos: [],
      errors: [],
    };

    for (let i = 0; i < photoUris.length; i++) {
      const uri = photoUris[i];
      const fileName = `photo_${i + 1}_${Date.now()}`;

      // Report progress start
      if (onProgress) {
        onProgress({
          fileName,
          progress: 0,
          status: 'uploading',
        });
      }

      try {
        const result = await this.uploadPhoto(uri, progress => {
          if (onProgress) {
            onProgress({
              fileName,
              progress,
              status: progress === 100 ? 'completed' : 'uploading',
            });
          }
        });

        if (result.success && result.photo) {
          response.uploadedPhotos.push(result.photo);
          response.successfulUploads++;
        } else {
          response.failedUploads++;
          response.errors.push(`Failed to upload ${fileName}: ${result.error}`);
        }

        if (onProgress) {
          onProgress({
            fileName,
            progress: 100,
            status: result.success ? 'completed' : 'error',
            error: result.error,
          });
        }
      } catch (error: any) {
        response.failedUploads++;
        response.errors.push(`Failed to upload ${fileName}: ${error.message}`);

        if (onProgress) {
          onProgress({
            fileName,
            progress: 0,
            status: 'error',
            error: error.message,
          });
        }
      }
    }

    return response;
  }

  /**
   * Delete a specific photo
   */
  static async deletePhoto(photoId: string): Promise<void> {
    try {
      await ApiClient.delete(`/api/v1/runner-profile/photos/${photoId}`);
    } catch (error: any) {
      console.error('Failed to delete photo:', error);
      throw new Error(error.message || 'Failed to delete photo');
    }
  }

  /**
   * Set a photo as the primary photo
   */
  static async setPrimaryPhoto(photoId: string): Promise<void> {
    try {
      await ApiClient.put(`/api/v1/runner-profile/photos/${photoId}/primary`);
    } catch (error: any) {
      console.error('Failed to set primary photo:', error);
      throw new Error(error.message || 'Failed to set primary photo');
    }
  }

  /**
   * Get notification settings for the current user
   */
  static async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const data = await ApiClient.get('/api/v1/runner-profile/notification-settings');
      return data;
    } catch (error: any) {
      console.error('Failed to get notification settings:', error);
      return {
        emailNotifications: true,
        pushNotifications: true,
        reminderFrequency: 'weekly',
      };
    }
  }

  /**
   * Update notification settings for the current user
   */
  static async updateNotificationSettings(
    settings: NotificationSettings
  ): Promise<NotificationSettings> {
    try {
      const data = await ApiClient.put('/api/v1/runner-profile/notification-settings', settings);
      return data;
    } catch (error: any) {
      console.error('Failed to update notification settings:', error);
      throw new Error(error.message || 'Failed to update notification settings');
    }
  }

  /**
   * Get photo update reminders for the current user
   */
  static async getPhotoReminders(): Promise<PhotoUpdateReminder[]> {
    try {
      const data = await ApiClient.get('/api/v1/runner-profile/photo-reminders');
      return data;
    } catch (error: any) {
      console.error('Failed to get photo reminders:', error);
      return [];
    }
  }

  /**
   * Dismiss a photo update reminder
   */
  static async dismissPhotoReminder(reminderId: string): Promise<void> {
    try {
      await ApiClient.put(`/api/v1/runner-profile/photo-reminders/${reminderId}/dismiss`);
    } catch (error: any) {
      console.error('Failed to dismiss photo reminder:', error);
      throw new Error(error.message || 'Failed to dismiss reminder');
    }
  }

  /**
   * Calculate age from date of birth
   */
  static calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Check if photos need updating (older than 6 months)
   */
  static needsPhotoUpdate(lastPhotoUpdate: string): boolean {
    const lastUpdate = new Date(lastPhotoUpdate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return lastUpdate < sixMonthsAgo;
  }

  /**
   * Get days since last photo update
   */
  static getDaysSinceLastPhotoUpdate(lastPhotoUpdate: string): number {
    const lastUpdate = new Date(lastPhotoUpdate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastUpdate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Validate photo before upload
   */
  static validatePhoto(
    photoUri: string,
    options: PhotoUploadOptions = DEFAULT_PHOTO_OPTIONS
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // This is a basic validation - in a real app, you'd check file size, type, etc.
    if (!photoUri) {
      errors.push('Photo URI is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get runner profile statistics
   */
  static async getProfileStats(): Promise<RunnerProfileStats> {
    try {
      const profile = await this.getRunnerProfile();
      const photos = await this.getPhotos();

      if (!profile) {
        return {
          totalPhotos: 0,
          primaryPhotoSet: false,
          daysSinceLastUpdate: 0,
          reminderCount: 0,
          profileCompleteness: 0,
          lastActivity: new Date().toISOString(),
        };
      }

      const primaryPhoto = photos.find(p => p.isPrimary);
      const daysSinceLastUpdate = profile.lastPhotoUpdate
        ? this.getDaysSinceLastPhotoUpdate(profile.lastPhotoUpdate)
        : 0;

      // Calculate profile completeness
      let completeness = 0;
      if (profile.firstName) completeness += 10;
      if (profile.lastName) completeness += 10;
      if (profile.dateOfBirth) completeness += 10;
      if (profile.height) completeness += 10;
      if (profile.weight) completeness += 10;
      if (profile.eyeColor) completeness += 10;
      if (profile.medicalConditions.length > 0) completeness += 10;
      if (profile.additionalNotes) completeness += 10;
      if (photos.length > 0) completeness += 10;
      if (primaryPhoto) completeness += 10;

      return {
        totalPhotos: photos.length,
        primaryPhotoSet: !!primaryPhoto,
        daysSinceLastUpdate,
        reminderCount: profile.reminderCount,
        profileCompleteness: completeness,
        lastActivity: profile.updatedAt,
      };
    } catch (error: any) {
      console.error('Failed to get profile stats:', error);
      throw new Error(error.message || 'Failed to get profile statistics');
    }
  }

  /**
   * Get photo analytics
   */
  static async getPhotoAnalytics(): Promise<PhotoAnalytics> {
    try {
      const photos = await this.getPhotos();

      if (photos.length === 0) {
        return {
          totalUploads: 0,
          successfulUploads: 0,
          failedUploads: 0,
          averageFileSize: 0,
          mostCommonMimeType: '',
          uploadFrequency: 'rarely',
        };
      }

      const totalFileSize = photos.reduce((sum, photo) => sum + photo.fileSize, 0);
      const mimeTypes = photos.map(p => p.mimeType);
      const mostCommonMimeType = mimeTypes.reduce((a, b, i, arr) =>
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
      );

      // Calculate upload frequency based on upload dates
      const uploadDates = photos.map(p => new Date(p.uploadedAt));
      const now = new Date();
      const recentUploads = uploadDates.filter(
        date => (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) <= 30
      ).length;

      let uploadFrequency: PhotoAnalytics['uploadFrequency'] = 'rarely';
      if (recentUploads >= 10) uploadFrequency = 'daily';
      else if (recentUploads >= 4) uploadFrequency = 'weekly';
      else if (recentUploads >= 1) uploadFrequency = 'monthly';

      return {
        totalUploads: photos.length,
        successfulUploads: photos.length,
        failedUploads: 0,
        averageFileSize: totalFileSize / photos.length,
        mostCommonMimeType,
        uploadFrequency,
      };
    } catch (error: any) {
      console.error('Failed to get photo analytics:', error);
      throw new Error(error.message || 'Failed to get photo analytics');
    }
  }
}
