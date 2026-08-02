import type {
  CandidateSafetySignalCodeV1,
  CandidateSafetySignalsV1,
} from "./contracts/split-stage-contracts-v1.ts";
import type { SafetyResult } from "./policy.ts";
import type { JsonObject } from "./types.ts";

export const CANDIDATE_SAFETY_ROUTING_VERSION =
  "m2-p4-candidate-safety-routing-v1" as const;

const directReasonBySignal: Readonly<
  Partial<Record<CandidateSafetySignalCodeV1, string>>
> = Object.freeze({
  threat: "threat_or_coercion",
  coercion: "threat_or_coercion",
  fear_inducing_pressure: "threat_or_coercion",
  conditional_retaliation: "threat_or_coercion",
  uninvited_visit: "stalking_or_visit",
  location_tracking: "surveillance",
  repeat_contact_pressure: "repeated_unanswered_contact",
  reply_demand: "repeated_unanswered_contact",
  address_disclosure: "doxxing",
  identity_disclosure: "doxxing",
  account_disclosure: "doxxing",
  workplace_or_school_disclosure: "doxxing",
  third_party_sensitive_detail: "third_party_secret",
  self_harm_intent: "self_harm",
  self_harm_threat_as_pressure: "self_harm",
  suicidal_ideation: "self_harm",
  violent_intent: "harm_others",
  violent_threat: "harm_others",
  instruction_to_harm: "harm_others",
  minor_age_signal: "minor_related",
  adult_minor_romantic_or_sexual_context: "minor_related",
  authority_over_minor: "minor_related",
  request_to_facilitate_illegal_conduct: "illegal_conduct",
  instruction_to_evade_lawful_process: "illegal_conduct",
  criminal_coordination: "illegal_conduct",
});

const responseModeByReason: Readonly<Record<string, SafetyResult["response_mode"]>> =
  Object.freeze({
    self_harm: "urgent_self_safety",
    harm_others: "urgent_other_safety",
    doxxing: "privacy_protection",
    third_party_secret: "privacy_protection",
    minor_related: "minor_safeguarding",
    illegal_conduct: "lawful_alternative",
  });

const contactActionSignals = new Set<CandidateSafetySignalCodeV1>([
  "initiates_contact",
  "continues_contact",
  "asks_for_reply",
  "proposes_meeting",
]);

function disposition(reasonCodes: readonly string[]): SafetyResult {
  const unique = [...new Set(reasonCodes)];
  if (unique.length === 0) {
    return {
      classification: "normal_allowed",
      reason_codes: [],
      response_mode: "none",
    };
  }
  const mappedMode = unique
    .map((reasonCode) => responseModeByReason[reasonCode])
    .find((mode) => mode !== undefined);
  return {
    classification: "needs_review",
    reason_codes: unique,
    response_mode: mappedMode ?? "unsafe_contact_stop",
  };
}

/**
 * Projects only material Candidate-owned safety signals. The four contact
 * action signals and the untrusted-instruction flag are intentionally inert
 * without corroborating Base boundary facts.
 */
export function projectCandidateSafetyDispositionV1(
  candidateSafetySignals: CandidateSafetySignalsV1,
): SafetyResult {
  return disposition(
    candidateSafetySignals.signal_codes.flatMap((signalCode) => {
      const reasonCode = directReasonBySignal[signalCode];
      return reasonCode ? [reasonCode] : [];
    }),
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Evaluates the Candidate as a proposed contact against Application-grounded
 * Base boundary facts. Candidate content never creates or changes those facts.
 */
export function evaluateCandidateBoundaryContactV1(
  baseStructuredIntake: JsonObject,
  candidateSafetyResult: CandidateSafetySignalsV1 | null,
): SafetyResult {
  if (
    candidateSafetyResult === null ||
    !candidateSafetyResult.signal_codes.some((signalCode) =>
      contactActionSignals.has(signalCode),
    )
  ) {
    return disposition([]);
  }

  const decisionFacts = baseStructuredIntake.decision_facts;
  if (!isObject(decisionFacts)) return disposition([]);
  const boundaryState = decisionFacts.boundary_state;
  if (!isObject(boundaryState)) return disposition([]);

  const reasonCodes: string[] = [];
  if (boundaryState.kind === "no_contact") {
    reasonCodes.push("explicit_no_contact");
  } else if (boundaryState.kind === "blocked_or_restricted") {
    reasonCodes.push("blocked_or_restricted");
  } else if (boundaryState.kind === "relationship_closed") {
    reasonCodes.push("relationship_closed");
  }
  if (boundaryState.repeated_unanswered_contact === true) {
    reasonCodes.push("repeated_unanswered_contact");
  }
  return disposition(reasonCodes);
}
