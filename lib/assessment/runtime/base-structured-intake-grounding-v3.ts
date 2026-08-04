import { groundBaseStructuredIntakeV2 } from "./base-structured-intake-grounding-v2.ts";
import type { BaseProviderInputV1 } from "./contracts/split-stage-contracts-v1.ts";
import { M2RuntimeError } from "./errors.ts";
import type { JsonObject, UserContactConstraintV1 } from "./types.ts";

export const BASE_STRUCTURED_INTAKE_GROUNDING_V3_VERSION =
  "m2-p4-base-structured-intake-grounding-v3" as const;

function invalid(): never {
  throw new M2RuntimeError("M2_BASE_SOURCE_INTEGRITY_FAILED");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function explicitConstraintKinds(baseStructuredIntake: Record<string, unknown>) {
  const writingSignals = baseStructuredIntake.base_writing_signals;
  if (!isObject(writingSignals)) invalid();
  const constraints = writingSignals.explicit_user_constraints;
  if (!Array.isArray(constraints)) invalid();
  return new Set(
    constraints.flatMap((constraint) =>
      isObject(constraint) && typeof constraint.kind === "string"
        ? [constraint.kind]
        : [],
    ),
  );
}

function validateUserContactConstraint(
  baseStructuredIntake: Record<string, unknown>,
  value: unknown,
): UserContactConstraintV1 {
  if (
    !isObject(value) ||
    !Array.isArray(value.supporting_fact_ids) ||
    value.supporting_fact_ids.some(
      (factId) => typeof factId !== "string" || !/^F[0-9]{3}$/u.test(factId),
    ) ||
    new Set(value.supporting_fact_ids).size !==
      value.supporting_fact_ids.length
  ) {
    invalid();
  }
  const supportingFactIds = value.supporting_fact_ids as string[];
  const legal =
    (value.kind === "none" &&
      value.status === "none" &&
      supportingFactIds.length === 0) ||
    (value.kind === "unknown" &&
      value.status === "unknown" &&
      supportingFactIds.length === 0) ||
    ((value.kind === "no_followup_message" ||
      value.kind === "business_only") &&
      value.status === "explicit" &&
      supportingFactIds.length > 0);
  if (!legal) invalid();

  if (value.status === "explicit") {
    const observedFacts = baseStructuredIntake.observed_facts;
    if (!Array.isArray(observedFacts)) invalid();
    const facts = new Map(
      observedFacts.flatMap((fact) =>
        isObject(fact) && typeof fact.fact_id === "string"
          ? [[fact.fact_id, fact] as const]
          : [],
      ),
    );
    for (const factId of supportingFactIds) {
      const fact = facts.get(factId);
      if (
        !fact ||
        fact.support !== "explicit" ||
        !Array.isArray(fact.source_refs) ||
        !fact.source_refs.includes("input:current_situation")
      ) {
        invalid();
      }
    }
    const signalKinds = explicitConstraintKinds(baseStructuredIntake);
    if (
      (value.kind === "no_followup_message" &&
        !signalKinds.has("no_followup_message")) ||
      (value.kind === "business_only" &&
        !signalKinds.has("no_private_contact_at_work"))
    ) {
      invalid();
    }
  }

  return {
    kind: value.kind as UserContactConstraintV1["kind"],
    status: value.status as UserContactConstraintV1["status"],
    supporting_fact_ids: [...supportingFactIds],
  };
}

export function groundBaseStructuredIntakeV3(
  input: BaseProviderInputV1,
  rawBaseStructuredIntake: JsonObject,
): JsonObject {
  const grounded = groundBaseStructuredIntakeV2(
    input,
    rawBaseStructuredIntake,
  ) as unknown as Record<string, unknown>;
  if (grounded.schema_version !== "pipeline-schema-base-v2.0.0") invalid();
  const decisionFacts = grounded.decision_facts;
  if (
    !isObject(decisionFacts) ||
    decisionFacts.schema_version !== "m2-p4-base-decision-facts-v2"
  ) {
    invalid();
  }
  decisionFacts.user_contact_constraint = validateUserContactConstraint(
    grounded,
    decisionFacts.user_contact_constraint,
  );
  return grounded as JsonObject;
}
