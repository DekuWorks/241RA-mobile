import { ApiClient } from './apiClient';
import { mapApiUserToProfile, unwrapApiUser } from './apiUserMapper';
import { AuthService } from './auth';
import { ValidationUtils } from '../utils/validation';
import { isTimeoutError } from '../types/api';
import { resolveLocalApiUser, refreshRemoteUserInBackground } from './localUserSession';
import { resolveImageDisplayUrl } from '../utils/imageUrl';

const PROFILE_FETCH_ATTEMPTS = 2;
const PROFILE_FETCH_RETRY_DELAY_MS = 1500;

function formatProfileError(error: unknown): string {
  if (isTimeoutError(error)) {
    return 'Profile request timed out. The server may be waking up — pull to refresh or try again.';
  }

  return error instanceof Error ? error.message : 'Failed to load profile';
}

async function fetchProfileWithRetry(): Promise<UserProfile> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= PROFILE_FETCH_ATTEMPTS; attempt++) {
    try {
      const data = await ApiClient.get('/api/v1/auth/me');
      const payload = unwrapApiUser(data);
      await AuthService.applyRemoteUserPayload(payload);
      return mapApiUserToProfile(payload);
    } catch (error: unknown) {
      lastError = error;

      if (isTimeoutError(error) && attempt < PROFILE_FETCH_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, PROFILE_FETCH_RETRY_DELAY_MS * attempt));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  role: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  memberSince?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContacts?: Array<{
    id: string;
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  }>;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  profileImageUrl?: string | null;
}

export interface ProfileImageUploadResponse {
  success: boolean;
  /** Blob URL persisted on the user profile */
  imageUrl: string;
  /** URI suitable for React Native Image (API proxy for private blobs) */
  displayUrl: string;
  profile: UserProfile;
  message?: string;
}

export class UserProfileService {
  /**
   * Always fetch profile from /auth/me (updates local cache and React Query).
   */
  static async fetchProfileFromNetwork(): Promise<UserProfile> {
    return fetchProfileWithRetry();
  }

  /**
   * Get current user's full profile (same database as 241runnersawareness.org)
   */
  static async getProfile(): Promise<UserProfile> {
    const local = await resolveLocalApiUser();
    if (local) {
      refreshRemoteUserInBackground();
      return mapApiUserToProfile(local);
    }

    try {
      return await fetchProfileWithRetry();
    } catch (error: unknown) {
      if (__DEV__ && !isTimeoutError(error)) {
        console.warn('Failed to get user profile:', error);
      }
      throw new Error(formatProfileError(error));
    }
  }

  /**
   * Update user's personal information
   */
  static async updateProfile(updateData: ProfileUpdateData): Promise<UserProfile> {
    try {
      const validation = ValidationUtils.validateProfileUpdate({
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phoneNumber: updateData.phoneNumber,
      });
      if (!validation.isValid) {
        throw new Error(validation.errors.join('\n'));
      }

      const payload: Record<string, string | null | undefined> = {
        firstName: updateData.firstName
          ? ValidationUtils.sanitizeInput(updateData.firstName)
          : undefined,
        lastName: updateData.lastName
          ? ValidationUtils.sanitizeInput(updateData.lastName)
          : undefined,
        phoneNumber: updateData.phoneNumber?.trim(),
        address: updateData.address?.street,
        city: updateData.address?.city,
        state: updateData.address?.state,
        zipCode: updateData.address?.zipCode,
        profileImageUrl: updateData.profileImageUrl,
      };

      const data = await ApiClient.put('/api/v1/auth/profile', payload);
      const apiUser = unwrapApiUser(data);
      await AuthService.applyRemoteUserPayload(apiUser);
      return mapApiUserToProfile(apiUser);
    } catch (error: unknown) {
      console.error('Failed to update profile:', error);
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      throw new Error(message);
    }
  }

  /**
   * Upload profile image (matches site: ImageUpload then save URL on profile)
   */
  static async uploadProfileImage(imageUri: string): Promise<ProfileImageUploadResponse> {
    try {
      const fileName = imageUri.split('/').pop() || 'profile.jpg';
      const { ImageUploadService } = await import('./imageUpload');
      const uploaded = await ImageUploadService.uploadImage(imageUri, fileName);
      const profile = await this.updateProfile({ profileImageUrl: uploaded.url });
      const displayUrl = resolveImageDisplayUrl(uploaded.url) ?? uploaded.url;

      if (__DEV__) {
        console.log('[PROFILE] Avatar uploaded:', {
          blobUrl: uploaded.url,
          displayUrl,
          savedOnProfile: profile.profileImageUrl,
        });
      }

      return {
        success: true,
        imageUrl: uploaded.url,
        displayUrl,
        profile,
        message: 'Profile image uploaded successfully',
      };
    } catch (error: unknown) {
      console.error('Failed to upload profile image:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload profile image';
      throw new Error(message);
    }
  }

  /**
   * Delete profile image
   */
  static async deleteProfileImage(): Promise<UserProfile> {
    try {
      return await this.updateProfile({ profileImageUrl: null });
    } catch (error: unknown) {
      console.error('Failed to delete profile image:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete profile image';
      throw new Error(message);
    }
  }

  /**
   * Update emergency contacts (stored as flat fields on user record)
   */
  static async updateEmergencyContacts(
    contacts: Array<{
      id?: string;
      name: string;
      relationship: string;
      phoneNumber: string;
      email?: string;
    }>
  ): Promise<UserProfile> {
    try {
      const primary = contacts[0];
      const data = await ApiClient.put('/api/v1/auth/profile', {
        emergencyContactName: primary?.name,
        emergencyContactPhone: primary?.phoneNumber,
        emergencyContactRelationship: primary?.relationship,
      });
      const apiUser = unwrapApiUser(data);
      await AuthService.applyRemoteUserPayload(apiUser);
      return mapApiUserToProfile(apiUser);
    } catch (error: unknown) {
      console.error('Failed to update emergency contacts:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to update emergency contacts';
      throw new Error(message);
    }
  }

  /**
   * Get user's case statistics from my-cases endpoint
   */
  static async getCaseStatistics(): Promise<{
    totalCases: number;
    activeCases: number;
    resolvedCases: number;
  }> {
    try {
      const data = await ApiClient.get<{
        cases?: Array<{ status?: string }>;
        total?: number;
      }>('/api/v1/cases/my-cases?page=1&pageSize=100');

      const cases = data.cases ?? [];
      const resolvedStatuses = new Set(['resolved', 'found', 'closed']);
      const resolvedCases = cases.filter(c =>
        resolvedStatuses.has((c.status ?? '').toLowerCase())
      ).length;

      return {
        totalCases: data.total ?? cases.length,
        activeCases: cases.length - resolvedCases,
        resolvedCases,
      };
    } catch (error: unknown) {
      console.error('Failed to get case statistics:', error);
      return {
        totalCases: 0,
        activeCases: 0,
        resolvedCases: 0,
      };
    }
  }

  /**
   * Check if user has a runner profile (same as site profile page)
   */
  static async hasRunnerProfile(): Promise<boolean> {
    try {
      const data = await ApiClient.get<{
        runners?: unknown[];
        hasProfile?: boolean;
      }>('/api/v1/runner?page=1&pageSize=1');

      if (Array.isArray(data.runners)) {
        return data.runners.length > 0;
      }

      return Boolean(data.hasProfile);
    } catch (error: unknown) {
      console.error('Failed to check runner profile:', error);
      return false;
    }
  }
}
