import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  // Alert,
  Dimensions,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { CasesService } from '../../services/cases';

const { width } = Dimensions.get('window');

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const {
    data: caseData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['case', id],
    queryFn: () => CasesService.getCase(id!),
    enabled: !!id,
  });

  const handleReportSighting = () => {
    router.push(`/report-sighting/${id}`);
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading case details...</Text>
      </View>
    );
  }

  if (error || !caseData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load case details</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderImageCarousel = () => {
    if (!caseData.images || caseData.images.length === 0) {
      return null;
    }

    return (
      <View style={styles.imageCarousel}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={event => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setSelectedImageIndex(index);
          }}
        >
          {caseData.images.map((imageUri, index) => (
            <Image
              key={index}
              source={{ uri: imageUri }}
              style={styles.caseImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {caseData.images.length > 1 && (
          <View style={styles.imageIndicators}>
            {caseData.images.map((_, index) => (
              <View
                key={index}
                style={[styles.indicator, selectedImageIndex === index && styles.activeIndicator]}
              />
            ))}
          </View>
        )}
      </View>
    );
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(caseData.status) }]}>
          <Text style={styles.statusText}>{caseData.status.toUpperCase()}</Text>
        </View>
      </View>

      {renderImageCarousel()}

      <View style={styles.content}>
        <Text style={styles.title}>{caseData.title}</Text>

        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Reported:</Text>
            <Text style={styles.metaValue}>
              {new Date(caseData.reportedAt).toLocaleDateString()}
            </Text>
          </View>

          {caseData.lastSeenAt && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Last Seen:</Text>
              <Text style={styles.metaValue}>
                {new Date(caseData.lastSeenAt).toLocaleDateString()}
              </Text>
            </View>
          )}

          {caseData.age && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Age:</Text>
              <Text style={styles.metaValue}>{caseData.age} years old</Text>
            </View>
          )}

          {caseData.gender && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Gender:</Text>
              <Text style={styles.metaValue}>{caseData.gender}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{caseData.description}</Text>
        </View>

        {caseData.physicalDescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Physical Description</Text>
            <Text style={styles.description}>{caseData.physicalDescription}</Text>
          </View>
        )}

        {caseData.clothingDescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clothing Description</Text>
            <Text style={styles.description}>{caseData.clothingDescription}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.description}>
            📍 {caseData.location.address || 'Coordinates available'}
          </Text>
          {caseData.location.city && (
            <Text style={styles.description}>
              {caseData.location.city}, {caseData.location.state}
            </Text>
          )}
        </View>

        {caseData.tags && caseData.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {caseData.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reported By</Text>
          <Text style={styles.description}>
            {caseData.reportedBy.name} ({caseData.reportedBy.email})
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.reportButton} onPress={handleReportSighting}>
        <Text style={styles.reportButtonText}>Report a Sighting</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
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
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  imageCarousel: {
    height: 250,
    position: 'relative',
  },
  caseImage: {
    width: width,
    height: 250,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[600],
  },
  activeIndicator: {
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  metaInfo: {
    backgroundColor: colors.gray[900],
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metaLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[400],
    fontWeight: typography.weights.medium,
  },
  metaValue: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.sizes.base,
    color: colors.gray[300],
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.gray[800],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  tagText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  reportButton: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  reportButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});
