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
import { AuthService, LoginCredentials } from '../services/auth';
import { AppleAuthService } from '../services/appleAuth';
import { GoogleAuthService } from '../services/googleAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[LOGIN] Attempting login with:', { email, passwordLength: password.length });
      
      const credentials: LoginCredentials = {
        email: email.toLowerCase().trim(),
        password,
        ...(requiresTwoFactor && twoFactorCode && { twoFactorCode }),
      };

      console.log('[LOGIN] Sending credentials to AuthService...');
      const response = await AuthService.login(credentials);
      console.log('[LOGIN] AuthService response:', response);

      if (response.requiresTwoFactor && !requiresTwoFactor) {
        setRequiresTwoFactor(true);
      } else {
        console.log('[LOGIN] User role from response:', response.user?.role);
        console.log('[LOGIN] Full user object:', response.user);
        
        if (response.user) {
          const userRole = response.user.role?.toLowerCase();
          console.log('[LOGIN] Normalized user role:', userRole);
          
          if (
            userRole === 'admin' || 
            userRole === 'moderator' || 
            userRole === 'super_admin'
          ) {
            console.log('[LOGIN] Redirecting to admin portal');
            router.replace('/portal');
          } else {
            console.log('[LOGIN] Redirecting to user profile');
            router.replace('/profile');
          }
        } else {
          console.log('[LOGIN] No user data, redirecting to profile');
          router.replace('/profile');
        }
      }
    } catch (error: any) {
      console.error('[LOGIN] Login error:', error);
      console.error('[LOGIN] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      let errorMessage = 'Invalid email or password';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 403) {
        errorMessage = 'Account is disabled or requires verification';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid credentials or account not found';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setEmail('test@example.com');
    setPassword('TestPassword123!');
    console.log('[LOGIN] Test credentials set');
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await AppleAuthService.signIn();

      if (result.success) {
        if (result.user) {
          if (
            result.user.role === 'admin' || 
            result.user.role === 'moderator' || 
            result.user.role === 'super_admin'
          ) {
            router.replace('/portal');
          } else {
            router.replace('/profile');
          }
        } else {
          router.replace('/profile');
        }
      } else {
        Alert.alert('Apple Login Failed', result.error || 'Failed to sign in with Apple');
      }
    } catch (error: any) {
      Alert.alert('Apple Login Failed', error.message || 'Failed to sign in with Apple');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await GoogleAuthService.signIn();

      if (result.success) {
        if (result.user) {
          if (
            result.user.role === 'admin' || 
            result.user.role === 'moderator' || 
            result.user.role === 'super_admin'
          ) {
            router.replace('/portal');
          } else {
            router.replace('/profile');
          }
        } else {
          router.replace('/profile');
        }
      } else {
        Alert.alert('Google Login Failed', result.error || 'Failed to sign in with Google');
      }
    } catch (error: any) {
      Alert.alert('Google Login Failed', error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>241Runners</Text>
          <Text style={styles.subtitle}>{"Sign in"}</Text>
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
            <Text style={styles.buttonText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => Alert.alert('Forgot Password', 'Password reset functionality coming soon!')}>
            <Text style={styles.linkText}>{"Forgot Password?"}</Text>
          </TouchableOpacity>
          
          <View style={styles.signupSection}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signupLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.adminLinkButton} onPress={() => router.push('/admin-login')}>
            <Text style={styles.adminLinkText}>Admin Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.oauthSection}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{"OR"}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <Text style={styles.googleIcon}>🔵</Text>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.appleButton, isLoading && styles.buttonDisabled]}
            onPress={handleAppleLogin}
            disabled={isLoading}
          >
            <Text style={styles.appleIcon}>🍎</Text>
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.text,
    opacity: 0.9,
  },
  form: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: colors.gray[600],
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
    color: colors.primary,
  },
  signupSection: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signupText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[400],
    marginBottom: spacing.xs,
  },
  signupLink: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  adminLinkButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  adminLinkText: {
    fontSize: typography.sizes.sm,
    color: '#DC2626',
    fontWeight: typography.weights.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  dividerText: {
    fontSize: typography.sizes.sm,
    color: '#FFFFFF',
    marginHorizontal: spacing.md,
  },
  oauthSection: {
    marginTop: spacing.xl,
    width: '100%',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[300],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: spacing.md,
  },
  googleIcon: {
    fontSize: typography.sizes.lg,
    marginRight: spacing.sm,
  },
  googleButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
  },
  appleButton: {
    backgroundColor: '#000000',
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  appleIcon: {
    fontSize: typography.sizes.lg,
    marginRight: spacing.sm,
    color: colors.white,
  },
  appleButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
});
