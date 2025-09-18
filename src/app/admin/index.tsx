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
import { FirebaseTestPanel } from '../../components/FirebaseTestPanel';

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  totalUsers: number;
  totalSightings: number;
  recentActivity: Array<{
    id: string;
    type: 'case_created' | 'sighting_reported' | 'case_resolved';
    message: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFirebaseTests, setShowFirebaseTests] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await AdminService.getDashboardStats();
      setStats(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
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

  const QuickActionButton = ({
    title,
    onPress,
    icon,
  }: {
    title: string;
    onPress: () => void;
    icon: string;
  }) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard title="Total Cases" value={stats?.totalCases || 0} />
        <StatCard
          title="Active Cases"
          value={stats?.activeCases || 0}
          color={colors.warning[500]}
        />
        <StatCard
          title="Resolved Cases"
          value={stats?.resolvedCases || 0}
          color={colors.success[500]}
        />
        <StatCard title="Total Users" value={stats?.totalUsers || 0} color={colors.info[500]} />
        <StatCard title="Sightings" value={stats?.totalSightings || 0} color={colors.purple[500]} />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickActionButton
            title="Manage Cases"
            icon="📋"
            onPress={() => router.push('/admin/cases')}
          />
          <QuickActionButton
            title="User Management"
            icon="👥"
            onPress={() => router.push('/admin/users')}
          />
          <QuickActionButton
            title="Analytics"
            icon="📊"
            onPress={() => router.push('/admin/analytics')}
          />
          <QuickActionButton
            title="Settings"
            icon="⚙️"
            onPress={() => router.push('/admin/settings')}
          />
          <QuickActionButton
            title="My Profile"
            icon="👤"
            onPress={() => router.push('/admin/profile')}
          />
          <QuickActionButton
            title="Database"
            icon="🗄️"
            onPress={() => router.push('/admin/database')}
          />
          <QuickActionButton
            title="System Logs"
            icon="📝"
            onPress={() => router.push('/admin/logs')}
          />
          <QuickActionButton
            title="Firebase Tests"
            icon="🔥"
            onPress={() => setShowFirebaseTests(!showFirebaseTests)}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {stats?.recentActivity?.map(activity => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Text>
                {activity.type === 'case_created'
                  ? '🆕'
                  : activity.type === 'sighting_reported'
                    ? '👁️'
                    : activity.type === 'case_resolved'
                      ? '✅'
                      : '📝'}
              </Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityMessage}>{activity.message}</Text>
              <Text style={styles.activityTime}>
                {new Date(activity.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
        {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
          <Text style={styles.emptyText}>No recent activity</Text>
        )}
      </View>

      {/* Firebase Test Panel */}
      {showFirebaseTests && (
        <View style={styles.section}>
          <FirebaseTestPanel />
        </View>
      )}
    </ScrollView>
  );
}

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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
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
  section: {
    margin: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
    textAlign: 'center',
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
  activityMessage: {
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  activityTime: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
