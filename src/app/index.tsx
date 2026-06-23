import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { AuthService } from '../services/auth';
import { colors, spacing, typography } from '../theme/tokens';

export default function Home() {
  const [loadingText, setLoadingText] = useState('Loading...');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoadingText('Starting app...');
      console.log('App starting - redirecting to login screen');

      // Add a small delay to ensure proper initialization
      setTimeout(() => {
        setLoadingText('Redirecting to login...');
        try {
          router.push('/login');
          console.log('Navigation to login initiated');
        } catch (navError) {
          console.error('Navigation error:', navError);
          setLoadingText('Navigation failed, retrying...');
          // Retry after a delay
          setTimeout(() => {
            router.push('/login');
          }, 1000);
        }
      }, 500);
    } catch (error) {
      console.error('Navigation error:', error);
      setLoadingText('Error occurred, retrying...');
      // Fallback to login screen
      setTimeout(() => {
        try {
          router.push('/login');
        } catch (fallbackError) {
          console.error('Fallback navigation also failed:', fallbackError);
          setLoadingText('Unable to navigate. Please restart the app.');
        }
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/241-logo-new.jpg')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="241 Runners Awareness logo"
      />
      <ActivityIndicator size="large" color={colors.white} style={styles.spinner} />
      <Text style={styles.title}>241 Runners Awareness</Text>
      <Text style={styles.subtitle}>{loadingText}</Text>
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
  logo: {
    width: 200,
    height: 149,
    borderRadius: 8,
    marginBottom: spacing.xl,
  },
  spinner: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.textOnPage,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.textOnPage,
    opacity: 0.95,
    textAlign: 'center',
  },
});
