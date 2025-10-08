import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { EnhancedRunnerProfileService } from '../../services/enhancedRunnerProfile';
import { 
  EnhancedRunnerProfile, 
  CreateEnhancedRunnerProfileData, 
  UpdateEnhancedRunnerProfileData,
  EnhancedRunnerPhoto 
} from '../../types/enhancedRunnerProfile';
import RunnerProfileForm from '../../components/RunnerProfileForm';
import PhotoUpload from '../../components/PhotoUpload';

export default function RunnerProfileScreen() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: runnerProfile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['enhancedRunnerProfile'],
    queryFn: EnhancedRunnerProfileService.getRunnerProfile,
  });

  const {
    data: hasProfile,
  } = useQuery({
    queryKey: ['hasRunnerProfile'],
    queryFn: EnhancedRunnerProfileService.hasRunnerProfile,
  });

  useEffect(() => {
    if (hasProfile === false) {
      setIsCreating(true);
    }
  }, [hasProfile]);

  const handleCreateProfile = async (data: CreateEnhancedRunnerProfileData) => {
    setIsLoading(true);
    try {
      await EnhancedRunnerProfileService.createRunnerProfile(data);
      await queryClient.invalidateQueries({ queryKey: ['enhancedRunnerProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['hasRunnerProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setIsCreating(false);
      Alert.alert('Success', 'Runner profile created successfully!');
      router.back();
    } catch (error: any) {
      console.error('Failed to create runner profile:', error);
      Alert.alert('Error', error.message || 'Failed to create runner profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (data: UpdateEnhancedRunnerProfileData) => {
    setIsLoading(true);
    try {
      await EnhancedRunnerProfileService.updateRunnerProfile(data);
      await queryClient.invalidateQueries({ queryKey: ['enhancedRunnerProfile'] });
      setIsEditing(false);
      Alert.alert('Success', 'Runner profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update runner profile:', error);
      Alert.alert('Error', error.message || 'Failed to update runner profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      'Delete Runner Profile',
      'Are you sure you want to delete your runner profile? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await EnhancedRunnerProfileService.deleteRunnerProfile();
              await queryClient.invalidateQueries({ queryKey: ['enhancedRunnerProfile'] });
              await queryClient.invalidateQueries({ queryKey: ['hasRunnerProfile'] });
              await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
              setIsCreating(true);
              Alert.alert('Success', 'Runner profile deleted successfully!');
              router.back();
            } catch (error: any) {
              console.error('Failed to delete runner profile:', error);
              Alert.alert('Error', error.message || 'Failed to delete runner profile');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderProfileView = (profile: RunnerProfile) => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Runner Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Text style={styles.profileName}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Text style={styles.profileAge}>
            Age: {RunnerProfileService.calculateAge(profile.dateOfBirth)}
          </Text>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>First Name</Text>
              <Text style={styles.infoValue}>{profile.firstName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Name</Text>
              <Text style={styles.infoValue}>{profile.lastName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>
                {new Date(profile.dateOfBirth).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Height</Text>
              <Text style={styles.infoValue}>{profile.height}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weight</Text>
              <Text style={styles.infoValue}>{profile.weight}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Eye Color</Text>
              <Text style={styles.infoValue}>{profile.eyeColor}</Text>
            </View>
          </View>
        </View>

        {/* Medical Conditions */}
        {profile.medicalConditions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Conditions</Text>
            <View style={styles.conditionsContainer}>
              {profile.medicalConditions.map((condition, index) => (
                <View key={index} style={styles.conditionTag}>
                  <Text style={styles.conditionText}>{condition}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Additional Notes */}
        {profile.additionalNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.notesText}>{profile.additionalNotes}</Text>
          </View>
        )}

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <PhotoUpload
            photos={profile.photos.map(photo => ({
              id: photo.id,
              fileUrl: photo.fileUrl,
              fileName: photo.fileName,
              isPrimary: photo.isPrimary,
            }))}
            onPhotosChange={() => {}} // Photos are managed separately
            maxPhotos={10}
            disabled={true} // Read-only in view mode
          />
        </View>

        {/* Photo Update Reminder */}
        {RunnerProfileService.needsPhotoUpdate(profile.lastPhotoUpdate) && (
          <View style={styles.reminderContainer}>
            <Text style={styles.reminderTitle}>📸 Photo Update Required</Text>
            <Text style={styles.reminderText}>
              Your photos are {RunnerProfileService.getDaysSinceLastPhotoUpdate(profile.lastPhotoUpdate)} days old. 
              Please update them for better identification.
            </Text>
            <TouchableOpacity style={styles.updatePhotosButton}>
              <Text style={styles.updatePhotosButtonText}>Update Photos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeleteProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  if (isProfileLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading runner profile...</Text>
      </SafeAreaView>
    );
  }

  if (profileError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load runner profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isCreating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Runner Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <RunnerProfileForm
          onSubmit={handleCreateProfile as (data: CreateRunnerProfileData | UpdateRunnerProfileData) => Promise<void>}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </SafeAreaView>
    );
  }

  if (isEditing && runnerProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Runner Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <RunnerProfileForm
          initialData={runnerProfile}
          isEditing={true}
          onSubmit={handleUpdateProfile}
          onCancel={() => setIsEditing(false)}
          isLoading={isLoading}
        />
      </SafeAreaView>
    );
  }

  if (runnerProfile) {
    return (
      <SafeAreaView style={styles.container}>
        {renderProfileView(runnerProfile)}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.errorContainer}>
      <Text style={styles.errorText}>No runner profile found</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
        <Text style={styles.retryButtonText}>Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DC2626',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DC2626',
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    color: colors.white,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.white,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: '#DC2626',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  backButtonText: {
    fontSize: typography.sizes.base,
    color: '#DC2626',
    fontWeight: typography.weights.medium,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
  },
  headerSpacer: {
    width: 60, // Same width as back button for centering
  },
  editButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  editButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  profileHeader: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profileName: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  profileAge: {
    fontSize: typography.sizes.lg,
    color: colors.gray[600],
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  infoContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  infoLabel: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    fontWeight: typography.weights.medium,
  },
  infoValue: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    fontWeight: typography.weights.semibold,
  },
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  conditionTag: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  conditionText: {
    fontSize: typography.sizes.sm,
    color: colors.primary[700],
    fontWeight: typography.weights.medium,
  },
  notesText: {
    fontSize: typography.sizes.base,
    color: colors.gray[700],
    lineHeight: 22,
  },
  reminderContainer: {
    backgroundColor: colors.warning[50],
    borderColor: colors.warning[200],
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  reminderTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.warning[700],
    marginBottom: spacing.sm,
  },
  reminderText: {
    fontSize: typography.sizes.base,
    color: colors.warning[600],
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  updatePhotosButton: {
    backgroundColor: colors.warning[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignSelf: 'flex-start',
  },
  updatePhotosButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  actionButtons: {
    paddingBottom: spacing.xl,
  },
  deleteButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
});
