import { classifyGuidanceCommunicationPurposeV1 } from "./guidance-communication-purpose-v1.ts";
import type { Jpy980InputSufficiencyPolicyInputV3 } from "./jpy980-input-sufficiency-policy-v3.ts";
import {
  evaluateJpy980InputSufficiencyV4,
  type Jpy980InputSufficiencyResultV4,
} from "./jpy980-input-sufficiency-policy-v4.ts";

export const JPY980_INPUT_SUFFICIENCY_POLICY_V5_VERSION =
  "m2-p4-jpy980-input-sufficiency-policy-v5" as const;
export const JPY980_INPUT_SUFFICIENCY_RESULT_V5_SCHEMA_VERSION =
  "m2-p4-jpy980-input-sufficiency-result-v5" as const;

export type Jpy980InputSufficiencyResultV5 = Omit<
  Jpy980InputSufficiencyResultV4,
  "schemaVersion"
> & {
  schemaVersion: typeof JPY980_INPUT_SUFFICIENCY_RESULT_V5_SCHEMA_VERSION;
};

export function evaluateJpy980InputSufficiencyV5(
  input: Jpy980InputSufficiencyPolicyInputV3,
): Jpy980InputSufficiencyResultV5 {
  // V4 retains Safety, source integrity, Primary Product and the one-question budget.
  const predecessor = evaluateJpy980InputSufficiencyV4(input);
  const result: Jpy980InputSufficiencyResultV5 = {
    ...structuredClone(predecessor),
    schemaVersion: JPY980_INPUT_SUFFICIENCY_RESULT_V5_SCHEMA_VERSION,
  };
  if (
    predecessor.state === "safety_blocked" ||
    predecessor.state === "full_paid_ready_candidate" ||
    predecessor.missingMaterialDimensions.length !== 1 ||
    predecessor.missingMaterialDimensions[0] !== "usable_action_context"
  ) {
    return result;
  }
  const purpose = classifyGuidanceCommunicationPurposeV1(
    input.effectiveAssessmentAuthority,
  );
  if (purpose === null) return result;
  return {
    ...result,
    state: "full_paid_ready_candidate",
    reasonCodes: ["GROUNDED_INTERPERSONAL_ACTION_CONTEXT_PRESENT"],
    missingMaterialDimensions: [],
    clarification: null,
  };
}
