export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'https://241runners-api-v2.azurewebsites.net',
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

if (__DEV__) {
  console.log('Environment configuration:', {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    resolved_API_URL: ENV.API_URL,
    hasGoogleMapsKey: !!ENV.GOOGLE_MAPS_API_KEY,
    hasSupabase: !!(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY),
  });
}
