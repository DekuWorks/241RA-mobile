import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { signalRService } from '../services/signalR';

interface WebSocketErrorHandlerProps {
  children: React.ReactNode;
}

export const WebSocketErrorHandler: React.FC<WebSocketErrorHandlerProps> = ({ children }) => {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    // Check connection health periodically
    const healthCheckInterval = setInterval(async () => {
      try {
        const isHealthy = await signalRService.checkConnectionHealth();
        if (!isHealthy && !isReconnecting) {
          setConnectionError('WebSocket connection lost. Real-time features may not work properly.');
        } else if (isHealthy && connectionError) {
          setConnectionError(null);
        }
      } catch (error) {
        console.error('WebSocket health check failed:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, [connectionError, isReconnecting]);

  const handleReconnect = async () => {
    try {
      setIsReconnecting(true);
      setConnectionError(null);
      
      console.log('Attempting to reconnect WebSocket...');
      await signalRService.forceReconnect();
      
      // Check if reconnection was successful
      const isHealthy = await signalRService.checkConnectionHealth();
      if (isHealthy) {
        Alert.alert('Success', 'WebSocket connection restored!');
      } else {
        setConnectionError('Failed to reconnect. Please check your internet connection.');
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
      setConnectionError('Failed to reconnect. Please try again later.');
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleDismiss = () => {
    setConnectionError(null);
  };

  return (
    <View style={styles.container}>
      {children}
      
      {connectionError && (
        <View style={styles.errorBanner}>
          <View style={styles.errorContent}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>Connection Issue</Text>
              <Text style={styles.errorMessage}>{connectionError}</Text>
            </View>
            <View style={styles.errorActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.reconnectButton]}
                onPress={handleReconnect}
                disabled={isReconnecting}
              >
                <Text style={styles.actionButtonText}>
                  {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.dismissButton]}
                onPress={handleDismiss}
              >
                <Text style={styles.actionButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.warning[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.warning[200],
    padding: spacing.md,
    zIndex: 1000,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorIcon: {
    fontSize: 20,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.warning[800],
    marginBottom: 2,
  },
  errorMessage: {
    fontSize: typography.sizes.xs,
    color: colors.warning[700],
    lineHeight: 16,
  },
  errorActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  reconnectButton: {
    backgroundColor: colors.primary[600],
  },
  dismissButton: {
    backgroundColor: colors.gray[200],
  },
  actionButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.white,
  },
});

