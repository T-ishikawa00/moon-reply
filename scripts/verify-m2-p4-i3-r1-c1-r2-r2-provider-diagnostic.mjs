import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadM2P4ProductQualityRuntimeStageCatalog,
  loadM2P4SemanticConsistencyRuntimeStageCatalog,
} from "../lib/assessment/runtime/schema-catalog.ts";
import { buildContextualDecisionPolicyV3 } from "../lib/assessment/runtime/policy-v3.ts";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baseline = "fbb315f45e777fe2001e54657d7015ebbf7d3663";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const branch =
  "test/m2-p4-i3-r1-c1-r2-r2-four-case-provider-diagnostic";
const packageCommit = "36e7d1967a502f0ed80aaccb12d44507f0058560";
const resultCommit = "2cb243486063ba9235f4f3ce65f051cf5fd38d6e";
const artifactRoot = "evals/runtime/m2-p4-i3-r1-c1-r2-r2";
const exactPaths = [
  artifactRoot + "/diagnostic-cases-v1.json",
  artifactRoot + "/diagnostic-contract-v1.json",
  artifactRoot + "/quality-contract-v1.json",
  artifactRoot + "/authorization-v1.json",
  artifactRoot + "/capabilities-v1.json",
  artifactRoot + "/diagnostic-results-v1.json",
  artifactRoot + "/diagnostic-summary-v1.md",
  "scripts/lib/m2-p4-i3-r1-c1-r2-r2-provider-evaluator-v1.mjs",
  "scripts/run-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r1-semantic-consistency.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
].sort((left, right) => left.localeCompare(right, "en"));
const postRunMutablePaths = [
  artifactRoot + "/authorization-v1.json",
  artifactRoot + "/capabilities-v1.json",
  artifactRoot + "/diagnostic-results-v1.json",
  artifactRoot + "/diagnostic-summary-v1.md",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
].sort((left, right) => left.localeCompare(right, "en"));
const reviewSyncPaths = [
  artifactRoot + "/capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
].sort((left, right) => left.localeCompare(right, "en"));
const immutableExecutionPaths = exactPaths.filter(
  (item) => !reviewSyncPaths.includes(item),
);
const frozenAfterCommitAPaths = [
  artifactRoot + "/diagnostic-cases-v1.json",
  artifactRoot + "/diagnostic-contract-v1.json",
  artifactRoot + "/quality-contract-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r2-r2-provider-evaluator-v1.mjs",
  "scripts/run-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs",
].sort((left, right) => left.localeCompare(right, "en"));
const immutableR2Paths = [
  "evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2/quality-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2/authorization-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2/capabilities-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-summary-v1.md",
  "scripts/lib/m2-p4-i3-r1-c1-r2-provider-evaluator-v1.mjs",
  "scripts/run-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_REVIEW.md",
];
const immutableR2R1Paths = [
  "lib/assessment/runtime/contracts/pb-01-structure-v6.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v7.json",
  "lib/assessment/runtime/schema-catalog.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r1/semantic-consistency-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r1/offline-analysis-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r1/capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R1_REVIEW.md",
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
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function fail(message) {
  throw new Error(message);
}

function sorted(values) {
  return [...values].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

function normalizedPaths(value) {
  return value
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean);
}

function currentTaskPaths(startCommit) {
  const paths = new Set(
    normalizedPaths(git(["diff", "--name-only", startCommit, "--"])),
  );
  const status = git([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);
  for (const line of status.split(/\r?\n/gu).filter(Boolean)) {
    let item = line.slice(3).trim();
    if (item.includes(" -> ")) item = item.split(" -> ").at(-1);
    paths.add(item.replaceAll("\\", "/"));
  }
  return sorted(paths);
}

function historicalPaths(startCommit, endCommit) {
  return sorted(
    normalizedPaths(git(["diff", "--name-only", startCommit, endCommit, "--"])),
  );
}

function assertExactPaths(actual, expected, label) {
  const literal = actual.every(
    (item) =>
      typeof item === "string" &&
      item.length > 0 &&
      !item.includes("*") &&
      !item.endsWith("/"),
  );
  if (
    actual.length !== expected.length ||
    new Set(actual).size !== expected.length ||
    !literal ||
    JSON.stringify(actual) !== JSON.stringify(expected)
  ) {
    fail(label + ": " + JSON.stringify(actual));
  }
}

function assertUnchangedFromBaseline(relativePath) {
  const changed = git([
    "diff",
    "--name-only",
    baseline,
    "--",
    relativePath,
  ]).trim();
  if (changed !== "") {
    fail("immutable predecessor changed: " + relativePath);
  }
}

function assertUnchangedBetween(relativePath, startCommit, endCommit) {
  const changed = git([
    "diff",
    "--name-only",
    startCommit,
    endCommit,
    "--",
    relativePath,
  ]).trim();
  if (changed !== "") {
    fail("execution-frozen path changed: " + relativePath);
  }
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

function shaDiagnosticJson(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalize(value), "utf8"))
    .digest("hex");
}

function hashText(relativePath) {
  return createHash("sha256")
    .update(Buffer.from(source(relativePath).replace(/\r\n/gu, "\n"), "utf8"))
    .digest("hex");
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function assertNoTrailingWhitespace(relativePath) {
  const lines = source(relativePath).split(/\r?\n/gu);
  for (const [index, line] of lines.entries()) {
    if (/[ \t]+$/u.test(line)) {
      fail(
        "trailing whitespace: " +
          relativePath +
          ":" +
          String(index + 1),
      );
    }
  }
}

function inputFromLegacy(legacyCase) {
  return structuredClone(legacyCase.synthetic_input);
}

function assertInitialState({
  authorization,
  capabilities,
  results,
  markerPath,
}) {
  if (
    authorization.consumed !== false ||
    authorization.rerun_authorized !== false ||
    authorization.execution_claimed_at !== null ||
    authorization.completed_at !== null ||
    authorization.package_commit !== null ||
    authorization.actual_calls !== 0 ||
    authorization.completed_calls !== 0 ||
    authorization.completion_state !== "not_executed" ||
    capabilities.status !== "provider_targeted_diagnostic_package_ready" ||
    capabilities.actual_calls !== 0 ||
    capabilities.completed_calls !== 0 ||
    capabilities.authorization_consumed !== false ||
    capabilities.rerun_authorized !== false ||
    capabilities.package_commit !== null ||
    capabilities.targeted_retest_verdict !== "NOT_EXECUTED" ||
    capabilities.provider_targeted_fix_evidence !== false ||
    capabilities.provider_quality_established !== false ||
    capabilities.full_eight_case_confirmation_required !== true ||
    capabilities.active_runtime_changed !== false ||
    capabilities.c2_eligible !== false ||
    capabilities.c2_authorized !== false ||
    results.status !== "not_executed" ||
    results.started_at !== null ||
    results.completed_at !== null ||
    results.package_commit !== null ||
    results.calls_actual !== 0 ||
    results.calls_completed !== 0 ||
    results.authorization_consumed !== false ||
    results.rerun_authorized !== false ||
    results.provider_output_mutation_count !== 0 ||
    results.calls.length !== 0 ||
    results.evaluation?.verdict !== "NOT_EXECUTED" ||
    existsSync(markerPath)
  ) {
    fail("initial package state differs");
  }
}

function assertCallEvidence(call, diagnosticCase, qualityCase, index, model) {
  if (
    call.case_id !== diagnosticCase.case_id ||
    call.source_case_reference !== diagnosticCase.source_case_reference ||
    call.call_index !== index + 1 ||
    !same(call.synthetic_input, diagnosticCase.synthetic_input) ||
    call.requested_model !== model ||
    call.provider_output_mutated !== false ||
    call.secret_leakage_count !== 0 ||
    call.probability_confidence_field_count !== 0 ||
    call.case_fixture_oracle_reference_count !== 0 ||
    call.raw_pii_copied_count !== 0 ||
    !Array.isArray(call.hard_failures) ||
    !Array.isArray(call.soft_findings)
  ) {
    fail("call evidence envelope differs: " + diagnosticCase.case_id);
  }
  if (call.raw_output !== null) {
    if (
      call.raw_output_sha256 !== shaDiagnosticJson(call.raw_output) ||
      call.raw_output_sha256_after_processing !== call.raw_output_sha256
    ) {
      fail("raw Provider output hash differs: " + diagnosticCase.case_id);
    }
  }
  if (
    call.grounded_output !== null &&
    call.grounded_output_sha256 !== shaDiagnosticJson(call.grounded_output)
  ) {
    fail("grounded output hash differs: " + diagnosticCase.case_id);
  }
  if (
    call.provider_completed === true &&
    (typeof call.returned_model !== "string" ||
      typeof call.response_id !== "string" ||
      !Number.isFinite(call.latency_ms) ||
      call.latency_ms < 0)
  ) {
    fail("completed Provider call metadata differs: " + diagnosticCase.case_id);
  }
  if (
    qualityCase.case_id !== diagnosticCase.case_id ||
    qualityCase.source_case_reference !==
      diagnosticCase.source_case_reference
  ) {
    fail("quality case mapping differs: " + diagnosticCase.case_id);
  }
}

function assertCompletedState({
  contract,
  caseBundle,
  qualityContract,
  authorization,
  capabilities,
  results,
  markerPath,
}) {
  const allowedStatuses = [
    "provider_targeted_diagnostic_passed_pending_human_chatgpt_review",
    "provider_targeted_diagnostic_failed_pending_human_chatgpt_review",
    "evaluation_blocked_pending_human_chatgpt_review",
  ];
  if (
    !allowedStatuses.includes(results.status) ||
    results.status !== authorization.completion_state ||
    authorization.consumed !== true ||
    authorization.rerun_authorized !== false ||
    capabilities.authorization_consumed !== true ||
    capabilities.rerun_authorized !== false ||
    results.authorization_consumed !== true ||
    results.rerun_authorized !== false ||
    results.calls_actual !== results.calls.length ||
    results.calls_actual > contract.authorized_calls ||
    results.calls_completed >
      results.calls_actual ||
    authorization.actual_calls !== results.calls_actual ||
    authorization.completed_calls !== results.calls_completed ||
    capabilities.actual_calls !== results.calls_actual ||
    capabilities.completed_calls !== results.calls_completed ||
    results.retry_count !== 0 ||
    results.repair_count !== 0 ||
    results.fallback_count !== 0 ||
    results.pb_02_through_pb_06_calls !== 0 ||
    results.db_operations !== 0 ||
    results.supabase_operations !== 0 ||
    results.holdout_use !== 0 ||
    results.real_user_data !== 0 ||
    results.provider_output_mutation_count !== 0 ||
    results.provider_quality_established !== false ||
    results.full_eight_case_confirmation_required !== true ||
    results.active_runtime_changed !== false ||
    results.c2_eligible !== false ||
    results.c2_authorized !== false ||
    capabilities.provider_quality_established !== false ||
    capabilities.full_eight_case_confirmation_required !== true ||
    capabilities.active_runtime_changed !== false ||
    capabilities.c2_eligible !== false ||
    capabilities.c2_authorized !== false ||
    !/^[0-9a-f]{40}$/u.test(results.package_commit ?? "") ||
    results.package_commit !== authorization.package_commit ||
    results.package_commit !== capabilities.package_commit ||
    !existsSync(markerPath)
  ) {
    fail("completed package state differs");
  }
  if (
    results.safe_stop_code === null &&
    (results.calls_actual !== 4 || results.calls_completed !== 4)
  ) {
    fail("non-fatal execution did not complete exact four calls");
  }
  if (
    results.status ===
      "provider_targeted_diagnostic_passed_pending_human_chatgpt_review" &&
    (results.evaluation?.verdict !== "PASS" ||
      results.evaluation?.case_pass_count !== 4 ||
      results.evaluation?.targeted_repairs !== "PASS" ||
      results.evaluation?.normal_regression_control !== "PASS" ||
      results.evaluation?.principal_r2r2_03_quoted_ownership !== "PASS" ||
      capabilities.provider_targeted_fix_evidence !== true)
  ) {
    fail("targeted PASS state differs");
  }
  if (
    results.status ===
      "provider_targeted_diagnostic_failed_pending_human_chatgpt_review" &&
    (results.evaluation?.verdict !== "FAIL" ||
      capabilities.provider_targeted_fix_evidence !== false)
  ) {
    fail("targeted FAIL state differs");
  }
  if (
    results.status === "evaluation_blocked_pending_human_chatgpt_review" &&
    (results.evaluation?.verdict !== "EVALUATION_BLOCKED" ||
      capabilities.provider_targeted_fix_evidence !== false)
  ) {
    fail("evaluation-blocked state differs");
  }

  for (const [index, diagnosticCase] of caseBundle.entries()) {
    const call = results.calls[index];
    if (!call) break;
    assertCallEvidence(
      call,
      diagnosticCase,
      qualityContract.cases[index],
      index,
      contract.model,
    );
  }

  const marker = JSON.parse(readFileSync(markerPath, "utf8"));
  if (
    marker.schema_version !== "m2-p4-i3-r1-c1-r2-r2-consumed-v1" ||
    marker.task_id !== contract.task_id ||
    marker.authorization_id !== contract.authorization_id ||
    marker.confirmation_phrase !== contract.confirmation_phrase ||
    marker.package_commit !== results.package_commit ||
    marker.branch !== contract.branch ||
    marker.authorized_calls !== 4 ||
    marker.rerun_authorized !== false ||
    marker.secrets_saved !== false
  ) {
    fail("one-time marker differs");
  }

  for (const frozenPath of frozenAfterCommitAPaths) {
    assertUnchangedBetween(frozenPath, packageCommit, resultCommit);
  }
  assertExactPaths(
    historicalPaths(packageCommit, resultCommit),
    postRunMutablePaths,
    "post-run exact 8-path scope differs",
  );
  assertExactPaths(
    currentTaskPaths(resultCommit),
    reviewSyncPaths,
    "review sync exact 8-path scope differs",
  );
  for (const immutablePath of immutableExecutionPaths) {
    if (
      git(["diff", "--name-only", resultCommit, "--", immutablePath]).trim() !==
      ""
    ) {
      fail("execution artifact changed after Commit B: " + immutablePath);
    }
  }

  const expectedExecutionSnapshot = {
    type: "historical_commit_range",
    base_commit_sha: baseline,
    end_commit_sha: resultCommit,
    exact_paths: 17,
    immutable_snapshot: true,
    include_working_tree: false,
  };
  if (
    capabilities.status !== "human_chatgpt_reviewed_fail_complete" ||
    capabilities.execution_protocol_accepted !== true ||
    capabilities.diagnostic_evidence_valid !== true ||
    capabilities.frozen_targeted_verdict !== "FAIL" ||
    capabilities.provider_product_gate_passed !== false ||
    capabilities.targeted_repairs_evidence_accepted !== true ||
    capabilities.targeted_repairs_passed !== "3/3" ||
    capabilities.principal_quoted_ownership !== "PASS" ||
    capabilities.ownership_sequence_control_passed !== true ||
    capabilities.normal_control_overall !== "FAIL" ||
    capabilities.r2r2_04_classification !==
      "decision_policy_equivalent_but_semantically_incomplete" ||
    capabilities.decision_policy_equivalent !== true ||
    capabilities.decision_facts_semantic_completeness_passed !== false ||
    capabilities.additional_provider_calls !== 0 ||
    !same(capabilities.execution_snapshot, expectedExecutionSnapshot) ||
    !same(capabilities.execution_commits, [packageCommit, resultCommit]) ||
    capabilities.review_sync_exact_path_count !== 8 ||
    capabilities.next_candidate !==
      "M2-P4-I3-R1-C1-R2-R2-R1 Offline Practical Reason Consistency Revision" ||
    capabilities.next_candidate_authorized !== false
  ) {
    fail("Human / ChatGPT review capability boundary differs");
  }
  assertExactPaths(
    sorted(capabilities.review_sync_exact_paths),
    reviewSyncPaths,
    "capability review sync paths differ",
  );

  const control = results.calls.find((call) => call.case_id === "R2R2-04");
  const actualFacts = control?.grounded_output?.decision_facts;
  if (
    !actualFacts ||
    control?.ownership_results?.passed !== true ||
    control?.candidate_presence_results?.passed !== true ||
    !same(control?.raw_output?.writing_signals?.message_signals, [
      { author: "user", status: "sent_by_user" },
      { author: "other_person", status: "incoming" },
    ]) ||
    !same(
      control?.grounded_output?.writing_context?.message_ownership?.map(
        (item) => ({
          author: item.author,
          status: item.status,
          sequence: item.sequence,
        }),
      ),
      [
        { author: "user", status: "sent_by_user", sequence: 1 },
        { author: "other_person", status: "incoming", sequence: 2 },
        { author: "user", status: "unsent_candidate", sequence: 3 },
      ],
    ) ||
    !same(actualFacts.latest_direct_message, {
      sender: "other_person",
      kind: "question",
      response_expectation: "reasonable",
      user_reply_state: "not_replied",
      sns_signal_only: false,
    }) ||
    !same(actualFacts.practical_reason, {
      kind: "none",
      active: false,
      deadline: "none",
    }) ||
    !same(actualFacts.boundary_state, {
      kind: "none",
      status: "none",
      repeated_unanswered_contact: false,
    })
  ) {
    fail("R2R2-04 saved ownership or Decision Facts evidence differs");
  }

  const comparisonFacts = structuredClone(actualFacts);
  comparisonFacts.practical_reason = {
    kind: "schedule_coordination",
    active: true,
    deadline: "unknown",
  };
  const actualPolicy = buildContextualDecisionPolicyV3(actualFacts);
  const comparisonPolicy = buildContextualDecisionPolicyV3(comparisonFacts);
  if (
    !same(actualPolicy, comparisonPolicy) ||
    !same(actualPolicy.allowed_decisions, ["reply_now"]) ||
    !same(actualPolicy.reason_codes, ["unanswered_meaningful_message"])
  ) {
    fail("R2R2-04 review-time Decision Policy equivalence differs");
  }
}

const contractPath = artifactRoot + "/diagnostic-contract-v1.json";
const casesPath = artifactRoot + "/diagnostic-cases-v1.json";
const qualityPath = artifactRoot + "/quality-contract-v1.json";
const authorizationPath = artifactRoot + "/authorization-v1.json";
const capabilitiesPath = artifactRoot + "/capabilities-v1.json";
const resultsPath = artifactRoot + "/diagnostic-results-v1.json";
const summaryPath = artifactRoot + "/diagnostic-summary-v1.md";
const reviewPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_REVIEW.md";
const evaluatorPath =
  "scripts/lib/m2-p4-i3-r1-c1-r2-r2-provider-evaluator-v1.mjs";
const runnerPath =
  "scripts/run-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs";
const markerPath = absolute(
  ".git/moon-reply-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic-consumed.json",
);

const contract = json(contractPath);
const caseBundle = json(casesPath);
const qualityContract = json(qualityPath);
const authorization = json(authorizationPath);
const capabilities = json(capabilitiesPath);
const results = json(resultsPath);
const legacyCases = json(
  "evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-cases-v1.json",
);
const evaluatorSource = source(evaluatorPath);
const runnerSource = source(runnerPath);
const summarySource = source(summaryPath);
const reviewSource = source(reviewPath);

if (git(["branch", "--show-current"]).trim() !== branch) {
  fail("branch differs");
}
if (
  git(["rev-parse", "main"]).trim() !== mainBaseline ||
  git(["rev-parse", "origin/main"]).trim() !== mainBaseline
) {
  fail("main changed");
}
if (git(["stash", "list"]).trim() !== "") {
  fail("stash is not empty");
}
if (
  git(["rev-parse", packageCommit + "^"]).trim() !== baseline ||
  git(["rev-parse", resultCommit + "^"]).trim() !== packageCommit
) {
  fail("execution commit chain differs");
}
assertExactPaths(
  currentTaskPaths(baseline),
  exactPaths,
  "exact 17-path scope differs",
);
assertExactPaths(
  historicalPaths(baseline, resultCommit),
  exactPaths,
  "immutable diagnostic snapshot differs",
);
if (reviewSyncPaths.length !== 8 || immutableExecutionPaths.length !== 9) {
  fail("review or immutable execution path count differs");
}
if (git(["diff", "--check", baseline, "--"]).trim() !== "") {
  fail("git diff --check failed");
}
for (const relativePath of exactPaths) {
  assertNoTrailingWhitespace(relativePath);
}

if (
  contract.schema_version !==
    "m2-p4-i3-r1-c1-r2-r2-diagnostic-contract-v1" ||
  contract.task_id !== "M2-P4-I3-R1-C1-R2-R2" ||
  contract.authorization_id !==
    "M2-P4-I3-R1-C1-R2-R2-2026-08-02" ||
  contract.confirmation_phrase !==
    "R2-R2-4-CALL-PROMPT-V6-SYNTHETIC-ONLY" ||
  contract.baseline !== baseline ||
  contract.main_baseline !== mainBaseline ||
  contract.branch !== branch ||
  contract.model !== "gpt-5.6-luna" ||
  contract.stage !== "PB-01" ||
  contract.prompt !== "pb-01-structure-v6" ||
  contract.prompt_version !== "v6.0.0" ||
  contract.catalog !== "runtime-stage-catalog-v7.0.0" ||
  contract.prompt_bundle !== "prompt-bundle-runtime-v7.0.0" ||
  contract.provider_schema !== "pipeline-schema-v5.0.0" ||
  contract.grounded_schema !== "pipeline-schema-v4.0.0" ||
  contract.runtime_schema_set !== "pipeline-schema-runtime-v3.2.0" ||
  contract.active_catalog !== "runtime-stage-catalog-v4.0.0" ||
  contract.active_prompt_bundle !== "prompt-bundle-runtime-v4.0.0" ||
  contract.active_schema_set !== "pipeline-schema-runtime-v3.0.0" ||
  contract.synthetic_cases !== 4 ||
  contract.authorized_calls !== 4 ||
  contract.provider_quality_established !== false ||
  contract.full_eight_case_confirmation_required !== true ||
  contract.c2_eligible !== false ||
  contract.c2_authorized !== false ||
  contract.rerun_authorized !== false
) {
  fail("diagnostic contract differs");
}
assertExactPaths(
  sorted(contract.exact_mutation_paths),
  exactPaths,
  "contract exact paths differ",
);
assertExactPaths(
  sorted(contract.post_run_mutable_paths),
  postRunMutablePaths,
  "contract post-run paths differ",
);
assertExactPaths(
  sorted(contract.frozen_after_commit_a_paths),
  frozenAfterCommitAPaths,
  "contract frozen paths differ",
);
for (const [key, expected] of Object.entries({
  maximum_total_provider_calls: 4,
  retries: 0,
  repair: 0,
  pb_07_calls: 0,
  fallback: 0,
  pb_02_through_pb_06_calls: 0,
  db_operations: 0,
  supabase_operations: 0,
  holdout_cases: 0,
  real_user_cases: 0,
  parallel_provider_calls: 0,
  automatic_extension: false,
})) {
  if (contract.execution_limits?.[key] !== expected) {
    fail("execution limit differs: " + key);
  }
}
if (
  contract.one_time_marker !==
    ".git/moon-reply-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic-consumed.json" ||
  !same(contract.source_case_order, ["R2-03", "R2-04", "R2-08", "R2-06"])
) {
  fail("one-time marker or source order differs");
}
if (
  contract.prompt_sha256_utf8_lf !==
    hashText("lib/assessment/runtime/contracts/pb-01-structure-v6.developer.md") ||
  contract.catalog_sha256 !==
    hashText(
      "lib/assessment/runtime/contracts/runtime-stage-catalog-v7.json",
    )
) {
  fail("Prompt v6 or catalog v7 hash differs");
}

if (
  caseBundle.length !== 4 ||
  qualityContract.case_count !== 4 ||
  qualityContract.cases.length !== 4 ||
  qualityContract.empty_evidence_rule?.rate !== null ||
  qualityContract.empty_evidence_rule?.evidence_status !== "unavailable" ||
  qualityContract.set_semantics?.privacy_markers !== "unordered_set" ||
  qualityContract.set_semantics?.changed_fact_ids !==
    "unordered_set_when_order_is_immaterial" ||
  qualityContract.sequence_semantics?.message_signals !==
    "source_order_sensitive" ||
  qualityContract.sequence_semantics?.canonical_message_ownership !==
    "sequence_sensitive"
) {
  fail("quality contract structure differs");
}
const expectedMappings = [
  ["R2R2-01", "R2-03"],
  ["R2R2-02", "R2-04"],
  ["R2R2-03", "R2-08"],
  ["R2R2-04", "R2-06"],
];
for (const [index, [caseId, legacyId]] of expectedMappings.entries()) {
  const diagnosticCase = caseBundle[index];
  const qualityCase = qualityContract.cases[index];
  const legacyCase = legacyCases.find((item) => item.case_id === legacyId);
  if (
    diagnosticCase.case_id !== caseId ||
    diagnosticCase.source_case_reference !== legacyId ||
    !legacyCase ||
    !same(diagnosticCase.synthetic_input, inputFromLegacy(legacyCase)) ||
    !same(
      sorted(Object.keys(diagnosticCase)),
      sorted([
        "case_id",
        "name",
        "source_case_reference",
        "synthetic_input",
        "focus_tags",
      ]),
    ) ||
    qualityCase.case_id !== caseId ||
    qualityCase.source_case_reference !== legacyId
  ) {
    fail("synthetic input or case mapping differs: " + caseId);
  }
}
const principalQuality = qualityContract.cases[2];
if (
  principalQuality.principal_targeted_gate !== true ||
  !same(principalQuality.raw_messages, [
    { author: "other_person", statuses: ["quoted_history"] },
  ]) ||
  !same(
    sorted(principalQuality.privacy_markers_required),
    sorted(["email", "account_identifier"]),
  ) ||
  principalQuality.changed_fact_ids_order_immaterial !== true ||
  principalQuality.embedded_instruction_detected !== true
) {
  fail("principal quoted-ownership quality gate differs");
}

for (const immutablePath of [
  ...immutableR2Paths,
  ...immutableR2R1Paths,
  "lib/assessment/runtime/contracts/pb-01-structure-v5.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v6.json",
]) {
  assertUnchangedFromBaseline(immutablePath);
}

const providerInputStart = runnerSource.indexOf("function providerInput");
const providerInputEnd = runnerSource.indexOf(
  "function stageRequest",
  providerInputStart,
);
const providerInputSource = runnerSource.slice(
  providerInputStart,
  providerInputEnd,
);
for (const forbidden of contract.forbidden_provider_input_fields) {
  if (providerInputSource.includes(forbidden)) {
    fail("expected data injection risk: " + forbidden);
  }
}
for (const required of [
  "current_situation",
  "optional_message",
  "relationship",
  "requested_topics",
]) {
  if (!providerInputSource.includes(required)) {
    fail("Provider input field missing: " + required);
  }
}
for (const requiredFragment of [
  "loadM2P4SemanticConsistencyRuntimeStageCatalog",
  "loadM2P4ProductQualityRuntimeStageCatalog",
  "transport.client.maxRetries = 0",
  "flag: \"wx\"",
  "\"--package-commit\"",
  "\"--confirm\"",
  "process.loadEnvFile",
  "M2_R2_R2_ONE_TIME_MARKER_CONSUMED",
]) {
  if (!runnerSource.includes(requiredFragment)) {
    fail("runner control missing: " + requiredFragment);
  }
}
for (const forbiddenFragment of [
  ["create", "Client("].join(""),
  "@supabase/",
  "from(\"consultations\")",
  "PB-02\"",
  "PB-03\"",
  "PB-04\"",
  "PB-05\"",
  "PB-06\"",
]) {
  if (runnerSource.includes(forbiddenFragment)) {
    fail("runner forbidden dependency: " + forbiddenFragment);
  }
}
if (
  /readFile\s*\([^)]*\.env\.local/gu.test(runnerSource) ||
  /console\.(?:log|error)\s*\([^)]*OPENAI_API_KEY/gu.test(runnerSource)
) {
  fail("environment secrecy boundary differs");
}

for (const requiredFragment of [
  "m2-p4-i3-r1-c1-r2-r2-provider-evaluator-v1",
  "sameUnorderedStrings",
  "exactMessageSignals",
  "exactCanonicalOwnership",
  "caseId === \"R2R2-01\"",
  "-KNOWN-TAXONOMY-PRECEDENCE",
  "caseId === \"R2R2-02\"",
  "-DECISION-WRITING-OWNER-CONSISTENCY",
  "caseId === \"R2R2-03\"",
  "-PRINCIPAL-QUOTED-OWNERSHIP",
  "caseId === \"R2R2-04\"",
  "-NORMAL-OWNERSHIP-CONTROL",
  "provider_output_immutability",
  "targeted_repairs",
  "normal_regression_control",
]) {
  if (!evaluatorSource.includes(requiredFragment)) {
    fail("evaluator frozen gate missing: " + requiredFragment);
  }
}

if (
  authorization.authorization_id !== contract.authorization_id ||
  authorization.confirmation_phrase !== contract.confirmation_phrase ||
  authorization.model !== contract.model ||
  authorization.stage !== "PB-01 v6 only" ||
  authorization.authorized_calls !== 4 ||
  capabilities.baseline !== baseline ||
  capabilities.branch !== branch ||
  capabilities.exact_paths !== 17 ||
  capabilities.post_run_mutable_paths !== 8 ||
  capabilities.synthetic_cases !== 4 ||
  capabilities.authorized_calls !== 4 ||
  capabilities.retry_count !== 0 ||
  capabilities.repair_count !== 0 ||
  capabilities.fallback_count !== 0 ||
  capabilities.db_operations !== 0 ||
  capabilities.supabase_operations !== 0 ||
  capabilities.holdout_use !== 0 ||
  capabilities.real_user_data !== 0 ||
  results.authorization_id !== contract.authorization_id ||
  results.branch !== branch ||
  results.requested_model !== contract.model ||
  results.calls_authorized !== 4 ||
  results.retry_count !== 0 ||
  results.repair_count !== 0 ||
  results.fallback_count !== 0 ||
  results.pb_02_through_pb_06_calls !== 0 ||
  results.db_operations !== 0 ||
  results.supabase_operations !== 0 ||
  results.holdout_use !== 0 ||
  results.real_user_data !== 0
) {
  fail("authorization, capabilities, or results envelope differs");
}

const candidateCatalog =
  await loadM2P4SemanticConsistencyRuntimeStageCatalog();
const activeCatalog = await loadM2P4ProductQualityRuntimeStageCatalog();
const candidatePb01 = candidateCatalog.definitions.find(
  (item) => item.stageId === "PB-01",
);
if (
  candidateCatalog.promptBundleVersion !== contract.prompt_bundle ||
  candidateCatalog.schemaSetVersion !== contract.runtime_schema_set ||
  candidatePb01?.promptVersion !== contract.prompt_version ||
  candidatePb01?.schemaVersion !== contract.provider_schema ||
  candidatePb01?.groundedSchemaVersion !== contract.grounded_schema ||
  activeCatalog.promptBundleVersion !== contract.active_prompt_bundle ||
  activeCatalog.schemaSetVersion !== contract.active_schema_set
) {
  fail("candidate or Active Runtime catalog differs");
}

if (results.status === "not_executed") {
  assertInitialState({
    authorization,
    capabilities,
    results,
    markerPath,
  });
  for (const requiredFragment of [
    "provider_targeted_diagnostic_package_ready",
    "0 / 4",
    "Provider quality established: false",
    "Full eight-case confirmation required: true",
    "C2 eligible / authorized: false / false",
  ]) {
    if (
      !summarySource.includes(requiredFragment) &&
      !reviewSource.includes(requiredFragment)
    ) {
      fail("pre-run documentation differs: " + requiredFragment);
    }
  }
} else {
  assertCompletedState({
    contract,
    caseBundle,
    qualityContract,
    authorization,
    capabilities,
    results,
    markerPath,
  });
  for (const requiredFragment of [
    results.status,
    results.evaluation.verdict,
    results.package_commit,
    "Provider quality established: false",
    "Full eight-case confirmation required: true",
    "C2 eligible / authorized: false / false",
  ]) {
    if (
      !summarySource.includes(requiredFragment) &&
      !reviewSource.includes(requiredFragment)
    ) {
      fail("post-run documentation differs: " + requiredFragment);
    }
  }
}

for (const docPath of [
  reviewPath,
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
]) {
  const doc = source(docPath);
  if (
    !doc.includes("human_chatgpt_reviewed_fail_complete") ||
    !doc.includes(
      "M2-P4-I3-R1-C1-R2-R2-R1 Offline Practical Reason Consistency Revision",
    ) ||
    !/unauthorized|not authorized/iu.test(doc)
  ) {
    fail("review synchronization document differs: " + docPath);
  }
}

console.log("M2_P4_I3_R1_C1_R2_R2_PROVIDER_DIAGNOSTIC: PASS");
console.log("exact_scope: 17/17");
console.log("diagnostic_snapshot: 17/17 immutable");
console.log("review_sync_scope: 8/8");
console.log("execution_artifacts_unchanged: 9/9");
console.log("synthetic_inputs_deep_equal: 4/4");
console.log(
  "provider_calls: " + results.calls_actual + "/" + contract.authorized_calls,
);
console.log(
  "authorization_consumed: " + String(results.authorization_consumed),
);
console.log("rerun_authorized: false");
console.log("frozen_targeted_verdict: FAIL");
console.log("targeted_repairs: 3/3 PASS");
console.log("ownership_sequence_control: PASS");
console.log("decision_policy_equivalent: PASS");
console.log("decision_facts_semantic_completeness: FAIL");
console.log("additional_provider_calls: 0");
console.log("r2_evidence_immutable: PASS");
console.log("r2_r1_snapshot_preserved: PASS");
console.log("prompt_v6_catalog_v7_unchanged: PASS");
console.log("expected_data_injection: 0");
console.log("protected_production_diff: 0");
console.log("active_runtime_changed: false");
console.log("provider_quality_established: false");
console.log("full_eight_case_confirmation_required: true");
console.log("c2_authorized: false");
