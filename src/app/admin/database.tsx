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
} from 'react-native';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { AdminService } from '../../services/admin';

interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  databaseSize: string;
  lastBackup: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

interface DatabaseTable {
  name: string;
  recordCount: number;
  size: string;
  lastModified: string;
}

interface BackupInfo {
  id: string;
  filename: string;
  size: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'in_progress';
}

export default function DatabaseManagementScreen() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      const [statsData, tablesData, backupsData] = await Promise.all([
        AdminService.getDatabaseStats(),
        AdminService.getDatabaseTables(),
        AdminService.getDatabaseBackups(),
      ]);
      setStats(statsData);
      setTables(tablesData);
      setBackups(backupsData);
    } catch (error) {
      console.error('Failed to load database info:', error);
      Alert.alert('Error', 'Failed to load database information');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDatabaseInfo();
    setRefreshing(false);
  };

  const handleCreateBackup = async () => {
    try {
      Alert.alert('Create Backup', 'Are you sure you want to create a database backup?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Backup',
          onPress: async () => {
            await AdminService.createDatabaseBackup();
            Alert.alert('Success', 'Database backup created successfully');
            await loadDatabaseInfo();
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to create backup:', error);
      Alert.alert('Error', 'Failed to create database backup');
    }
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a query');
      return;
    }

    try {
      Alert.alert(
        'Execute Query',
        'Are you sure you want to execute this query? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Execute',
            style: 'destructive',
            onPress: async () => {
              const result = await AdminService.executeDatabaseQuery(query);
              Alert.alert('Query Result', JSON.stringify(result, null, 2));
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to execute query:', error);
      Alert.alert('Error', 'Failed to execute query');
    }
  };

  const StatCard = ({
    title,
    value,
    color = colors.primary[600],
  }: {
    title: string;
    value: string | number;
    color?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading database information...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Database Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Database Statistics</Text>
        <View style={styles.statsGrid}>
          <StatCard title="Total Tables" value={stats?.totalTables || 0} color={colors.info[500]} />
          <StatCard
            title="Total Records"
            value={stats?.totalRecords || 0}
            color={colors.success[500]}
          />
          <StatCard
            title="Database Size"
            value={stats?.databaseSize || '0 MB'}
            color={colors.warning[500]}
          />
          <StatCard
            title="Connection"
            value={stats?.connectionStatus || 'unknown'}
            color={
              stats?.connectionStatus === 'connected' ? colors.success[500] : colors.error[500]
            }
          />
        </View>
        <Text style={styles.lastBackupText}>Last Backup: {stats?.lastBackup || 'Never'}</Text>
      </View>

      {/* Database Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Database Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCreateBackup}>
            <Text style={styles.actionIcon}>💾</Text>
            <Text style={styles.actionTitle}>Create Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => AdminService.optimizeDatabase()}
          >
            <Text style={styles.actionIcon}>⚡</Text>
            <Text style={styles.actionTitle}>Optimize DB</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => AdminService.repairDatabase()}
          >
            <Text style={styles.actionIcon}>🔧</Text>
            <Text style={styles.actionTitle}>Repair DB</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => AdminService.clearCache()}>
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={styles.actionTitle}>Clear Cache</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SQL Query Interface */}
      <View style={styles.querySection}>
        <Text style={styles.sectionTitle}>SQL Query Interface</Text>
        <TextInput
          style={styles.queryInput}
          placeholder="Enter SQL query here..."
          value={query}
          onChangeText={setQuery}
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.gray[500]}
        />
        <TouchableOpacity
          style={[styles.executeButton, !query.trim() && styles.disabledButton]}
          onPress={handleExecuteQuery}
          disabled={!query.trim()}
        >
          <Text style={styles.executeButtonText}>Execute Query</Text>
        </TouchableOpacity>
      </View>

      {/* Database Tables */}
      <View style={styles.tablesSection}>
        <Text style={styles.sectionTitle}>Database Tables</Text>
        {tables.map(table => (
          <View key={table.name} style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableName}>{table.name}</Text>
              <Text style={styles.tableRecords}>{table.recordCount} records</Text>
            </View>
            <Text style={styles.tableSize}>Size: {table.size}</Text>
            <Text style={styles.tableModified}>
              Last Modified: {new Date(table.lastModified).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {/* Backups */}
      <View style={styles.backupsSection}>
        <Text style={styles.sectionTitle}>Recent Backups</Text>
        {backups.map(backup => (
          <View key={backup.id} style={styles.backupCard}>
            <View style={styles.backupHeader}>
              <Text style={styles.backupFilename}>{backup.filename}</Text>
              <View
                style={[styles.statusBadge, { backgroundColor: getStatusColor(backup.status) }]}
              >
                <Text style={styles.statusText}>{backup.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.backupSize}>Size: {backup.size}</Text>
            <Text style={styles.backupDate}>
              Created: {new Date(backup.createdAt).toLocaleString()}
            </Text>
          </View>
        ))}
        {backups.length === 0 && <Text style={styles.emptyText}>No backups found</Text>}
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return colors.success[500];
    case 'failed':
      return colors.error[500];
    case 'in_progress':
      return colors.warning[500];
    default:
      return colors.gray[500];
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
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
  },
  statTitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  lastBackupText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  actionsSection: {
    padding: spacing.md,
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
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
    textAlign: 'center',
  },
  querySection: {
    padding: spacing.md,
  },
  queryInput: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  executeButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.gray[400],
  },
  executeButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  tablesSection: {
    padding: spacing.md,
  },
  tableCard: {
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
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tableName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  tableRecords: {
    fontSize: typography.sizes.sm,
    color: colors.primary[600],
    fontWeight: typography.weights.medium,
  },
  tableSize: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  tableModified: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  backupsSection: {
    padding: spacing.md,
  },
  backupCard: {
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
  backupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backupFilename: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    flex: 1,
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
  },
  backupSize: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  backupDate: {
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
