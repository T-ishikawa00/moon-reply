import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "./env";
import type { Database } from "./types";

export function createServerSupabaseClient(): SupabaseClient<Database> {
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
