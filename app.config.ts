import 'dotenv/config';

export default {
  expo: {
    name: "241Runners",
    slug: "241runners",
    scheme: "241runners",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: { image: "./assets/splash.png", resizeMode: "contain", backgroundColor: "#000000" },
    userInterfaceStyle: "automatic",
    ios: {
      bundleIdentifier: "org.241runners.app",
      supportsTablet: false,
      infoPlist: {
        NSCameraUsageDescription: "Used to capture photos for sightings and case updates.",
        NSLocationWhenInUseUsageDescription: "Used to attach accurate locations to reports and nearby alerts.",
        NSPhotoLibraryAddUsageDescription: "Used to save images you capture for case reports."
      },
      associatedDomains: ["applinks:241runnersawareness.org"]
    },
    android: {
      package: "org.earth241runners.app",
      adaptiveIcon: { foregroundImage: "./assets/icon.png", backgroundColor: "#000000" },
      permissions: ["CAMERA", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
    },
    plugins: ["expo-router", "expo-secure-store", "expo-notifications", "expo-location"],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN
    }
  }
};
