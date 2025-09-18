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
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { AdminService, AdminCase } from '../../services/admin';

export default function AdminCasesScreen() {
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  useEffect(() => {
    loadCases();
  }, [searchQuery, selectedStatus, selectedPriority]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchQuery || undefined,
        status: selectedStatus ? [selectedStatus] : undefined,
        priority: selectedPriority ? [selectedPriority] : undefined,
        limit: 50,
      };

      const response = await AdminService.getAdminCases(filters);
      setCases(response.cases);
    } catch (error) {
      console.error('Failed to load cases:', error);
      Alert.alert('Error', 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCases();
    setRefreshing(false);
  };

  const handleStatusChange = async (caseId: string, newStatus: string) => {
    try {
      await AdminService.updateCaseStatus(caseId, newStatus);
      await loadCases(); // Refresh the list
      Alert.alert('Success', 'Case status updated successfully');
    } catch (error) {
      console.error('Failed to update case status:', error);
      Alert.alert('Error', 'Failed to update case status');
    }
  };

  const handlePriorityChange = async (caseId: string, newPriority: string) => {
    try {
      await AdminService.updateCasePriority(caseId, newPriority);
      await loadCases(); // Refresh the list
      Alert.alert('Success', 'Case priority updated successfully');
    } catch (error) {
      console.error('Failed to update case priority:', error);
      Alert.alert('Error', 'Failed to update case priority');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.warning[500];
      case 'resolved':
        return colors.success[500];
      case 'archived':
        return colors.gray[500];
      default:
        return colors.gray[500];
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return colors.error[500];
      case 'high':
        return colors.warning[600];
      case 'medium':
        return colors.info[500];
      case 'low':
        return colors.success[500];
      default:
        return colors.gray[500];
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
        <Text style={styles.loadingText}>Loading cases...</Text>
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
          placeholder="Search cases..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray[500]}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={styles.filterLabel}>Status:</Text>
            <FilterButton
              title="All"
              value=""
              onPress={setSelectedStatus}
              isSelected={selectedStatus === ''}
            />
            <FilterButton
              title="Active"
              value="active"
              onPress={setSelectedStatus}
              isSelected={selectedStatus === 'active'}
            />
            <FilterButton
              title="Resolved"
              value="resolved"
              onPress={setSelectedStatus}
              isSelected={selectedStatus === 'resolved'}
            />
            <FilterButton
              title="Archived"
              value="archived"
              onPress={setSelectedStatus}
              isSelected={selectedStatus === 'archived'}
            />
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={styles.filterLabel}>Priority:</Text>
            <FilterButton
              title="All"
              value=""
              onPress={setSelectedPriority}
              isSelected={selectedPriority === ''}
            />
            <FilterButton
              title="Urgent"
              value="urgent"
              onPress={setSelectedPriority}
              isSelected={selectedPriority === 'urgent'}
            />
            <FilterButton
              title="High"
              value="high"
              onPress={setSelectedPriority}
              isSelected={selectedPriority === 'high'}
            />
            <FilterButton
              title="Medium"
              value="medium"
              onPress={setSelectedPriority}
              isSelected={selectedPriority === 'medium'}
            />
            <FilterButton
              title="Low"
              value="low"
              onPress={setSelectedPriority}
              isSelected={selectedPriority === 'low'}
            />
          </View>
        </ScrollView>
      </View>

      {/* Cases List */}
      <View style={styles.casesContainer}>
        {cases.map(caseItem => (
          <View key={caseItem.id} style={styles.caseCard}>
            <View style={styles.caseHeader}>
              <Text style={styles.caseTitle}>{caseItem.title}</Text>
              <View style={styles.caseBadges}>
                <View style={[styles.badge, { backgroundColor: getStatusColor(caseItem.status) }]}>
                  <Text style={styles.badgeText}>{caseItem.status.toUpperCase()}</Text>
                </View>
                <View
                  style={[styles.badge, { backgroundColor: getPriorityColor(caseItem.priority) }]}
                >
                  <Text style={styles.badgeText}>{caseItem.priority.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.caseDescription} numberOfLines={2}>
              {caseItem.description}
            </Text>

            <View style={styles.caseMeta}>
              <Text style={styles.caseMetaText}>
                Reported by: {caseItem.reportedBy.firstName} {caseItem.reportedBy.lastName}
              </Text>
              <Text style={styles.caseMetaText}>Sightings: {caseItem.sightings}</Text>
              <Text style={styles.caseMetaText}>
                Created: {new Date(caseItem.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.caseActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => router.push(`/admin/cases/${caseItem.id}`)}
              >
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.statusButton]}
                onPress={() => {
                  const newStatus = caseItem.status === 'active' ? 'resolved' : 'active';
                  handleStatusChange(caseItem.id, newStatus);
                }}
              >
                <Text style={styles.actionButtonText}>
                  {caseItem.status === 'active' ? 'Mark Resolved' : 'Mark Active'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {cases.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cases found</Text>
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
  casesContainer: {
    padding: spacing.md,
  },
  caseCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  caseTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginRight: spacing.sm,
  },
  caseBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  caseDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  caseMeta: {
    marginBottom: spacing.md,
  },
  caseMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  caseActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.primary[600],
  },
  statusButton: {
    backgroundColor: colors.success[600],
  },
  actionButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.white,
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
