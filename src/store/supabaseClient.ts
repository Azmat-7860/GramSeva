import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string | undefined;
  const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase credentials not found. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    );
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();
