import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '../config/env';

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY);
}

/**
 * Supabase client for optional client-side features (storage, realtime).
 * Primary auth remains JWT via the .NET API; SignalR handles live updates.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!client) {
    client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return client;
}
