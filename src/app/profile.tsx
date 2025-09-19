import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { AuthService, User } from '../services/auth';
import { NotificationService } from '../services/notifications';
import { APP_CONSTANTS } from '../config/constants';
import { TwoFactorSetup } from '../components/TwoFactorSetup';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user'],
    queryFn: AuthService.getCurrentUser,
  });

  useEffect(() => {
    if (user) {
      setTwoFactorEnabled(user.twoFactorEnabled);
    }
  }, [user]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AuthService.logout();
          await NotificationService.unregisterDevice();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      await NotificationService.registerDevice();
    } else {
      await NotificationService.unregisterDevice();
    }
  };

  const handleToggleTwoFactor = async (value: boolean) => {
    try {
      if (value) {
        // Show 2FA setup modal
        setShowTwoFactorSetup(true);
      } else {
        // Disable 2FA
        Alert.alert(
          'Disable 2FA',
          'Enter your current 2FA code to disable two-factor authentication',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                try {
                  // Prompt for 2FA code
                  Alert.prompt(
                    'Enter 2FA Code',
                    'Enter your current 2FA code to disable two-factor authentication',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Disable',
                        style: 'destructive',
                        onPress: async (code) => {
                          if (code && code.length === 6) {
                            await AuthService.disableTwoFactor(code);
                            setTwoFactorEnabled(false);
                            Alert.alert('Success', 'Two-factor authentication has been disabled');
                          } else {
                            Alert.alert('Error', 'Please enter a valid 6-digit code');
                          }
                        },
                      },
                    ],
                    'plain-text',
                    '',
                    'numeric'
                  );
                } catch (error) {
                  Alert.alert('Error', 'Failed to disable two-factor authentication');
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update two-factor authentication settings');
    }
  };

  const handleTwoFactorSetupSuccess = () => {
    setTwoFactorEnabled(true);
    Alert.alert('Success', 'Two-factor authentication has been enabled successfully');
  };

  const handleTestNotification = async () => {
    await NotificationService.testNotification();
    Alert.alert('Test Sent', 'A test notification has been sent');
  };

  const renderProfileSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Profile</Text>
      <View style={styles.profileInfo}>
        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Name</Text>
          <Text style={styles.profileValue}>{user?.name || 'Not provided'}</Text>
        </View>
        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Email</Text>
          <Text style={styles.profileValue}>{user?.email}</Text>
        </View>
        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Role</Text>
          <Text style={styles.profileValue}>{user?.role || 'User'}</Text>
        </View>
        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Email Verified</Text>
          <Text
            style={[
              styles.profileValue,
              { color: user?.isEmailVerified ? colors.success : colors.error },
            ]}
          >
            {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSecuritySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
          <Text style={styles.settingDescription}>
            Add an extra layer of security to your account
          </Text>
        </View>
        <Switch
          value={twoFactorEnabled}
          onValueChange={handleToggleTwoFactor}
          trackColor={{ false: colors.gray[600], true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>
    </View>
  );

  const renderNotificationsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Text style={styles.settingDescription}>
            Receive notifications for new cases and updates
          </Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleToggleNotifications}
          trackColor={{ false: colors.gray[600], true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>
      <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
        <Text style={styles.testButtonText}>Send Test Notification</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAdminSection = () => {
    // Only show admin section if user has admin role
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin')}>
          <Text style={styles.menuItemText}>Admin Dashboard</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/cases')}>
          <Text style={styles.menuItemText}>Manage Cases</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/users')}>
          <Text style={styles.menuItemText}>Manage Users</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/analytics')}>
          <Text style={styles.menuItemText}>Analytics</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleOpenURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const renderAppSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>App</Text>
      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuItemText}>About</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => handleOpenURL(APP_CONSTANTS.PRIVACY_POLICY_URL)}
      >
        <Text style={styles.menuItemText}>Privacy Policy</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => handleOpenURL(APP_CONSTANTS.TERMS_OF_SERVICE_URL)}
      >
        <Text style={styles.menuItemText}>Terms of Service</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => handleOpenURL(APP_CONSTANTS.SUPPORT_URL)}
      >
        <Text style={styles.menuItemText}>Support</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderProfileSection()}
        {renderAdminSection()}
        {renderSecuritySection()}
        {renderNotificationsSection()}
        {renderAppSection()}
      </View>
      
      <TwoFactorSetup
        visible={showTwoFactorSetup}
        onClose={() => setShowTwoFactorSetup(false)}
        onSuccess={handleTwoFactorSetupSuccess}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.gray[900],
  },
  backButtonText: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  logoutText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    fontWeight: typography.weights.medium,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  profileInfo: {
    backgroundColor: colors.gray[900],
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[800],
  },
  profileLabel: {
    fontSize: typography.sizes.base,
    color: colors.gray[400],
    fontWeight: typography.weights.medium,
  },
  profileValue: {
    fontSize: typography.sizes.base,
    color: colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[900],
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.sizes.base,
    color: colors.text,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[400],
    lineHeight: 18,
  },
  testButton: {
    backgroundColor: colors.gray[800],
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  testButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[900],
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  menuItemText: {
    fontSize: typography.sizes.base,
    color: colors.text,
  },
  menuItemArrow: {
    fontSize: typography.sizes.lg,
    color: colors.gray[400],
  },
});
