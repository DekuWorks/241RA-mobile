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
} from 'react-native';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { AdminService } from '../../services/admin';

interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: string;
  source: string;
  userId?: string;
}

export default function PortalLogsScreen() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, [searchQuery, selectedLevel, selectedSource]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchQuery || undefined,
        level: selectedLevel ? [selectedLevel] : undefined,
        limit: 100,
      };

      const response = await AdminService.getSystemLogs(filters);
      setLogs(response.logs);
    } catch (error) {
      console.error('Failed to load logs:', error);
      Alert.alert('Error', 'Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const handleDownloadLogs = async (format: 'csv' | 'json') => {
    try {
      await AdminService.downloadSystemLogs(format);
      Alert.alert('Success', `Logs downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to download logs:', error);
      Alert.alert('Error', 'Failed to download logs');
    }
  };

  const handleClearLogs = async () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all system logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminService.clearSystemLogs();
              Alert.alert('Success', 'System logs cleared successfully');
              await loadLogs();
            } catch (error) {
              console.error('Failed to clear logs:', error);
              Alert.alert('Error', 'Failed to clear logs');
            }
          },
        },
      ]
    );
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return colors.error[500];
      case 'warning':
        return colors.warning[500];
      case 'info':
        return colors.info[500];
      case 'debug':
        return colors.gray[500];
      default:
        return colors.gray[500];
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'debug':
        return '🐛';
      default:
        return '📝';
    }
  };

  const FilterButton = ({
    title,
    value,
    onPress,
    isSelected,
  }: {
    title: string;
    value: string;
    onPress: (value: string) => void;
    isSelected: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, isSelected && styles.filterButtonSelected]}
      onPress={() => onPress(value)}
    >
      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextSelected]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading system logs...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search logs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray[500]}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={styles.filterLabel}>Level:</Text>
            <FilterButton
              title="All"
              value=""
              onPress={setSelectedLevel}
              isSelected={selectedLevel === ''}
            />
            <FilterButton
              title="Error"
              value="error"
              onPress={setSelectedLevel}
              isSelected={selectedLevel === 'error'}
            />
            <FilterButton
              title="Warning"
              value="warning"
              onPress={setSelectedLevel}
              isSelected={selectedLevel === 'warning'}
            />
            <FilterButton
              title="Info"
              value="info"
              onPress={setSelectedLevel}
              isSelected={selectedLevel === 'info'}
            />
            <FilterButton
              title="Debug"
              value="debug"
              onPress={setSelectedLevel}
              isSelected={selectedLevel === 'debug'}
            />
          </View>
        </ScrollView>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Log Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDownloadLogs('csv')}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>Download CSV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => handleDownloadLogs('json')}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionTitle}>Download JSON</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClearLogs}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={styles.actionTitle}>Clear Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={loadLogs}>
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={styles.actionTitle}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logs List */}
      <View style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>System Logs ({logs.length})</Text>
        {logs.map(log => (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.logHeader}>
              <View style={styles.logLevel}>
                <Text style={styles.logLevelIcon}>{getLevelIcon(log.level)}</Text>
                <View style={[styles.logLevelBadge, { backgroundColor: getLevelColor(log.level) }]}>
                  <Text style={styles.logLevelText}>{log.level.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.logTimestamp}>{new Date(log.timestamp).toLocaleString()}</Text>
            </View>

            <Text style={styles.logMessage}>{log.message}</Text>

            <View style={styles.logMeta}>
              <Text style={styles.logMetaText}>Source: {log.source}</Text>
              {log.userId && <Text style={styles.logMetaText}>User: {log.userId}</Text>}
            </View>
          </View>
        ))}

        {logs.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No logs found</Text>
          </View>
        )}
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
  filtersContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchInput: {
    backgroundColor: colors.gray[100],
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  filtersScroll: {
    marginBottom: spacing.sm,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
    marginRight: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.gray[100],
  },
  filterButtonSelected: {
    backgroundColor: colors.primary[600],
  },
  filterButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
  },
  filterButtonTextSelected: {
    color: colors.white,
  },
  actionsContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: radii.md,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  clearButton: {
    backgroundColor: colors.error[50],
    borderColor: colors.error[200],
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  actionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
    textAlign: 'center',
  },
  logsContainer: {
    padding: spacing.md,
  },
  logCard: {
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
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logLevelIcon: {
    fontSize: typography.sizes.md,
  },
  logLevelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  logLevelText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  logTimestamp: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  logMessage: {
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  logMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
});
