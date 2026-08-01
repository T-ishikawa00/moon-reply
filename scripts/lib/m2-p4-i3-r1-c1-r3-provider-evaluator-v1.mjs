import {
  aggregateUsage as aggregateLegacyUsage,
  caseFixtureOracleReferences,
  evaluateProviderCall as evaluateR2ProviderCall,
  forbiddenBookkeepingPaths,
  probabilityConfidencePaths,
  rawPiiValues,
  secretLeakageValues,
  shaDiagnosticJson,
} from "./m2-p4-i3-r1-c1-r2-provider-evaluator-v1.mjs";
import { evaluateProviderCall as evaluateR2R2ProviderCall } from "./m2-p4-i3-r1-c1-r2-r2-provider-evaluator-v1.mjs";

export const EVALUATOR_VERSION =
  "m2-p4-i3-r1-c1-r3-provider-evaluator-v1";

export {
  caseFixtureOracleReferences,
  forbiddenBookkeepingPaths,
  probabilityConfidencePaths,
  rawPiiValues,
  secretLeakageValues,
  shaDiagnosticJson,
};

const targetedLegacyIds = new Map([
  ["R3-03", "R2R2-01"],
  ["R3-04", "R2R2-02"],
  ["R3-08", "R2R2-03"],
  ["R3-06", "R2R2-04"],
]);

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  return (
    "{" +
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right, "en"))
      .map((key) => JSON.stringify(key) + ":" + canonicalize(value[key]))
      .join(",") +
    "}"
  );
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

function rewriteLegacyIds(value, caseId) {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteLegacyIds(item, caseId));
  }
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        rewriteLegacyIds(item, caseId),
      ]),
    );
  }
  if (typeof value !== "string") return value;
  return value.replace(/^(?:R2R2-\d{2}|R2-\d{2})/u, caseId);
}

function assertion(
  id,
  category,
  passed,
  expected,
  actual,
  surface = "raw",
) {
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

function allAssertions(evaluation) {
  return [
    ...asArray(evaluation.raw_semantic_assertions),
    ...asArray(evaluation.grounded_semantic_assertions),
    ...asArray(evaluation.operational_assertions),
  ];
}

function categoryResult(assertions, category) {
  const selected = assertions.filter((item) => item.category === category);
  return {
    passed: selected.length > 0 && selected.every((item) => item.passed),
    evidence_status: selected.length === 0 ? "unavailable" : "available",
    assertions: selected,
  };
}

function replaceCategory(evaluation, property, category) {
  evaluation[property] = categoryResult(allAssertions(evaluation), category);
}

function practicalReasonAssertion(call, qualityCase) {
  if (qualityCase.practical_reason_consistency !== true) return null;
  const expected = qualityCase.decision_fact_subset?.practical_reason;
  const rawFacts = call.raw_output?.decision_facts;
  const groundedFacts = call.grounded_output?.decision_facts;
  const actualKind = groundedFacts?.latest_direct_message?.kind;
  const scheduleKindPass =
    expected?.kind !== "schedule_coordination" ||
    ["question", "schedule_coordination"].includes(actualKind);
  return assertion(
    call.case_id + "-PRACTICAL-REASON-CONSISTENCY",
    "practical_reason_consistency",
    isObject(expected) &&
      same(rawFacts?.practical_reason, expected) &&
      same(groundedFacts?.practical_reason, expected) &&
      call.decision_facts_adjudication?.passed === true &&
      scheduleKindPass,
    {
      raw: expected,
      grounded: expected,
      schedule_latest_kind: expected?.kind === "schedule_coordination"
        ? ["question", "schedule_coordination"]
        : "not_applicable",
      application_decision_facts: "PASS",
    },
    {
      raw: rawFacts?.practical_reason ?? null,
      grounded: groundedFacts?.practical_reason ?? null,
      latest_kind: actualKind ?? null,
      application_decision_facts:
        call.decision_facts_adjudication?.passed ?? false,
    },
    "grounded",
  );
}

function operationalAssertions(call, contract) {
  return [
    assertion(
      call.case_id + "-RETURNED-MODEL-EXACT",
      "returned_model_exact",
      call.returned_model === contract.model,
      contract.model,
      call.returned_model ?? null,
      "operational",
    ),
    assertion(
      call.case_id + "-PROVIDER-OUTPUT-IMMUTABLE",
      "provider_output_immutability",
      call.provider_output_mutated === false &&
        call.raw_output_sha256 !== null &&
        call.raw_output_sha256 === call.raw_output_sha256_after_processing,
      { provider_output_mutated: false, hash_stable: true },
      {
        provider_output_mutated: call.provider_output_mutated ?? null,
        before: call.raw_output_sha256,
        after: call.raw_output_sha256_after_processing,
      },
      "operational",
    ),
  ];
}

export function evaluateProviderCall({ call, contract, qualityCase }) {
  const targetedId = targetedLegacyIds.get(call.case_id);
  let baseEvaluation;
  if (targetedId) {
    baseEvaluation = evaluateR2R2ProviderCall({
      call: { ...call, case_id: targetedId },
      contract,
      qualityCase: { ...qualityCase, case_id: targetedId },
    });
  } else {
    baseEvaluation = evaluateR2ProviderCall({
      call: { ...call, case_id: qualityCase.source_case_reference },
      contract,
      qualityCase: {
        ...qualityCase,
        case_id: qualityCase.source_case_reference,
      },
    });
  }

  const evaluation = rewriteLegacyIds(baseEvaluation, call.case_id);
  evaluation.evaluator_version = EVALUATOR_VERSION;
  evaluation.operational_assertions = asArray(
    evaluation.operational_assertions,
  );

  const existingOperationalIds = new Set(
    evaluation.operational_assertions.map((item) => item.id),
  );
  evaluation.operational_assertions.push(
    ...operationalAssertions(call, contract).filter(
      (item) => !existingOperationalIds.has(item.id),
    ),
  );
  const practical = practicalReasonAssertion(
    { ...call, decision_facts_adjudication: evaluation.decision_facts_adjudication },
    qualityCase,
  );
  if (practical) evaluation.grounded_semantic_assertions.push(practical);

  for (const [property, category] of [
    ["ownership_results", "message_ownership"],
    ["boundary_results", "boundary_ownership"],
    ["candidate_presence_results", "candidate_presence"],
    ["candidate_style_results", "candidate_style"],
    ["candidate_intent_results", "candidate_intent"],
    ["relationship_limit_results", "relationship_limits"],
    ["privacy_repeat_injection_results", "privacy_repeat_injection"],
    ["application_grounding_results", "application_grounding"],
    ["targeted_correction_results", "targeted_repair"],
    ["normal_regression_control_results", "normal_regression_control"],
    ["principal_quoted_ownership_results", "principal_quoted_ownership"],
    ["practical_reason_consistency_results", "practical_reason_consistency"],
    ["returned_model_results", "returned_model_exact"],
    ["provider_output_immutability_results", "provider_output_immutability"],
  ]) {
    replaceCategory(evaluation, property, category);
  }

  const extraFailures = allAssertions(evaluation)
    .filter((item) => item.hard && !item.passed)
    .map((item) => item.id);
  evaluation.hard_failures = sortedUnique([
    ...asArray(evaluation.hard_failures),
    ...extraFailures,
  ]);
  return evaluation;
}

function score(items) {
  const passed = items.filter((item) => item.passed === true).length;
  const total = items.length;
  return {
    passed,
    total,
    rate: total === 0 ? null : passed / total,
    evidence_status: total === 0 ? "unavailable" : "available",
  };
}

function caseMetric(calls, qualityCases, selector, applicability = () => true) {
  const callsById = new Map(calls.map((call) => [call.case_id, call]));
  return score(
    qualityCases.filter(applicability).map((qualityCase) => ({
      passed: selector(callsById.get(qualityCase.case_id), qualityCase) === true,
    })),
  );
}

function assertionPassed(call, id) {
  return [
    ...asArray(call?.raw_semantic_assertions),
    ...asArray(call?.grounded_semantic_assertions),
    ...asArray(call?.operational_assertions),
  ].some((item) => item.id === id && item.passed === true);
}

function gateStatus(passed, calls) {
  if (calls.length === 0) return "NOT_EXECUTED";
  return passed ? "PASS" : "FAIL";
}

export function aggregateUsage(calls) {
  return aggregateLegacyUsage(calls);
}

export function evaluateDiagnostic(contract, qualityContract, result) {
  const calls = asArray(result.calls);
  const qualityCases = qualityContract.cases;
  const callsById = new Map(calls.map((call) => [call.case_id, call]));
  const knownTaxonomy = assertionPassed(
    callsById.get("R3-03"),
    "R3-03-KNOWN-TAXONOMY-PRECEDENCE",
  );
  const noContactOwnership = assertionPassed(
    callsById.get("R3-04"),
    "R3-04-DECISION-WRITING-OWNER-CONSISTENCY",
  );
  const quotedOwnership = assertionPassed(
    callsById.get("R3-08"),
    "R3-08-PRINCIPAL-QUOTED-OWNERSHIP",
  );
  const practicalCalls = qualityCases.filter(
    (item) => item.practical_reason_consistency === true,
  );
  const practicalReasonConsistency =
    practicalCalls.length === 4 &&
    practicalCalls.every(
      (item) =>
        callsById.get(item.case_id)?.practical_reason_consistency_results
          ?.passed === true,
    );
  const correctionGateBooleans = [
    knownTaxonomy,
    noContactOwnership,
    quotedOwnership,
    practicalReasonConsistency,
  ];

  const metrics = {
    provider_transport: caseMetric(
      calls,
      qualityCases,
      (call) => call?.provider_completed === true,
    ),
    returned_model_exact: caseMetric(
      calls,
      qualityCases,
      (call) => call?.returned_model === contract.model,
    ),
    raw_json_parse: caseMetric(
      calls,
      qualityCases,
      (call) => call?.raw_json_parse === true,
    ),
    raw_schema_v5: caseMetric(
      calls,
      qualityCases,
      (call) => call?.raw_schema_passed === true,
    ),
    grounded_schema_v4: caseMetric(
      calls,
      qualityCases,
      (call) => call?.grounded_schema_passed === true,
    ),
    writing_context_integrity_v2: caseMetric(
      calls,
      qualityCases,
      (call) => call?.writing_context_integrity_v2_passed === true,
    ),
    contextual_intake_integrity: caseMetric(
      calls,
      qualityCases,
      (call) => call?.contextual_intake_integrity_passed === true,
    ),
    application_decision_facts: caseMetric(
      calls,
      qualityCases,
      (call) => call?.decision_facts_adjudication?.passed === true,
    ),
    provider_semantic_core: caseMetric(
      calls,
      qualityCases,
      (call) => call?.evaluation?.raw_semantic_coverage?.passed === true,
    ),
    forbidden_bookkeeping: caseMetric(
      calls,
      qualityCases,
      (call) => call?.forbidden_bookkeeping_count === 0,
    ),
    probability_confidence_fields: caseMetric(
      calls,
      qualityCases,
      (call) => call?.probability_confidence_field_count === 0,
    ),
    case_fixture_oracle_references: caseMetric(
      calls,
      qualityCases,
      (call) => call?.case_fixture_oracle_reference_count === 0,
    ),
    raw_pii_copied: caseMetric(
      calls,
      qualityCases,
      (call) => call?.raw_pii_copied_count === 0,
    ),
    secret_leakage: caseMetric(
      calls,
      qualityCases,
      (call) => call?.secret_leakage_count === 0,
    ),
    message_ownership: caseMetric(
      calls,
      qualityCases,
      (call) => call?.ownership_results?.passed === true,
    ),
    boundary_ownership: caseMetric(
      calls,
      qualityCases,
      (call) => call?.boundary_results?.passed === true,
    ),
    candidate_presence: caseMetric(
      calls,
      qualityCases,
      (call) => call?.candidate_presence_results?.passed === true,
    ),
    candidate_style: caseMetric(
      calls,
      qualityCases,
      (call) => call?.candidate_style_results?.passed === true,
      (qualityCase) => qualityCase.candidate_style !== null,
    ),
    candidate_intent: caseMetric(
      calls,
      qualityCases,
      (call) => call?.candidate_intent_results?.passed === true,
      (qualityCase) => qualityCase.candidate_intent !== null,
    ),
    relationship_limits: caseMetric(
      calls,
      qualityCases,
      (call) => call?.relationship_limit_results?.passed === true,
    ),
    privacy_repeat_injection: caseMetric(
      calls,
      qualityCases,
      (call) => call?.privacy_repeat_injection_results?.passed === true,
    ),
    application_grounding: caseMetric(
      calls,
      qualityCases,
      (call) => call?.application_grounding_results?.passed === true,
    ),
    provider_output_immutability: caseMetric(
      calls,
      qualityCases,
      (call) =>
        call?.provider_output_mutated === false &&
        call?.raw_output_sha256 === call?.raw_output_sha256_after_processing,
    ),
    practical_reason_consistency: caseMetric(
      calls,
      qualityCases,
      (call) => call?.practical_reason_consistency_results?.passed === true,
      (qualityCase) => qualityCase.practical_reason_consistency === true,
    ),
    targeted_correction_gates: score(
      correctionGateBooleans.map((passed) => ({ passed })),
    ),
    soft_style_assertions: score(
      calls.flatMap((call) => asArray(call.soft_assertions)),
    ),
  };

  const hardMetricNames = [
    "provider_transport",
    "returned_model_exact",
    "raw_json_parse",
    "raw_schema_v5",
    "grounded_schema_v4",
    "writing_context_integrity_v2",
    "contextual_intake_integrity",
    "application_decision_facts",
    "provider_semantic_core",
    "forbidden_bookkeeping",
    "probability_confidence_fields",
    "case_fixture_oracle_references",
    "raw_pii_copied",
    "secret_leakage",
    "message_ownership",
    "boundary_ownership",
    "candidate_presence",
    "candidate_style",
    "candidate_intent",
    "relationship_limits",
    "privacy_repeat_injection",
    "application_grounding",
    "provider_output_immutability",
    "practical_reason_consistency",
    "targeted_correction_gates",
  ];
  const operationalPass =
    result.calls_actual === contract.authorized_calls &&
    result.calls_completed === contract.authorized_calls &&
    result.retry_count === 0 &&
    result.repair_count === 0 &&
    result.fallback_count === 0 &&
    result.pb_02_through_pb_06_calls === 0 &&
    result.db_operations === 0 &&
    result.supabase_operations === 0 &&
    result.holdout_use === 0 &&
    result.real_user_data === 0 &&
    result.active_runtime_changed === false &&
    result.authorization_consumed === true &&
    result.rerun_authorized === false &&
    result.c2_authorized === false &&
    calls.reduce(
      (total, call) => total + (call.secret_leakage_count ?? 0),
      0,
    ) === 0 &&
    calls.reduce(
      (total, call) => total + (call.provider_output_mutated ? 1 : 0),
      0,
    ) === 0;
  const semanticPass = hardMetricNames.every(
    (metricName) => metrics[metricName].rate === 1,
  );
  let verdict;
  if (result.status === "not_executed") {
    verdict = "NOT_EXECUTED";
  } else if (result.status === "running") {
    verdict = "NOT_COMPLETE";
  } else if (
    result.status === "evaluation_blocked_pending_human_chatgpt_review"
  ) {
    verdict = "EVALUATION_BLOCKED";
  } else {
    verdict = operationalPass && semanticPass && quotedOwnership
      ? "PASS"
      : "FAIL";
  }
  const casePassCount = calls.filter(
    (call) => asArray(call.hard_failures).length === 0,
  ).length;
  return {
    evaluator_version: EVALUATOR_VERSION,
    verdict,
    case_pass_count: casePassCount,
    case_count: qualityCases.length,
    metrics,
    correction_gates: {
      known_taxonomy: gateStatus(knownTaxonomy, calls),
      no_contact_ownership: gateStatus(noContactOwnership, calls),
      quoted_ownership: gateStatus(quotedOwnership, calls),
      practical_reason_consistency: gateStatus(
        practicalReasonConsistency,
        calls,
      ),
    },
    principal_r3_08_quoted_ownership: gateStatus(quotedOwnership, calls),
    hard_failures: calls.flatMap((call) =>
      asArray(call.hard_failures).map((failure) => ({
        case_id: call.case_id,
        failure,
      })),
    ),
    soft_findings: calls.flatMap((call) =>
      asArray(call.soft_findings).map((finding) => ({
        case_id: call.case_id,
        finding,
      })),
    ),
  };
}

function metricText(metric) {
  if (!metric || metric.total === 0) return "0/0 (unavailable)";
  return String(metric.passed) + "/" + String(metric.total);
}

function passText(value) {
  return value === true ? "PASS" : "FAIL";
}

export function renderDiagnosticSummary(result) {
  const evaluation = result.evaluation;
  const rows = asArray(result.calls).map((call) => {
    const verdict = asArray(call.hard_failures).length === 0 ? "PASS" : "FAIL";
    return (
      "| " +
      call.case_id +
      " | " +
      call.source_case_reference +
      " | " +
      verdict +
      " | " +
      passText(call.raw_schema_passed) +
      " | " +
      passText(call.grounded_schema_passed) +
      " | " +
      passText(call.writing_context_integrity_v2_passed) +
      " | " +
      passText(call.decision_facts_adjudication?.passed) +
      " | " +
      passText(call.evaluation?.raw_semantic_coverage?.passed) +
      " | " +
      passText(call.ownership_results?.passed) +
      " | " +
      passText(call.boundary_results?.passed) +
      " | " +
      passText(call.candidate_presence_results?.passed) +
      " |"
    );
  });
  const metrics = Object.entries(evaluation.metrics ?? {}).map(
    ([name, metric]) =>
      "| " +
      name +
      " | " +
      metricText(metric) +
      " | " +
      (metric?.evidence_status ?? "unavailable") +
      " |",
  );
  const corrections = Object.entries(evaluation.correction_gates ?? {}).map(
    ([name, verdict]) => "| " + name + " | " + verdict + " |",
  );
  const failures = evaluation.hard_failures?.length
    ? evaluation.hard_failures
        .map((item) => "- " + item.case_id + ": " + item.failure)
        .join("\n")
    : "- None";
  return [
    "# M2-P4-I3-R1-C1-R3 Diagnostic Summary",
    "",
    "## Purpose and exact protocol",
    "",
    "This final confirmation invokes inactive PB-01 Prompt v7 exactly once for each of eight preserved synthetic AssessmentInput cases. Calls are sequential and capped at eight. Retry, repair, PB-07, fallback, PB-02 through PB-06, Service, full Pipeline, DB, Supabase, holdout, and real-user data are excluded.",
    "",
    "## Result",
    "",
    "- Status: " + result.status,
    "- Final confirmation verdict: " + evaluation.verdict,
    "- Commit A: " + (result.package_commit ?? "unavailable"),
    "- Provider calls: " + result.calls_actual + " / " + result.calls_authorized,
    "- Completed calls: " + result.calls_completed + " / " + result.calls_authorized,
    "- Retry / repair / fallback: " + result.retry_count + " / " + result.repair_count + " / " + result.fallback_count,
    "- Cases passed: " + evaluation.case_pass_count + "/" + evaluation.case_count,
    "- Principal R3-08 quoted ownership: " + evaluation.principal_r3_08_quoted_ownership,
    "- Authorization consumed: " + result.authorization_consumed,
    "- Rerun authorized: " + result.rerun_authorized,
    "- Provider quality established: " + result.provider_quality_established,
    "- Provider quality scope: " + result.provider_quality_scope,
    "- Candidate ready for isolated E2E: " + result.candidate_ready_for_isolated_e2e,
    "- Active Runtime changed: false",
    "- C2 eligible / authorized: false / false",
    "",
    "## Eight cases",
    "",
    "| Case | Source | Verdict | Raw v5 | Grounded v4 | Integrity v2 | Decision Facts | Semantic core | Ownership | Boundary | Candidate |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...rows,
    "",
    "## Metrics",
    "",
    "| Metric | Result | Evidence |",
    "|---|---:|---|",
    ...metrics,
    "",
    "## Four correction gates",
    "",
    "| Gate | Verdict |",
    "|---|---:|",
    ...corrections,
    "",
    "## Remaining hard failures",
    "",
    failures,
    "",
    "## Usage totals",
    "",
    "- Input tokens: " + result.usage_totals.input_tokens,
    "- Cached input tokens: " + result.usage_totals.cached_tokens,
    "- Output tokens: " + result.usage_totals.output_tokens,
    "- Reasoning tokens: " + result.usage_totals.reasoning_tokens,
    "",
    "## Runtime and next step",
    "",
    "Active Runtime and main remain unchanged. A PASS establishes Provider quality only for the exact eight-case PB-01 v7 suite and makes the candidate ready for a separately authorized isolated Runtime E2E. C2 remains unauthorized. Human / ChatGPT review is the only authorized next step, and no rerun is authorized.",
    "",
  ].join("\n");
}
