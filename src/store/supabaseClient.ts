import { createClient, SupabaseClient } from '@supabase/supabase-js';

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[GramSeva] Missing Supabase credentials. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    );
    return createClient('https://missing.supabase.co', 'missing');
  }

  if (!supabaseUrl.startsWith('https://') || supabaseUrl === 'https://placeholder.supabase.co') {
    console.error('[GramSeva] Invalid EXPO_PUBLIC_SUPABASE_URL.');
    return createClient('https://missing.supabase.co', 'missing');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();
