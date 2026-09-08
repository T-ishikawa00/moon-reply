import type { JsonObject } from "./types.ts";
export function normalizeProviderSchema(input: JsonObject): { schema: JsonObject; report: { passThrough: boolean; proof: { equal: boolean }; counts: { movedDefinitions: number } } };
