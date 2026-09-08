import {
  usesV19AcknowledgementPolicy as predecessorAcknowledgementPolicy,
  usesV17ProductValidation as predecessorProductValidation,
  usesV19TemporalEvaluator as predecessorTemporalEvaluator,
} from "./v19-l4-runtime-identity.ts";

// Explicit local successor; no Production or Paid selector is changed.
export const V19_L5_CATALOG_VERSION = "runtime-stage-catalog-v23.0.0";
export const V19_L5_PROMPT_BUNDLE_VERSION = "prompt-bundle-runtime-v23.0.0";
export const V19_L5_SCHEMA_SET_VERSION = "pipeline-schema-runtime-v9.0.0";
export const V19_L5_PB01_PROMPT_VERSION = "v6.0.0";
export const V19_L5_PB04_PROMPT_VERSION = "v8.0.0";
export const V19_L5_PB05_PROMPT_VERSION = "v13.0.0";
export const V19_L5_PB06_PROMPT_VERSION = "v11.0.0";
export const V19_L5_PB01_SCHEMA_VERSION = "v19-l5-base-intent-v1";
export const V19_L5_PB04_SCHEMA_VERSION = "v19-l5-plan-v1";
export const V19_L5_PB05_SCHEMA_VERSION = "v19-l5-report-v1";
export const V19_L5_PB06_SCHEMA_VERSION = "validation-result-v19-l4-v1";

export function isV19L5Runtime(bundle: string) {
  return bundle === V19_L5_PROMPT_BUNDLE_VERSION;
}

export function usesV19AcknowledgementPolicy(bundle: string) {
  return predecessorAcknowledgementPolicy(bundle) || isV19L5Runtime(bundle);
}

export function usesV17ProductValidation(bundle: string) {
  return predecessorProductValidation(bundle) || isV19L5Runtime(bundle);
}

export function usesV19TemporalEvaluator(bundle: string) {
  return predecessorTemporalEvaluator(bundle) || isV19L5Runtime(bundle);
}
