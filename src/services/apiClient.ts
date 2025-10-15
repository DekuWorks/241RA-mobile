import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ENV } from '../config/env';
import { SecureTokenService } from './secureTokens';
import { isAxiosError, AxiosErrorResponse } from '../types/api';

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
      timeout: 12000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to attach Bearer token
    instance.interceptors.request.use(
      async config => {
        const token = await SecureTokenService.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('[API] Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          hasToken: !!token,
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

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await SecureTokenService.getRefreshToken();
            if (refreshToken) {
              const response = await axios.post(`${ENV.API_URL}/api/v1/auth/refresh`, {
                refreshToken: refreshToken,
              });

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
        // Server responded with error status
        const status = axiosError.response.status;
        const message = axiosError.response.data?.message || axiosError.response.data?.error || 'Server error';

      if (isProduction) {
        // In production, provide generic error messages
        switch (status) {
          case 400:
            return new Error('Invalid request');
          case 401:
            return new Error('Authentication required');
          case 403:
            return new Error('Access denied');
          case 404:
            return new Error('Resource not found');
          case 500:
            return new Error('Server error. Please try again later.');
          default:
            return new Error('Something went wrong. Please try again.');
        }
      } else {
        // In development, provide detailed error messages
        return new Error(`${status}: ${message}`);
      }
    } else if (error.request) {
      // Network error
      return new Error(
        isProduction
          ? 'Network error. Please check your connection.'
          : 'Network error: ' + error.message
      );
    } else {
      // Other error
      return new Error(isProduction ? 'Something went wrong.' : error.message);
    }
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
