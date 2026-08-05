import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPackageCheck } from "./run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-v11-provider-diagnostic.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const taskRoot = "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3";
const frozenRoot = "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3";
const documentationMarker = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3";
const expectedBranch =
  "test/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-v11-provider-package";
const baseline = "962f93d3f115a77fb25517ea9b21fed324f24074";
const acceptedImplementation =
  "1fd102b7235481e3ee6bcd733744db5bb2887773";
const acceptedCorrection =
  "fba4c822f37856538d933957f26225b8e0adc521";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const oldAbortedCommit =
  "b909bf3ad259bea0251cf2f81e7a40d9262ce211";
const oldAbortedBranch =
  "test/m2-p4-i3-r1-c1-r3-r2-e-r3-provider-product-diagnostic";
const paths = {
  contract: taskRoot + "/diagnostic-contract-v1.json",
  cases: taskRoot + "/diagnostic-cases-v1.json",
  quality: taskRoot + "/quality-contract-v1.json",
  authorization: taskRoot + "/authorization-v1.json",
  results: taskRoot + "/diagnostic-results-v1.json",
  summary: taskRoot + "/diagnostic-summary-v1.md",
  productReview: taskRoot + "/product-review-v1.md",
  ownerReview: taskRoot + "/product-owner-review-v1.json",
  capabilities: taskRoot + "/capabilities-v1.json",
  evaluator:
    "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evaluator-v1.mjs",
  auditor:
    "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evidence-auditor-v1.mjs",
  runner:
    "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-v11-provider-diagnostic.mjs",
  verifier:
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-v11-provider-package.mjs",
  review:
    "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_REVIEW.md",
  sourceCases: frozenRoot + "/diagnostic-cases-v1.json",
  frozenContract: frozenRoot + "/diagnostic-contract-v1.json",
  frozenAuthorization: frozenRoot + "/authorization-v1.json",
  frozenResults: frozenRoot + "/diagnostic-results-v1.json",
  acceptedCapabilities:
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r2/capabilities-v1.json",
  catalogV11: "lib/assessment/runtime/contracts/runtime-stage-catalog-v11.json",
  pb01V3:
    "lib/assessment/runtime/contracts/pb-01-base-situation-v3.developer.md",
  migration0004:
    "supabase/migrations/0004_m2_p4_candidate_source_isolation.sql",
  migration0005:
    "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql",
  service: "lib/assessment/runtime/service.ts",
};

if (path.resolve(process.cwd()) !== repositoryRoot) {
  throw new Error("Run from repository root: " + repositoryRoot);
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return {
        url: "data:text/javascript,export%20{}",
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});

function run(command, args) {
  return spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
}

function git(...args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
    },
  ).trim();
}

function gitSucceeds(...args) {
  const completed = run("git.exe", [
    "-c",
    "safe.directory=C:/projects/moon-reply",
    ...args,
  ]);
  return !completed.error && completed.status === 0;
}

const readBuffer = (relativePath) =>
  readFileSync(path.join(repositoryRoot, relativePath));
const readText = (relativePath) =>
  readFileSync(path.join(repositoryRoot, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const readJsonAt = (ref, relativePath) =>
  JSON.parse(git("show", ref + ":" + relativePath));
const sha256Buffer = (value) =>
  createHash("sha256").update(value).digest("hex");
const canonicalText = (value) => value.replace(/\r\n/gu, "\n");
const sha256Text = (value) =>
  createHash("sha256")
    .update(Buffer.from(canonicalText(value), "utf8"))
    .digest("hex");
const lines = (value) => value.split(/\r?\n/u).filter(Boolean);
const sorted = (values) =>
  [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function same(left, right) {
  return JSON.stringify(canonicalize(left)) ===
    JSON.stringify(canonicalize(right));
}

function currentScope() {
  return sorted([
    ...lines(git("diff", "--name-only", baseline, "--")),
    ...lines(git("ls-files", "--others", "--exclude-standard")),
  ]);
}

function commitPaths(commit) {
  return lines(
    git(
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      commit,
    ),
  );
}

function worktreeBlob(relativePath) {
  return git("hash-object", "--", relativePath);
}

function baselineBlob(relativePath) {
  return git("rev-parse", baseline + ":" + relativePath);
}

function unchangedFromBaseline(relativePaths) {
  return relativePaths.every(
    (relativePath) =>
      existsSync(path.join(repositoryRoot, relativePath)) &&
      worktreeBlob(relativePath) === baselineBlob(relativePath),
  );
}

function allRatingsNull(review) {
  const values = [
    ...Object.values(review.ratings ?? {}),
    ...(review.cases ?? []).flatMap((item) =>
      Object.entries(item)
        .filter(([key]) => key !== "case_id")
        .map(([, value]) => value),
    ),
  ];
  return values.length > 0 && values.every((value) => value === null);
}

function packageParent() {
  const head = git("rev-parse", "HEAD");
  return head === baseline ? baseline : git("rev-parse", "HEAD^");
}

const checks = [];
function check(label, condition) {
  checks.push({ label, passed: Boolean(condition) });
  assert.equal(Boolean(condition), true, label);
}

const contract = readJson(paths.contract);
const cases = readJson(paths.cases);
const quality = readJson(paths.quality);
const authorization = readJson(paths.authorization);
const results = readJson(paths.results);
const capabilities = readJson(paths.capabilities);
const ownerReview = readJson(paths.ownerReview);
const acceptedCapabilities = readJson(paths.acceptedCapabilities);
const frozenContract = readJson(paths.frozenContract);
const frozenAuthorization = readJson(paths.frozenAuthorization);
const manifestV11 = readJson(paths.catalogV11);
const runnerSource = readText(paths.runner);
const auditorSource = readText(paths.auditor);
const serviceSource = readText(paths.service);

check("branch exact", git("branch", "--show-current") === expectedBranch);
check("exact parent is acceptance sync", packageParent() === baseline);
check(
  "baseline HEAD or exactly one package commit",
  git("rev-list", "--count", baseline + "..HEAD") === "0" ||
    git("rev-list", "--count", baseline + "..HEAD") === "1",
);
check(
  "accepted implementation is ancestor",
  gitSucceeds("merge-base", "--is-ancestor", acceptedImplementation, "HEAD"),
);
check(
  "accepted correction is ancestor",
  gitSucceeds("merge-base", "--is-ancestor", acceptedCorrection, "HEAD"),
);
check(
  "acceptance sync is current package parent authority",
  contract.package_baseline === baseline &&
    contract.acceptance_sync_commit === baseline,
);
check(
  "main and origin main unchanged",
  git("rev-parse", "main") === mainBaseline &&
    git("rev-parse", "origin/main") === mainBaseline,
);
check("stash empty", git("stash", "list") === "");

check(
  "contract exact scope has 17 unique paths",
  contract.exact_scope.length === 17 &&
    new Set(contract.exact_scope).size === 17,
);
check("exact scope 17/17", same(currentScope(), sorted(contract.exact_scope)));
check(
  "all 17 package paths exist",
  contract.exact_scope.every((relativePath) =>
    existsSync(path.join(repositoryRoot, relativePath)),
  ),
);
check(
  "frozen package list has seven unique paths",
  contract.frozen_after_package_commit_paths.length === 7 &&
    new Set(contract.frozen_after_package_commit_paths).size === 7,
);
const commitsAfterBaseline = Number(
  git("rev-list", "--count", baseline + "..HEAD"),
);
check(
  "frozen package blobs match Package Commit A when committed",
  commitsAfterBaseline === 0 ||
    contract.frozen_after_package_commit_paths.every(
      (relativePath) =>
        worktreeBlob(relativePath) ===
        git("rev-parse", "HEAD:" + relativePath),
    ),
);
check(
  "post-execution mutable list exact 10",
  contract.post_execution_mutable_paths.length === 10 &&
    new Set(contract.post_execution_mutable_paths).size === 10,
);

check(
  "six-case file is byte-identical",
  readBuffer(paths.sourceCases).equals(readBuffer(paths.cases)),
);
check(
  "six-case count and IDs unchanged",
  cases.length === 6 &&
    same(
      cases.map((item) => item.case_id),
      ["E-R3-01", "E-R3-02", "E-R3-03", "E-R3-04", "E-R3-05", "E-R3-06"],
    ),
);
check(
  "case source blob recorded exactly",
  worktreeBlob(paths.sourceCases) ===
    contract.frozen_cases.source_blob_sha &&
    worktreeBlob(paths.cases) === contract.frozen_cases.source_blob_sha,
);
check(
  "case SHA-256 and byte length recorded exactly",
  sha256Buffer(readBuffer(paths.sourceCases)) ===
    contract.frozen_cases.source_sha256 &&
    readBuffer(paths.sourceCases).length ===
      contract.frozen_cases.byte_length,
);

const rollingDocs = new Set([
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
]);
const acceptedProtected = sorted([
  ...commitPaths(acceptedImplementation),
  ...commitPaths(acceptedCorrection),
]).filter((relativePath) => !rollingDocs.has(relativePath));
check(
  "accepted implementation and correction non-rolling blobs unchanged",
  unchangedFromBaseline(acceptedProtected),
);
const frozenEPaths = frozenContract.exact_mutation_paths.filter(
  (relativePath) => !rollingDocs.has(relativePath),
);
check(
  "frozen E-R3 evidence and package unchanged",
  unchangedFromBaseline(frozenEPaths),
);
check(
  "old aborted package commit and refs unchanged",
  git("rev-parse", oldAbortedCommit + "^{commit}") === oldAbortedCommit &&
    git("rev-parse", "refs/heads/" + oldAbortedBranch) === oldAbortedCommit &&
    git("rev-parse", "refs/remotes/origin/" + oldAbortedBranch) ===
      oldAbortedCommit,
);
const abortedContract = readJsonAt(oldAbortedCommit, paths.frozenContract);
const abortedAuthorization = readJsonAt(
  oldAbortedCommit,
  paths.frozenAuthorization,
);
const abortedResults = readJsonAt(oldAbortedCommit, paths.frozenResults);
check(
  "old aborted package remains unconsumed with no marker",
  abortedAuthorization.consumed === false &&
    abortedAuthorization.actual_calls === 0 &&
    abortedAuthorization.completed_calls === 0 &&
    abortedResults.status === "not_started" &&
    abortedResults.calls_actual === 0 &&
    !existsSync(
      path.join(repositoryRoot, abortedContract.one_time_marker),
    ),
);
check(
  "old executed E-R3 authorization state unchanged",
  frozenAuthorization.consumed === true &&
    frozenAuthorization.rerun_authorized === false &&
    frozenAuthorization.actual_calls === 37 &&
    frozenAuthorization.completed_calls === 37 &&
    worktreeBlob(paths.frozenAuthorization) ===
      contract.protected_authorities.old_e_r3_authorization_blob &&
    worktreeBlob(paths.frozenResults) ===
      contract.protected_authorities.old_e_r3_results_blob,
);
const oldMarker = path.join(
  repositoryRoot,
  contract.protected_authorities.old_e_r3_marker_path,
);
check(
  "old executed E-R3 marker state unchanged",
  existsSync(oldMarker) &&
    sha256Buffer(readFileSync(oldMarker)) ===
      contract.protected_authorities.old_e_r3_marker_sha256,
);

check(
  "v11 manifest identity exact",
  manifestV11.catalog_version ===
    "runtime-stage-catalog-v11.0.0" &&
    manifestV11.prompt_bundle_version ===
      "prompt-bundle-runtime-v11.0.0" &&
    manifestV11.schema_set_version ===
      "pipeline-schema-runtime-v5.0.0" &&
    manifestV11.stage_topology_version === "split-base-candidate-v1",
);
check(
  "Catalog version is sourced from manifest",
  contract.runtime_identity.catalog_version ===
    manifestV11.catalog_version &&
    contract.runtime_identity.catalog_version_source ===
      "runtime manifest",
);
check(
  "v11 Catalog blob and SHA exact",
  worktreeBlob(paths.catalogV11) ===
    contract.runtime_identity.catalog_blob_sha &&
    sha256Text(readText(paths.catalogV11)) ===
      contract.runtime_identity.catalog_sha256_utf8_lf,
);
const pb01 = manifestV11.stages.find(
  (item) => item.stage_id === "PB-01",
);
check(
  "PB-01 v3 Catalog hash matches source",
  pb01.prompt_version === "v3.0.0" &&
    pb01.prompt_sha256 ===
      contract.runtime_identity.pb_01_v3_prompt_sha256 &&
    sha256Text(readText(paths.pb01V3)) === pb01.prompt_sha256,
);
check(
  "v11 Stage order manifest 7/7",
  same(
    manifestV11.stages.map((item) => item.stage_id),
    contract.runtime_identity.stage_order,
  ),
);
const { loadM2P4AuthorityIntegrityRuntimeStageCatalog } = await import(
  "../lib/assessment/runtime/schema-catalog.ts"
);
const loadedCatalog =
  await loadM2P4AuthorityIntegrityRuntimeStageCatalog();
check(
  "actual loader return contract used without catalog-version dependency",
  loadedCatalog.promptBundleVersion ===
    contract.runtime_identity.prompt_bundle_version &&
    loadedCatalog.schemaSetVersion ===
      contract.runtime_identity.schema_set_version &&
    Array.isArray(loadedCatalog.definitions),
);
check(
  "actual loader Stage order 7/7",
  same(
    loadedCatalog.definitions.map((item) => item.stageId),
    contract.runtime_identity.stage_order,
  ),
);
check(
  "model and timezone exact",
  contract.runtime_identity.model === "gpt-5.6-luna" &&
    contract.runtime_identity.time_zone === "Asia/Tokyo",
);

const expectedKeys = {
  "PB-01": ["current_situation", "relationship", "requested_topics"],
  "PB-01C": ["optional_message", "candidate_metadata"],
  "PB-02": [
    "base_structured_intake",
    "deterministic_rule_result",
    "candidate_safety_result",
  ],
  "PB-03": [
    "base_structured_intake",
    "aggregate_safety_result",
    "application_eligibility_expectation",
  ],
  "PB-04": [
    "base_structured_intake",
    "candidate_envelope",
    "user_supplied_optional_message",
    "decision_policy_result",
    "contact_constraint_policy",
    "action_context",
    "requested_topics",
  ],
  "PB-05": [
    "base_structured_intake",
    "candidate_envelope",
    "decision_plan",
    "contact_constraint_policy",
    "action_context",
  ],
  "PB-06": [
    "base_structured_intake",
    "candidate_envelope",
    "user_supplied_optional_message",
    "aggregate_safety_result",
    "decision_policy_result",
    "decision_plan",
    "report_content",
    "contact_constraint_policy",
    "action_context",
  ],
};
check(
  "Provider input key sets exact",
  same(contract.stage_input_keys, expectedKeys),
);
check(
  "forbidden Provider key floor exact",
  [
    "case_id",
    "expected",
    "assertions",
    "acceptable_values",
    "product_owner_decision",
    "product_owner_instruction",
    "focus_tags",
    "fixture_id",
    "verdict",
    "oracle",
    "human_rating",
    "authorization",
    "confirmation_phrase",
    "diagnostic_contract",
    "quality_contract",
  ].every((key) => contract.provider_oracle_forbidden_keys.includes(key)),
);

check(
  "exact proposed call ledger 37 with zero spare or retry",
  contract.call_ledger.expected_provider_calls === 37 &&
    contract.call_ledger.provider_attempts_maximum === 37 &&
    contract.call_ledger.spare_calls === 0 &&
    contract.call_ledger.retries === 0 &&
    Object.values(contract.call_ledger.expected_calls_by_case).reduce(
      (total, value) => total + value,
      0,
    ) === 37 &&
    Object.entries(contract.call_ledger.expected_stage_paths).every(
      ([caseId, stages]) =>
        stages.length ===
        contract.call_ledger.expected_calls_by_case[caseId],
    ),
);
check(
  "E-R3-03 exact PB-03 stop",
  same(contract.call_ledger.expected_stage_paths["E-R3-03"], [
    "PB-01",
    "PB-01C",
    "PB-02",
    "PB-03",
  ]),
);

check(
  "quality contract is fresh and separates all six layers",
  quality.prior_machine_result_reused === false &&
    quality.prior_evaluator_verdict_reused === false &&
    same(
      quality.evaluation_layers.map((item) => item.code),
      ["A", "B", "C", "D", "E", "F"],
    ) &&
    quality.evaluation_layers[0].protocol_pass_implies_product_pass ===
      false,
);
check(
  "root and derived failure doctrine exact",
  quality.root_failure_policy.separate_root_blocking_findings === true &&
    quality.root_failure_policy.separate_pipeline_safe_error === true &&
    quality.root_failure_policy.separate_final_result_absence === true &&
    quality.root_failure_policy
      .separate_derived_product_outcome_failure === true &&
    quality.root_failure_policy
      .null_final_is_not_independent_writing_failure === true,
);
check(
  "Candidate materiality authority exact",
  quality.candidate_materiality.final_draft_authority ===
    "decision_plan.recommended_message_draft.text" &&
    quality.candidate_materiality.original_candidate_authority ===
      "user_supplied_optional_message" &&
    quality.candidate_materiality.report_content_is_explanation_only ===
      true &&
    quality.candidate_materiality.raw_and_grounded_retained === true,
);
check(
  "temporal authority is narrow and Application-owned",
  quality.temporal_authority.time_zone === "Asia/Tokyo" &&
    quality.temporal_authority.authority === "application" &&
    same(
      quality.temporal_authority.authorized_action_horizon_labels_ja,
      ["今夜"],
    ) &&
    quality.temporal_authority.broad_word_whitelist_forbidden === true,
);

check(
  "initial authorization exact and unconsumed",
  authorization.status ===
    "prepared_pending_explicit_human_authorization" &&
    authorization.execution_authorized === false &&
    authorization.consumed === false &&
    authorization.rerun_authorized === false &&
    authorization.expected_calls === 37 &&
    authorization.authorized_max_calls === 37 &&
    authorization.actual_attempts === 0 &&
    authorization.completed_calls === 0 &&
    authorization.marker_created === false &&
    authorization.package_commit === null &&
    authorization.evidence_commit === null &&
    authorization.provider_calls === 0 &&
    authorization.db_operations === 0 &&
    authorization.supabase_operations === 0,
);
const freshMarker = path.join(
  repositoryRoot,
  contract.authorization.marker_path,
);
check("fresh marker absent", !existsSync(freshMarker));
check(
  "initial result NOT_EXECUTED exact",
  results.status === "NOT_EXECUTED" &&
    results.provider_attempts === 0 &&
    results.completed_calls === 0 &&
    results.machine_verdict === null &&
    results.cases.length === 0 &&
    results.technical_failure === null,
);
check(
  "capabilities package state exact",
  capabilities.status ===
    "package_prepared_pending_human_chatgpt_review" &&
    capabilities.package_ready === true &&
    capabilities.package_accepted === false &&
    capabilities.provider_calls === 0 &&
    capabilities.provider_rerun_ready === true &&
    capabilities.provider_rerun_authorized === false &&
    capabilities.authorization_consumed === false &&
    capabilities.marker_created === false &&
    capabilities.provider_quality_established === false &&
    capabilities.product_owner_review_complete === false &&
    capabilities.active_runtime_activated === false &&
    capabilities.r4_ready === false &&
    capabilities.r4_authorized === false &&
    capabilities.c2_authorized === false &&
    capabilities.next_action === "human_chatgpt_package_review",
);
check(
  "Product Owner ratings remain blank",
  ownerReview.status === "pending_provider_execution" &&
    allRatingsNull(ownerReview),
);
check(
  "initial Product Review truthful",
  readText(paths.productReview).includes("Provider not executed") &&
    /no final result/iu.test(readText(paths.productReview)) &&
    !readText(paths.productReview).includes("棄却された中間生成物 | 棄却された中間生成物"),
);

check(
  "evidence auditor is independent from Product evaluator",
  !auditorSource.includes("e-r3-r3-evaluator-v1") &&
    !auditorSource.includes("evaluateDiagnostic") &&
    !auditorSource.includes("quality-contract") &&
    !auditorSource.includes("product_passed"),
);
const packageCheck = await runPackageCheck();
check("all package self-tests PASS", packageCheck.verdict === "PASS");
check(
  "self-test count exact 26/26",
  packageCheck.tests.passed === 26 &&
    packageCheck.tests.total === 26,
);
check(
  "mutation-test count exact 13/13",
  packageCheck.tests.mutation_passed === 13 &&
    packageCheck.tests.mutation_total === 13,
);
check(
  "package check uses Fake-only Runtime",
  packageCheck.fake_runtime.verdict === "PASS" &&
    packageCheck.fake_runtime.fake_stage_invocations > 0 &&
    packageCheck.fake_runtime.provider_calls === 0 &&
    packageCheck.fake_runtime.db_operations === 0 &&
    packageCheck.fake_runtime.supabase_operations === 0,
);

const constructIndex = runnerSource.indexOf(
  "async function constructRealTransport",
);
const executeIndex = runnerSource.indexOf("async function runExecution");
const markerIndex = runnerSource.indexOf(
  "await createMarker(markerPath",
  executeIndex,
);
const realCallIndex = runnerSource.indexOf(
  "await constructRealTransport(apiKey)",
  executeIndex,
);
check(
  "default runner cannot construct real transport",
  constructIndex >= 0 &&
    executeIndex > constructIndex &&
    markerIndex > executeIndex &&
    realCallIndex > markerIndex &&
    runnerSource.includes(
      'args.length === 0 || (args.length === 1 && args[0] === "--package-check")',
    ),
);
check(
  "runner never accesses env files",
  !runnerSource.includes("loadEnvFile") &&
    !runnerSource.includes("dotenv") &&
    !runnerSource.includes("readFileSync(path.join(repositoryRoot, \".env"),
);
check(
  "marker-before-network and zero-retry safety encoded",
  markerIndex < realCallIndex &&
    runnerSource.includes("client.maxRetries = 0") &&
    runnerSource.includes("continued_to_next_case: false"),
);
check(
  "package check leaves authorization and marker unchanged",
  packageCheck.authorization_consumed === false &&
    packageCheck.marker_created === false &&
    authorization.consumed === false &&
    !existsSync(freshMarker),
);

check(
  "migration 0004 and 0005 unchanged and recorded unapplied",
  worktreeBlob(paths.migration0004) ===
    contract.protected_authorities.migration_0004_blob &&
    worktreeBlob(paths.migration0005) ===
      contract.protected_authorities.migration_0005_blob &&
    acceptedCapabilities.migration_applied === false &&
    contract.protected_authorities.migrations_applied === false,
);
check(
  "Active Service unchanged and Active Runtime not activated",
  worktreeBlob(paths.service) ===
    contract.protected_authorities.active_service_blob &&
    serviceSource.includes("loadM2P4ProductQualityRuntimeStageCatalog") &&
    acceptedCapabilities.active_runtime_activated === false &&
    capabilities.active_runtime_activated === false,
);
check(
  "Provider DB Supabase remain 0 / 0 / 0",
  packageCheck.fake_runtime.provider_calls === 0 &&
    packageCheck.fake_runtime.db_operations === 0 &&
    packageCheck.fake_runtime.supabase_operations === 0 &&
    results.operations.provider_calls === 0 &&
    results.operations.db_operations === 0 &&
    results.operations.supabase_operations === 0,
);
check(
  "Evidence Commit B absent and unauthorized",
  contract.evidence_commit_authorized === false &&
    authorization.evidence_commit === null &&
    results.evidence_commit === null &&
    capabilities.evidence_commit_created === false,
);
check(
  "R4 and C2 remain unauthorized",
  contract.operations.r4_authorized === false &&
    contract.operations.c2_authorized === false &&
    capabilities.r4_authorized === false &&
    capabilities.c2_authorized === false,
);
check(
  "rolling documentation synchronized",
  ["docs/CURRENT_FOCUS.md", "docs/WBS.md", "docs/CODEX_HANDOFF.md"].every(
    (relativePath) => {
      const source = readText(relativePath);
      return (
        source.includes(documentationMarker + ":BEGIN") &&
        source.includes("17/17") &&
        source.includes("37") &&
        source.includes("0 / 0 / 0") &&
        source.includes("Human / ChatGPT package review")
      );
    },
  ),
);
check(
  "review document records stop boundary",
  readText(paths.review).includes(
    "package_prepared_pending_human_chatgpt_review",
  ) &&
    readText(paths.review).includes("Evidence Commit B: absent") &&
    readText(paths.review).includes(
      "Human / ChatGPT package review is pending",
    ),
);
check(
  "git diff --check PASS",
  gitSucceeds("diff", "--check", baseline, "--"),
);
check(
  "exact scope remains 17/17 after package checks",
  same(currentScope(), sorted(contract.exact_scope)),
);
check(
  "main remains unchanged after package checks",
  git("rev-parse", "main") === mainBaseline &&
    git("rev-parse", "origin/main") === mainBaseline,
);

console.log(
  "M2-P4-I3-R1-C1-R3-R2-E-R3-R3 V11_PROVIDER_PACKAGE_VERIFIER: PASS",
);
console.log("checks: " + checks.length + "/" + checks.length);
console.log("exact_scope: 17/17");
console.log("cases byte equality: 6/6 PASS");
console.log(
  "v11 identity: runtime-stage-catalog-v11.0.0 / prompt-bundle-runtime-v11.0.0 / pipeline-schema-runtime-v5.0.0",
);
console.log("Stage order: 7/7");
console.log("proposed call ledger: 37 expected / 37 maximum / 0 spare");
console.log(
  "self-tests / mutation-tests: " +
    packageCheck.tests.passed +
    "/" +
    packageCheck.tests.total +
    " / " +
    packageCheck.tests.mutation_passed +
    "/" +
    packageCheck.tests.mutation_total,
);
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("authorization consumed / marker: false / absent");
console.log("Evidence Commit B: absent");
console.log("Active Runtime / main: unchanged / unchanged");
console.log("R4 / C2 authorized: false / false");
