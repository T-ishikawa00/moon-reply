import {
  isV19L2Runtime,
  usesV19AcknowledgementPolicy as usesPredecessorAcknowledgementPolicy,
  usesV17ProductValidation as usesPredecessorProductValidation,
} from "./v19-l2-runtime-identity.ts";

// Local PB05 source-status successor; old versions retain their exact behavior.
export const V19_L3_CATALOG_VERSION = "runtime-stage-catalog-v21.0.0";
export const V19_L3_PROMPT_BUNDLE_VERSION = "prompt-bundle-runtime-v21.0.0";
export const V19_L3_SCHEMA_SET_VERSION = "pipeline-schema-runtime-v6.0.0";
export const V19_L3_PB05_PROMPT_VERSION = "v11.0.0";

export function isV19L3Runtime(promptBundleVersion: string) {
  return promptBundleVersion === V19_L3_PROMPT_BUNDLE_VERSION;
}

export function usesV19AcknowledgementPolicy(promptBundleVersion: string) {
  return usesPredecessorAcknowledgementPolicy(promptBundleVersion) || isV19L3Runtime(promptBundleVersion);
}

export function usesV17ProductValidation(promptBundleVersion: string) {
  return usesPredecessorProductValidation(promptBundleVersion) || isV19L3Runtime(promptBundleVersion);
}

export function usesV19TemporalEvaluator(promptBundleVersion: string) {
  return isV19L2Runtime(promptBundleVersion) || isV19L3Runtime(promptBundleVersion);
}
