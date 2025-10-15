import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { PhotoUploadProgress } from '../types/runnerProfile';

interface PhotoUploadProps {
  photos: Array<{
    id: string;
    fileUrl: string;
    fileName: string;
    isPrimary?: boolean;
  }>;
  onPhotosChange: (
    photos: Array<{
      id: string;
      fileUrl: string;
      fileName: string;
      isPrimary?: boolean;
    }>
  ) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const photoSize = (screenWidth - spacing.lg * 3) / 2;

export default function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  disabled = false,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<PhotoUploadProgress[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const handleSelectPhotos = async () => {
    if (disabled || isUploading) return;

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to upload photos.');
        return;
      }

      // Check if we can add more photos
      if (photos.length >= maxPhotos) {
        Alert.alert('Maximum Photos Reached', `You can upload a maximum of ${maxPhotos} photos.`);
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
        selectionLimit: maxPhotos - photos.length,
      });

      if (!result.canceled && result.assets.length > 0) {
        await handleUploadPhotos(result.assets);
      }
    } catch (error) {
      console.error('Error selecting photos:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    }
  };

  const handleUploadPhotos = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setIsUploading(true);
    setUploadProgress([]);

    try {
      const newPhotos = [...photos];

      for (const asset of assets) {
        const fileName = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Validate file size (max 10MB)
        if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
          Alert.alert(
            'File Too Large',
            `${asset.fileName || 'Photo'} is larger than 10MB. Please select a smaller image.`
          );
          continue;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (asset.mimeType && !validTypes.includes(asset.mimeType)) {
          Alert.alert(
            'Invalid File Type',
            `${asset.fileName || 'Photo'} is not a supported image format. Please select a JPEG, PNG, GIF, or WebP image.`
          );
          continue;
        }

        // Add to photos list (simulate upload)
        const newPhoto = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fileUrl: asset.uri,
          fileName: asset.fileName || fileName,
          isPrimary: newPhotos.length === 0, // First photo is primary
        };

        newPhotos.push(newPhoto);
        onPhotosChange(newPhotos);

        // Simulate upload progress
        setUploadProgress(prev => [
          ...prev,
          {
            fileName: asset.fileName || fileName,
            progress: 0,
            status: 'uploading',
          },
        ]);

        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setUploadProgress(prev =>
            prev.map(p => (p.fileName === (asset.fileName || fileName) ? { ...p, progress: i } : p))
          );
        }

        // Mark as completed
        setUploadProgress(prev =>
          prev.map(p =>
            p.fileName === (asset.fileName || fileName)
              ? { ...p, progress: 100, status: 'completed' }
              : p
          )
        );
      }

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 1000);
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Upload Error', 'Failed to upload some photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    if (disabled || isUploading) return;

    Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updatedPhotos = photos.filter(photo => photo.id !== photoId);

          // If we removed the primary photo, make the first remaining photo primary
          if (photos.find(p => p.id === photoId)?.isPrimary && updatedPhotos.length > 0) {
            updatedPhotos[0].isPrimary = true;
          }

          onPhotosChange(updatedPhotos);
        },
      },
    ]);
  };

  const handleSetPrimary = (photoId: string) => {
    if (disabled || isUploading) return;

    const updatedPhotos = photos.map(photo => ({
      ...photo,
      isPrimary: photo.id === photoId,
    }));

    onPhotosChange(updatedPhotos);
  };

  const handleViewPhoto = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setShowPhotoModal(true);
  };

  const renderPhoto = (photo: (typeof photos)[0], index: number) => (
    <View key={photo.id} style={styles.photoContainer}>
      <TouchableOpacity
        style={styles.photoWrapper}
        onPress={() => handleViewPhoto(photo.fileUrl)}
        disabled={disabled}
      >
        <Image source={{ uri: photo.fileUrl }} style={styles.photo} />

        {photo.isPrimary && (
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryText}>Primary</Text>
          </View>
        )}

        {!disabled && (
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRemovePhoto(photo.id)}
            >
              <Text style={styles.actionButtonText}>×</Text>
            </TouchableOpacity>

            {!photo.isPrimary && (
              <TouchableOpacity
                style={[styles.actionButton, styles.setPrimaryButton]}
                onPress={() => handleSetPrimary(photo.id)}
              >
                <Text style={styles.actionButtonText}>★</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderUploadProgress = () => {
    if (uploadProgress.length === 0) return null;

    return (
      <View style={styles.uploadProgressContainer}>
        {uploadProgress.map((progress, index) => (
          <View key={index} style={styles.uploadProgressItem}>
            <Text style={styles.uploadProgressText}>{progress.fileName}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress.progress}%</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Runner Photos</Text>
        <Text style={styles.subtitle}>
          {photos.length}/{maxPhotos} photos uploaded
        </Text>
      </View>

      <ScrollView style={styles.photoGrid} showsVerticalScrollIndicator={false}>
        <View style={styles.photosContainer}>
          {photos.map(renderPhoto)}

          {photos.length < maxPhotos && (
            <TouchableOpacity
              style={[styles.uploadButton, disabled && styles.uploadButtonDisabled]}
              onPress={handleSelectPhotos}
              disabled={disabled || isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="large" color={colors.primary[600]} />
              ) : (
                <>
                  <Text style={styles.uploadButtonText}>+</Text>
                  <Text style={styles.uploadButtonLabel}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {renderUploadProgress()}

      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowPhotoModal(false)}
          >
            <Text style={styles.modalCloseText}>×</Text>
          </TouchableOpacity>

          {selectedPhoto && (
            <Image source={{ uri: selectedPhoto }} style={styles.modalImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  photoGrid: {
    maxHeight: 400,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: photoSize,
    marginBottom: spacing.md,
  },
  photoWrapper: {
    position: 'relative',
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  photo: {
    width: photoSize,
    height: photoSize,
    borderRadius: radii.md,
  },
  primaryBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  primaryText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  photoActions: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setPrimaryButton: {
    backgroundColor: colors.warning[600],
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  uploadButton: {
    width: photoSize,
    height: photoSize,
    borderWidth: 2,
    borderColor: colors.primary[600],
    borderStyle: 'dashed',
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: 32,
    color: colors.primary[600],
    fontWeight: typography.weights.light,
    marginBottom: spacing.xs,
  },
  uploadButtonLabel: {
    fontSize: typography.sizes.sm,
    color: colors.primary[600],
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  uploadProgressContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: radii.md,
  },
  uploadProgressItem: {
    marginBottom: spacing.sm,
  },
  uploadProgressText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[600],
  },
  progressText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modalCloseText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: typography.weights.bold,
  },
  modalImage: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.9,
  },
});
