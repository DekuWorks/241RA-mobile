import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { AdminService } from '../../services/admin';
import { AuthService } from '../../services/auth';
import { UserDataService } from '../../services/userData';
import { NotificationService } from '../../services/notifications';

interface AdminProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'moderator' | 'super_admin';
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  lastLoginAt?: string;
  loginCount: number;
  actionsPerformed: number;
  casesManaged: number;
  usersManaged: number;
}

interface AdminActivity {
  id: string;
  type: 'case_update' | 'user_action' | 'system_change' | 'data_export';
  description: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function AdminProfileScreen() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [recentActivity, setRecentActivity] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAdminProfile();
  }, []);

  const loadAdminProfile = async () => {
    try {
      setLoading(true);
      const [profileData, activityData] = await Promise.all([
        AdminService.getAdminProfile(),
        AdminService.getAdminActivity(),
      ]);
      setProfile(profileData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Failed to load admin profile:', error);
      Alert.alert('Error', 'Failed to load admin profile');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminProfile();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout from admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear all local data first
            await AuthService.logout();
            await UserDataService.clearUserData();
            await NotificationService.unregisterDevice();

            // Navigate to login and clear the navigation stack
            router.dismissAll();
            router.replace('/login');
          } catch (error) {
            console.error('Admin profile logout error:', error);
            // Even if there's an error, try to navigate to login
            router.dismissAll();
            router.replace('/login');
          }
        },
      },
    ]);
  };

  const StatCard = ({
    title,
    value,
    color = colors.primary[600],
  }: {
    title: string;
    value: number;
    color?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const PermissionBadge = ({ permission }: { permission: string }) => (
    <View style={styles.permissionBadge}>
      <Text style={styles.permissionText}>{permission}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading admin profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load admin profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAdminProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Admin Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {profile.firstName.charAt(0)}
            {profile.lastName.charAt(0)}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.adminName}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Text style={styles.adminEmail}>{profile.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(profile.role) }]}>
            <Text style={styles.roleText}>{profile.role.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Admin Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Admin Statistics</Text>
        <View style={styles.statsGrid}>
          <StatCard title="Cases Managed" value={profile.casesManaged} color={colors.info[500]} />
          <StatCard
            title="Users Managed"
            value={profile.usersManaged}
            color={colors.success[500]}
          />
          <StatCard
            title="Actions Performed"
            value={profile.actionsPerformed}
            color={colors.warning[500]}
          />
          <StatCard title="Login Count" value={profile.loginCount} color={colors.purple[500]} />
        </View>
      </View>

      {/* Permissions */}
      <View style={styles.permissionsSection}>
        <Text style={styles.sectionTitle}>Your Permissions</Text>
        <View style={styles.permissionsGrid}>
          {profile.permissions.map((permission, index) => (
            <PermissionBadge key={index} permission={permission} />
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/cases')}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>Manage Cases</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/users')}>
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionTitle}>Manage Users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/analytics')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/settings')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionTitle}>System Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/database')}
          >
            <Text style={styles.actionIcon}>🗄️</Text>
            <Text style={styles.actionTitle}>Database Tools</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/logs')}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionTitle}>System Logs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.map(activity => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Text>
                {activity.type === 'case_update'
                  ? '📋'
                  : activity.type === 'user_action'
                    ? '👤'
                    : activity.type === 'system_change'
                      ? '⚙️'
                      : activity.type === 'data_export'
                        ? '📤'
                        : '📝'}
              </Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <Text style={styles.activityTime}>
                {new Date(activity.timestamp).toLocaleString()}
              </Text>
              {activity.ipAddress && (
                <Text style={styles.activityMeta}>IP: {activity.ipAddress}</Text>
              )}
            </View>
          </View>
        ))}
        {recentActivity.length === 0 && <Text style={styles.emptyText}>No recent activity</Text>}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout from Admin Panel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'super_admin':
      return colors.error;
    case 'admin':
      return colors.warning[600];
    case 'moderator':
      return colors.info[600];
    default:
      return colors.gray[600];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  headerInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  adminEmail: {
    fontSize: typography.sizes.md,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  roleText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  statsSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
  },
  statTitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  permissionsSection: {
    padding: spacing.md,
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  permissionBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  permissionText: {
    fontSize: typography.sizes.sm,
    color: colors.primary[700],
    fontWeight: typography.weights.medium,
  },
  actionsSection: {
    padding: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
    textAlign: 'center',
  },
  activitySection: {
    padding: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  activityTime: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  activityMeta: {
    fontSize: typography.sizes.xs,
    color: colors.gray[400],
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
  logoutSection: {
    padding: spacing.md,
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
});
