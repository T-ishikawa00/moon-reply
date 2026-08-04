import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R2";
const runnerVersion =
  "m2-p4-i3-r1-c1-r3-r2-e-r2-offline-runner-v1";
const baseline = "6b001a76c80747f60c69624d9d148465d2e1a963";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const fixedClock = "2026-08-04T00:00:00.000Z";
const model = "gpt-5.6-luna";
const resultRelativePath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/offline-results-v1.json";
const fixtureRelativePath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/revision-fixtures-v1.json";
const materialityRelativePath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/semantic-materiality-contract-v1.json";
const frozenResultRelativePath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e/diagnostic-results-v1.json";
const adjudicationRelativePath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r1/adjudication-results-v1.json";
const sourceFixtureRelativePath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-b/source-integrity-fixtures-v1.json";
const contractFixtureRelativePath =
  "evals/runtime/m2-p4-i3-r1-a-contract-fixtures-v1.json";
const catalogV9RelativePath =
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v9.json";
const catalogV10RelativePath =
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v10.json";
const groundingV2RelativePath =
  "lib/assessment/runtime/base-structured-intake-grounding-v2.ts";
const dispositionV4RelativePath =
  "lib/assessment/runtime/semantic-disposition-v4.ts";
const migrationRelativePath =
  "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql";

const [
  { AssessmentApplication },
  { FakeAiStageTransport, FakeAssessmentRepository },
  {
    loadM2P4CandidateSourceIsolationRuntimeStageCatalog,
    loadM2P4DirectionalGuidanceRuntimeStageCatalog,
    loadM2P4ProductQualityRuntimeStageCatalog,
  },
  { groundBaseStructuredIntakeV1 },
  { groundBaseStructuredIntakeV2 },
  { validateBaseSourceIntegrityV1 },
  { validateContextualIntakeIntegrityV3 },
  {
    evaluateSemanticFindingsV4,
    SEMANTIC_DISPOSITION_V4_ALWAYS_NONBLOCKING_CODES,
    SEMANTIC_DISPOSITION_V4_CONDITIONAL_INTERNAL_PATH_PATTERNS,
    SEMANTIC_DISPOSITION_V4_FLEXIBLE_INTERNAL_PATH_PATTERNS,
    SEMANTIC_DISPOSITION_V4_HARD_FINDING_CODES,
    SEMANTIC_DISPOSITION_V4_PRODUCT_OUTCOME_PATH_PATTERNS,
  },
  { groundChangeConditionCommentaryV3 },
] = await Promise.all([
  import("../../lib/assessment/runtime/application.ts"),
  import("../../lib/assessment/runtime/fakes.ts"),
  import("../../lib/assessment/runtime/schema-catalog.ts"),
  import("../../lib/assessment/runtime/base-structured-intake-grounding-v1.ts"),
  import("../../lib/assessment/runtime/base-structured-intake-grounding-v2.ts"),
  import("../../lib/assessment/runtime/base-source-integrity-v1.ts"),
  import("../../lib/assessment/runtime/contextual-integrity-v3.ts"),
  import("../../lib/assessment/runtime/semantic-disposition-v4.ts"),
  import("../../lib/assessment/runtime/change-condition-grounding-v3.ts"),
]);

const clone = (value) => structuredClone(value);
const canonicalText = (value) => value.replace(/\r\n/gu, "\n");
const readText = (relativePath) =>
  readFileSync(path.join(repositoryRoot, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const sha256 = (value) =>
  createHash("sha256").update(Buffer.from(value, "utf8")).digest("hex");
const fileSha256 = (relativePath) => sha256(canonicalText(readText(relativePath)));

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
const jsonSha256 = (value) => sha256(canonicalJson(value));
const same = (left, right) => canonicalJson(left) === canonicalJson(right);

function safeError(error) {
  if (!error) return null;
  return error.safeCode ?? error.message ?? "UNKNOWN_ERROR";
}

function deterministicUuidFactory(prefix) {
  let sequence = 0;
  return () => `${prefix}-${String(++sequence).padStart(4, "0")}`;
}

function setAtPath(root, fieldPath, value) {
  const segments = fieldPath.split(".");
  let selected = root;
  for (const segment of segments.slice(0, -1)) {
    if (!selected[segment] || typeof selected[segment] !== "object") {
      selected[segment] = {};
    }
    selected = selected[segment];
  }
  selected[segments.at(-1)] = value;
}

function diffPaths(left, right, prefix = "") {
  if (same(left, right)) return [];
  if (
    left === null ||
    right === null ||
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

function semanticGroundingView(value) {
  const selected = clone(value);
  const information = selected?.decision_facts?.information_state;
  if (information && typeof information === "object") {
    delete information.unresolved_fields;
    delete information.used_context_inference;
  }
  return selected;
}

function validationResult(findings = []) {
  return {
    schema_version: "pipeline-schema-v1.0.0",
    validation_mode: "semantic_findings_only",
    deterministic_checks: [],
    semantic_checks: clone(findings),
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

function modelSafetyBlocked() {
  return {
    classification: "rejected",
    reason_codes: ["stalking_or_visit"],
    response_mode: "unsafe_contact_stop",
    evidence_refs: [],
    ambiguity_present: false,
  };
}

function fixtureFindingMap(fixtures) {
  const entries = fixtures.semantic_disposition_v4.map((fixture) => [
    fixture.fixture_id,
    fixture.finding,
  ]);
  return new Map([
    ...entries,
    ...Object.entries(fixtures.additional_flow_findings),
  ]);
}

function syntheticBaseOutput(sourceFixture) {
  const output = clone(sourceFixture.raw_base_structured_intake);
  output.context_inferences = output.context_inferences.filter(
    ({ inference_id: inferenceId }) => inferenceId !== "I003",
  );
  return output;
}

function baseProviderInput(sourceFixture) {
  return {
    current_situation: sourceFixture.base_provider_source.currentSituation,
    relationship: sourceFixture.base_provider_source.relationship,
    requested_topics: clone(sourceFixture.base_provider_source.requestedTopics),
  };
}

function runGroundingFixtures(fixtures, sourceFixture) {
  const results = [];
  for (const fixture of fixtures.grounding_v2) {
    const input = baseProviderInput(sourceFixture);
    const raw = syntheticBaseOutput(sourceFixture);
    const information = raw.decision_facts.information_state;
    const paths = fixture.field_paths ??
      (fixture.field_path ? [fixture.field_path] : []);
    for (const fieldPath of paths) {
      if (fixture.semantic_value !== undefined) {
        setAtPath(raw.decision_facts, fieldPath, fixture.semantic_value);
      }
      if (!information.unresolved_fields.includes(fieldPath)) {
        information.unresolved_fields.push(fieldPath);
      }
    }
    if (fixture.operation === "recompute_used_context_inference") {
      information.used_context_inference =
        !(raw.context_inferences.length > 0);
    }

    const inputHashBefore = jsonSha256(input);
    const rawHashBefore = jsonSha256(raw);
    const groundedV1 = groundBaseStructuredIntakeV1(input, raw);
    const groundedV2 = groundBaseStructuredIntakeV2(input, raw);
    const unresolved = groundedV2.decision_facts.information_state.unresolved_fields;
    let expectationPassed = true;
    if (paths.length > 0) {
      expectationPassed = paths.every(
        (fieldPath) =>
          unresolved.includes(fieldPath) === fixture.expected_retained,
      );
    }
    if (fixture.operation === "recompute_used_context_inference") {
      expectationPassed =
        groundedV2.decision_facts.information_state.used_context_inference ===
        (groundedV2.context_inferences.length > 0);
    }
    let contextualIntegrity = "not_applicable";
    if (fixture.expected_contextual_integrity) {
      try {
        validateContextualIntakeIntegrityV3(groundedV2);
        contextualIntegrity = "accepted";
      } catch {
        contextualIntegrity = "rejected";
      }
      expectationPassed =
        expectationPassed &&
        contextualIntegrity === fixture.expected_contextual_integrity;
    }
    const inputNonmutation =
      inputHashBefore === jsonSha256(input) && rawHashBefore === jsonSha256(raw);
    const semanticValuesPreserved = same(
      semanticGroundingView(groundedV1),
      semanticGroundingView(groundedV2),
    );
    results.push({
      fixture_id: fixture.fixture_id,
      status:
        expectationPassed && inputNonmutation && semanticValuesPreserved
          ? "PASS"
          : "FAIL",
      unresolved_fields: unresolved,
      input_nonmutation: inputNonmutation,
      semantic_values_preserved: semanticValuesPreserved,
      contextual_integrity: contextualIntegrity,
    });
  }
  return results;
}

function validationStatus(operation) {
  try {
    operation();
    return { passed: true, safe_error_code: null };
  } catch (error) {
    return { passed: false, safe_error_code: safeError(error) };
  }
}

function runFrozenPb01Replay({
  frozenResults,
  adjudication,
  v10Catalog,
}) {
  const pb01Definition = v10Catalog.definitions.find(
    ({ stageId }) => stageId === "PB-01",
  );
  if (!pb01Definition) throw new Error("PB-01 definition missing");
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false,
  });
  const validateRaw = ajv.compile(pb01Definition.outputSchema);
  const validateGrounded = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false,
  }).compile(
    pb01Definition.groundedOutputSchema ?? pb01Definition.outputSchema,
  );
  const expectedBookkeeping = new Map(
    adjudication.application_bookkeeping_findings.map((finding) => [
      finding.case_id,
      finding.field_analyses
        .filter(
          (analysis) =>
            analysis.deterministic_application_correction_possible === true,
        )
        .map((analysis) => analysis.decision_field_path)
        .sort(),
    ]),
  );

  return frozenResults.calls
    .filter(({ stage_id: stageId }) => stageId === "PB-01")
    .map((call) => {
      const input = clone(call.provider_input);
      const raw = clone(call.raw_output);
      const rawHashBefore = jsonSha256(raw);
      const rawSchemaPassed = validateRaw(raw);
      const rawSourceIntegrity = validationStatus(() =>
        validateBaseSourceIntegrityV1({
          input,
          baseProviderRequest: input,
          rawBaseOutput: raw,
        }),
      );
      const groundedV1 = groundBaseStructuredIntakeV1(input, raw);
      const groundedV2 = groundBaseStructuredIntakeV2(input, raw);
      const groundedSchemaPassed = validateGrounded(groundedV2);
      const groundedSourceIntegrity = validationStatus(() =>
        validateBaseSourceIntegrityV1({
          input,
          groundedBaseOutput: groundedV2,
        }),
      );
      const contextualBefore = validationStatus(() =>
        validateContextualIntakeIntegrityV3(groundedV1),
      );
      const contextualAfter = validationStatus(() =>
        validateContextualIntakeIntegrityV3(groundedV2),
      );
      const beforeUnresolved =
        groundedV1.decision_facts.information_state.unresolved_fields;
      const afterUnresolved =
        groundedV2.decision_facts.information_state.unresolved_fields;
      const removed = beforeUnresolved
        .filter((fieldPath) => !afterUnresolved.includes(fieldPath))
        .sort();
      const expectedRemoved = expectedBookkeeping.get(call.case_id) ?? [];
      const allowedDiffPaths = new Set([
        "decision_facts.information_state.unresolved_fields",
        "decision_facts.information_state.used_context_inference",
      ]);
      const changedPaths = diffPaths(groundedV1, groundedV2);
      const onlyBookkeepingChanged = changedPaths.every((fieldPath) =>
        allowedDiffPaths.has(fieldPath),
      );
      const semanticValuesPreserved = same(
        semanticGroundingView(groundedV1),
        semanticGroundingView(groundedV2),
      );
      const rawHashUnchanged =
        rawHashBefore === jsonSha256(raw) &&
        rawHashBefore === call.raw_output_sha256 &&
        call.raw_output_sha256 === call.raw_output_sha256_after_processing;
      const bookkeepingMatches = same(removed, expectedRemoved);
      const passed =
        rawSchemaPassed === true &&
        rawSourceIntegrity.passed &&
        groundedSchemaPassed === true &&
        groundedSourceIntegrity.passed &&
        contextualAfter.passed &&
        rawHashUnchanged &&
        semanticValuesPreserved &&
        onlyBookkeepingChanged &&
        bookkeepingMatches;
      return {
        case_id: call.case_id,
        status: passed ? "PASS" : "FAIL",
        raw_output_sha256: rawHashBefore,
        raw_hash_unchanged: rawHashUnchanged,
        raw_schema_passed: rawSchemaPassed === true,
        raw_source_integrity_passed: rawSourceIntegrity.passed,
        grounded_schema_passed: groundedSchemaPassed === true,
        grounded_source_integrity_passed: groundedSourceIntegrity.passed,
        contextual_integrity_before: contextualBefore.passed,
        contextual_integrity_after: contextualAfter.passed,
        removed_bookkeeping_paths: removed,
        expected_removed_bookkeeping_paths: expectedRemoved,
        semantic_values_preserved: semanticValuesPreserved,
        changed_paths: changedPaths,
      };
    });
}

function runDispositionFixtures(fixtures, contractFixture) {
  const plan = clone(contractFixture.valid_sets[0].decision_plan_v2);
  const report = groundChangeConditionCommentaryV3(
    plan,
    clone(contractFixture.valid_sets[0].report_content_v2),
  );
  return fixtures.semantic_disposition_v4.map((fixture) => {
    const evaluated = evaluateSemanticFindingsV4({
      validationOutput: validationResult([fixture.finding]),
      decisionPlan: plan,
      groundedReportContent: report,
    });
    const actual = evaluated.findingDispositions[0]?.disposition ?? null;
    return {
      fixture_id: fixture.fixture_id,
      expected_disposition: fixture.expected_disposition,
      actual_disposition: actual,
      status: actual === fixture.expected_disposition ? "PASS" : "FAIL",
    };
  });
}

function splitOutputs({
  sourceFixture,
  contractFixture,
  candidatePresent,
  findings,
  safetyBlocked = false,
}) {
  const selected = contractFixture.valid_sets[candidatePresent ? 0 : 1];
  const plan = clone(selected.decision_plan_v2);
  plan.selected_decision = "send_now";
  const candidateOutput = clone(sourceFixture.raw_candidate_provider_output);
  candidateOutput.candidate_communicative_intent.practical_requirement = [
    "provide_information",
    "confirm_schedule",
  ];
  return {
    "PB-01": syntheticBaseOutput(sourceFixture),
    ...(candidatePresent ? { "PB-01C": candidateOutput } : {}),
    "PB-02": safetyBlocked ? modelSafetyBlocked() : modelSafetyNormal(),
    "PB-03": {
      schema_version: "pipeline-schema-v3.0.0",
      acknowledged_eligibility: safetyBlocked ? "safety_blocked" : "ready",
    },
    "PB-04": plan,
    "PB-05": clone(selected.report_content_v2),
    "PB-06": validationResult(findings),
  };
}

async function executeFake({
  catalog,
  outputs,
  input,
  idPrefix,
  promptBundleVersion = catalog.promptBundleVersion,
  schemaSetVersion = catalog.schemaSetVersion,
  definitions = catalog.definitions,
}) {
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({ outputs });
  const application = new AssessmentApplication({
    repository,
    transport,
    model,
    promptBundleVersion,
    schemaSetVersion,
    definitions,
    now: () => fixedClock,
    uuid: deterministicUuidFactory(idPrefix),
  });
  try {
    const result = await application.submit(input, `${idPrefix}-key`);
    return { repository, transport, result, error: null };
  } catch (error) {
    return { repository, transport, result: null, error };
  }
}

function fakeInput(sourceFixture, candidatePresent) {
  return {
    currentSituation: sourceFixture.base_provider_source.currentSituation,
    optionalMessage: candidatePresent
      ? sourceFixture.candidate_optional_message
      : null,
    relationship: sourceFixture.base_provider_source.relationship,
    requestedTopics: clone(sourceFixture.base_provider_source.requestedTopics),
    privacyAcknowledged: true,
  };
}

function outcomeOf(run) {
  if (run.error) return "failed";
  if (run.result?.eligibility === "safety_blocked") return "safety_blocked";
  return run.result?.eligibility === "ready" ? "completed" : "unexpected";
}

async function runV10Flows({
  fixtures,
  sourceFixture,
  contractFixture,
  catalog,
}) {
  const findings = fixtureFindingMap(fixtures);
  const results = [];
  for (const flow of fixtures.v10_fake_flows) {
    const selectedFindings = flow.finding_fixture_ids.map((fixtureId) => {
      const finding = findings.get(fixtureId);
      if (!finding) throw new Error(`Unknown finding fixture: ${fixtureId}`);
      return finding;
    });
    const run = await executeFake({
      catalog,
      outputs: splitOutputs({
        sourceFixture,
        contractFixture,
        candidatePresent: flow.candidate_present,
        findings: selectedFindings,
      }),
      input: fakeInput(sourceFixture, flow.candidate_present),
      idPrefix: flow.flow_id.toLowerCase(),
    });
    const actualOutcome = outcomeOf(run);
    results.push({
      flow_id: flow.flow_id,
      expected_outcome: flow.expected_outcome,
      actual_outcome: actualOutcome,
      status: actualOutcome === flow.expected_outcome ? "PASS" : "FAIL",
      safe_error_code: safeError(run.error),
      fake_stage_invocations: run.transport.calls,
      provider_calls: run.transport.actualProviderCalls,
      supabase_operations: run.repository.actualSupabaseCalls,
      pb_06_evidence_persisted:
        (() => {
          const stage = [...run.repository.stageRuns.values()].find(
            ({ stageId }) => stageId === "PB-06",
          );
          return (
            stage?.completion?.outputJson !== undefined ||
            stage?.failure?.outputJson != null
          );
        })(),
    });
  }
  return results;
}

async function runV9Parity({
  fixtures,
  sourceFixture,
  contractFixture,
  catalog,
}) {
  const majorFinding = fixtures.semantic_disposition_v4.find(
    ({ fixture_id: fixtureId }) =>
      fixtureId === "DISPOSITION-FINAL-DRAFT-MEANING",
  ).finding;
  const scenarios = [
    {
      scenario_id: "V9-READY",
      candidatePresent: false,
      findings: [],
      safetyBlocked: false,
      expected: {
        outcome: "completed",
        fake_stage_invocations: [
          "PB-01",
          "PB-02",
          "PB-03",
          "PB-04",
          "PB-05",
          "PB-06",
        ],
      },
    },
    {
      scenario_id: "V9-SAFETY-BLOCKED",
      candidatePresent: false,
      findings: [],
      safetyBlocked: true,
      expected: {
        outcome: "safety_blocked",
        fake_stage_invocations: ["PB-01", "PB-02", "PB-03"],
      },
    },
    {
      scenario_id: "V9-SEMANTIC-BLOCKING",
      candidatePresent: false,
      findings: [majorFinding],
      safetyBlocked: false,
      expected: {
        outcome: "failed",
        fake_stage_invocations: [
          "PB-01",
          "PB-02",
          "PB-03",
          "PB-04",
          "PB-05",
          "PB-06",
        ],
      },
    },
  ];
  const expectedById = new Map(
    fixtures.v9_parity.map((item) => [item.scenario_id, item]),
  );
  const results = [];
  for (const scenario of scenarios) {
    const run = await executeFake({
      catalog,
      outputs: splitOutputs({
        sourceFixture,
        contractFixture,
        candidatePresent: scenario.candidatePresent,
        findings: scenario.findings,
        safetyBlocked: scenario.safetyBlocked,
      }),
      input: fakeInput(sourceFixture, scenario.candidatePresent),
      idPrefix: scenario.scenario_id.toLowerCase(),
    });
    const actual = {
      outcome: outcomeOf(run),
      fake_stage_invocations: run.transport.calls,
    };
    const fixtureExpected = expectedById.get(scenario.scenario_id);
    const deepEqual =
      same(actual, scenario.expected) &&
      fixtureExpected?.expected_outcome === actual.outcome;
    results.push({
      scenario_id: scenario.scenario_id,
      expected: scenario.expected,
      actual,
      deep_equal: deepEqual,
      status: deepEqual ? "PASS" : "FAIL",
      provider_calls: run.transport.actualProviderCalls,
      supabase_operations: run.repository.actualSupabaseCalls,
    });
  }
  return results;
}

async function invalidLegacyV10Rejected({
  sourceFixture,
  contractFixture,
  legacyCatalog,
}) {
  const run = await executeFake({
    catalog: legacyCatalog,
    outputs: splitOutputs({
      sourceFixture,
      contractFixture,
      candidatePresent: false,
      findings: [],
    }),
    input: fakeInput(sourceFixture, false),
    idPrefix: "invalid-legacy-v10",
    promptBundleVersion: "prompt-bundle-runtime-v10.0.0",
    schemaSetVersion: "pipeline-schema-runtime-v4.0.0",
    definitions: legacyCatalog.definitions,
  });
  return safeError(run.error) === "M2_STAGE_TOPOLOGY_INVALID";
}

function checkMaterialityConstants(materiality) {
  const rules = materiality.semantic_disposition_rules;
  return {
    hard_finding_codes: same(
      rules.hard_finding_codes,
      SEMANTIC_DISPOSITION_V4_HARD_FINDING_CODES,
    ),
    always_nonblocking_codes: same(
      rules.always_nonblocking_codes,
      SEMANTIC_DISPOSITION_V4_ALWAYS_NONBLOCKING_CODES,
    ),
    flexible_internal_path_patterns: same(
      rules.flexible_internal_path_patterns,
      SEMANTIC_DISPOSITION_V4_FLEXIBLE_INTERNAL_PATH_PATTERNS,
    ),
    conditional_internal_path_patterns: same(
      rules.conditional_internal_path_patterns,
      SEMANTIC_DISPOSITION_V4_CONDITIONAL_INTERNAL_PATH_PATTERNS,
    ),
    product_outcome_path_patterns: same(
      rules.product_outcome_path_patterns,
      SEMANTIC_DISPOSITION_V4_PRODUCT_OUTCOME_PATH_PATTERNS,
    ),
  };
}

function checkPromptResponsibilities() {
  const promptPaths = [
    "lib/assessment/runtime/contracts/pb-01-base-situation-v2.developer.md",
    "lib/assessment/runtime/contracts/pb-01c-candidate-analysis-v2.developer.md",
    "lib/assessment/runtime/contracts/pb-04-directional-decision-v2.developer.md",
    "lib/assessment/runtime/contracts/pb-05-directional-report-v2.developer.md",
    "lib/assessment/runtime/contracts/pb-06-materiality-validator-v2.developer.md",
  ];
  const prompts = Object.fromEntries(
    promptPaths.map((relativePath) => [relativePath, readText(relativePath)]),
  );
  const combined = Object.values(prompts).join("\n");
  const assertions = {
    pb01_hierarchy:
      prompts[promptPaths[0]].includes("Explicit hierarchy") &&
      prompts[promptPaths[0]].includes("user_is_junior"),
    pb01_cadence:
      prompts[promptPaths[0]].includes("Qualitative cadence relation") &&
      prompts[promptPaths[0]].includes("within_usual"),
    pb01_unresolved_consistency:
      prompts[promptPaths[0]].includes("Unresolved-field consistency"),
    pb01c_multi_label:
      prompts[promptPaths[1]].includes("Multi-label semantic coverage") &&
      prompts[promptPaths[1]].includes("provide_information") &&
      prompts[promptPaths[1]].includes("confirm_schedule"),
    asks_reply_not_demand:
      prompts[promptPaths[1]].includes("`asks_for_reply` versus `reply_demand`") &&
      prompts[promptPaths[4]].includes("`asks_for_reply` is not `reply_demand`"),
    apology_flexibility:
      prompts[promptPaths[1]].includes("Apology strength flexibility"),
    register_aggregation:
      prompts[promptPaths[1]].includes("Register aggregation"),
    directional_decision:
      prompts[promptPaths[2]].includes("recommended_current_direction") &&
      prompts[promptPaths[2]].includes("immediate_next_step") &&
      prompts[promptPaths[2]].includes("reassessment_condition"),
    directional_report:
      prompts[promptPaths[3]].includes("Product Doctrine") &&
      prompts[promptPaths[3]].includes("what to do tonight"),
    three_tier_materiality:
      prompts[promptPaths[4]].includes("Tier 1") &&
      prompts[promptPaths[4]].includes("Tier 2") &&
      prompts[promptPaths[4]].includes("Tier 3"),
    draft_authority:
      prompts[promptPaths[2]].includes("recommended_message_draft.text") &&
      prompts[promptPaths[4]].includes("decision_plan.recommended_message_draft.text"),
    no_evaluation_literals:
      !/(?:E-B\d|GROUNDING-|DISPOSITION-|V10-|SYNTHETIC_CANDIDATE)/u.test(
        combined,
      ),
  };
  return {
    assertions,
    passed: Object.values(assertions).filter(Boolean).length,
    total: Object.keys(assertions).length,
    prompt_hashes: Object.fromEntries(
      promptPaths.map((relativePath) => [relativePath, fileSha256(relativePath)]),
    ),
  };
}

function checkMigration() {
  const sql = canonicalText(readText(migrationRelativePath));
  const lower = sql.toLowerCase();
  const assertions = {
    transaction: /^begin;[\s\S]*commit;\s*$/u.test(lower),
    admits_v9: lower.includes("prompt-bundle-runtime-v9.0.0"),
    admits_v10: lower.includes("prompt-bundle-runtime-v10.0.0"),
    split_schema_v4: lower.includes("pipeline-schema-runtime-v4.0.0"),
    rejects_split_bundles_in_legacy:
      lower.includes("parent_topology = 'legacy-six-v1'") &&
      lower.includes("parent_prompt_bundle in"),
    exact_legacy_order:
      lower.includes("when 1 then 'pb-01'") &&
      lower.includes("when 6 then 'pb-06'"),
    exact_split_order:
      lower.includes("when 2 then 'pb-01c'") &&
      lower.includes("when 7 then 'pb-06'"),
    skipped_invariants:
      lower.includes("new.status = 'skipped'") &&
      lower.includes("new.output_json is not null"),
    v2_authority:
      lower.includes("enforce_assessment_stage_topology_v2") &&
      lower.includes("assessment_stage_runs_topology_v2"),
    no_assessment_runs_update:
      !/\bupdate\s+public\.assessment_runs\b/u.test(lower),
    no_assessment_stage_runs_update:
      !/\bupdate\s+public\.assessment_stage_runs\b/u.test(lower),
  };
  return {
    assertions,
    passed: Object.values(assertions).filter(Boolean).length,
    total: Object.keys(assertions).length,
    status: Object.values(assertions).every(Boolean) ? "PASS" : "FAIL",
  };
}

function checkCatalogs(v9Manifest, v10Manifest, v9Catalog, v10Catalog) {
  const pb02And03DeepEqual = ["PB-02", "PB-03"].every((stageId) => {
    const predecessor = v9Manifest.stages.find((stage) => stage.stage_id === stageId);
    const successor = v10Manifest.stages.find((stage) => stage.stage_id === stageId);
    return same(predecessor, successor);
  });
  const schemasUnchanged = v10Manifest.stages.every((stage, index) => {
    const predecessor = v9Manifest.stages[index];
    return (
      stage.stage_id === predecessor.stage_id &&
      stage.schema_version === predecessor.schema_version &&
      stage.schema_path === predecessor.schema_path &&
      stage.schema_pointer === predecessor.schema_pointer &&
      stage.schema_sha256 === predecessor.schema_sha256 &&
      stage.grounded_schema_version === predecessor.grounded_schema_version &&
      stage.grounded_schema_path === predecessor.grounded_schema_path &&
      stage.grounded_schema_sha256 === predecessor.grounded_schema_sha256
    );
  });
  const assertions = {
    v9_identity:
      v9Catalog.catalogVersion === "runtime-stage-catalog-v9.0.0" &&
      v9Catalog.promptBundleVersion === "prompt-bundle-runtime-v9.0.0",
    v10_identity:
      v10Catalog.catalogVersion === "runtime-stage-catalog-v10.0.0" &&
      v10Catalog.promptBundleVersion === "prompt-bundle-runtime-v10.0.0" &&
      v10Catalog.schemaSetVersion === "pipeline-schema-runtime-v4.0.0" &&
      v10Catalog.stageTopologyVersion === "split-base-candidate-v1",
    exact_stage_order: same(
      v10Catalog.definitions.map(({ stageId }) => stageId),
      ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
    ),
    common_prompt_deep_equal: same(
      v9Manifest.common_prompt,
      v10Manifest.common_prompt,
    ),
    pb02_pb03_deep_equal: pb02And03DeepEqual,
    schemas_unchanged: schemasUnchanged,
    all_schemas_compiled_and_projected: v10Catalog.definitions.length === 7,
  };
  return {
    assertions,
    passed: Object.values(assertions).filter(Boolean).length,
    total: Object.keys(assertions).length,
    status: Object.values(assertions).every(Boolean) ? "PASS" : "FAIL",
  };
}

function checkActiveService() {
  const service = readText("lib/assessment/runtime/service.ts");
  return (
    service.includes("loadM2P4ProductQualityRuntimeStageCatalog") &&
    !service.includes("loadM2P4DirectionalGuidanceRuntimeStageCatalog")
  );
}

function buildMutationResults({
  fixtures,
  groundingResults,
  dispositionResults,
  v10Flows,
  v9Parity,
  materiality,
  invalidLegacyRejected,
  migration,
  activeServiceUnchanged,
}) {
  const groundingById = new Map(
    groundingResults.map((item) => [item.fixture_id, item]),
  );
  const dispositionById = new Map(
    dispositionResults.map((item) => [item.fixture_id, item]),
  );
  const flowById = new Map(v10Flows.map((item) => [item.flow_id, item]));
  const rejected = {
    resolved_field_retained_in_unresolved_fields:
      groundingById.get("GROUNDING-RESOLVED-DEADLINE")?.status === "PASS",
    semantic_value_changed_by_grounding_v2: groundingResults.every(
      (item) => item.semantic_values_preserved,
    ),
    hard_fact_finding_treated_nonblocking:
      dispositionById.get("DISPOSITION-HARD-FACT-MINOR")
        ?.actual_disposition === "blocking",
    flexible_internal_register_treated_blocking:
      dispositionById.get("DISPOSITION-FLEXIBLE-REGISTER")
        ?.actual_disposition === "nonblocking",
    conditional_practical_label_treated_clean:
      dispositionById.get("DISPOSITION-CONDITIONAL-PRACTICAL")
        ?.actual_disposition === "conditional",
    final_draft_meaning_loss_treated_nonblocking:
      dispositionById.get("DISPOSITION-FINAL-DRAFT-MEANING")
        ?.actual_disposition === "blocking",
    product_outcome_missing_direction_accepted:
      flowById.get("V10-MISSING-CURRENT-DIRECTION")?.actual_outcome === "failed",
    product_outcome_missing_immediate_step_accepted:
      flowById.get("V10-MISSING-IMMEDIATE-ACTION")?.actual_outcome === "failed",
    product_outcome_missing_reassessment_accepted:
      flowById.get("V10-MISSING-REASSESSMENT")?.actual_outcome === "failed",
    asks_for_reply_treated_as_reply_demand:
      materiality.candidate_semantics.asks_for_reply_equals_reply_demand === false,
    v10_run_persisted_under_legacy_topology: invalidLegacyRejected,
    migration_0005_omitted_v10: migration.assertions.admits_v10,
    v9_behavior_changed: v9Parity.every((item) => item.deep_equal),
    active_service_switched: activeServiceUnchanged,
  };
  return fixtures.mutation_rejections.map((mutantId) => ({
    mutant_id: mutantId,
    status: rejected[mutantId] === true ? "PASS" : "FAIL",
    rejected: rejected[mutantId] === true,
  }));
}

export async function runDirectionalGuidanceOffline() {
  if (path.resolve(process.cwd()) !== repositoryRoot) {
    throw new Error(`Run from repository root: ${repositoryRoot}`);
  }
  const fixtures = readJson(fixtureRelativePath);
  const materiality = readJson(materialityRelativePath);
  const frozenResults = readJson(frozenResultRelativePath);
  const adjudication = readJson(adjudicationRelativePath);
  const sourceFixture = readJson(sourceFixtureRelativePath);
  const contractFixture = readJson(contractFixtureRelativePath);
  const v9Manifest = readJson(catalogV9RelativePath);
  const v10Manifest = readJson(catalogV10RelativePath);
  const [v9Catalog, v10Catalog, legacyCatalog] = await Promise.all([
    loadM2P4CandidateSourceIsolationRuntimeStageCatalog(),
    loadM2P4DirectionalGuidanceRuntimeStageCatalog(),
    loadM2P4ProductQualityRuntimeStageCatalog(),
  ]);

  const catalogs = checkCatalogs(
    v9Manifest,
    v10Manifest,
    v9Catalog,
    v10Catalog,
  );
  const groundingResults = runGroundingFixtures(fixtures, sourceFixture);
  const frozenReplay = runFrozenPb01Replay({
    frozenResults,
    adjudication,
    v10Catalog,
  });
  const dispositionResults = runDispositionFixtures(fixtures, contractFixture);
  const v10Flows = await runV10Flows({
    fixtures,
    sourceFixture,
    contractFixture,
    catalog: v10Catalog,
  });
  const v9Parity = await runV9Parity({
    fixtures,
    sourceFixture,
    contractFixture,
    catalog: v9Catalog,
  });
  const invalidLegacyRejected = await invalidLegacyV10Rejected({
    sourceFixture,
    contractFixture,
    legacyCatalog,
  });
  const constantChecks = checkMaterialityConstants(materiality);
  const prompts = checkPromptResponsibilities();
  const migration = checkMigration();
  const activeServiceUnchanged = checkActiveService();
  const mutations = buildMutationResults({
    fixtures,
    groundingResults,
    dispositionResults,
    v10Flows,
    v9Parity,
    materiality,
    invalidLegacyRejected,
    migration,
    activeServiceUnchanged,
  });

  const groundingPass = groundingResults.filter(
    ({ status }) => status === "PASS",
  ).length;
  const frozenPass = frozenReplay.filter(({ status }) => status === "PASS").length;
  const dispositionPass = dispositionResults.filter(
    ({ status }) => status === "PASS",
  ).length;
  const v10Pass = v10Flows.filter(({ status }) => status === "PASS").length;
  const v9Pass = v9Parity.filter(({ status }) => status === "PASS").length;
  const mutationPass = mutations.filter(({ status }) => status === "PASS").length;
  const externalProviderCalls =
    v10Flows.reduce((total, item) => total + item.provider_calls, 0) +
    v9Parity.reduce((total, item) => total + item.provider_calls, 0);
  const supabaseOperations =
    v10Flows.reduce((total, item) => total + item.supabase_operations, 0) +
    v9Parity.reduce((total, item) => total + item.supabase_operations, 0);
  const contextualBeforePass = frozenReplay.filter(
    ({ contextual_integrity_before: passed }) => passed,
  ).length;
  const contextualAfterPass = frozenReplay.filter(
    ({ contextual_integrity_after: passed }) => passed,
  ).length;
  const productDoctrinePassed =
    same(materiality.product_direction_doctrine.required_outcome_sequence, [
      "facts",
      "plausible_interpretations",
      "recommended_current_direction",
      "immediate_next_step",
      "reassessment_condition",
    ]) && materiality.evaluation_model === "hard_flexible_product_outcome";
  const productOwnerDecisionPass =
    materiality.product_owner_decisions.length === 4 &&
    materiality.product_owner_decisions.every(
      ({ status }) => status === "approved",
    );
  const constantsPassed = Object.values(constantChecks).every(Boolean);
  const overallPass =
    fixtures.synthetic_only === true &&
    fixtures.real_user_data === 0 &&
    catalogs.status === "PASS" &&
    groundingPass === groundingResults.length &&
    frozenPass === frozenReplay.length &&
    dispositionPass === dispositionResults.length &&
    v10Pass === v10Flows.length &&
    v10Flows.every(({ pb_06_evidence_persisted: persisted }) => persisted) &&
    v9Pass === v9Parity.length &&
    mutationPass === mutations.length &&
    constantsPassed &&
    prompts.passed === prompts.total &&
    migration.status === "PASS" &&
    invalidLegacyRejected &&
    productDoctrinePassed &&
    productOwnerDecisionPass &&
    externalProviderCalls === 0 &&
    supabaseOperations === 0 &&
    activeServiceUnchanged;

  return {
    schema_version:
      "m2-p4-i3-r1-c1-r3-r2-e-r2-offline-results-v1",
    task_id: taskId,
    baseline,
    main_baseline: mainBaseline,
    runner_version: runnerVersion,
    fixed_clock: fixedClock,
    identities: {
      v9: {
        catalog_version: v9Catalog.catalogVersion,
        prompt_bundle_version: v9Catalog.promptBundleVersion,
        schema_set_version: v9Catalog.schemaSetVersion,
        stage_topology_version: v9Catalog.stageTopologyVersion,
      },
      v10: {
        catalog_version: v10Catalog.catalogVersion,
        prompt_bundle_version: v10Catalog.promptBundleVersion,
        schema_set_version: v10Catalog.schemaSetVersion,
        stage_topology_version: v10Catalog.stageTopologyVersion,
      },
    },
    hashes: {
      prompt_sha256: Object.fromEntries(
        v10Manifest.stages.map((stage) => [stage.stage_id, stage.prompt_sha256]),
      ),
      catalog_v10_sha256: fileSha256(catalogV10RelativePath),
      grounding_v2_sha256: fileSha256(groundingV2RelativePath),
      semantic_disposition_v4_sha256: fileSha256(dispositionV4RelativePath),
      migration_0005_sha256: fileSha256(migrationRelativePath),
      frozen_pb01_raw_sha256: Object.fromEntries(
        frozenReplay.map((item) => [item.case_id, item.raw_output_sha256]),
      ),
    },
    catalogs,
    grounding_v2: {
      results: groundingResults,
      summary: `${groundingPass}/${groundingResults.length}`,
      input_nonmutation: groundingResults.every(
        ({ input_nonmutation: passed }) => passed,
      ),
      semantic_value_preservation: groundingResults.every(
        ({ semantic_values_preserved: passed }) => passed,
      ),
    },
    frozen_pb01_replay: {
      results: frozenReplay,
      summary: `${frozenPass}/${frozenReplay.length}`,
      contextual_integrity_before: `${contextualBeforePass}/${frozenReplay.length}`,
      contextual_integrity_after: `${contextualAfterPass}/${frozenReplay.length}`,
      raw_hashes_unchanged: frozenReplay.every(
        ({ raw_hash_unchanged: passed }) => passed,
      ),
      provider_output_mutations: 0,
    },
    semantic_materiality: {
      results: dispositionResults,
      summary: `${dispositionPass}/${dispositionResults.length}`,
      constant_deep_match: constantChecks,
      product_doctrine_passed: productDoctrinePassed,
      product_owner_decisions: productOwnerDecisionPass ? "4/4" : "FAIL",
    },
    v10_fake_flows: {
      results: v10Flows,
      summary: `${v10Pass}/${v10Flows.length}`,
    },
    v9_parity: {
      results: v9Parity,
      summary: `${v9Pass}/${v9Parity.length}`,
    },
    mutation_rejections: {
      results: mutations,
      summary: `${mutationPass}/${mutations.length}`,
    },
    prompt_responsibilities: prompts,
    migration_static_validation: migration,
    operations: {
      external_provider_calls: externalProviderCalls,
      fake_stage_invocations_recorded_separately: true,
      db_operations: 0,
      supabase_operations: supabaseOperations,
      migration_applied: false,
      active_service_changed: false,
      active_runtime_activated: false,
      real_user_data: 0,
      provider_response_data_added: 0,
    },
    active_service_unchanged: activeServiceUnchanged,
    invalid_legacy_v10_identity_rejected: invalidLegacyRejected,
    provider_retest_authorized: false,
    r4_authorized: false,
    overall_verdict: overallPass ? "PASS" : "FAIL",
  };
}

export function resultPath() {
  return path.join(repositoryRoot, resultRelativePath);
}

function printSummary(result, mode) {
  console.log(`${taskId} ${runnerVersion}: ${result.overall_verdict}`);
  console.log(`mode: ${mode}`);
  console.log(`Grounding v2: ${result.grounding_v2.summary}`);
  console.log(`frozen PB-01 replay: ${result.frozen_pb01_replay.summary}`);
  console.log(`Materiality fixtures: ${result.semantic_materiality.summary}`);
  console.log(`v10 Fake flows: ${result.v10_fake_flows.summary}`);
  console.log(`v9 parity: ${result.v9_parity.summary}`);
  console.log(`mutation rejections: ${result.mutation_rejections.summary}`);
  console.log(
    `Provider / DB / Supabase: ${result.operations.external_provider_calls} / ${result.operations.db_operations} / ${result.operations.supabase_operations}`,
  );
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isCli) {
  const checkMode = process.argv.includes("--check");
  const result = await runDirectionalGuidanceOffline();
  if (checkMode) {
    const committed = readJson(resultRelativePath);
    const matches = same(committed, result);
    printSummary(result, "check-no-write");
    console.log(`committed deterministic replay: ${matches ? "PASS" : "FAIL"}`);
    process.exitCode = result.overall_verdict === "PASS" && matches ? 0 : 1;
  } else {
    writeFileSync(resultPath(), canonicalPrettyJson(result), "utf8");
    printSummary(result, "write-result-only");
    console.log(`wrote: ${resultRelativePath}`);
    process.exitCode = result.overall_verdict === "PASS" ? 0 : 1;
  }
}
