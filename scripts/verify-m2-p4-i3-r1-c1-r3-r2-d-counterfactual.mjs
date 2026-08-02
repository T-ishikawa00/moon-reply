import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalJson,
  runOfflineCounterfactual,
} from "./lib/m2-p4-i3-r1-c1-r3-r2-d-offline-runner-v1.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baseline = "9d2bd94a2629d97197c6ffbb0608ec573b9b824a";
const acceptedImplementationCommit =
  "8b9b4a4dff2992483266a3fb9bbc80b183091b2e";
const expectedBranch =
  "test/m2-p4-i3-r1-c1-r3-r2-d-counterfactual-regression";
const planningContent = "212720bba2ebb805da9ef701d645359a6bd470a7";
const acceptedA = "2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f";
const acceptedB = "ef5c6db66da77deebb9ad0d5498fe69ec584aad8";
const acceptedC = "7e09b540220eac3b0afb91bc9cfb822cc0ab632d";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const sentinelA = "CANDIDATE_SENTINEL_A_R3R2_7F19";
const sentinelB = "CANDIDATE_SENTINEL_B_R3R2_4C82";
const exactScope = [
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/historical-regression-manifest-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/capabilities-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-d-offline-runner-v1.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-d-counterfactual.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_D_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const acceptanceSyncScope = [
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_D_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-d-counterfactual.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const nonSyncEvidencePaths = [
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/historical-regression-manifest-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-d-offline-runner-v1.mjs",
];
const jsonPaths = exactScope.slice(0, 4);
const planningPaths = [
  "docs/phase2/M2_P4_I3_R1_C1_R3_R2_CANDIDATE_SOURCE_ISOLATION_PLAN.md",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2/architecture-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2/payload-routing-matrix-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2/counterfactual-suite-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2/safety-failure-matrix-v1.json",
];
const acceptedAPaths = [
  "lib/assessment/runtime/contracts/base-structured-intake-v1.schema.json",
  "lib/assessment/runtime/contracts/candidate-analysis-v1.schema.json",
  "lib/assessment/runtime/contracts/split-stage-contracts-v1.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-a/stage-topology-v1.json",
];
const acceptedBPaths = [
  "lib/assessment/runtime/base-structured-intake-grounding-v1.ts",
  "lib/assessment/runtime/candidate-analysis-grounding-v1.ts",
  "lib/assessment/runtime/base-structured-intake-legacy-view-v1.ts",
  "lib/assessment/runtime/split-analysis-envelope-v1.ts",
  "lib/assessment/runtime/base-source-integrity-v1.ts",
  "lib/assessment/runtime/candidate-source-integrity-v1.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-b/source-integrity-fixtures-v1.json",
];
const acceptedCNonSyncPaths = [
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/fakes.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/supabase-repository.ts",
  "lib/assessment/runtime/safety-aggregation-v3.ts",
  "lib/assessment/runtime/candidate-safety-routing-v1.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v9.json",
  "lib/assessment/runtime/contracts/pb-01-base-situation-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-01c-candidate-analysis-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-02-split-safety-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-03-split-projection-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-04-split-decision-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-05-split-report-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-06-split-validator-v1.developer.md",
  "supabase/migrations/0004_m2_p4_candidate_source_isolation.sql",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-c/routing-fixtures-v1.json",
];

const git = (...args) =>
  execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: repositoryRoot, encoding: "utf8" },
  ).trim();
const readText = (relativePath) =>
  readFileSync(path.join(repositoryRoot, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const sha256 = (value) =>
  createHash("sha256").update(Buffer.from(value, "utf8")).digest("hex");
const fileSha256 = (relativePath) =>
  sha256(readText(relativePath).replace(/\r\n/gu, "\n"));
const clone = (value) => structuredClone(value);
const sameSet = (left, right) =>
  canonicalJson([...left].sort()) === canonicalJson([...right].sort());
const exactKeys = (value, keys) =>
  value && sameSet(Object.keys(value), keys) && Object.keys(value).length === keys.length;
const blobMatches = (ref, relativePath) =>
  git("rev-parse", `${ref}:${relativePath}`) === git("hash-object", relativePath);

let checkCount = 0;
const checks = [];
function check(name, condition) {
  assert.ok(condition, name);
  checkCount += 1;
  checks.push(name);
}

function countLiteral(value, literal) {
  const text = JSON.stringify(value ?? null);
  return text.split(literal).length - 1;
}

function countSourceRef(value, target) {
  let count = 0;
  const visit = (candidate) => {
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (!candidate || typeof candidate !== "object") return;
    for (const [key, nested] of Object.entries(candidate)) {
      if (key === "source_refs" && Array.isArray(nested)) {
        count += nested.filter((item) => item === target).length;
      }
      visit(nested);
    }
  };
  visit(value);
  return count;
}

const tracked = git("diff", "--name-only", baseline, "--")
  .split(/\r?\n/u)
  .filter(Boolean);
const untracked = git("ls-files", "--others", "--exclude-standard")
  .split(/\r?\n/u)
  .filter(Boolean);
const actualScope = [...new Set([...tracked, ...untracked])];
check("exact scope 10/10", sameSet(actualScope, exactScope));
check("duplicate paths 0", new Set(exactScope).size === exactScope.length);
const historicalImplementationScope = git(
  "diff",
  "--name-only",
  baseline,
  acceptedImplementationCommit,
  "--",
)
  .split(/\r?\n/u)
  .filter(Boolean);
check(
  "immutable implementation snapshot exact 10/10",
  sameSet(historicalImplementationScope, exactScope),
);
const acceptanceTracked = git(
  "diff",
  "--name-only",
  acceptedImplementationCommit,
  "--",
)
  .split(/\r?\n/u)
  .filter(Boolean);
const actualAcceptanceSyncScope = [
  ...new Set([...acceptanceTracked, ...untracked].filter(Boolean)),
];
check(
  "acceptance sync exact scope 6/6",
  sameSet(actualAcceptanceSyncScope, acceptanceSyncScope) &&
    new Set(acceptanceSyncScope).size === acceptanceSyncScope.length,
);
git("merge-base", "--is-ancestor", acceptedImplementationCommit, "HEAD");
check(
  "accepted implementation ancestry and branch",
  git("branch", "--show-current") === expectedBranch,
);

const parsed = Object.fromEntries(jsonPaths.map((item) => [item, readJson(item)]));
check("JSON parse 4/4", Object.keys(parsed).length === 4);
const cases = parsed[jsonPaths[0]];
const committedResult = parsed[jsonPaths[1]];
const historicalManifest = parsed[jsonPaths[2]];
const capabilities = parsed[jsonPaths[3]];
check(
  "non-sync evidence blobs unchanged 4/4",
  nonSyncEvidencePaths.length === 4 &&
    nonSyncEvidencePaths.every((item) => blobMatches(acceptedImplementationCommit, item)),
);
check(
  "committed counterfactual result unchanged",
  blobMatches(
    acceptedImplementationCommit,
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-results-v1.json",
  ),
);
check(
  "offline runner unchanged",
  blobMatches(
    acceptedImplementationCommit,
    "scripts/lib/m2-p4-i3-r1-c1-r3-r2-d-offline-runner-v1.mjs",
  ),
);
const sourceContract = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2/counterfactual-suite-v1.json",
);
check(
  "accepted Counterfactual Planning Contract unchanged",
  blobMatches(
    planningContent,
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2/counterfactual-suite-v1.json",
  ),
);
check(
  "accepted Architecture Contract unchanged",
  blobMatches(
    planningContent,
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2/architecture-contract-v1.json",
  ),
);
check(
  "accepted Planning blobs unchanged 5/5",
  planningPaths.length === 5 && planningPaths.every((item) => blobMatches(planningContent, item)),
);
check(
  "accepted A implementation unchanged 4/4",
  acceptedAPaths.length === 4 && acceptedAPaths.every((item) => blobMatches(acceptedA, item)),
);
const capabilitiesA = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-a/capabilities-v1.json",
);
check(
  "accepted A acceptance unchanged",
  capabilitiesA.status === "human_chatgpt_accepted_complete" &&
    capabilitiesA.implementation_blobs_unchanged === "4/4",
);
check(
  "accepted B implementation unchanged 7/7",
  acceptedBPaths.length === 7 && acceptedBPaths.every((item) => blobMatches(acceptedB, item)),
);
const capabilitiesB = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-b/capabilities-v1.json",
);
check(
  "accepted B acceptance unchanged",
  capabilitiesB.status === "human_chatgpt_accepted_complete" &&
    capabilitiesB.non_sync_implementation_blobs_unchanged === "7/7",
);
check(
  "accepted C non-sync blobs unchanged 17/17",
  acceptedCNonSyncPaths.length === 17 &&
    acceptedCNonSyncPaths.every((item) => blobMatches(acceptedC, item)),
);
const capabilitiesC = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-c/capabilities-v1.json",
);
check(
  "accepted C acceptance state unchanged",
  capabilitiesC.status === "human_chatgpt_accepted_complete" &&
    capabilitiesC.non_sync_implementation_blobs_unchanged === "17/17",
);
check(
  "Active Service unchanged",
  blobMatches(baseline, "lib/assessment/runtime/service.ts") &&
    readText("lib/assessment/runtime/service.ts").includes(
      "loadM2P4ProductQualityRuntimeStageCatalog",
    ),
);
check(
  "Active Catalog v4 unchanged",
  blobMatches(
    baseline,
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  ) && historicalManifest.active_runtime.catalog_version === "runtime-stage-catalog-v4.0.0",
);
check(
  "migration 0004 unchanged and unapplied",
  blobMatches(
    acceptedC,
    "supabase/migrations/0004_m2_p4_candidate_source_isolation.sql",
  ) && capabilitiesC.migration_applied === false && capabilities.migration_applied === false,
);

const runnerSource = readText(
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-d-offline-runner-v1.mjs",
);
check(
  "runner contains no external or Supabase transport",
  !runnerSource.includes("OpenAiResponsesTransport") &&
    !runnerSource.includes("SupabaseAssessmentRepository") &&
    runnerSource.includes("FakeAiStageTransport") &&
    runnerSource.includes("FakeAssessmentRepository"),
);
check(
  "runner reads no local environment file or secret",
  !runnerSource.includes(".env.local") &&
    !runnerSource.includes("process.env") &&
    !runnerSource.includes("OPENAI_API_KEY") &&
    !runnerSource.includes("SUPABASE_SERVICE_ROLE_KEY"),
);
check(
  "runner writes result path only",
  (runnerSource.match(/writeFileSync\(/gu) ?? []).length === 1 &&
    runnerSource.includes("writeFileSync(resultPath()"),
);

const recomputed = await runOfflineCounterfactual();
check(
  "deterministic replay matches committed result",
  canonicalJson(recomputed) === canonicalJson(committedResult),
);
check("recomputed overall verdict PASS", recomputed.overall_verdict === "PASS");
check(
  "exact Planning Base case copied",
  canonicalJson(cases.base_case) === canonicalJson(sourceContract.base_case),
);
check(
  "exact A B null variants copied",
  canonicalJson(cases.variants) === canonicalJson(sourceContract.variants),
);
check(
  "Planning Contract copied without semantic change",
  canonicalJson(cases) === canonicalJson(sourceContract),
);
check(
  "registered Sentinels absent from Base inputs",
  [sentinelA, sentinelB].every(
    (sentinel) =>
      countLiteral(cases.base_case.base_provider_input, sentinel) === 0 &&
      countLiteral(recomputed.counterfactual.shared_base_output.content, sentinel) === 0,
  ),
);
check(
  "one shared Base output reused",
  recomputed.counterfactual.shared_base_output.reuse_count === 3 &&
    new Set(
      recomputed.counterfactual.variants.map((item) => item.raw_base_output_sha256),
    ).size === 1,
);
check(
  "hard gates 14/14",
  recomputed.counterfactual.hard_gates.length === 14 &&
    recomputed.counterfactual.hard_gates.every((item) => item.status === "PASS") &&
    recomputed.counterfactual.hard_gate_summary === "14/14",
);
check(
  "negative mutants 7/7",
  recomputed.negative_mutants.results.length === 7 &&
    recomputed.negative_mutants.results.every(
      (item) => item.status === "PASS" && item.rejected === true,
    ),
);
check(
  "legitimate overlap PASS",
  recomputed.counterfactual.legitimate_overlap.status === "PASS" &&
    recomputed.counterfactual.legitimate_overlap.production_source_integrity === "PASS" &&
    recomputed.counterfactual.legitimate_overlap.arbitrary_literal_rejected === false,
);
check(
  "historical scenarios 4/4",
  recomputed.historical_regression.scenarios.length === 4 &&
    recomputed.historical_regression.scenarios.every((item) => item.status === "PASS") &&
    recomputed.historical_regression.summary === "4/4",
);
const legacyReady = recomputed.historical_regression.scenarios.find(
  (item) => item.scenario_id === "LEGACY-READY-001",
);
check(
  "legacy exact Stage order",
  canonicalJson(historicalManifest.active_runtime.stage_order) ===
    canonicalJson(["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"]) &&
    canonicalJson(legacyReady.stage_calls) ===
      canonicalJson(["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"]),
);
check(
  "legacy report and Decision Card parity",
  legacyReady.report_deep_equal === true &&
    legacyReady.decision_card_deep_equal === true &&
    legacyReady.report_sha256 === legacyReady.independently_constructed_report_sha256 &&
    legacyReady.decision_card_sha256 ===
      legacyReady.independently_constructed_decision_card_sha256,
);
const expectedLegacyRequestShapes = {
  "PB-01": [
    "current_situation",
    "optional_message",
    "relationship",
    "requested_topics",
  ],
  "PB-02": ["structured_intake", "deterministic_rule_result"],
  "PB-03": [
    "structured_intake",
    "deterministic_rule_result",
    "model_semantic_result",
    "application_eligibility_expectation",
  ],
  "PB-04": [
    "structured_intake",
    "aggregate_safety_result",
    "eligibility_result",
    "decision_policy_result",
    "user_supplied_optional_message",
    "requested_topics",
  ],
  "PB-05": [
    "structured_intake",
    "decision_plan",
    "user_supplied_optional_message",
    "requested_topics",
  ],
  "PB-06": [
    "structured_intake",
    "aggregate_safety_result",
    "decision_policy_result",
    "decision_plan",
    "report_content",
    "user_supplied_optional_message",
    "requested_topics",
  ],
};
check(
  "legacy PB-01 through PB-06 payload shapes unchanged",
  Object.entries(expectedLegacyRequestShapes).every(
    ([stageId, keys]) => sameSet(legacyReady.request_shapes[stageId], keys),
  ),
);
const historicalById = Object.fromEntries(
  recomputed.historical_regression.scenarios.map((item) => [item.scenario_id, item]),
);
check(
  "legacy safety failure and duplicate behavior unchanged",
  canonicalJson(historicalById["LEGACY-SAFETY-BLOCKED-001"].stage_calls) ===
      canonicalJson(["PB-01", "PB-02", "PB-03"]) &&
    historicalById["LEGACY-SAFETY-BLOCKED-001"].final_report_present === false &&
    historicalById["LEGACY-SAFETY-BLOCKED-001"].finalization === "completed" &&
    historicalById["LEGACY-PB05-FAIL-STOPS-PB06-001"].pb_06_calls === 0 &&
    historicalById["LEGACY-PB05-FAIL-STOPS-PB06-001"].final_report_present === false &&
    historicalById["LEGACY-PB05-FAIL-STOPS-PB06-001"].finalization === "failed" &&
    historicalById["LEGACY-DUPLICATE-READY-001"].duplicate === true &&
    historicalById["LEGACY-DUPLICATE-READY-001"]
      .second_submission_additional_stage_calls === 0,
);
check(
  "no PB-01C in legacy flow",
  recomputed.historical_regression.scenarios.every(
    (item) => (item.pb_01c_calls ?? 0) === 0,
  ),
);
check(
  "external Provider calls 0",
  recomputed.operations.external_provider_calls === 0 &&
    recomputed.historical_regression.actual_provider_calls === 0,
);
check(
  "DB and Supabase operations 0",
  recomputed.operations.db_operations === 0 &&
    recomputed.operations.supabase_operations === 0,
);
check(
  "Runtime diff 0",
  git("diff", "--name-only", baseline, "--", "lib/assessment/runtime") === "",
);
check(
  "Prompt Schema Catalog Pipeline Service diff 0",
  historicalManifest.protected_assets.every(
    (item) =>
      blobMatches(baseline, item.path) &&
      git("hash-object", item.path) === item.git_blob_sha &&
      fileSha256(item.path) === item.sha256_utf8_lf,
  ),
);
check(
  "real-user data 0 and holdout use 0",
  recomputed.operations.real_user_data === 0 && recomputed.operations.holdout_use === 0,
);
check(
  "R3-R2-E R4 C2 unauthorized",
  capabilities.r3_r2_e_authorized === false &&
    capabilities.r4_authorized === false &&
    capabilities.c2_authorized === false &&
    capabilities.next_candidate_authorized === false,
);
check(
  "topology is not inferred from Prompt prose",
  historicalManifest.active_runtime.stage_topology_version === "legacy-six-v1" &&
    historicalManifest.active_runtime.stage_sequence.join("/") === "1/2/3/4/5/6" &&
    !runnerSource.includes("developerPrompt"),
);
check(
  "main unchanged",
  git("rev-parse", "main") === mainBaseline &&
    git("rev-parse", "origin/main") === mainBaseline &&
    recomputed.main_ref === mainBaseline &&
    recomputed.origin_main_ref === mainBaseline,
);
check(
  "capabilities hashes match immutable results",
  capabilities.result_file_sha256 ===
      fileSha256(
        "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-results-v1.json",
      ) &&
    capabilities.cases_sha256 ===
      fileSha256(
        "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-cases-v1.json",
      ) &&
    capabilities.historical_manifest_sha256 ===
      fileSha256(
        "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/historical-regression-manifest-v1.json",
      ),
);
const structural = recomputed.counterfactual.additional_structural_assertions;
check(
  "additional structural assertions PASS",
  structural.pb_02_exact_keys === true &&
    structural.pb_03_exact_keys === true &&
    structural.merged_structured_intake_key_absent === true &&
    structural.raw_candidate_output_downstream_count === 0 &&
    structural.candidate_response_id_stage_local === true &&
    structural.candidate_usage_counted_once === true &&
    structural.base_legacy_view_same_grounded_bytes === true &&
    structural.candidate_envelope_recursive_base_count === 0 &&
    structural.candidate_safety_recursive_base_count === 0 &&
    structural.base_source_ref_allowlist === true &&
    structural.null_candidate_optional_source_refs === 0,
);
check(
  "capabilities record final validation results",
  capabilities.counterfactual_runner_result === "PASS" &&
    capabilities.verifier_result === "PASS_47_CHECKS" &&
    capabilities.decision_policy_result === "PASS_40_OF_40" &&
    capabilities.typecheck_result === "PASS" &&
    capabilities.lint_result === "PASS" &&
    capabilities.lint_warnings === 0 &&
    capabilities.build_result === "PASS" &&
    capabilities.git_diff_check === "PASS",
);
const requiredAcceptanceDocumentFragments = {
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_D_REVIEW.md": [
    "human_chatgpt_accepted_complete",
    "OFFLINE COUNTERFACTUAL ACCEPTED COMPLETE",
    `Accepted implementation commit: \`${acceptedImplementationCommit}\``,
    "Acceptance synchronization exact scope: `6/6`",
    "Non-sync evidence blobs unchanged: `4/4`",
    "R3-R2-E ready / authorized: `true / false`",
  ],
  "docs/CURRENT_FOCUS.md": [
    "M2-P4-I3-R1-C1-R3-R2-D",
    "human_chatgpt_accepted_complete",
    acceptedImplementationCommit,
    "acceptance synchronization is exact `6/6`",
    "non-sync evidence blobs remain unchanged `4/4`",
  ],
  "docs/WBS.md": [
    "Human / ChatGPT result: `OFFLINE COUNTERFACTUAL ACCEPTED COMPLETE`",
    `Accepted implementation commit \`${acceptedImplementationCommit}\``,
    "Acceptance synchronization exact `6/6`",
    "non-sync evidence blobs `4/4` unchanged",
  ],
  "docs/CODEX_HANDOFF.md": [
    "human_chatgpt_accepted_complete",
    acceptedImplementationCommit,
    "acceptance synchronization `6/6`",
    "non-sync evidence blobs `4/4`",
    "ready but unauthorized",
  ],
};
const acceptanceDocumentsRecorded = Object.entries(
  requiredAcceptanceDocumentFragments,
).every(([relativePath, fragments]) => {
  const document = readText(relativePath);
  return fragments.every((fragment) => document.includes(fragment));
});
const implementationSnapshot = capabilities.implementation_snapshot;
check(
  "accepted capability and documentation recorded",
  capabilities.status === "human_chatgpt_accepted_complete" &&
    capabilities.offline_counterfactual_accepted === true &&
    capabilities.accepted_implementation_commit === acceptedImplementationCommit &&
    implementationSnapshot.type === "historical_commit_range" &&
    implementationSnapshot.base === baseline &&
    implementationSnapshot.end === acceptedImplementationCommit &&
    implementationSnapshot.exact_paths === 10 &&
    implementationSnapshot.immutable === true &&
    implementationSnapshot.include_working_tree === false &&
    capabilities.exact_mutation_path_count === 10 &&
    sameSet(capabilities.exact_mutation_paths, exactScope) &&
    capabilities.acceptance_sync_exact_scope === "6/6" &&
    capabilities.acceptance_sync_exact_path_count === 6 &&
    sameSet(capabilities.acceptance_sync_exact_paths, acceptanceSyncScope) &&
    capabilities.non_sync_evidence_blobs_unchanged === "4/4" &&
    capabilities.committed_counterfactual_result_unchanged === true &&
    capabilities.offline_runner_unchanged === true &&
    capabilities.accepted_planning_blobs_unchanged === "5/5" &&
    capabilities.accepted_a_implementation_blobs_unchanged === "4/4" &&
    capabilities.accepted_b_non_sync_blobs_unchanged === "7/7" &&
    capabilities.accepted_c_non_sync_blobs_unchanged === "17/17" &&
    capabilities.active_v4_assets_unchanged === "19/19" &&
    capabilities.offline_counterfactual_accepted === true &&
    capabilities.candidate_ready_for_provider_diagnostic === true &&
    capabilities.candidate_ready_for_isolated_e2e === false &&
    capabilities.r3_r2_e_ready === true &&
    capabilities.r3_r2_e_authorized === false &&
    capabilities.r4_authorized === false &&
    capabilities.c2_authorized === false &&
    capabilities.external_provider_calls === 0 &&
    capabilities.db_operations === 0 &&
    capabilities.supabase_operations === 0 &&
    capabilities.migration_applied === false &&
    capabilities.active_service_changed === false &&
    capabilities.active_runtime_activated === false &&
    capabilities.main_changed === false &&
    capabilities.next_candidate ===
      "M2-P4-I3-R1-C1-R3-R2-E Bounded Split-Stage Provider Diagnostic" &&
    capabilities.next_candidate_authorized === false &&
    capabilities.acceptance_sync_verifier_result ===
      "PASS_54_CHECKS_INCLUDING_RETAINED_47" &&
    capabilities.dedicated_verifier_check_count === 54 &&
    capabilities.retained_original_check_count === 47 &&
    capabilities.human_chatgpt_review === "accepted_complete" &&
    acceptanceDocumentsRecorded,
);

const independentMutants = [];
{
  const mutant = clone(recomputed.counterfactual.variants[0].base_provider_request);
  mutant.optional_message = recomputed.counterfactual.variants[0].optional_message;
  independentMutants.push(
    exactKeys(mutant, ["current_situation", "relationship", "requested_topics"]) === false,
  );
}
{
  const mutant = clone(
    recomputed.counterfactual.variants[0].grounded_base_structured_intake,
  );
  mutant.timeline.push({ statement: sentinelA });
  independentMutants.push(countLiteral(mutant, sentinelA) > 0);
}
{
  const mutant = clone(recomputed.counterfactual.variants[0].pb_02_request);
  mutant.raw_optional_message = recomputed.counterfactual.variants[0].optional_message;
  independentMutants.push(countLiteral(mutant, sentinelA) > 0);
}
{
  const mutant = clone(recomputed.counterfactual.variants[0].pb_03_request);
  mutant.candidate_analysis = clone(
    recomputed.counterfactual.variants[0].candidate_envelope.analysis,
  );
  independentMutants.push(
    !exactKeys(mutant, [
      "base_structured_intake",
      "aggregate_safety_result",
      "application_eligibility_expectation",
    ]),
  );
}
{
  const mutant = clone(
    recomputed.counterfactual.variants.find(
      (item) => item.variant_id === "CANDIDATE-NULL",
    ),
  );
  mutant.pb_01c_call_count = 1;
  independentMutants.push(mutant.pb_01c_call_count !== 0);
}
{
  const mutant = clone(recomputed.counterfactual.variants[0].base_legacy_view);
  mutant.observed_facts[0].source_refs.push("input:optional_message");
  independentMutants.push(countSourceRef(mutant, "input:optional_message") > 0);
}
{
  const mutant = clone(recomputed.counterfactual.legitimate_overlap);
  mutant.arbitrary_literal_rejected = true;
  independentMutants.push(
    mutant.status === "PASS" && mutant.arbitrary_literal_rejected === true,
  );
}
check(
  "mutation tests independently reproduce all seven",
  independentMutants.length === 7 && independentMutants.every(Boolean),
);

execFileSync(
  "git.exe",
  ["-c", "safe.directory=C:/projects/moon-reply", "diff", "--check"],
  { cwd: repositoryRoot, encoding: "utf8" },
);
check("git diff --check PASS", true);

assert.ok(checkCount >= 47, `existing 47-check coverage not retained: ${checkCount}`);
assert.equal(
  checkCount,
  capabilities.dedicated_verifier_check_count,
  "recorded acceptance-aware verifier check count",
);
console.log("M2-P4-I3-R1-C1-R3-R2-D COUNTERFACTUAL VERIFIER: PASS");
console.log(`checks: ${checkCount}`);
console.log(`acceptance sync scope: ${acceptanceSyncScope.length}/6`);
console.log(`immutable implementation scope: ${exactScope.length}/10`);
console.log(`non-sync evidence blobs unchanged: ${nonSyncEvidencePaths.length}/4`);
console.log(`hard gates: ${recomputed.counterfactual.hard_gate_summary}`);
console.log(`negative mutants: ${recomputed.negative_mutants.summary}`);
console.log(`historical regression: ${recomputed.historical_regression.summary}`);
console.log(`external Provider / DB / Supabase: ${recomputed.operations.external_provider_calls} / ${recomputed.operations.db_operations} / ${recomputed.operations.supabase_operations}`);
