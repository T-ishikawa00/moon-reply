import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  countExactLiterals,
  evaluateAssertion as evaluateFrozenAssertion,
} from "./m2-p4-i3-r1-c1-r3-r2-e-provider-evaluator-v1.mjs";

export const ADJUDICATOR_VERSION =
  "m2-p4-i3-r1-c1-r3-r2-e-r1-r1-adjudicator-v1";

const frozenRoot = "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e";
const frozenResultsPath = frozenRoot + "/diagnostic-results-v1.json";
const frozenQualityPath = frozenRoot + "/quality-contract-v1.json";
const frozenCasesPath = frozenRoot + "/diagnostic-cases-v1.json";
const frozenContractPath = frozenRoot + "/diagnostic-contract-v1.json";
const basePromptPath =
  "lib/assessment/runtime/contracts/pb-01-base-situation-v1.developer.md";
const candidatePromptPath =
  "lib/assessment/runtime/contracts/pb-01c-candidate-analysis-v1.developer.md";
const baseSchemaPath =
  "lib/assessment/runtime/contracts/base-structured-intake-v1.schema.json";
const candidateSchemaPath =
  "lib/assessment/runtime/contracts/candidate-analysis-v1.schema.json";

const frozenSupportingPaths = Object.freeze([
  frozenResultsPath,
  frozenQualityPath,
  frozenCasesPath,
  frozenContractPath,
]);

const canonicalUnresolvedRepresentations = new Map([
  ["relationship_stage", "unknown"],
  ["latest_direct_message.sender", "unknown"],
  ["latest_direct_message.kind", "unknown"],
  ["latest_direct_message.response_expectation", "unknown"],
  ["latest_direct_message.user_reply_state", "unknown"],
  ["contact_state.unanswered_user_message_count", null],
  ["contact_state.elapsed_since_latest_user_message_minutes", null],
  ["contact_state.usual_cadence_relation", "unknown"],
  ["boundary_state.kind", "unknown"],
  ["boundary_state.status", "unknown"],
  ["practical_reason.kind", "unknown"],
  ["practical_reason.deadline", "unknown"],
]);

const forbiddenInferenceFields = new Set([
  "boundary_state.kind",
  "boundary_state.status",
  "boundary_state.repeated_unanswered_contact",
]);

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clone(value) {
  return structuredClone(value);
}

function canonicalize(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  return Object.fromEntries(
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right, "en"))
      .map((key) => [key, canonicalize(value[key])]),
  );
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function canonicalPrettyJson(value) {
  return JSON.stringify(canonicalize(value), null, 2) + "\n";
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function uniqueSorted(values) {
  return sorted([...new Set(values)]);
}

function pointerEscape(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function valueAtPath(root, fieldPath) {
  let value = root;
  for (const segment of fieldPath.split(".")) {
    if (!isObject(value) || !Object.hasOwn(value, segment)) return undefined;
    value = value[segment];
  }
  return value;
}

function surfaceRoots(call, surface) {
  if (surface === "raw_output") return [call.raw_output];
  if (surface === "grounded_output") return [call.grounded_output];
  if (surface === "raw_and_grounded_output") {
    return [call.raw_output, call.grounded_output];
  }
  if (surface === "provider_input") return [call.provider_input];
  return [];
}

function selectValuesSuccessor(root, jsonPath) {
  if (jsonPath === "$" || jsonPath === "") {
    return { exists: root !== undefined, values: [root], wildcard: false };
  }
  const segments = jsonPath.split(".");
  const wildcard = segments.includes("*");
  const walk = (value, index) => {
    if (index === segments.length) return [value];
    const segment = segments[index];
    if (segment === "*") {
      const candidates = Array.isArray(value)
        ? value
        : isObject(value)
          ? Object.values(value)
          : [];
      return candidates.flatMap((item) => walk(item, index + 1));
    }
    if (!isObject(value) || !Object.hasOwn(value, segment)) return [];
    return walk(value[segment], index + 1);
  };
  const values = walk(root, 0);
  return { exists: values.length > 0, values, wildcard };
}

function selectedValueSuccessor(selection) {
  if (selection.wildcard) return selection.values;
  if (!selection.exists) return undefined;
  return selection.values.length === 1 ? selection.values[0] : selection.values;
}

function collectionContains(collection, expected) {
  return asArray(collection).some((item) => same(item, expected));
}

function containsAll(actual, expected) {
  return asArray(expected).every((item) => collectionContains(actual, item));
}

function collectStrings(value, target = []) {
  if (typeof value === "string") {
    target.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, target));
  } else if (isObject(value)) {
    Object.values(value).forEach((item) => collectStrings(item, target));
  }
  return target;
}

function scopedLiteralAbsent(call, assertion, expected) {
  const roots = surfaceRoots(call, assertion.surface);
  const selected = roots.flatMap((root) => {
    if (typeof assertion.json_path === "string") {
      const selection = selectValuesSuccessor(root, assertion.json_path);
      return selection.exists ? selection.values : [];
    }
    const paths = asArray(assertion.bounded_evaluator_target?.paths);
    return paths.flatMap((jsonPath) => {
      const selection = selectValuesSuccessor(root, jsonPath);
      return selection.exists ? selection.values : [];
    });
  });
  const strings = collectStrings(selected);
  return asArray(expected).every(
    (literal) =>
      typeof literal === "string" &&
      literal.length > 0 &&
      strings.every((text) => !text.includes(literal)),
  );
}

function runEvaluatorReproducers(qualityContract) {
  const minimalContract = {
    allowed_operators: qualityContract.allowed_operators,
  };
  const h1Call = {
    case_id: "SYNTHETIC-H1",
    grounded_output: { items: [{ kind: "retained" }] },
  };
  const h1Assertion = {
    assertion_id: "SYNTHETIC-H1-WILDCARD",
    case_id: "SYNTHETIC-H1",
    surface: "grounded_output",
    json_path: "items.*.kind",
    operator: "contains_all",
    expected: ["retained"],
    blocking: true,
    rationale: "Synthetic wildcard scalar-collapse reproducer.",
  };
  const h1Before = clone(h1Call);
  const h1Frozen = evaluateFrozenAssertion(
    h1Call,
    h1Assertion,
    minimalContract,
  );
  const h1Selection = selectValuesSuccessor(
    h1Call.grounded_output,
    h1Assertion.json_path,
  );
  const h1SuccessorActual = selectedValueSuccessor(h1Selection);
  const h1SuccessorPassed = containsAll(
    h1SuccessorActual,
    h1Assertion.expected,
  );

  const h2Call = {
    case_id: "SYNTHETIC-H2",
    raw_output: {
      prohibited_surface: { text: "clean" },
      allowed_sibling_surface: { text: "allowed-literal" },
    },
    grounded_output: {
      prohibited_surface: { text: "clean" },
      allowed_sibling_surface: { text: "allowed-literal" },
    },
  };
  const h2Assertion = {
    assertion_id: "SYNTHETIC-H2-SCOPED",
    case_id: "SYNTHETIC-H2",
    surface: "raw_and_grounded_output",
    bounded_evaluator_target: {
      type: "serialized_paths",
      paths: ["prohibited_surface"],
    },
    operator: "exact_literal_absent",
    expected: ["allowed-literal"],
    blocking: true,
    rationale: "Synthetic scoped-literal reproducer.",
  };
  const h2Before = clone(h2Call);
  const h2FrozenScoped = evaluateFrozenAssertion(
    h2Call,
    h2Assertion,
    minimalContract,
  );
  const h2GlobalCount = countExactLiterals(
    { raw_output: h2Call.raw_output, grounded_output: h2Call.grounded_output },
    h2Assertion.expected,
  );
  const h2SuccessorPassed = scopedLiteralAbsent(
    h2Call,
    h2Assertion,
    h2Assertion.expected,
  );

  const wildcardZero = selectValuesSuccessor({ items: [] }, "items.*.kind");
  const wildcardOne = selectValuesSuccessor(
    { items: [{ kind: "a" }] },
    "items.*.kind",
  );
  const wildcardMany = selectValuesSuccessor(
    { items: [{ kind: "a" }, { kind: "b" }] },
    "items.*.kind",
  );
  const scopedAbsentCall = {
    raw_output: { target: { text: "clean" } },
    grounded_output: { target: { text: "clean" } },
  };
  const scopedPresentCall = {
    raw_output: { target: { text: "blocked" } },
    grounded_output: { target: { text: "clean" } },
  };
  const scopedAssertion = {
    surface: "raw_and_grounded_output",
    bounded_evaluator_target: { paths: ["target"] },
  };
  const selfTests = [
    {
      name: "wildcard 0 match",
      passed:
        wildcardZero.exists === false &&
        same(selectedValueSuccessor(wildcardZero), []),
    },
    {
      name: "wildcard 1 match preserves array",
      passed: same(selectedValueSuccessor(wildcardOne), ["a"]),
    },
    {
      name: "wildcard 2+ matches preserve array",
      passed: same(selectedValueSuccessor(wildcardMany), ["a", "b"]),
    },
    {
      name: "contains_all one-element PASS",
      passed: containsAll(selectedValueSuccessor(wildcardOne), ["a"]),
    },
    {
      name: "contains_all missing value FAIL",
      passed: !containsAll(selectedValueSuccessor(wildcardOne), ["missing"]),
    },
    {
      name: "scoped literal absent PASS",
      passed: scopedLiteralAbsent(scopedAbsentCall, scopedAssertion, ["blocked"]),
    },
    {
      name: "scoped literal present FAIL",
      passed: !scopedLiteralAbsent(scopedPresentCall, scopedAssertion, ["blocked"]),
    },
    {
      name: "literal only in allowed sibling surface PASS",
      passed: h2SuccessorPassed,
    },
    {
      name: "raw and grounded surfaces evaluated explicitly",
      passed:
        !scopedLiteralAbsent(scopedPresentCall, scopedAssertion, ["blocked"]) &&
        scopedLiteralAbsent(scopedAbsentCall, scopedAssertion, ["blocked"]),
    },
    {
      name: "frozen output immutability",
      passed: same(h1Call, h1Before) && same(h2Call, h2Before),
    },
    {
      name: "no expected-value injection",
      passed:
        !Object.hasOwn(h1Call, "expected") &&
        !Object.hasOwn(h2Call, "expected"),
    },
    {
      name: "no case-ID based result override",
      passed:
        !String(selectValuesSuccessor).includes("case_id") &&
        !String(scopedLiteralAbsent).includes("case_id"),
    },
  ];

  return {
    hypotheses: {
      "EV-H1": {
        status:
          h1Frozen.passed === false && h1SuccessorPassed
            ? "confirmed"
            : "refuted",
        frozen_actual: clone(h1Frozen.actual),
        frozen_result: h1Frozen.passed ? "PASS" : "FAIL",
        successor_actual: clone(h1SuccessorActual),
        successor_result: h1SuccessorPassed ? "PASS" : "FAIL",
        successor_rule:
          "Wildcard selection remains an array for zero, one, or many matches.",
      },
      "EV-H2": {
        status:
          h2FrozenScoped.passed && h2GlobalCount > 0 && h2SuccessorPassed
            ? "confirmed"
            : "refuted",
        frozen_scoped_assertion_result: h2FrozenScoped.passed ? "PASS" : "FAIL",
        frozen_global_leakage_counter: h2GlobalCount,
        successor_scoped_result: h2SuccessorPassed ? "PASS" : "FAIL",
        successor_rule:
          "Exact-literal validation evaluates only the assertion surface and JSON path.",
      },
    },
    self_tests: {
      passed: selfTests.filter((item) => item.passed).length,
      total: selfTests.length,
      results: selfTests,
    },
  };
}

function unsupportedInferenceReferenceCount(call) {
  const facts = new Map(
    asArray(call.grounded_output?.observed_facts)
      .filter((fact) => isObject(fact) && typeof fact.fact_id === "string")
      .map((fact) => [fact.fact_id, fact]),
  );
  let count = 0;
  for (const inference of asArray(call.grounded_output?.context_inferences)) {
    const supportedRefs = new Set();
    for (const factId of asArray(inference?.supporting_fact_ids)) {
      const fact = facts.get(factId);
      if (!fact) {
        count += 1;
        continue;
      }
      asArray(fact.source_refs).forEach((ref) => supportedRefs.add(ref));
    }
    count += asArray(inference?.source_refs).filter(
      (ref) => !supportedRefs.has(ref),
    ).length;
  }
  return count;
}

function analyzeContextualBookkeeping(call) {
  const facts = call.grounded_output?.decision_facts;
  const information = facts?.information_state;
  const unresolvedFields = asArray(information?.unresolved_fields);
  const unresolvedSet = new Set(unresolvedFields);
  const inferences = asArray(call.grounded_output?.context_inferences);
  const inferencePaths = inferences
    .map((inference) => inference?.field_path)
    .filter((fieldPath) => typeof fieldPath === "string");
  const duplicateInferenceFields = inferencePaths.filter(
    (fieldPath, index) => inferencePaths.indexOf(fieldPath) !== index,
  );
  const inferenceUnresolvedConflicts = uniqueSorted(
    inferencePaths.filter((fieldPath) => unresolvedSet.has(fieldPath)),
  );
  const resolvedValuesInUnresolved = unresolvedFields.flatMap((fieldPath) => {
    if (!canonicalUnresolvedRepresentations.has(fieldPath)) return [];
    const actual = valueAtPath(facts, fieldPath);
    const canonical = canonicalUnresolvedRepresentations.get(fieldPath);
    return same(actual, canonical)
      ? []
      : [{ field_path: fieldPath, final_value: clone(actual), canonical }];
  });
  const unknownOrNullMissing = [...canonicalUnresolvedRepresentations].flatMap(
    ([fieldPath, canonical]) => {
      const actual = valueAtPath(facts, fieldPath);
      return actual !== undefined &&
        same(actual, canonical) &&
        !unresolvedSet.has(fieldPath)
        ? [{ field_path: fieldPath, final_value: clone(actual), canonical }]
        : [];
    },
  );
  const forbiddenInferenceFieldCount = inferencePaths.filter((fieldPath) =>
    forbiddenInferenceFields.has(fieldPath),
  ).length;
  const usedContextInferenceMismatch =
    (inferences.length > 0) !== (information?.used_context_inference === true);
  const unsupportedFactReferenceCount = unsupportedInferenceReferenceCount(call);
  const unionPaths = uniqueSorted([...unresolvedFields, ...inferencePaths]);
  const fieldAnalyses = unionPaths.map((fieldPath) => {
    const finalValue = valueAtPath(facts, fieldPath);
    const registered = unresolvedSet.has(fieldPath);
    const inferencePresent = inferencePaths.includes(fieldPath);
    const canonical = canonicalUnresolvedRepresentations.has(fieldPath)
      ? canonicalUnresolvedRepresentations.get(fieldPath)
      : null;
    let contradictionType = "none";
    if (inferencePresent && registered) {
      contradictionType = "inference_and_unresolved_conflict";
    } else if (
      registered &&
      canonicalUnresolvedRepresentations.has(fieldPath) &&
      !same(finalValue, canonical)
    ) {
      contradictionType = "resolved_value_remains_in_unresolved_fields";
    } else if (
      !registered &&
      canonicalUnresolvedRepresentations.has(fieldPath) &&
      same(finalValue, canonical)
    ) {
      contradictionType = "unknown_or_null_value_missing_from_unresolved_fields";
    }
    return {
      decision_field_path: fieldPath,
      final_semantic_value: clone(finalValue),
      registered_in_unresolved_fields: registered,
      canonical_unresolved_representation: clone(canonical),
      context_inference_present: inferencePresent,
      used_context_inference: information?.used_context_inference === true,
      contradiction_type: contradictionType,
      deterministic_application_correction_possible:
        contradictionType === "resolved_value_remains_in_unresolved_fields" ||
        contradictionType === "unknown_or_null_value_missing_from_unresolved_fields",
    };
  });
  const nonBookkeepingIssues =
    duplicateInferenceFields.length +
    inferenceUnresolvedConflicts.length +
    forbiddenInferenceFieldCount +
    unsupportedFactReferenceCount +
    (usedContextInferenceMismatch ? 1 : 0);
  return {
    case_id: call.case_id,
    safe_error_code: call.contextual_integrity_result?.safe_error_code ?? null,
    used_context_inference: information?.used_context_inference === true,
    context_inference_count: inferences.length,
    field_analyses: fieldAnalyses,
    root_cause_counts: {
      resolved_value_remains_in_unresolved_fields:
        resolvedValuesInUnresolved.length,
      unknown_or_null_value_missing_from_unresolved_fields:
        unknownOrNullMissing.length,
      duplicate_inference_field: duplicateInferenceFields.length,
      inference_and_unresolved_conflict: inferenceUnresolvedConflicts.length,
      unsupported_fact_reference: unsupportedFactReferenceCount,
      forbidden_inference_field: forbiddenInferenceFieldCount,
      used_context_inference_mismatch: usedContextInferenceMismatch ? 1 : 0,
      other: 0,
    },
    deterministic_application_correction_possible:
      resolvedValuesInUnresolved.length + unknownOrNullMissing.length > 0 &&
      nonBookkeepingIssues === 0,
    semantic_value_requires_natural_language_reinterpretation: false,
  };
}

function schemaValuesForPath(jsonPath, baseSchema, candidateSchema) {
  if (
    jsonPath ===
    "base_writing_signals.relationship_dimensions.hierarchy.value"
  ) {
    return clone(
      baseSchema.$defs.hierarchy_signal.properties.value.enum,
    );
  }
  if (jsonPath === "decision_facts.contact_state.usual_cadence_relation") {
    return clone(
      baseSchema.$defs.decision_facts.properties.contact_state.properties
        .usual_cadence_relation.enum,
    );
  }
  if (
    jsonPath ===
    "candidate_analysis.candidate_communicative_intent.practical_requirement"
  ) {
    return clone(candidateSchema.$defs.practical_requirement_signal.enum);
  }
  if (jsonPath === "candidate_safety_result.signal_codes") {
    return clone(candidateSchema.$defs.candidate_safety_signal_code.enum);
  }
  if (
    jsonPath ===
    "candidate_analysis.candidate_communicative_intent.apology_strength"
  ) {
    return clone(
      candidateSchema.$defs.candidate_communicative_intent.properties
        .apology_strength.enum,
    );
  }
  if (jsonPath === "candidate_analysis.candidate_style_profile.register") {
    return clone(
      candidateSchema.$defs.candidate_style_profile.properties.register.enum,
    );
  }
  return [];
}

function promptDefinitionForPath(jsonPath, basePrompt, candidatePrompt) {
  if (jsonPath.startsWith("candidate_safety_result.")) {
    return candidatePrompt.includes(
      "Emit every directly supported bounded signal code",
    )
      ? "Emit every directly supported bounded signal code, including contact-action signals when present."
      : "Candidate Safety trigger definition unavailable.";
  }
  if (jsonPath.startsWith("candidate_")) {
    return candidatePrompt.includes("Classify only the bounded Candidate")
      ? "Classify the bounded Candidate field; no field-specific threshold or aggregation rule is defined."
      : "Candidate field definition unavailable.";
  }
  if (
    jsonPath ===
    "base_writing_signals.relationship_dimensions.hierarchy.value"
  ) {
    return basePrompt.includes("Use current-situation evidence")
      ? "Use current-situation evidence for hierarchy; the relationship chip alone cannot establish it."
      : "Base hierarchy definition unavailable.";
  }
  if (jsonPath === "decision_facts.contact_state.usual_cadence_relation") {
    return "Extract the situation-owned typed Base decision facts and preserve direct current-situation evidence.";
  }
  return "No field-specific Prompt definition found.";
}

function shortInput(caseDefinition) {
  const input = caseDefinition?.synthetic_input ?? {};
  const raw = input.optional_message ?? input.current_situation ?? "";
  return String(raw).replace(/\s+/gu, " ").trim().slice(0, 96);
}

function defaultEvaluationPolicy(category) {
  return {
    evaluator_implementation_defect: {
      evaluation_tier: "evaluator_only",
      materiality: "nonblocking",
    },
    quality_contract_overconstraint: {
      evaluation_tier: "flexible_semantic",
      materiality: "nonblocking",
    },
    application_bookkeeping_gap: {
      evaluation_tier: "application_integrity",
      materiality: "blocking",
    },
    provider_or_prompt_gap: {
      evaluation_tier: "semantic_coverage",
      materiality: "blocking",
    },
    unresolved_requires_human_chatgpt_review: {
      evaluation_tier: "product_outcome",
      materiality: "blocking",
    },
  }[category];
}

function classificationFlags(
  category,
  productOwnerDecisionRequired,
  materiality,
) {
  const provider = category === "provider_or_prompt_gap";
  const unresolved =
    category === "unresolved_requires_human_chatgpt_review";
  const production = {
    evaluator_implementation_defect: "evaluator",
    quality_contract_overconstraint: "quality_contract",
    application_bookkeeping_gap: "application",
    provider_or_prompt_gap: "prompt",
    unresolved_requires_human_chatgpt_review: "unresolved",
  }[category];
  let owner = {
    evaluator_implementation_defect: "CodeX",
    quality_contract_overconstraint: "CodeX",
    application_bookkeeping_gap: "CodeX",
    provider_or_prompt_gap: "ChatGPT",
    unresolved_requires_human_chatgpt_review: "HumanChatGPTReview",
  }[category];
  if (productOwnerDecisionRequired) owner = "ProductOwner";
  return {
    changes_provider_semantic_view: provider || unresolved,
    blocks_runtime_readiness: materiality === "blocking",
    production_change_indicated: production,
    product_owner_decision_required: productOwnerDecisionRequired,
    recommended_next_owner: owner,
  };
}

function baseClassification({
  failureCode,
  caseId,
  category,
  confidence,
  assertionId,
  expected,
  actual,
  pointer,
  rationale,
  productOwnerDecisionRequired = false,
  productOwnerDecisionId = null,
  evaluationTier,
  materiality,
  conditionalBlockingCondition = null,
}) {
  const defaultPolicy = defaultEvaluationPolicy(category);
  const resolvedEvaluationTier = evaluationTier ?? defaultPolicy.evaluation_tier;
  const resolvedMateriality = materiality ?? defaultPolicy.materiality;
  return {
    failure_code: failureCode,
    case_id: caseId,
    primary_category: category,
    confidence,
    evaluation_tier: resolvedEvaluationTier,
    materiality: resolvedMateriality,
    conditional_blocking_condition: conditionalBlockingCondition,
    frozen_assertion_id: assertionId,
    frozen_expected: clone(expected),
    frozen_actual: clone(actual),
    frozen_evidence_json_pointer: pointer,
    supporting_frozen_paths: clone(frozenSupportingPaths),
    concise_rationale: rationale,
    product_owner_decision_id: productOwnerDecisionId,
    ...classificationFlags(
      category,
      productOwnerDecisionRequired,
      resolvedMateriality,
    ),
  };
}

function qualityFinding({
  call,
  assertion,
  rule,
  caseDefinition,
  baseSchema,
  candidateSchema,
  basePrompt,
  candidatePrompt,
}) {
  return {
    failure_code: assertion.assertion_id,
    case_id: call.case_id,
    review_classification: rule.quality_contract_review,
    input_summary: caseDefinition?.purpose ?? "Synthetic diagnostic input.",
    input_excerpt: shortInput(caseDefinition),
    frozen_expected: clone(assertion.expected),
    frozen_actual: clone(assertion.actual),
    schema_allowed_values: schemaValuesForPath(
      assertion.json_path,
      baseSchema,
      candidateSchema,
    ),
    prompt_definition: promptDefinitionForPath(
      assertion.json_path,
      basePrompt,
      candidatePrompt,
    ),
    product_behavior_impact: rule.product_behavior_impact,
    uniquely_determinable: rule.quality_contract_review === "justified",
    product_owner_decision_required: rule.product_owner_decision_required,
    chatgpt_recommendation: rule.chatgpt_recommendation,
  };
}

function productOwnerDecision(finding, rule, approvedDecision) {
  return {
    ...clone(approvedDecision),
    case_id: finding.case_id,
    frozen_provider_classification: clone(finding.frozen_actual),
    frozen_quality_contract_expectation: clone(finding.frozen_expected),
    product_behavior_impact: rule.product_behavior_impact,
  };
}

function pointerLocationsForLiteral(call, literals) {
  const hits = [];
  const walk = (value, pointer) => {
    if (typeof value === "string") {
      for (const literal of literals) {
        if (value.includes(literal)) hits.push(pointer);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, pointer + "/" + index));
      return;
    }
    if (isObject(value)) {
      for (const [key, item] of Object.entries(value)) {
        walk(item, pointer + "/" + pointerEscape(key));
      }
    }
  };
  walk(call.raw_output, "/raw_output");
  walk(call.grounded_output, "/grounded_output");
  return uniqueSorted(hits);
}

function metricPass(metric, passed, total) {
  return (
    metric?.evidence_status === "available" &&
    metric?.passed === passed &&
    metric?.total === total
  );
}

function deriveCandidateSourceIsolation(frozenResults) {
  const metrics = frozenResults.evaluation.metrics;
  const baseCalls = frozenResults.calls.filter((call) => call.stage_id === "PB-01");
  const candidateCalls = frozenResults.calls.filter(
    (call) => call.stage_id === "PB-01C",
  );
  const facts = {
    provider_input_isolation: metricPass(metrics.provider_input_isolation, 14, 14),
    base_candidate_field_count: baseCalls.reduce(
      (total, call) => total + call.candidate_field_count_in_base,
      0,
    ),
    base_optional_message_source_ref_count: baseCalls.reduce(
      (total, call) => total + call.optional_message_source_ref_count,
      0,
    ),
    candidate_base_fact_field_count: candidateCalls.reduce(
      (total, call) => total + call.base_fact_field_count_in_candidate,
      0,
    ),
    candidate_raw_echo_count: candidateCalls.reduce(
      (total, call) => total + call.raw_candidate_echo_count,
      0,
    ),
    candidate_operational_metadata_count: candidateCalls.reduce(
      (total, call) => total + call.source_ref_id_operational_metadata_count,
      0,
    ),
    schema_pass:
      metricPass(metrics.raw_base_schema, 8, 8) &&
      metricPass(metrics.grounded_base_schema, 8, 8) &&
      metricPass(metrics.raw_candidate_schema, 6, 6),
    source_integrity_pass:
      metricPass(metrics.raw_base_source_integrity, 8, 8) &&
      metricPass(metrics.grounded_base_source_integrity, 8, 8) &&
      metricPass(metrics.candidate_source_integrity, 6, 6) &&
      metricPass(metrics.candidate_allowlist_grounding, 6, 6),
    provider_output_immutability: metricPass(
      metrics.provider_output_immutability,
      14,
      14,
    ),
    expected_data_injection_count: frozenResults.expected_data_injection_count,
    secret_leakage_count: frozenResults.secret_leakage_count,
    frozen_global_exact_literal_counter:
      frozenResults.exact_literal_leakage_count,
  };
  const confirmed =
    facts.provider_input_isolation &&
    facts.base_candidate_field_count === 0 &&
    facts.base_optional_message_source_ref_count === 0 &&
    facts.candidate_base_fact_field_count === 0 &&
    facts.candidate_raw_echo_count === 0 &&
    facts.candidate_operational_metadata_count === 0 &&
    facts.schema_pass &&
    facts.source_integrity_pass &&
    facts.provider_output_immutability &&
    facts.expected_data_injection_count === 0 &&
    facts.secret_leakage_count === 0;
  return {
    ...facts,
    frozen_global_exact_literal_counter_disposition:
      "confirmed_evaluator_scope_defect_not_source_leakage",
    candidate_source_isolation_provider_boundary_confirmed: confirmed,
    provider_quality_established: false,
  };
}

function caseViews(calls, classifications, contract) {
  const providerRules = contract.view_adjudication_rules.provider_stage;
  const runtimeRules =
    contract.view_adjudication_rules.split_runtime_pre_r4;
  const cases = calls.map((call) => {
    const selected = classifications.filter(
      (item) => item.case_id === call.case_id,
    );
    const categories = uniqueSorted(
      selected.map((item) => item.primary_category),
    );
    const materialities = uniqueSorted(
      selected.map((item) => item.materiality),
    );
    const evaluationTiers = uniqueSorted(
      selected.map((item) => item.evaluation_tier),
    );
    const providerStatus = categories.some((category) =>
      providerRules.unresolved_categories.includes(category),
    )
      ? "unresolved"
      : materialities.some((materiality) =>
            providerRules.blocking_materiality.includes(materiality),
          )
        ? "blocking"
        : materialities.some((materiality) =>
              providerRules.conditional_materiality.includes(materiality),
            )
          ? "conditional"
          : evaluationTiers.some((tier) =>
                providerRules.flexible_evaluation_tiers.includes(tier),
              )
            ? "flexible_finding"
            : providerRules.remaining_status;
    const runtimeStatus = categories.some((category) =>
      runtimeRules.unresolved_categories.includes(category),
    )
      ? "unresolved"
      : materialities.some((materiality) =>
            runtimeRules.blocked_materiality.includes(materiality),
          )
        ? "blocked"
        : materialities.some((materiality) =>
              runtimeRules.conditional_materiality.includes(materiality),
            )
          ? "conditional"
          : runtimeRules.remaining_status;
    return {
      case_id: call.case_id,
      frozen_case_passed: call.evaluation?.case_verdict === "PASS",
      classified_failure_codes: selected.map((item) => item.failure_code),
      classification_categories: categories,
      evaluation_tiers: evaluationTiers,
      materialities,
      provider_stage_status: providerStatus,
      split_runtime_pre_r4_status: runtimeStatus,
    };
  });
  const ids = (field, value) =>
    cases.filter((item) => item[field] === value).map((item) => item.case_id);
  const providerBlocking = ids("provider_stage_status", "blocking");
  const providerConditional = ids("provider_stage_status", "conditional");
  const providerFlexible = ids(
    "provider_stage_status",
    "flexible_finding",
  );
  const providerClean = ids("provider_stage_status", "clean");
  const providerUnresolved = ids("provider_stage_status", "unresolved");
  const runtimeBlocked = ids("split_runtime_pre_r4_status", "blocked");
  const runtimeConditional = ids(
    "split_runtime_pre_r4_status",
    "conditional",
  );
  const runtimeLocallyReady = ids(
    "split_runtime_pre_r4_status",
    "locally_ready",
  );
  const runtimeUnresolved = ids("split_runtime_pre_r4_status", "unresolved");
  return {
    cases,
    provider_stage_adjudication: {
      blocking_cases: providerBlocking,
      conditional_cases: providerConditional,
      flexible_finding_cases: providerFlexible,
      clean_cases: providerClean,
      unresolved_cases: providerUnresolved,
      counts: {
        blocking: providerBlocking.length,
        conditional: providerConditional.length,
        flexible_finding: providerFlexible.length,
        clean: providerClean.length,
        unresolved: providerUnresolved.length,
        total: cases.length,
      },
    },
    split_runtime_pre_r4_adjudication: {
      blocked_cases: runtimeBlocked,
      conditional_cases: runtimeConditional,
      locally_ready_cases: runtimeLocallyReady,
      unresolved_cases: runtimeUnresolved,
      counts: {
        blocked: runtimeBlocked.length,
        conditional: runtimeConditional.length,
        locally_ready: runtimeLocallyReady.length,
        unresolved: runtimeUnresolved.length,
        total: cases.length,
      },
      locally_ready_equals_r4_ready: false,
    },
  };
}

export function buildAdjudicationResultV1({
  frozenResults,
  qualityContract,
  caseBundle,
  adjudicationContract,
  baseSchema,
  candidateSchema,
  basePrompt,
  candidatePrompt,
}) {
  const reproducer = runEvaluatorReproducers(qualityContract);
  const callsById = new Map(
    frozenResults.calls.map((call) => [call.case_id, call]),
  );
  const casesById = new Map(caseBundle.map((item) => [item.case_id, item]));
  const classifications = [];
  const qualityFindings = [];
  const applicationFindings = [];
  const providerFindings = [];
  const productOwnerDecisions = [];

  for (const [failureIndex, frozenFailure] of
    frozenResults.evaluation.hard_failures.entries()) {
    const call = callsById.get(frozenFailure.case_id);
    if (!call) throw new Error("Frozen failure call missing");
    const assertionIndex = asArray(call.assertion_results).findIndex(
      (item) => item.assertion_id === frozenFailure.failure,
    );
    const assertion =
      assertionIndex >= 0 ? call.assertion_results[assertionIndex] : null;
    const callIndex = frozenResults.calls.indexOf(call);
    const pointer =
      assertionIndex >= 0
        ? `/calls/${callIndex}/assertion_results/${assertionIndex}`
        : `/evaluation/hard_failures/${failureIndex}`;

    if (
      assertion?.operator === "contains_all" &&
      !Array.isArray(assertion.actual) &&
      asArray(assertion.expected).some((item) => same(item, assertion.actual))
    ) {
      classifications.push(
        baseClassification({
          failureCode: frozenFailure.failure,
          caseId: call.case_id,
          category: "evaluator_implementation_defect",
          confidence: "confirmed",
          assertionId: assertion.assertion_id,
          expected: assertion.expected,
          actual: assertion.actual,
          pointer,
          rationale:
            "A one-match wildcard collapsed to a scalar; the frozen contains_all operator then treated the retained expected value as absent.",
        }),
      );
      continue;
    }

    if (
      frozenFailure.failure.endsWith("-LITERAL-LEAKAGE") &&
      call.exact_literal_leakage_count > 0
    ) {
      const literalAssertions = asArray(call.assertion_results).filter(
        (item) => item.operator === "exact_literal_absent",
      );
      const allScopedPassed =
        literalAssertions.length > 0 &&
        literalAssertions.every((item) => item.passed === true);
      if (allScopedPassed) {
        classifications.push(
          baseClassification({
            failureCode: frozenFailure.failure,
            caseId: call.case_id,
            category: "evaluator_implementation_defect",
            confidence: "confirmed",
            assertionId: frozenFailure.failure,
            expected: 0,
            actual: call.exact_literal_leakage_count,
            pointer: `/calls/${callIndex}/exact_literal_leakage_count`,
            rationale:
              "Every scoped exact-literal assertion passed, but the runner's global scan counted the literal in an allowed sibling surface.",
          }),
        );
        continue;
      }
    }

    if (
      frozenFailure.failure.endsWith("-CONTEXTUAL-INTEGRITY") &&
      call.contextual_integrity_result?.safe_error_code ===
        "M2_CONTEXTUAL_INFERENCE_INVALID"
    ) {
      const finding = analyzeContextualBookkeeping(call);
      applicationFindings.push(finding);
      const category = finding.deterministic_application_correction_possible
        ? "application_bookkeeping_gap"
        : "unresolved_requires_human_chatgpt_review";
      classifications.push(
        baseClassification({
          failureCode: frozenFailure.failure,
          caseId: call.case_id,
          category,
          confidence:
            category === "application_bookkeeping_gap"
              ? "confirmed"
              : "uncertain",
          assertionId: frozenFailure.failure,
          expected: { passed: true },
          actual: clone(call.contextual_integrity_result),
          pointer: `/calls/${callIndex}/contextual_integrity_result`,
          rationale:
            category === "application_bookkeeping_gap"
              ? "The final semantic values are evidence-consistent; only canonical unresolved-field bookkeeping contradicts them and can be corrected deterministically without rereading text."
              : "The contextual-integrity failure includes a condition that cannot be reduced to deterministic bookkeeping from frozen structured evidence.",
        }),
      );
      continue;
    }

    if (assertion) {
      const rule = adjudicationContract.semantic_field_rules.find(
        (item) => item.json_path === assertion.json_path,
      );
      if (rule) {
        classifications.push(
          baseClassification({
            failureCode: frozenFailure.failure,
            caseId: call.case_id,
            category: rule.primary_category,
            confidence: rule.confidence,
            assertionId: assertion.assertion_id,
            expected: assertion.expected,
            actual: assertion.actual,
            pointer,
            rationale: rule.concise_rationale,
            productOwnerDecisionRequired:
              rule.product_owner_decision_required,
            productOwnerDecisionId: rule.product_owner_decision_id,
            evaluationTier: rule.evaluation_tier,
            materiality: rule.materiality,
            conditionalBlockingCondition:
              rule.conditional_blocking_condition,
          }),
        );
        const finding = qualityFinding({
          call,
          assertion,
          rule,
          caseDefinition: casesById.get(call.case_id),
          baseSchema,
          candidateSchema,
          basePrompt,
          candidatePrompt,
        });
        qualityFindings.push(finding);
        if (rule.primary_category === "provider_or_prompt_gap") {
          providerFindings.push({
            case_id: call.case_id,
            failure_code: frozenFailure.failure,
            input_summary: finding.input_summary,
            input_excerpt: finding.input_excerpt,
            actual_provider_value: clone(assertion.actual),
            justified_expected_set: clone(assertion.expected),
            user_visible_impact: rule.product_behavior_impact,
            prompt_correction_candidate: rule.prompt_correction_candidate,
            schema_change_required: rule.schema_change_required,
            provider_retest_required: rule.provider_retest_required,
          });
        }
        if (rule.product_owner_decision_id) {
          const approvedDecision =
            adjudicationContract.product_owner_decisions.find(
              (item) => item.decision_id === rule.product_owner_decision_id,
            );
          if (!approvedDecision) {
            throw new Error("Approved Product Owner decision missing");
          }
          productOwnerDecisions.push(
            productOwnerDecision(finding, rule, approvedDecision),
          );
        }
        continue;
      }
    }

    classifications.push(
      baseClassification({
        failureCode: frozenFailure.failure,
        caseId: call.case_id,
        category: "unresolved_requires_human_chatgpt_review",
        confidence: "uncertain",
        assertionId: assertion?.assertion_id ?? frozenFailure.failure,
        expected: assertion?.expected ?? true,
        actual: assertion?.actual ?? frozenFailure.failure,
        pointer,
        rationale:
          "Frozen evidence does not satisfy an evaluator, deterministic bookkeeping, or field-level semantic responsibility rule.",
      }),
    );
  }

  const categoryCounts = Object.fromEntries(
    adjudicationContract.allowed_classification_categories.map((category) => [
      category,
      classifications.filter((item) => item.primary_category === category)
        .length,
    ]),
  );
  const evaluationTierCounts = Object.fromEntries(
    adjudicationContract.allowed_evaluation_tiers.map((tier) => [
      tier,
      classifications.filter((item) => item.evaluation_tier === tier).length,
    ]),
  );
  const materialityCounts = Object.fromEntries(
    adjudicationContract.allowed_materiality_values.map((materiality) => [
      materiality,
      classifications.filter((item) => item.materiality === materiality)
        .length,
    ]),
  );
  const views = caseViews(
    frozenResults.calls,
    classifications,
    adjudicationContract,
  );
  const candidateBoundary = deriveCandidateSourceIsolation(frozenResults);
  const failureCodes = frozenResults.evaluation.hard_failures.map(
    (item) => item.failure,
  );
  const classifiedCodes = classifications.map((item) => item.failure_code);
  const classificationComplete =
    classifications.length === failureCodes.length &&
    new Set(classifiedCodes).size === classifiedCodes.length &&
    same(sorted(classifiedCodes), sorted(failureCodes));
  const h2FrozenCall = frozenResults.calls.find(
    (call) => call.exact_literal_leakage_count > 0,
  );
  const h2LiteralAssertions = asArray(h2FrozenCall?.assertion_results).filter(
    (item) => item.operator === "exact_literal_absent",
  );
  const h2Literals = uniqueSorted(
    h2LiteralAssertions.flatMap((item) => asArray(item.expected)),
  );
  const pendingProductOwnerDecisions = productOwnerDecisions.filter(
    (item) =>
      item.status !== "approved" ||
      item.approved_by !== "ProductOwner" ||
      item.approved_in_conversation !== true,
  );
  const productOwnerDecisionsComplete =
    productOwnerDecisions.length ===
      adjudicationContract.product_owner_decisions.length &&
    new Set(productOwnerDecisions.map((item) => item.decision_id)).size ===
      productOwnerDecisions.length &&
    pendingProductOwnerDecisions.length === 0;

  return {
    schema_version:
      "m2-p4-i3-r1-c1-r3-r2-e-r1-r1-adjudication-results-v1",
    task_id: "M2-P4-I3-R1-C1-R3-R2-E-R1-R1",
    adjudicator_version: ADJUDICATOR_VERSION,
    status: "product_direction_synced_pending_human_chatgpt_review",
    baseline: adjudicationContract.baseline,
    frozen_evidence: {
      execution_protocol_accepted: true,
      execution_evidence_valid: true,
      provider_calls: frozenResults.calls_actual,
      pb_01_calls: frozenResults.pb_01_calls,
      pb_01c_calls: frozenResults.pb_01c_calls,
      machine_verdict: frozenResults.evaluation.verdict,
      machine_case_result: `${frozenResults.evaluation.case_pass_count}/${frozenResults.evaluation.case_count}`,
      authorization_consumed: frozenResults.authorization_consumed,
      rerun_authorized: frozenResults.rerun_authorized,
    },
    frozen_failure_codes: failureCodes,
    classification_complete: classificationComplete,
    classifications,
    category_counts: categoryCounts,
    evaluation_tier_counts: evaluationTierCounts,
    materiality_counts: materialityCounts,
    case_level_derived_statuses: views.cases,
    provider_stage_adjudication: views.provider_stage_adjudication,
    split_runtime_pre_r4_adjudication:
      views.split_runtime_pre_r4_adjudication,
    evaluator_hypotheses: {
      ...reproducer.hypotheses,
      "EV-H2": {
        ...reproducer.hypotheses["EV-H2"],
        frozen_evidence_case_id: h2FrozenCall?.case_id ?? null,
        frozen_scoped_assertions_passed:
          h2LiteralAssertions.length > 0 &&
          h2LiteralAssertions.every((item) => item.passed === true),
        frozen_allowed_surface_occurrence_pointers: h2FrozenCall
          ? pointerLocationsForLiteral(h2FrozenCall, h2Literals)
          : [],
      },
    },
    evaluator_successor_self_tests: reproducer.self_tests,
    quality_contract_findings: qualityFindings,
    application_bookkeeping_findings: applicationFindings,
    provider_prompt_findings: providerFindings,
    unresolved_findings: classifications
      .filter(
        (item) =>
          item.primary_category ===
          "unresolved_requires_human_chatgpt_review",
      )
      .map((item) => ({
        case_id: item.case_id,
        failure_code: item.failure_code,
        rationale: item.concise_rationale,
      })),
    product_direction_doctrine: clone(
      adjudicationContract.product_direction_doctrine,
    ),
    evaluation_doctrine: clone(adjudicationContract.evaluation_doctrine),
    product_owner_decisions: productOwnerDecisions,
    product_owner_decisions_complete: productOwnerDecisionsComplete,
    product_owner_decisions_pending: pendingProductOwnerDecisions.length,
    e_r2_entry_contract: clone(adjudicationContract.e_r2_entry_contract),
    candidate_source_isolation_boundary: candidateBoundary,
    safeguards: {
      provider_calls_in_this_task: 0,
      provider_rerun_authorized: false,
      db_operations: 0,
      supabase_operations: 0,
      provider_output_mutation_count: 0,
      expected_data_injection_count: 0,
      secret_leakage_count: 0,
      provider_quality_established: false,
      candidate_ready_for_isolated_e2e: false,
      e_r2_ready: true,
      e_r2_authorized: false,
      r4_authorized: false,
      c2_authorized: false,
    },
    overall_postmortem_status:
      classificationComplete &&
      productOwnerDecisionsComplete &&
      reproducer.self_tests.passed === reproducer.self_tests.total
        ? "PASS_PENDING_HUMAN_CHATGPT_REVIEW"
        : "FAIL",
  };
}

function repositoryRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function readText(root, relativePath) {
  return readFileSync(path.join(root, ...relativePath.split("/")), "utf8");
}

function readJson(root, relativePath) {
  return JSON.parse(readText(root, relativePath));
}

function buildFromRepository(root) {
  return buildAdjudicationResultV1({
    frozenResults: readJson(root, frozenResultsPath),
    qualityContract: readJson(root, frozenQualityPath),
    caseBundle: readJson(root, frozenCasesPath),
    adjudicationContract: readJson(
      root,
      "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r1/adjudication-contract-v1.json",
    ),
    baseSchema: readJson(root, baseSchemaPath),
    candidateSchema: readJson(root, candidateSchemaPath),
    basePrompt: readText(root, basePromptPath),
    candidatePrompt: readText(root, candidatePromptPath),
  });
}

function runCli() {
  const root = repositoryRoot();
  const resultsPath =
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r1/adjudication-results-v1.json";
  const result = buildFromRepository(root);
  const serialized = canonicalPrettyJson(result);
  if (process.argv.includes("--check")) {
    const committed = readText(root, resultsPath);
    if (serialized !== committed) {
      throw new Error("M2_R3_R2_E_R1_R1_DETERMINISTIC_REPLAY_MISMATCH");
    }
    console.log("M2_R3_R2_E_R1_R1_ADJUDICATOR_CHECK: PASS");
    return;
  }
  writeFileSync(
    path.join(root, ...resultsPath.split("/")),
    serialized,
    "utf8",
  );
  console.log("M2_R3_R2_E_R1_R1_ADJUDICATOR_WRITE: PASS");
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) runCli();
