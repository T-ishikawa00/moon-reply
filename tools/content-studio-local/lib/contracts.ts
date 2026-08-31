import {
  decodeProductionConsultationInputV1,
} from "../../../lib/assessment/production/consultation.ts";
import type { ProductionConsultationInputV1 } from "../../../lib/assessment/production/types.ts";
import type { CustomerAssessmentExperienceProjectionV2 } from "../../../lib/assessment/runtime/customer-assessment-experience-projection-v2.ts";
import { M2RuntimeError } from "../../../lib/assessment/runtime/errors.ts";
import type { Jpy980ClarificationTarget } from "../../../lib/assessment/runtime/types.ts";
import type { LocalQualityDiagnosticV1 } from "./quality-diagnostics.ts";

export const CONTENT_STUDIO_LOCAL_GENERATE_SCHEMA_VERSION =
  "content-studio-local-generate-v1" as const;
export const CONTENT_STUDIO_LOCAL_ACTION_SCHEMA_VERSION =
  "content-studio-local-action-v1" as const;

export type LocalContentStudioGenerateEnvelopeV1 = Readonly<{
  schemaVersion: typeof CONTENT_STUDIO_LOCAL_GENERATE_SCHEMA_VERSION;
  syntheticOnlyAcknowledged: true;
  consultation: ProductionConsultationInputV1;
}>;

export type LocalContentStudioActionV1 = Readonly<{
  schemaVersion: typeof CONTENT_STUDIO_LOCAL_ACTION_SCHEMA_VERSION;
  action: "answer_clarification";
  runHandle: string;
  answer: unknown;
}>;

export type LocalContentStudioOutcomeV1 =
  | Readonly<{
      status: "ready";
      projection: CustomerAssessmentExperienceProjectionV2;
      runHandle?: string;
      diagnostic?: LocalQualityDiagnosticV1;
    }>
  | Readonly<{
      status: "needs_more_information";
      runHandle: string;
      target: Jpy980ClarificationTarget;
      question: string;
      maximumQuestionsTotal: 1;
    }>
  | Readonly<{
      status: "stopped";
      reason:
        | "prepayment_safety"
        | "not_full_product_candidate"
        | "runtime_safety_blocked"
        | "runtime_not_full_product_candidate";
      reasonCodes: readonly string[];
    }>
  | Readonly<{
      status: "failed";
      runHandle: string;
      errorCode: "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED";
      diagnostic: LocalQualityDiagnosticV1 & Readonly<{
        disposition: "fail_closed";
      }>;
    }>;

function invalid(): never {
  throw new M2RuntimeError("CONTENT_STUDIO_LOCAL_INVALID_REQUEST", 400);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
) {
  const actual = Object.keys(value);
  const allowed = new Set(expected);
  if (
    actual.length !== expected.length ||
    expected.some((key) => !Object.prototype.hasOwnProperty.call(value, key)) ||
    actual.some((key) => !allowed.has(key))
  ) {
    invalid();
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function decodeLocalContentStudioRequestV1(
  value: unknown,
): LocalContentStudioGenerateEnvelopeV1 {
  if (!isRecord(value)) invalid();
  assertExactKeys(value, [
    "schemaVersion",
    "syntheticOnlyAcknowledged",
    "consultation",
  ]);
  if (
    value.schemaVersion !== CONTENT_STUDIO_LOCAL_GENERATE_SCHEMA_VERSION ||
    value.syntheticOnlyAcknowledged !== true
  ) {
    invalid();
  }
  return Object.freeze({
    schemaVersion: CONTENT_STUDIO_LOCAL_GENERATE_SCHEMA_VERSION,
    syntheticOnlyAcknowledged: true,
    consultation: decodeProductionConsultationInputV1(value.consultation),
  });
}

export function decodeLocalContentStudioActionV1(
  value: unknown,
): LocalContentStudioActionV1 {
  if (!isRecord(value)) invalid();
  assertExactKeys(value, ["schemaVersion", "action", "runHandle", "answer"]);
  if (
    value.schemaVersion !== CONTENT_STUDIO_LOCAL_ACTION_SCHEMA_VERSION ||
    value.action !== "answer_clarification" ||
    typeof value.runHandle !== "string" ||
    !uuidPattern.test(value.runHandle)
  ) {
    invalid();
  }
  return Object.freeze({
    schemaVersion: CONTENT_STUDIO_LOCAL_ACTION_SCHEMA_VERSION,
    action: "answer_clarification",
    runHandle: value.runHandle,
    answer: structuredClone(value.answer),
  });
}

export const decodeLocalContentStudioGenerateEnvelopeV1 =
  decodeLocalContentStudioRequestV1;
export const decodeLocalContentStudioClarificationEnvelopeV1 =
  decodeLocalContentStudioActionV1;
