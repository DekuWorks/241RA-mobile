import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { ENV } from '../config/env';
import { isMapboxNativeAvailable } from '../lib/mapboxAvailability';

export default function MapScreen() {
  const [MapContent, setMapContent] = useState<React.ComponentType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);

  const nativeAvailable = isMapboxNativeAvailable();

  useEffect(() => {
    if (!nativeAvailable || !ENV.MAPBOX_ACCESS_TOKEN) {
      return;
    }

    let cancelled = false;
    setIsLoadingMap(true);

    import('../components/MapboxMapContent')
      .then(mod => {
        if (!cancelled) {
          setMapContent(() => mod.default);
        }
      })
      .catch(err => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load map module';
          setLoadError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingMap(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [nativeAvailable]);

  if (!nativeAvailable) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Map requires a custom dev client</Text>
        <Text style={styles.errorSubtext}>
          @rnmapbox/maps does not work in Expo Go. Rebuild the native app with Mapbox linked:
          {'\n\n'}
          npx expo prebuild{'\n'}
          npx expo run:ios
          {'\n\n'}
          Then set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env and rebuild again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!ENV.MAPBOX_ACCESS_TOKEN) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Mapbox access token not configured</Text>
        <Text style={styles.errorSubtext}>
          Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables (see .env.example).
          Rebuild the dev client after adding @rnmapbox/maps native code.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load map</Text>
        <Text style={styles.errorSubtext}>{loadError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoadingMap || !MapContent) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return <MapContent />;
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
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.textMuted,
    marginTop: spacing.md,
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
