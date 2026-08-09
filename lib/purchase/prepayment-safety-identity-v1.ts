import { createHash } from "node:crypto";
import {
  REQUESTED_TOPIC_VALUES,
  type PrepaymentSafetyInputV1,
  type RequestedTopic,
} from "./prepayment-safety-types-v1.ts";

type CanonicalScalar = string | number | boolean | null;
type CanonicalValue =
  | CanonicalScalar
  | readonly CanonicalValue[]
  | CanonicalObject;

interface CanonicalObject {
  readonly [key: string]: CanonicalValue;
}

function normalizeBoundText(value: string) {
  return value.normalize("NFKC").replace(/\r\n?/gu, "\n").trim();
}

function orderRequestedTopics(
  requestedTopics: readonly RequestedTopic[],
): readonly RequestedTopic[] {
  const selected = new Set(requestedTopics);
  return Object.freeze(
    REQUESTED_TOPIC_VALUES.filter((topic) => selected.has(topic)),
  );
}

function canonicalJson(value: CanonicalValue): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  const entries = Object.entries(value).sort(([left], [right]) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

export function createPrepaymentSafetyIdentityV1(
  input: PrepaymentSafetyInputV1,
): string {
  const boundIdentity: CanonicalValue = {
    adultConfirmed: input.adultConfirmed,
    attestationConfirmed: input.attestationConfirmed,
    clarificationAnswers: {
      clarifiedContactBoundaryState:
        input.clarificationAnswers.clarifiedContactBoundaryState,
      currentRequestPracticalScopeOnly:
        input.clarificationAnswers.currentRequestPracticalScopeOnly,
      currentSafetyStatus: input.clarificationAnswers.currentSafetyStatus,
      practicalPermissionExplicit:
        input.clarificationAnswers.practicalPermissionExplicit,
      professionalScopeLimitedToNonprofessionalOrganization:
        input.clarificationAnswers
          .professionalScopeLimitedToNonprofessionalOrganization,
      replyExplicitlyInvited:
        input.clarificationAnswers.replyExplicitlyInvited,
      replyLimitedToExactSubject:
        input.clarificationAnswers.replyLimitedToExactSubject,
      submissionCount: input.clarificationAnswers.submissionCount,
      unsafeExecutionIntent:
        input.clarificationAnswers.unsafeExecutionIntent,
    },
    contactBoundaryState: input.contactBoundaryState,
    currentSituation: normalizeBoundText(input.currentSituation),
    optionalMessage:
      input.optionalMessage === null
        ? null
        : normalizeBoundText(input.optionalMessage),
    relationship: input.relationship,
    requestedAssistanceGoal: input.requestedAssistanceGoal,
    requestedTopics: orderRequestedTopics(input.requestedTopics),
    safetyPolicyVersion: input.safetyPolicyVersion,
    scopeAcknowledgements: {
      boundarySupportOnlyDisclosureAcknowledged:
        input.scopeAcknowledgements
          .boundarySupportOnlyDisclosureAcknowledged,
      businessOnlyScopeAcknowledged:
        input.scopeAcknowledgements.businessOnlyScopeAcknowledged,
      pauseAssessmentDisclosureAcknowledged:
        input.scopeAcknowledgements.pauseAssessmentDisclosureAcknowledged,
      scopedReplyScopeAcknowledged:
        input.scopeAcknowledgements.scopedReplyScopeAcknowledged,
    },
  };
  return createHash("sha256")
    .update(canonicalJson(boundIdentity), "utf8")
    .digest("hex");
}
