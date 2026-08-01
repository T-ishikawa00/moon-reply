import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baselineSha = "554d2cb5a2f816ac82edf3cc247458fe34a4a74c";
const acceptedImplementationSha =
  "9588c8fd6ab47c265f5f661d4473a29d73885427";
const i2BaselineSha = "20d4178e3a63026128f3a25d052196c7161e7e27";
const i3BaselineSha = "61e33a10e195fad17e253a6b9719217e1992f273";
const exactI2RendererPaths = [
  "app/review/runtime/i2/page.tsx",
  "app/globals.css",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "components/runtime/RuntimeAssessmentNote.tsx",
];
const exactI3Paths = [
  "lib/assessment/runtime/contracts/pb-04-decision-plan-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-05-report-writer-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-06-semantic-validator-v2.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  "evals/runtime/m2-p4-i3-quality-contract-v1.json",
  "evals/runtime/m2-p4-i3-capabilities-v1.json",
  "scripts/verify-m2-p4-i3-product-quality.mjs",
  "docs/phase2/TASK_M2_P4_I3_REVIEW.md",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const i3ImplementationSha = "c85d6d122ad71569532a55887b9a3b6d93f8a288";
const layer1PlanningSha = "ec7cd53884ab4056c78d2596c609baef5701274a";
const acceptedPlanningSha = "3c64e5e2179b4c03979119068716326337a002c6";
const r1aBaselineSha = "e5cfd903740267db6d070964a9ec72a7d823f310";
const exactPlanningAcceptanceSyncPaths = [
  "docs/phase2/M2_P4_I3_R1_INTERACTION_RELATIONSHIP_VOICE_FINAL_PLAN.md",
  "docs/phase2/TASK_M2_P4_I3_R1_FINAL_PLANNING_REVIEW.md",
  "evals/runtime/m2-p4-i3-r1-final-planning-capabilities-v1.json",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactR1APaths = [
  "lib/assessment/runtime/contracts/writing-context-v1.ts",
  "lib/assessment/runtime/contracts/structured-intake-v4.schema.json",
  "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
  "lib/assessment/runtime/contracts/report-content-v2.schema.json",
  "evals/runtime/m2-p4-i3-r1-a-schema-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-a-contract-fixtures-v1.json",
  "evals/runtime/m2-p4-i3-r1-a-capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_A_REVIEW.md",
  "scripts/verify-m2-p4-i3-product-quality.mjs",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const r1aAcceptedImplementationSha =
  "8030c0b7778ccea3d7d90cbffcf21ac9c1052bcd";
const r1bBaselineSha = "2381312ced5fc726dfa245632c25da6bb68a376f";
const exactR1AAcceptanceSyncPaths = [
  "evals/runtime/m2-p4-i3-r1-a-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_A_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactR1BPaths = [
  "lib/assessment/runtime/contracts/pb-01-structure-v4.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v5.json",
  "lib/assessment/runtime/structured-intake-grounding-v4.ts",
  "lib/assessment/runtime/writing-context-integrity-v1.ts",
  "lib/assessment/runtime/structured-intake-legacy-view-v3.ts",
  "evals/runtime/m2-p4-i3-r1-b-grounding-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-b-runtime-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-b-capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-b-writing-context.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_B_REVIEW.md",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "scripts/verify-m2-p4-i3-product-quality.mjs",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const c1BaselineSha = "76c469db264cd1cb9434b6a19ec5c75db5754a2a";
const exactC1Paths = [
  "scripts/lib/m2-p4-i3-r1-c1-provider-runner.mjs",
  "scripts/lib/m2-p4-i3-r1-c1-evaluator.mjs",
  "scripts/run-m2-p4-i3-r1-c1-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-provider-diagnostic.mjs",
  "evals/runtime/m2-p4-i3-r1-c1/diagnostic-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1/diagnostic-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1/diagnostic-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1/diagnostic-summary-v1.md",
  "evals/runtime/m2-p4-i3-r1-c1/capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-b-writing-context.mjs",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "scripts/verify-m2-p4-i3-product-quality.mjs",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactImplementationPaths = [
  "lib/assessment/runtime/contracts/pb-01-structure-v2.developer.md",
  "lib/assessment/runtime/contracts/structured-intake-v2.schema.json",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v2.json",
  "lib/assessment/runtime/policy-v2.ts",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "evals/runtime/m2-p4-i1-b-runtime-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I1_B_REVIEW.md",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/types.ts",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const stageIds = ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"];
const decisionNames = [
  "reply_now",
  "send_now",
  "wait_and_reassess",
  "pause_additional_contact",
];

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

function source(relativePath) {
  return readFileSync(absolute(relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(source(relativePath));
}

function canonicalText(value) {
  return value.replace(/\r\n/gu, "\n");
}

function hashText(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalText(value), "utf8"))
    .digest("hex");
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function gitText(args) {
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

function historicalImplementationPaths(baseSha, endSha) {
  return sorted(
    new Set(
      gitText(["diff", "--name-only", baseSha, endSha, "--"])
        .split(/\r?\n/gu)
        .map((item) => item.trim().replaceAll("\\", "/"))
        .filter(Boolean),
    ),
  );
}

function currentChangedPaths(baseSha) {
  const paths = new Set(
    gitText(["diff", "--name-only", baseSha, "--"])
      .split(/\r?\n/gu)
      .map((item) => item.trim().replaceAll("\\", "/"))
      .filter(Boolean),
  );
  for (const line of gitText([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ])
    .split(/\r?\n/gu)
    .filter(Boolean)) {
    let item = line.slice(3).trim();
    if (item.includes(" -> ")) item = item.split(" -> ").at(-1);
    paths.add(item.replaceAll("\\", "/"));
  }
  return sorted(paths);
}

function isExactI2RendererEvolution(paths) {
  return (
    paths.length === exactI2RendererPaths.length &&
    new Set(paths).size === exactI2RendererPaths.length &&
    JSON.stringify(sorted(paths)) ===
      JSON.stringify(sorted(exactI2RendererPaths))
  );
}

function isExactI3Successor(paths) {
  return (
    paths.length === exactI3Paths.length &&
    new Set(paths).size === exactI3Paths.length &&
    paths.every((item) => !item.includes("*") && !item.endsWith("/")) &&
    JSON.stringify(sorted(paths)) === JSON.stringify(sorted(exactI3Paths))
  );
}

function isExactLiteralSet(paths, expectedPaths) {
  return (
    paths.length === expectedPaths.length &&
    new Set(paths).size === expectedPaths.length &&
    paths.every(
      (item) =>
        typeof item === "string" &&
        item.length > 0 &&
        !item.includes("*") &&
        !item.endsWith("/"),
    ) &&
    JSON.stringify(sorted(paths)) === JSON.stringify(sorted(expectedPaths))
  );
}

function isAcceptedHistoricalSnapshot(snapshot) {
  return (
    snapshot?.type === "historical_commit_range" &&
    snapshot?.base_commit_sha === baselineSha &&
    snapshot?.end_commit_sha === acceptedImplementationSha &&
    snapshot?.include_working_tree === false &&
    snapshot?.immutable_snapshot === true
  );
}

function deterministicUuidFactory() {
  let sequence = 0;
  return () => {
    sequence += 1;
    return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
  };
}

const [
  { AssessmentApplication },
  { FakeAssessmentRepository, needsMoreInformationStageOutputs, safetyBlockedStageOutputs, wait003StageOutputs },
  schemaCatalogModule,
  { assertOpenAIStructuredOutputSchema, toOpenAiStructuredOutputSchema },
  { buildDecisionPolicyV2 },
  { validateStageOutput },
  { selectDecisionPolicy },
] = await Promise.all([
  import("../lib/assessment/runtime/application.ts"),
  import("../lib/assessment/runtime/fakes.ts"),
  import("../lib/assessment/runtime/schema-catalog.ts"),
  import("../lib/assessment/runtime/openai-schema.ts"),
  import("../lib/assessment/runtime/policy-v2.ts"),
  import("../lib/assessment/runtime/validation.ts"),
  import("../evals/quality/m2-p4-i1/decision-policy-v2.mjs"),
]);

const {
  loadCanonicalStageCatalog,
  loadM2P4RuntimeStageCatalog,
} = schemaCatalogModule;
assert.equal(typeof loadCanonicalStageCatalog, "function");
assert.equal(typeof loadM2P4RuntimeStageCatalog, "function");

const runtimeManifest = json(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v2.json",
);
const historicalManifest = json("ai/prompts/prompt-bundle.manifest.json");
assert.equal(runtimeManifest.schema_version, "m2-p4-runtime-stage-catalog-v1");
assert.equal(runtimeManifest.catalog_version, "runtime-stage-catalog-v2.0.0");
assert.equal(
  runtimeManifest.prompt_bundle_version,
  "prompt-bundle-runtime-v2.0.0",
);
assert.equal(
  runtimeManifest.schema_set_version,
  "pipeline-schema-runtime-v2.0.0",
);
assert.equal(runtimeManifest.baseline, baselineSha);
assert.equal(runtimeManifest.hash_algorithm, "sha256-utf8-lf");
assert.deepEqual(
  runtimeManifest.stages.map((stage) => stage.stage_id),
  stageIds,
);

const historicalCommon = historicalManifest.assets.find(
  (asset) => asset.asset_id === "SHARED-COMMON",
);
assert.ok(historicalCommon);
assert.equal(
  runtimeManifest.common_prompt.prompt_path,
  `ai/prompts/${historicalCommon.relative_path}`,
);
assert.equal(
  runtimeManifest.common_prompt.prompt_sha256,
  historicalCommon.sha256,
);
assert.equal(
  hashText(source(runtimeManifest.common_prompt.prompt_path)),
  runtimeManifest.common_prompt.prompt_sha256,
);

for (const stage of runtimeManifest.stages) {
  assert.equal(hashText(source(stage.prompt_path)), stage.prompt_sha256);
  assert.equal(hashText(source(stage.schema_path)), stage.schema_sha256);
  if (stage.stage_id === "PB-01") {
    assert.equal(stage.prompt_version, "v2.0.0");
    assert.equal(stage.schema_version, "pipeline-schema-v2.0.0");
    assert.equal(stage.schema_name, "pb_01_structure_v2");
    assert.equal(
      stage.prompt_path,
      "lib/assessment/runtime/contracts/pb-01-structure-v2.developer.md",
    );
    assert.equal(
      stage.schema_path,
      "lib/assessment/runtime/contracts/structured-intake-v2.schema.json",
    );
    continue;
  }
  const inherited = historicalManifest.assets.find(
    (asset) => asset.asset_id === stage.stage_id,
  );
  assert.ok(inherited);
  assert.equal(stage.source, "accepted-historical-manifest");
  assert.equal(stage.prompt_version, inherited.asset_version);
  assert.equal(stage.prompt_path, `ai/prompts/${inherited.relative_path}`);
  assert.equal(stage.prompt_sha256, inherited.sha256);
  assert.equal(stage.schema_path, inherited.output_schema_path);
  assert.equal(stage.schema_pointer, inherited.output_schema_pointer);
}

const catalog = await loadM2P4RuntimeStageCatalog();
assert.equal(catalog.promptBundleVersion, "prompt-bundle-runtime-v2.0.0");
assert.equal(catalog.schemaSetVersion, "pipeline-schema-runtime-v2.0.0");
assert.deepEqual(
  catalog.definitions.map((definition) => definition.stageId),
  stageIds,
);
assert.equal(catalog.definitions[0].promptVersion, "v2.0.0");
assert.equal(catalog.definitions[0].schemaVersion, "pipeline-schema-v2.0.0");
for (const definition of catalog.definitions) {
  const providerSchema = toOpenAiStructuredOutputSchema(
    definition.outputSchema,
  );
  assert.doesNotThrow(() =>
    assertOpenAIStructuredOutputSchema(providerSchema),
  );
}
const canonicalCatalog = await loadCanonicalStageCatalog();
assert.equal(canonicalCatalog.definitions[0].promptVersion, "v1.0.0");
assert.equal(canonicalCatalog.definitions[0].schemaVersion, "pipeline-schema-v1.0.0");

const serviceSource = source("lib/assessment/runtime/service.ts");
const catalogSource = source("lib/assessment/runtime/schema-catalog.ts");
assert.ok(serviceSource.includes("loadM2P4ProductQualityRuntimeStageCatalog"));
assert.ok(!serviceSource.includes("loadCanonicalStageCatalog"));
assert.ok(catalogSource.includes("export async function loadCanonicalStageCatalog"));
assert.ok(catalogSource.includes("export async function loadM2P4RuntimeStageCatalog"));
assert.ok(
  catalogSource.includes(
    "export async function loadM2P4ProductQualityRuntimeStageCatalog",
  ),
);

const structuredSchema = json(
  "lib/assessment/runtime/contracts/structured-intake-v2.schema.json",
);
assert.equal(
  structuredSchema.$schema,
  "https://json-schema.org/draft/2020-12/schema",
);
assert.equal(structuredSchema.type, "object");
assert.equal(structuredSchema.additionalProperties, false);
assert.ok(structuredSchema.required.includes("decision_facts"));
assert.equal(
  structuredSchema.properties.schema_version.const,
  "pipeline-schema-v2.0.0",
);
assert.deepEqual(
  structuredSchema.properties.decision_facts.anyOf,
  [
    { $ref: "#/$defs/decision_facts" },
    { type: "null" },
  ],
);
assert.deepEqual(
  structuredSchema.$defs.decision_facts.properties.contact_state.properties
    .unanswered_user_message_count.type,
  ["integer", "null"],
);
assert.deepEqual(
  structuredSchema.$defs.decision_facts.properties.contact_state.properties
    .elapsed_since_latest_user_message_minutes.type,
  ["integer", "null"],
);

function verifyStrictObjects(schemaNode) {
  if (schemaNode === null || typeof schemaNode !== "object") return;
  if (Array.isArray(schemaNode)) {
    for (const child of schemaNode) verifyStrictObjects(child);
    return;
  }
  if (schemaNode.type === "object") {
    assert.equal(schemaNode.additionalProperties, false);
    assert.deepEqual(sorted(schemaNode.required), sorted(Object.keys(schemaNode.properties)));
  }
  if (typeof schemaNode.$ref === "string") {
    assert.ok(schemaNode.$ref.startsWith("#/"));
  }
  for (const child of Object.values(schemaNode)) verifyStrictObjects(child);
}
verifyStrictObjects(structuredSchema);
const structuredSchemaSource = JSON.stringify(structuredSchema);
for (const prohibited of [
  '"allOf"',
  '"oneOf"',
  '"if"',
  '"then"',
  '"else"',
  '"dependentSchemas"',
  '"confidence"',
  '"probability"',
  '"romantic_interest"',
  '"romantic-interest"',
]) {
  assert.ok(!structuredSchemaSource.includes(prohibited));
}

const baselineRecord = json("evals/quality/m2-p4-baseline-001.json");
assert.equal(baselineRecord.baseline_id, "M2P4-LIVE-001");
assert.equal(baselineRecord.decision_result.expected_decision, "reply_now");
const baselineInput = baselineRecord.synthetic_reproduction_input;
const baselineFacts = {
  schema_version: "m2-p4-decision-facts-v1",
  relationship_stage: "matching_app",
  selected_requests: ["decide_send_or_wait", "draft_message"],
  latest_direct_message: {
    sender: "other_person",
    kind: "thanks_or_followup",
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
  practical_reason: {
    kind: "none",
    active: false,
    deadline: "none",
  },
  information_state: {
    complete_for_decision: true,
  },
};

function structuredIntake(decisionFacts) {
  return {
    schema_version: "pipeline-schema-v2.0.0",
    relationship_stage: "matching_app",
    user_goal: "decide_send_or_wait",
    timeline: [
      {
        event_id: "E001",
        sequence: 1,
        actor: "other_person",
        statement: "相手から会った日の感想と次回への言及が届いた。",
        source_refs: ["input:current_situation"],
      },
    ],
    boundaries: [],
    context: [
      {
        context_id: "C001",
        kind: "message_state",
        statement: "利用者はまだ返信していない。",
        source_refs: ["input:current_situation"],
      },
    ],
    observed_facts: [
      {
        fact_id: "F001",
        statement: "相手から返信を自然に期待できる直接メッセージが届いている。",
        source_refs: ["input:current_situation"],
        support: "explicit",
      },
    ],
    user_assumptions: [],
    user_emotions: [],
    material_unknowns: [],
    safety_signals: [],
    untrusted_embedded_instructions_detected: false,
    decision_facts: decisionFacts,
  };
}

const pb01Definition = catalog.definitions[0];
assert.doesNotThrow(() =>
  validateStageOutput(pb01Definition, structuredIntake(baselineFacts)),
);
assert.doesNotThrow(() =>
  validateStageOutput(pb01Definition, structuredIntake(null)),
);
assert.throws(
  () =>
    validateStageOutput(pb01Definition, {
      ...structuredIntake(null),
      decision_facts: { schema_version: "m2-p4-decision-facts-v1" },
    }),
  (error) => error?.safeCode === "M2_STAGE_SCHEMA_INVALID",
);

const fixtures = json(
  "evals/quality/m2-p4-i1/decision-facts-fixtures-v1.json",
);
assert.equal(fixtures.length, 40);
const categoryPasses = new Map(
  decisionNames.map((decision) => [decision, 0]),
);
const pauseReasonToReference = {
  explicit_no_contact: "no_contact",
  temporary_distance_requested: "temporary_distance",
  blocked_or_restricted: "blocked_or_restricted",
  relationship_closed: "relationship_closed",
  repeated_unanswered_contact: "repeated_unanswered_contact",
};
for (const fixture of fixtures) {
  const runtimePolicy = buildDecisionPolicyV2(fixture.facts);
  const referencePolicy = selectDecisionPolicy(fixture.facts);
  assert.equal(runtimePolicy.schema_version, "pipeline-schema-v2.0.0");
  assert.equal(runtimePolicy.policy_version, referencePolicy.policy_version);
  assert.deepEqual(runtimePolicy.allowed_decisions, referencePolicy.allowed_decisions);
  assert.deepEqual(
    runtimePolicy.disallowed_decisions,
    referencePolicy.disallowed_decisions,
  );
  assert.equal(
    runtimePolicy.message_draft_policy,
    referencePolicy.message_draft_policy,
  );
  assert.equal(runtimePolicy.later_draft_mode, referencePolicy.later_draft_mode);
  assert.equal(
    runtimePolicy.follow_up_exception,
    referencePolicy.follow_up_exception,
  );
  assert.equal(
    runtimePolicy.pause_reason_code === null
      ? null
      : pauseReasonToReference[runtimePolicy.pause_reason_code],
    referencePolicy.pause_reason_code,
  );
  assert.equal(runtimePolicy.resume_policy, referencePolicy.resume_policy);
  assert.deepEqual(runtimePolicy.reason_codes, referencePolicy.reason_codes);
  assert.equal(runtimePolicy.allowed_decisions[0], fixture.expected_decision);
  categoryPasses.set(
    fixture.expected_decision,
    categoryPasses.get(fixture.expected_decision) + 1,
  );
}
for (const decision of decisionNames) {
  assert.equal(categoryPasses.get(decision), 10);
}
const combinedPauseFacts = structuredClone(
  fixtures.find((fixture) => fixture.case_id === "PAUSE-001").facts,
);
combinedPauseFacts.boundary_state.repeated_unanswered_contact = true;
const combinedRuntimePause = buildDecisionPolicyV2(combinedPauseFacts);
const combinedReferencePause = selectDecisionPolicy(combinedPauseFacts);
assert.equal(combinedRuntimePause.pause_reason_code, "explicit_no_contact");
assert.equal(combinedReferencePause.pause_reason_code, "no_contact");
assert.equal(
  combinedRuntimePause.resume_policy,
  combinedReferencePause.resume_policy,
);

function runtimeOutputs(baseOutputs, decisionFacts) {
  const outputs = structuredClone(baseOutputs);
  outputs["PB-01"] = structuredIntake(decisionFacts);
  return outputs;
}

function baselineOutputs() {
  const outputs = runtimeOutputs(wait003StageOutputs(), baselineFacts);
  outputs["PB-04"] = {
    ...outputs["PB-04"],
    selected_decision: "reply_now",
    message_draft: {
      text: baselineInput.optionalMessage,
      policy: "required_now",
      use_timing: "now",
    },
  };
  return outputs;
}

class OfflineFakeTransport {
  actualProviderCalls = 0;
  apiSpendUsd = 0;
  calls = [];
  requests = [];

  constructor(outputs) {
    this.outputs = structuredClone(outputs);
  }

  async invoke(request) {
    this.calls.push(request.stageId);
    this.requests.push(structuredClone(request));
    const sequence = this.calls.length;
    return {
      responseId: `offline-fake-${request.stageId.toLowerCase()}-${sequence}`,
      returnedModel: request.model,
      output: structuredClone(this.outputs[request.stageId]),
      usage: {
        inputTokens: 100 + sequence,
        cachedTokens: 0,
        outputTokens: 20 + sequence,
        reasoningTokens: 5,
      },
      latencyMs: sequence,
    };
  }
}

function makeApplication(outputs, trace = []) {
  const repository = new FakeAssessmentRepository();
  const transport = new OfflineFakeTransport(outputs);
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    observe: (event) => trace.push(event),
    now: () => "2026-07-31T00:00:00.000Z",
    uuid: deterministicUuidFactory(),
  });
  return { application, repository, transport, trace };
}

async function expectSafeFailure(runtime, expectedCode, idempotencyKey) {
  try {
    await runtime.application.submit(baselineInput, idempotencyKey);
    assert.fail(`expected ${expectedCode}`);
  } catch (error) {
    assert.equal(error?.safeCode, expectedCode);
  }
}

const baselineTrace = [];
const baselineRuntime = makeApplication(baselineOutputs(), baselineTrace);
const baselineResult = await baselineRuntime.application.submit(
  baselineInput,
  "10000000-0000-4000-8000-000000000001",
);
assert.equal(baselineResult.eligibility, "ready");
assert.equal(baselineResult.decision, "reply_now");
assert.equal(baselineResult.report.decisionPlan.selected_decision, "reply_now");
assert.equal(baselineResult.decisionCard.decision, "reply_now");
assert.deepEqual(baselineRuntime.transport.calls, stageIds);
assert.deepEqual(
  baselineTrace.filter((event) => stageIds.includes(event)),
  stageIds,
);
const pb04Request = baselineRuntime.transport.requests.find(
  (request) => request.stageId === "PB-04",
);
assert.deepEqual(
  pb04Request.input.decision_policy_result.allowed_decisions,
  ["reply_now"],
);
assert.equal(
  pb04Request.input.structured_intake.schema_version,
  "pipeline-schema-v2.0.0",
);

const readyNull = makeApplication(
  runtimeOutputs(wait003StageOutputs(), null),
);
await expectSafeFailure(
  readyNull,
  "M2_DECISION_FACTS_INCOMPLETE",
  "20000000-0000-4000-8000-000000000001",
);
assert.equal(readyNull.transport.calls.length, 3);
assert.ok(!readyNull.transport.calls.includes("PB-04"));
assert.equal(readyNull.repository.reports.size, 0);
assert.equal(
  [...readyNull.repository.runs.values()][0].errorCode,
  "M2_DECISION_FACTS_INCOMPLETE",
);

const informationNull = makeApplication(
  runtimeOutputs(needsMoreInformationStageOutputs(), null),
);
const informationResult = await informationNull.application.submit(
  baselineInput,
  "30000000-0000-4000-8000-000000000001",
);
assert.equal(informationResult.eligibility, "needs_more_information");
assert.equal(informationNull.transport.calls.length, 3);
assert.ok(!informationNull.transport.calls.includes("PB-04"));
assert.equal(informationNull.repository.reports.size, 0);

const safetyNull = makeApplication(
  runtimeOutputs(safetyBlockedStageOutputs(), null),
);
const safetyResult = await safetyNull.application.submit(
  baselineInput,
  "40000000-0000-4000-8000-000000000001",
);
assert.equal(safetyResult.eligibility, "safety_blocked");
assert.equal(safetyNull.transport.calls.length, 3);
assert.ok(!safetyNull.transport.calls.includes("PB-04"));
assert.equal(safetyNull.repository.reports.size, 0);

const pipelineSource = source("lib/assessment/runtime/pipeline.ts");
const policyV2Source = source("lib/assessment/runtime/policy-v2.ts");
assert.ok(!pipelineSource.includes("buildDecisionPolicy(request"));
assert.ok(pipelineSource.includes("buildDecisionPolicyV2(decisionFacts)"));
assert.ok(pipelineSource.includes("requireDecisionFacts(structuredIntake)"));
assert.ok(
  pipelineSource.includes("validateDecisionPlanAgainstPolicyV2"),
);
for (const marker of [
  "RegExp",
  "currentSituation",
  "current_situation",
  "case_id",
  "caseId",
  "reference_draft",
  "oracle",
  "evals/",
  "process.env",
  ["fetch", "("].join(""),
  "Supabase",
]) {
  assert.ok(!policyV2Source.includes(marker), `policy-v2 contains ${marker}`);
}
for (const character of policyV2Source) {
  const code = character.codePointAt(0);
  assert.ok(
    !(
      (code >= 0x3040 && code <= 0x30ff) ||
      (code >= 0x3400 && code <= 0x9fff)
    ),
    "policy-v2 contains raw Japanese consultation matching material",
  );
}
const runtimeTypeScriptSources = [
  "lib/assessment/runtime/application.ts",
  "lib/assessment/runtime/cost.ts",
  "lib/assessment/runtime/environment.ts",
  "lib/assessment/runtime/errors.ts",
  "lib/assessment/runtime/fakes.ts",
  "lib/assessment/runtime/hash.ts",
  "lib/assessment/runtime/openai-diagnostics.ts",
  "lib/assessment/runtime/openai-schema.ts",
  "lib/assessment/runtime/openai-transport.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/policy.ts",
  "lib/assessment/runtime/policy-v2.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/supabase-repository.ts",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/validation.ts",
];
assert.ok(
  runtimeTypeScriptSources.every(
    (relativePath) => !source(relativePath).includes("evals/"),
  ),
);

const capabilityManifest = json(
  "evals/runtime/m2-p4-i1-b-runtime-capabilities-v1.json",
);
assert.equal(capabilityManifest.task_id, "M2-P4-I1-B");
assert.equal(
  capabilityManifest.status,
  "human_chatgpt_accepted_complete",
);
assert.equal(
  capabilityManifest.accepted_implementation_commit,
  acceptedImplementationSha,
);
assert.equal(capabilityManifest.baseline.commit, baselineSha);
assert.deepEqual(capabilityManifest.implementation_snapshot, {
  type: "historical_commit_range",
  base_commit_sha: baselineSha,
  end_commit_sha: acceptedImplementationSha,
  include_working_tree: false,
  immutable_snapshot: true,
});
assert.equal(
  isAcceptedHistoricalSnapshot(capabilityManifest.implementation_snapshot),
  true,
);
assert.equal(
  isAcceptedHistoricalSnapshot({
    ...capabilityManifest.implementation_snapshot,
    end_commit_sha: baselineSha,
  }),
  false,
);
const lowercaseShaPattern = /^[0-9a-f]{40}$/u;
assert.match(
  capabilityManifest.implementation_snapshot.base_commit_sha,
  lowercaseShaPattern,
);
assert.match(
  capabilityManifest.implementation_snapshot.end_commit_sha,
  lowercaseShaPattern,
);
assert.doesNotThrow(() =>
  gitText(["cat-file", "-e", `${baselineSha}^{commit}`]),
);
assert.doesNotThrow(() =>
  gitText(["cat-file", "-e", `${acceptedImplementationSha}^{commit}`]),
);
assert.doesNotThrow(() =>
  gitText([
    "merge-base",
    "--is-ancestor",
    baselineSha,
    acceptedImplementationSha,
  ]),
);
assert.doesNotThrow(() =>
  gitText([
    "merge-base",
    "--is-ancestor",
    acceptedImplementationSha,
    "HEAD",
  ]),
);
assert.deepEqual(
  sorted(capabilityManifest.implementation_paths),
  sorted(exactImplementationPaths),
);
assert.equal(new Set(capabilityManifest.implementation_paths).size, 16);
assert.ok(
  capabilityManifest.implementation_paths.every(
    (item) => !item.includes("*") && !item.endsWith("/"),
  ),
);
assert.deepEqual(
  historicalImplementationPaths(baselineSha, acceptedImplementationSha),
  sorted(exactImplementationPaths),
);
assert.deepEqual(capabilityManifest.task_execution_evidence, {
  openai_live_calls: 0,
  database_operations: 0,
  migrations: 0,
  holdout_use: 0,
  real_user_data: 0,
});

const protectedHistoricalDiff = gitText([
  "diff",
  "--name-only",
  baselineSha,
  acceptedImplementationSha,
  "--",
  "ai/prompts",
  "ai/schemas",
  "evals/quality/m2-p4-i1",
  "evals/development",
  "evals/holdout",
  "components",
  "app",
  "supabase",
  "package.json",
  "package-lock.json",
  "lib/assessment/runtime/policy.ts",
]).trim();
assert.equal(protectedHistoricalDiff, "");

const postAcceptanceRendererPaths = currentChangedPaths(i2BaselineSha).filter(
  (item) => /^(?:app|components)\//u.test(item),
);
assert.equal(isExactI2RendererEvolution(postAcceptanceRendererPaths), true);
for (const unauthorizedPath of [
  "app/review/runtime/unauthorized/page.tsx",
  "components/runtime/UnauthorizedComponent.tsx",
  ["app", "api", "internal", "assessments", "route.ts"].join("/"),
  "components/public/PublicComponent.tsx",
]) {
  assert.equal(
    isExactI2RendererEvolution([
      ...exactI2RendererPaths,
      unauthorizedPath,
    ]),
    false,
  );
}
const rendererAuthorizationSource = isExactI2RendererEvolution.toString();
assert.equal(rendererAuthorizationSource.includes("startsWith"), false);
assert.equal(rendererAuthorizationSource.includes("*"), false);
const historicalI3Paths = historicalImplementationPaths(
  i3BaselineSha,
  i3ImplementationSha,
);
assert.equal(isExactI3Successor(historicalI3Paths), true);
for (const unauthorizedPath of [
  "ai/schemas/unauthorized.schema.json",
  "components/runtime/UnauthorizedComponent.tsx",
  "app/unauthorized/page.tsx",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/contracts/unlisted-runtime.json",
]) {
  assert.equal(isExactI3Successor([...exactI3Paths, unauthorizedPath]), false);
}
const i3AuthorizationSource = isExactI3Successor.toString();
assert.equal(i3AuthorizationSource.includes("startsWith"), false);
assert.equal(i3AuthorizationSource.includes("*"), true);
const layer1PlanningManifest = json(
  "evals/runtime/m2-p4-i3-r1-planning-capabilities-v1.json",
);
const finalPlanningManifest = json(
  "evals/runtime/m2-p4-i3-r1-final-planning-capabilities-v1.json",
);
assert.equal(
  isExactLiteralSet(
    historicalImplementationPaths(i3ImplementationSha, layer1PlanningSha),
    layer1PlanningManifest.exact_mutation_paths,
  ),
  true,
);
assert.equal(layer1PlanningManifest.exact_mutation_path_count, 9);
assert.equal(
  isExactLiteralSet(
    historicalImplementationPaths(layer1PlanningSha, acceptedPlanningSha),
    finalPlanningManifest.exact_mutation_paths,
  ),
  true,
);
assert.equal(finalPlanningManifest.planning_snapshot.exact_paths, 12);
assert.equal(finalPlanningManifest.planning_snapshot.immutable_snapshot, true);
assert.equal(
  isExactLiteralSet(
    [...finalPlanningManifest.exact_mutation_paths, exactR1APaths[0]],
    finalPlanningManifest.exact_mutation_paths,
  ),
  false,
);
assert.equal(
  isExactLiteralSet(
    historicalImplementationPaths(acceptedPlanningSha, r1aBaselineSha),
    exactPlanningAcceptanceSyncPaths,
  ),
  true,
);
assert.equal(
  isExactLiteralSet(
    historicalImplementationPaths(r1aBaselineSha, r1aAcceptedImplementationSha),
    exactR1APaths,
  ),
  true,
);
assert.equal(
  isExactLiteralSet(
    historicalImplementationPaths(r1aAcceptedImplementationSha, r1bBaselineSha),
    exactR1AAcceptanceSyncPaths,
  ),
  true,
);
assert.equal(
  isExactLiteralSet(
    historicalImplementationPaths(r1bBaselineSha, c1BaselineSha),
    exactR1BPaths,
  ),
  true,
);
assert.equal(exactR1BPaths.length, 22);
assert.equal(isExactLiteralSet(currentChangedPaths(c1BaselineSha), exactC1Paths), true);
assert.equal(exactC1Paths.length, 21);
for (const unauthorizedPath of [
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "lib/assessment/runtime/contracts/pb-04-decision-plan-v3.developer.md",
  "lib/assessment/runtime/policy-v3.ts",
  "components/runtime/Unauthorized.tsx",
]) {
  assert.equal(
    isExactLiteralSet([...exactR1BPaths, unauthorizedPath], exactR1BPaths),
    false,
  );
}
for (const unauthorizedPath of [
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "ai/schemas/unauthorized.schema.json",
  "ai/prompts/unauthorized.developer.md",
  "components/runtime/UnauthorizedComponent.tsx",
  "app/unauthorized/page.tsx",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
]) {
  assert.equal(
    isExactLiteralSet([...exactR1APaths, unauthorizedPath], exactR1APaths),
    false,
  );
}
assert.equal(baselineRuntime.transport.actualProviderCalls, 0);
assert.equal(baselineRuntime.repository.actualSupabaseCalls, 0);
assert.equal(informationNull.transport.actualProviderCalls, 0);
assert.equal(informationNull.repository.actualSupabaseCalls, 0);
assert.equal(safetyNull.transport.actualProviderCalls, 0);
assert.equal(safetyNull.repository.actualSupabaseCalls, 0);

console.log("M2_P4_I1_B_RUNTIME_INTEGRATION: PASS");
console.log("historical_snapshot: PASS");
console.log("i2_renderer_exceptions: 4/4");
console.log("i3_successor_exact_scope: 19/19");
console.log("accepted_planning_snapshot: 12/12");
console.log("planning_acceptance_sync_scope: 6/6");
console.log("r1_a_successor_exact_scope: 18/18");
console.log("r1_b_successor_exact_scope: 22/22");
console.log("r1_c1_successor_exact_scope: 21/21");
console.log("unauthorized_app_components_regressions: 4/4");
console.log("reference_decisions: 40/40");
console.log(`reply_now: ${categoryPasses.get("reply_now")}/10`);
console.log(`send_now: ${categoryPasses.get("send_now")}/10`);
console.log(
  `wait_and_reassess: ${categoryPasses.get("wait_and_reassess")}/10`,
);
console.log(
  `pause_additional_contact: ${categoryPasses.get(
    "pause_additional_contact",
  )}/10`,
);
console.log("baseline_fake_decision: reply_now");
console.log("ready_null_facts_fail_closed: PASS");
console.log("information_null_facts: PASS");
console.log("safety_null_facts: PASS");
console.log("active_raw_prose_policy: 0");
console.log("openai_calls: 0");
console.log("db_operations: 0");
console.log("holdout_use: 0");
