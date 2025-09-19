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

export default function PortalDatabaseScreen() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [schema, setSchema] = useState<any>(null);
  const [showSchema, setShowSchema] = useState(false);

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

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a SQL query');
      return;
    }

    try {
      const results = await AdminService.executeDatabaseQuery(query);
      setQueryResults(results);
    } catch (error: any) {
      Alert.alert('Query Error', error.message || 'Failed to execute query');
    }
  };

  const handleForceDeleteNonAdminUsers = async () => {
    Alert.alert(
      'Danger Zone',
      'This will permanently delete ALL non-admin users and their related data. This action cannot be undone. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE ALL',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AdminService.deleteAllNonAdminUsers();
              Alert.alert('Success', `Deleted ${result.deletedCount} non-admin users`);
              loadDatabaseInfo();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete users');
            }
          },
        },
      ]
    );
  };

  const handleTruncateTable = async (tableName: string) => {
    Alert.alert(
      'Danger Zone',
      `This will permanently delete ALL data from the ${tableName} table. This action cannot be undone. Are you absolutely sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'TRUNCATE TABLE',
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminService.truncateTable(tableName);
              Alert.alert('Success', `Table ${tableName} truncated successfully`);
              loadDatabaseInfo();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to truncate table');
            }
          },
        },
      ]
    );
  };

  const handleVacuumDatabase = async () => {
    Alert.alert(
      'Database Maintenance',
      'This will optimize the database by reclaiming unused space. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'VACUUM DATABASE',
          onPress: async () => {
            try {
              await AdminService.vacuumDatabase();
              Alert.alert('Success', 'Database vacuumed successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to vacuum database');
            }
          },
        },
      ]
    );
  };

  const handleReindexDatabase = async () => {
    Alert.alert(
      'Database Maintenance',
      'This will rebuild all database indexes for optimal performance. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'REINDEX DATABASE',
          onPress: async () => {
            try {
              await AdminService.reindexDatabase();
              Alert.alert('Success', 'Database reindexed successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reindex database');
            }
          },
        },
      ]
    );
  };

  const handleCheckIntegrity = async () => {
    try {
      const result = await AdminService.checkDatabaseIntegrity();
      if (result.isHealthy) {
        Alert.alert('Database Health Check', 'Database is healthy with no issues found.');
      } else {
        const issuesText = result.issues
          .map(issue => `${issue.severity.toUpperCase()}: ${issue.table} - ${issue.issue}`)
          .join('\n');
        Alert.alert('Database Health Check', `Issues found:\n\n${issuesText}`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check database integrity');
    }
  };

  const handleLoadSchema = async () => {
    try {
      const schemaData = await AdminService.getDatabaseSchema();
      setSchema(schemaData);
      setShowSchema(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load database schema');
    }
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      'Danger Zone',
      'This will reset the entire database to its initial state. ALL DATA WILL BE LOST. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'RESET DATABASE',
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminService.resetDatabase();
              Alert.alert('Success', 'Database has been reset');
              loadDatabaseInfo();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reset database');
            }
          },
        },
      ]
    );
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

          <TouchableOpacity style={styles.actionButton} onPress={handleLoadSchema}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>View Schema</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error[50] }]}
            onPress={handleForceDeleteNonAdminUsers}
          >
            <Text style={styles.actionIcon}>⚠️</Text>
            <Text style={[styles.actionTitle, { color: colors.error[600] }]}>
              Delete Non-Admins
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error[50] }]}
            onPress={handleResetDatabase}
          >
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={[styles.actionTitle, { color: colors.error[600] }]}>Reset Database</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.warning[50] }]}
            onPress={handleVacuumDatabase}
          >
            <Text style={styles.actionIcon}>🧹</Text>
            <Text style={[styles.actionTitle, { color: colors.warning[600] }]}>Vacuum DB</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.info[50] }]}
            onPress={handleReindexDatabase}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={[styles.actionTitle, { color: colors.info[600] }]}>Reindex DB</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleCheckIntegrity}>
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionTitle}>Health Check</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Super Admin Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Super Admin Actions</Text>
        <View style={styles.actionsGrid}>
          {tables.map(table => (
            <TouchableOpacity
              key={table.name}
              style={[styles.actionButton, { backgroundColor: colors.error[50] }]}
              onPress={() => handleTruncateTable(table.name)}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={[styles.actionTitle, { color: colors.error[600] }]}>
                Truncate {table.name}
              </Text>
            </TouchableOpacity>
          ))}
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

      {/* Query Results */}
      {queryResults && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Query Results</Text>
          <Text style={styles.resultsText}>{JSON.stringify(queryResults, null, 2)}</Text>
        </View>
      )}

      {/* Database Schema */}
      {showSchema && schema && (
        <View style={styles.schemaSection}>
          <Text style={styles.sectionTitle}>Database Schema</Text>
          {schema.tables.map((table: any, index: number) => (
            <View key={index} style={styles.tableSchema}>
              <Text style={styles.tableName}>{table.name}</Text>
              {table.columns.map((column: any, colIndex: number) => (
                <View key={colIndex} style={styles.columnInfo}>
                  <Text style={styles.columnName}>
                    {column.name} ({column.type})
                  </Text>
                  <Text style={styles.columnDetails}>
                    {column.primaryKey ? 'PK ' : ''}
                    {column.nullable ? 'NULL' : 'NOT NULL'}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
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
  resultsSection: {
    padding: spacing.md,
  },
  resultsText: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: radii.sm,
    fontFamily: 'monospace',
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
  },
  schemaSection: {
    padding: spacing.md,
  },
  tableSchema: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  columnInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  columnName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
    flex: 1,
  },
  columnDetails: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
});
