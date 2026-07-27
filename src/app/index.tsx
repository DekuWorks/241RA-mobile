import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '../theme/tokens';
import { SecureTokenService } from '../services/secureTokens';

export default function Home() {
  const [loadingText, setLoadingText] = useState('Loading...');

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoadingText('Checking session...');
        const token = await SecureTokenService.getAccessToken();
        router.replace(token ? '/profile' : '/login');
      } catch (error) {
        console.error('Bootstrap navigation error:', error);
        setLoadingText('Redirecting to login...');
        router.replace('/login');
      }
    };

    const timeout = setTimeout(() => {
      void bootstrap();
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

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
