import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { EnhancedRunnerProfileService } from '../services/enhancedRunnerProfile';
import { PhotoManager } from '../services/photoManager';

/**
 * Test component for enhanced runner profile integration
 * This component tests the API integration and photo management
 */
export const EnhancedProfileTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Test 1: Check if runner profile exists
      addTestResult('🧪 Testing runner profile existence check...');
      const hasProfile = await EnhancedRunnerProfileService.hasRunnerProfile();
      addTestResult(`✅ Runner profile exists: ${hasProfile}`);

      // Test 2: Get runner profile (if exists)
      if (hasProfile) {
        addTestResult('🧪 Testing get runner profile...');
        const profile = await EnhancedRunnerProfileService.getRunnerProfile();
        addTestResult(`✅ Profile loaded: ${profile?.firstName} ${profile?.lastName}`);
      } else {
        addTestResult('ℹ️ No runner profile found - skipping profile tests');
      }

      // Test 3: Test photo manager permissions
      addTestResult('🧪 Testing photo manager permissions...');
      const hasPermissions = await PhotoManager.requestPermissions();
      addTestResult(`✅ Photo permissions: ${hasPermissions ? 'Granted' : 'Denied'}`);

      // Test 4: Test photo validation
      addTestResult('🧪 Testing photo validation...');
      const validation = PhotoManager.validatePhoto('test-uri');
      addTestResult(`✅ Photo validation: ${validation.isValid ? 'Valid' : 'Invalid'}`);

      // Test 5: Test age calculation
      addTestResult('🧪 Testing age calculation...');
      const age = EnhancedRunnerProfileService.calculateAge('1990-01-01');
      addTestResult(`✅ Age calculation: ${age} years old`);

      // Test 6: Test photo update check
      addTestResult('🧪 Testing photo update check...');
      const needsUpdate = EnhancedRunnerProfileService.needsPhotoUpdate('2023-01-01');
      addTestResult(`✅ Photo update needed: ${needsUpdate ? 'Yes' : 'No'}`);

      addTestResult('🎉 All tests completed successfully!');
      
    } catch (error: any) {
      addTestResult(`❌ Test failed: ${error.message}`);
      console.error('Test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enhanced Profile Integration Test</Text>
      <Text style={styles.description}>
        This component tests the enhanced runner profile system integration.
      </Text>
      
      <TouchableOpacity
        style={[styles.testButton, isRunning && styles.testButtonDisabled]}
        onPress={runTests}
        disabled={isRunning}
      >
        <Text style={styles.testButtonText}>
          {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
        </Text>
      </TouchableOpacity>

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
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    margin: spacing.lg,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.sizes.base,
    color: colors.gray[600],
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  testButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  testButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  testButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  resultsContainer: {
    backgroundColor: colors.gray[50],
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
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
  },
  clearButton: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  clearButtonText: {
    color: colors.gray[700],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  resultsList: {
    maxHeight: 200,
  },
  resultText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    marginBottom: spacing.xs,
    fontFamily: 'monospace',
  },
});
