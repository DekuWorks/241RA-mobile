import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Location from 'expo-location';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { CasesService, CreateSightingData } from '../../services/cases';
import { AuthService } from '../../services/auth';
import { CameraService } from '../../services/camera';

export default function ReportSightingScreen() {
  const { id: caseId } = useLocalSearchParams<{ id: string }>();
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState('');
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to report sightings with accurate coordinates.'
        );
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const formattedAddress = [
          addr.streetNumber,
          addr.street,
          addr.city,
          addr.region,
          addr.postalCode,
        ]
          .filter(Boolean)
          .join(' ');
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Failed to get your current location.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleTakePhoto = async () => {
    const result = await CameraService.showImageOptions();
    if (result) {
      setImages(prev => [...prev, result.uri]);
    }
  };

  const handleSubmitSighting = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of the sighting.');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location is required to report a sighting.');
      return;
    }

    setIsLoading(true);
    try {
      const sightingData: CreateSightingData = {
        caseId: caseId!,
        description: description.trim(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address || undefined,
        },
        images,
        confidence,
        reportedAt: new Date().toISOString(),
      };

      await CasesService.reportSighting(sightingData);

      Alert.alert(
        'Sighting Reported',
        'Thank you for reporting this sighting. It has been submitted for review.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting sighting:', error);
      Alert.alert(
        'Submission Failed',
        error.response?.data?.message || 'Failed to submit sighting. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderImages = () => {
    if (images.length === 0) {
      return (
        <TouchableOpacity style={styles.addImageButton} onPress={handleTakePhoto}>
          <Text style={styles.addImageText}>📷 Take Photo</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.imagesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {images.map((imageUri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
              >
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addMoreButton} onPress={handleTakePhoto}>
            <Text style={styles.addMoreText}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Sighting</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description *</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what you observed, when you saw it, and any other relevant details..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            {renderImages()}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationContainer}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Coordinates:</Text>
                <Text style={styles.locationValue}>
                  {location
                    ? `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`
                    : 'Getting location...'}
                </Text>
                {address && (
                  <>
                    <Text style={styles.locationLabel}>Address:</Text>
                    <Text style={styles.locationValue}>{address}</Text>
                  </>
                )}
              </View>
              <TouchableOpacity
                style={styles.refreshLocationButton}
                onPress={getCurrentLocation}
                disabled={isGettingLocation}
              >
                <Text style={styles.refreshLocationText}>
                  {isGettingLocation ? 'Getting...' : '🔄'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confidence Level</Text>
            <View style={styles.confidenceContainer}>
              {(['low', 'medium', 'high'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.confidenceButton,
                    confidence === level && styles.confidenceButtonActive,
                  ]}
                  onPress={() => setConfidence(level)}
                >
                  <Text
                    style={[
                      styles.confidenceButtonText,
                      confidence === level && styles.confidenceButtonTextActive,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmitSighting}
          disabled={isLoading || !location}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Submitting...' : 'Submit Sighting'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
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
    marginLeft: spacing.lg,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  textArea: {
    backgroundColor: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[700],
    borderRadius: radii.lg,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text,
    minHeight: 100,
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: spacing.md,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: radii.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  addImageButton: {
    backgroundColor: colors.gray[900],
    borderWidth: 2,
    borderColor: colors.gray[700],
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: typography.sizes.base,
    color: colors.gray[400],
  },
  addMoreButton: {
    backgroundColor: colors.gray[800],
    width: 100,
    height: 100,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  addMoreText: {
    fontSize: typography.sizes['2xl'],
    color: colors.gray[400],
  },
  locationContainer: {
    backgroundColor: colors.gray[900],
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[400],
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  locationValue: {
    fontSize: typography.sizes.base,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  refreshLocationButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radii.md,
    marginLeft: spacing.md,
  },
  refreshLocationText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
  },
  confidenceContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  confidenceButton: {
    flex: 1,
    backgroundColor: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[700],
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  confidenceButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  confidenceButtonText: {
    fontSize: typography.sizes.base,
    color: colors.gray[300],
    fontWeight: typography.weights.medium,
  },
  confidenceButtonTextActive: {
    color: colors.white,
  },
  submitButton: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray[600],
  },
  submitButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});
