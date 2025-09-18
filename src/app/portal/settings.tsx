import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Switch,
  Picker,
} from 'react-native';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { AdminService, PortalSettings, SystemConfiguration } from '../../services/admin';

export default function PortalSettingsScreen() {
  const [settings, setSettings] = useState<PortalSettings | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'appearance' | 'features' | 'integrations' | 'system'>('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [settingsData, systemData] = await Promise.all([
        AdminService.getPortalSettings(),
        AdminService.getSystemConfiguration(),
      ]);
      setSettings(settingsData);
      setSystemConfig(systemData);
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await AdminService.updatePortalSettings(settings);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const defaultSettings = await AdminService.resetPortalSettings();
              setSettings(defaultSettings);
              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  const handleClearCache = async (cacheType?: string) => {
    Alert.alert(
      'Clear Cache',
      `This will clear the ${cacheType || 'all'} cache. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              await AdminService.clearCache(cacheType as any);
              Alert.alert('Success', 'Cache cleared successfully');
              loadSettings();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  };

  const TabButton = ({ id, title, icon }: { id: string; title: string; icon: string }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === id && styles.activeTab]}
      onPress={() => setActiveTab(id as any)}
    >
      <Text style={[styles.tabIcon, activeTab === id && styles.activeTabText]}>{icon}</Text>
      <Text style={[styles.tabText, activeTab === id && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  );

  const SettingRow = ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <View style={styles.settingControl}>{children}</View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load settings</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portal Settings</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.savingButton]}
            onPress={handleSaveSettings}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabButton id="general" title="General" icon="⚙️" />
          <TabButton id="security" title="Security" icon="🔒" />
          <TabButton id="appearance" title="Appearance" icon="🎨" />
          <TabButton id="features" title="Features" icon="🚀" />
          <TabButton id="integrations" title="Integrations" icon="🔌" />
          <TabButton id="system" title="System" icon="🖥️" />
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'general' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>General Settings</Text>
            
            <SettingRow title="Site Name" description="The name of your portal">
              <TextInput
                style={styles.textInput}
                value={settings.general.siteName}
                onChangeText={(text) =>
                  setSettings({ ...settings, general: { ...settings.general, siteName: text } })
                }
                placeholder="Site Name"
              />
            </SettingRow>

            <SettingRow title="Site Description" description="Brief description of your portal">
              <TextInput
                style={styles.textAreaInput}
                value={settings.general.siteDescription}
                onChangeText={(text) =>
                  setSettings({ ...settings, general: { ...settings.general, siteDescription: text } })
                }
                placeholder="Site Description"
                multiline
                numberOfLines={3}
              />
            </SettingRow>

            <SettingRow title="Timezone" description="Default timezone for the portal">
              <Picker
                selectedValue={settings.general.timezone}
                style={styles.picker}
                onValueChange={(value) =>
                  setSettings({ ...settings, general: { ...settings.general, timezone: value } })
                }
              >
                <Picker.Item label="Eastern Time" value="America/New_York" />
                <Picker.Item label="Central Time" value="America/Chicago" />
                <Picker.Item label="Mountain Time" value="America/Denver" />
                <Picker.Item label="Pacific Time" value="America/Los_Angeles" />
                <Picker.Item label="UTC" value="UTC" />
              </Picker>
            </SettingRow>

            <SettingRow title="Maintenance Mode" description="Enable maintenance mode to restrict access">
              <Switch
                value={settings.general.maintenanceMode}
                onValueChange={(value) =>
                  setSettings({ ...settings, general: { ...settings.general, maintenanceMode: value } })
                }
              />
            </SettingRow>

            <SettingRow title="Allow Registration" description="Allow new users to register">
              <Switch
                value={settings.general.allowRegistration}
                onValueChange={(value) =>
                  setSettings({ ...settings, general: { ...settings.general, allowRegistration: value } })
                }
              />
            </SettingRow>

            <SettingRow title="Require Email Verification" description="Require email verification for new users">
              <Switch
                value={settings.general.requireEmailVerification}
                onValueChange={(value) =>
                  setSettings({ ...settings, general: { ...settings.general, requireEmailVerification: value } })
                }
              />
            </SettingRow>
          </View>
        )}

        {activeTab === 'security' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Security Settings</Text>
            
            <SettingRow title="Session Timeout" description="Session timeout in minutes">
              <TextInput
                style={styles.numberInput}
                value={settings.security.sessionTimeout.toString()}
                onChangeText={(text) =>
                  setSettings({ ...settings, security: { ...settings.security, sessionTimeout: parseInt(text) || 30 } })
                }
                keyboardType="numeric"
                placeholder="30"
              />
            </SettingRow>

            <SettingRow title="Max Login Attempts" description="Maximum failed login attempts before lockout">
              <TextInput
                style={styles.numberInput}
                value={settings.security.maxLoginAttempts.toString()}
                onChangeText={(text) =>
                  setSettings({ ...settings, security: { ...settings.security, maxLoginAttempts: parseInt(text) || 5 } })
                }
                keyboardType="numeric"
                placeholder="5"
              />
            </SettingRow>

            <SettingRow title="Lockout Duration" description="Lockout duration in minutes">
              <TextInput
                style={styles.numberInput}
                value={settings.security.lockoutDuration.toString()}
                onChangeText={(text) =>
                  setSettings({ ...settings, security: { ...settings.security, lockoutDuration: parseInt(text) || 15 } })
                }
                keyboardType="numeric"
                placeholder="15"
              />
            </SettingRow>

            <SettingRow title="Require Two-Factor Authentication" description="Require 2FA for all users">
              <Switch
                value={settings.security.requireTwoFactor}
                onValueChange={(value) =>
                  setSettings({ ...settings, security: { ...settings.security, requireTwoFactor: value } })
                }
              />
            </SettingRow>

            <SettingRow title="Minimum Password Length" description="Minimum password length">
              <TextInput
                style={styles.numberInput}
                value={settings.security.passwordMinLength.toString()}
                onChangeText={(text) =>
                  setSettings({ ...settings, security: { ...settings.security, passwordMinLength: parseInt(text) || 8 } })
                }
                keyboardType="numeric"
                placeholder="8"
              />
            </SettingRow>

            <SettingRow title="Require Special Characters" description="Require special characters in passwords">
              <Switch
                value={settings.security.passwordRequireSpecialChars}
                onValueChange={(value) =>
                  setSettings({ ...settings, security: { ...settings.security, passwordRequireSpecialChars: value } })
                }
              />
            </SettingRow>

            <SettingRow title="API Rate Limit" description="API requests per minute">
              <TextInput
                style={styles.numberInput}
                value={settings.security.apiRateLimit.toString()}
                onChangeText={(text) =>
                  setSettings({ ...settings, security: { ...settings.security, apiRateLimit: parseInt(text) || 100 } })
                }
                keyboardType="numeric"
                placeholder="100"
              />
            </SettingRow>
          </View>
        )}

        {activeTab === 'appearance' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Appearance Settings</Text>
            
            <SettingRow title="Theme" description="Default theme for the portal">
              <Picker
                selectedValue={settings.appearance.theme}
                style={styles.picker}
                onValueChange={(value) =>
                  setSettings({ ...settings, appearance: { ...settings.appearance, theme: value } })
                }
              >
                <Picker.Item label="Light" value="light" />
                <Picker.Item label="Dark" value="dark" />
                <Picker.Item label="Auto" value="auto" />
              </Picker>
            </SettingRow>

            <SettingRow title="Primary Color" description="Primary color for the portal">
              <TextInput
                style={styles.textInput}
                value={settings.appearance.primaryColor}
                onChangeText={(text) =>
                  setSettings({ ...settings, appearance: { ...settings.appearance, primaryColor: text } })
                }
                placeholder="#2563eb"
              />
            </SettingRow>

            <SettingRow title="Secondary Color" description="Secondary color for the portal">
              <TextInput
                style={styles.textInput}
                value={settings.appearance.secondaryColor}
                onChangeText={(text) =>
                  setSettings({ ...settings, appearance: { ...settings.appearance, secondaryColor: text } })
                }
                placeholder="#64748b"
              />
            </SettingRow>

            <SettingRow title="Logo URL" description="URL to the portal logo">
              <TextInput
                style={styles.textInput}
                value={settings.appearance.logoUrl}
                onChangeText={(text) =>
                  setSettings({ ...settings, appearance: { ...settings.appearance, logoUrl: text } })
                }
                placeholder="https://example.com/logo.png"
              />
            </SettingRow>

            <SettingRow title="Favicon URL" description="URL to the portal favicon">
              <TextInput
                style={styles.textInput}
                value={settings.appearance.faviconUrl}
                onChangeText={(text) =>
                  setSettings({ ...settings, appearance: { ...settings.appearance, faviconUrl: text } })
                }
                placeholder="https://example.com/favicon.ico"
              />
            </SettingRow>

            <SettingRow title="Custom CSS" description="Custom CSS for the portal">
              <TextInput
                style={styles.textAreaInput}
                value={settings.appearance.customCss}
                onChangeText={(text) =>
                  setSettings({ ...settings, appearance: { ...settings.appearance, customCss: text } })
                }
                placeholder="/* Custom CSS */"
                multiline
                numberOfLines={5}
              />
            </SettingRow>
          </View>
        )}

        {activeTab === 'features' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Feature Settings</Text>
            
            <SettingRow title="Enable Analytics" description="Enable analytics tracking">
              <Switch
                value={settings.features.enableAnalytics}
                onValueChange={(value) =>
                  setSettings({ ...settings, features: { ...settings.features, enableAnalytics: value } })
                }
              />
            </SettingRow>

            <SettingRow title="Enable Reports" description="Enable report generation">
              <Switch
                value={settings.features.enableReports}
                onValueChange={(value) =>
                  setSettings({ ...settings, features: { ...settings.features, enableReports: value } })
                }
              />
            </SettingRow>

            <SettingRow title="Enable Backups" description="Enable automatic backups">
              <Switch
                value={settings.features.enableBackups}
                onValueChange={(value) =>
                  setSettings({ ...settings, features: { ...settings.features, enableBackups: value } })
                }
              />
            </SettingRow>

            <SettingRow title="Enable Logging" description="Enable system logging">
              <Switch
                value={settings.features.enableLogging}
                onValueChange={(value) =>
                  setSettings({ ...settings, features: { ...settings.features, enableLogging: value } })
                }
              />
            </SettingRow>

            <SettingRow title="Enable Audit Trail" description="Enable audit trail tracking">
              <Switch
                value={settings.features.enableAuditTrail}
                onValueChange={(value) =>
                  setSettings({ ...settings, features: { ...settings.features, enableAuditTrail: value } })
                }
              />
            </SettingRow>

            <SettingRow title="Enable API Access" description="Enable API access">
              <Switch
                value={settings.features.enableApiAccess}
                onValueChange={(value) =>
                  setSettings({ ...settings, features: { ...settings.features, enableApiAccess: value } })
                }
              />
            </SettingRow>
          </View>
        )}

        {activeTab === 'integrations' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Integration Settings</Text>
            
            <SettingRow title="Google Maps API Key" description="API key for Google Maps integration">
              <TextInput
                style={styles.textInput}
                value={settings.integrations.googleMapsApiKey}
                onChangeText={(text) =>
                  setSettings({ ...settings, integrations: { ...settings.integrations, googleMapsApiKey: text } })
                }
                placeholder="AIza..."
                secureTextEntry
              />
            </SettingRow>

            <SettingRow title="Email Provider" description="Email service provider">
              <Picker
                selectedValue={settings.integrations.emailProvider}
                style={styles.picker}
                onValueChange={(value) =>
                  setSettings({ ...settings, integrations: { ...settings.integrations, emailProvider: value } })
                }
              >
                <Picker.Item label="SMTP" value="smtp" />
                <Picker.Item label="SendGrid" value="sendgrid" />
                <Picker.Item label="Mailgun" value="mailgun" />
              </Picker>
            </SettingRow>

            <SettingRow title="SMTP Host" description="SMTP server hostname">
              <TextInput
                style={styles.textInput}
                value={settings.integrations.smtpHost}
                onChangeText={(text) =>
                  setSettings({ ...settings, integrations: { ...settings.integrations, smtpHost: text } })
                }
                placeholder="smtp.gmail.com"
              />
            </SettingRow>

            <SettingRow title="SMTP Port" description="SMTP server port">
              <TextInput
                style={styles.numberInput}
                value={settings.integrations.smtpPort.toString()}
                onChangeText={(text) =>
                  setSettings({ ...settings, integrations: { ...settings.integrations, smtpPort: parseInt(text) || 587 } })
                }
                keyboardType="numeric"
                placeholder="587"
              />
            </SettingRow>

            <SettingRow title="SMTP Username" description="SMTP authentication username">
              <TextInput
                style={styles.textInput}
                value={settings.integrations.smtpUsername}
                onChangeText={(text) =>
                  setSettings({ ...settings, integrations: { ...settings.integrations, smtpUsername: text } })
                }
                placeholder="username"
              />
            </SettingRow>

            <SettingRow title="SMTP Password" description="SMTP authentication password">
              <TextInput
                style={styles.textInput}
                value={settings.integrations.smtpPassword}
                onChangeText={(text) =>
                  setSettings({ ...settings, integrations: { ...settings.integrations, smtpPassword: text } })
                }
                placeholder="password"
                secureTextEntry
              />
            </SettingRow>

            <SettingRow title="SMTP Encryption" description="SMTP encryption type">
              <Picker
                selectedValue={settings.integrations.smtpEncryption}
                style={styles.picker}
                onValueChange={(value) =>
                  setSettings({ ...settings, integrations: { ...settings.integrations, smtpEncryption: value } })
                }
              >
                <Picker.Item label="None" value="none" />
                <Picker.Item label="TLS" value="tls" />
                <Picker.Item label="SSL" value="ssl" />
              </Picker>
            </SettingRow>
          </View>
        )}

        {activeTab === 'system' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>System Information</Text>
            
            {systemConfig && (
              <>
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Server Information</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Version:</Text>
                    <Text style={styles.infoValue}>{systemConfig.serverInfo.version}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Uptime:</Text>
                    <Text style={styles.infoValue}>
                      {Math.floor(systemConfig.serverInfo.uptime / (1000 * 60 * 60))} hours
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Memory Usage:</Text>
                    <Text style={styles.infoValue}>{systemConfig.serverInfo.memoryUsage} MB</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>CPU Usage:</Text>
                    <Text style={styles.infoValue}>{systemConfig.serverInfo.cpuUsage}%</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Disk Usage:</Text>
                    <Text style={styles.infoValue}>{systemConfig.serverInfo.diskUsage} MB</Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Database Information</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Version:</Text>
                    <Text style={styles.infoValue}>{systemConfig.databaseInfo.version}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Size:</Text>
                    <Text style={styles.infoValue}>{systemConfig.databaseInfo.size}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Connections:</Text>
                    <Text style={styles.infoValue}>{systemConfig.databaseInfo.connections}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Last Backup:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(systemConfig.databaseInfo.lastBackup).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Cache Information</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Enabled:</Text>
                    <Text style={styles.infoValue}>{systemConfig.cacheInfo.enabled ? 'Yes' : 'No'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type:</Text>
                    <Text style={styles.infoValue}>{systemConfig.cacheInfo.type}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Hit Rate:</Text>
                    <Text style={styles.infoValue}>{systemConfig.cacheInfo.hitRate}%</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Memory Usage:</Text>
                    <Text style={styles.infoValue}>{systemConfig.cacheInfo.memoryUsage} MB</Text>
                  </View>
                </View>
              </>
            )}

            <Text style={styles.sectionTitle}>System Actions</Text>
            
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleClearCache()}
              >
                <Text style={styles.actionButtonIcon}>🗑️</Text>
                <Text style={styles.actionButtonText}>Clear All Cache</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleClearCache('users')}
              >
                <Text style={styles.actionButtonIcon}>👥</Text>
                <Text style={styles.actionButtonText}>Clear User Cache</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleClearCache('cases')}
              >
                <Text style={styles.actionButtonIcon}>📋</Text>
                <Text style={styles.actionButtonText}>Clear Case Cache</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleClearCache('settings')}
              >
                <Text style={styles.actionButtonIcon}>⚙️</Text>
                <Text style={styles.actionButtonText}>Clear Settings Cache</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error[600],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  savingButton: {
    backgroundColor: colors.gray[400],
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  resetButton: {
    backgroundColor: colors.warning[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  resetButtonText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  tabsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  tabIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray[600],
  },
  activeTabText: {
    color: colors.primary[600],
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  settingControl: {
    minWidth: 100,
    alignItems: 'flex-end',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radii.sm,
    padding: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.gray[900],
    minWidth: 200,
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radii.sm,
    padding: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.gray[900],
    minWidth: 200,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radii.sm,
    padding: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.gray[900],
    minWidth: 80,
    textAlign: 'center',
  },
  picker: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radii.sm,
    minWidth: 150,
  },
  infoCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoCardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    fontWeight: typography.weights.medium,
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
    fontWeight: typography.weights.semibold,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
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
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
    textAlign: 'center',
  },
});