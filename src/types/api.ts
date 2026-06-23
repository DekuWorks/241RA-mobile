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
