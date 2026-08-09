import {
  RELATIONSHIP_VALUES,
  REQUESTED_TOPIC_VALUES,
  type RelationshipValue,
  type RequestedTopic,
} from "../assessment/runtime/types.ts";

export { RELATIONSHIP_VALUES, REQUESTED_TOPIC_VALUES };
export type { RelationshipValue, RequestedTopic };

export const PREPAYMENT_SAFETY_INPUT_SCHEMA_VERSION =
  "prepayment-safety-input-v1" as const;
export const PREPAYMENT_SAFETY_RESULT_SCHEMA_VERSION =
  "prepayment-safety-result-v1" as const;
export const PREPAYMENT_SAFETY_POLICY_VERSION =
  "prepayment-safety-policy-v1" as const;

export const CONTACT_BOUNDARY_STATES = [
  "no_restriction_known",
  "temporary_pause",
  "explicit_no_contact",
  "channel_restricted",
  "relationship_closed",
  "business_only",
  "new_inbound_after_boundary",
  "unknown",
  "urgent_safety",
] as const;

export type ContactBoundaryStateV1 = (typeof CONTACT_BOUNDARY_STATES)[number];

export const REQUESTED_ASSISTANCE_GOALS = [
  "understand_and_organize",
  "decide_send_wait_or_pause",
  "draft_within_current_permission",
  "recontact_or_overcome_boundary",
  "alternate_channel_or_third_party",
  "monitor_track_or_manipulate",
  "professional_judgment",
  "urgent_safety_help",
] as const;

export type RequestedAssistanceGoalV1 =
  (typeof REQUESTED_ASSISTANCE_GOALS)[number];

export const SAFETY_DISPOSITIONS = [
  "eligible",
  "needs_clarification",
  "blocked_unsafe_assistance",
  "urgent_safety_redirect",
  "unsupported_professional_request",
] as const;

export type SafetyDispositionV1 = (typeof SAFETY_DISPOSITIONS)[number];

export const ELIGIBLE_DELIVERY_SCOPES = [
  "general",
  "pause_assessment",
  "boundary_support_only",
  "scoped_reply",
  "business_only",
] as const;

export type EligibleDeliveryScopeV1 =
  (typeof ELIGIBLE_DELIVERY_SCOPES)[number];

export const PREPAYMENT_SAFETY_CLASSIFICATIONS = [
  "eligible_general",
  "eligible_pause_assessment",
  "eligible_boundary_support_only",
  "eligible_scoped_reply",
  "eligible_business_only",
  "needs_clarification",
  "blocked_unsafe_assistance",
  "urgent_safety_redirect",
  "unsupported_professional_request",
] as const;

export type PrepaymentSafetyClassificationV1 =
  (typeof PREPAYMENT_SAFETY_CLASSIFICATIONS)[number];

export const ELIGIBLE_PREPAYMENT_CLASSIFICATIONS = [
  "eligible_general",
  "eligible_pause_assessment",
  "eligible_boundary_support_only",
  "eligible_scoped_reply",
  "eligible_business_only",
] as const;

export type EligiblePrepaymentClassificationV1 =
  (typeof ELIGIBLE_PREPAYMENT_CLASSIFICATIONS)[number];

export const TRI_STATE_ANSWERS = ["yes", "no", "unknown"] as const;
export type TriStateAnswerV1 = (typeof TRI_STATE_ANSWERS)[number];

export const CLARIFIED_CONTACT_BOUNDARY_STATES = [
  "no_restriction_known",
  "temporary_pause",
  "explicit_no_contact",
  "channel_restricted",
  "relationship_closed",
  "business_only",
  "new_inbound_after_boundary",
  "urgent_safety",
] as const;

export const UNSAFE_EXECUTION_INTENT_ANSWERS = [
  "execution_requested",
  "stopping_or_avoiding",
  "still_unclear",
] as const;

export type UnsafeExecutionIntentAnswerV1 =
  (typeof UNSAFE_EXECUTION_INTENT_ANSWERS)[number];

export const CURRENT_SAFETY_STATUS_ANSWERS = [
  "current_urgent",
  "not_current",
  "still_unclear",
] as const;

export type CurrentSafetyStatusAnswerV1 =
  (typeof CURRENT_SAFETY_STATUS_ANSWERS)[number];

export const CLARIFICATION_ANSWER_KEYS = [
  "submissionCount",
  "clarifiedContactBoundaryState",
  "practicalPermissionExplicit",
  "currentRequestPracticalScopeOnly",
  "replyExplicitlyInvited",
  "replyLimitedToExactSubject",
  "professionalScopeLimitedToNonprofessionalOrganization",
  "unsafeExecutionIntent",
  "currentSafetyStatus",
] as const;

export type ClarificationAnswersV1 = Readonly<{
  submissionCount: 0 | 1;
  clarifiedContactBoundaryState:
    | (typeof CLARIFIED_CONTACT_BOUNDARY_STATES)[number]
    | null;
  practicalPermissionExplicit: TriStateAnswerV1 | null;
  currentRequestPracticalScopeOnly: TriStateAnswerV1 | null;
  replyExplicitlyInvited: TriStateAnswerV1 | null;
  replyLimitedToExactSubject: TriStateAnswerV1 | null;
  professionalScopeLimitedToNonprofessionalOrganization:
    | TriStateAnswerV1
    | null;
  unsafeExecutionIntent: UnsafeExecutionIntentAnswerV1 | null;
  currentSafetyStatus: CurrentSafetyStatusAnswerV1 | null;
}>;

export const SCOPE_ACKNOWLEDGEMENT_KEYS = [
  "pauseAssessmentDisclosureAcknowledged",
  "boundarySupportOnlyDisclosureAcknowledged",
  "scopedReplyScopeAcknowledged",
  "businessOnlyScopeAcknowledged",
] as const;

export type ScopeAcknowledgementsV1 = Readonly<{
  pauseAssessmentDisclosureAcknowledged: boolean;
  boundarySupportOnlyDisclosureAcknowledged: boolean;
  scopedReplyScopeAcknowledged: boolean;
  businessOnlyScopeAcknowledged: boolean;
}>;

export type PrepaymentSafetyInputV1 = Readonly<{
  schemaVersion: typeof PREPAYMENT_SAFETY_INPUT_SCHEMA_VERSION;
  adultConfirmed: boolean;
  currentSituation: string;
  optionalMessage: string | null;
  relationship: RelationshipValue;
  requestedTopics: readonly RequestedTopic[];
  contactBoundaryState: ContactBoundaryStateV1;
  requestedAssistanceGoal: RequestedAssistanceGoalV1;
  clarificationAnswers: ClarificationAnswersV1;
  scopeAcknowledgements: ScopeAcknowledgementsV1;
  attestationConfirmed: boolean;
  safetyPolicyVersion: typeof PREPAYMENT_SAFETY_POLICY_VERSION;
}>;

export const ACKNOWLEDGEMENT_CODES = [
  "adult_confirmed",
  "attestation_confirmed",
  "pause_assessment_disclosure_acknowledged",
  "boundary_support_only_disclosure_acknowledged",
  "scoped_reply_scope_acknowledged",
  "business_only_scope_acknowledged",
] as const;

export type AcknowledgementCodeV1 = (typeof ACKNOWLEDGEMENT_CODES)[number];

export const CLARIFICATION_CODES = [
  "boundary_state_required",
  "unsafe_execution_intent_required",
  "current_safety_status_required",
  "business_permission_required",
  "business_scope_required",
  "reply_invitation_required",
  "reply_scope_required",
  "professional_scope_required",
  "structured_content_conflict",
] as const;

export type ClarificationCodeV1 = (typeof CLARIFICATION_CODES)[number];

export const REASON_CODES = [
  "current_urgent_safety",
  "unsafe_assistance_requested",
  "professional_judgment_requested",
  "material_scope_uncertainty",
  "eligible_general_scope",
  "temporary_pause_respected",
  "explicit_boundary_respected",
  "new_inbound_scope_limited",
  "business_scope_limited",
  "historical_or_stopping_context",
  "purchase_acknowledgement_incomplete",
] as const;

export type PrepaymentSafetyReasonCodeV1 = (typeof REASON_CODES)[number];

export const OUTPUT_KINDS = [
  "individualized_assessment_note",
  "decision_direction",
  "message_draft_when_supported",
  "full_no_draft_assessment",
  "boundary_respecting_assessment_note",
  "scoped_reply_draft",
  "business_only_draft",
  "immediate_self_directed_action",
  "observable_reassessment_condition",
  "calm_closure",
  "bounded_structured_clarification",
  "static_refusal_copy",
  "brief_boundary_respecting_redirection",
  "static_urgent_copy",
  "general_safety_resource_guidance",
  "static_scope_explanation",
  "nonprofessional_scope_clarification_option",
  "payment_not_charged_statement",
  "relationship_strategy",
  "draft",
  "report",
  "customer_projection",
  "provider_generated_assessment",
  "unsafe_method",
  "workaround",
  "optimization_advice",
  "professional_advice",
  "professional_document",
  "recontact_plan",
  "time_only_contact_plan",
  "alternate_channel_contact",
  "third_party_contact",
  "hidden_state_certainty",
  "reconciliation_guarantee",
  "private_or_romantic_content",
] as const;

export type PrepaymentSafetyOutputKindV1 = (typeof OUTPUT_KINDS)[number];

export type PrepaymentSafetyClassificationDecisionV1 = Readonly<{
  classification: PrepaymentSafetyClassificationV1;
  safetyDisposition: SafetyDispositionV1;
  deliveryScope: EligibleDeliveryScopeV1 | null;
  reasonCodes: readonly PrepaymentSafetyReasonCodeV1[];
  requiredClarificationCodes: readonly ClarificationCodeV1[];
  allowedOutputKinds: readonly PrepaymentSafetyOutputKindV1[];
  forbiddenOutputKinds: readonly PrepaymentSafetyOutputKindV1[];
}>;

export type PrepaymentSafetyResultV1 = Readonly<{
  schemaVersion: typeof PREPAYMENT_SAFETY_RESULT_SCHEMA_VERSION;
  policyVersion: typeof PREPAYMENT_SAFETY_POLICY_VERSION;
  classification: PrepaymentSafetyClassificationV1;
  safetyDisposition: SafetyDispositionV1;
  deliveryScope: EligibleDeliveryScopeV1 | null;
  reasonCodes: readonly PrepaymentSafetyReasonCodeV1[];
  requiredClarificationCodes: readonly ClarificationCodeV1[];
  requiredAcknowledgementCodes: readonly AcknowledgementCodeV1[];
  allowedOutputKinds: readonly PrepaymentSafetyOutputKindV1[];
  forbiddenOutputKinds: readonly PrepaymentSafetyOutputKindV1[];
  purchaseGateSatisfied: boolean;
  eligibilityInputHash: string;
  paymentImplementationPresent: false;
  paymentSessionAvailable: false;
  paymentAuthorityIssued: false;
}>;

export class PrepaymentSafetyValidationError extends Error {
  readonly safeCode:
    | "PREPAYMENT_INVALID_REQUEST"
    | "PREPAYMENT_POLICY_VERSION_UNSUPPORTED";

  constructor(
    safeCode:
      | "PREPAYMENT_INVALID_REQUEST"
      | "PREPAYMENT_POLICY_VERSION_UNSUPPORTED",
  ) {
    super(safeCode);
    this.name = "PrepaymentSafetyValidationError";
    this.safeCode = safeCode;
  }
}

const TOP_LEVEL_KEYS = [
  "schemaVersion",
  "adultConfirmed",
  "currentSituation",
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

function invalid(): never {
  throw new PrepaymentSafetyValidationError("PREPAYMENT_INVALID_REQUEST");
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  record: Readonly<Record<string, unknown>>,
  allowedKeys: readonly string[],
) {
  const actualKeys = Object.keys(record);
  return (
    actualKeys.length === allowedKeys.length &&
    actualKeys.every((key) => allowedKeys.includes(key))
  );
}

function readBoolean(value: unknown) {
  if (typeof value !== "boolean") invalid();
  return value;
}

function readEnum<const TValues extends readonly string[]>(
  value: unknown,
  allowedValues: TValues,
): TValues[number] {
  if (typeof value !== "string") invalid();
  const match = allowedValues.find((allowed) => allowed === value);
  if (match === undefined) invalid();
  return match;
}

function readNullableEnum<const TValues extends readonly string[]>(
  value: unknown,
  allowedValues: TValues,
): TValues[number] | null {
  if (value === null) return null;
  return readEnum(value, allowedValues);
}

function readTrimmedString(
  value: unknown,
  minimumCodePoints: number,
  maximumCodePoints: number,
) {
  if (typeof value !== "string") invalid();
  const trimmed = value.trim();
  const length = [...trimmed].length;
  if (length < minimumCodePoints || length > maximumCodePoints) invalid();
  return trimmed;
}

function decodeRequestedTopics(value: unknown): readonly RequestedTopic[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) invalid();
  const decoded: RequestedTopic[] = [];
  for (const candidate of value) {
    decoded.push(readEnum(candidate, REQUESTED_TOPIC_VALUES));
  }
  if (new Set(decoded).size !== decoded.length) invalid();
  return Object.freeze(decoded);
}

function decodeClarificationAnswers(value: unknown): ClarificationAnswersV1 {
  if (!isUnknownRecord(value) || !hasExactKeys(value, CLARIFICATION_ANSWER_KEYS)) {
    invalid();
  }
  if (value.submissionCount !== 0 && value.submissionCount !== 1) invalid();

  const decoded: ClarificationAnswersV1 = {
    submissionCount: value.submissionCount,
    clarifiedContactBoundaryState: readNullableEnum(
      value.clarifiedContactBoundaryState,
      CLARIFIED_CONTACT_BOUNDARY_STATES,
    ),
    practicalPermissionExplicit: readNullableEnum(
      value.practicalPermissionExplicit,
      TRI_STATE_ANSWERS,
    ),
    currentRequestPracticalScopeOnly: readNullableEnum(
      value.currentRequestPracticalScopeOnly,
      TRI_STATE_ANSWERS,
    ),
    replyExplicitlyInvited: readNullableEnum(
      value.replyExplicitlyInvited,
      TRI_STATE_ANSWERS,
    ),
    replyLimitedToExactSubject: readNullableEnum(
      value.replyLimitedToExactSubject,
      TRI_STATE_ANSWERS,
    ),
    professionalScopeLimitedToNonprofessionalOrganization: readNullableEnum(
      value.professionalScopeLimitedToNonprofessionalOrganization,
      TRI_STATE_ANSWERS,
    ),
    unsafeExecutionIntent: readNullableEnum(
      value.unsafeExecutionIntent,
      UNSAFE_EXECUTION_INTENT_ANSWERS,
    ),
    currentSafetyStatus: readNullableEnum(
      value.currentSafetyStatus,
      CURRENT_SAFETY_STATUS_ANSWERS,
    ),
  };

  const hasAnswer = Object.entries(decoded).some(
    ([key, answer]) => key !== "submissionCount" && answer !== null,
  );
  if (
    (decoded.submissionCount === 0 && hasAnswer) ||
    (decoded.submissionCount === 1 && !hasAnswer)
  ) {
    invalid();
  }
  return Object.freeze(decoded);
}

function decodeScopeAcknowledgements(
  value: unknown,
): ScopeAcknowledgementsV1 {
  if (
    !isUnknownRecord(value) ||
    !hasExactKeys(value, SCOPE_ACKNOWLEDGEMENT_KEYS)
  ) {
    invalid();
  }
  return Object.freeze({
    pauseAssessmentDisclosureAcknowledged: readBoolean(
      value.pauseAssessmentDisclosureAcknowledged,
    ),
    boundarySupportOnlyDisclosureAcknowledged: readBoolean(
      value.boundarySupportOnlyDisclosureAcknowledged,
    ),
    scopedReplyScopeAcknowledged: readBoolean(
      value.scopedReplyScopeAcknowledged,
    ),
    businessOnlyScopeAcknowledged: readBoolean(
      value.businessOnlyScopeAcknowledged,
    ),
  });
}

export function decodePrepaymentSafetyInputV1(
  value: unknown,
): PrepaymentSafetyInputV1 {
  if (!isUnknownRecord(value) || !hasExactKeys(value, TOP_LEVEL_KEYS)) invalid();
  if (value.schemaVersion !== PREPAYMENT_SAFETY_INPUT_SCHEMA_VERSION) invalid();
  if (value.safetyPolicyVersion !== PREPAYMENT_SAFETY_POLICY_VERSION) {
    throw new PrepaymentSafetyValidationError(
      "PREPAYMENT_POLICY_VERSION_UNSUPPORTED",
    );
  }

  const optionalMessage =
    value.optionalMessage === null
      ? null
      : readTrimmedString(value.optionalMessage, 1, 2_000);

  return Object.freeze({
    schemaVersion: PREPAYMENT_SAFETY_INPUT_SCHEMA_VERSION,
    adultConfirmed: readBoolean(value.adultConfirmed),
    currentSituation: readTrimmedString(value.currentSituation, 1, 5_000),
    optionalMessage,
    relationship: readEnum(value.relationship, RELATIONSHIP_VALUES),
    requestedTopics: decodeRequestedTopics(value.requestedTopics),
    contactBoundaryState: readEnum(
      value.contactBoundaryState,
      CONTACT_BOUNDARY_STATES,
    ),
    requestedAssistanceGoal: readEnum(
      value.requestedAssistanceGoal,
      REQUESTED_ASSISTANCE_GOALS,
    ),
    clarificationAnswers: decodeClarificationAnswers(
      value.clarificationAnswers,
    ),
    scopeAcknowledgements: decodeScopeAcknowledgements(
      value.scopeAcknowledgements,
    ),
    attestationConfirmed: readBoolean(value.attestationConfirmed),
    safetyPolicyVersion: PREPAYMENT_SAFETY_POLICY_VERSION,
  });
}
