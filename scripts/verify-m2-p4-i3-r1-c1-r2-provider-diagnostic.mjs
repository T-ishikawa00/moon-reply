import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { validateContextualIntakeIntegrityV3 } from "../lib/assessment/runtime/contextual-integrity-v3.ts";
import { groundStructuredIntakeV5 } from "../lib/assessment/runtime/structured-intake-grounding-v5.ts";
import { collectWritingContextIntegrityViolationsV2 } from "../lib/assessment/runtime/writing-context-integrity-v2.ts";
import {
  EVALUATOR_VERSION,
  aggregateUsage,
  caseFixtureOracleReferences,
  evaluateDiagnostic,
  evaluateProviderCall,
  forbiddenBookkeepingPaths,
  probabilityConfidencePaths,
  rawPiiValues,
  secretLeakageValues,
  shaDiagnosticJson,
} from "./lib/m2-p4-i3-r1-c1-r2-provider-evaluator-v1.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baseline = "277101219c27477e67e1196af0e6067713571edc";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const branch = "test/m2-p4-i3-r1-c1-r2-provider-diagnostic";
const packageCommit = "d0ad3eceb130a806b2c2b06cb1a59dbbaa35bf4e";
const resultCommit = "7239f50fd24eb80369e74583cd619c2155813401";
const artifactRoot = "evals/runtime/m2-p4-i3-r1-c1-r2";
const exactPaths = [
  `${artifactRoot}/diagnostic-cases-v1.json`,
  `${artifactRoot}/diagnostic-contract-v1.json`,
  `${artifactRoot}/quality-contract-v1.json`,
  `${artifactRoot}/authorization-v1.json`,
  `${artifactRoot}/capabilities-v1.json`,
  `${artifactRoot}/diagnostic-results-v1.json`,
  `${artifactRoot}/diagnostic-summary-v1.md`,
  "scripts/lib/m2-p4-i3-r1-c1-r2-provider-evaluator-v1.mjs",
  "scripts/run-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r1-grounding-responsibility.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const reviewSyncPaths = [
  `${artifactRoot}/capabilities-v1.json`,
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const immutableExecutionPaths = exactPaths.filter(
  (item) => !reviewSyncPaths.includes(item),
);
const protectedPaths = [
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/application.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/openai-transport.ts",
  "lib/assessment/runtime/environment.ts",
  "lib/assessment/runtime/contracts/pb-01-structure-v5.developer.md",
  "lib/assessment/runtime/contracts/structured-intake-v5.schema.json",
  "lib/assessment/runtime/contracts/writing-signals-v1.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v6.json",
  "lib/assessment/runtime/structured-intake-grounding-v5.ts",
  "lib/assessment/runtime/writing-signals-grounding-v1.ts",
  "lib/assessment/runtime/decision-facts-evidence-guard-v4.ts",
  "lib/assessment/runtime/writing-context-integrity-v2.ts",
  "lib/assessment/runtime/policy.ts",
  "lib/assessment/runtime/policy-v2.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/safety-aggregation-v3.ts",
  "lib/assessment/runtime/eligibility-v3.ts",
  "package.json",
  "package-lock.json",
];
const immutableEvidenceRoots = [
  "evals/runtime/m2-p4-i3-r1-c1",
  "evals/runtime/m2-p4-i3-r1-c1-r1",
  "evals/development",
  "evals/holdout",
  "supabase",
  "app",
  "components",
];

function absolute(relativePath) {
  return path.join(repositoryRoot, relativePath);
}

function source(relativePath) {
  return readFileSync(absolute(relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(source(relativePath));
}

function git(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
}

function normalizedPaths(value) {
  return value
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean);
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function assertLiteralSet(actual, expected) {
  assert.deepEqual(sorted(actual), sorted(expected));
  assert.equal(new Set(actual).size, actual.length);
  assert.equal(
    actual.every(
      (item) =>
        typeof item === "string" &&
        item.length > 0 &&
        !item.includes("*") &&
        !item.endsWith("/"),
    ),
    true,
  );
}

function currentTaskPaths(startCommit) {
  return sorted(
    new Set([
      ...normalizedPaths(git(["diff", "--name-only", startCommit, "--"])),
      ...normalizedPaths(git(["ls-files", "--others", "--exclude-standard"])),
    ]),
  );
}

function historicalPaths(startCommit, endCommit) {
  return sorted(
    normalizedPaths(git(["diff", "--name-only", startCommit, endCommit, "--"])),
  );
}

function jsonRoundTrip(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoTrailingWhitespace(relativePath) {
  const lines = source(relativePath).split(/\r?\n/u);
  assert.equal(
    lines.some((line) => /[ \t]+$/u.test(line)),
    false,
    `trailing whitespace: ${relativePath}`,
  );
}

function inputFromLegacy(legacyCase) {
  return {
    currentSituation: legacyCase.input.current_situation,
    optionalMessage: legacyCase.input.optional_message,
    relationship: legacyCase.input.relationship,
    requestedTopics: legacyCase.input.requested_topics,
    privacyAcknowledged: legacyCase.input.privacy_acknowledged,
  };
}

function assertInitialState({ authorization, capabilities, results, markerPath }) {
  assert.equal(authorization.consumed, false);
  assert.equal(authorization.rerun_authorized, false);
  assert.equal(authorization.actual_calls, 0);
  assert.equal(authorization.completed_calls, 0);
  assert.equal(authorization.completion_state, "not_executed");
  assert.equal(capabilities.status, "provider_diagnostic_package_ready");
  assert.equal(capabilities.actual_calls, 0);
  assert.equal(capabilities.completed_calls, 0);
  assert.equal(capabilities.provider_diagnostic_verdict, "NOT_EXECUTED");
  assert.equal(capabilities.authorization_consumed, false);
  assert.equal(results.status, "not_executed");
  assert.equal(results.calls_actual, 0);
  assert.equal(results.calls_completed, 0);
  assert.deepEqual(results.calls, []);
  assert.equal(results.authorization_consumed, false);
  assert.equal(results.evaluation.verdict, "NOT_EXECUTED");
  assert.equal(existsSync(markerPath), false);
}

function assertCallEvidence({
  call,
  contract,
  diagnosticCase,
  qualityCase,
  validateRaw,
  validateGrounded,
}) {
  assert.equal(call.case_id, diagnosticCase.case_id);
  assert.equal(call.requested_model, contract.model);
  assert.deepEqual(call.synthetic_input, diagnosticCase.synthetic_input);
  assert.deepEqual(call.focus_tags, diagnosticCase.focus_tags);
  assert.equal(call.call_index >= 1 && call.call_index <= 8, true);
  assert.equal(call.secret_leakage_count, 0);
  assert.equal(
    secretLeakageValues({
      raw_output: call.raw_output,
      grounded_output: call.grounded_output,
    }).length,
    0,
  );

  if (call.provider_completed) {
    assert.equal(typeof call.response_id, "string");
    assert.equal(call.response_id.length > 0, true);
    assert.equal(typeof call.returned_model, "string");
    assert.equal(call.raw_json_parse, true);
    assert.equal(call.raw_output !== null, true);
    const rawValid = validateRaw(call.raw_output);
    assert.equal(call.raw_schema_passed, rawValid);
    assert.equal(call.raw_output_sha256, shaDiagnosticJson(call.raw_output));
  } else {
    assert.equal(call.raw_schema_passed, false);
  }

  const writingSignals = call.raw_output?.writing_signals;
  assert.equal(
    call.forbidden_bookkeeping_count,
    forbiddenBookkeepingPaths(
      writingSignals,
      contract.forbidden_writing_signal_keys,
    ).length,
  );
  assert.equal(
    call.probability_confidence_field_count,
    probabilityConfidencePaths(writingSignals).length,
  );
  assert.equal(call.raw_pii_copied_count, rawPiiValues(writingSignals).length);
  assert.equal(
    call.case_fixture_oracle_reference_count,
    caseFixtureOracleReferences(writingSignals).length,
  );

  if (call.raw_schema_passed) {
    const expectedGrounded = groundStructuredIntakeV5(
      diagnosticCase.synthetic_input,
      call.raw_output,
    );
    assert.deepEqual(call.grounded_output, expectedGrounded);
    assert.equal(
      call.grounded_output_sha256,
      shaDiagnosticJson(expectedGrounded),
    );
    const groundedValid = validateGrounded(expectedGrounded);
    assert.equal(call.grounded_schema_passed, groundedValid);
    const integrityViolations = collectWritingContextIntegrityViolationsV2(
      diagnosticCase.synthetic_input,
      expectedGrounded,
    );
    assert.deepEqual(call.integrity_violations, integrityViolations);
    assert.equal(
      call.writing_context_integrity_v2_passed,
      integrityViolations.length === 0,
    );
    let contextualPassed = true;
    try {
      validateContextualIntakeIntegrityV3(expectedGrounded);
    } catch {
      contextualPassed = false;
    }
    assert.equal(call.contextual_intake_integrity_passed, contextualPassed);
  } else {
    assert.equal(call.grounded_schema_passed, false);
  }

  const recomputed = evaluateProviderCall({ call, contract, qualityCase });
  assert.deepEqual(jsonRoundTrip(call.evaluation), jsonRoundTrip(recomputed));
  for (const [field, evaluationField] of [
    ["raw_semantic_assertions", "raw_semantic_assertions"],
    ["grounded_semantic_assertions", "grounded_semantic_assertions"],
    ["decision_facts_adjudication", "decision_facts_adjudication"],
    ["ownership_results", "ownership_results"],
    ["boundary_results", "boundary_results"],
    ["candidate_presence_results", "candidate_presence_results"],
    ["candidate_style_results", "candidate_style_results"],
    ["candidate_intent_results", "candidate_intent_results"],
    ["relationship_limit_results", "relationship_limit_results"],
    [
      "privacy_repeat_injection_results",
      "privacy_repeat_injection_results",
    ],
    ["application_grounding_results", "application_grounding_results"],
    ["hard_failures", "hard_failures"],
    ["soft_assertions", "soft_assertions"],
    ["soft_findings", "soft_findings"],
  ]) {
    assert.deepEqual(
      jsonRoundTrip(call[field]),
      jsonRoundTrip(recomputed[evaluationField]),
    );
  }
}

function assertCompletedState({
  authorization,
  capabilities,
  results,
  contract,
  cases,
  quality,
  markerPath,
}) {
  assert.equal(authorization.consumed, true);
  assert.equal(authorization.rerun_authorized, false);
  assert.equal(authorization.authorization_id, contract.authorization_id);
  assert.equal(authorization.confirmation_phrase, contract.confirmation_phrase);
  assert.equal(authorization.actual_calls, results.calls_actual);
  assert.equal(authorization.completed_calls, results.calls_completed);
  assert.equal(authorization.package_commit, results.package_commit);
  assert.equal(authorization.completion_state, results.status);
  assert.equal(typeof authorization.execution_claimed_at, "string");
  assert.equal(typeof authorization.completed_at, "string");
  assert.equal(existsSync(markerPath), true);
  const marker = JSON.parse(readFileSync(markerPath, "utf8"));
  assert.equal(marker.task_id, contract.task_id);
  assert.equal(marker.authorization_id, contract.authorization_id);
  assert.equal(marker.confirmation_phrase, contract.confirmation_phrase);
  assert.equal(marker.package_commit, results.package_commit);
  assert.equal(marker.authorized_calls, 8);
  assert.equal(marker.rerun_authorized, false);
  assert.equal(marker.secrets_saved, false);

  assert.equal(
    [
      "provider_diagnostic_completed_pending_human_chatgpt_review",
      "provider_diagnostic_failed_pending_human_chatgpt_review",
    ].includes(results.status),
    true,
  );
  assert.equal(results.calls_actual <= 8, true);
  assert.equal(results.calls.length, results.calls_actual);
  assert.equal(results.calls_completed <= results.calls_actual, true);
  if (results.safe_stop_code === null) {
    assert.equal(results.calls_actual, 8);
  } else {
    assert.equal(/^M2_[A-Z0-9_]+$/u.test(results.safe_stop_code), true);
  }
  assert.deepEqual(
    results.calls.map((call) => call.call_index),
    Array.from({ length: results.calls.length }, (_, index) => index + 1),
  );
  assert.deepEqual(
    results.calls.map((call) => call.case_id),
    cases.slice(0, results.calls.length).map((item) => item.case_id),
  );

  const providerSchema = json(
    "lib/assessment/runtime/contracts/structured-intake-v5.schema.json",
  );
  const groundedSchema = json(
    "lib/assessment/runtime/contracts/structured-intake-v4.schema.json",
  );
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false,
  });
  const validateRaw = ajv.compile(providerSchema);
  const validateGrounded = ajv.compile(groundedSchema);
  for (const [index, call] of results.calls.entries()) {
    assertCallEvidence({
      call,
      contract,
      diagnosticCase: cases[index],
      qualityCase: quality.cases[index],
      validateRaw,
      validateGrounded,
    });
  }

  assert.deepEqual(results.usage_totals, aggregateUsage(results.calls));
  const recomputedEvaluation = evaluateDiagnostic(contract, quality, results);
  assert.deepEqual(
    jsonRoundTrip(results.evaluation),
    jsonRoundTrip(recomputedEvaluation),
  );
  assert.equal(results.authorization_consumed, true);
  assert.equal(results.rerun_authorized, false);
  assert.equal(results.retry_count, 0);
  assert.equal(results.repair_count, 0);
  assert.equal(results.fallback_count, 0);
  assert.equal(results.pb_02_through_pb_06_calls, 0);
  assert.equal(results.db_operations, 0);
  assert.equal(results.supabase_operations, 0);
  assert.equal(results.holdout_use, 0);
  assert.equal(results.real_user_data, 0);
  assert.equal(results.active_runtime_changed, false);
  assert.equal(results.c2_eligible, false);
  assert.equal(results.c2_authorized, false);

  assert.equal(
    results.status,
    "provider_diagnostic_failed_pending_human_chatgpt_review",
  );
  assert.equal(capabilities.status, "human_chatgpt_reviewed_fail_complete");
  assert.equal(capabilities.execution_protocol_accepted, true);
  assert.equal(capabilities.diagnostic_evidence_valid, true);
  assert.equal(capabilities.post_run_evaluator_correction_accepted, true);
  assert.equal(capabilities.provider_product_gate_passed, false);
  assert.deepEqual(capabilities.execution_snapshot, {
    type: "historical_commit_range",
    base_commit_sha: baseline,
    end_commit_sha: resultCommit,
    exact_paths: 17,
    immutable_snapshot: true,
    include_working_tree: false,
  });
  assert.deepEqual(capabilities.execution_commits, [
    packageCommit,
    resultCommit,
  ]);
  assertLiteralSet(capabilities.review_sync_exact_paths, reviewSyncPaths);
  assert.equal(capabilities.review_sync_exact_path_count, 8);
  assert.equal(capabilities.actual_calls, results.calls_actual);
  assert.equal(capabilities.completed_calls, results.calls_completed);
  assert.equal(
    capabilities.provider_diagnostic_verdict,
    results.evaluation.verdict,
  );
  assert.equal(capabilities.case_pass_count, results.evaluation.case_pass_count);
  assert.deepEqual(capabilities.metrics, results.evaluation.metrics);
  assert.deepEqual(capabilities.usage_totals, results.usage_totals);
  assert.equal(capabilities.authorization_consumed, true);
  assert.equal(capabilities.rerun_authorized, false);
  assert.equal(capabilities.pb_02_through_pb_06_calls, 0);
  assert.equal(capabilities.secret_leakage, 0);
  assert.equal(capabilities.active_runtime_changed, false);
  assert.equal(capabilities.c2_eligible, false);
  assert.equal(capabilities.c2_authorized, false);
  assert.equal(
    capabilities.next_candidate,
    "M2-P4-I3-R1-C1-R2-R1 Offline Provider Semantic Consistency Revision",
  );
  assert.equal(capabilities.next_candidate_authorized, false);
  assert.equal(capabilities.i3_final_acceptance, "pending");
  assert.equal(capabilities.main_changed, false);
  assert.equal(capabilities.milestone_2, "incomplete");

  const r203 = results.calls.find((call) => call.case_id === "R2-03");
  const r203Constraint =
    r203?.raw_output?.writing_signals?.explicit_user_constraints?.find(
      (item) => item.bounded_summary === "職場では私的な話をしない",
    );
  assert.equal(r203Constraint?.kind, "custom_explicit_constraint");
  assert.deepEqual(r203?.grounded_output?.decision_facts?.boundary_state, {
    kind: "none",
    status: "none",
    repeated_unanswered_contact: false,
  });
  assert.equal(r203?.boundary_results?.passed, true);

  const r204 = results.calls.find((call) => call.case_id === "R2-04");
  assert.deepEqual(r204?.raw_output?.writing_signals?.message_signals, [
    { author: "unknown", status: "quoted_history" },
  ]);
  assert.equal(
    r204?.raw_output?.writing_signals?.incoming_message_profile?.present,
    "unknown",
  );
  assert.equal(
    r204?.grounded_output?.decision_facts?.latest_direct_message?.sender,
    "other_person",
  );
  assert.deepEqual(r204?.grounded_output?.decision_facts?.boundary_state, {
    kind: "no_contact",
    status: "explicit",
    repeated_unanswered_contact: false,
  });
  assert.equal(r204?.ownership_results?.passed, false);
  assert.equal(r204?.boundary_results?.passed, true);

  const r208 = results.calls.find((call) => call.case_id === "R2-08");
  assert.deepEqual(r208?.raw_output?.writing_signals?.message_signals, []);
  assert.equal(r208?.ownership_results?.passed, false);
  assert.equal(r208?.privacy_repeat_injection_results?.passed, true);
  assert.equal(r208?.candidate_presence_results?.passed, true);

  const summary = source(`${artifactRoot}/diagnostic-summary-v1.md`);
  for (const required of [
    results.status,
    results.evaluation.verdict,
    `${results.calls_actual} / 8`,
    results.evaluation.principal_r2_08_ownership,
    `Input tokens: \`${results.usage_totals.input_tokens}\``,
    "Active Runtime and `main` remain unchanged",
    "C2 remains unauthorized",
    "no rerun is authorized",
  ]) {
    assert.equal(summary.includes(required), true, `summary missing: ${required}`);
  }

  if (results.calls.length === 8) {
    const mutatedR208 = structuredClone(results.calls[7]);
    mutatedR208.raw_output.writing_signals.message_signals = [
      {
        author: "user",
        status: "sent_by_user",
      },
    ];
    const mutationEvaluation = evaluateProviderCall({
      call: mutatedR208,
      contract,
      qualityCase: quality.cases[7],
    });
    assert.equal(mutationEvaluation.ownership_results.passed, false);
    const mutatedR203 = structuredClone(results.calls[2]);
    mutatedR203.raw_output.writing_signals.boundary_ownership_signals = [
      {
        kind: "temporary_distance",
        asserted_by: "other_person",
        explicit: true,
      },
    ];
    assert.equal(
      evaluateProviderCall({
        call: mutatedR203,
        contract,
        qualityCase: quality.cases[2],
      }).boundary_results.passed,
      false,
    );
    const mutatedR204 = structuredClone(results.calls[3]);
    mutatedR204.raw_output.writing_signals.boundary_ownership_signals = [];
    assert.equal(
      evaluateProviderCall({
        call: mutatedR204,
        contract,
        qualityCase: quality.cases[3],
      }).boundary_results.passed,
      false,
    );
  }
}

assert.equal(git(["branch", "--show-current"]).trim(), branch);
assert.equal(git(["rev-parse", "main"]).trim(), mainBaseline);
assert.equal(git(["rev-parse", "origin/main"]).trim(), mainBaseline);
assert.doesNotThrow(() => git(["merge-base", "--is-ancestor", baseline, "HEAD"]));
assert.equal(git(["rev-parse", `${packageCommit}^`]).trim(), baseline);
assert.equal(git(["rev-parse", `${resultCommit}^`]).trim(), packageCommit);
assert.equal(exactPaths.length, 17);
assertLiteralSet(currentTaskPaths(baseline), exactPaths);
assertLiteralSet(historicalPaths(baseline, resultCommit), exactPaths);
assert.equal(reviewSyncPaths.length, 8);
assertLiteralSet(currentTaskPaths(resultCommit), reviewSyncPaths);
for (const immutablePath of immutableExecutionPaths) {
  assert.equal(
    git(["diff", "--name-only", resultCommit, "--", immutablePath]).trim(),
    "",
    `${immutablePath} changed after Commit B`,
  );
}
assert.equal(git(["diff", "--check", baseline, "--"]).trim(), "");
for (const relativePath of exactPaths) {
  assert.equal(existsSync(absolute(relativePath)), true, relativePath);
  assertNoTrailingWhitespace(relativePath);
}
for (const protectedPath of protectedPaths) {
  assert.equal(
    git(["diff", "--name-only", baseline, "--", protectedPath]).trim(),
    "",
    `protected diff: ${protectedPath}`,
  );
}
for (const root of immutableEvidenceRoots) {
  assert.equal(
    git(["diff", "--name-only", baseline, "--", root]).trim(),
    "",
    `immutable evidence diff: ${root}`,
  );
}

const contract = json(`${artifactRoot}/diagnostic-contract-v1.json`);
const cases = json(`${artifactRoot}/diagnostic-cases-v1.json`);
const quality = json(`${artifactRoot}/quality-contract-v1.json`);
const authorization = json(`${artifactRoot}/authorization-v1.json`);
const capabilities = json(`${artifactRoot}/capabilities-v1.json`);
const results = json(`${artifactRoot}/diagnostic-results-v1.json`);
const markerPath = absolute(contract.one_time_marker);

assert.equal(contract.task_id, "M2-P4-I3-R1-C1-R2");
assert.equal(contract.authorization_id, "M2-P4-I3-R1-C1-R2-2026-08-01");
assert.equal(contract.confirmation_phrase, "R1-C1-R2-8-CALL-SYNTHETIC-ONLY");
assert.equal(contract.baseline, baseline);
assert.equal(contract.main_baseline, mainBaseline);
assert.equal(contract.branch, branch);
assert.equal(contract.model, "gpt-5.6-luna");
assert.equal(contract.stage, "PB-01");
assert.equal(contract.catalog, "runtime-stage-catalog-v6.0.0");
assert.equal(contract.prompt_bundle, "prompt-bundle-runtime-v6.0.0");
assert.equal(contract.provider_schema, "pipeline-schema-v5.0.0");
assert.equal(contract.grounded_schema, "pipeline-schema-v4.0.0");
assert.equal(contract.synthetic_cases, 8);
assert.equal(contract.authorized_calls, 8);
assert.deepEqual(contract.execution_limits, {
  maximum_total_provider_calls: 8,
  retries: 0,
  repair: 0,
  fallback: 0,
  pb_02_through_pb_06_calls: 0,
  db_operations: 0,
  supabase_operations: 0,
  holdout_cases: 0,
  real_user_cases: 0,
  parallel_provider_calls: 0,
  automatic_extension: false,
});
assert.deepEqual(contract.data_boundary, {
  synthetic_only: true,
  real_user_data: false,
  holdout: false,
  db_record_lookup: false,
});
assertLiteralSet(contract.exact_mutation_paths, exactPaths);
assert.equal(contract.c2_authorized, false);
assert.equal(contract.rerun_authorized, false);

assert.equal(Array.isArray(cases), true);
assert.equal(cases.length, 8);
assert.deepEqual(
  cases.map((item) => item.case_id),
  ["R2-01", "R2-02", "R2-03", "R2-04", "R2-05", "R2-06", "R2-07", "R2-08"],
);
for (const diagnosticCase of cases) {
  assert.deepEqual(sorted(Object.keys(diagnosticCase)), [
    "case_id",
    "focus_tags",
    "name",
    "synthetic_input",
  ]);
  assert.deepEqual(sorted(Object.keys(diagnosticCase.synthetic_input)), [
    "currentSituation",
    "optionalMessage",
    "privacyAcknowledged",
    "relationship",
    "requestedTopics",
  ]);
  assert.equal(diagnosticCase.synthetic_input.privacyAcknowledged, true);
  assert.equal(Array.isArray(diagnosticCase.focus_tags), true);
  assert.equal(diagnosticCase.focus_tags.length > 0, true);
}
const legacyCases = json(
  "evals/runtime/m2-p4-i3-r1-c1/diagnostic-cases-v1.json",
).cases;
for (const [index, diagnosticCase] of cases.entries()) {
  assert.deepEqual(
    diagnosticCase.synthetic_input,
    inputFromLegacy(legacyCases[index]),
  );
}
const caseText = source(`${artifactRoot}/diagnostic-cases-v1.json`);
for (const forbiddenKey of [
  "expected_decision_fact_subset",
  "expected_writing_context_subset",
  "expected_source_ownership",
  "hard_assertions",
  "soft_assertions",
  "forbidden_assertions",
  "acceptable_value_sets",
  "oracle",
]) {
  assert.equal(caseText.includes(`"${forbiddenKey}"`), false);
}

assert.equal(quality.schema_version, "m2-p4-i3-r1-c1-r2-quality-contract-v1");
assert.equal(quality.task_id, contract.task_id);
assert.equal(quality.case_count, 8);
assert.deepEqual(quality.empty_evidence_rule, {
  rate: null,
  evidence_status: "unavailable",
});
assert.deepEqual(
  quality.cases.map((item) => item.case_id),
  cases.map((item) => item.case_id),
);
assert.equal(
  quality.cases[7].raw_messages[0].author,
  "other_person",
);
assert.deepEqual(quality.cases[7].raw_messages[0].statuses, [
  "quoted_history",
  "incoming",
]);
assert.deepEqual(quality.cases[2].boundary_signals, []);
assert.equal(
  quality.cases[2].boundary_signal_rule,
  "only_user_owned_nonrestrictive_or_empty",
);
assert.deepEqual(quality.cases[2].grounded_boundary, {
  kind: "none",
  status: "none",
});
assert.deepEqual(quality.cases[3].boundary_signals, [
  { kind: "no_contact", asserted_by: "other_person", explicit: true },
]);
assert.equal(
  quality.cases[6].boundary_signal_rule,
  "only_user_owned_nonrestrictive_or_empty",
);
assert.deepEqual(quality.cases[3].grounded_boundary, {
  kind: "no_contact",
  status: "explicit",
});

assert.equal(authorization.task_id, contract.task_id);
assert.equal(authorization.authorization_id, contract.authorization_id);
assert.equal(authorization.confirmation_phrase, contract.confirmation_phrase);
assert.equal(authorization.authorized_calls, 8);
assert.equal(capabilities.task_id, contract.task_id);
assert.equal(capabilities.baseline, baseline);
assert.equal(capabilities.branch, branch);
assert.equal(capabilities.exact_paths, 17);
assert.equal(capabilities.historical_verifier_mode, "accepted_sha_external_clone");
assert.equal(capabilities.historical_verifier_sha, baseline);
assert.equal(capabilities.historical_snapshot_revalidation, "7/7");
assert.equal(capabilities.historical_verifiers_current_branch_compatible, false);
assert.equal(
  capabilities.incompatibility_reason,
  "exact R1-C1-R1 31-path snapshot authority",
);
assert.equal(capabilities.old_verifier_mutations, 0);
assert.equal(capabilities.scope_expansion, 0);
if (authorization.consumed === true) {
  const expectedCorrection = {
    mode: "saved_evidence_offline_recompute",
    privacy_markers_compared_as_unordered_set: true,
    user_owned_nonrestrictive_boundary_signal_allowed: true,
    provider_calls_added: 0,
    provider_outputs_mutated: 0,
    verdict_before: "FAIL",
    verdict_after: "FAIL",
  };
  assert.deepEqual(capabilities.post_run_evaluator_correction, expectedCorrection);
  assert.deepEqual(results.post_run_evaluator_correction, expectedCorrection);
}
assert.equal(capabilities.model, contract.model);
assert.equal(capabilities.stage, "PB-01 v5 only");
assert.equal(capabilities.r1_c1_r1, "human_chatgpt_accepted_complete");
assert.equal(capabilities.r1_c1_r2_authorized, true);
assert.equal(capabilities.c2_eligible, false);
assert.equal(capabilities.c2_authorized, false);
assert.equal(capabilities.active_runtime_changed, false);
assert.equal(results.task_id, contract.task_id);
assert.equal(results.authorization_id, contract.authorization_id);
assert.equal(results.calls_authorized, 8);
assert.equal(results.retry_count, 0);
assert.equal(results.repair_count, 0);
assert.equal(results.fallback_count, 0);
assert.equal(results.pb_02_through_pb_06_calls, 0);
assert.equal(results.db_operations, 0);
assert.equal(results.supabase_operations, 0);
assert.equal(results.holdout_use, 0);
assert.equal(results.real_user_data, 0);
assert.equal(results.active_runtime_changed, false);
assert.equal(results.c2_eligible, false);
assert.equal(results.c2_authorized, false);
assert.equal(results.evaluation.evaluator_version, EVALUATOR_VERSION);

const runnerSource = source(
  "scripts/run-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs",
);
const evaluatorSource = source(
  "scripts/lib/m2-p4-i3-r1-c1-r2-provider-evaluator-v1.mjs",
);
assert.equal(
  runnerSource.split("transport.invoke(").length - 1,
  1,
  "runner has exactly one Provider invocation site",
);
assert.equal(runnerSource.includes("transport.client.maxRetries = 0"), true);
assert.equal(runnerSource.includes("loadM2P4GroundingResponsibilityRuntimeStageCatalog"), true);
assert.equal(runnerSource.includes("groundStructuredIntakeV5"), true);
assert.equal(runnerSource.includes("validateGroundedStageOutput"), true);
assert.equal(runnerSource.includes("validateWritingContextIntegrityV2"), true);
assert.equal(runnerSource.includes("validateContextualIntakeIntegrityV3"), true);
assert.equal(runnerSource.includes(".env.local"), true);
assert.equal(/console\.(?:log|error)\([^\n]*process\.env/u.test(runnerSource), false);
assert.equal(/loadM2P4ProductQualityRuntimeStageCatalog/u.test(runnerSource), false);
assert.equal(/AssessmentPipeline|RuntimeAssessmentService/u.test(runnerSource), false);
assert.equal(/supabase|createClient\s*\(/iu.test(runnerSource), false);
assert.equal(/evals[\\/]holdout|evals[\\/]development/u.test(runnerSource), false);
const providerInputSource = runnerSource.slice(
  runnerSource.indexOf("function providerInput"),
  runnerSource.indexOf("function stageRequest"),
);
for (const forbidden of [
  "case_id",
  "focus_tags",
  "quality",
  "expected",
  "assertion",
  "oracle",
]) {
  assert.equal(providerInputSource.includes(forbidden), false);
}
for (const field of contract.provider_input_fields) {
  assert.equal(providerInputSource.includes(field), true);
}
assert.equal(evaluatorSource.includes("process.env"), false);
assert.equal(evaluatorSource.includes("OpenAiResponsesTransport"), false);

if (authorization.consumed === false) {
  assertInitialState({ authorization, capabilities, results, markerPath });
} else {
  assertCompletedState({
    authorization,
    capabilities,
    results,
    contract,
    cases,
    quality,
    markerPath,
  });
}

const requiredDocState = "human_chatgpt_reviewed_fail_complete";
for (const docPath of [
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
]) {
  const doc = source(docPath);
  assert.equal(doc.includes("M2-P4-I3-R1-C1-R2"), true, docPath);
  assert.equal(doc.includes(requiredDocState), true, docPath);
  assert.equal(doc.includes("C2"), true, docPath);
  assert.equal(
    /unauthorized|not authorize|未承認/iu.test(doc),
    true,
    docPath,
  );
}

console.log("M2_P4_I3_R1_C1_R2_PROVIDER_DIAGNOSTIC: PASS");
console.log("package_scope: 17/17");
console.log("diagnostic_snapshot: 17/17 immutable");
console.log("review_sync_scope: 8/8");
console.log("execution_evidence_blobs_unchanged: 9/9");
console.log(`provider_calls: ${results.calls_actual}/8`);
console.log(`authorization_consumed: ${authorization.consumed}`);
console.log("rerun_authorized: false");
console.log("verdict: FAIL");
console.log("cases: 5/8");
console.log("active_runtime_changed: false");
console.log("c2_eligible: false");
console.log("c2_authorized: false");
