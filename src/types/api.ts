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
export interface AxiosErrorResponse {
  response?: {
    status: number;
    data?: {
      message?: string;
      error?: string;
      code?: string;
    };
  };
  message?: string;
  config?: unknown;
  request?: unknown;
}

// Type guard function
export function isAxiosError(error: unknown): error is AxiosErrorResponse {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error &&
    typeof (error as any).response === 'object'
  );
}
