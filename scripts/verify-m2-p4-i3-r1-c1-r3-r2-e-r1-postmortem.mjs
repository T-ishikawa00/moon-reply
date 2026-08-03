import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildAdjudicationResultV1,
  canonicalJson,
} from "./lib/m2-p4-i3-r1-c1-r3-r2-e-r1-adjudicator-v1.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R1";
const baseline = "c10169c92364a31f6c512e714ac18bffafc9ec08";
const packageCommitA = "ae56535fd6d5587e6055e938cd68e0355cd8f037";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const branch = "docs/m2-p4-i3-r1-c1-r3-r2-e-r1-postmortem";
const frozenRoot = "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e";
const artifactRoot = "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r1";
const contractPath = artifactRoot + "/adjudication-contract-v1.json";
const resultsPath = artifactRoot + "/adjudication-results-v1.json";
const postmortemPath = artifactRoot + "/postmortem-v1.json";
const capabilitiesPath = artifactRoot + "/capabilities-v1.json";
const adjudicatorPath =
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r1-adjudicator-v1.mjs";
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r1-postmortem.mjs";
const reviewPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R1_REVIEW.md";
const exactPaths = [
  postmortemPath,
  contractPath,
  resultsPath,
  capabilitiesPath,
  adjudicatorPath,
  verifierPath,
  reviewPath,
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const frozenPaths = [
  frozenRoot + "/diagnostic-contract-v1.json",
  frozenRoot + "/diagnostic-cases-v1.json",
  frozenRoot + "/quality-contract-v1.json",
  frozenRoot + "/authorization-v1.json",
  frozenRoot + "/diagnostic-results-v1.json",
  frozenRoot + "/diagnostic-summary-v1.md",
  frozenRoot + "/capabilities-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-provider-evaluator-v1.mjs",
  "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-provider-diagnostic.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_REVIEW.md",
];
const frozenResultsPath = frozenRoot + "/diagnostic-results-v1.json";
const frozenQualityPath = frozenRoot + "/quality-contract-v1.json";
const frozenCasesPath = frozenRoot + "/diagnostic-cases-v1.json";
const baseSchemaPath =
  "lib/assessment/runtime/contracts/base-structured-intake-v1.schema.json";
const candidateSchemaPath =
  "lib/assessment/runtime/contracts/candidate-analysis-v1.schema.json";
const basePromptPath =
  "lib/assessment/runtime/contracts/pb-01-base-situation-v1.developer.md";
const candidatePromptPath =
  "lib/assessment/runtime/contracts/pb-01c-candidate-analysis-v1.developer.md";

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
  throw new Error("M2_P4_I3_R1_C1_R3_R2_E_R1_VERIFY: " + message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
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

function assertExactPaths(actual, expected, label) {
  assert(new Set(actual).size === actual.length, label + " contains duplicates");
  assert(same(sorted(actual), sorted(expected)), label + " differs");
}

function currentTaskPaths() {
  const tracked = normalizedPaths(git(["diff", "--name-only", baseline, "--"]));
  const untracked = normalizedPaths(
    git(["ls-files", "--others", "--exclude-standard"]),
  );
  return sorted(new Set([...tracked, ...untracked]));
}

function assertTextHygiene(relativePath) {
  const text = source(relativePath);
  assert(!/[ \t]+$/mu.test(text), relativePath + " has trailing whitespace");
  assert(text.endsWith("\n"), relativePath + " must end with newline");
}

function assertFrozenBlob(relativePath) {
  const expected = git(["rev-parse", baseline + ":" + relativePath]).trim();
  const actual = git([
    "hash-object",
    "--path=" + relativePath,
    relativePath,
  ]).trim();
  assert(actual === expected, relativePath + " differs from frozen Commit B");
}

function sha256File(relativePath) {
  return createHash("sha256")
    .update(readFileSync(absolute(relativePath)))
    .digest("hex");
}

function countBy(values, selector) {
  const counts = {};
  for (const value of values) {
    const key = selector(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function viewCaseIds(caseStatuses, field, value) {
  return caseStatuses
    .filter((item) => item[field] === value)
    .map((item) => item.case_id);
}

const contract = json(contractPath);
const storedResults = json(resultsPath);
const postmortem = json(postmortemPath);
const capabilities = json(capabilitiesPath);
const frozenResults = json(frozenResultsPath);
const frozenQuality = json(frozenQualityPath);
const frozenCases = json(frozenCasesPath);
const frozenContract = json(frozenRoot + "/diagnostic-contract-v1.json");
const authorization = json(frozenRoot + "/authorization-v1.json");
const baseSchema = json(baseSchemaPath);
const candidateSchema = json(candidateSchemaPath);
const recomputed = buildAdjudicationResultV1({
  frozenResults,
  qualityContract: frozenQuality,
  caseBundle: frozenCases,
  adjudicationContract: contract,
  baseSchema,
  candidateSchema,
  basePrompt: source(basePromptPath),
  candidatePrompt: source(candidatePromptPath),
});

assert(git(["branch", "--show-current"]).trim() === branch, "branch mismatch");
assert(git(["rev-parse", "main"]).trim() === mainBaseline, "main changed");
assert(
  git(["rev-parse", "origin/main"]).trim() === mainBaseline,
  "origin/main changed",
);
assert(git(["stash", "list"]) === "", "stash must be empty");
assert(
  git(["merge-base", "--is-ancestor", packageCommitA, "HEAD"]) === "",
  "Commit A is not in history",
);
assert(
  git(["merge-base", "--is-ancestor", baseline, "HEAD"]) === "",
  "Commit B is not in history",
);

for (const relativePath of exactPaths) {
  assert(existsSync(absolute(relativePath)), relativePath + " missing");
  assertTextHygiene(relativePath);
}
for (const relativePath of frozenPaths) assertFrozenBlob(relativePath);

const taskPaths = currentTaskPaths();
assertExactPaths(taskPaths, exactPaths, "exact E-R1 scope");
assertExactPaths(contract.exact_mutation_paths, exactPaths, "contract scope");
assertExactPaths(contract.immutable_e_paths, frozenPaths, "frozen E scope");
assert(new Set(exactPaths).size === exactPaths.length, "duplicate exact path");

for (const relativePath of [
  postmortemPath,
  contractPath,
  resultsPath,
  capabilitiesPath,
]) {
  json(relativePath);
}

assert(
  contract.task_id === taskId &&
    contract.baseline === baseline &&
    contract.e_package_commit_a === packageCommitA &&
    contract.e_evidence_commit_b === baseline &&
    contract.main_baseline === mainBaseline &&
    contract.branch === branch &&
    contract.exact_mutation_path_count === exactPaths.length &&
    contract.provider_calls === 0 &&
    contract.provider_rerun_authorized === false &&
    contract.db_operations === 0 &&
    contract.supabase_operations === 0 &&
    contract.provider_quality_established === false &&
    contract.candidate_ready_for_isolated_e2e === false &&
    contract.r4_authorized === false &&
    contract.e_r2_authorized === false &&
    contract.c2_authorized === false &&
    contract.frozen_evidence_must_remain_unchanged === true,
  "adjudication contract authority differs",
);
assert(
  contract.no_oracle_rule.human_or_chatgpt_prior_guesses_are_oracles === false &&
    contract.no_oracle_rule.predefined_corrected_result_allowed === false &&
    contract.no_oracle_rule.predefined_residual_count_allowed === false &&
    contract.no_oracle_rule.predefined_residual_case_ids_allowed === false &&
    contract.no_oracle_rule.predefined_category_counts_allowed === false &&
    contract.no_oracle_rule.case_id_result_override_allowed === false &&
    contract.no_oracle_rule.failure_code_result_override_allowed === false &&
    contract.no_oracle_rule.counts_must_be_derived_from_mapping === true &&
    contract.no_oracle_rule.case_lists_must_be_derived_from_mapping === true,
  "no-oracle contract differs",
);
assert(
  contract.semantic_field_rules.every(
    (rule) =>
      !Object.hasOwn(rule, "case_id") &&
      !Object.hasOwn(rule, "failure_code") &&
      typeof rule.json_path === "string",
  ),
  "semantic rules contain a case or failure override",
);

assert(
  authorization.consumed === true &&
    authorization.rerun_authorized === false &&
    authorization.actual_calls === frozenContract.authorized_calls &&
    authorization.completed_calls === frozenContract.authorized_calls,
  "frozen authorization differs",
);
assert(
  frozenResults.calls.length === frozenContract.authorized_calls &&
    frozenResults.calls_actual === frozenContract.authorized_calls &&
    frozenResults.calls_completed === frozenContract.authorized_calls &&
    frozenResults.pb_01_calls === frozenContract.pb_01_calls &&
    frozenResults.pb_01c_calls === frozenContract.pb_01c_calls &&
    frozenResults.calls.every(
      (call) => call.provider_attempted && call.provider_completed,
    ),
  "frozen Provider evidence is incomplete",
);
assert(
  frozenResults.evaluation.verdict === "FAIL" &&
    frozenResults.evaluation.case_pass_count === 6 &&
    frozenResults.evaluation.case_count === frozenResults.calls.length,
  "frozen machine result changed",
);
assert(
  frozenResults.authorization_consumed === true &&
    frozenResults.rerun_authorized === false &&
    frozenResults.provider_output_mutation_count === 0 &&
    frozenResults.expected_data_injection_count === 0 &&
    frozenResults.secret_leakage_count === 0,
  "frozen evidence safety differs",
);

for (const [relativePath, expectedHash] of Object.entries(
  postmortem.frozen_e_artifact_sha256,
)) {
  assert(frozenPaths.includes(relativePath), "unknown frozen hash path");
  assert(sha256File(relativePath) === expectedHash, relativePath + " SHA-256 differs");
}
assert(
  Object.keys(postmortem.frozen_e_artifact_sha256).length ===
    frozenPaths.length,
  "frozen hash manifest is incomplete",
);

assert(same(recomputed, storedResults), "deterministic replay differs");
assert(
  storedResults.task_id === taskId &&
    storedResults.status ===
      "offline_postmortem_completed_pending_human_chatgpt_review" &&
    storedResults.overall_postmortem_status ===
      "PASS_PENDING_HUMAN_CHATGPT_REVIEW" &&
    storedResults.classification_complete === true,
  "stored result status differs",
);

const frozenFailureCodes = frozenResults.evaluation.hard_failures.map(
  (item) => item.failure,
);
const classifications = storedResults.classifications;
const classifiedCodes = classifications.map((item) => item.failure_code);
assert(
  classifications.length === frozenFailureCodes.length &&
    new Set(classifiedCodes).size === classifiedCodes.length &&
    same(sorted(classifiedCodes), sorted(frozenFailureCodes)),
  "frozen failures are not classified exactly once",
);
for (const item of classifications) {
  for (const field of contract.required_classification_fields) {
    assert(Object.hasOwn(item, field), item.failure_code + " missing " + field);
  }
  assert(
    contract.allowed_classification_categories.includes(item.primary_category),
    item.failure_code + " has unknown category",
  );
  assert(
    contract.allowed_confidence_values.includes(item.confidence),
    item.failure_code + " has unknown confidence",
  );
  assert(
    contract.allowed_production_change_indications.includes(
      item.production_change_indicated,
    ),
    item.failure_code + " has unknown production indication",
  );
  assert(
    contract.allowed_next_owners.includes(item.recommended_next_owner),
    item.failure_code + " has unknown next owner",
  );
  assert(
    typeof item.frozen_evidence_json_pointer === "string" &&
      item.frozen_evidence_json_pointer.startsWith("/"),
    item.failure_code + " has invalid evidence pointer",
  );
  assert(
    Array.isArray(item.supporting_frozen_paths) &&
      item.supporting_frozen_paths.length > 0 &&
      item.supporting_frozen_paths.every((itemPath) =>
        frozenPaths.includes(itemPath),
      ),
    item.failure_code + " cites non-frozen evidence",
  );
}
const derivedCategoryCounts = countBy(
  classifications,
  (item) => item.primary_category,
);
for (const category of contract.allowed_classification_categories) {
  assert(
    storedResults.category_counts[category] ===
      (derivedCategoryCounts[category] ?? 0),
    category + " count differs from mapping",
  );
}

assert(
  storedResults.evaluator_hypotheses["EV-H1"].status === "confirmed" &&
    storedResults.evaluator_hypotheses["EV-H1"].frozen_result === "FAIL" &&
    storedResults.evaluator_hypotheses["EV-H1"].successor_result === "PASS",
  "EV-H1 reproducer differs",
);
assert(
  storedResults.evaluator_hypotheses["EV-H2"].status === "confirmed" &&
    storedResults.evaluator_hypotheses["EV-H2"]
      .frozen_scoped_assertions_passed === true &&
    storedResults.evaluator_hypotheses["EV-H2"]
      .frozen_global_leakage_counter > 0 &&
    storedResults.evaluator_hypotheses["EV-H2"].successor_scoped_result ===
      "PASS",
  "EV-H2 reproducer differs",
);
assert(
  storedResults.evaluator_successor_self_tests.total > 0 &&
    storedResults.evaluator_successor_self_tests.passed ===
      storedResults.evaluator_successor_self_tests.total &&
    storedResults.evaluator_successor_self_tests.results.every(
      (item) => item.passed === true,
    ),
  "Evaluator successor self-tests failed",
);

const contextualFailureCaseIds = frozenResults.calls
  .filter(
    (call) =>
      call.contextual_integrity_result?.safe_error_code ===
      "M2_CONTEXTUAL_INFERENCE_INVALID",
  )
  .map((call) => call.case_id);
const contextualFindingCaseIds =
  storedResults.application_bookkeeping_findings.map((item) => item.case_id);
assert(
  same(sorted(contextualFindingCaseIds), sorted(contextualFailureCaseIds)) &&
    storedResults.application_bookkeeping_findings.every(
      (item) =>
        item.deterministic_application_correction_possible === true &&
        item.semantic_value_requires_natural_language_reinterpretation ===
          false,
    ),
  "Contextual Integrity analysis is incomplete",
);

const caseStatuses = storedResults.case_level_derived_statuses;
const providerPass = viewCaseIds(
  caseStatuses,
  "provider_semantic_status",
  "pass",
);
const providerFail = viewCaseIds(
  caseStatuses,
  "provider_semantic_status",
  "fail",
);
const providerUnresolved = viewCaseIds(
  caseStatuses,
  "provider_semantic_status",
  "unresolved",
);
const providerView = storedResults.provider_semantic_adjudication;
assert(
  same(providerView.pass_cases, providerPass) &&
    same(providerView.fail_cases, providerFail) &&
    same(providerView.unresolved_cases, providerUnresolved) &&
    providerView.counts.pass === providerPass.length &&
    providerView.counts.fail === providerFail.length &&
    providerView.counts.unresolved === providerUnresolved.length &&
    providerView.counts.total === caseStatuses.length,
  "Provider semantic view is inconsistent",
);
const runtimeReady = viewCaseIds(
  caseStatuses,
  "split_runtime_readiness_status",
  "ready",
);
const runtimeBlocked = viewCaseIds(
  caseStatuses,
  "split_runtime_readiness_status",
  "blocked",
);
const runtimeUnresolved = viewCaseIds(
  caseStatuses,
  "split_runtime_readiness_status",
  "unresolved",
);
const runtimeView = storedResults.split_runtime_readiness_adjudication;
assert(
  same(runtimeView.ready_cases, runtimeReady) &&
    same(runtimeView.blocked_cases, runtimeBlocked) &&
    same(runtimeView.unresolved_cases, runtimeUnresolved) &&
    runtimeView.counts.ready === runtimeReady.length &&
    runtimeView.counts.blocked === runtimeBlocked.length &&
    runtimeView.counts.unresolved === runtimeUnresolved.length &&
    runtimeView.counts.total === caseStatuses.length,
  "Runtime readiness view is inconsistent",
);

const boundary = storedResults.candidate_source_isolation_boundary;
assert(
  boundary.provider_input_isolation === true &&
    boundary.base_candidate_field_count === 0 &&
    boundary.base_optional_message_source_ref_count === 0 &&
    boundary.candidate_base_fact_field_count === 0 &&
    boundary.candidate_raw_echo_count === 0 &&
    boundary.candidate_operational_metadata_count === 0 &&
    boundary.schema_pass === true &&
    boundary.source_integrity_pass === true &&
    boundary.provider_output_immutability === true &&
    boundary.expected_data_injection_count === 0 &&
    boundary.secret_leakage_count === 0 &&
    boundary.candidate_source_isolation_provider_boundary_confirmed === true &&
    boundary.provider_quality_established === false,
  "Candidate source-isolation boundary is not derived from frozen metrics",
);

const decisions = storedResults.product_owner_decisions_required;
assert(
  decisions.length > 0 &&
    decisions.every(
      (item) =>
        item.product_owner_answer === "pending" &&
        typeof item.question === "string" &&
        typeof item.option_a === "string" &&
        typeof item.option_b === "string" &&
        typeof item.chatgpt_recommendation === "string",
    ),
  "Product Owner decisions are incomplete",
);
const review = source(reviewPath);
for (const heading of [
  "## 1. Status",
  "## 2. Frozen E execution authority",
  "## 3. Why the frozen 6/14 is not overwritten",
  "## 4. Independence / no-oracle statement",
  "## 5. Evaluator hypothesis results",
  "## 6. Quality Contract responsibility results",
  "## 7. Application bookkeeping findings",
  "## 8. Provider / Prompt findings",
  "## 9. Unresolved findings",
  "## 10. Provider semantic adjudication",
  "## 11. Split Runtime readiness adjudication",
  "## 12. Candidate source-isolation boundary",
  "## 13. Product Owner Decision Required Before E-R2",
  "## 14. Validation",
  "## 15. Acceptance boundary",
  "## 16. Next candidate unauthorized",
]) {
  assert(review.includes(heading), "review heading missing: " + heading);
}
for (const decision of decisions) {
  assert(
    review.includes(decision.decision_id) && review.includes("`pending`"),
    decision.decision_id + " missing from review",
  );
}

assert(
  storedResults.safeguards.provider_calls_in_this_task === 0 &&
    storedResults.safeguards.provider_rerun_authorized === false &&
    storedResults.safeguards.db_operations === 0 &&
    storedResults.safeguards.supabase_operations === 0 &&
    storedResults.safeguards.provider_output_mutation_count === 0 &&
    storedResults.safeguards.expected_data_injection_count === 0 &&
    storedResults.safeguards.secret_leakage_count === 0 &&
    storedResults.safeguards.provider_quality_established === false &&
    storedResults.safeguards.candidate_ready_for_isolated_e2e === false &&
    storedResults.safeguards.e_r2_authorized === false &&
    storedResults.safeguards.r4_authorized === false &&
    storedResults.safeguards.c2_authorized === false,
  "result safeguard boundary differs",
);

assert(
  capabilities.status === storedResults.status &&
    capabilities.task_id === taskId &&
    capabilities.baseline === baseline &&
    capabilities.branch === branch &&
    capabilities.exact_scope === `${exactPaths.length}/${exactPaths.length}` &&
    capabilities.frozen_e_machine_verdict ===
      storedResults.frozen_evidence.machine_verdict &&
    capabilities.frozen_e_case_result ===
      storedResults.frozen_evidence.machine_case_result &&
    capabilities.execution_protocol_accepted === true &&
    capabilities.execution_evidence_valid === true &&
    capabilities.provider_calls_in_this_task === 0 &&
    capabilities.provider_rerun_authorized === false &&
    capabilities.classification_complete === true &&
    same(capabilities.classification_category_counts, storedResults.category_counts) &&
    same(
      capabilities.provider_semantic_adjudication,
      { source: "computed_from_evidence", ...providerView.counts },
    ) &&
    same(
      capabilities.runtime_readiness_adjudication,
      { source: "computed_from_evidence", ...runtimeView.counts },
    ) &&
    same(capabilities.unresolved_case_ids, providerUnresolved) &&
    capabilities.product_owner_decisions_required === decisions.length &&
    capabilities.candidate_source_isolation_provider_boundary_confirmed ===
      true &&
    capabilities.provider_quality_established === false &&
    capabilities.candidate_ready_for_isolated_e2e === false &&
    capabilities.r4_ready === false &&
    capabilities.r4_authorized === false &&
    capabilities.e_r2_authorized === false &&
    capabilities.c2_authorized === false &&
    capabilities.db_operations === 0 &&
    capabilities.supabase_operations === 0 &&
    capabilities.migration_applied === false &&
    capabilities.active_service_changed === false &&
    capabilities.active_runtime_activated === false &&
    capabilities.main_changed === false &&
    capabilities.next_candidate_authorized === false,
  "capabilities differ from computed result",
);

assert(
  postmortem.task_id === taskId &&
    postmortem.baseline === baseline &&
    postmortem.e_package_commit_a === packageCommitA &&
    postmortem.e_evidence_commit_b === baseline &&
    postmortem.frozen_execution.protocol === "accepted" &&
    postmortem.frozen_execution.machine_verdict ===
      storedResults.frozen_evidence.machine_verdict &&
    postmortem.frozen_execution.machine_case_result ===
      storedResults.frozen_evidence.machine_case_result &&
    postmortem.independence.prior_human_or_chatgpt_guesses_used_as_oracle ===
      false &&
    postmortem.independence.predefined_counts_used === false &&
    postmortem.independence.predefined_residual_case_ids_used === false &&
    postmortem.independence.case_id_result_override_used === false &&
    postmortem.product_owner_decisions_required.count === decisions.length &&
    postmortem.authorization_boundary.provider_rerun_authorized === false &&
    postmortem.authorization_boundary.e_r2_authorized === false &&
    postmortem.authorization_boundary.r4_authorized === false &&
    postmortem.authorization_boundary.c2_authorized === false &&
    postmortem.authorization_boundary.migration_applied === false &&
    postmortem.authorization_boundary.active_service_changed === false &&
    postmortem.authorization_boundary.active_runtime_activated === false &&
    postmortem.authorization_boundary.main_changed === false,
  "postmortem boundary differs",
);
for (const category of contract.allowed_classification_categories) {
  assert(
    postmortem.classification_summary[category] ===
      storedResults.category_counts[category],
    "postmortem category count differs: " + category,
  );
}
assert(
  same(
    postmortem.provider_semantic_adjudication.fail_case_ids,
    providerView.fail_cases,
  ) &&
    same(
      postmortem.split_runtime_readiness_adjudication.blocked_case_ids,
      runtimeView.blocked_cases,
    ),
  "postmortem view case lists differ",
);

const codeSources = source(adjudicatorPath) + "\n" + source(verifierPath);
for (const forbiddenCapability of [
  "Open" + "AiResponsesTransport",
  "responses" + ".create(",
  "new " + "OpenAI(",
  "fetch" + "(",
  ".inv" + "oke(",
  "create" + "Client(",
]) {
  assert(
    !codeSources.includes(forbiddenCapability),
    "offline code contains external invocation capability",
  );
}
for (const forbiddenRead of [
  ".env" + ".local",
  "process" + ".env",
]) {
  assert(
    !codeSources.includes(forbiddenRead),
    "offline code contains forbidden environment access",
  );
}
for (const forbiddenDbCapability of [
  "@su" + "pabase",
  "SUPA" + "BASE_URL",
  "SUPA" + "BASE_SERVICE_ROLE_KEY",
  ".fr" + "om(",
]) {
  assert(
    !source(adjudicatorPath).includes(forbiddenDbCapability),
    "adjudicator contains DB capability",
  );
}

const protectedDiff = taskPaths.filter((relativePath) =>
  /^(?:app|components|fixtures|lib|public|supabase)\//u.test(relativePath),
);
assert(protectedDiff.length === 0, "Runtime or migration diff detected");
assert(
  normalizedPaths(
    git(["diff", "--name-only", baseline, "--", "supabase/migrations"]),
  ).length === 0,
  "migration changed",
);

for (const docPath of [
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
]) {
  const text = source(docPath);
  for (const required of [
    "offline_postmortem_completed_pending_human_chatgpt_review",
    "FAIL / 6 of 14",
    "Provider calls `0`",
    "Product Owner decisions `4`",
    "Provider quality remains unestablished",
    "R4 remains HOLD",
    "E-R2 remains unauthorized",
    "Active Runtime, main, and migration remain unchanged",
  ]) {
    assert(text.includes(required), docPath + " missing: " + required);
  }
}

const policyOutput = execFileSync(
  process.execPath,
  [absolute("evals/quality/m2-p4-i1/verify-decision-policy.mjs")],
  {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);
assert(
  policyOutput.includes("40/40") && policyOutput.includes("PASS"),
  "Decision Policy did not report 40/40 PASS",
);

git(["diff", "--check", baseline, "--"]);

console.log("M2_P4_I3_R1_C1_R3_R2_E_R1_POSTMORTEM: PASS");
console.log(`exact_scope: ${exactPaths.length}/${exactPaths.length}`);
console.log(`json_parse: 4/4`);
console.log(`frozen_e_artifacts: ${frozenPaths.length}/${frozenPaths.length}`);
console.log(`frozen_provider_evidence: ${frozenResults.calls.length}/${frozenResults.calls.length}`);
console.log(`classified_failure_codes: ${classifications.length}/${frozenFailureCodes.length}`);
console.log(
  `evaluator_self_tests: ${storedResults.evaluator_successor_self_tests.passed}/${storedResults.evaluator_successor_self_tests.total}`,
);
console.log(
  `provider_semantic: pass=${providerPass.length} fail=${providerFail.length} unresolved=${providerUnresolved.length}`,
);
console.log(
  `runtime_readiness: ready=${runtimeReady.length} blocked=${runtimeBlocked.length} unresolved=${runtimeUnresolved.length}`,
);
console.log(`product_owner_decisions: ${decisions.length}`);
console.log("provider_calls: 0");
console.log("db_operations: 0");
console.log("supabase_operations: 0");
console.log("provider_quality_established: false");
console.log("candidate_ready_for_isolated_e2e: false");
console.log("e_r2_authorized: false");
console.log("r4_authorized: false");
console.log("policy: 40/40 PASS");
console.log("git_diff_check: PASS");
