import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { open, readFile, rename, writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  aggregateUsage,
  buildProductOwnerReview,
  evaluateDiagnostic,
  renderDiagnosticSummary,
  renderDocumentationStatusBlock,
  renderProductReview,
  renderReviewDocument,
  runActiveLoaderReturnShapeSelfTests,
  runEvaluatorSelfTests,
  shaDiagnosticJson,
  validateActiveLoaderIdentity,
} from "./lib/m2-p4-i3-r1-c1-r3-r2-e-r3-evaluator-v1.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const artifactRoot = path.join(
  repositoryRoot,
  "evals",
  "runtime",
  "m2-p4-i3-r1-c1-r3-r2-e-r3",
);
const artifact = (name) => path.join(artifactRoot, name);
const paths = {
  contract: artifact("diagnostic-contract-v1.json"),
  cases: artifact("diagnostic-cases-v1.json"),
  quality: artifact("quality-contract-v1.json"),
  authorization: artifact("authorization-v1.json"),
  results: artifact("diagnostic-results-v1.json"),
  summary: artifact("diagnostic-summary-v1.md"),
  productReview: artifact("product-review-v1.md"),
  productOwnerReview: artifact("product-owner-review-v1.json"),
  capabilities: artifact("capabilities-v1.json"),
  review: path.join(
    repositoryRoot,
    "docs",
    "phase2",
    "TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_REVIEW.md",
  ),
  currentFocus: path.join(repositoryRoot, "docs", "CURRENT_FOCUS.md"),
  wbs: path.join(repositoryRoot, "docs", "WBS.md"),
  handoff: path.join(repositoryRoot, "docs", "CODEX_HANDOFF.md"),
};
const documentationMarker = "M2-P4-I3-R1-C1-R3-R2-E-R3";

let runtimeHooksRegistered = false;

async function loadRuntimeModules() {
  if (!runtimeHooksRegistered) {
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
    runtimeHooksRegistered = true;
  }
  const [
    { AssessmentApplication },
    { FakeAssessmentRepository },
    { OpenAiResponsesTransport },
    {
      loadM2P4DirectionalGuidanceRuntimeStageCatalog,
      loadM2P4ProductQualityRuntimeStageCatalog,
    },
    { M2RuntimeError },
    { projectBaseProviderInputV1 },
    { groundBaseStructuredIntakeV2 },
    { buildBaseStructuredIntakeLegacyViewV1 },
    { validateBaseSourceIntegrityV1 },
    { validateContextualIntakeIntegrityV3 },
    { groundCandidateAnalysisV1 },
    { validateCandidateSourceIntegrityV1 },
    {
      buildAbsentCandidateLaneV1,
      buildAnalysisUnavailableSafetyAvailableCandidateLaneV1,
      buildAvailableCandidateLaneV1,
      buildSafetyUnavailableCandidateLaneV1,
      buildSplitAnalysisEnvelopeV1,
    },
    {
      evaluateCandidateBoundaryContactV1,
      projectCandidateSafetyDispositionV1,
    },
    { deterministicSafetyResult },
    { aggregateSafetyV3 },
    { deriveRuntimeEligibilityV3 },
    { buildContextualDecisionPolicyV3, requireContextualDecisionFactsV3 },
    { groundReportContentV3 },
    { groundChangeConditionCommentaryV3 },
    { evaluateSemanticFindingsV4 },
    { validateGroundedStageOutput, validateStageOutput },
  ] = await Promise.all([
    import("../lib/assessment/runtime/application.ts"),
    import("../lib/assessment/runtime/fakes.ts"),
    import("../lib/assessment/runtime/openai-transport.ts"),
    import("../lib/assessment/runtime/schema-catalog.ts"),
    import("../lib/assessment/runtime/errors.ts"),
    import("../lib/assessment/runtime/base-structured-intake-grounding-v1.ts"),
    import("../lib/assessment/runtime/base-structured-intake-grounding-v2.ts"),
    import("../lib/assessment/runtime/base-structured-intake-legacy-view-v1.ts"),
    import("../lib/assessment/runtime/base-source-integrity-v1.ts"),
    import("../lib/assessment/runtime/contextual-integrity-v3.ts"),
    import("../lib/assessment/runtime/candidate-analysis-grounding-v1.ts"),
    import("../lib/assessment/runtime/candidate-source-integrity-v1.ts"),
    import("../lib/assessment/runtime/split-analysis-envelope-v1.ts"),
    import("../lib/assessment/runtime/candidate-safety-routing-v1.ts"),
    import("../lib/assessment/runtime/policy.ts"),
    import("../lib/assessment/runtime/safety-aggregation-v3.ts"),
    import("../lib/assessment/runtime/eligibility-v3.ts"),
    import("../lib/assessment/runtime/policy-v3.ts"),
    import("../lib/assessment/runtime/report-grounding-v3.ts"),
    import("../lib/assessment/runtime/change-condition-grounding-v3.ts"),
    import("../lib/assessment/runtime/semantic-disposition-v4.ts"),
    import("../lib/assessment/runtime/validation.ts"),
  ]);
  return {
    AssessmentApplication,
    FakeAssessmentRepository,
    OpenAiResponsesTransport,
    loadM2P4DirectionalGuidanceRuntimeStageCatalog,
    loadM2P4ProductQualityRuntimeStageCatalog,
    M2RuntimeError,
    projectBaseProviderInputV1,
    groundBaseStructuredIntakeV2,
    buildBaseStructuredIntakeLegacyViewV1,
    validateBaseSourceIntegrityV1,
    validateContextualIntakeIntegrityV3,
    groundCandidateAnalysisV1,
    validateCandidateSourceIntegrityV1,
    buildAbsentCandidateLaneV1,
    buildAnalysisUnavailableSafetyAvailableCandidateLaneV1,
    buildAvailableCandidateLaneV1,
    buildSafetyUnavailableCandidateLaneV1,
    buildSplitAnalysisEnvelopeV1,
    evaluateCandidateBoundaryContactV1,
    projectCandidateSafetyDispositionV1,
    deterministicSafetyResult,
    aggregateSafetyV3,
    deriveRuntimeEligibilityV3,
    buildContextualDecisionPolicyV3,
    requireContextualDecisionFactsV3,
    groundReportContentV3,
    groundChangeConditionCommentaryV3,
    evaluateSemanticFindingsV4,
    validateGroundedStageOutput,
    validateStageOutput,
  };
}

const clone = (value) => structuredClone(value);
const canonicalLf = (value) => value.replace(/\r\n/gu, "\n");
const sha256 = (value) =>
  createHash("sha256").update(Buffer.from(value, "utf8")).digest("hex");
const fileSha256 = (relativePath) =>
  sha256(canonicalLf(readFileSync(path.join(repositoryRoot, relativePath), "utf8")));

function git(...args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: repositoryRoot, encoding: "utf8" },
  ).trim();
}

function readJsonAt(ref, relativePath) {
  return JSON.parse(git("show", `${ref}:${relativePath}`));
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJsonAtomic(filePath, value) {
  const temporary = `${filePath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, filePath);
}

async function writeTextAtomic(filePath, value) {
  const temporary = `${filePath}.tmp`;
  await writeFile(temporary, value.endsWith("\n") ? value : `${value}\n`, "utf8");
  await rename(temporary, filePath);
}

function safeCode(error, fallback = "M2_E_R3_EXECUTION_FAILED") {
  return error?.safeCode ?? error?.message ?? fallback;
}

function parseArguments(contract) {
  const args = process.argv.slice(2);
  const value = (name) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] ?? null : null;
  };
  return {
    packageCommit: value("--package-commit"),
    confirmation: value("--confirm"),
    exact:
      args.length === 4 &&
      args[0] === "--package-commit" &&
      args[2] === "--confirm" &&
      value("--confirmation") === null &&
      value("--package-commit") !== null &&
      value("--confirm") !== null &&
      value("--confirm") === contract.confirmation_phrase,
  };
}

function exactKeys(value, expected) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify([...expected].sort())
  );
}

function sameSet(left, right) {
  return JSON.stringify([...new Set(left)].sort()) === JSON.stringify([...new Set(right)].sort());
}

function normalizedLines(value) {
  return value.split(/\r?\n/u).filter(Boolean);
}

function assertCondition(condition, code) {
  if (!condition) throw new Error(code);
}

function loadAuthorizedEnvironment(contract) {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
    const envPath = path.join(repositoryRoot, ".env.local");
    assertCondition(existsSync(envPath), "M2_E_R3_AUTHORIZED_ENV_MISSING");
    process.loadEnvFile(envPath);
  }
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  assertCondition(typeof apiKey === "string" && apiKey.length > 0, "M2_E_R3_API_KEY_MISSING");
  assertCondition(model === contract.model, "M2_E_R3_MODEL_MISMATCH");
  const unauthorizedOpenAiEnvironmentKeys = Object.keys(process.env).filter(
    (key) =>
      key.startsWith("OPENAI_") &&
      !contract.environment_allowlist.includes(key),
  );
  assertCondition(
    unauthorizedOpenAiEnvironmentKeys.length === 0,
    "M2_E_R3_UNAUTHORIZED_OPENAI_ENVIRONMENT",
  );
  return { apiKey, model };
}

function assertCatalogAssets(contract, manifest) {
  assertCondition(fileSha256(contract.catalog_path) === contract.catalog_sha256_utf8_lf, "M2_E_R3_CATALOG_HASH_MISMATCH");
  assertCondition(manifest.catalog_version === contract.catalog, "M2_E_R3_CATALOG_IDENTITY_MISMATCH");
  assertCondition(manifest.prompt_bundle_version === contract.prompt_bundle, "M2_E_R3_PROMPT_IDENTITY_MISMATCH");
  assertCondition(manifest.schema_set_version === contract.schema_set, "M2_E_R3_SCHEMA_IDENTITY_MISMATCH");
  assertCondition(manifest.stage_topology_version === contract.stage_topology, "M2_E_R3_TOPOLOGY_MISMATCH");
  assertCondition(
    manifest.stages.every(
      (stage) =>
        fileSha256(stage.prompt_path) === stage.prompt_sha256 &&
        fileSha256(stage.schema_path) === stage.schema_sha256 &&
        (!stage.grounded_schema_path ||
          fileSha256(stage.grounded_schema_path) === stage.grounded_schema_sha256),
    ),
    "M2_E_R3_STAGE_ASSET_HASH_MISMATCH",
  );
}

function assertActiveCatalogManifest(contract, manifest) {
  assertCondition(
    fileSha256(contract.active_catalog_path) ===
      contract.active_catalog_sha256_utf8_lf,
    "M2_E_R3_ACTIVE_CATALOG_HASH_MISMATCH",
  );
  assertCondition(
    manifest.catalog_version === contract.active_catalog,
    "M2_E_R3_ACTIVE_CATALOG_MANIFEST_MISMATCH",
  );
  assertCondition(
    manifest.prompt_bundle_version === contract.active_prompt_bundle &&
      manifest.schema_set_version === contract.active_schema_set,
    "M2_E_R3_ACTIVE_MANIFEST_IDENTITY_MISMATCH",
  );
  assertCondition(
    manifest.stages.length === contract.active_loader_identity.stage_count &&
      manifest.stages.every(
        (stage, index) =>
          stage.stage_id ===
            contract.active_loader_identity.stages[index].stage_id &&
          stage.sequence_number ===
            contract.active_loader_identity.stages[index].sequence_number,
      ),
    "M2_E_R3_ACTIVE_MANIFEST_STAGE_ORDER_MISMATCH",
  );
}

function assertPackagePreflight({
  contract,
  cases,
  qualityContract,
  authorization,
  initialResults,
  invocation,
  markerPath,
}) {
  const branch = git("branch", "--show-current");
  const head = git("rev-parse", "HEAD");
  const upstream = git("rev-parse", "@{u}");
  const abortedContract = readJsonAt(
    contract.aborted_package_commit,
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/diagnostic-contract-v1.json",
  );
  const abortedAuthorization = readJsonAt(
    contract.aborted_package_commit,
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/authorization-v1.json",
  );
  const abortedResults = readJsonAt(
    contract.aborted_package_commit,
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/diagnostic-results-v1.json",
  );
  const serviceSource = readFileSync(
    path.join(repositoryRoot, "lib/assessment/runtime/service.ts"),
    "utf8",
  );
  assertCondition(invocation.exact, "M2_E_R3_INVOCATION_INVALID");
  assertCondition(branch === contract.branch, "M2_E_R3_BRANCH_MISMATCH");
  assertCondition(head === upstream, "M2_E_R3_UPSTREAM_MISMATCH");
  assertCondition(head === invocation.packageCommit, "M2_E_R3_PACKAGE_SHA_MISMATCH");
  assertCondition(/^[0-9a-f]{40}$/u.test(invocation.packageCommit), "M2_E_R3_PACKAGE_SHA_INVALID");
  assertCondition(git("status", "--porcelain=v1", "-z") === "", "M2_E_R3_DIRTY_WORKTREE");
  assertCondition(git("rev-parse", "main") === contract.main_baseline, "M2_E_R3_MAIN_CHANGED");
  assertCondition(git("rev-parse", "origin/main") === contract.main_baseline, "M2_E_R3_ORIGIN_MAIN_CHANGED");
  assertCondition(git("stash", "list") === "", "M2_E_R3_STASH_NOT_EMPTY");
  assertCondition(git("rev-list", "--count", `${contract.baseline}..HEAD`) === "1", "M2_E_R3_COMMIT_COUNT_INVALID");
  assertCondition(git("show", "-s", "--format=%s", "HEAD") === contract.package_commit_subject, "M2_E_R3_PACKAGE_SUBJECT_INVALID");
  assertCondition(
    contract.package_revision === "R1" &&
      contract.package_baseline === contract.baseline &&
      contract.aborted_package_commit ===
        "b909bf3ad259bea0251cf2f81e7a40d9262ce211" &&
      contract.aborted_package_status === "aborted_before_execution" &&
      contract.aborted_package_provider_calls === 0 &&
      contract.aborted_package_marker_created === false &&
      contract.aborted_package_authorization_consumed === false &&
      contract.replacement_changes === "diagnostic_package_only" &&
      contract.product_cases_changed === false &&
      contract.quality_doctrine_changed === false &&
      contract.provider_budget_changed === false,
    "M2_E_R3_REPLACEMENT_METADATA_INVALID",
  );
  assertCondition(
    git("cat-file", "-e", `${contract.aborted_package_commit}^{commit}`) ===
      "" &&
      git(
        "rev-parse",
        "refs/heads/test/m2-p4-i3-r1-c1-r3-r2-e-r3-provider-product-diagnostic",
      ) === contract.aborted_package_commit &&
      git(
        "rev-parse",
        "refs/remotes/origin/test/m2-p4-i3-r1-c1-r3-r2-e-r3-provider-product-diagnostic",
      ) === contract.aborted_package_commit,
    "M2_E_R3_ABORTED_PACKAGE_NOT_IMMUTABLE",
  );
  assertCondition(
    abortedAuthorization.consumed === false &&
      abortedAuthorization.actual_calls === 0 &&
      abortedAuthorization.completed_calls === 0 &&
      abortedResults.calls_actual === 0 &&
      abortedResults.calls_completed === 0 &&
      abortedResults.status === "not_started" &&
      !existsSync(path.join(repositoryRoot, abortedContract.one_time_marker)),
    "M2_E_R3_ABORTED_EXECUTION_NOT_ZERO",
  );
  assertCondition(
    contract.authorization_id !== abortedContract.authorization_id &&
      contract.confirmation_phrase !== abortedContract.confirmation_phrase &&
      contract.one_time_marker !== abortedContract.one_time_marker,
    "M2_E_R3_FRESH_AUTHORIZATION_IDENTITY_INVALID",
  );
  assertCondition(
    sameSet(
      normalizedLines(git("diff", "--name-only", contract.baseline, "HEAD", "--")),
      contract.exact_mutation_paths,
    ),
    "M2_E_R3_PACKAGE_SCOPE_INVALID",
  );
  assertCondition(
    git(
      "rev-parse",
      `${contract.package_baseline}:lib/assessment/runtime/service.ts`,
    ) === git("hash-object", "lib/assessment/runtime/service.ts") &&
      fileSha256("lib/assessment/runtime/service.ts") ===
        contract.active_service_sha256_utf8_lf &&
      serviceSource.includes(
        'import { loadM2P4ProductQualityRuntimeStageCatalog } from "./schema-catalog.ts";',
      ) &&
      serviceSource.includes(
        "const catalog = await loadM2P4ProductQualityRuntimeStageCatalog();",
      ) &&
      git(
        "diff",
        "--name-only",
        contract.package_baseline,
        "--",
        "lib/assessment/runtime",
      ) === "",
    "M2_E_R3_ACTIVE_SERVICE_CHANGED",
  );
  assertCondition(
    git(
      "rev-parse",
      `${contract.package_baseline}:${contract.active_catalog_path}`,
    ) === git("hash-object", contract.active_catalog_path),
    "M2_E_R3_ACTIVE_CATALOG_CHANGED",
  );
  assertCondition(
    fileSha256(
      "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql",
    ) === contract.migration_0005_sha256_utf8_lf,
    "M2_E_R3_MIGRATION_CHANGED",
  );
  assertCondition(!existsSync(markerPath), "M2_E_R3_AUTHORIZATION_ALREADY_CONSUMED");
  assertCondition(
    authorization.authorization_id === contract.authorization_id &&
      authorization.confirmation_phrase === contract.confirmation_phrase &&
      authorization.model === contract.model &&
      authorization.authorized_max_calls === contract.authorized_max_calls &&
      authorization.expected_calls === contract.expected_calls &&
      authorization.approved_cases === contract.approved_cases,
    "M2_E_R3_AUTHORIZATION_CONTRACT_MISMATCH",
  );
  assertCondition(authorization.consumed === false && authorization.rerun_authorized === false, "M2_E_R3_AUTHORIZATION_STATE_INVALID");
  assertCondition(authorization.package_commit === null && authorization.actual_calls === 0 && authorization.completed_calls === 0, "M2_E_R3_AUTHORIZATION_COUNTER_INVALID");
  assertCondition(initialResults.status === "not_started" && initialResults.calls_actual === 0, "M2_E_R3_INITIAL_RESULT_INVALID");
  assertCondition(
    initialResults.calls_expected === contract.expected_calls &&
      initialResults.calls_authorized_maximum ===
        contract.authorized_max_calls &&
      initialResults.authorization_consumed === false,
    "M2_E_R3_INITIAL_RESULT_CONTRACT_MISMATCH",
  );
  assertCondition(cases.length === 6 && qualityContract.cases.length === 6, "M2_E_R3_CASE_COUNT_INVALID");
  assertCondition(sameSet(cases.map((item) => item.case_id), Object.keys(contract.expected_stage_paths)), "M2_E_R3_CASE_IDS_INVALID");
  assertCondition(new Set(cases.map((item) => item.fixed_id_prefix)).size === 6, "M2_E_R3_FIXED_IDS_INVALID");
  assertCondition(new Set(cases.map((item) => item.fixed_clock)).size === 6, "M2_E_R3_FIXED_CLOCKS_INVALID");
  assertCondition(
    git(
      "rev-parse",
      `${contract.aborted_package_commit}:evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/diagnostic-cases-v1.json`,
    ) ===
      git(
        "hash-object",
        "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/diagnostic-cases-v1.json",
      ) &&
      git(
        "rev-parse",
        `${contract.aborted_package_commit}:evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/quality-contract-v1.json`,
      ) ===
        git(
          "hash-object",
          "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/quality-contract-v1.json",
        ) &&
      contract.expected_calls === abortedContract.expected_calls &&
      contract.authorized_max_calls === abortedContract.authorized_max_calls,
    "M2_E_R3_APPROVED_PRODUCT_AUTHORITY_CHANGED",
  );
  assertCondition(
    contract.frozen_after_commit_a_paths.every(
      (relativePath) =>
        git("rev-parse", `${head}:${relativePath}`) ===
        git("hash-object", relativePath),
    ),
    "M2_E_R3_FROZEN_PACKAGE_MISMATCH",
  );
}

function configureZeroRetries(transport) {
  const client = Reflect.get(transport, "client");
  assertCondition(client && typeof client === "object", "M2_E_R3_OPENAI_CLIENT_UNAVAILABLE");
  client.maxRetries = 0;
  assertCondition(client.maxRetries === 0, "M2_E_R3_RETRY_CONFIGURATION_FAILED");
}

function deterministicUuidFactory(prefix) {
  let sequence = 0;
  return () => `${prefix}-${String(++sequence).padStart(4, "0")}`;
}

function assessmentInput(diagnosticCase) {
  const input = diagnosticCase.synthetic_input;
  return {
    currentSituation: input.current_situation,
    optionalMessage: input.optional_message,
    relationship: input.relationship,
    requestedTopics: clone(input.requested_topics),
    privacyAcknowledged: true,
  };
}

function forbiddenKeyCount(value, forbiddenKeys) {
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + forbiddenKeyCount(item, forbiddenKeys), 0);
  }
  if (!value || typeof value !== "object") return 0;
  return Object.entries(value).reduce(
    (total, [key, item]) =>
      total + (forbiddenKeys.has(key) ? 1 : 0) + forbiddenKeyCount(item, forbiddenKeys),
    0,
  );
}

function stringOccurrenceCount(value, literals) {
  const serialized = JSON.stringify(value);
  return literals.reduce((total, literal) => {
    if (!literal) return total;
    let count = 0;
    let offset = 0;
    while ((offset = serialized.indexOf(literal, offset)) >= 0) {
      count += 1;
      offset += literal.length;
    }
    return total + count;
  }, 0);
}

function inspectProviderInput(request, contract, cases, qualityContract) {
  const expectedKeys = contract.stage_input_keys[request.stageId];
  const forbiddenKeys = new Set(contract.provider_oracle_forbidden_keys);
  const oracleLiterals = [
    ...cases.map((item) => item.case_id),
    ...qualityContract.oracle_sentinels,
    ...qualityContract.cases.flatMap((item) =>
      item.assertions.map((assertion) => assertion.assertion_id),
    ),
    contract.confirmation_phrase,
    "Expected product direction",
    "Product Owner decision",
  ];
  const keyViolations = forbiddenKeyCount(request.input, forbiddenKeys);
  const literalViolations = stringOccurrenceCount(request.input, oracleLiterals);
  const routingViolation = exactKeys(request.input, expectedKeys) ? 0 : 1;
  return {
    passed: keyViolations + literalViolations + routingViolation === 0,
    expected_data_injection_count: keyViolations + literalViolations,
    routing_violation_count: routingViolation,
    exact_input_keys: Object.keys(request.input).sort(),
  };
}

function secretOccurrenceCount(value, apiKey) {
  if (!apiKey) return 0;
  return stringOccurrenceCount(value, [apiKey]);
}

function redactSecret(value, apiKey) {
  if (typeof value === "string") return value.split(apiKey).join("[REDACTED_API_KEY]");
  if (Array.isArray(value)) return value.map((item) => redactSecret(item, apiKey));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactSecret(item, apiKey)]),
    );
  }
  return value;
}

function providerRequestEvidence(request) {
  return {
    stage_id: request.stageId,
    model: request.model,
    developer_prompt: request.developerPrompt,
    prompt_version: request.promptVersion,
    prompt_hash: request.promptHash,
    schema_name: request.schemaName,
    schema_version: request.schemaVersion,
    schema_hash: request.schemaHash,
    output_schema: clone(request.outputSchema),
    input: clone(request.input),
  };
}

function recomputeTotals(result, authorization) {
  const calls = result.cases.flatMap((item) => item.provider_calls ?? []);
  result.calls_actual = calls.length;
  result.calls_completed = calls.filter((item) => item.provider_completed).length;
  result.provider_output_mutation_count = result.cases.reduce(
    (total, item) => total + (item.provider_output_mutation_count ?? 0),
    0,
  );
  result.expected_data_injection_count = result.cases.reduce(
    (total, item) => total + (item.expected_data_injection_count ?? 0),
    0,
  );
  result.secret_leakage_count = result.cases.reduce(
    (total, item) => total + (item.secret_leakage_count ?? 0),
    0,
  );
  result.usage_totals = aggregateUsage(calls);
  result.supabase_operations = result.cases.reduce(
    (total, item) => total + (item.fake_stage_persistence_evidence?.actual_supabase_calls ?? 0),
    0,
  );
  authorization.actual_calls = result.calls_actual;
  authorization.completed_calls = result.calls_completed;
}

async function persistProgress(result, authorization) {
  recomputeTotals(result, authorization);
  await writeJsonAtomic(paths.authorization, authorization);
  await writeJsonAtomic(paths.results, result);
}

class CapturingTransport {
  constructor({
    delegate,
    runtime,
    contract,
    cases,
    qualityContract,
    result,
    authorization,
    caseResult,
    apiKey,
    fatalState,
  }) {
    this.delegate = delegate;
    this.runtime = runtime;
    this.contract = contract;
    this.cases = cases;
    this.qualityContract = qualityContract;
    this.result = result;
    this.authorization = authorization;
    this.caseResult = caseResult;
    this.apiKey = apiKey;
    this.fatalState = fatalState;
    this.outputReferences = new Map();
  }

  async invoke(request) {
    if (this.result.calls_actual >= this.contract.authorized_max_calls) {
      this.fatalState.code = "M2_E_R3_CALL_BUDGET_VIOLATION";
      throw new this.runtime.M2RuntimeError(this.fatalState.code);
    }
    const isolation = inspectProviderInput(
      request,
      this.contract,
      this.cases,
      this.qualityContract,
    );
    if (!isolation.passed) {
      this.caseResult.rejected_provider_inputs.push({
        stage_id: request.stageId,
        provider_request: providerRequestEvidence(request),
        provider_input_isolation: isolation,
      });
      this.caseResult.provider_input_isolation_passed = false;
      this.caseResult.expected_data_injection_count +=
        isolation.expected_data_injection_count + isolation.routing_violation_count;
      this.fatalState.code = "M2_E_R3_PROVIDER_INPUT_ORACLE_DETECTED";
      await persistProgress(this.result, this.authorization);
      throw new this.runtime.M2RuntimeError(this.fatalState.code);
    }
    const requestEvidence = providerRequestEvidence(request);
    const call = {
      call_index: this.result.calls_actual + 1,
      case_call_index: this.caseResult.provider_calls.length + 1,
      case_id: this.caseResult.case_id,
      stage_id: request.stageId,
      provider_attempted: true,
      provider_completed: false,
      requested_model: request.model,
      returned_model: null,
      returned_model_exact: false,
      response_id: null,
      latency_ms: 0,
      usage: {
        input_tokens: 0,
        cached_tokens: 0,
        output_tokens: 0,
        reasoning_tokens: 0,
      },
      provider_request: requestEvidence,
      request_sha256: shaDiagnosticJson(requestEvidence),
      raw_output: null,
      raw_output_sha256: null,
      raw_output_sha256_after_processing: null,
      provider_output_mutated: null,
      local_schema_result: null,
      provider_input_isolation: isolation,
      expected_data_injection_count: isolation.expected_data_injection_count,
      secret_leakage_count: 0,
      raw_output_redacted_due_to_secret_leakage: false,
      safe_error_code: null,
    };
    this.caseResult.provider_calls.push(call);
    await persistProgress(this.result, this.authorization);

    let response;
    try {
      response = await this.delegate.invoke(request);
    } catch (error) {
      call.safe_error_code = safeCode(error, "M2_STAGE_PROVIDER_FAILED");
      this.fatalState.code = "M2_E_R3_TRANSPORT_FAILURE_BEFORE_USABLE_RESPONSE";
      await persistProgress(this.result, this.authorization);
      throw error;
    }

    call.provider_completed = true;
    call.returned_model = response.returnedModel;
    call.returned_model_exact = response.returnedModel === this.contract.model;
    call.response_id = response.responseId;
    call.latency_ms = response.latencyMs;
    call.usage = {
      input_tokens: response.usage.inputTokens,
      cached_tokens: response.usage.cachedTokens,
      output_tokens: response.usage.outputTokens,
      reasoning_tokens: response.usage.reasoningTokens,
    };
    const rawHash = shaDiagnosticJson(response.output);
    const leakage = secretOccurrenceCount(response.output, this.apiKey);
    call.raw_output = leakage > 0 ? redactSecret(response.output, this.apiKey) : clone(response.output);
    call.raw_output_sha256 = rawHash;
    call.secret_leakage_count = leakage;
    call.raw_output_redacted_due_to_secret_leakage = leakage > 0;
    this.outputReferences.set(call.call_index, response.output);

    if (!call.returned_model_exact) {
      this.fatalState.code = "M2_E_R3_RETURNED_MODEL_MISMATCH";
      call.safe_error_code = this.fatalState.code;
      await persistProgress(this.result, this.authorization);
      throw new this.runtime.M2RuntimeError(this.fatalState.code);
    }
    if (leakage > 0) {
      this.fatalState.code = "M2_E_R3_SECRET_LEAKAGE";
      call.safe_error_code = this.fatalState.code;
      await persistProgress(this.result, this.authorization);
      throw new this.runtime.M2RuntimeError(this.fatalState.code);
    }
    await persistProgress(this.result, this.authorization);
    return response;
  }

  finalizeOutputHashes() {
    for (const call of this.caseResult.provider_calls) {
      const reference = this.outputReferences.get(call.call_index);
      if (!reference || call.raw_output_sha256 === null) continue;
      call.raw_output_sha256_after_processing = shaDiagnosticJson(reference);
      call.provider_output_mutated =
        call.raw_output_sha256 !== call.raw_output_sha256_after_processing;
    }
  }
}

function validationResult(operation) {
  try {
    operation();
    return { passed: true, safe_error_code: null };
  } catch (error) {
    return { passed: false, safe_error_code: safeCode(error) };
  }
}

function stageOutput(caseResult, stageId) {
  return caseResult.provider_calls.find((call) => call.stage_id === stageId)?.raw_output ?? null;
}

function serializeFakeRepository(repository) {
  return {
    actual_supabase_calls: repository.actualSupabaseCalls,
    events: clone(repository.events),
    requests: [...repository.requests.values()].map((item) => clone(item)),
    runs: [...repository.runs.values()].map((item) => clone(item)),
    stage_runs: [...repository.stageRuns.values()].map((item) => clone(item)),
    reports: [...repository.reports.values()].map((item) => clone(item)),
  };
}

function projectDecisionFacts(runtime, groundedBase, candidatePresence) {
  const projected = clone(groundedBase.decision_facts);
  projected.schema_version = "m2-p4-decision-facts-v2";
  projected.contact_state.proposed_message_present = candidatePresence;
  return runtime.requireContextualDecisionFactsV3({ decision_facts: projected });
}

function deriveCaseEvidence({
  runtime,
  catalog,
  diagnosticCase,
  caseResult,
  repository,
  finalResult,
  pipelineError,
}) {
  const input = assessmentInput(diagnosticCase);
  const definitions = new Map(catalog.definitions.map((item) => [item.stageId, item]));
  const raw = Object.fromEntries(
    ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"].map(
      (stageId) => [stageId, stageOutput(caseResult, stageId)],
    ),
  );
  const localSchemaResults = {};
  for (const [stageId, output] of Object.entries(raw)) {
    if (!output) continue;
    localSchemaResults[stageId] = {
      raw: validationResult(() => runtime.validateStageOutput(definitions.get(stageId), output)),
      grounded: null,
    };
  }

  let groundedBase = null;
  let rawBaseSourceIntegrity = null;
  let groundedBaseSourceIntegrity = null;
  let contextualIntegrity = null;
  if (raw["PB-01"]) {
    const baseInput = runtime.projectBaseProviderInputV1(input);
    rawBaseSourceIntegrity = validationResult(() =>
      runtime.validateBaseSourceIntegrityV1({
        input: baseInput,
        baseProviderRequest: baseInput,
        rawBaseOutput: raw["PB-01"],
      }),
    );
    try {
      groundedBase = runtime.groundBaseStructuredIntakeV2(baseInput, raw["PB-01"]);
      localSchemaResults["PB-01"].grounded = validationResult(() =>
        runtime.validateGroundedStageOutput(definitions.get("PB-01"), groundedBase),
      );
      groundedBaseSourceIntegrity = validationResult(() =>
        runtime.validateBaseSourceIntegrityV1({
          input: baseInput,
          groundedBaseOutput: groundedBase,
        }),
      );
      contextualIntegrity = validationResult(() =>
        runtime.validateContextualIntakeIntegrityV3(groundedBase),
      );
    } catch (error) {
      contextualIntegrity = { passed: false, safe_error_code: safeCode(error) };
    }
  }

  let candidateAnalysis = null;
  let candidateSafety = null;
  let candidateSourceIntegrity = null;
  let candidateGrounding = null;
  if (raw["PB-01C"]) {
    candidateSafety = raw["PB-01C"].candidate_safety_signals ?? null;
    candidateSourceIntegrity = validationResult(() =>
      runtime.validateCandidateSourceIntegrityV1({
        rawCandidateProviderOutput: raw["PB-01C"],
      }),
    );
    try {
      const grounded = runtime.groundCandidateAnalysisV1(raw["PB-01C"]);
      candidateAnalysis = grounded.candidate_analysis;
      candidateSafety = grounded.candidate_safety_result;
      candidateGrounding = { passed: true, safe_error_code: null };
    } catch (error) {
      candidateGrounding = { passed: false, safe_error_code: safeCode(error) };
    }
  }

  let aggregateSafety = null;
  let applicationEligibility = null;
  let decisionPolicy = null;
  let splitEnvelope = null;
  if (groundedBase) {
    try {
      const baseLegacyView = runtime.buildBaseStructuredIntakeLegacyViewV1(groundedBase);
      let candidateLane;
      if (input.optionalMessage === null || input.optionalMessage.trim() === "") {
        candidateLane = runtime.buildAbsentCandidateLaneV1();
      } else if (candidateAnalysis && candidateSafety) {
        candidateLane = runtime.buildAvailableCandidateLaneV1(candidateAnalysis, candidateSafety);
      } else if (candidateSafety) {
        candidateLane = runtime.buildAnalysisUnavailableSafetyAvailableCandidateLaneV1(candidateSafety);
      } else {
        candidateLane = runtime.buildSafetyUnavailableCandidateLaneV1();
      }
      splitEnvelope = runtime.buildSplitAnalysisEnvelopeV1({
        baseStructuredIntake: groundedBase,
        baseLegacyView,
        candidateLane,
      });
      if (raw["PB-02"]) {
        const deterministic = runtime.deterministicSafetyResult(input);
        const semanticSafety = splitEnvelope.candidate_safety_result
          ? runtime.projectCandidateSafetyDispositionV1(splitEnvelope.candidate_safety_result)
          : { classification: "normal_allowed", reason_codes: [], response_mode: "none" };
        const boundarySafety = runtime.evaluateCandidateBoundaryContactV1(
          splitEnvelope.base_structured_intake,
          splitEnvelope.candidate_safety_result,
        );
        aggregateSafety = runtime.aggregateSafetyV3(
          runtime.aggregateSafetyV3(deterministic, raw["PB-02"], semanticSafety),
          boundarySafety,
        );
        applicationEligibility = runtime.deriveRuntimeEligibilityV3(aggregateSafety);
      }
      const facts = projectDecisionFacts(
        runtime,
        groundedBase,
        splitEnvelope.candidate_envelope.presence,
      );
      decisionPolicy = runtime.buildContextualDecisionPolicyV3(facts);
    } catch {
      // Evidence remains nullable when a prior Stage or Integrity gate failed.
    }
  }

  const decisionPlan = raw["PB-04"] ?? finalResult?.report?.decisionPlan ?? null;
  let groundedReportContent = finalResult?.report?.content ?? null;
  if (!groundedReportContent && raw["PB-05"] && decisionPlan && groundedBase) {
    try {
      const facts = projectDecisionFacts(
        runtime,
        groundedBase,
        splitEnvelope?.candidate_envelope?.presence ?? Boolean(input.optionalMessage),
      );
      groundedReportContent = runtime.groundReportContentV3(facts, raw["PB-05"]);
      groundedReportContent = runtime.groundChangeConditionCommentaryV3(
        decisionPlan,
        groundedReportContent,
      );
    } catch {
      groundedReportContent = null;
    }
  }
  let semanticDisposition = null;
  if (raw["PB-06"] && decisionPlan && groundedReportContent) {
    try {
      semanticDisposition = runtime.evaluateSemanticFindingsV4({
        validationOutput: raw["PB-06"],
        decisionPlan,
        groundedReportContent,
      });
    } catch {
      semanticDisposition = null;
    }
  }
  const providerInputIsolationPassed =
    caseResult.rejected_provider_inputs.length === 0 &&
    caseResult.provider_calls.every(
      (call) => call.provider_input_isolation?.passed === true,
    );
  const evidence = {
    synthetic_input: clone(diagnosticCase.synthetic_input),
    expected_stage_path: clone(caseResult.expected_stage_path),
    actual_stage_path: caseResult.provider_calls.map((call) => call.stage_id),
    external_provider_call_count: caseResult.provider_calls.length,
    provider_input_isolation_passed: providerInputIsolationPassed,
    local_schema_results: localSchemaResults,
    raw_base_source_integrity_result: rawBaseSourceIntegrity,
    grounded_base_source_integrity_result: groundedBaseSourceIntegrity,
    contextual_integrity_result: contextualIntegrity,
    candidate_source_integrity_result: candidateSourceIntegrity,
    candidate_grounding_result: candidateGrounding,
    grounded_base: groundedBase,
    candidate_analysis: candidateAnalysis,
    candidate_safety: candidateSafety,
    aggregate_safety: aggregateSafety,
    eligibility: applicationEligibility,
    decision_policy_result: decisionPolicy,
    decision_plan: decisionPlan,
    grounded_report_content: groundedReportContent,
    pb_06_findings: raw["PB-06"]?.semantic_checks ?? null,
    semantic_disposition: semanticDisposition,
    final_result: finalResult,
    final_decision_card: finalResult?.decisionCard ?? null,
    safe_error_code: pipelineError ? safeCode(pipelineError) : null,
  };
  caseResult.actual_stage_path = evidence.actual_stage_path;
  caseResult.external_provider_call_count = evidence.external_provider_call_count;
  caseResult.requested_models = [
    ...new Set(caseResult.provider_calls.map((call) => call.requested_model)),
  ];
  caseResult.returned_models = [
    ...new Set(
      caseResult.provider_calls
        .map((call) => call.returned_model)
        .filter((value) => value !== null),
    ),
  ];
  caseResult.response_ids = caseResult.provider_calls
    .map((call) => call.response_id)
    .filter((value) => value !== null);
  caseResult.response_ids_unique =
    caseResult.response_ids.length === new Set(caseResult.response_ids).size;
  caseResult.latency_ms_total = caseResult.provider_calls.reduce(
    (total, call) => total + call.latency_ms,
    0,
  );
  caseResult.usage_totals = aggregateUsage(caseResult.provider_calls);
  caseResult.provider_input_isolation_passed = providerInputIsolationPassed;
  caseResult.provider_output_mutation_count = caseResult.provider_calls.filter(
    (call) => call.provider_output_mutated === true,
  ).length;
  caseResult.expected_data_injection_count =
    caseResult.rejected_provider_inputs.reduce(
      (total, item) =>
        total +
        item.provider_input_isolation.expected_data_injection_count +
        item.provider_input_isolation.routing_violation_count,
      0,
    ) +
    caseResult.provider_calls.reduce(
      (total, call) => total + call.expected_data_injection_count,
      0,
    );
  caseResult.secret_leakage_count = caseResult.provider_calls.reduce(
    (total, call) => total + call.secret_leakage_count,
    0,
  );
  caseResult.fake_stage_persistence_evidence = serializeFakeRepository(repository);
  caseResult.safe_error_code = evidence.safe_error_code;
  caseResult.evidence = evidence;
  for (const call of caseResult.provider_calls) {
    call.local_schema_result = localSchemaResults[call.stage_id] ?? null;
  }
}

function initializeCaseResult(diagnosticCase, contract) {
  return {
    case_id: diagnosticCase.case_id,
    title: diagnosticCase.title,
    synthetic_input: clone(diagnosticCase.synthetic_input),
    relationship: diagnosticCase.synthetic_input.relationship,
    requested_topics: clone(diagnosticCase.synthetic_input.requested_topics),
    optional_message_present:
      typeof diagnosticCase.synthetic_input.optional_message === "string" &&
      diagnosticCase.synthetic_input.optional_message.length > 0,
    expected_stage_path: clone(contract.expected_stage_paths[diagnosticCase.case_id]),
    actual_stage_path: [],
    external_provider_call_count: 0,
    requested_models: [],
    returned_models: [],
    response_ids: [],
    response_ids_unique: true,
    latency_ms_total: 0,
    usage_totals: {
      input_tokens: 0,
      cached_tokens: 0,
      output_tokens: 0,
      reasoning_tokens: 0,
    },
    provider_calls: [],
    rejected_provider_inputs: [],
    provider_input_isolation_passed: false,
    provider_output_mutation_count: 0,
    expected_data_injection_count: 0,
    secret_leakage_count: 0,
    fake_stage_persistence_evidence: null,
    safe_error_code: null,
    evidence: null,
    evaluation: null,
  };
}

async function runCase({
  runtime,
  catalog,
  delegate,
  contract,
  cases,
  qualityContract,
  result,
  authorization,
  diagnosticCase,
  apiKey,
  fatalState,
}) {
  const caseResult = initializeCaseResult(diagnosticCase, contract);
  result.cases.push(caseResult);
  const repository = new runtime.FakeAssessmentRepository();
  const transport = new CapturingTransport({
    delegate,
    runtime,
    contract,
    cases,
    qualityContract,
    result,
    authorization,
    caseResult,
    apiKey,
    fatalState,
  });
  const pipelineEvents = [];
  const application = new runtime.AssessmentApplication({
    repository,
    transport,
    model: contract.model,
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    observe: (event) => pipelineEvents.push(event),
    now: () => diagnosticCase.fixed_clock,
    uuid: deterministicUuidFactory(diagnosticCase.fixed_id_prefix),
  });
  let finalResult = null;
  let pipelineError = null;
  try {
    finalResult = await application.submit(
      assessmentInput(diagnosticCase),
      `${diagnosticCase.fixed_id_prefix}-idempotency-key`,
    );
  } catch (error) {
    pipelineError = error;
  }
  transport.finalizeOutputHashes();
  caseResult.pipeline_events = pipelineEvents;
  try {
    deriveCaseEvidence({
      runtime,
      catalog,
      diagnosticCase,
      caseResult,
      repository,
      finalResult,
      pipelineError,
    });
  } catch (error) {
    fatalState.code = "M2_E_R3_EVIDENCE_DERIVATION_FAILED";
    caseResult.actual_stage_path = caseResult.provider_calls.map(
      (call) => call.stage_id,
    );
    caseResult.external_provider_call_count = caseResult.provider_calls.length;
    caseResult.requested_models = [
      ...new Set(caseResult.provider_calls.map((call) => call.requested_model)),
    ];
    caseResult.returned_models = [
      ...new Set(
        caseResult.provider_calls
          .map((call) => call.returned_model)
          .filter((value) => value !== null),
      ),
    ];
    caseResult.response_ids = caseResult.provider_calls
      .map((call) => call.response_id)
      .filter((value) => value !== null);
    caseResult.response_ids_unique =
      caseResult.response_ids.length === new Set(caseResult.response_ids).size;
    caseResult.latency_ms_total = caseResult.provider_calls.reduce(
      (total, call) => total + call.latency_ms,
      0,
    );
    caseResult.usage_totals = aggregateUsage(caseResult.provider_calls);
    caseResult.provider_input_isolation_passed =
      caseResult.rejected_provider_inputs.length === 0 &&
      caseResult.provider_calls.every(
        (call) => call.provider_input_isolation?.passed === true,
      );
    caseResult.provider_output_mutation_count = caseResult.provider_calls.filter(
      (call) => call.provider_output_mutated === true,
    ).length;
    caseResult.expected_data_injection_count =
      caseResult.rejected_provider_inputs.reduce(
        (total, item) =>
          total +
          item.provider_input_isolation.expected_data_injection_count +
          item.provider_input_isolation.routing_violation_count,
        0,
      ) +
      caseResult.provider_calls.reduce(
        (total, call) => total + call.expected_data_injection_count,
        0,
      );
    caseResult.secret_leakage_count = caseResult.provider_calls.reduce(
      (total, call) => total + call.secret_leakage_count,
      0,
    );
    caseResult.fake_stage_persistence_evidence =
      serializeFakeRepository(repository);
    caseResult.safe_error_code = `${fatalState.code}:${safeCode(error)}`;
    caseResult.evidence = {
      synthetic_input: clone(diagnosticCase.synthetic_input),
      expected_stage_path: clone(caseResult.expected_stage_path),
      actual_stage_path: clone(caseResult.actual_stage_path),
      external_provider_call_count: caseResult.external_provider_call_count,
      provider_input_isolation_passed:
        caseResult.provider_input_isolation_passed,
      grounded_base: null,
      candidate_analysis: null,
      candidate_safety: null,
      aggregate_safety: null,
      eligibility: null,
      decision_policy_result: null,
      decision_plan: null,
      grounded_report_content: null,
      pb_06_findings: null,
      semantic_disposition: null,
      final_result: finalResult,
      final_decision_card: finalResult?.decisionCard ?? null,
      safe_error_code: caseResult.safe_error_code,
    };
  }
  await persistProgress(result, authorization);
}

async function createMarker(markerPath, contract, packageCommit, claimedAt) {
  const handle = await open(markerPath, "wx", 0o600);
  try {
    await handle.writeFile(
      `${JSON.stringify(
        {
          schema_version: "m2-p4-i3-r1-c1-r3-r2-e-r3-consumed-marker-v1",
          authorization_id: contract.authorization_id,
          package_commit: packageCommit,
          claimed_at: claimedAt,
          rerun_authorized: false,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  } finally {
    await handle.close();
  }
}

async function replaceDocumentationBlock(filePath, block) {
  const source = await readFile(filePath, "utf8");
  const expression = new RegExp(
    `<!-- ${documentationMarker}:BEGIN -->[\\s\\S]*?<!-- ${documentationMarker}:END -->`,
    "u",
  );
  assertCondition(expression.test(source), "M2_E_R3_DOCUMENTATION_MARKER_MISSING");
  await writeTextAtomic(filePath, source.replace(expression, block));
}

function buildCapabilities(contract, result) {
  return {
    schema_version: "m2-p4-i3-r1-c1-r3-r2-e-r3-capabilities-v1",
    task_id: contract.task_id,
    title: contract.title,
    status: result.status,
    baseline: contract.baseline,
    package_revision: contract.package_revision,
    package_baseline: contract.package_baseline,
    aborted_package_commit: contract.aborted_package_commit,
    aborted_package_status: contract.aborted_package_status,
    aborted_package_provider_calls: contract.aborted_package_provider_calls,
    aborted_package_marker_created: contract.aborted_package_marker_created,
    aborted_package_authorization_consumed:
      contract.aborted_package_authorization_consumed,
    replacement_reason: contract.replacement_reason,
    replacement_changes: contract.replacement_changes,
    product_cases_changed: contract.product_cases_changed,
    quality_doctrine_changed: contract.quality_doctrine_changed,
    provider_budget_changed: contract.provider_budget_changed,
    branch: contract.branch,
    exact_scope: "16/16",
    post_run_mutable_scope: "10/10",
    package_commit: result.package_commit,
    approved_cases: `${result.cases.length}/6`,
    expected_calls: 37,
    authorized_max_calls: 40,
    actual_calls: result.calls_actual,
    completed_calls: result.calls_completed,
    model: contract.model,
    catalog: contract.catalog,
    prompt_bundle: contract.prompt_bundle,
    schema_set: contract.schema_set,
    stage_topology: contract.stage_topology,
    provider_machine_gates_passed:
      result.evaluation?.provider_machine_gates_passed ?? false,
    product_outcome_machine_gates_passed:
      result.evaluation?.product_outcome_machine_gates_passed ?? false,
    product_owner_review_complete: false,
    provider_quality_established: false,
    candidate_ready_for_isolated_e2e: false,
    r4_ready: false,
    r4_authorized: false,
    c2_authorized: false,
    authorization_consumed: true,
    rerun_authorized: false,
    db_operations: 0,
    supabase_operations: result.supabase_operations,
    migration_applied: false,
    active_service_changed: false,
    active_runtime_activated: false,
    main_changed: false,
    machine_verdict: result.evaluation?.verdict ?? "FAIL",
    evaluator_self_tests: result.evaluator_self_tests,
    active_loader_return_shape_self_tests:
      result.active_loader_return_shape_self_tests,
    metrics: result.evaluation?.metrics ?? {},
  };
}

async function finalizeArtifacts({ contract, cases, result, authorization }) {
  const completedAt = new Date().toISOString();
  result.completed_at = completedAt;
  authorization.completed_at = completedAt;
  authorization.completion_state = result.status;
  const ownerReview = buildProductOwnerReview({
    ...result,
    cases: cases.map(
      (diagnosticCase) =>
        result.cases.find((item) => item.case_id === diagnosticCase.case_id) ?? {
          case_id: diagnosticCase.case_id,
        },
    ),
  });
  await writeJsonAtomic(paths.authorization, authorization);
  await writeJsonAtomic(paths.results, result);
  await writeTextAtomic(paths.summary, renderDiagnosticSummary(result));
  await writeTextAtomic(paths.productReview, renderProductReview(result));
  await writeJsonAtomic(paths.productOwnerReview, ownerReview);
  await writeJsonAtomic(paths.capabilities, buildCapabilities(contract, result));
  await writeTextAtomic(paths.review, renderReviewDocument(result));
  const statusBlock = renderDocumentationStatusBlock(result);
  await replaceDocumentationBlock(paths.currentFocus, statusBlock);
  await replaceDocumentationBlock(paths.wbs, statusBlock);
  await replaceDocumentationBlock(paths.handoff, statusBlock);
}

async function main() {
  const [contract, cases, qualityContract, authorization, initialResults] =
    await Promise.all([
      readJson(paths.contract),
      readJson(paths.cases),
      readJson(paths.quality),
      readJson(paths.authorization),
      readJson(paths.results),
    ]);
  const invocation = parseArguments(contract);
  const markerPath = path.join(repositoryRoot, contract.one_time_marker);
  assertPackagePreflight({
    contract,
    cases,
    qualityContract,
    authorization,
    initialResults,
    invocation,
    markerPath,
  });
  const catalogManifest = JSON.parse(
    readFileSync(path.join(repositoryRoot, contract.catalog_path), "utf8"),
  );
  assertCatalogAssets(contract, catalogManifest);
  const activeCatalogManifest = JSON.parse(
    readFileSync(
      path.join(repositoryRoot, contract.active_catalog_path),
      "utf8",
    ),
  );
  assertActiveCatalogManifest(contract, activeCatalogManifest);
  const selfTests = runEvaluatorSelfTests();
  assertCondition(selfTests.passed === 20 && selfTests.total === 20, "M2_E_R3_EVALUATOR_SELF_TEST_FAILED");
  const activeLoaderSelfTests = runActiveLoaderReturnShapeSelfTests(
    contract.active_loader_identity,
  );
  assertCondition(
    activeLoaderSelfTests.passed === 7 && activeLoaderSelfTests.total === 7,
    "M2_E_R3_ACTIVE_LOADER_SELF_TEST_FAILED",
  );

  const runtime = await loadRuntimeModules();
  const [catalog, activeCatalog] = await Promise.all([
    runtime.loadM2P4DirectionalGuidanceRuntimeStageCatalog(),
    runtime.loadM2P4ProductQualityRuntimeStageCatalog(),
  ]);
  assertCondition(catalog.catalogVersion === contract.catalog, "M2_E_R3_RUNTIME_CATALOG_MISMATCH");
  assertCondition(catalog.promptBundleVersion === contract.prompt_bundle, "M2_E_R3_RUNTIME_PROMPT_MISMATCH");
  assertCondition(catalog.schemaSetVersion === contract.schema_set, "M2_E_R3_RUNTIME_SCHEMA_MISMATCH");
  assertCondition(catalog.stageTopologyVersion === contract.stage_topology, "M2_E_R3_RUNTIME_TOPOLOGY_MISMATCH");
  assertCondition(
    validateActiveLoaderIdentity(contract.active_loader_identity, activeCatalog)
      .passed,
    "M2_E_R3_ACTIVE_LOADER_IDENTITY_MISMATCH",
  );

  const { apiKey } = loadAuthorizedEnvironment(contract);
  const delegate = new runtime.OpenAiResponsesTransport(apiKey);
  configureZeroRetries(delegate);

  const claimedAt = new Date().toISOString();
  await createMarker(markerPath, contract, invocation.packageCommit, claimedAt);
  authorization.consumed = true;
  authorization.execution_claimed_at = claimedAt;
  authorization.package_commit = invocation.packageCommit;
  const result = {
    ...initialResults,
    status: "running",
    package_commit: invocation.packageCommit,
    execution_claimed_at: claimedAt,
    authorization_consumed: true,
    evaluator_self_tests: selfTests,
    active_loader_return_shape_self_tests: activeLoaderSelfTests,
    cases: [],
  };
  await persistProgress(result, authorization);

  const fatalState = { code: null };
  for (const diagnosticCase of cases) {
    if (fatalState.code !== null) break;
    await runCase({
      runtime,
      catalog,
      delegate,
      contract,
      cases,
      qualityContract,
      result,
      authorization,
      diagnosticCase,
      apiKey,
      fatalState,
    });
  }
  result.execution_stop_code = fatalState.code;
  recomputeTotals(result, authorization);

  try {
    result.evaluation = evaluateDiagnostic(contract, qualityContract, result);
    result.status =
      result.evaluation.verdict === "PASS"
        ? contract.pass_status
        : contract.fail_status;
  } catch (error) {
    result.status = contract.evaluation_blocked_status;
    result.evaluation = {
      evaluator_version: qualityContract.evaluator_version,
      verdict: "EVALUATION_BLOCKED",
      safe_error_code: safeCode(error, "M2_E_R3_EVALUATOR_DEFECT"),
      provider_machine_gates_passed: false,
      product_outcome_machine_gates_passed: false,
      metrics: {},
      hard_failures: [],
      product_outcome_failures: [],
      conditional_findings: [],
      flexible_findings: [],
    };
  }
  result.provider_machine_gates_passed =
    result.evaluation.provider_machine_gates_passed === true;
  result.product_outcome_machine_gates_passed =
    result.evaluation.product_outcome_machine_gates_passed === true;
  result.product_owner_review_complete = false;
  result.provider_quality_established = false;
  result.candidate_ready_for_isolated_e2e = false;
  result.r4_ready = false;
  result.r4_authorized = false;
  result.c2_authorized = false;
  await finalizeArtifacts({ contract, cases, result, authorization });

  process.stdout.write(
    [
      `${contract.task_id} PROVIDER_PRODUCT_DIAGNOSTIC: ${result.evaluation.verdict}`,
      `status: ${result.status}`,
      `cases: ${result.cases.length}/6`,
      `calls expected / maximum / actual: 37 / 40 / ${result.calls_actual}`,
      `completed: ${result.calls_completed}/37`,
      `model exact: ${result.evaluation.metrics?.returned_model_exact?.passed ?? 0}/${result.evaluation.metrics?.returned_model_exact?.total ?? 37}`,
      `retry / repair / fallback / parallel: 0 / 0 / 0 / 0`,
      `DB / Supabase: 0 / ${result.supabase_operations}`,
      `Product Owner review: pending`,
      "",
    ].join("\n"),
  );
}

main().catch((error) => {
  process.stderr.write(`${safeCode(error)}\n`);
  process.exitCode = 1;
});
