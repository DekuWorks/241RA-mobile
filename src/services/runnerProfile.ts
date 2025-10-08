import { ApiClient } from './apiClient';
import {
  RunnerProfile,
  CreateRunnerProfileData,
  UpdateRunnerProfileData,
  RunnerPhoto,
  PhotoUploadResponse,
  PhotoUploadProgress,
  NotificationSettings,
  PhotoUpdateReminder,
} from '../types/runnerProfile';

export class RunnerProfileService {
  /**
   * Get runner profile for current user
   */
  static async getRunnerProfile(): Promise<RunnerProfile | null> {
    try {
      const data = await ApiClient.get('/api/v1/runner-profile');
      return data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null; // No runner profile exists
      }
      console.error('Failed to get runner profile:', error);
      throw new Error(error.message || 'Failed to load runner profile');
    }
  }

  /**
   * Check if user has a runner profile
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
   * Create a new runner profile
   */
  static async createRunnerProfile(profileData: CreateRunnerProfileData): Promise<RunnerProfile> {
    try {
      const data = await ApiClient.post('/api/v1/runner-profile', profileData);
      return data;
    } catch (error: any) {
      console.error('Failed to create runner profile:', error);
      throw new Error(error.message || 'Failed to create runner profile');
    }
  }

  /**
   * Update existing runner profile
   */
  static async updateRunnerProfile(profileData: UpdateRunnerProfileData): Promise<RunnerProfile> {
    try {
      const data = await ApiClient.put('/api/v1/runner-profile', profileData);
      return data;
    } catch (error: any) {
      console.error('Failed to update runner profile:', error);
      throw new Error(error.message || 'Failed to update runner profile');
    }
  }

  /**
   * Delete runner profile
   */
  static async deleteRunnerProfile(): Promise<void> {
    try {
      await ApiClient.delete('/api/v1/runner-profile');
    } catch (error: any) {
      console.error('Failed to delete runner profile:', error);
      throw new Error(error.message || 'Failed to delete runner profile');
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
        onProgress ? (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        } : undefined
      );

      return { success: true, photo: data };
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to upload photo' 
      };
    }
  }

  /**
   * Upload multiple photos
   */
  static async uploadMultiplePhotos(
    photoUris: string[],
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<PhotoUploadResponse[]> {
    const results: PhotoUploadResponse[] = [];
    
    for (let i = 0; i < photoUris.length; i++) {
      const uri = photoUris[i];
      const fileName = `photo_${i + 1}_${Date.now()}`;
      
      // Report progress start
      if (onProgress) {
        onProgress({
          fileName,
          progress: 0,
          status: 'uploading'
        });
      }

      try {
        const result = await this.uploadPhoto(uri, (progress) => {
          if (onProgress) {
            onProgress({
              fileName,
              progress,
              status: progress === 100 ? 'completed' : 'uploading'
            });
          }
        });

        results.push(result);
        
        if (onProgress) {
          onProgress({
            fileName,
            progress: 100,
            status: result.success ? 'completed' : 'error',
            error: result.error
          });
        }
      } catch (error: any) {
        const errorResult = {
          success: false,
          error: error.message || 'Upload failed'
        };
        results.push(errorResult);
        
        if (onProgress) {
          onProgress({
            fileName,
            progress: 0,
            status: 'error',
            error: error.message
          });
        }
      }
    }

    return results;
  }

  /**
   * Get all photos for runner profile
   */
  static async getPhotos(): Promise<RunnerPhoto[]> {
    try {
      const data = await ApiClient.get('/api/v1/runner-profile/photos');
      return data;
    } catch (error: any) {
      console.error('Failed to get photos:', error);
      throw new Error(error.message || 'Failed to load photos');
    }
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
   * Set primary photo
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
   * Get notification settings
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
        reminderFrequency: 'weekly'
      };
    }
  }

  /**
   * Update notification settings
   */
  static async updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    try {
      const data = await ApiClient.put('/api/v1/runner-profile/notification-settings', settings);
      return data;
    } catch (error: any) {
      console.error('Failed to update notification settings:', error);
      throw new Error(error.message || 'Failed to update notification settings');
    }
  }

  /**
   * Get photo update reminders
   */
  static async getPhotoUpdateReminders(): Promise<PhotoUpdateReminder[]> {
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
}
