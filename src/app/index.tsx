import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AuthService } from '../services/auth';
import { colors, spacing, typography } from '../theme/tokens';

export default function Home() {
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await AuthService.isAuthenticated();
      if (isAuthenticated) {
        // Validate token with server by getting current user
        const user = await AuthService.getCurrentUser();
        if (user) {
          // Token is valid, check if user is admin/moderator and redirect accordingly
          if (
            user.role === 'admin' || user.role === 'moderator' || user.role === 'super_admin'
          ) {
            router.replace('/portal');
          } else {
            router.replace('/cases');
          }
        } else {
          // Token exists but is invalid, clear it and redirect to login
          console.log('Token exists but is invalid, redirecting to login');
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>241Runners Portal</Text>
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.gray[400],
  },
});
