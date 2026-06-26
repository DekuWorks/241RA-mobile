import { ApiClient } from './apiClient';
import { SecureTokenService } from './secureTokens';
import { RunnerValidationUtils } from '../utils/runnerValidation';
import { ValidationUtils } from '../utils/validation';
import { logOptionalProfileFailure } from '../types/api';
import { resolveImageDisplayUrl } from '../utils/imageUrl';
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
  PhotoUploadOptions,
  DEFAULT_PHOTO_OPTIONS,
} from '../types/enhancedRunnerProfile';

type ApiRunner = {
  id: number;
  userId?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  height?: string;
  weight?: string;
  eyeColor?: string;
  medicalConditions?: string;
  additionalNotes?: string;
  profileImageUrl?: string;
  additionalImageUrls?: string;
  lastPhotoUpdate?: string;
  photoUpdateReminderCount?: number;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
};

let cachedRunnerId: number | null = null;

function parseMedicalConditions(value?: string): string[] {
  if (!value?.trim()) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

function mapRunnerToProfile(runner: ApiRunner): EnhancedRunnerProfile {
  const photos: EnhancedRunnerPhoto[] = [];
  if (runner.additionalImageUrls) {
    try {
      const urls: string[] = JSON.parse(runner.additionalImageUrls);
      urls.forEach((url, index) => {
        const displayUrl = resolveImageDisplayUrl(url) ?? url;
        photos.push({
          id: `${runner.id}-${index}`,
          runnerProfileId: String(runner.id),
          fileName: url.split('/').pop()?.split('?')[0] || `photo-${index}`,
          fileUrl: displayUrl,
          fileSize: 0,
          mimeType: 'image/jpeg',
          uploadedAt: runner.lastPhotoUpdate || runner.updatedAt || new Date().toISOString(),
          isPrimary: runner.profileImageUrl === url,
        });
      });
    } catch {
      // ignore malformed JSON
    }
  }

  const dob = runner.dateOfBirth
    ? new Date(runner.dateOfBirth).toISOString().split('T')[0]
    : '';

  return {
    id: String(runner.id),
    userId: String(runner.userId ?? ''),
    firstName: runner.firstName || runner.name?.split(' ')[0] || '',
    lastName: runner.lastName || runner.name?.split(' ').slice(1).join(' ') || '',
    dateOfBirth: dob,
    age: runner.age ?? (dob ? EnhancedRunnerProfileService.calculateAge(dob) : 0),
    height: runner.height || '',
    weight: runner.weight || '',
    eyeColor: runner.eyeColor || '',
    medicalConditions: parseMedicalConditions(runner.medicalConditions),
    additionalNotes: runner.additionalNotes || '',
    photos,
    lastPhotoUpdate: runner.lastPhotoUpdate || runner.updatedAt || runner.createdAt || '',
    reminderCount: runner.photoUpdateReminderCount ?? 0,
    createdAt: runner.createdAt || new Date().toISOString(),
    updatedAt: runner.updatedAt || runner.createdAt || new Date().toISOString(),
    isActive: runner.isActive ?? true,
  };
}

function buildApiPayload(
  data: CreateEnhancedRunnerProfileData | UpdateEnhancedRunnerProfileData,
  userId: number,
  gender = 'Prefer not to say'
) {
  return {
    userId,
    firstName: ValidationUtils.sanitizeInput(data.firstName || ''),
    lastName: ValidationUtils.sanitizeInput(data.lastName || ''),
    dateOfBirth: data.dateOfBirth,
    gender,
    height: data.height?.trim(),
    weight: data.weight?.trim(),
    eyeColor: data.eyeColor?.trim(),
    medicalConditions: data.medicalConditions?.length
      ? data.medicalConditions.map(c => ValidationUtils.sanitizeInput(c)).join(', ')
      : undefined,
    additionalNotes: data.additionalNotes
      ? ValidationUtils.sanitizeInput(data.additionalNotes).slice(0, 1000)
      : undefined,
  };
}

async function getPrimaryRunnerId(): Promise<number | null> {
  if (cachedRunnerId) return cachedRunnerId;
  const data = await ApiClient.get<{ runners?: ApiRunner[] }>('/api/v1/runner?page=1&pageSize=1');
  const id = data.runners?.[0]?.id;
  if (id) cachedRunnerId = id;
  return id ?? null;
}

async function fetchPrimaryRunner(): Promise<ApiRunner | null> {
  const data = await ApiClient.get<{ runners?: ApiRunner[] }>('/api/v1/runner?page=1&pageSize=1');
  const runner = data.runners?.[0] ?? null;
  if (runner?.id) cachedRunnerId = runner.id;
  return runner;
}

/**
 * Enhanced Runner Profile Service — aligned with /api/v1/enhanced-runner and /api/v1/runner
 */
export class EnhancedRunnerProfileService {
  static async getRunnerProfile(): Promise<EnhancedRunnerProfile | null> {
    try {
      const runner = await fetchPrimaryRunner();
      if (!runner) return null;

      try {
        const detail = await ApiClient.get<{ runner?: ApiRunner }>(
          `/api/v1/enhanced-runner/${runner.id}`
        );
        if (detail.runner) return mapRunnerToProfile(detail.runner);
      } catch {
        // fall back to list payload
      }

      return mapRunnerToProfile(runner);
    } catch (error: unknown) {
      logOptionalProfileFailure('Enhanced runner profile unavailable', error);
      return null;
    }
  }

  static async hasRunnerProfile(): Promise<boolean> {
    try {
      const runner = await fetchPrimaryRunner();
      return Boolean(runner);
    } catch {
      return false;
    }
  }

  static async createRunnerProfile(
    profileData: CreateEnhancedRunnerProfileData
  ): Promise<EnhancedRunnerProfile> {
    const validation = RunnerValidationUtils.validateRunnerProfile(profileData);
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join('\n'));
    }

    const userId = parseInt((await SecureTokenService.getUserId()) || '0', 10);
    if (!userId) {
      throw new Error('You must be signed in to create a runner profile');
    }

    const payload = buildApiPayload(profileData, userId);
    const data = await ApiClient.post<{ runner?: ApiRunner; message?: string }>(
      '/api/v1/enhanced-runner',
      payload
    );

    if (!data.runner) {
      throw new Error('Runner profile was not created');
    }

    cachedRunnerId = data.runner.id;
    return mapRunnerToProfile(data.runner);
  }

  static async updateRunnerProfile(
    profileData: UpdateEnhancedRunnerProfileData
  ): Promise<EnhancedRunnerProfile> {
    const validation = RunnerValidationUtils.validateRunnerProfile(profileData);
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join('\n'));
    }

    const runnerId = await getPrimaryRunnerId();
    if (!runnerId) {
      throw new Error('No runner profile found to update');
    }

    const existing = await this.getRunnerProfile();
    const userId = parseInt((await SecureTokenService.getUserId()) || '0', 10);
    const payload = buildApiPayload(
      {
        firstName: profileData.firstName ?? existing?.firstName ?? '',
        lastName: profileData.lastName ?? existing?.lastName ?? '',
        dateOfBirth: profileData.dateOfBirth ?? existing?.dateOfBirth ?? '',
        height: profileData.height ?? existing?.height ?? '',
        weight: profileData.weight ?? existing?.weight ?? '',
        eyeColor: profileData.eyeColor ?? existing?.eyeColor ?? '',
        medicalConditions: profileData.medicalConditions ?? existing?.medicalConditions ?? [],
        additionalNotes: profileData.additionalNotes ?? existing?.additionalNotes ?? '',
      },
      userId
    );

    const data = await ApiClient.put<{ runner?: ApiRunner }>(
      `/api/v1/enhanced-runner/${runnerId}`,
      payload
    );

    if (!data.runner) {
      throw new Error('Runner profile was not updated');
    }

    return mapRunnerToProfile(data.runner);
  }

  static async deleteRunnerProfile(): Promise<void> {
    const runnerId = await getPrimaryRunnerId();
    if (!runnerId) {
      throw new Error('No runner profile found to delete');
    }
    await ApiClient.delete(`/api/v1/runner/${runnerId}`);
    cachedRunnerId = null;
  }

  static async getPhotos(): Promise<EnhancedRunnerPhoto[]> {
    const profile = await this.getRunnerProfile();
    return profile?.photos ?? [];
  }

  static async uploadPhoto(
    photoUri: string,
    onProgress?: (progress: number) => void
  ): Promise<PhotoUploadResponse> {
    const validation = this.validatePhoto(photoUri);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    const runnerId = await getPrimaryRunnerId();
    if (!runnerId) {
      return { success: false, error: 'Create a runner profile before uploading photos' };
    }

    try {
      const fileName = `runner_photo_${Date.now()}.jpg`;
      const { ImageUploadService } = await import('./imageUpload');
      const uploaded = await ImageUploadService.uploadImage(photoUri, fileName);

      onProgress?.(90);

      const data = await ApiClient.post<{
        success?: boolean;
        uploadedUrls?: string[];
        message?: string;
      }>(`/api/v1/enhanced-runner/${runnerId}/photo-urls`, {
        photoUrls: [uploaded.url],
        photoType: 'Additional',
      });

      onProgress?.(100);

      const url = data.uploadedUrls?.[0] ?? uploaded.url;
      const displayUrl = resolveImageDisplayUrl(url) ?? url;
      if (!url) {
        return { success: false, error: data.message || 'Photo upload failed' };
      }

      return {
        success: true,
        photo: {
          id: `${runnerId}-${Date.now()}`,
          runnerProfileId: String(runnerId),
          fileName: uploaded.fileName || url.split('/').pop()?.split('?')[0] || 'photo.jpg',
          fileUrl: displayUrl,
          fileSize: uploaded.size ?? 0,
          mimeType: 'image/jpeg',
          uploadedAt: new Date().toISOString(),
          isPrimary: false,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload photo';
      return { success: false, error: message };
    }
  }

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
      const fileName = `photo_${i + 1}_${Date.now()}`;
      onProgress?.({ fileName, progress: 0, status: 'uploading' });

      const result = await this.uploadPhoto(photoUris[i], progress => {
        onProgress?.({
          fileName,
          progress,
          status: progress === 100 ? 'completed' : 'uploading',
        });
      });

      if (result.success && result.photo) {
        response.uploadedPhotos.push(result.photo);
        response.successfulUploads++;
      } else {
        response.failedUploads++;
        response.errors.push(result.error || `Failed to upload ${fileName}`);
      }
    }

    return response;
  }

  static async deletePhoto(_photoId: string): Promise<void> {
    throw new Error('Photo deletion is not yet supported by the API. Contact support to remove a photo.');
  }

  static async setPrimaryPhoto(_photoId: string): Promise<void> {
    throw new Error(
      'To set a primary photo, upload a new profile photo from the runner photos section.'
    );
  }

  static async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const data = await ApiClient.get<{
        caseUpdates?: boolean;
        profileUpdates?: boolean;
        pushEnabled?: boolean;
      }>('/api/notifications/preferences');

      return {
        emailNotifications: data.profileUpdates ?? true,
        pushNotifications: data.pushEnabled ?? true,
        reminderFrequency: 'weekly',
      };
    } catch {
      return {
        emailNotifications: true,
        pushNotifications: true,
        reminderFrequency: 'weekly',
      };
    }
  }

  static async updateNotificationSettings(
    settings: NotificationSettings
  ): Promise<NotificationSettings> {
    await ApiClient.post('/api/notifications/preferences', {
      caseUpdates: settings.emailNotifications,
      profileUpdates: settings.emailNotifications,
      safetyChecks: true,
      weatherAlerts: true,
      system: true,
      pushEnabled: settings.pushNotifications,
    });
    return settings;
  }

  static async getPhotoReminders(): Promise<PhotoUpdateReminder[]> {
    try {
      const data = await ApiClient.get<{ reminders?: PhotoUpdateReminder[] }>(
        '/api/v1/enhanced-runner/photo-reminders'
      );
      return data.reminders ?? [];
    } catch {
      return [];
    }
  }

  static async dismissPhotoReminder(_reminderId: string): Promise<void> {
    const runnerId = await getPrimaryRunnerId();
    if (!runnerId) return;
    await ApiClient.put(`/api/v1/enhanced-runner/${runnerId}/photo-reminder-sent`);
  }

  static calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  static needsPhotoUpdate(lastPhotoUpdate: string): boolean {
    const lastUpdate = new Date(lastPhotoUpdate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return lastUpdate < sixMonthsAgo;
  }

  static getDaysSinceLastPhotoUpdate(lastPhotoUpdate: string): number {
    const diffTime = Math.abs(Date.now() - new Date(lastPhotoUpdate).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static validatePhoto(
    photoUri: string,
    _options: PhotoUploadOptions = DEFAULT_PHOTO_OPTIONS
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!photoUri?.trim()) errors.push('Photo is required');
    return { isValid: errors.length === 0, errors };
  }

  static async getProfileStats(): Promise<RunnerProfileStats> {
    const profile = await this.getRunnerProfile();
    const photos = profile?.photos ?? [];
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
    return {
      totalPhotos: photos.length,
      primaryPhotoSet: !!primaryPhoto,
      daysSinceLastUpdate: profile.lastPhotoUpdate
        ? this.getDaysSinceLastPhotoUpdate(profile.lastPhotoUpdate)
        : 0,
      reminderCount: profile.reminderCount,
      profileCompleteness: 0,
      lastActivity: profile.updatedAt,
    };
  }

  static async getPhotoAnalytics(): Promise<PhotoAnalytics> {
    const photos = await this.getPhotos();
    return {
      totalUploads: photos.length,
      successfulUploads: photos.length,
      failedUploads: 0,
      averageFileSize: 0,
      mostCommonMimeType: 'image/jpeg',
      uploadFrequency: 'rarely',
    };
  }
}
