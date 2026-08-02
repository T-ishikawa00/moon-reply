import type { JsonObject } from "./types.ts";

export const BASE_STRUCTURED_INTAKE_LEGACY_VIEW_VERSION =
  "m2-p4-base-structured-intake-legacy-view-v1" as const;

export function buildBaseStructuredIntakeLegacyViewV1(
  baseStructuredIntake: JsonObject,
): JsonObject {
  return structuredClone(baseStructuredIntake);
}
