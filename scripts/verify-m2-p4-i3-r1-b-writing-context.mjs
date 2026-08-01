import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselineSha = "2381312ced5fc726dfa245632c25da6bb68a376f";
const firstImplementationSha =
  "0ccf59114fe4079e0a5513fef3faf1b9fade11e7";
const acceptedImplementationSha =
  "4a1237ac647bff79229d7181d978d5613c2c3b87";
const implementationCommits = [
  firstImplementationSha,
  acceptedImplementationSha,
];
const reviewCorrectionBase = firstImplementationSha;
const stageIds = ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"];
const exactPaths = [
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
const reviewCorrectionPaths = [
  "lib/assessment/runtime/writing-context-integrity-v1.ts",
  "evals/runtime/m2-p4-i3-r1-b-grounding-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-b-runtime-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-b-capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-b-writing-context.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_B_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const r1aAcceptanceSyncPaths = [
  "evals/runtime/m2-p4-i3-r1-a-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_A_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const r1bAcceptanceSyncPaths = [
  "evals/runtime/m2-p4-i3-r1-b-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_B_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-b-writing-context.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const immutableImplementationPaths = exactPaths.filter(
  (item) => !r1bAcceptanceSyncPaths.includes(item),
);

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

function source(relativePath) {
  return readFileSync(absolute(relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(source(relativePath));
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function shaText(value) {
  return createHash("sha256")
    .update(Buffer.from(value.replace(/\r\n/gu, "\n"), "utf8"))
    .digest("hex");
}

function shaJson(value) {
  return createHash("sha256")
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex");
}

function git(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
}

function normalizedPaths(output) {
  return output
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean);
}

function historicalPaths(start, end) {
  return sorted(normalizedPaths(git(["diff", "--name-only", start, end, "--"])));
}

function currentTaskPaths(base) {
  const result = new Set(
    normalizedPaths(git(["diff", "--name-only", base, "--"])),
  );
  for (const line of git([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]).split(/\r?\n/gu)) {
    if (!line) continue;
    let item = line.slice(3).trim();
    if (item.includes(" -> ")) item = item.split(" -> ").at(-1);
    result.add(item.replaceAll("\\", "/"));
  }
  return sorted(result);
}

function assertLiteralSet(actual, expected) {
  assert.equal(expected.length, new Set(expected).size);
  assert.equal(
    expected.some((item) => item.includes("*") || item.endsWith("/")),
    false,
  );
  assert.deepEqual(sorted(actual), sorted(expected));
}

for (const sha of [baselineSha, firstImplementationSha, acceptedImplementationSha]) {
  assert.doesNotThrow(() => git(["cat-file", "-e", `${sha}^{commit}`]));
  assert.doesNotThrow(() => git(["merge-base", "--is-ancestor", sha, "HEAD"]));
}
assert.equal(exactPaths.length, 22);
assertLiteralSet(currentTaskPaths(baselineSha), exactPaths);
assert.equal(reviewCorrectionPaths.length, 9);
assert.equal(
  git(["rev-parse", `${firstImplementationSha}^`]).trim(),
  baselineSha,
);
assert.equal(
  git(["rev-parse", `${acceptedImplementationSha}^`]).trim(),
  firstImplementationSha,
);
assert.deepEqual(
  normalizedPaths(
    git(["rev-list", "--reverse", `${baselineSha}..${acceptedImplementationSha}`]),
  ),
  implementationCommits,
);
assertLiteralSet(
  historicalPaths(baselineSha, acceptedImplementationSha),
  exactPaths,
);
assertLiteralSet(
  historicalPaths(firstImplementationSha, acceptedImplementationSha),
  reviewCorrectionPaths,
);
assert.equal(r1bAcceptanceSyncPaths.length, 8);
assertLiteralSet(
  currentTaskPaths(acceptedImplementationSha),
  r1bAcceptanceSyncPaths,
);
assert.equal(immutableImplementationPaths.length, 14);
for (const immutablePath of immutableImplementationPaths) {
  assert.equal(
    shaText(source(immutablePath)),
    shaText(git(["show", `${acceptedImplementationSha}:${immutablePath}`])),
    `${immutablePath} changed after accepted implementation`,
  );
}

const protectedPaths = [
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/application.ts",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "lib/assessment/runtime/contracts/structured-intake-v4.schema.json",
  "lib/assessment/runtime/contracts/writing-context-v1.ts",
  "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
  "lib/assessment/runtime/contracts/report-content-v2.schema.json",
  "lib/assessment/runtime/contracts/pb-04-decision-plan-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-05-report-writer-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-06-semantic-validator-v2.developer.md",
  "lib/assessment/runtime/policy.ts",
  "lib/assessment/runtime/policy-v2.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "ai/schemas/validation-result.schema.json",
  "package.json",
  "package-lock.json",
];
for (const protectedPath of protectedPaths) {
  assert.equal(
    git(["diff", "--name-only", baselineSha, "--", protectedPath]).trim(),
    "",
    `protected diff: ${protectedPath}`,
  );
}
assert.equal(
  currentTaskPaths(baselineSha).some((item) =>
    /^(app|components|supabase|evals\/(development|holdout))\//u.test(item),
  ),
  false,
);

const snapshotChecks = [
  {
    base: "c27120eea067f91c5e9ef4447e382f55a329e158",
    end: "b523349ec33c36a90c645d4a1b7a6d37832af151",
    expected: json("evals/runtime/m2-p4-i1-c-capabilities-v1.json").accepted_stack_paths,
    count: 27,
  },
  {
    base: "20d4178e3a63026128f3a25d052196c7161e7e27",
    end: "410714875903ae61b5bcdc6cce90030f5679b3b3",
    expected: json("evals/runtime/m2-p4-i2-capabilities-v1.json").exact_mutation_paths,
    count: 16,
  },
  {
    base: "61e33a10e195fad17e253a6b9719217e1992f273",
    end: "c85d6d122ad71569532a55887b9a3b6d93f8a288",
    expected: json("evals/runtime/m2-p4-i3-capabilities-v1.json").exact_mutation_paths,
    count: 19,
  },
  {
    base: "ec7cd53884ab4056c78d2596c609baef5701274a",
    end: "3c64e5e2179b4c03979119068716326337a002c6",
    expected: json(
      "evals/runtime/m2-p4-i3-r1-final-planning-capabilities-v1.json",
    ).exact_mutation_paths,
    count: 12,
  },
  {
    base: "e5cfd903740267db6d070964a9ec72a7d823f310",
    end: "8030c0b7778ccea3d7d90cbffcf21ac9c1052bcd",
    expected: json("evals/runtime/m2-p4-i3-r1-a-capabilities-v1.json")
      .exact_mutation_paths,
    count: 18,
  },
  {
    base: "8030c0b7778ccea3d7d90cbffcf21ac9c1052bcd",
    end: baselineSha,
    expected: r1aAcceptanceSyncPaths,
    count: 8,
  },
];
for (const check of snapshotChecks) {
  assert.equal(check.expected.length, check.count);
  assertLiteralSet(historicalPaths(check.base, check.end), check.expected);
}

const capabilities = json("evals/runtime/m2-p4-i3-r1-b-capabilities-v1.json");
assert.equal(capabilities.task_id, "M2-P4-I3-R1-B");
assert.equal(capabilities.status, "human_chatgpt_accepted_complete");
assert.equal(
  capabilities.accepted_implementation_commit,
  acceptedImplementationSha,
);
assert.deepEqual(capabilities.implementation_commits, implementationCommits);
assert.deepEqual(capabilities.implementation_snapshot, {
  type: "historical_commit_range",
  base_commit_sha: baselineSha,
  end_commit_sha: acceptedImplementationSha,
  exact_paths: 22,
  include_working_tree: false,
  immutable_snapshot: true,
});
assert.equal(capabilities.review_correction_required, false);
assert.equal(capabilities.review_correction_status, "resolved");
assert.deepEqual(capabilities.review_correction, {
  base_commit: firstImplementationSha,
  correction_commit: acceptedImplementationSha,
  exact_paths: 9,
  provenance_ownership_matrix: "7/7",
  valid_grounding_cases: 20,
  invalid_grounding_cases: 20,
  downstream_input_parity: "15/15",
  scope_expansion: false,
  force_push: false,
});
assert.equal(capabilities.provenance_ownership_matrix_implemented, true);
assert.equal(capabilities.valid_grounding_cases, 20);
assert.equal(capabilities.invalid_grounding_cases, 20);
assert.equal(capabilities.full_downstream_input_parity, true);
assert.equal(capabilities.exact_mutation_path_count, 22);
assertLiteralSet(capabilities.exact_mutation_paths, exactPaths);
for (const field of [
  "active_runtime_changed",
  "service_mutations",
  "downstream_prompt_mutations",
  "ui_mutations",
  "policy_mutations",
  "openai_calls",
  "db_operations",
  "migrations",
  "holdout_use",
  "real_user_data",
]) {
  assert.ok(capabilities[field] === false || capabilities[field] === 0);
}
assert.equal(
  capabilities.next_candidate,
  "M2-P4-I3-R1-C1 PB-01 v4 Bounded Provider Diagnostic",
);
assert.equal(capabilities.next_candidate_authorized, false);
assert.equal(
  capabilities.runtime_activation_candidate,
  "M2-P4-I3-R1-C2 PB-01 v4 Runtime Activation",
);
assert.equal(capabilities.runtime_activation_authorized, false);

const runtimeContract = json("evals/runtime/m2-p4-i3-r1-b-runtime-contract-v1.json");
assert.equal(runtimeContract.baseline, baselineSha);
assert.equal(runtimeContract.review_correction_required, true);
assert.equal(runtimeContract.review_correction_base, reviewCorrectionBase);
assert.equal(runtimeContract.provenance_ownership_matrix_implemented, true);
assert.equal(runtimeContract.invalid_grounding_cases, 20);
assert.equal(runtimeContract.full_downstream_input_parity, true);
assert.equal(runtimeContract.accepted_r1_a_commit, "8030c0b7778ccea3d7d90cbffcf21ac9c1052bcd");
assert.equal(runtimeContract.r1_a_acceptance_commit, baselineSha);
assert.equal(runtimeContract.candidate_catalog, "runtime-stage-catalog-v5.0.0");
assert.equal(runtimeContract.candidate_prompt_bundle, "prompt-bundle-runtime-v5.0.0");
assert.equal(runtimeContract.transitional_schema_set, "pipeline-schema-runtime-v3.1.0");
assert.equal(runtimeContract.full_successor_schema_set, "pipeline-schema-runtime-v4.0.0");
assert.equal(runtimeContract.full_successor_remains_inactive, true);
assert.equal(runtimeContract.active_runtime_unchanged, true);
for (const [assetPath, expectedHash] of Object.entries(runtimeContract.hashes)) {
  assert.equal(shaText(source(assetPath)), expectedHash, assetPath);
}

const catalogV5 = json(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v5.json",
);
const catalogV4 = json(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
);
assert.equal(catalogV5.schema_version, "m2-p4-runtime-stage-catalog-v1");
assert.equal(catalogV5.catalog_version, "runtime-stage-catalog-v5.0.0");
assert.equal(catalogV5.prompt_bundle_version, "prompt-bundle-runtime-v5.0.0");
assert.equal(catalogV5.schema_set_version, "pipeline-schema-runtime-v3.1.0");
assert.equal(catalogV5.baseline, baselineSha);
assert.equal(catalogV5.stages.length, 6);
assert.deepEqual(catalogV5.stages.map((stage) => stage.stage_id), stageIds);
assert.deepEqual(catalogV5.stages.slice(1), catalogV4.stages.slice(1));
assert.deepEqual(catalogV5.stages[0], {
  stage_id: "PB-01",
  sequence_number: 1,
  source: "m2-p4-writing-context-successor",
  prompt_version: "v4.0.0",
  prompt_path: "lib/assessment/runtime/contracts/pb-01-structure-v4.developer.md",
  prompt_sha256: runtimeContract.hashes[
    "lib/assessment/runtime/contracts/pb-01-structure-v4.developer.md"
  ],
  schema_version: "pipeline-schema-v4.0.0",
  schema_name: "pb_01_structure_v4",
  schema_path: "lib/assessment/runtime/contracts/structured-intake-v4.schema.json",
  schema_pointer: null,
  schema_sha256: runtimeContract.hashes[
    "lib/assessment/runtime/contracts/structured-intake-v4.schema.json"
  ],
});
for (const stage of catalogV5.stages) {
  assert.equal(shaText(source(stage.prompt_path)), stage.prompt_sha256);
  assert.equal(shaText(source(stage.schema_path)), stage.schema_sha256);
}

const prompt = source(
  "lib/assessment/runtime/contracts/pb-01-structure-v4.developer.md",
);
for (const required of [
  "writing_context",
  "input:optional_message",
  "consultation narrative",
  "Broad relationship input alone",
  "effect class never selects a Decision",
  "Never copy raw message bodies",
  "confidence, probability, or certainty",
  "case IDs, fixtures, evaluation oracles",
  "MSG001",
  "UC001",
]) {
  assert.equal(prompt.includes(required), true, `PB-01 v4 prompt missing ${required}`);
}

const [
  { AssessmentApplication },
  { FakeAssessmentRepository, wait003StageOutputs },
  {
    loadM2P4ProductQualityRuntimeStageCatalog,
    loadM2P4WritingContextRuntimeStageCatalog,
  },
  { assertOpenAIStructuredOutputSchema, toOpenAiStructuredOutputSchema },
  { groundStructuredIntakeV3 },
  { groundStructuredIntakeV4 },
  { validateWritingContextIntegrityV1 },
  { buildStructuredIntakeLegacyViewV3 },
  { validateContextualIntakeIntegrityV3 },
] = await Promise.all([
  import("../lib/assessment/runtime/application.ts"),
  import("../lib/assessment/runtime/fakes.ts"),
  import("../lib/assessment/runtime/schema-catalog.ts"),
  import("../lib/assessment/runtime/openai-schema.ts"),
  import("../lib/assessment/runtime/structured-intake-grounding-v3.ts"),
  import("../lib/assessment/runtime/structured-intake-grounding-v4.ts"),
  import("../lib/assessment/runtime/writing-context-integrity-v1.ts"),
  import("../lib/assessment/runtime/structured-intake-legacy-view-v3.ts"),
  import("../lib/assessment/runtime/contextual-integrity-v3.ts"),
]);

const runtimeV5 = await loadM2P4WritingContextRuntimeStageCatalog();
const runtimeV4 = await loadM2P4ProductQualityRuntimeStageCatalog();
assert.equal(runtimeV5.promptBundleVersion, "prompt-bundle-runtime-v5.0.0");
assert.equal(runtimeV5.schemaSetVersion, "pipeline-schema-runtime-v3.1.0");
assert.equal(runtimeV5.definitions.length, 6);
assert.deepEqual(
  runtimeV5.definitions.slice(1).map((definition) => definition.outputSchema),
  runtimeV4.definitions.slice(1).map((definition) => definition.outputSchema),
);
for (const definition of runtimeV5.definitions) {
  assert.doesNotThrow(() =>
    assertOpenAIStructuredOutputSchema(
      toOpenAiStructuredOutputSchema(definition.outputSchema),
    ),
  );
}

const structuredIntakeV4Schema = json(
  "lib/assessment/runtime/contracts/structured-intake-v4.schema.json",
);
const structuredIntakeV3Schema = json(
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
);
const ajv = new Ajv2020({ strict: true, allErrors: true });
const validateV4 = ajv.compile(structuredIntakeV4Schema);
const validateV3 = ajv.compile(structuredIntakeV3Schema);

function setAt(target, pointer, value) {
  const segments = pointer
    .split("/")
    .slice(1)
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
  let selected = target;
  for (const segment of segments.slice(0, -1)) {
    selected = selected[/^\d+$/u.test(segment) ? Number(segment) : segment];
  }
  const final = segments.at(-1);
  selected[/^\d+$/u.test(final) ? Number(final) : final] = structuredClone(value);
}

function materialize(bundle, descriptor) {
  const result = structuredClone(bundle.templates[descriptor.template_id]);
  for (const mutation of descriptor.mutations) {
    assert.equal(mutation.op, "set");
    setAt(result, mutation.path, mutation.value);
  }
  return result;
}

const groundingCases = json(
  "evals/runtime/m2-p4-i3-r1-b-grounding-cases-v1.json",
);
assert.equal(groundingCases.synthetic_only, true);
assert.equal(groundingCases.real_user_data, false);
assert.equal(groundingCases.holdout_material, false);
assert.equal(groundingCases.template_resolution.runtime_authority, false);
assert.equal(groundingCases.template_resolution.case_id_lookup_in_runtime, false);
assert.equal(groundingCases.valid_cases.length, 20);
assert.equal(groundingCases.invalid_cases.length, 20);
assert.equal(
  new Set(groundingCases.valid_cases.map((item) => item.case_id)).size,
  20,
);
assert.equal(
  new Set(groundingCases.invalid_cases.map((item) => item.case_id)).size,
  20,
);
const reviewCorrectionInvalidCases = groundingCases.invalid_cases.filter(
  (item) => ["GROUND-I-017", "GROUND-I-018", "GROUND-I-019", "GROUND-I-020"].includes(
    item.case_id,
  ),
);
assert.equal(reviewCorrectionInvalidCases.length, 4);
for (const item of reviewCorrectionInvalidCases) {
  assert.equal(item.expected_failure_code, "M2_WRITING_CONTEXT_INVALID");
  assert.equal(item.owner, "application_integrity");
  assert.equal(item.runtime_case_lookup_authority, false);
}

let validGroundingCases = 0;
for (const item of groundingCases.valid_cases) {
  const raw = materialize(groundingCases, item.raw_structured_intake_v4);
  const rawSnapshot = structuredClone(raw);
  assert.equal(validateV4(raw), true, JSON.stringify(validateV4.errors));
  const grounded = groundStructuredIntakeV4(item.synthetic_assessment_input, raw);
  assert.deepEqual(raw, rawSnapshot);
  assert.equal(validateV4(grounded), true, JSON.stringify(validateV4.errors));
  assert.doesNotThrow(() =>
    validateWritingContextIntegrityV1(item.synthetic_assessment_input, grounded),
  );
  assert.equal(shaJson(grounded), item.expected_grounded_result.sha256_json);

  const rawV3 = structuredClone(raw);
  delete rawV3.writing_context;
  rawV3.schema_version = "pipeline-schema-v3.0.0";
  const groundedV3 = groundStructuredIntakeV3(
    item.synthetic_assessment_input,
    rawV3,
  );
  assert.deepEqual(grounded.decision_facts, groundedV3.decision_facts);

  const legacy = buildStructuredIntakeLegacyViewV3(grounded);
  assert.equal(validateV3(legacy), true, JSON.stringify(validateV3.errors));
  assert.doesNotThrow(() => validateContextualIntakeIntegrityV3(legacy));
  assert.equal("writing_context" in legacy, false);
  assert.equal(legacy.schema_version, "pipeline-schema-v3.0.0");
  const expectedLegacy = structuredClone(grounded);
  delete expectedLegacy.writing_context;
  expectedLegacy.schema_version = "pipeline-schema-v3.0.0";
  assert.deepEqual(legacy, expectedLegacy);
  assert.equal(shaJson(legacy), item.expected_legacy_view_result.sha256_json);
  validGroundingCases += 1;
}

let invalidGroundingCases = 0;
for (const item of groundingCases.invalid_cases) {
  const raw = materialize(groundingCases, item.raw_structured_intake_v4);
  assert.throws(
    () => validateWritingContextIntegrityV1(item.synthetic_assessment_input, raw),
    (error) => error?.safeCode === item.expected_failure_code,
  );
  invalidGroundingCases += 1;
}

const provenanceInput = groundingCases.valid_cases.find(
  (item) => item.case_id === "GROUND-V-002",
).synthetic_assessment_input;
const provenanceInvalidMutations = [
  {
    path: "/writing_context/message_ownership/0/source_refs",
    value: ["input:requested_topics"],
  },
  {
    path: "/writing_context/communication_pattern/source_refs",
    value: ["input:optional_message"],
  },
  {
    path: "/writing_context/repeat_consultation_state/source_refs",
    value: ["input:optional_message"],
  },
  {
    path: "/writing_context/channel_and_timing/source_refs",
    value: ["input:requested_topics"],
  },
  {
    path: "/writing_context/language_and_expression/source_refs",
    value: ["input:requested_topics"],
  },
  {
    path: "/writing_context/user_goal_detail/source_refs",
    value: ["input:requested_topics"],
  },
];
let provenanceOwnershipMatrixChecks = 0;
for (const mutation of provenanceInvalidMutations) {
  const raw = materialize(groundingCases, {
    template_id: "VALID-CANDIDATE",
    mutations: [{ op: "set", ...mutation }],
  });
  assert.throws(
    () => validateWritingContextIntegrityV1(provenanceInput, raw),
    (error) => error?.safeCode === "M2_WRITING_CONTEXT_INVALID",
  );
  provenanceOwnershipMatrixChecks += 1;
}

const matchingAppChannelInput = {
  ...groundingCases.valid_cases.find((item) => item.case_id === "GROUND-V-007")
    .synthetic_assessment_input,
  relationship: "matching_app",
};
const matchingAppChannel = materialize(groundingCases, {
  template_id: "VALID-NO-CANDIDATE",
  mutations: [
    {
      op: "set",
      path: "/writing_context/channel_and_timing",
      value: {
        channel: "matching_app",
        relative_timing: "same_day",
        evidence_state: "explicit",
        source_refs: ["input:relationship"],
      },
    },
    {
      op: "set",
      path: "/writing_context/source_refs",
      value: [
        "input:current_situation",
        "input:relationship",
        "input:requested_topics",
      ],
    },
  ],
});
assert.doesNotThrow(() =>
  validateWritingContextIntegrityV1(matchingAppChannelInput, matchingAppChannel),
);
provenanceOwnershipMatrixChecks += 1;
assert.equal(provenanceOwnershipMatrixChecks, 7);

const productionGroundingSources = [
  source("lib/assessment/runtime/structured-intake-grounding-v4.ts"),
  source("lib/assessment/runtime/writing-context-integrity-v1.ts"),
  source("lib/assessment/runtime/structured-intake-legacy-view-v3.ts"),
  source("lib/assessment/runtime/pipeline.ts"),
];
for (const productionSource of productionGroundingSources) {
  assert.equal(/case_id|GROUND-V-|GROUND-I-/iu.test(productionSource), false);
}
for (const productionSource of [
  productionGroundingSources[0],
  productionGroundingSources[2],
  productionGroundingSources[3],
]) {
  assert.equal(/fixture|oracle/iu.test(productionSource), false);
}

function waitFacts(proposedMessagePresent) {
  return {
    schema_version: "m2-p4-decision-facts-v2",
    relationship_stage: "ambiguous",
    selected_requests: ["decide_send_or_wait", "draft_message"],
    latest_direct_message: {
      sender: "user",
      kind: "other",
      response_expectation: "optional",
      user_reply_state: "replied",
      sns_signal_only: false,
    },
    contact_state: {
      unanswered_user_message_count: 1,
      elapsed_since_latest_user_message_minutes: 120,
      usual_cadence_relation: "within_usual",
      proposed_message_present: proposedMessagePresent,
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

function planFor(decision, basePlan) {
  const plan = structuredClone(basePlan);
  plan.selected_decision = decision;
  plan.message_draft =
    decision === "reply_now"
      ? {
          text: "Synthetic bounded reply.",
          policy: "required_now",
          use_timing: "now",
        }
      : null;
  return plan;
}

const replyCase = groundingCases.valid_cases.find(
  (item) => item.case_id === "GROUND-V-002",
);
assert.ok(replyCase);
const replyRaw = materialize(
  groundingCases,
  replyCase.raw_structured_intake_v4,
);
const waitRaw = structuredClone(groundingCases.templates["VALID-NO-CANDIDATE"]);
waitRaw.decision_facts = waitFacts(false);
const pauseRaw = structuredClone(waitRaw);
pauseRaw.decision_facts.boundary_state = {
  kind: "no_contact",
  status: "explicit",
  repeated_unanswered_contact: false,
};
pauseRaw.boundaries = [
  {
    boundary_id: "B001",
    kind: "no_contact",
    status: "explicit",
    statement: "Synthetic explicit no-contact boundary.",
    source_refs: ["input:current_situation"],
  },
];
pauseRaw.writing_context.relationship_dimensions.communication_context.effect_class =
  "safety_material";

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

function deterministicUuidFactory() {
  let sequence = 0;
  return () => {
    sequence += 1;
    return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
  };
}

function outputsFor(pb01, decision) {
  const outputs = wait003StageOutputs();
  outputs["PB-01"] = structuredClone(pb01);
  outputs["PB-03"] = {
    schema_version: "pipeline-schema-v3.0.0",
    acknowledged_eligibility: "ready",
  };
  outputs["PB-04"] = planFor(decision, outputs["PB-04"]);
  return outputs;
}

async function execute(input, outputs, catalog, idempotencySuffix) {
  const repository = new FakeAssessmentRepository();
  const transport = new OfflineFakeTransport(outputs);
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => "2026-08-01T00:00:00.000Z",
    uuid: deterministicUuidFactory(),
  });
  const result = await application.submit(
    input,
    `90000000-0000-4000-8000-${String(idempotencySuffix).padStart(12, "0")}`,
  );
  return { result, repository, transport };
}

const pipelineCases = [
  {
    name: "reply_now with candidate",
    input: replyCase.synthetic_assessment_input,
    raw: replyRaw,
    decision: "reply_now",
  },
  {
    name: "wait_and_reassess without current draft",
    input: {
      currentSituation: "Synthetic sent message remains unanswered within usual cadence.",
      optionalMessage: null,
      relationship: "ambiguous",
      requestedTopics: ["decide_send_or_wait", "draft_message"],
      privacyAcknowledged: true,
    },
    raw: waitRaw,
    decision: "wait_and_reassess",
  },
  {
    name: "pause_additional_contact with explicit boundary",
    input: {
      currentSituation: "Synthetic consultation explicitly records a no-contact boundary.",
      optionalMessage: null,
      relationship: "ambiguous",
      requestedTopics: ["decide_send_or_wait", "draft_message"],
      privacyAcknowledged: true,
    },
    raw: pauseRaw,
    decision: "pause_additional_contact",
  },
];

let fakePipelineParity = 0;
let fullDownstreamInputParity = 0;
let downstreamWritingContextLeakage = 0;
for (const [index, item] of pipelineCases.entries()) {
  const candidateGrounded = groundStructuredIntakeV4(item.input, item.raw);
  validateWritingContextIntegrityV1(item.input, candidateGrounded);
  const baselinePb01 = buildStructuredIntakeLegacyViewV3(candidateGrounded);
  const candidate = await execute(
    item.input,
    outputsFor(item.raw, item.decision),
    runtimeV5,
    index + 1,
  );
  const baseline = await execute(
    item.input,
    outputsFor(baselinePb01, item.decision),
    runtimeV4,
    index + 1,
  );
  assert.equal(candidate.result.decision, item.decision, item.name);
  assert.equal(baseline.result.decision, item.decision, item.name);
  assert.equal(candidate.result.eligibility, baseline.result.eligibility);
  assert.equal(candidate.result.decision, baseline.result.decision);
  assert.deepEqual(candidate.result.report, baseline.result.report);
  assert.deepEqual(candidate.result.decisionCard, baseline.result.decisionCard);
  assert.equal(candidate.transport.actualProviderCalls, 0);
  assert.equal(candidate.transport.apiSpendUsd, 0);
  assert.equal(candidate.repository.actualSupabaseCalls, 0);
  assert.equal(candidate.repository.reports.size, 1);
  assert.deepEqual(candidate.transport.calls, stageIds);
  const pb01Request = candidate.transport.requests[0];
  assert.equal(pb01Request.schemaName, "pb_01_structure_v4");
  assert.equal(pb01Request.schemaVersion, "pipeline-schema-v4.0.0");
  assert.equal(pb01Request.promptVersion, "v4.0.0");
  for (let stageIndex = 1; stageIndex < stageIds.length; stageIndex += 1) {
    const candidateRequest = candidate.transport.requests[stageIndex];
    const baselineRequest = baseline.transport.requests[stageIndex];
    assert.equal(candidateRequest.stageId, stageIds[stageIndex]);
    assert.equal(baselineRequest.stageId, stageIds[stageIndex]);
    const candidateIntake = candidateRequest.input.structured_intake;
    const baselineIntake = baselineRequest.input.structured_intake;
    assert.ok(candidateIntake && typeof candidateIntake === "object");
    assert.ok(baselineIntake && typeof baselineIntake === "object");
    assert.deepEqual(candidateIntake, baselineIntake);
    assert.equal(candidateIntake.schema_version, "pipeline-schema-v3.0.0");
    assert.equal(baselineIntake.schema_version, "pipeline-schema-v3.0.0");
    assert.deepEqual(candidateIntake.decision_facts, baselineIntake.decision_facts);
    if ("writing_context" in candidateIntake) downstreamWritingContextLeakage += 1;
    if ("writing_context" in baselineIntake) downstreamWritingContextLeakage += 1;
    assert.deepEqual(candidateRequest.input, baselineRequest.input);
    fullDownstreamInputParity += 1;
  }
  const candidatePb04Input = candidate.transport.requests[3].input;
  const baselinePb04Input = baseline.transport.requests[3].input;
  assert.deepEqual(
    candidatePb04Input.aggregate_safety_result,
    baselinePb04Input.aggregate_safety_result,
  );
  assert.deepEqual(
    candidatePb04Input.eligibility_result,
    baselinePb04Input.eligibility_result,
  );
  assert.deepEqual(
    candidatePb04Input.decision_policy_result,
    baselinePb04Input.decision_policy_result,
  );
  fakePipelineParity += 1;
}
assert.equal(fakePipelineParity, 3);
assert.equal(fullDownstreamInputParity, 15);
assert.equal(downstreamWritingContextLeakage, 0);

const serviceSource = source("lib/assessment/runtime/service.ts");
assert.equal(serviceSource.includes("loadM2P4WritingContextRuntimeStageCatalog"), false);
assert.equal(serviceSource.includes("loadM2P4ProductQualityRuntimeStageCatalog"), true);
const pipelineSource = source("lib/assessment/runtime/pipeline.ts");
assert.equal(pipelineSource.includes('"pipeline-schema-runtime-v3.1.0"'), true);
assert.equal(pipelineSource.includes('"prompt-bundle-runtime-v5.0.0"'), true);
assert.equal(pipelineSource.includes("buildStructuredIntakeLegacyViewV3"), true);
assert.equal(pipelineSource.includes("validateWritingContextIntegrityV1"), true);

for (const verifierPath of [
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "scripts/verify-m2-p4-i3-product-quality.mjs",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
]) {
  const verifier = source(verifierPath);
  assert.equal(verifier.includes("exactR1BPaths"), true, verifierPath);
  assert.equal(verifier.includes("runtime-stage-catalog-v5.json"), true, verifierPath);
  assert.equal(verifier.includes("lib/assessment/runtime/service.ts"), true, verifierPath);
}

console.log("M2_P4_I3_R1_B_WRITING_CONTEXT: PASS");
console.log(`accepted_implementation_commit: ${acceptedImplementationSha}`);
console.log("implementation_commits: 2/2");
console.log("implementation_snapshot: 22/22");
console.log("acceptance_sync_scope: 8/8");
console.log("review_correction_status: resolved");
console.log("review_correction_scope: 9/9");
console.log("cumulative_r1_b_scope: 22/22");
console.log(
  `provenance_ownership_matrix: PASS (${provenanceOwnershipMatrixChecks}/7)`,
);
console.log(`valid_grounding_cases: ${validGroundingCases}/20`);
console.log(`invalid_grounding_cases: ${invalidGroundingCases}/20`);
console.log(`fake_pipeline_parity: ${fakePipelineParity}/3`);
console.log(
  `full_downstream_input_parity: ${fullDownstreamInputParity}/15 (5 stages x 3 cases)`,
);
console.log(`downstream_writing_context_leakage: ${downstreamWritingContextLeakage}`);
console.log("decision_facts_parity: PASS");
console.log("downstream_safety_input_parity: PASS");
console.log("protected_diff: 0");
console.log("active_runtime_changed: false");
console.log("openai_calls: 0");
console.log("db_operations: 0");
console.log("holdout_use: 0");
