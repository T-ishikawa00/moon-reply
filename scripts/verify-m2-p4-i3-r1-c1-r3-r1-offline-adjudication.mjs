import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalizeContextInferencesV5 } from "../lib/assessment/runtime/context-inference-canonicalization-v5.ts";
import {
  loadM2P4PracticalReasonConsistencyRuntimeStageCatalog,
  loadM2P4ProductQualityRuntimeStageCatalog,
} from "../lib/assessment/runtime/schema-catalog.ts";
import { groundStructuredIntakeV5 } from "../lib/assessment/runtime/structured-intake-grounding-v5.ts";
import { validateContextualIntakeIntegrityV3 } from "../lib/assessment/runtime/contextual-integrity-v3.ts";
import {
  validateGroundedStageOutput,
  validateStageOutput,
} from "../lib/assessment/runtime/validation.ts";
import {
  collectWritingContextIntegrityViolationsV2,
  validateWritingContextIntegrityV2,
} from "../lib/assessment/runtime/writing-context-integrity-v2.ts";
import {
  adjudicateOfflineProviderCallV1,
  buildOfflineAdjudicationResultV1,
  practicalReasonMatchesV1,
  R3_08_ALLOWED_USER_GOAL_BASES,
  R3_08_ALLOWED_USER_GOAL_VALUES,
  R3_08_FORBIDDEN_USER_GOAL_BASES,
} from "./lib/m2-p4-i3-r1-c1-r3-r1-offline-adjudicator-v1.mjs";
import {
  secretLeakageValues,
  shaDiagnosticJson,
} from "./lib/m2-p4-i3-r1-c1-r3-provider-evaluator-v1.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baseline = "34a21c2a6acdec6b6208cacd2182f2e40302813f";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const branch = "feat/m2-p4-i3-r1-c1-r3-r1-offline-adjudication";
const sourceArtifactRoot = "evals/runtime/m2-p4-i3-r1-c1-r3";
const artifactRoot = "evals/runtime/m2-p4-i3-r1-c1-r3-r1";
const sourceResultsPath = sourceArtifactRoot + "/diagnostic-results-v1.json";
const sourceQualityPath = sourceArtifactRoot + "/quality-contract-v1.json";
const contractPath = artifactRoot + "/adjudication-contract-v1.json";
const resultsPath = artifactRoot + "/adjudication-results-v1.json";
const capabilitiesPath = artifactRoot + "/capabilities-v1.json";
const canonicalizerPath =
  "lib/assessment/runtime/context-inference-canonicalization-v5.ts";
const groundingPath =
  "lib/assessment/runtime/structured-intake-grounding-v5.ts";
const adjudicatorPath =
  "scripts/lib/m2-p4-i3-r1-c1-r3-r1-offline-adjudicator-v1.mjs";
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r1-offline-adjudication.mjs";
const exactPaths = [
  canonicalizerPath,
  contractPath,
  resultsPath,
  capabilitiesPath,
  adjudicatorPath,
  verifierPath,
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R1_REVIEW.md",
  groundingPath,
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const immutableR3Paths = [
  sourceArtifactRoot + "/diagnostic-cases-v1.json",
  sourceArtifactRoot + "/diagnostic-contract-v1.json",
  sourceQualityPath,
  sourceArtifactRoot + "/authorization-v1.json",
  sourceArtifactRoot + "/capabilities-v1.json",
  sourceResultsPath,
  sourceArtifactRoot + "/diagnostic-summary-v1.md",
  "scripts/lib/m2-p4-i3-r1-c1-r3-provider-evaluator-v1.mjs",
  "scripts/run-m2-p4-i3-r1-c1-r3-provider-confirmation.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r3-provider-confirmation.mjs",
  "lib/assessment/runtime/contracts/pb-01-structure-v7.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v8.json",
  "lib/assessment/runtime/contracts/structured-intake-v5.schema.json",
];
const authorizedCandidateProductionPaths = new Set([
  canonicalizerPath,
  groundingPath,
]);

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
  throw new Error("M2_P4_I3_R1_C1_R3_R1_VERIFY: " + message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  return (
    "{" +
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right, "en"))
      .map((key) => JSON.stringify(key) + ":" + canonical(value[key]))
      .join(",") +
    "}"
  );
}

function same(left, right) {
  return canonical(left) === canonical(right);
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
  assert(
    new Set(actual).size === actual.length &&
      same(sorted(actual), sorted(expected)),
    label + " must be exact",
  );
}

function currentTaskPaths() {
  const tracked = normalizedPaths(git(["diff", "--name-only", baseline, "--"]));
  const untracked = normalizedPaths(
    git(["ls-files", "--others", "--exclude-standard"]),
  );
  return sorted(new Set([...tracked, ...untracked]));
}

function assertNoWhitespaceErrors(relativePath) {
  const text = source(relativePath);
  assert(!/[ \t]+$/mu.test(text), relativePath + " has trailing whitespace");
  assert(text.endsWith("\n"), relativePath + " must end with newline");
}

function assertBlobMatchesEvidence(relativePath) {
  const expected = git(["rev-parse", baseline + ":" + relativePath]).trim();
  const actual = git([
    "hash-object",
    "--path=" + relativePath,
    relativePath,
  ]).trim();
  assert(actual === expected, relativePath + " differs from frozen Commit B");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function passes(action) {
  try {
    action();
    return true;
  } catch {
    return false;
  }
}

function inferencePaths(structuredIntake) {
  return (structuredIntake.context_inferences ?? []).map(
    (inference) => inference.field_path,
  );
}

function canonicalOutcomePass(caseId, grounded) {
  const paths = inferencePaths(grounded);
  if (caseId === "R3-03") {
    return same(paths, [
      "latest_direct_message.kind",
      "latest_direct_message.response_expectation",
    ]);
  }
  if (caseId === "R3-07") {
    return (
      paths.length === 0 &&
      grounded.decision_facts.information_state.used_context_inference === false
    );
  }
  return true;
}

async function replaySavedEvidence() {
  const frozenResults = json(sourceResultsPath);
  const qualityContract = json(sourceQualityPath);
  const sourceContract = json(sourceArtifactRoot + "/diagnostic-contract-v1.json");
  const candidateCatalog =
    await loadM2P4PracticalReasonConsistencyRuntimeStageCatalog();
  const definition = candidateCatalog.definitions.find(
    (item) => item.stageId === "PB-01",
  );
  assert(definition, "candidate PB-01 definition missing");
  assert(
    definition.promptVersion === "v7.0.0" &&
      definition.schemaVersion === "pipeline-schema-v5.0.0" &&
      definition.groundedSchemaVersion === "pipeline-schema-v4.0.0",
    "candidate PB-01 version boundary changed",
  );
  assert(frozenResults.calls.length === 8, "frozen saved call count differs");

  const replayedCalls = [];
  for (const savedCall of frozenResults.calls) {
    const qualityCase = qualityContract.cases.find(
      (item) => item.case_id === savedCall.case_id,
    );
    assert(qualityCase, savedCall.case_id + " quality case missing");
    const syntheticInput = structuredClone(savedCall.synthetic_input);
    const rawOutput = structuredClone(savedCall.raw_output);
    const immutableRawCopy = structuredClone(rawOutput);
    const rawHashBefore = shaDiagnosticJson(rawOutput);
    const rawSchemaPassed = passes(() =>
      validateStageOutput(definition, rawOutput),
    );
    const groundedOutput = groundStructuredIntakeV5(
      syntheticInput,
      rawOutput,
    );
    const groundedSchemaPassed = passes(() =>
      validateGroundedStageOutput(definition, groundedOutput),
    );
    const integrityViolations = collectWritingContextIntegrityViolationsV2(
      syntheticInput,
      groundedOutput,
    );
    const writingIntegrityPassed =
      integrityViolations.length === 0 &&
      passes(() =>
        validateWritingContextIntegrityV2(syntheticInput, groundedOutput),
      );
    const contextualIntegrityPassed = passes(() =>
      validateContextualIntakeIntegrityV3(groundedOutput),
    );
    const rawHashAfter = shaDiagnosticJson(rawOutput);
    const providerOutputMutated =
      rawHashBefore !== rawHashAfter || !same(rawOutput, immutableRawCopy);
    const call = {
      case_id: savedCall.case_id,
      source_case_reference: savedCall.source_case_reference,
      provider_completed: false,
      returned_model: null,
      raw_json_parse:
        typeof rawOutput === "object" &&
        rawOutput !== null &&
        !Array.isArray(rawOutput),
      raw_schema_passed: rawSchemaPassed,
      grounded_schema_passed: groundedSchemaPassed,
      writing_context_integrity_v2_passed: writingIntegrityPassed,
      contextual_intake_integrity_passed: contextualIntegrityPassed,
      integrity_violations: integrityViolations,
      raw_output: rawOutput,
      grounded_output: groundedOutput,
      raw_output_sha256: rawHashBefore,
      raw_output_sha256_after_processing: rawHashAfter,
      provider_output_mutated: providerOutputMutated,
      secret_leakage_count: secretLeakageValues({
        raw_output: rawOutput,
        grounded_output: groundedOutput,
      }).length,
      practical_reason_applicable:
        qualityCase.practical_reason_consistency === true,
      candidate_style_applicable: qualityCase.candidate_style !== null,
      candidate_intent_applicable: qualityCase.candidate_intent !== null,
      expected_data_injection: false,
    };
    call.evaluation = adjudicateOfflineProviderCallV1({
      call,
      contract: sourceContract,
      qualityCase,
    });
    replayedCalls.push(call);
  }
  return { frozenResults, qualityContract, sourceContract, replayedCalls };
}

const contract = json(contractPath);
const capabilities = json(capabilitiesPath);
const { frozenResults, qualityContract, sourceContract, replayedCalls } =
  await replaySavedEvidence();
const actualResults = buildOfflineAdjudicationResultV1({
  calls: replayedCalls,
  evidenceCommit: baseline,
  frozenStatus: frozenResults.status,
});

if (process.argv.includes("--emit-results")) {
  console.log(JSON.stringify(actualResults, null, 2));
  process.exit(0);
}

for (const relativePath of exactPaths) {
  assert(existsSync(absolute(relativePath)), relativePath + " missing");
  assertNoWhitespaceErrors(relativePath);
}
for (const relativePath of immutableR3Paths) {
  assertBlobMatchesEvidence(relativePath);
}

assert(git(["branch", "--show-current"]).trim() === branch, "branch mismatch");
assert(git(["rev-parse", "main"]).trim() === mainBaseline, "main changed");
assert(
  git(["rev-parse", "origin/main"]).trim() === mainBaseline,
  "origin/main changed",
);
assert(git(["stash", "list"]) === "", "stash must be empty");
git(["diff", "--check", baseline, "--"]);
const taskPaths = currentTaskPaths();
assertExactPaths(taskPaths, exactPaths, "exact R3-R1 scope");
assertExactPaths(contract.exact_mutation_paths, exactPaths, "contract scope");
assertExactPaths(
  contract.immutable_r3_paths,
  immutableR3Paths,
  "immutable R3 scope",
);

assert(
  contract.task_id === "M2-P4-I3-R1-C1-R3-R1" &&
    contract.baseline === baseline &&
    contract.main_baseline === mainBaseline &&
    contract.branch === branch &&
    contract.case_count === 8 &&
    contract.provider_calls === 0 &&
    contract.provider_rerun_authorized === false &&
    contract.frozen_r3_status ===
      "evaluation_blocked_pending_human_chatgpt_review" &&
    contract.frozen_r3_verdict === "EVALUATION_BLOCKED" &&
    contract.frozen_evaluator_preserved === true &&
    contract.exact_mutation_path_count === 13 &&
    contract.active_runtime_changed === false &&
    contract.c2_authorized === false,
  "adjudication contract boundary invalid",
);
assert(
  same(contract.replay_input_fields, [
    "call.synthetic_input",
    "call.raw_output",
  ]),
  "offline replay input boundary differs",
);
assert(
  same(contract.practical_reason_adjudication.always_compared_fields, [
    "kind",
    "active",
  ]) &&
    contract.practical_reason_adjudication.deadline_rule ===
      "schema_valid_and_compared_only_when_explicitly_expected",
  "practical reason subset contract differs",
);
assert(
  same(
    contract.r3_08_user_goal_adjudication.values,
    R3_08_ALLOWED_USER_GOAL_VALUES,
  ) &&
    same(
      contract.r3_08_user_goal_adjudication.bases,
      R3_08_ALLOWED_USER_GOAL_BASES,
    ) &&
    same(
      contract.r3_08_user_goal_adjudication.forbidden_bases,
      R3_08_FORBIDDEN_USER_GOAL_BASES,
    ),
  "R3-08 user-goal adjudication differs",
);

const storedResults = json(resultsPath);
assert(same(actualResults, storedResults), "stored offline replay result differs");
assert(
  actualResults.status ===
    "offline_adjudication_passed_pending_human_chatgpt_review",
  "offline adjudication did not pass",
);
for (const [metricName, expected] of Object.entries(
  contract.required_metrics,
)) {
  if (metricName === "provider_output_mutation_count") {
    assert(
      actualResults.provider_output_mutation_count === expected,
      metricName + " differs",
    );
  } else if (metricName === "expected_data_injection_count") {
    assert(
      actualResults.expected_data_injection_count === expected,
      metricName + " differs",
    );
  } else {
    const metric = actualResults.metrics[metricName];
    assert(
      metric && metric.passed + "/" + metric.total === expected,
      metricName + " differs",
    );
  }
}

assert(
  capabilities.task_id === contract.task_id &&
    capabilities.status === actualResults.status &&
    capabilities.baseline === baseline &&
    capabilities.branch === branch &&
    capabilities.exact_mutation_path_count === 13 &&
    same(capabilities.exact_mutation_paths, exactPaths) &&
    capabilities.saved_calls_replayed === 8 &&
    capabilities.provider_calls === 0 &&
    capabilities.provider_rerun === false &&
    capabilities.provider_outputs_mutated === 0 &&
    capabilities.expected_data_injection === 0 &&
    capabilities.frozen_r3_verdict === "EVALUATION_BLOCKED" &&
    capabilities.frozen_evaluator_preserved === true &&
    capabilities.frozen_results_preserved === true &&
    capabilities.provider_semantic_quality_established === true &&
    capabilities.provider_quality_scope ===
      "exact_eight_case_pb01_v7_semantic_suite" &&
    capabilities.candidate_pipeline_confirmation_passed === true &&
    capabilities.candidate_ready_for_isolated_e2e === true &&
    capabilities.active_runtime_changed === false &&
    capabilities.main_changed === false &&
    capabilities.protected_diff === 0 &&
    capabilities.c2_eligible === false &&
    capabilities.c2_authorized === false &&
    capabilities.next_candidate ===
      "M2-P4-I3-R1-C1-R4 Isolated Candidate Runtime E2E" &&
    capabilities.next_candidate_authorized === false,
  "capability state differs",
);

for (const call of replayedCalls) {
  assert(
    call.raw_schema_passed &&
      call.grounded_schema_passed &&
      call.writing_context_integrity_v2_passed &&
      call.contextual_intake_integrity_passed &&
      call.evaluation.hard_failures.length === 0 &&
      call.provider_output_mutated === false &&
      call.expected_data_injection === false,
    call.case_id + " offline replay failed",
  );
  assert(
    canonicalOutcomePass(call.case_id, call.grounded_output),
    call.case_id + " canonical inference outcome differs",
  );
}

const r303 = replayedCalls.find((call) => call.case_id === "R3-03");
const r307 = replayedCalls.find((call) => call.case_id === "R3-07");
const r308 = replayedCalls.find((call) => call.case_id === "R3-08");
assert(r303 && r307 && r308, "target replay calls missing");

const directCanonicalInput = structuredClone(r303.raw_output);
const directCanonicalInputBefore = structuredClone(directCanonicalInput);
const directCanonicalOutput =
  canonicalizeContextInferencesV5(directCanonicalInput);
assert(
  same(directCanonicalInput, directCanonicalInputBefore),
  "canonicalizer mutated its raw input",
);
assert(
  same(inferencePaths(directCanonicalOutput), [
    "latest_direct_message.kind",
    "latest_direct_message.response_expectation",
  ]),
  "direct canonicalizer outcome differs",
);

const unresolvedInferenceMutant = structuredClone(r303.grounded_output);
unresolvedInferenceMutant.context_inferences.push(
  structuredClone(
    r303.raw_output.context_inferences.find(
      (inference) =>
        inference.field_path === "contact_state.usual_cadence_relation",
    ),
  ),
);
unresolvedInferenceMutant.decision_facts.information_state.used_context_inference =
  true;
assert(
  !passes(() =>
    validateContextualIntakeIntegrityV3(unresolvedInferenceMutant),
  ),
  "mutation survived: unresolved inference remained",
);

const removedKnownInferenceMutant = structuredClone(r303.grounded_output);
removedKnownInferenceMutant.context_inferences =
  removedKnownInferenceMutant.context_inferences.filter(
    (inference) => inference.field_path !== "latest_direct_message.kind",
  );
assert(
  !canonicalOutcomePass("R3-03", removedKnownInferenceMutant),
  "mutation survived: known resolved inference removed",
);

const practicalCalls = replayedCalls.filter(
  (call) => call.practical_reason_applicable,
);
assert(practicalCalls.length === 4, "practical applicable case count differs");
for (const call of practicalCalls) {
  const qualityCase = qualityContract.cases.find(
    (item) => item.case_id === call.case_id,
  );
  const expected = qualityCase.decision_fact_subset.practical_reason;
  const raw = call.raw_output.decision_facts.practical_reason;
  const grounded = call.grounded_output.decision_facts.practical_reason;
  assert(
    practicalReasonMatchesV1(raw, expected) &&
      practicalReasonMatchesV1(grounded, expected),
    call.case_id + " subset comparison failed",
  );
  assert(
    !same(raw, expected) && !same(grounded, expected),
    "mutation precondition missing: full-object comparison unexpectedly passed",
  );
}

const optionalGoalMutant = structuredClone(r308);
optionalGoalMutant.raw_output = structuredClone(r308.raw_output);
optionalGoalMutant.raw_output.writing_signals.user_goal_detail.basis =
  "optional_message";
optionalGoalMutant.evaluation = adjudicateOfflineProviderCallV1({
  call: optionalGoalMutant,
  contract: sourceContract,
  qualityCase: qualityContract.cases.find((item) => item.case_id === "R3-08"),
});
assert(
  optionalGoalMutant.evaluation.hard_failures.includes(
    "R3-08-USER-GOAL-BASIS",
  ),
  "mutation survived: optional_message accepted as R3-08 goal basis",
);

const providerOutputMutant = structuredClone(replayedCalls[0].raw_output);
providerOutputMutant.schema_version += "-mutated";
assert(
  shaDiagnosticJson(providerOutputMutant) !==
    replayedCalls[0].raw_output_sha256,
  "mutation survived: saved Provider output mutation undetected",
);

const canonicalizerSource = source(canonicalizerPath);
const groundingSource = source(groundingPath);
const adjudicatorSource = source(adjudicatorPath);
const verifierSource = source(verifierPath);
assert(
  canonicalizerSource.includes("structuredClone(structuredIntake)") &&
    canonicalizerSource.includes("unresolvedFields.has") &&
    canonicalizerSource.includes("finalValue !== null") &&
    canonicalizerSource.includes('finalValue !== "unknown"') &&
    canonicalizerSource.includes("used_context_inference") &&
    !canonicalizerSource.includes("R3-") &&
    !canonicalizerSource.includes("currentSituation") &&
    !canonicalizerSource.includes("optionalMessage"),
  "Production canonicalizer boundary invalid",
);
const guardIndex = groundingSource.indexOf("const guardedDecisionFacts");
const canonicalIndex = groundingSource.indexOf("const canonicalized");
const finalWritingIndex = groundingSource.lastIndexOf("groundWritingSignalsV1(");
assert(
  guardIndex >= 0 &&
    canonicalIndex > guardIndex &&
    finalWritingIndex > canonicalIndex,
  "candidate v5 grounding order invalid",
);
for (const forbiddenInvocation of [
  "Open" + "AiResponsesTransport",
  "responses" + ".create(",
  "new " + "OpenAI(",
  "fetch" + "(",
  ".inv" + "oke(",
  "create" + "Client(",
]) {
  assert(
    !adjudicatorSource.includes(forbiddenInvocation) &&
      !verifierSource.includes(forbiddenInvocation),
    "offline tool contains external invocation capability",
  );
}

const activeCatalog = await loadM2P4ProductQualityRuntimeStageCatalog();
assert(
  activeCatalog.promptBundleVersion === "prompt-bundle-runtime-v4.0.0" &&
    activeCatalog.schemaSetVersion === "pipeline-schema-runtime-v3.0.0",
  "Active Runtime changed",
);
const protectedDiff = taskPaths.filter(
  (relativePath) =>
    (/^(?:app|components|fixtures|lib|public|supabase)\//u.test(
      relativePath,
    ) || /^package(?:-lock)?\.json$/u.test(relativePath)) &&
    !authorizedCandidateProductionPaths.has(relativePath),
);
assert(protectedDiff.length === 0, "protected diff is nonzero");

assert(
  frozenResults.status ===
    "evaluation_blocked_pending_human_chatgpt_review" &&
    frozenResults.evaluation.verdict === "EVALUATION_BLOCKED" &&
    frozenResults.calls_actual === 8 &&
    frozenResults.calls_completed === 8 &&
    frozenResults.rerun_authorized === false,
  "frozen R3 result semantics changed",
);
assert(
  sha256(source(sourceResultsPath)) ===
    sha256(
      git(["show", baseline + ":" + sourceResultsPath]).replaceAll(
        "\r\n",
        "\n",
      ),
    ),
  "frozen R3 result text changed",
);

console.log("M2_P4_I3_R1_C1_R3_R1_OFFLINE_ADJUDICATION: PASS");
console.log("exact_scope: 13/13");
console.log("raw_schema_v5: 8/8");
console.log("grounded_schema_v4: 8/8");
console.log("writing_context_integrity_v2: 8/8");
console.log("contextual_intake_integrity_v3: 8/8");
console.log("application_decision_facts: 8/8");
console.log("provider_semantic_core_adjudicated: 8/8");
console.log("message_ownership: 8/8");
console.log("boundary_ownership: 8/8");
console.log("candidate_presence: 8/8");
console.log("candidate_style: 4/4");
console.log("candidate_intent: 4/4");
console.log("relationship_limits: 8/8");
console.log("privacy_repeat_injection: 8/8");
console.log("practical_reason: 4/4");
console.log("correction_gates: 4/4");
console.log("cases: 8/8");
console.log("provider_calls: 0");
console.log("provider_output_mutation: 0");
console.log("expected_data_injection: 0");
console.log("r3_evidence_immutable: PASS");
console.log("active_runtime_changed: false");
console.log("c2_authorized: false");
console.log("protected_diff: 0");
console.log("git_diff_check: PASS");
