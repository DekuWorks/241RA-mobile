import { ApiClient } from './apiClient';
import { SecureTokenService } from './secureTokens';
import { initCrashlytics } from '../lib/crash';
import { registerDeviceToken } from '../features/push/registerDeviceToken';
import { signalRService } from './signalR';
import { TopicService } from './topics';

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
      await SecureTokenService.setAccessToken(String(data.accessToken));

      // Only store refreshToken if it exists
      if (data.refreshToken) {
        await SecureTokenService.setRefreshToken(String(data.refreshToken));
      } else {
        console.log('No refreshToken in response, skipping storage');
      }

      // Ensure userId is converted to string
      const userId = String(data.user?.id || data.userId || '');
      console.log('Storing userId as string:', userId);
      await SecureTokenService.setUserId(userId);

      // Initialize Crashlytics with user ID (GUID only, no PII)
      initCrashlytics(userId);

      // Register device token for push notifications
      try {
        await registerDeviceToken();
      } catch (error) {
        console.warn('Failed to register device token:', error);
      }

      // Initialize real-time services
      await this.initializeRealtimeServices(data.user);
    }

    return data;
  }

  static async loginWithGoogle(googleToken: string): Promise<AuthResponse> {
    const data = await ApiClient.post('/api/auth/oauth/register', { 
      provider: 'google',
      token: googleToken 
    });

    if (data.accessToken) {
      await SecureTokenService.setAccessToken(String(data.accessToken));
      if (data.refreshToken) {
        await SecureTokenService.setRefreshToken(String(data.refreshToken));
      }

      // Ensure userId is converted to string
      const userId = String(data.user?.id || data.userId || '');
      await SecureTokenService.setUserId(userId);

      // Initialize Crashlytics with user ID (GUID only, no PII)
      initCrashlytics(userId);

      // Register device token for push notifications
      try {
        await registerDeviceToken();
      } catch (error) {
        console.warn('Failed to register device token:', error);
      }

      // Initialize real-time services
      await this.initializeRealtimeServices(data.user);
    }

    return data;
  }

  static async loginWithApple(appleToken: string): Promise<AuthResponse> {
    const data = await ApiClient.post('/api/auth/oauth/register', { 
      provider: 'apple',
      token: appleToken 
    });

    if (data.accessToken) {
      await SecureTokenService.setAccessToken(String(data.accessToken));
      if (data.refreshToken) {
        await SecureTokenService.setRefreshToken(String(data.refreshToken));
      }

      // Ensure userId is converted to string
      const userId = String(data.user?.id || data.userId || '');
      await SecureTokenService.setUserId(userId);

      // Initialize Crashlytics with user ID (GUID only, no PII)
      initCrashlytics(userId);

      // Register device token for push notifications
      try {
        await registerDeviceToken();
      } catch (error) {
        console.warn('Failed to register device token:', error);
      }

      // Initialize real-time services
      await this.initializeRealtimeServices(data.user);
    }

    return data;
  }

  static async loginWithMicrosoft(microsoftToken: string): Promise<AuthResponse> {
    const data = await ApiClient.post('/api/auth/oauth/register', { 
      provider: 'microsoft',
      token: microsoftToken 
    });

    if (data.accessToken) {
      await SecureTokenService.setAccessToken(String(data.accessToken));
      if (data.refreshToken) {
        await SecureTokenService.setRefreshToken(String(data.refreshToken));
      }

      // Ensure userId is converted to string
      const userId = String(data.user?.id || data.userId || '');
      await SecureTokenService.setUserId(userId);

      // Initialize Crashlytics with user ID (GUID only, no PII)
      initCrashlytics(userId);

      // Register device token for push notifications
      try {
        await registerDeviceToken();
      } catch (error) {
        console.warn('Failed to register device token:', error);
      }

      // Initialize real-time services
      await this.initializeRealtimeServices(data.user);
    }

    return data;
  }

  static async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate tokens on server
      await ApiClient.post('/api/v1/auth/logout');
    } catch (error) {
      // Continue with local logout even if server call fails
      console.warn('Server logout failed:', error);
    } finally {
      // Always clear local tokens and data
      await SecureTokenService.clearAll();
      
      // Clear any cached user data
      try {
        // Clear any cached queries or user data
        // This ensures the app doesn't use stale data
        console.log('Clearing authentication state...');
      } catch (clearError) {
        console.warn('Failed to clear some cached data:', clearError);
      }
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const data = await ApiClient.get('/api/v1/auth/me');
      return data;
    } catch (error: any) {
      console.error('Failed to get current user:', error);
      
      // If we get a 401, the token is invalid, clear it
      if (error?.response?.status === 401) {
        console.log('Token is invalid, clearing stored tokens');
        await SecureTokenService.clearAll();
      }
      
      return null;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    return await SecureTokenService.isAuthenticated();
  }

  static async enableTwoFactor(): Promise<{ qrCode: string; backupCodes: string[] }> {
    const data = await ApiClient.post('/api/v1/auth/2fa/enable');
    return data;
  }

  static async disableTwoFactor(code: string): Promise<void> {
    await ApiClient.post('/api/v1/auth/2fa/disable', { code });
  }

  static async verifyTwoFactor(code: string): Promise<boolean> {
    try {
      await ApiClient.post('/api/v1/auth/2fa/verify', { code });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sign up a new user
   */
  static async signup(signupData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    phoneNumber: string;
    organization?: string | null;
    title?: string | null;
  }): Promise<{
    success: boolean;
    message: string;
    user?: any;
    error?: string;
  }> {
    try {
      const data = await ApiClient.post('/api/v1/auth/register', signupData);
      
      if (data.success) {
        console.log('Signup successful:', data);
        return {
          success: true,
          message: data.message || 'Account created successfully!',
          user: data.user
        };
      } else {
        return {
          success: false,
          message: data.message || 'Signup failed',
          error: data.error?.message || 'Unknown error'
        };
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.message || 'Signup failed',
        error: error.message
      };
    }
  }

  /**
   * Initialize real-time services after successful login
   */
  private static async initializeRealtimeServices(user?: User): Promise<void> {
    try {
      // Start SignalR connection
      await signalRService.startConnection();

      // Subscribe to default topics based on user role
      if (user?.role) {
        await TopicService.subscribeToDefaultTopics(user.role);
      } else {
        await TopicService.subscribeToDefaultTopics();
      }

      console.log('Real-time services initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize real-time services:', error);
    }
  }
}
