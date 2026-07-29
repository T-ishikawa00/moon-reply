import type { JsonObject, JsonValue } from "./types.ts";

export const OPENAI_UNSUPPORTED_SCHEMA_KEYWORDS = [
  "$schema",
  "$id",
  "allOf",
  "not",
  "dependentRequired",
  "dependentSchemas",
  "if",
  "then",
  "else",
  "oneOf",
  "prefixItems",
  "uniqueItems",
] as const;

const omittedKeywords = new Set<string>(OPENAI_UNSUPPORTED_SCHEMA_KEYWORDS);

function cloneJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => cloneJson(item));
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneJson(item)]),
    );
  }
  return value;
}

function projectSchemaMap(value: JsonValue) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return cloneJson(value);
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, schema]) => [
      key,
      projectSchema(schema),
    ]),
  );
}

function projectSchemaList(value: JsonValue) {
  if (!Array.isArray(value)) return cloneJson(value);
  return value.map((schema) => projectSchema(schema));
}

function projectSchema(value: JsonValue): JsonValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return cloneJson(value);
  }

  const projected: JsonObject = {};
  const prefixItems = Array.isArray(value.prefixItems)
    ? value.prefixItems.map((schema) => projectSchema(schema))
    : null;
  const baseReference = Array.isArray(value.allOf)
    ? value.allOf.find(
        (schema) =>
          typeof schema === "object" &&
          schema !== null &&
          !Array.isArray(schema) &&
          typeof schema.$ref === "string",
      )
    : null;

  for (const [key, item] of Object.entries(value)) {
    if (omittedKeywords.has(key)) continue;

    if (key === "properties" || key === "$defs") {
      projected[key] = projectSchemaMap(item);
      continue;
    }
    if (key === "anyOf") {
      projected[key] = projectSchemaList(item);
      continue;
    }
    if (key === "items") {
      if (prefixItems !== null || typeof item === "boolean") continue;
      projected[key] = projectSchema(item);
      continue;
    }
    if (
      key === "additionalProperties" &&
      typeof item === "object" &&
      item !== null
    ) {
      projected[key] = projectSchema(item);
      continue;
    }
    projected[key] = cloneJson(item);
  }

  if (Array.isArray(value.oneOf)) {
    projected.anyOf = projectSchemaList(value.oneOf);
  }

  if (prefixItems !== null) {
    const uniqueItems = [
      ...new Map(
        prefixItems.map((schema) => [JSON.stringify(schema), schema]),
      ).values(),
    ];
    projected.items =
      uniqueItems.length === 1 ? uniqueItems[0] : { anyOf: uniqueItems };
  }

  if (
    baseReference &&
    typeof baseReference === "object" &&
    !Array.isArray(baseReference) &&
    typeof baseReference.$ref === "string" &&
    projected.$ref === undefined
  ) {
    projected.$ref = baseReference.$ref;
  }

  return projected;
}

export function toOpenAiStructuredOutputSchema(schema: JsonObject) {
  return projectSchema(schema) as JsonObject;
}
