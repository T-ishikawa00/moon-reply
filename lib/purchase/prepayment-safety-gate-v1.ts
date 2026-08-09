import { createPrepaymentSafetyIdentityV1 } from "./prepayment-safety-identity-v1.ts";
import { classifyPrepaymentSafetyV1 } from "./prepayment-safety-rules-v1.ts";
import {
  PREPAYMENT_SAFETY_RESULT_SCHEMA_VERSION,
  decodePrepaymentSafetyInputV1,
  type AcknowledgementCodeV1,
  type PrepaymentSafetyClassificationV1,
  type PrepaymentSafetyInputV1,
  type PrepaymentSafetyResultV1,
} from "./prepayment-safety-types-v1.ts";

function requiredAcknowledgements(
  classification: PrepaymentSafetyClassificationV1,
): readonly AcknowledgementCodeV1[] {
  switch (classification) {
    case "eligible_general":
      return Object.freeze(["adult_confirmed", "attestation_confirmed"]);
    case "eligible_pause_assessment":
      return Object.freeze([
        "adult_confirmed",
        "pause_assessment_disclosure_acknowledged",
        "attestation_confirmed",
      ]);
    case "eligible_boundary_support_only":
      return Object.freeze([
        "adult_confirmed",
        "boundary_support_only_disclosure_acknowledged",
        "attestation_confirmed",
      ]);
    case "eligible_scoped_reply":
      return Object.freeze([
        "adult_confirmed",
        "scoped_reply_scope_acknowledged",
        "attestation_confirmed",
      ]);
    case "eligible_business_only":
      return Object.freeze([
        "adult_confirmed",
        "business_only_scope_acknowledged",
        "attestation_confirmed",
      ]);
    default:
      return Object.freeze([]);
  }
}

function acknowledgementSatisfied(
  input: PrepaymentSafetyInputV1,
  code: AcknowledgementCodeV1,
) {
  switch (code) {
    case "adult_confirmed":
      return input.adultConfirmed;
    case "attestation_confirmed":
      return input.attestationConfirmed;
    case "pause_assessment_disclosure_acknowledged":
      return input.scopeAcknowledgements.pauseAssessmentDisclosureAcknowledged;
    case "boundary_support_only_disclosure_acknowledged":
      return input.scopeAcknowledgements
        .boundarySupportOnlyDisclosureAcknowledged;
    case "scoped_reply_scope_acknowledged":
      return input.scopeAcknowledgements.scopedReplyScopeAcknowledged;
    case "business_only_scope_acknowledged":
      return input.scopeAcknowledgements.businessOnlyScopeAcknowledged;
  }
}

export function evaluatePrepaymentSafetyV1(
  value: unknown,
): PrepaymentSafetyResultV1 {
  const input = decodePrepaymentSafetyInputV1(value);
  const classification = classifyPrepaymentSafetyV1(input);
  const requiredAcknowledgementCodes = requiredAcknowledgements(
    classification.classification,
  );
  const purchaseGateSatisfied =
    requiredAcknowledgementCodes.length > 0 &&
    requiredAcknowledgementCodes.every((code) =>
      acknowledgementSatisfied(input, code),
    );
  const reasonCodes = purchaseGateSatisfied
    ? classification.reasonCodes
    : requiredAcknowledgementCodes.length > 0
      ? Object.freeze([
          ...classification.reasonCodes,
          "purchase_acknowledgement_incomplete" as const,
        ])
      : classification.reasonCodes;

  const overlap = classification.allowedOutputKinds.filter((kind) =>
    classification.forbiddenOutputKinds.includes(kind),
  );
  if (overlap.length > 0) {
    throw new Error("PREPAYMENT_OUTPUT_CONTRACT_OVERLAP");
  }

  return Object.freeze({
    schemaVersion: PREPAYMENT_SAFETY_RESULT_SCHEMA_VERSION,
    policyVersion: input.safetyPolicyVersion,
    classification: classification.classification,
    safetyDisposition: classification.safetyDisposition,
    deliveryScope: classification.deliveryScope,
    reasonCodes,
    requiredClarificationCodes: classification.requiredClarificationCodes,
    requiredAcknowledgementCodes,
    allowedOutputKinds: classification.allowedOutputKinds,
    forbiddenOutputKinds: classification.forbiddenOutputKinds,
    purchaseGateSatisfied,
    eligibilityInputHash: createPrepaymentSafetyIdentityV1(input),
    paymentImplementationPresent: false,
    paymentSessionAvailable: false,
    paymentAuthorityIssued: false,
  });
}
