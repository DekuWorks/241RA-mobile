import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { CasesService, Case } from '../services/cases';
import { ENV } from '../config/env';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const {
    data: casesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cases', 'map'],
    queryFn: () => CasesService.getCases({ limit: 100 }), // Get more cases for map view
    enabled: !!userLocation,
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to view cases on the map.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation(location);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleMarkerPress = (caseData: Case) => {
    setSelectedCase(caseData);
  };

  const handleCasePress = () => {
    if (selectedCase) {
      router.push(`/cases/${selectedCase.id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'missing':
        return colors.status.missing;
      case 'urgent':
        return colors.status.urgent;
      case 'resolved':
        return colors.status.resolved;
      case 'found':
        return colors.status.found;
      default:
        return colors.gray[500];
    }
  };

  const renderCaseInfo = () => {
    if (!selectedCase) return null;

    return (
      <View style={styles.caseInfo}>
        <View style={styles.caseInfoHeader}>
          <Text style={styles.caseTitle} numberOfLines={2}>
            {selectedCase.title}
          </Text>
          <TouchableOpacity onPress={() => setSelectedCase(null)}>
            <Text style={styles.closeButton}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.caseMeta}>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedCase.status) }]}
          >
            <Text style={styles.statusText}>{selectedCase.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.caseDate}>
            {new Date(selectedCase.reportedAt).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.caseDescription} numberOfLines={3}>
          {selectedCase.description}
        </Text>

        <TouchableOpacity style={styles.viewCaseButton} onPress={handleCasePress}>
          <Text style={styles.viewCaseButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load cases</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if Google Maps API key is available
  if (!ENV.GOOGLE_MAPS_API_KEY) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Google Maps API key not configured</Text>
        <Text style={styles.errorSubtext}>
          Please configure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cases Map</Text>
        <TouchableOpacity onPress={getCurrentLocation}>
          <Text style={styles.locationButton}>📍</Text>
        </TouchableOpacity>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onRegionChangeComplete={setMapRegion}
      >
        {casesData?.cases.map(caseData => (
          <Marker
            key={caseData.id}
            coordinate={{
              latitude: caseData.location.latitude,
              longitude: caseData.location.longitude,
            }}
            pinColor={getStatusColor(caseData.status)}
            onPress={() => handleMarkerPress(caseData)}
          />
        ))}

        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            pinColor={colors.primary}
            title="Your Location"
          />
        )}
      </MapView>

      {renderCaseInfo()}

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Status Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.status.missing }]} />
            <Text style={styles.legendText}>Missing</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.status.urgent }]} />
            <Text style={styles.legendText}>Urgent</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.status.resolved }]} />
            <Text style={styles.legendText}>Resolved</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.status.found }]} />
            <Text style={styles.legendText}>Found</Text>
          </View>
        </View>
      </View>
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
    backgroundColor: colors.gray[900],
    zIndex: 1,
  },
  backButtonText: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  locationButton: {
    fontSize: typography.sizes.lg,
  },
  map: {
    width: width,
    height: height - 200,
  },
  caseInfo: {
    position: 'absolute',
    bottom: 120,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.gray[900],
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[800],
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
    color: colors.text,
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  caseDate: {
    fontSize: typography.sizes.xs,
    color: colors.gray[400],
  },
  caseDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[300],
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  viewCaseButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  viewCaseButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  legend: {
    position: 'absolute',
    top: 100,
    right: spacing.lg,
    backgroundColor: colors.gray[900],
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[800],
  },
  legendTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  legendItems: {
    gap: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[300],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
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
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
});
