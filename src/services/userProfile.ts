import { ApiClient } from './apiClient';

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
}

export interface ProfileImageUploadResponse {
  success: boolean;
  imageUrl: string;
  message?: string;
}

export class UserProfileService {
  /**
   * Get current user's full profile
   */
  static async getProfile(): Promise<UserProfile> {
    try {
      const data = await ApiClient.get('/api/v1/auth/profile');
      return data;
    } catch (error: any) {
      console.error('Failed to get user profile:', error);
      throw new Error(error.message || 'Failed to load profile');
    }
  }

  /**
   * Update user's personal information
   */
  static async updateProfile(updateData: ProfileUpdateData): Promise<UserProfile> {
    try {
      const data = await ApiClient.put('/api/v1/auth/profile', updateData);
      return data;
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  /**
   * Upload profile image
   */
  static async uploadProfileImage(imageUri: string): Promise<ProfileImageUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('profileImage', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const data = await ApiClient.uploadFile('/api/v1/user/profile/image', formData);
      return data;
    } catch (error: any) {
      console.error('Failed to upload profile image:', error);
      throw new Error(error.message || 'Failed to upload profile image');
    }
  }

  /**
   * Delete profile image
   */
  static async deleteProfileImage(): Promise<void> {
    try {
      await ApiClient.delete('/api/v1/user/profile/image');
    } catch (error: any) {
      console.error('Failed to delete profile image:', error);
      throw new Error(error.message || 'Failed to delete profile image');
    }
  }

  /**
   * Update emergency contacts
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
      const data = await ApiClient.put('/api/v1/user/profile/emergency-contacts', { contacts });
      return data;
    } catch (error: any) {
      console.error('Failed to update emergency contacts:', error);
      throw new Error(error.message || 'Failed to update emergency contacts');
    }
  }

  /**
   * Get user's case statistics
   */
  static async getCaseStatistics(): Promise<{
    totalCases: number;
    activeCases: number;
    resolvedCases: number;
  }> {
    try {
      const data = await ApiClient.get('/api/v1/user/case-statistics');
      return data;
    } catch (error: any) {
      console.error('Failed to get case statistics:', error);
      return {
        totalCases: 0,
        activeCases: 0,
        resolvedCases: 0,
      };
    }
  }

  /**
   * Check if user has a runner profile
   */
  static async hasRunnerProfile(): Promise<boolean> {
    try {
      const data = await ApiClient.get('/api/v1/user/runner-profile/exists');
      return data.exists;
    } catch (error: any) {
      console.error('Failed to check runner profile:', error);
      return false;
    }
  }
}
