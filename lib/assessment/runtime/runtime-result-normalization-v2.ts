import { M2RuntimeError } from "./errors.ts";
import {
  decodeAssessmentExecutionResult,
  decodeRequestedTopics,
} from "./runtime-result-normalization-v1.ts";
import type {
  AssessmentExecutionResult,
  Jpy980ClarificationTarget,
  RuntimeClarificationPromptV1,
  StoppedAssessmentResult,
} from "./types.ts";

export const RUNTIME_RESULT_NORMALIZATION_V2_VERSION =
  "m2-p4-runtime-result-normalization-v2" as const;

function invalid(): never {
  throw new M2RuntimeError("M2_RUNTIME_RESULT_INVALID");
}
function record(value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) invalid();
}

function exact(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
) {
  const allowed = new Set([...required, ...optional]);
  if (
    required.some((key) => !Object.prototype.hasOwnProperty.call(value, key)) ||
    Object.keys(value).some((key) => !allowed.has(key))
  ) invalid();
}

function strings(value: unknown, maximum = 16) {
  if (
    !Array.isArray(value) ||
    value.length > maximum ||
    value.some((item) => typeof item !== "string" || item.length === 0) ||
    new Set(value).size !== value.length
  ) invalid();
}

function usage(value: unknown) {
  record(value);
  exact(value, [
    "totalInputTokens",
    "totalCachedTokens",
    "totalOutputTokens",
    "totalReasoningTokens",
    "usageDerivedCostUsd",
  ]);
  if (
    Object.values(value).some(
      (item) => typeof item !== "number" || !Number.isFinite(item) || item < 0,
    )
  ) invalid();
}

const targets = new Set<Jpy980ClarificationTarget>([
  "material_relationship_or_communication_concern",
  "latest_contact_timing",
  "usual_reply_cadence",
  "central_fear_or_decision_concern",
  "relationship_intent",
  "requested_message_tone",
]);

function clarification(value: unknown): RuntimeClarificationPromptV1 {
  record(value);
  exact(value, [
    "opaqueClarificationId",
    "questionCode",
    "target",
    "question",
    "maximumQuestionsTotal",
    "questionsAlreadyUsed",
    "questionsRemaining",
  ]);
  if (
    typeof value.opaqueClarificationId !== "string" ||
    !/^[A-Za-z0-9_-]{22,}$/u.test(value.opaqueClarificationId) ||
    typeof value.questionCode !== "string" ||
    typeof value.target !== "string" ||
    !targets.has(value.target as Jpy980ClarificationTarget) ||
    typeof value.question !== "string" ||
    value.question.length === 0 ||
    value.maximumQuestionsTotal !== 1 ||
    value.questionsAlreadyUsed !== 0 ||
    value.questionsRemaining !== 1
  ) invalid();
  return value as RuntimeClarificationPromptV1;
}

function stopped(value: Record<string, unknown>): StoppedAssessmentResult {
  exact(
    value,
    [
      "requestId",
      "runId",
      "eligibility",
      "questionCodes",
      "reasonCodes",
      "clarification",
      "duplicate",
      "usage",
    ],
    ["authoritativeRequestedTopics"],
  );
  if (
    typeof value.requestId !== "string" ||
    typeof value.runId !== "string" ||
    typeof value.duplicate !== "boolean"
  ) invalid();
  strings(value.questionCodes, 1);
  strings(value.reasonCodes);
  usage(value.usage);
  if (value.authoritativeRequestedTopics !== undefined) {
    decodeRequestedTopics(value.authoritativeRequestedTopics);
  }
  if (value.eligibility === "needs_more_information") {
    if ((value.questionCodes as unknown[]).length !== 1 || value.clarification === null) {
      invalid();
    }
    clarification(value.clarification);
  } else if (
    value.eligibility === "not_full_product_candidate" ||
    value.eligibility === "safety_blocked"
  ) {
    if ((value.questionCodes as unknown[]).length !== 0 || value.clarification !== null) {
      invalid();
    }
  } else {
    invalid();
  }
  return value as unknown as StoppedAssessmentResult;
}

export function decodeAssessmentExecutionResultV2(
  value: unknown,
): AssessmentExecutionResult {
  record(value);
  if (value.eligibility === "ready") {
    return decodeAssessmentExecutionResult(value);
  }
  return stopped(value);
}
