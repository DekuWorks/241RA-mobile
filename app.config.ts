import 'dotenv/config';
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: '241 Runners',
  slug: '241runners',
  scheme: 'org.runners241.app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ff0000',
  },
  userInterfaceStyle: 'automatic',
  owner: '241-runners-awareness',
  ios: {
    bundleIdentifier: 'org.runners241.app',
    appleTeamId: process.env.APPLE_TEAM_ID,
    supportsTablet: true,
    entitlements: {
      'aps-environment': 'development',
      'com.apple.developer.associated-domains': ['applinks:241runnersawareness.org'],
      'keychain-access-groups': ['$(AppIdentifierPrefix)org.runners241.app'],
    },
    infoPlist: {
      NSCameraUsageDescription:
        '241 Runners uses your camera to capture photos for sighting reports and case updates. Photos are securely stored and only used for the intended reporting purpose.',
      NSLocationWhenInUseUsageDescription:
        '241 Runners uses your location to provide accurate location data for sighting reports and to show nearby alerts. Location data is encrypted and only used for app functionality.',
      NSPhotoLibraryAddUsageDescription:
        '241 Runners can save images you capture to your photo library for case reports. This helps you keep copies of important evidence.',
      ITSAppUsesNonExemptEncryption: false,
      NSPrivacyPolicyURL: 'https://241runnersawareness.org/privacy-policy',
      NSPrivacyPolicyUsageDescription:
        'View our comprehensive privacy policy to understand how we collect, use, store, and protect your personal information and data.',
      UIBackgroundModes: ['remote-notification'],
      NSUserTrackingUsageDescription:
        'This app does not track users across other apps or websites.',
    },
    associatedDomains: ['applinks:241runnersawareness.org'],
  },
  android: {
    package: 'org.runners241.app',
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#ff0000' },
    permissions: ['CAMERA', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        mode: 'development',
        enableBackgroundRemoteNotifications: true,
      },
    ],
    'expo-location',
    'expo-camera',
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission:
          'This app does not track users across other apps or websites.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow 241Runners to access your photos to report sightings.',
        cameraPermission:
          'Allow 241Runners to access your camera to capture evidence for sightings.',
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        project: '241runners-mobile',
        organization: '241-runners-awareness',
      },
    ],
  ],
  extra: {
    eas: {
      projectId: 'bb791d4e-1e0d-4c6c-a23d-a619d34d3d7e',
    },
    EXPO_PUBLIC_API_BASE: 'https://241runners-api-v2.azurewebsites.net',
    EXPO_PUBLIC_ENABLE_CRASH: 'true',
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default config;
