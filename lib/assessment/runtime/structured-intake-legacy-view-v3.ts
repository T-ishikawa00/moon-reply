import type { JsonObject } from "./types.ts";

export function buildStructuredIntakeLegacyViewV3(
  structuredIntakeV4: JsonObject,
): JsonObject {
  const legacy = structuredClone(structuredIntakeV4);
  delete legacy.writing_context;
  legacy.schema_version = "pipeline-schema-v3.0.0";
  return legacy;
}
