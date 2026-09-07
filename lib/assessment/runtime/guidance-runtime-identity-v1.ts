// Explicit local candidate identity. Production selection remains V17.
export const GUIDANCE_WAVE1_CATALOG_VERSION = "runtime-stage-catalog-v18.0.0";
export const GUIDANCE_WAVE1_PROMPT_BUNDLE_VERSION = "prompt-bundle-runtime-v18.0.0";
export const GUIDANCE_WAVE1_SCHEMA_SET_VERSION = "pipeline-schema-runtime-v7.0.0";

export function isGuidanceWave1Runtime(promptBundleVersion: string) {
  return promptBundleVersion === GUIDANCE_WAVE1_PROMPT_BUNDLE_VERSION;
}

export function usesV17ProductValidation(promptBundleVersion: string) {
  return promptBundleVersion === "prompt-bundle-runtime-v17.0.0" ||
    isGuidanceWave1Runtime(promptBundleVersion);
}
