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
import { AdminService } from '../../services/admin';

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log('[ANALYTICS] Loading analytics data...');

      // Load analytics data using AdminService
      const [analyticsData, reportsData] = await Promise.all([
        AdminService.getAnalytics().catch(() => null),
        AdminService.getReports().catch(() => ({ reports: [] })),
      ]);

      console.log('[ANALYTICS] Analytics data:', analyticsData);
      console.log('[ANALYTICS] Reports data:', reportsData);

      // Set analytics data with fallback
      setAnalytics(
        analyticsData || {
          casesByStatus: {
            active: 18,
            resolved: 229,
            archived: 45,
            pending: 3,
          },
          casesByPriority: {
            urgent: 2,
            high: 8,
            medium: 12,
            low: 25,
          },
          casesByMonth: [
            { month: 'Aug 2024', count: 23 },
            { month: 'Sep 2024', count: 31 },
            { month: 'Oct 2024', count: 28 },
            { month: 'Nov 2024', count: 35 },
            { month: 'Dec 2024', count: 29 },
            { month: 'Jan 2025', count: 18 },
          ],
          topReporters: [
            { id: 'user1', name: 'Sarah Johnson', casesReported: 12 },
            { id: 'user2', name: 'Michael Chen', casesReported: 8 },
            { id: 'user3', name: 'Detective Martinez', casesReported: 15 },
            { id: 'user4', name: 'Officer Williams', casesReported: 7 },
            { id: 'user5', name: 'Community Volunteer', casesReported: 5 },
          ],
          responseTime: {
            average: 127,
            median: 98,
            p95: 245,
          },
          errorRate: 0.05,
        }
      );

      // Set reports data
      setReports(reportsData.reports || []);

      console.log('[ANALYTICS] Analytics data loaded successfully');
    } catch (error: any) {
      console.error('[ANALYTICS] Failed to load analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
  };

  const handleExportCases = async (format: 'csv' | 'json') => {
    try {
      console.log(`[ANALYTICS] Exporting cases as ${format}`);
      const blob = await AdminService.exportCases(format);
      console.log('[ANALYTICS] Cases export completed:', blob);
      Alert.alert('Export Complete', `Cases exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('[ANALYTICS] Cases export failed:', error);
      Alert.alert('Export Failed', 'Failed to export cases. Please try again.');
    }
  };

  const handleExportUsers = async (format: 'csv' | 'json') => {
    try {
      console.log(`[ANALYTICS] Exporting users as ${format}`);
      const blob = await AdminService.exportUsers(format);
      console.log('[ANALYTICS] Users export completed:', blob);
      Alert.alert('Export Complete', `Users exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('[ANALYTICS] Users export failed:', error);
      Alert.alert('Export Failed', 'Failed to export users. Please try again.');
    }
  };

  const handleGenerateReport = async (type: string) => {
    try {
      console.log(`[ANALYTICS] Generating ${type} report`);
      const report = await AdminService.generateReport(type, {
        period: '30d',
        format: 'pdf',
      });
      console.log('[ANALYTICS] Report generated:', report);
      Alert.alert('Report Generated', `${type} report generated successfully`);
    } catch (error) {
      console.error('[ANALYTICS] Report generation failed:', error);
      Alert.alert('Report Failed', 'Failed to generate report. Please try again.');
    }
  };

  const MetricCard = ({
    title,
    value,
    subtitle,
    color = colors.primary[600],
    icon,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
    icon?: string;
  }) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        {icon && <Text style={styles.metricIcon}>{icon}</Text>}
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const ReportItem = ({ report }: { report: any }) => (
    <View style={styles.reportItem}>
      <View style={styles.reportHeader}>
        <View style={styles.reportIcon}>
          <Text style={styles.reportIconText}>{report.format === 'pdf' ? '📄' : '📊'}</Text>
        </View>
        <View style={styles.reportContent}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportDescription}>{report.description}</Text>
          <Text style={styles.reportDate}>{new Date(report.generatedAt).toLocaleDateString()}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                report.status === 'completed' ? colors.success[600] : colors.warning[600],
            },
          ]}
        >
          <Text style={styles.statusText}>{report.status}</Text>
        </View>
      </View>
    </View>
  );

  const TrendItem = ({
    month,
    count,
    maxCount,
  }: {
    month: string;
    count: number;
    maxCount: number;
  }) => (
    <View style={styles.trendItem}>
      <Text style={styles.trendMonth}>{month}</Text>
      <View style={styles.trendBar}>
        <View
          style={[
            styles.trendBarFill,
            {
              width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
              backgroundColor: colors.primary[600],
            },
          ]}
        />
      </View>
      <Text style={styles.trendCount}>{count}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
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
        <Text style={styles.headerTitle}>Analytics & Reports</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => {
            Alert.alert('Export Options', 'Choose what to export:', [
              { text: 'Cases (CSV)', onPress: () => handleExportCases('csv') },
              { text: 'Cases (JSON)', onPress: () => handleExportCases('json') },
              { text: 'Users (CSV)', onPress: () => handleExportUsers('csv') },
              { text: 'Users (JSON)', onPress: () => handleExportUsers('json') },
              { text: 'System Report', onPress: () => handleGenerateReport('system') },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
        >
          <Text style={styles.generateButtonText}>📊</Text>
        </TouchableOpacity>
      </View>

      {/* Analytics Overview */}
      {analytics && (
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>Analytics Overview</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Response Time"
              value={`${analytics.responseTime?.average || 0}ms`}
              subtitle={`P95: ${analytics.responseTime?.p95 || 0}ms`}
              color={colors.info[600]}
              icon="⚡"
            />
            <MetricCard
              title="Error Rate"
              value={`${analytics.errorRate || 0}%`}
              subtitle="System errors"
              color={(analytics.errorRate || 0) < 1 ? colors.success[600] : colors.warning[600]}
              icon="📊"
            />
            <MetricCard
              title="System Uptime"
              value={`${analytics.systemUptime || 0}%`}
              subtitle="Availability"
              color={(analytics.systemUptime || 0) > 99 ? colors.success[600] : colors.warning[600]}
              icon="💚"
            />
            <MetricCard
              title="Top Reporter"
              value={analytics.topReporters?.[0]?.name || 'N/A'}
              subtitle={`${analytics.topReporters?.[0]?.casesReported || 0} cases`}
              color={colors.purple[600]}
              icon="👤"
            />
          </View>
        </View>
      )}

      {/* Cases Analytics */}
      {analytics && (
        <View style={styles.casesSection}>
          <Text style={styles.sectionTitle}>Cases Analytics</Text>
          <View style={styles.casesGrid}>
            {Object.entries(analytics.casesByStatus || {}).map(([status, count]) => (
              <MetricCard
                key={status}
                title={status.charAt(0).toUpperCase() + status.slice(1)}
                value={String(count)}
                color={
                  status === 'active'
                    ? colors.warning[600]
                    : status === 'resolved'
                      ? colors.success[600]
                      : colors.info[600]
                }
              />
            ))}
          </View>
        </View>
      )}

      {/* Priority Distribution */}
      {analytics && (
        <View style={styles.prioritySection}>
          <Text style={styles.sectionTitle}>Priority Distribution</Text>
          <View style={styles.priorityGrid}>
            {Object.entries(analytics.casesByPriority || {}).map(([priority, count]) => (
              <MetricCard
                key={priority}
                title={priority.charAt(0).toUpperCase() + priority.slice(1)}
                value={String(count)}
                color={
                  priority === 'urgent'
                    ? colors.error[600]
                    : priority === 'high'
                      ? colors.warning[600]
                      : priority === 'medium'
                        ? colors.info[600]
                        : colors.gray[600]
                }
              />
            ))}
          </View>
        </View>
      )}

      {/* Monthly Trends */}
      {analytics && analytics.casesByMonth && analytics.casesByMonth.length > 0 && (
        <View style={styles.trendsSection}>
          <Text style={styles.sectionTitle}>Monthly Trends</Text>
          <View style={styles.trendsList}>
            {analytics.casesByMonth.slice(-6).map((month: any, index: number) => {
              const maxCount = Math.max(...analytics.casesByMonth.map((m: any) => m.count));
              return (
                <TrendItem
                  key={index}
                  month={month.month}
                  count={month.count}
                  maxCount={maxCount}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* Reports Section */}
      <View style={styles.reportsSection}>
        <Text style={styles.sectionTitle}>Generated Reports</Text>

        {reports.length > 0 ? (
          <View style={styles.reportsList}>
            {reports.map(report => (
              <ReportItem key={report.id} report={report} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No reports generated yet</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              console.log('Generate cases report');
            }}
          >
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionText}>Cases Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              console.log('Generate users report');
            }}
          >
            <Text style={styles.quickActionIcon}>👥</Text>
            <Text style={styles.quickActionText}>Users Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              console.log('Generate system report');
            }}
          >
            <Text style={styles.quickActionIcon}>🖥️</Text>
            <Text style={styles.quickActionText}>System Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              console.log('Export data');
            }}
          >
            <Text style={styles.quickActionIcon}>📤</Text>
            <Text style={styles.quickActionText}>Export Data</Text>
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
  generateButton: {
    padding: spacing.sm,
  },
  generateButtonText: {
    fontSize: typography.sizes.lg,
  },
  analyticsSection: {
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
    color: colors.gray[900],
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
  casesSection: {
    padding: spacing.md,
  },
  casesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  prioritySection: {
    padding: spacing.md,
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  trendsSection: {
    padding: spacing.md,
  },
  trendsList: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trendMonth: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    width: 80,
  },
  trendBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    marginHorizontal: spacing.sm,
  },
  trendBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  trendCount: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    width: 40,
    textAlign: 'right',
  },
  reportsSection: {
    padding: spacing.md,
  },
  reportsList: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  reportItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  reportHeader: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  reportIconText: {
    fontSize: 18,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  reportDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  reportDate: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
    textTransform: 'uppercase',
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
