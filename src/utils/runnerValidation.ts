import {
  CreateEnhancedRunnerProfileData,
  UpdateEnhancedRunnerProfileData,
  ValidationError,
  FormValidationResult,
} from '../types/enhancedRunnerProfile';

export class RunnerValidationUtils {
  /**
   * Validate first name
   */
  static validateFirstName(firstName: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!firstName || firstName.trim().length === 0) {
      errors.push({ field: 'firstName', message: 'First name is required' });
      return errors;
    }

    if (firstName.trim().length < 2) {
      errors.push({ field: 'firstName', message: 'First name must be at least 2 characters long' });
    }

    if (firstName.trim().length > 50) {
      errors.push({ field: 'firstName', message: 'First name must be less than 50 characters' });
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(firstName.trim())) {
      errors.push({
        field: 'firstName',
        message: 'First name can only contain letters, spaces, hyphens, and apostrophes',
      });
    }

    return errors;
  }

  /**
   * Validate last name
   */
  static validateLastName(lastName: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!lastName || lastName.trim().length === 0) {
      errors.push({ field: 'lastName', message: 'Last name is required' });
      return errors;
    }

    if (lastName.trim().length < 2) {
      errors.push({ field: 'lastName', message: 'Last name must be at least 2 characters long' });
    }

    if (lastName.trim().length > 50) {
      errors.push({ field: 'lastName', message: 'Last name must be less than 50 characters' });
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(lastName.trim())) {
      errors.push({
        field: 'lastName',
        message: 'Last name can only contain letters, spaces, hyphens, and apostrophes',
      });
    }

    return errors;
  }

  /**
   * Validate date of birth
   */
  static validateDateOfBirth(dateOfBirth: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!dateOfBirth || dateOfBirth.trim().length === 0) {
      errors.push({ field: 'dateOfBirth', message: 'Date of birth is required' });
      return errors;
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      errors.push({ field: 'dateOfBirth', message: 'Please enter a valid date' });
      return errors;
    }

    // Check if date is in the future
    if (birthDate > today) {
      errors.push({ field: 'dateOfBirth', message: 'Date of birth cannot be in the future' });
    }

    // Check if person is too old (over 120 years)
    const maxAge = 120;
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age > maxAge) {
      errors.push({ field: 'dateOfBirth', message: 'Please enter a valid birth date' });
    }

    // Check if person is too young (under 1 year)
    if (age < 1) {
      errors.push({ field: 'dateOfBirth', message: 'Age must be at least 1 year' });
    }

    return errors;
  }

  /**
   * Validate height
   */
  static validateHeight(height: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!height || height.trim().length === 0) {
      errors.push({ field: 'height', message: 'Height is required' });
      return errors;
    }

    const heightStr = height.trim().toLowerCase();

    // Check for feet and inches format (e.g., "5'8\"", "5 ft 8 in", "5'8")
    const feetInchesRegex = /^(\d+)'?\s*(\d+)?\s*(?:in|inch|inches)?\s*"?$/;
    // Check for metric format (e.g., "175cm", "175 cm", "1.75m")
    const metricRegex = /^(\d+(?:\.\d+)?)\s*(?:cm|m)$/;

    if (!feetInchesRegex.test(heightStr) && !metricRegex.test(heightStr)) {
      errors.push({
        field: 'height',
        message: 'Height must be in format like "5\'8\\"" or "175cm"',
      });
      return errors;
    }

    // Validate reasonable height ranges
    if (feetInchesRegex.test(heightStr)) {
      const match = heightStr.match(feetInchesRegex);
      if (match) {
        const feet = parseInt(match[1]);
        const inches = parseInt(match[2] || '0');

        if (feet < 3 || feet > 8) {
          errors.push({ field: 'height', message: 'Height must be between 3\'0" and 8\'0"' });
        }

        if (inches < 0 || inches > 11) {
          errors.push({ field: 'height', message: 'Inches must be between 0 and 11' });
        }
      }
    } else if (metricRegex.test(heightStr)) {
      const match = heightStr.match(metricRegex);
      if (match) {
        let value = parseFloat(match[1]);

        // Convert meters to cm if needed
        if (heightStr.includes('m') && !heightStr.includes('cm')) {
          value = value * 100;
        }

        if (value < 91 || value > 244) {
          // 3'0" to 8'0" in cm
          errors.push({ field: 'height', message: 'Height must be between 91cm and 244cm' });
        }
      }
    }

    return errors;
  }

  /**
   * Validate weight
   */
  static validateWeight(weight: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!weight || weight.trim().length === 0) {
      errors.push({ field: 'weight', message: 'Weight is required' });
      return errors;
    }

    const weightStr = weight.trim().toLowerCase();

    // Check for imperial format (e.g., "150 lbs", "150 pounds")
    const imperialRegex = /^(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)$/;
    // Check for metric format (e.g., "68 kg", "68kg")
    const metricRegex = /^(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)$/;

    if (!imperialRegex.test(weightStr) && !metricRegex.test(weightStr)) {
      errors.push({
        field: 'weight',
        message: 'Weight must be in format like "150 lbs" or "68 kg"',
      });
      return errors;
    }

    // Validate reasonable weight ranges
    if (imperialRegex.test(weightStr)) {
      const match = weightStr.match(imperialRegex);
      if (match) {
        const lbs = parseFloat(match[1]);

        if (lbs < 50 || lbs > 500) {
          errors.push({ field: 'weight', message: 'Weight must be between 50 and 500 lbs' });
        }
      }
    } else if (metricRegex.test(weightStr)) {
      const match = weightStr.match(metricRegex);
      if (match) {
        const kg = parseFloat(match[1]);

        if (kg < 23 || kg > 227) {
          // 50-500 lbs converted to kg
          errors.push({ field: 'weight', message: 'Weight must be between 23 and 227 kg' });
        }
      }
    }

    return errors;
  }

  /**
   * Validate eye color
   */
  static validateEyeColor(eyeColor: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!eyeColor || eyeColor.trim().length === 0) {
      errors.push({ field: 'eyeColor', message: 'Eye color is required' });
      return errors;
    }

    if (eyeColor.trim().length > 20) {
      errors.push({ field: 'eyeColor', message: 'Eye color must be less than 20 characters' });
    }

    const validEyeColors: string[] = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Other'];

    if (!validEyeColors.includes(eyeColor.trim())) {
      errors.push({ field: 'eyeColor', message: 'Please select a valid eye color' });
    }

    return errors;
  }

  /**
   * Validate medical conditions
   */
  static validateMedicalConditions(medicalConditions: string[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Medical conditions are optional, but if provided, validate each one
    if (medicalConditions && medicalConditions.length > 0) {
      if (medicalConditions.length > 10) {
        errors.push({
          field: 'medicalConditions',
          message: 'Maximum 10 medical conditions allowed',
        });
      }

      medicalConditions.forEach((condition, index) => {
        if (!condition || condition.trim().length === 0) {
          errors.push({
            field: `medicalConditions[${index}]`,
            message: 'Medical condition cannot be empty',
          });
        } else if (condition.trim().length > 100) {
          errors.push({
            field: `medicalConditions[${index}]`,
            message: 'Medical condition must be less than 100 characters',
          });
        }
      });
    }

    return errors;
  }

  /**
   * Validate additional notes
   */
  static validateAdditionalNotes(additionalNotes: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Additional notes are optional, but if provided, validate length
    if (additionalNotes && additionalNotes.length > 1000) {
      errors.push({
        field: 'additionalNotes',
        message: 'Additional notes must be less than 1000 characters',
      });
    }

    return errors;
  }

  /**
   * Validate complete runner profile data
   */
  static validateRunnerProfile(
    data: CreateEnhancedRunnerProfileData | UpdateEnhancedRunnerProfileData
  ): FormValidationResult {
    const errors: ValidationError[] = [];

    // Validate required fields for creation
    if ('firstName' in data && data.firstName) {
      errors.push(...this.validateFirstName(data.firstName));
    }
    if ('lastName' in data && data.lastName) {
      errors.push(...this.validateLastName(data.lastName));
    }
    if ('dateOfBirth' in data && data.dateOfBirth) {
      errors.push(...this.validateDateOfBirth(data.dateOfBirth));
    }
    if ('height' in data && data.height) {
      errors.push(...this.validateHeight(data.height));
    }
    if ('weight' in data && data.weight) {
      errors.push(...this.validateWeight(data.weight));
    }
    if ('eyeColor' in data && data.eyeColor) {
      errors.push(...this.validateEyeColor(data.eyeColor));
    }
    if ('medicalConditions' in data && data.medicalConditions) {
      errors.push(...this.validateMedicalConditions(data.medicalConditions));
    }
    if ('additionalNotes' in data && data.additionalNotes) {
      errors.push(...this.validateAdditionalNotes(data.additionalNotes));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format height for display
   */
  static formatHeight(height: string): string {
    return height.trim();
  }

  /**
   * Format weight for display
   */
  static formatWeight(weight: string): string {
    return weight.trim();
  }

  /**
   * Convert height to metric (cm)
   */
  static convertHeightToMetric(height: string): number {
    const heightStr = height.trim().toLowerCase();

    const feetInchesRegex = /^(\d+)'?\s*(\d+)?\s*(?:in|inch|inches)?\s*"?$/;
    const metricRegex = /^(\d+(?:\.\d+)?)\s*(?:cm|m)$/;

    if (feetInchesRegex.test(heightStr)) {
      const match = heightStr.match(feetInchesRegex);
      if (match) {
        const feet = parseInt(match[1]);
        const inches = parseInt(match[2] || '0');
        return feet * 30.48 + inches * 2.54;
      }
    } else if (metricRegex.test(heightStr)) {
      const match = heightStr.match(metricRegex);
      if (match) {
        let value = parseFloat(match[1]);
        if (heightStr.includes('m') && !heightStr.includes('cm')) {
          value = value * 100;
        }
        return value;
      }
    }

    return 0;
  }

  /**
   * Convert weight to metric (kg)
   */
  static convertWeightToMetric(weight: string): number {
    const weightStr = weight.trim().toLowerCase();

    const imperialRegex = /^(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)$/;
    const metricRegex = /^(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)$/;

    if (imperialRegex.test(weightStr)) {
      const match = weightStr.match(imperialRegex);
      if (match) {
        const lbs = parseFloat(match[1]);
        return lbs * 0.453592; // Convert lbs to kg
      }
    } else if (metricRegex.test(weightStr)) {
      const match = weightStr.match(metricRegex);
      if (match) {
        return parseFloat(match[1]);
      }
    }

    return 0;
  }
}
