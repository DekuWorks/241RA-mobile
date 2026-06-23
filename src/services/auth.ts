import { QueryClient } from '@tanstack/react-query';
import { ApiClient, AUTH_REQUEST_TIMEOUT_MS } from './apiClient';
import { SecureTokenService } from './secureTokens';
import { UserDataService } from './userData';
import { initCrashlytics } from '../lib/crash';
import { NotificationService } from './notifications';
import { signalRService } from './signalR';
import { TopicService } from './topics';
import {
  ApiUserPayload,
  mapApiUserToAuthUser,
  mapApiUserToProfile,
  unwrapApiUser,
} from './apiUserMapper';
import { ValidationUtils } from '../utils/validation';
import { isTimeoutError } from '../types/api';
import { resolveLocalApiUser } from './localUserSession';

let authQueryClient: QueryClient | null = null;

export function setAuthQueryClient(queryClient: QueryClient): void {
  authQueryClient = queryClient;
}

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
  allRoles: string[];
  primaryUserRole: string;
  isAdminUser: boolean;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
}

/**
 * Authentication Service
 *
 * Handles user authentication including:
 * - Login/logout functionality
 * - Token management
 * - User session persistence
 * - Role-based access control
 */
export interface LoginOptions {
  /** Called before a single automatic retry after a timeout (e.g. Azure cold start). */
  onRetrying?: () => void;
}

export class AuthService {
  static async login(
    credentials: LoginCredentials,
    options?: LoginOptions
  ): Promise<AuthResponse> {
    if (__DEV__) {
      console.log('[AUTH] Attempting login with credentials:', {
        email: credentials.email,
        hasPassword: !!credentials.password,
        hasTwoFactor: !!credentials.twoFactorCode,
      });
    }

    const normalizedCredentials = {
      ...credentials,
      email: credentials.email.trim(),
    };

    const postLogin = () =>
      ApiClient.post<AuthResponse>('/api/v1/auth/login', normalizedCredentials, {
        timeout: AUTH_REQUEST_TIMEOUT_MS,
      });

    try {
      const data = await postLogin();

      if (data.accessToken) {
        await this.persistSession(data);
      }

      return data;
    } catch (error: unknown) {
      if (!isTimeoutError(error)) {
        throw error;
      }

      if (__DEV__) {
        console.warn('[AUTH] Login timed out, retrying once (server may be waking up)');
      }

      options?.onRetrying?.();

      const data = await postLogin();

      if (data.accessToken) {
        await this.persistSession(data);
      }

      return data;
    }
  }

  static async loginWithMicrosoft(microsoftToken: string): Promise<AuthResponse> {
    const data = await ApiClient.post('/api/v1/auth/oauth/register', {
      provider: 'microsoft',
      token: microsoftToken,
    });

    if (data.accessToken) {
      await this.persistSession(data);
    }

    return data;
  }

  private static authResponseToApiUser(data: AuthResponse): ApiUserPayload {
    const user = data.user;

    return {
      id: user?.id ?? data.userId,
      email: user?.email ?? data.email,
      fullName: user?.name,
      role: user?.role ?? 'user',
      allRoles: user?.allRoles,
      primaryUserRole: user?.primaryUserRole,
      isAdminUser: user?.isAdminUser,
      isEmailVerified: user?.isEmailVerified,
      twoFactorEnabled: user?.twoFactorEnabled,
    };
  }

  private static syncProfileQueries(payload: ApiUserPayload): void {
    authQueryClient?.setQueryData(['user'], mapApiUserToAuthUser(payload));
    authQueryClient?.setQueryData(['userProfile'], mapApiUserToProfile(payload));
  }

  private static async persistSession(data: AuthResponse): Promise<void> {
    await SecureTokenService.setAccessToken(String(data.accessToken));

    if (data.refreshToken) {
      await SecureTokenService.setRefreshToken(String(data.refreshToken));
    }

    const userId = String(data.user?.id || data.userId || '');
    await SecureTokenService.setUserId(userId);
    initCrashlytics(userId);

    const apiUser = this.authResponseToApiUser(data);
    await UserDataService.setStoredApiUser(apiUser);
    this.syncProfileQueries(apiUser);

    try {
      await NotificationService.registerDevice();
    } catch (error) {
      console.warn('Failed to register device token:', error);
    }

    await this.initializeRealtimeServices(data.user);
  }

  static async logout(): Promise<void> {
    try {
      await ApiClient.post('/api/v1/auth/logout');
    } catch (error) {
      console.warn('Server logout failed:', error);
    } finally {
      await SecureTokenService.clearAll();
      await UserDataService.clearUserData();
    }
  }

  static async deleteAccount(): Promise<void> {
    try {
      await ApiClient.delete('/api/v1/auth/account');
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new Error(
          'Account deletion is not yet available. Please contact support to delete your account.'
        );
      }
      throw error;
    }
  }

  static async fetchCurrentUserFromApi(): Promise<User | null> {
    try {
      const data = await ApiClient.get('/api/v1/auth/me');
      const payload = unwrapApiUser(data);
      await UserDataService.setStoredApiUser(payload);
      const user = mapApiUserToAuthUser(payload);
      this.syncProfileQueries(payload);
      return user;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 401
      ) {
        await SecureTokenService.clearAll();
        await UserDataService.clearUserData();
        return null;
      }

      throw error;
    }
  }

  private static refreshCurrentUserInBackground(): void {
    void this.fetchCurrentUserFromApi().catch(error => {
      if (__DEV__ && !isTimeoutError(error)) {
        console.warn('[AUTH] Background user refresh failed:', error);
      }
    });
  }

  static async getCurrentUser(): Promise<User | null> {
    const local = await resolveLocalApiUser();
    if (local) {
      this.refreshCurrentUserInBackground();
      return mapApiUserToAuthUser(local);
    }

    const hasToken = await SecureTokenService.isAuthenticated();
    if (!hasToken) {
      return null;
    }

    try {
      return await this.fetchCurrentUserFromApi();
    } catch (error: unknown) {
      if (__DEV__ && !isTimeoutError(error)) {
        console.warn('[AUTH] Failed to fetch current user:', error);
      }
      return null;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    return await SecureTokenService.isAuthenticated();
  }

  static async enableTwoFactor(): Promise<{ qrCode: string; backupCodes: string[] }> {
    return await ApiClient.post('/api/v1/auth/2fa/enable');
  }

  static async disableTwoFactor(code: string): Promise<void> {
    await ApiClient.post('/api/v1/auth/2fa/disable', { code });
  }

  static async verifyTwoFactor(code: string): Promise<boolean> {
    try {
      await ApiClient.post('/api/v1/auth/2fa/verify', { code });
      return true;
    } catch {
      return false;
    }
  }

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
      const passwordCheck = ValidationUtils.validatePassword(signupData.password);
      if (!passwordCheck.isValid) {
        return {
          success: false,
          message: passwordCheck.errors.join('\n'),
          error: passwordCheck.errors[0],
        };
      }

      const data = await ApiClient.post('/api/v1/auth/register', {
        email: signupData.email.toLowerCase().trim(),
        password: signupData.password,
        firstName: ValidationUtils.sanitizeInput(signupData.firstName),
        lastName: ValidationUtils.sanitizeInput(signupData.lastName),
        role: signupData.role,
        phoneNumber: signupData.phoneNumber.trim(),
        organization: signupData.organization ?? null,
        title: signupData.title ?? null,
      });

      if (data.success) {
        return {
          success: true,
          message: data.message || 'Account created successfully!',
          user: data.user,
        };
      }

      return {
        success: false,
        message: data.message || 'Signup failed',
        error: data.error?.message || 'Unknown error',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Signup failed',
        error: error.message,
      };
    }
  }

  private static async initializeRealtimeServices(user?: User): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          await signalRService.startConnection();
          break;
        } catch (signalRError: any) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw signalRError;
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (user?.allRoles && user.allRoles.length > 0) {
        for (const role of user.allRoles) {
          await TopicService.subscribeToDefaultTopics(role);
        }
      } else if (user?.role) {
        await TopicService.subscribeToDefaultTopics(user.role);
      } else {
        await TopicService.subscribeToDefaultTopics();
      }
    } catch (error: any) {
      console.warn('[AUTH] Failed to initialize real-time services:', error);
    }
  }
}
