import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client.
 *
 * Only the public anon key belongs here — it is safe to ship because every
 * table is protected by Row Level Security. The service-role key and any model
 * provider keys stay in the FastAPI service and must never appear in a
 * `VITE_*` variable, because Vite inlines those into the bundle.
 *
 * The client stays `null` when the project is not configured, so the existing
 * Express-backed flows keep working untouched.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const isSupabaseConfigured = Boolean(supabase);

/** Access token for calling the FastAPI service; null when signed out. */
export const getSupabaseAccessToken = async (): Promise<string | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};
