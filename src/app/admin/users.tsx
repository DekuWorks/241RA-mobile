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
import { AdminService, AdminUser } from '../../services/admin';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, [searchQuery, selectedRole, selectedStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchQuery || undefined,
        role: selectedRole ? [selectedRole] : undefined,
        isActive:
          selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
        limit: 50,
      };

      const response = await AdminService.getUsers(filters);
      setUsers(response.users);
    } catch (error) {
      console.error('Failed to load users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await AdminService.updateUserRole(userId, newRole);
      await loadUsers(); // Refresh the list
      Alert.alert('Success', 'User role updated successfully');
    } catch (error) {
      console.error('Failed to update user role:', error);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const handleStatusToggle = async (userId: string, isActive: boolean) => {
    try {
      await AdminService.toggleUserStatus(userId, !isActive);
      await loadUsers(); // Refresh the list
      Alert.alert('Success', `User ${!isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return colors.error[500];
      case 'moderator':
        return colors.warning[500];
      case 'user':
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
        <Text style={styles.loadingText}>Loading users...</Text>
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
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray[500]}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersRow}>
            <Text style={styles.filterLabel}>Role:</Text>
            <FilterButton
              title="All"
              value=""
              onPress={setSelectedRole}
              isSelected={selectedRole === ''}
            />
            <FilterButton
              title="Admin"
              value="admin"
              onPress={setSelectedRole}
              isSelected={selectedRole === 'admin'}
            />
            <FilterButton
              title="Moderator"
              value="moderator"
              onPress={setSelectedRole}
              isSelected={selectedRole === 'moderator'}
            />
            <FilterButton
              title="User"
              value="user"
              onPress={setSelectedRole}
              isSelected={selectedRole === 'user'}
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
              title="Active"
              value="active"
              onPress={setSelectedStatus}
              isSelected={selectedStatus === 'active'}
            />
            <FilterButton
              title="Inactive"
              value="inactive"
              onPress={setSelectedStatus}
              isSelected={selectedStatus === 'inactive'}
            />
          </View>
        </ScrollView>
      </View>

      {/* Users List */}
      <View style={styles.usersContainer}>
        {users.map(user => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <View style={styles.userBadges}>
                <View style={[styles.badge, { backgroundColor: getRoleColor(user.role) }]}>
                  <Text style={styles.badgeText}>{user.role.toUpperCase()}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: user.isActive ? colors.success[500] : colors.gray[500] },
                  ]}
                >
                  <Text style={styles.badgeText}>{user.isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.userMeta}>
              <Text style={styles.userMetaText}>
                Created: {new Date(user.createdAt).toLocaleDateString()}
              </Text>
              {user.lastLoginAt && (
                <Text style={styles.userMetaText}>
                  Last Login: {new Date(user.lastLoginAt).toLocaleDateString()}
                </Text>
              )}
            </View>

            <View style={styles.userActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.roleButton]}
                onPress={() => {
                  const newRole = user.role === 'admin' ? 'user' : 'admin';
                  handleRoleChange(user.id, newRole);
                }}
              >
                <Text style={styles.actionButtonText}>
                  {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  user.isActive ? styles.deactivateButton : styles.activateButton,
                ]}
                onPress={() => handleStatusToggle(user.id, user.isActive)}
              >
                <Text style={styles.actionButtonText}>
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {users.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
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
  usersContainer: {
    padding: spacing.md,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  userBadges: {
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
  userMeta: {
    marginBottom: spacing.md,
  },
  userMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  userActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  roleButton: {
    backgroundColor: colors.primary[600],
  },
  activateButton: {
    backgroundColor: colors.success[600],
  },
  deactivateButton: {
    backgroundColor: colors.warning[600],
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
