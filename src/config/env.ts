export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'https://241runners-api-v2.azurewebsites.net',
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

if (__DEV__) {
  console.log('Environment configuration:', {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    resolved_API_URL: ENV.API_URL,
    hasMapboxToken: !!ENV.MAPBOX_ACCESS_TOKEN,
    hasSupabase: !!(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY),
  });
}
