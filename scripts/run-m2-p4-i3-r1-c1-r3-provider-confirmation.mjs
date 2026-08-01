import { execFileSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  aggregateUsage,
  caseFixtureOracleReferences,
  evaluateDiagnostic,
  evaluateProviderCall,
  forbiddenBookkeepingPaths,
  probabilityConfidencePaths,
  rawPiiValues,
  renderDiagnosticSummary,
  secretLeakageValues,
  shaDiagnosticJson,
} from "./lib/m2-p4-i3-r1-c1-r3-provider-evaluator-v1.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const artifactRoot = path.join(
  repositoryRoot,
  "evals",
  "runtime",
  "m2-p4-i3-r1-c1-r3",
);
const contractPath = path.join(artifactRoot, "diagnostic-contract-v1.json");
const casesPath = path.join(artifactRoot, "diagnostic-cases-v1.json");
const qualityPath = path.join(artifactRoot, "quality-contract-v1.json");
const authorizationPath = path.join(artifactRoot, "authorization-v1.json");
const capabilitiesPath = path.join(artifactRoot, "capabilities-v1.json");
const resultsPath = path.join(artifactRoot, "diagnostic-results-v1.json");
const summaryPath = path.join(artifactRoot, "diagnostic-summary-v1.md");
const verifierPath = path.join(
  repositoryRoot,
  "scripts",
  "verify-m2-p4-i3-r1-c1-r3-provider-confirmation.mjs",
);

let runtimeModulesPromise;

function loadRuntimeModules() {
  if (runtimeModulesPromise) return runtimeModulesPromise;
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
  runtimeModulesPromise = (async () => {
    const { OpenAiResponsesTransport } = await import(
      "../lib/assessment/runtime/openai-transport.ts"
    );
    const {
      loadM2P4PracticalReasonConsistencyRuntimeStageCatalog,
      loadM2P4ProductQualityRuntimeStageCatalog,
    } = await import("../lib/assessment/runtime/schema-catalog.ts");
    const { validateGroundedStageOutput, validateStageOutput } = await import(
      "../lib/assessment/runtime/validation.ts"
    );
    const { groundStructuredIntakeV5 } = await import(
      "../lib/assessment/runtime/structured-intake-grounding-v5.ts"
    );
    const {
      collectWritingContextIntegrityViolationsV2,
      validateWritingContextIntegrityV2,
    } = await import(
      "../lib/assessment/runtime/writing-context-integrity-v2.ts"
    );
    const { validateContextualIntakeIntegrityV3 } = await import(
      "../lib/assessment/runtime/contextual-integrity-v3.ts"
    );
    return {
      OpenAiResponsesTransport,
      loadM2P4PracticalReasonConsistencyRuntimeStageCatalog,
      loadM2P4ProductQualityRuntimeStageCatalog,
      validateGroundedStageOutput,
      validateStageOutput,
      groundStructuredIntakeV5,
      collectWritingContextIntegrityViolationsV2,
      validateWritingContextIntegrityV2,
      validateContextualIntakeIntegrityV3,
    };
  })();
  return runtimeModulesPromise;
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

async function json(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function fail(code, evaluatorDefect = false) {
  const error = new Error(code);
  error.safeCode = code;
  error.evaluatorDefect = evaluatorDefect;
  throw error;
}

function safeStopCode(error) {
  if (typeof error?.safeCode === "string") return error.safeCode;
  if (
    typeof error?.message === "string" &&
    /^M2_[A-Z0-9_]+$/u.test(error.message)
  ) {
    return error.message;
  }
  return "M2_R3_EXECUTION_STOPPED";
}

function parseArguments(contract) {
  const args = process.argv.slice(2);
  if (
    args.length !== 4 ||
    args[0] !== "--package-commit" ||
    !/^[0-9a-f]{40}$/u.test(args[1] ?? "") ||
    args[2] !== "--confirm" ||
    args[3] !== contract.confirmation_phrase
  ) {
    fail("M2_R3_ARGUMENT_INVALID");
  }
  return {
    packageCommit: args[1],
    confirmationPhrase: args[3],
  };
}

function normalizedPaths(value) {
  return value
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "en"));
}

function sameLiteralPaths(actual, expected) {
  const sortedExpected = [...expected].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  return (
    new Set(actual).size === actual.length &&
    JSON.stringify(actual) === JSON.stringify(sortedExpected)
  );
}

function loadAuthorizedEnvironment(contract) {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
    try {
      process.loadEnvFile(path.join(repositoryRoot, ".env.local"));
    } catch {
      fail("M2_R3_ENVIRONMENT_UNAVAILABLE");
    }
  }
  if (!process.env.OPENAI_API_KEY) fail("M2_R3_OPENAI_API_KEY_MISSING");
  if (process.env.OPENAI_MODEL !== contract.model) {
    fail("M2_R3_MODEL_NOT_AUTHORIZED");
  }
  return {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
  };
}

function assessmentInput(diagnosticCase) {
  return structuredClone(diagnosticCase.synthetic_input);
}

function providerInput(diagnosticCase) {
  const input = diagnosticCase.synthetic_input;
  return {
    current_situation: input.currentSituation,
    optional_message: input.optionalMessage,
    relationship: input.relationship,
    requested_topics: input.requestedTopics,
  };
}

function stageRequest(definition, model, input) {
  if (
    definition.stageId !== "PB-01" ||
    definition.promptVersion !== "v7.0.0" ||
    definition.schemaVersion !== "pipeline-schema-v5.0.0" ||
    definition.groundedSchemaVersion !== "pipeline-schema-v4.0.0"
  ) {
    fail("M2_R3_PB01_DEFINITION_INVALID");
  }
  return {
    stageId: "PB-01",
    model,
    developerPrompt: definition.developerPrompt,
    promptVersion: definition.promptVersion,
    promptHash: definition.promptHash,
    schemaName: definition.schemaName,
    schemaVersion: definition.schemaVersion,
    schemaHash: definition.schemaHash,
    outputSchema: definition.outputSchema,
    input,
  };
}

function emptyUsage() {
  return {
    input_tokens: 0,
    cached_tokens: 0,
    output_tokens: 0,
    reasoning_tokens: 0,
  };
}

function initializeCall(diagnosticCase, index, model) {
  return {
    case_id: diagnosticCase.case_id,
    source_case_reference: diagnosticCase.source_case_reference,
    call_index: index + 1,
    synthetic_input: structuredClone(diagnosticCase.synthetic_input),
    focus_tags: structuredClone(diagnosticCase.focus_tags),
    provider_completion: "started",
    provider_completed: false,
    requested_model: model,
    returned_model: null,
    response_id: null,
    latency_ms: 0,
    usage: emptyUsage(),
    raw_json_parse: false,
    raw_output_sha256: null,
    raw_output_sha256_after_processing: null,
    provider_output_mutated: false,
    raw_output: null,
    raw_schema_passed: false,
    forbidden_bookkeeping_count: null,
    probability_confidence_field_count: null,
    raw_pii_copied_count: null,
    case_fixture_oracle_reference_count: null,
    grounded_output_sha256: null,
    grounded_output: null,
    grounded_schema_passed: false,
    writing_context_integrity_v2_passed: false,
    integrity_violations: [],
    contextual_intake_integrity_passed: false,
    contextual_integrity_error_code: null,
    raw_semantic_assertions: [],
    grounded_semantic_assertions: [],
    operational_assertions: [],
    decision_facts_adjudication: null,
    ownership_results: null,
    boundary_results: null,
    candidate_presence_results: null,
    candidate_style_results: null,
    candidate_intent_results: null,
    relationship_limit_results: null,
    privacy_repeat_injection_results: null,
    application_grounding_results: null,
    targeted_correction_results: null,
    normal_regression_control_results: null,
    principal_quoted_ownership_results: null,
    practical_reason_consistency_results: null,
    returned_model_results: null,
    provider_output_immutability_results: null,
    hard_failures: [],
    soft_assertions: [],
    soft_findings: [],
    safe_error_code: null,
    secret_leakage_count: 0,
  };
}

function applyCallEvaluation(call, evaluation) {
  call.evaluation = evaluation;
  for (const property of [
    "raw_semantic_assertions",
    "grounded_semantic_assertions",
    "operational_assertions",
    "decision_facts_adjudication",
    "ownership_results",
    "boundary_results",
    "candidate_presence_results",
    "candidate_style_results",
    "candidate_intent_results",
    "relationship_limit_results",
    "privacy_repeat_injection_results",
    "application_grounding_results",
    "targeted_correction_results",
    "normal_regression_control_results",
    "principal_quoted_ownership_results",
    "practical_reason_consistency_results",
    "returned_model_results",
    "provider_output_immutability_results",
    "hard_failures",
    "soft_assertions",
    "soft_findings",
  ]) {
    call[property] = evaluation[property];
  }
  call.forbidden_bookkeeping_count =
    evaluation.forbidden_bookkeeping_paths.length;
  call.probability_confidence_field_count =
    evaluation.probability_confidence_paths.length;
  call.raw_pii_copied_count = evaluation.raw_pii_count;
  call.case_fixture_oracle_reference_count =
    evaluation.case_fixture_oracle_reference_count;
}

function assertExecutionPreflight({
  contract,
  caseBundle,
  qualityContract,
  authorization,
  capabilities,
  initialResults,
  markerPath,
  invocation,
}) {
  if (
    invocation.confirmationPhrase !== contract.confirmation_phrase ||
    authorization.authorization_id !== contract.authorization_id ||
    authorization.confirmation_phrase !== contract.confirmation_phrase ||
    authorization.model !== contract.model ||
    authorization.stage !== "PB-01 v7 only" ||
    authorization.authorized_calls !== contract.authorized_calls
  ) {
    fail("M2_R3_AUTHORIZATION_MISMATCH");
  }
  if (
    authorization.consumed !== false ||
    authorization.rerun_authorized !== false ||
    authorization.actual_calls !== 0 ||
    authorization.completion_state !== "not_executed"
  ) {
    fail("M2_R3_AUTHORIZATION_CONSUMED");
  }
  if (
    caseBundle.length !== 8 ||
    qualityContract.case_count !== 8 ||
    qualityContract.cases.length !== 8 ||
    contract.authorized_calls !== 8
  ) {
    fail("M2_R3_CASE_COUNT_INVALID");
  }
  if (
    contract.model !== "gpt-5.6-luna" ||
    contract.stage !== "PB-01" ||
    contract.catalog !== "runtime-stage-catalog-v8.0.0" ||
    contract.prompt !== "pb-01-structure-v7" ||
    contract.prompt_version !== "v7.0.0" ||
    contract.prompt_bundle !== "prompt-bundle-runtime-v8.0.0" ||
    contract.provider_schema !== "pipeline-schema-v5.0.0" ||
    contract.grounded_schema !== "pipeline-schema-v4.0.0" ||
    contract.runtime_schema_set !== "pipeline-schema-runtime-v3.2.0"
  ) {
    fail("M2_R3_CONTRACT_INVALID");
  }
  if (
    initialResults.status !== "not_executed" ||
    initialResults.calls.length !== 0 ||
    initialResults.authorization_consumed !== false ||
    capabilities.status !== "provider_final_confirmation_package_ready" ||
    capabilities.actual_calls !== 0 ||
    capabilities.provider_quality_established !== false ||
    capabilities.candidate_ready_for_isolated_e2e !== false ||
    capabilities.c2_authorized !== false
  ) {
    fail("M2_R3_PACKAGE_STATE_INVALID");
  }

  const branch = git(["branch", "--show-current"]).trim();
  const head = git(["rev-parse", "HEAD"]).trim();
  const parent = git(["rev-parse", "HEAD^"]).trim();
  const upstream = git(["rev-parse", "@{u}"]).trim();
  const main = git(["rev-parse", "main"]).trim();
  const originMain = git(["rev-parse", "origin/main"]).trim();
  const subject = git(["log", "-1", "--format=%s"]).trim();
  const commitCount = Number(
    git(["rev-list", "--count", contract.baseline + "..HEAD"]).trim(),
  );
  const status = git([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);
  const stash = git(["stash", "list"]);
  const diffCheck = git(["diff", "--check", contract.baseline, "HEAD", "--"]);
  const taskPaths = normalizedPaths(
    git(["diff", "--name-only", contract.baseline, "HEAD", "--"]),
  );
  const gitDirectory = path.resolve(
    repositoryRoot,
    git(["rev-parse", "--git-dir"]).trim(),
  );
  if (branch !== contract.branch) fail("M2_R3_BRANCH_MISMATCH");
  if (
    invocation.packageCommit !== head ||
    parent !== contract.baseline ||
    commitCount !== 1 ||
    upstream !== head ||
    subject !== contract.package_commit_subject
  ) {
    fail("M2_R3_PACKAGE_COMMIT_MISMATCH");
  }
  if (
    main !== contract.main_baseline ||
    originMain !== contract.main_baseline ||
    main !== originMain
  ) {
    fail("M2_R3_MAIN_CHANGED");
  }
  if (status !== "") fail("M2_R3_WORKTREE_NOT_CLEAN");
  if (stash !== "") fail("M2_R3_STASH_NOT_EMPTY");
  if (diffCheck !== "") fail("M2_R3_DIFF_CHECK_FAILED");
  if (!sameLiteralPaths(taskPaths, contract.exact_mutation_paths)) {
    fail("M2_R3_SCOPE_MISMATCH");
  }
  if (gitDirectory !== path.join(repositoryRoot, ".git")) {
    fail("M2_R3_GIT_DIRECTORY_UNEXPECTED");
  }
  if (
    markerPath !== path.join(gitDirectory, path.basename(contract.one_time_marker))
  ) {
    fail("M2_R3_MARKER_PATH_INVALID");
  }
  execFileSync(process.execPath, [verifierPath], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return { branch, head };
}

async function persistProgress(result, contract, qualityContract) {
  result.calls_actual = result.calls.length;
  result.calls_completed = result.calls.filter(
    (call) => call.provider_completed === true,
  ).length;
  result.provider_output_mutation_count = result.calls.filter(
    (call) => call.provider_output_mutated === true,
  ).length;
  result.usage_totals = aggregateUsage(result.calls);
  result.evaluation = evaluateDiagnostic(contract, qualityContract, result);
  await writeJson(resultsPath, result);
}

async function assertRuntimeCandidate(runtime, contract, caseBundle, model) {
  const candidate =
    await runtime.loadM2P4PracticalReasonConsistencyRuntimeStageCatalog();
  const active = await runtime.loadM2P4ProductQualityRuntimeStageCatalog();
  if (
    candidate.promptBundleVersion !== contract.prompt_bundle ||
    candidate.schemaSetVersion !== contract.runtime_schema_set
  ) {
    fail("M2_R3_CANDIDATE_CATALOG_INVALID");
  }
  if (
    active.promptBundleVersion !== contract.active_prompt_bundle ||
    active.schemaSetVersion !== contract.active_schema_set
  ) {
    fail("M2_R3_ACTIVE_RUNTIME_CHANGED");
  }
  const definition = candidate.definitions.find(
    (item) => item.stageId === "PB-01",
  );
  if (!definition) fail("M2_R3_PB01_DEFINITION_MISSING");
  stageRequest(definition, model, providerInput(caseBundle[0]));
  return definition;
}

async function runProviderCalls({
  apiKey,
  model,
  contract,
  caseBundle,
  qualityContract,
  result,
  beforeFirstProviderCall,
}) {
  const runtime = await loadRuntimeModules();
  const definition = await assertRuntimeCandidate(
    runtime,
    contract,
    caseBundle,
    model,
  );
  const transport = new runtime.OpenAiResponsesTransport(apiKey);
  if (!transport.client || typeof transport.client.maxRetries !== "number") {
    fail("M2_R3_RETRY_CONTROL_UNAVAILABLE");
  }
  transport.client.maxRetries = 0;
  if (transport.client.maxRetries !== 0) fail("M2_R3_RETRY_NOT_DISABLED");

  let providerCallCount = 0;
  for (const [index, diagnosticCase] of caseBundle.entries()) {
    if (providerCallCount >= contract.authorized_calls) {
      fail("M2_R3_CALL_CAP_REACHED");
    }
    if (index === 0) await beforeFirstProviderCall();
    providerCallCount += 1;
    const call = initializeCall(diagnosticCase, index, model);
    result.calls.push(call);
    const qualityCase = qualityContract.cases.find(
      (item) => item.case_id === diagnosticCase.case_id,
    );
    if (!qualityCase) fail("M2_R3_QUALITY_CASE_MISSING", true);

    let step = "provider";
    try {
      const response = await transport.invoke(
        stageRequest(definition, model, providerInput(diagnosticCase)),
      );
      call.provider_completion = "completed";
      call.provider_completed = true;
      call.returned_model = response.returnedModel;
      call.response_id = response.responseId;
      call.latency_ms = response.latencyMs;
      call.usage = {
        input_tokens: response.usage.inputTokens,
        cached_tokens: response.usage.cachedTokens,
        output_tokens: response.usage.outputTokens,
        reasoning_tokens: response.usage.reasoningTokens,
      };
      call.raw_json_parse =
        typeof response.output === "object" &&
        response.output !== null &&
        !Array.isArray(response.output);
      call.raw_output = response.output;
      call.raw_output_sha256 = shaDiagnosticJson(response.output);

      step = "raw_schema";
      runtime.validateStageOutput(definition, response.output);
      call.raw_schema_passed = true;

      step = "grounding";
      const grounded = runtime.groundStructuredIntakeV5(
        assessmentInput(diagnosticCase),
        response.output,
      );
      call.grounded_output = grounded;
      call.grounded_output_sha256 = shaDiagnosticJson(grounded);

      step = "grounded_schema";
      runtime.validateGroundedStageOutput(definition, grounded);
      call.grounded_schema_passed = true;

      step = "writing_context_integrity";
      call.integrity_violations =
        runtime.collectWritingContextIntegrityViolationsV2(
          assessmentInput(diagnosticCase),
          grounded,
        );
      runtime.validateWritingContextIntegrityV2(
        assessmentInput(diagnosticCase),
        grounded,
      );
      call.writing_context_integrity_v2_passed = true;

      step = "contextual_integrity";
      runtime.validateContextualIntakeIntegrityV3(grounded);
      call.contextual_intake_integrity_passed = true;
    } catch (error) {
      call.safe_error_code = safeStopCode(error);
      call.provider_completion =
        step === "provider" ? "provider_failed" : step + "_failed";
      if (step === "contextual_integrity") {
        call.contextual_integrity_error_code = call.safe_error_code;
      }
    }

    const writingSignals = call.raw_output?.writing_signals;
    call.forbidden_bookkeeping_count = forbiddenBookkeepingPaths(
      writingSignals,
      contract.forbidden_writing_signal_keys,
    ).length;
    call.probability_confidence_field_count =
      probabilityConfidencePaths(writingSignals).length;
    call.raw_pii_copied_count = rawPiiValues(writingSignals).length;
    call.case_fixture_oracle_reference_count =
      caseFixtureOracleReferences(writingSignals).length;
    call.secret_leakage_count = secretLeakageValues({
      raw_output: call.raw_output,
      grounded_output: call.grounded_output,
    }).length;
    if (call.raw_output !== null) {
      call.raw_output_sha256_after_processing = shaDiagnosticJson(
        call.raw_output,
      );
      call.provider_output_mutated =
        call.raw_output_sha256 !== call.raw_output_sha256_after_processing;
    }

    let evaluation;
    try {
      evaluation = evaluateProviderCall({ call, contract, qualityCase });
    } catch {
      call.safe_error_code = "M2_R3_EVALUATOR_DEFECT";
      call.hard_failures = ["M2_R3_EVALUATOR_DEFECT"];
      await persistProgress(result, contract, qualityContract);
      fail("M2_R3_EVALUATOR_DEFECT", true);
    }
    applyCallEvaluation(call, evaluation);
    const finalRawHash =
      call.raw_output === null ? null : shaDiagnosticJson(call.raw_output);
    if (
      finalRawHash !== call.raw_output_sha256_after_processing ||
      call.provider_output_mutated
    ) {
      call.provider_output_mutated = true;
      call.hard_failures = sortedUnique([
        ...call.hard_failures,
        call.case_id + "-PROVIDER-OUTPUT-IMMUTABLE",
      ]);
    }
    await persistProgress(result, contract, qualityContract);
  }
  if (providerCallCount !== contract.authorized_calls) {
    fail("M2_R3_CALL_COUNT_INVALID");
  }
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

async function finalizeAttempt({
  result,
  contract,
  qualityContract,
  initialCapabilities,
  authorization,
  preflight,
  executionClaimedAt,
  fatalError,
}) {
  result.completed_at = new Date().toISOString();
  result.calls_actual = result.calls.length;
  result.calls_completed = result.calls.filter(
    (call) => call.provider_completed === true,
  ).length;
  result.provider_output_mutation_count = result.calls.filter(
    (call) => call.provider_output_mutated === true,
  ).length;
  result.usage_totals = aggregateUsage(result.calls);
  result.authorization_consumed = true;
  result.rerun_authorized = false;
  result.provider_quality_established = false;
  result.provider_quality_scope = contract.provider_quality_scope;
  result.candidate_ready_for_isolated_e2e = false;
  result.c2_eligible = false;
  result.c2_authorized = false;
  result.safe_stop_code = fatalError ? safeStopCode(fatalError) : null;
  result.status = fatalError?.evaluatorDefect
    ? "evaluation_blocked_pending_human_chatgpt_review"
    : "provider_final_confirmation_failed_pending_human_chatgpt_review";
  result.evaluation = evaluateDiagnostic(contract, qualityContract, result);
  if (!fatalError && result.evaluation.verdict === "PASS") {
    result.status =
      "provider_final_confirmation_passed_pending_human_chatgpt_review";
    result.provider_quality_established = true;
    result.candidate_ready_for_isolated_e2e = true;
    result.evaluation = evaluateDiagnostic(contract, qualityContract, result);
  }

  const finalAuthorization = {
    ...authorization,
    consumed: true,
    rerun_authorized: false,
    execution_claimed_at: executionClaimedAt,
    completed_at: result.completed_at,
    package_commit: preflight.head,
    actual_calls: result.calls_actual,
    completed_calls: result.calls_completed,
    completion_state: result.status,
  };
  await writeJson(authorizationPath, finalAuthorization);
  await writeJson(resultsPath, result);
  await writeFile(summaryPath, renderDiagnosticSummary(result), "utf8");
  await writeJson(capabilitiesPath, {
    ...initialCapabilities,
    status: result.status,
    actual_calls: result.calls_actual,
    completed_calls: result.calls_completed,
    authorization_consumed: true,
    rerun_authorized: false,
    package_commit: preflight.head,
    final_confirmation_verdict: result.evaluation.verdict,
    cases_passed:
      String(result.evaluation.case_pass_count) +
      "/" +
      String(contract.authorized_calls),
    provider_quality_established: result.provider_quality_established,
    provider_quality_scope: contract.provider_quality_scope,
    candidate_ready_for_isolated_e2e:
      result.candidate_ready_for_isolated_e2e,
    metrics: result.evaluation.metrics,
    correction_gates: result.evaluation.correction_gates,
    principal_r3_08_quoted_ownership:
      result.evaluation.principal_r3_08_quoted_ownership,
    usage_totals: result.usage_totals,
    c2_eligible: false,
    c2_authorized: false,
    next_candidate: "M2-P4-I3-R1-C1-R4 Isolated Candidate Runtime E2E",
    next_candidate_authorized: false,
    next_step: "Human / ChatGPT review",
    active_runtime_changed: false,
    main_changed: false,
  });
}

async function main() {
  const contract = await json(contractPath);
  const invocation = parseArguments(contract);
  const caseBundle = await json(casesPath);
  const qualityContract = await json(qualityPath);
  const authorization = await json(authorizationPath);
  const initialCapabilities = await json(capabilitiesPath);
  const initialResults = await json(resultsPath);
  const markerPath = path.join(
    repositoryRoot,
    ".git",
    path.basename(contract.one_time_marker),
  );
  if (await exists(markerPath)) fail("M2_R3_ONE_TIME_MARKER_CONSUMED");
  const preflight = assertExecutionPreflight({
    contract,
    caseBundle,
    qualityContract,
    authorization,
    capabilities: initialCapabilities,
    initialResults,
    markerPath,
    invocation,
  });
  const { apiKey, model } = loadAuthorizedEnvironment(contract);
  const result = {
    ...initialResults,
    status: "running",
    started_at: new Date().toISOString(),
    completed_at: null,
    package_commit: preflight.head,
    requested_model: model,
    calls_actual: 0,
    calls_completed: 0,
    authorization_consumed: false,
    calls: [],
  };
  let executionClaimed = false;
  let executionClaimedAt = null;
  const beforeFirstProviderCall = async () => {
    if (executionClaimed) fail("M2_R3_EXECUTION_ALREADY_CLAIMED");
    executionClaimedAt = new Date().toISOString();
    await writeFile(
      markerPath,
      JSON.stringify(
        {
          schema_version: "m2-p4-i3-r1-c1-r3-consumed-v1",
          task_id: contract.task_id,
          authorization_id: contract.authorization_id,
          confirmation_phrase: contract.confirmation_phrase,
          package_commit: preflight.head,
          branch: preflight.branch,
          execution_claimed_at: executionClaimedAt,
          authorized_calls: contract.authorized_calls,
          rerun_authorized: false,
          secrets_saved: false,
        },
        null,
        2,
      ) + "\n",
      { encoding: "utf8", flag: "wx" },
    );
    executionClaimed = true;
    result.authorization_consumed = true;
    await writeJson(authorizationPath, {
      ...authorization,
      consumed: true,
      rerun_authorized: false,
      execution_claimed_at: executionClaimedAt,
      package_commit: preflight.head,
      completion_state: "running",
    });
  };

  let fatalError = null;
  try {
    await runProviderCalls({
      apiKey,
      model,
      contract,
      caseBundle,
      qualityContract,
      result,
      beforeFirstProviderCall,
    });
  } catch (error) {
    fatalError = error;
  }

  if (!executionClaimed) {
    if (fatalError) throw fatalError;
    fail("M2_R3_EXECUTION_NOT_CLAIMED");
  }
  await finalizeAttempt({
    result,
    contract,
    qualityContract,
    initialCapabilities,
    authorization,
    preflight,
    executionClaimedAt,
    fatalError,
  });
  if (fatalError) {
    console.error(
      "M2_P4_I3_R1_C1_R3_PROVIDER_CONFIRMATION_STOPPED: " +
        safeStopCode(fatalError),
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    "M2_P4_I3_R1_C1_R3_PROVIDER_CONFIRMATION: " +
      result.evaluation.verdict,
  );
  console.log(
    "provider_calls: " +
      result.calls_actual +
      "/" +
      contract.authorized_calls,
  );
  console.log(
    "cases_passed: " +
      result.evaluation.case_pass_count +
      "/" +
      contract.authorized_calls,
  );
  console.log(
    "principal_quoted_ownership: " +
      result.evaluation.principal_r3_08_quoted_ownership,
  );
  console.log("rerun_authorized: false");
  console.log(
    "provider_quality_established: " + result.provider_quality_established,
  );
  console.log(
    "candidate_ready_for_isolated_e2e: " +
      result.candidate_ready_for_isolated_e2e,
  );
  console.log("active_runtime_changed: false");
  console.log("c2_authorized: false");
}

main().catch((error) => {
  console.error(
    "M2_P4_I3_R1_C1_R3_PREFLIGHT_STOPPED: " + safeStopCode(error),
  );
  process.exitCode = 1;
});
