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
import { NotificationService, setPushQueryClient } from '../services/notifications';
import { setAuthQueryClient } from '../services/auth';
import { resolveLocalApiUser } from '../services/localUserSession';
import { mapApiUserToAuthUser, mapApiUserToProfile } from '../services/apiUserMapper';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { signalRService } from '../services/signalR';
import { SentryService } from '../services/sentry';
import { getSupabase } from '../lib/supabase';
import { PlatformServiceFactory } from '../platform/shared/platformFactory';
import { disableElementInspectorOnLaunch } from '../utils/disableElementInspector';
import { DeepLinkHandler } from '../components/DeepLinkHandler';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: unknown) => {
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status &&
          [401, 403].includes((error as { response: { status: number } }).response.status)
        ) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});
SplashScreen.preventAutoHideAsync();

export default function Root() {
  useEffect(() => {
    const cleanupInspector = disableElementInspectorOnLaunch();

    // Never leave the native splash up if a permission/service await hangs (common on Simulator).
    const splashFailsafe = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => undefined);
    }, 2500);

    const initializeApp = async () => {
      try {
        SentryService.init();
        getSupabase();

        try {
          NotificationService.setupNotificationHandlers();
          await NotificationService.requestPermissions();
        } catch (notificationError) {
          console.warn('Notification initialization failed:', notificationError);
        }

        try {
          await PlatformServiceFactory.initializePlatformServices();
        } catch (platformError) {
          console.warn('Platform-specific services initialization failed:', platformError);
        }

        signalRService.setQueryClient(qc);
        setPushQueryClient(qc);
        setAuthQueryClient(qc);

        const localUser = await resolveLocalApiUser();
        if (localUser) {
          qc.setQueryData(['user'], mapApiUserToAuthUser(localUser));
          qc.setQueryData(['userProfile'], mapApiUserToProfile(localUser));
        }

        setTimeout(() => SplashScreen.hideAsync(), 300);
      } catch (error) {
        console.error('App initialization error:', error);
        SplashScreen.hideAsync();
      } finally {
        clearTimeout(splashFailsafe);
      }
    };

    initializeApp();

    return () => {
      clearTimeout(splashFailsafe);
      cleanupInspector?.();
      signalRService.stopConnection();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <DeepLinkHandler />
        <OfflineIndicator />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
