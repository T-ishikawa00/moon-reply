import {
  aggregateUsage as aggregateLegacyUsage,
  caseFixtureOracleReferences,
  evaluateProviderCall as evaluateLegacyProviderCall,
  forbiddenBookkeepingPaths,
  probabilityConfidencePaths,
  rawPiiValues,
  secretLeakageValues,
  shaDiagnosticJson,
} from "./m2-p4-i3-r1-c1-r2-provider-evaluator-v1.mjs";

export const EVALUATOR_VERSION =
  "m2-p4-i3-r1-c1-r2-r2-provider-evaluator-v1";

export {
  caseFixtureOracleReferences,
  forbiddenBookkeepingPaths,
  probabilityConfidencePaths,
  rawPiiValues,
  secretLeakageValues,
  shaDiagnosticJson,
};

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

function sameUnorderedStrings(left, right) {
  return same(
    sortedUnique(asArray(left).filter((item) => typeof item === "string")),
    sortedUnique(asArray(right).filter((item) => typeof item === "string")),
  );
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
  return value.replace(/^R2-\d{2}/u, caseId);
}

function categoryResult(assertions, category) {
  const selected = assertions.filter((item) => item.category === category);
  return {
    passed: selected.length > 0 && selected.every((item) => item.passed),
    evidence_status: selected.length === 0 ? "unavailable" : "available",
    assertions: selected,
  };
}

function exactMessageSignals(actual, expected) {
  return (
    actual.length === expected.length &&
    expected.every(
      (item, index) =>
        actual[index]?.author === item.author &&
        item.statuses.includes(actual[index]?.status),
    )
  );
}

function exactCanonicalOwnership(actual, expected) {
  return (
    actual.length === expected.length &&
    expected.every(
      (item, index) =>
        actual[index]?.message_id ===
          "MSG" + String(index + 1).padStart(3, "0") &&
        actual[index]?.sequence === index + 1 &&
        actual[index]?.author === item.author &&
        actual[index]?.status === item.status &&
        same(actual[index]?.source_refs, item.source_refs),
    )
  );
}

function targetedAssertions(call, contract, qualityCase, baseEvaluation) {
  const caseId = call.case_id;
  const raw = call.raw_output;
  const signals = raw?.writing_signals;
  const messages = asArray(signals?.message_signals);
  const grounded = call.grounded_output;
  const ownership = asArray(grounded?.writing_context?.message_ownership);
  const constraints = asArray(signals?.explicit_user_constraints);
  const results = [
    assertion(
      caseId + "-RETURNED-MODEL-EXACT",
      "returned_model_exact",
      call.returned_model === contract.model,
      contract.model,
      call.returned_model ?? null,
      "operational",
    ),
    assertion(
      caseId + "-PROVIDER-OUTPUT-IMMUTABLE",
      "provider_output_immutability",
      call.provider_output_mutated === false &&
        call.raw_output_sha256 !== null &&
        call.raw_output_sha256 === call.raw_output_sha256_after_processing,
      {
        provider_output_mutated: false,
        hash_stable: true,
      },
      {
        provider_output_mutated: call.provider_output_mutated ?? null,
        before: call.raw_output_sha256,
        after: call.raw_output_sha256_after_processing,
      },
      "operational",
    ),
  ];

  if (caseId === "R2R2-01") {
    const kinds = constraints.map((item) => item?.kind);
    const custom = constraints.filter(
      (item) => item?.kind === "custom_explicit_constraint",
    );
    results.push(
      assertion(
        caseId + "-KNOWN-TAXONOMY-PRECEDENCE",
        "targeted_repair",
        kinds.includes("no_private_contact_at_work") && custom.length === 0,
        {
          required: "no_private_contact_at_work",
          custom_duplicate_count: 0,
        },
        {
          kinds,
          custom_constraints: custom,
        },
      ),
      assertion(
        caseId + "-WORK-ROLE-CONSISTENCY",
        "relationship_limits",
        signals?.relationship_dimensions?.hierarchy?.value ===
          "user_is_junior" &&
          signals?.relationship_dimensions?.social_role?.value ===
            "work_contact" &&
          signals?.relationship_dimensions?.communication_context?.value ===
            "work",
        {
          hierarchy: "user_is_junior",
          social_role: "work_contact",
          communication_context: "work",
        },
        {
          hierarchy:
            signals?.relationship_dimensions?.hierarchy?.value ?? null,
          social_role:
            signals?.relationship_dimensions?.social_role?.value ?? null,
          communication_context:
            signals?.relationship_dimensions?.communication_context?.value ??
            null,
        },
      ),
    );
  }

  if (caseId === "R2R2-02") {
    const rawFacts = raw?.decision_facts;
    results.push(
      assertion(
        caseId + "-DECISION-WRITING-OWNER-CONSISTENCY",
        "targeted_repair",
        rawFacts?.latest_direct_message?.sender === "other_person" &&
          rawFacts?.boundary_state?.kind === "no_contact" &&
          rawFacts?.boundary_state?.status === "explicit" &&
          messages.length === 1 &&
          messages[0]?.author === "other_person" &&
          ["incoming", "quoted_history"].includes(messages[0]?.status) &&
          signals?.incoming_message_profile?.present === true,
        {
          decision_sender: "other_person",
          boundary: "no_contact/explicit",
          writing_author: "other_person",
          incoming_present: true,
        },
        {
          decision_sender:
            rawFacts?.latest_direct_message?.sender ?? null,
          boundary:
            (rawFacts?.boundary_state?.kind ?? "unavailable") +
            "/" +
            (rawFacts?.boundary_state?.status ?? "unavailable"),
          messages,
          incoming_present:
            signals?.incoming_message_profile?.present ?? null,
        },
      ),
    );
  }

  if (caseId === "R2R2-03") {
    const sender = raw?.decision_facts?.latest_direct_message?.sender;
    const present = signals?.incoming_message_profile?.present;
    const incomingConsistent =
      sender === "other_person"
        ? present === true
        : ["none", "unknown"].includes(sender)
          ? present === false || present === "unknown"
          : false;
    const expectedOwnership = [
      {
        author: "other_person",
        status: "quoted_history",
        source_refs: ["input:current_situation"],
      },
    ];
    results.push(
      assertion(
        caseId + "-QUOTED-MESSAGE-RETAINED",
        "targeted_repair",
        exactMessageSignals(messages, [
          { author: "other_person", statuses: ["quoted_history"] },
        ]),
        [{ author: "other_person", status: "quoted_history" }],
        messages,
      ),
      assertion(
        caseId + "-INCOMING-PROFILE-CONSISTENCY",
        "message_ownership",
        incomingConsistent,
        "other_person=>true; none/unknown historical=>false/unknown",
        { latest_sender: sender ?? null, present: present ?? null },
      ),
      assertion(
        caseId + "-PRIVACY-MARKERS-UNORDERED",
        "privacy_repeat_injection",
        sameUnorderedStrings(signals?.privacy_markers, [
          "email",
          "account_identifier",
        ]),
        ["account_identifier", "email"],
        signals?.privacy_markers ?? null,
      ),
      assertion(
        caseId + "-CHANGED-FACT-IDS-UNORDERED",
        "privacy_repeat_injection",
        sameUnorderedStrings(
          signals?.repeat_consultation_state?.changed_fact_ids,
          qualityCase.changed_fact_ids,
        ),
        qualityCase.changed_fact_ids,
        signals?.repeat_consultation_state?.changed_fact_ids ?? null,
      ),
      assertion(
        caseId + "-PRINCIPAL-QUOTED-OWNERSHIP",
        "principal_quoted_ownership",
        exactCanonicalOwnership(ownership, expectedOwnership),
        expectedOwnership,
        ownership,
        "grounded",
      ),
    );
  }

  if (caseId === "R2R2-04") {
    const expectedRaw = [
      { author: "user", statuses: ["sent_by_user"] },
      { author: "other_person", statuses: ["incoming"] },
    ];
    const expectedGrounded = [
      {
        author: "user",
        status: "sent_by_user",
        source_refs: ["input:current_situation"],
      },
      {
        author: "other_person",
        status: "incoming",
        source_refs: ["input:current_situation"],
      },
      {
        author: "user",
        status: "unsent_candidate",
        source_refs: ["input:optional_message"],
      },
    ];
    results.push(
      assertion(
        caseId + "-NORMAL-OWNERSHIP-CONTROL",
        "normal_regression_control",
        exactMessageSignals(messages, expectedRaw) &&
          messages.every((item) => item?.status !== "unsent_candidate") &&
          exactCanonicalOwnership(ownership, expectedGrounded) &&
          signals?.incoming_message_profile?.present === true &&
          isObject(signals?.candidate_style_profile) &&
          isObject(signals?.candidate_communicative_intent) &&
          baseEvaluation.decision_facts_adjudication?.passed === true,
        {
          provider_order: ["sent_by_user", "incoming"],
          grounded_order: [
            "sent_by_user",
            "incoming",
            "unsent_candidate",
          ],
          incoming_present: true,
          candidate_profiles: "non-null",
          decision_policy_identical: true,
        },
        {
          provider_messages: messages,
          grounded_ownership: ownership,
          incoming_present:
            signals?.incoming_message_profile?.present ?? null,
          candidate_style_present: isObject(
            signals?.candidate_style_profile,
          ),
          candidate_intent_present: isObject(
            signals?.candidate_communicative_intent,
          ),
          decision_facts_adjudication:
            baseEvaluation.decision_facts_adjudication,
        },
        "grounded",
      ),
    );
  }
  return results;
}

function allAssertions(evaluation) {
  return [
    ...asArray(evaluation.raw_semantic_assertions),
    ...asArray(evaluation.grounded_semantic_assertions),
    ...asArray(evaluation.operational_assertions),
  ];
}

function replaceCategory(evaluation, property, category) {
  evaluation[property] = categoryResult(allAssertions(evaluation), category);
}

export function evaluateProviderCall({ call, contract, qualityCase }) {
  const legacyCall = {
    ...call,
    case_id: qualityCase.source_case_reference,
  };
  const legacyQuality = {
    ...qualityCase,
  };
  delete legacyQuality.changed_fact_ids;
  const legacyEvaluation = evaluateLegacyProviderCall({
    call: legacyCall,
    contract,
    qualityCase: legacyQuality,
  });
  const evaluation = rewriteLegacyIds(legacyEvaluation, call.case_id);
  evaluation.evaluator_version = EVALUATOR_VERSION;
  const extra = targetedAssertions(
    call,
    contract,
    qualityCase,
    evaluation,
  );
  evaluation.raw_semantic_assertions.push(
    ...extra.filter((item) => item.surface === "raw"),
  );
  evaluation.grounded_semantic_assertions.push(
    ...extra.filter((item) => item.surface === "grounded"),
  );
  evaluation.operational_assertions = extra.filter(
    (item) => item.surface === "operational",
  );
  evaluation.raw_semantic_coverage.passed =
    evaluation.raw_semantic_coverage.passed === true &&
    extra
      .filter((item) => item.surface === "raw")
      .every((item) => item.passed);

  for (const [property, category] of [
    ["ownership_results", "message_ownership"],
    ["boundary_results", "boundary_ownership"],
    ["candidate_presence_results", "candidate_presence"],
    ["candidate_style_results", "candidate_style"],
    ["candidate_intent_results", "candidate_intent"],
    ["relationship_limit_results", "relationship_limits"],
    ["privacy_repeat_injection_results", "privacy_repeat_injection"],
    ["application_grounding_results", "application_grounding"],
    ["targeted_repair_results", "targeted_repair"],
    ["normal_regression_control_results", "normal_regression_control"],
    ["principal_quoted_ownership_results", "principal_quoted_ownership"],
    ["returned_model_results", "returned_model_exact"],
    ["provider_output_immutability_results", "provider_output_immutability"],
  ]) {
    replaceCategory(evaluation, property, category);
  }

  const failedExtra = extra
    .filter((item) => item.hard && !item.passed)
    .map((item) => item.id);
  evaluation.hard_failures = sortedUnique([
    ...asArray(evaluation.hard_failures),
    ...failedExtra,
  ]);
  evaluation.targeted_repair_disposition = qualityCase.targeted_repair
    ? evaluation.hard_failures.length === 0
      ? "PASS"
      : "FAIL"
    : "NOT_APPLICABLE";
  evaluation.normal_regression_control_disposition =
    qualityCase.normal_regression_control
      ? evaluation.hard_failures.length === 0
        ? "PASS"
        : "FAIL"
      : "NOT_APPLICABLE";
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

export function aggregateUsage(calls) {
  return aggregateLegacyUsage(calls);
}

export function evaluateDiagnostic(contract, qualityContract, result) {
  const calls = asArray(result.calls);
  const qualityCases = qualityContract.cases;
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
    targeted_repairs: caseMetric(
      calls,
      qualityCases,
      (call) => asArray(call?.hard_failures).length === 0,
      (qualityCase) => qualityCase.targeted_repair === true,
    ),
    normal_regression_control: caseMetric(
      calls,
      qualityCases,
      (call) => asArray(call?.hard_failures).length === 0,
      (qualityCase) => qualityCase.normal_regression_control === true,
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
    "message_ownership",
    "boundary_ownership",
    "candidate_presence",
    "candidate_style",
    "candidate_intent",
    "relationship_limits",
    "privacy_repeat_injection",
    "application_grounding",
    "provider_output_immutability",
    "targeted_repairs",
    "normal_regression_control",
  ];
  const callsById = new Map(calls.map((call) => [call.case_id, call]));
  const principalCall = callsById.get("R2R2-03");
  const principal =
    principalCall?.principal_quoted_ownership_results?.passed === true &&
    asArray(principalCall?.hard_failures).length === 0
      ? "PASS"
      : calls.length === 0
        ? "NOT_EXECUTED"
        : "FAIL";
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
    result.provider_quality_established === false &&
    result.full_eight_case_confirmation_required === true &&
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
    verdict = operationalPass && semanticPass && principal === "PASS"
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
    targeted_repairs:
      metrics.targeted_repairs.rate === 1
        ? "PASS"
        : calls.length === 0
          ? "NOT_EXECUTED"
          : "FAIL",
    normal_regression_control:
      metrics.normal_regression_control.rate === 1
        ? "PASS"
        : calls.length === 0
          ? "NOT_EXECUTED"
          : "FAIL",
    principal_r2r2_03_quoted_ownership: principal,
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
      (call.raw_schema_passed ? "PASS" : "FAIL") +
      " | " +
      (call.grounded_schema_passed ? "PASS" : "FAIL") +
      " | " +
      (call.ownership_results?.passed ? "PASS" : "FAIL") +
      " | " +
      (call.boundary_results?.passed ? "PASS" : "FAIL") +
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
  const failures = evaluation.hard_failures?.length
    ? evaluation.hard_failures
        .map((item) => "- " + item.case_id + ": " + item.failure)
        .join("\n")
    : "- None";
  return [
    "# M2-P4-I3-R1-C1-R2-R2 Diagnostic Summary",
    "",
    "## Purpose and exact protocol",
    "",
    "This targeted repair diagnostic invokes inactive PB-01 Prompt v6 exactly once for each of four preserved synthetic AssessmentInput cases. Calls are sequential and capped at four. Retry, repair, PB-07, fallback, PB-02 through PB-06, Service, full Pipeline, DB, Supabase, holdout, and real-user data are excluded.",
    "",
    "## Result",
    "",
    "- Status: " + result.status,
    "- Targeted verdict: " + evaluation.verdict,
    "- Commit A: " + (result.package_commit ?? "unavailable"),
    "- Provider calls: " + result.calls_actual + " / " + result.calls_authorized,
    "- Completed calls: " + result.calls_completed + " / " + result.calls_authorized,
    "- Retry / repair / fallback: " + result.retry_count + " / " + result.repair_count + " / " + result.fallback_count,
    "- Targeted repairs: " + evaluation.targeted_repairs,
    "- Normal ownership regression control: " + evaluation.normal_regression_control,
    "- Principal R2R2-03 quoted ownership: " + evaluation.principal_r2r2_03_quoted_ownership,
    "- Authorization consumed: " + result.authorization_consumed,
    "- Rerun authorized: " + result.rerun_authorized,
    "- Provider quality established: false",
    "- Full eight-case confirmation required: true",
    "- Active Runtime changed: false",
    "- C2 eligible / authorized: false / false",
    "",
    "## Four cases",
    "",
    "| Case | Source | Verdict | Raw Schema v5 | Grounded Schema v4 | Ownership | Boundary |",
    "|---|---|---:|---:|---:|---:|---:|",
    ...rows,
    "",
    "## Metrics",
    "",
    "| Metric | Result | Evidence |",
    "|---|---:|---|",
    ...metrics,
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
    "Active Runtime and main remain unchanged. Even a 4/4 PASS establishes only the three targeted Prompt v6 repairs plus one selected ownership control. It does not establish all-eight quality or C2 eligibility. Human / ChatGPT review is the only next step, and no rerun is authorized.",
    "",
  ].join("\n");
}
