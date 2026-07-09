type SupabasePublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type SupabaseAdminEnv = SupabasePublicEnv & {
  supabaseServiceRoleKey: string;
};

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  return {
    supabaseUrl: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  return {
    ...getSupabasePublicEnv(),
    supabaseServiceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
