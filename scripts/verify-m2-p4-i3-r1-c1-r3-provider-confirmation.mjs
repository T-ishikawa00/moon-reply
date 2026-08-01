import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateDiagnostic,
  evaluateProviderCall,
  renderDiagnosticSummary,
  secretLeakageValues,
  shaDiagnosticJson,
} from "./lib/m2-p4-i3-r1-c1-r3-provider-evaluator-v1.mjs";
import {
  loadM2P4PracticalReasonConsistencyRuntimeStageCatalog,
  loadM2P4ProductQualityRuntimeStageCatalog,
  loadM2P4SemanticConsistencyRuntimeStageCatalog,
} from "../lib/assessment/runtime/schema-catalog.ts";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const artifactRoot = "evals/runtime/m2-p4-i3-r1-c1-r3";
const baseline = "3a56237a251bbc072ea34304a021c026fb7486f1";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const branch =
  "test/m2-p4-i3-r1-c1-r3-final-eight-case-provider-confirmation";
const exactPaths = [
  artifactRoot + "/diagnostic-cases-v1.json",
  artifactRoot + "/diagnostic-contract-v1.json",
  artifactRoot + "/quality-contract-v1.json",
  artifactRoot + "/authorization-v1.json",
  artifactRoot + "/capabilities-v1.json",
  artifactRoot + "/diagnostic-results-v1.json",
  artifactRoot + "/diagnostic-summary-v1.md",
  "scripts/lib/m2-p4-i3-r1-c1-r3-provider-evaluator-v1.mjs",
  "scripts/run-m2-p4-i3-r1-c1-r3-provider-confirmation.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r3-provider-confirmation.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r2-r1-practical-reason-consistency.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const postRunMutablePaths = [
  artifactRoot + "/authorization-v1.json",
  artifactRoot + "/capabilities-v1.json",
  artifactRoot + "/diagnostic-results-v1.json",
  artifactRoot + "/diagnostic-summary-v1.md",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const frozenAfterCommitAPaths = [
  artifactRoot + "/diagnostic-cases-v1.json",
  artifactRoot + "/diagnostic-contract-v1.json",
  artifactRoot + "/quality-contract-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-provider-evaluator-v1.mjs",
  "scripts/run-m2-p4-i3-r1-c1-r3-provider-confirmation.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r3-provider-confirmation.mjs",
];
const contractPath = artifactRoot + "/diagnostic-contract-v1.json";
const casesPath = artifactRoot + "/diagnostic-cases-v1.json";
const qualityPath = artifactRoot + "/quality-contract-v1.json";
const authorizationPath = artifactRoot + "/authorization-v1.json";
const capabilitiesPath = artifactRoot + "/capabilities-v1.json";
const resultsPath = artifactRoot + "/diagnostic-results-v1.json";
const summaryPath = artifactRoot + "/diagnostic-summary-v1.md";
const reviewPath = "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_REVIEW.md";
const evaluatorPath =
  "scripts/lib/m2-p4-i3-r1-c1-r3-provider-evaluator-v1.mjs";
const runnerPath =
  "scripts/run-m2-p4-i3-r1-c1-r3-provider-confirmation.mjs";

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
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
  throw new Error("M2_P4_I3_R1_C1_R3_VERIFY: " + message);
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function normalizedPaths(value) {
  return value
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean);
}

function same(left, right) {
  if (left === null || typeof left !== "object") {
    return JSON.stringify(left) === JSON.stringify(right);
  }
  if (right === null || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => same(item, right[index]))
    );
  }
  const leftKeys = sorted(Object.keys(left));
  const rightKeys = sorted(Object.keys(right));
  return (
    same(leftKeys, rightKeys) &&
    leftKeys.every((key) => same(left[key], right[key]))
  );
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertExactPaths(actual, expected, label) {
  assert(
    new Set(actual).size === actual.length &&
      same(sorted(actual), sorted(expected)),
    label + " must be exact",
  );
}

function currentTaskPaths() {
  const tracked = normalizedPaths(git(["diff", "--name-only", baseline, "--"]));
  const untracked = normalizedPaths(
    git(["ls-files", "--others", "--exclude-standard"]),
  );
  return sorted(new Set([...tracked, ...untracked]));
}

function changedPaths(fromCommit, toCommit = null) {
  const args = ["diff", "--name-only", fromCommit];
  if (toCommit) args.push(toCommit);
  args.push("--");
  return sorted(new Set(normalizedPaths(git(args))));
}

function sha256Utf8Lf(relativePath) {
  const normalized = source(relativePath).replaceAll("\r\n", "\n");
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

function sha256Bytes(relativePath) {
  return createHash("sha256")
    .update(readFileSync(absolute(relativePath)))
    .digest("hex");
}

function assertNoTrailingWhitespace(relativePath) {
  const text = source(relativePath);
  assert(!/[ \t]+$/mu.test(text), relativePath + " has trailing whitespace");
  assert(text.endsWith("\n"), relativePath + " must end with newline");
}

function assertUnchangedFromBaseline(paths, label) {
  const output = git(["diff", "--name-only", baseline, "--", ...paths]);
  assert(output === "", label + " changed from baseline");
}

function assertInitialState({
  authorization,
  capabilities,
  results,
  markerPath,
}) {
  assert(authorization.consumed === false, "initial authorization consumed");
  assert(
    authorization.rerun_authorized === false &&
      authorization.actual_calls === 0 &&
      authorization.completion_state === "not_executed",
    "initial authorization state invalid",
  );
  assert(!existsSync(markerPath), "R3 marker must be absent before execution");
  assert(
    capabilities.status === "provider_final_confirmation_package_ready" &&
      capabilities.actual_calls === 0 &&
      capabilities.completed_calls === 0 &&
      capabilities.authorization_consumed === false &&
      capabilities.provider_quality_established === false &&
      capabilities.candidate_ready_for_isolated_e2e === false &&
      capabilities.c2_authorized === false,
    "initial capability state invalid",
  );
  assert(
    results.status === "not_executed" &&
      results.calls_actual === 0 &&
      results.calls_completed === 0 &&
      results.calls.length === 0 &&
      results.authorization_consumed === false &&
      results.evaluation.verdict === "NOT_EXECUTED" &&
      results.provider_quality_established === false &&
      results.candidate_ready_for_isolated_e2e === false,
    "initial result state invalid",
  );
}

function assertCallEvidence(call, diagnosticCase, qualityCase, index, contract) {
  assert(call.case_id === diagnosticCase.case_id, "call case ID mismatch");
  assert(
    call.source_case_reference === diagnosticCase.source_case_reference,
    call.case_id + " source reference mismatch",
  );
  assert(call.call_index === index + 1, call.case_id + " call index mismatch");
  assert(
    same(call.synthetic_input, diagnosticCase.synthetic_input),
    call.case_id + " stored input mismatch",
  );
  assert(
    same(call.focus_tags, diagnosticCase.focus_tags),
    call.case_id + " stored focus tags mismatch",
  );
  assert(
    call.requested_model === contract.model,
    call.case_id + " requested model mismatch",
  );
  assert(
    call.raw_output === null
      ? call.raw_output_sha256 === null
      : call.raw_output_sha256 === shaDiagnosticJson(call.raw_output),
    call.case_id + " raw output hash mismatch",
  );
  assert(
    call.raw_output_sha256 === call.raw_output_sha256_after_processing &&
      call.provider_output_mutated === false,
    call.case_id + " Provider output was mutated",
  );
  assert(
    call.grounded_output === null
      ? call.grounded_output_sha256 === null
      : call.grounded_output_sha256 === shaDiagnosticJson(call.grounded_output),
    call.case_id + " grounded output hash mismatch",
  );
  assert(call.secret_leakage_count === 0, call.case_id + " secret leakage");
  assert(
    call.raw_pii_copied_count === 0,
    call.case_id + " copied raw PII into writing_signals",
  );
  assert(
    call.forbidden_bookkeeping_count === 0 &&
      call.probability_confidence_field_count === 0 &&
      call.case_fixture_oracle_reference_count === 0,
    call.case_id + " forbidden output field/reference detected",
  );
  for (const value of Object.values(call.usage ?? {})) {
    assert(
      Number.isInteger(value) && value >= 0,
      call.case_id + " usage must be nonnegative integers",
    );
  }
  const reevaluated = evaluateProviderCall({ call, contract, qualityCase });
  assert(
    same(reevaluated, call.evaluation),
    call.case_id + " saved evaluation differs from frozen evaluator",
  );
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
  assert(existsSync(markerPath), "consumed R3 marker is missing");
  const marker = JSON.parse(readFileSync(markerPath, "utf8"));
  assert(
    marker.task_id === contract.task_id &&
      marker.authorization_id === contract.authorization_id &&
      marker.confirmation_phrase === contract.confirmation_phrase &&
      marker.authorized_calls === 8 &&
      marker.rerun_authorized === false &&
      marker.secrets_saved === false,
    "consumed marker content invalid",
  );
  assert(
    authorization.consumed === true &&
      authorization.rerun_authorized === false &&
      authorization.package_commit === results.package_commit &&
      authorization.actual_calls === results.calls_actual &&
      authorization.completed_calls === results.calls_completed &&
      authorization.completion_state === results.status,
    "completed authorization state invalid",
  );
  assert(
    /^[0-9a-f]{40}$/u.test(results.package_commit ?? ""),
    "Commit A missing from results",
  );
  assert(
    results.calls_actual <= contract.authorized_calls &&
      results.calls_actual === results.calls.length &&
      results.calls_completed ===
        results.calls.filter((call) => call.provider_completed === true).length,
    "call cardinality invalid",
  );
  if (results.safe_stop_code === null) {
    assert(results.calls_actual === 8, "nonfatal execution must attempt 8 calls");
  }
  assert(
    results.retry_count === 0 &&
      results.repair_count === 0 &&
      results.fallback_count === 0 &&
      results.pb_02_through_pb_06_calls === 0 &&
      results.db_operations === 0 &&
      results.supabase_operations === 0 &&
      results.holdout_use === 0 &&
      results.real_user_data === 0,
    "execution boundary exceeded",
  );
  for (const [index, call] of results.calls.entries()) {
    const qualityCase = qualityContract.cases[index];
    assertCallEvidence(call, caseBundle[index], qualityCase, index, contract);
  }
  assert(
    secretLeakageValues(results).length === 0,
    "result artifact contains secret material",
  );
  const reevaluated = evaluateDiagnostic(contract, qualityContract, results);
  assert(
    same(reevaluated, results.evaluation),
    "saved aggregate evaluation differs from frozen evaluator",
  );
  const pass = results.evaluation.verdict === "PASS";
  const blocked = results.evaluation.verdict === "EVALUATION_BLOCKED";
  assert(
    results.status ===
      (pass
        ? "provider_final_confirmation_passed_pending_human_chatgpt_review"
        : blocked
          ? "evaluation_blocked_pending_human_chatgpt_review"
          : "provider_final_confirmation_failed_pending_human_chatgpt_review"),
    "final status and verdict disagree",
  );
  assert(
    results.provider_quality_established === pass &&
      results.candidate_ready_for_isolated_e2e === pass &&
      results.provider_quality_scope === "exact_eight_case_pb01_v7_suite" &&
      results.active_runtime_changed === false &&
      results.c2_eligible === false &&
      results.c2_authorized === false,
    "final readiness/runtime state invalid",
  );
  assert(
    capabilities.status === results.status &&
      capabilities.final_confirmation_verdict === results.evaluation.verdict &&
      capabilities.cases_passed ===
        String(results.evaluation.case_pass_count) + "/8" &&
      capabilities.provider_quality_established === pass &&
      capabilities.candidate_ready_for_isolated_e2e === pass &&
      capabilities.authorization_consumed === true &&
      capabilities.rerun_authorized === false &&
      capabilities.active_runtime_changed === false &&
      capabilities.main_changed === false &&
      capabilities.c2_authorized === false &&
      capabilities.next_candidate_authorized === false,
    "completed capability state invalid",
  );
  assert(
    source(summaryPath) === renderDiagnosticSummary(results),
    "diagnostic summary is not a frozen result rendering",
  );
  assert(
    marker.package_commit === results.package_commit &&
      authorization.package_commit === results.package_commit,
    "Commit A references disagree",
  );
  assertExactPaths(
    changedPaths(results.package_commit),
    postRunMutablePaths,
    "post-run mutable scope",
  );
  const frozenDiff = git([
    "diff",
    "--name-only",
    results.package_commit,
    "--",
    ...frozenAfterCommitAPaths,
  ]);
  assert(frozenDiff === "", "frozen package changed after Commit A");
}

for (const relativePath of exactPaths) {
  assert(existsSync(absolute(relativePath)), relativePath + " missing");
  assertNoTrailingWhitespace(relativePath);
}

const contract = json(contractPath);
const caseBundle = json(casesPath);
const qualityContract = json(qualityPath);
const authorization = json(authorizationPath);
const capabilities = json(capabilitiesPath);
const results = json(resultsPath);
const runnerSource = source(runnerPath);
const evaluatorSource = source(evaluatorPath);
const reviewSource = source(reviewPath);
const summarySource = source(summaryPath);
const markerPath = absolute(contract.one_time_marker);

assert(git(["branch", "--show-current"]).trim() === branch, "branch mismatch");
assert(git(["rev-parse", "main"]).trim() === mainBaseline, "main changed");
assert(
  git(["rev-parse", "origin/main"]).trim() === mainBaseline,
  "origin/main changed",
);
assert(git(["stash", "list"]) === "", "stash must be empty");
git(["diff", "--check", baseline, "--"]);
assertExactPaths(currentTaskPaths(), exactPaths, "exact R3 scope");
assertExactPaths(contract.exact_mutation_paths, exactPaths, "contract scope");
assertExactPaths(
  contract.post_run_mutable_paths,
  postRunMutablePaths,
  "contract post-run scope",
);
assertExactPaths(
  contract.frozen_after_commit_a_paths,
  frozenAfterCommitAPaths,
  "contract frozen scope",
);

assert(
  contract.task_id === "M2-P4-I3-R1-C1-R3" &&
    contract.authorization_id === "M2-P4-I3-R1-C1-R3-2026-08-02" &&
    contract.confirmation_phrase ===
      "R3-8-CALL-PROMPT-V7-SYNTHETIC-ONLY" &&
    contract.baseline === baseline &&
    contract.main_baseline === mainBaseline &&
    contract.branch === branch &&
    contract.model === "gpt-5.6-luna" &&
    contract.stage === "PB-01" &&
    contract.prompt === "pb-01-structure-v7" &&
    contract.prompt_version === "v7.0.0" &&
    contract.catalog === "runtime-stage-catalog-v8.0.0" &&
    contract.prompt_bundle === "prompt-bundle-runtime-v8.0.0" &&
    contract.provider_schema === "pipeline-schema-v5.0.0" &&
    contract.grounded_schema === "pipeline-schema-v4.0.0" &&
    contract.runtime_schema_set === "pipeline-schema-runtime-v3.2.0" &&
    contract.synthetic_cases === 8 &&
    contract.authorized_calls === 8 &&
    contract.rerun_authorized === false &&
    contract.c2_authorized === false,
  "contract identity/version boundary invalid",
);
assert(
  same(contract.execution_limits, {
    maximum_total_provider_calls: 8,
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
  }),
  "execution limits invalid",
);
assert(
  contract.one_time_marker ===
    ".git/moon-reply-m2-p4-i3-r1-c1-r3-provider-confirmation-consumed.json",
  "R3 marker path invalid",
);

const legacyCases = json(
  "evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-cases-v1.json",
);
assert(caseBundle.length === 8, "case count must be 8");
assert(qualityContract.case_count === 8, "quality case count must be 8");
assert(qualityContract.cases.length === 8, "quality cases must be 8");
for (const [index, diagnosticCase] of caseBundle.entries()) {
  const sourceCase = legacyCases[index];
  assert(
    same(sorted(Object.keys(diagnosticCase)), [
      "case_id",
      "focus_tags",
      "name",
      "source_case_reference",
      "synthetic_input",
    ]),
    diagnosticCase.case_id + " has forbidden case fields",
  );
  assert(
    diagnosticCase.case_id === "R3-" + String(index + 1).padStart(2, "0") &&
      diagnosticCase.source_case_reference === sourceCase.case_id &&
      diagnosticCase.name === sourceCase.name &&
      same(diagnosticCase.synthetic_input, sourceCase.synthetic_input) &&
      same(diagnosticCase.focus_tags, sourceCase.focus_tags),
    diagnosticCase.case_id + " is not exact R2 source input",
  );
  assert(
    qualityContract.cases[index].case_id === diagnosticCase.case_id &&
      qualityContract.cases[index].source_case_reference ===
        sourceCase.case_id,
    diagnosticCase.case_id + " quality mapping invalid",
  );
}
assert(
  same(qualityContract.set_semantics, {
    privacy_markers: "unordered_set",
    changed_fact_ids: "unordered_set_when_order_is_immaterial",
  }) &&
    same(qualityContract.sequence_semantics, {
      message_signals: "source_order_sensitive",
      canonical_message_ownership: "sequence_sensitive",
    }) &&
    same(qualityContract.correction_gates, [
      "known_taxonomy",
      "no_contact_ownership",
      "quoted_ownership",
      "practical_reason_consistency",
    ]),
  "frozen adjudication semantics invalid",
);
assert(
  qualityContract.cases.filter(
    (item) => item.practical_reason_consistency === true,
  ).length === 4,
  "practical reason applicable set must be 4",
);
assert(
  qualityContract.cases[2].required_constraints.includes(
    "no_private_contact_at_work",
  ) && qualityContract.cases[2].forbid_custom_constraints === true,
  "known constraint adjudication invalid",
);
assert(
  qualityContract.cases[3].boundary_signals[0]?.asserted_by ===
    "other_person",
  "no-contact ownership adjudication invalid",
);
assert(
  same(qualityContract.cases[7].raw_messages, [
    { author: "other_person", statuses: ["quoted_history"] },
  ]) &&
    same(qualityContract.cases[7].changed_fact_ids, []) &&
    qualityContract.cases[7].changed_fact_ids_order_immaterial === true,
  "quoted ownership/set adjudication invalid",
);

assert(
  sha256Utf8Lf("lib/assessment/runtime/contracts/pb-01-structure-v7.developer.md") ===
    contract.prompt_sha256_utf8_lf,
  "Prompt v7 hash changed",
);
assert(
  sha256Bytes("lib/assessment/runtime/contracts/runtime-stage-catalog-v8.json") ===
    contract.catalog_sha256,
  "catalog v8 hash changed",
);
assertUnchangedFromBaseline(
  [
    "lib/assessment/runtime/contracts/pb-01-structure-v7.developer.md",
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v8.json",
    "lib/assessment/runtime/contracts/pb-01-structure-v6.developer.md",
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v7.json",
    "lib/assessment/runtime/schema-catalog.ts",
    "lib/assessment/runtime/structured-intake-grounding-v5.ts",
    "lib/assessment/runtime/writing-context-integrity-v2.ts",
    "lib/assessment/runtime/contextual-integrity-v3.ts",
    "lib/assessment/runtime/policy-v3.ts",
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/service.ts",
  ],
  "Prompt/Schema/Application/Policy/Pipeline/Service boundary",
);
assertUnchangedFromBaseline(
  [
    "evals/runtime/m2-p4-i3-r1-c1-r2",
    "evals/runtime/m2-p4-i3-r1-c1-r2-r1",
    "evals/runtime/m2-p4-i3-r1-c1-r2-r2",
    "evals/runtime/m2-p4-i3-r1-c1-r2-r2-r1",
    "scripts/lib/m2-p4-i3-r1-c1-r2-provider-evaluator-v1.mjs",
    "scripts/lib/m2-p4-i3-r1-c1-r2-r2-provider-evaluator-v1.mjs",
    "scripts/run-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs",
    "scripts/run-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs",
  ],
  "previous R2 evidence",
);

const providerInputStart = runnerSource.indexOf("function providerInput");
const providerInputEnd = runnerSource.indexOf(
  "function stageRequest",
  providerInputStart,
);
assert(
  providerInputStart >= 0 && providerInputEnd > providerInputStart,
  "providerInput function missing",
);
const providerInputSource = runnerSource.slice(
  providerInputStart,
  providerInputEnd,
);
for (const forbidden of contract.forbidden_provider_input_fields) {
  assert(
    !providerInputSource.includes(forbidden),
    "Provider input exposes forbidden field " + forbidden,
  );
}
for (const required of [
  "current_situation",
  "optional_message",
  "relationship",
  "requested_topics",
]) {
  assert(
    providerInputSource.includes(required),
    "Provider input missing " + required,
  );
}
assert(
  runnerSource.includes(
    "loadM2P4PracticalReasonConsistencyRuntimeStageCatalog",
  ) &&
    runnerSource.includes("transport.client.maxRetries = 0") &&
    runnerSource.includes('flag: "wx"') &&
    runnerSource.includes("for (const [index, diagnosticCase]") &&
    !runnerSource.includes("Promise.all("),
  "runner one-time/sequential/retry controls invalid",
);
assert(
  evaluatorSource.includes("targeted_correction_gates") &&
    evaluatorSource.includes("PRACTICAL-REASON-CONSISTENCY") &&
    evaluatorSource.includes("PRINCIPAL-QUOTED-OWNERSHIP"),
  "evaluator hard gates missing",
);
assert(
  secretLeakageValues({
    runner: runnerSource,
    evaluator: evaluatorSource,
    review: reviewSource,
    summary: summarySource,
  }).length === 0,
  "package source contains secret material",
);

const candidateCatalog =
  await loadM2P4PracticalReasonConsistencyRuntimeStageCatalog();
const predecessorCatalog =
  await loadM2P4SemanticConsistencyRuntimeStageCatalog();
const activeCatalog = await loadM2P4ProductQualityRuntimeStageCatalog();
assert(
  candidateCatalog.promptBundleVersion ===
    "prompt-bundle-runtime-v8.0.0" &&
    candidateCatalog.schemaSetVersion === "pipeline-schema-runtime-v3.2.0",
  "candidate catalog version invalid",
);
assert(
  activeCatalog.promptBundleVersion === "prompt-bundle-runtime-v4.0.0" &&
    activeCatalog.schemaSetVersion === "pipeline-schema-runtime-v3.0.0",
  "Active Runtime changed",
);
const candidatePb01 = candidateCatalog.definitions.find(
  (item) => item.stageId === "PB-01",
);
assert(
  candidatePb01?.promptVersion === "v7.0.0" &&
    candidatePb01?.schemaVersion === "pipeline-schema-v5.0.0" &&
    candidatePb01?.groundedSchemaVersion === "pipeline-schema-v4.0.0",
  "candidate PB-01 version invalid",
);
for (const stageId of ["PB-02", "PB-03", "PB-04", "PB-05", "PB-06"]) {
  const candidate = candidateCatalog.definitions.find(
    (item) => item.stageId === stageId,
  );
  const predecessor = predecessorCatalog.definitions.find(
    (item) => item.stageId === stageId,
  );
  assert(same(candidate, predecessor), stageId + " changed in catalog v8");
}

const protectedPaths = currentTaskPaths().filter((item) =>
  /^(?:app|components|fixtures|lib|public|supabase)\//u.test(item) ||
  /^package(?:-lock)?\.json$/u.test(item) ||
  /(?:^|\/)\.env(?:\.|$)/u.test(item),
);
assert(protectedPaths.length === 0, "protected Production diff is nonzero");

if (authorization.consumed === false) {
  assertInitialState({ authorization, capabilities, results, markerPath });
  const head = git(["rev-parse", "HEAD"]).trim();
  if (head !== baseline) {
    assert(
      git(["rev-list", "--count", baseline + "..HEAD"]).trim() === "1" &&
        git(["rev-parse", "HEAD^"]).trim() === baseline &&
        git(["log", "-1", "--format=%s"]).trim() ===
          contract.package_commit_subject,
      "Commit A topology invalid",
    );
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
}

assert(
  reviewSource.includes("M2-P4-I3-R1-C1-R3") &&
    reviewSource.includes("C2") &&
    reviewSource.includes("unauthorized"),
  "review record boundary missing",
);

console.log("M2_P4_I3_R1_C1_R3_PROVIDER_CONFIRMATION: PASS");
console.log("exact_scope: 17/17");
console.log("synthetic_inputs_deep_equal: 8/8");
console.log("expected_data_injection: 0");
console.log("prompt_v7_catalog_v8_unchanged: PASS");
console.log("previous_evidence_immutable: PASS");
console.log("protected_production_diff: 0");
console.log("active_runtime_changed: false");
console.log("c2_authorized: false");
console.log(
  "provider_calls: " + results.calls_actual + "/" + contract.authorized_calls,
);
console.log("authorization_consumed: " + authorization.consumed);
console.log("rerun_authorized: false");
