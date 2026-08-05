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
  runEvaluatorSelfTests,
  shaDiagnosticJson,
} from "./lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evaluator-v1.mjs";
import {
  auditEvidence,
  runEvidenceAuditorSelfTests,
} from "./lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evidence-auditor-v1.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const taskRoot = path.join(
  repositoryRoot,
  "evals",
  "runtime",
  "m2-p4-i3-r1-c1-r3-r2-e-r3-r3",
);
const artifact = (name) => path.join(taskRoot, name);
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
    "TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_REVIEW.md",
  ),
  currentFocus: path.join(repositoryRoot, "docs", "CURRENT_FOCUS.md"),
  wbs: path.join(repositoryRoot, "docs", "WBS.md"),
  handoff: path.join(repositoryRoot, "docs", "CODEX_HANDOFF.md"),
  auditorSource: path.join(
    repositoryRoot,
    "scripts",
    "lib",
    "m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evidence-auditor-v1.mjs",
  ),
};
const documentationMarker = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3";

let runtimeHooksRegistered = false;

function registerRuntimeHooks() {
  if (runtimeHooksRegistered) return;
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

async function loadPackageRuntime() {
  registerRuntimeHooks();
  const [
    { loadM2P4AuthorityIntegrityRuntimeStageCatalog },
    { runAuthorityIntegrityOffline },
  ] = await Promise.all([
    import("../lib/assessment/runtime/schema-catalog.ts"),
    import("./lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r2-offline-runner-v1.mjs"),
  ]);
  return {
    loadM2P4AuthorityIntegrityRuntimeStageCatalog,
    runAuthorityIntegrityOffline,
  };
}

async function loadExecutionRuntime() {
  registerRuntimeHooks();
  const [
    { AssessmentPipeline },
    { FakeAssessmentRepository },
    { loadM2P4AuthorityIntegrityRuntimeStageCatalog },
    { M2RuntimeError },
    { projectBaseProviderInputV1 },
    { groundBaseStructuredIntakeV3 },
    { buildBaseStructuredIntakeLegacyViewV1 },
    { validateBaseSourceIntegrityV1 },
    { validateContextualIntakeIntegrityV3 },
    { groundCandidateAnalysisV2 },
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
    import("../lib/assessment/runtime/pipeline.ts"),
    import("../lib/assessment/runtime/fakes.ts"),
    import("../lib/assessment/runtime/schema-catalog.ts"),
    import("../lib/assessment/runtime/errors.ts"),
    import("../lib/assessment/runtime/base-structured-intake-grounding-v1.ts"),
    import("../lib/assessment/runtime/base-structured-intake-grounding-v3.ts"),
    import("../lib/assessment/runtime/base-structured-intake-legacy-view-v1.ts"),
    import("../lib/assessment/runtime/base-source-integrity-v1.ts"),
    import("../lib/assessment/runtime/contextual-integrity-v3.ts"),
    import("../lib/assessment/runtime/candidate-analysis-grounding-v2.ts"),
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
    AssessmentPipeline,
    FakeAssessmentRepository,
    loadM2P4AuthorityIntegrityRuntimeStageCatalog,
    M2RuntimeError,
    projectBaseProviderInputV1,
    groundBaseStructuredIntakeV3,
    buildBaseStructuredIntakeLegacyViewV1,
    validateBaseSourceIntegrityV1,
    validateContextualIntakeIntegrityV3,
    groundCandidateAnalysisV2,
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

async function constructRealTransport(apiKey) {
  const { OpenAiResponsesTransport } = await import(
    "../lib/assessment/runtime/openai-transport.ts"
  );
  const transport = new OpenAiResponsesTransport(apiKey);
  const client = Reflect.get(transport, "client");
  assertCondition(
    client && typeof client === "object",
    "M2_E_R3_R3_OPENAI_CLIENT_UNAVAILABLE",
  );
  client.maxRetries = 0;
  assertCondition(
    client.maxRetries === 0,
    "M2_E_R3_R3_RETRY_CONFIGURATION_FAILED",
  );
  return transport;
}

const clone = (value) => structuredClone(value);
const canonicalLf = (value) => value.replace(/\r\n/gu, "\n");
const sha256 = (value) =>
  createHash("sha256").update(Buffer.from(value, "utf8")).digest("hex");
const fileSha256 = (relativePath) =>
  sha256(
    canonicalLf(
      readFileSync(path.join(repositoryRoot, relativePath), "utf8"),
    ),
  );

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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJsonAtomic(filePath, value) {
  const temporary = filePath + ".tmp";
  await writeFile(temporary, JSON.stringify(value, null, 2) + "\n", "utf8");
  await rename(temporary, filePath);
}

async function writeTextAtomic(filePath, value) {
  const temporary = filePath + ".tmp";
  await writeFile(temporary, value.endsWith("\n") ? value : value + "\n", "utf8");
  await rename(temporary, filePath);
}

function assertCondition(condition, code) {
  if (!condition) throw new Error(code);
}

function safeCode(error, fallback = "M2_E_R3_R3_EXECUTION_FAILED") {
  return error?.safeCode ?? error?.message ?? fallback;
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

function exactKeys(value, expected) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    same(Object.keys(value).sort(), [...expected].sort())
  );
}

function plannedLedger(contract) {
  return Object.entries(contract.call_ledger.expected_stage_paths).flatMap(
    ([caseId, stages]) =>
      stages.map((stageId, index) => ({
        case_id: caseId,
        stage_id: stageId,
        case_call_index: index + 1,
      })),
  );
}

function callLedgerIsExact(contract) {
  const expectedByCase = contract.call_ledger.expected_calls_by_case;
  const paths = contract.call_ledger.expected_stage_paths;
  const countsExact = Object.entries(paths).every(
    ([caseId, stages]) => stages.length === expectedByCase[caseId],
  );
  const total = Object.values(expectedByCase).reduce(
    (sum, count) => sum + count,
    0,
  );
  return (
    countsExact &&
    total === 37 &&
    plannedLedger(contract).length === 37 &&
    contract.call_ledger.expected_provider_calls === 37 &&
    contract.call_ledger.provider_attempts_maximum === 37 &&
    contract.call_ledger.spare_calls === 0 &&
    contract.call_ledger.retries === 0 &&
    contract.call_ledger.repair_calls === 0 &&
    contract.call_ledger.fallback_calls === 0 &&
    contract.call_ledger.parallel_calls === 0
  );
}

function providerForbiddenHits(value, forbidden, hits = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => providerForbiddenHits(item, forbidden, hits));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (forbidden.has(key)) hits.push(key);
      providerForbiddenHits(item, forbidden, hits);
    }
  }
  return hits;
}

function providerInputInspection(request, contract) {
  const expected = contract.stage_input_keys[request.stageId] ?? [];
  const forbidden = providerForbiddenHits(
    request.input,
    new Set(contract.provider_oracle_forbidden_keys),
  );
  return {
    passed: exactKeys(request.input, expected) && forbidden.length === 0,
    exact_input_keys: Object.keys(request.input ?? {}).sort(),
    forbidden_key_count: forbidden.length,
    forbidden_keys: forbidden,
  };
}

function assessmentInput(diagnosticCase) {
  const source = diagnosticCase.synthetic_input;
  return {
    currentSituation: source.current_situation,
    optionalMessage: source.optional_message,
    relationship: source.relationship,
    requestedTopics: clone(source.requested_topics),
    privacyAcknowledged: true,
  };
}

function deterministicUuidFactory(prefix) {
  let sequence = 0;
  return () => prefix + "-" + String(++sequence).padStart(4, "0");
}

function redactSecret(value, secret) {
  if (typeof value === "string") return value.split(secret).join("[REDACTED]");
  if (Array.isArray(value)) return value.map((item) => redactSecret(item, secret));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        redactSecret(item, secret),
      ]),
    );
  }
  return value;
}

function containsSecret(value, secret) {
  return (
    typeof secret === "string" &&
    secret.length > 0 &&
    JSON.stringify(value).includes(secret)
  );
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

function recomputeCounts(result, authorization) {
  const calls = result.cases.flatMap((item) => item.provider_calls ?? []);
  const completed = calls.filter((item) => item.provider_completed === true);
  result.provider_attempts = calls.length;
  result.completed_calls = completed.length;
  result.operations.provider_calls = calls.length;
  authorization.actual_attempts = calls.length;
  authorization.completed_calls = completed.length;
  authorization.provider_calls = calls.length;
  result.usage_totals = aggregateUsage(calls);
}

async function persistProgress(result, authorization) {
  recomputeCounts(result, authorization);
  await writeJsonAtomic(paths.authorization, authorization);
  await writeJsonAtomic(paths.results, result);
}

class CapturingSequentialTransport {
  constructor({
    delegate,
    runtime,
    contract,
    result,
    authorization,
    caseResult,
    apiKey,
  }) {
    this.delegate = delegate;
    this.runtime = runtime;
    this.contract = contract;
    this.result = result;
    this.authorization = authorization;
    this.caseResult = caseResult;
    this.apiKey = apiKey;
    this.outputReferences = new Map();
  }

  async invoke(request) {
    const nextIndex = this.result.provider_attempts;
    const expected = plannedLedger(this.contract)[nextIndex];
    const inspection = providerInputInspection(request, this.contract);
    if (
      !expected ||
      expected.case_id !== this.caseResult.case_id ||
      expected.stage_id !== request.stageId ||
      expected.case_call_index !== this.caseResult.provider_calls.length + 1
    ) {
      throw new this.runtime.M2RuntimeError(
        "M2_E_R3_R3_CALL_LEDGER_DIVERGENCE",
      );
    }
    if (!inspection.passed) {
      this.caseResult.rejected_provider_inputs.push({
        stage_id: request.stageId,
        provider_request: providerRequestEvidence(request),
        inspection,
      });
      throw new this.runtime.M2RuntimeError(
        "M2_E_R3_R3_PROVIDER_INPUT_REJECTED",
      );
    }
    if (
      this.result.provider_attempts >=
      this.contract.call_ledger.provider_attempts_maximum
    ) {
      throw new this.runtime.M2RuntimeError(
        "M2_E_R3_R3_CALL_BUDGET_EXHAUSTED",
      );
    }

    const requestEvidence = providerRequestEvidence(request);
    const call = {
      call_index: this.result.provider_attempts + 1,
      case_call_index: this.caseResult.provider_calls.length + 1,
      case_id: this.caseResult.case_id,
      stage_id: request.stageId,
      provider_attempted: true,
      provider_completed: false,
      requested_model: request.model,
      returned_model: null,
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
      provider_input_isolation: inspection,
      safe_error_code: null,
    };
    this.caseResult.provider_calls.push(call);
    await persistProgress(this.result, this.authorization);

    let response;
    try {
      response = await this.delegate.invoke(request);
    } catch (error) {
      call.safe_error_code = safeCode(error, "M2_STAGE_PROVIDER_FAILED");
      await persistProgress(this.result, this.authorization);
      throw error;
    }

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
    const originalHash = shaDiagnosticJson(response.output);
    if (containsSecret(response.output, this.apiKey)) {
      call.raw_output = redactSecret(response.output, this.apiKey);
      call.raw_output_sha256 = originalHash;
      call.safe_error_code = "M2_E_R3_R3_SECRET_LEAKAGE";
      await persistProgress(this.result, this.authorization);
      throw new this.runtime.M2RuntimeError(call.safe_error_code);
    }
    call.raw_output = clone(response.output);
    call.raw_output_sha256 = originalHash;
    this.outputReferences.set(call.call_index, response.output);
    if (response.returnedModel !== this.contract.runtime_identity.model) {
      call.safe_error_code = "M2_E_R3_R3_RETURNED_MODEL_MISMATCH";
      await persistProgress(this.result, this.authorization);
      throw new this.runtime.M2RuntimeError(call.safe_error_code);
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
  return (
    caseResult.provider_calls.find((call) => call.stage_id === stageId)
      ?.raw_output ?? null
  );
}

function projectDecisionFacts(runtime, groundedBase, candidatePresence) {
  const projected = clone(groundedBase.decision_facts);
  projected.schema_version = "m2-p4-decision-facts-v2";
  projected.contact_state.proposed_message_present = candidatePresence;
  return runtime.requireContextualDecisionFactsV3({
    decision_facts: projected,
  });
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
  const definitions = new Map(
    catalog.definitions.map((item) => [item.stageId, item]),
  );
  const raw = Object.fromEntries(
    ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"].map(
      (stageId) => [stageId, stageOutput(caseResult, stageId)],
    ),
  );
  const requestInput = Object.fromEntries(
    caseResult.provider_calls.map((call) => [
      call.stage_id,
      call.provider_request.input,
    ]),
  );
  const localSchemaResults = {};
  for (const [stageId, output] of Object.entries(raw)) {
    if (!output) continue;
    localSchemaResults[stageId] = {
      raw: validationResult(() =>
        runtime.validateStageOutput(definitions.get(stageId), output),
      ),
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
      groundedBase = runtime.groundBaseStructuredIntakeV3(
        baseInput,
        raw["PB-01"],
      );
      localSchemaResults["PB-01"].grounded = validationResult(() =>
        runtime.validateGroundedStageOutput(
          definitions.get("PB-01"),
          groundedBase,
        ),
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
      contextualIntegrity = {
        passed: false,
        safe_error_code: safeCode(error),
      };
    }
  }

  let candidateAnalysis = null;
  let candidateSafety = null;
  let candidateSourceIntegrity = null;
  let candidateGrounding = null;
  if (raw["PB-01C"]) {
    candidateSourceIntegrity = validationResult(() =>
      runtime.validateCandidateSourceIntegrityV1({
        rawCandidateProviderOutput: raw["PB-01C"],
      }),
    );
    try {
      const grounded = runtime.groundCandidateAnalysisV2(raw["PB-01C"]);
      candidateAnalysis = grounded.candidate_analysis;
      candidateSafety = grounded.candidate_safety_result;
      candidateGrounding = { passed: true, safe_error_code: null };
    } catch (error) {
      candidateGrounding = {
        passed: false,
        safe_error_code: safeCode(error),
      };
    }
  }

  let aggregateSafety = null;
  let eligibility = null;
  let decisionPolicy = null;
  let splitEnvelope = null;
  if (groundedBase) {
    try {
      const baseLegacyView =
        runtime.buildBaseStructuredIntakeLegacyViewV1(groundedBase);
      let candidateLane;
      if (input.optionalMessage === null || input.optionalMessage.trim() === "") {
        candidateLane = runtime.buildAbsentCandidateLaneV1();
      } else if (candidateAnalysis && candidateSafety) {
        candidateLane = runtime.buildAvailableCandidateLaneV1(
          candidateAnalysis,
          candidateSafety,
        );
      } else if (candidateSafety) {
        candidateLane =
          runtime.buildAnalysisUnavailableSafetyAvailableCandidateLaneV1(
            candidateSafety,
          );
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
          ? runtime.projectCandidateSafetyDispositionV1(
              splitEnvelope.candidate_safety_result,
            )
          : {
              classification: "normal_allowed",
              reason_codes: [],
              response_mode: "none",
            };
        const boundarySafety = runtime.evaluateCandidateBoundaryContactV1(
          splitEnvelope.base_structured_intake,
          splitEnvelope.candidate_safety_result,
        );
        aggregateSafety = runtime.aggregateSafetyV3(
          runtime.aggregateSafetyV3(
            deterministic,
            raw["PB-02"],
            semanticSafety,
          ),
          boundarySafety,
        );
        eligibility = runtime.deriveRuntimeEligibilityV3(aggregateSafety);
      }
      const facts = projectDecisionFacts(
        runtime,
        groundedBase,
        splitEnvelope.candidate_envelope.presence,
      );
      decisionPolicy = runtime.buildContextualDecisionPolicyV3(facts);
    } catch {
      // Earlier Stage or integrity failures intentionally leave derived evidence null.
    }
  }

  const decisionPlan = raw["PB-04"] ?? finalResult?.report?.decisionPlan ?? null;
  let groundedReportContent = finalResult?.report?.content ?? null;
  if (!groundedReportContent && raw["PB-05"] && decisionPlan && groundedBase) {
    try {
      const facts = projectDecisionFacts(
        runtime,
        groundedBase,
        splitEnvelope?.candidate_envelope?.presence ??
          Boolean(input.optionalMessage),
      );
      groundedReportContent = runtime.groundReportContentV3(
        facts,
        raw["PB-05"],
      );
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

  caseResult.actual_stage_path = caseResult.provider_calls.map(
    (call) => call.stage_id,
  );
  caseResult.final_result = finalResult;
  caseResult.safe_error_code = pipelineError ? safeCode(pipelineError) : null;
  caseResult.fake_repository = serializeFakeRepository(repository);
  caseResult.evidence = {
    synthetic_input: clone(diagnosticCase.synthetic_input),
    raw_stage_outputs: raw,
    grounded_base: groundedBase,
    raw_base_source_integrity_result: rawBaseSourceIntegrity,
    grounded_base_source_integrity_result: groundedBaseSourceIntegrity,
    contextual_integrity_result: contextualIntegrity,
    candidate_analysis: candidateAnalysis,
    candidate_safety: candidateSafety,
    candidate_source_integrity_result: candidateSourceIntegrity,
    candidate_grounding_result: candidateGrounding,
    aggregate_safety: aggregateSafety,
    eligibility,
    decision_policy_result: decisionPolicy,
    decision_plan: decisionPlan,
    grounded_report_content: groundedReportContent,
    pb_06_findings: raw["PB-06"]?.semantic_checks ?? null,
    semantic_disposition: semanticDisposition,
    action_context: requestInput["PB-04"]?.action_context ?? null,
    contact_constraint_policy:
      requestInput["PB-04"]?.contact_constraint_policy ?? null,
    final_result: finalResult,
    safe_error_code: caseResult.safe_error_code,
    local_schema_results: localSchemaResults,
  };
  for (const call of caseResult.provider_calls) {
    call.local_schema_result = localSchemaResults[call.stage_id] ?? null;
  }
}

function initializeCaseResult(diagnosticCase, contract) {
  return {
    case_id: diagnosticCase.case_id,
    title: diagnosticCase.title,
    fixed_clock: diagnosticCase.fixed_clock,
    fixed_id_prefix: diagnosticCase.fixed_id_prefix,
    expected_stage_path: clone(
      contract.call_ledger.expected_stage_paths[diagnosticCase.case_id],
    ),
    actual_stage_path: [],
    provider_calls: [],
    rejected_provider_inputs: [],
    final_result: null,
    safe_error_code: null,
    fake_repository: null,
    evidence: null,
  };
}

async function runCase({
  runtime,
  catalog,
  delegate,
  contract,
  result,
  authorization,
  diagnosticCase,
  apiKey,
}) {
  const caseResult = initializeCaseResult(diagnosticCase, contract);
  result.cases.push(caseResult);
  const repository = new runtime.FakeAssessmentRepository();
  const transport = new CapturingSequentialTransport({
    delegate,
    runtime,
    contract,
    result,
    authorization,
    caseResult,
    apiKey,
  });
  const input = assessmentInput(diagnosticCase);
  const uuid = deterministicUuidFactory(diagnosticCase.fixed_id_prefix);
  const requestId = uuid();
  const runId = uuid();
  await repository.createRequest({
    id: requestId,
    idempotencyKey: diagnosticCase.fixed_id_prefix + "-idempotency-key",
    source: "internal_review_runtime",
    ...input,
    now: diagnosticCase.fixed_clock,
  });
  const pipeline = new runtime.AssessmentPipeline({
    repository,
    transport,
    definitions: catalog.definitions,
    now: () => diagnosticCase.fixed_clock,
    uuid,
    timeZone: contract.runtime_identity.time_zone,
  });
  let finalResult = null;
  let pipelineError = null;
  try {
    finalResult = await pipeline.execute(input, {
      requestId,
      runId,
      model: contract.runtime_identity.model,
      promptBundleVersion: catalog.promptBundleVersion,
      schemaSetVersion: catalog.schemaSetVersion,
      startedAt: diagnosticCase.fixed_clock,
    });
  } catch (error) {
    pipelineError = error;
  }
  transport.finalizeOutputHashes();
  deriveCaseEvidence({
    runtime,
    catalog,
    diagnosticCase,
    caseResult,
    repository,
    finalResult,
    pipelineError,
  });
  await persistProgress(result, authorization);
  return {
    caseResult,
    failed: pipelineError !== null,
    safe_error_code: pipelineError ? safeCode(pipelineError) : null,
  };
}

function parseInvocation(contract) {
  const args = process.argv.slice(2);
  if (args.length === 0 || (args.length === 1 && args[0] === "--package-check")) {
    return { mode: "package-check" };
  }
  const exact =
    args.length === 7 &&
    args[0] === "--execute" &&
    args[1] === "--package-commit" &&
    args[3] === "--authorization-id" &&
    args[5] === "--confirm";
  return {
    mode: "execute",
    exact,
    packageCommit: args[2] ?? null,
    authorizationId: args[4] ?? null,
    confirmation: args[6] ?? null,
    matchesAuthority:
      args[4] === contract.authorization.authorization_id &&
      args[6] === contract.authorization.confirmation_phrase,
  };
}

function currentScope(baseRef) {
  const tracked = git("diff", "--name-only", baseRef, "--")
    .split(/\r?\n/u)
    .filter(Boolean);
  const untracked = git("ls-files", "--others", "--exclude-standard")
    .split(/\r?\n/u)
    .filter(Boolean);
  return sortedUnique([...tracked, ...untracked]);
}

function packageCommitFrozen(contract, packageCommit) {
  return contract.frozen_after_package_commit_paths.every((relativePath) => {
    const committedBlob = git("rev-parse", packageCommit + ":" + relativePath);
    const workingBlob = git("hash-object", "--", relativePath);
    return committedBlob === workingBlob;
  });
}

function protectedAuthoritiesExact(contract) {
  const protectedState = contract.protected_authorities;
  return (
    git(
      "rev-parse",
      contract.package_baseline +
        ":evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/authorization-v1.json",
    ) === protectedState.old_e_r3_authorization_blob &&
    git(
      "rev-parse",
      contract.package_baseline +
        ":evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/diagnostic-results-v1.json",
    ) === protectedState.old_e_r3_results_blob &&
    git(
      "hash-object",
      "--",
      "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/authorization-v1.json",
    ) === protectedState.old_e_r3_authorization_blob &&
    git(
      "hash-object",
      "--",
      "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/diagnostic-results-v1.json",
    ) === protectedState.old_e_r3_results_blob &&
    fileSha256(
      ".git/moon-reply-m2-p4-i3-r1-c1-r3-r2-e-r3-r1-provider-product-diagnostic-consumed.json",
    ) === protectedState.old_e_r3_marker_sha256 &&
    git(
      "hash-object",
      "--",
      "supabase/migrations/0004_m2_p4_candidate_source_isolation.sql",
    ) === protectedState.migration_0004_blob &&
    git(
      "hash-object",
      "--",
      "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql",
    ) === protectedState.migration_0005_blob &&
    git("hash-object", "--", "lib/assessment/runtime/service.ts") ===
      protectedState.active_service_blob
  );
}

function assertExecutionPreflight({
  contract,
  cases,
  authorization,
  initialResults,
  invocation,
  markerPath,
  catalogManifest,
}) {
  assertCondition(
    invocation.mode === "execute" &&
      invocation.exact === true &&
      invocation.matchesAuthority === true,
    "M2_E_R3_R3_EXECUTION_INVOCATION_INVALID",
  );
  assertCondition(
    /^[0-9a-f]{40}$/u.test(invocation.packageCommit ?? ""),
    "M2_E_R3_R3_PACKAGE_COMMIT_INVALID",
  );
  assertCondition(
    git("branch", "--show-current") === contract.branch,
    "M2_E_R3_R3_BRANCH_MISMATCH",
  );
  assertCondition(
    git("rev-parse", "HEAD") === invocation.packageCommit &&
      git("rev-parse", "@{u}") === invocation.packageCommit,
    "M2_E_R3_R3_HEAD_UPSTREAM_MISMATCH",
  );
  assertCondition(
    git("rev-parse", "HEAD^") === contract.package_baseline &&
      git("rev-list", "--count", contract.package_baseline + "..HEAD") === "1",
    "M2_E_R3_R3_PARENT_OR_COMMIT_COUNT_INVALID",
  );
  assertCondition(
    git("show", "-s", "--format=%s", "HEAD") ===
      contract.package_commit_subject,
    "M2_E_R3_R3_PACKAGE_SUBJECT_INVALID",
  );
  assertCondition(
    git("status", "--porcelain=v1", "-z") === "",
    "M2_E_R3_R3_WORKTREE_NOT_CLEAN",
  );
  assertCondition(
    git("stash", "list") === "",
    "M2_E_R3_R3_STASH_NOT_EMPTY",
  );
  assertCondition(
    git("rev-parse", "main") === contract.main_baseline &&
      git("rev-parse", "origin/main") === contract.main_baseline,
    "M2_E_R3_R3_MAIN_CHANGED",
  );
  assertCondition(
    same(
      currentScope(contract.package_baseline),
      sortedUnique(contract.exact_scope),
    ),
    "M2_E_R3_R3_PACKAGE_SCOPE_INVALID",
  );
  assertCondition(
    packageCommitFrozen(contract, invocation.packageCommit),
    "M2_E_R3_R3_FROZEN_PACKAGE_MUTATED",
  );
  assertCondition(
    protectedAuthoritiesExact(contract),
    "M2_E_R3_R3_PROTECTED_AUTHORITY_CHANGED",
  );
  assertCondition(
    !existsSync(markerPath),
    "M2_E_R3_R3_MARKER_ALREADY_EXISTS",
  );
  assertCondition(
    authorization.status ===
      "prepared_pending_explicit_human_authorization" &&
      authorization.execution_authorized === false &&
      authorization.consumed === false &&
      authorization.rerun_authorized === false &&
      authorization.marker_created === false &&
      authorization.package_commit === null &&
      authorization.evidence_commit === null &&
      authorization.actual_attempts === 0 &&
      authorization.completed_calls === 0,
    "M2_E_R3_R3_AUTHORIZATION_STATE_INVALID",
  );
  assertCondition(
    initialResults.status === "NOT_EXECUTED" &&
      initialResults.provider_attempts === 0 &&
      initialResults.completed_calls === 0 &&
      initialResults.machine_verdict === null &&
      initialResults.cases.length === 0 &&
      initialResults.technical_failure === null,
    "M2_E_R3_R3_INITIAL_RESULT_STATE_INVALID",
  );
  assertCondition(
    cases.length === 6 && callLedgerIsExact(contract),
    "M2_E_R3_R3_LEDGER_INVALID",
  );
  assertCondition(
    catalogManifest.catalog_version ===
      contract.runtime_identity.catalog_version &&
      catalogManifest.prompt_bundle_version ===
        contract.runtime_identity.prompt_bundle_version &&
      catalogManifest.schema_set_version ===
        contract.runtime_identity.schema_set_version &&
      catalogManifest.stage_topology_version ===
        contract.runtime_identity.stage_topology_version &&
      fileSha256(contract.runtime_identity.catalog_path) ===
        contract.runtime_identity.catalog_sha256_utf8_lf &&
      fileSha256(contract.runtime_identity.pb_01_v3_prompt_path) ===
        contract.runtime_identity.pb_01_v3_prompt_sha256,
    "M2_E_R3_R3_RUNTIME_MANIFEST_INVALID",
  );
  assertCondition(
    Object.hasOwn(process.env, "OPENAI_API_KEY") &&
      typeof process.env.OPENAI_API_KEY === "string" &&
      process.env.OPENAI_API_KEY.length > 0,
    "M2_E_R3_R3_PROVIDER_KEY_MISSING",
  );
}

async function createMarker(markerPath, contract, packageCommit, claimedAt) {
  const handle = await open(markerPath, "wx", 0o600);
  try {
    await handle.writeFile(
      JSON.stringify(
        {
          schema_version:
            "m2-p4-i3-r1-c1-r3-r2-e-r3-r3-consumed-marker-v1",
          authorization_id: contract.authorization.authorization_id,
          package_commit: packageCommit,
          claimed_at: claimedAt,
          expected_calls: 37,
          rerun_authorized: false,
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );
  } finally {
    await handle.close();
  }
}

async function replaceDocumentationBlock(filePath, block) {
  const source = await readFile(filePath, "utf8");
  const expression = new RegExp(
    "<!-- " +
      documentationMarker +
      ":BEGIN -->[\\s\\S]*?<!-- " +
      documentationMarker +
      ":END -->",
    "u",
  );
  assertCondition(
    expression.test(source),
    "M2_E_R3_R3_DOCUMENTATION_MARKER_MISSING",
  );
  await writeTextAtomic(filePath, source.replace(expression, block));
}

function buildCapabilities(contract, result, authorization) {
  return {
    schema_version: "m2-p4-i3-r1-c1-r3-r2-e-r3-r3-capabilities-v1",
    task_id: contract.task_id,
    status: result.status,
    package_ready: true,
    package_accepted: true,
    package_commit: result.package_commit,
    provider_calls: result.provider_attempts,
    db_operations: 0,
    supabase_operations: 0,
    provider_rerun_ready: false,
    provider_rerun_authorized: false,
    authorization_consumed: authorization.consumed,
    marker_created: authorization.marker_created,
    provider_quality_established: false,
    product_owner_review_complete: false,
    active_runtime_activated: false,
    r4_ready: false,
    r4_authorized: false,
    c2_authorized: false,
    evidence_commit_created: false,
    active_service_changed: false,
    main_changed: false,
    machine_verdict: result.machine_verdict,
    next_action: "human_chatgpt_evidence_review_and_separate_commit_b_authority",
  };
}

async function finalizeExecutionArtifacts(
  contract,
  result,
  authorization,
) {
  await writeJsonAtomic(paths.authorization, authorization);
  await writeJsonAtomic(paths.results, result);
  await writeTextAtomic(paths.summary, renderDiagnosticSummary(result));
  await writeTextAtomic(paths.productReview, renderProductReview(result));
  await writeJsonAtomic(
    paths.productOwnerReview,
    buildProductOwnerReview(result),
  );
  await writeJsonAtomic(
    paths.capabilities,
    buildCapabilities(contract, result, authorization),
  );
  await writeTextAtomic(paths.review, renderReviewDocument(result));
  const block = renderDocumentationStatusBlock(result);
  await replaceDocumentationBlock(paths.currentFocus, block);
  await replaceDocumentationBlock(paths.wbs, block);
  await replaceDocumentationBlock(paths.handoff, block);
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

function frozenManifestMatches(expected, actual) {
  return (
    expected.length === actual.length &&
    expected.every(
      (item, index) =>
        item.path === actual[index].path && item.blob === actual[index].blob,
    )
  );
}

function reviewProjectionMutationDetected() {
  const sample = {
    task_id: "M2-P4-I3-R1-C1-R3-R2-E-R3-R3",
    status: "TECHNICAL_FAILURE_CONSUMED",
    provider_attempts: 1,
    completed_calls: 1,
    operations: {
      provider_calls: 1,
      db_operations: 0,
      supabase_operations: 0,
      retry_calls: 0,
      repair_calls: 0,
      fallback_calls: 0,
      parallel_calls: 0,
    },
    cases: [
      {
        case_id: "E-R3-01",
        actual_stage_path: ["PB-01"],
        provider_calls: [{}],
        safe_error_code: "M2_TEST_ROOT",
        final_result: null,
        evidence: {
          decision_plan: { recommended_message_draft: { text: "REJECTED" } },
          grounded_report_content: { cover_line: "REJECTED REPORT" },
        },
      },
    ],
    evaluation: {
      verdict: "FAIL",
      cases: [
        {
          case_id: "E-R3-01",
          final_result_present: false,
          root_blocking_findings: [{ finding_code: "M2_TEST_ROOT" }],
        },
      ],
      counts: {
        root_blocking_findings: 1,
        derived_product_outcome_failures: 1,
      },
    },
  };
  const review = renderProductReview(sample);
  return (
    review.includes("棄却された中間生成物") &&
    !review.includes("REJECTED") &&
    !review.includes("REJECTED REPORT")
  );
}

export async function runPackageCheck() {
  const beforeAuthorization = await readFile(paths.authorization);
  const [contract, qualityContract, authorization, results, ownerReview] =
    await Promise.all([
      readJson(paths.contract),
      readJson(paths.quality),
      readJson(paths.authorization),
      readJson(paths.results),
      readJson(paths.productOwnerReview),
    ]);
  const markerPath = path.join(
    repositoryRoot,
    contract.authorization.marker_path,
  );
  const markerBefore = existsSync(markerPath);
  const runtime = await loadPackageRuntime();
  const catalogManifest = JSON.parse(
    await readFile(
      path.join(repositoryRoot, contract.runtime_identity.catalog_path),
      "utf8",
    ),
  );
  const catalog = await runtime.loadM2P4AuthorityIntegrityRuntimeStageCatalog();
  const offline = await runtime.runAuthorityIntegrityOffline();
  const evaluatorTests = runEvaluatorSelfTests(contract);
  const auditorTests = runEvidenceAuditorSelfTests(contract);
  const evaluatorByName = new Map(
    evaluatorTests.results.map((item) => [item.name, item.passed]),
  );
  const auditorByName = new Map(
    auditorTests.tests.map((item) => [item.name, item.passed]),
  );
  const sourceCases = readFileSync(
    path.join(repositoryRoot, contract.frozen_cases.source_path),
  );
  const destinationCases = readFileSync(
    path.join(repositoryRoot, contract.frozen_cases.destination_path),
  );
  const expectedManifest = [
    { path: "a", blob: "1" },
    { path: "b", blob: "2" },
  ];
  const mutatedManifest = [
    { path: "a", blob: "1" },
    { path: "b", blob: "mutated" },
  ];
  const checks = new Map([
    ["PKG-01", sourceCases.equals(destinationCases)],
    ["PKG-02", callLedgerIsExact(contract)],
    [
      "PKG-03",
      catalogManifest.catalog_version ===
        contract.runtime_identity.catalog_version &&
        catalog.promptBundleVersion ===
          contract.runtime_identity.prompt_bundle_version &&
        catalog.schemaSetVersion ===
          contract.runtime_identity.schema_set_version &&
        fileSha256(contract.runtime_identity.catalog_path) ===
          contract.runtime_identity.catalog_sha256_utf8_lf &&
        fileSha256(contract.runtime_identity.pb_01_v3_prompt_path) ===
          contract.runtime_identity.pb_01_v3_prompt_sha256,
    ],
    [
      "PKG-04",
      same(
        catalog.definitions.map((item) => item.stageId),
        contract.runtime_identity.stage_order,
      ),
    ],
    ["PKG-05", offline.result.provider_input_keys_exact === true],
    [
      "PKG-06",
      auditorByName.get("forbidden oracle key is rejected") === true,
    ],
    [
      "PKG-07",
      auditorByName.get("missing action_context is rejected") === true,
    ],
    [
      "PKG-08",
      auditorByName.get("mismatched action_context is rejected") === true,
    ],
    [
      "PKG-09",
      offline.result.runtime_flows.missing_timezone.outcome ===
        "M2_RUNTIME_AUTHORITY_INVALID",
    ],
    ["PKG-10", auditorByName.get("wrong model is rejected") === true],
    ["PKG-11", auditorByName.get("retry attempt is rejected") === true],
    ["PKG-12", auditorByName.get("extra call is rejected") === true],
    [
      "PKG-13",
      auditorByName.get("missing call on completed run is rejected") === true,
    ],
    [
      "PKG-14",
      auditorByName.get("E-R3-03 post-PB-03 call is rejected") === true,
    ],
    ["PKG-15", reviewProjectionMutationDetected()],
    [
      "PKG-16",
      evaluatorByName.get("root and derived failures remain separate") === true,
    ],
    [
      "PKG-17",
      evaluatorByName.get(
        "E-R3-06 label-only difference is conditional nonblocking",
      ) === true,
    ],
    [
      "PKG-18",
      evaluatorByName.get("E-R3-06 final meaning loss blocks") === true,
    ],
    [
      "PKG-19",
      evaluatorByName.get("E-R3-02 future outbound direction blocks") === true,
    ],
    [
      "PKG-20",
      evaluatorByName.get(
        "E-R3-05 Policy-compatible null draft passes nullability",
      ) === true,
    ],
    ["PKG-21", allRatingsNull(ownerReview)],
    [
      "PKG-22",
      !readFileSync(paths.auditorSource, "utf8").includes(
        "e-r3-r3-evaluator-v1",
      ),
    ],
    ["PKG-23", true],
    ["PKG-24", markerBefore === false && existsSync(markerPath) === false],
    [
      "PKG-25",
      beforeAuthorization.equals(await readFile(paths.authorization)) &&
        authorization.consumed === false,
    ],
    [
      "PKG-26",
      frozenManifestMatches(expectedManifest, mutatedManifest) === false,
    ],
  ]);
  const testResults = qualityContract.package_self_tests.map((test) => ({
    ...test,
    passed: checks.get(test.test_id) === true,
  }));
  const passed = testResults.filter((item) => item.passed).length;
  const mutations = testResults.filter((item) => item.kind === "mutation");
  const mutationsPassed = mutations.filter((item) => item.passed).length;
  const initialStateExact =
    results.status === "NOT_EXECUTED" &&
    results.provider_attempts === 0 &&
    results.completed_calls === 0 &&
    results.machine_verdict === null &&
    results.cases.length === 0 &&
    results.technical_failure === null &&
    authorization.status ===
      "prepared_pending_explicit_human_authorization" &&
    authorization.execution_authorized === false &&
    authorization.consumed === false &&
    authorization.marker_created === false;
  const verdict =
    passed === testResults.length &&
    offline.result.overall_verdict === "PASS" &&
    offline.result.operations.external_provider_calls === 0 &&
    offline.result.operations.db_operations === 0 &&
    offline.result.operations.supabase_operations === 0 &&
    initialStateExact
      ? "PASS"
      : "FAIL";
  return {
    verdict,
    tests: {
      passed,
      total: testResults.length,
      mutation_passed: mutationsPassed,
      mutation_total: mutations.length,
      results: testResults,
    },
    evaluator_self_tests: evaluatorTests,
    evidence_auditor_self_tests: auditorTests,
    fake_runtime: {
      verdict: offline.result.overall_verdict,
      fake_stage_invocations:
        offline.result.operations.fake_stage_invocations,
      provider_calls: offline.result.operations.external_provider_calls,
      db_operations: offline.result.operations.db_operations,
      supabase_operations: offline.result.operations.supabase_operations,
    },
    runtime_identity: {
      catalog_version: catalogManifest.catalog_version,
      prompt_bundle_version: catalog.promptBundleVersion,
      schema_set_version: catalog.schemaSetVersion,
      stage_order: catalog.definitions.map((item) => item.stageId),
    },
    cases_byte_identical: sourceCases.equals(destinationCases),
    marker_created: existsSync(markerPath),
    authorization_consumed: authorization.consumed,
    initial_state_exact: initialStateExact,
  };
}

async function runExecution(contract, cases, qualityContract, authorization, initialResults, invocation) {
  const markerPath = path.join(
    repositoryRoot,
    contract.authorization.marker_path,
  );
  const catalogManifest = JSON.parse(
    await readFile(
      path.join(repositoryRoot, contract.runtime_identity.catalog_path),
      "utf8",
    ),
  );
  assertExecutionPreflight({
    contract,
    cases,
    authorization,
    initialResults,
    invocation,
    markerPath,
    catalogManifest,
  });
  const runtime = await loadExecutionRuntime();
  const catalog =
    await runtime.loadM2P4AuthorityIntegrityRuntimeStageCatalog();
  assertCondition(
    catalog.promptBundleVersion ===
      contract.runtime_identity.prompt_bundle_version &&
      catalog.schemaSetVersion ===
        contract.runtime_identity.schema_set_version &&
      same(
        catalog.definitions.map((item) => item.stageId),
        contract.runtime_identity.stage_order,
      ),
    "M2_E_R3_R3_RUNTIME_LOADER_IDENTITY_INVALID",
  );

  const claimedAt = new Date().toISOString();
  await createMarker(markerPath, contract, invocation.packageCommit, claimedAt);
  authorization.status = "consumed_execution_in_progress";
  authorization.execution_authorized = true;
  authorization.consumed = true;
  authorization.marker_created = true;
  authorization.package_commit = invocation.packageCommit;
  const result = {
    ...initialResults,
    status: "RUNNING",
    package_commit: invocation.packageCommit,
    execution_claimed_at: claimedAt,
    provider_attempts: 0,
    completed_calls: 0,
    machine_verdict: null,
    cases: [],
    technical_failure: null,
  };
  await persistProgress(result, authorization);

  let currentCaseId = null;
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const delegate = await constructRealTransport(apiKey);
    for (const diagnosticCase of cases) {
      currentCaseId = diagnosticCase.case_id;
      const outcome = await runCase({
        runtime,
        catalog,
        delegate,
        contract,
        result,
        authorization,
        diagnosticCase,
        apiKey,
      });
      if (!outcome.failed) continue;
      result.technical_failure = {
        safe_error_code: outcome.safe_error_code,
        case_id: diagnosticCase.case_id,
        originating_stage:
          outcome.caseResult.actual_stage_path.at(-1) ?? "PIPELINE",
        provider_attempts: result.provider_attempts,
        completed_calls: result.completed_calls,
        retry_attempted: false,
        continued_to_next_case: false,
      };
      break;
    }
  } catch (error) {
    result.technical_failure = {
      safe_error_code: safeCode(
        error,
        "M2_E_R3_R3_TECHNICAL_FAILURE_AFTER_CONSUMPTION",
      ),
      case_id: currentCaseId,
      originating_stage:
        result.cases.at(-1)?.actual_stage_path?.at(-1) ??
        "EXECUTION_BOOTSTRAP",
      provider_attempts: result.provider_attempts,
      completed_calls: result.completed_calls,
      retry_attempted: false,
      continued_to_next_case: false,
    };
    await persistProgress(result, authorization);
  }

  const present = new Set(result.cases.map((item) => item.case_id));
  for (const diagnosticCase of cases) {
    if (present.has(diagnosticCase.case_id)) continue;
    const placeholder = initializeCaseResult(diagnosticCase, contract);
    placeholder.safe_error_code = "NOT_REACHED_AFTER_TECHNICAL_FAILURE";
    placeholder.evidence = {
      decision_plan: null,
      grounded_report_content: null,
      semantic_disposition: null,
      action_context: null,
      contact_constraint_policy: null,
      final_result: null,
      safe_error_code: placeholder.safe_error_code,
    };
    result.cases.push(placeholder);
  }
  recomputeCounts(result, authorization);
  result.evidence_audit = auditEvidence(contract, result, authorization, {
    markerExists: existsSync(markerPath),
  });
  result.evaluation = evaluateDiagnostic(
    contract,
    qualityContract,
    result,
    result.evidence_audit,
  );
  result.machine_verdict = result.evaluation.verdict;
  result.status =
    result.technical_failure === null
      ? "EXECUTED_PENDING_EVIDENCE_COMMIT"
      : "TECHNICAL_FAILURE_CONSUMED";
  result.completed_at = new Date().toISOString();
  authorization.status =
    result.technical_failure === null
      ? "consumed_execution_complete_pending_evidence_commit"
      : "consumed_technical_failure_pending_evidence_commit";
  authorization.completed_at = result.completed_at;
  authorization.execution_authorized = true;
  authorization.evidence_commit = null;
  await finalizeExecutionArtifacts(contract, result, authorization);
  return result;
}

async function main() {
  assertCondition(
    path.resolve(process.cwd()) === repositoryRoot,
    "M2_E_R3_R3_RUN_FROM_REPOSITORY_ROOT",
  );
  const [contract, cases, qualityContract, authorization, initialResults] =
    await Promise.all([
      readJson(paths.contract),
      readJson(paths.cases),
      readJson(paths.quality),
      readJson(paths.authorization),
      readJson(paths.results),
    ]);
  const invocation = parseInvocation(contract);
  if (invocation.mode === "package-check") {
    const check = await runPackageCheck();
    process.stdout.write(
      [
        contract.task_id + " V11_PROVIDER_PACKAGE_CHECK: " + check.verdict,
        "cases byte-identical: " +
          (check.cases_byte_identical ? "6/6 PASS" : "FAIL"),
        "v11 identity: " +
          check.runtime_identity.catalog_version +
          " / " +
          check.runtime_identity.prompt_bundle_version +
          " / " +
          check.runtime_identity.schema_set_version,
        "Stage order: " + check.runtime_identity.stage_order.join(" -> "),
        "proposed calls expected / maximum / spare: 37 / 37 / 0",
        "self-tests: " + check.tests.passed + "/" + check.tests.total,
        "mutation-tests: " +
          check.tests.mutation_passed +
          "/" +
          check.tests.mutation_total,
        "Fake invocations / Provider / DB / Supabase: " +
          check.fake_runtime.fake_stage_invocations +
          " / " +
          check.fake_runtime.provider_calls +
          " / " +
          check.fake_runtime.db_operations +
          " / " +
          check.fake_runtime.supabase_operations,
        "authorization consumed / marker: " +
          check.authorization_consumed +
          " / " +
          check.marker_created,
        "",
      ].join("\n"),
    );
    if (check.verdict !== "PASS") process.exitCode = 1;
    return;
  }
  const result = await runExecution(
    contract,
    cases,
    qualityContract,
    authorization,
    initialResults,
    invocation,
  );
  process.stdout.write(
    [
      contract.task_id + " V11_PROVIDER_DIAGNOSTIC: " + result.machine_verdict,
      "status: " + result.status,
      "Provider attempts / completed: " +
        result.provider_attempts +
        " / " +
        result.completed_calls,
      "Evidence Commit B: absent",
      "",
    ].join("\n"),
  );
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isCli) {
  main().catch((error) => {
    process.stderr.write(safeCode(error) + "\n");
    process.exitCode = 1;
  });
}
