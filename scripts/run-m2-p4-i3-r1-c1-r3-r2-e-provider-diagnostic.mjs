import { execFileSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  aggregateUsage,
  candidateRawEchoCount,
  canonicalJson,
  countBaseFieldsInCandidate,
  countCandidateFieldsInBase,
  countCandidateOperationalMetadata,
  countExactLiterals,
  countSourceRefLiteral,
  evaluateDiagnostic,
  evaluateProviderCall,
  expectedDataInjectionCount,
  forbiddenInputReferenceCount,
  renderDiagnosticSummary,
  renderDocumentationStatusBlock,
  renderReviewDocument,
  runEvaluatorSelfTests,
  secretLeakageCount,
  shaDiagnosticJson,
} from "./lib/m2-p4-i3-r1-c1-r3-r2-e-provider-evaluator-v1.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const artifactRoot = path.join(
  repositoryRoot,
  "evals",
  "runtime",
  "m2-p4-i3-r1-c1-r3-r2-e",
);
const paths = {
  contract: path.join(artifactRoot, "diagnostic-contract-v1.json"),
  cases: path.join(artifactRoot, "diagnostic-cases-v1.json"),
  quality: path.join(artifactRoot, "quality-contract-v1.json"),
  authorization: path.join(artifactRoot, "authorization-v1.json"),
  results: path.join(artifactRoot, "diagnostic-results-v1.json"),
  summary: path.join(artifactRoot, "diagnostic-summary-v1.md"),
  capabilities: path.join(artifactRoot, "capabilities-v1.json"),
  review: path.join(
    repositoryRoot,
    "docs",
    "phase2",
    "TASK_M2_P4_I3_R1_C1_R3_R2_E_REVIEW.md",
  ),
  currentFocus: path.join(repositoryRoot, "docs", "CURRENT_FOCUS.md"),
  wbs: path.join(repositoryRoot, "docs", "WBS.md"),
  handoff: path.join(repositoryRoot, "docs", "CODEX_HANDOFF.md"),
  verifier: path.join(
    repositoryRoot,
    "scripts",
    "verify-m2-p4-i3-r1-c1-r3-r2-e-provider-diagnostic.mjs",
  ),
};
const documentationMarker = "M2-P4-I3-R1-C1-R3-R2-E";

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
      loadM2P4CandidateSourceIsolationRuntimeStageCatalog,
      loadM2P4ProductQualityRuntimeStageCatalog,
    } = await import("../lib/assessment/runtime/schema-catalog.ts");
    const { validateGroundedStageOutput, validateStageOutput } = await import(
      "../lib/assessment/runtime/validation.ts"
    );
    const {
      groundBaseStructuredIntakeV1,
    } = await import(
      "../lib/assessment/runtime/base-structured-intake-grounding-v1.ts"
    );
    const { validateBaseSourceIntegrityV1 } = await import(
      "../lib/assessment/runtime/base-source-integrity-v1.ts"
    );
    const {
      groundCandidateAnalysisV1,
    } = await import(
      "../lib/assessment/runtime/candidate-analysis-grounding-v1.ts"
    );
    const { validateCandidateSourceIntegrityV1 } = await import(
      "../lib/assessment/runtime/candidate-source-integrity-v1.ts"
    );
    const { buildAvailableCandidateLaneV1 } = await import(
      "../lib/assessment/runtime/split-analysis-envelope-v1.ts"
    );
    const { validateContextualIntakeIntegrityV3 } = await import(
      "../lib/assessment/runtime/contextual-integrity-v3.ts"
    );
    return {
      OpenAiResponsesTransport,
      loadM2P4CandidateSourceIsolationRuntimeStageCatalog,
      loadM2P4ProductQualityRuntimeStageCatalog,
      validateGroundedStageOutput,
      validateStageOutput,
      groundBaseStructuredIntakeV1,
      validateBaseSourceIntegrityV1,
      groundCandidateAnalysisV1,
      validateCandidateSourceIntegrityV1,
      buildAvailableCandidateLaneV1,
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

async function readJson(filePath) {
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

function safeCode(error, fallback = "M2_R3_R2_E_EXECUTION_STOPPED") {
  if (typeof error?.safeCode === "string") return error.safeCode;
  if (
    typeof error?.message === "string" &&
    /^M2_[A-Z0-9_]+$/u.test(error.message)
  ) {
    return error.message;
  }
  return fallback;
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
    fail("M2_R3_R2_E_ARGUMENT_INVALID");
  }
  return { packageCommit: args[1], confirmationPhrase: args[3] };
}

function normalizedPaths(value) {
  return value
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "en"));
}

function sameSet(left, right) {
  return canonicalJson([...left].sort()) === canonicalJson([...right].sort());
}

function exactKeys(value, expected) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    sameSet(Object.keys(value), expected) &&
    Object.keys(value).length === expected.length
  );
}

function loadAuthorizedEnvironment(contract) {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
    try {
      process.loadEnvFile(path.join(repositoryRoot, ".env.local"));
    } catch {
      fail("M2_R3_R2_E_ENVIRONMENT_UNAVAILABLE");
    }
  }
  if (!process.env.OPENAI_API_KEY) {
    fail("M2_R3_R2_E_OPENAI_API_KEY_MISSING");
  }
  if (process.env.OPENAI_MODEL !== contract.model) {
    fail("M2_R3_R2_E_MODEL_NOT_AUTHORIZED");
  }
  return { apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL };
}

function stageRequest(definition, model, input, contract) {
  const expected = contract.stage_assets[definition.stageId];
  if (
    !expected ||
    !["PB-01", "PB-01C"].includes(definition.stageId) ||
    definition.promptVersion !== expected.prompt_version ||
    definition.promptHash !== expected.combined_prompt_sha256 ||
    definition.schemaVersion !== expected.schema_version ||
    definition.schemaHash !== expected.schema_definition_sha256 ||
    (definition.stageId === "PB-01" &&
      (definition.groundedSchemaVersion !== expected.grounded_schema_version ||
        definition.groundedSchemaHash !== expected.schema_definition_sha256))
  ) {
    fail("M2_R3_R2_E_STAGE_DEFINITION_INVALID");
  }
  return {
    stageId: definition.stageId,
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

function buildProviderInput(diagnosticCase) {
  return structuredClone(diagnosticCase.synthetic_input);
}

function assertProviderInputs(contract, caseBundle, qualityContract) {
  if (
    caseBundle.length !== 14 ||
    qualityContract.case_count !== 14 ||
    qualityContract.cases.length !== 14 ||
    contract.call_sequence.length !== 14
  ) {
    fail("M2_R3_R2_E_CASE_COUNT_INVALID");
  }
  const qualityById = new Map(
    qualityContract.cases.map((qualityCase) => [qualityCase.case_id, qualityCase]),
  );
  for (const [index, diagnosticCase] of caseBundle.entries()) {
    const authority = contract.call_sequence[index];
    const qualityCase = qualityById.get(diagnosticCase.case_id);
    if (
      authority.call_index !== index + 1 ||
      authority.case_id !== diagnosticCase.case_id ||
      authority.stage_id !== diagnosticCase.stage_id ||
      qualityCase?.stage_id !== diagnosticCase.stage_id
    ) {
      fail("M2_R3_R2_E_CALL_SEQUENCE_INVALID");
    }
    const input = buildProviderInput(diagnosticCase);
    const expectedKeys = contract.provider_input_keys[diagnosticCase.stage_id];
    if (!exactKeys(input, expectedKeys)) {
      fail("M2_R3_R2_E_PROVIDER_INPUT_KEYS_INVALID");
    }
    if (
      forbiddenInputReferenceCount(
        input,
        diagnosticCase.case_id,
        contract.forbidden_provider_input_fields[diagnosticCase.stage_id],
      ) !== 0 ||
      expectedDataInjectionCount(
        input,
        qualityCase,
        qualityContract,
        expectedKeys,
      ) !== 0
    ) {
      fail("M2_R3_R2_E_PROVIDER_INPUT_CONTAMINATED");
    }
    if (
      diagnosticCase.stage_id === "PB-01C" &&
      canonicalJson(input.candidate_metadata) !==
        canonicalJson(contract.candidate_metadata)
    ) {
      fail("M2_R3_R2_E_CANDIDATE_METADATA_INVALID");
    }
  }
}

function assertContract(contract, authorization, initialResults, capabilities) {
  if (
    contract.task_id !== "M2-P4-I3-R1-C1-R3-R2-E" ||
    contract.authorization_id !== "M2-P4-I3-R1-C1-R3-R2-E-2026-08-03" ||
    contract.confirmation_phrase !== "R3-R2-E-14-CALL-SPLIT-SYNTHETIC-ONLY" ||
    contract.baseline !== "8ce5e608b019197e48107354b73338a6883b4938" ||
    contract.accepted_c_implementation !==
      "7e09b540220eac3b0afb91bc9cfb822cc0ab632d" ||
    contract.main_baseline !== "61e33a10e195fad17e253a6b9719217e1992f273" ||
    contract.catalog !== "runtime-stage-catalog-v9.0.0" ||
    contract.prompt_bundle !== "prompt-bundle-runtime-v9.0.0" ||
    contract.schema_set !== "pipeline-schema-runtime-v4.0.0" ||
    contract.stage_topology !== "split-base-candidate-v1" ||
    contract.model !== "gpt-5.6-luna" ||
    contract.authorized_calls !== 14 ||
    contract.pb_01_calls !== 8 ||
    contract.pb_01c_calls !== 6 ||
    contract.exact_mutation_paths.length !== 14 ||
    contract.post_run_mutable_paths.length !== 8 ||
    contract.frozen_after_commit_a_paths.length !== 6 ||
    contract.execution_limits.retries !== 0 ||
    contract.execution_limits.repair_calls !== 0 ||
    contract.execution_limits.fallback_calls !== 0 ||
    contract.execution_limits.db_operations !== 0 ||
    contract.execution_limits.supabase_operations !== 0
  ) {
    fail("M2_R3_R2_E_CONTRACT_INVALID");
  }
  if (
    authorization.authorization_id !== contract.authorization_id ||
    authorization.confirmation_phrase !== contract.confirmation_phrase ||
    authorization.consumed !== false ||
    authorization.rerun_authorized !== false ||
    authorization.package_commit !== null ||
    authorization.actual_calls !== 0 ||
    authorization.completion_state !== "not_started" ||
    initialResults.status !== "not_started" ||
    initialResults.calls.length !== 0 ||
    initialResults.authorization_consumed !== false ||
    capabilities.status !== "provider_diagnostic_package_ready_not_started" ||
    capabilities.actual_calls !== 0 ||
    capabilities.provider_quality_established !== false ||
    capabilities.r4_authorized !== false ||
    capabilities.c2_authorized !== false
  ) {
    fail("M2_R3_R2_E_PACKAGE_STATE_INVALID");
  }
}

function assertGitPreflight(contract, invocation, markerPath) {
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
  if (branch !== contract.branch) fail("M2_R3_R2_E_BRANCH_MISMATCH");
  if (
    invocation.packageCommit !== head ||
    parent !== contract.baseline ||
    commitCount !== 1 ||
    upstream !== head ||
    subject !== contract.package_commit_subject
  ) {
    fail("M2_R3_R2_E_PACKAGE_COMMIT_MISMATCH");
  }
  if (main !== contract.main_baseline || originMain !== contract.main_baseline) {
    fail("M2_R3_R2_E_MAIN_CHANGED");
  }
  if (status !== "") fail("M2_R3_R2_E_WORKTREE_NOT_CLEAN");
  if (stash !== "") fail("M2_R3_R2_E_STASH_NOT_EMPTY");
  if (diffCheck !== "") fail("M2_R3_R2_E_DIFF_CHECK_FAILED");
  if (!sameSet(taskPaths, contract.exact_mutation_paths)) {
    fail("M2_R3_R2_E_SCOPE_MISMATCH");
  }
  if (
    gitDirectory !== path.join(repositoryRoot, ".git") ||
    markerPath !==
      path.join(gitDirectory, path.basename(contract.one_time_marker))
  ) {
    fail("M2_R3_R2_E_MARKER_PATH_INVALID");
  }
  execFileSync(process.execPath, [paths.verifier], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return { branch, head };
}

async function assertRuntimeAuthority(runtime, contract) {
  const candidate =
    await runtime.loadM2P4CandidateSourceIsolationRuntimeStageCatalog();
  const active = await runtime.loadM2P4ProductQualityRuntimeStageCatalog();
  if (
    candidate.catalogVersion !== contract.catalog ||
    candidate.promptBundleVersion !== contract.prompt_bundle ||
    candidate.schemaSetVersion !== contract.schema_set ||
    candidate.stageTopologyVersion !== contract.stage_topology ||
    active.promptBundleVersion !== contract.active_prompt_bundle ||
    active.schemaSetVersion !== contract.active_schema_set
  ) {
    fail("M2_R3_R2_E_RUNTIME_AUTHORITY_INVALID");
  }
  const definitions = new Map(
    candidate.definitions
      .filter((definition) => ["PB-01", "PB-01C"].includes(definition.stageId))
      .map((definition) => [definition.stageId, definition]),
  );
  if (definitions.size !== 2) fail("M2_R3_R2_E_STAGE_DEFINITION_MISSING");
  for (const definition of definitions.values()) {
    stageRequest(definition, contract.model, {}, contract);
  }
  return definitions;
}

function emptyUsage() {
  return {
    input_tokens: 0,
    cached_tokens: 0,
    output_tokens: 0,
    reasoning_tokens: 0,
  };
}

function validationResult(validator) {
  try {
    validator();
    return { passed: true, safe_error_code: null };
  } catch (error) {
    return { passed: false, safe_error_code: safeCode(error) };
  }
}

function initializeCall(diagnosticCase, index, providerInput, model) {
  return {
    case_id: diagnosticCase.case_id,
    call_index: index + 1,
    stage_id: diagnosticCase.stage_id,
    provider_input: structuredClone(providerInput),
    provider_input_sha256: shaDiagnosticJson(providerInput),
    provider_input_isolation_passed: true,
    expected_data_injection_count: 0,
    provider_attempted: true,
    provider_completed: false,
    provider_completion: "started",
    requested_model: model,
    returned_model: null,
    returned_model_exact: false,
    response_id: null,
    latency_ms: 0,
    usage: emptyUsage(),
    raw_output: null,
    raw_output_sha256: null,
    raw_output_sha256_after_processing: null,
    provider_output_mutated: false,
    raw_schema_result: { passed: false, safe_error_code: null },
    raw_source_integrity_result: { passed: false, safe_error_code: null },
    grounded_output: null,
    grounded_output_sha256: null,
    grounded_schema_result: { passed: false, safe_error_code: null },
    grounded_source_integrity_result: { passed: false, safe_error_code: null },
    contextual_integrity_result:
      diagnosticCase.stage_id === "PB-01"
        ? { passed: false, safe_error_code: null }
        : { passed: true, safe_error_code: null, not_applicable: true },
    application_canonical_result:
      diagnosticCase.stage_id === "PB-01"
        ? { passed: false, safe_error_code: null }
        : { passed: true, safe_error_code: null, not_applicable: true },
    candidate_allowlist_grounding_result:
      diagnosticCase.stage_id === "PB-01C"
        ? { passed: false, safe_error_code: null }
        : { passed: true, safe_error_code: null, not_applicable: true },
    candidate_lane: null,
    candidate_field_count_in_base: 0,
    optional_message_source_ref_count: 0,
    base_fact_field_count_in_candidate: 0,
    raw_candidate_echo_count: 0,
    source_ref_id_operational_metadata_count: 0,
    secret_leakage_count: 0,
    exact_literal_leakage_count: 0,
    case_fixture_oracle_reference_count: 0,
    assertion_results: [],
    hard_failures: [],
    soft_findings: [],
    safe_error_code: null,
    evaluation: null,
  };
}

function candidateGroundedShapeValid(grounded) {
  return (
    exactKeys(grounded, ["candidate_analysis", "candidate_safety_result"]) &&
    exactKeys(grounded.candidate_analysis, [
      "candidate_style_profile",
      "candidate_communicative_intent",
      "candidate_language_expression",
    ]) &&
    exactKeys(grounded.candidate_safety_result, [
      "untrusted_embedded_instruction_detected",
      "signal_codes",
    ])
  );
}

function sameCanonicalFields(grounded, providerInput) {
  return (
    grounded?.relationship_stage === providerInput.relationship &&
    grounded?.decision_facts?.relationship_stage === providerInput.relationship &&
    sameSet(
      grounded?.decision_facts?.selected_requests ?? [],
      providerInput.requested_topics,
    )
  );
}

function exactLiteralExpectations(qualityCase, providerInput, qualityContract) {
  const literals = [];
  for (const assertion of qualityCase.assertions) {
    if (assertion.operator !== "exact_literal_absent") continue;
    if (Array.isArray(assertion.expected)) literals.push(...assertion.expected);
    else if (
      assertion.expected?.value_from === "provider_input.optional_message" &&
      typeof providerInput.optional_message === "string"
    ) {
      literals.push(providerInput.optional_message);
    } else if (
      assertion.expected?.value_from ===
      "quality_contract.direct_material_candidate_safety_codes"
    ) {
      literals.push(...qualityContract.direct_material_candidate_safety_codes);
    }
  }
  return [...new Set(literals)];
}

function scanCallEvidence(call, qualityCase, qualityContract, apiKey) {
  const outputs = {
    raw_output: call.raw_output,
    grounded_output: call.grounded_output,
  };
  call.secret_leakage_count = secretLeakageCount(outputs, apiKey);
  call.exact_literal_leakage_count = countExactLiterals(
    outputs,
    exactLiteralExpectations(qualityCase, call.provider_input, qualityContract),
  );
  call.case_fixture_oracle_reference_count = forbiddenInputReferenceCount(
    outputs,
    call.case_id,
    ["case_id", "fixture_id", "oracle", "expected", "verdict"],
  );
  if (call.stage_id === "PB-01") {
    call.candidate_field_count_in_base = countCandidateFieldsInBase(outputs);
    call.optional_message_source_ref_count = countSourceRefLiteral(
      outputs,
      "input:optional_message",
    );
  } else {
    call.base_fact_field_count_in_candidate = countBaseFieldsInCandidate(outputs);
    call.raw_candidate_echo_count = candidateRawEchoCount(
      call.provider_input,
      outputs,
    );
    call.source_ref_id_operational_metadata_count =
      countCandidateOperationalMetadata(outputs);
  }
}

async function persistProgress(result, contract, qualityContract) {
  result.calls_actual = result.calls.length;
  result.calls_completed = result.calls.filter(
    (call) => call.provider_completed === true,
  ).length;
  result.pb_01_calls = result.calls.filter(
    (call) => call.stage_id === "PB-01",
  ).length;
  result.pb_01c_calls = result.calls.filter(
    (call) => call.stage_id === "PB-01C",
  ).length;
  result.provider_output_mutation_count = result.calls.filter(
    (call) => call.provider_output_mutated === true,
  ).length;
  result.expected_data_injection_count = result.calls.reduce(
    (total, call) => total + call.expected_data_injection_count,
    0,
  );
  result.secret_leakage_count = result.calls.reduce(
    (total, call) => total + call.secret_leakage_count,
    0,
  );
  result.exact_literal_leakage_count = result.calls.reduce(
    (total, call) => total + call.exact_literal_leakage_count,
    0,
  );
  result.case_fixture_oracle_reference_count = result.calls.reduce(
    (total, call) => total + call.case_fixture_oracle_reference_count,
    0,
  );
  result.usage_totals = aggregateUsage(result.calls);
  result.evaluation = evaluateDiagnostic(contract, qualityContract, result);
  await writeJson(paths.results, result);
}

async function processBaseResponse(runtime, definition, call, response) {
  call.raw_schema_result = validationResult(() =>
    runtime.validateStageOutput(definition, response.output),
  );
  call.raw_source_integrity_result = validationResult(() =>
    runtime.validateBaseSourceIntegrityV1({
      input: call.provider_input,
      baseProviderRequest: call.provider_input,
      rawBaseOutput: response.output,
    }),
  );
  if (
    !call.raw_schema_result.passed ||
    !call.raw_source_integrity_result.passed
  ) {
    return;
  }
  let grounded;
  try {
    grounded = runtime.groundBaseStructuredIntakeV1(
      call.provider_input,
      response.output,
    );
    call.grounded_output = grounded;
    call.grounded_output_sha256 = shaDiagnosticJson(grounded);
  } catch (error) {
    call.grounded_schema_result = {
      passed: false,
      safe_error_code: safeCode(error),
    };
    return;
  }
  call.grounded_schema_result = validationResult(() =>
    runtime.validateGroundedStageOutput(definition, grounded),
  );
  call.grounded_source_integrity_result = validationResult(() =>
    runtime.validateBaseSourceIntegrityV1({
      input: call.provider_input,
      groundedBaseOutput: grounded,
    }),
  );
  call.contextual_integrity_result = validationResult(() =>
    runtime.validateContextualIntakeIntegrityV3(grounded),
  );
  call.application_canonical_result = sameCanonicalFields(
    grounded,
    call.provider_input,
  )
    ? { passed: true, safe_error_code: null }
    : {
        passed: false,
        safe_error_code: "M2_R3_R2_E_APPLICATION_CANONICAL_INVALID",
      };
}

async function processCandidateResponse(runtime, definition, call, response) {
  call.raw_schema_result = validationResult(() =>
    runtime.validateStageOutput(definition, response.output),
  );
  call.raw_source_integrity_result = validationResult(() =>
    runtime.validateCandidateSourceIntegrityV1({
      candidateProviderInput: call.provider_input,
      rawCandidateProviderOutput: response.output,
    }),
  );
  if (
    !call.raw_schema_result.passed ||
    !call.raw_source_integrity_result.passed
  ) {
    return;
  }
  let grounded;
  try {
    grounded = runtime.groundCandidateAnalysisV1(response.output);
    call.grounded_output = grounded;
    call.grounded_output_sha256 = shaDiagnosticJson(grounded);
    call.candidate_lane = runtime.buildAvailableCandidateLaneV1(
      grounded.candidate_analysis,
      grounded.candidate_safety_result,
    );
  } catch (error) {
    call.grounded_schema_result = {
      passed: false,
      safe_error_code: safeCode(error),
    };
    return;
  }
  call.grounded_schema_result = candidateGroundedShapeValid(grounded)
    ? { passed: true, safe_error_code: null }
    : {
        passed: false,
        safe_error_code: "M2_R3_R2_E_CANDIDATE_GROUNDED_SCHEMA_INVALID",
      };
  call.grounded_source_integrity_result = validationResult(() =>
    runtime.validateCandidateSourceIntegrityV1({
      candidateAnalysis: grounded.candidate_analysis,
      candidateSafetyResult: grounded.candidate_safety_result,
      candidateEnvelope: call.candidate_lane.candidate_envelope,
    }),
  );
  call.candidate_allowlist_grounding_result =
    call.grounded_schema_result.passed &&
    call.grounded_source_integrity_result.passed
      ? { passed: true, safe_error_code: null }
      : {
          passed: false,
          safe_error_code: "M2_R3_R2_E_CANDIDATE_ALLOWLIST_GROUNDING_INVALID",
        };
}

async function runProviderCalls({
  runtime,
  definitions,
  transport,
  apiKey,
  model,
  contract,
  caseBundle,
  qualityContract,
  result,
  claimExecution,
}) {
  const qualityById = new Map(
    qualityContract.cases.map((qualityCase) => [qualityCase.case_id, qualityCase]),
  );
  for (const [index, diagnosticCase] of caseBundle.entries()) {
    if (result.calls.length >= contract.authorized_calls) {
      fail("M2_R3_R2_E_CALL_CAP_REACHED");
    }
    if (index === 0) await claimExecution();
    const providerInput = buildProviderInput(diagnosticCase);
    const qualityCase = qualityById.get(diagnosticCase.case_id);
    const call = initializeCall(diagnosticCase, index, providerInput, model);
    call.expected_data_injection_count = expectedDataInjectionCount(
      providerInput,
      qualityCase,
      qualityContract,
      contract.provider_input_keys[diagnosticCase.stage_id],
    );
    call.provider_input_isolation_passed =
      exactKeys(
        providerInput,
        contract.provider_input_keys[diagnosticCase.stage_id],
      ) &&
      call.expected_data_injection_count === 0 &&
      forbiddenInputReferenceCount(
        providerInput,
        diagnosticCase.case_id,
        contract.forbidden_provider_input_fields[diagnosticCase.stage_id],
      ) === 0;
    result.calls.push(call);
    await persistProgress(result, contract, qualityContract);

    let response;
    try {
      response = await transport.invoke(
        stageRequest(
          definitions.get(diagnosticCase.stage_id),
          model,
          providerInput,
          contract,
        ),
      );
    } catch (error) {
      call.provider_completion = "transport_failed";
      call.safe_error_code = safeCode(error, "M2_R3_R2_E_TRANSPORT_FAILED");
      scanCallEvidence(call, qualityCase, qualityContract, apiKey);
      call.evaluation = evaluateProviderCall(call, qualityCase, qualityContract);
      call.assertion_results = call.evaluation.assertion_results;
      call.hard_failures = call.evaluation.hard_failures;
      call.soft_findings = call.evaluation.soft_findings;
      await persistProgress(result, contract, qualityContract);
      fail(call.safe_error_code);
    }

    call.provider_completed = true;
    call.provider_completion = "completed";
    call.returned_model = response.returnedModel;
    call.returned_model_exact = response.returnedModel === model;
    call.response_id = response.responseId;
    call.latency_ms = response.latencyMs;
    call.usage = {
      input_tokens: response.usage.inputTokens,
      cached_tokens: response.usage.cachedTokens,
      output_tokens: response.usage.outputTokens,
      reasoning_tokens: response.usage.reasoningTokens,
    };
    call.raw_output = response.output;
    call.raw_output_sha256 = shaDiagnosticJson(response.output);

    if (!call.returned_model_exact) {
      call.safe_error_code = "M2_R3_R2_E_RETURNED_MODEL_MISMATCH";
      call.raw_output_sha256_after_processing = shaDiagnosticJson(call.raw_output);
      call.provider_output_mutated =
        call.raw_output_sha256 !== call.raw_output_sha256_after_processing;
      scanCallEvidence(call, qualityCase, qualityContract, apiKey);
      call.evaluation = evaluateProviderCall(call, qualityCase, qualityContract);
      call.assertion_results = call.evaluation.assertion_results;
      call.hard_failures = call.evaluation.hard_failures;
      call.soft_findings = call.evaluation.soft_findings;
      await persistProgress(result, contract, qualityContract);
      fail(call.safe_error_code);
    }

    if (diagnosticCase.stage_id === "PB-01") {
      await processBaseResponse(
        runtime,
        definitions.get("PB-01"),
        call,
        response,
      );
    } else {
      await processCandidateResponse(
        runtime,
        definitions.get("PB-01C"),
        call,
        response,
      );
    }

    scanCallEvidence(call, qualityCase, qualityContract, apiKey);
    call.raw_output_sha256_after_processing = shaDiagnosticJson(call.raw_output);
    call.provider_output_mutated =
      call.raw_output_sha256 !== call.raw_output_sha256_after_processing;
    try {
      call.evaluation = evaluateProviderCall(call, qualityCase, qualityContract);
    } catch {
      call.safe_error_code = "M2_R3_R2_E_EVALUATOR_DEFECT";
      call.hard_failures = [call.safe_error_code];
      await persistProgress(result, contract, qualityContract);
      fail(call.safe_error_code, true);
    }
    call.assertion_results = call.evaluation.assertion_results;
    call.hard_failures = call.evaluation.hard_failures;
    call.soft_findings = call.evaluation.soft_findings;
    const finalRawHash = shaDiagnosticJson(call.raw_output);
    if (finalRawHash !== call.raw_output_sha256_after_processing) {
      call.provider_output_mutated = true;
      call.safe_error_code = "M2_R3_R2_E_PROVIDER_OUTPUT_MUTATED";
    }
    await persistProgress(result, contract, qualityContract);
  }
  if (result.calls.length !== contract.authorized_calls) {
    fail("M2_R3_R2_E_CALL_COUNT_INVALID");
  }
}

async function replaceDocumentationBlock(filePath, block) {
  const text = await readFile(filePath, "utf8");
  const begin = `<!-- ${documentationMarker}:BEGIN -->`;
  const end = `<!-- ${documentationMarker}:END -->`;
  const startIndex = text.indexOf(begin);
  const endIndex = text.indexOf(end);
  if (
    startIndex < 0 ||
    endIndex < startIndex ||
    text.indexOf(begin, startIndex + begin.length) >= 0 ||
    text.indexOf(end, endIndex + end.length) >= 0
  ) {
    fail("M2_R3_R2_E_DOCUMENT_MARKER_INVALID");
  }
  const updated =
    text.slice(0, startIndex) +
    block +
    text.slice(endIndex + end.length);
  await writeFile(filePath, updated, "utf8");
}

async function finalizeAttempt({
  result,
  contract,
  qualityContract,
  caseBundle,
  authorization,
  initialCapabilities,
  preflight,
  executionClaimedAt,
  fatalError,
}) {
  result.completed_at = new Date().toISOString();
  result.authorization_consumed = true;
  result.rerun_authorized = false;
  result.safe_stop_code = fatalError ? safeCode(fatalError) : null;
  result.provider_quality_established = false;
  result.candidate_source_isolation_provider_boundary_confirmed = false;
  result.candidate_analysis_provider_quality_established = false;
  result.candidate_safety_provider_quality_established = false;
  result.candidate_ready_for_isolated_e2e = false;
  result.r4_ready = false;
  result.r4_authorized = false;
  result.c2_authorized = false;
  result.status = fatalError?.evaluatorDefect
    ? contract.evaluation_blocked_status
    : contract.fail_status;
  await persistProgress(result, contract, qualityContract);
  if (!fatalError && result.evaluation.verdict === "PASS") {
    result.status = contract.pass_status;
    result.provider_quality_established = true;
    result.candidate_source_isolation_provider_boundary_confirmed = true;
    result.candidate_analysis_provider_quality_established = true;
    result.candidate_safety_provider_quality_established = true;
    result.candidate_ready_for_isolated_e2e = true;
    result.r4_ready = true;
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
  const finalCapabilities = {
    ...initialCapabilities,
    status: result.status,
    actual_calls: result.calls_actual,
    completed_calls: result.calls_completed,
    pb_01_calls: `${result.pb_01_calls}/8`,
    pb_01c_calls: `${result.pb_01c_calls}/6`,
    authorization_consumed: true,
    rerun_authorized: false,
    package_commit: preflight.head,
    provider_diagnostic_verdict: result.evaluation.verdict,
    provider_quality_established: result.provider_quality_established,
    full_runtime_provider_quality_established: false,
    candidate_source_isolation_provider_boundary_confirmed:
      result.candidate_source_isolation_provider_boundary_confirmed,
    candidate_analysis_provider_quality_established:
      result.candidate_analysis_provider_quality_established,
    candidate_safety_provider_quality_established:
      result.candidate_safety_provider_quality_established,
    candidate_ready_for_isolated_e2e:
      result.candidate_ready_for_isolated_e2e,
    r4_ready: result.r4_ready,
    r4_authorized: false,
    c2_authorized: false,
    db_operations: 0,
    supabase_operations: 0,
    migration_applied: false,
    active_service_changed: false,
    active_runtime_activated: false,
    main_changed: false,
    evaluator_self_tests: result.evaluator_self_tests,
    metrics: result.evaluation.metrics,
    hard_failures: result.evaluation.hard_failures,
    soft_findings: result.evaluation.soft_findings,
    usage_totals: result.usage_totals,
    output_mutation_count: result.provider_output_mutation_count,
    expected_data_injection_count: result.expected_data_injection_count,
    secret_leakage_count: result.secret_leakage_count,
    exact_literal_leakage_count: result.exact_literal_leakage_count,
    next_candidate: "M2-P4-I3-R1-C1-R4 Isolated Full Runtime E2E",
    next_candidate_authorized: false,
  };
  await writeJson(paths.authorization, finalAuthorization);
  await writeJson(paths.results, result);
  await writeJson(paths.capabilities, finalCapabilities);
  await writeFile(paths.summary, renderDiagnosticSummary(result, caseBundle), "utf8");
  await writeFile(paths.review, renderReviewDocument(result, caseBundle), "utf8");
  const documentationBlock = renderDocumentationStatusBlock(result);
  await replaceDocumentationBlock(paths.currentFocus, documentationBlock);
  await replaceDocumentationBlock(paths.wbs, documentationBlock);
  await replaceDocumentationBlock(paths.handoff, documentationBlock);
}

async function main() {
  const contract = await readJson(paths.contract);
  const invocation = parseArguments(contract);
  const caseBundle = await readJson(paths.cases);
  const qualityContract = await readJson(paths.quality);
  const authorization = await readJson(paths.authorization);
  const initialResults = await readJson(paths.results);
  const initialCapabilities = await readJson(paths.capabilities);
  assertContract(contract, authorization, initialResults, initialCapabilities);
  assertProviderInputs(contract, caseBundle, qualityContract);
  const selfTests = runEvaluatorSelfTests();
  if (selfTests.passed !== 16 || selfTests.total !== 16) {
    fail("M2_R3_R2_E_EVALUATOR_SELF_TEST_FAILED", true);
  }
  const markerPath = path.join(
    repositoryRoot,
    ".git",
    path.basename(contract.one_time_marker),
  );
  if (await exists(markerPath)) {
    fail("M2_R3_R2_E_ONE_TIME_MARKER_CONSUMED");
  }
  const preflight = assertGitPreflight(contract, invocation, markerPath);
  const runtime = await loadRuntimeModules();
  const definitions = await assertRuntimeAuthority(runtime, contract);
  const { apiKey, model } = loadAuthorizedEnvironment(contract);
  const transport = new runtime.OpenAiResponsesTransport(apiKey);
  if (!transport.client || typeof transport.client.maxRetries !== "number") {
    fail("M2_R3_R2_E_RETRY_CONTROL_UNAVAILABLE");
  }
  transport.client.maxRetries = 0;
  if (transport.client.maxRetries !== 0) {
    fail("M2_R3_R2_E_RETRY_NOT_DISABLED");
  }

  const result = {
    ...initialResults,
    status: "running",
    started_at: new Date().toISOString(),
    completed_at: null,
    package_commit: preflight.head,
    requested_model: model,
    calls_actual: 0,
    calls_completed: 0,
    pb_01_calls: 0,
    pb_01c_calls: 0,
    authorization_consumed: false,
    evaluator_self_tests: selfTests,
    calls: [],
  };
  let executionClaimed = false;
  let executionClaimedAt = null;
  const claimExecution = async () => {
    if (executionClaimed) fail("M2_R3_R2_E_EXECUTION_ALREADY_CLAIMED");
    executionClaimedAt = new Date().toISOString();
    await writeFile(
      markerPath,
      JSON.stringify(
        {
          schema_version: "m2-p4-i3-r1-c1-r3-r2-e-consumed-v1",
          task_id: contract.task_id,
          authorization_id: contract.authorization_id,
          confirmation_phrase: contract.confirmation_phrase,
          package_commit: preflight.head,
          branch: preflight.branch,
          execution_claimed_at: executionClaimedAt,
          authorized_calls: contract.authorized_calls,
          pb_01_calls: contract.pb_01_calls,
          pb_01c_calls: contract.pb_01c_calls,
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
    await writeJson(paths.authorization, {
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
      runtime,
      definitions,
      transport,
      apiKey,
      model,
      contract,
      caseBundle,
      qualityContract,
      result,
      claimExecution,
    });
  } catch (error) {
    fatalError = error;
  }
  if (!executionClaimed) {
    if (fatalError) throw fatalError;
    fail("M2_R3_R2_E_EXECUTION_NOT_CLAIMED");
  }
  await finalizeAttempt({
    result,
    contract,
    qualityContract,
    caseBundle,
    authorization,
    initialCapabilities,
    preflight,
    executionClaimedAt,
    fatalError,
  });
  if (fatalError) {
    console.error(
      "M2_P4_I3_R1_C1_R3_R2_E_PROVIDER_DIAGNOSTIC_STOPPED: " +
        safeCode(fatalError),
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    "M2_P4_I3_R1_C1_R3_R2_E_PROVIDER_DIAGNOSTIC: " +
      result.evaluation.verdict,
  );
  console.log(`provider_calls: ${result.calls_actual}/${contract.authorized_calls}`);
  console.log(`pb_01_calls: ${result.pb_01_calls}/${contract.pb_01_calls}`);
  console.log(`pb_01c_calls: ${result.pb_01c_calls}/${contract.pb_01c_calls}`);
  console.log(`cases_passed: ${result.evaluation.case_pass_count}/14`);
  console.log(`provider_quality_established: ${result.provider_quality_established}`);
  console.log(`candidate_ready_for_isolated_e2e: ${result.candidate_ready_for_isolated_e2e}`);
  console.log("rerun_authorized: false");
  console.log("r4_authorized: false");
  console.log("c2_authorized: false");
}

main().catch((error) => {
  console.error(
    "M2_P4_I3_R1_C1_R3_R2_E_PREFLIGHT_STOPPED: " + safeCode(error),
  );
  process.exitCode = 1;
});
