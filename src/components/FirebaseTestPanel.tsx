import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { recordError, logEvent, forceTestCrash } from '../lib/crash';
import { registerDeviceToken } from '../features/push/registerDeviceToken';
// import { signalRService } from '../services/signalR';
// import { TopicService } from '../services/topics';
import { colors, spacing, radii, typography } from '../theme/tokens';

interface FirebaseTestPanelProps {
  userId?: string;
}

export function FirebaseTestPanel({ userId }: FirebaseTestPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCrashlyticsError = async () => {
    setIsLoading(true);
    try {
      // Test error recording
      const testError = new Error('Test Crashlytics Error - This is intentional for testing');
      recordError(testError);
      
      // Test custom logging
      logEvent('firebase_test', {
        testType: 'error_recording',
        userId: userId || 'unknown',
        timestamp: Date.now()
      });
      
      addResult('✅ Crashlytics error recorded successfully');
      Alert.alert('Test Complete', 'Error recorded to Crashlytics. Check Firebase console in a few minutes.');
    } catch (error) {
      addResult('❌ Failed to record error: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const testCrashlyticsCrash = () => {
    Alert.alert(
      'Test Crash',
      'This will crash the app to test Crashlytics. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Crash App',
          style: 'destructive',
          onPress: () => {
            addResult('🚨 Triggering test crash...');
            forceTestCrash();
          }
        }
      ]
    );
  };

  const testPushNotification = async () => {
    setIsLoading(true);
    try {
      await registerDeviceToken();
      addResult('✅ Device token registration attempted');
      Alert.alert('Test Complete', 'Device token registration completed. Check backend logs.');
    } catch (error) {
      addResult('❌ Failed to register device token: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const testCustomLogging = () => {
    logEvent('firebase_test', {
      testType: 'custom_logging',
      userId: userId || 'unknown',
      timestamp: Date.now(),
      appVersion: '1.0.0',
      platform: 'ios'
    });
    
    addResult('✅ Custom log event sent');
    Alert.alert('Test Complete', 'Custom log event sent to Crashlytics.');
  };

  const testSignalRConnection = async () => {
    setIsLoading(true);
    try {
      // TODO: Re-enable after build testing
      addResult('⚠️ SignalR test skipped for build testing');
      Alert.alert('Test Skipped', 'SignalR test skipped for build testing.');
    } catch (error) {
      addResult('❌ Failed to connect to SignalR: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const testTopicSubscription = async () => {
    setIsLoading(true);
    try {
      // TODO: Re-enable after build testing
      addResult('⚠️ Topic subscription test skipped for build testing');
      Alert.alert('Test Skipped', 'Topic subscription test skipped for build testing.');
    } catch (error) {
      addResult('❌ Failed to subscribe to topic: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Integration Tests</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.errorButton]}
          onPress={testCrashlyticsError}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Error Recording</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.crashButton]}
          onPress={testCrashlyticsCrash}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test App Crash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.pushButton]}
          onPress={testPushNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Push Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logButton]}
          onPress={testCustomLogging}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Custom Logging</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signalrButton]}
          onPress={testSignalRConnection}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test SignalR Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.topicButton]}
          onPress={testTopicSubscription}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Topic Subscription</Text>
        </TouchableOpacity>
      </View>

      {testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Test Results</Text>
            <TouchableOpacity onPress={clearResults} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.resultsList}>
            {testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  errorButton: {
    backgroundColor: colors.warning,
  },
  crashButton: {
    backgroundColor: colors.error,
  },
  pushButton: {
    backgroundColor: colors.info[600],
  },
  logButton: {
    backgroundColor: colors.success,
  },
  signalrButton: {
    backgroundColor: colors.purple[600],
  },
  topicButton: {
    backgroundColor: colors.orange[600],
  },
  resultsContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultsTitle: {
    ...typography.h3,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearButtonText: {
    ...typography.caption,
    color: colors.info[600],
  },
  resultsList: {
    gap: spacing.xs,
  },
  resultText: {
    ...typography.body,
    fontSize: 12,
    color: colors.text.secondary,
  },
});
