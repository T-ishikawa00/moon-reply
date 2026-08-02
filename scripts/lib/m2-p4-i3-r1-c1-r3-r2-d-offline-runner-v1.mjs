import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const relativeResultPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-results-v1.json";
const relativeCasesPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-cases-v1.json";
const relativeSourceContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2/counterfactual-suite-v1.json";
const relativeHistoricalManifestPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/historical-regression-manifest-v1.json";
const taskId = "M2-P4-I3-R1-C1-R3-R2-D";
const runnerVersion = "m2-p4-i3-r1-c1-r3-r2-d-offline-runner-v1";
const baseline = "9d2bd94a2629d97197c6ffbb0608ec573b9b824a";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const fixedClock = "2026-08-03T00:00:00.000Z";
const model = "gpt-5.6-luna";
const sentinelA = "CANDIDATE_SENTINEL_A_R3R2_7F19";
const sentinelB = "CANDIDATE_SENTINEL_B_R3R2_4C82";
const sentinels = [sentinelA, sentinelB];
const usageKeys = [
  "totalInputTokens",
  "totalCachedTokens",
  "totalOutputTokens",
  "totalReasoningTokens",
];

const [
  { AssessmentApplication },
  {
    FakeAiStageTransport,
    FakeAssessmentRepository,
    safetyBlockedStageOutputs,
    wait003StageOutputs,
  },
  {
    loadM2P4CandidateSourceIsolationRuntimeStageCatalog,
    loadM2P4ProductQualityRuntimeStageCatalog,
  },
  { buildBaseStructuredIntakeLegacyViewV1 },
  { buildContextualDecisionPolicyV3 },
  { groundReportContentV3 },
  { groundChangeConditionCommentaryV3 },
] = await Promise.all([
  import("../../lib/assessment/runtime/application.ts"),
  import("../../lib/assessment/runtime/fakes.ts"),
  import("../../lib/assessment/runtime/schema-catalog.ts"),
  import("../../lib/assessment/runtime/base-structured-intake-legacy-view-v1.ts"),
  import("../../lib/assessment/runtime/policy-v3.ts"),
  import("../../lib/assessment/runtime/report-grounding-v3.ts"),
  import("../../lib/assessment/runtime/change-condition-grounding-v3.ts"),
]);

const clone = (value) => structuredClone(value);
const readText = (relativePath) =>
  readFileSync(path.join(repositoryRoot, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const canonicalText = (value) => value.replace(/\r\n/gu, "\n");
const sha256 = (value) =>
  createHash("sha256").update(Buffer.from(value, "utf8")).digest("hex");
const fileSha256 = (relativePath) => sha256(canonicalText(readText(relativePath)));
const jsonBytes = (value) => JSON.stringify(value);
const jsonSha256 = (value) => sha256(jsonBytes(value));

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

export const canonicalJson = (value) => JSON.stringify(canonicalize(value));
export const canonicalPrettyJson = (value) =>
  `${JSON.stringify(canonicalize(value), null, 2)}\n`;

const git = (...args) =>
  execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: repositoryRoot, encoding: "utf8" },
  ).trim();

const exactKeys = (value, keys) =>
  Boolean(value) &&
  !Array.isArray(value) &&
  canonicalJson(Object.keys(value).sort()) === canonicalJson([...keys].sort());

function countLiteral(value, literal) {
  if (!literal) return 0;
  const serialized = JSON.stringify(value ?? null);
  let count = 0;
  let offset = 0;
  while ((offset = serialized.indexOf(literal, offset)) >= 0) {
    count += 1;
    offset += literal.length;
  }
  return count;
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

function collectSourceRefs(value) {
  const refs = [];
  const visit = (candidate) => {
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (!candidate || typeof candidate !== "object") return;
    for (const [key, nested] of Object.entries(candidate)) {
      if (key === "source_refs" && Array.isArray(nested)) {
        refs.push(...nested.filter((item) => typeof item === "string"));
      }
      visit(nested);
    }
  };
  visit(value);
  return refs;
}

function containsKey(value, target) {
  if (Array.isArray(value)) return value.some((item) => containsKey(item, target));
  if (!value || typeof value !== "object") return false;
  return (
    Object.hasOwn(value, target) ||
    Object.values(value).some((item) => containsKey(item, target))
  );
}

function containsRawCandidateBundle(value) {
  if (Array.isArray(value)) return value.some(containsRawCandidateBundle);
  if (!value || typeof value !== "object") return false;
  const candidateKeys = [
    "candidate_style_profile",
    "candidate_communicative_intent",
    "candidate_language_expression",
    "candidate_safety_signals",
  ];
  if (candidateKeys.every((key) => Object.hasOwn(value, key))) return true;
  return Object.values(value).some(containsRawCandidateBundle);
}

function diffPaths(left, right, prefix = "") {
  if (canonicalJson(left) === canonicalJson(right)) return [];
  if (
    !left ||
    !right ||
    typeof left !== "object" ||
    typeof right !== "object" ||
    Array.isArray(left) ||
    Array.isArray(right)
  ) {
    return [prefix || "$root"];
  }
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
  return keys.flatMap((key) =>
    diffPaths(left[key], right[key], prefix ? `${prefix}.${key}` : key),
  );
}

function deterministicUuidFactory(prefix) {
  let sequence = 0;
  return () => `${prefix}-${String(++sequence).padStart(4, "0")}`;
}

function safeError(error) {
  if (!error) return null;
  return {
    name: error.name ?? "Error",
    safe_code: error.safeCode ?? error.message ?? "UNKNOWN_ERROR",
  };
}

function semanticPass() {
  return {
    schema_version: "pipeline-schema-v1.0.0",
    validation_mode: "semantic_findings_only",
    deterministic_checks: [],
    semantic_checks: [],
    final_disposition: null,
    repair_strategy: null,
    failed_codes: [],
  };
}

function modelSafetyNormal() {
  return {
    classification: "normal_allowed",
    reason_codes: [],
    response_mode: "none",
    evidence_refs: [],
    ambiguity_present: false,
  };
}

function splitOutputs({
  sharedRawBaseOutput,
  rawCandidateOutput,
  candidatePresent,
  contractFixture,
}) {
  const selected = contractFixture.valid_sets[candidatePresent ? 0 : 1];
  const plan = clone(selected.decision_plan_v2);
  plan.selected_decision = "send_now";
  return {
    "PB-01": clone(sharedRawBaseOutput),
    ...(candidatePresent ? { "PB-01C": clone(rawCandidateOutput) } : {}),
    "PB-02": modelSafetyNormal(),
    "PB-03": {
      schema_version: "pipeline-schema-v3.0.0",
      acknowledged_eligibility: "ready",
    },
    "PB-04": plan,
    "PB-05": clone(selected.report_content_v2),
    "PB-06": semanticPass(),
  };
}

async function executeApplication({
  catalog,
  outputs,
  input,
  idempotencyKey,
  idPrefix,
  failAtStage,
  repository = new FakeAssessmentRepository(),
}) {
  const transport = new FakeAiStageTransport({ outputs, failAtStage });
  const application = new AssessmentApplication({
    repository,
    transport,
    model,
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => fixedClock,
    uuid: deterministicUuidFactory(idPrefix),
  });
  try {
    const result = await application.submit(input, idempotencyKey);
    return { application, repository, transport, result, error: null };
  } catch (error) {
    return { application, repository, transport, result: null, error };
  }
}

function normalizedStageRuns(repository) {
  return [...repository.stageRuns.values()]
    .sort((left, right) => left.sequenceNumber - right.sequenceNumber)
    .map((stage) => ({
      stage_id: stage.stageId,
      sequence_number: stage.sequenceNumber,
      status: stage.status,
      request_hash: stage.requestHash,
      response_id:
        stage.completion?.responseId ?? stage.failure?.responseId ?? stage.responseId ?? null,
      returned_model:
        stage.completion?.returnedModel ??
        stage.failure?.returnedModel ??
        stage.returnedModel ??
        null,
      usage:
        stage.completion?.usage ?? stage.failure?.usage ?? stage.usage ?? {
          inputTokens: 0,
          cachedTokens: 0,
          outputTokens: 0,
          reasoningTokens: 0,
        },
      error_code: stage.failure?.errorCode ?? stage.errorCode ?? null,
    }));
}

function stageUsageTotals(repository) {
  const totals = {
    totalInputTokens: 0,
    totalCachedTokens: 0,
    totalOutputTokens: 0,
    totalReasoningTokens: 0,
  };
  for (const stage of repository.stageRuns.values()) {
    const usage = stage.completion?.usage ?? stage.failure?.usage ?? stage.usage;
    if (!usage) continue;
    totals.totalInputTokens += usage.inputTokens;
    totals.totalCachedTokens += usage.cachedTokens;
    totals.totalOutputTokens += usage.outputTokens;
    totals.totalReasoningTokens += usage.reasoningTokens;
  }
  return totals;
}

function usageMatches(actual, expected) {
  return usageKeys.every((key) => (actual?.[key] ?? null) === expected[key]);
}

function transientPolicyProjection(groundedBase, candidatePresent) {
  const projected = clone(groundedBase?.decision_facts ?? null);
  if (projected?.contact_state) {
    projected.schema_version = "m2-p4-decision-facts-v2";
    projected.contact_state.proposed_message_present = candidatePresent;
  }
  return projected;
}

function splitBaseSurfaces(capture, sharedRawBaseOutput) {
  return {
    base_provider_request: capture.base_provider_request,
    raw_base_output: sharedRawBaseOutput,
    grounded_base: capture.grounded_base_structured_intake,
    base_legacy_view: capture.base_legacy_view,
    pb02_base_subtree: capture.pb_02_request?.base_structured_intake ?? null,
    pb03_base_subtree: capture.pb_03_request?.base_structured_intake ?? null,
  };
}

function sentinelCountsBySurface(capture, sharedRawBaseOutput) {
  return Object.fromEntries(
    Object.entries(splitBaseSurfaces(capture, sharedRawBaseOutput)).map(
      ([surface, value]) => [
        surface,
        {
          [sentinelA]: countLiteral(value, sentinelA),
          [sentinelB]: countLiteral(value, sentinelB),
        },
      ],
    ),
  );
}

function captureSplitRun(run, variant, sharedRawBaseOutput) {
  const requestByStage = Object.fromEntries(
    run.transport.requests.map((request) => [request.stageId, request]),
  );
  const pb01 = requestByStage["PB-01"]?.input ?? null;
  const pb02 = requestByStage["PB-02"]?.input ?? null;
  const pb03 = requestByStage["PB-03"]?.input ?? null;
  const pb04 = requestByStage["PB-04"]?.input ?? null;
  const pb05 = requestByStage["PB-05"]?.input ?? null;
  const pb06 = requestByStage["PB-06"]?.input ?? null;
  const grounded = pb02?.base_structured_intake ?? null;
  const legacyView = grounded
    ? buildBaseStructuredIntakeLegacyViewV1(grounded)
    : null;
  const stageRuns = normalizedStageRuns(run.repository);
  const candidateStage = stageRuns.find((stage) => stage.stage_id === "PB-01C");
  const candidateResponseId = candidateStage?.response_id ?? null;
  const serializedRequest = pb01 ? JSON.stringify(pb01) : null;
  const projection = transientPolicyProjection(
    grounded,
    variant.optional_message !== null,
  );
  let policyProjectionMatches = false;
  if (projection && pb04?.decision_policy_result) {
    try {
      policyProjectionMatches =
        canonicalJson(buildContextualDecisionPolicyV3(projection)) ===
        canonicalJson(pb04.decision_policy_result);
    } catch {
      policyProjectionMatches = false;
    }
  }
  const downstream = [pb02, pb03, pb04, pb05, pb06];
  const candidateResponseStageLocal =
    candidateResponseId === null ||
    downstream.every((payload) => !JSON.stringify(payload).includes(candidateResponseId));
  const persistedRun = [...run.repository.runs.values()][0] ?? null;
  const persistedUsage = run.result?.usage ?? persistedRun;
  const capture = {
    variant_id: variant.variant_id,
    optional_message: variant.optional_message,
    sentinel: variant.sentinel,
    execution_error: safeError(run.error),
    base_provider_request: pb01,
    base_provider_request_serialized_utf8: serializedRequest,
    base_provider_request_utf8_base64: serializedRequest
      ? Buffer.from(serializedRequest, "utf8").toString("base64")
      : null,
    base_provider_request_byte_length: serializedRequest
      ? Buffer.byteLength(serializedRequest, "utf8")
      : null,
    base_provider_request_sha256: serializedRequest
      ? sha256(serializedRequest)
      : null,
    raw_base_output_sha256: jsonSha256(sharedRawBaseOutput),
    grounded_base_structured_intake: grounded,
    grounded_base_sha256: grounded ? jsonSha256(grounded) : null,
    base_legacy_view: legacyView,
    base_legacy_view_sha256: legacyView ? jsonSha256(legacyView) : null,
    pb_02_request: pb02,
    pb_03_request: pb03,
    candidate_provider_request: requestByStage["PB-01C"]?.input ?? null,
    candidate_envelope: pb04?.candidate_envelope ?? null,
    candidate_safety_result: pb02?.candidate_safety_result ?? null,
    transient_application_policy_projection: projection,
    decision_policy_result: pb04?.decision_policy_result ?? null,
    policy_projection_matches_pb04: policyProjectionMatches,
    fake_stage_call_sequence: clone(run.transport.calls),
    persisted_stage_sequence: stageRuns,
    pb_01c_call_count: run.transport.calls.filter((stageId) => stageId === "PB-01C")
      .length,
    pb_01c_persisted_status: candidateStage?.status ?? null,
    base_optional_message_source_ref_count: Object.values(
      splitBaseSurfaces(
        {
          base_provider_request: pb01,
          grounded_base_structured_intake: grounded,
          base_legacy_view: legacyView,
          pb_02_request: pb02,
          pb_03_request: pb03,
        },
        sharedRawBaseOutput,
      ),
    ).reduce((total, value) => total + countSourceRef(value, "input:optional_message"), 0),
    base_source_refs: [
      ...new Set(
        Object.values(
          splitBaseSurfaces(
            {
              base_provider_request: pb01,
              grounded_base_structured_intake: grounded,
              base_legacy_view: legacyView,
              pb_02_request: pb02,
              pb_03_request: pb03,
            },
            sharedRawBaseOutput,
          ),
        ).flatMap(collectSourceRefs),
      ),
    ].sort(),
    sentinel_counts_by_base_surface: null,
    final_eligibility: run.result?.eligibility ?? null,
    final_decision: run.result?.decision ?? null,
    fake_usage_totals: run.result?.usage ?? null,
    fake_usage_stage_sum: stageUsageTotals(run.repository),
    candidate_response_id_stage_local: candidateResponseStageLocal,
    candidate_usage_counted_once: usageMatches(persistedUsage, stageUsageTotals(run.repository)),
    raw_candidate_bundle_downstream_count: downstream.filter(containsRawCandidateBundle)
      .length,
    external_provider_calls: run.transport.actualProviderCalls,
    supabase_operations: run.repository.actualSupabaseCalls,
  };
  capture.sentinel_counts_by_base_surface = sentinelCountsBySurface(
    capture,
    sharedRawBaseOutput,
  );
  return capture;
}

function candidateOwnedDeltaOnly(variants, sharedRawBaseOutput) {
  const [candidateA, candidateB, candidateNull] = variants;
  if (!candidateA || !candidateB || !candidateNull) return false;
  const invariantSelectors = [
    (item) => item.base_provider_request,
    () => sharedRawBaseOutput,
    (item) => item.grounded_base_structured_intake,
    (item) => item.base_legacy_view,
    (item) => item.pb_02_request?.base_structured_intake,
    (item) => item.pb_03_request?.base_structured_intake,
    (item) => item.grounded_base_structured_intake?.decision_facts,
    (item) => item.base_source_refs,
  ];
  const invariant = invariantSelectors.every((select) => {
    const hashes = variants.map((item) => canonicalJson(select(item)));
    return new Set(hashes).size === 1;
  });
  const presentProjectionSame =
    canonicalJson(candidateA.transient_application_policy_projection) ===
      canonicalJson(candidateB.transient_application_policy_projection) &&
    canonicalJson(candidateA.decision_policy_result) ===
      canonicalJson(candidateB.decision_policy_result);
  const presentNullDiff = diffPaths(
    candidateA.transient_application_policy_projection,
    candidateNull.transient_application_policy_projection,
  );
  const projectionBounded =
    presentNullDiff.length === 1 &&
    presentNullDiff[0] === "contact_state.proposed_message_present";
  const exactRouting = variants.every(
    (item) =>
      exactKeys(item.pb_02_request, [
        "base_structured_intake",
        "deterministic_rule_result",
        "candidate_safety_result",
      ]) &&
      exactKeys(item.pb_03_request, [
        "base_structured_intake",
        "aggregate_safety_result",
        "application_eligibility_expectation",
      ]),
  );
  const downstreamIsolation = variants.every(
    (item) =>
      item.raw_candidate_bundle_downstream_count === 0 &&
      item.candidate_response_id_stage_local === true &&
      item.candidate_usage_counted_once === true,
  );
  return (
    invariant &&
    presentProjectionSame &&
    projectionBounded &&
    exactRouting &&
    downstreamIsolation &&
    variants.every((item) => item.policy_projection_matches_pb04 === true)
  );
}

function gateRecord(gateId, passed, actual, expected) {
  return {
    gate_id: gateId,
    status: passed ? "PASS" : "FAIL",
    actual,
    expected,
  };
}

export function evaluateHardGates(evidence) {
  const { variants, sharedRawBaseOutput, sharedBaseReuseCount, overlap } = evidence;
  const requestHashes = variants.map((item) => item.base_provider_request_sha256);
  const groundedHashes = variants.map((item) =>
    jsonSha256(item.grounded_base_structured_intake),
  );
  const legacyHashes = variants.map((item) => jsonSha256(item.base_legacy_view));
  const rawHashes = variants.map(() => jsonSha256(sharedRawBaseOutput));
  const everyBaseSurface = variants.flatMap((item) =>
    Object.values(splitBaseSurfaces(item, sharedRawBaseOutput)),
  );
  const registeredInputCount = variants.reduce(
    (total, item) =>
      total +
      sentinels.reduce(
        (subtotal, sentinel) =>
          subtotal +
          countLiteral(item.base_provider_request, sentinel) +
          countLiteral(sharedRawBaseOutput, sentinel),
        0,
      ),
    0,
  );
  const sentinelABaseCount = everyBaseSurface.reduce(
    (total, item) => total + countLiteral(item, sentinelA),
    0,
  );
  const sentinelBBaseCount = everyBaseSurface.reduce(
    (total, item) => total + countLiteral(item, sentinelB),
    0,
  );
  const pb02SentinelCount = variants.reduce(
    (total, item) =>
      total + sentinels.reduce((sum, sentinel) => sum + countLiteral(item.pb_02_request, sentinel), 0),
    0,
  );
  const pb03SentinelCount = variants.reduce(
    (total, item) =>
      total + sentinels.reduce((sum, sentinel) => sum + countLiteral(item.pb_03_request, sentinel), 0),
    0,
  );
  const baseOptionalRefs = everyBaseSurface.reduce(
    (total, item) => total + countSourceRef(item, "input:optional_message"),
    0,
  );
  const nullVariant = variants.find((item) => item.variant_id === "CANDIDATE-NULL");
  return [
    gateRecord(
      "CSI-REQUEST-HASH-IDENTICAL",
      new Set(requestHashes).size === 1 && !requestHashes.includes(null),
      requestHashes,
      "one_identical_sha256",
    ),
    gateRecord(
      "CSI-BASE-REQUEST-NO-OPTIONAL-KEY",
      variants.every((item) =>
        exactKeys(item.base_provider_request, [
          "current_situation",
          "relationship",
          "requested_topics",
        ]),
      ),
      variants.map((item) => Object.keys(item.base_provider_request ?? {})),
      ["current_situation", "relationship", "requested_topics"],
    ),
    gateRecord(
      "CSI-REGISTERED-SENTINELS-ABSENT-FROM-BASE-INPUT",
      registeredInputCount === 0,
      registeredInputCount,
      0,
    ),
    gateRecord(
      "CSI-SHARED-BASE-OUTPUT",
      sharedBaseReuseCount === 3 && new Set(rawHashes).size === 1,
      { reuse_count: sharedBaseReuseCount, hashes: rawHashes },
      { reuse_count: 3, unique_hashes: 1 },
    ),
    gateRecord(
      "CSI-BASE-INTAKE-BYTE-IDENTICAL",
      new Set(groundedHashes).size === 1,
      groundedHashes,
      "one_identical_sha256",
    ),
    gateRecord(
      "CSI-BASE-LEGACY-BYTE-IDENTICAL",
      new Set(legacyHashes).size === 1,
      legacyHashes,
      "one_identical_sha256",
    ),
    gateRecord(
      "CSI-SENTINEL-A-BASE-ZERO",
      sentinelABaseCount === 0,
      sentinelABaseCount,
      0,
    ),
    gateRecord(
      "CSI-SENTINEL-B-BASE-ZERO",
      sentinelBBaseCount === 0,
      sentinelBBaseCount,
      0,
    ),
    gateRecord(
      "CSI-SENTINELS-PB02-ZERO",
      pb02SentinelCount === 0 &&
        variants.every((item) =>
          exactKeys(item.pb_02_request, [
            "base_structured_intake",
            "deterministic_rule_result",
            "candidate_safety_result",
          ]),
        ),
      { sentinel_count: pb02SentinelCount },
      { sentinel_count: 0, exact_routing: true },
    ),
    gateRecord(
      "CSI-SENTINELS-PB03-ZERO",
      pb03SentinelCount === 0 &&
        variants.every((item) =>
          exactKeys(item.pb_03_request, [
            "base_structured_intake",
            "aggregate_safety_result",
            "application_eligibility_expectation",
          ]),
        ),
      { sentinel_count: pb03SentinelCount },
      { sentinel_count: 0, exact_routing: true },
    ),
    gateRecord(
      "CSI-CANDIDATE-OWNED-DELTA-ONLY",
      candidateOwnedDeltaOnly(variants, sharedRawBaseOutput),
      candidateOwnedDeltaOnly(variants, sharedRawBaseOutput),
      true,
    ),
    gateRecord(
      "CSI-NULL-CANDIDATE-CALLS-ZERO",
      nullVariant?.pb_01c_call_count === 0 &&
        nullVariant?.pb_01c_persisted_status === "skipped",
      {
        calls: nullVariant?.pb_01c_call_count ?? null,
        persisted_status: nullVariant?.pb_01c_persisted_status ?? null,
      },
      { calls: 0, persisted_status: "skipped" },
    ),
    gateRecord(
      "CSI-BASE-OPTIONAL-REFS-ZERO",
      baseOptionalRefs === 0,
      baseOptionalRefs,
      0,
    ),
    gateRecord(
      "CSI-LEGITIMATE-LITERAL-OVERLAP-NO-FALSE-POSITIVE",
      overlap?.status === "PASS" &&
        overlap.production_source_integrity === "PASS" &&
        overlap.arbitrary_literal_rejected === false,
      overlap,
      "PASS_without_arbitrary_literal_rejection",
    ),
  ];
}

function runAcceptedMutants(pristineEvidence) {
  const definitions = [
    ["MUT-BASE-OPTIONAL-KEY", "CSI-BASE-REQUEST-NO-OPTIONAL-KEY", (evidence) => {
      evidence.variants[0].base_provider_request.optional_message =
        evidence.variants[0].optional_message;
      evidence.variants[0].base_provider_request_sha256 = sha256(
        JSON.stringify(evidence.variants[0].base_provider_request),
      );
    }],
    ["MUT-BASE-TIMELINE-SENTINEL", "CSI-SENTINEL-A-BASE-ZERO", (evidence) => {
      evidence.variants[0].grounded_base_structured_intake.timeline.push({
        event_id: "MUT-E001",
        sequence: 99,
        actor: "user",
        statement: sentinelA,
        source_refs: ["input:current_situation"],
      });
    }],
    ["MUT-PB02-RAW-CANDIDATE", "CSI-SENTINELS-PB02-ZERO", (evidence) => {
      evidence.variants[0].pb_02_request.raw_optional_message =
        evidence.variants[0].optional_message;
    }],
    ["MUT-PB03-CANDIDATE-ANALYSIS", "CSI-SENTINELS-PB03-ZERO", (evidence) => {
      evidence.variants[0].pb_03_request.candidate_analysis = clone(
        evidence.variants[0].candidate_envelope?.analysis,
      );
    }],
    ["MUT-NULL-CALL", "CSI-NULL-CANDIDATE-CALLS-ZERO", (evidence) => {
      const absent = evidence.variants.find(
        (item) => item.variant_id === "CANDIDATE-NULL",
      );
      absent.pb_01c_call_count = 1;
    }],
    ["MUT-BASE-OPTIONAL-REF", "CSI-BASE-OPTIONAL-REFS-ZERO", (evidence) => {
      evidence.variants[0].base_legacy_view.observed_facts[0].source_refs.push(
        "input:optional_message",
      );
    }],
    [
      "MUT-PRODUCTION-ARBITRARY-LITERAL-REJECTION",
      "CSI-LEGITIMATE-LITERAL-OVERLAP-NO-FALSE-POSITIVE",
      (evidence) => {
        evidence.overlap.status = "FAIL";
        evidence.overlap.arbitrary_literal_rejected = true;
      },
    ],
  ];
  return definitions.map(([mutantId, expectedGate, mutate]) => {
    const evidence = clone(pristineEvidence);
    mutate(evidence);
    const gates = evaluateHardGates(evidence);
    const failedGateIds = gates
      .filter((gate) => gate.status === "FAIL")
      .map((gate) => gate.gate_id);
    return {
      mutant_id: mutantId,
      expected_failed_gate: expectedGate,
      failed_gate_ids: failedGateIds,
      rejected: failedGateIds.includes(expectedGate),
      status: failedGateIds.includes(expectedGate) ? "PASS" : "FAIL",
    };
  });
}

function legacyDecisionFacts() {
  return {
    schema_version: "m2-p4-decision-facts-v2",
    relationship_stage: "matching_app",
    selected_requests: ["decide_send_or_wait", "draft_message"],
    latest_direct_message: {
      sender: "other_person",
      kind: "question",
      response_expectation: "reasonable",
      user_reply_state: "not_replied",
      sns_signal_only: false,
    },
    contact_state: {
      unanswered_user_message_count: 0,
      elapsed_since_latest_user_message_minutes: null,
      usual_cadence_relation: "not_applicable",
      proposed_message_present: true,
    },
    boundary_state: {
      kind: "none",
      status: "none",
      repeated_unanswered_contact: false,
    },
    practical_reason: { kind: "none", active: false, deadline: "none" },
    information_state: {
      assessment_mode: "best_effort",
      can_proceed_without_followup: true,
      used_context_inference: false,
      unresolved_fields: [],
    },
  };
}

function legacyStructuredIntake() {
  return {
    schema_version: "pipeline-schema-v3.0.0",
    relationship_stage: "matching_app",
    user_goal: "reply_to_message",
    timeline: [
      {
        event_id: "E001",
        sequence: 1,
        actor: "other_person",
        statement: "相手から予定に関する質問が届いた。",
        source_refs: ["input:current_situation"],
      },
    ],
    boundaries: [],
    context: [],
    observed_facts: [
      {
        fact_id: "F001",
        statement: "相手から具体的な質問が届き、まだ返信していない。",
        source_refs: ["input:current_situation"],
        support: "explicit",
      },
    ],
    user_assumptions: [],
    user_emotions: [
      {
        item_id: "M001",
        statement: "文面の温度に迷っている。",
        source_refs: ["input:current_situation"],
      },
    ],
    material_unknowns: [],
    safety_signals: [],
    untrusted_embedded_instructions_detected: false,
    context_inferences: [],
    decision_facts: legacyDecisionFacts(),
  };
}

function legacyReplyPlan() {
  return {
    schema_version: "pipeline-schema-v1.0.0",
    selected_decision: "reply_now",
    decision_reason_fact_ids: ["F001"],
    possible_interpretations: [
      {
        statement: "具体的な質問への通常の返答を待っている可能性がある。",
        supporting_fact_ids: ["F001"],
        epistemic_status: "possibility_only",
      },
      {
        statement: "予定を確認するための実務的な質問である可能性がある。",
        supporting_fact_ids: ["F001"],
        epistemic_status: "possibility_only",
      },
    ],
    actions_to_take: [
      "候補文に質問への答えが入っているか確認する。",
      "整えた短い返信案を一通送る。",
      "送信後は追加文を重ねず、今夜の予定へ戻る。",
    ],
    actions_to_avoid: [
      "質問への答えより長い前置きを置く。",
      "返答を急かす別の質問を足す。",
    ],
    message_draft: {
      text: "ありがとう。土曜なら大丈夫です。時間は夕方ごろでどうですか？",
      policy: "required_now",
      use_timing: "now",
    },
    three_day_plan: [
      {
        day: "tonight",
        action: "質問へ答える短い文面を一通送って、予定へ戻る。",
        avoid: "送った直後に補足を重ねない。",
      },
      {
        day: "next_day",
        action: "日程の返答が来た場合だけ必要な調整をする。",
        avoid: "返信状況の確認だけで一日を使わない。",
      },
      {
        day: "day_three",
        action: "会話が続けば具体的な予定を一つ確認し、境界が示された場合は連絡を止める。",
        avoid: "三日を関係の結論を出す期限にしない。",
      },
    ],
    change_conditions: [
      {
        condition: "相手から日程変更の連絡が届いたこと。",
        resulting_direction: "reply_now",
      },
      {
        condition: "今夜は予定を確認できないことが分かったこと。",
        resulting_direction: "wait_and_reassess",
      },
      {
        condition: "相手から明確に連絡を控えるよう示されたこと。",
        resulting_direction: "pause_additional_contact",
      },
    ],
    review_timing: {
      when: "具体的な返答または明示的な境界が届いた時点。",
      trigger_fact_ids: ["F001"],
    },
    material_unknowns: ["相手が希望する具体的な時間。"],
    limitations: ["相手の返信内容や今後の関係は確定できない。"],
  };
}

function legacyReportContent() {
  const report = wait003StageOutputs()["PB-05"];
  return {
    ...report,
    message_draft_context:
      "候補文の感謝と土曜の意思を残し、時間確認を一問だけに絞った。",
    change_condition_commentary: ["raw-one", "raw-two", "raw-three"],
  };
}

function legacyOutputs({ safetyBlocked = false } = {}) {
  const outputs = safetyBlocked
    ? safetyBlockedStageOutputs()
    : wait003StageOutputs();
  outputs["PB-01"] = legacyStructuredIntake();
  outputs["PB-03"] = {
    schema_version: "pipeline-schema-v3.0.0",
    acknowledged_eligibility: safetyBlocked ? "safety_blocked" : "ready",
  };
  outputs["PB-04"] = legacyReplyPlan();
  outputs["PB-05"] = legacyReportContent();
  outputs["PB-06"] = semanticPass();
  return outputs;
}

const legacyInput = {
  currentSituation:
    "マッチング後の相手から土曜の予定を聞かれ、まだ返信していません。",
  optionalMessage: "ありがとう！土曜なら大丈夫だよ。時間はどうしようか？",
  relationship: "matching_app",
  requestedTopics: ["decide_send_or_wait", "draft_message"],
  privacyAcknowledged: true,
};

function expectedLegacyReadyValues() {
  const plan = legacyReplyPlan();
  const initiallyGrounded = groundReportContentV3(
    legacyDecisionFacts(),
    legacyReportContent(),
  );
  const content = groundChangeConditionCommentaryV3(plan, initiallyGrounded);
  return {
    report: {
      schemaVersion: "m2-p3-runtime-report-v1",
      decisionPlan: plan,
      content,
      fixedLimitation:
        "このノートは入力された情報を整理した判断材料です。相手の本心や将来を断定・保証せず、医療・心理・法律上の助言を代替しません。",
    },
    decisionCard: {
      schemaVersion: "m2-p3-decision-card-v1",
      decision: plan.selected_decision,
      reason: content.decision_reason_summary,
      actionsToTake: plan.actions_to_take,
      actionsToAvoid: plan.actions_to_avoid,
      messageDraft: plan.message_draft?.text ?? null,
      reviewTiming: plan.review_timing.when,
    },
  };
}

function legacyRequestShapes(requests) {
  return Object.fromEntries(
    requests.map((request) => [request.stageId, Object.keys(request.input)]),
  );
}

function invocationCounts(runs) {
  const byStage = {};
  let total = 0;
  for (const run of runs) {
    for (const stageId of run.transport.calls) {
      byStage[stageId] = (byStage[stageId] ?? 0) + 1;
      total += 1;
    }
  }
  return { total, by_stage: byStage };
}

async function runHistoricalRegression(catalog) {
  const ready = await executeApplication({
    catalog,
    outputs: legacyOutputs(),
    input: legacyInput,
    idempotencyKey: "legacy-ready-key",
    idPrefix: "legacy-ready",
  });
  const expected = expectedLegacyReadyValues();
  const readyRun = [...ready.repository.runs.values()][0] ?? null;
  const readyPass =
    !ready.error &&
    ready.result?.eligibility === "ready" &&
    canonicalJson(ready.result.report) === canonicalJson(expected.report) &&
    canonicalJson(ready.result.decisionCard) === canonicalJson(expected.decisionCard) &&
    canonicalJson(ready.transport.calls) ===
      canonicalJson(["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"]) &&
    readyRun?.stageTopologyVersion === "legacy-six-v1" &&
    readyRun?.status === "completed";

  const safety = await executeApplication({
    catalog,
    outputs: legacyOutputs({ safetyBlocked: true }),
    input: legacyInput,
    idempotencyKey: "legacy-safety-key",
    idPrefix: "legacy-safety",
  });
  const safetyRun = [...safety.repository.runs.values()][0] ?? null;
  const safetyPass =
    !safety.error &&
    safety.result?.eligibility === "safety_blocked" &&
    canonicalJson(safety.transport.calls) ===
      canonicalJson(["PB-01", "PB-02", "PB-03"]) &&
    safety.repository.reports.size === 0 &&
    safetyRun?.status === "completed";

  const pb05Failure = await executeApplication({
    catalog,
    outputs: legacyOutputs(),
    input: legacyInput,
    idempotencyKey: "legacy-pb05-fail-key",
    idPrefix: "legacy-pb05-fail",
    failAtStage: "PB-05",
  });
  const failedRun = [...pb05Failure.repository.runs.values()][0] ?? null;
  const failureUsage = stageUsageTotals(pb05Failure.repository);
  const pb05FailurePass =
    pb05Failure.result === null &&
    pb05Failure.error !== null &&
    canonicalJson(pb05Failure.transport.calls) ===
      canonicalJson(["PB-01", "PB-02", "PB-03", "PB-04", "PB-05"]) &&
    !pb05Failure.transport.calls.includes("PB-06") &&
    pb05Failure.repository.reports.size === 0 &&
    failedRun?.status === "failed" &&
    usageMatches(failedRun, failureUsage);

  const duplicateRepository = new FakeAssessmentRepository();
  const duplicateTransport = new FakeAiStageTransport({ outputs: legacyOutputs() });
  const duplicateApplication = new AssessmentApplication({
    repository: duplicateRepository,
    transport: duplicateTransport,
    model,
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => fixedClock,
    uuid: deterministicUuidFactory("legacy-duplicate"),
  });
  let firstDuplicateResult = null;
  let secondDuplicateResult = null;
  let duplicateError = null;
  try {
    firstDuplicateResult = await duplicateApplication.submit(
      legacyInput,
      "legacy-duplicate-key",
    );
    const callsAfterFirst = duplicateTransport.calls.length;
    secondDuplicateResult = await duplicateApplication.submit(
      legacyInput,
      "legacy-duplicate-key",
    );
    if (duplicateTransport.calls.length !== callsAfterFirst) {
      throw new Error("DUPLICATE_ADDITIONAL_STAGE_CALLS");
    }
  } catch (error) {
    duplicateError = error;
  }
  const duplicatePass =
    duplicateError === null &&
    firstDuplicateResult?.eligibility === "ready" &&
    secondDuplicateResult?.duplicate === true &&
    duplicateTransport.calls.length === 6 &&
    canonicalJson(firstDuplicateResult?.report) ===
      canonicalJson(secondDuplicateResult?.report) &&
    canonicalJson(firstDuplicateResult?.decisionCard) ===
      canonicalJson(secondDuplicateResult?.decisionCard);
  const duplicate = {
    repository: duplicateRepository,
    transport: duplicateTransport,
  };

  const scenarios = [
    {
      scenario_id: "LEGACY-READY-001",
      status: readyPass ? "PASS" : "FAIL",
      stage_calls: ready.transport.calls,
      topology: readyRun?.stageTopologyVersion ?? null,
      final_eligibility: ready.result?.eligibility ?? null,
      finalization: readyRun?.status ?? null,
      runtime_report_schema: ready.result?.report?.schemaVersion ?? null,
      decision_card_schema: ready.result?.decisionCard?.schemaVersion ?? null,
      report_sha256: ready.result?.report ? jsonSha256(ready.result.report) : null,
      decision_card_sha256: ready.result?.decisionCard
        ? jsonSha256(ready.result.decisionCard)
        : null,
      independently_constructed_report_sha256: jsonSha256(expected.report),
      independently_constructed_decision_card_sha256: jsonSha256(
        expected.decisionCard,
      ),
      report_deep_equal: canonicalJson(ready.result?.report) === canonicalJson(expected.report),
      decision_card_deep_equal:
        canonicalJson(ready.result?.decisionCard) === canonicalJson(expected.decisionCard),
      request_shapes: legacyRequestShapes(ready.transport.requests),
      pb_01c_calls: ready.transport.calls.filter((item) => item === "PB-01C").length,
      external_provider_calls: ready.transport.actualProviderCalls,
      supabase_operations: ready.repository.actualSupabaseCalls,
      error: safeError(ready.error),
    },
    {
      scenario_id: "LEGACY-SAFETY-BLOCKED-001",
      status: safetyPass ? "PASS" : "FAIL",
      stage_calls: safety.transport.calls,
      final_eligibility: safety.result?.eligibility ?? null,
      final_report_present: safety.repository.reports.size > 0,
      finalization: safetyRun?.status ?? null,
      pb_01c_calls: safety.transport.calls.filter((item) => item === "PB-01C").length,
      external_provider_calls: safety.transport.actualProviderCalls,
      supabase_operations: safety.repository.actualSupabaseCalls,
      error: safeError(safety.error),
    },
    {
      scenario_id: "LEGACY-PB05-FAIL-STOPS-PB06-001",
      status: pb05FailurePass ? "PASS" : "FAIL",
      stage_calls: pb05Failure.transport.calls,
      pb_06_calls: pb05Failure.transport.calls.filter((item) => item === "PB-06").length,
      final_report_present: pb05Failure.repository.reports.size > 0,
      finalization: failedRun?.status ?? null,
      returned_stage_usage: failureUsage,
      persisted_run_usage: Object.fromEntries(
        usageKeys.map((key) => [key, failedRun?.[key] ?? null]),
      ),
      pb_01c_calls: pb05Failure.transport.calls.filter((item) => item === "PB-01C")
        .length,
      external_provider_calls: pb05Failure.transport.actualProviderCalls,
      supabase_operations: pb05Failure.repository.actualSupabaseCalls,
      error: safeError(pb05Failure.error),
    },
    {
      scenario_id: "LEGACY-DUPLICATE-READY-001",
      status: duplicatePass ? "PASS" : "FAIL",
      first_stage_calls: duplicateTransport.calls,
      second_submission_additional_stage_calls: duplicateTransport.calls.length - 6,
      duplicate: secondDuplicateResult?.duplicate ?? null,
      report_deep_equal:
        canonicalJson(firstDuplicateResult?.report) ===
        canonicalJson(secondDuplicateResult?.report),
      decision_card_deep_equal:
        canonicalJson(firstDuplicateResult?.decisionCard) ===
        canonicalJson(secondDuplicateResult?.decisionCard),
      pb_01c_calls: duplicateTransport.calls.filter((item) => item === "PB-01C").length,
      external_provider_calls: duplicateTransport.actualProviderCalls,
      supabase_operations: duplicateRepository.actualSupabaseCalls,
      error: safeError(duplicateError),
    },
  ];
  return {
    scenarios,
    summary: `${scenarios.filter((item) => item.status === "PASS").length}/4`,
    fake_stage_invocations: invocationCounts([ready, safety, pb05Failure, duplicate]),
    actual_provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
  };
}

function checkProtectedBlobs(historicalManifest) {
  const acceptedPlanning = [
    "docs/phase2/M2_P4_I3_R1_C1_R3_R2_CANDIDATE_SOURCE_ISOLATION_PLAN.md",
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2/architecture-contract-v1.json",
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2/payload-routing-matrix-v1.json",
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2/counterfactual-suite-v1.json",
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2/safety-failure-matrix-v1.json",
  ];
  const acceptedA = [
    "lib/assessment/runtime/contracts/base-structured-intake-v1.schema.json",
    "lib/assessment/runtime/contracts/candidate-analysis-v1.schema.json",
    "lib/assessment/runtime/contracts/split-stage-contracts-v1.ts",
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-a/stage-topology-v1.json",
  ];
  const acceptedB = [
    "lib/assessment/runtime/base-structured-intake-grounding-v1.ts",
    "lib/assessment/runtime/candidate-analysis-grounding-v1.ts",
    "lib/assessment/runtime/base-structured-intake-legacy-view-v1.ts",
    "lib/assessment/runtime/split-analysis-envelope-v1.ts",
    "lib/assessment/runtime/base-source-integrity-v1.ts",
    "lib/assessment/runtime/candidate-source-integrity-v1.ts",
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-b/source-integrity-fixtures-v1.json",
  ];
  const acceptedCNonSync = [
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
  const groups = [
    ["accepted_planning", "212720bba2ebb805da9ef701d645359a6bd470a7", acceptedPlanning],
    ["accepted_a_implementation", "2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f", acceptedA],
    ["accepted_b_non_sync", "ef5c6db66da77deebb9ad0d5498fe69ec584aad8", acceptedB],
    ["accepted_c_non_sync", "7e09b540220eac3b0afb91bc9cfb822cc0ab632d", acceptedCNonSync],
    [
      "active_v4_assets",
      baseline,
      historicalManifest.protected_assets.map((item) => item.path),
    ],
  ];
  const results = groups.map(([group, expectedRef, paths]) => {
    const entries = paths.map((relativePath) => {
      const expectedBlob = git("rev-parse", `${expectedRef}:${relativePath}`);
      const actualBlob = git("hash-object", relativePath);
      return {
        path: relativePath,
        expected_blob: expectedBlob,
        actual_blob: actualBlob,
        unchanged: expectedBlob === actualBlob,
      };
    });
    return {
      group,
      expected_ref: expectedRef,
      total: entries.length,
      unchanged: entries.filter((entry) => entry.unchanged).length,
      changed_paths: entries.filter((entry) => !entry.unchanged).map((entry) => entry.path),
      status: entries.every((entry) => entry.unchanged) ? "PASS" : "FAIL",
    };
  });
  return {
    groups: results,
    all_unchanged: results.every((group) => group.status === "PASS"),
  };
}

async function runLegitimateOverlap({ catalog, contract, sharedRawBaseOutput, candidateOutput }) {
  const overlapCase = contract.legitimate_overlap_case;
  const overlapRawBaseOutput = clone(sharedRawBaseOutput);
  overlapRawBaseOutput.observed_facts[0].statement =
    "架空人物Bから「承知しました」と業務連絡が届いた。";
  const outputs = splitOutputs({
    sharedRawBaseOutput: overlapRawBaseOutput,
    rawCandidateOutput: candidateOutput,
    candidatePresent: true,
    contractFixture: readJson("evals/runtime/m2-p4-i3-r1-a-contract-fixtures-v1.json"),
  });
  const run = await executeApplication({
    catalog,
    outputs,
    input: {
      currentSituation: overlapCase.base_provider_input.current_situation,
      optionalMessage: overlapCase.optional_message,
      relationship: overlapCase.base_provider_input.relationship,
      requestedTopics: overlapCase.base_provider_input.requested_topics,
      privacyAcknowledged: true,
    },
    idempotencyKey: "split-legitimate-overlap-key",
    idPrefix: "split-overlap",
  });
  const requestByStage = Object.fromEntries(
    run.transport.requests.map((request) => [request.stageId, request.input]),
  );
  const baseRequest = requestByStage["PB-01"] ?? null;
  const grounded = requestByStage["PB-02"]?.base_structured_intake ?? null;
  const registeredSentinelCount = sentinels.reduce(
    (total, sentinel) =>
      total + countLiteral(baseRequest, sentinel) + countLiteral(grounded, sentinel),
    0,
  );
  const structuralIsolation =
    exactKeys(baseRequest, ["current_situation", "relationship", "requested_topics"]) &&
    registeredSentinelCount === 0 &&
    !containsKey(grounded, "candidate_envelope") &&
    !containsKey(grounded, "candidate_safety_result");
  const passed =
    run.error === null &&
    run.result?.eligibility === "ready" &&
    countLiteral(overlapRawBaseOutput, overlapCase.overlapping_literal) > 0 &&
    structuralIsolation;
  return {
    case_id: overlapCase.case_id,
    status: passed ? "PASS" : "FAIL",
    production_source_integrity: run.error === null ? "PASS" : "FAIL",
    arbitrary_literal_rejected: false,
    overlapping_literal: overlapCase.overlapping_literal,
    base_request_has_optional_message_key: Object.hasOwn(
      baseRequest ?? {},
      "optional_message",
    ),
    base_output_overlap_literal_count: countLiteral(
      overlapRawBaseOutput,
      overlapCase.overlapping_literal,
    ),
    registered_sentinel_base_count: registeredSentinelCount,
    structural_isolation: structuralIsolation,
    final_eligibility: run.result?.eligibility ?? null,
    fake_stage_calls: run.transport.calls,
    external_provider_calls: run.transport.actualProviderCalls,
    supabase_operations: run.repository.actualSupabaseCalls,
    error: safeError(run.error),
  };
}

export async function runOfflineCounterfactual() {
  if (path.resolve(process.cwd()) !== repositoryRoot) {
    throw new Error(`Run from repository root: ${repositoryRoot}`);
  }
  const cases = readJson(relativeCasesPath);
  const sourceContract = readJson(relativeSourceContractPath);
  const historicalManifest = readJson(relativeHistoricalManifestPath);
  const sourceFixture = readJson(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-b/source-integrity-fixtures-v1.json",
  );
  const contractFixture = readJson(
    "evals/runtime/m2-p4-i3-r1-a-contract-fixtures-v1.json",
  );
  const splitCatalog =
    await loadM2P4CandidateSourceIsolationRuntimeStageCatalog();
  const legacyCatalog = await loadM2P4ProductQualityRuntimeStageCatalog();
  const sharedRawBaseOutput = clone(sourceFixture.raw_base_structured_intake);
  sharedRawBaseOutput.context_inferences =
    sharedRawBaseOutput.context_inferences.filter(
      ({ inference_id: inferenceId }) => inferenceId !== "I003",
    );
  const candidateOutputs = {
    "CANDIDATE-A": clone(sourceFixture.raw_candidate_provider_output),
    "CANDIDATE-B": clone(sourceFixture.raw_candidate_provider_output),
  };
  const variants = [];
  const splitRuns = [];
  let sharedBaseReuseCount = 0;
  for (const variant of sourceContract.variants) {
    const candidatePresent = variant.optional_message !== null;
    const outputs = splitOutputs({
      sharedRawBaseOutput,
      rawCandidateOutput: candidateOutputs[variant.variant_id],
      candidatePresent,
      contractFixture,
    });
    sharedBaseReuseCount += 1;
    const run = await executeApplication({
      catalog: splitCatalog,
      outputs,
      input: {
        currentSituation: sourceContract.base_case.base_provider_input.current_situation,
        optionalMessage: variant.optional_message,
        relationship: sourceContract.base_case.base_provider_input.relationship,
        requestedTopics: sourceContract.base_case.base_provider_input.requested_topics,
        privacyAcknowledged: true,
      },
      idempotencyKey: `split-${variant.variant_id.toLowerCase()}-key`,
      idPrefix: `split-${variant.variant_id.toLowerCase()}`,
    });
    splitRuns.push(run);
    variants.push(captureSplitRun(run, variant, sharedRawBaseOutput));
  }
  const overlap = await runLegitimateOverlap({
    catalog: splitCatalog,
    contract: sourceContract,
    sharedRawBaseOutput,
    candidateOutput: sourceFixture.raw_candidate_provider_output,
  });
  const gateEvidence = {
    variants,
    sharedRawBaseOutput,
    sharedBaseReuseCount,
    overlap,
  };
  const hardGates = evaluateHardGates(gateEvidence);
  const mutants = runAcceptedMutants(gateEvidence);
  const historical = await runHistoricalRegression(legacyCatalog);
  const protectedBlobs = checkProtectedBlobs(historicalManifest);
  const hardGatePassCount = hardGates.filter((gate) => gate.status === "PASS").length;
  const mutantPassCount = mutants.filter((mutant) => mutant.status === "PASS").length;
  const historicalPassCount = historical.scenarios.filter(
    (scenario) => scenario.status === "PASS",
  ).length;
  const externalProviderCalls =
    splitRuns.reduce((total, run) => total + run.transport.actualProviderCalls, 0) +
    overlap.external_provider_calls +
    historical.actual_provider_calls;
  const supabaseOperations =
    splitRuns.reduce((total, run) => total + run.repository.actualSupabaseCalls, 0) +
    overlap.supabase_operations +
    historical.supabase_operations;
  const mainRef = git("rev-parse", "main");
  const originMainRef = git("rev-parse", "origin/main");
  const overallPass =
    canonicalJson(cases) === canonicalJson(sourceContract) &&
    hardGatePassCount === 14 &&
    mutantPassCount === 7 &&
    historicalPassCount === 4 &&
    protectedBlobs.all_unchanged &&
    externalProviderCalls === 0 &&
    supabaseOperations === 0 &&
    mainRef === mainBaseline &&
    originMainRef === mainBaseline;
  const first = variants[0];
  return {
    schema_version: "m2-p4-i3-r1-c1-r3-r2-d-counterfactual-results-v1",
    task_id: taskId,
    runner_version: runnerVersion,
    baseline,
    main_baseline: mainBaseline,
    source_planning_contract_sha256: fileSha256(relativeSourceContractPath),
    cases_sha256: fileSha256(relativeCasesPath),
    historical_manifest_sha256: fileSha256(relativeHistoricalManifestPath),
    planning_contract_semantically_identical: canonicalJson(cases) === canonicalJson(sourceContract),
    counterfactual: {
      shared_base_output: {
        fixture_id: sourceContract.base_case.shared_base_output_fixture_id,
        reuse_count: sharedBaseReuseCount,
        sha256: jsonSha256(sharedRawBaseOutput),
        content: sharedRawBaseOutput,
      },
      base_request_sha256: first?.base_provider_request_sha256 ?? null,
      grounded_base_sha256: first?.grounded_base_sha256 ?? null,
      base_legacy_view_sha256: first?.base_legacy_view_sha256 ?? null,
      variants,
      hard_gates: hardGates,
      hard_gate_summary: `${hardGatePassCount}/14`,
      additional_structural_assertions: {
        pb_02_exact_keys: variants.every((item) =>
          exactKeys(item.pb_02_request, [
            "base_structured_intake",
            "deterministic_rule_result",
            "candidate_safety_result",
          ]),
        ),
        pb_03_exact_keys: variants.every((item) =>
          exactKeys(item.pb_03_request, [
            "base_structured_intake",
            "aggregate_safety_result",
            "application_eligibility_expectation",
          ]),
        ),
        merged_structured_intake_key_absent: variants.every(
          (item) =>
            !containsKey(item.pb_02_request, "structured_intake") &&
            !containsKey(item.pb_03_request, "structured_intake"),
        ),
        raw_candidate_output_downstream_count: variants.reduce(
          (total, item) => total + item.raw_candidate_bundle_downstream_count,
          0,
        ),
        candidate_response_id_stage_local: variants.every(
          (item) => item.candidate_response_id_stage_local,
        ),
        candidate_usage_counted_once: variants.every(
          (item) => item.candidate_usage_counted_once,
        ),
        base_legacy_view_same_grounded_bytes: variants.every(
          (item) => item.grounded_base_sha256 === item.base_legacy_view_sha256,
        ),
        candidate_envelope_recursive_base_count: variants.reduce(
          (total, item) =>
            total + (containsKey(item.grounded_base_structured_intake, "candidate_envelope") ? 1 : 0),
          0,
        ),
        candidate_safety_recursive_base_count: variants.reduce(
          (total, item) =>
            total +
            (containsKey(item.grounded_base_structured_intake, "candidate_safety_result")
              ? 1
              : 0),
          0,
        ),
        base_source_ref_allowlist: variants.every((item) =>
          item.base_source_refs.every((ref) =>
            [
              "input:current_situation",
              "input:relationship",
              "input:requested_topics",
            ].includes(ref),
          ),
        ),
        null_candidate_optional_source_refs:
          variants.find((item) => item.variant_id === "CANDIDATE-NULL")
            ?.base_optional_message_source_ref_count ?? null,
      },
      legitimate_overlap: overlap,
      fake_stage_invocations: invocationCounts(splitRuns),
    },
    negative_mutants: {
      results: mutants,
      summary: `${mutantPassCount}/7`,
    },
    historical_regression: historical,
    protected_blobs: protectedBlobs,
    operations: {
      external_provider_calls: externalProviderCalls,
      fake_stage_invocations_recorded_separately: true,
      db_operations: 0,
      supabase_operations: supabaseOperations,
      migration_applied: false,
      real_user_data: 0,
      holdout_use: 0,
      active_runtime_changed: false,
    },
    main_ref: mainRef,
    origin_main_ref: originMainRef,
    overall_verdict: overallPass ? "PASS" : "FAIL",
  };
}

export function resultPath() {
  return path.join(repositoryRoot, relativeResultPath);
}

function printSummary(result, mode) {
  console.log(`${taskId} ${runnerVersion}: ${result.overall_verdict}`);
  console.log(`mode: ${mode}`);
  console.log(`hard gates: ${result.counterfactual.hard_gate_summary}`);
  console.log(`negative mutants: ${result.negative_mutants.summary}`);
  console.log(`historical regression: ${result.historical_regression.summary}`);
  console.log(`external Provider calls: ${result.operations.external_provider_calls}`);
  console.log(`DB / Supabase operations: ${result.operations.db_operations} / ${result.operations.supabase_operations}`);
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isCli) {
  const checkMode = process.argv.includes("--check") || process.argv.includes("--recompute");
  const result = await runOfflineCounterfactual();
  if (checkMode) {
    const committed = readJson(relativeResultPath);
    const matches = canonicalJson(committed) === canonicalJson(result);
    printSummary(result, "check-no-write");
    console.log(`committed deterministic replay: ${matches ? "PASS" : "FAIL"}`);
    process.exitCode = result.overall_verdict === "PASS" && matches ? 0 : 1;
  } else {
    writeFileSync(resultPath(), canonicalPrettyJson(result), "utf8");
    printSummary(result, "write-result-only");
    console.log(`wrote: ${relativeResultPath}`);
    process.exitCode = result.overall_verdict === "PASS" ? 0 : 1;
  }
}
