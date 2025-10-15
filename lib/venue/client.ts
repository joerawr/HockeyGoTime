/**
 * Supabase Client Helper
 *
 * Provides configured Supabase client with environment variable validation.
 */

import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing required environment variables: SUPABASE_URL and/or SUPABASE_ANON_KEY'
    );
  }

  return createClient(url, key);
}
