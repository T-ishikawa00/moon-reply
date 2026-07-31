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
const i1cBaselineSha = "c27120eea067f91c5e9ef4447e382f55a329e158";
const r1BaselineSha = "da520621b6569ff65ae652fb75945ed923b4fc3b";
const r2BaselineSha = "bee69d1cf0f1792786eccc6508fb5e7184ad6241";
const r3BaselineSha = "2659c14d82fe2589d2e1cfc655c52c13b878dc7c";
const r4BaselineSha = "e4e844cbaa8534c68a0d87d5831d04b5afe676a1";
const acceptedEndSha = "b523349ec33c36a90c645d4a1b7a6d37832af151";
const i2BaselineSha = "20d4178e3a63026128f3a25d052196c7161e7e27";
const exactI2RendererPaths = [
  "app/review/runtime/i2/page.tsx",
  "app/globals.css",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "components/runtime/RuntimeAssessmentNote.tsx",
];
const exactI2Paths = [
  "app/review/runtime/i2/page.tsx",
  "lib/assessment/runtime/review/m2-p4-i2-review-fixture.ts",
  "evals/runtime/m2-p4-i2-field-disposition-v1.json",
  "evals/runtime/m2-p4-i2-capabilities-v1.json",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "docs/phase2/TASK_M2_P4_I2_REVIEW.md",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "components/runtime/RuntimeAssessmentNote.tsx",
  "app/globals.css",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
];
const acceptedSliceCommits = {
  "M2-P4-I1-C": "da520621b6569ff65ae652fb75945ed923b4fc3b",
  "M2-P4-I1-C-R1": "bee69d1cf0f1792786eccc6508fb5e7184ad6241",
  "M2-P4-I1-C-R2": "2659c14d82fe2589d2e1cfc655c52c13b878dc7c",
  "M2-P4-I1-C-R3": "e4e844cbaa8534c68a0d87d5831d04b5afe676a1",
  "M2-P4-I1-C-R4": acceptedEndSha,
};
const r1ExactPaths = [
  "lib/assessment/runtime/contextual-integrity-v3.ts",
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I1_C_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json",
  "scripts/verify-m2-eval-foundation.mjs",
];
const r2ExactPaths = [
  "lib/assessment/runtime/safety-aggregation-v3.ts",
  "lib/assessment/runtime/report-grounding-v3.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I1_C_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
  "scripts/verify-m2-eval-foundation.mjs",
];
const r3ExactPaths = [
  "lib/assessment/runtime/structured-intake-grounding-v3.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
  "scripts/verify-m2-eval-foundation.mjs",
  "docs/phase2/TASK_M2_P4_I1_C_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const r4ExactPaths = [
  "lib/assessment/runtime/change-condition-grounding-v3.ts",
  "lib/assessment/runtime/semantic-disposition-v3.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
  "scripts/verify-m2-eval-foundation.mjs",
  "docs/phase2/TASK_M2_P4_I1_C_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const i1cImplementationPaths = [
  "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "lib/assessment/runtime/contracts/pb-03-projection-v3.developer.md",
  "lib/assessment/runtime/contracts/eligibility-projection-v3.schema.json",
  "lib/assessment/runtime/contracts/pb-04-decision-plan-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-05-report-writer-v2.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json",
  "lib/assessment/runtime/contextual-inference-v3.ts",
  "lib/assessment/runtime/eligibility-v3.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I1_C_REVIEW.md",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const acceptedStackPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/phase2/TASK_M2_P4_I1_C_REVIEW.md",
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
  "lib/assessment/runtime/change-condition-grounding-v3.ts",
  "lib/assessment/runtime/contextual-inference-v3.ts",
  "lib/assessment/runtime/contextual-integrity-v3.ts",
  "lib/assessment/runtime/contracts/eligibility-projection-v3.schema.json",
  "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-03-projection-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-04-decision-plan-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-05-report-writer-v2.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json",
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "lib/assessment/runtime/eligibility-v3.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/report-grounding-v3.ts",
  "lib/assessment/runtime/safety-aggregation-v3.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/semantic-disposition-v3.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/structured-intake-grounding-v3.ts",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
];
const acceptanceSyncPaths = [
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I1_C_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
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

function isExactPathSet(paths, exactPaths) {
  return (
    paths.length === exactPaths.length &&
    new Set(paths).size === exactPaths.length &&
    JSON.stringify(sorted(paths)) === JSON.stringify(sorted(exactPaths))
  );
}

function isAcceptedHistoricalSnapshot(snapshot) {
  return (
    snapshot?.type === "historical_commit_range" &&
    snapshot?.base_commit_sha === i1cBaselineSha &&
    snapshot?.end_commit_sha === acceptedEndSha &&
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
  { FakeAssessmentRepository, safetyBlockedStageOutputs, wait003StageOutputs },
  { loadM2P4ContextualRuntimeStageCatalog },
  { assertOpenAIStructuredOutputSchema, toOpenAiStructuredOutputSchema },
  {
    buildContextualDecisionPolicyV3,
    projectDecisionFactsV2ToV1,
    requireContextualDecisionFactsV3,
    validateContextualIntakeIntegrityV3,
  },
  {
    buildLocalEligibilityResultV3,
    deriveRuntimeEligibilityV3,
    validateEligibilityProjectionV3,
  },
  { aggregateSafetyV3 },
  { buildRelationshipSummaryV3, groundReportContentV3 },
  { groundStructuredIntakeV3 },
  {
    buildChangeConditionCommentaryV3,
    groundChangeConditionCommentaryV3,
  },
  { evaluateSemanticFindingsV3 },
  { validateStageOutput },
] = await Promise.all([
  import("../lib/assessment/runtime/application.ts"),
  import("../lib/assessment/runtime/fakes.ts"),
  import("../lib/assessment/runtime/schema-catalog.ts"),
  import("../lib/assessment/runtime/openai-schema.ts"),
  import("../lib/assessment/runtime/policy-v3.ts"),
  import("../lib/assessment/runtime/eligibility-v3.ts"),
  import("../lib/assessment/runtime/safety-aggregation-v3.ts"),
  import("../lib/assessment/runtime/report-grounding-v3.ts"),
  import("../lib/assessment/runtime/structured-intake-grounding-v3.ts"),
  import("../lib/assessment/runtime/change-condition-grounding-v3.ts"),
  import("../lib/assessment/runtime/semantic-disposition-v3.ts"),
  import("../lib/assessment/runtime/validation.ts"),
]);

const r1CommittedPaths = gitText([
  "diff",
  "--name-only",
  r1BaselineSha,
  r2BaselineSha,
  "--",
])
  .split(/\r?\n/gu)
  .map((item) => item.trim().replaceAll("\\", "/"))
  .filter(Boolean);
assert.deepEqual(sorted(r1CommittedPaths), sorted(r1ExactPaths));

const r2CommittedPaths = gitText([
  "diff",
  "--name-only",
  r2BaselineSha,
  r3BaselineSha,
  "--",
])
  .split(/\r?\n/gu)
  .map((item) => item.trim().replaceAll("\\", "/"))
  .filter(Boolean);
assert.deepEqual(sorted(r2CommittedPaths), sorted(r2ExactPaths));

const r3CommittedPaths = gitText([
  "diff",
  "--name-only",
  r3BaselineSha,
  r4BaselineSha,
  "--",
])
  .split(/\r?\n/gu)
  .map((item) => item.trim().replaceAll("\\", "/"))
  .filter(Boolean);
assert.deepEqual(sorted(r3CommittedPaths), sorted(r3ExactPaths));

const r4CommittedPaths = gitText([
  "diff",
  "--name-only",
  r4BaselineSha,
  acceptedEndSha,
  "--",
])
  .split(/\r?\n/gu)
  .map((item) => item.trim().replaceAll("\\", "/"))
  .filter(Boolean);
assert.deepEqual(sorted(r4CommittedPaths), sorted(r4ExactPaths));

const acceptedStackCommittedPaths = gitText([
  "diff",
  "--name-only",
  i1cBaselineSha,
  acceptedEndSha,
  "--",
])
  .split(/\r?\n/gu)
  .map((item) => item.trim().replaceAll("\\", "/"))
  .filter(Boolean);
assert.deepEqual(sorted(acceptedStackCommittedPaths), sorted(acceptedStackPaths));
assert.equal(isExactPathSet(acceptedStackCommittedPaths, acceptedStackPaths), true);
assert.equal(
  isExactPathSet(
    [...acceptedStackCommittedPaths, exactI2RendererPaths[0]],
    acceptedStackPaths,
  ),
  false,
);

const protectedHistoricalPaths = [
  "lib/assessment/runtime/contracts/pb-01-structure-v2.developer.md",
  "lib/assessment/runtime/contracts/structured-intake-v2.schema.json",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v2.json",
  "lib/assessment/runtime/policy-v2.ts",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "evals/runtime/m2-p4-i1-b-runtime-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I1_B_REVIEW.md",
  "evals/quality/m2-p4-i1",
  "ai/prompts",
  "ai/schemas",
  "evals/development",
  "evals/holdout",
  "app",
  "components",
  "supabase",
  "package.json",
  "package-lock.json",
  "next-env.d.ts",
];
assert.equal(
  gitText([
    "diff",
    "--name-only",
    r1BaselineSha,
    acceptedEndSha,
    "--",
    ...protectedHistoricalPaths,
  ]).trim(),
  "",
);

const postAcceptanceRendererPaths = currentChangedPaths(i2BaselineSha).filter(
  (item) => /^(?:app|components)\//u.test(item),
);
assert.equal(
  isExactPathSet(postAcceptanceRendererPaths, exactI2RendererPaths),
  true,
);
for (const unauthorizedPath of [
  "app/review/runtime/unauthorized/page.tsx",
  "components/runtime/UnauthorizedComponent.tsx",
  ["app", "api", "internal", "assessments", "route.ts"].join("/"),
  "components/public/PublicComponent.tsx",
]) {
  assert.equal(
    isExactPathSet(
      [...exactI2RendererPaths, unauthorizedPath],
      exactI2RendererPaths,
    ),
    false,
  );
}
const rendererAuthorizationSource = isExactPathSet.toString();
assert.equal(rendererAuthorizationSource.includes("startsWith"), false);
assert.equal(rendererAuthorizationSource.includes("*"), false);

const manifest = json(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json",
);
const baselineCatalog = JSON.parse(
  gitText([
    "show",
    `${r1BaselineSha}:lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json`,
  ]),
);
const expectedCatalog = structuredClone(baselineCatalog);
const expectedPb01CatalogStage = expectedCatalog.stages.find(
  (stage) => stage.stage_id === "PB-01",
);
assert.ok(expectedPb01CatalogStage);
expectedPb01CatalogStage.schema_sha256 =
  "40457d83f992973e745eb7b3488cf244166cbadd5b3b5a3e19affc16a4f6cce8";
assert.deepEqual(manifest, expectedCatalog);
assert.equal(manifest.schema_version, "m2-p4-runtime-stage-catalog-v1");
assert.equal(manifest.catalog_version, "runtime-stage-catalog-v3.0.0");
assert.equal(manifest.prompt_bundle_version, "prompt-bundle-runtime-v3.0.0");
assert.equal(manifest.schema_set_version, "pipeline-schema-runtime-v3.0.0");
assert.equal(manifest.baseline, i1cBaselineSha);
assert.deepEqual(manifest.stages.map((stage) => stage.stage_id), stageIds);
for (const stage of manifest.stages) {
  assert.equal(hashText(source(stage.prompt_path)), stage.prompt_sha256);
  assert.equal(hashText(source(stage.schema_path)), stage.schema_sha256);
}

const catalog = await loadM2P4ContextualRuntimeStageCatalog();
assert.equal(catalog.promptBundleVersion, "prompt-bundle-runtime-v3.0.0");
assert.equal(catalog.schemaSetVersion, "pipeline-schema-runtime-v3.0.0");
for (const definition of catalog.definitions) {
  const providerSchema = toOpenAiStructuredOutputSchema(definition.outputSchema);
  assert.doesNotThrow(() => assertOpenAIStructuredOutputSchema(providerSchema));
}
const providerPb01Definition = {
  ...catalog.definitions[0],
  schemaHash: "m2-p4-i1-c-r1-provider-pb01",
  outputSchema: toOpenAiStructuredOutputSchema(
    catalog.definitions[0].outputSchema,
  ),
};

const structuredSchema = json(
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
);
const projectionSchema = json(
  "lib/assessment/runtime/contracts/eligibility-projection-v3.schema.json",
);
assert.equal(structuredSchema.type, "object");
assert.equal(structuredSchema.additionalProperties, false);
assert.deepEqual(structuredSchema.properties.decision_facts, {
  $ref: "#/$defs/decision_facts",
});
assert.equal(
  structuredSchema.$defs.decision_facts.properties.information_state.properties
    .can_proceed_without_followup.const,
  true,
);
assert.equal(
  structuredSchema.$defs.decision_facts.properties.information_state.properties
    .assessment_mode.const,
  "best_effort",
);
assert.equal(
  structuredSchema.$defs.context_inference.additionalProperties,
  false,
);
assert.deepEqual(
  sorted(structuredSchema.$defs.context_inference.required),
  sorted(Object.keys(structuredSchema.$defs.context_inference.properties)),
);
assert.ok(!Object.hasOwn(structuredSchema, "anyOf"));
assert.equal(
  structuredSchema.$defs.decision_facts.properties.practical_reason.anyOf.length,
  3,
);
assert.equal(
  structuredSchema.$defs.decision_facts.properties.boundary_state.anyOf.length,
  3,
);
assert.ok(!projectionSchema.properties.acknowledged_eligibility.enum.includes("needs_more_information"));
assert.deepEqual(projectionSchema.properties.acknowledged_eligibility.enum, [
  "ready",
  "safety_blocked",
]);
assert.deepEqual(sorted(projectionSchema.required), sorted(Object.keys(projectionSchema.properties)));

function verifyStrictObjects(node) {
  if (node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) verifyStrictObjects(child);
    return;
  }
  if (node.type === "object") {
    assert.equal(node.additionalProperties, false);
    assert.deepEqual(sorted(node.required), sorted(Object.keys(node.properties)));
  }
  for (const child of Object.values(node)) verifyStrictObjects(child);
}
verifyStrictObjects(structuredSchema);
verifyStrictObjects(projectionSchema);

const pb01Prompt = source(
  "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
);
for (const required of [
  "An incomplete consultation is normal",
  "infer contextually natural categorical facts",
  "decision_facts` is always an object",
  "do not block the consultation",
  "inner state",
  "future behavior",
  "reply probability",
  "Safety and boundary guardrails",
]) {
  assert.ok(pb01Prompt.includes(required), `PB-01 prompt missing ${required}`);
}
for (const prohibited of [
  "M2P4-LIVE-001",
  "REPLY-004",
  "case_id",
  "caseId",
  "oracle lookup",
  "currentSituation.match",
]) {
  assert.ok(!pb01Prompt.includes(prohibited), `PB-01 prompt contains ${prohibited}`);
}

function decisionFacts(overrides = {}) {
  const base = {
    schema_version: "m2-p4-decision-facts-v2",
    relationship_stage: "ambiguous",
    selected_requests: ["decide_send_or_wait", "draft_message"],
    latest_direct_message: {
      sender: "unknown",
      kind: "unknown",
      response_expectation: "unknown",
      user_reply_state: "unknown",
      sns_signal_only: false,
    },
    contact_state: {
      unanswered_user_message_count: null,
      elapsed_since_latest_user_message_minutes: null,
      usual_cadence_relation: "unknown",
      proposed_message_present: false,
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
      assessment_mode: "best_effort",
      can_proceed_without_followup: true,
      used_context_inference: false,
      unresolved_fields: [],
    },
  };
  return {
    ...base,
    ...overrides,
    latest_direct_message: {
      ...base.latest_direct_message,
      ...overrides.latest_direct_message,
    },
    contact_state: { ...base.contact_state, ...overrides.contact_state },
    boundary_state: { ...base.boundary_state, ...overrides.boundary_state },
    practical_reason: { ...base.practical_reason, ...overrides.practical_reason },
    information_state: {
      ...base.information_state,
      ...overrides.information_state,
    },
  };
}

function structuredIntake(facts, inferredFields = []) {
  return {
    schema_version: "pipeline-schema-v3.0.0",
    relationship_stage: facts.relationship_stage,
    user_goal: "decide_send_or_wait",
    timeline: [],
    boundaries:
      facts.boundary_state.status === "explicit"
        ? [
            {
              boundary_id: "B001",
              kind: facts.boundary_state.kind,
              status: "explicit",
              statement: "入力に明確な連絡境界がある。",
              source_refs: ["input:current_situation"],
            },
          ]
        : [],
    context: [],
    observed_facts: [
      {
        fact_id: "F001",
        statement: "判断対象となる相談入力がある。",
        source_refs: ["input:current_situation"],
        support: "explicit",
      },
    ],
    user_assumptions: [],
    user_emotions: [],
    material_unknowns: facts.information_state.unresolved_fields.map((field) => ({
      unknown_code: field.replaceAll(".", "_"),
      description: `${field} は入力だけでは解消していない。`,
      material_to: ["decision"],
    })),
    safety_signals: [],
    untrusted_embedded_instructions_detected: false,
    context_inferences: inferredFields.map((field, index) => ({
      inference_id: `I${String(index + 1).padStart(3, "0")}`,
      field_path: field,
      supporting_fact_ids: ["F001"],
      source_refs: ["input:current_situation"],
      rationale_summary: "相談文全体の役割と時系列から自然に分類できる。",
    })),
    decision_facts: facts,
  };
}

const incomingReply = {
  latest_direct_message: {
    sender: "other_person",
    kind: "thanks_or_followup",
    response_expectation: "reasonable",
    user_reply_state: "not_replied",
    sns_signal_only: false,
  },
};
const baselineFacts = decisionFacts({
  relationship_stage: "matching_app",
  ...incomingReply,
  contact_state: {
    unanswered_user_message_count: 0,
    elapsed_since_latest_user_message_minutes: null,
    usual_cadence_relation: "not_applicable",
    proposed_message_present: true,
  },
  information_state: {
    used_context_inference: true,
    unresolved_fields: ["contact_state.elapsed_since_latest_user_message_minutes"],
  },
});
const baselineInferenceFields = [
  "latest_direct_message.sender",
  "latest_direct_message.kind",
  "latest_direct_message.response_expectation",
  "latest_direct_message.user_reply_state",
];
const baselineIntake = structuredIntake(baselineFacts, baselineInferenceFields);
const generatedReportForGrounding = wait003StageOutputs()["PB-05"];
const incomingGroundedSummary = buildRelationshipSummaryV3(baselineFacts);
assert.ok(incomingGroundedSummary.includes("相手から届いた"));
assert.ok(incomingGroundedSummary.includes("あなたがまだ返信していない"));

const outgoingFacts = decisionFacts({
  latest_direct_message: {
    sender: "user",
    kind: "question",
    response_expectation: "reasonable",
    user_reply_state: "not_applicable",
    sns_signal_only: false,
  },
});
const outgoingGroundedSummary = buildRelationshipSummaryV3(outgoingFacts);
assert.ok(outgoingGroundedSummary.includes("あなたが最後に送った"));
assert.ok(outgoingGroundedSummary.includes("相手の返信を待っている"));

const noDirectMessageSummary = buildRelationshipSummaryV3(
  decisionFacts({
    latest_direct_message: {
      sender: "none",
      kind: "none",
      response_expectation: "none",
      user_reply_state: "not_applicable",
      sns_signal_only: false,
    },
  }),
);
assert.ok(noDirectMessageSummary.includes("直接メッセージが確認できない"));

const unknownDirectionSummary = buildRelationshipSummaryV3(decisionFacts());
assert.ok(unknownDirectionSummary.includes("最後の送信者は断定せず"));
assert.ok(!unknownDirectionSummary.includes("相手から届いた"));
assert.ok(!unknownDirectionSummary.includes("あなたが最後に送った"));

assert.deepEqual(
  groundReportContentV3(baselineFacts, generatedReportForGrounding),
  {
    ...generatedReportForGrounding,
    relationship_summary: incomingGroundedSummary,
  },
);
function assertCanonicalAndProviderPass(intake) {
  assert.doesNotThrow(() => validateStageOutput(catalog.definitions[0], intake));
  assert.doesNotThrow(() => validateStageOutput(providerPb01Definition, intake));
}

function assertCanonicalAndProviderFail(intake) {
  for (const definition of [catalog.definitions[0], providerPb01Definition]) {
    assert.throws(
      () => validateStageOutput(definition, intake),
      (error) => error?.safeCode === "M2_STAGE_SCHEMA_INVALID",
    );
  }
}

function expectIntegrityInvalid(intake) {
  assert.throws(
    () => validateContextualIntakeIntegrityV3(intake),
    (error) => error?.safeCode === "M2_CONTEXTUAL_INFERENCE_INVALID",
  );
}

const explicitOnlyFacts = decisionFacts({
  latest_direct_message: {
    sender: "none",
    kind: "none",
    response_expectation: "none",
    user_reply_state: "not_applicable",
    sns_signal_only: false,
  },
  contact_state: {
    unanswered_user_message_count: 0,
    elapsed_since_latest_user_message_minutes: null,
    usual_cadence_relation: "not_applicable",
    proposed_message_present: false,
  },
});
const explicitOnlyIntake = structuredIntake(explicitOnlyFacts);
const unresolvedPracticalFacts = decisionFacts({
  practical_reason: {
    kind: "unknown",
    active: false,
    deadline: "unknown",
  },
  information_state: {
    unresolved_fields: [
      "practical_reason.kind",
      "practical_reason.deadline",
    ],
  },
});
const unresolvedPracticalIntake = structuredIntake(
  unresolvedPracticalFacts,
);
const unresolvedBoundaryFacts = decisionFacts({
  boundary_state: {
    kind: "unknown",
    status: "unknown",
    repeated_unanswered_contact: false,
  },
  information_state: {
    unresolved_fields: ["boundary_state.kind", "boundary_state.status"],
  },
});
const unresolvedBoundaryIntake = structuredIntake(unresolvedBoundaryFacts);

for (const intake of [
  explicitOnlyIntake,
  baselineIntake,
  unresolvedPracticalIntake,
  unresolvedBoundaryIntake,
]) {
  assertCanonicalAndProviderPass(intake);
  assert.doesNotThrow(() => validateContextualIntakeIntegrityV3(intake));
}

const applicationOwnedRequest = {
  currentSituation: "Sanitized ordinary consultation input.",
  optionalMessage: "Sanitized proposed reply.",
  relationship: "matching_app",
  requestedTopics: ["decide_send_or_wait", "draft_message"],
  privacyAcknowledged: true,
};

const liveFailureEquivalentRawIntake = structuredClone(baselineIntake);
liveFailureEquivalentRawIntake.relationship_stage = "other";
liveFailureEquivalentRawIntake.decision_facts.relationship_stage = "ambiguous";
liveFailureEquivalentRawIntake.decision_facts.selected_requests = ["relationship"];
liveFailureEquivalentRawIntake.decision_facts.contact_state.proposed_message_present =
  false;
liveFailureEquivalentRawIntake.decision_facts.information_state.unresolved_fields.push(
  "relationship_stage",
  "contact_state.proposed_message_present",
);
liveFailureEquivalentRawIntake.context_inferences.push(
  {
    inference_id: "I005",
    field_path: "contact_state.proposed_message_present",
    supporting_fact_ids: ["F001"],
    source_refs: ["input:current_situation"],
    rationale_summary: "The raw output treated proposal presence as inferred.",
  },
  {
    inference_id: "I006",
    field_path: "relationship_stage",
    supporting_fact_ids: ["F001"],
    source_refs: ["followup:relationship"],
    rationale_summary: "The raw output cited mismatched relationship metadata.",
  },
);
assertCanonicalAndProviderPass(liveFailureEquivalentRawIntake);
expectIntegrityInvalid(liveFailureEquivalentRawIntake);
const rawLiveFailureSnapshot = structuredClone(liveFailureEquivalentRawIntake);
const groundedLiveFailureIntake = groundStructuredIntakeV3(
  applicationOwnedRequest,
  liveFailureEquivalentRawIntake,
);
assert.deepEqual(liveFailureEquivalentRawIntake, rawLiveFailureSnapshot);
assert.equal(groundedLiveFailureIntake.relationship_stage, "matching_app");
assert.equal(
  groundedLiveFailureIntake.decision_facts.relationship_stage,
  "matching_app",
);
assert.deepEqual(
  groundedLiveFailureIntake.decision_facts.selected_requests,
  applicationOwnedRequest.requestedTopics,
);
assert.equal(
  groundedLiveFailureIntake.decision_facts.contact_state.proposed_message_present,
  true,
);
assert.deepEqual(
  groundedLiveFailureIntake.context_inferences.map(
    (inference) => inference.inference_id,
  ),
  ["I001", "I002", "I003", "I004"],
);
assert.ok(
  groundedLiveFailureIntake.decision_facts.information_state.unresolved_fields.every(
    (fieldPath) =>
      fieldPath !== "relationship_stage" &&
      fieldPath !== "contact_state.proposed_message_present",
  ),
);
assert.doesNotThrow(() =>
  validateContextualIntakeIntegrityV3(groundedLiveFailureIntake),
);

const relationshipOnlyRaw = structuredIntake(
  decisionFacts({
    relationship_stage: "ambiguous",
    information_state: { used_context_inference: true },
  }),
  ["relationship_stage"],
);
const relationshipOnlyGrounded = groundStructuredIntakeV3(
  applicationOwnedRequest,
  relationshipOnlyRaw,
);
assert.deepEqual(relationshipOnlyGrounded.context_inferences, []);
assert.equal(
  relationshipOnlyGrounded.decision_facts.information_state
    .used_context_inference,
  false,
);
assert.doesNotThrow(() =>
  validateContextualIntakeIntegrityV3(relationshipOnlyGrounded),
);

for (const [optionalMessage, expected] of [
  ["Use this reply.", true],
  [null, false],
  ["   ", false],
]) {
  const proposedRaw = structuredIntake(
    decisionFacts({
      contact_state: { proposed_message_present: !expected },
      information_state: { used_context_inference: true },
    }),
    ["contact_state.proposed_message_present"],
  );
  const proposedGrounded = groundStructuredIntakeV3(
    { ...applicationOwnedRequest, optionalMessage },
    proposedRaw,
  );
  assert.equal(
    proposedGrounded.decision_facts.contact_state.proposed_message_present,
    expected,
  );
  assert.deepEqual(proposedGrounded.context_inferences, []);
  assert.equal(
    proposedGrounded.decision_facts.information_state.used_context_inference,
    false,
  );
  assert.doesNotThrow(() =>
    validateContextualIntakeIntegrityV3(proposedGrounded),
  );
}

const sourceMismatchRaw = structuredClone(baselineIntake);
sourceMismatchRaw.observed_facts.push({
  ...structuredClone(sourceMismatchRaw.observed_facts[0]),
  fact_id: "F002",
  source_refs: ["followup:relationship", "input:current_situation"],
});
sourceMismatchRaw.context_inferences[0].supporting_fact_ids = ["F002", "F001"];
sourceMismatchRaw.context_inferences[0].source_refs = ["input:optional_message"];
expectIntegrityInvalid(sourceMismatchRaw);
const sourceMismatchGrounded = groundStructuredIntakeV3(
  applicationOwnedRequest,
  sourceMismatchRaw,
);
assert.deepEqual(sourceMismatchGrounded.context_inferences[0].source_refs, [
  "followup:relationship",
  "input:current_situation",
]);
assert.doesNotThrow(() =>
  validateContextualIntakeIntegrityV3(sourceMismatchGrounded),
);

const legalPracticalFacts = [
  explicitOnlyFacts,
  decisionFacts({
    practical_reason: {
      kind: "schedule_coordination",
      active: true,
      deadline: "next_day",
    },
  }),
  unresolvedPracticalFacts,
];
const legalBoundaryFacts = [
  explicitOnlyFacts,
  decisionFacts({
    boundary_state: {
      kind: "no_contact",
      status: "explicit",
      repeated_unanswered_contact: false,
    },
  }),
  unresolvedBoundaryFacts,
];
for (const facts of [...legalPracticalFacts, ...legalBoundaryFacts]) {
  assertCanonicalAndProviderPass(structuredIntake(facts));
}

const invalidPracticalFacts = [
  decisionFacts({
    practical_reason: { kind: "none", active: true, deadline: "none" },
  }),
  decisionFacts({
    practical_reason: {
      kind: "schedule_coordination",
      active: false,
      deadline: "next_day",
    },
  }),
  decisionFacts({
    practical_reason: {
      kind: "unknown",
      active: false,
      deadline: "none",
    },
  }),
];
const invalidBoundaryFacts = [
  decisionFacts({
    boundary_state: {
      kind: "none",
      status: "explicit",
      repeated_unanswered_contact: false,
    },
  }),
  decisionFacts({
    boundary_state: {
      kind: "no_contact",
      status: "none",
      repeated_unanswered_contact: false,
    },
  }),
  decisionFacts({
    boundary_state: {
      kind: "unknown",
      status: "unknown",
      repeated_unanswered_contact: true,
    },
  }),
];
for (const facts of invalidPracticalFacts) {
  const intake = structuredIntake(facts);
  assertCanonicalAndProviderFail(intake);
  assert.throws(
    () => requireContextualDecisionFactsV3(intake),
    (error) => error?.safeCode === "M2_DECISION_FACTS_INCOMPLETE",
  );
}
for (const facts of invalidBoundaryFacts) {
  const intake = structuredIntake(facts);
  assertCanonicalAndProviderFail(intake);
  assert.throws(
    () => requireContextualDecisionFactsV3(intake),
    (error) => error?.safeCode === "M2_DECISION_FACTS_INCOMPLETE",
  );
}

const nonexistentFact = structuredClone(baselineIntake);
nonexistentFact.context_inferences[0].supporting_fact_ids = ["F999"];
expectIntegrityInvalid(nonexistentFact);

const duplicateFactId = structuredClone(baselineIntake);
duplicateFactId.observed_facts.push(structuredClone(duplicateFactId.observed_facts[0]));
expectIntegrityInvalid(duplicateFactId);

const duplicateInferenceId = structuredClone(baselineIntake);
duplicateInferenceId.context_inferences[1].inference_id =
  duplicateInferenceId.context_inferences[0].inference_id;
expectIntegrityInvalid(duplicateInferenceId);

const duplicateInferenceField = structuredClone(baselineIntake);
duplicateInferenceField.context_inferences[1].field_path =
  duplicateInferenceField.context_inferences[0].field_path;
expectIntegrityInvalid(duplicateInferenceField);

const unsupportedInferenceSource = structuredClone(baselineIntake);
unsupportedInferenceSource.context_inferences[0].source_refs = [
  "input:optional_message",
];
expectIntegrityInvalid(unsupportedInferenceSource);

const inferenceFlagFalse = structuredClone(baselineIntake);
inferenceFlagFalse.decision_facts.information_state.used_context_inference = false;
expectIntegrityInvalid(inferenceFlagFalse);

const emptyInferenceFlagTrue = structuredClone(explicitOnlyIntake);
emptyInferenceFlagTrue.decision_facts.information_state.used_context_inference = true;
expectIntegrityInvalid(emptyInferenceFlagTrue);

const inferredAndUnresolved = structuredClone(baselineIntake);
inferredAndUnresolved.decision_facts.information_state.unresolved_fields.push(
  "latest_direct_message.sender",
);
expectIntegrityInvalid(inferredAndUnresolved);

const inferredUnknown = structuredClone(baselineIntake);
inferredUnknown.decision_facts.latest_direct_message.sender = "unknown";
expectIntegrityInvalid(inferredUnknown);

const inferredBoundary = structuredClone(explicitOnlyIntake);
inferredBoundary.context_inferences = [
  {
    inference_id: "I001",
    field_path: "boundary_state.kind",
    supporting_fact_ids: ["F001"],
    source_refs: ["input:current_situation"],
    rationale_summary: "入力全体から境界を分類した。",
  },
];
inferredBoundary.decision_facts.information_state.used_context_inference = true;
expectIntegrityInvalid(inferredBoundary);

const unresolvedBoolean = structuredClone(explicitOnlyIntake);
unresolvedBoolean.decision_facts.information_state.unresolved_fields = [
  "latest_direct_message.sns_signal_only",
];
expectIntegrityInvalid(unresolvedBoolean);

const unresolvedResolvedValue = structuredClone(explicitOnlyIntake);
unresolvedResolvedValue.decision_facts.latest_direct_message.sender = "user";
unresolvedResolvedValue.decision_facts.information_state.unresolved_fields = [
  "latest_direct_message.sender",
];
expectIntegrityInvalid(unresolvedResolvedValue);
const duplicateUnresolvedField = structuredClone(unresolvedPracticalIntake);
duplicateUnresolvedField.decision_facts.information_state.unresolved_fields.push(
  "practical_reason.kind",
);
expectIntegrityInvalid(duplicateUnresolvedField);
const invalidGroundedEvidenceIntakes = [
  nonexistentFact,
  duplicateInferenceId,
  duplicateInferenceField,
  inferredBoundary,
  inferredAndUnresolved,
];
for (const intake of invalidGroundedEvidenceIntakes) {
  const grounded = groundStructuredIntakeV3(applicationOwnedRequest, intake);
  assertCanonicalAndProviderPass(grounded);
  expectIntegrityInvalid(grounded);
}
for (const intake of [inferenceFlagFalse, emptyInferenceFlagTrue]) {
  const grounded = groundStructuredIntakeV3(applicationOwnedRequest, intake);
  assert.doesNotThrow(() => validateContextualIntakeIntegrityV3(grounded));
}

const runtimeIntegrityInvalidIntakes = [
  nonexistentFact,
  duplicateFactId,
  duplicateInferenceId,
  duplicateInferenceField,
  inferredAndUnresolved,
  inferredUnknown,
  inferredBoundary,
  unresolvedBoolean,
  unresolvedResolvedValue,
];

assert.equal(requireContextualDecisionFactsV3(baselineIntake), baselineFacts);
assert.equal(projectDecisionFactsV2ToV1(baselineFacts).information_state.complete_for_decision, true);
assert.deepEqual(
  projectDecisionFactsV2ToV1(unresolvedPracticalFacts).practical_reason,
  { kind: "none", active: false, deadline: "none" },
);

assert.equal(deriveRuntimeEligibilityV3({ classification: "normal_allowed" }), "ready");
assert.equal(deriveRuntimeEligibilityV3({ classification: "needs_review" }), "safety_blocked");
assert.equal(deriveRuntimeEligibilityV3({ classification: "rejected" }), "safety_blocked");
assert.deepEqual(buildLocalEligibilityResultV3("ready"), {
  schema_version: "m2-p4-runtime-eligibility-v3",
  eligibility: "ready",
  question_codes: [],
  normal_flow_allowed: true,
  payment_allowed: true,
  report_generation: "allowed",
});
assert.throws(
  () => validateEligibilityProjectionV3({ acknowledged_eligibility: "safety_blocked" }, "ready"),
  (error) => error?.safeCode === "M2_ELIGIBILITY_PROJECTION_MISMATCH",
);

const normalDeterministicSafety = {
  classification: "normal_allowed",
  reason_codes: [],
  response_mode: "none",
};
assert.deepEqual(
  aggregateSafetyV3(normalDeterministicSafety, {
    classification: "normal_allowed",
    reason_codes: ["normal"],
    response_mode: "none",
  }),
  {
    classification: "normal_allowed",
    reason_codes: ["normal"],
    response_mode: "none",
  },
);
assert.deepEqual(
  aggregateSafetyV3(normalDeterministicSafety, {
    classification: "normal_allowed",
    reason_codes: [],
    response_mode: "none",
  }),
  {
    classification: "normal_allowed",
    reason_codes: [],
    response_mode: "none",
  },
);
assert.equal(
  aggregateSafetyV3(normalDeterministicSafety, {
    classification: "needs_review",
    reason_codes: ["dv_abuse_fear"],
    response_mode: "abuse_safety_support",
  }).response_mode,
  "abuse_safety_support",
);
assert.equal(
  aggregateSafetyV3(normalDeterministicSafety, {
    classification: "rejected",
    reason_codes: ["stalking_or_visit"],
    response_mode: "unsafe_contact_stop",
  }).response_mode,
  "unsafe_contact_stop",
);
assert.equal(
  aggregateSafetyV3(normalDeterministicSafety, {
    classification: "rejected",
    reason_codes: ["harm_others"],
    response_mode: "urgent_other_safety",
  }).response_mode,
  "urgent_other_safety",
);
assert.deepEqual(
  aggregateSafetyV3(normalDeterministicSafety, {
    classification: "rejected",
    reason_codes: ["normal", "stalking_or_visit"],
    response_mode: "unsafe_contact_stop",
  }).reason_codes,
  ["stalking_or_visit"],
);

class OfflineFakeTransport {
  actualProviderCalls = 0;
  calls = [];
  requests = [];

  constructor(outputs) {
    this.outputs = structuredClone(outputs);
  }

  async invoke(request) {
    this.calls.push(request.stageId);
    this.requests.push(structuredClone(request));
    return {
      responseId: `offline-${request.stageId.toLowerCase()}-${this.calls.length}`,
      returnedModel: request.model,
      output: structuredClone(this.outputs[request.stageId]),
      usage: {
        inputTokens: 10,
        cachedTokens: 0,
        outputTokens: 10,
        reasoningTokens: 0,
      },
      latencyMs: 1,
    };
  }
}

function decisionPlanFor(outputs, decision) {
  const plan = { ...outputs["PB-04"], selected_decision: decision };
  plan.message_draft =
    decision === "reply_now" || decision === "send_now"
      ? {
          text: "ありがとうございます。予定を確認して、またご連絡します。",
          policy: "required_now",
          use_timing: "now",
        }
      : null;
  return plan;
}

function semanticFinding(findingCode, severity, jsonPath, evidenceRefs) {
  return {
    finding_code: findingCode,
    severity,
    json_path: jsonPath,
    evidence_refs: evidenceRefs ?? ["input:decision_plan"],
    detail: "時間軸または候補内容の整合性を確認する検証 finding。",
  };
}

const allDirectionPlan = decisionPlanFor(wait003StageOutputs(), "reply_now");
allDirectionPlan.change_conditions = [
  {
    condition: "相手から具体的な返信が届いたこと。",
    resulting_direction: "reply_now",
  },
  {
    condition: "必要な日程変更が生じたこと。",
    resulting_direction: "send_now",
  },
  {
    condition: "今夜は返信を見送る意思が明確になったこと。",
    resulting_direction: "wait_and_reassess",
  },
  {
    condition: "明示的な距離の希望が示されたこと。",
    resulting_direction: "pause_additional_contact",
  },
];
const allDirectionCommentary = buildChangeConditionCommentaryV3(
  allDirectionPlan,
);
assert.deepEqual(allDirectionCommentary, [
  "「相手から具体的な返信が届いたこと」という条件が確認された場合は、その時点では短く返信する方向へ見直します。",
  "「必要な日程変更が生じたこと」という条件が確認された場合は、その時点では必要な連絡を送る方向へ見直します。",
  "「今夜は返信を見送る意思が明確になったこと」という条件が確認された場合は、その時点では送信を急がず、いったん見直す方向へ切り替えます。",
  "「明示的な距離の希望が示されたこと」という条件が確認された場合は、その時点では追加連絡を止める方向へ切り替えます。",
]);
const allDirectionRawReport = wait003StageOutputs()["PB-05"];
const allDirectionGroundedReport = groundChangeConditionCommentaryV3(
  allDirectionPlan,
  allDirectionRawReport,
);
assert.deepEqual(
  allDirectionGroundedReport.change_condition_commentary,
  allDirectionCommentary,
);
assert.notDeepEqual(
  allDirectionRawReport.change_condition_commentary,
  allDirectionCommentary,
);

const requiredBlockingFindings = [
  semanticFinding(
    "DECISION_ALLOWED",
    "critical",
    "decision_plan.selected_decision",
  ),
  semanticFinding(
    "MESSAGE_POLICY_CONSISTENCY",
    "major",
    "decision_plan.message_draft",
  ),
  semanticFinding("ACTION_CONSISTENCY", "major", "decision_plan.actions_to_take[0]"),
  semanticFinding("ACTION_CONSISTENCY", "major", "decision_plan.actions_to_avoid[0]"),
  semanticFinding(
    "THREE_DAY_PLAN_CONSISTENCY",
    "major",
    "decision_plan.three_day_plan[0]",
  ),
  semanticFinding("FACT_FIDELITY", "major", "report_content.relationship_summary", [
    "F001",
  ]),
  semanticFinding(
    "ASSUMPTION_AS_FACT",
    "major",
    "report_content.possible_interpretations[0]",
    ["F001"],
  ),
  semanticFinding(
    "SAFETY_REGRESSION",
    "critical",
    "report_content.action_rationales[0]",
    ["input:aggregate_safety_result"],
  ),
  semanticFinding(
    "UNSUPPORTED_CERTAINTY",
    "major",
    "report_content.closing_lines[0]",
    ["F001"],
  ),
  semanticFinding(
    "DECISION_ALLOWED",
    "major",
    "decision_plan.change_conditions[99].resulting_direction",
  ),
  semanticFinding(
    "DECISION_ALLOWED",
    "major",
    "decision_plan.change_conditions[00].resulting_direction",
  ),
];
const requiredBlockingDisposition = evaluateSemanticFindingsV3({
  validationOutput: { semantic_checks: requiredBlockingFindings },
  decisionPlan: allDirectionPlan,
  groundedReportContent: allDirectionGroundedReport,
});
assert.equal(requiredBlockingDisposition.blockingFindings.length, 11);
assert.equal(
  requiredBlockingDisposition.ignoredTemporalFalsePositives.length,
  0,
);

const mismatchedCommentaryReport = structuredClone(
  allDirectionGroundedReport,
);
mismatchedCommentaryReport.change_condition_commentary[0] =
  "現在の命令へ誤変換された文。";
const mismatchedCommentaryDisposition = evaluateSemanticFindingsV3({
  validationOutput: {
    semantic_checks: [
      semanticFinding(
        "MESSAGE_POLICY_CONSISTENCY",
        "major",
        "$.report_content.change_condition_commentary[0]",
        ["input:report_content"],
      ),
    ],
  },
  decisionPlan: allDirectionPlan,
  groundedReportContent: mismatchedCommentaryReport,
});
assert.equal(mismatchedCommentaryDisposition.blockingFindings.length, 1);
assert.equal(
  mismatchedCommentaryDisposition.ignoredTemporalFalsePositives.length,
  0,
);

const minorDisposition = evaluateSemanticFindingsV3({
  validationOutput: {
    semantic_checks: [
      semanticFinding("BRAND_TONE", "minor", "report_content.cover_line"),
    ],
  },
  decisionPlan: allDirectionPlan,
  groundedReportContent: allDirectionGroundedReport,
});
assert.equal(minorDisposition.blockingFindings.length, 0);
assert.equal(minorDisposition.ignoredTemporalFalsePositives.length, 0);

function runtimeOutputs(testCase) {
  const outputs = testCase.safetyBlocked
    ? safetyBlockedStageOutputs()
    : wait003StageOutputs();
  if (!testCase.safetyBlocked) {
    outputs["PB-02"] = {
      ...outputs["PB-02"],
      classification: "normal_allowed",
      reason_codes: ["normal"],
      response_mode: "none",
    };
  }
  outputs["PB-01"] = structuredIntake(testCase.facts, testCase.inferredFields ?? []);
  outputs["PB-03"] = {
    schema_version: "pipeline-schema-v3.0.0",
    acknowledged_eligibility: testCase.safetyBlocked ? "safety_blocked" : "ready",
  };
  outputs["PB-04"] = decisionPlanFor(outputs, testCase.expectedDecision);
  return outputs;
}

const testCases = [
  {
    id: "SPARSE-01",
    facts: decisionFacts({
      ...incomingReply,
      information_state: {
        used_context_inference: true,
        unresolved_fields: ["contact_state.elapsed_since_latest_user_message_minutes"],
      },
    }),
    inferredFields: baselineInferenceFields,
    expectedDecision: "reply_now",
  },
  {
    id: "SPARSE-02",
    facts: decisionFacts({
      ...incomingReply,
      information_state: {
        used_context_inference: true,
        unresolved_fields: ["contact_state.usual_cadence_relation"],
      },
    }),
    inferredFields: baselineInferenceFields,
    expectedDecision: "reply_now",
  },
  {
    id: "SPARSE-03",
    facts: decisionFacts({
      ...incomingReply,
      information_state: { used_context_inference: true },
    }),
    inferredFields: baselineInferenceFields,
    expectedDecision: "reply_now",
  },
  {
    id: "SPARSE-04",
    facts: decisionFacts({
      latest_direct_message: {
        sender: "user",
        kind: "other",
        response_expectation: "optional",
        user_reply_state: "not_applicable",
        sns_signal_only: false,
      },
      information_state: { used_context_inference: true },
    }),
    inferredFields: ["latest_direct_message.sender"],
    expectedDecision: "wait_and_reassess",
  },
  {
    id: "SPARSE-05",
    facts: decisionFacts({
      practical_reason: {
        kind: "schedule_coordination",
        active: true,
        deadline: "next_day",
      },
      information_state: { used_context_inference: true },
    }),
    inferredFields: ["practical_reason.kind", "practical_reason.active"],
    expectedDecision: "send_now",
  },
  {
    id: "SPARSE-06",
    facts: decisionFacts({
      information_state: {
        unresolved_fields: [
          "latest_direct_message.sender",
          "latest_direct_message.kind",
          "latest_direct_message.response_expectation",
        ],
      },
    }),
    expectedDecision: "wait_and_reassess",
  },
  {
    id: "SPARSE-07",
    facts: decisionFacts({
      information_state: {
        unresolved_fields: ["latest_direct_message.sender"],
      },
    }),
    expectedDecision: "wait_and_reassess",
  },
  {
    id: "SPARSE-08",
    facts: decisionFacts({
      latest_direct_message: {
        sender: "none",
        kind: "social_acknowledgement",
        response_expectation: "none",
        user_reply_state: "not_applicable",
        sns_signal_only: true,
      },
    }),
    expectedDecision: "wait_and_reassess",
  },
  {
    id: "SPARSE-09",
    facts: decisionFacts({
      boundary_state: {
        kind: "no_contact",
        status: "explicit",
        repeated_unanswered_contact: false,
      },
    }),
    expectedDecision: "pause_additional_contact",
  },
  {
    id: "SPARSE-10",
    facts: decisionFacts({
      boundary_state: {
        kind: "none",
        status: "none",
        repeated_unanswered_contact: true,
      },
    }),
    expectedDecision: "pause_additional_contact",
  },
  {
    id: "SPARSE-11-SAFETY",
    facts: decisionFacts(),
    expectedDecision: "wait_and_reassess",
    safetyBlocked: true,
  },
  {
    id: "SPARSE-12",
    facts: decisionFacts({
      relationship_stage: "unknown",
      information_state: {
        unresolved_fields: [
          "relationship_stage",
          "latest_direct_message.sender",
          "latest_direct_message.kind",
          "latest_direct_message.response_expectation",
          "latest_direct_message.user_reply_state",
          "contact_state.unanswered_user_message_count",
          "contact_state.elapsed_since_latest_user_message_minutes",
          "contact_state.usual_cadence_relation",
        ],
      },
    }),
    expectedDecision: "wait_and_reassess",
  },
];

const syntheticInput = {
  currentSituation:
    "マッチング後に会った相手から、お礼と次の予定に触れる連絡が届きました。まだ返しておらず、短く返す文面を考えています。",
  optionalMessage: "こちらこそありがとう。次の予定も楽しみにしています。",
  relationship: "matching_app",
  requestedTopics: ["decide_send_or_wait", "draft_message"],
  privacyAcknowledged: true,
};

async function runWithOutputs(outputs, index) {
  const trace = [];
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
  const result = await application.submit(
    syntheticInput,
    `90000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  );
  return { result, trace, repository, transport };
}

async function runCase(testCase, index) {
  return runWithOutputs(runtimeOutputs(testCase), index);
}

async function expectPb01IntegrityRejection(intake, index) {
  const outputs = runtimeOutputs({
    facts: explicitOnlyFacts,
    expectedDecision: "wait_and_reassess",
  });
  outputs["PB-01"] = intake;
  const repository = new FakeAssessmentRepository();
  const transport = new OfflineFakeTransport(outputs);
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => "2026-07-31T00:00:00.000Z",
    uuid: deterministicUuidFactory(),
  });
  try {
    await application.submit(
      syntheticInput,
      `70000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    );
    assert.fail("expected PB-01 contextual integrity rejection");
  } catch (error) {
    assert.equal(error?.safeCode, "M2_CONTEXTUAL_INFERENCE_INVALID");
  }
  assert.deepEqual(transport.calls, ["PB-01"]);
  assert.equal(repository.reports.size, 0);
  const rawPb01Stage = [...repository.stageRuns.values()].find(
    (stage) => stage.stageId === "PB-01",
  );
  assert.equal(rawPb01Stage?.status, "completed");
  assert.deepEqual(rawPb01Stage?.completion?.outputJson, intake);
  assert.equal(rawPb01Stage?.failure, undefined);
  assert.equal(transport.actualProviderCalls, 0);
  assert.equal(repository.actualSupabaseCalls, 0);
}

for (const [index, intake] of runtimeIntegrityInvalidIntakes.entries()) {
  await expectPb01IntegrityRejection(intake, index);
}

const caseResults = [];
for (const [index, testCase] of testCases.entries()) {
  const runtime = await runCase(testCase, index);
  caseResults.push(runtime);
  if (testCase.safetyBlocked) {
    assert.equal(runtime.result.eligibility, "safety_blocked");
    assert.deepEqual(runtime.transport.calls, ["PB-01", "PB-02", "PB-03"]);
    assert.equal(runtime.repository.reports.size, 0);
  } else {
    assert.equal(runtime.result.eligibility, "ready");
    assert.equal(runtime.result.decision, testCase.expectedDecision);
    assert.equal(runtime.result.decisionCard.decision, testCase.expectedDecision);
    assert.deepEqual(runtime.transport.calls, stageIds);
    assert.equal(runtime.repository.reports.size, 1);
  }
  assert.equal(runtime.transport.actualProviderCalls, 0);
  assert.equal(runtime.repository.actualSupabaseCalls, 0);
}

const unresolvedNormalCases = [
  {
    id: "R1-UNRESOLVED-PRACTICAL",
    facts: unresolvedPracticalFacts,
    expectedDecision: "wait_and_reassess",
  },
  {
    id: "R1-UNRESOLVED-BOUNDARY",
    facts: unresolvedBoundaryFacts,
    expectedDecision: "wait_and_reassess",
  },
];
for (const [index, testCase] of unresolvedNormalCases.entries()) {
  const runtime = await runCase(testCase, index + 100);
  assert.equal(runtime.result.eligibility, "ready");
  assert.equal(runtime.result.decision, "wait_and_reassess");
  assert.deepEqual(runtime.transport.calls, stageIds);
  assert.equal(runtime.repository.reports.size, 1);
}

const baselineRuntime = await runCase(
  {
    id: "BASELINE-SANITIZED",
    facts: baselineFacts,
    inferredFields: baselineInferenceFields,
    expectedDecision: "reply_now",
  },
  20,
);
assert.equal(baselineRuntime.result.decision, "reply_now");
assert.equal(baselineRuntime.repository.reports.size, 1);
const baselinePb04 = baselineRuntime.transport.requests.find(
  (request) => request.stageId === "PB-04",
);
assert.equal(
  baselinePb04.input.eligibility_result.schema_version,
  "m2-p4-runtime-eligibility-v3",
);
assert.equal(baselinePb04.input.eligibility_result.eligibility, "ready");
assert.ok(!Object.hasOwn(baselinePb04.input, "application_eligibility_expectation"));
assert.equal(
  baselinePb04.input.aggregate_safety_result.classification,
  "normal_allowed",
);
assert.equal(baselinePb04.input.aggregate_safety_result.response_mode, "none");
assert.equal(baselineRuntime.result.report.decisionPlan.message_draft === null, false);
assert.equal(
  baselineRuntime.result.report.content.relationship_summary,
  incomingGroundedSummary,
);
const baselinePb06 = baselineRuntime.transport.requests.find(
  (request) => request.stageId === "PB-06",
);
assert.equal(
  baselinePb06.input.aggregate_safety_result.response_mode,
  "none",
);
assert.equal(
  baselinePb06.input.report_content.relationship_summary,
  incomingGroundedSummary,
);

const liveFailureEquivalentOutputs = runtimeOutputs({
  facts: baselineFacts,
  inferredFields: baselineInferenceFields,
  expectedDecision: "reply_now",
});
liveFailureEquivalentOutputs["PB-01"] = liveFailureEquivalentRawIntake;
const liveFailureEquivalentRuntime = await runWithOutputs(
  liveFailureEquivalentOutputs,
  201,
);
assert.equal(liveFailureEquivalentRuntime.result.eligibility, "ready");
assert.equal(liveFailureEquivalentRuntime.result.decision, "reply_now");
assert.notEqual(
  liveFailureEquivalentRuntime.result.report.decisionPlan.message_draft,
  null,
);
assert.equal(liveFailureEquivalentRuntime.repository.reports.size, 1);
assert.equal(
  liveFailureEquivalentRuntime.result.report.content.relationship_summary,
  incomingGroundedSummary,
);
const liveRawPb01Stage = [
  ...liveFailureEquivalentRuntime.repository.stageRuns.values(),
].find((stage) => stage.stageId === "PB-01");
assert.equal(liveRawPb01Stage?.status, "completed");
assert.deepEqual(
  liveRawPb01Stage?.completion?.outputJson,
  liveFailureEquivalentRawIntake,
);
const livePb02Request = liveFailureEquivalentRuntime.transport.requests.find(
  (request) => request.stageId === "PB-02",
);
assert.deepEqual(
  livePb02Request.input.structured_intake,
  groundedLiveFailureIntake,
);
assert.notDeepEqual(
  livePb02Request.input.structured_intake,
  liveFailureEquivalentRawIntake,
);
for (const stageId of ["PB-03", "PB-04", "PB-05", "PB-06"]) {
  const request = liveFailureEquivalentRuntime.transport.requests.find(
    (candidate) => candidate.stageId === stageId,
  );
  assert.deepEqual(request.input.structured_intake, groundedLiveFailureIntake);
}
const livePb06Output = liveFailureEquivalentOutputs["PB-06"];
assert.equal(
  livePb06Output.semantic_checks.filter((finding) =>
    ["major", "critical"].includes(finding.severity),
  ).length,
  0,
);

const temporalLiveOutputs = runtimeOutputs({
  facts: baselineFacts,
  inferredFields: baselineInferenceFields,
  expectedDecision: "reply_now",
});
temporalLiveOutputs["PB-04"].change_conditions = [
  {
    condition: "今夜は返信を見送る意思が明確になったこと。",
    resulting_direction: "wait_and_reassess",
  },
  {
    condition: "相手から具体的な返信が届いたこと。",
    resulting_direction: "reply_now",
  },
  {
    condition: "明示的な距離の希望が示されたこと。",
    resulting_direction: "pause_additional_contact",
  },
];
const temporalRawCommentary = [
  "今は送らない。",
  "返信が届いたら内容を確認する。",
  "今すぐ連絡を止める。",
];
temporalLiveOutputs["PB-05"].change_condition_commentary =
  temporalRawCommentary;
temporalLiveOutputs["PB-06"] = {
  ...temporalLiveOutputs["PB-06"],
  semantic_checks: [
    semanticFinding(
      "DECISION_ALLOWED",
      "critical",
      "decision_plan.change_conditions[0].resulting_direction",
      ["input:decision_policy_result", "input:decision_plan"],
    ),
    semanticFinding(
      "DECISION_ALLOWED",
      "critical",
      "$.decision_plan.change_conditions[2].resulting_direction",
      ["input:decision_policy_result", "input:decision_plan"],
    ),
    semanticFinding(
      "MESSAGE_POLICY_CONSISTENCY",
      "major",
      "report_content.change_condition_commentary[0]",
      ["input:decision_policy_result", "input:report_content"],
    ),
    semanticFinding(
      "MESSAGE_POLICY_CONSISTENCY",
      "major",
      "$.report_content.change_condition_commentary[2]",
      ["input:decision_policy_result", "input:report_content"],
    ),
  ],
};
const temporalExpectedCommentary = buildChangeConditionCommentaryV3(
  temporalLiveOutputs["PB-04"],
);
const temporalGroundedReport = groundChangeConditionCommentaryV3(
  temporalLiveOutputs["PB-04"],
  temporalLiveOutputs["PB-05"],
);
const temporalDisposition = evaluateSemanticFindingsV3({
  validationOutput: temporalLiveOutputs["PB-06"],
  decisionPlan: temporalLiveOutputs["PB-04"],
  groundedReportContent: temporalGroundedReport,
});
assert.equal(temporalDisposition.ignoredTemporalFalsePositives.length, 4);
assert.equal(temporalDisposition.blockingFindings.length, 0);

const temporalLiveRuntime = await runWithOutputs(temporalLiveOutputs, 202);
assert.equal(temporalLiveRuntime.result.eligibility, "ready");
assert.equal(temporalLiveRuntime.result.decision, "reply_now");
assert.notEqual(
  temporalLiveRuntime.result.report.decisionPlan.message_draft,
  null,
);
assert.equal(temporalLiveRuntime.repository.reports.size, 1);
const temporalRawPb05Stage = [
  ...temporalLiveRuntime.repository.stageRuns.values(),
].find((stage) => stage.stageId === "PB-05");
assert.equal(temporalRawPb05Stage?.status, "completed");
assert.deepEqual(
  temporalRawPb05Stage?.completion?.outputJson.change_condition_commentary,
  temporalRawCommentary,
);
const temporalPb06Request = temporalLiveRuntime.transport.requests.find(
  (request) => request.stageId === "PB-06",
);
assert.deepEqual(
  temporalPb06Request.input.report_content.change_condition_commentary,
  temporalExpectedCommentary,
);
assert.equal(
  temporalPb06Request.input.report_content.relationship_summary,
  incomingGroundedSummary,
);
assert.deepEqual(
  temporalLiveRuntime.result.report.content.change_condition_commentary,
  temporalExpectedCommentary,
);
assert.equal(
  temporalLiveRuntime.result.report.content.relationship_summary,
  incomingGroundedSummary,
);
const temporalRawPb06Stage = [
  ...temporalLiveRuntime.repository.stageRuns.values(),
].find((stage) => stage.stageId === "PB-06");
assert.equal(temporalRawPb06Stage?.status, "completed");
assert.deepEqual(
  temporalRawPb06Stage?.completion?.outputJson,
  temporalLiveOutputs["PB-06"],
);

const reversedRelationshipSummary =
  "現在は相手からの返信を待っている状態です。";
const reversedOutputs = runtimeOutputs({
  facts: baselineFacts,
  inferredFields: baselineInferenceFields,
  expectedDecision: "reply_now",
});
reversedOutputs["PB-05"] = {
  ...reversedOutputs["PB-05"],
  relationship_summary: reversedRelationshipSummary,
};
const reversedRuntime = await runWithOutputs(reversedOutputs, 200);
const rawPb05Stage = [...reversedRuntime.repository.stageRuns.values()].find(
  (stage) => stage.stageId === "PB-05",
);
assert.ok(rawPb05Stage?.completion);
assert.equal(
  rawPb05Stage.completion.outputJson.relationship_summary,
  reversedRelationshipSummary,
);
const reversedPb06 = reversedRuntime.transport.requests.find(
  (request) => request.stageId === "PB-06",
);
assert.equal(
  reversedPb06.input.report_content.relationship_summary,
  incomingGroundedSummary,
);
assert.equal(
  reversedRuntime.result.report.content.relationship_summary,
  incomingGroundedSummary,
);
assert.equal(reversedRuntime.repository.reports.size, 1);

async function expectPb06FindingFailClosed(finding, index) {
  const outputs = runtimeOutputs({
    facts: baselineFacts,
    inferredFields: baselineInferenceFields,
    expectedDecision: "reply_now",
  });
  outputs["PB-06"] = {
    ...outputs["PB-06"],
    semantic_checks: [finding],
  };
  const repository = new FakeAssessmentRepository();
  const transport = new OfflineFakeTransport(outputs);
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => "2026-07-31T00:00:00.000Z",
    uuid: deterministicUuidFactory(),
  });
  await assert.rejects(
    application.submit(
      syntheticInput,
      `60000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    ),
    (error) => error?.safeCode === "M2_SEMANTIC_VALIDATION_FAILED",
  );
  assert.deepEqual(transport.calls, stageIds);
  assert.equal(repository.reports.size, 0);
  assert.equal(transport.actualProviderCalls, 0);
  assert.equal(repository.actualSupabaseCalls, 0);
}

await expectPb06FindingFailClosed(
  semanticFinding(
    "DECISION_ALLOWED",
    "critical",
    "decision_plan.selected_decision",
  ),
  1,
);
await expectPb06FindingFailClosed(
  semanticFinding(
    "MESSAGE_POLICY_CONSISTENCY",
    "major",
    "decision_plan.message_draft",
  ),
  2,
);
await expectPb06FindingFailClosed(
  semanticFinding(
    "FACT_FIDELITY",
    "major",
    "$.report_content.relationship_summary",
    ["F001"],
  ),
  3,
);
await expectPb06FindingFailClosed(
  semanticFinding(
    "SAFETY_REGRESSION",
    "critical",
    "report_content.action_rationales[0]",
    ["input:aggregate_safety_result"],
  ),
  4,
);

const fixtures = json(
  "evals/quality/m2-p4-i1/decision-facts-fixtures-v1.json",
);
assert.equal(fixtures.length, 40);
const categoryPasses = new Map(decisionNames.map((decision) => [decision, 0]));
for (const fixture of fixtures) {
  const factsV2 = {
    ...structuredClone(fixture.facts),
    schema_version: "m2-p4-decision-facts-v2",
    information_state: {
      assessment_mode: "best_effort",
      can_proceed_without_followup: true,
      used_context_inference: false,
      unresolved_fields: [],
    },
  };
  const contextual = buildContextualDecisionPolicyV3(factsV2);
  assert.equal(contextual.allowed_decisions[0], fixture.expected_decision);
  categoryPasses.set(
    fixture.expected_decision,
    categoryPasses.get(fixture.expected_decision) + 1,
  );
}
for (const decision of decisionNames) assert.equal(categoryPasses.get(decision), 10);

const policySource = source("lib/assessment/runtime/policy-v3.ts");
for (const marker of [
  "currentSituation",
  "current_situation",
  "case_id",
  "caseId",
  "reference_draft",
  "oracle",
  "evals/",
  "RegExp",
]) {
  assert.ok(!policySource.includes(marker), `policy-v3 contains ${marker}`);
}

const capabilityManifest = json(
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
);
assert.equal(capabilityManifest.task_id, "M2-P4-I1-C");
assert.equal(capabilityManifest.status, "human_chatgpt_accepted_complete");
assert.equal(capabilityManifest.accepted_implementation_commit, acceptedEndSha);
assert.deepEqual(capabilityManifest.accepted_slice_commits, acceptedSliceCommits);
assert.deepEqual(capabilityManifest.implementation_snapshot, {
  type: "historical_commit_range",
  base_commit_sha: i1cBaselineSha,
  end_commit_sha: acceptedEndSha,
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
    base_commit_sha: acceptedEndSha,
  }),
  false,
);
assert.equal(capabilityManifest.baseline.commit, i1cBaselineSha);
assert.deepEqual(capabilityManifest.implementation_paths, i1cImplementationPaths);
assert.deepEqual(capabilityManifest.accepted_stack_paths, acceptedStackPaths);
assert.deepEqual(capabilityManifest.task_execution_evidence, {
  openai_live_calls: 0,
  database_operations: 0,
  migrations: 0,
  holdout_use: 0,
  real_user_data: 0,
  live_rerun_executed: false,
});
assert.deepEqual(capabilityManifest.acceptance_live_evidence, {
  human_executed: true,
  synthetic_only: true,
  executed_at_jst: "2026-07-31T22:20:38+09:00",
  run_prefix: "ae3562b6",
  request_prefix: "dd1e4da8",
  stages_completed: 6,
  expected_stage_order: stageIds,
  eligibility: "ready",
  decision: "reply_now",
  message_draft_present: true,
  report_count: 1,
  safety_classification: "normal_allowed",
  safety_response_mode: "none",
  usage: "nonzero",
  processing_residue: 0,
  integrity_anomalies: 0,
  real_user_data: 0,
  holdout_use: 0,
  verification_openai_calls: 0,
  verification_db_writes: 0,
  verification_migrations: 0,
});
assert.deepEqual(capabilityManifest.r1_successor, {
  task_id: "M2-P4-I1-C-R1",
  title: "Contextual Integrity Hardening",
  status: "human_chatgpt_accepted_complete",
  accepted_implementation_commit: acceptedSliceCommits["M2-P4-I1-C-R1"],
  baseline: {
    commit: r1BaselineSha,
  },
  exact_mutation_paths: r1ExactPaths,
  catalog_mutation: {
    path: "lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json",
    stage_id: "PB-01",
    field: "schema_sha256",
    value: "40457d83f992973e745eb7b3488cf244166cbadd5b3b5a3e19affc16a4f6cce8",
  },
  task_execution_evidence: {
    openai_live_calls: 0,
    database_operations: 0,
    migrations: 0,
    holdout_use: 0,
    real_user_data: 0,
    live_rerun_executed: false,
  },
});
assert.deepEqual(capabilityManifest.r2_successor, {
  task_id: "M2-P4-I1-C-R2",
  title: "Safety Aggregation & Report Direction Grounding",
  status: "human_chatgpt_accepted_complete",
  accepted_implementation_commit: acceptedSliceCommits["M2-P4-I1-C-R2"],
  baseline: {
    commit: r2BaselineSha,
  },
  exact_mutation_paths: r2ExactPaths,
  task_execution_evidence: {
    openai_live_calls: 0,
    database_operations: 0,
    migrations: 0,
    holdout_use: 0,
    real_user_data: 0,
    live_rerun_executed: false,
  },
});
assert.deepEqual(capabilityManifest.r3_successor, {
  task_id: "M2-P4-I1-C-R3",
  title: "PB-01 Evidence Canonicalization",
  status: "human_chatgpt_accepted_complete",
  accepted_implementation_commit: acceptedSliceCommits["M2-P4-I1-C-R3"],
  baseline: {
    commit: r3BaselineSha,
  },
  exact_mutation_paths: r3ExactPaths,
  task_execution_evidence: {
    openai_live_calls: 0,
    database_operations: 0,
    migrations: 0,
    holdout_use: 0,
    real_user_data: 0,
    live_rerun_executed: false,
  },
});
assert.deepEqual(capabilityManifest.r4_successor, {
  task_id: "M2-P4-I1-C-R4",
  title: "Temporal Change-Condition Semantics",
  status: "human_chatgpt_accepted_complete",
  accepted_implementation_commit: acceptedSliceCommits["M2-P4-I1-C-R4"],
  baseline: {
    commit: r4BaselineSha,
  },
  exact_mutation_paths: r4ExactPaths,
  task_execution_evidence: {
    openai_live_calls: 0,
    database_operations: 0,
    migrations: 0,
    holdout_use: 0,
    real_user_data: 0,
    live_rerun_executed: false,
  },
});
assert.deepEqual(capabilityManifest.next_sequence, {
  next: "M2-P4-I2 Report Information Architecture and Intent Fulfillment",
  i2_status: "not_started",
  after_i2: "M2-P4-I3 PB-04 / PB-05 / PB-06 Product Quality Revision",
  i3_status: "not_started",
});

for (const item of [
  ...capabilityManifest.implementation_paths,
  ...capabilityManifest.accepted_stack_paths,
  ...capabilityManifest.r1_successor.exact_mutation_paths,
  ...capabilityManifest.r2_successor.exact_mutation_paths,
  ...capabilityManifest.r3_successor.exact_mutation_paths,
  ...capabilityManifest.r4_successor.exact_mutation_paths,
]) {
  assert.equal(typeof item, "string");
  assert.ok(item.length > 0 && !item.includes("*") && !item.endsWith("/"));
}

for (const documentPath of [
  "docs/phase2/TASK_M2_P4_I1_C_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
]) {
  const document = source(documentPath);
  for (const requiredProductDirection of [
    "30代前後の女性",
    "月の返事は恋の正解や未来を断定するサービスではない",
    "分かってもらえた",
    "優しいが曖昧ではない",
    "今夜の答え",
    "送った直後",
    "通常の情報不足を理由に相談回答を止めない",
    "M2-P4-I2 Report Information Architecture and Intent Fulfillment",
    "M2-P4-I3 PB-04 / PB-05 / PB-06 Product Quality Revision",
  ]) {
    assert.ok(document.includes(requiredProductDirection));
  }
  assert.ok(document.includes("not started") || document.includes("not_started"));
}

const historicalAcceptanceSyncPaths = gitText([
  "diff",
  "--name-only",
  acceptedEndSha,
  i2BaselineSha,
  "--",
])
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean);
assert.deepEqual(
  sorted(historicalAcceptanceSyncPaths),
  sorted(acceptanceSyncPaths),
);
const currentI2Paths = currentChangedPaths(i2BaselineSha);
assert.equal(isExactPathSet(currentI2Paths, exactI2Paths), true);

console.log("M2_P4_I1_C_CONTEXTUAL_BEST_EFFORT: PASS");
console.log("historical_snapshot: PASS");
console.log("accepted_stack: 27/27");
console.log("i2_renderer_exceptions: 4/4");
console.log("unauthorized_app_components_regressions: 4/4");
console.log("normal_information_gate_terminal: 0");
console.log("needs_more_information_runtime_path: 0");
console.log("contextual_inference_supported: PASS");
console.log("contextual_reference_integrity: PASS");
console.log("contextual_state_consistency: PASS");
console.log("inferred_unresolved_exclusion: PASS");
console.log("decision_facts_non_null: PASS");
console.log("sparse_normal_cases_ready: 11/11");
console.log("safety_blocked_cases: 1/1");
console.log(
  `integrity_invalid_runtime_cases: ${runtimeIntegrityInvalidIntakes.length}/${runtimeIntegrityInvalidIntakes.length}`,
);
console.log("duplicate_unresolved_integrity_case: 1/1");
console.log("practical_schema_states: 3/3");
console.log("invalid_practical_combinations: 3/3");
console.log("boundary_schema_states: 3/3");
console.log("invalid_boundary_combinations: 3/3");
console.log("unresolved_normal_flow_reports: 2/2");
console.log("provider_schema_integrity: PASS");
console.log("canonical_schema_integrity: PASS");
console.log("baseline_fake_decision: reply_now");
console.log("baseline_fake_report: 1");
console.log("normal_safety_response_mode: none");
console.log("nonnormal_response_mode_cases: 3/3");
console.log("nonnormal_normal_code_filter: PASS");
console.log("report_grounding_states: 4/4");
console.log("reversed_pb05_summary_grounded: PASS");
console.log("pb06_input_grounded: PASS");
console.log("final_report_grounded: PASS");
console.log("change_condition_grounding_directions: 4/4");
console.log("temporal_false_positives_nonblocking: 4/4");
console.log("temporal_blocking_findings: 0");
console.log("temporal_final_report: 1");
console.log("raw_pb05_change_commentary_preserved: PASS");
console.log("pb06_change_commentary_grounded: PASS");
console.log("final_change_commentary_grounded: PASS");
console.log("pb06_fail_closed_major_critical: 4/4");
console.log("mismatched_grounded_commentary_blocking: PASS");
console.log("required_non_temporal_blocking_paths: 11/11");
console.log("minor_findings_nonblocking: PASS");
console.log("live_failure_equivalent_pb06_safety_regressions: 0");
console.log("application_owned_intake_fields: PASS");
console.log("inference_source_canonicalization: PASS");
console.log("live_failure_equivalent_grounding: PASS");
console.log("raw_pb01_evidence_preserved: PASS");
console.log("downstream_grounded_intake: PASS");
console.log(
  `invalid_grounded_evidence_rejections: ${invalidGroundedEvidenceIntakes.length}/${invalidGroundedEvidenceIntakes.length}`,
);
console.log("full_fake_grounded_decision: reply_now");
console.log("full_fake_grounded_report: 1");
console.log("policy_parity: 40/40");
console.log("openai_calls: 0");
console.log("db_operations: 0");
console.log("holdout_use: 0");
console.log("protected_diff: 0");
console.log("r1_historical_exact_scope: 12/12");
console.log("r2_historical_exact_scope: 10/10");
console.log("r3_historical_exact_scope: 9/9");
console.log("r4_historical_exact_scope: 10/10");
console.log("accepted_stack_scope: 27/27");
console.log("acceptance_sync_exact_scope: 8/8");
console.log("quality_i2_i3_started: 0");
