import type {
  DecisionFactsV1,
  JsonObject,
  RequestedTopic,
} from "./types.ts";

export const CONTEXTUAL_DECISION_FIELD_PATHS = [
  "relationship_stage",
  "latest_direct_message.sender",
  "latest_direct_message.kind",
  "latest_direct_message.response_expectation",
  "latest_direct_message.user_reply_state",
  "latest_direct_message.sns_signal_only",
  "contact_state.unanswered_user_message_count",
  "contact_state.elapsed_since_latest_user_message_minutes",
  "contact_state.usual_cadence_relation",
  "contact_state.proposed_message_present",
  "boundary_state.kind",
  "boundary_state.status",
  "boundary_state.repeated_unanswered_contact",
  "practical_reason.kind",
  "practical_reason.active",
  "practical_reason.deadline",
] as const;

export type ContextualDecisionFieldPath =
  (typeof CONTEXTUAL_DECISION_FIELD_PATHS)[number];

export type ContextInferenceV3 = {
  inference_id: string;
  field_path: ContextualDecisionFieldPath;
  supporting_fact_ids: string[];
  source_refs: string[];
  rationale_summary: string;
};

export type DecisionFactsV2 = Omit<
  DecisionFactsV1,
  "schema_version" | "selected_requests" | "information_state"
> & {
  schema_version: "m2-p4-decision-facts-v2";
  selected_requests: RequestedTopic[];
  information_state: {
    assessment_mode: "best_effort";
    can_proceed_without_followup: true;
    used_context_inference: boolean;
    unresolved_fields: ContextualDecisionFieldPath[];
  };
};

export type StructuredIntakeV3 = JsonObject & {
  schema_version: "pipeline-schema-v3.0.0";
  context_inferences: ContextInferenceV3[];
  decision_facts: DecisionFactsV2;
};

const contextualDecisionFieldPathSet = new Set<string>(
  CONTEXTUAL_DECISION_FIELD_PATHS,
);

export function isContextualDecisionFieldPath(
  value: unknown,
): value is ContextualDecisionFieldPath {
  return (
    typeof value === "string" && contextualDecisionFieldPathSet.has(value)
  );
}
