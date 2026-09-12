import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec clé service (côté serveur uniquement).
 * Utilisé pour l'upload PDF dans Storage — plus fiable que la clé anon.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
