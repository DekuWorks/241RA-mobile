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
import { UserDataService } from '../services/userData';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const handleAdminLogin = async () => {
    // Input validation
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    // Password strength validation (minimum 6 characters)
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return;
    }

    // Two-factor code validation if required
    if (requiresTwoFactor && (!twoFactorCode || twoFactorCode.length !== 6)) {
      Alert.alert('Validation Error', 'Please enter a valid 6-digit two-factor code');
      return;
    }

    setIsLoading(true);
    try {
      const credentials: LoginCredentials = {
        email: email.toLowerCase().trim(), // Normalize email
        password,
        ...(requiresTwoFactor && twoFactorCode && { twoFactorCode: twoFactorCode.trim() }),
      };

      console.log('Attempting admin login with:', { email: credentials.email });

      // Test API connectivity first
      const apiUrl =
        process.env.EXPO_PUBLIC_API_URL || 'https://241runners-api-v2.azurewebsites.net';
      console.log('Using API URL:', apiUrl);
      try {
        const testResponse = await fetch(`${apiUrl}/api/health`);
        console.log('API connectivity test:', testResponse.status);
      } catch (connectError) {
        console.error('API connectivity test failed:', connectError);
      }

      const response = await AuthService.login(credentials);

      if (response.requiresTwoFactor && !requiresTwoFactor) {
        setRequiresTwoFactor(true);
        Alert.alert(
          'Two-Factor Authentication Required',
          'Please enter the 6-digit code from your authenticator app.',
          [{ text: 'OK' }]
        );
      } else {
        // Verify admin role after successful authentication
        console.log('Login successful, verifying admin role...');

        // Get user data from the response or fetch it separately
        let user = response.user;

        // If user data is not in the response, fetch it using getCurrentUser
        if (!user) {
          console.log('User data not in response, fetching current user...');
          try {
            user = (await AuthService.getCurrentUser()) || undefined;
            console.log('Fetched user data:', user);
          } catch (userError) {
            console.error('Failed to fetch user data:', userError);
            Alert.alert('Error', 'Failed to verify user permissions. Please try again.', [
              {
                text: 'OK',
                onPress: async () => {
                  await AuthService.logout();
                  router.replace('/login');
                },
              },
            ]);
            return;
          }
        }

        console.log('Current user data:', user);
        console.log('User role check:', {
          role: user?.role,
          allRoles: user?.allRoles,
          primaryUserRole: user?.primaryUserRole,
          isAdminUser: user?.isAdminUser,
          isAdmin: user?.role === 'admin',
          isModerator: user?.role === 'moderator',
          isSuperAdmin: user?.role === 'super_admin',
          hasAdminRole: user?.isAdminUser || user?.allRoles?.some((role: string) => ['admin', 'moderator', 'super_admin'].includes(role)),
          hasAccess:
            user &&
            (user.isAdminUser || 
             user.allRoles?.some((role: string) => ['admin', 'moderator', 'super_admin'].includes(role)) ||
             (user.role === 'admin' || user.role === 'moderator' || user.role === 'super_admin')),
        });

        const hasAdminAccess = user && 
          (user.isAdminUser || 
           user.allRoles?.some((role: string) => ['admin', 'moderator', 'super_admin'].includes(role)) ||
           (user.role === 'admin' || user.role === 'moderator' || user.role === 'super_admin'));

        if (hasAdminAccess) {
          console.log('Admin role verified, storing user data and navigating to portal...');

          try {
            // Store user data and navigate to admin portal
            await UserDataService.setUserData(user);
            console.log('User data stored successfully');

            // Test if we can access the portal
            console.log('Testing portal access...');
            const testUserData = await UserDataService.getUserData();
            console.log('Retrieved user data test:', testUserData);

            const displayRole = user.primaryUserRole || user.role || 'User';
            const adminRoles = user.allRoles?.filter((role: string) => ['admin', 'moderator', 'super_admin'].includes(role)) || [];
            const roleText = adminRoles.length > 0 ? `${displayRole} (Admin)` : displayRole;
            
            Alert.alert(
              'Admin Access Granted',
              `Welcome, ${user.name || user.email}! You have ${roleText} privileges.\n\nPortal access verified.`,
              [
                {
                  text: 'Enter Portal',
                  onPress: () => {
                    console.log('Navigating to portal...');
                    router.replace('/portal');
                  },
                },
              ]
            );
          } catch (storageError) {
            console.error('Failed to store user data:', storageError);
            Alert.alert('Storage Error', 'Failed to store user data. Please try again.', [
              {
                text: 'Retry',
                onPress: () => handleAdminLogin(),
              },
            ]);
          }
        } else {
          console.log('Access denied - insufficient privileges');
          console.log('User role:', user?.role, 'User object:', user);
          Alert.alert(
            'Access Denied',
            `You do not have admin privileges. Your role is: ${user?.role || 'unknown'}. Please contact your administrator for access.`,
            [
              {
                text: 'OK',
                onPress: async () => {
                  await AuthService.logout();
                  router.replace('/login');
                },
              },
            ]
          );
        }
      }
    } catch (error: any) {
      console.error('Admin login failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
        request: error.request,
      });

      let errorMessage = 'Login failed. Please try again.';

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const serverMessage = error.response.data?.message;

        console.log('Server response:', { status, serverMessage, data: error.response.data });

        switch (status) {
          case 400:
            errorMessage = serverMessage || 'Invalid email or password format';
            break;
          case 401:
            errorMessage = serverMessage || 'Invalid email or password';
            break;
          case 403:
            errorMessage = 'Account is disabled or restricted';
            break;
          case 404:
            errorMessage = 'Admin account not found';
            break;
          case 429:
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = serverMessage || `Login failed (Error ${status})`;
        }
      } else if (error.request) {
        // Network error
        console.log('Network error - no response received:', error.request);
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else {
        console.log('Other error:', error.message);
        errorMessage = `Login error: ${error.message}`;
      }

      Alert.alert('Login Failed', `${errorMessage}\n\nDebug: Check console logs for details.`);
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.adminIcon}>🔐</Text>
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>Administrator Access Required</Text>
        </View>

        <View style={styles.adminNotice}>
          <Text style={styles.noticeTitle}>⚠️ Admin Access Only</Text>
          <Text style={styles.noticeText}>
            This portal is restricted to authorized administrators only. Unauthorized access is
            prohibited and monitored.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Admin Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="admin@241runners.org"
              placeholderTextColor={colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Admin Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter admin password"
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
            style={[styles.adminButton, isLoading && styles.buttonDisabled]}
            onPress={handleAdminLogin}
            disabled={isLoading}
          >
            <Text style={styles.adminButtonText}>
              {isLoading ? 'Authenticating...' : '🔐 Access Admin Portal'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.replace('/login')}>
            <Text style={styles.linkText}>← Back to Regular Login</Text>
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
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: typography.sizes.md,
    color: colors.trafficLight.green,
    fontWeight: typography.weights.medium,
  },
  adminIcon: {
    fontSize: typography.sizes['4xl'],
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.trafficLight.green,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    color: colors.gray[400],
    textAlign: 'center',
  },
  adminNotice: {
    backgroundColor: colors.trafficLight.yellow + '20',
    borderWidth: 1,
    borderColor: colors.trafficLight.yellow,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  noticeTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.trafficLight.yellow,
    marginBottom: spacing.sm,
  },
  noticeText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[300],
    lineHeight: 20,
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
  adminButton: {
    backgroundColor: colors.trafficLight.red,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    shadowColor: colors.trafficLight.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: colors.gray[600],
  },
  adminButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[400],
  },
});
