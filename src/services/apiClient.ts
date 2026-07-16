import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ENV } from '../config/env';
import { SecureTokenService } from './secureTokens';
import {
  isAxiosError,
  AxiosErrorResponse,
  extractApiErrorMessage,
  ApiRequestError,
  isTimeoutError,
} from '../types/api';

/** Auth routes that must not attach tokens or trigger refresh on 401 */
const PUBLIC_AUTH_PATHS = ['/api/v1/auth/login', '/api/v1/auth/register'];

function isPublicAuthPath(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some(path => url.includes(path));
}

/** Azure cold starts can exceed 20s on auth/DB paths */
export const AUTH_REQUEST_TIMEOUT_MS = 45000;

/**
 * Centralized API Client
 * 
 * Handles all HTTP requests with:
 * - Automatic token refresh and management
 * - Request/response interceptors
 * - Production-safe error handling
 * - Retry logic for failed requests
 */
export class ApiClient {
  private static instance: AxiosInstance;

  /**
   * Get the configured Axios instance
   */
  static getInstance(): AxiosInstance {
    if (!this.instance) {
      this.instance = this.createInstance();
    }
    return this.instance;
  }

  /**
   * Create configured Axios instance
   */
  private static createInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: ENV.API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to attach Bearer token
    instance.interceptors.request.use(
      async config => {
        if (!isPublicAuthPath(config.url)) {
          const token = await SecureTokenService.getAccessToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        console.log('[API] Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
        });
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor to handle token refresh and errors
    instance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('[API] Response:', {
          status: response.status,
          url: response.config.url,
          method: response.config.method?.toUpperCase(),
        });
        return response;
      },
      async error => {
        const originalRequest = error.config;

        // Handle 401 errors with token refresh (skip for login/register)
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isPublicAuthPath(originalRequest.url)
        ) {
          originalRequest._retry = true;

          try {
            const refreshToken = await SecureTokenService.getRefreshToken();
            if (refreshToken) {
              const response = await axios.post(`${ENV.API_URL}/api/v1/auth/refresh`, {
                refreshToken: refreshToken,
              }, { timeout: AUTH_REQUEST_TIMEOUT_MS });

              if (response.data.accessToken) {
                await SecureTokenService.setAccessToken(response.data.accessToken);
                if (response.data.refreshToken) {
                  await SecureTokenService.setRefreshToken(response.data.refreshToken);
                }

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                return instance(originalRequest);
              }
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            await SecureTokenService.clearAll();
            // You might want to emit an event or use a navigation service here
            console.warn('Token refresh failed, user needs to re-authenticate');
          }
        }

        // Log API errors for debugging (only in development)
        if (__DEV__) {
          console.log('[API] Error:', {
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            message: error.message,
            data: error.response?.data,
          });
        }
        return Promise.reject(this.handleError(error));
      }
    );

    return instance;
  }

  /**
   * Handle API errors with proper formatting
   * @param error - The error object from Axios or other sources
   * @returns Formatted Error object safe for production
   */
  private static handleError(error: unknown): Error {
    // Don't expose sensitive error details in production
    const isProduction = !__DEV__;

    // Type guard for Axios error
    if (isAxiosError(error)) {
      const axiosError = error as AxiosErrorResponse;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;
        const message = extractApiErrorMessage(data, 'Server error');
        const code =
          data?.error && typeof data.error === 'object' ? data.error.code : data?.code;

        if (isProduction) {
          switch (status) {
            case 400:
              return new ApiRequestError(status, 'Invalid request', code);
            case 401:
              return new ApiRequestError(status, 'Invalid email or password', code);
            case 403:
              return new ApiRequestError(status, 'Access denied', code);
            case 404:
              return new ApiRequestError(status, 'Resource not found', code);
            case 500:
              return new ApiRequestError(status, 'Server error. Please try again later.', code);
            default:
              return new ApiRequestError(status, 'Something went wrong. Please try again.', code);
          }
        }

        return new ApiRequestError(status, message, code);
      }

      if (axiosError.request) {
        if (isTimeoutError(error)) {
          return new Error(
            isProduction
              ? 'Request timed out. The server may be waking up — please try again.'
              : axiosError.message || 'Request timed out'
          );
        }

        return new Error(
          isProduction
            ? 'Network error. Please check your connection.'
            : 'Network error: ' + axiosError.message
        );
      }
    }

    if (isTimeoutError(error)) {
      const message =
        error instanceof Error ? error.message : 'Request timed out';
      return new Error(
        isProduction
          ? 'Request timed out. The server may be waking up — please try again.'
          : message
      );
    }

    if (error instanceof Error) {
      return new Error(isProduction ? 'Something went wrong.' : error.message);
    }

    return new Error(isProduction ? 'Something went wrong.' : 'Unknown error');
  }

  /**
   * Convenience methods for HTTP requests
   */
  static async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getInstance().get(url, config);
    return response.data;
  }

  static async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getInstance().post(url, data, config);
    return response.data;
  }

  static async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getInstance().put(url, data, config);
    return response.data;
  }

  static async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getInstance().patch(url, data, config);
    return response.data;
  }

  static async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getInstance().delete(url, config);
    return response.data;
  }

  /**
   * Upload file with progress tracking
   */
  static async uploadFile<T = any>(
    url: string,
    file: FormData,
    onProgress?: (progressEvent: any) => void
  ): Promise<T> {
    const response = await this.getInstance().post(url, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
    return response.data;
  }
}

// Export default instance for backward compatibility
export const apiClient = ApiClient.getInstance();
