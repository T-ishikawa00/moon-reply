import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "./env";
import type { Database } from "./types";

// Service role must never be imported into client components.
// Service role must never be exposed to browser.
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const { supabaseUrl, supabaseSecretKey } = getSupabaseAdminEnv();

  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
