import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { AuthService, User } from '../services/auth';
import { UserProfileService, UserProfile } from '../services/userProfile';
import { EnhancedRunnerProfileService } from '../services/enhancedRunnerProfile';
import { PhotoManager } from '../services/photoManager';
import {
  EnhancedRunnerProfile,
  EnhancedRunnerPhoto,
  CreateEnhancedRunnerProfileData,
  UpdateEnhancedRunnerProfileData,
  NotificationSettings,
  PhotoUploadProgress,
  RunnerProfileStats,
  EYE_COLORS,
  REMINDER_FREQUENCIES,
} from '../types/enhancedRunnerProfile';
import { ValidationUtils } from '../utils/validation';
import { RunnerValidationUtils } from '../utils/runnerValidation';

export default function EnhancedProfileScreen() {
  const queryClient = useQueryClient();
  
  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [runnerProfile, setRunnerProfile] = useState<EnhancedRunnerProfile | null>(null);
  const [runnerPhotos, setRunnerPhotos] = useState<EnhancedRunnerPhoto[]>([]);
  const [profileStats, setProfileStats] = useState<RunnerProfileStats | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    reminderFrequency: 'weekly'
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Editing states
  const [isEditingRunnerProfile, setIsEditingRunnerProfile] = useState(false);
  const [isEditingNotifications, setIsEditingNotifications] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<EnhancedRunnerPhoto | null>(null);

  // Form data
  const [formData, setFormData] = useState<CreateEnhancedRunnerProfileData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    eyeColor: 'Brown',
    medicalConditions: [],
    additionalNotes: '',
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Fetch user profile
  const { data: userProfileData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['userProfile'],
    queryFn: UserProfileService.getProfile,
  });

  // Fetch runner profile
  const { data: runnerProfileData, isLoading: isLoadingRunner } = useQuery({
    queryKey: ['enhancedRunnerProfile'],
    queryFn: EnhancedRunnerProfileService.getRunnerProfile,
  });

  // Fetch runner photos
  const { data: photosData, isLoading: isLoadingPhotos } = useQuery({
    queryKey: ['runnerPhotos'],
    queryFn: EnhancedRunnerProfileService.getPhotos,
    enabled: !!runnerProfileData,
  });

  // Fetch notification settings
  const { data: notificationData } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: EnhancedRunnerProfileService.getNotificationSettings,
  });

  // Fetch profile stats
  const { data: statsData } = useQuery({
    queryKey: ['profileStats'],
    queryFn: EnhancedRunnerProfileService.getProfileStats,
    enabled: !!runnerProfileData,
  });

  // Update state when data changes
  useEffect(() => {
    if (userProfileData) {
      setUserProfile(userProfileData);
    }
  }, [userProfileData]);

  useEffect(() => {
    if (runnerProfileData) {
      setRunnerProfile(runnerProfileData);
      setFormData({
        firstName: runnerProfileData.firstName,
        lastName: runnerProfileData.lastName,
        dateOfBirth: runnerProfileData.dateOfBirth,
        height: runnerProfileData.height,
        weight: runnerProfileData.weight,
        eyeColor: runnerProfileData.eyeColor,
        medicalConditions: runnerProfileData.medicalConditions,
        additionalNotes: runnerProfileData.additionalNotes,
      });
    }
  }, [runnerProfileData]);

  useEffect(() => {
    if (photosData) {
      setRunnerPhotos(photosData);
    }
  }, [photosData]);

  useEffect(() => {
    if (notificationData) {
      setNotificationSettings(notificationData);
    }
  }, [notificationData]);

  useEffect(() => {
    if (statsData) {
      setProfileStats(statsData);
    }
  }, [statsData]);

  useEffect(() => {
    setIsLoading(isLoadingUser || isLoadingRunner || isLoadingPhotos);
  }, [isLoadingUser, isLoadingRunner, isLoadingPhotos]);

  // Handle form input changes
  const handleInputChange = (field: keyof CreateEnhancedRunnerProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Add medical condition
  const addMedicalCondition = (condition: string) => {
    if (condition.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, condition.trim()]
      }));
    }
  };

  // Remove medical condition
  const removeMedicalCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string[]> = {};

    // Validate first name
    const firstNameValidation = ValidationUtils.validateName(formData.firstName, 'First name');
    if (!firstNameValidation.isValid) errors.firstName = firstNameValidation.errors;

    // Validate last name
    const lastNameValidation = ValidationUtils.validateName(formData.lastName, 'Last name');
    if (!lastNameValidation.isValid) errors.lastName = lastNameValidation.errors;

    // Validate date of birth
    const dobValidation = RunnerValidationUtils.validateDateOfBirth(formData.dateOfBirth);
    if (!dobValidation.isValid) errors.dateOfBirth = dobValidation.errors;

    // Validate height
    const heightValidation = RunnerValidationUtils.validateHeight(formData.height);
    if (!heightValidation.isValid) errors.height = heightValidation.errors;

    // Validate weight
    const weightValidation = RunnerValidationUtils.validateWeight(formData.weight);
    if (!weightValidation.isValid) errors.weight = weightValidation.errors;

    // Validate eye color
    const eyeColorValidation = RunnerValidationUtils.validateEyeColor(formData.eyeColor);
    if (!eyeColorValidation.isValid) errors.eyeColor = eyeColorValidation.errors;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save runner profile
  const handleSaveRunnerProfile = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    setIsSaving(true);
    try {
      if (runnerProfile) {
        // Update existing profile
        const updateData: UpdateEnhancedRunnerProfileData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          height: formData.height,
          weight: formData.weight,
          eyeColor: formData.eyeColor,
          medicalConditions: formData.medicalConditions,
          additionalNotes: formData.additionalNotes,
        };
        await EnhancedRunnerProfileService.updateRunnerProfile(updateData);
        Alert.alert('Success', 'Runner profile updated successfully!');
      } else {
        // Create new profile
        await EnhancedRunnerProfileService.createRunnerProfile(formData);
        Alert.alert('Success', 'Runner profile created successfully!');
      }
      
      await queryClient.invalidateQueries({ queryKey: ['enhancedRunnerProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['profileStats'] });
      setIsEditingRunnerProfile(false);
    } catch (error: any) {
      console.error('Failed to save runner profile:', error);
      Alert.alert('Error', error.message || 'Failed to save runner profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async () => {
    const option = await PhotoManager.showPhotoOptions();
    if (option === 'cancel') return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let imageUri: string | null = null;

      if (option === 'camera') {
        imageUri = await PhotoManager.takePhoto((progress) => {
          setUploadProgress(progress.progress);
        });
      } else if (option === 'gallery') {
        const uris = await PhotoManager.pickImages(1, (progress) => {
          setUploadProgress(progress.progress);
        });
        imageUri = uris[0] || null;
      }

      if (imageUri) {
        const result = await EnhancedRunnerProfileService.uploadPhoto(imageUri, (progress) => {
          setUploadProgress(progress);
        });

        if (result.success) {
          Alert.alert('Success', 'Photo uploaded successfully!');
          await queryClient.invalidateQueries({ queryKey: ['runnerPhotos'] });
          await queryClient.invalidateQueries({ queryKey: ['enhancedRunnerProfile'] });
        } else {
          Alert.alert('Error', result.error || 'Failed to upload photo.');
        }
      }
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      Alert.alert('Error', error.message || 'Failed to upload photo.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle photo deletion
  const handleDeletePhoto = async (photo: EnhancedRunnerPhoto) => {
    const confirmed = await PhotoManager.confirmPhotoDeletion(photo.fileName);
    if (!confirmed) return;

    try {
      await EnhancedRunnerProfileService.deletePhoto(photo.id);
      Alert.alert('Success', 'Photo deleted successfully!');
      await queryClient.invalidateQueries({ queryKey: ['runnerPhotos'] });
    } catch (error: any) {
      console.error('Failed to delete photo:', error);
      Alert.alert('Error', error.message || 'Failed to delete photo.');
    }
  };

  // Handle set primary photo
  const handleSetPrimaryPhoto = async (photo: EnhancedRunnerPhoto) => {
    const confirmed = await PhotoManager.confirmSetPrimaryPhoto(photo.fileName);
    if (!confirmed) return;

    try {
      await EnhancedRunnerProfileService.setPrimaryPhoto(photo.id);
      Alert.alert('Success', 'Primary photo set successfully!');
      await queryClient.invalidateQueries({ queryKey: ['runnerPhotos'] });
    } catch (error: any) {
      console.error('Failed to set primary photo:', error);
      Alert.alert('Error', error.message || 'Failed to set primary photo.');
    }
  };

  // Handle notification settings update
  const handleUpdateNotificationSettings = async () => {
    try {
      await EnhancedRunnerProfileService.updateNotificationSettings(notificationSettings);
      Alert.alert('Success', 'Notification settings updated successfully!');
      await queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      setIsEditingNotifications(false);
    } catch (error: any) {
      console.error('Failed to update notification settings:', error);
      Alert.alert('Error', error.message || 'Failed to update notification settings.');
    }
  };

  // Render profile header
  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        {userProfile?.profileImageUrl ? (
          <Image source={{ uri: userProfile.profileImageUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {userProfile?.firstName?.[0] || userProfile?.name?.[0] || 'U'}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.userName}>
        {userProfile?.firstName && userProfile?.lastName
          ? `${userProfile.firstName} ${userProfile.lastName}`
          : userProfile?.name || 'User'}
      </Text>
      <Text style={styles.userEmail}>{userProfile?.email}</Text>
      {userProfile?.memberSince && (
        <Text style={styles.memberSince}>Member since {new Date(userProfile.memberSince).getFullYear()}</Text>
      )}
    </View>
  );

  // Render runner profile section
  const renderRunnerProfileSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Runner Profile</Text>
        {runnerProfile ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditingRunnerProfile(!isEditingRunnerProfile)}
          >
            <Text style={styles.editButtonText}>
              {isEditingRunnerProfile ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setIsEditingRunnerProfile(true)}
          >
            <Text style={styles.createButtonText}>Create Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {runnerProfile ? (
        <View style={styles.runnerProfileContent}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileText}>
              <Text style={styles.label}>Name:</Text> {runnerProfile.firstName} {runnerProfile.lastName}
            </Text>
            <Text style={styles.profileText}>
              <Text style={styles.label}>Age:</Text> {runnerProfile.age} years old
            </Text>
            <Text style={styles.profileText}>
              <Text style={styles.label}>Height:</Text> {runnerProfile.height}
            </Text>
            <Text style={styles.profileText}>
              <Text style={styles.label}>Weight:</Text> {runnerProfile.weight}
            </Text>
            <Text style={styles.profileText}>
              <Text style={styles.label}>Eye Color:</Text> {runnerProfile.eyeColor}
            </Text>
            {runnerProfile.medicalConditions.length > 0 && (
              <Text style={styles.profileText}>
                <Text style={styles.label}>Medical Conditions:</Text> {runnerProfile.medicalConditions.join(', ')}
              </Text>
            )}
            {runnerProfile.additionalNotes && (
              <Text style={styles.profileText}>
                <Text style={styles.label}>Notes:</Text> {runnerProfile.additionalNotes}
              </Text>
            )}
          </View>

          {isEditingRunnerProfile && (
            <View style={styles.editForm}>
              <TextInput
                style={[styles.input, validationErrors.firstName && styles.inputError]}
                value={formData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
                placeholder="First Name"
                autoCapitalize="words"
              />
              {validationErrors.firstName && (
                <Text style={styles.errorText}>{validationErrors.firstName[0]}</Text>
              )}

              <TextInput
                style={[styles.input, validationErrors.lastName && styles.inputError]}
                value={formData.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
                placeholder="Last Name"
                autoCapitalize="words"
              />
              {validationErrors.lastName && (
                <Text style={styles.errorText}>{validationErrors.lastName[0]}</Text>
              )}

              <TextInput
                style={[styles.input, validationErrors.dateOfBirth && styles.inputError]}
                value={formData.dateOfBirth}
                onChangeText={(text) => handleInputChange('dateOfBirth', text)}
                placeholder="Date of Birth (YYYY-MM-DD)"
                keyboardType="numeric"
              />
              {validationErrors.dateOfBirth && (
                <Text style={styles.errorText}>{validationErrors.dateOfBirth[0]}</Text>
              )}

              <TextInput
                style={[styles.input, validationErrors.height && styles.inputError]}
                value={formData.height}
                onChangeText={(text) => handleInputChange('height', text)}
                placeholder="Height (e.g., 5'8\" or 175cm)"
              />
              {validationErrors.height && (
                <Text style={styles.errorText}>{validationErrors.height[0]}</Text>
              )}

              <TextInput
                style={[styles.input, validationErrors.weight && styles.inputError]}
                value={formData.weight}
                onChangeText={(text) => handleInputChange('weight', text)}
                placeholder="Weight (e.g., 150 lbs or 68 kg)"
              />
              {validationErrors.weight && (
                <Text style={styles.errorText}>{validationErrors.weight[0]}</Text>
              )}

              <View style={styles.medicalConditionsContainer}>
                <Text style={styles.medicalConditionsTitle}>Medical Conditions:</Text>
                {formData.medicalConditions.map((condition, index) => (
                  <View key={index} style={styles.medicalConditionItem}>
                    <Text style={styles.medicalConditionText}>{condition}</Text>
                    <TouchableOpacity
                      style={styles.removeConditionButton}
                      onPress={() => removeMedicalCondition(index)}
                    >
                      <Text style={styles.removeConditionText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TextInput
                  style={styles.input}
                  placeholder="Add medical condition"
                  onSubmitEditing={(e) => {
                    addMedicalCondition(e.nativeEvent.text);
                    e.nativeEvent.text = '';
                  }}
                />
              </View>

              <TextInput
                style={[styles.textArea, validationErrors.additionalNotes && styles.inputError]}
                value={formData.additionalNotes}
                onChangeText={(text) => handleInputChange('additionalNotes', text)}
                placeholder="Additional Notes"
                multiline
                numberOfLines={3}
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsEditingRunnerProfile(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveRunnerProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noProfileContainer}>
          <Text style={styles.noProfileText}>No runner profile created yet.</Text>
          <Text style={styles.noProfileDescription}>
            Create a runner profile to help with identification in case of emergency.
          </Text>
        </View>
      )}
    </View>
  );

  // Render photos section
  const renderPhotosSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Photos ({runnerPhotos.length}/10)</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handlePhotoUpload}
          disabled={isUploading || runnerPhotos.length >= 10}
        >
          {isUploading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.uploadButtonText}>Upload Photos</Text>
          )}
        </TouchableOpacity>
      </View>

      {isUploading && uploadProgress > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
        </View>
      )}

      {runnerPhotos.length === 0 ? (
        <View style={styles.noPhotosContainer}>
          <Text style={styles.noPhotosText}>No photos uploaded yet.</Text>
          <Text style={styles.noPhotosDescription}>
            Upload photos to help identify the runner.
          </Text>
        </View>
      ) : (
        <View style={styles.photosGrid}>
          {runnerPhotos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              style={styles.photoItem}
              onPress={() => {
                setSelectedPhoto(photo);
                setShowPhotoModal(true);
              }}
            >
              <Image source={{ uri: photo.fileUrl }} style={styles.photoImage} />
              {photo.isPrimary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              )}
              <View style={styles.photoActions}>
                {!photo.isPrimary && (
                  <TouchableOpacity
                    style={styles.photoActionButton}
                    onPress={() => handleSetPrimaryPhoto(photo)}
                  >
                    <Text style={styles.photoActionText}>Set Primary</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.photoActionButton, styles.deleteButton]}
                  onPress={() => handleDeletePhoto(photo)}
                >
                  <Text style={styles.photoActionText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  // Render notification settings section
  const renderNotificationSettingsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditingNotifications(!isEditingNotifications)}
        >
          <Text style={styles.editButtonText}>
            {isEditingNotifications ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {isEditingNotifications ? (
        <View style={styles.notificationForm}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Email Notifications</Text>
            <Switch
              value={notificationSettings.emailNotifications}
              onValueChange={(value) => setNotificationSettings(prev => ({
                ...prev,
                emailNotifications: value
              }))}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Push Notifications</Text>
            <Switch
              value={notificationSettings.pushNotifications}
              onValueChange={(value) => setNotificationSettings(prev => ({
                ...prev,
                pushNotifications: value
              }))}
            />
          </View>
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsEditingNotifications(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateNotificationSettings}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationText}>
            Email: {notificationSettings.emailNotifications ? 'Enabled' : 'Disabled'}
          </Text>
          <Text style={styles.notificationText}>
            Push: {notificationSettings.pushNotifications ? 'Enabled' : 'Disabled'}
          </Text>
          <Text style={styles.notificationText}>
            Frequency: {notificationSettings.reminderFrequency}
          </Text>
        </View>
      )}
    </View>
  );

  // Render profile stats
  const renderProfileStats = () => {
    if (!profileStats) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileStats.totalPhotos}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileStats.profileCompleteness}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileStats.daysSinceLastUpdate}</Text>
            <Text style={styles.statLabel}>Days Since Update</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderProfileHeader()}
        {renderRunnerProfileSection()}
        {renderPhotosSection()}
        {renderNotificationSettingsSection()}
        {renderProfileStats()}
      </ScrollView>

      {/* Photo Modal */}
      <Modal
        visible={showPhotoModal}
        transparent={true}
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalBackground}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowPhotoModal(false)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto.fileUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.gray[600],
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  userName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  memberSince: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[600],
    borderRadius: radii.md,
  },
  editButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  createButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.success[600],
    borderRadius: radii.md,
  },
  createButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  runnerProfileContent: {
    // Add styles for runner profile content
  },
  profileInfo: {
    // Add styles for profile info
  },
  profileText: {
    fontSize: typography.sizes.base,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  label: {
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  editForm: {
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    backgroundColor: colors.white,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  medicalConditionsContainer: {
    marginBottom: spacing.sm,
  },
  medicalConditionsTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  medicalConditionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  medicalConditionText: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.gray[800],
  },
  removeConditionButton: {
    backgroundColor: colors.error,
    borderRadius: radii.sm,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  removeConditionText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray[200],
    borderRadius: radii.md,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    color: colors.gray[700],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[600],
    borderRadius: radii.md,
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  noProfileContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noProfileText: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  noProfileDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    textAlign: 'center',
  },
  uploadButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[600],
    borderRadius: radii.md,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[600],
  },
  progressText: {
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  noPhotosContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radii.md,
    borderStyle: 'dashed',
  },
  noPhotosText: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  noPhotosDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    textAlign: 'center',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoItem: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary[600],
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  photoActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.xs,
  },
  photoActionButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  photoActionText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
  },
  deleteButton: {
    backgroundColor: colors.error,
    borderRadius: radii.sm,
  },
  notificationForm: {
    marginTop: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  switchLabel: {
    fontSize: typography.sizes.base,
    color: colors.gray[700],
  },
  notificationInfo: {
    // Add styles for notification info
  },
  notificationText: {
    fontSize: typography.sizes.base,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: colors.white,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: typography.sizes.xl,
    color: colors.gray[900],
    fontWeight: typography.weights.bold,
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
  },
});
