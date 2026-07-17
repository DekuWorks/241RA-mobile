import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE, Region } from 'react-native-maps';

// iOS: Apple Maps (PROVIDER_DEFAULT). AirGoogleMaps / PROVIDER_GOOGLE is not
// reliably linked in this Expo prebuild binary and red-screens the map.
// Android: Google Maps (PROVIDER_GOOGLE) with the configured API key.
const MAP_PROVIDER = Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE;
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography, radii, shadows } from '../theme/tokens';
import { CasesService, PublicMapCase } from '../services/cases';
import { MAP_CONFIG, getMapStatusColor } from '../constants/mapConfig';

const { width } = Dimensions.get('window');

const DEFAULT_REGION: Region = {
  latitude: MAP_CONFIG.DEFAULT_CENTER.lat,
  longitude: MAP_CONFIG.DEFAULT_CENTER.lng,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

function zoomToDelta(zoom: number): number {
  return 360 / Math.pow(2, zoom + 1);
}

function regionFromCenterZoom(lat: number, lng: number, zoom: number): Region {
  const delta = zoomToDelta(zoom);
  return { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta };
}

function formatLastSeen(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

export default function GoogleMapsMapContent() {
  const { case: deepLinkCaseId } = useLocalSearchParams<{ case?: string }>();
  const mapRef = useRef<MapView>(null);
  const [selectedCase, setSelectedCase] = useState<PublicMapCase | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);

  const {
    data: allCases = [],
    error,
    refetch,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['publicMapCases'],
    queryFn: () => CasesService.getPublicMapCases(),
  });

  const filteredCases = allCases;

  const stats = useMemo(() => {
    const data = filteredCases;
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    return {
      total: data.length,
      missing: data.filter(c => c.status === 'missing').length,
      found: data.filter(c => c.status === 'found').length,
      safe: data.filter(c => c.status === 'safe').length,
      urgent: data.filter(c => c.status === 'urgent').length,
      recent: data.filter(c => c.updatedAt && new Date(c.updatedAt).getTime() >= thirtyDaysAgo)
        .length,
    };
  }, [filteredCases]);

  const flyTo = useCallback((lat: number, lng: number, zoom = 12) => {
    const region = regionFromCenterZoom(lat, lng, zoom);
    setMapRegion(region);
    mapRef.current?.animateToRegion(region, 600);
  }, []);

  const focusHouston = useCallback(() => {
    flyTo(MAP_CONFIG.DEFAULT_CENTER.lat, MAP_CONFIG.DEFAULT_CENTER.lng, MAP_CONFIG.DEFAULT_ZOOM);
  }, [flyTo]);

  const centerOnCases = useCallback(() => {
    if (!filteredCases.length) return;
    if (filteredCases.length === 1) {
      const c = filteredCases[0];
      flyTo(c.latitude, c.longitude, 14);
      return;
    }
    const lats = filteredCases.map(c => c.latitude);
    const lngs = filteredCases.map(c => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latDelta = Math.max((maxLat - minLat) * 1.4, 0.02);
    const lngDelta = Math.max((maxLng - minLng) * 1.4, 0.02);
    const region: Region = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
    setMapRegion(region);
    mapRef.current?.animateToRegion(region, 600);
  }, [filteredCases, flyTo]);

  const requestUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      flyTo(location.coords.latitude, location.coords.longitude, 12);
    } catch (locationError) {
      console.warn('Error getting location:', locationError);
    }
  }, [flyTo]);

  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  useEffect(() => {
    if (!deepLinkCaseId || !allCases.length) return;
    const match = allCases.find(c => c.id === deepLinkCaseId);
    if (match) {
      flyTo(match.latitude, match.longitude, 14);
      setSelectedCase(match);
    }
  }, [deepLinkCaseId, allCases, flyTo]);

  const handleMarkerPress = (caseData: PublicMapCase) => {
    setSelectedCase(caseData);
  };

  const handleViewCase = () => {
    if (selectedCase) {
      router.push(`/cases/${selectedCase.id}`);
    }
  };

  const renderCaseInfo = () => {
    if (!selectedCase) return null;

    const statusColor = getMapStatusColor(selectedCase.status);

    return (
      <View style={styles.caseInfo}>
        <View style={styles.caseInfoHeader}>
          <Text style={styles.caseTitle} numberOfLines={2}>
            {selectedCase.displayName}
          </Text>
          <TouchableOpacity onPress={() => setSelectedCase(null)} hitSlop={8}>
            <Text style={styles.closeButton}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.caseMeta}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{selectedCase.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.caseDetailRow}>
          <Text style={styles.caseDetailLabel}>Location: </Text>
          {selectedCase.lastSeenCityState}
        </Text>
        <Text style={styles.caseDetailRow}>
          <Text style={styles.caseDetailLabel}>Last seen: </Text>
          {formatLastSeen(selectedCase.updatedAt)}
        </Text>

        <TouchableOpacity style={styles.viewCaseButton} onPress={handleViewCase}>
          <Text style={styles.viewCaseButtonText}>View case details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Missing Cases Map</Text>
        <TouchableOpacity onPress={requestUserLocation}>
          <Text style={styles.locationButton}>📍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.controlsRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => refetch()} disabled={isFetching}>
            <Text style={styles.controlBtnText}>{isFetching ? '…' : '🔄 Refresh'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={focusHouston}>
            <Text style={styles.controlBtnText}>🏙️ Houston</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtnSecondary} onPress={centerOnCases}>
            <Text style={styles.controlBtnText}>🎯 Center</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.mapWrapper}>
        {isLoading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingText}>Loading map data…</Text>
          </View>
        )}

        <MapView
          ref={mapRef}
          provider={MAP_PROVIDER}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {!error &&
            filteredCases.map(caseData => (
              <Marker
                key={caseData.id}
                coordinate={{
                  latitude: caseData.latitude,
                  longitude: caseData.longitude,
                }}
                pinColor={getMapStatusColor(caseData.status)}
                onPress={() => handleMarkerPress(caseData)}
              />
            ))}
        </MapView>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerTitle}>Cases temporarily unavailable</Text>
            <Text style={styles.errorBannerSubtext}>
              The map is available; case markers could not be loaded.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
              disabled={isFetching}
            >
              <Text style={styles.retryButtonText}>{isFetching ? 'Retrying…' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && filteredCases.length === 0 && (
          <View style={styles.noDataBanner}>
            <Text style={styles.noDataText}>No public cases to display</Text>
          </View>
        )}

        {!error && filteredCases.length > 0 && (
          <View style={styles.approxBanner}>
            <Text style={styles.approxBannerText}>
              Map locations are approximate. Cases without a reported location are shown in the
              general Houston area.
            </Text>
          </View>
        )}
      </View>

      {!error && renderCaseInfo()}

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {error
            ? 'Cases unavailable'
            : `${stats.total} cases · ${stats.missing} missing · ${stats.urgent} urgent`}
        </Text>
      </View>

      {!error && (
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Status</Text>
          {(['missing', 'found', 'safe', 'urgent'] as const).map(status => (
            <View key={status} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: getMapStatusColor(status) }]} />
              <Text style={styles.legendText}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.header,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: typography.sizes.base,
    color: colors.white,
    fontWeight: typography.weights.medium,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textOnHeader,
  },
  locationButton: {
    fontSize: typography.sizes.lg,
  },
  controls: {
    backgroundColor: colors.header,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  controlBtn: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  controlBtnSecondary: {
    backgroundColor: colors.gray[700],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  controlBtnText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    width,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  noDataBanner: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    ...shadows.card,
  },
  noDataText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  approxBanner: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    backgroundColor: '#fef3c7',
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  approxBannerText: {
    fontSize: typography.sizes.xs,
    color: '#92400e',
    textAlign: 'center',
  },
  caseInfo: {
    position: 'absolute',
    bottom: 48,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  caseInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  caseTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.primary[600],
    flex: 1,
    marginRight: spacing.sm,
  },
  closeButton: {
    fontSize: typography.sizes.xl,
    color: colors.gray[400],
    fontWeight: typography.weights.bold,
  },
  caseMeta: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  caseDetailRow: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  caseDetailLabel: {
    fontWeight: typography.weights.semibold,
  },
  viewCaseButton: {
    backgroundColor: colors.info[500],
    padding: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  viewCaseButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  statsBar: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statsText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  legend: {
    position: 'absolute',
    top: 120,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  legendTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.white,
  },
  legendText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  errorBanner: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    ...shadows.card,
    zIndex: 3,
  },
  errorBannerTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  errorBannerSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
});
