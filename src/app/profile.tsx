import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Linking,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { AuthService, User } from '../services/auth';
import { NotificationService } from '../services/notifications';
import { APP_CONSTANTS } from '../config/constants';
import { TwoFactorSetup } from '../components/TwoFactorSetup';
import { signalRService } from '../services/signalR';
import * as ImagePicker from 'expo-image-picker';
import { UserProfileService, UserProfile } from '../services/userProfile';
import { EnhancedRunnerProfileService } from '../services/enhancedRunnerProfile';
import { PhotoManager } from '../services/photoManager';
import { ValidationUtils } from '../utils/validation';
import { RunnerValidationUtils } from '../utils/runnerValidation';
import {
  EnhancedRunnerProfile,
  EnhancedRunnerPhoto,
  CreateEnhancedRunnerProfileData,
  UpdateEnhancedRunnerProfileData,
  NotificationSettings,
  PhotoUploadProgress,
  EYE_COLORS,
} from '../types/enhancedRunnerProfile';

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [hasRunnerProfile, setHasRunnerProfile] = useState(false);
  const [caseStats, setCaseStats] = useState({
    totalCases: 0,
    activeCases: 0,
    resolvedCases: 0,
  });

  // Enhanced runner profile state
  const [runnerProfile, setRunnerProfile] = useState<EnhancedRunnerProfile | null>(null);
  const [runnerPhotos, setRunnerPhotos] = useState<EnhancedRunnerPhoto[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    reminderFrequency: 'weekly'
  });

  // Editing states
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isEditingProfileImage, setIsEditingProfileImage] = useState(false);
  const [isEditingRunnerProfile, setIsEditingRunnerProfile] = useState(false);
  const [isEditingNotifications, setIsEditingNotifications] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
  });

  // Enhanced runner profile form data
  const [runnerFormData, setRunnerFormData] = useState<CreateEnhancedRunnerProfileData>({
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
  const [runnerValidationErrors, setRunnerValidationErrors] = useState<Record<string, string[]>>({});

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user'],
    queryFn: AuthService.getCurrentUser,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors (authentication issues)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const {
    data: userProfile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: UserProfileService.getProfile,
    enabled: !!user,
  });

  const {
    data: caseStatistics,
  } = useQuery({
    queryKey: ['caseStatistics'],
    queryFn: UserProfileService.getCaseStatistics,
    enabled: !!user,
  });

  const {
    data: runnerProfileExists,
  } = useQuery({
    queryKey: ['runnerProfileExists'],
    queryFn: UserProfileService.hasRunnerProfile,
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      console.log('[PROFILE] User data loaded:', {
        id: user.id,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      });
      setTwoFactorEnabled(user.twoFactorEnabled);
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phoneNumber: userProfile.phoneNumber || '',
        email: userProfile.email || '',
      });
      setProfileImage(userProfile.profileImageUrl || null);
    }
  }, [userProfile]);

  useEffect(() => {
    if (caseStatistics) {
      setCaseStats(caseStatistics);
    }
  }, [caseStatistics]);

  useEffect(() => {
    if (typeof runnerProfileExists === 'boolean') {
      setHasRunnerProfile(runnerProfileExists);
    }
  }, [runnerProfileExists]);

  useEffect(() => {
    if (error) {
      console.error('[PROFILE] Error loading user data:', error);
    }
  }, [error]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Starting logout process...');
            
            // Clear all local data first
            await AuthService.logout();
            console.log('Auth service logout completed');
            
            // Unregister device for notifications
            try {
              await NotificationService.unregisterDevice();
              console.log('Device unregistered');
            } catch (notificationError) {
              console.warn('Failed to unregister device:', notificationError);
            }
            
            // Force clear any cached data
            console.log('Clearing navigation and redirecting...');
            
            // Navigate to login and clear the navigation stack
            router.dismissAll();
            router.replace('/login');
            
            console.log('Logout completed successfully');
          } catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, try to navigate to login
            try {
              router.dismissAll();
              router.replace('/login');
            } catch (navError) {
              console.error('Navigation error:', navError);
              // Last resort - try to navigate to home
              router.replace('/');
            }
          }
        },
      },
    ]);
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      await NotificationService.registerDevice();
    } else {
      await NotificationService.unregisterDevice();
    }
  };

  const handleToggleTwoFactor = async (value: boolean) => {
    try {
      if (value) {
        // Show 2FA setup modal
        setShowTwoFactorSetup(true);
      } else {
        // Disable 2FA
        Alert.alert(
          'Disable 2FA',
          'Enter your current 2FA code to disable two-factor authentication',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                try {
                  // Prompt for 2FA code
                  Alert.prompt(
                    'Enter 2FA Code',
                    'Enter your current 2FA code to disable two-factor authentication',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Disable',
                        style: 'destructive',
                        onPress: async (code?: string) => {
                          if (code && code.length === 6) {
                            await AuthService.disableTwoFactor(code);
                            setTwoFactorEnabled(false);
                            Alert.alert('Success', 'Two-factor authentication has been disabled');
                          } else {
                            Alert.alert('Error', 'Please enter a valid 6-digit code');
                          }
                        },
                      },
                    ],
                    'plain-text',
                    '',
                    'numeric'
                  );
                } catch (error) {
                  Alert.alert('Error', 'Failed to disable two-factor authentication');
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update two-factor authentication settings');
    }
  };

  const handleTwoFactorSetupSuccess = () => {
    setTwoFactorEnabled(true);
    Alert.alert('Success', 'Two-factor authentication has been enabled successfully');
  };

  const handleTestNotification = async () => {
    await NotificationService.testNotification();
    Alert.alert('Test Sent', 'A test notification has been sent');
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        // Here you would typically upload the image to your server
        console.log('Profile image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleCreateRunnerProfile = () => {
    // Navigate to runner profile creation
    router.push('/portal/runner-profile');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string[]> = {};

    // Validate first name
    const firstNameValidation = ValidationUtils.validateName(formData.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      errors.firstName = firstNameValidation.errors;
    }

    // Validate last name
    const lastNameValidation = ValidationUtils.validateName(formData.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      errors.lastName = lastNameValidation.errors;
    }

    // Validate phone number
    const phoneValidation = ValidationUtils.validatePhoneNumber(formData.phoneNumber);
    if (!phoneValidation.isValid) {
      errors.phoneNumber = phoneValidation.errors;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePersonalInfo = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await UserProfileService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
      });

      // Refresh the profile data
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      
      setIsEditingPersonalInfo(false);
      Alert.alert('Success', 'Personal information updated successfully!');
    } catch (error: any) {
      console.error('Failed to save personal info:', error);
      setSaveError(error.message || 'Failed to save personal information');
      Alert.alert('Error', error.message || 'Failed to save personal information');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfileImage = async () => {
    if (!profileImage) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await UserProfileService.uploadProfileImage(profileImage);
      
      if (result.success) {
        // Refresh the profile data
        await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        
        setIsEditingProfileImage(false);
        Alert.alert('Success', 'Profile image updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to upload image');
      }
    } catch (error: any) {
      console.error('Failed to save profile image:', error);
      setSaveError(error.message || 'Failed to save profile image');
      Alert.alert('Error', error.message || 'Failed to save profile image');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original values
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phoneNumber: userProfile.phoneNumber || '',
        email: userProfile.email || '',
      });
    }
    setValidationErrors({});
    setIsEditingPersonalInfo(false);
    setIsEditingProfileImage(false);
    setSaveError(null);
  };

  // Enhanced Runner Profile Handlers
  const handleRunnerInputChange = (field: keyof CreateEnhancedRunnerProfileData, value: any) => {
    setRunnerFormData(prev => ({ ...prev, [field]: value }));
    if (runnerValidationErrors[field]) {
      setRunnerValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addMedicalCondition = (condition: string) => {
    if (condition.trim()) {
      setRunnerFormData(prev => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, condition.trim()]
      }));
    }
  };

  const removeMedicalCondition = (index: number) => {
    setRunnerFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.filter((_, i) => i !== index)
    }));
  };

  const validateRunnerForm = (): boolean => {
    const errors: Record<string, string[]> = {};

    // Validate first name
    const firstNameValidation = ValidationUtils.validateName(runnerFormData.firstName, 'First name');
    if (!firstNameValidation.isValid) errors.firstName = firstNameValidation.errors;

    // Validate last name
    const lastNameValidation = ValidationUtils.validateName(runnerFormData.lastName, 'Last name');
    if (!lastNameValidation.isValid) errors.lastName = lastNameValidation.errors;

    // Validate date of birth
    const dobValidation = RunnerValidationUtils.validateDateOfBirth(runnerFormData.dateOfBirth);
    if (!dobValidation.isValid) errors.dateOfBirth = dobValidation.errors;

    // Validate height
    const heightValidation = RunnerValidationUtils.validateHeight(runnerFormData.height);
    if (!heightValidation.isValid) errors.height = heightValidation.errors;

    // Validate weight
    const weightValidation = RunnerValidationUtils.validateWeight(runnerFormData.weight);
    if (!weightValidation.isValid) errors.weight = weightValidation.errors;

    // Validate eye color
    const eyeColorValidation = RunnerValidationUtils.validateEyeColor(runnerFormData.eyeColor);
    if (!eyeColorValidation.isValid) errors.eyeColor = eyeColorValidation.errors;

    setRunnerValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRunnerProfile = async () => {
    if (!validateRunnerForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (runnerProfile) {
        // Update existing profile
        const updateData: UpdateEnhancedRunnerProfileData = {
          firstName: runnerFormData.firstName,
          lastName: runnerFormData.lastName,
          dateOfBirth: runnerFormData.dateOfBirth,
          height: runnerFormData.height,
          weight: runnerFormData.weight,
          eyeColor: runnerFormData.eyeColor,
          medicalConditions: runnerFormData.medicalConditions,
          additionalNotes: runnerFormData.additionalNotes,
        };
        await EnhancedRunnerProfileService.updateRunnerProfile(updateData);
        Alert.alert('Success', 'Runner profile updated successfully!');
      } else {
        // Create new profile
        await EnhancedRunnerProfileService.createRunnerProfile(runnerFormData);
        Alert.alert('Success', 'Runner profile created successfully!');
      }
      
      await queryClient.invalidateQueries({ queryKey: ['enhancedRunnerProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['runnerPhotos'] });
      setIsEditingRunnerProfile(false);
    } catch (error: any) {
      console.error('Failed to save runner profile:', error);
      setSaveError(error.message || 'Failed to save runner profile');
      Alert.alert('Error', error.message || 'Failed to save runner profile.');
    } finally {
      setIsSaving(false);
    }
  };

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


  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'super_admin':
        return colors.error;
      case 'admin':
        return colors.warning[600];
      case 'moderator':
        return colors.info[600];
      case 'runner':
        return colors.success[600];
      default:
        return colors.gray[600];
    }
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.profileAvatar}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        )}
      </View>
      <Text style={styles.profileName}>{user?.name || 'User'}</Text>
      <Text style={styles.profileEmail}>{user?.email}</Text>
      <View style={styles.memberSinceContainer}>
        <Text style={styles.memberSinceLabel}>MEMBER SINCE</Text>
        <Text style={styles.memberSinceValue}>Unknown</Text>
      </View>
    </View>
  );

  const renderProfileImageSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Profile Image</Text>
        {!isEditingProfileImage ? (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditingProfileImage(true)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveProfileImage}
              disabled={isSaving || !profileImage}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {saveError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{saveError}</Text>
        </View>
      )}

      <View style={styles.profileImageContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImagePreview} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImageText}>No profile image uploaded</Text>
          </View>
        )}
        
        {isEditingProfileImage && (
          <TouchableOpacity style={styles.uploadButton} onPress={handleImagePicker}>
            <Text style={styles.uploadButtonText}>📷 {profileImage ? 'Change Image' : 'Upload Image'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPersonalInfoSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        {!isEditingPersonalInfo ? (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditingPersonalInfo(true)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSavePersonalInfo}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {saveError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{saveError}</Text>
        </View>
      )}

      <View style={styles.personalInfoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>FIRST NAME</Text>
          {isEditingPersonalInfo ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, validationErrors.firstName && styles.inputError]}
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                placeholder="Enter first name"
                autoCapitalize="words"
              />
              {validationErrors.firstName && (
                <Text style={styles.validationError}>{validationErrors.firstName[0]}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>{formData.firstName || 'Not provided'}</Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>LAST NAME</Text>
          {isEditingPersonalInfo ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, validationErrors.lastName && styles.inputError]}
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                placeholder="Enter last name"
                autoCapitalize="words"
              />
              {validationErrors.lastName && (
                <Text style={styles.validationError}>{validationErrors.lastName[0]}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>{formData.lastName || 'Not provided'}</Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>PHONE NUMBER</Text>
          {isEditingPersonalInfo ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, validationErrors.phoneNumber && styles.inputError]}
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
              {validationErrors.phoneNumber && (
                <Text style={styles.validationError}>{validationErrors.phoneNumber[0]}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>{formData.phoneNumber || 'Not provided'}</Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>EMAIL</Text>
          <Text style={styles.infoValue}>{formData.email}</Text>
        </View>
      </View>
    </View>
  );

  const renderAccountStatsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account Statistics</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>TOTAL CASES REPORTED</Text>
          <Text style={styles.statValue}>{caseStats.totalCases}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ACTIVE CASES</Text>
          <Text style={styles.statValue}>{caseStats.activeCases}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>RESOLVED CASES</Text>
          <Text style={styles.statValue}>{caseStats.resolvedCases}</Text>
        </View>
      </View>
    </View>
  );

  const renderRunnerProfileSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏃‍♂️ Enhanced Runner Profile</Text>
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
                style={[styles.input, runnerValidationErrors.firstName && styles.inputError]}
                value={runnerFormData.firstName}
                onChangeText={(text) => handleRunnerInputChange('firstName', text)}
                placeholder="First Name"
                autoCapitalize="words"
              />
              {runnerValidationErrors.firstName && (
                <Text style={styles.errorText}>{runnerValidationErrors.firstName[0]}</Text>
              )}

              <TextInput
                style={[styles.input, runnerValidationErrors.lastName && styles.inputError]}
                value={runnerFormData.lastName}
                onChangeText={(text) => handleRunnerInputChange('lastName', text)}
                placeholder="Last Name"
                autoCapitalize="words"
              />
              {runnerValidationErrors.lastName && (
                <Text style={styles.errorText}>{runnerValidationErrors.lastName[0]}</Text>
              )}

              <TextInput
                style={[styles.input, runnerValidationErrors.dateOfBirth && styles.inputError]}
                value={runnerFormData.dateOfBirth}
                onChangeText={(text) => handleRunnerInputChange('dateOfBirth', text)}
                placeholder="Date of Birth (YYYY-MM-DD)"
                keyboardType="numeric"
              />
              {runnerValidationErrors.dateOfBirth && (
                <Text style={styles.errorText}>{runnerValidationErrors.dateOfBirth[0]}</Text>
              )}

              <TextInput
                style={[styles.input, runnerValidationErrors.height && styles.inputError]}
                value={runnerFormData.height}
                onChangeText={(text) => handleRunnerInputChange('height', text)}
                placeholder="Height (e.g., 5'8\" or 175cm)"
              />
              {runnerValidationErrors.height && (
                <Text style={styles.errorText}>{runnerValidationErrors.height[0]}</Text>
              )}

              <TextInput
                style={[styles.input, runnerValidationErrors.weight && styles.inputError]}
                value={runnerFormData.weight}
                onChangeText={(text) => handleRunnerInputChange('weight', text)}
                placeholder="Weight (e.g., 150 lbs or 68 kg)"
              />
              {runnerValidationErrors.weight && (
                <Text style={styles.errorText}>{runnerValidationErrors.weight[0]}</Text>
              )}

              <View style={styles.medicalConditionsContainer}>
                <Text style={styles.medicalConditionsTitle}>Medical Conditions:</Text>
                {runnerFormData.medicalConditions.map((condition, index) => (
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
                style={[styles.textArea, runnerValidationErrors.additionalNotes && styles.inputError]}
                value={runnerFormData.additionalNotes}
                onChangeText={(text) => handleRunnerInputChange('additionalNotes', text)}
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

  const renderRunnerPhotosSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📸 Runner Photos ({runnerPhotos.length}/10)</Text>
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
                // Handle photo preview
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

  const renderNotificationSettingsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔔 Notification Settings</Text>
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

  const renderCaseStatusSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📁 My Case Status</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.caseStatusContainer}>
        <View style={styles.caseStatusIcon}>
          <Text style={styles.caseStatusIconText}>📋</Text>
        </View>
        <Text style={styles.noCaseText}>No Case Yet</Text>
        <Text style={styles.noCaseDescription}>
          Your runner profile doesn't have a case yet. Cases are automatically created when you sign up as a runner.
        </Text>
      </View>
    </View>
  );

  const renderSecuritySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
          <Text style={styles.settingDescription}>
            Add an extra layer of security to your account
          </Text>
        </View>
        <Switch
          value={twoFactorEnabled}
          onValueChange={handleToggleTwoFactor}
          trackColor={{ false: colors.gray[600], true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>
    </View>
  );

  const renderNotificationsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Text style={styles.settingDescription}>
            Receive notifications for new cases and updates
          </Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleToggleNotifications}
          trackColor={{ false: colors.gray[600], true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>
      <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
        <Text style={styles.testButtonText}>Send Test Notification</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAdminSection = () => {
    // Only show admin section if user has admin role
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin')}>
          <Text style={styles.menuItemText}>Admin Dashboard</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/cases')}>
          <Text style={styles.menuItemText}>Manage Cases</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/users')}>
          <Text style={styles.menuItemText}>Manage Users</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/analytics')}>
          <Text style={styles.menuItemText}>Analytics</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleOpenURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const renderNavigationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/cases')}>
        <Text style={styles.menuItemText}>View Cases</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/map')}>
        <Text style={styles.menuItemText}>Map View</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/report-sighting')}>
        <Text style={styles.menuItemText}>Report Sighting</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/')}>
        <Text style={styles.menuItemText}>Home</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAppSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>App</Text>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => handleOpenURL('https://241runnersawareness.org/about.html')}
      >
        <Text style={styles.menuItemText}>About Us</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => handleOpenURL('https://241runnersawareness.org/privacy.html')}
      >
        <Text style={styles.menuItemText}>Privacy Policy</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => handleOpenURL('https://241runnersawareness.org/terms.html')}
      >
        <Text style={styles.menuItemText}>Terms of Service</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => handleOpenURL('https://241runnersawareness.org/support')}
      >
        <Text style={styles.menuItemText}>Support</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderProfileHeader()}
          {renderProfileImageSection()}
          {renderPersonalInfoSection()}
          {renderAccountStatsSection()}
          {renderRunnerProfileSection()}
          {renderRunnerPhotosSection()}
          {renderNotificationSettingsSection()}
          {renderCaseStatusSection()}
          {renderAdminSection()}
          {renderSecuritySection()}
          {renderNotificationsSection()}
          {renderAppSection()}
        </View>
      </ScrollView>

      <TwoFactorSetup
        visible={showTwoFactorSetup}
        onClose={() => setShowTwoFactorSetup(false)}
        onSuccess={handleTwoFactorSetupSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DC2626', // Red background like static site
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  backButtonText: {
    fontSize: typography.sizes.base,
    color: colors.primary[600],
    fontWeight: typography.weights.medium,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
  },
  logoutText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    fontWeight: typography.weights.medium,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  memberSinceContainer: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  memberSinceLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    fontWeight: typography.weights.medium,
    letterSpacing: 0.5,
  },
  memberSinceValue: {
    fontSize: typography.sizes.base,
    color: colors.gray[700],
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileImagePlaceholder: {
    flex: 1,
    height: 80,
    backgroundColor: colors.gray[200],
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileImageText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  uploadButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  personalInfoContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    fontWeight: typography.weights.medium,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    fontWeight: typography.weights.semibold,
  },
  statsContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  statItem: {
    marginBottom: spacing.md,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    fontWeight: typography.weights.medium,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.lg,
    color: colors.gray[900],
    fontWeight: typography.weights.bold,
  },
  runnerProfileContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  runnerProfileText: {
    fontSize: typography.sizes.base,
    color: colors.gray[700],
  },
  noRunnerProfileContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  runnerIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.gray[100],
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  runnerIcon: {
    fontSize: 32,
  },
  noRunnerProfileTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  noRunnerProfileDescription: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  createRunnerButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  createRunnerButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  viewAllButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  viewAllButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  caseStatusContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  caseStatusIcon: {
    width: 60,
    height: 60,
    backgroundColor: colors.gray[100],
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  caseStatusIconText: {
    fontSize: 24,
  },
  noCaseText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  noCaseDescription: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    backgroundColor: colors.gray[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  saveButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  inputContainer: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  validationError: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  profileImagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 4,
    borderColor: colors.primary[100],
  },
  avatarText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  profileName: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: typography.sizes.lg,
    color: colors.gray[600],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  profileRoleBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  profileRoleText: {
    fontSize: typography.sizes.base,
    color: colors.white,
    fontWeight: typography.weights.medium,
  },
  section: {
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  profileInfo: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.sm,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  profileLabel: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    fontWeight: typography.weights.medium,
  },
  profileValue: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
    fontWeight: typography.weights.medium,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    lineHeight: 18,
  },
  testButton: {
    backgroundColor: colors.gray[800],
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  testButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  menuItemText: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    fontWeight: typography.weights.medium,
  },
  menuItemArrow: {
    fontSize: typography.sizes.lg,
    color: colors.gray[400],
  },
  // Enhanced Runner Profile Styles
  runnerProfileContent: {
    // Add styles for runner profile content
  },
  profileInfo: {
    marginBottom: spacing.md,
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
  // Photo Management Styles
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
  // Notification Settings Styles
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
    // Add styles for notification info display
  },
  notificationText: {
    fontSize: typography.sizes.base,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
});
