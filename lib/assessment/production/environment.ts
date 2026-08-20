import "server-only";
import { M2RuntimeError } from "../runtime/errors.ts";

export type ProductionAssessmentEnvironment = {
  openAiApiKey: string;
  openAiModel: "gpt-5.6-luna";
  supabaseUrl: string;
  supabaseSecretKey: string;
};

function enabled(name: string) {
  return process.env[name] === "true";
}

export function isProductionPreparationAvailable() {
  return (
    enabled("ASSESSMENT_PRODUCTION_PREPARATION_ENABLED") &&
    !enabled("ASSESSMENT_PRODUCTION_EMERGENCY_STOP")
  );
}

export function isProductionFulfillmentAvailable() {
  return (
    enabled("ASSESSMENT_PRODUCTION_RUNTIME_ENABLED") &&
    !enabled("ASSESSMENT_PRODUCTION_EMERGENCY_STOP")
  );
}

export function isProductionResultAccessAvailable() {
  return enabled("ASSESSMENT_PRODUCTION_RESULT_ACCESS_ENABLED");
}

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new M2RuntimeError("PRODUCTION_RUNTIME_CONFIGURATION_INVALID", 503);
  }
  return value;
}

export function readProductionAssessmentEnvironment(): ProductionAssessmentEnvironment {
  const model = required("OPENAI_MODEL");
  if (model !== "gpt-5.6-luna") {
    throw new M2RuntimeError("PRODUCTION_RUNTIME_IDENTITY_INVALID", 503);
  }
  return {
    openAiApiKey: required("OPENAI_API_KEY"),
    openAiModel: model,
    supabaseUrl: required("SUPABASE_URL"),
    supabaseSecretKey: required("SUPABASE_SECRET_KEY"),
  };
}

export function readProductionResultEnvironment() {
  return {
    supabaseUrl: required("SUPABASE_URL"),
    supabaseSecretKey: required("SUPABASE_SECRET_KEY"),
  };
}
