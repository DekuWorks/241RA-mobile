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
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii, shadows } from '../theme/tokens';
import { AuthService, LoginCredentials } from '../services/auth';
import { isSecureStorageError } from '../services/secureTokens';
import { getLoginErrorMessage, isRetryableLoginError } from '../types/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Signing In...');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Connecting...');
    try {
      console.log('[LOGIN] Attempting login with:', { email, passwordLength: password.length });

      const credentials: LoginCredentials = {
        email: email.trim(),
        password,
        ...(requiresTwoFactor && twoFactorCode && { twoFactorCode }),
      };

      console.log('[LOGIN] Sending credentials to AuthService...');
      const response = await AuthService.login(credentials, {
        onConnecting: () => setLoadingMessage('Connecting...'),
        onRetrying: () => setLoadingMessage('Server waking up, retrying...'),
        onPersisting: () => setLoadingMessage('Saving session...'),
      });
      console.log('[LOGIN] AuthService response:', response);

      if (response.requiresTwoFactor && !requiresTwoFactor) {
        setRequiresTwoFactor(true);
      } else {
        console.log('[LOGIN] User role from response:', response.user?.role);
        console.log('[LOGIN] Full user object:', response.user);

        if (response.user) {
          console.log('[LOGIN] User data:', {
            role: response.user.role,
            allRoles: response.user.allRoles,
            primaryUserRole: response.user.primaryUserRole,
            isAdminUser: response.user.isAdminUser,
          });

          // Check if user has admin privileges using dual role system
          const hasAdminRole =
            response.user.isAdminUser ||
            response.user.allRoles?.some((role: string) =>
              ['admin', 'moderator', 'super_admin'].includes(role.toLowerCase())
            ) ||
            ['admin', 'moderator', 'super_admin'].includes(response.user.role?.toLowerCase());

          console.log('[LOGIN] Has admin role:', hasAdminRole);

          // For regular login, always go to profile first
          // Users can access admin portal through the profile screen if they have admin privileges
          console.log('[LOGIN] Redirecting to user profile');
          router.replace('/profile');
        } else {
          console.log('[LOGIN] No user data, redirecting to profile');
          router.replace('/profile');
        }
      }
    } catch (error: unknown) {
      if (__DEV__ && !isRetryableLoginError(error)) {
        console.warn('[LOGIN] Login error:', error);
      }

      if (isSecureStorageError(error)) {
        Alert.alert(
          'Session Storage Unavailable',
          'Your sign-in succeeded but this build cannot save your session securely. Rebuild the dev client with native modules included:\n\nnpx expo run:ios',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Login Failed', getLoginErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('Sign In');
    }
  };

  const handleTestLogin = async () => {
    setEmail('test@example.com');
    setPassword('TestPassword123!');
    console.log('[LOGIN] Test credentials set');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/241-logo.jpg')}
            style={styles.logo}
            accessibilityLabel="241 Runners Awareness logo"
          />
          <Text style={styles.title}>241 Runners Awareness</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.gray[400]}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {requiresTwoFactor && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Two-Factor Code</Text>
              <TextInput
                style={styles.input}
                value={twoFactorCode}
                onChangeText={setTwoFactorCode}
                placeholder="Enter 6-digit code"
                placeholderTextColor={colors.gray[400]}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color={colors.white} size="small" />
                <Text style={styles.buttonText}>{loadingMessage}</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              Alert.alert('Forgot Password', 'Password reset functionality coming soon!')
            }
          >
            <Text style={styles.linkText}>{'Forgot Password?'}</Text>
          </TouchableOpacity>

          <View style={styles.signupSection}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signupLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: spacing.xl,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.white,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.textOnPage,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.textOnPage,
    opacity: 0.95,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary[600],
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.button,
  },
  buttonDisabled: {
    backgroundColor: colors.gray[600],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: colors.primary[600],
  },
  signupSection: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signupText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  signupLink: {
    fontSize: typography.sizes.sm,
    color: colors.primary[600],
    fontWeight: typography.weights.semibold,
  },
});
