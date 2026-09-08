// L5 local successor keeps these L4 pure checks verbatim; historical executor stays immutable.
import {M2RuntimeError} from './errors.ts';
import {requireContextualDecisionFactsV3} from './policy-v3.ts';
import type {DecisionFactsV2} from './contextual-inference-v3.ts';
import type {CandidateEnvelopeV1} from './contracts/split-stage-contracts-v1.ts';
import type {JsonObject,SplitDecisionPlanV2,DecisionPolicyResultV2} from './types.ts';
export function projectSplitDecisionFacts(
  baseStructuredIntake: JsonObject,
  candidateEnvelope: CandidateEnvelopeV1,
): DecisionFactsV2 {
  const baseFacts = baseStructuredIntake.decision_facts;
  if (typeof baseFacts !== "object" || baseFacts === null || Array.isArray(baseFacts)) {
    throw new M2RuntimeError("M2_DECISION_FACTS_INCOMPLETE");
  }
  const projected = structuredClone(baseFacts) as JsonObject;
  delete projected.user_contact_constraint;
  projected.schema_version = "m2-p4-decision-facts-v2";
  const contactState = projected.contact_state;
  if (
    typeof contactState !== "object" ||
    contactState === null ||
    Array.isArray(contactState)
  ) {
    throw new M2RuntimeError("M2_DECISION_FACTS_INCOMPLETE");
  }
  contactState.proposed_message_present = candidateEnvelope.presence;
  return requireContextualDecisionFactsV3({ decision_facts: projected });
}

const degradedAllowedChangeReasons = new Set([
  "no_change_needed",
  "typo_correction",
  "naturalness",
  "reduce_over_explanation",
  "reduce_excessive_apology",
  "reduce_pressure",
  "respect_user_constraint",
  "respect_relationship_or_hierarchy",
  "safety_or_boundary",
]);

export function validateSplitDecisionPlan(
  plan: SplitDecisionPlanV2,
  policy: DecisionPolicyResultV2,
  candidateEnvelope: CandidateEnvelopeV1,
  options: { deferDraftSourceIntegrity?: boolean } = {},
) {
  if (
    !policy.allowed_decisions.includes(plan.selected_decision) ||
    policy.disallowed_decisions.some(
      ({ decision }) => decision === plan.selected_decision,
    )
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }

  const draft = plan.recommended_message_draft;
  const metadata = plan.message_draft_edit_metadata;
  if ((draft === null) !== (metadata === null)) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    policy.message_draft_policy === "required_now" &&
    (!draft || draft.policy !== "required_now" || draft.use_timing !== "now")
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    policy.message_draft_policy === "later_only" &&
    draft !== null &&
    (draft.policy !== "later_only" || draft.use_timing !== "later")
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    policy.message_draft_policy === "not_allowed" &&
    (draft !== null || metadata !== null)
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    (plan.selected_decision === "reply_now" ||
      plan.selected_decision === "send_now") &&
    (!draft || draft.policy !== "required_now" || draft.use_timing !== "now")
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    plan.selected_decision === "pause_additional_contact" &&
    (draft !== null || metadata !== null)
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    !options.deferDraftSourceIntegrity &&
    !candidateEnvelope.presence &&
    metadata !== null &&
    metadata.source_status !== "generated_without_candidate"
  ) {
    throw new M2RuntimeError("M2_CANDIDATE_SOURCE_INTEGRITY_FAILED");
  }
  if (
    !options.deferDraftSourceIntegrity &&
    candidateEnvelope.presence &&
    metadata?.source_status === "generated_without_candidate"
  ) {
    throw new M2RuntimeError("M2_CANDIDATE_SOURCE_INTEGRITY_FAILED");
  }

  if (
    candidateEnvelope.presence &&
    candidateEnvelope.analysis_status === "unavailable" &&
    metadata
  ) {
    if (
      metadata.preserved_meaning !== true ||
      metadata.style_delta.some(
        ({ change }) =>
          change !== "preserved" &&
          change !== "lightly_adjusted" &&
          change !== "unresolved",
      ) ||
      metadata.change_reasons.some(
        (reason) => !degradedAllowedChangeReasons.has(reason),
      )
    ) {
      throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
    }
    const intent = metadata.communicative_intent_delta;
    const forbiddenIntentDeltas = new Set(["increased", "added"]);
    if (
      Object.values(intent).some((value) =>
        typeof value === "string" ? forbiddenIntentDeltas.has(value) : false,
      ) ||
      (typeof intent.question_count_delta === "number" &&
        intent.question_count_delta > 0)
    ) {
      throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
    }
  }
}
