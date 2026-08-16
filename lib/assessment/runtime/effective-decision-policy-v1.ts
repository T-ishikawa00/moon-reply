import { M2RuntimeError } from "./errors.ts";
import {
  buildContextualDecisionPolicyV3,
  requireContextualDecisionFactsV3,
} from "./policy-v3.ts";
import type { CandidateEnvelopeV1 } from "./contracts/split-stage-contracts-v1.ts";
import type { EffectiveAssessmentAuthorityV1 } from "./effective-assessment-authority-v1.ts";
import type { DecisionPolicyResultV2, JsonObject } from "./types.ts";

export const EFFECTIVE_DECISION_POLICY_V1_SCHEMA_VERSION =
  "m2-p4-effective-decision-policy-v1" as const;

export type EffectiveDecisionPolicyV1 = {
  schemaVersion: typeof EFFECTIVE_DECISION_POLICY_V1_SCHEMA_VERSION;
  policy: DecisionPolicyResultV2;
  effectiveDecisionFacts: JsonObject;
  consumedEffectivePaths: string[];
};

function invalid(): never {
  throw new M2RuntimeError("M2_EFFECTIVE_DECISION_POLICY_INVALID");
}
function asObject(value: unknown): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) invalid();
  return structuredClone(value as JsonObject);
}

function removeUnresolved(information: JsonObject, path: string) {
  if (!Array.isArray(information.unresolved_fields)) invalid();
  information.unresolved_fields = information.unresolved_fields.filter(
    (value) => value !== path,
  );
}

function exactDerivedElapsedMinutes(value: JsonObject) {
  if (
    value.kind !== "local_datetime" ||
    typeof value.derivedElapsedMinutes !== "number" ||
    !Number.isFinite(value.derivedElapsedMinutes) ||
    value.derivedElapsedMinutes < 0
  ) {
    return null;
  }
  return value.derivedElapsedMinutes;
}

export function buildEffectiveDecisionPolicyV1(input: {
  authority: EffectiveAssessmentAuthorityV1;
  candidateEnvelope: CandidateEnvelopeV1;
}): EffectiveDecisionPolicyV1 {
  const facts = asObject(input.authority.effectiveDecisionContext.decisionFacts);
  delete facts.user_contact_constraint;
  facts.schema_version = "m2-p4-decision-facts-v2";
  const contact = asObject(facts.contact_state);
  const information = asObject(facts.information_state);
  contact.proposed_message_present = input.candidateEnvelope.presence;
  const consumedEffectivePaths = ["effectiveDecisionContext.decisionFacts"];

  const timing = input.authority.effectiveDecisionContext.latestContactTiming;
  if (timing !== null) {
    const exactElapsedMinutes = exactDerivedElapsedMinutes(asObject(timing));
    if (exactElapsedMinutes !== null) {
      contact.elapsed_since_latest_user_message_minutes = exactElapsedMinutes;
      removeUnresolved(
        information,
        "contact_state.elapsed_since_latest_user_message_minutes",
      );
      consumedEffectivePaths.push("effectiveDecisionContext.latestContactTiming");
    }
  }
  const cadence = input.authority.effectiveDecisionContext.usualReplyCadence;
  if (cadence !== null) {
    const normalized = asObject(cadence);
    if (
      normalized.relation !== "within_usual" &&
      normalized.relation !== "beyond_usual"
    ) invalid();
    contact.usual_cadence_relation = normalized.relation;
    removeUnresolved(information, "contact_state.usual_cadence_relation");
    consumedEffectivePaths.push("effectiveDecisionContext.usualReplyCadence");
  }
  facts.contact_state = contact;
  facts.information_state = information;
  const decisionFacts = requireContextualDecisionFactsV3({ decision_facts: facts });
  const policy = buildContextualDecisionPolicyV3(decisionFacts);

  if (input.authority.effectiveDecisionContext.relationshipIntent !== null) {
    consumedEffectivePaths.push("effectiveDecisionContext.relationshipIntent");
  }
  if (input.authority.effectiveDecisionContext.materialConcern !== null) {
    consumedEffectivePaths.push("effectiveDecisionContext.materialConcern");
  }
  return {
    schemaVersion: EFFECTIVE_DECISION_POLICY_V1_SCHEMA_VERSION,
    policy,
    effectiveDecisionFacts: structuredClone(facts),
    consumedEffectivePaths,
  };
}

export function clarificationConsumptionPathsForStageV1(
  authority: EffectiveAssessmentAuthorityV1,
  stageId: "PB-04" | "PB-05" | "PB-06",
) {
  const paths = authority.sourceMap
    .filter((entry) => entry.sourceLane === "clarification")
    .map((entry) => entry.effectivePath);
  if (stageId === "PB-06") return paths;
  if (stageId === "PB-04") {
    return paths.filter(
      (path) =>
        path.startsWith("effectiveDecisionContext.") ||
        path.startsWith("effectiveWritingContext."),
    );
  }
  return paths.filter(
    (path) =>
      path.startsWith("effectiveEmotionalContext.") ||
      path.startsWith("effectiveWritingContext.") ||
      path.includes("materialConcern") ||
      path.includes("latestContactTiming") ||
      path.includes("usualReplyCadence"),
  );
}
