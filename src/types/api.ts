/**
 * API Types and Interfaces
 *
 * Centralized type definitions for API requests and responses
 * to improve type safety and reduce 'any' usage
 */

// Common API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Error response structure
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request configuration
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// Axios error type guard
export interface ApiErrorBody {
  message?: string;
  error?: string | { code?: string; message?: string };
  code?: string;
}

export interface AxiosErrorResponse {
  response?: {
    status: number;
    data?: ApiErrorBody;
  };
  message?: string;
  config?: unknown;
  request?: unknown;
}

/** Extract a human-readable message from API error JSON */
export function extractApiErrorMessage(data: unknown, fallback = 'Server error'): string {
  if (!data || typeof data !== 'object') return fallback;

  const body = data as ApiErrorBody;

  if (typeof body.message === 'string' && body.message.trim()) {
    return body.message;
  }

  if (body.error && typeof body.error === 'object') {
    const nested = body.error;
    if (typeof nested.message === 'string' && nested.message.trim()) {
      return nested.message;
    }
    if (typeof nested.code === 'string') {
      return nested.code.replace(/_/g, ' ').toLowerCase();
    }
  }

  if (typeof body.error === 'string' && body.error.trim()) {
    return body.error;
  }

  return fallback;
}

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

export function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message =
    'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : '';
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';

  return code === 'ECONNABORTED' || message.includes('timeout');
}

/** Azure cold starts can surface as client timeouts or server 5xx after ~30s DB wake-up. */
export function isRetryableLoginError(error: unknown): boolean {
  if (isTimeoutError(error)) {
    return true;
  }

  if (error instanceof ApiRequestError && error.status >= 500) {
    return true;
  }

  return false;
}

const SERVER_UNAVAILABLE_MESSAGE =
  'The server is temporarily unavailable. It may still be starting up — please try again in a moment.';

/** Map login failures to user-facing copy without leaking raw server exceptions. */
export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    switch (error.status) {
      case 401:
        return 'Invalid email or password';
      case 403:
        return 'Account is disabled or requires verification';
      case 429:
        return 'Too many login attempts. Please try again later.';
      case 500:
      case 502:
      case 503:
      case 504:
        return SERVER_UNAVAILABLE_MESSAGE;
      default:
        if (
          error.message === 'An error occurred during login' ||
          error.code === 'INTERNAL_ERROR'
        ) {
          return SERVER_UNAVAILABLE_MESSAGE;
        }
        return error.message;
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('Network Error')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (isTimeoutError(error)) {
      return 'The server took too long to respond. Please check your connection and try again.';
    }
    if (error.message.includes('Failed to store') && error.message.includes('securely')) {
      return 'Could not save your session on this device. Try restarting the app and signing in again.';
    }
    if (!error.message.includes('[object Object]')) {
      return error.message;
    }
  }

  return 'Invalid email or password';
}

// Type guard function
export function isAxiosError(error: unknown): error is AxiosErrorResponse {
  if (error === null || typeof error !== 'object') {
    return false;
  }

  const axiosError = error as AxiosErrorResponse & { code?: string; request?: unknown };

  if (axiosError.response && typeof axiosError.response === 'object') {
    return true;
  }

  // Timeouts and network failures have a request but no response
  return axiosError.request !== undefined || axiosError.code === 'ECONNABORTED';
}
