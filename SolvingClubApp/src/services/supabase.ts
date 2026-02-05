import 'react-native-url-polyfill/auto';
import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SUPABASE_URL, SUPABASE_ANON_KEY} from '../core/config/supabase';

/**
 * Supabase Client for React Native
 * Uses AsyncStorage for session persistence
 */
let supabaseClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      // Fallback without storage if AsyncStorage fails
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
    }
  }
  return supabaseClient;
};

export const supabase = getSupabaseClient();

