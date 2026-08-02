import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  aggregateUsage,
  canonicalJson,
  evaluateDiagnostic,
  evaluateProviderCall,
  expectedDataInjectionCount,
  forbiddenInputReferenceCount,
  runEvaluatorSelfTests,
  shaDiagnosticJson,
} from "./lib/m2-p4-i3-r1-c1-r3-r2-e-provider-evaluator-v1.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const artifactRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e";
const artifactPaths = {
  contract: `${artifactRoot}/diagnostic-contract-v1.json`,
  cases: `${artifactRoot}/diagnostic-cases-v1.json`,
  quality: `${artifactRoot}/quality-contract-v1.json`,
  authorization: `${artifactRoot}/authorization-v1.json`,
  results: `${artifactRoot}/diagnostic-results-v1.json`,
  summary: `${artifactRoot}/diagnostic-summary-v1.md`,
  capabilities: `${artifactRoot}/capabilities-v1.json`,
};
const planningContent = "212720bba2ebb805da9ef701d645359a6bd470a7";
const acceptedA = "2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f";
const acceptedB = "ef5c6db66da77deebb9ad0d5498fe69ec584aad8";
const acceptedC = "7e09b540220eac3b0afb91bc9cfb822cc0ab632d";
const acceptedDImplementation =
  "8b9b4a4dff2992483266a3fb9bbc80b183091b2e";
const dImplementationBaseline =
  "9d2bd94a2629d97197c6ffbb0608ec573b9b824a";
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
const acceptedCPaths = [
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
const dExactPaths = [
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
const dNonSyncEvidencePaths = [
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/historical-regression-manifest-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-d-offline-runner-v1.mjs",
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
const blobMatches = (ref, relativePath) =>
  git("rev-parse", `${ref}:${relativePath}`) === git("hash-object", relativePath);
const normalizedLines = (value) =>
  value
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean);
const sameSet = (left, right) =>
  canonicalJson([...left].sort()) === canonicalJson([...right].sort());
const exactKeys = (value, keys) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  sameSet(Object.keys(value), keys) &&
  Object.keys(value).length === keys.length;

let checkCount = 0;
const checks = [];
function check(name, condition) {
  assert.ok(condition, name);
  checkCount += 1;
  checks.push(name);
}

const contract = readJson(artifactPaths.contract);
const caseBundle = readJson(artifactPaths.cases);
const qualityContract = readJson(artifactPaths.quality);
const authorization = readJson(artifactPaths.authorization);
const results = readJson(artifactPaths.results);
const capabilities = readJson(artifactPaths.capabilities);
const architecture = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2/architecture-contract-v1.json",
);
const dHistoricalManifest = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/historical-regression-manifest-v1.json",
);
const phase = results.status === "not_started" ? "package" : "evidence";

check(
  "contract authority exact",
  contract.schema_version ===
    "m2-p4-i3-r1-c1-r3-r2-e-diagnostic-contract-v1" &&
    contract.task_id === "M2-P4-I3-R1-C1-R3-R2-E" &&
    contract.authorization_id ===
      "M2-P4-I3-R1-C1-R3-R2-E-2026-08-03" &&
    contract.confirmation_phrase ===
      "R3-R2-E-14-CALL-SPLIT-SYNTHETIC-ONLY" &&
    contract.baseline === "8ce5e608b019197e48107354b73338a6883b4938" &&
    contract.accepted_c_implementation === acceptedC &&
    contract.main_baseline ===
      "61e33a10e195fad17e253a6b9719217e1992f273" &&
    contract.branch ===
      "test/m2-p4-i3-r1-c1-r3-r2-e-provider-diagnostic",
);
check(
  "runtime authority exact",
  contract.catalog === "runtime-stage-catalog-v9.0.0" &&
    contract.prompt_bundle === "prompt-bundle-runtime-v9.0.0" &&
    contract.schema_set === "pipeline-schema-runtime-v4.0.0" &&
    contract.stage_topology === "split-base-candidate-v1" &&
    contract.model === "gpt-5.6-luna" &&
    contract.active_catalog === "runtime-stage-catalog-v4.0.0",
);
check(
  "exact budgets and prohibitions",
  contract.authorized_calls === 14 &&
    contract.pb_01_calls === 8 &&
    contract.pb_01c_calls === 6 &&
    contract.execution_limits.maximum_total_provider_attempts === 14 &&
    contract.execution_limits.parallel_provider_calls === 0 &&
    contract.execution_limits.retries === 0 &&
    contract.execution_limits.repair_calls === 0 &&
    contract.execution_limits.fallback_calls === 0 &&
    contract.execution_limits.pb_02_through_pb_06_calls === 0 &&
    contract.execution_limits.db_operations === 0 &&
    contract.execution_limits.supabase_operations === 0 &&
    contract.execution_limits.migration_application === false &&
    contract.execution_limits.automatic_extension === false,
);

const planningE = architecture.rollout_slices.find(
  (slice) => slice.slice_id === "R3-R2-E",
);
check(
  "accepted Planning manifest exact 14 and post-run 8",
  planningE?.exact_path_count === 14 &&
    sameSet(planningE.exact_paths, contract.exact_mutation_paths) &&
    planningE.post_run_mutable_path_count === 8 &&
    sameSet(planningE.post_run_mutable_paths, contract.post_run_mutable_paths),
);
check(
  "scope manifests exact and duplicate-free",
  contract.exact_mutation_paths.length === 14 &&
    new Set(contract.exact_mutation_paths).size === 14 &&
    contract.post_run_mutable_paths.length === 8 &&
    new Set(contract.post_run_mutable_paths).size === 8 &&
    contract.frozen_after_commit_a_paths.length === 6 &&
    new Set(contract.frozen_after_commit_a_paths).size === 6 &&
    contract.post_run_mutable_paths.every((item) =>
      contract.exact_mutation_paths.includes(item),
    ) &&
    contract.frozen_after_commit_a_paths.every((item) =>
      contract.exact_mutation_paths.includes(item),
    ),
);

const trackedCommitted = normalizedLines(
  git("diff", "--name-only", contract.baseline, "HEAD", "--"),
);
const trackedWorking = normalizedLines(
  git("diff", "--name-only", "HEAD", "--"),
);
const untracked = normalizedLines(
  git("ls-files", "--others", "--exclude-standard"),
);
const cumulativeScope = [
  ...new Set([...trackedCommitted, ...trackedWorking, ...untracked]),
];
check("cumulative scope exact 14/14", sameSet(cumulativeScope, contract.exact_mutation_paths));
check(
  "branch and main authority unchanged",
  git("branch", "--show-current") === contract.branch &&
    git("rev-parse", "main") === contract.main_baseline &&
    git("rev-parse", "origin/main") === contract.main_baseline,
);
check(
  "stash empty",
  git("stash", "list") === "",
);

check(
  "JSON parse 6/6",
  [contract, caseBundle, qualityContract, authorization, results, capabilities]
    .length === 6,
);
check(
  "call sequence exact 14",
  caseBundle.length === 14 &&
    qualityContract.case_count === 14 &&
    qualityContract.pb_01_case_count === 8 &&
    qualityContract.pb_01c_case_count === 6 &&
    contract.call_sequence.every((authority, index) => {
      const diagnosticCase = caseBundle[index];
      const qualityCase = qualityContract.cases[index];
      return (
        authority.call_index === index + 1 &&
        authority.case_id === diagnosticCase?.case_id &&
        authority.stage_id === diagnosticCase?.stage_id &&
        diagnosticCase?.case_id === qualityCase?.case_id &&
        diagnosticCase?.stage_id === qualityCase?.stage_id
      );
    }),
);
check(
  "stage split exact 8 plus 6",
  caseBundle.filter((item) => item.stage_id === "PB-01").length === 8 &&
    caseBundle.filter((item) => item.stage_id === "PB-01C").length === 6 &&
    caseBundle.slice(0, 8).every((item) => item.stage_id === "PB-01") &&
    caseBundle.slice(8).every((item) => item.stage_id === "PB-01C"),
);

const qualityById = new Map(
  qualityContract.cases.map((qualityCase) => [qualityCase.case_id, qualityCase]),
);
let providerInputsValid = true;
for (const diagnosticCase of caseBundle) {
  const input = diagnosticCase.synthetic_input;
  const expectedInputKeys = contract.provider_input_keys[diagnosticCase.stage_id];
  const qualityCase = qualityById.get(diagnosticCase.case_id);
  providerInputsValid &&=
    typeof diagnosticCase.purpose === "string" &&
    diagnosticCase.purpose.length > 0 &&
    exactKeys(input, expectedInputKeys) &&
    forbiddenInputReferenceCount(
      input,
      diagnosticCase.case_id,
      contract.forbidden_provider_input_fields[diagnosticCase.stage_id],
    ) === 0 &&
    expectedDataInjectionCount(
      input,
      qualityCase,
      qualityContract,
      expectedInputKeys,
    ) === 0;
  if (diagnosticCase.stage_id === "PB-01C") {
    providerInputsValid &&=
      canonicalJson(input.candidate_metadata) ===
      canonicalJson(contract.candidate_metadata);
  }
}
check("Provider input isolation and expected-data injection 14/14", providerInputsValid);

const expectedOperators = [
  "equals",
  "one_of",
  "not_one_of",
  "contains_all",
  "contains_any",
  "excludes_all",
  "count_equals",
  "count_at_least",
  "path_exists",
  "path_absent",
  "boolean_true",
  "boolean_false",
  "allowed_primitive_pairs",
  "exact_literal_absent",
  "exact_keys",
  "unique_array",
  "valid_reference_integrity",
];
check(
  "allowed operators exact",
  sameSet(qualityContract.allowed_operators, expectedOperators) &&
    qualityContract.allowed_operators.length === expectedOperators.length,
);
const allAssertions = qualityContract.cases.flatMap((item) => item.assertions);
check(
  "assertion contract complete and unique",
  allAssertions.length > 0 &&
    new Set(allAssertions.map((item) => item.assertion_id)).size ===
      allAssertions.length &&
    allAssertions.every(
      (item) =>
        typeof item.assertion_id === "string" &&
        typeof item.case_id === "string" &&
        typeof item.surface === "string" &&
        qualityContract.allowed_operators.includes(item.operator) &&
        Object.hasOwn(item, "expected") &&
        typeof item.blocking === "boolean" &&
        typeof item.rationale === "string" &&
        item.rationale.length > 0 &&
        ((typeof item.json_path === "string") !==
          (typeof item.bounded_evaluator_target === "object")),
    ),
);
check(
  "primitive equality never compares full objects",
  allAssertions
    .filter((item) => item.operator === "equals")
    .every(
      (item) =>
        item.json_path !== "$" &&
        (!item.expected || typeof item.expected !== "object"),
    ) &&
    allAssertions.every(
      (item) =>
        item.json_path !== "decision_facts.practical_reason" &&
        item.json_path !== "decision_facts.boundary_state",
    ),
);
check(
  "soft assertions have nonzero denominator",
  allAssertions.filter((item) => item.blocking === false).length >= 14 &&
    qualityContract.cases.every((qualityCase) =>
      qualityCase.assertions.some((item) => item.blocking === false),
    ) &&
    qualityContract.empty_evidence_rule.rate === null &&
    qualityContract.empty_evidence_rule.evidence_status === "unavailable" &&
    qualityContract.empty_evidence_rule.pass_allowed === false,
);
const evaluatorSelfTests = runEvaluatorSelfTests();
check(
  "evaluator self-tests 16/16",
  evaluatorSelfTests.passed === 16 &&
    evaluatorSelfTests.total === 16 &&
    evaluatorSelfTests.results.every((item) => item.passed),
);

check(
  "Catalog Prompt Schema file hashes exact",
  fileSha256(contract.catalog_path) === contract.catalog_sha256_utf8_lf &&
    Object.values(contract.stage_assets).every(
      (asset) =>
        fileSha256(asset.prompt_path) === asset.prompt_asset_sha256 &&
        fileSha256(asset.schema_path) === asset.schema_asset_sha256,
    ),
);
const catalogManifest = readJson(contract.catalog_path);
check(
  "Catalog v9 manifest authority exact",
  catalogManifest.catalog_version === contract.catalog &&
    catalogManifest.prompt_bundle_version === contract.prompt_bundle &&
    catalogManifest.schema_set_version === contract.schema_set &&
    catalogManifest.stage_topology_version === contract.stage_topology &&
    ["PB-01", "PB-01C"].every((stageId) => {
      const stage = catalogManifest.stages.find((item) => item.stage_id === stageId);
      const asset = contract.stage_assets[stageId];
      return (
        stage?.prompt_path === asset.prompt_path &&
        stage.prompt_sha256 === asset.prompt_asset_sha256 &&
        stage.schema_path === asset.schema_path &&
        stage.schema_sha256 === asset.schema_asset_sha256 &&
        stage.schema_version === asset.schema_version
      );
    }),
);

const historicalDScope = normalizedLines(
  git(
    "diff",
    "--name-only",
    dImplementationBaseline,
    acceptedDImplementation,
    "--",
  ),
);
check(
  "D accepted implementation historical snapshot exact 10/10",
  sameSet(historicalDScope, dExactPaths) && historicalDScope.length === 10,
);
check(
  "D non-sync evidence blobs unchanged 4/4",
  dNonSyncEvidencePaths.length === 4 &&
    dNonSyncEvidencePaths.every((item) => blobMatches(acceptedDImplementation, item)),
);
check(
  "accepted Planning A B C blobs unchanged",
  planningPaths.every((item) => blobMatches(planningContent, item)) &&
    acceptedAPaths.every((item) => blobMatches(acceptedA, item)) &&
    acceptedBPaths.every((item) => blobMatches(acceptedB, item)) &&
    acceptedCPaths.every((item) => blobMatches(acceptedC, item)),
);
check(
  "Active Service Catalog v4 and protected assets unchanged",
  readText("lib/assessment/runtime/service.ts").includes(
    "loadM2P4ProductQualityRuntimeStageCatalog",
  ) &&
    dHistoricalManifest.active_runtime.catalog_version ===
      "runtime-stage-catalog-v4.0.0" &&
    dHistoricalManifest.protected_assets.every(
      (asset) =>
        blobMatches(dHistoricalManifest.protected_asset_baseline, asset.path) &&
        git("hash-object", asset.path) === asset.git_blob_sha &&
        fileSha256(asset.path) === asset.sha256_utf8_lf,
    ),
);
check(
  "migration 0004 unchanged and unapplied",
  blobMatches(
    acceptedC,
    "supabase/migrations/0004_m2_p4_candidate_source_isolation.sql",
  ) &&
    readJson(
      "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/capabilities-v1.json",
    ).migration_applied === false &&
    capabilities.migration_applied === false,
);
check(
  "Runtime Prompt Schema Catalog Pipeline Service diff zero",
  git("diff", "--name-only", contract.baseline, "--", "lib/assessment/runtime") === "" &&
    git("diff", "--name-only", contract.baseline, "--", "supabase") === "",
);

const runnerSource = readText(
  "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-provider-diagnostic.mjs",
);
const evaluatorSource = readText(
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-provider-evaluator-v1.mjs",
);
check(
  "runner uses accepted transport with zero retry and one-time marker",
  runnerSource.includes("OpenAiResponsesTransport") &&
    runnerSource.includes("transport.client.maxRetries = 0") &&
    runnerSource.includes('flag: "wx"') &&
    runnerSource.includes("claimExecution") &&
    runnerSource.includes("process.loadEnvFile") &&
    runnerSource.includes(".env.local") &&
    runnerSource.includes("secretLeakageCount") &&
    !runnerSource.includes("Promise.all(") &&
    !runnerSource.includes("@supabase/supabase-js") &&
    !runnerSource.includes("createClient(") &&
    !runnerSource.includes("SUPABASE_URL") &&
    !runnerSource.includes("PB-02\"") &&
    !runnerSource.includes("PB-03\"") &&
    !runnerSource.includes("PB-04\"") &&
    !runnerSource.includes("PB-05\"") &&
    !runnerSource.includes("PB-06\""),
);
check(
  "runner does not dump secrets or environment",
  !/console\.(?:log|error)\s*\([^)]*OPENAI_API_KEY/gu.test(runnerSource) &&
    !runnerSource.includes("Object.entries(process.env)") &&
    !runnerSource.includes("console.log(process.env") &&
    !runnerSource.includes("readFile(paths.env") &&
    !runnerSource.includes("repairOutput(") &&
    !runnerSource.includes("fallbackInvoke(") &&
    !runnerSource.includes("maxRetries = 1"),
);
check(
  "evaluator contains no case-specific behavior",
  !/if\s*\([^\n]*(?:E-B0|E-C0)/gu.test(evaluatorSource) &&
    !/switch\s*\([^)]*case_id/gu.test(evaluatorSource) &&
    evaluatorSource.includes("applyOperator") &&
    evaluatorSource.includes("runEvaluatorSelfTests"),
);

for (const docPath of [
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_REVIEW.md",
]) {
  const text = readText(docPath);
  check(
    `${docPath} exact E marker`,
    text.split("<!-- M2-P4-I3-R1-C1-R3-R2-E:BEGIN -->").length - 1 === 1 &&
      text.split("<!-- M2-P4-I3-R1-C1-R3-R2-E:END -->").length - 1 === 1 &&
      text.includes("R4") &&
      text.includes("false"),
  );
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
const {
  loadM2P4CandidateSourceIsolationRuntimeStageCatalog,
  loadM2P4ProductQualityRuntimeStageCatalog,
} = await import("../lib/assessment/runtime/schema-catalog.ts");
const { validateGroundedStageOutput, validateStageOutput } = await import(
  "../lib/assessment/runtime/validation.ts"
);
const { validateBaseSourceIntegrityV1 } = await import(
  "../lib/assessment/runtime/base-source-integrity-v1.ts"
);
const { validateCandidateSourceIntegrityV1 } = await import(
  "../lib/assessment/runtime/candidate-source-integrity-v1.ts"
);
const { validateContextualIntakeIntegrityV3 } = await import(
  "../lib/assessment/runtime/contextual-integrity-v3.ts"
);
const runtimeCatalog =
  await loadM2P4CandidateSourceIsolationRuntimeStageCatalog();
const activeCatalog = await loadM2P4ProductQualityRuntimeStageCatalog();
check(
  "runtime Catalog loaders exact",
  runtimeCatalog.catalogVersion === contract.catalog &&
    runtimeCatalog.promptBundleVersion === contract.prompt_bundle &&
    runtimeCatalog.schemaSetVersion === contract.schema_set &&
    runtimeCatalog.stageTopologyVersion === contract.stage_topology &&
    activeCatalog.promptBundleVersion === contract.active_prompt_bundle &&
    activeCatalog.schemaSetVersion === contract.active_schema_set,
);
check(
  "runtime PB-01 PB-01C definition hashes exact",
  ["PB-01", "PB-01C"].every((stageId) => {
    const definition = runtimeCatalog.definitions.find(
      (item) => item.stageId === stageId,
    );
    const asset = contract.stage_assets[stageId];
    return (
      definition?.promptHash === asset.combined_prompt_sha256 &&
      definition.promptVersion === asset.prompt_version &&
      definition.schemaHash === asset.schema_definition_sha256 &&
      definition.schemaVersion === asset.schema_version
    );
  }),
);

if (phase === "package") {
  const commitCount = Number(
    git("rev-list", "--count", `${contract.baseline}..HEAD`),
  );
  check(
    "package phase commit shape",
    [0, 1].includes(commitCount) &&
      (commitCount === 0 ||
        (git("rev-parse", "HEAD^") === contract.baseline &&
          git("log", "-1", "--format=%s") === contract.package_commit_subject)),
  );
  check(
    "package authorization unconsumed",
    authorization.consumed === false &&
      authorization.rerun_authorized === false &&
      authorization.package_commit === null &&
      authorization.actual_calls === 0 &&
      results.status === "not_started" &&
      results.calls.length === 0 &&
      results.calls_actual === 0 &&
      capabilities.status === "provider_diagnostic_package_ready_not_started" &&
      capabilities.provider_quality_established === false &&
      capabilities.r4_authorized === false &&
      capabilities.c2_authorized === false,
  );
  check(
    "one-time marker absent",
    !existsSync(
      path.join(
        repositoryRoot,
        ".git",
        path.basename(contract.one_time_marker),
      ),
    ),
  );
} else {
  const packageCommit = authorization.package_commit;
  check(
    "evidence package Commit A authority",
    typeof packageCommit === "string" &&
      /^[0-9a-f]{40}$/u.test(packageCommit) &&
      results.package_commit === packageCommit &&
      capabilities.package_commit === packageCommit &&
      git("rev-parse", `${packageCommit}^`) === contract.baseline &&
      git("log", "-1", "--format=%s", packageCommit) ===
        contract.package_commit_subject,
  );
  const postCommitted = normalizedLines(
    git("diff", "--name-only", packageCommit, "HEAD", "--"),
  );
  const postWorking = normalizedLines(git("diff", "--name-only", "HEAD", "--"));
  const postUntracked = normalizedLines(
    git("ls-files", "--others", "--exclude-standard"),
  );
  const postScope = [
    ...new Set([...postCommitted, ...postWorking, ...postUntracked]),
  ];
  check("post-run mutable scope exact 8/8", sameSet(postScope, contract.post_run_mutable_paths));
  check(
    "frozen Commit A paths unchanged 6/6",
    contract.frozen_after_commit_a_paths.every((item) =>
      blobMatches(packageCommit, item),
    ),
  );
  const markerPath = path.join(
    repositoryRoot,
    ".git",
    path.basename(contract.one_time_marker),
  );
  const marker = readJson(
    path.relative(repositoryRoot, markerPath).replaceAll("\\", "/"),
  );
  check(
    "one-time marker consumed and immutable authority",
    marker.task_id === contract.task_id &&
      marker.authorization_id === contract.authorization_id &&
      marker.confirmation_phrase === contract.confirmation_phrase &&
      marker.package_commit === packageCommit &&
      marker.authorized_calls === 14 &&
      marker.pb_01_calls === 8 &&
      marker.pb_01c_calls === 6 &&
      marker.rerun_authorized === false &&
      marker.secrets_saved === false,
  );
  check(
    "authorization permanently consumed",
    authorization.consumed === true &&
      authorization.rerun_authorized === false &&
      authorization.actual_calls === results.calls_actual &&
      authorization.completed_calls === results.calls_completed &&
      authorization.completion_state === results.status,
  );
  check(
    "recorded fixed operational boundaries",
    results.calls_authorized === 14 &&
      results.retry_count === 0 &&
      results.repair_count === 0 &&
      results.fallback_count === 0 &&
      results.pb_02_through_pb_06_calls === 0 &&
      results.db_operations === 0 &&
      results.supabase_operations === 0 &&
      results.holdout_use === 0 &&
      results.real_user_data === 0 &&
      results.migration_applied === false &&
      results.active_service_changed === false &&
      results.active_runtime_activated === false &&
      results.rerun_authorized === false &&
      results.r4_authorized === false &&
      results.c2_authorized === false,
  );

  const callsById = new Map(results.calls.map((call) => [call.case_id, call]));
  let callEvidenceValid = true;
  const validationPasses = (validator) => {
    try {
      validator();
      return true;
    } catch {
      return false;
    }
  };
  for (const [index, diagnosticCase] of caseBundle.entries()) {
    const call = callsById.get(diagnosticCase.case_id);
    if (!call) {
      if (index < results.calls_actual) callEvidenceValid = false;
      continue;
    }
    const qualityCase = qualityById.get(call.case_id);
    callEvidenceValid &&=
      call.call_index === index + 1 &&
      call.stage_id === diagnosticCase.stage_id &&
      canonicalJson(call.provider_input) ===
        canonicalJson(diagnosticCase.synthetic_input) &&
      call.provider_input_sha256 === shaDiagnosticJson(call.provider_input) &&
      expectedDataInjectionCount(
        call.provider_input,
        qualityCase,
        qualityContract,
        contract.provider_input_keys[call.stage_id],
      ) === call.expected_data_injection_count &&
      (call.raw_output === null ||
        call.raw_output_sha256 === shaDiagnosticJson(call.raw_output)) &&
      (call.grounded_output === null ||
        call.grounded_output_sha256 === shaDiagnosticJson(call.grounded_output)) &&
      call.raw_output_sha256 === call.raw_output_sha256_after_processing &&
      call.provider_output_mutated === false;
    const definition = runtimeCatalog.definitions.find(
      (item) => item.stageId === call.stage_id,
    );
    const rawSchemaPassed =
      call.raw_output !== null &&
      validationPasses(() => validateStageOutput(definition, call.raw_output));
    callEvidenceValid &&=
      rawSchemaPassed === call.raw_schema_result.passed;
    if (call.stage_id === "PB-01") {
      const rawIntegrityPassed =
        call.raw_output !== null &&
        validationPasses(() =>
          validateBaseSourceIntegrityV1({
            input: call.provider_input,
            baseProviderRequest: call.provider_input,
            rawBaseOutput: call.raw_output,
          }),
        );
      const groundedSchemaPassed =
        call.grounded_output !== null &&
        validationPasses(() =>
          validateGroundedStageOutput(definition, call.grounded_output),
        );
      const groundedIntegrityPassed =
        call.grounded_output !== null &&
        validationPasses(() =>
          validateBaseSourceIntegrityV1({
            input: call.provider_input,
            groundedBaseOutput: call.grounded_output,
          }),
        );
      const contextualPassed =
        call.grounded_output !== null &&
        validationPasses(() =>
          validateContextualIntakeIntegrityV3(call.grounded_output),
        );
      const applicationCanonicalPassed =
        call.grounded_output?.relationship_stage ===
          call.provider_input.relationship &&
        call.grounded_output?.decision_facts?.relationship_stage ===
          call.provider_input.relationship &&
        sameSet(
          call.grounded_output?.decision_facts?.selected_requests ?? [],
          call.provider_input.requested_topics,
        );
      callEvidenceValid &&=
        rawIntegrityPassed === call.raw_source_integrity_result.passed &&
        groundedSchemaPassed === call.grounded_schema_result.passed &&
        groundedIntegrityPassed ===
          call.grounded_source_integrity_result.passed &&
        contextualPassed === call.contextual_integrity_result.passed &&
        applicationCanonicalPassed ===
          call.application_canonical_result.passed;
    } else {
      const rawIntegrityPassed =
        call.raw_output !== null &&
        validationPasses(() =>
          validateCandidateSourceIntegrityV1({
            candidateProviderInput: call.provider_input,
            rawCandidateProviderOutput: call.raw_output,
          }),
        );
      const groundedShapePassed =
        call.grounded_output !== null &&
        exactKeys(call.grounded_output, [
          "candidate_analysis",
          "candidate_safety_result",
        ]) &&
        exactKeys(call.grounded_output.candidate_analysis, [
          "candidate_style_profile",
          "candidate_communicative_intent",
          "candidate_language_expression",
        ]) &&
        exactKeys(call.grounded_output.candidate_safety_result, [
          "untrusted_embedded_instruction_detected",
          "signal_codes",
        ]);
      const groundedIntegrityPassed =
        call.grounded_output !== null &&
        call.candidate_lane !== null &&
        validationPasses(() =>
          validateCandidateSourceIntegrityV1({
            candidateAnalysis: call.grounded_output.candidate_analysis,
            candidateSafetyResult:
              call.grounded_output.candidate_safety_result,
            candidateEnvelope: call.candidate_lane.candidate_envelope,
          }),
        );
      callEvidenceValid &&=
        rawIntegrityPassed === call.raw_source_integrity_result.passed &&
        groundedShapePassed === call.grounded_schema_result.passed &&
        groundedIntegrityPassed ===
          call.grounded_source_integrity_result.passed &&
        (groundedShapePassed && groundedIntegrityPassed) ===
          call.candidate_allowlist_grounding_result.passed;
    }
    const reevaluated = evaluateProviderCall(call, qualityCase, qualityContract);
    callEvidenceValid &&=
      canonicalJson(reevaluated) === canonicalJson(call.evaluation) &&
      canonicalJson(call.assertion_results) ===
        canonicalJson(call.evaluation.assertion_results) &&
      canonicalJson(call.hard_failures) ===
        canonicalJson(call.evaluation.hard_failures);
  }
  check("per-call immutable evidence and frozen evaluation valid", callEvidenceValid);
  check(
    "aggregate usage exact",
    canonicalJson(aggregateUsage(results.calls)) ===
      canonicalJson(results.usage_totals),
  );
  check(
    "aggregate counters exact",
    results.calls_actual === results.calls.length &&
      results.calls_completed ===
        results.calls.filter((call) => call.provider_completed).length &&
      results.pb_01_calls ===
        results.calls.filter((call) => call.stage_id === "PB-01").length &&
      results.pb_01c_calls ===
        results.calls.filter((call) => call.stage_id === "PB-01C").length &&
      results.provider_output_mutation_count ===
        results.calls.filter((call) => call.provider_output_mutated).length &&
      results.expected_data_injection_count ===
        results.calls.reduce(
          (total, call) => total + call.expected_data_injection_count,
          0,
        ) &&
      results.secret_leakage_count ===
        results.calls.reduce(
          (total, call) => total + call.secret_leakage_count,
          0,
        ) &&
      results.exact_literal_leakage_count ===
        results.calls.reduce(
          (total, call) => total + call.exact_literal_leakage_count,
          0,
        ),
  );
  const reevaluatedDiagnostic = evaluateDiagnostic(
    contract,
    qualityContract,
    results,
  );
  check(
    "diagnostic evaluation reproducible",
    canonicalJson(reevaluatedDiagnostic) === canonicalJson(results.evaluation),
  );
  check(
    "evaluator self-tests recorded 16/16",
    results.evaluator_self_tests.passed === 16 &&
      results.evaluator_self_tests.total === 16 &&
      canonicalJson(results.evaluator_self_tests) ===
        canonicalJson(evaluatorSelfTests),
  );

  const passStatus = results.status === contract.pass_status;
  const failStatus = results.status === contract.fail_status;
  const blockedStatus = results.status === contract.evaluation_blocked_status;
  check(
    "status and capability semantics consistent",
    [passStatus, failStatus, blockedStatus].filter(Boolean).length === 1 &&
      capabilities.status === results.status &&
      capabilities.provider_diagnostic_verdict === results.evaluation.verdict &&
      capabilities.full_runtime_provider_quality_established === false &&
      capabilities.r4_authorized === false &&
      capabilities.c2_authorized === false &&
      (passStatus
        ? results.evaluation.verdict === "PASS" &&
          results.provider_quality_established === true &&
          results.candidate_source_isolation_provider_boundary_confirmed === true &&
          results.candidate_analysis_provider_quality_established === true &&
          results.candidate_safety_provider_quality_established === true &&
          results.candidate_ready_for_isolated_e2e === true &&
          results.r4_ready === true
        : results.provider_quality_established === false &&
          results.candidate_ready_for_isolated_e2e === false &&
          results.r4_ready === false),
  );
  check(
    "summary and review disclose evidence and boundaries",
    readText(artifactPaths.summary).includes(`- Status: ${results.status}`) &&
      readText(artifactPaths.summary).includes(
        `- Verdict: ${results.evaluation.verdict}`,
      ) &&
      readText(artifactPaths.summary).includes("Exact fourteen cases") &&
      readText(artifactPaths.summary).includes("Usage totals") &&
      readText(
        "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_REVIEW.md",
      ).includes(results.status) &&
      readText(
        "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_REVIEW.md",
      ).includes("Human / ChatGPT review: pending") &&
      ["docs/CURRENT_FOCUS.md", "docs/WBS.md", "docs/CODEX_HANDOFF.md"].every(
        (item) =>
          readText(item).includes(results.status) &&
          readText(item).includes("rerun is unauthorized"),
      ),
  );
}

check(
  "git diff check",
  git("diff", "--check", contract.baseline, "HEAD", "--") === "" &&
    git("diff", "--check") === "",
);

console.log("M2_P4_I3_R1_C1_R3_R2_E_PROVIDER_DIAGNOSTIC_VERIFIER: PASS");
console.log(`phase: ${phase}`);
console.log(`checks: ${checkCount}`);
console.log("exact scope: 14/14");
console.log("post-run mutable scope: 8/8");
console.log(`evaluator self-tests: ${evaluatorSelfTests.passed}/16`);
console.log(`calls recorded: ${results.calls_actual}/14`);
console.log(`verdict: ${results.evaluation.verdict}`);
console.log("R4 authorized: false");
console.log("C2 authorized: false");
