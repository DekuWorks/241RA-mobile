import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { recordError, logEvent, forceTestCrash } from '../lib/crash';
import { NotificationService } from '../services/notifications';
import { signalRService } from '../services/signalR';
import { TopicService } from '../services/topics';
import { isSupabaseConfigured } from '../lib/supabase';
import { colors, spacing, radii, typography } from '../theme/tokens';

interface IntegrationTestPanelProps {
  userId?: string;
}

export function IntegrationTestPanel({ userId }: IntegrationTestPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSentryError = async () => {
    setIsLoading(true);
    try {
      const testError = new Error('Test Sentry Error - intentional for testing');
      recordError(testError);
      logEvent('integration_test', {
        testType: 'error_recording',
        userId: userId || 'unknown',
        timestamp: Date.now(),
      });
      addResult('✅ Sentry error recorded successfully');
      Alert.alert('Test Complete', 'Error recorded to Sentry. Check dashboard in a few minutes.');
    } catch (error) {
      addResult('❌ Failed to record error: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const testSentryCrash = () => {
    Alert.alert('Test Crash', 'This will crash the app to test Sentry. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Crash App',
        style: 'destructive',
        onPress: () => {
          addResult('🚨 Triggering test crash...');
          forceTestCrash();
        },
      },
    ]);
  };

  const testPushNotification = async () => {
    setIsLoading(true);
    try {
      await NotificationService.registerDevice();
      addResult('✅ Device token registration attempted');
      Alert.alert('Test Complete', 'Device token registration completed. Check backend logs.');
    } catch (error) {
      addResult('❌ Failed to register device token: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const testLocalNotification = async () => {
    setIsLoading(true);
    try {
      await NotificationService.testNotification();
      addResult('✅ Local test notification scheduled');
      Alert.alert('Test Complete', 'Local notification sent.');
    } catch (error) {
      addResult('❌ Failed to send local notification: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const testSignalRConnection = async () => {
    setIsLoading(true);
    try {
      await signalRService.startConnection();
      addResult('✅ SignalR connection started');
      Alert.alert('Test Complete', 'SignalR connection established.');
    } catch (error) {
      addResult('❌ Failed to connect to SignalR: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const testTopicSubscription = async () => {
    setIsLoading(true);
    try {
      await TopicService.subscribeToDefaultTopics();
      addResult('✅ Default topic subscriptions attempted');
      Alert.alert('Test Complete', 'Topic subscriptions completed.');
    } catch (error) {
      addResult('❌ Failed to subscribe to topics: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Integration Tests</Text>
      <Text style={styles.subtitle}>
        Supabase: {isSupabaseConfigured() ? 'configured' : 'not configured'} · Push: Expo ·
        Realtime: SignalR
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.errorButton]}
          onPress={testSentryError}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Sentry Error</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.crashButton]}
          onPress={testSentryCrash}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test App Crash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.pushButton]}
          onPress={testPushNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Register Push Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logButton]}
          onPress={testLocalNotification}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Local Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signalrButton]}
          onPress={testSignalRConnection}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test SignalR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.topicButton]}
          onPress={testTopicSubscription}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Topics</Text>
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
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    color: colors.gray[400],
    textAlign: 'center',
    marginBottom: spacing.md,
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
    color: colors.gray[400],
  },
});
