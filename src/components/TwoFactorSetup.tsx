import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { AuthService } from '../services/auth';

interface TwoFactorSetupProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TwoFactorSetup({ visible, onClose, onSuccess }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable2FA = async () => {
    try {
      setIsLoading(true);
      const result = await AuthService.enableTwoFactor();
      setQrCode(result.qrCode);
      setBackupCodes(result.backupCodes);
      setStep('verify');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to enable two-factor authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      const isValid = await AuthService.verifyTwoFactor(verificationCode);
      
      if (isValid) {
        setStep('backup');
      } else {
        Alert.alert('Error', 'Invalid verification code. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
    // Reset state
    setStep('setup');
    setQrCode('');
    setBackupCodes([]);
    setVerificationCode('');
  };

  const renderSetupStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enable Two-Factor Authentication</Text>
      <Text style={styles.stepDescription}>
        Two-factor authentication adds an extra layer of security to your account by requiring a code from your authenticator app.
      </Text>
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleEnable2FA}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Setting up...' : 'Enable 2FA'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Scan QR Code</Text>
      <Text style={styles.stepDescription}>
        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
      </Text>
      
      <View style={styles.qrCodeContainer}>
        <Text style={styles.qrCodePlaceholder}>QR Code would be displayed here</Text>
        <Text style={styles.qrCodeText}>{qrCode}</Text>
      </View>
      
      <Text style={styles.stepDescription}>
        After scanning, enter the 6-digit code from your authenticator app:
      </Text>
      
      <TextInput
        style={styles.codeInput}
        value={verificationCode}
        onChangeText={setVerificationCode}
        placeholder="Enter 6-digit code"
        placeholderTextColor={colors.gray[400]}
        keyboardType="numeric"
        maxLength={6}
        autoFocus
      />
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleVerifyCode}
        disabled={isLoading || verificationCode.length !== 6}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderBackupStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Save Backup Codes</Text>
      <Text style={styles.stepDescription}>
        Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device:
      </Text>
      
      <View style={styles.backupCodesContainer}>
        {backupCodes.map((code, index) => (
          <Text key={index} style={styles.backupCode}>
            {code}
          </Text>
        ))}
      </View>
      
      <Text style={styles.warningText}>
        ⚠️ Each backup code can only be used once. Store them securely!
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={handleComplete}>
        <Text style={styles.buttonText}>Complete Setup</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Two-Factor Authentication</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={styles.content}>
          {step === 'setup' && renderSetupStep()}
          {step === 'verify' && renderVerifyStep()}
          {step === 'backup' && renderBackupStep()}
        </ScrollView>
      </View>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[800],
  },
  cancelButton: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  stepDescription: {
    fontSize: typography.sizes.base,
    color: colors.gray[300],
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  qrCodeContainer: {
    backgroundColor: colors.gray[800],
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  qrCodePlaceholder: {
    fontSize: typography.sizes.sm,
    color: colors.gray[400],
    marginBottom: spacing.sm,
  },
  qrCodeText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  codeInput: {
    backgroundColor: colors.gray[800],
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.sizes.xl,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  backupCodesContainer: {
    backgroundColor: colors.gray[800],
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  backupCode: {
    fontSize: typography.sizes.base,
    color: colors.text,
    fontFamily: 'monospace',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  warningText: {
    fontSize: typography.sizes.sm,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.gray[600],
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});
