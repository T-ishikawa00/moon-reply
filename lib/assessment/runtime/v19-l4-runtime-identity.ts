import {
  usesV19AcknowledgementPolicy as predecessorAcknowledgementPolicy,
  usesV17ProductValidation as predecessorProductValidation,
  usesV19TemporalEvaluator as predecessorTemporalEvaluator,
} from "./v19-l3-runtime-identity.ts";

// Explicit local candidate. No Production/Paid selector is changed.
export const V19_L4_CATALOG_VERSION = "runtime-stage-catalog-v22.0.0";
export const V19_L4_PROMPT_BUNDLE_VERSION = "prompt-bundle-runtime-v22.0.0";
export const V19_L4_SCHEMA_SET_VERSION = "pipeline-schema-runtime-v8.0.0";
export const V19_L4_PB05_PROMPT_VERSION = "v12.0.0";
export const V19_L4_PB06_PROMPT_VERSION = "v10.0.0";
export const V19_L4_PB06_SCHEMA_VERSION = "validation-result-v19-l4-v1";

export function isV19L4Runtime(bundle: string) {
  return bundle === V19_L4_PROMPT_BUNDLE_VERSION;
}

export function usesV19AcknowledgementPolicy(bundle: string) {
  return predecessorAcknowledgementPolicy(bundle) || isV19L4Runtime(bundle);
}

export function usesV17ProductValidation(bundle: string) {
  return predecessorProductValidation(bundle) || isV19L4Runtime(bundle);
}

export function usesV19TemporalEvaluator(bundle: string) {
  return predecessorTemporalEvaluator(bundle) || isV19L4Runtime(bundle);
}
