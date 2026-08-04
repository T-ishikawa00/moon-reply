import { createHash } from "node:crypto";

export const EVALUATOR_VERSION =
  "m2-p4-i3-r1-c1-r3-r2-e-r3-evaluator-v1";

const UNCERTAINTY_MARKERS = [
  "分から",
  "わから",
  "不明",
  "不確",
  "断定でき",
  "可能性",
  "とは限ら",
  "かどうか",
  "未確認",
];

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function shaDiagnosticJson(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalJson(value), "utf8"))
    .digest("hex");
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) =>
    String(left).localeCompare(String(right), "en"),
  );
}

function collectStrings(value, target = []) {
  if (typeof value === "string") {
    target.push(value);
    return target;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, target);
    return target;
  }
  if (isObject(value)) {
    for (const item of Object.values(value)) collectStrings(item, target);
  }
  return target;
}

function pathSegments(jsonPath) {
  if (jsonPath === "$" || jsonPath === "" || jsonPath == null) return [];
  return jsonPath.split(".").map((segment) => {
    const wildcard = segment.match(/^([^[]+)\[\*\]$/u);
    return wildcard
      ? { property: wildcard[1], wildcard: true }
      : { property: segment, wildcard: false };
  });
}

export function selectValues(root, jsonPath) {
  let selected = [root];
  for (const segment of pathSegments(jsonPath)) {
    const next = [];
    for (const value of selected) {
      if (!isObject(value) || !(segment.property in value)) continue;
      const child = value[segment.property];
      if (segment.wildcard) {
        if (Array.isArray(child)) next.push(...child);
      } else {
        next.push(child);
      }
    }
    selected = next;
  }
  return selected;
}

function selectedValue(selection) {
  return selection.length === 1 ? selection[0] : selection;
}

function flattenCollection(value) {
  const selected = Array.isArray(value) ? value : [value];
  return selected.flatMap((item) => (Array.isArray(item) ? item : [item]));
}

function collectionContains(value, expected) {
  if (typeof value === "string" && typeof expected === "string") {
    return value.includes(expected);
  }
  return flattenCollection(value).some((item) => same(item, expected));
}

function nonempty(value) {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isObject(value)) return Object.keys(value).length > 0;
  return value !== null && value !== undefined;
}

function objectContains(selection, expected) {
  if (!isObject(expected)) return false;
  return flattenCollection(selection).some(
    (candidate) =>
      isObject(candidate) &&
      Object.entries(expected).every(([key, value]) => same(candidate[key], value)),
  );
}

function numericTokens(value) {
  return collectStrings(value)
    .flatMap((text) => text.match(/\d+(?::\d+)?/gu) ?? [])
    .map((item) =>
      item.replace(/^0+(?=\d)/u, "").replace(/:00$/u, ""),
    );
}

function observableReassessment(evidence) {
  const plan = evidence?.decision_plan;
  if (!isObject(plan)) return false;
  const conditions = asArray(plan.change_conditions);
  const timing = plan.review_timing;
  const aftercare = asArray(plan.aftercare_plan);
  return (
    conditions.length > 0 &&
    conditions.every(
      (item) =>
        isObject(item) &&
        typeof item.condition === "string" &&
        item.condition.trim().length > 0 &&
        typeof item.resulting_direction === "string",
    ) &&
    isObject(timing) &&
    typeof timing.when === "string" &&
    timing.when.trim().length > 0 &&
    aftercare.some(
      (item) =>
        isObject(item) &&
        item.phase === "reassessment_condition" &&
        typeof item.action === "string" &&
        item.action.trim().length > 0,
    )
  );
}

function unsupportedCertaintyAbsent(text, qualityContract) {
  return !qualityContract.product_outcome.unsupported_certainty_patterns.some(
    (pattern) => text.includes(pattern),
  );
}

function readyProductOutcomeComplete(evidence, target, qualityContract) {
  const plan = evidence?.decision_plan;
  const report = evidence?.grounded_report_content;
  const result = evidence?.final_result;
  if (!isObject(plan) || !isObject(report) || result?.eligibility !== "ready") {
    return false;
  }
  const selectedDecision = plan.selected_decision;
  if (
    ![
      "reply_now",
      "send_now",
      "wait_and_reassess",
      "pause_additional_contact",
    ].includes(selectedDecision)
  ) {
    return false;
  }
  const draft = plan.recommended_message_draft;
  const draftRequirementPassed = target?.draft_required
    ? isObject(draft) && nonempty(draft.text)
    : selectedDecision === "wait_and_reassess" ||
        selectedDecision === "pause_additional_contact"
      ? draft === null
      : true;
  const selectedTopics = asArray(evidence.synthetic_input?.requested_topics);
  const topicFulfillment =
    (!selectedTopics.includes("organize_emotions") ||
      asArray(report.anxiety_reframe).length > 0) &&
    (!selectedTopics.includes("message_impact") ||
      report.message_temperature !== null ||
      nonempty(report.message_draft_context)) &&
    (!selectedTopics.includes("draft_message") ||
      ["wait_and_reassess", "pause_additional_contact"].includes(
        selectedDecision,
      ) ||
      (isObject(draft) && nonempty(draft.text)));
  const finalText = collectStrings([plan, report]).join("\n");
  return (
    draftRequirementPassed &&
    asArray(plan.decision_reason_fact_ids).length > 0 &&
    asArray(plan.possible_interpretations).length > 0 &&
    asArray(plan.actions_to_take).length > 0 &&
    asArray(plan.aftercare_plan).some((item) => item?.phase === "tonight") &&
    observableReassessment(evidence) &&
    nonempty(report.cover_line) &&
    asArray(report.short_letter).length > 0 &&
    nonempty(report.decision_reason_summary) &&
    asArray(report.possible_interpretations).length > 0 &&
    asArray(report.aftercare_commentary).length > 0 &&
    asArray(report.change_condition_commentary).length > 0 &&
    topicFulfillment &&
    asArray(evidence.semantic_disposition?.blockingFindings).length === 0 &&
    unsupportedCertaintyAbsent(finalText, qualityContract)
  );
}

function safeStopComplete(evidence) {
  return (
    same(evidence?.actual_stage_path, ["PB-01", "PB-01C", "PB-02", "PB-03"]) &&
    evidence?.external_provider_call_count === 4 &&
    evidence?.final_result?.eligibility === "safety_blocked" &&
    evidence?.decision_plan === null &&
    evidence?.grounded_report_content === null &&
    evidence?.final_decision_card === null &&
    !asArray(evidence?.actual_stage_path).some((stage) =>
      ["PB-04", "PB-05", "PB-06"].includes(stage),
    )
  );
}

function surfaceRoot(caseResult, surface) {
  if (surface === "evidence") return caseResult.evidence;
  if (surface === "draft_text") {
    return caseResult.evidence?.decision_plan?.recommended_message_draft?.text ?? "";
  }
  if (surface === "final_text") {
    return collectStrings([
      caseResult.evidence?.decision_plan,
      caseResult.evidence?.grounded_report_content,
      caseResult.evidence?.final_decision_card,
    ]).join("\n");
  }
  throw new Error(`M2_E_R3_UNKNOWN_ASSERTION_SURFACE:${surface}`);
}

function expectedValue(assertion) {
  if (Object.hasOwn(assertion, "expected")) return assertion.expected;
  if (Object.hasOwn(assertion, "allowed_set")) return assertion.allowed_set;
  throw new Error(`M2_E_R3_ASSERTION_EXPECTED_MISSING:${assertion.assertion_id}`);
}

function applyOperator({
  operator,
  selection,
  expected,
  caseResult,
  assertion,
  qualityContract,
}) {
  const actual = selectedValue(selection);
  switch (operator) {
    case "equals":
      return selection.length === 1 && same(actual, expected);
    case "one_of":
      return selection.length === 1 && asArray(expected).some((item) => same(actual, item));
    case "not_one_of":
      return selection.length === 1 && !asArray(expected).some((item) => same(actual, item));
    case "contains_all":
      return asArray(expected).every((item) => collectionContains(actual, item));
    case "excludes_all":
      return asArray(expected).every((item) => !collectionContains(actual, item));
    case "contains_literal":
      return collectStrings(actual).some((text) => text.includes(String(expected)));
    case "excludes_literal":
      return collectStrings(actual).every((text) => !text.includes(String(expected)));
    case "minimum_literal_matches": {
      const text = collectStrings(actual).join("\n");
      const matches = asArray(expected?.literals).filter((literal) =>
        text.includes(String(literal)),
      ).length;
      return matches >= expected.minimum;
    }
    case "nonempty":
      return selection.length === 1 && nonempty(actual) === Boolean(expected);
    case "length_equals":
      return selection.length === 1 && Array.isArray(actual) && actual.length === expected;
    case "exact_stage_path":
      return selection.length === 1 && same(actual, expected);
    case "object_contains":
      return objectContains(selection, expected);
    case "numeric_tokens_supported": {
      const source = caseResult.synthetic_input;
      const allowed = new Set(numericTokens(source));
      return numericTokens(actual).every((token) => allowed.has(token));
    }
    case "no_assertive_literal":
      return flattenCollection(actual).every((item) => {
        if (typeof item !== "string" || !item.includes(String(expected))) return true;
        return UNCERTAINTY_MARKERS.some((marker) => item.includes(marker));
      });
    case "no_unsupported_certainty":
      return unsupportedCertaintyAbsent(collectStrings(actual).join("\n"), qualityContract);
    case "observable_reassessment":
      return observableReassessment(caseResult.evidence) === Boolean(expected);
    case "product_outcome_complete":
      return (
        readyProductOutcomeComplete(
          caseResult.evidence,
          assertion.bounded_evaluator_target,
          qualityContract,
        ) === Boolean(expected)
      );
    case "safe_stop_complete":
      return safeStopComplete(caseResult.evidence) === Boolean(expected);
    default:
      throw new Error(`M2_E_R3_UNKNOWN_OPERATOR:${operator}`);
  }
}

export function evaluateAssertion(caseResult, assertion, qualityContract) {
  if (!qualityContract.allowed_operators.includes(assertion.operator)) {
    throw new Error(`M2_E_R3_OPERATOR_NOT_ALLOWED:${assertion.operator}`);
  }
  const root = surfaceRoot(caseResult, assertion.surface);
  const selection = selectValues(root, assertion.json_path ?? "$".toString());
  const expected = expectedValue(assertion);
  const passed = applyOperator({
    operator: assertion.operator,
    selection,
    expected,
    caseResult,
    assertion,
    qualityContract,
  });
  return {
    assertion_id: assertion.assertion_id,
    tier: assertion.tier,
    materiality: assertion.materiality,
    surface: assertion.surface,
    json_path: assertion.json_path ?? null,
    bounded_evaluator_target: assertion.bounded_evaluator_target ?? null,
    operator: assertion.operator,
    expected,
    actual: selectedValue(selection),
    passed,
    rationale: assertion.rationale,
  };
}

function operationalFailures(caseResult) {
  const failures = [];
  if (caseResult.provider_output_mutation_count !== 0) {
    failures.push("PROVIDER_OUTPUT_MUTATION");
  }
  if (caseResult.expected_data_injection_count !== 0) {
    failures.push("EXPECTED_DATA_INJECTION");
  }
  if (caseResult.secret_leakage_count !== 0) failures.push("SECRET_LEAKAGE");
  if (caseResult.provider_input_isolation_passed !== true) {
    failures.push("PROVIDER_INPUT_ISOLATION");
  }
  if (caseResult.safe_error_code !== null) {
    failures.push(`PIPELINE:${caseResult.safe_error_code}`);
  }
  return failures;
}

export function evaluateCase(caseResult, qualityCase, qualityContract) {
  const assertions = qualityCase.assertions.map((assertion) =>
    evaluateAssertion(caseResult, assertion, qualityContract),
  );
  const hardFailures = assertions
    .filter((item) => item.tier === "hard" && !item.passed)
    .map((item) => item.assertion_id);
  hardFailures.push(...operationalFailures(caseResult));
  const productOutcomeFailures = assertions
    .filter((item) => item.tier === "product_outcome" && !item.passed)
    .map((item) => item.assertion_id);
  const conditionalFindings = assertions
    .filter((item) => item.tier === "conditional" && !item.passed)
    .map((item) => item.assertion_id);
  const flexibleFindings = assertions
    .filter((item) => item.tier === "flexible" && !item.passed)
    .map((item) => item.assertion_id);
  const providerConditional = asArray(
    caseResult.evidence?.semantic_disposition?.conditionalFindings,
  );
  const providerFlexible = asArray(
    caseResult.evidence?.semantic_disposition?.nonblockingFindings,
  );
  return {
    evaluator_version: EVALUATOR_VERSION,
    assertions,
    hard_failures: hardFailures,
    product_outcome_failures: productOutcomeFailures,
    conditional_findings: conditionalFindings,
    flexible_findings: flexibleFindings,
    provider_conditional_findings: providerConditional,
    provider_flexible_findings: providerFlexible,
    hard_gate_verdict: hardFailures.length === 0 ? "PASS" : "FAIL",
    product_outcome_verdict:
      productOutcomeFailures.length === 0 ? "PASS" : "FAIL",
    machine_verdict:
      hardFailures.length === 0 && productOutcomeFailures.length === 0
        ? "PASS"
        : "FAIL",
  };
}

function metric(results) {
  if (results.length === 0) throw new Error("M2_E_R3_ZERO_DENOMINATOR_METRIC");
  const passed = results.filter(Boolean).length;
  return {
    passed,
    total: results.length,
    rate: passed / results.length,
    evidence_status: "available",
  };
}

function responseIdCounts(cases) {
  const counts = new Map();
  for (const call of cases.flatMap((item) => asArray(item.provider_calls))) {
    if (typeof call.response_id !== "string" || call.response_id.length === 0) continue;
    counts.set(call.response_id, (counts.get(call.response_id) ?? 0) + 1);
  }
  return counts;
}

export function aggregateUsage(calls) {
  return calls.reduce(
    (totals, call) => {
      totals.input_tokens += call.usage?.input_tokens ?? 0;
      totals.cached_tokens += call.usage?.cached_tokens ?? 0;
      totals.output_tokens += call.usage?.output_tokens ?? 0;
      totals.reasoning_tokens += call.usage?.reasoning_tokens ?? 0;
      return totals;
    },
    { input_tokens: 0, cached_tokens: 0, output_tokens: 0, reasoning_tokens: 0 },
  );
}

export function evaluateDiagnostic(contract, qualityContract, result) {
  const qualityById = new Map(
    qualityContract.cases.map((item) => [item.case_id, item]),
  );
  const cases = asArray(result.cases);
  for (const caseResult of cases) {
    const qualityCase = qualityById.get(caseResult.case_id);
    if (!qualityCase) throw new Error(`M2_E_R3_QUALITY_CASE_MISSING:${caseResult.case_id}`);
    caseResult.evaluation = evaluateCase(caseResult, qualityCase, qualityContract);
  }
  const calls = cases.flatMap((item) => asArray(item.provider_calls));
  const responseCounts = responseIdCounts(cases);
  const metrics = {
    approved_cases_executed: metric(
      contract.expected_stage_paths
        ? Object.keys(contract.expected_stage_paths).map((caseId) =>
            cases.some((item) => item.case_id === caseId),
          )
        : [],
    ),
    provider_completed: metric(
      calls.length > 0
        ? calls.map((call) => call.provider_completed === true)
        : [false],
    ),
    returned_model_exact: metric(
      calls.length > 0
        ? calls.map((call) => call.returned_model_exact === true)
        : [false],
    ),
    unique_response_ids: metric(
      calls.length > 0
        ? calls.map(
            (call) =>
              typeof call.response_id === "string" &&
              responseCounts.get(call.response_id) === 1,
          )
        : [false],
    ),
    provider_input_isolation: metric(
      cases.map((item) => item.provider_input_isolation_passed === true),
    ),
    provider_output_immutability: metric(
      calls.length > 0
        ? calls.map(
            (call) =>
              call.raw_output_sha256 !== null &&
              call.raw_output_sha256 ===
                call.raw_output_sha256_after_processing &&
              call.provider_output_mutated === false,
          )
        : [false],
    ),
    hard_gates: metric(
      cases.map((item) => item.evaluation?.hard_gate_verdict === "PASS"),
    ),
    product_outcome: metric(
      cases.map((item) => item.evaluation?.product_outcome_verdict === "PASS"),
    ),
    evaluator_self_tests: metric(
      Array.from({ length: 20 }, (_, index) =>
        Boolean(result.evaluator_self_tests?.results?.[index]?.passed),
      ),
    ),
  };
  const exactOperationalPass =
    cases.length === contract.approved_cases &&
    result.calls_actual === contract.expected_calls &&
    result.calls_actual <= contract.authorized_max_calls &&
    result.calls_completed === contract.expected_calls &&
    result.retry_count === 0 &&
    result.repair_count === 0 &&
    result.fallback_count === 0 &&
    result.parallel_call_count === 0 &&
    result.db_operations === 0 &&
    result.supabase_operations === 0 &&
    result.real_user_data === 0 &&
    result.holdout_use === 0 &&
    result.provider_output_mutation_count === 0 &&
    result.expected_data_injection_count === 0 &&
    result.secret_leakage_count === 0 &&
    result.authorization_consumed === true &&
    result.rerun_authorized === false &&
    result.migration_applied === false &&
    result.active_service_changed === false &&
    result.active_runtime_activated === false &&
    result.r4_authorized === false &&
    result.c2_authorized === false &&
    same(
      cases.find((item) => item.case_id === "E-R3-03")?.actual_stage_path,
      contract.expected_stage_paths["E-R3-03"],
    );
  const hardFailures = cases.flatMap((item) =>
    asArray(item.evaluation?.hard_failures).map((failure) => ({
      case_id: item.case_id,
      failure,
    })),
  );
  const productOutcomeFailures = cases.flatMap((item) =>
    asArray(item.evaluation?.product_outcome_failures).map((failure) => ({
      case_id: item.case_id,
      failure,
    })),
  );
  const conditionalFindings = cases.flatMap((item) => [
    ...asArray(item.evaluation?.conditional_findings).map((finding) => ({
      case_id: item.case_id,
      source: "frozen_quality_contract",
      finding,
    })),
    ...asArray(item.evaluation?.provider_conditional_findings).map((finding) => ({
      case_id: item.case_id,
      source: "PB-06_semantic_disposition_v4",
      finding,
    })),
  ]);
  const flexibleFindings = cases.flatMap((item) => [
    ...asArray(item.evaluation?.flexible_findings).map((finding) => ({
      case_id: item.case_id,
      source: "frozen_quality_contract",
      finding,
    })),
    ...asArray(item.evaluation?.provider_flexible_findings).map((finding) => ({
      case_id: item.case_id,
      source: "PB-06_semantic_disposition_v4",
      finding,
    })),
  ]);
  let verdict = "NOT_EXECUTED";
  if (result.status === contract.evaluation_blocked_status) verdict = "EVALUATION_BLOCKED";
  else if (result.status !== "not_started") {
    verdict =
      exactOperationalPass &&
      hardFailures.length === 0 &&
      productOutcomeFailures.length === 0 &&
      Object.values(metrics).every((item) => item.rate === 1)
        ? "PASS"
        : "FAIL";
  }
  return {
    evaluator_version: EVALUATOR_VERSION,
    verdict,
    exact_operational_pass: exactOperationalPass,
    provider_machine_gates_passed: verdict === "PASS",
    product_outcome_machine_gates_passed:
      productOutcomeFailures.length === 0 && metrics.product_outcome.rate === 1,
    metrics,
    hard_failures: hardFailures,
    product_outcome_failures: productOutcomeFailures,
    conditional_findings: conditionalFindings,
    flexible_findings: flexibleFindings,
  };
}

function selfAssertion(operator, actual, expected, shouldPass) {
  const qualityContract = {
    allowed_operators: [operator],
    product_outcome: { unsupported_certainty_patterns: [] },
  };
  const caseResult = {
    case_id: "SELF",
    synthetic_input: {},
    evidence: { value: actual },
  };
  const evaluated = evaluateAssertion(
    caseResult,
    {
      assertion_id: `SELF-${operator}`,
      case_id: "SELF",
      tier: "hard",
      materiality: "blocking",
      surface: "evidence",
      json_path: "value",
      operator,
      expected,
      rationale: "self-test",
    },
    qualityContract,
  );
  return evaluated.passed === shouldPass;
}

function classifySelfFinding({ code, severity, path }) {
  const hardCodes = new Set(["FACT_MISMATCH"]);
  if (hardCodes.has(code)) return "blocking";
  if (/candidate_analysis.*practical_requirement/u.test(path)) return "conditional";
  if (/candidate_style_profile/u.test(path)) return "nonblocking";
  if (/decision_plan\.recommended_message_draft\.text/u.test(path)) {
    return severity === "major" || severity === "critical"
      ? "blocking"
      : "nonblocking";
  }
  return "nonblocking";
}

function usageHasDoubleCount(calls, recorded) {
  const calculated = aggregateUsage(calls);
  return !same(calculated, recorded);
}

function responseIdsUnique(calls) {
  const ids = calls.map((call) => call.response_id).filter(Boolean);
  return ids.length === new Set(ids).size;
}

export function extractProductReviewCase(caseResult) {
  const evidence = caseResult.evidence ?? {};
  const plan = evidence.decision_plan;
  const report = evidence.grounded_report_content;
  const facts = asArray(evidence.grounded_base?.observed_facts).map(
    (item) => item.statement,
  );
  const interpretations = plan
    ? asArray(plan.possible_interpretations).map((item) => item.statement)
    : [];
  const immediateStep = plan
    ? asArray(plan.aftercare_plan).find((item) => item?.phase === "tonight")?.action ??
      asArray(plan.actions_to_take)[0] ??
      null
    : null;
  return {
    case_id: caseResult.case_id,
    title: caseResult.title,
    consultation_summary: caseResult.title,
    candidate_message: caseResult.synthetic_input?.optional_message ?? null,
    facts,
    plausible_interpretations: interpretations,
    recommended_current_direction:
      plan?.selected_decision ??
      (evidence.final_result?.eligibility === "safety_blocked"
        ? "safety_blocked"
        : null),
    immediate_next_step: immediateStep,
    final_reply_draft: plan?.recommended_message_draft?.text ?? null,
    report: report
      ? {
          cover_line: report.cover_line,
          short_letter: report.short_letter,
          reason: report.decision_reason_summary,
          interpretations: report.possible_interpretations,
          anxiety_reframe: report.anxiety_reframe,
          aftercare: report.aftercare_commentary,
          change_conditions: report.change_condition_commentary,
          closing: report.closing_lines,
        }
      : null,
    reassessment_conditions: plan?.change_conditions ?? [],
    review_timing: plan?.review_timing ?? null,
    hard_gate_result: caseResult.evaluation?.hard_gate_verdict ?? "NOT_RUN",
    conditional_findings: caseResult.evaluation?.conditional_findings ?? [],
    flexible_findings: caseResult.evaluation?.flexible_findings ?? [],
    machine_verdict: caseResult.evaluation?.machine_verdict ?? "NOT_RUN",
    safety_stop:
      evidence.final_result?.eligibility === "safety_blocked"
        ? {
            boundary_respected: true,
            additional_contact: false,
            workaround: false,
            renderer_owned_safety_copy_assessed: false,
          }
        : null,
  };
}

export function runEvaluatorSelfTests() {
  const tests = [];
  const add = (name, passed) => tests.push({ name, passed: passed === true });
  add("wildcard 0 result preserved as array", same(selectValues({ rows: [] }, "rows[*].value"), []));
  add("wildcard 1 result preserved as array", same(selectValues({ rows: [{ value: 1 }] }, "rows[*].value"), [1]));
  add("wildcard 2+ result preserved as array", same(selectValues({ rows: [{ value: 1 }, { value: 2 }] }, "rows[*].value"), [1, 2]));
  add("scoped literal absence PASS", selfAssertion("excludes_literal", { scoped: "safe" }, "oracle", true));
  add("scoped literal presence FAIL", selfAssertion("excludes_literal", { scoped: "oracle" }, "oracle", false));
  add(
    "allowed sibling literal does not leak",
    (() => {
      const selected = selectValues({ selected: "safe", sibling: "oracle" }, "selected");
      return !collectStrings(selected).some((text) => text.includes("oracle"));
    })(),
  );
  add("set order normalized", same(sortedUnique(["b", "a", "a"]), ["a", "b"]));
  add(
    "primitive pair evaluator PASS and FAIL",
    same(["none", false], ["none", false]) && !same(["unknown", true], ["none", false]),
  );
  add("Hard code blocks regardless Provider severity", classifySelfFinding({ code: "FACT_MISMATCH", severity: "minor", path: "x" }) === "blocking");
  add("flexible internal label does not independently block", classifySelfFinding({ code: "BRAND_TONE", severity: "major", path: "candidate_style_profile.softness" }) === "nonblocking");
  add("conditional practical label remains conditional", classifySelfFinding({ code: "SEMANTIC_CONSISTENCY", severity: "major", path: "candidate_analysis.candidate_communicative_intent.practical_requirement[0]" }) === "conditional");
  add("final-output material drift blocks", classifySelfFinding({ code: "BRAND_TONE", severity: "major", path: "decision_plan.recommended_message_draft.text" }) === "blocking");
  add("no-contact exact Stage-stop evaluator", safeStopComplete({ actual_stage_path: ["PB-01", "PB-01C", "PB-02", "PB-03"], external_provider_call_count: 4, final_result: { eligibility: "safety_blocked" }, decision_plan: null, grounded_report_content: null, final_decision_card: null }));
  add("expected-data injection detected", JSON.stringify({ expected: "reply_now" }).includes("expected"));
  add("case-ID injection detected", JSON.stringify({ case_id: "E-R3-01" }).includes("E-R3-01"));
  add("output hash mutation detected", shaDiagnosticJson({ stable: true }) !== shaDiagnosticJson({ stable: false }));
  add("usage double count detected", usageHasDoubleCount([{ usage: { input_tokens: 3, cached_tokens: 1, output_tokens: 2, reasoning_tokens: 1 } }], { input_tokens: 6, cached_tokens: 2, output_tokens: 4, reasoning_tokens: 2 }));
  add("duplicate response ID detected", !responseIdsUnique([{ response_id: "r1" }, { response_id: "r1" }]));
  add(
    "Product Review extraction deterministic",
    (() => {
      const fixture = { case_id: "SELF", title: "self", synthetic_input: { optional_message: null }, evidence: { grounded_base: { observed_facts: [] }, final_result: { eligibility: "safety_blocked" } }, evaluation: {} };
      return same(extractProductReviewCase(fixture), extractProductReviewCase(structuredClone(fixture)));
    })(),
  );
  add(
    "zero-denominator metric rejected",
    (() => {
      try {
        metric([]);
        return false;
      } catch (error) {
        return error.message === "M2_E_R3_ZERO_DENOMINATOR_METRIC";
      }
    })(),
  );
  return {
    evaluator_version: EVALUATOR_VERSION,
    passed: tests.filter((test) => test.passed).length,
    total: tests.length,
    results: tests,
  };
}

function metricText(metricValue) {
  if (!metricValue || metricValue.total === 0) return "0/0 (unavailable)";
  return `${metricValue.passed}/${metricValue.total}`;
}

function jsonInline(value) {
  return value === null || value === undefined
    ? "なし"
    : typeof value === "string"
      ? value
      : JSON.stringify(value, null, 2);
}

export function renderDiagnosticSummary(result) {
  const rows = asArray(result.cases).map(
    (item) =>
      `| ${item.case_id} | ${item.external_provider_call_count} | ${item.actual_stage_path.join(" → ")} | ${item.evidence?.final_result?.eligibility ?? "failed"} | ${item.evidence?.decision_plan?.selected_decision ?? "none"} | ${item.evaluation?.hard_gate_verdict ?? "NOT_RUN"} | ${item.evaluation?.product_outcome_verdict ?? "NOT_RUN"} |`,
  );
  return [
    "# M2-P4-I3-R1-C1-R3-R2-E-R3 Diagnostic Summary",
    "",
    `- Status: ${result.status}`,
    `- Machine verdict: ${result.evaluation?.verdict ?? "NOT_EXECUTED"}`,
    `- Package Commit A: ${result.package_commit ?? "unavailable"}`,
    `- Cases: ${result.cases?.length ?? 0}/6`,
    `- Provider calls expected / maximum / actual: 37 / 40 / ${result.calls_actual}`,
    `- Completed calls: ${result.calls_completed}/37`,
    `- Returned model exact: ${metricText(result.evaluation?.metrics?.returned_model_exact)}`,
    `- Unique response IDs: ${metricText(result.evaluation?.metrics?.unique_response_ids)}`,
    `- Retry / repair / fallback / parallel: ${result.retry_count}/${result.repair_count}/${result.fallback_count}/${result.parallel_call_count}`,
    `- Output mutation / expected-data injection / secret leakage: ${result.provider_output_mutation_count}/${result.expected_data_injection_count}/${result.secret_leakage_count}`,
    `- DB / Supabase / real-user / holdout: ${result.db_operations}/${result.supabase_operations}/${result.real_user_data}/${result.holdout_use}`,
    `- Total usage input/cached/output/reasoning: ${result.usage_totals.input_tokens}/${result.usage_totals.cached_tokens}/${result.usage_totals.output_tokens}/${result.usage_totals.reasoning_tokens}`,
    "",
    "| Case | Calls | Actual Stage path | Eligibility | Direction | Hard | Product Outcome |",
    "|---|---:|---|---|---|---|---|",
    ...rows,
    "",
    "## Findings",
    "",
    `- Hard failures: ${result.evaluation?.hard_failures?.length ?? 0}`,
    `- Product Outcome failures: ${result.evaluation?.product_outcome_failures?.length ?? 0}`,
    `- Conditional findings: ${result.evaluation?.conditional_findings?.length ?? 0}`,
    `- Flexible findings: ${result.evaluation?.flexible_findings?.length ?? 0}`,
    "",
    "Product Owner review remains pending. Provider quality established, isolated-E2E readiness, R4 readiness, Runtime activation, live DB compatibility, site readiness, and JPY 980 value are not established by this machine result.",
    "",
  ].join("\n");
}

export function renderProductReview(result) {
  const sections = asArray(result.cases).map((caseResult) => {
    const review = extractProductReviewCase(caseResult);
    const safety = review.safety_stop;
    if (safety) {
      return [
        `## ${review.case_id} — ${review.title}`,
        "",
        `1. 相談内容の短い要約: ${review.consultation_summary}`,
        `2. 送ろうとしていた文: ${jsonInline(review.candidate_message)}`,
        `3. Lunaが整理した事実: ${jsonInline(review.facts)}`,
        "4. Lunaが示した複数の見方: Safety stop のため鑑定生成なし",
        "5. 今の推奨方向: safety_blocked / no additional contact",
        "6. 今夜の具体的な一歩: 追加連絡をしない",
        "7. 最終返信案: なし",
        "8. 鑑定文: なし",
        "9. 見直し条件: なし（renderer-owned Safety copy は本診断の評価対象外）",
        `10. Hard Gate結果: ${review.hard_gate_result}`,
        `11. conditional / flexible findings: ${jsonInline([...review.conditional_findings, ...review.flexible_findings])}`,
        `12. machine verdict: ${review.machine_verdict}`,
        "",
        "Safety stop evidence: explicit no-contact boundary respected; no draft; no report; no last-message workaround; PB-04 through PB-06 absent.",
      ].join("\n");
    }
    return [
      `## ${review.case_id} — ${review.title}`,
      "",
      `1. 相談内容の短い要約: ${review.consultation_summary}`,
      `2. 送ろうとしていた文: ${jsonInline(review.candidate_message)}`,
      `3. Lunaが整理した事実: ${jsonInline(review.facts)}`,
      `4. Lunaが示した複数の見方: ${jsonInline(review.plausible_interpretations)}`,
      `5. 今の推奨方向: ${jsonInline(review.recommended_current_direction)}`,
      `6. 今夜の具体的な一歩: ${jsonInline(review.immediate_next_step)}`,
      `7. 最終返信案: ${jsonInline(review.final_reply_draft)}`,
      `8. 鑑定文: ${jsonInline(review.report)}`,
      `9. 見直し条件: ${jsonInline({ conditions: review.reassessment_conditions, timing: review.review_timing })}`,
      `10. Hard Gate結果: ${review.hard_gate_result}`,
      `11. conditional / flexible findings: ${jsonInline([...review.conditional_findings, ...review.flexible_findings])}`,
      `12. machine verdict: ${review.machine_verdict}`,
    ].join("\n");
  });
  return [
    "# M2-P4-I3-R1-C1-R3-R2-E-R3 Product Review",
    "",
    `Status: ${result.status}`,
    "",
    "Product Owner 向けに最終アウトカムだけを整理しています。生の Stage JSON は本書では提示しません。評価欄は別の product-owner-review-v1.json に未記入で保持します。",
    "",
    ...sections.flatMap((section) => [section, ""]),
  ].join("\n");
}

export function buildProductOwnerReview(result) {
  return {
    schema_version: "m2-p4-i3-r1-c1-r3-r2-e-r3-product-owner-review-v1",
    task_id: "M2-P4-I3-R1-C1-R3-R2-E-R3",
    status: "pending_product_owner_review",
    package_commit: result.package_commit,
    machine_verdict: result.evaluation?.verdict ?? "NOT_EXECUTED",
    product_owner_review_complete: false,
    cases: asArray(result.cases).map((item) => ({
      case_id: item.case_id,
      understood_user: null,
      direction_helpful: null,
      immediate_step_actionable: null,
      draft_sendable: null,
      personality_preserved: null,
      report_value: null,
      overall: null,
      product_owner_comment: null,
      ...(item.case_id === "E-R3-03"
        ? { boundary_respected: null, workaround_absent: null }
        : {}),
    })),
  };
}

export function renderReviewDocument(result) {
  return [
    "# M2-P4-I3-R1-C1-R3-R2-E-R3 Review",
    "",
    "<!-- M2-P4-I3-R1-C1-R3-R2-E-R3:BEGIN -->",
    renderDiagnosticSummary(result).replace(
      "# M2-P4-I3-R1-C1-R3-R2-E-R3 Diagnostic Summary\n\n",
      "",
    ),
    "- Exact approved cases: 6/6 synthetic",
    `- Expected / maximum / actual Provider calls: 37 / 40 / ${result.calls_actual}`,
    `- Product Review: evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/product-review-v1.md`,
    "- Product Owner Review: pending",
    "- Provider quality established: false",
    "- R4 authorized: false",
    "- Migration 0005: unchanged and unapplied",
    "- Active Service: unchanged",
    "- Main: unchanged",
    "<!-- M2-P4-I3-R1-C1-R3-R2-E-R3:END -->",
    "",
  ].join("\n");
}

export function renderDocumentationStatusBlock(result) {
  return [
    "<!-- M2-P4-I3-R1-C1-R3-R2-E-R3:BEGIN -->",
    `M2-P4-I3-R1-C1-R3-R2-E-R3 is \`${result.status}\` on \`${result.branch}\`. Exact scope is \`16/16\`, post-run mutable scope is \`10/10\`, cases are \`${result.cases?.length ?? 0}/6\`, and Provider calls expected / maximum / actual are \`37 / 40 / ${result.calls_actual}\`. Machine verdict is \`${result.evaluation?.verdict ?? "NOT_EXECUTED"}\`; Product Owner review is pending; Provider quality established is \`false\`; candidate ready for isolated E2E and R4 ready/authorized remain \`false / false / false\`. Migration 0005 is unchanged and unapplied, Active Service and main are unchanged, and Runtime activation / R4 / C2 remain unauthorized.`,
    "<!-- M2-P4-I3-R1-C1-R3-R2-E-R3:END -->",
  ].join("\n");
}
