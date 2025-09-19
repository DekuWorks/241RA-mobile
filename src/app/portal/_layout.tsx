import { Stack } from 'expo-router';
// import { View, Text, StyleSheet } from 'react-native';
// import { colors, spacing, typography } from '../../theme/tokens';

export default function PortalLayout() {
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
          title: '241Runners Portal',
          headerTitle: 'Admin Portal Hub',
        }}
      />
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: 'Portal Dashboard',
        }}
      />
      <Stack.Screen
        name="cases"
        options={{
          title: 'Case Management',
          headerTitle: 'Case Management',
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'User Management',
          headerTitle: 'User Management',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          headerTitle: 'Portal Analytics',
        }}
      />
      <Stack.Screen
        name="database"
        options={{
          title: 'Database Tools',
          headerTitle: 'Database Management',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Portal Settings',
          headerTitle: 'Portal Configuration',
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
        name="logs"
        options={{
          title: 'System Logs',
          headerTitle: 'System Logs',
        }}
      />
    </Stack>
  );
}
