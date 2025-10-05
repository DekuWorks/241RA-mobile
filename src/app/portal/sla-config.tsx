import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface SLASettings {
  caseResponseTime: number; // hours
  caseResolutionTime: number; // hours
  urgentCaseResponseTime: number; // hours
  urgentCaseResolutionTime: number; // hours
  escalationTime: number; // hours
  notificationFrequency: number; // hours
  autoEscalation: boolean;
  weekendEscalation: boolean;
  holidayEscalation: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

interface SLAMetrics {
  averageResponseTime: number;
  averageResolutionTime: number;
  escalationRate: number;
  complianceRate: number;
  totalCases: number;
  overdueCases: number;
}

export default function SLAConfigurationScreen() {
  const [slaSettings, setSlaSettings] = useState<SLASettings>({
    caseResponseTime: 24,
    caseResolutionTime: 72,
    urgentCaseResponseTime: 4,
    urgentCaseResolutionTime: 24,
    escalationTime: 48,
    notificationFrequency: 8,
    autoEscalation: true,
    weekendEscalation: false,
    holidayEscalation: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });

  const [slaMetrics, setSlaMetrics] = useState<SLAMetrics>({
    averageResponseTime: 18.5,
    averageResolutionTime: 65.2,
    escalationRate: 12.3,
    complianceRate: 87.5,
    totalCases: 1247,
    overdueCases: 23,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSettings, setEditingSettings] = useState<Partial<SLASettings>>({});

  useEffect(() => {
    loadSLAData();
  }, []);

  const loadSLAData = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from the API
      console.log('[SLA] Loading SLA configuration and metrics...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('[SLA] SLA data loaded successfully');
    } catch (error) {
      console.error('[SLA] Failed to load SLA data:', error);
      Alert.alert('Error', 'Failed to load SLA configuration');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSLAData();
  };

  const handleSaveSettings = async () => {
    try {
      // In a real app, this would save to the API
      console.log('[SLA] Saving SLA settings:', editingSettings);
      
      setSlaSettings(prev => ({ ...prev, ...editingSettings }));
      setShowEditModal(false);
      setEditingSettings({});
      
      Alert.alert('Success', 'SLA settings updated successfully');
    } catch (error) {
      console.error('[SLA] Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save SLA settings');
    }
  };

  const openEditModal = (settings: Partial<SLASettings>) => {
    setEditingSettings(settings);
    setShowEditModal(true);
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

  const SLASettingCard = ({
    title,
    description,
    value,
    unit,
    onPress,
    color = colors.primary[600],
  }: {
    title: string;
    description: string;
    value: number | boolean;
    unit?: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={[styles.settingCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.settingHeader}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={[styles.settingValue, { color }]}>
          {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : `${value}${unit || ''}`}
        </Text>
      </View>
      <Text style={styles.settingDescription}>{description}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading SLA configuration...</Text>
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
        <Text style={styles.headerTitle}>SLA Configuration</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadSLAData}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* SLA Metrics Overview */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>SLA Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Average Response Time"
            value={`${slaMetrics.averageResponseTime}h`}
            subtitle={`Target: ${slaSettings.caseResponseTime}h`}
            color={slaMetrics.averageResponseTime <= slaSettings.caseResponseTime ? colors.success[600] : colors.warning[600]}
            icon="⚡"
            trend="down"
          />
          <MetricCard
            title="Average Resolution Time"
            value={`${slaMetrics.averageResolutionTime}h`}
            subtitle={`Target: ${slaSettings.caseResolutionTime}h`}
            color={slaMetrics.averageResolutionTime <= slaSettings.caseResolutionTime ? colors.success[600] : colors.warning[600]}
            icon="🎯"
            trend="down"
          />
          <MetricCard
            title="Compliance Rate"
            value={`${slaMetrics.complianceRate}%`}
            subtitle="SLA compliance"
            color={slaMetrics.complianceRate >= 90 ? colors.success[600] : colors.warning[600]}
            icon="📊"
            trend="up"
          />
          <MetricCard
            title="Escalation Rate"
            value={`${slaMetrics.escalationRate}%`}
            subtitle="Cases escalated"
            color={slaMetrics.escalationRate <= 15 ? colors.success[600] : colors.warning[600]}
            icon="🚨"
            trend="stable"
          />
          <MetricCard
            title="Total Cases"
            value={slaMetrics.totalCases}
            subtitle={`${slaMetrics.overdueCases} overdue`}
            color={colors.info[600]}
            icon="📋"
            trend="up"
          />
          <MetricCard
            title="Overdue Cases"
            value={slaMetrics.overdueCases}
            subtitle="Requiring attention"
            color={slaMetrics.overdueCases > 0 ? colors.error : colors.success[600]}
            icon="⏰"
            trend="down"
          />
        </View>
      </View>

      {/* SLA Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>SLA Timeframes</Text>
        
        <SLASettingCard
          title="Case Response Time"
          description="Maximum time to respond to new cases"
          value={slaSettings.caseResponseTime}
          unit=" hours"
          color={colors.info[600]}
          onPress={() => openEditModal({ caseResponseTime: slaSettings.caseResponseTime })}
        />
        
        <SLASettingCard
          title="Case Resolution Time"
          description="Maximum time to resolve cases"
          value={slaSettings.caseResolutionTime}
          unit=" hours"
          color={colors.warning[600]}
          onPress={() => openEditModal({ caseResolutionTime: slaSettings.caseResolutionTime })}
        />
        
        <SLASettingCard
          title="Urgent Case Response"
          description="Maximum time to respond to urgent cases"
          value={slaSettings.urgentCaseResponseTime}
          unit=" hours"
          color={colors.error}
          onPress={() => openEditModal({ urgentCaseResponseTime: slaSettings.urgentCaseResponseTime })}
        />
        
        <SLASettingCard
          title="Urgent Case Resolution"
          description="Maximum time to resolve urgent cases"
          value={slaSettings.urgentCaseResolutionTime}
          unit=" hours"
          color={colors.error}
          onPress={() => openEditModal({ urgentCaseResolutionTime: slaSettings.urgentCaseResolutionTime })}
        />
        
        <SLASettingCard
          title="Escalation Time"
          description="Time before cases are escalated"
          value={slaSettings.escalationTime}
          unit=" hours"
          color={colors.warning[600]}
          onPress={() => openEditModal({ escalationTime: slaSettings.escalationTime })}
        />
        
        <SLASettingCard
          title="Notification Frequency"
          description="How often to send SLA notifications"
          value={slaSettings.notificationFrequency}
          unit=" hours"
          color={colors.primary[600]}
          onPress={() => openEditModal({ notificationFrequency: slaSettings.notificationFrequency })}
        />
      </View>

      {/* Automation Settings */}
      <View style={styles.automationSection}>
        <Text style={styles.sectionTitle}>Automation Settings</Text>
        
        <SLASettingCard
          title="Auto Escalation"
          description="Automatically escalate cases that exceed SLA"
          value={slaSettings.autoEscalation}
          color={slaSettings.autoEscalation ? colors.success[600] : colors.gray[500]}
          onPress={() => openEditModal({ autoEscalation: !slaSettings.autoEscalation })}
        />
        
        <SLASettingCard
          title="Weekend Escalation"
          description="Include weekends in SLA calculations"
          value={slaSettings.weekendEscalation}
          color={slaSettings.weekendEscalation ? colors.success[600] : colors.gray[500]}
          onPress={() => openEditModal({ weekendEscalation: !slaSettings.weekendEscalation })}
        />
        
        <SLASettingCard
          title="Holiday Escalation"
          description="Include holidays in SLA calculations"
          value={slaSettings.holidayEscalation}
          color={slaSettings.holidayEscalation ? colors.success[600] : colors.gray[500]}
          onPress={() => openEditModal({ holidayEscalation: !slaSettings.holidayEscalation })}
        />
      </View>

      {/* Notification Settings */}
      <View style={styles.notificationSection}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        
        <SLASettingCard
          title="Email Notifications"
          description="Send SLA alerts via email"
          value={slaSettings.emailNotifications}
          color={slaSettings.emailNotifications ? colors.success[600] : colors.gray[500]}
          onPress={() => openEditModal({ emailNotifications: !slaSettings.emailNotifications })}
        />
        
        <SLASettingCard
          title="SMS Notifications"
          description="Send SLA alerts via SMS"
          value={slaSettings.smsNotifications}
          color={slaSettings.smsNotifications ? colors.success[600] : colors.gray[500]}
          onPress={() => openEditModal({ smsNotifications: !slaSettings.smsNotifications })}
        />
        
        <SLASettingCard
          title="Push Notifications"
          description="Send SLA alerts via push notifications"
          value={slaSettings.pushNotifications}
          color={slaSettings.pushNotifications ? colors.success[600] : colors.gray[500]}
          onPress={() => openEditModal({ pushNotifications: !slaSettings.pushNotifications })}
        />
      </View>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit SLA Setting</Text>
            
            {editingSettings.caseResponseTime !== undefined && (
              <>
                <Text style={styles.modalLabel}>Case Response Time (hours)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingSettings.caseResponseTime.toString()}
                  onChangeText={(text) => setEditingSettings({...editingSettings, caseResponseTime: parseInt(text) || 0})}
                  keyboardType="numeric"
                />
              </>
            )}
            
            {editingSettings.caseResolutionTime !== undefined && (
              <>
                <Text style={styles.modalLabel}>Case Resolution Time (hours)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingSettings.caseResolutionTime.toString()}
                  onChangeText={(text) => setEditingSettings({...editingSettings, caseResolutionTime: parseInt(text) || 0})}
                  keyboardType="numeric"
                />
              </>
            )}
            
            {editingSettings.urgentCaseResponseTime !== undefined && (
              <>
                <Text style={styles.modalLabel}>Urgent Case Response Time (hours)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingSettings.urgentCaseResponseTime.toString()}
                  onChangeText={(text) => setEditingSettings({...editingSettings, urgentCaseResponseTime: parseInt(text) || 0})}
                  keyboardType="numeric"
                />
              </>
            )}
            
            {editingSettings.urgentCaseResolutionTime !== undefined && (
              <>
                <Text style={styles.modalLabel}>Urgent Case Resolution Time (hours)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingSettings.urgentCaseResolutionTime.toString()}
                  onChangeText={(text) => setEditingSettings({...editingSettings, urgentCaseResolutionTime: parseInt(text) || 0})}
                  keyboardType="numeric"
                />
              </>
            )}
            
            {editingSettings.escalationTime !== undefined && (
              <>
                <Text style={styles.modalLabel}>Escalation Time (hours)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingSettings.escalationTime.toString()}
                  onChangeText={(text) => setEditingSettings({...editingSettings, escalationTime: parseInt(text) || 0})}
                  keyboardType="numeric"
                />
              </>
            )}
            
            {editingSettings.notificationFrequency !== undefined && (
              <>
                <Text style={styles.modalLabel}>Notification Frequency (hours)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingSettings.notificationFrequency.toString()}
                  onChangeText={(text) => setEditingSettings({...editingSettings, notificationFrequency: parseInt(text) || 0})}
                  keyboardType="numeric"
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveSettings}>
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  refreshButton: {
    padding: spacing.sm,
  },
  refreshButtonText: {
    fontSize: typography.sizes.lg,
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
  settingsSection: {
    padding: spacing.md,
  },
  automationSection: {
    padding: spacing.md,
  },
  notificationSection: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  settingCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  settingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    flex: 1,
  },
  settingValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: colors.gray[400],
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.gray[900],
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.gray[200],
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[700],
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: colors.primary[600],
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});
