import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your_supabase');

// Fail closed if deployment configuration is missing; never fake empty backend data.
const missingConfigError = { code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before using authenticated features.' };
const createUnavailableQuery = () => {
  let proxy;
  const result = Promise.resolve({ data: null, error: missingConfigError });
  proxy = new Proxy({}, {
    get: (_target, property) => property === 'then' ? result.then.bind(result)
      : property === 'catch' ? result.catch.bind(result)
        : property === 'finally' ? result.finally.bind(result)
          : () => proxy,
  });
  return proxy;
};

const createStub = () => ({
  auth: {
    getSession:          () => Promise.resolve({ data: { session: null }, error: missingConfigError }),
    onAuthStateChange:   () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword:  () => Promise.resolve({ data: null, error: missingConfigError }),
    signUp:              () => Promise.resolve({ data: null, error: missingConfigError }),
    signOut:             () => Promise.resolve({ error: null }),
    signInWithOAuth:     () => Promise.resolve({ error: missingConfigError }),
    setSession:          () => Promise.resolve({ error: missingConfigError }),
    resend:              () => Promise.resolve({ error: missingConfigError }),
  },
  from: createUnavailableQuery,
  rpc: () => Promise.resolve({ data: null, error: missingConfigError }),
});

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : createStub();
