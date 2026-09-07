import {
  isV19L1Runtime,
  usesV17ProductValidation as usesPredecessorProductValidation,
} from "./v19-l1-runtime-identity.ts";

// Product label V19-L2; numeric catalog/bundle follow the existing sequence.
export const V19_L2_CATALOG_VERSION = "runtime-stage-catalog-v20.0.0";
export const V19_L2_PROMPT_BUNDLE_VERSION = "prompt-bundle-runtime-v20.0.0";
export const V19_L2_SCHEMA_SET_VERSION = "pipeline-schema-runtime-v6.0.0";
export const V19_L2_PB06_PROMPT_VERSION = "v9.0.0";

export function isV19L2Runtime(promptBundleVersion: string) {
  return promptBundleVersion === V19_L2_PROMPT_BUNDLE_VERSION;
}

export function usesV19AcknowledgementPolicy(promptBundleVersion: string) {
  return isV19L1Runtime(promptBundleVersion) || isV19L2Runtime(promptBundleVersion);
}

export function usesV17ProductValidation(promptBundleVersion: string) {
  return usesPredecessorProductValidation(promptBundleVersion) ||
    isV19L2Runtime(promptBundleVersion);
}
