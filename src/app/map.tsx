import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { ENV } from '../config/env';
import GoogleMapsMapContent from '../components/GoogleMapsMapContent';

export default function MapScreen() {
  if (!ENV.GOOGLE_MAPS_API_KEY) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Case Map</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Map unavailable</Text>
            <Text style={styles.cardBody}>
              The case map needs a Google Maps API key before it can load. This is a one-time setup for
              developers — once configured, the map will show missing-person cases near you.
            </Text>

            {__DEV__ ? (
              <View style={styles.devBox}>
                <Text style={styles.devTitle}>Developer setup</Text>
                <Text style={styles.devStep}>1. Open Google Cloud Console → APIs & Services → Credentials</Text>
                <Text style={styles.devStep}>2. Create an API key (or reuse an existing Maps key)</Text>
                <Text style={styles.devStep}>
                  3. Enable Maps SDK for iOS and Maps SDK for Android on that key
                </Text>
                <Text style={styles.devStep}>
                  4. Add it to .env as EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=…
                </Text>
                <Text style={styles.devStep}>
                  5. Rebuild native: npx expo prebuild && npx expo run:ios
                </Text>
                <Text style={styles.devHint}>
                  See .env.example. Use the same key in the website config.json for Maps JavaScript API.
                </Text>
              </View>
            ) : (
              <Text style={styles.cardBodyMuted}>Please check back later, or browse cases from the list.</Text>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/cases')}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Browse cases</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return <GoogleMapsMapContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.header,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    color: colors.textOnHeader,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    minWidth: 64,
  },
  headerTitle: {
    color: colors.textOnHeader,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  headerSpacer: {
    minWidth: 64,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cardBody: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  cardBodyMuted: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  devBox: {
    backgroundColor: colors.gray[50],
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  devTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  devStep: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  devHint: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.base,
  },
});
