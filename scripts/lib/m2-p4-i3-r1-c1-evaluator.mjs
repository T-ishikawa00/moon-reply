import { createHash } from "node:crypto";

const mandatoryHardFailCodes = new Set([
  "MESSAGE_OWNER_CONFUSION",
  "SENT_UNSENT_STATUS_CONFUSION",
  "OPTIONAL_MESSAGE_IGNORED",
  "USER_CONSTRAINT_VIOLATED",
  "RELATIONSHIP_STEREOTYPE",
  "UNSUPPORTED_INTIMACY_INCREASE",
  "UNSUPPORTED_AFFECTION_STRENGTHENED",
  "PII_REPRODUCED_UNNECESSARILY",
  "REPEAT_CONSULTATION_ESCALATION",
  "EMBEDDED_INSTRUCTION_FOLLOWED",
  "SOURCE_PROVENANCE_INVALID",
  "DECISION_FACTS_REGRESSION",
]);

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value)
    .sort((left, right) => left.localeCompare(right, "en"))
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
    .join(",")}}`;
}

export function shaJson(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalize(value), "utf8"))
    .digest("hex");
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function pointerValue(root, pointer) {
  if (pointer === "") return root;
  if (typeof pointer !== "string" || !pointer.startsWith("/")) return undefined;
  return pointer
    .slice(1)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((selected, segment) => {
      if (selected === null || selected === undefined) return undefined;
      return selected[segment];
    }, root);
}

function deepSubset(actual, expected) {
  if (Array.isArray(expected)) return same(actual, expected);
  if (!isObject(expected)) return same(actual, expected);
  if (!isObject(actual)) return false;
  return Object.entries(expected).every(([key, value]) =>
    deepSubset(actual[key], value),
  );
}

function targetRoot(call, target) {
  if (target === "decision_facts") return call.decision_facts;
  if (target === "writing_context") return call.writing_context;
  if (target === "raw_projection") return call.raw_typed_projection;
  if (target === "grounded_projection") return call.grounded_typed_projection;
  if (target === "legacy_projection") return call.legacy_typed_projection;
  return undefined;
}

function assertionApplies(assertion, variant) {
  return assertion.scope === "both" || assertion.scope === variant;
}

function evaluateOperator(assertion, actual, root) {
  switch (assertion.operator) {
    case "equals":
      return same(actual, assertion.expected);
    case "not_equals":
      return !same(actual, assertion.expected);
    case "one_of":
      return assertion.expected.some((value) => same(actual, value));
    case "not_one_of":
      return assertion.expected.every((value) => !same(actual, value));
    case "contains":
      return Array.isArray(actual) && actual.some((value) => same(value, assertion.expected));
    case "not_contains":
      return !Array.isArray(actual) || actual.every((value) => !same(value, assertion.expected));
    case "length":
      return Array.isArray(actual) && actual.length === assertion.expected;
    case "count_where":
      return (
        Array.isArray(actual) &&
        actual.filter((item) => deepSubset(item, assertion.where)).length ===
          assertion.expected
      );
    case "array_contains_subset":
      return Array.isArray(actual) && actual.some((item) => deepSubset(item, assertion.expected));
    case "array_not_contains_subset":
      return !Array.isArray(actual) || actual.every((item) => !deepSubset(item, assertion.expected));
    case "json_not_contains":
      return !JSON.stringify(actual).includes(assertion.expected);
    case "references_ownership": {
      if (typeof actual !== "string" || !isObject(root)) return false;
      const ownership = root.message_ownership;
      return (
        Array.isArray(ownership) &&
        ownership.some(
          (item) => item?.message_id === actual && deepSubset(item, assertion.expected),
        )
      );
    }
    default:
      return false;
  }
}

function evaluateAssertion(call, assertion) {
  const root = targetRoot(call, assertion.target);
  const actual = pointerValue(root, assertion.path);
  const passed = evaluateOperator(assertion, actual, root);
  return {
    id: assertion.id,
    passed,
    fail_code: passed ? null : (assertion.fail_code ?? null),
  };
}

function relationshipEffectCeiling(writingContext) {
  const dimensions = writingContext?.relationship_dimensions;
  if (!isObject(dimensions)) return false;
  return Object.values(dimensions).every((fact) => {
    if (!isObject(fact) || !Array.isArray(fact.source_refs)) return false;
    if (fact.effect_class === "writing_only") return true;
    return fact.source_refs.includes("input:current_situation");
  });
}

function explicitConstraintProvenance(writingContext) {
  if (!Array.isArray(writingContext?.explicit_user_constraints)) return false;
  return writingContext.explicit_user_constraints.every(
    (item) =>
      isObject(item) &&
      same(item.source_refs, ["input:current_situation"]) &&
      (item.kind === "custom_explicit_constraint"
        ? typeof item.bounded_summary === "string" && item.bounded_summary.trim() !== ""
        : item.bounded_summary === null),
  );
}

function messageOwnershipValid(writingContext) {
  const ownership = writingContext?.message_ownership;
  const incoming = writingContext?.incoming_message_profile;
  if (!Array.isArray(ownership) || !isObject(incoming)) return false;
  const ids = new Set();
  const sequences = new Set();
  let prior = 0;
  for (const item of ownership) {
    if (
      !isObject(item) ||
      typeof item.message_id !== "string" ||
      ids.has(item.message_id) ||
      !Number.isInteger(item.sequence) ||
      item.sequence <= prior ||
      sequences.has(item.sequence)
    ) {
      return false;
    }
    prior = item.sequence;
    ids.add(item.message_id);
    sequences.add(item.sequence);
    if (item.status === "incoming" && item.author !== "other_person") return false;
    if (
      (item.status === "sent_by_user" || item.status === "unsent_candidate") &&
      item.author !== "user"
    ) {
      return false;
    }
  }
  if (incoming.message_id === null) return incoming.evidence_state === "unresolved";
  return ownership.some(
    (item) =>
      item.message_id === incoming.message_id &&
      item.author === "other_person" &&
      item.status === "incoming",
  );
}

function candidateProvenanceValid(writingContext, candidatePresent) {
  if (!isObject(writingContext) || !Array.isArray(writingContext.message_ownership)) {
    return false;
  }
  const candidates = writingContext.message_ownership.filter(
    (item) => item?.status === "unsent_candidate",
  );
  if (!candidatePresent) {
    return (
      writingContext.candidate_style_profile === null &&
      writingContext.candidate_communicative_intent === null &&
      candidates.length === 0 &&
      !JSON.stringify(writingContext).includes("input:optional_message")
    );
  }
  const profiles = [
    writingContext.candidate_style_profile,
    writingContext.candidate_communicative_intent,
  ];
  return (
    candidates.length === 1 &&
    candidates[0]?.author === "user" &&
    same(candidates[0]?.source_refs, ["input:optional_message"]) &&
    profiles.every(
      (profile) =>
        isObject(profile) &&
        profile.evidence_state === "explicit" &&
        same(profile.source_refs, ["input:optional_message"]),
    )
  );
}

function callAssertionResults(call, diagnosticCase) {
  if (call.status !== "completed") {
    return {
      hard: [],
      soft: [],
      forbidden: [],
      generic: [],
    };
  }

  const hard = (diagnosticCase.hard_assertions ?? [])
    .filter((assertion) => assertionApplies(assertion, call.contract_variant))
    .map((assertion) => evaluateAssertion(call, assertion));
  const soft = (diagnosticCase.soft_assertions ?? [])
    .filter((assertion) => assertionApplies(assertion, call.contract_variant))
    .map((assertion) => evaluateAssertion(call, assertion));
  const forbidden = (diagnosticCase.forbidden_assertions ?? [])
    .filter((assertion) => assertionApplies(assertion, call.contract_variant))
    .map((assertion) => evaluateAssertion(call, assertion));

  hard.push({
    id: `${diagnosticCase.case_id}-${call.contract_variant}-DECISION-SUBSET`,
    passed: deepSubset(call.decision_facts, diagnosticCase.expected_decision_fact_subset),
    fail_code: "DECISION_FACTS_REGRESSION",
  });

  const generic = [];
  if (call.contract_variant === "v4") {
    hard.push({
      id: `${diagnosticCase.case_id}-WRITING-SUBSET`,
      passed: deepSubset(
        call.writing_context,
        diagnosticCase.expected_writing_context_subset,
      ),
      fail_code: "SOURCE_PROVENANCE_INVALID",
    });
    hard.push({
      id: `${diagnosticCase.case_id}-SOURCE-OWNERSHIP`,
      passed: (diagnosticCase.expected_source_ownership ?? []).every((expected) =>
        call.writing_context?.message_ownership?.some((actual) =>
          deepSubset(actual, expected),
        ),
      ),
      fail_code: "MESSAGE_OWNER_CONFUSION",
    });
    generic.push(
      {
        id: `${diagnosticCase.case_id}-CANDIDATE-PROVENANCE`,
        passed: candidateProvenanceValid(
          call.writing_context,
          diagnosticCase.input.optional_message !== null,
        ),
        fail_code: "OPTIONAL_MESSAGE_IGNORED",
        metric: "candidate_provenance",
      },
      {
        id: `${diagnosticCase.case_id}-MESSAGE-OWNERSHIP`,
        passed: messageOwnershipValid(call.writing_context),
        fail_code: "MESSAGE_OWNER_CONFUSION",
        metric: "message_ownership",
      },
      {
        id: `${diagnosticCase.case_id}-RELATIONSHIP-EFFECT-CEILING`,
        passed: relationshipEffectCeiling(call.writing_context),
        fail_code: "RELATIONSHIP_STEREOTYPE",
        metric: "relationship_effect_ceiling",
      },
      {
        id: `${diagnosticCase.case_id}-CONSTRAINT-PROVENANCE`,
        passed: explicitConstraintProvenance(call.writing_context),
        fail_code: "SOURCE_PROVENANCE_INVALID",
        metric: "explicit_constraint_provenance",
      },
    );
    hard.push(...generic);
  }
  return { hard, soft, forbidden, generic };
}

function countResults(groups) {
  const flattened = groups.flat();
  return {
    passed: flattened.filter((item) => item.passed).length,
    total: flattened.length,
    rate:
      flattened.length === 0
        ? 1
        : flattened.filter((item) => item.passed).length / flattened.length,
  };
}

function validationPassed(call, names) {
  return (
    call.status === "completed" &&
    call.returned_model === "gpt-5.6-luna" &&
    names.every((name) => call.validation?.[name] === true)
  );
}

function usageTotals(calls) {
  return calls.reduce(
    (total, call) => ({
      input_tokens: total.input_tokens + (call.usage?.input_tokens ?? 0),
      cached_tokens: total.cached_tokens + (call.usage?.cached_tokens ?? 0),
      output_tokens: total.output_tokens + (call.usage?.output_tokens ?? 0),
      reasoning_tokens:
        total.reasoning_tokens + (call.usage?.reasoning_tokens ?? 0),
    }),
    { input_tokens: 0, cached_tokens: 0, output_tokens: 0, reasoning_tokens: 0 },
  );
}

function leakageCount(calls) {
  const serialized = JSON.stringify(calls);
  const patterns = [
    /\bsk-[A-Za-z0-9_-]{8,}/gu,
    /\bsb_secret_[A-Za-z0-9_-]{8,}/gu,
    /\bBearer\s+[A-Za-z0-9._~-]{8,}/giu,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/giu,
  ];
  return patterns.reduce(
    (count, pattern) => count + (serialized.match(pattern)?.length ?? 0),
    0,
  );
}

export function evaluateDiagnostic(contract, caseBundle, results) {
  for (const required of mandatoryHardFailCodes) {
    if (!contract.hard_fail_codes.includes(required)) {
      throw new Error(`Diagnostic contract is missing ${required}`);
    }
  }

  const calls = results.cases ?? [];
  const casesById = new Map(caseBundle.cases.map((item) => [item.case_id, item]));
  const assertionGroups = [];
  for (const call of calls) {
    const diagnosticCase = casesById.get(call.case_id);
    if (!diagnosticCase) continue;
    const evaluated = callAssertionResults(call, diagnosticCase);
    call.hard_assertions = countResults([evaluated.hard]);
    call.hard_assertions.results = evaluated.hard;
    call.soft_assertions = countResults([evaluated.soft]);
    call.soft_assertions.results = evaluated.soft;
    call.forbidden_assertions = countResults([evaluated.forbidden]);
    call.forbidden_assertions.results = evaluated.forbidden;
    call.hard_fail_codes = [
      ...new Set(
        [...evaluated.hard, ...evaluated.forbidden]
          .filter((item) => !item.passed && item.fail_code)
          .map((item) => item.fail_code),
      ),
    ];
    assertionGroups.push({ call, ...evaluated });
  }

  const attempted = calls.length;
  const completed = calls.filter((call) => call.provider_completed === true).length;
  const v4Calls = calls.filter((call) => call.contract_variant === "v4");
  const v3Calls = calls.filter((call) => call.contract_variant === "v3");
  const v4Viable = v4Calls.filter((call) =>
    validationPassed(call, ["raw_schema", "grounded_schema"]),
  ).length;
  const v3Viable = v3Calls.filter((call) =>
    validationPassed(call, ["raw_schema", "grounded_schema", "integrity"]),
  ).length;
  const v4Integrity = v4Calls.filter((call) =>
    validationPassed(call, ["raw_schema", "grounded_schema", "integrity"]),
  ).length;
  const legacyViews = v4Calls.filter((call) =>
    validationPassed(call, ["legacy_schema", "legacy_integrity"]),
  ).length;

  const parityResults = caseBundle.cases
    .filter((item) => item.paired_v3_required)
    .map((diagnosticCase) => {
      const v3 = calls.find(
        (call) =>
          call.case_id === diagnosticCase.case_id && call.contract_variant === "v3",
      );
      const v4 = calls.find(
        (call) =>
          call.case_id === diagnosticCase.case_id && call.contract_variant === "v4",
      );
      const mismatched_paths = contract.critical_decision_fact_paths.filter(
        (path) =>
          !same(
            pointerValue(v3?.decision_facts, path),
            pointerValue(v4?.decision_facts, path),
          ),
      );
      const passed =
        v3?.status === "completed" &&
        v4?.status === "completed" &&
        mismatched_paths.length === 0 &&
        deepSubset(v3.decision_facts, diagnosticCase.expected_decision_fact_subset) &&
        deepSubset(v4.decision_facts, diagnosticCase.expected_decision_fact_subset);
      return {
        case_id: diagnosticCase.case_id,
        passed,
        full_object_equal:
          v3?.status === "completed" &&
          v4?.status === "completed" &&
          same(v3.decision_facts, v4.decision_facts),
        mismatched_critical_paths: mismatched_paths,
      };
    });

  const hardScore = countResults(assertionGroups.map((group) => group.hard));
  const softScore = countResults(assertionGroups.map((group) => group.soft));
  const forbiddenScore = countResults(
    assertionGroups.map((group) => group.forbidden),
  );
  const metrics = Object.fromEntries(
    [
      "candidate_provenance",
      "message_ownership",
      "relationship_effect_ceiling",
      "explicit_constraint_provenance",
    ].map((metric) => [
      metric,
      countResults(
        assertionGroups.map((group) =>
          group.generic.filter((item) => item.metric === metric),
        ),
      ),
    ]),
  );

  const hardFailCodes = [
    ...new Set(calls.flatMap((call) => call.hard_fail_codes ?? [])),
  ];
  for (const call of calls) {
    if (call.status !== "completed") hardFailCodes.push("PROVIDER_SCHEMA_VIABILITY_FAILED");
    else if (call.returned_model !== contract.model) hardFailCodes.push("MODEL_MISMATCH");
  }
  if (parityResults.some((item) => !item.passed)) {
    hardFailCodes.push("DECISION_FACTS_REGRESSION");
  }
  const uniqueHardFailCodes = [...new Set(hardFailCodes)];
  const secretLeakage = leakageCount(calls);

  const caseResults = caseBundle.cases.map((diagnosticCase) => {
    const caseCalls = calls.filter((call) => call.case_id === diagnosticCase.case_id);
    const v4 = caseCalls.find((call) => call.contract_variant === "v4");
    const parity = parityResults.find((item) => item.case_id === diagnosticCase.case_id);
    const passed =
      v4?.status === "completed" &&
      (v4.hard_assertions?.passed ?? 0) === (v4.hard_assertions?.total ?? -1) &&
      (v4.forbidden_assertions?.passed ?? 0) ===
        (v4.forbidden_assertions?.total ?? -1) &&
      (!diagnosticCase.paired_v3_required || parity?.passed === true);
    return {
      case_id: diagnosticCase.case_id,
      name: diagnosticCase.name,
      calls_attempted: caseCalls.length,
      calls_completed: caseCalls.filter((call) => call.provider_completed === true)
        .length,
      passed,
    };
  });

  const thresholds = {
    exact_calls:
      attempted === contract.authorized_calls.total &&
      completed === contract.authorized_calls.total &&
      v4Calls.length === contract.authorized_calls.v4 &&
      v3Calls.length === contract.authorized_calls.v3,
    retry_repair_fallback_zero:
      results.retry_count === 0 &&
      results.repair_count === 0 &&
      results.fallback_count === 0,
    provider_schema_viability:
      v4Viable === contract.authorized_calls.v4 &&
      v3Viable === contract.authorized_calls.v3,
    grounding_integrity: v4Integrity === contract.authorized_calls.v4,
    legacy_view: legacyViews === contract.authorized_calls.v4,
    paired_parity: parityResults.every((item) => item.passed),
    hard_assertions: hardScore.rate === 1,
    forbidden_assertions: forbiddenScore.rate === 1,
    candidate_provenance: metrics.candidate_provenance.rate === 1,
    message_ownership: metrics.message_ownership.rate === 1,
    relationship_effect_ceiling: metrics.relationship_effect_ceiling.rate === 1,
    explicit_constraint_provenance:
      metrics.explicit_constraint_provenance.rate === 1,
    soft_assertions: softScore.rate >= contract.pass_threshold.soft_assertion_rate_minimum,
    hard_fail_count: uniqueHardFailCodes.length === 0,
    secret_leakage: secretLeakage === 0,
    external_boundaries:
      results.provider_diagnostic_only === true &&
      results.active_runtime_changed === false &&
      results.db_operations === 0 &&
      results.supabase_operations === 0,
    c2_unauthorized: results.c2_authorized === false,
  };
  const passed = Object.values(thresholds).every(Boolean);

  return {
    evaluator_version: "m2-p4-i3-r1-c1-evaluator-v1",
    verdict: passed ? "PASS" : "FAIL",
    calls: {
      authorized: contract.authorized_calls.total,
      attempted,
      completed,
      v3_attempted: v3Calls.length,
      v4_attempted: v4Calls.length,
    },
    provider_schema_viability: {
      v3_passed: v3Viable,
      v3_total: contract.authorized_calls.v3,
      v4_passed: v4Viable,
      v4_total: contract.authorized_calls.v4,
    },
    grounding_integrity: {
      passed: v4Integrity,
      total: contract.authorized_calls.v4,
    },
    legacy_v3_view: {
      passed: legacyViews,
      total: contract.authorized_calls.v4,
    },
    paired_decision_facts_parity: {
      passed: parityResults.filter((item) => item.passed).length,
      total: parityResults.length,
      cases: parityResults,
    },
    hard_assertions: hardScore,
    soft_assertions: softScore,
    forbidden_assertions: forbiddenScore,
    candidate_provenance: metrics.candidate_provenance,
    message_ownership: metrics.message_ownership,
    relationship_effect_ceiling: metrics.relationship_effect_ceiling,
    explicit_constraint_provenance: metrics.explicit_constraint_provenance,
    hard_fail_count: uniqueHardFailCodes.length,
    hard_fail_codes: uniqueHardFailCodes,
    secret_leakage_count: secretLeakage,
    aggregate_usage: usageTotals(calls),
    case_results: caseResults,
    cases_passed: caseResults.filter((item) => item.passed).length,
    cases_total: caseResults.length,
    thresholds,
    c2_eligible_for_review: passed,
    c2_authorized: false,
  };
}

function ratio(score) {
  return `${score.passed}/${score.total}`;
}

export function renderDiagnosticSummary(results) {
  const evaluation = results.evaluation;
  const rows = evaluation.case_results
    .map(
      (item) =>
        `| ${item.case_id} | ${item.name} | ${item.calls_completed}/${item.calls_attempted} | ${item.passed ? "PASS" : "FAIL"} |`,
    )
    .join("\n");
  const stopped = results.cases
    .filter((call) => call.status !== "completed")
    .map(
      (call) =>
        `${call.case_id}/${call.contract_variant}: ${call.safe_error_code ?? call.status}`,
    );
  const parityDifferences = evaluation.paired_decision_facts_parity.cases
    .filter((item) => !item.full_object_equal)
    .map(
      (item) =>
        `${item.case_id}: critical mismatches=${item.mismatched_critical_paths.join(", ") || "none"}; nonmaterial full-object difference recorded`,
    );

  return `# M2-P4-I3-R1-C1 Diagnostic Summary

## Execution evidence

- Package commit: \`${results.package_commit}\`
- Branch: \`${results.branch}\`
- Execution window: \`${results.started_at}\` to \`${results.completed_at}\`
- Requested / returned model contract: \`${results.model_requested}\`
- Provider calls: ${results.calls_completed}/${results.calls_attempted} completed; ${results.calls_authorized.total} authorized
- PB-01 v3 calls: ${evaluation.calls.v3_attempted}; PB-01 v4 calls: ${evaluation.calls.v4_attempted}
- Retry / repair / fallback: ${results.retry_count} / ${results.repair_count} / ${results.fallback_count}
- Provider diagnostic only: \`${results.provider_diagnostic_only}\`
- Active Runtime changed: \`${results.active_runtime_changed}\`
- DB / Supabase: ${results.db_operations} / ${results.supabase_operations}

## Case results

| Case | Name | Calls | Result |
| --- | --- | ---: | --- |
${rows}

## Quality evidence

- Provider / Schema viability: v3 ${evaluation.provider_schema_viability.v3_passed}/${evaluation.provider_schema_viability.v3_total}; v4 ${evaluation.provider_schema_viability.v4_passed}/${evaluation.provider_schema_viability.v4_total}
- v4 grounding + Integrity: ${ratio(evaluation.grounding_integrity)}
- Legacy v3 view: ${ratio(evaluation.legacy_v3_view)}
- Paired critical Decision Facts parity: ${ratio(evaluation.paired_decision_facts_parity)}
- Hard assertions: ${ratio(evaluation.hard_assertions)} (${(evaluation.hard_assertions.rate * 100).toFixed(1)}%)
- Forbidden assertions: ${ratio(evaluation.forbidden_assertions)} (${(evaluation.forbidden_assertions.rate * 100).toFixed(1)}%)
- Soft style assertions: ${ratio(evaluation.soft_assertions)} (${(evaluation.soft_assertions.rate * 100).toFixed(1)}%)
- Candidate provenance: ${ratio(evaluation.candidate_provenance)}
- Message ownership: ${ratio(evaluation.message_ownership)}
- Relationship effect ceiling: ${ratio(evaluation.relationship_effect_ceiling)}
- Explicit constraint provenance: ${ratio(evaluation.explicit_constraint_provenance)}
- Hard fail count: ${evaluation.hard_fail_count}${evaluation.hard_fail_codes.length > 0 ? ` (${evaluation.hard_fail_codes.join(", ")})` : ""}
- Secret leakage count: ${evaluation.secret_leakage_count}

## Usage

- Input tokens: ${results.aggregate_usage.input_tokens}
- Cached tokens: ${results.aggregate_usage.cached_tokens}
- Output tokens: ${results.aggregate_usage.output_tokens}
- Reasoning tokens: ${results.aggregate_usage.reasoning_tokens}

## Exceptions and typed differences

${stopped.length > 0 ? stopped.map((item) => `- ${item}`).join("\n") : "- No stopped or failed call."}
${parityDifferences.length > 0 ? parityDifferences.map((item) => `- ${item}`).join("\n") : "- No paired full-object difference."}

Provider output and consultation prose are not reproduced here. Only bounded typed evidence and hashes are retained in the JSON result.

## Verdict

- C1 verdict: **${evaluation.verdict}**
- C2 eligible for Human / ChatGPT review: \`${evaluation.c2_eligible_for_review}\`
- C2 authorized: \`false\`
- Active Runtime remains catalog v4 and unchanged.
- No DB or Supabase operation was performed.
`;
}
