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
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R1-R1";
const baseline = "dcd34011bfc2638bc0a1f7bd9b965b9880497a40";
const packageCommitA = "ae56535fd6d5587e6055e938cd68e0355cd8f037";
const evidenceCommitB = "c10169c92364a31f6c512e714ac18bffafc9ec08";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const branch =
  "docs/m2-p4-i3-r1-c1-r3-r2-e-r1-r1-product-direction";
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

function npm(args) {
  return execFileSync("cmd.exe", ["/d", "/c", "npm.cmd", ...args], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function fail(message) {
  throw new Error("M2_P4_I3_R1_C1_R3_R2_E_R1_R1_VERIFY: " + message);
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
  const expected = git([
    "rev-parse",
    evidenceCommitB + ":" + relativePath,
  ]).trim();
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

function idsBy(caseStatuses, field, value) {
  return caseStatuses
    .filter((item) => item[field] === value)
    .map((item) => item.case_id);
}

function derivedView(caseStatuses, field, mapping) {
  const result = {};
  const counts = {};
  for (const [resultKey, status] of Object.entries(mapping)) {
    const ids = idsBy(caseStatuses, field, status);
    result[resultKey] = ids;
    counts[status] = ids.length;
  }
  counts.total = caseStatuses.length;
  return { ...result, counts };
}

function classificationByCode(classifications, failureCode) {
  const item = classifications.find(
    (classification) => classification.failure_code === failureCode,
  );
  assert(item, failureCode + " classification missing");
  return item;
}

function decisionById(decisions, decisionId) {
  const item = decisions.find((decision) => decision.decision_id === decisionId);
  assert(item, decisionId + " decision missing");
  return item;
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
for (const commit of [packageCommitA, evidenceCommitB, baseline]) {
  assert(
    git(["merge-base", "--is-ancestor", commit, "HEAD"]) === "",
    commit + " is not in history",
  );
}

for (const relativePath of exactPaths) {
  assert(existsSync(absolute(relativePath)), relativePath + " missing");
  assertTextHygiene(relativePath);
}
for (const relativePath of frozenPaths) assertFrozenBlob(relativePath);

const taskPaths = currentTaskPaths();
assertExactPaths(taskPaths, exactPaths, "exact Product Direction Sync scope");
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
    contract.status ===
      "product_direction_synced_pending_human_chatgpt_review" &&
    contract.baseline === baseline &&
    contract.e_package_commit_a === packageCommitA &&
    contract.e_evidence_commit_b === evidenceCommitB &&
    contract.e_r1_baseline === baseline &&
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
  contract.no_oracle_rule.human_or_chatgpt_prior_guesses_are_oracles ===
      false &&
    contract.no_oracle_rule.predefined_corrected_result_allowed === false &&
    contract.no_oracle_rule.predefined_residual_count_allowed === false &&
    contract.no_oracle_rule.predefined_residual_case_ids_allowed === false &&
    contract.no_oracle_rule.predefined_category_counts_allowed === false &&
    contract.no_oracle_rule.predefined_view_counts_allowed === false &&
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
      "product_direction_synced_pending_human_chatgpt_review" &&
    storedResults.overall_postmortem_status ===
      "PASS_PENDING_HUMAN_CHATGPT_REVIEW" &&
    storedResults.classification_complete === true &&
    storedResults.product_owner_decisions_complete === true &&
    storedResults.product_owner_decisions_pending === 0,
  "stored result status differs",
);

const frozenFailureCodes = frozenResults.evaluation.hard_failures.map(
  (item) => item.failure,
);
const classifications = storedResults.classifications;
const classifiedCodes = classifications.map((item) => item.failure_code);
assert(
  frozenFailureCodes.length === 13 &&
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
    contract.allowed_evaluation_tiers.includes(item.evaluation_tier),
    item.failure_code + " has unknown evaluation tier",
  );
  assert(
    contract.allowed_materiality_values.includes(item.materiality),
    item.failure_code + " has unknown materiality",
  );
  assert(
    item.materiality === "conditional"
      ? typeof item.conditional_blocking_condition === "string" &&
          item.conditional_blocking_condition.length > 0
      : item.conditional_blocking_condition === null,
    item.failure_code + " has invalid conditional blocking condition",
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
const derivedEvaluationTierCounts = countBy(
  classifications,
  (item) => item.evaluation_tier,
);
const derivedMaterialityCounts = countBy(
  classifications,
  (item) => item.materiality,
);
for (const category of contract.allowed_classification_categories) {
  assert(
    storedResults.category_counts[category] ===
      (derivedCategoryCounts[category] ?? 0),
    category + " count differs from mapping",
  );
}
for (const tier of contract.allowed_evaluation_tiers) {
  assert(
    storedResults.evaluation_tier_counts[tier] ===
      (derivedEvaluationTierCounts[tier] ?? 0),
    tier + " count differs from mapping",
  );
}
for (const materiality of contract.allowed_materiality_values) {
  assert(
    storedResults.materiality_counts[materiality] ===
      (derivedMaterialityCounts[materiality] ?? 0),
    materiality + " count differs from mapping",
  );
}

assert(
  classifications
    .filter(
      (item) => item.primary_category === "evaluator_implementation_defect",
    )
    .every(
      (item) =>
        item.evaluation_tier === "evaluator_only" &&
        item.materiality === "nonblocking",
    ),
  "Evaluator implementation materiality differs",
);
assert(
  classifications
    .filter((item) => item.primary_category === "application_bookkeeping_gap")
    .every(
      (item) =>
        item.evaluation_tier === "application_integrity" &&
        item.materiality === "blocking",
    ),
  "Application bookkeeping materiality differs",
);
for (const failureCode of ["E-B01-HIERARCHY", "E-B02-CADENCE"]) {
  const item = classificationByCode(classifications, failureCode);
  assert(
    item.evaluation_tier === "semantic_coverage" &&
      item.materiality === "blocking",
    failureCode + " materiality differs",
  );
}
for (const failureCode of ["E-C01-PRACTICAL", "E-C01-SAFETY-ACTIONS"]) {
  const item = classificationByCode(classifications, failureCode);
  assert(
    item.primary_category === "provider_or_prompt_gap" &&
      item.evaluation_tier === "semantic_coverage" &&
      item.materiality === "conditional",
    failureCode + " materiality differs",
  );
}
for (const failureCode of ["E-C03-APOLOGY", "E-C04-REGISTER"]) {
  const item = classificationByCode(classifications, failureCode);
  assert(
    item.evaluation_tier === "flexible_semantic" &&
      item.materiality === "nonblocking" &&
      item.blocks_runtime_readiness === false,
    failureCode + " flexible-semantic disposition differs",
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

const doctrine = storedResults.product_direction_doctrine;
assert(
  doctrine.canonical_statement_ja ===
      contract.product_direction_doctrine.canonical_statement_ja &&
    doctrine.machine_readable_summary_en ===
      contract.product_direction_doctrine.machine_readable_summary_en &&
    same(doctrine.required_outcome_sequence, [
      "facts",
      "plausible_interpretations",
      "recommended_current_direction",
      "immediate_next_step",
      "reassessment_condition",
    ]) &&
    contract.product_direction_doctrine.prohibited_framings.length > 0,
  "Product Direction Doctrine differs",
);
assert(
  storedResults.evaluation_doctrine.hard_factual_safety
      .blocking_when_material === true &&
    storedResults.evaluation_doctrine.flexible_semantic
      .independently_hard_fails === false &&
    storedResults.evaluation_doctrine.product_outcome
      .established_by_e_pb01_pb01c_alone === false &&
    storedResults.evaluation_doctrine.product_outcome.gates.length > 0,
  "Hard, Flexible, and Product Outcome doctrine differs",
);

const decisions = storedResults.product_owner_decisions;
const expectedDecisionIds = contract.product_owner_decisions.map(
  (item) => item.decision_id,
);
assert(
  decisions.length === expectedDecisionIds.length &&
    expectedDecisionIds.length === 4 &&
    new Set(decisions.map((item) => item.decision_id)).size ===
      decisions.length &&
    same(sorted(decisions.map((item) => item.decision_id)), sorted(expectedDecisionIds)) &&
    decisions.every(
      (item) =>
        item.status === "approved" &&
        item.approved_by === "ProductOwner" &&
        item.approved_in_conversation === true,
    ) &&
    storedResults.product_owner_decisions_pending === 0,
  "Product Owner decisions are not approved 4/4",
);
const practicalDecision = decisionById(decisions, "PO-E-C01-PRACTICAL");
assert(
  same(practicalDecision.accepted_interpretation.explicit_meaning_units, [
    "provide_information",
    "confirm_schedule",
  ]) &&
    practicalDecision.responsibility === "provider_or_prompt_gap" &&
    practicalDecision.materiality === "conditional" &&
    practicalDecision.internal_enum_omission_alone_is_hard_fail === false &&
    practicalDecision.meaning_reversal_is_hard_fail === true,
  "dual practical meaning decision differs",
);
const safetyDecision = decisionById(
  decisions,
  "PO-E-C01-SAFETY-ACTIONS",
);
assert(
  safetyDecision.accepted_interpretation.asks_for_reply === true &&
    safetyDecision.accepted_interpretation.reply_demand === false &&
    safetyDecision.accepted_interpretation.proposes_meeting === true &&
    safetyDecision.asks_for_reply_equals_reply_demand === false &&
    safetyDecision.materiality === "conditional",
  "asks_for_reply versus reply_demand decision differs",
);
const apologyDecision = decisionById(decisions, "PO-E-C03-APOLOGY");
assert(
  apologyDecision.accepted_interpretation.apology_presence === true &&
    same(
      apologyDecision.accepted_interpretation.acceptable_apology_strengths,
      ["low", "medium"],
    ) &&
    apologyDecision.accepted_interpretation
      .response_pressure_evaluated_separately === true &&
    apologyDecision.materiality === "nonblocking",
  "apology flexibility decision differs",
);
const registerDecision = decisionById(decisions, "PO-E-C04-REGISTER");
assert(
  same(registerDecision.accepted_interpretation.acceptable_registers, [
    "neutral_polite",
    "mixed",
  ]) &&
    registerDecision.accepted_interpretation.discouraged_registers.includes(
      "casual",
    ) &&
    registerDecision.materiality === "nonblocking",
  "register flexibility decision differs",
);

const caseStatuses = storedResults.case_level_derived_statuses;
assert(
  caseStatuses.length === frozenResults.calls.length &&
    caseStatuses.every((status) => {
      const frozenCall = frozenResults.calls.find(
        (call) => call.case_id === status.case_id,
      );
      return (
        frozenCall &&
        status.frozen_case_passed ===
          (frozenCall.evaluation?.case_verdict === "PASS")
      );
    }) &&
    caseStatuses.filter((item) => item.frozen_case_passed).length ===
      frozenResults.evaluation.case_pass_count &&
    caseStatuses.filter((item) => !item.frozen_case_passed).length ===
      frozenResults.evaluation.case_count -
        frozenResults.evaluation.case_pass_count,
  "frozen_case_passed projection does not match case_verdict 14/14",
);

const providerDerived = derivedView(caseStatuses, "provider_stage_status", {
  blocking_cases: "blocking",
  conditional_cases: "conditional",
  flexible_finding_cases: "flexible_finding",
  clean_cases: "clean",
  unresolved_cases: "unresolved",
});
assert(
  same(storedResults.provider_stage_adjudication, providerDerived),
  "Provider Stage adjudication is inconsistent",
);
const runtimeDerived = derivedView(
  caseStatuses,
  "split_runtime_pre_r4_status",
  {
    blocked_cases: "blocked",
    conditional_cases: "conditional",
    locally_ready_cases: "locally_ready",
    unresolved_cases: "unresolved",
  },
);
assert(
  same(storedResults.split_runtime_pre_r4_adjudication, {
    ...runtimeDerived,
    locally_ready_equals_r4_ready: false,
  }),
  "Split Runtime pre-R4 adjudication is inconsistent",
);
for (const view of [providerDerived, runtimeDerived]) {
  const groupedIds = Object.entries(view)
    .filter(([key]) => key !== "counts")
    .flatMap(([, ids]) => ids);
  assert(
    groupedIds.length === caseStatuses.length &&
      new Set(groupedIds).size === caseStatuses.length &&
      same(sorted(groupedIds), sorted(caseStatuses.map((item) => item.case_id))),
    "derived case groups do not form an exact partition",
  );
}

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
assert(
  storedResults.e_r2_entry_contract.ready === true &&
    storedResults.e_r2_entry_contract.authorized === false &&
    storedResults.e_r2_entry_contract.required_scope.length === 13 &&
    storedResults.e_r2_entry_contract.does_not_target ===
      "make_all_internal_labels_exact" &&
    storedResults.e_r2_entry_contract.success_criteria.length > 0,
  "E-R2 entry contract differs",
);

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
    storedResults.safeguards.e_r2_ready === true &&
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
    capabilities.product_direction_doctrine_recorded === true &&
    capabilities.product_owner_decisions ===
      `${decisions.length}/${decisions.length}` &&
    capabilities.product_owner_decisions_pending === 0 &&
    capabilities.evaluation_model === "hard_flexible_product_outcome" &&
    capabilities.frozen_e_machine_verdict ===
      storedResults.frozen_evidence.machine_verdict &&
    capabilities.frozen_e_case_result ===
      storedResults.frozen_evidence.machine_case_result &&
    capabilities.frozen_case_projection_corrected === true &&
    capabilities.frozen_case_projection_matched ===
      `${caseStatuses.length}/${caseStatuses.length}` &&
    capabilities.execution_protocol_accepted === true &&
    capabilities.execution_evidence_valid === true &&
    capabilities.provider_calls === 0 &&
    capabilities.provider_rerun_authorized === false &&
    capabilities.classification_complete === true &&
    same(capabilities.classification_category_counts, storedResults.category_counts) &&
    same(capabilities.evaluation_tier_counts, storedResults.evaluation_tier_counts) &&
    same(capabilities.materiality_counts, storedResults.materiality_counts) &&
    same(capabilities.provider_stage_adjudication, {
      source: "derived_from_case_mapping",
      ...storedResults.provider_stage_adjudication,
    }) &&
    same(capabilities.split_runtime_pre_r4_adjudication, {
      source: "derived_from_case_mapping",
      ...storedResults.split_runtime_pre_r4_adjudication,
    }) &&
    capabilities.candidate_source_isolation_provider_boundary_confirmed ===
      true &&
    capabilities.provider_quality_established === false &&
    capabilities.candidate_ready_for_isolated_e2e === false &&
    capabilities.r4_ready === false &&
    capabilities.r4_authorized === false &&
    capabilities.e_r2_ready === true &&
    capabilities.e_r2_authorized === false &&
    capabilities.c2_authorized === false &&
    capabilities.db_operations === 0 &&
    capabilities.supabase_operations === 0 &&
    capabilities.migration_applied === false &&
    capabilities.active_service_changed === false &&
    capabilities.active_runtime_activated === false &&
    capabilities.main_changed === false &&
    capabilities.next_candidate ===
      "M2-P4-I3-R1-C1-R3-R2-E-R2 Directional Guidance and Semantic Materiality Revision" &&
    capabilities.next_candidate_authorized === false,
  "capabilities differ from computed result",
);

assert(
  postmortem.task_id === taskId &&
    postmortem.status === storedResults.status &&
    postmortem.baseline === baseline &&
    postmortem.e_r1_baseline === baseline &&
    postmortem.e_package_commit_a === packageCommitA &&
    postmortem.e_evidence_commit_b === evidenceCommitB &&
    postmortem.frozen_execution.protocol === "accepted" &&
    postmortem.frozen_execution.machine_verdict ===
      storedResults.frozen_evidence.machine_verdict &&
    postmortem.frozen_execution.machine_case_result ===
      storedResults.frozen_evidence.machine_case_result &&
    postmortem.frozen_execution.evidence_changed === false &&
    postmortem.independence.prior_human_or_chatgpt_guesses_used_as_oracle ===
      false &&
    postmortem.independence.predefined_counts_used === false &&
    postmortem.independence.predefined_view_counts_used === false &&
    postmortem.independence.predefined_residual_case_ids_used === false &&
    postmortem.independence.case_id_result_override_used === false &&
    postmortem.product_owner_decisions.approved ===
      `${decisions.length}/${decisions.length}` &&
    postmortem.product_owner_decisions.pending === 0 &&
    postmortem.frozen_case_projection_correction.matched_frozen_cases ===
      `${caseStatuses.length}/${caseStatuses.length}` &&
    postmortem.authorization_boundary.provider_rerun_authorized === false &&
    postmortem.authorization_boundary.e_r2_ready === true &&
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
for (const tier of contract.allowed_evaluation_tiers) {
  assert(
    postmortem.evaluation_tier_summary[tier] ===
      storedResults.evaluation_tier_counts[tier],
    "postmortem evaluation tier count differs: " + tier,
  );
}
for (const materiality of contract.allowed_materiality_values) {
  assert(
    postmortem.materiality_summary[materiality] ===
      storedResults.materiality_counts[materiality],
    "postmortem materiality count differs: " + materiality,
  );
}
assert(
  same(postmortem.provider_stage_adjudication, providerDerived) &&
    same(postmortem.split_runtime_pre_r4_adjudication, {
      ...runtimeDerived,
      locally_ready_equals_r4_ready: false,
    }),
  "postmortem case groups differ",
);

const review = source(reviewPath);
for (const heading of [
  "## 1. Status",
  "## 2. Frozen E evidence remains unchanged",
  "## 3. Product Direction Doctrine",
  "## 4. Why unique-label accuracy is not the product goal",
  "## 5. Hard factual / Safety gates",
  "## 6. Flexible semantic interpretation",
  "## 7. Product Outcome gates",
  "## 8. Product Owner Decision 1 — dual practical meaning",
  "## 9. Product Owner Decision 2 — asks_for_reply versus reply_demand",
  "## 10. Product Owner Decision 3 — apology flexibility",
  "## 11. Product Owner Decision 4 — register flexibility",
  "## 12. Machine-readable frozen_case_passed correction",
  "## 13. Provider Stage adjudication",
  "## 14. Split Runtime pre-R4 adjudication",
  "## 15. E-R2 entry requirements",
  "## 16. Validation",
  "## 17. Acceptance boundary",
  "## 18. E-R2 unauthorized",
]) {
  assert(review.includes(heading), "review heading missing: " + heading);
}
for (const decision of decisions) {
  assert(
    review.includes(decision.decision_id) && review.includes("`approved`"),
    decision.decision_id + " missing approved disposition from review",
  );
}

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
for (const forbiddenRead of [".env" + ".local", "process" + ".env"]) {
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
    !codeSources.includes(forbiddenDbCapability),
    "offline code contains DB capability",
  );
}

const protectedDiff = taskPaths.filter((relativePath) =>
  /^(?:app|components|fixtures|lib|public|supabase)\//u.test(relativePath),
);
assert(
  protectedDiff.length === 0,
  "Runtime, Prompt, Schema, Catalog, Pipeline, Service, or migration diff detected",
);
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
    "product_direction_synced_pending_human_chatgpt_review",
    "FAIL / 6 of 14",
    "Product Owner decisions `4/4` approved",
    "Hard / Flexible / Product Outcome",
    "frozen_case_passed",
    "Provider calls `0`",
    "DB / Supabase operations `0 / 0`",
    "Provider quality remains unestablished",
    "E-R2 is ready but remains unauthorized",
    "R4 remains HOLD",
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
const typecheckOutput = npm(["run", "typecheck"]);
assert(typecheckOutput.length > 0, "typecheck produced no evidence");
const lintOutput = npm(["run", "lint"]);
assert(
  !/\b[1-9]\d* warnings?\b/iu.test(lintOutput),
  "lint reported warnings",
);
const buildOutput = npm(["run", "build"]);
assert(buildOutput.length > 0, "build produced no evidence");

git(["diff", "--check", baseline, "--"]);
assertExactPaths(currentTaskPaths(), exactPaths, "post-build exact scope");
for (const relativePath of frozenPaths) assertFrozenBlob(relativePath);
assert(git(["rev-parse", "main"]).trim() === mainBaseline, "main changed after validation");

console.log("M2_P4_I3_R1_C1_R3_R2_E_R1_R1_PRODUCT_DIRECTION: PASS");
console.log(`exact_scope: ${exactPaths.length}/${exactPaths.length}`);
console.log("duplicate_paths: 0");
console.log("json_parse: 4/4");
console.log(`frozen_e_artifacts: ${frozenPaths.length}/${frozenPaths.length}`);
console.log("frozen_e_machine_result: FAIL / 6 of 14");
console.log(`classified_failure_codes: ${classifications.length}/${frozenFailureCodes.length}`);
console.log(`product_owner_decisions: ${decisions.length}/${decisions.length} approved`);
console.log("product_owner_decisions_pending: 0");
console.log(
  `frozen_case_passed_projection: ${caseStatuses.length}/${caseStatuses.length} PASS`,
);
console.log(
  `provider_stage: blocking=${providerDerived.counts.blocking} conditional=${providerDerived.counts.conditional} flexible=${providerDerived.counts.flexible_finding} clean=${providerDerived.counts.clean} unresolved=${providerDerived.counts.unresolved}`,
);
console.log(
  `split_runtime_pre_r4: blocked=${runtimeDerived.counts.blocked} conditional=${runtimeDerived.counts.conditional} locally_ready=${runtimeDerived.counts.locally_ready} unresolved=${runtimeDerived.counts.unresolved}`,
);
console.log("provider_calls: 0");
console.log("db_operations: 0");
console.log("supabase_operations: 0");
console.log("provider_quality_established: false");
console.log("candidate_ready_for_isolated_e2e: false");
console.log("e_r2_ready: true");
console.log("e_r2_authorized: false");
console.log("r4_authorized: false");
console.log("policy: 40/40 PASS");
console.log("typecheck: PASS");
console.log("lint: PASS warnings=0");
console.log("build: PASS");
console.log("git_diff_check: PASS");
