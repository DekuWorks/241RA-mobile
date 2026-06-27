import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { ENV } from '../config/env';
import GoogleMapsMapContent from '../components/GoogleMapsMapContent';

export default function MapScreen() {
  if (!ENV.GOOGLE_MAPS_API_KEY) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Google Maps API key not configured</Text>
        <Text style={styles.errorSubtext}>
          Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables (see .env.example).
          {'\n\n'}
          After adding react-native-maps, rebuild the native app:
          {'\n\n'}
          npx expo prebuild{'\n'}
          npx expo run:ios
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <GoogleMapsMapContent />;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.gray[400],
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
});
