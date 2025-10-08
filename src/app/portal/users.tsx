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
} from 'react-native';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { AdminService, AdminUser } from '../../services/admin';
import { router } from 'expo-router';

export default function PortalUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Bulk Operations State
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Advanced Filters
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''});
  const [activityLevel, setActivityLevel] = useState<string>('');

  // CRUD Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Form States
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    password: '',
  });

  const [editUser, setEditUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
  });

  useEffect(() => {
    loadUsers();
  }, [searchQuery, selectedRole, selectedStatus, dateRange, activityLevel]);

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

  const handleExportUsers = async (format: 'csv' | 'json') => {
    try {
      console.log(`[USERS] Exporting users as ${format}`);
      const blob = await AdminService.exportUsers(format);
      console.log('[USERS] Users export completed:', blob);
      Alert.alert('Export Complete', `Users exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('[USERS] Users export failed:', error);
      Alert.alert('Export Failed', 'Failed to export users. Please try again.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      if (newRole === 'super_admin') {
        await AdminService.promoteToSuperAdmin(userId);
        Alert.alert('Success', 'User promoted to Super Admin successfully');
      } else if (newRole === 'admin') {
        await AdminService.demoteFromSuperAdmin(userId);
        Alert.alert('Success', 'User demoted to Admin successfully');
      } else {
        await AdminService.updateUserRole(userId, newRole);
        Alert.alert('Success', 'User role updated successfully');
      }
      await loadUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      Alert.alert('Error', error.message || 'Failed to update user role');
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

  // CREATE User
  const handleCreateUser = async () => {
    try {
      if (!newUser.email || !newUser.firstName || !newUser.lastName) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      await AdminService.createUser({
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        password: newUser.password,
      });

      Alert.alert('Success', 'User created successfully');
      setShowCreateModal(false);
      setNewUser({ email: '', firstName: '', lastName: '', role: 'user', password: '' });
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      Alert.alert('Error', error.message || 'Failed to create user');
    }
  };

  // UPDATE User
  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditUser({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await AdminService.updateUser(editingUser.id, {
        ...editUser,
        role: editUser.role as 'admin' | 'moderator' | 'super_admin',
      });
      Alert.alert('Success', 'User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      Alert.alert('Error', error.message || 'Failed to update user');
    }
  };

  // DELETE User
  const handleDeleteUser = (user: AdminUser) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminService.forceDeleteUser(user.id);
              Alert.alert('Success', 'User deleted successfully');
              await loadUsers();
            } catch (error: any) {
              console.error('Failed to delete user:', error);
              Alert.alert('Error', error.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  // Bulk Operations Functions
  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllUsers = () => {
    const allUserIds = new Set(users.map(user => user.id));
    setSelectedUsers(allUserIds);
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
    setShowBulkActions(false);
  };

  const handleBulkRoleChange = async (newRole: string) => {
    if (selectedUsers.size === 0) return;

    Alert.alert(
      'Bulk Role Change',
      `Change role to ${newRole} for ${selectedUsers.size} users?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const promises = Array.from(selectedUsers).map(userId => 
                AdminService.updateUserRole(userId, newRole)
              );
              await Promise.all(promises);
              Alert.alert('Success', `Updated roles for ${selectedUsers.size} users`);
              clearSelection();
              await loadUsers();
            } catch (error: any) {
              console.error('Failed to bulk update roles:', error);
              Alert.alert('Error', error.message || 'Failed to update user roles');
            }
          },
        },
      ]
    );
  };

  const handleBulkStatusChange = async (isActive: boolean) => {
    if (selectedUsers.size === 0) return;

    Alert.alert(
      'Bulk Status Change',
      `${isActive ? 'Activate' : 'Deactivate'} ${selectedUsers.size} users?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const promises = Array.from(selectedUsers).map(userId => 
                AdminService.toggleUserStatus(userId, isActive)
              );
              await Promise.all(promises);
              Alert.alert('Success', `${isActive ? 'Activated' : 'Deactivated'} ${selectedUsers.size} users`);
              clearSelection();
              await loadUsers();
            } catch (error: any) {
              console.error('Failed to bulk update status:', error);
              Alert.alert('Error', error.message || 'Failed to update user status');
            }
          },
        },
      ]
    );
  };

  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) return;

    Alert.alert(
      'Bulk Delete Users',
      `Are you sure you want to delete ${selectedUsers.size} users? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const promises = Array.from(selectedUsers).map(userId => 
                AdminService.forceDeleteUser(userId)
              );
              await Promise.all(promises);
              Alert.alert('Success', `Deleted ${selectedUsers.size} users`);
              clearSelection();
              await loadUsers();
            } catch (error: any) {
              console.error('Failed to bulk delete users:', error);
              Alert.alert('Error', error.message || 'Failed to delete users');
            }
          },
        },
      ]
    );
  };

  const exportUsers = () => {
    // Simple CSV export functionality
    const csvData = users.map(user => ({
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email || '',
      role: user.role || '',
      status: user.isActive ? 'Active' : 'Inactive',
      created: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown',
      lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'
    }));

    const csvContent = [
      'Name,Email,Role,Status,Created,Last Login',
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    // In a real app, you'd use a file sharing library
    console.log('CSV Export:', csvContent);
    Alert.alert('Export Complete', 'User data has been exported to console (implement file sharing for production)');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return colors.error;
      case 'admin':
        return colors.warning;
      case 'moderator':
        return colors.info[600];
      case 'user':
        return colors.success;
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => {
            Alert.alert(
              'Export Users',
              'Choose export format:',
              [
                { text: 'CSV', onPress: () => handleExportUsers('csv') },
                { text: 'JSON', onPress: () => handleExportUsers('json') },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <Text style={styles.exportButtonText}>📊</Text>
        </TouchableOpacity>
      </View>

      {/* Header Actions */}
      <View style={styles.headerActions}>
        <View style={styles.headerActionsRow}>
          <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.createButtonIcon}>➕</Text>
            <Text style={styles.createButtonText}>Create User</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.bulkModeButton, bulkMode && styles.bulkModeButtonActive]} 
            onPress={() => {
              setBulkMode(!bulkMode);
              if (bulkMode) {
                clearSelection();
              }
            }}
          >
            <Text style={styles.bulkModeButtonText}>
              {bulkMode ? 'Exit Bulk' : 'Bulk Mode'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.exportButton} onPress={exportUsers}>
            <Text style={styles.exportButtonText}>📊 Export</Text>
          </TouchableOpacity>
        </View>
        
        {bulkMode && (
          <View style={styles.bulkControls}>
            <TouchableOpacity style={styles.selectAllButton} onPress={selectAllUsers}>
              <Text style={styles.selectAllButtonText}>Select All ({users.length})</Text>
            </TouchableOpacity>
            {selectedUsers.size > 0 && (
              <TouchableOpacity style={styles.clearSelectionButton} onPress={clearSelection}>
                <Text style={styles.clearSelectionButtonText}>Clear ({selectedUsers.size})</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {showBulkActions && selectedUsers.size > 0 && (
          <View style={styles.bulkActions}>
            <Text style={styles.bulkActionsTitle}>{selectedUsers.size} users selected</Text>
            <View style={styles.bulkActionsRow}>
              <TouchableOpacity 
                style={styles.bulkActionButton} 
                onPress={() => handleBulkRoleChange('admin')}
              >
                <Text style={styles.bulkActionButtonText}>Make Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.bulkActionButton} 
                onPress={() => handleBulkRoleChange('moderator')}
              >
                <Text style={styles.bulkActionButtonText}>Make Moderator</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.bulkActionButton} 
                onPress={() => handleBulkStatusChange(true)}
              >
                <Text style={styles.bulkActionButtonText}>Activate</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.bulkActionButton} 
                onPress={() => handleBulkStatusChange(false)}
              >
                <Text style={styles.bulkActionButtonText}>Deactivate</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.bulkActionButton, styles.bulkDeleteButton]} 
                onPress={handleBulkDelete}
              >
                <Text style={styles.bulkActionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

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
              title="Super Admin"
              value="super_admin"
              onPress={setSelectedRole}
              isSelected={selectedRole === 'super_admin'}
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
          <View key={user.id} style={[
            styles.userCard, 
            bulkMode && selectedUsers.has(user.id) && styles.selectedUserCard
          ]}>
            {bulkMode && (
              <TouchableOpacity 
                style={styles.selectionCheckbox}
                onPress={() => toggleUserSelection(user.id)}
              >
                <Text style={styles.selectionCheckboxText}>
                  {selectedUsers.has(user.id) ? '☑️' : '☐'}
                </Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.userHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <View style={styles.userBadges}>
                <View style={[styles.badge, { backgroundColor: getRoleColor(user.role || 'user') }]}>
                  <Text style={styles.badgeText}>{(user.role || 'user').toUpperCase()}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: user.isActive ? colors.success : colors.gray[500] },
                  ]}
                >
                  <Text style={styles.badgeText}>{user.isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.userMeta}>
              <Text style={styles.userMetaText}>
                Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </Text>
              {user.lastLoginAt && (
                <Text style={styles.userMetaText}>
                  Last Login: {new Date(user.lastLoginAt).toLocaleDateString()}
                </Text>
              )}
              {user.actionsPerformed && (
                <Text style={styles.userMetaText}>Actions: {user.actionsPerformed}</Text>
              )}
            </View>

            <View style={styles.userActions}>
              <TouchableOpacity style={[styles.editButton]} onPress={() => handleEditUser(user)}>
                <Text style={styles.actionButtonText}>✏️ Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  { backgroundColor: colors.info[600], borderColor: colors.info[500] },
                ]}
                onPress={() => {
                  let newRole: string;
                  if (user.role === 'super_admin') {
                    newRole = 'admin';
                  } else if (user.role === 'admin') {
                    newRole = 'super_admin';
                  } else {
                    newRole = 'admin';
                  }
                  handleRoleChange(user.id, newRole);
                }}
              >
                <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                  {user.role === 'super_admin'
                    ? 'Demote to Admin'
                    : user.role === 'admin'
                      ? 'Promote to Super Admin'
                      : 'Promote to Admin'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[user.isActive ? styles.deactivateButton : styles.activateButton]}
                onPress={() => handleStatusToggle(user.id, user.isActive)}
              >
                <Text style={styles.actionButtonText}>
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton]}
                onPress={() => handleDeleteUser(user)}
              >
                <Text style={styles.actionButtonText}>🗑️ Delete</Text>
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

      {/* Create User Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New User</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              value={newUser.email}
              onChangeText={text => setNewUser({ ...newUser, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="First Name"
              value={newUser.firstName}
              onChangeText={text => setNewUser({ ...newUser, firstName: text })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Last Name"
              value={newUser.lastName}
              onChangeText={text => setNewUser({ ...newUser, lastName: text })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Password"
              value={newUser.password}
              onChangeText={text => setNewUser({ ...newUser, password: text })}
              secureTextEntry
            />

            <View style={styles.modalRoleContainer}>
              <Text style={styles.modalLabel}>Role:</Text>
              <View style={styles.roleButtons}>
                {['user', 'moderator', 'admin', 'super_admin'].map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleButton, newUser.role === role && styles.selectedRoleButton]}
                    onPress={() => setNewUser({ ...newUser, role })}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        newUser.role === role && styles.selectedRoleButtonText,
                      ]}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleCreateUser}>
                <Text style={styles.modalSaveText}>Create User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit User</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              value={editUser.email}
              onChangeText={text => setEditUser({ ...editUser, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="First Name"
              value={editUser.firstName}
              onChangeText={text => setEditUser({ ...editUser, firstName: text })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Last Name"
              value={editUser.lastName}
              onChangeText={text => setEditUser({ ...editUser, lastName: text })}
            />

            <View style={styles.modalRoleContainer}>
              <Text style={styles.modalLabel}>Role:</Text>
              <View style={styles.roleButtons}>
                {['user', 'moderator', 'admin', 'super_admin'].map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleButton, editUser.role === role && styles.selectedRoleButton]}
                    onPress={() => setEditUser({ ...editUser, role })}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        editUser.role === role && styles.selectedRoleButtonText,
                      ]}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleUpdateUser}>
                <Text style={styles.modalSaveText}>Update User</Text>
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
  exportButton: {
    padding: spacing.sm,
  },
  exportButtonText: {
    fontSize: typography.sizes.lg,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[400],
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
  usersContainer: {
    padding: spacing.md,
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.gray[200],
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    backgroundColor: colors.gray[100], // Default background
  },
  activateButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    backgroundColor: '#10B981', // Green for activate
    borderColor: '#047857',
  },
  deactivateButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    backgroundColor: '#F59E0B', // Amber for deactivate
    borderColor: '#D97706',
  },
  actionButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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

  // Header Actions
  headerActions: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981', // Green for create (positive action)
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: '#047857',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButtonIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: spacing.xs,
    fontWeight: 'bold',
  },
  createButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  // Enhanced Action Buttons - Traffic Light Theme
  editButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    backgroundColor: '#3B82F6', // Blue for edit (safe action)
    borderColor: '#1D4ED8',
  },
  deleteButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    backgroundColor: '#EF4444', // Red for delete (dangerous action)
    borderColor: '#DC2626',
  },

  // Modal Styles
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
  modalRoleContainer: {
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  roleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.gray[400],
    backgroundColor: colors.white,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  selectedRoleButton: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  roleButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[800],
    fontWeight: typography.weights.semibold,
  },
  selectedRoleButtonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
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

  // Bulk Operations Styles
  bulkModeButton: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.gray[400],
  },
  bulkModeButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  bulkModeButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
  },
  exportButton: {
    backgroundColor: colors.info[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.info[700],
  },
  exportButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
  bulkControls: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectAllButton: {
    backgroundColor: colors.warning[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  selectAllButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
  clearSelectionButton: {
    backgroundColor: colors.gray[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  clearSelectionButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
  bulkActions: {
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  bulkActionsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.primary[800],
    marginBottom: spacing.sm,
  },
  bulkActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  bulkActionButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primary[700],
  },
  bulkDeleteButton: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  bulkActionButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },

  // Selection Styles
  selectedUserCard: {
    borderColor: colors.primary[600],
    borderWidth: 2,
    backgroundColor: colors.primary[50],
  },
  selectionCheckbox: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    padding: spacing.xs,
  },
  selectionCheckboxText: {
    fontSize: 20,
  },
});
