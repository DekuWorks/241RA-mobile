import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface TriageCase {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'pending' | 'resolved';
  category: 'missing_person' | 'sighting' | 'emergency' | 'information';
  reporter: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  slaDeadline: string;
  timeRemaining: number; // hours
  assignedTo?: string;
  tags: string[];
  notes: string[];
}

interface TriageStats {
  totalCases: number;
  newCases: number;
  urgentCases: number;
  overdueCases: number;
  averageWaitTime: number;
  resolutionRate: number;
}

export default function TriageQueueScreen() {
  const [cases, setCases] = useState<TriageCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<TriageCase[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const [stats, setStats] = useState<TriageStats>({
    totalCases: 0,
    newCases: 0,
    urgentCases: 0,
    overdueCases: 0,
    averageWaitTime: 0,
    resolutionRate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TriageCase | null>(null);
  const [showCaseModal, setShowCaseModal] = useState(false);

  useEffect(() => {
    loadTriageData();
  }, []);

  useEffect(() => {
    filterCases();
  }, [cases, selectedPriority, selectedStatus, selectedCategory, showOverdueOnly]);

  const loadTriageData = async () => {
    try {
      setLoading(true);
      console.log('[TRIAGE] Loading triage queue data...');

      // Mock data - in production this would come from API
      const mockCases: TriageCase[] = [
        {
          id: '1',
          title: 'Missing Person - Sarah Johnson',
          description:
            '24-year-old female last seen at Central Park on Tuesday evening. Family is concerned.',
          priority: 'urgent',
          status: 'new',
          category: 'missing_person',
          reporter: 'John Johnson',
          location: 'Central Park, New York',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          slaDeadline: new Date(Date.now() + 3 * 3600000).toISOString(), // 3 hours from now
          timeRemaining: 3,
          tags: ['family', 'parks', 'evening'],
          notes: ['Family very concerned', 'Last seen with friends'],
        },
        {
          id: '2',
          title: 'Suspicious Activity Report',
          description:
            'Unusual behavior reported near downtown area. Person matching description from previous case.',
          priority: 'high',
          status: 'in_progress',
          category: 'sighting',
          reporter: 'Anonymous',
          location: 'Downtown District',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
          slaDeadline: new Date(Date.now() + 12 * 3600000).toISOString(),
          timeRemaining: 12,
          assignedTo: 'Officer Smith',
          tags: ['suspicious', 'downtown'],
          notes: ['Follow up with witness', 'Check CCTV footage'],
        },
        {
          id: '3',
          title: 'Information Request',
          description: 'Community member has information about missing person case #1234.',
          priority: 'medium',
          status: 'new',
          category: 'information',
          reporter: 'Community Member',
          location: 'Various',
          createdAt: new Date(Date.now() - 14400000).toISOString(),
          updatedAt: new Date(Date.now() - 14400000).toISOString(),
          slaDeadline: new Date(Date.now() + 20 * 3600000).toISOString(),
          timeRemaining: 20,
          tags: ['information', 'community'],
          notes: ['Call back scheduled for tomorrow'],
        },
        {
          id: '4',
          title: 'Emergency Missing Person',
          description:
            'Child reported missing from school playground. Immediate attention required.',
          priority: 'urgent',
          status: 'new',
          category: 'emergency',
          reporter: 'School Staff',
          location: 'Lincoln Elementary School',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
          slaDeadline: new Date(Date.now() + 2 * 3600000).toISOString(),
          timeRemaining: 2,
          tags: ['child', 'school', 'emergency'],
          notes: ['Alert all units', 'Contact family'],
        },
        {
          id: '5',
          title: 'Follow-up Required',
          description:
            'Previous case requires follow-up investigation. Evidence has been collected.',
          priority: 'medium',
          status: 'pending',
          category: 'missing_person',
          reporter: 'Detective Brown',
          location: 'Multiple Locations',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          slaDeadline: new Date(Date.now() - 2 * 3600000).toISOString(), // Overdue
          timeRemaining: -2,
          assignedTo: 'Detective Brown',
          tags: ['follow-up', 'evidence'],
          notes: ['Evidence processed', 'Witness interviews needed'],
        },
      ];

      setCases(mockCases);

      // Calculate stats
      const newStats: TriageStats = {
        totalCases: mockCases.length,
        newCases: mockCases.filter(c => c.status === 'new').length,
        urgentCases: mockCases.filter(c => c.priority === 'urgent').length,
        overdueCases: mockCases.filter(c => c.timeRemaining < 0).length,
        averageWaitTime: 4.2,
        resolutionRate: 85.3,
      };

      setStats(newStats);

      console.log('[TRIAGE] Triage data loaded successfully');
    } catch (error) {
      console.error('[TRIAGE] Failed to load triage data:', error);
      Alert.alert('Error', 'Failed to load triage queue data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterCases = () => {
    let filtered = [...cases];

    if (selectedPriority) {
      filtered = filtered.filter(c => c.priority === selectedPriority);
    }

    if (selectedStatus) {
      filtered = filtered.filter(c => c.status === selectedStatus);
    }

    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    if (showOverdueOnly) {
      filtered = filtered.filter(c => c.timeRemaining < 0);
    }

    // Sort by priority and time remaining
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) return priorityDiff;

      // If same priority, sort by time remaining (overdue first)
      return a.timeRemaining - b.timeRemaining;
    });

    setFilteredCases(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTriageData();
  };

  const handleCaseAction = (caseId: string, action: 'assign' | 'prioritize' | 'resolve') => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    setSelectedCase(caseItem);
    setShowCaseModal(true);

    switch (action) {
      case 'assign':
        Alert.alert('Assign Case', `Assign "${caseItem.title}" to an officer?`);
        break;
      case 'prioritize':
        Alert.alert('Change Priority', `Update priority for "${caseItem.title}"?`);
        break;
      case 'resolve':
        Alert.alert('Resolve Case', `Mark "${caseItem.title}" as resolved?`);
        break;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return colors.error;
      case 'high':
        return colors.warning[600];
      case 'medium':
        return colors.info[600];
      case 'low':
        return colors.success[600];
      default:
        return colors.gray[500];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return colors.info[600];
      case 'in_progress':
        return colors.warning[600];
      case 'pending':
        return colors.gray[600];
      case 'resolved':
        return colors.success[600];
      default:
        return colors.gray[500];
    }
  };

  const formatTimeRemaining = (timeRemaining: number) => {
    if (timeRemaining < 0) {
      return `${Math.abs(timeRemaining)}h overdue`;
    } else if (timeRemaining < 1) {
      return `${Math.round(timeRemaining * 60)}m remaining`;
    } else {
      return `${timeRemaining}h remaining`;
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

  const StatCard = ({
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
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        {icon && <Text style={styles.statIcon}>{icon}</Text>}
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading triage queue...</Text>
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
        <Text style={styles.headerTitle}>Triage Queue</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadTriageData}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Queue Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Cases"
            value={stats.totalCases}
            subtitle={`${stats.newCases} new`}
            color={colors.info[600]}
            icon="📋"
          />
          <StatCard
            title="Urgent Cases"
            value={stats.urgentCases}
            subtitle="Require immediate attention"
            color={colors.error}
            icon="🚨"
          />
          <StatCard
            title="Overdue Cases"
            value={stats.overdueCases}
            subtitle="Past SLA deadline"
            color={colors.warning[600]}
            icon="⏰"
          />
          <StatCard
            title="Resolution Rate"
            value={`${stats.resolutionRate}%`}
            subtitle={`${stats.averageWaitTime}h avg wait`}
            color={colors.success[600]}
            icon="📊"
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <Text style={styles.sectionTitle}>Filters</Text>

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
              title="New"
              value="new"
              onPress={setSelectedStatus}
              isSelected={selectedStatus === 'new'}
            />
            <FilterButton
              title="In Progress"
              value="in_progress"
              onPress={setSelectedStatus}
              isSelected={selectedStatus === 'in_progress'}
            />
            <FilterButton
              title="Pending"
              value="pending"
              onPress={setSelectedStatus}
              isSelected={selectedStatus === 'pending'}
            />
            <FilterButton
              title="Resolved"
              value="resolved"
              onPress={setSelectedStatus}
              isSelected={selectedStatus === 'resolved'}
            />
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={styles.filterLabel}>Category:</Text>
            <FilterButton
              title="All"
              value=""
              onPress={setSelectedCategory}
              isSelected={selectedCategory === ''}
            />
            <FilterButton
              title="Missing Person"
              value="missing_person"
              onPress={setSelectedCategory}
              isSelected={selectedCategory === 'missing_person'}
            />
            <FilterButton
              title="Sighting"
              value="sighting"
              onPress={setSelectedCategory}
              isSelected={selectedCategory === 'sighting'}
            />
            <FilterButton
              title="Emergency"
              value="emergency"
              onPress={setSelectedCategory}
              isSelected={selectedCategory === 'emergency'}
            />
            <FilterButton
              title="Information"
              value="information"
              onPress={setSelectedCategory}
              isSelected={selectedCategory === 'information'}
            />
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.overdueToggle, showOverdueOnly && styles.overdueToggleActive]}
          onPress={() => setShowOverdueOnly(!showOverdueOnly)}
        >
          <Text
            style={[styles.overdueToggleText, showOverdueOnly && styles.overdueToggleTextActive]}
          >
            {showOverdueOnly ? '🔴 Showing Overdue Only' : '⏰ Show Overdue Only'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cases List */}
      <View style={styles.casesSection}>
        <Text style={styles.sectionTitle}>Cases ({filteredCases.length})</Text>

        {filteredCases.map(caseItem => (
          <TouchableOpacity
            key={caseItem.id}
            style={[styles.caseCard, caseItem.timeRemaining < 0 && styles.overdueCaseCard]}
            onPress={() => {
              setSelectedCase(caseItem);
              setShowCaseModal(true);
            }}
          >
            <View style={styles.caseHeader}>
              <View style={styles.caseTitleRow}>
                <Text style={styles.caseTitle}>{caseItem.title}</Text>
                <View style={styles.caseBadges}>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(caseItem.priority) },
                    ]}
                  >
                    <Text style={styles.priorityBadgeText}>{caseItem.priority.toUpperCase()}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(caseItem.status) },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {caseItem.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.caseDescription} numberOfLines={2}>
                {caseItem.description}
              </Text>
            </View>

            <View style={styles.caseMeta}>
              <View style={styles.caseMetaRow}>
                <Text style={styles.caseMetaLabel}>📍 {caseItem.location}</Text>
                <Text style={styles.caseMetaLabel}>👤 {caseItem.reporter}</Text>
              </View>

              <View style={styles.caseMetaRow}>
                <Text style={styles.caseMetaLabel}>
                  ⏰ {formatTimeRemaining(caseItem.timeRemaining)}
                </Text>
                {caseItem.assignedTo && (
                  <Text style={styles.caseMetaLabel}>👮 {caseItem.assignedTo}</Text>
                )}
              </View>
            </View>

            <View style={styles.caseActions}>
              <TouchableOpacity
                style={styles.caseActionButton}
                onPress={() => handleCaseAction(caseItem.id, 'assign')}
              >
                <Text style={styles.caseActionButtonText}>👮 Assign</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.caseActionButton}
                onPress={() => handleCaseAction(caseItem.id, 'prioritize')}
              >
                <Text style={styles.caseActionButtonText}>⚡ Prioritize</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.caseActionButton}
                onPress={() => handleCaseAction(caseItem.id, 'resolve')}
              >
                <Text style={styles.caseActionButtonText}>✅ Resolve</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {filteredCases.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No cases match the current filters</Text>
          </View>
        )}
      </View>

      {/* Case Details Modal */}
      <Modal visible={showCaseModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCase && (
              <>
                <Text style={styles.modalTitle}>{selectedCase.title}</Text>

                <Text style={styles.modalSectionTitle}>Description</Text>
                <Text style={styles.modalText}>{selectedCase.description}</Text>

                <Text style={styles.modalSectionTitle}>Details</Text>
                <Text style={styles.modalText}>📍 Location: {selectedCase.location}</Text>
                <Text style={styles.modalText}>👤 Reporter: {selectedCase.reporter}</Text>
                <Text style={styles.modalText}>
                  🏷️ Category: {selectedCase.category.replace('_', ' ')}
                </Text>
                <Text style={styles.modalText}>
                  ⏰ Time Remaining: {formatTimeRemaining(selectedCase.timeRemaining)}
                </Text>

                {selectedCase.assignedTo && (
                  <Text style={styles.modalText}>👮 Assigned To: {selectedCase.assignedTo}</Text>
                )}

                {selectedCase.tags.length > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Tags</Text>
                    <View style={styles.tagsContainer}>
                      {selectedCase.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {selectedCase.notes.length > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Notes</Text>
                    {selectedCase.notes.map((note, index) => (
                      <Text key={index} style={styles.modalText}>
                        • {note}
                      </Text>
                    ))}
                  </>
                )}
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCaseModal(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
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
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statIcon: {
    fontSize: typography.sizes.md,
    marginRight: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  statTitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  statSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  filtersSection: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
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
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[400],
    marginRight: spacing.sm,
  },
  filterButtonSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  filterButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[800],
    fontWeight: typography.weights.semibold,
  },
  filterButtonTextSelected: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  overdueToggle: {
    backgroundColor: colors.gray[200],
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  overdueToggleActive: {
    backgroundColor: colors.error,
  },
  overdueToggleText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
  },
  overdueToggleTextActive: {
    color: colors.white,
  },
  casesSection: {
    padding: spacing.md,
  },
  caseCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  overdueCaseCard: {
    borderColor: colors.error,
    borderWidth: 2,
    backgroundColor: colors.error[50],
  },
  caseHeader: {
    marginBottom: spacing.sm,
  },
  caseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  caseTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    flex: 1,
    marginRight: spacing.sm,
  },
  caseBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  priorityBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  statusBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  caseDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },
  caseMeta: {
    marginBottom: spacing.md,
  },
  caseMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  caseMetaLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    flex: 1,
  },
  caseActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  caseActionButton: {
    flex: 1,
    backgroundColor: colors.primary[600],
    padding: spacing.sm,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  caseActionButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.white,
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
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[700],
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modalText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  tagText: {
    fontSize: typography.sizes.xs,
    color: colors.primary[800],
  },
  modalActions: {
    marginTop: spacing.lg,
  },
  modalCloseButton: {
    backgroundColor: colors.gray[200],
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[700],
  },
});
