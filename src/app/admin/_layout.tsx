import { Stack } from 'expo-router';
// import { View, Text, StyleSheet } from 'react-native';
// import { colors, spacing, typography } from '../../theme/tokens';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary[600],
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: typography.weights.bold,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin Dashboard',
          headerTitle: '241Runners Admin',
        }}
      />
      <Stack.Screen
        name="cases"
        options={{
          title: 'Manage Cases',
          headerTitle: 'Case Management',
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'Manage Users',
          headerTitle: 'User Management',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          headerTitle: 'Dashboard Analytics',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Admin Settings',
          headerTitle: 'Admin Configuration',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Admin Profile',
          headerTitle: 'Your Admin Profile',
        }}
      />
      <Stack.Screen
        name="database"
        options={{
          title: 'Database Management',
          headerTitle: 'Database Tools',
        }}
      />
      <Stack.Screen
        name="logs"
        options={{
          title: 'System Logs',
          headerTitle: 'System Logs',
        }}
      />
    </Stack>
  );
}
