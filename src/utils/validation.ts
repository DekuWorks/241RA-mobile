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

  /**
   * Validate phone number
   */
  static validatePhoneNumber(phoneNumber: string): ValidationResult {
    const errors: string[] = [];

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      errors.push('Phone number is required');
      return { isValid: false, errors };
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    if (digitsOnly.length < 10) {
      errors.push('Phone number must be at least 10 digits');
    }

    if (digitsOnly.length > 15) {
      errors.push('Phone number is too long');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
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
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim();
  }
}
