import { createHash, randomBytes } from "node:crypto";
import { M2RuntimeError } from "./errors.ts";
import type {
  JsonObject,
  JsonValue,
  Jpy980ClarificationTarget,
  PersistedAssessmentClarification,
} from "./types.ts";

export const CLARIFICATION_EVIDENCE_V1_SCHEMA_VERSION =
  "m2-p4-clarification-evidence-v1" as const;
export const ASSESSMENT_CLARIFICATION_V1_SCHEMA_VERSION =
  "m2-p4-assessment-clarification-v1" as const;
export const CLARIFICATION_PROVENANCE = "user_clarification" as const;
export const CLARIFICATION_ORDINAL = 1 as const;
export const CLARIFICATION_MINIMUM_UNPREDICTABILITY_BITS = 128 as const;

export const CLARIFICATION_TARGETS_V1 = [
  "material_relationship_or_communication_concern",
  "latest_contact_timing",
  "usual_reply_cadence",
  "central_fear_or_decision_concern",
  "relationship_intent",
  "requested_message_tone",
] as const satisfies readonly Jpy980ClarificationTarget[];

const materialConcernValues = [
  "distance",
  "affection_expression",
  "reply_pressure",
  "other_material_concern",
  "no_material_concern",
] as const;
const timingBucketValues = [
  "less_than_6_hours",
  "six_to_24_hours",
  "one_to_three_days",
  "more_than_three_days",
  "unknown",
] as const;
const cadenceValues = ["within_usual", "beyond_usual", "unknown"] as const;
const relationshipIntentValues = [
  "move_closer",
  "maintain_distance",
  "repair_conflict",
  "decline_without_false_hope",
  "end_contact",
  "express_affection",
  "clarify_relationship",
  "unsure",
] as const;
const toneValues = [
  "polite",
  "neutral_polite",
  "casual",
  "soft",
  "direct",
  "brief",
  "playful",
  "custom",
] as const;

export type ClarificationEvidenceV1 = {
  schemaVersion: typeof CLARIFICATION_EVIDENCE_V1_SCHEMA_VERSION;
  clarificationId: string;
  ordinal: 1;
  questionCode: string;
  target: Jpy980ClarificationTarget;
  questionSnapshot: string;
  answer: JsonValue;
  provenance: typeof CLARIFICATION_PROVENANCE;
  sourceIdentity: string;
  groundedNormalizedRepresentation: JsonObject;
  canonicalAnswer: string;
  answerFingerprint: string;
  resolvesTarget: boolean;
};

export type ValidatedClarificationAnswerV1 = {
  validatedAnswer: JsonValue;
  groundedNormalizedRepresentation: JsonObject;
  canonicalAnswer: string;
  answerFingerprint: string;
  resolvesTarget: boolean;
};

export function clarificationAnswerResolvesTargetV1(
  target: Jpy980ClarificationTarget,
  normalized: JsonObject,
) {
  return !(
    (target === "material_relationship_or_communication_concern" &&
      normalized.choice === "no_material_concern") ||
    (target === "latest_contact_timing" &&
      (normalized.kind === "unknown" || normalized.value === "unknown")) ||
    (target === "usual_reply_cadence" && normalized.relation === "unknown") ||
    (target === "central_fear_or_decision_concern" && normalized.kind === "none") ||
    (target === "relationship_intent" && normalized.choice === "unsure")
  );
}

function invalid(code = "M2_CLARIFICATION_ANSWER_INVALID", status = 400): never {
  throw new M2RuntimeError(code, status);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, required: string[], optional: string[] = []) {
  const allowed = new Set([...required, ...optional]);
  if (
    required.some((key) => !Object.prototype.hasOwnProperty.call(value, key)) ||
    Object.keys(value).some((key) => !allowed.has(key))
  ) {
    invalid();
  }
}

function normalizeText(value: unknown, maximum: number, allowEmpty = false) {
  if (typeof value !== "string") invalid();
  const normalized = value.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
  if ((!allowEmpty && normalized.length === 0) || normalized.length > maximum) invalid();
  return normalized;
}

function oneOf<const Values extends readonly string[]>(value: unknown, values: Values) {
  if (typeof value !== "string" || !values.some((candidate) => candidate === value)) {
    invalid();
  }
  return value as Values[number];
}

function canonicalize(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => [key, canonicalize(value[key] as JsonValue)]),
  );
}

export function canonicalClarificationAnswerV1(value: JsonValue) {
  return JSON.stringify(canonicalize(value));
}

function fingerprint(canonicalAnswer: string) {
  return createHash("sha256").update(canonicalAnswer, "utf8").digest("hex");
}

function canonicalTimeZone(value: unknown) {
  const timeZone = normalizeText(value, 100);
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone }).resolvedOptions().timeZone;
  } catch {
    invalid("M2_CLARIFICATION_TIME_INVALID");
  }
}

function zonedParts(instantMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instantMs));
  const selected = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(selected.year),
    month: Number(selected.month),
    day: Number(selected.day),
    hour: Number(selected.hour),
    minute: Number(selected.minute),
    second: Number(selected.second),
  };
}

function localDateTimeToInstant(localDateTime: string, timeZone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/u.exec(localDateTime);
  if (!match) invalid("M2_CLARIFICATION_TIME_INVALID");
  const desired = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: 0,
  };
  if (
    desired.month < 1 ||
    desired.month > 12 ||
    desired.day < 1 ||
    desired.day > 31 ||
    desired.hour > 23 ||
    desired.minute > 59
  ) {
    invalid("M2_CLARIFICATION_TIME_INVALID");
  }
  const desiredAsUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );
  let candidate = desiredAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const observed = zonedParts(candidate, timeZone);
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
    );
    candidate += desiredAsUtc - observedAsUtc;
  }
  const verified = zonedParts(candidate, timeZone);
  if (
    verified.year !== desired.year ||
    verified.month !== desired.month ||
    verified.day !== desired.day ||
    verified.hour !== desired.hour ||
    verified.minute !== desired.minute
  ) {
    invalid("M2_CLARIFICATION_TIME_INVALID");
  }
  return candidate;
}

function validateLatestTiming(
  answer: unknown,
  resumeStartedAt: string,
): { validated: JsonObject; normalized: JsonObject } {
  if (!isObject(answer)) invalid();
  exactKeys(answer, ["kind"], ["value", "localDateTime", "timeZone"]);
  if (answer.kind === "elapsed_bucket") {
    exactKeys(answer, ["kind", "value"]);
    const value = oneOf(answer.value, timingBucketValues);
    const lowerBoundMinutes: Record<(typeof timingBucketValues)[number], number | null> = {
      less_than_6_hours: 0,
      six_to_24_hours: 360,
      one_to_three_days: 1_440,
      more_than_three_days: 4_321,
      unknown: null,
    };
    return {
      validated: { kind: "elapsed_bucket", value } satisfies JsonObject,
      normalized: {
        kind: "elapsed_bucket",
        value,
        elapsedMinutesLowerBound: lowerBoundMinutes[value],
      } satisfies JsonObject,
    };
  }
  if (answer.kind === "local_datetime") {
    exactKeys(answer, ["kind", "localDateTime", "timeZone"]);
    const localDateTime = normalizeText(answer.localDateTime, 16);
    const timeZone = canonicalTimeZone(answer.timeZone);
    const contactInstant = localDateTimeToInstant(localDateTime, timeZone);
    const trustedResumeMs = Date.parse(resumeStartedAt);
    if (!Number.isFinite(trustedResumeMs) || contactInstant > trustedResumeMs) {
      invalid("M2_CLARIFICATION_TIME_INVALID");
    }
    return {
      validated: { kind: "local_datetime", localDateTime, timeZone } satisfies JsonObject,
      normalized: {
        kind: "local_datetime",
        localDateTime,
        timeZone,
        derivedElapsedMinutes: Math.floor((trustedResumeMs - contactInstant) / 60_000),
        trustedNowAuthority: "resume_run_started_at",
      } satisfies JsonObject,
    };
  }
  if (answer.kind === "unknown") {
    exactKeys(answer, ["kind"]);
    return {
      validated: { kind: "unknown" } satisfies JsonObject,
      normalized: { kind: "unknown" } satisfies JsonObject,
    };
  }
  invalid();
}

function validateChoiceWithDetail(
  answer: unknown,
  values: readonly string[],
  maximumDetail: number,
) {
  if (!isObject(answer)) invalid();
  exactKeys(answer, ["choice"], ["detail"]);
  const choice = oneOf(answer.choice, values);
  const detail =
    answer.detail === undefined ? null : normalizeText(answer.detail, maximumDetail, true) || null;
  return { choice, detail } satisfies JsonObject;
}

export function validateClarificationAnswerV1(input: {
  target: Jpy980ClarificationTarget;
  answer: unknown;
  resumeStartedAt: string;
}): ValidatedClarificationAnswerV1 {
  let normalized: JsonObject;
  let validated: JsonValue;
  switch (input.target) {
    case "material_relationship_or_communication_concern":
      normalized = validateChoiceWithDetail(input.answer, materialConcernValues, 500);
      validated = structuredClone(normalized);
      break;
    case "latest_contact_timing": {
      const timing = validateLatestTiming(input.answer, input.resumeStartedAt);
      normalized = timing.normalized;
      validated = timing.validated;
      break;
    }
    case "usual_reply_cadence":
      normalized = { relation: oneOf(input.answer, cadenceValues) };
      validated = structuredClone(normalized);
      break;
    case "central_fear_or_decision_concern":
      if (!isObject(input.answer)) invalid();
      exactKeys(input.answer, ["kind"], ["value"]);
      if (input.answer.kind === "none") {
        exactKeys(input.answer, ["kind"]);
        normalized = { kind: "none" };
      } else if (input.answer.kind === "concern") {
        exactKeys(input.answer, ["kind", "value"]);
        normalized = {
          kind: "concern",
          value: normalizeText(input.answer.value, 500),
        };
      } else {
        invalid();
      }
      validated = structuredClone(normalized);
      break;
    case "relationship_intent":
      normalized = validateChoiceWithDetail(input.answer, relationshipIntentValues, 500);
      validated = structuredClone(normalized);
      break;
    case "requested_message_tone": {
      normalized = validateChoiceWithDetail(input.answer, toneValues, 240);
      if (normalized.choice === "custom" && normalized.detail === null) invalid();
      validated = structuredClone(normalized);
      break;
    }
    default:
      invalid();
  }
  const canonicalAnswer = canonicalClarificationAnswerV1(validated);
  const resolvesTarget = clarificationAnswerResolvesTargetV1(
    input.target,
    normalized,
  );
  return {
    validatedAnswer: structuredClone(validated),
    groundedNormalizedRepresentation: structuredClone(normalized),
    canonicalAnswer,
    answerFingerprint: fingerprint(canonicalAnswer),
    resolvesTarget,
  };
}

export function createOpaqueClarificationIdV1(
  entropy: Uint8Array = randomBytes(32),
) {
  if (entropy.byteLength * 8 < CLARIFICATION_MINIMUM_UNPREDICTABILITY_BITS) {
    invalid("M2_CLARIFICATION_CAPABILITY_INVALID");
  }
  return Buffer.from(entropy).toString("base64url");
}

export function validateOpaqueClarificationIdV1(value: unknown) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{22,}$/u.test(value)) {
    invalid("M2_CLARIFICATION_CAPABILITY_INVALID", 404);
  }
  let bytes: Buffer;
  try {
    bytes = Buffer.from(value, "base64url");
  } catch {
    invalid("M2_CLARIFICATION_CAPABILITY_INVALID", 404);
  }
  if (bytes.byteLength * 8 < CLARIFICATION_MINIMUM_UNPREDICTABILITY_BITS) {
    invalid("M2_CLARIFICATION_CAPABILITY_INVALID", 404);
  }
  return value;
}

export function clarificationSourceIdentityV1(clarificationId: string) {
  validateOpaqueClarificationIdV1(clarificationId);
  return `clarification:${clarificationId}:answer:1` as const;
}

export function buildClarificationEvidenceV1(
  persisted: PersistedAssessmentClarification,
): ClarificationEvidenceV1 {
  if (
    persisted.target === "original_message" ||
    persisted.answerStatus !== "answered" ||
    persisted.answer === null ||
    persisted.answerFingerprint === null ||
    persisted.groundedNormalizedRepresentation === null ||
    persisted.ordinal !== 1 ||
    persisted.provenance !== CLARIFICATION_PROVENANCE ||
    persisted.sourceIdentity !== clarificationSourceIdentityV1(persisted.id)
  ) {
    invalid("M2_CLARIFICATION_EVIDENCE_INVALID");
  }
  const canonicalAnswer = canonicalClarificationAnswerV1(persisted.answer);
  if (fingerprint(canonicalAnswer) !== persisted.answerFingerprint) {
    invalid("M2_CLARIFICATION_EVIDENCE_INVALID");
  }
  return {
    schemaVersion: CLARIFICATION_EVIDENCE_V1_SCHEMA_VERSION,
    clarificationId: persisted.id,
    ordinal: 1,
    questionCode: persisted.questionCode,
    target: persisted.target,
    questionSnapshot: persisted.questionSnapshot,
    answer: structuredClone(persisted.answer),
    provenance: CLARIFICATION_PROVENANCE,
    sourceIdentity: persisted.sourceIdentity,
    groundedNormalizedRepresentation: structuredClone(
      persisted.groundedNormalizedRepresentation,
    ),
    canonicalAnswer,
    answerFingerprint: persisted.answerFingerprint,
    resolvesTarget: clarificationAnswerResolvesTargetV1(
      persisted.target,
      persisted.groundedNormalizedRepresentation,
    ),
  };
}
