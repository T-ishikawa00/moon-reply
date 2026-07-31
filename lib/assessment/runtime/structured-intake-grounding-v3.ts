import type {
  ContextInferenceV3,
  DecisionFactsV2,
} from "./contextual-inference-v3.ts";
import type { AssessmentInput, JsonObject } from "./types.ts";

type ObservedFactEvidence = {
  fact_id: string;
  source_refs: string[];
};

type GroundableStructuredIntakeV3 = {
  relationship_stage: string;
  observed_facts: ObservedFactEvidence[];
  context_inferences: ContextInferenceV3[];
  decision_facts: DecisionFactsV2;
};

const applicationOwnedFieldPaths = new Set([
  "relationship_stage",
  "contact_state.proposed_message_present",
]);

function sortedUnique(values: string[]) {
  return [...new Set(values)].sort();
}

export function groundStructuredIntakeV3(
  request: AssessmentInput,
  rawStructuredIntake: JsonObject,
): JsonObject {
  const grounded = structuredClone(
    rawStructuredIntake,
  ) as unknown as GroundableStructuredIntakeV3;
  const decisionFacts = grounded.decision_facts;

  grounded.relationship_stage = request.relationship;
  decisionFacts.relationship_stage = request.relationship;
  decisionFacts.selected_requests = [...request.requestedTopics];
  decisionFacts.contact_state.proposed_message_present =
    request.optionalMessage !== null && request.optionalMessage.trim().length > 0;

  grounded.context_inferences = grounded.context_inferences.filter(
    (inference) => !applicationOwnedFieldPaths.has(inference.field_path),
  );
  decisionFacts.information_state.unresolved_fields =
    decisionFacts.information_state.unresolved_fields.filter(
      (fieldPath) => !applicationOwnedFieldPaths.has(fieldPath),
    );

  const factsById = new Map(
    grounded.observed_facts.map((fact) => [fact.fact_id, fact]),
  );
  for (const inference of grounded.context_inferences) {
    const supportingFacts = inference.supporting_fact_ids
      .map((factId) => factsById.get(factId))
      .filter((fact): fact is ObservedFactEvidence => fact !== undefined);
    const canonicalSourceRefs = sortedUnique(
      supportingFacts.flatMap((fact) => fact.source_refs),
    );

    // Preserve Schema-valid raw refs when every cited fact is missing so the
    // existing Integrity validator, rather than Schema validation, rejects it.
    if (canonicalSourceRefs.length > 0) {
      inference.source_refs = canonicalSourceRefs;
    }
  }

  decisionFacts.information_state.used_context_inference =
    grounded.context_inferences.length > 0;

  return grounded as unknown as JsonObject;
}
