import { M2RuntimeError } from "../runtime/errors.ts";
import type { AssessmentInput } from "../runtime/types.ts";
import {
  decodePrepaymentSafetyInputV1,
  type PrepaymentSafetyInputV1,
} from "../../purchase/prepayment-safety-types-v1.ts";
import {
  PRODUCTION_CONSULTATION_SCHEMA_VERSION,
  type ProductionConsultationInputV1,
} from "./types.ts";

const safetyKeys = [
  "schemaVersion",
  "adultConfirmed",
  "currentSituation",
  "latestInboundMessage",
  "optionalMessage",
  "relationship",
  "requestedTopics",
  "contactBoundaryState",
  "requestedAssistanceGoal",
  "clarificationAnswers",
  "scopeAcknowledgements",
  "attestationConfirmed",
  "safetyPolicyVersion",
] as const;

const productionKeys = [
  "consultationSchemaVersion",
  "privacyAcknowledged",
  ...safetyKeys,
] as const;

function invalid(): never {
  throw new M2RuntimeError("PRODUCTION_PREPARATION_INVALID_REQUEST", 400);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function decodeProductionConsultationInputV1(
  value: unknown,
): ProductionConsultationInputV1 {
  if (!isRecord(value)) invalid();
  const keys = Object.keys(value);
  if (
    keys.length !== productionKeys.length ||
    keys.some((key) => !productionKeys.includes(key as never)) ||
    value.consultationSchemaVersion !== PRODUCTION_CONSULTATION_SCHEMA_VERSION ||
    value.privacyAcknowledged !== true
  ) {
    invalid();
  }
  const safetyRecord = Object.fromEntries(
    safetyKeys.map((key) => [key, value[key]]),
  );
  let safetyInput: PrepaymentSafetyInputV1;
  try {
    safetyInput = decodePrepaymentSafetyInputV1(safetyRecord);
  } catch {
    invalid();
  }
  if (!safetyInput.adultConfirmed) {
    throw new M2RuntimeError("PRODUCTION_ADULT_CONFIRMATION_REQUIRED", 400);
  }
  return Object.freeze({
    ...safetyInput,
    consultationSchemaVersion: PRODUCTION_CONSULTATION_SCHEMA_VERSION,
    privacyAcknowledged: true,
  });
}

export function toAssessmentInput(
  input: ProductionConsultationInputV1,
): AssessmentInput {
  return {
    currentSituation: input.currentSituation,
    optionalMessage: input.optionalMessage,
    relationship: input.relationship,
    requestedTopics: [...input.requestedTopics],
    privacyAcknowledged: true,
  };
}

export function toPrepaymentSafetyInput(
  input: ProductionConsultationInputV1,
): PrepaymentSafetyInputV1 {
  return Object.fromEntries(
    safetyKeys.map((key) => [key, input[key]]),
  ) as unknown as PrepaymentSafetyInputV1;
}
