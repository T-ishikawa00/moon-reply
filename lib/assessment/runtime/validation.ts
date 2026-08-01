import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import { M2RuntimeError } from "./errors.ts";
import type { JsonObject, StageDefinition } from "./types.ts";

const validators = new Map<string, ValidateFunction>();

function validatorKey(definition: StageDefinition) {
  return `${definition.stageId}:${definition.schemaHash}`;
}

function getValidator(definition: StageDefinition) {
  const key = validatorKey(definition);
  const existing = validators.get(key);
  if (existing) {
    return existing;
  }

  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false,
  });
  const validator = ajv.compile(definition.outputSchema);
  validators.set(key, validator);
  return validator;
}

function getGroundedValidator(definition: StageDefinition) {
  if (
    !definition.groundedOutputSchema ||
    !definition.groundedSchemaHash ||
    !definition.groundedSchemaVersion
  ) {
    throw new M2RuntimeError("M2_STAGE_DEFINITION_MISSING");
  }
  const groundedDefinition: StageDefinition = {
    ...definition,
    schemaVersion: definition.groundedSchemaVersion,
    schemaHash: definition.groundedSchemaHash,
    outputSchema: definition.groundedOutputSchema,
  };
  return getValidator(groundedDefinition);
}

export function validateStageOutput(
  definition: StageDefinition,
  output: JsonObject,
) {
  const validator = getValidator(definition);
  if (!validator(output)) {
    throw new M2RuntimeError("M2_STAGE_SCHEMA_INVALID");
  }
}

export function validateGroundedStageOutput(
  definition: StageDefinition,
  output: JsonObject,
) {
  const validator = getGroundedValidator(definition);
  if (!validator(output)) {
    throw new M2RuntimeError("M2_STAGE_SCHEMA_INVALID");
  }
}

export function schemaErrorPaths(errors: ErrorObject[] | null | undefined) {
  return (errors ?? []).map((error) => error.instancePath).filter(Boolean);
}
