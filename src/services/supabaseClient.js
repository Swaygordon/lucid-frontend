import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your_supabase');

// Returns a no-op stub when env vars are missing so the app doesn't crash.
const createStub = () => ({
  auth: {
    getSession:          () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange:   () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword:  () => Promise.resolve({ data: null, error: { message: 'Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' } }),
    signUp:              () => Promise.resolve({ data: null, error: { message: 'Supabase not configured.' } }),
    signOut:             () => Promise.resolve({ error: null }),
    signInWithOAuth:     () => Promise.resolve({ error: { message: 'Supabase not configured.' } }),
    setSession:          () => Promise.resolve({ error: null }),
    resend:              () => Promise.resolve({ error: null }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }), order: () => Promise.resolve({ data: [], error: null }) }), order: () => Promise.resolve({ data: [], error: null }) }),
    update: () => ({ eq: () => Promise.resolve({ error: null }) }),
  }),
});

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : createStub();
