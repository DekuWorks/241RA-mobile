import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { CasesService, Case, CaseFilters } from '../services/cases';
import { AuthService } from '../services/auth';
import { NotificationService } from '../services/notifications';

export default function CasesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CaseFilters>({
    page: 1,
    limit: 20,
  });

  const { data, error, refetch, isLoading } = useQuery({
    queryKey: ['cases', filters],
    queryFn: () => CasesService.getCases(filters),
    enabled: true,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({
      ...prev,
      search: query || undefined,
      page: 1,
    }));
  };

  const handleCasePress = (caseId: string) => {
    router.push(`/cases/${caseId}`);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear all local data first
            await AuthService.logout();
            await NotificationService.unregisterDevice();
            
            // Navigate to login and clear the navigation stack
            router.dismissAll();
            router.replace('/login');
          } catch (error) {
            console.error('Cases logout error:', error);
            // Even if there's an error, try to navigate to login
            router.dismissAll();
            router.replace('/login');
          }
        },
      },
    ]);
  };

  const renderCaseItem = ({ item }: { item: Case }) => (
    <TouchableOpacity style={styles.caseItem} onPress={() => handleCasePress(item.id)}>
      <View style={styles.caseHeader}>
        <Text style={styles.caseTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: colors.status[item.status] }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.caseDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.caseFooter}>
        <Text style={styles.caseLocation}>{item.location.city || 'Unknown Location'}</Text>
        <Text style={styles.caseDate}>{new Date(item.reportedAt).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No cases found</Text>
      <Text style={styles.emptyDescription}>
        {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new cases'}
      </Text>
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load cases</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cases</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => router.push('/map')} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search cases..."
          placeholderTextColor={colors.gray[400]}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={data?.cases || []}
        renderItem={renderCaseItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.gray[900],
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerButton: {
    backgroundColor: colors.gray[800],
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  headerButtonText: {
    fontSize: typography.sizes.lg,
  },
  logoutText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  searchContainer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.gray[800],
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  caseItem: {
    backgroundColor: colors.gray[900],
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[800],
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  caseTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
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
  caseDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[300],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseLocation: {
    fontSize: typography.sizes.xs,
    color: colors.gray[400],
  },
  caseDate: {
    fontSize: typography.sizes.xs,
    color: colors.gray[400],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[400],
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
});
