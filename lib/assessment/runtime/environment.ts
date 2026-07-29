import "server-only";
import { M2RuntimeError } from "./errors.ts";

export type M2RuntimeEnvironment = {
  openAiApiKey: string;
  openAiModel: "gpt-5.6-luna";
  supabaseUrl: string;
  supabaseSecretKey: string;
};

export function isInternalRuntimeAvailable() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.M2_INTERNAL_RUNTIME_ENABLED === "true"
  );
}

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new M2RuntimeError("M2_RUNTIME_CONFIGURATION_INVALID", 503);
  }
  return value;
}

export function readM2RuntimeEnvironment(): M2RuntimeEnvironment {
  if (!isInternalRuntimeAvailable()) {
    throw new M2RuntimeError("M2_RUNTIME_UNAVAILABLE", 404);
  }

  const model = required("OPENAI_MODEL");
  if (model !== "gpt-5.6-luna") {
    throw new M2RuntimeError("M2_RUNTIME_MODEL_NOT_ALLOWED", 503);
  }

  return {
    openAiApiKey: required("OPENAI_API_KEY"),
    openAiModel: model,
    supabaseUrl: required("SUPABASE_URL"),
    supabaseSecretKey: required("SUPABASE_SECRET_KEY"),
  };
}
