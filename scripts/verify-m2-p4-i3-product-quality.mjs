import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const r1C1R1BaselineSha = "bdc98af2c7c59a1d7ececa2077906c8fbb839ac9";
const exactR1C1R1Paths = [
  "lib/assessment/runtime/contracts/writing-signals-v1.ts",
  "lib/assessment/runtime/contracts/structured-intake-v5.schema.json",
  "lib/assessment/runtime/contracts/pb-01-structure-v5.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v6.json",
  "lib/assessment/runtime/writing-signals-grounding-v1.ts",
  "lib/assessment/runtime/decision-facts-evidence-guard-v4.ts",
  "lib/assessment/runtime/structured-intake-grounding-v5.ts",
  "lib/assessment/runtime/writing-context-integrity-v2.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r1/postmortem-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r1/responsibility-matrix-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r1/replay-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r1/capabilities-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r1-replay-evaluator-v2.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r1-grounding-responsibility.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R1_REVIEW.md",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/validation.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-p4-i3-r1-c1-provider-diagnostic.mjs",
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

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baselineSha = "61e33a10e195fad17e253a6b9719217e1992f273";
const exactPaths = [
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
const acceptedImplementationSha =
  "c85d6d122ad71569532a55887b9a3b6d93f8a288";
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
const stageIds = ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"];
const promptPaths = {
  "PB-04":
    "lib/assessment/runtime/contracts/pb-04-decision-plan-v3.developer.md",
  "PB-05":
    "lib/assessment/runtime/contracts/pb-05-report-writer-v3.developer.md",
  "PB-06":
    "lib/assessment/runtime/contracts/pb-06-semantic-validator-v2.developer.md",
};

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

function sha256(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalText(value), "utf8"))
    .digest("hex");
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

function gitResult(args) {
  return spawnSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function sorted(items) {
  return [...items].sort((left, right) => left.localeCompare(right, "en"));
}

function currentTaskPaths(startSha = baselineSha) {
  const paths = new Set(
    gitText(["diff", "--name-only", startSha, "--"])
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

function historicalPaths(startSha, endSha) {
  return sorted(
    gitText(["diff", "--name-only", startSha, endSha, "--"])
      .split(/\r?\n/gu)
      .map((item) => item.trim().replaceAll("\\", "/"))
      .filter(Boolean),
  );
}

function isExactLiteralSet(actual, expected) {
  return (
    actual.length === expected.length &&
    new Set(actual).size === expected.length &&
    actual.every((item) =>
      typeof item === "string"
        ? item.length > 0 && !item.includes("*") && !item.endsWith("/")
        : false,
    ) &&
    JSON.stringify(sorted(actual)) === JSON.stringify(sorted(expected))
  );
}

gitText(["cat-file", "-e", `${baselineSha}^{commit}`]);
gitText(["merge-base", "--is-ancestor", baselineSha, "HEAD"]);
assert.equal(exactPaths.length, 19);
assert.equal(new Set(exactPaths).size, 19);
assert.equal(
  isExactLiteralSet(
    historicalPaths(baselineSha, acceptedImplementationSha),
    exactPaths,
  ),
  true,
);
const layer1PlanningManifest = json(
  "evals/runtime/m2-p4-i3-r1-planning-capabilities-v1.json",
);
const finalPlanningManifest = json(
  "evals/runtime/m2-p4-i3-r1-final-planning-capabilities-v1.json",
);
assert.equal(
  isExactLiteralSet(
    historicalPaths(acceptedImplementationSha, layer1PlanningSha),
    layer1PlanningManifest.exact_mutation_paths,
  ),
  true,
);
assert.equal(layer1PlanningManifest.exact_mutation_path_count, 9);
assert.equal(
  isExactLiteralSet(
    historicalPaths(layer1PlanningSha, acceptedPlanningSha),
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
    historicalPaths(acceptedPlanningSha, r1aBaselineSha),
    exactPlanningAcceptanceSyncPaths,
  ),
  true,
);
assert.equal(
  isExactLiteralSet(
    historicalPaths(r1aBaselineSha, r1aAcceptedImplementationSha),
    exactR1APaths,
  ),
  true,
);
assert.equal(exactR1APaths.length, 18);
assert.equal(
  isExactLiteralSet(
    historicalPaths(r1aAcceptedImplementationSha, r1bBaselineSha),
    exactR1AAcceptanceSyncPaths,
  ),
  true,
);
assert.equal(
  isExactLiteralSet(
    historicalPaths(r1bBaselineSha, c1BaselineSha),
    exactR1BPaths,
  ),
  true,
);
assert.equal(exactR1BPaths.length, 22);
assert.equal(
  isExactLiteralSet(
    historicalPaths(c1BaselineSha, r1C1R1BaselineSha),
    exactC1Paths,
  ),
  true,
);
assert.equal(exactC1Paths.length, 21);
assert.equal(exactR1C1R1Paths.length, 31);
assert.equal(
  isExactLiteralSet(
    currentTaskPaths(r1C1R1BaselineSha),
    exactR1C1R1Paths,
  ),
  true,
);
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
  "components/Unauthorized.tsx",
  "app/unauthorized/page.tsx",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
]) {
  assert.equal(
    isExactLiteralSet([...exactR1APaths, unauthorizedPath], exactR1APaths),
    false,
  );
}
assert.equal(
  isExactLiteralSet([...exactPaths, "ai/schemas/unauthorized.schema.json"], exactPaths),
  false,
);
assert.equal(
  isExactLiteralSet([...exactPaths, "components/Unauthorized.tsx"], exactPaths),
  false,
);
assert.equal(
  isExactLiteralSet([...exactPaths, "app/unauthorized/page.tsx"], exactPaths),
  false,
);
assert.equal(
  isExactLiteralSet([...exactPaths, "lib/assessment/runtime/policy-v3.ts"], exactPaths),
  false,
);
assert.equal(
  isExactLiteralSet(
    [...exactPaths, "lib/assessment/runtime/contracts/unlisted-runtime.json"],
    exactPaths,
  ),
  false,
);

const protectedDiff = gitResult([
  "diff",
  "--exit-code",
  baselineSha,
  "--",
  "ai/schemas",
  "ai/prompts",
  "evals/development",
  "evals/holdout",
  "components",
  "app",
  "lib/assessment/runtime/policy.ts",
  "lib/assessment/runtime/policy-v2.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/eligibility-v3.ts",
  "lib/assessment/runtime/safety-aggregation-v3.ts",
  "lib/assessment/runtime/report-grounding-v3.ts",
  "lib/assessment/runtime/change-condition-grounding-v3.ts",
  "lib/assessment/runtime/semantic-disposition-v3.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json",
  "lib/assessment/runtime/contracts/pb-04-decision-plan-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-05-report-writer-v2.developer.md",
  "app/api",
  "supabase",
  "package.json",
  "package-lock.json",
]);
assert.equal(protectedDiff.status, 0, protectedDiff.stdout || protectedDiff.stderr);
const historicalPb06 = gitResult([
  "diff",
  "--exit-code",
  baselineSha,
  "--",
  "ai/prompts/semantic-validator/v1.0.0.developer.md",
]);
assert.equal(historicalPb06.status, 0);

const i1cManifest = json("evals/runtime/m2-p4-i1-c-capabilities-v1.json");
const i1cSnapshot = i1cManifest.implementation_snapshot;
assert.deepEqual(
  historicalPaths(i1cSnapshot.base_commit_sha, i1cSnapshot.end_commit_sha),
  sorted(i1cManifest.accepted_stack_paths),
);
assert.equal(i1cSnapshot.immutable_snapshot, true);
assert.equal(i1cSnapshot.include_working_tree, false);
assert.equal(i1cManifest.accepted_stack_paths.length, 27);

const i2Manifest = json("evals/runtime/m2-p4-i2-capabilities-v1.json");
const i2Snapshot = i2Manifest.implementation_snapshot;
assert.deepEqual(
  historicalPaths(i2Snapshot.base_commit_sha, i2Snapshot.end_commit_sha),
  sorted(i2Manifest.exact_mutation_paths),
);
assert.equal(i2Snapshot.immutable_snapshot, true);
assert.equal(i2Snapshot.include_working_tree, false);
assert.equal(i2Manifest.exact_mutation_paths.length, 16);
assert.equal(
  isExactLiteralSet(
    [...i2Manifest.exact_mutation_paths, promptPaths["PB-04"]],
    i2Manifest.exact_mutation_paths,
  ),
  false,
);

const qualityContract = json("evals/runtime/m2-p4-i3-quality-contract-v1.json");
const capabilities = json("evals/runtime/m2-p4-i3-capabilities-v1.json");
assert.equal(qualityContract.task_id, "M2-P4-I3");
assert.deepEqual(qualityContract.desired_user_outcomes, [
  "分かってもらえた",
  "納得できた",
  "動けそう",
]);
assert.equal(qualityContract.paid_value_standard.price_jpy, 980);
assert.equal(qualityContract.voice.length, 9);
assert.equal(qualityContract.prohibited_tone_patterns.length, 14);
assert.equal(qualityContract.epistemic_policy.length, 7);
assert.equal(capabilities.task_id, "M2-P4-I3");
assert.equal(
  capabilities.title,
  "PB-04 / PB-05 / PB-06 Product Quality Revision",
);
assert.equal(
  capabilities.status,
  "implementation_pending_human_chatgpt_review",
);
assert.equal(capabilities.baseline, baselineSha);
assert.equal(isExactLiteralSet(capabilities.exact_mutation_paths, exactPaths), true);
assert.equal(capabilities.prompt_bundle_version, "prompt-bundle-runtime-v4.0.0");
assert.equal(capabilities.schema_set_version, "pipeline-schema-runtime-v3.0.0");
assert.deepEqual(capabilities.prompt_versions, {
  "PB-04": "v3.0.0",
  "PB-05": "v3.0.0",
  "PB-06": "v2.0.0",
});
for (const key of [
  "schema_mutations",
  "ui_mutations",
  "policy_mutations",
  "openai_calls",
  "db_operations",
  "migrations",
  "holdout_use",
  "real_user_data",
]) {
  assert.equal(capabilities[key], 0);
}
assert.equal(capabilities.provider_backed_quality_result, "not_run");
assert.equal(capabilities.achieved_rubric_score, null);
assert.equal(capabilities.e1_status, "not_started");

const catalogV3 = json(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json",
);
const catalogV4 = json(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
);
assert.equal(catalogV4.schema_version, "m2-p4-runtime-stage-catalog-v1");
assert.equal(catalogV4.catalog_version, "runtime-stage-catalog-v4.0.0");
assert.equal(catalogV4.prompt_bundle_version, "prompt-bundle-runtime-v4.0.0");
assert.equal(catalogV4.schema_set_version, "pipeline-schema-runtime-v3.0.0");
assert.equal(catalogV4.baseline, baselineSha);
assert.deepEqual(
  catalogV4.stages.map((stage) => stage.stage_id),
  stageIds,
);
assert.deepEqual(
  catalogV4.stages.map((stage) => stage.sequence_number),
  [1, 2, 3, 4, 5, 6],
);
assert.deepEqual(
  catalogV4.stages.map((stage) => stage.prompt_version),
  ["v3.0.0", "v1.0.0", "v3.0.0", "v3.0.0", "v3.0.0", "v2.0.0"],
);
assert.deepEqual(
  catalogV4.stages.map((stage) => stage.schema_sha256),
  catalogV3.stages.map((stage) => stage.schema_sha256),
);
for (const stage of catalogV4.stages) {
  assert.equal(sha256(source(stage.prompt_path)), stage.prompt_sha256);
  assert.equal(sha256(source(stage.schema_path)), stage.schema_sha256);
}

const pb04Prompt = source(promptPaths["PB-04"]);
const pb05Prompt = source(promptPaths["PB-05"]);
const pb06Prompt = source(promptPaths["PB-06"]);
for (const required of [
  "user_supplied_optional_message",
  "smallest useful edit",
  "before send",
  "after send",
  "copy-ready",
  "three distinct days",
  "observable change condition",
  "no inner-state/future certainty",
  "no retry/Repair/PB-07",
]) {
  assert.equal(pb04Prompt.includes(required), true, `PB-04 missing ${required}`);
}
for (const required of [
  "分かってもらえた",
  "納得できた",
  "動けそう",
  "Field-by-field responsibility",
  "message draft context",
  "Repetition control",
  "no business-report tone",
  "no occult tone",
  "no generic filler",
  "no retry/Repair/PB-07",
]) {
  assert.equal(pb05Prompt.includes(required), true, `PB-05 missing ${required}`);
}
for (const required of [
  "Major/critical correctness boundary",
  "TEMPLATE_GENERICITY minor default",
  "BRAND_TONE minor default",
  "REPETITION minor default",
  "selected-request material omission major",
  "temporal future condition is not current violation",
  "no repair/retry/PB-07",
]) {
  assert.equal(pb06Prompt.includes(required), true, `PB-06 missing ${required}`);
}
for (const prompt of [pb04Prompt, pb05Prompt, pb06Prompt]) {
  for (const prohibited of [
    "M2P4-LIVE-001",
    "REPLY-004",
    "oracle lookup table",
    "currentSituation.match",
  ]) {
    assert.equal(prompt.includes(prohibited), false, `prompt contains ${prohibited}`);
  }
}

const [
  { AssessmentApplication },
  { FakeAssessmentRepository, safetyBlockedStageOutputs, wait003StageOutputs },
  {
    loadM2P4ContextualRuntimeStageCatalog,
    loadM2P4ProductQualityRuntimeStageCatalog,
  },
  { assertOpenAIStructuredOutputSchema, toOpenAiStructuredOutputSchema },
] = await Promise.all([
  import("../lib/assessment/runtime/application.ts"),
  import("../lib/assessment/runtime/fakes.ts"),
  import("../lib/assessment/runtime/schema-catalog.ts"),
  import("../lib/assessment/runtime/openai-schema.ts"),
]);

const runtimeV4 = await loadM2P4ProductQualityRuntimeStageCatalog();
const runtimeV3 = await loadM2P4ContextualRuntimeStageCatalog();
assert.equal(runtimeV4.promptBundleVersion, "prompt-bundle-runtime-v4.0.0");
assert.equal(runtimeV4.schemaSetVersion, "pipeline-schema-runtime-v3.0.0");
assert.equal(runtimeV4.definitions.length, 6);
assert.equal(runtimeV3.promptBundleVersion, "prompt-bundle-runtime-v3.0.0");
for (const definition of runtimeV4.definitions) {
  assert.doesNotThrow(() =>
    assertOpenAIStructuredOutputSchema(
      toOpenAiStructuredOutputSchema(definition.outputSchema),
    ),
  );
}

function decisionFacts() {
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
}

function structuredIntake() {
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
    decision_facts: decisionFacts(),
  };
}

function replyPlan() {
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

function reportContent() {
  const report = wait003StageOutputs()["PB-05"];
  return {
    ...report,
    message_draft_context:
      "候補文の感謝と土曜の意思を残し、時間確認を一問だけに絞った。",
    change_condition_commentary: ["raw-one", "raw-two", "raw-three"],
  };
}

function semanticFinding(findingCode, severity, jsonPath, evidenceRefs) {
  return {
    finding_code: findingCode,
    severity,
    json_path: jsonPath,
    evidence_refs: evidenceRefs ?? ["input:decision_plan"],
    detail: "候補の意味上の整合性を確認するオフライン finding。",
  };
}

function semanticOutput(findings = []) {
  return {
    schema_version: "pipeline-schema-v1.0.0",
    validation_mode: "semantic_findings_only",
    deterministic_checks: [],
    semantic_checks: findings,
    final_disposition: null,
    repair_strategy: null,
    failed_codes: [],
  };
}

function stageOutputs(findings = []) {
  const outputs = wait003StageOutputs();
  outputs["PB-01"] = structuredIntake();
  outputs["PB-03"] = {
    schema_version: "pipeline-schema-v3.0.0",
    acknowledged_eligibility: "ready",
  };
  outputs["PB-04"] = replyPlan();
  outputs["PB-05"] = reportContent();
  outputs["PB-06"] = semanticOutput(findings);
  return outputs;
}

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

function deterministicUuidFactory() {
  let sequence = 0;
  return () => {
    sequence += 1;
    return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
  };
}

const syntheticInput = {
  currentSituation:
    "マッチング後の相手から土曜の予定を聞かれ、まだ返信していません。",
  optionalMessage: "ありがとう！土曜なら大丈夫だよ。時間はどうしようか？",
  relationship: "matching_app",
  requestedTopics: ["decide_send_or_wait", "draft_message"],
  privacyAcknowledged: true,
};

async function execute(outputs, catalog, index) {
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
  const idempotencyKey = `80000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
  try {
    const result = await application.submit(syntheticInput, idempotencyKey);
    return { result, error: null, repository, transport };
  } catch (error) {
    return { result: null, error, repository, transport };
  }
}

const normalRun = await execute(stageOutputs(), runtimeV4, 1);
assert.equal(normalRun.error, null);
assert.equal(normalRun.result.eligibility, "ready");
assert.equal(normalRun.result.decision, "reply_now");
assert.notEqual(normalRun.result.report.decisionPlan.message_draft, null);
assert.deepEqual(normalRun.transport.calls, stageIds);
assert.equal(normalRun.repository.reports.size, 1);
assert.equal(normalRun.transport.actualProviderCalls, 0);
assert.equal(normalRun.repository.actualSupabaseCalls, 0);
for (const stageId of ["PB-04", "PB-05", "PB-06"]) {
  const request = normalRun.transport.requests.find(
    (candidate) => candidate.stageId === stageId,
  );
  assert.equal(
    request.input.user_supplied_optional_message,
    syntheticInput.optionalMessage,
  );
  assert.deepEqual(request.input.requested_topics, syntheticInput.requestedTopics);
}
const pb04Request = normalRun.transport.requests.find(
  (candidate) => candidate.stageId === "PB-04",
);
assert.equal(pb04Request.input.aggregate_safety_result.classification, "normal_allowed");
assert.equal(pb04Request.input.aggregate_safety_result.response_mode, "none");

const historicalV3Run = await execute(stageOutputs(), runtimeV3, 2);
assert.equal(historicalV3Run.error, null);
for (const stageId of ["PB-04", "PB-05", "PB-06"]) {
  const request = historicalV3Run.transport.requests.find(
    (candidate) => candidate.stageId === stageId,
  );
  assert.equal("user_supplied_optional_message" in request.input, false);
  assert.equal("requested_topics" in request.input, false);
}

const minorRun = await execute(
  stageOutputs([
    semanticFinding("TEMPLATE_GENERICITY", "minor", "report_content.cover_line"),
    semanticFinding("BRAND_TONE", "minor", "report_content.short_letter[0]"),
    semanticFinding("REPETITION", "minor", "report_content.closing_lines[0]"),
  ]),
  runtimeV4,
  3,
);
assert.equal(minorRun.error, null);
assert.equal(minorRun.repository.reports.size, 1);

async function assertFailClosed(finding, index) {
  const run = await execute(stageOutputs([finding]), runtimeV4, index);
  assert.equal(run.result, null);
  assert.equal(run.error?.safeCode, "M2_SEMANTIC_VALIDATION_FAILED");
  assert.deepEqual(run.transport.calls, stageIds);
  assert.equal(run.repository.reports.size, 0);
  assert.equal(run.transport.actualProviderCalls, 0);
  assert.equal(run.repository.actualSupabaseCalls, 0);
}

await assertFailClosed(
  semanticFinding("FACT_FIDELITY", "major", "report_content.relationship_summary", [
    "F001",
  ]),
  4,
);
await assertFailClosed(
  semanticFinding(
    "SAFETY_REGRESSION",
    "critical",
    "report_content.action_rationales[0]",
    ["input:aggregate_safety_result"],
  ),
  5,
);
await assertFailClosed(
  semanticFinding(
    "REQUIRED_SECTION_MEANING",
    "major",
    "report_content.message_draft_context",
    ["input:requested_topics"],
  ),
  6,
);

const temporalFindings = [
  semanticFinding(
    "DECISION_ALLOWED",
    "critical",
    "decision_plan.change_conditions[1].resulting_direction",
    ["input:decision_policy_result", "input:decision_plan"],
  ),
  semanticFinding(
    "MESSAGE_POLICY_CONSISTENCY",
    "major",
    "$.report_content.change_condition_commentary[0]",
    ["input:decision_policy_result", "input:report_content"],
  ),
];
const temporalRun = await execute(stageOutputs(temporalFindings), runtimeV4, 7);
assert.equal(temporalRun.error, null);
assert.equal(temporalRun.repository.reports.size, 1);

const mixedRun = await execute(
  stageOutputs([
    ...temporalFindings,
    semanticFinding("FACT_FIDELITY", "major", "report_content.cover_line", [
      "F001",
    ]),
  ]),
  runtimeV4,
  8,
);
assert.equal(mixedRun.result, null);
assert.equal(mixedRun.error?.safeCode, "M2_SEMANTIC_VALIDATION_FAILED");
assert.equal(mixedRun.repository.reports.size, 0);

const safetyOutputs = safetyBlockedStageOutputs();
safetyOutputs["PB-01"] = structuredIntake();
safetyOutputs["PB-03"] = {
  schema_version: "pipeline-schema-v3.0.0",
  acknowledged_eligibility: "safety_blocked",
};
const safetyRun = await execute(safetyOutputs, runtimeV4, 9);
assert.equal(safetyRun.error, null);
assert.equal(safetyRun.result.eligibility, "safety_blocked");
assert.deepEqual(safetyRun.transport.calls, ["PB-01", "PB-02", "PB-03"]);
assert.equal(safetyRun.repository.reports.size, 0);

const policyResult = execFileSync(
  process.execPath,
  ["evals/quality/m2-p4-i1/verify-decision-policy.mjs"],
  {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);
for (const required of [
  "M2_P4_I1_TYPED_POLICY: PASS",
  "total: 40/40",
  "reply_now: 10/10",
  "send_now: 10/10",
  "wait_and_reassess: 10/10",
  "pause_additional_contact: 10/10",
  "allowed_set_violations: 0",
  "forbidden_decisions: 0",
  "case_specific_matching: 0",
  "openai_calls: 0",
  "db_operations: 0",
  "holdout_use: 0",
]) {
  assert.equal(policyResult.includes(required), true, `policy output missing ${required}`);
}

const pipelineSource = source("lib/assessment/runtime/pipeline.ts");
const serviceSource = source("lib/assessment/runtime/service.ts");
const environmentSource = source("lib/assessment/runtime/environment.ts");
assert.equal(
  pipelineSource.includes(
    'runContext.promptBundleVersion === "prompt-bundle-runtime-v4.0.0"',
  ),
  true,
);
assert.equal(
  pipelineSource.match(/user_supplied_optional_message: request\.optionalMessage/gu)
    ?.length,
  3,
);
assert.equal(
  pipelineSource.match(/requested_topics: request\.requestedTopics/gu)?.length,
  4,
);
assert.equal(
  serviceSource.includes("loadM2P4ProductQualityRuntimeStageCatalog"),
  true,
);
assert.equal(serviceSource.includes("model: environment.openAiModel"), true);
assert.equal(environmentSource.includes('model !== "gpt-5.6-luna"'), true);

console.log("M2_P4_I3_PRODUCT_QUALITY: PASS");
console.log("accepted_planning_snapshot: 12/12");
console.log("planning_acceptance_sync_scope: 6/6");
console.log("r1_a_successor_exact_scope: 18/18");
console.log("r1_b_successor_exact_scope: 22/22");
console.log("r1_c1_successor_exact_scope: 21/21");
console.log("prompt_bundle: runtime-v4");
console.log("schemas_changed: 0");
console.log("ui_changed: 0");
console.log("policy_changed: 0");
console.log("optional_message_inputs: PB-04/PB-05/PB-06");
console.log("minor_quality_findings_nonblocking: PASS");
console.log("true_major_critical_fail_closed: PASS");
console.log("policy_parity: 40/40");
console.log("openai_calls: 0");
console.log("db_operations: 0");
console.log("holdout_use: 0");
