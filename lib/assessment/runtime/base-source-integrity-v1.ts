import {
  APPLICATION_CANONICAL_BASE_FIELD_MAP,
  BASE_SOURCE_REFS,
} from "./contracts/split-stage-contracts-v1.ts";
import type { BaseProviderInputV1 } from "./contracts/split-stage-contracts-v1.ts";
import { M2RuntimeError } from "./errors.ts";

export const BASE_SOURCE_INTEGRITY_VERSION =
  "m2-p4-base-source-integrity-v1" as const;

const providerRequestKeys = [
  "current_situation",
  "relationship",
  "requested_topics",
] as const;

const forbiddenBasePropertyNames = new Set([
  "optional_message",
  "candidate_analysis",
  "candidate_envelope",
  "candidate_style_profile",
  "candidate_communicative_intent",
  "candidate_language_expression",
  "candidate_safety_signals",
  "candidate_safety_result",
  "candidate_presence",
  "candidate_metadata",
  "proposed_message_present",
]);

const allowedSourceRefs = new Set<string>(BASE_SOURCE_REFS);

export type BaseSourceIntegritySurfacesV1 = Readonly<{
  input?: BaseProviderInputV1;
  baseProviderRequest?: unknown;
  rawBaseOutput?: unknown;
  groundedBaseOutput?: unknown;
  baseLegacyView?: unknown;
}>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value).sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  const sortedExpected = [...expected].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  return JSON.stringify(actual) === JSON.stringify(sortedExpected);
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function valueAtPath(root: Record<string, unknown>, fieldPath: string) {
  let selected: unknown = root;
  for (const segment of fieldPath.split(".")) {
    if (!isObject(selected)) return undefined;
    selected = selected[segment];
  }
  return selected;
}

function inspectBaseOutput(
  value: unknown,
  surface: string,
  violations: Set<string>,
  path = "$",
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      inspectBaseOutput(item, surface, violations, `${path}[${index}]`),
    );
    return;
  }
  if (!isObject(value)) return;

  for (const [propertyName, propertyValue] of Object.entries(value)) {
    const propertyPath = `${path}.${propertyName}`;
    if (forbiddenBasePropertyNames.has(propertyName)) {
      violations.add(`${surface}:FORBIDDEN_PROPERTY:${propertyPath}`);
    }
    if (propertyName === "source_refs") {
      if (!Array.isArray(propertyValue)) {
        violations.add(`${surface}:SOURCE_REFS_NOT_ARRAY:${propertyPath}`);
      } else {
        const stringRefs = propertyValue.filter(
          (sourceRef): sourceRef is string => typeof sourceRef === "string",
        );
        if (stringRefs.length !== propertyValue.length) {
          violations.add(`${surface}:SOURCE_REF_NOT_STRING:${propertyPath}`);
        }
        if (new Set(stringRefs).size !== stringRefs.length) {
          violations.add(`${surface}:SOURCE_REFS_NOT_UNIQUE:${propertyPath}`);
        }
        if (stringRefs.some((sourceRef) => !allowedSourceRefs.has(sourceRef))) {
          violations.add(`${surface}:SOURCE_REF_NOT_ALLOWED:${propertyPath}`);
        }
      }
    }
    inspectBaseOutput(propertyValue, surface, violations, propertyPath);
  }
}

function inspectProviderRequest(
  request: unknown,
  input: BaseProviderInputV1 | undefined,
  violations: Set<string>,
) {
  if (!isObject(request)) {
    violations.add("BASE_PROVIDER_REQUEST:NOT_OBJECT");
    return;
  }
  if (!sameKeys(request, providerRequestKeys)) {
    violations.add("BASE_PROVIDER_REQUEST:EXACT_KEYS_INVALID");
  }
  if (typeof request.current_situation !== "string") {
    violations.add("BASE_PROVIDER_REQUEST:CURRENT_SITUATION_INVALID");
  }
  if (typeof request.relationship !== "string") {
    violations.add("BASE_PROVIDER_REQUEST:RELATIONSHIP_INVALID");
  }
  if (!Array.isArray(request.requested_topics)) {
    violations.add("BASE_PROVIDER_REQUEST:REQUESTED_TOPICS_INVALID");
  }
  if (input) {
    if (request.current_situation !== input.current_situation) {
      violations.add("BASE_PROVIDER_REQUEST:CURRENT_SITUATION_DRIFT");
    }
    if (request.relationship !== input.relationship) {
      violations.add("BASE_PROVIDER_REQUEST:RELATIONSHIP_DRIFT");
    }
    if (!sameJson(request.requested_topics, input.requested_topics)) {
      violations.add("BASE_PROVIDER_REQUEST:REQUESTED_TOPICS_DRIFT");
    }
  }
}

function inspectGroundedCanonicalFields(
  grounded: unknown,
  input: BaseProviderInputV1,
  violations: Set<string>,
) {
  if (!isObject(grounded)) {
    violations.add("GROUNDED_BASE_OUTPUT:NOT_OBJECT");
    return;
  }
  const decisionFacts = grounded.decision_facts;
  if (!isObject(decisionFacts)) {
    violations.add("GROUNDED_BASE_OUTPUT:DECISION_FACTS_INVALID");
    return;
  }
  const expectedByApplicationSource = {
    "request.relationship": input.relationship,
    "request.requestedTopics": input.requested_topics,
  } as const;
  for (const [ownedPath, applicationSource] of Object.entries(
    APPLICATION_CANONICAL_BASE_FIELD_MAP,
  )) {
    const groundedPath = ownedPath.startsWith("base_structured_intake.")
      ? ownedPath.slice("base_structured_intake.".length)
      : ownedPath;
    if (
      !sameJson(
        valueAtPath(grounded, groundedPath),
        expectedByApplicationSource[applicationSource],
      )
    ) {
      violations.add(`GROUNDED_BASE_OUTPUT:CANONICAL_FIELD_DRIFT:${ownedPath}`);
    }
  }
  if (
    Array.isArray(grounded.context_inferences) &&
    grounded.context_inferences.some(
      (inference) =>
        isObject(inference) && inference.field_path === "relationship_stage",
    )
  ) {
    violations.add("GROUNDED_BASE_OUTPUT:RELATIONSHIP_INFERENCE_PRESENT");
  }
  const informationState = decisionFacts.information_state;
  if (
    isObject(informationState) &&
    Array.isArray(informationState.unresolved_fields) &&
    informationState.unresolved_fields.includes("relationship_stage")
  ) {
    violations.add("GROUNDED_BASE_OUTPUT:RELATIONSHIP_UNRESOLVED_PRESENT");
  }
}

export function collectBaseSourceIntegrityViolationsV1(
  surfaces: BaseSourceIntegritySurfacesV1,
): string[] {
  const violations = new Set<string>();

  if (surfaces.baseProviderRequest !== undefined) {
    inspectProviderRequest(
      surfaces.baseProviderRequest,
      surfaces.input,
      violations,
    );
  }
  for (const [surface, value] of [
    ["RAW_BASE_OUTPUT", surfaces.rawBaseOutput],
    ["GROUNDED_BASE_OUTPUT", surfaces.groundedBaseOutput],
    ["BASE_LEGACY_VIEW", surfaces.baseLegacyView],
  ] as const) {
    if (value === undefined) continue;
    if (!isObject(value)) violations.add(`${surface}:NOT_OBJECT`);
    inspectBaseOutput(value, surface, violations);
  }
  if (surfaces.input && surfaces.groundedBaseOutput !== undefined) {
    inspectGroundedCanonicalFields(
      surfaces.groundedBaseOutput,
      surfaces.input,
      violations,
    );
  }

  return [...violations].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

export function validateBaseSourceIntegrityV1(
  surfaces: BaseSourceIntegritySurfacesV1,
): void {
  if (collectBaseSourceIntegrityViolationsV1(surfaces).length > 0) {
    throw new M2RuntimeError("M2_BASE_SOURCE_INTEGRITY_FAILED");
  }
}
