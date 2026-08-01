import { canonicalizeContextInferencesV5 } from "./context-inference-canonicalization-v5.ts";
import { guardDecisionFactsWithEvidenceV4 } from "./decision-facts-evidence-guard-v4.ts";
import { groundStructuredIntakeV3 } from "./structured-intake-grounding-v3.ts";
import type { AssessmentInput, JsonObject } from "./types.ts";
import { groundWritingSignalsV1 } from "./writing-signals-grounding-v1.ts";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalSignalsForObservedFacts(
  rawSignals: JsonObject,
  observedFacts: unknown,
) {
  const signals = structuredClone(rawSignals) as unknown as Record<
    string,
    unknown
  >;
  const factIds = new Set(
    (Array.isArray(observedFacts) ? observedFacts : []).flatMap((fact) =>
      isObject(fact) && typeof fact.fact_id === "string" ? [fact.fact_id] : [],
    ),
  );
  const repeat = signals.repeat_consultation_state;
  if (!isObject(repeat)) return signals as JsonObject;
  const changed = Array.isArray(repeat.changed_fact_ids)
    ? repeat.changed_fact_ids.filter(
        (factId): factId is string =>
          typeof factId === "string" && factIds.has(factId),
      )
    : [];
  const canonicalChangedFactIds = [...new Set(changed)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  repeat.changed_fact_ids = canonicalChangedFactIds;
  if (
    repeat.state === "repeated_with_material_change" &&
    canonicalChangedFactIds.length === 0
  ) {
    repeat.state = "unknown";
    repeat.basis = "unresolved";
  }
  return signals as JsonObject;
}

export function groundStructuredIntakeV5(
  request: AssessmentInput,
  rawStructuredIntake: JsonObject,
): JsonObject {
  const rawClone = structuredClone(rawStructuredIntake);
  const grounded = groundStructuredIntakeV3(
    request,
    rawClone,
  ) as unknown as Record<string, unknown>;
  const rawSignals = isObject(grounded.writing_signals)
    ? (grounded.writing_signals as JsonObject)
    : ({} as JsonObject);
  const signals = canonicalSignalsForObservedFacts(
    rawSignals,
    grounded.observed_facts,
  );
  const initialDecisionFacts = isObject(grounded.decision_facts)
    ? (grounded.decision_facts as JsonObject)
    : ({} as JsonObject);

  // The provisional context is intentionally built before the negative guard.
  // It supplies no new Decision fact; the guard consumes only provider semantic
  // ownership signals and existing typed Decision facts.
  groundWritingSignalsV1(request, signals, initialDecisionFacts);
  const guardedDecisionFacts = guardDecisionFactsWithEvidenceV4(
    request,
    initialDecisionFacts,
    signals,
    (grounded.boundaries ?? []) as never,
    (grounded.context_inferences ?? []) as never,
  );
  grounded.decision_facts = guardedDecisionFacts;
  const canonicalized = canonicalizeContextInferencesV5(
    grounded as JsonObject,
  ) as unknown as Record<string, unknown>;
  const canonicalDecisionFacts = isObject(canonicalized.decision_facts)
    ? (canonicalized.decision_facts as JsonObject)
    : ({} as JsonObject);
  canonicalized.writing_context = groundWritingSignalsV1(
    request,
    signals,
    canonicalDecisionFacts,
  );
  delete canonicalized.writing_signals;
  canonicalized.schema_version = "pipeline-schema-v4.0.0";
  return canonicalized as JsonObject;
}
