import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateDiagnostic,
  renderDiagnosticSummary,
  shaJson,
} from "./lib/m2-p4-i3-r1-c1-evaluator.mjs";

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
const baselineSha = "76c469db264cd1cb9434b6a19ec5c75db5754a2a";
const mainBaselineSha = "61e33a10e195fad17e253a6b9719217e1992f273";
const r1bBaselineSha = "2381312ced5fc726dfa245632c25da6bb68a376f";
const r1bAcceptedImplementationSha =
  "4a1237ac647bff79229d7181d978d5613c2c3b87";
const branch = "test/m2-p4-i3-r1-c1-provider-diagnostic";
const successorBranch =
  "feat/m2-p4-i3-r1-c1-r1-grounding-responsibility";
const packageCommitSha = "0c228406298fbb829cbb216e31c00e6812cc1393";
const resultCommitSha = "7b0c1b6da5d877f7a7a6de5be431276452e3b8b2";
const artifactRoot = "evals/runtime/m2-p4-i3-r1-c1";
const exactPaths = [
  "scripts/lib/m2-p4-i3-r1-c1-provider-runner.mjs",
  "scripts/lib/m2-p4-i3-r1-c1-evaluator.mjs",
  "scripts/run-m2-p4-i3-r1-c1-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-provider-diagnostic.mjs",
  `${artifactRoot}/diagnostic-contract-v1.json`,
  `${artifactRoot}/diagnostic-cases-v1.json`,
  `${artifactRoot}/diagnostic-results-v1.json`,
  `${artifactRoot}/diagnostic-summary-v1.md`,
  `${artifactRoot}/capabilities-v1.json`,
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
const reviewSyncPaths = [
  `${artifactRoot}/capabilities-v1.json`,
  "docs/phase2/TASK_M2_P4_I3_R1_C1_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-provider-diagnostic.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const immutableExecutionPaths = exactPaths.filter(
  (item) => !reviewSyncPaths.includes(item),
);
const protectedPaths = [
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/application.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/openai-transport.ts",
  "lib/assessment/runtime/environment.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v5.json",
  "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-01-structure-v4.developer.md",
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "lib/assessment/runtime/contracts/structured-intake-v4.schema.json",
  "lib/assessment/runtime/structured-intake-grounding-v3.ts",
  "lib/assessment/runtime/structured-intake-grounding-v4.ts",
  "lib/assessment/runtime/contextual-integrity-v3.ts",
  "lib/assessment/runtime/writing-context-integrity-v1.ts",
  "lib/assessment/runtime/structured-intake-legacy-view-v3.ts",
  "lib/assessment/runtime/policy.ts",
  "lib/assessment/runtime/policy-v2.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "app",
  "components",
  "evals/development",
  "evals/holdout",
  "supabase",
  "package.json",
  "package-lock.json",
];
const r1bExactPaths = [
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
const historicalVerifiers = [
  "scripts/verify-m2-p4-i3-r1-b-writing-context.mjs",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "scripts/verify-m2-p4-i3-product-quality.mjs",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
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

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function normalizedPaths(output) {
  return output
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean);
}

function historicalPaths(start, end) {
  return sorted(
    normalizedPaths(git(["diff", "--name-only", start, end, "--"])),
  );
}

function currentTaskPaths(start) {
  const result = new Set(
    normalizedPaths(git(["diff", "--name-only", start, "--"])),
  );
  const status = git([
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
  ]);
  for (const record of status.split("\0")) {
    if (!record) continue;
    let item = record.slice(3);
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

function recursivelyFindKeys(value, result = []) {
  if (Array.isArray(value)) {
    for (const item of value) recursivelyFindKeys(item, result);
    return result;
  }
  if (!value || typeof value !== "object") return result;
  for (const [key, child] of Object.entries(value)) {
    result.push(key);
    recursivelyFindKeys(child, result);
  }
  return result;
}

const args = process.argv.slice(2);
assert.ok(args.length === 0 || args.length === 2);
if (args.length === 2) {
  assert.equal(args[0], "--phase");
  assert.ok(
    args[1] === "prepare" ||
      args[1] === "completed" ||
      args[1] === "reviewed",
  );
}
const phase = args.length === 0 ? "reviewed" : args[1];

assert.equal(git(["branch", "--show-current"]).trim(), successorBranch);
assert.equal(git(["rev-parse", "main"]).trim(), mainBaselineSha);
assert.equal(git(["rev-parse", "origin/main"]).trim(), mainBaselineSha);
assert.doesNotThrow(() => git(["cat-file", "-e", `${baselineSha}^{commit}`]));
assert.doesNotThrow(() => git(["merge-base", "--is-ancestor", baselineSha, "HEAD"]));
assert.equal(exactPaths.length, 21);
assertLiteralSet(
  historicalPaths(baselineSha, r1C1R1BaselineSha),
  exactPaths,
);
assert.equal(exactR1C1R1Paths.length, 31);
assertLiteralSet(currentTaskPaths(r1C1R1BaselineSha), exactR1C1R1Paths);
if (phase === "reviewed") {
  assert.equal(reviewSyncPaths.length, 8);
  assert.doesNotThrow(() => git(["cat-file", "-e", `${resultCommitSha}^{commit}`]));
  assertLiteralSet(historicalPaths(baselineSha, resultCommitSha), exactPaths);
  assertLiteralSet(
    historicalPaths(resultCommitSha, r1C1R1BaselineSha),
    reviewSyncPaths,
  );
  for (const immutablePath of immutableExecutionPaths) {
    assert.equal(
      git(["show", `${r1C1R1BaselineSha}:${immutablePath}`]).replaceAll(
        "\r\n",
        "\n",
      ),
      git(["show", `${resultCommitSha}:${immutablePath}`]).replaceAll(
        "\r\n",
        "\n",
      ),
      `${immutablePath} changed after the immutable execution snapshot`,
    );
  }
}

for (const protectedPath of protectedPaths) {
  assert.equal(
    git([
      "diff",
      "--name-only",
      baselineSha,
      r1C1R1BaselineSha,
      "--",
      protectedPath,
    ]).trim(),
    "",
    `historical protected diff: ${protectedPath}`,
  );
  if (exactR1C1R1Paths.includes(protectedPath)) continue;
  assert.equal(
    git(["diff", "--name-only", baselineSha, "--", protectedPath]).trim(),
    "",
    `protected diff: ${protectedPath}`,
  );
}

assert.equal(r1bExactPaths.length, 22);
assertLiteralSet(
  historicalPaths(r1bBaselineSha, r1bAcceptedImplementationSha),
  r1bExactPaths,
);
assert.equal(r1bAcceptanceSyncPaths.length, 8);
assertLiteralSet(
  historicalPaths(r1bAcceptedImplementationSha, baselineSha),
  r1bAcceptanceSyncPaths,
);
for (const immutablePath of r1bExactPaths.filter(
  (item) =>
    !exactPaths.includes(item) && !exactR1C1R1Paths.includes(item),
)) {
  assert.equal(
    source(immutablePath).replaceAll("\r\n", "\n"),
    git(["show", `${baselineSha}:${immutablePath}`]).replaceAll("\r\n", "\n"),
    `${immutablePath} changed after the accepted R1-B baseline`,
  );
}

const contract = json(`${artifactRoot}/diagnostic-contract-v1.json`);
const caseBundle = json(`${artifactRoot}/diagnostic-cases-v1.json`);
const results = json(`${artifactRoot}/diagnostic-results-v1.json`);
const capabilities = json(`${artifactRoot}/capabilities-v1.json`);
assert.equal(contract.task_id, "M2-P4-I3-R1-C1");
assert.equal(contract.authorization_id, "M2-P4-I3-R1-C1-2026-08-01");
assert.equal(contract.confirmation_phrase, "R1-C1-12-CALL-SYNTHETIC-ONLY");
assert.equal(contract.baseline, baselineSha);
assert.equal(contract.main_baseline, mainBaselineSha);
assert.equal(contract.branch, branch);
assert.equal(contract.model, "gpt-5.6-luna");
assert.equal(contract.stage, "PB-01");
assert.equal(contract.synthetic_cases, 8);
assert.equal(contract.paired_cases, 4);
assert.deepEqual(contract.authorized_calls, { v4: 8, v3: 4, total: 12 });
assertLiteralSet(contract.exact_mutation_paths, exactPaths);
assertLiteralSet(contract.protected_paths, protectedPaths.slice(0, 20));
assert.deepEqual(contract.environment_allowlist, ["OPENAI_API_KEY", "OPENAI_MODEL"]);
assert.equal(contract.execution_limits.retries, 0);
assert.equal(contract.execution_limits.repair, 0);
assert.equal(contract.execution_limits.fallback, 0);
assert.equal(contract.execution_limits.pb_02_through_pb_06_calls, 0);
assert.equal(contract.execution_limits.db_operations, 0);
assert.equal(contract.execution_limits.supabase_operations, 0);
assert.equal(contract.execution_limits.holdout_cases, 0);
assert.equal(contract.execution_limits.real_user_cases, 0);
assert.equal(contract.execution_limits.automatic_extension, false);
assert.equal(contract.c2_authorized, false);

assert.equal(caseBundle.synthetic_only, true);
assert.equal(caseBundle.real_user_data, false);
assert.equal(caseBundle.db_records, false);
assert.equal(caseBundle.holdout_material, false);
assert.equal(caseBundle.runtime_case_lookup_authority, false);
assert.equal(caseBundle.cases.length, 8);
assert.equal(new Set(caseBundle.cases.map((item) => item.case_id)).size, 8);
assert.equal(caseBundle.cases.filter((item) => item.paired_v3_required).length, 4);
assert.equal(
  caseBundle.cases.filter((item) => item.input.optional_message !== null).length,
  4,
);
for (const item of caseBundle.cases) {
  assert.equal(item.input.privacy_acknowledged, true);
  assert.ok(Array.isArray(item.hard_assertions));
  assert.ok(Array.isArray(item.soft_assertions));
  assert.ok(Array.isArray(item.forbidden_assertions));
  assert.ok(Array.isArray(item.expected_source_ownership));
  assert.ok(item.expected_decision_fact_subset);
  assert.ok(item.expected_writing_context_subset);
  assert.ok(item.acceptable_value_sets);
  assert.equal(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/iu.test(
      JSON.stringify(item),
    ),
    false,
  );
}

const mainRunnerSource = source(
  "scripts/run-m2-p4-i3-r1-c1-provider-diagnostic.mjs",
);
const providerRunnerSource = source(
  "scripts/lib/m2-p4-i3-r1-c1-provider-runner.mjs",
);
const evaluatorSource = source("scripts/lib/m2-p4-i3-r1-c1-evaluator.mjs");
const executionSources = `${mainRunnerSource}\n${providerRunnerSource}`;
const envNames = [
  ...executionSources.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/gu),
].map((match) => match[1]);
assert.deepEqual(sorted([...new Set(envNames)]), sorted(contract.environment_allowlist));
assert.equal(/from\s+["'][^"']*supabase|import\(["'][^"']*supabase/iu.test(executionSources), false);
assert.equal(/assessment\/runtime\/(?:pipeline|application|service)\.ts/iu.test(providerRunnerSource), false);
assert.equal(/AssessmentPipeline|AssessmentApplication/gu.test(providerRunnerSource), false);
assert.equal((providerRunnerSource.match(/transport\.invoke\(/gu) ?? []).length, 1);
assert.equal(/\bwhile\s*\(/gu.test(providerRunnerSource), false);
assert.equal(/setTimeout|setInterval/gu.test(providerRunnerSource), false);
assert.equal(providerRunnerSource.includes("contract.authorized_calls.total"), true);
assert.equal(providerRunnerSource.includes('definition.stageId !== "PB-01"'), true);
assert.equal(providerRunnerSource.includes("OpenAiResponsesTransport"), true);
for (const required of [
  "loadM2P4ProductQualityRuntimeStageCatalog",
  "loadM2P4WritingContextRuntimeStageCatalog",
  "validateStageOutput",
  "groundStructuredIntakeV3",
  "validateContextualIntakeIntegrityV3",
  "groundStructuredIntakeV4",
  "validateWritingContextIntegrityV1",
  "buildStructuredIntakeLegacyViewV3",
]) {
  assert.equal(providerRunnerSource.includes(required), true, required);
}
assert.equal(/PAIR-0[1-4]|V4-0[5-8]/gu.test(evaluatorSource), false);
assert.equal(evaluatorSource.includes("switch (diagnosticCase.case_id)"), false);

assert.equal(capabilities.task_id, contract.task_id);
assert.equal(capabilities.baseline, baselineSha);
assert.equal(capabilities.exact_mutation_paths, 21);
assert.equal(capabilities.authorized_provider_calls, 12);
assert.equal(capabilities.synthetic_cases, 8);
assert.equal(capabilities.paired_cases, 4);
assert.equal(capabilities.model, contract.model);
assert.equal(capabilities.stage, "PB-01 only");
assert.equal(capabilities.retries, 0);
assert.equal(capabilities.repair, 0);
assert.equal(capabilities.fallback, 0);
assert.equal(capabilities.db_operations, 0);
assert.equal(capabilities.supabase_operations, 0);
assert.equal(capabilities.holdout_use, 0);
assert.equal(capabilities.real_user_data, 0);
assert.equal(capabilities.active_runtime_changed, false);
assert.equal(capabilities.c2_authorized, false);
assert.equal(capabilities.e1_status, "not_started");
assert.equal(capabilities.i3_final_acceptance, "pending");
assert.equal(capabilities.main_changed, false);
assert.equal(capabilities.milestone_2, "incomplete");

if (phase === "prepare") {
  assert.equal(results.status, "not_executed");
  assert.equal(results.started_at, null);
  assert.equal(results.completed_at, null);
  assert.equal(results.package_commit, null);
  assert.equal(results.calls_attempted, 0);
  assert.equal(results.calls_completed, 0);
  assert.deepEqual(results.cases, []);
  assert.deepEqual(results.aggregate_usage, {
    input_tokens: 0,
    cached_tokens: 0,
    output_tokens: 0,
    reasoning_tokens: 0,
  });
  assert.equal(results.evaluation.verdict, "NOT_EXECUTED");
  assert.equal(results.c2_eligible_for_review, false);
  assert.equal(results.c2_authorized, false);
  assert.equal(capabilities.status, "execution_authorized_not_started");
  assert.equal(capabilities.actual_provider_calls, 0);
  assert.equal(capabilities.completed_provider_calls, 0);
  assert.equal(capabilities.provider_diagnostic_verdict, "not_executed");
  assert.equal(
    source(`${artifactRoot}/diagnostic-summary-v1.md`).includes(
      "Status: `not_executed`",
    ),
    true,
  );
} else {
  assert.ok(
    results.status === "completed_pass" || results.status === "completed_fail",
  );
  assert.ok(typeof results.started_at === "string");
  assert.ok(typeof results.completed_at === "string");
  assert.equal(results.package_commit, packageCommitSha);
  assert.doesNotThrow(() => git(["cat-file", "-e", `${results.package_commit}^{commit}`]));
  assert.doesNotThrow(() =>
    git(["merge-base", "--is-ancestor", results.package_commit, "HEAD"]),
  );
  assert.equal(results.calls_attempted, results.cases.length);
  assert.ok(results.calls_attempted <= 12);
  assert.ok(results.calls_completed <= 12);
  assert.equal(results.calls_attempted, 12);
  assert.equal(
    results.calls_completed,
    results.cases.filter((call) => call.provider_completed === true).length,
  );
  assert.equal(new Set(results.cases.map((call) => call.call_sequence)).size, 12);
  assert.deepEqual(
    results.cases.map((call) => call.call_sequence),
    Array.from({ length: 12 }, (_, index) => index + 1),
  );
  const expectedCalls = caseBundle.cases.flatMap((item) => [
    ...(item.paired_v3_required ? [`${item.case_id}:v3`] : []),
    `${item.case_id}:v4`,
  ]);
  assert.deepEqual(
    results.cases.map((call) => `${call.case_id}:${call.contract_variant}`),
    expectedCalls,
  );
  assert.equal(results.retry_count, 0);
  assert.equal(results.repair_count, 0);
  assert.equal(results.fallback_count, 0);
  assert.equal(results.provider_diagnostic_only, true);
  assert.equal(results.active_runtime_changed, false);
  assert.equal(results.db_operations, 0);
  assert.equal(results.supabase_operations, 0);
  assert.equal(results.c2_authorized, false);
  assert.equal(
    existsSync(
      absolute(".git/moon-reply-r1-c1-provider-diagnostic-consumed.json"),
    ),
    true,
  );

  const rawSchemaPassed = results.cases.filter(
    (call) => call.validation?.raw_schema === true,
  ).length;
  const groundedSchemaPassed = results.cases.filter(
    (call) => call.validation?.grounded_schema === true,
  ).length;
  const v4IntegrityPassed = results.cases.filter(
    (call) =>
      call.contract_variant === "v4" && call.validation?.integrity === true,
  ).length;
  const v3IntegrityPassed = results.cases.filter(
    (call) =>
      call.contract_variant === "v3" && call.validation?.integrity === true,
  ).length;
  assert.equal(rawSchemaPassed, 12);
  assert.equal(groundedSchemaPassed, 12);
  assert.equal(v4IntegrityPassed, 0);
  assert.equal(v3IntegrityPassed, 3);

  for (const call of results.cases) {
    if (call.raw_typed_projection !== null) {
      assert.equal(call.raw_output_sha256, shaJson(call.raw_typed_projection));
    } else {
      assert.equal(call.raw_output_sha256, null);
    }
    if (call.grounded_typed_projection !== null) {
      assert.equal(
        call.grounded_output_sha256,
        shaJson(call.grounded_typed_projection),
      );
      assert.deepEqual(
        call.decision_facts,
        call.grounded_typed_projection.decision_facts,
      );
      assert.deepEqual(
        call.writing_context,
        call.contract_variant === "v4"
          ? call.grounded_typed_projection.writing_context
          : null,
      );
    } else {
      assert.equal(call.grounded_output_sha256, null);
    }
    if (call.legacy_typed_projection !== null) {
      assert.equal(call.legacy_view_sha256, shaJson(call.legacy_typed_projection));
    } else {
      assert.equal(call.legacy_view_sha256, null);
    }
  }

  const recomputeInput = structuredClone(results);
  const recomputed = evaluateDiagnostic(contract, caseBundle, recomputeInput);
  assert.deepEqual(results.evaluation, recomputed);
  assert.deepEqual(results.aggregate_usage, recomputed.aggregate_usage);
  assert.equal(
    results.status === "completed_pass",
    results.evaluation.verdict === "PASS",
  );
  assert.equal(
    results.c2_eligible_for_review,
    results.evaluation.verdict === "PASS",
  );
  assert.equal(
    source(`${artifactRoot}/diagnostic-summary-v1.md`),
    renderDiagnosticSummary(results),
  );

  const resultText = source(`${artifactRoot}/diagnostic-results-v1.json`);
  assert.equal(
    /\bsk-[A-Za-z0-9_-]{8,}|\bsb_secret_[A-Za-z0-9_-]{8,}|\bBearer\s+[A-Za-z0-9._~-]{8,}/iu.test(
      resultText,
    ),
    false,
  );
  const forbiddenKeys = new Set([
    "response_id",
    "responseId",
    "headers",
    "authorization_header",
    "provider_response",
    "response_envelope",
    "output_text",
    "api_key_hash",
  ]);
  assert.equal(
    recursivelyFindKeys(results).some((key) => forbiddenKeys.has(key)),
    false,
  );
  assert.equal(results.evaluation.secret_leakage_count, 0);
  assert.equal(capabilities.package_commit, results.package_commit);
  assert.equal(capabilities.actual_provider_calls, results.calls_attempted);
  assert.equal(capabilities.completed_provider_calls, results.calls_completed);
  assert.equal(
    capabilities.provider_diagnostic_verdict,
    results.evaluation.verdict,
  );
  assert.equal(
    capabilities.c2_eligible_for_review,
    results.c2_eligible_for_review,
  );
  const pendingReviewStatus =
    results.evaluation.verdict === "PASS"
      ? "provider_diagnostic_completed_pending_human_chatgpt_review"
      : "provider_diagnostic_failed_pending_human_chatgpt_review";
  if (phase === "reviewed") {
    assert.equal(results.status, "completed_fail");
    assert.equal(results.evaluation.verdict, "FAIL");
    assert.equal(capabilities.status, "human_chatgpt_reviewed_fail_complete");
    assert.equal(capabilities.execution_protocol_accepted, true);
    assert.equal(capabilities.product_gate_passed, false);
    assert.deepEqual(capabilities.execution_snapshot, {
      type: "historical_commit_range",
      base_commit_sha: baselineSha,
      end_commit_sha: resultCommitSha,
      exact_paths: 21,
      immutable_snapshot: true,
      include_working_tree: false,
    });
    assert.deepEqual(capabilities.execution_commits, [
      packageCommitSha,
      resultCommitSha,
    ]);
    assertLiteralSet(capabilities.review_sync_exact_paths, reviewSyncPaths);
    assert.equal(capabilities.review_sync_exact_path_count, 8);
    assert.equal(capabilities.provider_transport_calls, 12);
    assert.equal(capabilities.raw_schema_pass, "12/12");
    assert.equal(capabilities.grounded_schema_pass, "12/12");
    assert.equal(capabilities.writing_context_integrity, "0/8");
    assert.equal(capabilities.contextual_integrity_v3, "3/4");
    assert.equal(capabilities.current_style_evidence, "unavailable");
    assert.equal(
      capabilities.soft_assertion_evidence,
      "0/0_not_positive_evidence",
    );
    assert.equal(capabilities.decision_facts_material_regression, true);
    assert.deepEqual(capabilities.evaluator_limitations, [
      "composite viability naming",
      "assertion suppression after Integrity failure",
      "parity status coupling",
      "empty denominator is unavailable evidence",
    ]);
    assert.equal(capabilities.c2_eligible_for_review, false);
    assert.equal(capabilities.c2_authorized, false);
    assert.equal(capabilities.reexecution_authorized, false);
    assert.equal(capabilities.review_sync_openai_calls, 0);
    assert.equal(capabilities.review_sync_db_operations, 0);
    assert.equal(capabilities.review_sync_supabase_operations, 0);
    assert.equal(capabilities.review_sync_holdout_use, 0);
    assert.equal(
      capabilities.next_candidate,
      "M2-P4-I3-R1-C1-R1 Offline Diagnostic Postmortem and Grounding Responsibility Revision",
    );
    assert.equal(capabilities.next_candidate_authorized, false);
    assert.equal(results.evaluation.soft_assertions.total, 0);
    assert.equal(results.evaluation.soft_assertions.passed, 0);
    assert.equal(
      results.evaluation.hard_fail_codes.includes(
        "DECISION_FACTS_REGRESSION",
      ),
      true,
    );
    const pair03 = results.evaluation.paired_decision_facts_parity.cases.find(
      (item) => item.case_id === "PAIR-03",
    );
    const pair04 = results.evaluation.paired_decision_facts_parity.cases.find(
      (item) => item.case_id === "PAIR-04",
    );
    assert.deepEqual(sorted(pair03?.mismatched_critical_paths ?? []), [
      "/boundary_state/kind",
      "/boundary_state/status",
    ]);
    assert.deepEqual(pair04?.mismatched_critical_paths, [
      "/contact_state/usual_cadence_relation",
    ]);
    const reviewSource = source(
      "docs/phase2/TASK_M2_P4_I3_R1_C1_REVIEW.md",
    );
    for (const requiredConclusion of [
      "Provider/Schema transport itself succeeded.",
      "empty denominator is not positive evidence",
      "no_private_contact_at_work",
      "live v3 output is not a perfect oracle",
      "No paid rerun occurs before a separately authorized offline root-cause correction.",
    ]) {
      assert.equal(reviewSource.includes(requiredConclusion), true);
    }
  } else {
    assert.ok(
      capabilities.status === pendingReviewStatus ||
        capabilities.status === "human_chatgpt_reviewed_fail_complete",
    );
  }
}

for (const verifier of historicalVerifiers) {
  execFileSync("node", [absolute(verifier)], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

assert.equal(git(["diff", "--check", baselineSha, "--"]).trim(), "");
console.log("M2_P4_I3_R1_C1_PROVIDER_DIAGNOSTIC_PACKAGE: PASS");
console.log(`phase: ${phase}`);
console.log("baseline_ancestor: PASS");
console.log("cumulative_exact_scope: 21/21");
console.log("r1_b_accepted_snapshot: 22/22 immutable");
console.log("r1_b_acceptance_sync: 8/8 immutable");
console.log("synthetic_cases: 8/8");
console.log("paired_cases: 4/4");
console.log("authorized_calls: 12");
console.log("historical_verifiers: 8/8");
console.log("protected_diff: 0");
console.log("active_runtime_changed: false");
console.log("c2_authorized: false");
if (phase === "reviewed") {
  console.log("execution_snapshot: 21/21 immutable");
  console.log("review_sync_scope: 8/8");
  console.log("execution_protocol_accepted: true");
  console.log("product_gate_passed: false");
  console.log("raw_schema: 12/12");
  console.log("grounded_schema: 12/12");
  console.log("writing_context_integrity: 0/8");
  console.log("reexecution_authorized: false");
}
