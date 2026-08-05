import { M2RuntimeError } from "./errors.ts";
import type {
  ActionContextV1,
  ContactConstraintPolicyV1,
  JsonObject,
  SplitDecisionPlanV2,
} from "./types.ts";

export const DECISION_PLAN_CONSTRAINT_INTEGRITY_V1_VERSION =
  "m2-p4-decision-plan-constraint-integrity-v1" as const;

export const DECISION_PLAN_V2_CONSTRAINT_LIMITATIONS = Object.freeze([
  Object.freeze({
    json_path: "$.actions_to_take[*]",
    limitation:
      "Decision Plan v2 has no structured outbound-contact action kind; Production validation does not inspect action prose.",
  }),
  Object.freeze({
    json_path: "$.aftercare_plan[*].action",
    limitation:
      "Decision Plan v2 has no structured aftercare action kind; Production validation does not inspect aftercare prose.",
  }),
  Object.freeze({
    json_path: "$.change_conditions[*].condition",
    limitation:
      "Decision Plan v2 has no structured trigger taxonomy; Production validation rejects outbound resulting directions but does not classify condition prose.",
  }),
  Object.freeze({
    json_path: "$.review_timing.when",
    limitation:
      "Decision Plan v2 has no structured reassessment trigger kind; Production validation does not inspect timing prose.",
  }),
  Object.freeze({
    json_path:
      "$.message_draft_edit_metadata.communicative_intent_delta",
    limitation:
      "Decision Plan v2 cannot fully distinguish a personal invitation from business schedule coordination when the Provider metadata records an invitation change without an affection or commitment increase.",
  }),
]);

function invalid(): never {
  throw new M2RuntimeError("M2_PLAN_CONSTRAINT_INTEGRITY_FAILED");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateAuthorityShape(
  contactPolicy: ContactConstraintPolicyV1,
  actionContext: ActionContextV1,
) {
  if (
    contactPolicy.schema_version !==
      "m2-p4-contact-constraint-policy-v1" ||
    actionContext.schema_version !== "m2-p4-action-context-v1" ||
    actionContext.authority !== "application" ||
    actionContext.action_horizon.code !== "current_local_day_remaining" ||
    actionContext.action_horizon.user_facing_label_ja !== "今夜" ||
    Date.parse(actionContext.action_horizon.starts_at) !==
      Date.parse(actionContext.trusted_now_iso) ||
    Date.parse(actionContext.action_horizon.ends_at) <=
      Date.parse(actionContext.action_horizon.starts_at)
  ) {
    invalid();
  }
}

function hasPersonalInvitationEscalation(plan: SplitDecisionPlanV2) {
  const delta = plan.message_draft_edit_metadata
    ?.communicative_intent_delta as JsonObject | undefined;
  if (!isObject(delta)) return false;
  const invitationEscalated =
    delta.invitation_presence_delta === "added" ||
    delta.invitation_specificity_delta === "increased";
  const personalTemperatureEscalated =
    delta.affection_strength_delta === "increased" ||
    delta.commitment_strength_delta === "increased";
  return invitationEscalated && personalTemperatureEscalated;
}

export function validateDecisionPlanConstraintIntegrityV1({
  decisionPlan,
  contactConstraintPolicy,
  actionContext,
}: {
  decisionPlan: SplitDecisionPlanV2;
  contactConstraintPolicy: ContactConstraintPolicyV1;
  actionContext: ActionContextV1;
}) {
  validateAuthorityShape(contactConstraintPolicy, actionContext);
  const explicitNoFollowup =
    contactConstraintPolicy.constraint_kind === "no_followup_message" &&
    contactConstraintPolicy.constraint_status === "explicit";
  const unknownConstraint =
    contactConstraintPolicy.constraint_kind === "unknown" &&
    contactConstraintPolicy.constraint_status === "unknown";

  if (
    unknownConstraint &&
    (contactConstraintPolicy.outbound_contact_now_allowed ||
      contactConstraintPolicy.outbound_contact_after_time_passage_allowed ||
      !contactConstraintPolicy.exception_required_for_future_contact ||
      decisionPlan.selected_decision === "reply_now" ||
      decisionPlan.selected_decision === "send_now" ||
      decisionPlan.recommended_message_draft !== null ||
      decisionPlan.message_draft_edit_metadata !== null ||
      decisionPlan.change_conditions.some(
        ({ resulting_direction: direction }) =>
          direction === "reply_now" || direction === "send_now",
      ))
  ) {
    invalid();
  }

  if (explicitNoFollowup) {
    if (
      contactConstraintPolicy.outbound_contact_after_time_passage_allowed ||
      !contactConstraintPolicy.exception_required_for_future_contact
    ) {
      invalid();
    }
    if (contactConstraintPolicy.follow_up_exception === "none") {
      if (
        contactConstraintPolicy.outbound_contact_now_allowed ||
        decisionPlan.selected_decision === "reply_now" ||
        decisionPlan.selected_decision === "send_now" ||
        decisionPlan.recommended_message_draft !== null ||
        decisionPlan.message_draft_edit_metadata !== null ||
        decisionPlan.change_conditions.some(
          ({ resulting_direction: direction }) =>
            direction === "reply_now" || direction === "send_now",
        )
      ) {
        invalid();
      }
    } else if (!contactConstraintPolicy.outbound_contact_now_allowed) {
      invalid();
    }
  }

  if (
    contactConstraintPolicy.constraint_kind === "business_only" &&
    contactConstraintPolicy.constraint_status === "explicit" &&
    hasPersonalInvitationEscalation(decisionPlan)
  ) {
    invalid();
  }
}
