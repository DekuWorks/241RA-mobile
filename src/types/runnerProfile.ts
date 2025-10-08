export interface RunnerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  age?: number; // Calculated from dateOfBirth
  height: string; // e.g., "5'8\"" or "175cm"
  weight: string; // e.g., "150 lbs" or "68 kg"
  eyeColor: EyeColor;
  medicalConditions: string[];
  additionalNotes: string;
  photos: RunnerPhoto[];
  lastPhotoUpdate: string; // ISO date string
  reminderCount: number; // Number of reminders sent
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface RunnerPhoto {
  id: string;
  runnerProfileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number; // in bytes
  mimeType: string;
  uploadedAt: string;
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

export interface CreateRunnerProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  height: string;
  weight: string;
  eyeColor: EyeColor;
  medicalConditions: string[];
  additionalNotes: string;
}

export interface UpdateRunnerProfileData {
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
  photo?: RunnerPhoto;
  error?: string;
}

export interface PhotoUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface PhotoUpdateReminder {
  id: string;
  runnerProfileId: string;
  reminderDate: string;
  reminderType: 'email' | 'push' | 'both';
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
