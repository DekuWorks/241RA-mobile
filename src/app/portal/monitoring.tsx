import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { RealtimeSyncService } from '../../services/realtimeSync';
import { AdminService } from '../../services/admin';

interface SystemMetrics {
  systemHealth: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  lastBackup: string;
}

interface AdminActivity {
  id: string;
  adminName: string;
  action: string;
  timestamp: string;
  details: string;
}

interface OnlineAdmin {
  id: string;
  name: string;
  role: string;
  lastSeen: string;
  isActive: boolean;
}

export default function SystemMonitoringScreen() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [adminActivities, setAdminActivities] = useState<AdminActivity[]>([]);
  const [onlineAdmins, setOnlineAdmins] = useState<OnlineAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMonitoringData();
    initializeRealtimeUpdates();
  }, []);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      console.log('[MONITORING] Loading monitoring data...');

      // Mock data for now - in production this would come from API
      const mockMetrics: SystemMetrics = {
        systemHealth: 'healthy',
        uptime: 99.8,
        responseTime: 127,
        errorRate: 0.05,
        memoryUsage: 72,
        cpuUsage: 38,
        activeConnections: 156,
        lastBackup: new Date().toISOString(),
      };

      const mockActivities: AdminActivity[] = [
        {
          id: '1',
          adminName: 'Marcus Brown',
          action: 'User Management',
          timestamp: new Date().toISOString(),
          details: 'Updated user permissions for 3 accounts',
        },
        {
          id: '2',
          adminName: 'Admin User',
          action: 'System Configuration',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          details: 'Modified notification settings',
        },
        {
          id: '3',
          adminName: 'Marcus Brown',
          action: 'Database Operations',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: 'Performed database backup',
        },
      ];

      const mockOnlineAdmins: OnlineAdmin[] = [
        {
          id: '1',
          name: 'Marcus Brown',
          role: 'super_admin',
          lastSeen: new Date().toISOString(),
          isActive: true,
        },
        {
          id: '2',
          name: 'Admin User',
          role: 'admin',
          lastSeen: new Date(Date.now() - 300000).toISOString(),
          isActive: false,
        },
      ];

      setMetrics(mockMetrics);
      setAdminActivities(mockActivities);
      setOnlineAdmins(mockOnlineAdmins);

      console.log('[MONITORING] Monitoring data loaded successfully');
    } catch (error: any) {
      console.error('[MONITORING] Failed to load monitoring data:', error);
      Alert.alert('Error', 'Failed to load monitoring data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initializeRealtimeUpdates = async () => {
    try {
      // Initialize real-time updates for monitoring
      await RealtimeSyncService.initializeAdminSync();
      console.log('[MONITORING] Real-time monitoring initialized');
    } catch (error) {
      console.warn('[MONITORING] Real-time monitoring initialization failed:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMonitoringData();
  };

  const handleGenerateSystemReport = async () => {
    try {
      console.log('[MONITORING] Generating system report');
      const report = await AdminService.generateReport('system', {
        period: '7d',
        format: 'pdf',
        includeMetrics: true,
        includeActivities: true,
      });
      console.log('[MONITORING] System report generated:', report);
      Alert.alert('Report Generated', 'System report generated successfully');
    } catch (error) {
      console.error('[MONITORING] System report generation failed:', error);
      Alert.alert('Report Failed', 'Failed to generate system report. Please try again.');
    }
  };

  const MetricCard = ({
    title,
    value,
    subtitle,
    color = colors.primary[600],
    icon,
    trend,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
    icon?: string;
    trend?: 'up' | 'down' | 'stable';
  }) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        {icon && <Text style={styles.metricIcon}>{icon}</Text>}
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
        {trend && (
          <Text style={styles.metricTrend}>
            {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'}
          </Text>
        )}
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const ActivityItem = ({ activity }: { activity: AdminActivity }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <Text style={styles.activityIconText}>
          {activity.action.includes('User') ? '👤' : 
           activity.action.includes('System') ? '⚙️' : 
           activity.action.includes('Database') ? '🗄️' : '📝'}
        </Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.action}</Text>
        <Text style={styles.activityDescription}>{activity.details}</Text>
        <Text style={styles.activityMeta}>
          {activity.adminName} • {new Date(activity.timestamp).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const AdminItem = ({ admin }: { admin: OnlineAdmin }) => (
    <View style={styles.adminItem}>
      <View style={styles.adminAvatar}>
        <Text style={styles.adminAvatarText}>
          {admin.name.split(' ').map(n => n[0]).join('')}
        </Text>
      </View>
      <View style={styles.adminContent}>
        <Text style={styles.adminName}>{admin.name}</Text>
        <Text style={styles.adminRole}>{admin.role.replace('_', ' ').toUpperCase()}</Text>
        <Text style={styles.adminLastSeen}>
          {admin.isActive ? '🟢 Online' : `Last seen: ${new Date(admin.lastSeen).toLocaleTimeString()}`}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading monitoring data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Monitoring</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.reportButton} onPress={handleGenerateSystemReport}>
            <Text style={styles.reportButtonText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={loadMonitoringData}>
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* System Health Status */}
      {metrics && (
        <View style={styles.statusSection}>
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor:
                  metrics.systemHealth === 'healthy'
                    ? colors.success[50]
                    : metrics.systemHealth === 'warning'
                      ? colors.warning[50]
                      : colors.error[50],
              },
            ]}
          >
            <Text style={styles.statusIcon}>
              {metrics.systemHealth === 'healthy' ? '💚' : 
               metrics.systemHealth === 'warning' ? '⚠️' : '🔴'}
            </Text>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                System Status: {metrics.systemHealth?.toUpperCase() || 'UNKNOWN'}
              </Text>
              <Text style={styles.statusSubtitle}>
                Uptime: {metrics.uptime || 0}% • Last Backup: {new Date(metrics.lastBackup).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* System Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>System Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Response Time"
            value={`${metrics?.responseTime || 0}ms`}
            color={metrics?.responseTime < 200 ? colors.success[600] : colors.warning[600]}
            icon="⚡"
            trend="stable"
          />
          <MetricCard
            title="Error Rate"
            value={`${metrics?.errorRate || 0}%`}
            color={metrics?.errorRate < 1 ? colors.success[600] : colors.warning[600]}
            icon="📊"
            trend="down"
          />
          <MetricCard
            title="Memory Usage"
            value={`${metrics?.memoryUsage || 0}%`}
            color={metrics?.memoryUsage < 80 ? colors.success[600] : colors.warning[600]}
            icon="💾"
            trend="up"
          />
          <MetricCard
            title="CPU Usage"
            value={`${metrics?.cpuUsage || 0}%`}
            color={metrics?.cpuUsage < 80 ? colors.success[600] : colors.warning[600]}
            icon="🖥️"
            trend="stable"
          />
          <MetricCard
            title="Active Connections"
            value={metrics?.activeConnections || 0}
            color={colors.info[600]}
            icon="🔗"
            trend="up"
          />
          <MetricCard
            title="System Uptime"
            value={`${metrics?.uptime || 0}%`}
            color={colors.primary[600]}
            icon="⏱️"
            trend="stable"
          />
        </View>
      </View>

      {/* Online Admins */}
      <View style={styles.adminsSection}>
        <Text style={styles.sectionTitle}>Online Admins</Text>
        {onlineAdmins.length > 0 ? (
          <View style={styles.adminsList}>
            {onlineAdmins.map((admin) => (
              <AdminItem key={admin.id} admin={admin} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No admin activity</Text>
          </View>
        )}
      </View>

      {/* Recent Admin Activities */}
      <View style={styles.activitiesSection}>
        <Text style={styles.sectionTitle}>Recent Admin Activities</Text>
        {adminActivities.length > 0 ? (
          <View style={styles.activitiesList}>
            {adminActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent activities</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/portal/logs')}
          >
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionText}>View Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/portal/analytics')}
          >
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/portal/settings')}
          >
            <Text style={styles.quickActionIcon}>⚙️</Text>
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={loadMonitoringData}
          >
            <Text style={styles.quickActionIcon}>🔄</Text>
            <Text style={styles.quickActionText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.sizes.md,
    color: colors.primary[600],
    fontWeight: typography.weights.medium,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reportButton: {
    padding: spacing.sm,
  },
  reportButtonText: {
    fontSize: typography.sizes.lg,
  },
  refreshButton: {
    padding: spacing.sm,
  },
  refreshButtonText: {
    fontSize: typography.sizes.lg,
  },
  statusSection: {
    padding: spacing.md,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  statusIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  statusSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  metricsSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
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
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metricIcon: {
    fontSize: typography.sizes.md,
    marginRight: spacing.xs,
  },
  metricValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  metricTrend: {
    fontSize: typography.sizes.sm,
  },
  metricTitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  metricSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  adminsSection: {
    padding: spacing.md,
  },
  adminsList: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  adminItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  adminAvatarText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  adminContent: {
    flex: 1,
  },
  adminName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  adminRole: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  adminLastSeen: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  activitiesSection: {
    padding: spacing.md,
  },
  activitiesList: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
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
  activityIconText: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  activityDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  activityMeta: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  emptyState: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: typography.sizes.md,
    color: colors.gray[500],
  },
  quickActionsSection: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '22%',
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
  quickActionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  quickActionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
    textAlign: 'center',
  },
});
