import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { colors, spacing, typography, radii } from '../theme/tokens';
import {
  CreateRunnerProfileData,
  UpdateRunnerProfileData,
  EyeColor,
  ValidationError,
} from '../types/runnerProfile';
import { RunnerValidationUtils } from '../utils/runnerValidation';
import PhotoUpload from './PhotoUpload';

interface RunnerProfileFormProps {
  initialData?: Partial<CreateRunnerProfileData>;
  isEditing?: boolean;
  onSubmit: (data: CreateRunnerProfileData | UpdateRunnerProfileData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const EYE_COLORS: EyeColor[] = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Other'];

export default function RunnerProfileForm({
  initialData,
  isEditing = false,
  onSubmit,
  onCancel,
  isLoading = false,
}: RunnerProfileFormProps) {
  const [formData, setFormData] = useState<CreateRunnerProfileData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    height: initialData?.height || '',
    weight: initialData?.weight || '',
    eyeColor: initialData?.eyeColor || 'Brown',
    medicalConditions: initialData?.medicalConditions || [],
    additionalNotes: initialData?.additionalNotes || '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, ValidationError[]>>({});
  const [showEyeColorModal, setShowEyeColorModal] = useState(false);
  const [newMedicalCondition, setNewMedicalCondition] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        dateOfBirth: initialData.dateOfBirth || '',
        height: initialData.height || '',
        weight: initialData.weight || '',
        eyeColor: initialData.eyeColor || 'Brown',
        medicalConditions: initialData.medicalConditions || [],
        additionalNotes: initialData.additionalNotes || '',
      });
    }
  }, [initialData]);

  const handleInputChange = (
    field: keyof CreateRunnerProfileData,
    value: string | EyeColor | string[]
  ) => {
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

  const validateField = (field: keyof CreateRunnerProfileData) => {
    let errors: ValidationError[] = [];

    switch (field) {
      case 'firstName':
        errors = RunnerValidationUtils.validateFirstName(formData.firstName);
        break;
      case 'lastName':
        errors = RunnerValidationUtils.validateLastName(formData.lastName);
        break;
      case 'dateOfBirth':
        errors = RunnerValidationUtils.validateDateOfBirth(formData.dateOfBirth);
        break;
      case 'height':
        errors = RunnerValidationUtils.validateHeight(formData.height);
        break;
      case 'weight':
        errors = RunnerValidationUtils.validateWeight(formData.weight);
        break;
      case 'eyeColor':
        errors = RunnerValidationUtils.validateEyeColor(formData.eyeColor);
        break;
      case 'medicalConditions':
        errors = RunnerValidationUtils.validateMedicalConditions(formData.medicalConditions);
        break;
      case 'additionalNotes':
        errors = RunnerValidationUtils.validateAdditionalNotes(formData.additionalNotes);
        break;
    }

    if (errors.length > 0) {
      setValidationErrors(prev => ({ ...prev, [field]: errors }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const validation = RunnerValidationUtils.validateRunnerProfile(formData);

    if (!validation.isValid) {
      const errorsByField: Record<string, ValidationError[]> = {};
      validation.errors.forEach(error => {
        if (!errorsByField[error.field]) {
          errorsByField[error.field] = [];
        }
        errorsByField[error.field].push(error);
      });
      setValidationErrors(errorsByField);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting.');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save runner profile');
    }
  };

  const handleAddMedicalCondition = () => {
    if (newMedicalCondition.trim()) {
      handleInputChange('medicalConditions', [
        ...formData.medicalConditions,
        newMedicalCondition.trim(),
      ]);
      setNewMedicalCondition('');
    }
  };

  const handleRemoveMedicalCondition = (index: number) => {
    const updatedConditions = formData.medicalConditions.filter((_, i) => i !== index);
    handleInputChange('medicalConditions', updatedConditions);
  };

  const renderInput = (
    field: keyof CreateRunnerProfileData,
    label: string,
    placeholder: string,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default',
    multiline: boolean = false
  ) => {
    const value = formData[field] as string;
    const errors = validationErrors[field] || [];

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[
            styles.textInput,
            multiline && styles.multilineInput,
            errors.length > 0 && styles.inputError,
          ]}
          value={value}
          onChangeText={text => handleInputChange(field, text)}
          onBlur={() => validateField(field)}
          placeholder={placeholder}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          editable={!isLoading}
        />
        {errors.length > 0 && <Text style={styles.errorText}>{errors[0].message}</Text>}
      </View>
    );
  };

  const renderEyeColorSelector = () => {
    const errors = validationErrors.eyeColor || [];

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Eye Color</Text>
        <TouchableOpacity
          style={[styles.selectorButton, errors.length > 0 && styles.inputError]}
          onPress={() => setShowEyeColorModal(true)}
          disabled={isLoading}
        >
          <Text style={styles.selectorButtonText}>{formData.eyeColor}</Text>
          <Text style={styles.selectorButtonArrow}>▼</Text>
        </TouchableOpacity>
        {errors.length > 0 && <Text style={styles.errorText}>{errors[0].message}</Text>}
      </View>
    );
  };

  const renderMedicalConditions = () => {
    const errors = validationErrors.medicalConditions || [];

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Medical Conditions (Optional)</Text>

        {/* Add new condition */}
        <View style={styles.addConditionContainer}>
          <TextInput
            style={[styles.textInput, styles.addConditionInput]}
            value={newMedicalCondition}
            onChangeText={setNewMedicalCondition}
            placeholder="Add a medical condition"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddMedicalCondition}
            disabled={isLoading || !newMedicalCondition.trim()}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* List of conditions */}
        {formData.medicalConditions.length > 0 && (
          <View style={styles.conditionsList}>
            {formData.medicalConditions.map((condition, index) => (
              <View key={index} style={styles.conditionItem}>
                <Text style={styles.conditionText}>{condition}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveMedicalCondition(index)}
                  disabled={isLoading}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {errors.length > 0 && <Text style={styles.errorText}>{errors[0].message}</Text>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {isEditing ? 'Edit Runner Profile' : 'Create Runner Profile'}
          </Text>

          {renderInput('firstName', 'First Name *', 'Enter your first name')}
          {renderInput('lastName', 'Last Name *', 'Enter your last name')}

          {renderInput('dateOfBirth', 'Date of Birth *', 'YYYY-MM-DD', 'numeric')}

          {renderInput('height', 'Height *', 'e.g., 5\'8" or 175cm')}

          {renderInput('weight', 'Weight *', 'e.g., 150 lbs or 68 kg')}

          {renderEyeColorSelector()}

          {renderMedicalConditions()}

          {renderInput(
            'additionalNotes',
            'Additional Notes (Optional)',
            'Important running habits, safety concerns, or other relevant information',
            'default',
            true
          )}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isLoading}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Update Profile' : 'Create Profile'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Eye Color Modal */}
      <Modal
        visible={showEyeColorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEyeColorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Eye Color</Text>
            <FlatList
              data={EYE_COLORS}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    item === formData.eyeColor && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    handleInputChange('eyeColor', item);
                    setShowEyeColorModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      item === formData.eyeColor && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowEyeColorModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorButtonText: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
  },
  selectorButtonArrow: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },
  addConditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addConditionInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  conditionsList: {
    marginTop: spacing.sm,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
  },
  conditionText: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.gray[700],
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.gray[700],
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
  },
  modalOptionSelected: {
    backgroundColor: colors.primary[100],
  },
  modalOptionText: {
    fontSize: typography.sizes.base,
    color: colors.gray[900],
  },
  modalOptionTextSelected: {
    color: colors.primary[700],
    fontWeight: typography.weights.medium,
  },
  modalCancelButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
  },
});
