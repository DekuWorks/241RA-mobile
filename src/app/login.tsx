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
      const credentials: LoginCredentials = {
        email,
        password,
        ...(requiresTwoFactor && twoFactorCode && { twoFactorCode }),
      };

      const response = await AuthService.login(credentials);

      if (response.requiresTwoFactor && !requiresTwoFactor) {
        setRequiresTwoFactor(true);
      } else {
        // Login successful, navigate to main app
        router.replace('/');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await GoogleAuthService.signIn();
      
      if (result.success) {
        // Login successful, navigate to main app
        router.replace('/');
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
          <Text style={styles.subtitle}>Sign in to continue</Text>
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

          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Google Login Button */}
        <View style={styles.googleSection}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <Text style={styles.googleIcon}>🔍</Text>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Login Button */}
        <View style={styles.adminSection}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.adminButton} onPress={() => router.push('/admin-login')}>
            <Text style={styles.adminIcon}>🔐</Text>
            <Text style={styles.adminButtonText}>Admin Portal Access</Text>
            <Text style={styles.adminSubtext}>Sign in as Administrator</Text>
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
  linkButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  adminSection: {
    marginTop: spacing.xl,
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[700],
  },
  dividerText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[400],
    marginHorizontal: spacing.md,
  },
  googleSection: {
    marginTop: spacing.lg,
    width: '100%',
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  adminButton: {
    backgroundColor: colors.gray[800],
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  adminIcon: {
    fontSize: typography.sizes['2xl'],
    marginBottom: spacing.sm,
  },
  adminButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  adminSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.gray[400],
  },
});
