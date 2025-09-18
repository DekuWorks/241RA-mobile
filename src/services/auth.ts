import { ApiClient } from './apiClient';
import { SecureStoreService } from './secureStore';
import { initCrashlytics } from '../lib/crash';
import { registerDeviceToken } from '../features/push/registerDeviceToken';

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  user?: User;
  requiresTwoFactor?: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await ApiClient.post('/api/auth/login', credentials);

    console.log('Login response data:', data);
    console.log('User ID type:', typeof data.user?.id, 'Value:', data.user?.id);

    if (data.accessToken) {
      await SecureStoreService.setAccessToken(String(data.accessToken));

      // Only store refreshToken if it exists
      if (data.refreshToken) {
        await SecureStoreService.setRefreshToken(String(data.refreshToken));
      } else {
        console.log('No refreshToken in response, skipping storage');
      }

      // Ensure userId is converted to string
      const userId = String(data.user?.id || data.userId || '');
      console.log('Storing userId as string:', userId);
      await SecureStoreService.setUserId(userId);

      // Initialize Crashlytics with user ID (GUID only, no PII)
      initCrashlytics(userId);

      // Register device token for push notifications
      try {
        await registerDeviceToken();
      } catch (error) {
        console.warn('Failed to register device token:', error);
      }
    }

    return data;
  }

  static async loginWithGoogle(googleToken: string): Promise<AuthResponse> {
    const data = await ApiClient.post('/api/auth/google', { token: googleToken });

    if (data.accessToken) {
      await SecureStoreService.setAccessToken(String(data.accessToken));
      if (data.refreshToken) {
        await SecureStoreService.setRefreshToken(String(data.refreshToken));
      }
      
      // Ensure userId is converted to string
      const userId = String(data.user?.id || data.userId || '');
      await SecureStoreService.setUserId(userId);

      // Initialize Crashlytics with user ID (GUID only, no PII)
      initCrashlytics(userId);

      // Register device token for push notifications
      try {
        await registerDeviceToken();
      } catch (error) {
        console.warn('Failed to register device token:', error);
      }
    }

    return data;
  }

  static async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate tokens on server
      await ApiClient.post('/api/auth/logout');
    } catch (error) {
      // Continue with local logout even if server call fails
      console.warn('Server logout failed:', error);
    } finally {
      // Always clear local tokens
      await SecureStoreService.clearAll();
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const userId = await SecureStoreService.getUserId();
      if (!userId) return null;

      const data = await ApiClient.get(`/api/users/${userId}`);
      return data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    return await SecureStoreService.hasValidTokens();
  }

  static async enableTwoFactor(): Promise<{ qrCode: string; backupCodes: string[] }> {
    const data = await ApiClient.post('/api/auth/2fa/enable');
    return data;
  }

  static async disableTwoFactor(code: string): Promise<void> {
    await ApiClient.post('/api/auth/2fa/disable', { code });
  }

  static async verifyTwoFactor(code: string): Promise<boolean> {
    try {
      await ApiClient.post('/api/auth/2fa/verify', { code });
      return true;
    } catch (error) {
      return false;
    }
  }
}
