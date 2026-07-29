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
  "minLength",
  "maxLength",
] as const;

const omittedKeywords = new Set<string>(OPENAI_UNSUPPORTED_SCHEMA_KEYWORDS);

const referenceSiblingValidationKeywords = new Set([
  "type",
  "const",
  "enum",
  "multipleOf",
  "maximum",
  "exclusiveMaximum",
  "minimum",
  "exclusiveMinimum",
  "maxLength",
  "minLength",
  "pattern",
  "format",
  "maxItems",
  "minItems",
  "uniqueItems",
  "maxContains",
  "minContains",
  "maxProperties",
  "minProperties",
  "required",
  "dependentRequired",
  "properties",
  "patternProperties",
  "additionalProperties",
  "propertyNames",
  "unevaluatedProperties",
  "items",
  "prefixItems",
  "contains",
  "unevaluatedItems",
  "allOf",
  "anyOf",
  "oneOf",
  "not",
  "if",
  "then",
  "else",
  "dependentSchemas",
]);

/**
 * PB-01 through PB-06 have no omittable object properties. These are the only
 * fields that represent absence. Each stays required and nullable because the
 * canonical schema already accepts null, so no pre-AJV adapter conversion is
 * necessary or permitted.
 */
export const OPENAI_NULLABLE_FIELD_MAPPINGS = Object.freeze([
  {
    stageId: "PB-04",
    schemaPath: "#/properties/message_draft",
    providerRepresentation: "required anyOf canonical value or null",
    canonicalHandling: "canonical schema accepts null directly",
  },
  {
    stageId: "PB-05",
    schemaPath: "#/properties/message_draft_context",
    providerRepresentation: 'required type ["string", "null"]',
    canonicalHandling: "canonical schema accepts null directly",
  },
  {
    stageId: "PB-06",
    schemaPath: "#/properties/final_disposition",
    providerRepresentation: "required anyOf canonical value or null",
    canonicalHandling: "canonical schema accepts null directly",
  },
  {
    stageId: "PB-06",
    schemaPath: "#/properties/repair_strategy",
    providerRepresentation: "required anyOf canonical value or null",
    canonicalHandling: "canonical schema accepts null directly",
  },
  {
    stageId: "PB-06",
    schemaPath:
      "#/$defs/deterministic_check/properties/json_path",
    providerRepresentation: 'required type ["string", "null"]',
    canonicalHandling: "canonical schema accepts null directly",
  },
] as const);

export class OpenAIStructuredOutputSchemaError extends Error {
  readonly schemaPath: string;
  readonly violatedRule: string;

  constructor(schemaPath: string, violatedRule: string) {
    super(`${schemaPath}: ${violatedRule}`);
    this.name = "OpenAIStructuredOutputSchemaError";
    this.schemaPath = schemaPath;
    this.violatedRule = violatedRule;
  }
}

export function logDevelopmentOpenAIStructuredOutputSchemaFailure(
  error: unknown,
) {
  if (
    process.env.NODE_ENV !== "development" ||
    !(error instanceof OpenAIStructuredOutputSchemaError)
  ) {
    return;
  }
  console.error("M2_OPENAI_SCHEMA_CONFIGURATION_INVALID", {
    schemaPath: error.schemaPath,
    violatedRule: error.violatedRule,
  });
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => cloneJson(item));
  }
  if (isJsonObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneJson(item)]),
    );
  }
  return value;
}

function resolveLocalReference(rootSchema: JsonObject, reference: string) {
  if (reference === "#") return rootSchema;
  if (!reference.startsWith("#/")) return null;

  let selected: JsonValue = rootSchema;
  for (const encodedSegment of reference.slice(2).split("/")) {
    const segment = encodedSegment
      .replaceAll("~1", "/")
      .replaceAll("~0", "~");
    if (!isJsonObject(selected) || !(segment in selected)) return null;
    selected = selected[segment];
  }
  return isJsonObject(selected) ? selected : null;
}

function mergeSchemaOverlay(base: JsonObject, overlay: JsonObject): JsonObject {
  const merged = cloneJson(base) as JsonObject;
  for (const [key, value] of Object.entries(overlay)) {
    if (
      key === "properties" &&
      isJsonObject(merged.properties) &&
      isJsonObject(value)
    ) {
      const properties = cloneJson(merged.properties) as JsonObject;
      for (const [propertyName, propertyOverlay] of Object.entries(value)) {
        const propertyBase = properties[propertyName];
        properties[propertyName] =
          isJsonObject(propertyBase) && isJsonObject(propertyOverlay)
            ? mergeSchemaOverlay(propertyBase, propertyOverlay)
            : cloneJson(propertyOverlay);
      }
      merged.properties = properties;
      continue;
    }
    merged[key] = cloneJson(value);
  }
  return merged;
}

function materializeSimpleReferenceAllOf(
  value: JsonObject,
  rootSchema: JsonObject,
): JsonObject {
  if (
    !Array.isArray(value.allOf) ||
    Object.keys(value).some((key) => key !== "allOf")
  ) {
    return value;
  }

  const [referenceBranch, ...overlays] = value.allOf;
  if (
    !isJsonObject(referenceBranch) ||
    typeof referenceBranch.$ref !== "string" ||
    Object.keys(referenceBranch).some((key) => key !== "$ref") ||
    !overlays.every(
      (overlay) =>
        isJsonObject(overlay) &&
        Object.keys(overlay).every((key) => key === "properties"),
    )
  ) {
    return value;
  }

  const referenced = resolveLocalReference(rootSchema, referenceBranch.$ref);
  if (!referenced) return value;
  return overlays.reduce<JsonObject>(
    (merged, overlay) => mergeSchemaOverlay(merged, overlay as JsonObject),
    cloneJson(referenced) as JsonObject,
  );
}

function inferredJsonType(value: JsonValue) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return typeof value;
}

function addRedundantTypeForConstOrEnum(
  projected: JsonObject,
  canonical: JsonObject,
) {
  if (projected.type !== undefined) return;
  if (canonical.const !== undefined) {
    projected.type = inferredJsonType(canonical.const);
    return;
  }
  if (!Array.isArray(canonical.enum) || canonical.enum.length === 0) return;

  const types = [
    ...new Set(canonical.enum.map((value) => inferredJsonType(value))),
  ];
  if (types.length === 1) projected.type = types[0];
}

function projectSchemaMap(value: JsonValue, rootSchema: JsonObject) {
  if (!isJsonObject(value)) {
    return cloneJson(value);
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, schema]) => [
      key,
      projectSchema(schema, rootSchema),
    ]),
  );
}

function projectSchemaList(value: JsonValue, rootSchema: JsonObject) {
  if (!Array.isArray(value)) return cloneJson(value);
  return value.map((schema) => projectSchema(schema, rootSchema));
}

function projectSchema(value: JsonValue, rootSchema: JsonObject): JsonValue {
  if (!isJsonObject(value)) {
    return cloneJson(value);
  }

  const canonical = materializeSimpleReferenceAllOf(value, rootSchema);
  const projected: JsonObject = {};
  const prefixItems = Array.isArray(canonical.prefixItems)
    ? canonical.prefixItems.map((schema) => projectSchema(schema, rootSchema))
    : null;

  for (const [key, item] of Object.entries(canonical)) {
    if (omittedKeywords.has(key)) continue;

    if (key === "properties" || key === "$defs") {
      projected[key] = projectSchemaMap(item, rootSchema);
      continue;
    }
    if (key === "anyOf") {
      projected[key] = projectSchemaList(item, rootSchema);
      continue;
    }
    if (key === "items") {
      if (prefixItems !== null || typeof item === "boolean") continue;
      projected[key] = projectSchema(item, rootSchema);
      continue;
    }
    projected[key] = cloneJson(item);
  }

  if (Array.isArray(canonical.oneOf)) {
    projected.anyOf = projectSchemaList(canonical.oneOf, rootSchema);
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

  addRedundantTypeForConstOrEnum(projected, canonical);

  return projected;
}

function schemaPathSegment(value: string) {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function schemaTypes(schema: JsonObject) {
  if (typeof schema.type === "string") return [schema.type];
  if (Array.isArray(schema.type)) {
    return schema.type.filter(
      (value): value is string => typeof value === "string",
    );
  }
  return [];
}

function failSchema(schemaPath: string, violatedRule: string): never {
  throw new OpenAIStructuredOutputSchemaError(schemaPath, violatedRule);
}

export function assertOpenAIStructuredOutputSchema(schema: JsonObject) {
  if (schema.type !== "object") {
    failSchema("#/type", "root schema type must be object");
  }
  if (Object.hasOwn(schema, "anyOf")) {
    failSchema("#/anyOf", "root schema must not use anyOf");
  }

  let totalObjectProperties = 0;

  function visit(value: JsonValue, schemaPath: string, depth: number) {
    if (depth > 10) {
      failSchema(schemaPath, "schema nesting depth must not exceed 10");
    }
    if (!isJsonObject(value)) {
      failSchema(schemaPath, "schema node must be an object");
    }

    for (const keyword of OPENAI_UNSUPPORTED_SCHEMA_KEYWORDS) {
      if (Object.hasOwn(value, keyword)) {
        failSchema(
          `${schemaPath}/${schemaPathSegment(keyword)}`,
          `${keyword} is prohibited`,
        );
      }
    }

    if (typeof value.$ref === "string") {
      for (const keyword of Object.keys(value)) {
        if (keyword !== "$ref" && referenceSiblingValidationKeywords.has(keyword)) {
          failSchema(
            `${schemaPath}/${schemaPathSegment(keyword)}`,
            "$ref must not have sibling validation keywords",
          );
        }
      }
      if (!resolveLocalReference(schema, value.$ref)) {
        failSchema(
          `${schemaPath}/$ref`,
          "$ref must resolve to a schema object",
        );
      }
    }

    const types = schemaTypes(value);
    const isObjectNode =
      types.includes("object") ||
      Object.hasOwn(value, "properties") ||
      Object.hasOwn(value, "required") ||
      Object.hasOwn(value, "additionalProperties");
    if (isObjectNode) {
      if (!isJsonObject(value.properties)) {
        failSchema(
          `${schemaPath}/properties`,
          "object properties must be an object",
        );
      }
      if (value.additionalProperties !== false) {
        failSchema(
          `${schemaPath}/additionalProperties`,
          "object additionalProperties must be false",
        );
      }
      if (!Array.isArray(value.required)) {
        failSchema(
          `${schemaPath}/required`,
          "object required must exist and be an array",
        );
      }

      const propertyKeys = Object.keys(value.properties);
      const requiredKeys = value.required.filter(
        (required): required is string => typeof required === "string",
      );
      if (propertyKeys.some((key) => !requiredKeys.includes(key))) {
        failSchema(
          `${schemaPath}/required`,
          "object required must contain every properties key",
        );
      }
      if (
        requiredKeys.length !== value.required.length ||
        requiredKeys.some((key) => !propertyKeys.includes(key))
      ) {
        failSchema(
          `${schemaPath}/required`,
          "object required must contain no extra keys",
        );
      }
      totalObjectProperties += propertyKeys.length;
    }

    if (types.includes("array") && !Object.hasOwn(value, "items")) {
      failSchema(`${schemaPath}/items`, "array items must exist");
    }

    if (Object.hasOwn(value, "anyOf")) {
      if (!Array.isArray(value.anyOf)) {
        failSchema(`${schemaPath}/anyOf`, "anyOf must be an array");
      }
      value.anyOf.forEach((branch, index) =>
        visit(branch, `${schemaPath}/anyOf/${index}`, depth + 1),
      );
    }

    if (isJsonObject(value.properties)) {
      for (const [propertyName, propertySchema] of Object.entries(
        value.properties,
      )) {
        visit(
          propertySchema,
          `${schemaPath}/properties/${schemaPathSegment(propertyName)}`,
          depth + 1,
        );
      }
    }

    if (value.$defs !== undefined) {
      if (!isJsonObject(value.$defs)) {
        failSchema(`${schemaPath}/$defs`, "$defs must be an object");
      }
      for (const [definitionName, definitionSchema] of Object.entries(
        value.$defs,
      )) {
        visit(
          definitionSchema,
          `${schemaPath}/$defs/${schemaPathSegment(definitionName)}`,
          depth + 1,
        );
      }
    }

    if (value.items !== undefined) {
      visit(value.items, `${schemaPath}/items`, depth + 1);
    }
  }

  visit(schema, "#", 1);
  if (totalObjectProperties > 5000) {
    failSchema(
      "#/properties",
      "total object properties must not exceed 5000",
    );
  }
}

export function toOpenAiStructuredOutputSchema(schema: JsonObject) {
  return projectSchema(schema, schema) as JsonObject;
}
