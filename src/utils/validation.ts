export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationUtils {
  /**
   * Validate email address
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email || email.trim().length === 0) {
      errors.push('Email is required');
      return { isValid: false, errors };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please enter a valid email address');
    }

    if (email.length > 254) {
      errors.push('Email address is too long');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static readonly PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
  static readonly PROFILE_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  /**
   * Validate US phone number (10 digits, optional leading 1)
   */
  static validatePhoneNumber(phoneNumber: string): ValidationResult {
    const errors: string[] = [];

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      errors.push('Phone number is required');
      return { isValid: false, errors };
    }

    const digitsOnly = phoneNumber.replace(/\D/g, '');

    if (digitsOnly.length === 11 && digitsOnly[0] === '1') {
      if (!/^[2-9]\d{9}$/.test(digitsOnly.slice(1))) {
        errors.push('Please enter a valid US phone number');
      }
    } else if (digitsOnly.length === 10) {
      if (!/^[2-9]\d{9}$/.test(digitsOnly)) {
        errors.push('Please enter a valid US phone number');
      }
    } else {
      errors.push('Phone number must be 10 digits (US format)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate profile image file name and size before upload
   */
  static validateProfileImage(
    fileName: string,
    fileSizeBytes?: number
  ): ValidationResult {
    const errors: string[] = [];
    const ext = fileName.includes('.')
      ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
      : '.jpg';

    if (!this.PROFILE_IMAGE_EXTENSIONS.includes(ext)) {
      errors.push('Image must be JPG, PNG, GIF, or WebP');
    }

    if (fileSizeBytes !== undefined && fileSizeBytes > this.PROFILE_IMAGE_MAX_BYTES) {
      errors.push('Image must be smaller than 5MB');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate name (first name or last name)
   */
  static validateName(name: string, fieldName: string = 'Name'): ValidationResult {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }

    if (name.trim().length < 2) {
      errors.push(`${fieldName} must be at least 2 characters long`);
    }

    if (name.trim().length > 50) {
      errors.push(`${fieldName} is too long (maximum 50 characters)`);
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name.trim())) {
      errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate address fields
   */
  static validateAddress(address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (address.street && address.street.trim().length > 100) {
      errors.push('Street address is too long');
    }

    if (address.city && address.city.trim().length > 50) {
      errors.push('City name is too long');
    }

    if (address.state && address.state.trim().length > 50) {
      errors.push('State name is too long');
    }

    if (address.zipCode) {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(address.zipCode.trim())) {
        errors.push('Please enter a valid ZIP code (12345 or 12345-6789)');
      }
    }

    if (address.country && address.country.trim().length > 50) {
      errors.push('Country name is too long');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate emergency contact
   */
  static validateEmergencyContact(contact: {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  }): ValidationResult {
    const errors: string[] = [];

    // Validate name
    const nameValidation = this.validateName(contact.name, 'Contact name');
    if (!nameValidation.isValid) {
      errors.push(...nameValidation.errors);
    }

    // Validate relationship
    if (!contact.relationship || contact.relationship.trim().length === 0) {
      errors.push('Relationship is required');
    } else if (contact.relationship.trim().length > 50) {
      errors.push('Relationship is too long');
    }

    // Validate phone number
    const phoneValidation = this.validatePhoneNumber(contact.phoneNumber);
    if (!phoneValidation.isValid) {
      errors.push(...phoneValidation.errors);
    }

    // Validate email if provided
    if (contact.email && contact.email.trim().length > 0) {
      const emailValidation = this.validateEmail(contact.email);
      if (!emailValidation.isValid) {
        errors.push(...emailValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phoneNumber: string): string {
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    if (digitsOnly.length === 10) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    } else if (digitsOnly.length === 11 && digitsOnly[0] === '1') {
      return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
    }

    return phoneNumber; // Return original if not standard format
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .trim();
  }

  /**
   * Validate password (matches API auth/register rules)
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (password.length > 128) {
      errors.push('Password is too long (max 128 characters)');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate sighting report before API submission
   */
  static validateSighting(data: {
    caseId?: string;
    description: string;
    latitude: number;
    longitude: number;
    confidence?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (!data.caseId?.trim()) {
      errors.push('Case ID is required');
    }

    const description = data.description?.trim() ?? '';
    if (!description) {
      errors.push('Description is required');
    } else if (description.length < 10) {
      errors.push('Description must be at least 10 characters');
    } else if (description.length > 2000) {
      errors.push('Description cannot exceed 2000 characters');
    }

    if (Number.isNaN(data.latitude) || data.latitude < -90 || data.latitude > 90) {
      errors.push('Valid latitude is required');
    }

    if (Number.isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180) {
      errors.push('Valid longitude is required');
    }

    if (data.confidence && !['low', 'medium', 'high'].includes(data.confidence)) {
      errors.push('Confidence must be low, medium, or high');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate case report before API submission
   */
  static validateCase(data: {
    individualId?: string;
    title: string;
    description?: string;
    lastSeenLocation: string;
    latitude?: number;
    longitude?: number;
  }): ValidationResult {
    const errors: string[] = [];

    if (!data.individualId?.trim()) {
      errors.push('A runner profile is required. Please create one in your profile first.');
    } else if (!/^ind_\d+$/.test(data.individualId.trim())) {
      errors.push('Invalid runner profile ID');
    }

    const title = data.title?.trim() ?? '';
    if (!title) {
      errors.push('Title is required');
    } else if (title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }

    const description = data.description?.trim() ?? '';
    if (description.length > 2000) {
      errors.push('Description cannot exceed 2000 characters');
    }

    const location = data.lastSeenLocation?.trim() ?? '';
    if (!location) {
      errors.push('Last seen location is required');
    } else if (location.length > 500) {
      errors.push('Location is too long (max 500 characters)');
    }

    if (data.latitude !== undefined && (Number.isNaN(data.latitude) || data.latitude < -90 || data.latitude > 90)) {
      errors.push('Valid latitude is required');
    }

    if (data.longitude !== undefined && (Number.isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180)) {
      errors.push('Valid longitude is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate profile update payload before API submission
   */
  static validateProfileUpdate(data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (data.firstName !== undefined) {
      const first = this.validateName(data.firstName, 'First name');
      if (!first.isValid) errors.push(...first.errors);
    }

    if (data.lastName !== undefined) {
      const last = this.validateName(data.lastName, 'Last name');
      if (!last.isValid) errors.push(...last.errors);
    }

    if (data.phoneNumber !== undefined) {
      const phone = this.validatePhoneNumber(data.phoneNumber);
      if (!phone.isValid) errors.push(...phone.errors);
    }

    return { isValid: errors.length === 0, errors };
  }
}
