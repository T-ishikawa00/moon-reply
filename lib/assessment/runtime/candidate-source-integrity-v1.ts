import {
  CANDIDATE_SAFETY_SIGNAL_CODES,
  type CandidateEnvelopeV1,
} from "./contracts/split-stage-contracts-v1.ts";
import { M2RuntimeError } from "./errors.ts";

export const CANDIDATE_SOURCE_INTEGRITY_VERSION =
  "m2-p4-candidate-source-integrity-v1" as const;

const candidateInputKeys = ["optional_message", "candidate_metadata"] as const;
const candidateMetadataKeys = ["message_owner", "message_status"] as const;
const candidateOutputKeys = [
  "candidate_style_profile",
  "candidate_communicative_intent",
  "candidate_language_expression",
  "candidate_safety_signals",
] as const;
const candidateAnalysisKeys = [
  "candidate_style_profile",
  "candidate_communicative_intent",
  "candidate_language_expression",
] as const;
const candidateStyleKeys = [
  "register",
  "sentence_length",
  "sentence_ending",
  "punctuation",
  "emoji_usage",
  "exclamation_usage",
  "softness",
  "directness",
  "invitation_style",
  "reply_pressure",
] as const;
const candidateIntentKeys = [
  "gratitude_strength",
  "apology_strength",
  "question_count",
  "invitation_presence",
  "invitation_specificity",
  "affection_strength",
  "commitment_strength",
  "response_pressure",
  "boundary_strength",
  "conversation_closure",
  "practical_requirement",
] as const;
const candidateLanguageKeys = [
  "primary_language",
  "mixed_languages",
  "dialect_or_regional_expression",
  "intentional_nonstandard_expression",
  "possible_typo",
] as const;
const candidateSafetyKeys = [
  "untrusted_embedded_instruction_detected",
  "signal_codes",
] as const;
const candidateEnvelopeKeys = [
  "presence",
  "analysis_status",
  "safety_status",
  "analysis",
] as const;
const splitEnvelopeKeys = [
  "base_structured_intake",
  "base_legacy_view",
  "candidate_envelope",
  "candidate_safety_result",
] as const;

const forbiddenCandidatePropertyNames = new Set([
  "timeline",
  "context",
  "observed_facts",
  "material_unknowns",
  "relationship_stage",
  "decision_facts",
  "incoming_message_facts",
  "boundary_facts",
  "source_refs",
  "message_id",
  "event_id",
  "fact_id",
  "boundary_id",
  "context_id",
  "inference_id",
  "sequence",
  "candidate_text",
  "optional_message",
  "raw_candidate",
  "response_id",
  "provider_response_id",
  "usage",
  "latency",
  "latency_ms",
  "stage_id",
  "stage_ids",
  "expected",
  "expected_values",
  "oracle",
  "case_id",
  "fixture_id",
  "confidence",
  "probability",
]);

const forbiddenBaseContainerPropertyNames = new Set([
  "optional_message",
  "candidate_text",
  "raw_candidate",
  "candidate_analysis",
  "candidate_envelope",
  "candidate_style_profile",
  "candidate_communicative_intent",
  "candidate_language_expression",
  "candidate_safety_signals",
  "candidate_safety_result",
  "candidate_presence",
  "proposed_message_present",
  "response_id",
  "provider_response_id",
  "usage",
  "latency",
  "latency_ms",
  "stage_id",
  "stage_ids",
]);

const allowedSafetyCodes = new Set<string>(CANDIDATE_SAFETY_SIGNAL_CODES);

export type CandidateSourceIntegritySurfacesV1 = Readonly<{
  candidateProviderInput?: unknown;
  rawCandidateProviderOutput?: unknown;
  candidateAnalysis?: unknown;
  candidateSafetyResult?: unknown;
  candidateEnvelope?: unknown;
  splitAnalysisEnvelope?: unknown;
}>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(value: object, propertyName: string) {
  return Object.prototype.hasOwnProperty.call(value, propertyName);
}

function sameKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value).sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  const sortedExpected = [...expected].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  return JSON.stringify(actual) === JSON.stringify(sortedExpected);
}

function inspectForbiddenCandidateProperties(
  value: unknown,
  surface: string,
  violations: Set<string>,
  path = "$",
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      inspectForbiddenCandidateProperties(
        item,
        surface,
        violations,
        `${path}[${index}]`,
      ),
    );
    return;
  }
  if (!isObject(value)) return;
  for (const [propertyName, propertyValue] of Object.entries(value)) {
    const propertyPath = `${path}.${propertyName}`;
    if (forbiddenCandidatePropertyNames.has(propertyName)) {
      violations.add(`${surface}:FORBIDDEN_PROPERTY:${propertyPath}`);
    }
    inspectForbiddenCandidateProperties(
      propertyValue,
      surface,
      violations,
      propertyPath,
    );
  }
}

function inspectForbiddenBaseContainerProperties(
  value: unknown,
  violations: Set<string>,
  path: string,
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      inspectForbiddenBaseContainerProperties(
        item,
        violations,
        `${path}[${index}]`,
      ),
    );
    return;
  }
  if (!isObject(value)) return;
  for (const [propertyName, propertyValue] of Object.entries(value)) {
    const propertyPath = `${path}.${propertyName}`;
    if (forbiddenBaseContainerPropertyNames.has(propertyName)) {
      violations.add(`SPLIT_ANALYSIS_ENVELOPE:BASE_CONTAMINATION:${propertyPath}`);
    }
    inspectForbiddenBaseContainerProperties(
      propertyValue,
      violations,
      propertyPath,
    );
  }
}

function inspectCandidateAnalysis(
  value: unknown,
  surface: string,
  violations: Set<string>,
) {
  if (!isObject(value)) {
    violations.add(`${surface}:NOT_OBJECT`);
    return;
  }
  if (!sameKeys(value, candidateAnalysisKeys)) {
    violations.add(`${surface}:EXACT_KEYS_INVALID`);
  }
  for (const [propertyName, expectedKeys] of [
    ["candidate_style_profile", candidateStyleKeys],
    ["candidate_communicative_intent", candidateIntentKeys],
    ["candidate_language_expression", candidateLanguageKeys],
  ] as const) {
    const selected = value[propertyName];
    if (!isObject(selected) || !sameKeys(selected, expectedKeys)) {
      violations.add(`${surface}:${propertyName.toUpperCase()}:EXACT_KEYS_INVALID`);
    }
  }
  inspectForbiddenCandidateProperties(value, surface, violations);
}

function inspectCandidateSafety(
  value: unknown,
  surface: string,
  violations: Set<string>,
) {
  if (!isObject(value)) {
    violations.add(`${surface}:NOT_OBJECT`);
    return;
  }
  if (!sameKeys(value, candidateSafetyKeys)) {
    violations.add(`${surface}:EXACT_KEYS_INVALID`);
  }
  if (typeof value.untrusted_embedded_instruction_detected !== "boolean") {
    violations.add(`${surface}:UNTRUSTED_INSTRUCTION_FLAG_INVALID`);
  }
  if (!Array.isArray(value.signal_codes)) {
    violations.add(`${surface}:SIGNAL_CODES_NOT_ARRAY`);
    return;
  }
  const stringCodes = value.signal_codes.filter(
    (code): code is string => typeof code === "string",
  );
  if (stringCodes.length !== value.signal_codes.length) {
    violations.add(`${surface}:SIGNAL_CODE_NOT_STRING`);
  }
  if (new Set(stringCodes).size !== stringCodes.length) {
    violations.add(`${surface}:SIGNAL_CODES_NOT_UNIQUE`);
  }
  if (stringCodes.some((code) => !allowedSafetyCodes.has(code))) {
    violations.add(`${surface}:SIGNAL_CODE_NOT_ALLOWED`);
  }
  inspectForbiddenCandidateProperties(value, surface, violations);
}

function inspectCandidateEnvelope(
  value: unknown,
  violations: Set<string>,
): value is CandidateEnvelopeV1 {
  if (!isObject(value)) {
    violations.add("CANDIDATE_ENVELOPE:NOT_OBJECT");
    return false;
  }
  if (!sameKeys(value, candidateEnvelopeKeys)) {
    violations.add("CANDIDATE_ENVELOPE:EXACT_KEYS_INVALID");
  }
  inspectForbiddenCandidateProperties(value, "CANDIDATE_ENVELOPE", violations);

  const isAbsent =
    value.presence === false &&
    value.analysis_status === "absent" &&
    value.safety_status === "absent" &&
    value.analysis === null;
  const isAvailable =
    value.presence === true &&
    value.analysis_status === "available" &&
    value.safety_status === "available" &&
    isObject(value.analysis);
  const isAnalysisUnavailable =
    value.presence === true &&
    value.analysis_status === "unavailable" &&
    value.safety_status === "available" &&
    value.analysis === null;
  const isSafetyUnavailable =
    value.presence === true &&
    value.analysis_status === "unavailable" &&
    value.safety_status === "unavailable" &&
    value.analysis === null;
  if (!(isAbsent || isAvailable || isAnalysisUnavailable || isSafetyUnavailable)) {
    violations.add("CANDIDATE_ENVELOPE:STATE_INVALID");
    return false;
  }
  if (isAvailable) {
    inspectCandidateAnalysis(
      value.analysis,
      "CANDIDATE_ENVELOPE_ANALYSIS",
      violations,
    );
  }
  return true;
}

function inspectCandidateInput(value: unknown, violations: Set<string>) {
  if (!isObject(value)) {
    violations.add("CANDIDATE_PROVIDER_INPUT:NOT_OBJECT");
    return;
  }
  if (!sameKeys(value, candidateInputKeys)) {
    violations.add("CANDIDATE_PROVIDER_INPUT:EXACT_KEYS_INVALID");
  }
  if (
    typeof value.optional_message !== "string" ||
    value.optional_message.trim().length === 0
  ) {
    violations.add("CANDIDATE_PROVIDER_INPUT:OPTIONAL_MESSAGE_INVALID");
  }
  const metadata = value.candidate_metadata;
  if (
    !isObject(metadata) ||
    !sameKeys(metadata, candidateMetadataKeys) ||
    metadata.message_owner !== "user" ||
    metadata.message_status !== "unsent_candidate"
  ) {
    violations.add("CANDIDATE_PROVIDER_INPUT:METADATA_INVALID");
  }
}

function inspectCandidateOutput(value: unknown, violations: Set<string>) {
  if (!isObject(value)) {
    violations.add("CANDIDATE_PROVIDER_OUTPUT:NOT_OBJECT");
    return;
  }
  if (!sameKeys(value, candidateOutputKeys)) {
    violations.add("CANDIDATE_PROVIDER_OUTPUT:EXACT_KEYS_INVALID");
  }
  inspectCandidateAnalysis(
    {
      candidate_style_profile: value.candidate_style_profile,
      candidate_communicative_intent: value.candidate_communicative_intent,
      candidate_language_expression: value.candidate_language_expression,
    },
    "CANDIDATE_PROVIDER_OUTPUT",
    violations,
  );
  inspectCandidateSafety(
    value.candidate_safety_signals,
    "CANDIDATE_PROVIDER_OUTPUT_SAFETY",
    violations,
  );
  inspectForbiddenCandidateProperties(
    value,
    "CANDIDATE_PROVIDER_OUTPUT",
    violations,
  );
}

function inspectLaneConsistency(
  envelope: unknown,
  safetyResult: unknown,
  violations: Set<string>,
) {
  if (!isObject(envelope)) return;
  const safetyMustBePresent =
    envelope.presence === true && envelope.safety_status === "available";
  const safetyMustBeAbsent =
    envelope.safety_status === "absent" ||
    envelope.safety_status === "unavailable";
  if (safetyMustBePresent && !isObject(safetyResult)) {
    violations.add("CANDIDATE_LANE:SAFETY_RESULT_REQUIRED");
  }
  if (safetyMustBeAbsent && safetyResult !== null) {
    violations.add("CANDIDATE_LANE:SAFETY_RESULT_MUST_BE_NULL");
  }
}

function inspectSplitEnvelope(value: unknown, violations: Set<string>) {
  if (!isObject(value)) {
    violations.add("SPLIT_ANALYSIS_ENVELOPE:NOT_OBJECT");
    return;
  }
  if (!sameKeys(value, splitEnvelopeKeys)) {
    violations.add("SPLIT_ANALYSIS_ENVELOPE:EXACT_KEYS_INVALID");
  }
  if (!isObject(value.base_structured_intake)) {
    violations.add("SPLIT_ANALYSIS_ENVELOPE:BASE_STRUCTURED_INTAKE_INVALID");
  } else {
    inspectForbiddenBaseContainerProperties(
      value.base_structured_intake,
      violations,
      "$.base_structured_intake",
    );
  }
  if (!isObject(value.base_legacy_view)) {
    violations.add("SPLIT_ANALYSIS_ENVELOPE:BASE_LEGACY_VIEW_INVALID");
  } else {
    inspectForbiddenBaseContainerProperties(
      value.base_legacy_view,
      violations,
      "$.base_legacy_view",
    );
  }
  inspectCandidateEnvelope(value.candidate_envelope, violations);
  if (value.candidate_safety_result !== null) {
    inspectCandidateSafety(
      value.candidate_safety_result,
      "SPLIT_ANALYSIS_ENVELOPE_SAFETY",
      violations,
    );
  }
  inspectLaneConsistency(
    value.candidate_envelope,
    value.candidate_safety_result,
    violations,
  );
}

export function collectCandidateSourceIntegrityViolationsV1(
  surfaces: CandidateSourceIntegritySurfacesV1,
): string[] {
  const violations = new Set<string>();
  if (surfaces.candidateProviderInput !== undefined) {
    inspectCandidateInput(surfaces.candidateProviderInput, violations);
  }
  if (surfaces.rawCandidateProviderOutput !== undefined) {
    inspectCandidateOutput(surfaces.rawCandidateProviderOutput, violations);
  }
  if (surfaces.candidateAnalysis !== undefined) {
    inspectCandidateAnalysis(
      surfaces.candidateAnalysis,
      "CANDIDATE_ANALYSIS",
      violations,
    );
  }
  if (hasOwn(surfaces, "candidateSafetyResult")) {
    if (surfaces.candidateSafetyResult !== null) {
      inspectCandidateSafety(
        surfaces.candidateSafetyResult,
        "CANDIDATE_SAFETY_RESULT",
        violations,
      );
    }
  }
  if (surfaces.candidateEnvelope !== undefined) {
    inspectCandidateEnvelope(surfaces.candidateEnvelope, violations);
    if (hasOwn(surfaces, "candidateSafetyResult")) {
      inspectLaneConsistency(
        surfaces.candidateEnvelope,
        surfaces.candidateSafetyResult,
        violations,
      );
    }
  }
  if (surfaces.splitAnalysisEnvelope !== undefined) {
    inspectSplitEnvelope(surfaces.splitAnalysisEnvelope, violations);
  }
  return [...violations].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

export function validateCandidateSourceIntegrityV1(
  surfaces: CandidateSourceIntegritySurfacesV1,
): void {
  if (collectCandidateSourceIntegrityViolationsV1(surfaces).length > 0) {
    throw new M2RuntimeError("M2_CANDIDATE_SOURCE_INTEGRITY_FAILED");
  }
}
