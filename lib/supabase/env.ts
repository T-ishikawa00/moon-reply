import "server-only";

type SupabaseCustomerAuthEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

type SupabaseAdminEnv = {
  supabaseUrl: string;
  supabaseSecretKey: string;
};

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseCustomerAuthEnv(): SupabaseCustomerAuthEnv {
  return {
    supabaseUrl: readRequiredEnv("SUPABASE_URL"),
    supabasePublishableKey: readRequiredEnv("SUPABASE_PUBLISHABLE_KEY"),
  };
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  return {
    supabaseUrl: readRequiredEnv("SUPABASE_URL"),
    supabaseSecretKey: readRequiredEnv("SUPABASE_SECRET_KEY"),
  };
}
