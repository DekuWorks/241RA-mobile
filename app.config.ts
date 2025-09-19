import 'dotenv/config';
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: '241RA',
  slug: '241runners',
  scheme: 'org.runners241.app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  userInterfaceStyle: 'automatic',
  owner: '241-runners-awareness',
  ios: {
    bundleIdentifier: 'org.runners241.app',
    supportsTablet: true,
    // googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST || undefined,
    infoPlist: {
      NSCameraUsageDescription: 'Used to capture photos for sightings and case updates.',
      NSLocationWhenInUseUsageDescription:
        'Used to attach accurate locations to reports and nearby alerts.',
      NSPhotoLibraryAddUsageDescription: 'Used to save images you capture for case reports.',
      ITSAppUsesNonExemptEncryption: false,
      NSPrivacyPolicyURL: 'https://241runnersawareness.org/privacy',
      NSPrivacyPolicyUsageDescription: 'Privacy policy for 241Runners app',
      UIBackgroundModes: ['remote-notification'],
      FirebaseAppDelegateProxyEnabled: true,
    },
    associatedDomains: ['applinks:241runnersawareness.org'],
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    package: 'org.runners241.app',
    googleServicesFile: "./android/app/google-services.json",
    adaptiveIcon: { foregroundImage: './assets/icon.png', backgroundColor: '#000000' },
    permissions: ['CAMERA', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-notifications',
    'expo-location',
    'expo-camera',
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
    // Firebase plugins (temporarily disabled for build testing)
    // '@react-native-firebase/app',
    // '@react-native-firebase/messaging',
    // '@react-native-firebase/crashlytics',
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
    oauthRedirectUri: 'org.runners241.app:/oauthredirect',
  },
};

export default config;
