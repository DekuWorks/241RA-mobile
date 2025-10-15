import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { AuthService } from '../services/auth';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
}

export default function SignupScreen() {
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<SignupFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<SignupFormData> = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s\-']+$/.test(formData.firstName)) {
      newErrors.firstName = 'Only letters, spaces, hyphens, and apostrophes allowed';
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s\-']+$/.test(formData.lastName)) {
      newErrors.lastName = 'Only letters, spaces, hyphens, and apostrophes allowed';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (
      formData.email.includes('..') ||
      formData.email.startsWith('.') ||
      formData.email.endsWith('.')
    ) {
      newErrors.email = 'Email format is invalid';
    }

    // Phone validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, '');
      if (!/^[\+]?[1-9][\d]{9,14}$/.test(cleanPhone)) {
        newErrors.phoneNumber = 'Please enter a valid phone number (10-15 digits)';
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character (@$!%*?&)';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    setIsLoading(true);
    try {
      const signupData = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
        phoneNumber: formData.phoneNumber.trim(),
        organization: null,
        title: null,
      };

      const response = await AuthService.signup(signupData);

      if (response.success) {
        Alert.alert(
          'Account Created Successfully!',
          `Welcome to 241 Runners Awareness, ${response.user?.firstName || 'User'}! Your account has been created and you can now access all features.`,
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to login page for user to sign in
                router.replace('/login');
              },
            },
          ]
        );
      } else {
        Alert.alert('Signup Failed', response.message || 'An error occurred during registration');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'An error occurred during registration';
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const roles = [
    { value: 'user', label: 'General User' },
    { value: 'parent', label: 'Parent/Guardian' },
    { value: 'caregiver', label: 'Caregiver' },
    { value: 'aba_therapist', label: 'ABA Therapist' },
    { value: 'adoptive_parent', label: 'Adoptive Parent' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>241Runners</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              value={formData.firstName}
              onChangeText={value => updateFormData('firstName', value)}
              placeholder="Enter your first name"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              value={formData.lastName}
              onChangeText={value => updateFormData('lastName', value)}
              placeholder="Enter your last name"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={value => updateFormData('email', value)}
              placeholder="Enter your email"
              placeholderTextColor={colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phoneNumber && styles.inputError]}
              value={formData.phoneNumber}
              onChangeText={value => updateFormData('phoneNumber', value)}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.gray[400]}
              keyboardType="phone-pad"
              autoCorrect={false}
            />
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={formData.password}
              onChangeText={value => updateFormData('password', value)}
              placeholder="Create a strong password"
              placeholderTextColor={colors.gray[400]}
              secureTextEntry
              autoCapitalize="none"
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your Role *</Text>
            <View style={styles.roleContainer}>
              {roles.map(role => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleButton,
                    formData.role === role.value && styles.roleButtonSelected,
                  ]}
                  onPress={() => updateFormData('role', role.value)}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      formData.role === role.value && styles.roleButtonTextSelected,
                    ]}
                  >
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>Sign in here</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    color: colors.gray[400],
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray[800],
    borderWidth: 1,
    borderColor: colors.gray[700],
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  roleContainer: {
    gap: spacing.sm,
  },
  roleButton: {
    backgroundColor: colors.gray[800],
    borderWidth: 1,
    borderColor: colors.gray[700],
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  roleButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleButtonText: {
    fontSize: typography.sizes.base,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  roleButtonTextSelected: {
    color: colors.white,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: colors.gray[600],
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  loginSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    fontSize: typography.sizes.base,
    color: colors.gray[400],
    marginBottom: spacing.sm,
  },
  loginLink: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
});
