import { usesV17ProductValidation as usesPredecessorProductValidation } from "./guidance-runtime-identity-v1.ts";

// Explicit local successor to V17. Neither Production selection nor V18 changes.
export const V19_L1_CATALOG_VERSION = "runtime-stage-catalog-v19.0.0";
export const V19_L1_PROMPT_BUNDLE_VERSION = "prompt-bundle-runtime-v19.0.0";
export const V19_L1_SCHEMA_SET_VERSION = "pipeline-schema-runtime-v6.0.0";
export const V19_L1_PB01_PROMPT_VERSION = "v5.0.0";
export const V19_L1_PB05_PROMPT_VERSION = "v10.0.0";

export function isV19L1Runtime(promptBundleVersion: string) {
  return promptBundleVersion === V19_L1_PROMPT_BUNDLE_VERSION;
}

export function usesV17ProductValidation(promptBundleVersion: string) {
  return usesPredecessorProductValidation(promptBundleVersion) ||
    isV19L1Runtime(promptBundleVersion);
}
