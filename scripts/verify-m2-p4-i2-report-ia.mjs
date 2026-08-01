import assert from "node:assert/strict";
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
const baselineSha = "20d4178e3a63026128f3a25d052196c7161e7e27";
const acceptedImplementationSha =
  "410714875903ae61b5bcdc6cce90030f5679b3b3";
const i3BaselineSha = "61e33a10e195fad17e253a6b9719217e1992f273";
const exactPaths = [
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
const exactRendererPaths = [
  "app/review/runtime/i2/page.tsx",
  "app/globals.css",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "components/runtime/RuntimeAssessmentNote.tsx",
];
const exactAcceptanceSyncPaths = [
  "evals/runtime/m2-p4-i2-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I2_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
];
const sectionOrder = [
  "tonight-action",
  "short-letter",
  "decision-reason",
  "message-reading",
  "three-day-plan",
  "change-conditions",
  "closing",
];
const topicMappings = [
  ["decide_send_or_wait", "送るか待つか決めたい", "tonight-action"],
  ["draft_message", "送る文章を整えたい", "message-draft"],
  ["message_impact", "この文面がどう届くか知りたい", "message-reading"],
  ["relationship", "相手との関係を整理したい", "decision-reason"],
  ["next_three_days", "これから3日どう動くか知りたい", "three-day-plan"],
  ["organize_emotions", "不安を整理したい", "short-letter"],
];
const hiddenFields = [
  "observed_fact_commentary",
  "anxiety_reframe",
  "action_rationales",
  "message_draft_context",
  "three_day_plan_commentary",
  "change_condition_commentary",
  "unknowns_commentary",
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
    actual.every(
      (item) =>
        typeof item === "string" &&
        item.length > 0 &&
        !item.includes("*") &&
        !item.endsWith("/"),
    ) &&
    JSON.stringify(sorted(actual)) === JSON.stringify(sorted(expected))
  );
}

gitText(["cat-file", "-e", `${baselineSha}^{commit}`]);
gitText(["cat-file", "-e", `${acceptedImplementationSha}^{commit}`]);
gitText([
  "merge-base",
  "--is-ancestor",
  baselineSha,
  acceptedImplementationSha,
]);
gitText([
  "merge-base",
  "--is-ancestor",
  acceptedImplementationSha,
  "HEAD",
]);
gitText(["merge-base", "--is-ancestor", baselineSha, "HEAD"]);

const actualPaths = historicalPaths(baselineSha, acceptedImplementationSha);
assert.deepEqual(actualPaths, sorted(exactPaths));
assert.equal(exactPaths.length, 16);
assert.equal(new Set(exactPaths).size, 16);
assert.equal(exactPaths.some((item) => item.includes("*")), false);
assert.equal(exactPaths.some((item) => item.endsWith("/")), false);
assert.deepEqual(
  historicalPaths(baselineSha, acceptedImplementationSha),
  sorted(exactPaths),
);
const acceptanceSyncPaths = historicalPaths(
  acceptedImplementationSha,
  i3BaselineSha,
);
assert.deepEqual(acceptanceSyncPaths, sorted(exactAcceptanceSyncPaths));
assert.equal(exactAcceptanceSyncPaths.length, 8);
assert.equal(new Set(exactAcceptanceSyncPaths).size, 8);
assert.equal(
  exactAcceptanceSyncPaths.some(
    (item) => item.includes("*") || item.endsWith("/"),
  ),
  false,
);

const protectedDiff = gitResult([
  "diff",
  "--exit-code",
  baselineSha,
  acceptedImplementationSha,
  "--",
  "ai/prompts",
  "ai/schemas",
  "evals/development",
  "evals/holdout",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/policy.ts",
  "lib/assessment/runtime/policy-v2.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/contracts",
  "app/api",
  "supabase",
  "package.json",
  "package-lock.json",
]);
assert.equal(protectedDiff.status, 0, protectedDiff.stdout || protectedDiff.stderr);
const historicalI3Paths = historicalPaths(i3BaselineSha, i3ImplementationSha);
assert.deepEqual(historicalI3Paths, sorted(exactI3Paths));
assert.equal(exactI3Paths.length, 19);
assert.equal(new Set(exactI3Paths).size, 19);
assert.equal(
  exactI3Paths.some((item) => item.includes("*") || item.endsWith("/")),
  false,
);
for (const unauthorizedPath of [
  "ai/schemas/unauthorized.schema.json",
  "components/runtime/UnauthorizedComponent.tsx",
  "app/unauthorized/page.tsx",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/contracts/unlisted-runtime.json",
]) {
  assert.notDeepEqual(
    sorted([...exactI3Paths, unauthorizedPath]),
    sorted(exactI3Paths),
  );
}
const layer1PlanningManifest = json(
  "evals/runtime/m2-p4-i3-r1-planning-capabilities-v1.json",
);
const finalPlanningManifest = json(
  "evals/runtime/m2-p4-i3-r1-final-planning-capabilities-v1.json",
);
assert.equal(
  isExactLiteralSet(
    historicalPaths(i3ImplementationSha, layer1PlanningSha),
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

const i1cManifest = json("evals/runtime/m2-p4-i1-c-capabilities-v1.json");
const i1cSnapshot = i1cManifest.implementation_snapshot;
const historicalI1cPaths = gitText([
  "diff",
  "--name-only",
  i1cSnapshot.base_commit_sha,
  i1cSnapshot.end_commit_sha,
  "--",
])
  .split(/\r?\n/gu)
  .map((item) => item.trim().replaceAll("\\", "/"))
  .filter(Boolean);
assert.equal(i1cSnapshot.immutable_snapshot, true);
assert.equal(i1cSnapshot.include_working_tree, false);
assert.equal(historicalI1cPaths.length, 27);
assert.deepEqual(sorted(historicalI1cPaths), sorted(i1cManifest.accepted_stack_paths));

const dispositions = json(
  "evals/runtime/m2-p4-i2-field-disposition-v1.json",
);
const expectedDispositionEntries = [
  {
    field: "observed_fact_commentary",
    disposition: "integrate",
    target: "decision-reason",
    rule: "decision_reason_fact_idsに含まれるfactだけ表示",
  },
  {
    field: "anxiety_reframe",
    disposition: "display",
    target: "short-letter",
    label: "不安を少しほどくために",
  },
  {
    field: "action_rationales",
    disposition: "integrate",
    target: "tonight-action",
    label: "この動き方をすすめる理由",
  },
  {
    field: "message_draft_context",
    disposition: "display",
    target: "message-draft",
    label: "この文面に整えた理由",
  },
  {
    field: "three_day_plan_commentary",
    disposition: "integrate",
    target: "three-day-plan",
    rule: "day indexと同じindexへ統合",
  },
  {
    field: "change_condition_commentary",
    disposition: "display",
    target: "change-conditions",
  },
  {
    field: "unknowns_commentary",
    disposition: "deprecate_in_successor_schema",
    target: "none",
    rationale:
      "possible_interpretations、change conditions、fixed limitationとの意味重複が強く、現画面へ追加すると免責と不明点の反復になるため",
  },
];
assert.equal(dispositions.schema_version, "m2-p4-i2-field-disposition-v1");
assert.deepEqual(dispositions.entries, expectedDispositionEntries);
assert.equal(dispositions.entries.length, 7);
assert.equal(new Set(dispositions.entries.map((item) => item.field)).size, 7);
assert.deepEqual(dispositions.entries.map((item) => item.field), hiddenFields);
assert.equal(
  dispositions.entries.every((item) =>
    ["display", "integrate", "deprecate_in_successor_schema"].includes(
      item.disposition,
    ),
  ),
  true,
);

const capabilities = json("evals/runtime/m2-p4-i2-capabilities-v1.json");
assert.equal(capabilities.task_id, "M2-P4-I2");
assert.equal(
  capabilities.title,
  "Report Information Architecture and Intent Fulfillment",
);
assert.equal(
  capabilities.status,
  "human_chatgpt_accepted_complete",
);
assert.equal(
  capabilities.accepted_implementation_commit,
  acceptedImplementationSha,
);
assert.equal(capabilities.baseline, baselineSha);
assert.deepEqual(capabilities.implementation_snapshot, {
  type: "historical_commit_range",
  base_commit_sha: baselineSha,
  end_commit_sha: acceptedImplementationSha,
  include_working_tree: false,
  immutable_snapshot: true,
});
assert.deepEqual(capabilities.exact_mutation_paths, exactPaths);
assert.equal(capabilities.field_disposition_asset,
  "evals/runtime/m2-p4-i2-field-disposition-v1.json");
assert.equal(capabilities.selected_intent_mappings, 6);
assert.equal(capabilities.static_preview_route, "/review/runtime/i2");
assert.deepEqual(capabilities.human_visual_qa, {
  desktop: "pass",
  mobile: "pass",
  mobile_width_px: 399,
  horizontal_overflow: 0,
  content_clipping: 0,
  tonight_answer_visible: true,
  draft_prioritized: true,
  action_sections_readable: true,
  three_day_timeline_responsive: true,
  footer_rendered: true,
});
assert.deepEqual(capabilities.non_blocking_backlog, [
  "mobile tonight-action heading wrap",
  "slightly tall cover",
  "intent-link affordance",
]);
for (const key of [
  "openai_calls",
  "db_operations",
  "migrations",
  "holdout_use",
  "real_user_data",
]) {
  assert.equal(capabilities[key], 0);
}
assert.equal(capabilities.i3_status, "not_started");
assert.equal(JSON.stringify(capabilities).includes("*"), false);
assert.equal("prefix_authorization" in capabilities, false);

for (const verifierPath of [
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
]) {
  const verifierSource = source(verifierPath);
  assert.equal(verifierSource.includes(baselineSha), true);
  for (const rendererPath of exactRendererPaths) {
    assert.equal(verifierSource.includes(`"${rendererPath}"`), true);
  }
  for (const forbiddenAuthorization of [
    "app/**",
    "components/**",
    'startsWith("app/")',
    'startsWith("components/")',
  ]) {
    assert.equal(verifierSource.includes(forbiddenAuthorization), false);
  }
}

const noteSource = source("components/runtime/RuntimeAssessmentNote.tsx");
const formSource = source("components/runtime/RuntimeAssessmentForm.tsx");
const sectionPositions = sectionOrder.map((sectionId) =>
  noteSource.indexOf(`id=\"${sectionId}\"`),
);
assert.equal(sectionPositions.every((position) => position >= 0), true);
assert.deepEqual(sectionPositions, [...sectionPositions].sort((a, b) => a - b));
assert.equal(noteSource.includes("reading-note-answer-section"), false);
assert.equal(noteSource.includes("<h2>文面の温度</h2>"), false);
assert.equal(noteSource.includes("id=\"message-temperature\""), false);

assert.equal(noteSource.includes("requestedTopics: RequestedTopic[]"), true);
assert.equal(formSource.includes("requestedTopics={form.requestedTopics}"), true);
assert.equal(noteSource.includes("requestedTopics.map((topic)"), true);
assert.equal(noteSource.includes("href={`#${navigation.sectionId}`}"), true);
for (const [topic, label, sectionId] of topicMappings) {
  assert.equal(noteSource.includes(`${topic}: {`), true);
  assert.equal(noteSource.includes(`label: \"${label}\"`), true);
  assert.equal(noteSource.includes(`sectionId: \"${sectionId}\"`), true);
  assert.equal(
    noteSource.includes(`id=\"${sectionId}\"`) ||
      noteSource.includes(`sectionId: \"${sectionId}\"`),
    true,
  );
}

for (const field of hiddenFields.slice(0, 6)) {
  assert.equal(noteSource.includes(field), true, `${field} is not rendered`);
}
assert.equal(noteSource.includes("unknowns_commentary"), false);
assert.equal(noteSource.includes("item.avoid"), true);
assert.equal(noteSource.includes("decision_reason_fact_ids"), true);
assert.equal(noteSource.includes("selectedFactIds.has(item.fact_id)"), true);
assert.equal(noteSource.includes("threeDayPlanAligned"), true);
assert.equal(
  noteSource.includes("3日間の計画と補足の件数が一致していません。"),
  true,
);

assert.equal(
  noteSource.includes(
    "今夜は送信を急がない判断のため、今すぐ送る文面は提示していません。",
  ),
  true,
);
assert.equal(
  noteSource.includes(
    "追加連絡を止める判断のため、送信用の文面は提示していません。",
  ),
  true,
);
assert.equal(
  noteSource.match(/selected_decision ===/gu)?.length,
  2,
);
assert.equal(noteSource.includes('selected_decision === "reply_now"'), false);
assert.equal(noteSource.includes('selected_decision === "send_now"'), false);

const previewSource = source("app/review/runtime/i2/page.tsx");
const fixtureSource = source(
  "lib/assessment/runtime/review/m2-p4-i2-review-fixture.ts",
);
const environmentNode = "process" + ".env.NODE_ENV";
const environmentGate = "process" + ".env.M2_INTERNAL_RUNTIME_ENABLED";
const networkCallToken = "fetch" + "(";
assert.equal(previewSource.includes(`${environmentNode} === \"production\"`), true);
assert.equal(previewSource.includes(`${environmentGate} !== \"true\"`), true);
assert.equal(previewSource.includes("notFound()"), true);
assert.equal(previewSource.includes("index: false"), true);
assert.equal(previewSource.includes("follow: false"), true);
assert.equal(previewSource.includes("I2固定プレビュー / API・DB未使用"), true);
assert.equal(previewSource.includes(networkCallToken), false);
assert.equal(previewSource.includes("/api/internal/assessments"), false);
assert.equal(previewSource.includes('from "openai"'), false);
assert.equal(previewSource.includes("@supabase/supabase-js"), false);

const requiredReportFields = [
  "cover_line",
  "short_letter",
  "decision_reason_summary",
  "relationship_summary",
  ...hiddenFields,
  "possible_interpretations",
  "message_temperature",
  "closing_lines",
];
for (const field of requiredReportFields) {
  assert.equal(fixtureSource.includes(`${field}:`), true, `${field} missing`);
}
assert.equal(fixtureSource.includes('selected_decision: "reply_now"'), true);
assert.equal(fixtureSource.includes("message_draft: {"), true);
assert.equal(fixtureSource.match(/day: "(?:tonight|next_day|day_three)"/gu)?.length, 3);
assert.equal(fixtureSource.match(/^\s+avoid:/gmu)?.length, 3);
assert.equal(fixtureSource.includes("change_conditions: ["), true);
assert.equal(fixtureSource.includes("架空"), true);
assert.equal(
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/iu.test(
    fixtureSource,
  ),
  false,
);
assert.equal(fixtureSource.includes(networkCallToken), false);
assert.equal(fixtureSource.includes("provider response"), false);
assert.equal(fixtureSource.includes("secret"), false);

const i2RuntimeSources = [previewSource, fixtureSource, noteSource].join("\n");
for (const forbidden of [
  "new OpenAI",
  ".responses.create",
  "createClient",
  ".from(",
  ".rpc(",
  "PB-07",
  "Repair",
  "fallback",
]) {
  assert.equal(i2RuntimeSources.includes(forbidden), false);
}

console.log("M2_P4_I2_REPORT_INFORMATION_ARCHITECTURE: PASS");
console.log("accepted_implementation_commit: 410714875903ae61b5bcdc6cce90030f5679b3b3");
console.log("implementation_snapshot: 16/16");
console.log("i3_successor_exact_scope: 19/19");
console.log("accepted_planning_snapshot: 12/12");
console.log("planning_acceptance_sync_scope: 6/6");
console.log("r1_a_successor_exact_scope: 18/18");
console.log("r1_b_successor_exact_scope: 22/22");
console.log("r1_c1_successor_exact_scope: 21/21");
console.log("acceptance_sync_scope: 8/8");
console.log("desktop_visual_qa: PASS");
console.log("mobile_399px_visual_qa: PASS");
console.log("exact_scope: 16/16");
console.log("renderer_exceptions: 4/4");
console.log("unauthorized_renderer_regressions: PASS");
console.log("field_dispositions: 7/7");
console.log("selected_intent_mappings: 6/6");
console.log("hidden_fields_visible_or_disposed: 7/7");
console.log("duplicate_answer_section: 0");
console.log("tonight_action_priority: PASS");
console.log("draft_context_visible: PASS");
console.log("three_day_avoid_visible: PASS");
console.log("static_preview_network_calls: 0");
console.log("openai_calls: 0");
console.log("db_operations: 0");
console.log("holdout_use: 0");
