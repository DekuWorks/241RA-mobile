/**
 * Enhanced Runner Profile Types
 * These types match the backend API implementation exactly
 */

export interface EnhancedRunnerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string (YYYY-MM-DD)
  age: number; // Calculated from dateOfBirth
  height: string; // e.g., "5'8\"" or "175cm"
  weight: string; // e.g., "150 lbs" or "68 kg"
  eyeColor: EyeColor;
  medicalConditions: string[];
  additionalNotes: string;
  photos: EnhancedRunnerPhoto[];
  lastPhotoUpdate: string; // ISO date string
  reminderCount: number; // Number of reminders sent
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  isActive: boolean;
}

export interface EnhancedRunnerPhoto {
  id: string;
  runnerProfileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number; // in bytes
  mimeType: string;
  uploadedAt: string; // ISO date string
  isPrimary: boolean; // Main profile photo
}

export type EyeColor = 
  | 'Brown'
  | 'Blue' 
  | 'Green'
  | 'Hazel'
  | 'Gray'
  | 'Amber'
  | 'Other';

export interface CreateEnhancedRunnerProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD format
  height: string;
  weight: string;
  eyeColor: EyeColor;
  medicalConditions: string[];
  additionalNotes: string;
}

export interface UpdateEnhancedRunnerProfileData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  height?: string;
  weight?: string;
  eyeColor?: EyeColor;
  medicalConditions?: string[];
  additionalNotes?: string;
}

export interface PhotoUploadResponse {
  success: boolean;
  photo?: EnhancedRunnerPhoto;
  error?: string;
}

export interface PhotoUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface BulkPhotoUploadResponse {
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
  uploadedPhotos: EnhancedRunnerPhoto[];
  errors: string[];
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface PhotoUpdateReminder {
  id: string;
  runnerProfileId: string;
  reminderDate: string; // ISO date string
  reminderType: 'email' | 'push' | 'both';
  sentAt?: string; // ISO date string
  status: 'pending' | 'sent' | 'failed' | 'dismissed';
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface FileUploadResponse {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  message?: string;
}

// Photo management types
export interface PhotoMetadata {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  isPrimary: boolean;
  daysSinceUpdate: number;
  updateRequired: boolean;
}

export interface PhotoUploadOptions {
  maxPhotos: number;
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  quality: number; // 0-1 for image compression
}

export interface PhotoValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Statistics and analytics
export interface RunnerProfileStats {
  totalPhotos: number;
  primaryPhotoSet: boolean;
  daysSinceLastUpdate: number;
  reminderCount: number;
  profileCompleteness: number; // 0-100 percentage
  lastActivity: string; // ISO date string
}

export interface PhotoAnalytics {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  averageFileSize: number;
  mostCommonMimeType: string;
  uploadFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
}

// Form state management
export interface RunnerProfileFormState {
  profile: Partial<EnhancedRunnerProfile>;
  photos: EnhancedRunnerPhoto[];
  isEditing: boolean;
  isSaving: boolean;
  isUploading: boolean;
  uploadProgress: number;
  errors: ValidationError[];
  warnings: string[];
}

// API request/response types
export interface GetRunnerProfileResponse {
  profile: EnhancedRunnerProfile;
  stats: RunnerProfileStats;
  analytics: PhotoAnalytics;
}

export interface CreateRunnerProfileRequest {
  profile: CreateEnhancedRunnerProfileData;
  photos?: string[]; // Array of photo URIs to upload
}

export interface UpdateRunnerProfileRequest {
  profile: UpdateEnhancedRunnerProfileData;
  photosToAdd?: string[]; // Array of photo URIs to add
  photosToRemove?: string[]; // Array of photo IDs to remove
  primaryPhotoId?: string; // Photo ID to set as primary
}

// Error handling types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationErrorDetail {
  field: string;
  code: string;
  message: string;
  value?: any;
}

// Cache and state management
export interface RunnerProfileCache {
  profile: EnhancedRunnerProfile | null;
  photos: EnhancedRunnerPhoto[];
  settings: NotificationSettings;
  reminders: PhotoUpdateReminder[];
  lastUpdated: string;
  isStale: boolean;
}

// Photo processing types
export interface PhotoProcessingOptions {
  resize: boolean;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
}

export interface ProcessedPhoto {
  uri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dimensions: {
    width: number;
    height: number;
  };
}

// Constants
export const EYE_COLORS: EyeColor[] = [
  'Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Other'
];

export const REMINDER_FREQUENCIES: NotificationSettings['reminderFrequency'][] = [
  'daily', 'weekly', 'monthly'
];

export const DEFAULT_PHOTO_OPTIONS: PhotoUploadOptions = {
  maxPhotos: 10,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  quality: 0.8
};

export const PHOTO_UPDATE_THRESHOLD_DAYS = 180; // 6 months
