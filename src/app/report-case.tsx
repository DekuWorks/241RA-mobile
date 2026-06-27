import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { CasesService, CreateCaseData } from '../services/cases';
import { EnhancedRunnerProfileService } from '../services/enhancedRunnerProfile';
import { ValidationUtils } from '../utils/validation';

export default function ReportCaseScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lastSeenLocation, setLastSeenLocation] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [individualId, setIndividualId] = useState<string | null>(null);
  const [runnerName, setRunnerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    loadRunnerProfile();
    getCurrentLocation();
  }, []);

  const loadRunnerProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const profile = await EnhancedRunnerProfileService.getRunnerProfile();
      if (profile) {
        setIndividualId(`ind_${profile.id}`);
        const name = `${profile.firstName} ${profile.lastName}`.trim();
        setRunnerName(name);
        if (!title && name) {
          setTitle(`Missing: ${name}`);
        }
      }
    } catch (error) {
      console.error('Error loading runner profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0 && !lastSeenLocation) {
        const addr = reverseGeocode[0];
        const formatted = [addr.city, addr.region].filter(Boolean).join(', ');
        if (formatted) {
          setLastSeenLocation(formatted);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const submitCase = async () => {
    if (!individualId) {
      Alert.alert(
        'Runner Profile Required',
        'Please create a runner profile in your profile settings before reporting a case.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Profile', onPress: () => router.push('/profile') },
        ]
      );
      return;
    }

    const validation = ValidationUtils.validateCase({
      individualId,
      title,
      description,
      lastSeenLocation,
      latitude: location?.coords.latitude,
      longitude: location?.coords.longitude,
    });

    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setIsLoading(true);
    try {
      const caseData: CreateCaseData = {
        individualId,
        title: title.trim(),
        description: description.trim() || undefined,
        lastSeenLocation: lastSeenLocation.trim(),
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
        status: 'Missing',
      };

      await CasesService.createCase(caseData);

      Alert.alert(
        'Case Reported',
        'Your missing person case has been submitted successfully. Our team will review it shortly.',
        [{ text: 'OK', onPress: () => router.replace('/cases') }]
      );
    } catch (error: unknown) {
      console.error('Error submitting case:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to submit case. Please try again.';
      Alert.alert('Submission Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      'Confirm Submission',
      'Are you sure you want to submit this missing person report? Please verify all details are correct.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: submitCase },
      ]
    );
  };

  if (isLoadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Report Case</Text>
        </View>

        <View style={styles.content}>
          {!individualId && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                You need a runner profile before reporting a case. Create one in Profile → Runner
                Profile.
              </Text>
              <TouchableOpacity
                style={styles.warningButton}
                onPress={() => router.push('/profile')}
              >
                <Text style={styles.warningButtonText}>Go to Profile</Text>
              </TouchableOpacity>
            </View>
          )}

          {runnerName ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Runner</Text>
              <Text style={styles.runnerName}>{runnerName}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Case Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Missing: John D."
              placeholderTextColor={colors.gray[400]}
              maxLength={200}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the situation, last known clothing, and any relevant details..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={2000}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Seen Location *</Text>
            <TextInput
              style={styles.input}
              value={lastSeenLocation}
              onChangeText={setLastSeenLocation}
              placeholder="City, State (no street address)"
              placeholderTextColor={colors.gray[400]}
            />
            <View style={styles.locationContainer}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>GPS Coordinates:</Text>
                <Text style={styles.locationValue}>
                  {location
                    ? `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`
                    : isGettingLocation
                      ? 'Getting location...'
                      : 'Not available'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.refreshLocationButton}
                onPress={getCurrentLocation}
                disabled={isGettingLocation}
              >
                <Text style={styles.refreshLocationText}>
                  {isGettingLocation ? '...' : '🔄'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (isLoading || !individualId) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading || !individualId}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Submitting...' : 'Submit Report'}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: typography.sizes.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.header,
  },
  backButtonText: {
    fontSize: typography.sizes.base,
    color: colors.white,
    fontWeight: typography.weights.medium,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.textOnHeader,
    marginLeft: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    flex: 1,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  warningText: {
    color: '#92400e',
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  warningButton: {
    backgroundColor: colors.primary[600],
    padding: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  warningButtonText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
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
  runnerName: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text,
    minHeight: 100,
  },
  locationContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  locationValue: {
    fontSize: typography.sizes.base,
    color: colors.text,
  },
  refreshLocationButton: {
    backgroundColor: colors.primary[600],
    padding: spacing.md,
    borderRadius: radii.md,
    marginLeft: spacing.md,
  },
  refreshLocationText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
  },
  submitButton: {
    backgroundColor: colors.primary[600],
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
