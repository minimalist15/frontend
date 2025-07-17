import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for production
console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
  nodeEnv: import.meta.env.MODE
});

if (!supabaseUrl || !supabaseAnonKey) {
  const error = `Missing Supabase environment variables: URL=${!!supabaseUrl}, KEY=${!!supabaseAnonKey}`;
  console.error(error);
  throw new Error(error);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);