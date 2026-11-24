import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@strongerfit/contracts/database';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

let client: SupabaseClient<Database> | undefined;

export function getSupabase(): SupabaseClient<Database> {
  if (client) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Configura Supabase en frontend/.env antes de usar autenticación.');

  client = createClient<Database>(url, key, {
    auth: {
      storage: Platform.OS === 'web' ? undefined : {
        getItem: (name) => SecureStore.getItemAsync(name),
        setItem: (name, value) => SecureStore.setItemAsync(name, value),
        removeItem: (name) => SecureStore.deleteItemAsync(name),
      },
      persistSession: Platform.OS !== 'web',
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  });
  // Patrón de Supabase para apps móviles: renovar el token solo en primer plano (AU-01).
  if (Platform.OS !== 'web') {
    const auth = client.auth;
    AppState.addEventListener('change', (state) => {
      if (state === 'active') auth.startAutoRefresh();
      else auth.stopAutoRefresh();
    });
  }
  return client;
}
