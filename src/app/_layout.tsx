import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NotificationService } from '../services/notifications';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { attachForegroundMessaging, setupBackgroundMessageHandler } from '../features/push/registerDeviceToken';
import { signalRService } from '../services/signalR';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (cacheTime renamed to gcTime in newer versions)
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 errors
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: 'offlineFirst', // Try cache first, then network
    },
    mutations: {
      retry: 1,
      networkMode: 'online', // Mutations require network
    },
  },
});
SplashScreen.preventAutoHideAsync();

export default function Root() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize notifications (with error handling)
        try {
          NotificationService.setupNotificationHandlers();
          await NotificationService.requestPermissions();
        } catch (notificationError) {
          console.warn('Notification initialization failed:', notificationError);
        }

        // Initialize Firebase messaging handlers
        try {
          attachForegroundMessaging();
          setupBackgroundMessageHandler();
        } catch (firebaseError) {
          console.warn('Firebase messaging initialization failed:', firebaseError);
        }

        // Hide splash screen
        setTimeout(() => SplashScreen.hideAsync(), 300);
      } catch (error) {
        console.error('App initialization error:', error);
        // Always hide splash screen even on error
        SplashScreen.hideAsync();
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      signalRService.stopConnection();
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
