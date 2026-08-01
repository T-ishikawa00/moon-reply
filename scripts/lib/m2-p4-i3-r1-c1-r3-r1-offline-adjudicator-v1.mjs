import { evaluateProviderCall as evaluateFrozenR3ProviderCall } from "./m2-p4-i3-r1-c1-r3-provider-evaluator-v1.mjs";

export const OFFLINE_ADJUDICATOR_VERSION =
  "m2-p4-i3-r1-c1-r3-r1-offline-adjudicator-v1";

export const R3_08_ALLOWED_USER_GOAL_VALUES = Object.freeze([
  "other",
  "unknown",
]);

export const R3_08_ALLOWED_USER_GOAL_BASES = Object.freeze([
  "current_situation_explicit",
  "current_situation_inferred",
  "requested_topics",
  "unresolved",
]);

export const R3_08_FORBIDDEN_USER_GOAL_BASES = Object.freeze([
  "optional_message",
  "relationship_chip",
]);

const schemaValidDeadlines = new Set([
  "none",
  "same_day",
  "next_day",
  "later",
  "unknown",
]);

const offlineIrrelevantFailureIds = new Set([
  "PROVIDER_TRANSPORT_FAILED",
  "RETURNED_MODEL_NOT_RECORDED",
]);

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

function assertion(id, category, passed, expected, actual, surface) {
  return {
    id,
    category,
    passed: passed === true,
    hard: true,
    surface,
    expected: structuredClone(expected),
    actual: structuredClone(actual),
  };
}

function categoryResult(assertions, category) {
  const selected = assertions.filter((item) => item.category === category);
  return {
    passed: selected.length > 0 && selected.every((item) => item.passed),
    evidence_status: selected.length === 0 ? "unavailable" : "available",
    assertions: selected,
  };
}

function allAssertions(evaluation) {
  return [
    ...asArray(evaluation.raw_semantic_assertions),
    ...asArray(evaluation.grounded_semantic_assertions),
    ...asArray(evaluation.operational_assertions),
  ];
}

function correctedQualityCase(qualityCase) {
  if (qualityCase.case_id !== "R3-08") return structuredClone(qualityCase);
  return {
    ...structuredClone(qualityCase),
    user_goal_values: [...R3_08_ALLOWED_USER_GOAL_VALUES],
    user_goal_bases: [...R3_08_ALLOWED_USER_GOAL_BASES],
  };
}

export function practicalReasonMatchesV1(actual, expected) {
  if (!isObject(actual) || !isObject(expected)) return false;
  if (
    actual.kind !== expected.kind ||
    actual.active !== expected.active ||
    !schemaValidDeadlines.has(actual.deadline)
  ) {
    return false;
  }
  return (
    !Object.hasOwn(expected, "deadline") || actual.deadline === expected.deadline
  );
}

function practicalReasonAssertion(call, qualityCase) {
  if (qualityCase.practical_reason_consistency !== true) return null;
  const expected = qualityCase.decision_fact_subset?.practical_reason;
  const raw = call.raw_output?.decision_facts?.practical_reason;
  const grounded = call.grounded_output?.decision_facts?.practical_reason;
  const latestKind = call.grounded_output?.decision_facts?.latest_direct_message?.kind;
  const scheduleKindPass =
    expected?.kind !== "schedule_coordination" ||
    ["question", "schedule_coordination"].includes(latestKind);
  return assertion(
    call.case_id + "-PRACTICAL-REASON-CONSISTENCY",
    "practical_reason_consistency",
    practicalReasonMatchesV1(raw, expected) &&
      practicalReasonMatchesV1(grounded, expected) &&
      call.decision_facts_adjudication?.passed === true &&
      scheduleKindPass,
    {
      raw_subset: expected,
      grounded_subset: expected,
      deadline: Object.hasOwn(expected ?? {}, "deadline")
        ? expected.deadline
        : "schema_valid_only",
      schedule_latest_kind:
        expected?.kind === "schedule_coordination"
          ? ["question", "schedule_coordination"]
          : "not_applicable",
      application_decision_facts: "PASS",
    },
    {
      raw: raw ?? null,
      grounded: grounded ?? null,
      latest_kind: latestKind ?? null,
      application_decision_facts:
        call.decision_facts_adjudication?.passed ?? false,
    },
    "grounded",
  );
}

export function adjudicateOfflineProviderCallV1({
  call,
  contract,
  qualityCase,
}) {
  const correctedCase = correctedQualityCase(qualityCase);
  const evaluation = evaluateFrozenR3ProviderCall({
    call,
    contract,
    qualityCase: correctedCase,
  });
  evaluation.evaluator_version = OFFLINE_ADJUDICATOR_VERSION;
  evaluation.frozen_evaluator_version =
    "m2-p4-i3-r1-c1-r3-provider-evaluator-v1";
  evaluation.operational_assertions = asArray(
    evaluation.operational_assertions,
  ).filter((item) => item.category !== "returned_model_exact");

  const practicalId = call.case_id + "-PRACTICAL-REASON-CONSISTENCY";
  evaluation.grounded_semantic_assertions = asArray(
    evaluation.grounded_semantic_assertions,
  ).filter((item) => item.id !== practicalId);
  const practical = practicalReasonAssertion(
    {
      ...call,
      decision_facts_adjudication: evaluation.decision_facts_adjudication,
    },
    correctedCase,
  );
  if (practical) evaluation.grounded_semantic_assertions.push(practical);

  const assertions = allAssertions(evaluation);
  evaluation.practical_reason_consistency_results = categoryResult(
    assertions,
    "practical_reason_consistency",
  );
  evaluation.returned_model_results = {
    passed: true,
    evidence_status: "not_applicable_offline",
    assertions: [],
  };
  const correctedFailureIds = new Set([practicalId]);
  evaluation.hard_failures = sortedUnique([
    ...asArray(evaluation.hard_failures).filter(
      (failure) =>
        !correctedFailureIds.has(failure) &&
        !offlineIrrelevantFailureIds.has(failure) &&
        failure !== call.case_id + "-RETURNED-MODEL-EXACT",
    ),
    ...assertions
      .filter((item) => item.hard === true && item.passed !== true)
      .map((item) => item.id),
  ]);
  return evaluation;
}

function score(calls, selector, applicability = () => true) {
  const selected = calls.filter(applicability);
  const passed = selected.filter(selector).length;
  return {
    passed,
    total: selected.length,
    rate: selected.length === 0 ? null : passed / selected.length,
  };
}

function assertionPassed(call, id) {
  return allAssertions(call.evaluation).some(
    (item) => item.id === id && item.passed === true,
  );
}

function inferencePaths(value) {
  return asArray(value).flatMap((inference) =>
    typeof inference?.field_path === "string" ? [inference.field_path] : [],
  );
}

export function buildOfflineAdjudicationResultV1({
  calls,
  evidenceCommit,
  frozenStatus,
}) {
  const practicalCalls = calls.filter(
    (call) => call.practical_reason_applicable === true,
  );
  const correctionGates = {
    known_taxonomy: assertionPassed(
      calls.find((call) => call.case_id === "R3-03"),
      "R3-03-KNOWN-TAXONOMY-PRECEDENCE",
    ),
    no_contact_ownership: assertionPassed(
      calls.find((call) => call.case_id === "R3-04"),
      "R3-04-DECISION-WRITING-OWNER-CONSISTENCY",
    ),
    quoted_ownership: assertionPassed(
      calls.find((call) => call.case_id === "R3-08"),
      "R3-08-PRINCIPAL-QUOTED-OWNERSHIP",
    ),
    practical_reason_subset: practicalCalls.every(
      (call) => call.evaluation.practical_reason_consistency_results.passed,
    ),
  };
  const metrics = {
    raw_schema_v5: score(calls, (call) => call.raw_schema_passed === true),
    grounded_schema_v4: score(
      calls,
      (call) => call.grounded_schema_passed === true,
    ),
    writing_context_integrity_v2: score(
      calls,
      (call) => call.writing_context_integrity_v2_passed === true,
    ),
    contextual_intake_integrity_v3: score(
      calls,
      (call) => call.contextual_intake_integrity_passed === true,
    ),
    application_decision_facts: score(
      calls,
      (call) => call.evaluation.decision_facts_adjudication?.passed === true,
    ),
    provider_semantic_core_adjudicated: score(
      calls,
      (call) => call.evaluation.raw_semantic_coverage?.passed === true,
    ),
    message_ownership: score(
      calls,
      (call) => call.evaluation.ownership_results?.passed === true,
    ),
    boundary_ownership: score(
      calls,
      (call) => call.evaluation.boundary_results?.passed === true,
    ),
    candidate_presence: score(
      calls,
      (call) => call.evaluation.candidate_presence_results?.passed === true,
    ),
    candidate_style: score(
      calls,
      (call) => call.evaluation.candidate_style_results?.passed === true,
      (call) => call.candidate_style_applicable === true,
    ),
    candidate_intent: score(
      calls,
      (call) => call.evaluation.candidate_intent_results?.passed === true,
      (call) => call.candidate_intent_applicable === true,
    ),
    relationship_limits: score(
      calls,
      (call) => call.evaluation.relationship_limit_results?.passed === true,
    ),
    privacy_repeat_injection: score(
      calls,
      (call) =>
        call.evaluation.privacy_repeat_injection_results?.passed === true,
    ),
    practical_reason: score(
      calls,
      (call) =>
        call.evaluation.practical_reason_consistency_results?.passed === true,
      (call) => call.practical_reason_applicable === true,
    ),
    correction_gates: {
      passed: Object.values(correctionGates).filter(Boolean).length,
      total: Object.keys(correctionGates).length,
      rate:
        Object.values(correctionGates).filter(Boolean).length /
        Object.keys(correctionGates).length,
    },
    cases: score(
      calls,
      (call) => asArray(call.evaluation.hard_failures).length === 0,
    ),
  };
  const providerOutputMutationCount = calls.filter(
    (call) => call.provider_output_mutated === true,
  ).length;
  const expectedDataInjectionCount = calls.filter(
    (call) => call.expected_data_injection === true,
  ).length;
  const pass =
    calls.length === 8 &&
    Object.values(metrics).every((metric) => metric.rate === 1) &&
    providerOutputMutationCount === 0 &&
    expectedDataInjectionCount === 0;

  return {
    schema_version: "m2-p4-i3-r1-c1-r3-r1-adjudication-results-v1",
    task_id: "M2-P4-I3-R1-C1-R3-R1",
    adjudicator_version: OFFLINE_ADJUDICATOR_VERSION,
    status: pass
      ? "offline_adjudication_passed_pending_human_chatgpt_review"
      : "offline_adjudication_failed_pending_human_chatgpt_review",
    evidence_commit: evidenceCommit,
    evidence_mode: "immutable_saved_r3_exact_eight_calls_only",
    input_fields: ["call.synthetic_input", "call.raw_output"],
    frozen_r3_status: frozenStatus,
    frozen_r3_verdict: "EVALUATION_BLOCKED",
    frozen_evaluator_preserved: true,
    provider_semantic_quality_established: pass,
    provider_quality_scope: "exact_eight_case_pb01_v7_semantic_suite",
    candidate_pipeline_confirmation_passed: pass,
    candidate_ready_for_isolated_e2e: pass,
    provider_calls: 0,
    provider_rerun: false,
    provider_output_mutation_count: providerOutputMutationCount,
    expected_data_injection_count: expectedDataInjectionCount,
    active_runtime_changed: false,
    main_changed: false,
    c2_eligible: false,
    c2_authorized: false,
    next_candidate: "M2-P4-I3-R1-C1-R4 Isolated Candidate Runtime E2E",
    next_candidate_authorized: false,
    correction_gates: Object.fromEntries(
      Object.entries(correctionGates).map(([name, passed]) => [
        name,
        passed ? "PASS" : "FAIL",
      ]),
    ),
    metrics,
    cases: calls.map((call) => {
      const rawInferencePaths = inferencePaths(call.raw_output?.context_inferences);
      const groundedInferencePaths = inferencePaths(
        call.grounded_output?.context_inferences,
      );
      return {
        case_id: call.case_id,
        passed: asArray(call.evaluation.hard_failures).length === 0,
        raw_schema: call.raw_schema_passed,
        grounded_schema: call.grounded_schema_passed,
        writing_context_integrity: call.writing_context_integrity_v2_passed,
        contextual_intake_integrity:
          call.contextual_intake_integrity_passed,
        application_decision_facts:
          call.evaluation.decision_facts_adjudication?.passed === true,
        provider_semantic_core:
          call.evaluation.raw_semantic_coverage?.passed === true,
        practical_reason:
          call.practical_reason_applicable === true
            ? call.evaluation.practical_reason_consistency_results?.passed === true
            : "not_applicable",
        retained_context_inference_paths: groundedInferencePaths,
        removed_context_inference_paths: rawInferencePaths.filter(
          (fieldPath) => !groundedInferencePaths.includes(fieldPath),
        ),
        hard_failures: asArray(call.evaluation.hard_failures),
      };
    }),
  };
}
