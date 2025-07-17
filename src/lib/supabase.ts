import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  // Create a mock client for development/demo purposes
  export const supabase = {
    from: () => ({
      select: () => ({ data: [], error: new Error('Supabase not configured') }),
      insert: () => ({ data: [], error: new Error('Supabase not configured') }),
      update: () => ({ data: [], error: new Error('Supabase not configured') }),
      delete: () => ({ data: [], error: new Error('Supabase not configured') })
    })
  } as any;
} else {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
}