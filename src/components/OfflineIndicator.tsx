import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Network from 'expo-network';
import { colors, spacing, typography, radii } from '../theme/tokens';

export function OfflineIndicator() {
  const [isConnected, setIsConnected] = useState(true);
  const [slideAnim] = useState(new Animated.Value(-50));

  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        const connected = networkState.isConnected ?? false;
        setIsConnected(connected);

        if (!connected) {
          // Slide down when going offline
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        } else {
          // Slide up when going online
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error('Error checking network status:', error);
      }
    };

    // Check immediately
    checkNetworkStatus();

    // Check every 5 seconds
    const interval = setInterval(checkNetworkStatus, 5000);

    return () => clearInterval(interval);
  }, [slideAnim]);

  if (isConnected) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>📡</Text>
        <Text style={styles.text}>You're offline</Text>
        <Text style={styles.subtext}>Some features may be limited</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: colors.warning,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingTop: spacing.lg + spacing.sm, // Account for status bar
  },
  icon: {
    fontSize: typography.sizes.base,
    marginRight: spacing.sm,
  },
  text: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.white,
    marginRight: spacing.sm,
  },
  subtext: {
    fontSize: typography.sizes.xs,
    color: colors.white,
    opacity: 0.9,
  },
});
