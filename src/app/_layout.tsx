/**
 * Root Layout Component
 *
 * Main entry point for the app that handles:
 * - React Query setup with retry logic
 * - Service initialization (notifications, auth, SignalR)
 * - Error boundaries and offline detection
 * - Splash screen management
 */

import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NotificationService } from '../services/notifications';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineIndicator } from '../components/OfflineIndicator';
import {
  attachForegroundMessaging,
  setupBackgroundMessageHandler,
  setQueryClient as setPushQueryClient,
} from '../features/push/registerDeviceToken';
import { signalRService } from '../services/signalR';
import { GoogleAuthService } from '../services/googleAuth';
import { TrackingTransparencyService } from '../services/trackingTransparency';
import { PlatformServiceFactory } from '../platform/shared/platformFactory';

// Configure React Query with optimized caching and retry strategies
const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache retention
      retry: (failureCount, error: unknown) => {
        // Don't retry on auth errors to prevent infinite loops
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 3; // Max 3 retries for other errors
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      networkMode: 'offlineFirst', // Use cache when offline, then network when online
    },
    mutations: {
      retry: 1, // Single retry for mutations
      networkMode: 'online', // Mutations always require network
    },
  },
});
SplashScreen.preventAutoHideAsync();

export default function Root() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize push notifications with graceful error handling
        try {
          NotificationService.setupNotificationHandlers();
          await NotificationService.requestPermissions();
        } catch (notificationError) {
          console.warn('Notification initialization failed:', notificationError);
        }

        // Setup Firebase messaging for real-time notifications
        try {
          attachForegroundMessaging();
          setupBackgroundMessageHandler();
        } catch (firebaseError) {
          console.warn('Firebase messaging initialization failed:', firebaseError);
        }

        // Configure Google Sign-In authentication
        try {
          await GoogleAuthService.configure();
        } catch (googleError) {
          console.warn('Google Sign-In initialization failed:', googleError);
        }

        // Request iOS App Tracking Transparency permission
        try {
          await TrackingTransparencyService.requestWithExplanation();
        } catch (trackingError) {
          console.warn('Tracking transparency request failed:', trackingError);
        }

        // Initialize platform-specific services (iOS/Android)
        try {
          await PlatformServiceFactory.initializePlatformServices();
        } catch (platformError) {
          console.warn('Platform-specific services initialization failed:', platformError);
        }

        // Connect SignalR real-time messaging to React Query
        signalRService.setQueryClient(qc);

        // Connect push notifications to React Query
        setPushQueryClient(qc);

        // Hide splash screen after brief delay for smooth UX
        setTimeout(() => SplashScreen.hideAsync(), 300);
      } catch (error) {
        console.error('App initialization error:', error);
        // Always hide splash screen even on error
        SplashScreen.hideAsync();
      }
    };

    initializeApp();

    // Cleanup function for component unmount
    return () => {
      signalRService.stopConnection(); // Stop SignalR connection on unmount
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <OfflineIndicator />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
