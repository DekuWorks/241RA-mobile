/** Reject empty / placeholder values so the map shows setup UI instead of a broken MapView. */
function resolveGoogleMapsApiKey(raw: string | undefined): string {
  const key = (raw ?? '').trim();
  if (!key) return '';

  const lower = key.toLowerCase();
  const placeholders = [
    'your_google_maps_api_key',
    'your-google-maps-api-key',
    'your_google_maps_api_key_here',
    'your_key_here',
    'your-maps-key',
    'local-screenshot-placeholder-key',
  ];
  if (placeholders.includes(lower)) return '';
  if (key.startsWith('YOUR_') || key.includes('YOUR_GOOGLE_MAPS')) return '';
  // Real Google API keys are typically AIza…; allow other non-placeholder values for flexibility.
  return key;
}

export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'https://241runners-api-v2.azurewebsites.net',
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  GOOGLE_MAPS_API_KEY: resolveGoogleMapsApiKey(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY),
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
