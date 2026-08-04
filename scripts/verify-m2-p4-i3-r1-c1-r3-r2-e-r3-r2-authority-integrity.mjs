import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAuthorityIntegrityOffline } from "./lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r2-offline-runner-v1.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R2";
const taskRoot = "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r2";
const frozenRoot = "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r2-authority-integrity";
const baseline = "e8db575adc9636032997c8e3d43f8a56e38fae15";
const commitA = "e96774e093b48966f3f9c2679ac778c1aacb8e23";
const abortedCommit = "b909bf3ad259bea0251cf2f81e7a40d9262ce211";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";

const paths = {
  contract: `${taskRoot}/remediation-contract-v1.json`,
  fixtures: `${taskRoot}/remediation-fixtures-v1.json`,
  result: `${taskRoot}/offline-results-v1.json`,
  audit: `${taskRoot}/evidence-audit-v1.json`,
  correctedReview: `${taskRoot}/product-review-corrected-v1.md`,
  capabilities: `${taskRoot}/capabilities-v1.json`,
  review: "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R2_REVIEW.md",
  frozenContract: `${frozenRoot}/diagnostic-contract-v1.json`,
  frozenResult: `${frozenRoot}/diagnostic-results-v1.json`,
  catalogV10:
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v10.json",
  catalogV11:
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v11.json",
  baseSchemaV2:
    "lib/assessment/runtime/contracts/base-structured-intake-v2.schema.json",
};

if (path.resolve(process.cwd()) !== repositoryRoot) {
  throw new Error(`Run from repository root: ${repositoryRoot}`);
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
}

function git(...args) {
  const completed = run("git.exe", [
    "-c",
    "safe.directory=C:/projects/moon-reply",
    ...args,
  ]);
  if (completed.error || completed.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed\n${completed.stdout ?? ""}${completed.stderr ?? ""}`,
    );
  }
  return completed.stdout.trim();
}

function gitSucceeds(...args) {
  const completed = run("git.exe", [
    "-c",
    "safe.directory=C:/projects/moon-reply",
    ...args,
  ]);
  return !completed.error && completed.status === 0;
}

const readText = (relativePath) =>
  readFileSync(path.join(repositoryRoot, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const canonicalText = (value) => value.replace(/\r\n/gu, "\n");
const lines = (value) => value.split(/\r?\n/u).filter(Boolean);
const sorted = (values) =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right, "en"));

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

const same = (left, right) =>
  JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));

const checks = [];
function check(label, condition) {
  checks.push({ label, passed: Boolean(condition) });
  assert.equal(Boolean(condition), true, label);
}

function currentScope() {
  return sorted([
    ...lines(git("diff", "--name-only", baseline, "--")),
    ...lines(git("ls-files", "--others", "--exclude-standard")),
  ]);
}

function unchangedSinceBaseline(relativePaths) {
  const changed = new Set(currentScope());
  return relativePaths.every((relativePath) => !changed.has(relativePath));
}

function extractAsyncFunction(source, functionName) {
  const normalized = canonicalText(source);
  const marker = `export async function ${functionName}(`;
  const start = normalized.indexOf(marker);
  if (start < 0) return null;
  const next = normalized.indexOf("\nexport async function ", start + marker.length);
  return normalized.slice(start, next < 0 ? undefined : next).trimEnd();
}

function qualityGate(label, command, args) {
  console.log(`gate: ${label}`);
  const completed = run(command, args);
  if (completed.error || completed.status !== 0) {
    process.stdout.write(completed.stdout ?? "");
    process.stderr.write(completed.stderr ?? "");
  }
  check(label, !completed.error && completed.status === 0);
  return `${completed.stdout ?? ""}${completed.stderr ?? ""}`;
}

function npmGate(script) {
  if (process.platform === "win32") {
    return qualityGate(
      `npm run ${script} PASS`,
      "cmd.exe",
      ["/d", "/c", "npm.cmd", "run", script],
    );
  }
  return qualityGate(`npm run ${script} PASS`, "npm", ["run", script]);
}

const contract = readJson(paths.contract);
const fixtures = readJson(paths.fixtures);
const committedResult = readJson(paths.result);
const committedAudit = readJson(paths.audit);
const capabilities = readJson(paths.capabilities);
const frozenContract = readJson(paths.frozenContract);
const frozenResult = readJson(paths.frozenResult);
const manifestV10 = readJson(paths.catalogV10);
const manifestV11 = readJson(paths.catalogV11);
const baseSchemaV1 = readJson(
  "lib/assessment/runtime/contracts/base-structured-intake-v1.schema.json",
);
const baseSchemaV2 = readJson(paths.baseSchemaV2);
const packageJson = readJson("package.json");

check("branch exact", git("branch", "--show-current") === expectedBranch);
check("baseline is in current history", gitSucceeds("merge-base", "--is-ancestor", baseline, "HEAD"));
check("E-R3 Commit A is in current history", gitSucceeds("merge-base", "--is-ancestor", commitA, "HEAD"));
check("E-R3 Commit B is exact baseline", contract.baseline === baseline);
check("old aborted package commit exists unchanged", git("rev-parse", `${abortedCommit}^{commit}`) === abortedCommit);
check("main unchanged", git("rev-parse", "refs/heads/main") === mainBaseline);
check("origin/main unchanged", git("rev-parse", "refs/remotes/origin/main") === mainBaseline);
check("stash empty", git("stash", "list") === "");
check("contract exact scope has 25 unique paths", contract.exact_scope.length === 25 && new Set(contract.exact_scope).size === 25);
check("exact scope 25/25", same(currentScope(), sorted(contract.exact_scope)));
check("all exact-scope paths exist", contract.exact_scope.every((relativePath) => existsSync(path.join(repositoryRoot, relativePath))));

const rollingDocuments = new Set([
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
]);
const frozenEPaths = frozenContract.exact_mutation_paths.filter(
  (relativePath) => !rollingDocuments.has(relativePath),
);
const v10PromptPaths = manifestV10.stages.map(({ prompt_path: promptPath }) => promptPath);
const oldSchemaPaths = [
  "lib/assessment/runtime/contracts/base-structured-intake-v1.schema.json",
  "lib/assessment/runtime/contracts/candidate-analysis-v1.schema.json",
  "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
  "lib/assessment/runtime/contracts/report-content-v2.schema.json",
  "ai/schemas/validation-result.schema.json",
];
const protectedRuntimePaths = [
  "lib/assessment/runtime/base-structured-intake-grounding-v2.ts",
  "lib/assessment/runtime/semantic-disposition-v4.ts",
  "supabase/migrations/0004_m2_p4_candidate_source_isolation.sql",
  "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/application.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
];

check("E-R3 evidence and original review unchanged", unchangedSinceBaseline(frozenEPaths));
check("Catalog v10 unchanged", unchangedSinceBaseline([paths.catalogV10]));
check("all v10 Prompt files unchanged", unchangedSinceBaseline(v10PromptPaths));
check("old Schemas unchanged", unchangedSinceBaseline(oldSchemaPaths));
check("Grounding v2, Semantic Disposition v4, migrations, Service, Application, and Active Catalog unchanged", unchangedSinceBaseline(protectedRuntimePaths));

const currentCatalogSource = readText("lib/assessment/runtime/schema-catalog.ts");
const baselineCatalogSource = git(
  "show",
  `${baseline}:lib/assessment/runtime/schema-catalog.ts`,
);
check(
  "v10 loader unchanged",
  extractAsyncFunction(
    currentCatalogSource,
    "loadM2P4DirectionalGuidanceRuntimeStageCatalog",
  ) ===
    extractAsyncFunction(
      baselineCatalogSource,
      "loadM2P4DirectionalGuidanceRuntimeStageCatalog",
    ),
);
check(
  "Active loader unchanged",
  extractAsyncFunction(
    currentCatalogSource,
    "loadM2P4ProductQualityRuntimeStageCatalog",
  ) ===
    extractAsyncFunction(
      baselineCatalogSource,
      "loadM2P4ProductQualityRuntimeStageCatalog",
    ),
);
check(
  "Active Service still selects Catalog v4 loader",
  readText("lib/assessment/runtime/service.ts").includes(
    "loadM2P4ProductQualityRuntimeStageCatalog",
  ),
);

const {
  loadM2P4AuthorityIntegrityRuntimeStageCatalog,
  loadM2P4DirectionalGuidanceRuntimeStageCatalog,
} = await import("../lib/assessment/runtime/schema-catalog.ts");
const { createActionContextV1 } = await import(
  "../lib/assessment/runtime/runtime-authority-v1.ts"
);
const [catalogV10, catalogV11] = await Promise.all([
  loadM2P4DirectionalGuidanceRuntimeStageCatalog(),
  loadM2P4AuthorityIntegrityRuntimeStageCatalog(),
]);

check(
  "v11 identity exact",
  catalogV11.catalogVersion === "runtime-stage-catalog-v11.0.0" &&
    catalogV11.promptBundleVersion === "prompt-bundle-runtime-v11.0.0" &&
    catalogV11.schemaSetVersion === "pipeline-schema-runtime-v5.0.0" &&
    catalogV11.stageTopologyVersion === "split-base-candidate-v1" &&
    manifestV11.baseline === baseline,
);
check(
  "v11 Stage order 7/7",
  same(
    catalogV11.definitions.map(({ stageId }) => stageId),
    ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
  ),
);
check(
  "v10 predecessor identity exact",
  catalogV10.catalogVersion === "runtime-stage-catalog-v10.0.0" &&
    catalogV10.promptBundleVersion === "prompt-bundle-runtime-v10.0.0" &&
    catalogV10.schemaSetVersion === "pipeline-schema-runtime-v4.0.0",
);

const stageV10 = Object.fromEntries(manifestV10.stages.map((stage) => [stage.stage_id, stage]));
const stageV11 = Object.fromEntries(manifestV11.stages.map((stage) => [stage.stage_id, stage]));
const definitionV10 = Object.fromEntries(catalogV10.definitions.map((stage) => [stage.stageId, stage]));
const definitionV11 = Object.fromEntries(catalogV11.definitions.map((stage) => [stage.stageId, stage]));
check("PB-01C manifest deep-equal to v10", same(stageV11["PB-01C"], stageV10["PB-01C"]));
check("PB-02 / PB-03 manifests deep-equal to v10", ["PB-02", "PB-03"].every((stageId) => same(stageV11[stageId], stageV10[stageId])));
check("PB-02 / PB-03 loaded definitions deep-equal to v10", ["PB-02", "PB-03"].every((stageId) => same(definitionV11[stageId], definitionV10[stageId])));
check(
  "PB-04 / PB-05 / PB-06 output Schemas unchanged",
  ["PB-04", "PB-05", "PB-06"].every((stageId) =>
    same(definitionV11[stageId].outputSchema, definitionV10[stageId].outputSchema),
  ),
);
check(
  "PB-01 v3 uses Base Schema and Grounding Schema v2",
  stageV11["PB-01"].prompt_version === "v3.0.0" &&
    stageV11["PB-01"].schema_version === "pipeline-schema-base-v2.0.0" &&
    stageV11["PB-01"].grounded_schema_version === "pipeline-schema-base-v2.0.0",
);
check("v11 hashes, AJV, and Structured Output projection PASS", catalogV11.definitions.length === 7);

const constraintSchema = baseSchemaV2.$defs.user_contact_constraint;
check(
  "Base Schema v2 identity and required constraint",
  baseSchemaV2.properties.schema_version.const === "pipeline-schema-base-v2.0.0" &&
    baseSchemaV2.$defs.decision_facts.required.includes("user_contact_constraint") &&
    baseSchemaV2.$defs.decision_facts.properties.schema_version.const ===
      "m2-p4-base-decision-facts-v2",
);
const v1CompatibilityProjection = structuredClone(baseSchemaV2);
v1CompatibilityProjection.$id = baseSchemaV1.$id;
v1CompatibilityProjection.title = baseSchemaV1.title;
v1CompatibilityProjection.properties.schema_version.const =
  baseSchemaV1.properties.schema_version.const;
v1CompatibilityProjection.$defs.decision_facts.required =
  v1CompatibilityProjection.$defs.decision_facts.required.filter(
    (propertyName) => propertyName !== "user_contact_constraint",
  );
delete v1CompatibilityProjection.$defs.decision_facts.properties
  .user_contact_constraint;
v1CompatibilityProjection.$defs.decision_facts.properties.schema_version.const =
  baseSchemaV1.$defs.decision_facts.properties.schema_version.const;
delete v1CompatibilityProjection.$defs.user_contact_constraint;
check(
  "Base Schema v2 preserves every v1 field",
  same(v1CompatibilityProjection, baseSchemaV1),
);
check(
  "Base Schema v2 legal combinations exact",
  constraintSchema.anyOf.length === 3 &&
    constraintSchema.anyOf[0].properties.kind.const === "none" &&
    constraintSchema.anyOf[0].properties.status.const === "none" &&
    constraintSchema.anyOf[0].properties.supporting_fact_ids.maxItems === 0 &&
    constraintSchema.anyOf[1].properties.kind.const === "unknown" &&
    constraintSchema.anyOf[1].properties.status.const === "unknown" &&
    constraintSchema.anyOf[1].properties.supporting_fact_ids.maxItems === 0 &&
    same(constraintSchema.anyOf[2].properties.kind.enum, [
      "no_followup_message",
      "business_only",
    ]) &&
    constraintSchema.anyOf[2].properties.status.const === "explicit" &&
    constraintSchema.anyOf[2].properties.supporting_fact_ids.minItems === 1 &&
    constraintSchema.anyOf[2].properties.supporting_fact_ids.maxItems === 20 &&
    constraintSchema.anyOf[2].properties.supporting_fact_ids.uniqueItems === true &&
    constraintSchema.anyOf.every(
      (entry) =>
        entry.properties.supporting_fact_ids.items.pattern === "^F[0-9]{3}$",
    ),
);

const fixedNow = "2026-08-05T10:00:00.000Z";
const tokyoContext = createActionContextV1({
  trustedNowIso: fixedNow,
  timeZone: "Asia/Tokyo",
});
const newYorkContext = createActionContextV1({
  trustedNowIso: fixedNow,
  timeZone: "America/New_York",
});
let missingTimeZoneCode = null;
try {
  createActionContextV1({ trustedNowIso: fixedNow, timeZone: undefined });
} catch (error) {
  missingTimeZoneCode = error?.safeCode ?? error?.message ?? null;
}
check(
  "action context deterministic across explicit timezones",
  tokyoContext.action_horizon.ends_at === "2026-08-05T15:00:00.000Z" &&
    newYorkContext.action_horizon.ends_at === "2026-08-06T04:00:00.000Z" &&
    tokyoContext.authority === "application" &&
    newYorkContext.authority === "application",
);
check("missing timezone fails closed", missingTimeZoneCode === "M2_RUNTIME_AUTHORITY_INVALID");
const authoritySource = readText("lib/assessment/runtime/runtime-authority-v1.ts");
check(
  "no implicit machine timezone",
  !/Date\.now\s*\(/u.test(authoritySource) &&
    !/new Date\s*\(\s*\)/u.test(authoritySource) &&
    !authoritySource.includes("getTimezoneOffset") &&
    !authoritySource.includes("process.env.TZ") &&
    !authoritySource.includes("toLocaleString"),
);

const baseSchemaText = readText(paths.baseSchemaV2);
const candidateSchemaText = readText(
  "lib/assessment/runtime/contracts/candidate-analysis-v1.schema.json",
);
const pipelineSource = readText("lib/assessment/runtime/pipeline.ts");
check(
  "Application-owned authority remains isolated",
  !baseSchemaText.includes('"action_context"') &&
    !baseSchemaText.includes('"contact_constraint_policy"') &&
    !candidateSchemaText.includes('"action_context"') &&
    !candidateSchemaText.includes('"contact_constraint_policy"') &&
    pipelineSource.includes("trustedNowIso: runContext.startedAt") &&
    pipelineSource.includes("delete projected.user_contact_constraint") &&
    pipelineSource.includes("validateDecisionPlanConstraintIntegrityV1"),
);

const constraintSource = readText(
  "lib/assessment/runtime/decision-plan-constraint-integrity-v1.ts",
);
check(
  "no raw Japanese substring Production policy",
  !constraintSource.includes("追いLINE") &&
    !constraintSource.includes(".includes(") &&
    !constraintSource.includes(".match(") &&
    !constraintSource.includes(".search(") &&
    !constraintSource.includes("RegExp("),
);
check(
  "Decision Plan v2 limitations recorded",
  contract.decision_plan_v2_enforcement.recorded_limitations.length === 4 &&
    contract.decision_plan_v2_enforcement.production_raw_japanese_substring_matching === false &&
    contract.decision_plan_v2_enforcement.decision_plan_v2_schema_changed === false &&
    unchangedSinceBaseline([
      "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
    ]),
);

const generated = await runAuthorityIntegrityOffline();
check("offline result artifact deterministic", same(generated.result, committedResult));
check("evidence audit artifact deterministic", same(generated.evidenceAudit, committedAudit));
check(
  "corrected Product Review artifact deterministic",
  canonicalText(generated.correctedReview) === canonicalText(readText(paths.correctedReview)),
);
check("all required fixtures present exactly once", fixtures.fixtures.length === 28 && new Set(fixtures.fixtures.map(({ fixture_id: fixtureId }) => fixtureId)).size === 28);
check("all fixtures PASS 28/28", committedResult.overall_verdict === "PASS" && committedResult.fixture_summary.overall === "28/28" && committedResult.fixture_results.every(({ status }) => status === "PASS"));
check("timing fixtures PASS 6/6", committedResult.fixture_summary.temporal_authority === "6/6");
check("nofollow/contact fixtures PASS 5/5", committedResult.fixture_summary.contact_constraint === "5/5");
check("Candidate Grounding v2 fixtures PASS 7/7", committedResult.fixture_summary.candidate_grounding === "7/7");
check("Runtime fixtures PASS 5/5", committedResult.fixture_summary.runtime === "5/5");
check("evidence review fixtures PASS 5/5", committedResult.fixture_summary.evidence_review === "5/5");
check("v9 parity PASS", committedResult.parity.v9 === "PASS");
check("v10 parity PASS", committedResult.parity.v10 === "PASS");
check(
  "v11 exact Provider input keys",
  committedResult.provider_input_keys_exact === true &&
    Object.entries(contract.provider_input_keys).every(([stageId, expectedKeys]) =>
      same(committedResult.provider_input_keys[stageId], [...expectedKeys].sort()),
    ),
);
check(
  "missing-timezone and nofollow Runtime paths fail closed",
  committedResult.runtime_flows.missing_timezone.outcome === "M2_RUNTIME_AUTHORITY_INVALID" &&
    committedResult.runtime_flows.missing_timezone.fake_stage_path.length === 0 &&
    committedResult.runtime_flows.nofollow_violation.outcome ===
      "M2_PLAN_CONSTRAINT_INTEGRITY_FAILED",
);

check(
  "frozen machine verdict remains FAIL / 1 of 6",
  frozenResult.evaluation.verdict === "FAIL" &&
    frozenResult.evaluation.metrics.hard_gates.passed === 1 &&
    frozenResult.evaluation.metrics.hard_gates.total === 6 &&
    committedResult.frozen_e_r3_machine_verdict === "FAIL",
);
check(
  "independent frozen request/output hashes PASS",
  committedAudit.authority === "independent_offline_recomputation" &&
    committedAudit.overall_verdict === "PASS" &&
    committedAudit.request_hashes.matched === 37 &&
    committedAudit.request_hashes.total === 37 &&
    committedAudit.raw_output_hashes.matched === 37 &&
    committedAudit.raw_output_hashes.after_processing_matched === 37 &&
    committedAudit.raw_output_hashes.total === 37,
);
check(
  "response IDs 37/37 unique and forbidden keys 0",
  committedAudit.response_ids.present === 37 &&
    committedAudit.response_ids.unique === 37 &&
    committedAudit.response_ids.total === 37 &&
    committedAudit.forbidden_provider_input_keys.hit_count === 0,
);
check(
  "Stage counts, final presence, errors, and PB-06 findings audited",
  committedAudit.case_reviews.length === 6 &&
    committedAudit.case_reviews.every(
      (row) =>
        row.stage_count_matches === true &&
        typeof row.final_result_present === "boolean" &&
        Object.hasOwn(row, "safe_error_code") &&
        Array.isArray(row.pb_06_blocking_findings),
    ),
);

const correctedReview = readText(paths.correctedReview);
const rejectedRows = committedAudit.case_reviews.filter(
  ({ final_result_present: finalResultPresent }) => !finalResultPresent,
);
check(
  "null final results are labelled rejected intermediate artifacts",
  rejectedRows.length === 5 &&
    rejectedRows.every(
      (row) =>
        row.intermediate_artifact_label === "棄却された中間生成物" &&
        !row.accepted_final_draft_present &&
        !row.accepted_final_report_present,
    ) &&
    (correctedReview.match(/棄却された中間生成物/gu) ?? []).length >= 5,
);
check(
  "corrected Product Review has no false final labels",
  !correctedReview.includes("最終返信案") &&
    !correctedReview.includes("最終鑑定文") &&
    !/final output/iu.test(correctedReview),
);
check(
  "accepted outputs project only from present final results",
  committedAudit.case_reviews.every(
    (row) =>
      row.final_result_present ||
      (!row.accepted_final_draft_present && !row.accepted_final_report_present),
  ),
);

check(
  "Provider / DB / Supabase operations 0 / 0 / 0",
  committedResult.operations.external_provider_calls === 0 &&
    committedResult.operations.db_operations === 0 &&
    committedResult.operations.supabase_operations === 0 &&
    committedAudit.provider_calls === 0 &&
    committedAudit.db_operations === 0 &&
    committedAudit.supabase_operations === 0 &&
    capabilities.provider_calls === 0 &&
    capabilities.db_operations === 0 &&
    capabilities.supabase_operations === 0,
);
check(
  "retry / repair / fallback operations 0 / 0 / 0",
  committedResult.operations.retry_calls === 0 &&
    committedResult.operations.repair_calls === 0 &&
    committedResult.operations.fallback_calls === 0,
);
check(
  "capability state exact and R4 unauthorized",
  capabilities.status === "implementation_pending_human_chatgpt_review" &&
    capabilities.catalog_version === "runtime-stage-catalog-v11.0.0" &&
    capabilities.prompt_bundle_version === "prompt-bundle-runtime-v11.0.0" &&
    capabilities.schema_set_version === "pipeline-schema-runtime-v5.0.0" &&
    capabilities.action_context_created === true &&
    capabilities.contact_constraint_policy_created === true &&
    capabilities.candidate_grounding_v2_created === true &&
    capabilities.product_review_projection_corrected === true &&
    capabilities.provider_quality_established === false &&
    capabilities.provider_rerun_ready === false &&
    capabilities.provider_rerun_authorized === false &&
    capabilities.active_runtime_activated === false &&
    capabilities.r4_ready === false &&
    capabilities.r4_authorized === false &&
    capabilities.c2_authorized === false,
);

const reviewDocument = readText(paths.review);
check(
  "review records pending Human boundary",
  reviewDocument.includes("implementation_pending_human_chatgpt_review") &&
    reviewDocument.includes("Human / ChatGPT review: pending") &&
    reviewDocument.includes("Implementation acceptance: not established") &&
    reviewDocument.includes("Provider quality established: `false`") &&
    reviewDocument.includes("R4 ready / authorized: `false / false`"),
);
check(
  "rolling documentation synchronized",
  ["docs/CURRENT_FOCUS.md", "docs/WBS.md", "docs/CODEX_HANDOFF.md"].every(
    (relativePath) => {
      const document = readText(relativePath);
      return (
        document.includes(`${taskId}:BEGIN`) &&
        document.includes("implementation_pending_human_chatgpt_review") &&
        document.includes("28/28") &&
        document.includes("FAIL / 1 of 6") &&
        document.includes("0 / 0 / 0") &&
        document.includes("R4")
      );
    },
  ),
);

const runnerSource = readText(
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r2-offline-runner-v1.mjs",
);
check(
  "offline runner has no external execution path",
  !runnerSource.includes("node:http") &&
    !runnerSource.includes("node:https") &&
    !/\bfetch\s*\(/u.test(runnerSource) &&
    !runnerSource.includes("process.env") &&
    !runnerSource.includes("e-r3-evaluator-v1.mjs"),
);

const policyOutput = qualityGate(
  "Decision Policy verifier PASS",
  process.execPath,
  ["evals/quality/m2-p4-i1/verify-decision-policy.mjs"],
);
check(
  "Policy 40/40",
  policyOutput.includes("M2_P4_I1_TYPED_POLICY: PASS") &&
    policyOutput.includes("total: 40/40"),
);
npmGate("typecheck");
npmGate("lint");
check(
  "lint warnings 0",
  packageJson.scripts.lint.includes("--max-warnings=0"),
);
npmGate("build");
check("git diff --check PASS", gitSucceeds("diff", "--check", baseline, "--"));
check("exact scope remains 25/25 after quality gates", same(currentScope(), sorted(contract.exact_scope)));
check("protected paths remain unchanged after quality gates", unchangedSinceBaseline([...frozenEPaths, paths.catalogV10, ...v10PromptPaths, ...oldSchemaPaths, ...protectedRuntimePaths]));
check("main remains unchanged after quality gates", git("rev-parse", "refs/heads/main") === mainBaseline && git("rev-parse", "refs/remotes/origin/main") === mainBaseline);

console.log(`${taskId} AUTHORITY_INTEGRITY_VERIFIER: PASS`);
console.log(`checks: ${checks.length}/${checks.length}`);
console.log("exact_scope: 25/25");
console.log("fixtures: 28/28");
console.log("timing / nofollow / Candidate: 6/6 / 5/5 / 7/7");
console.log("v9 / v10 parity: PASS / PASS");
console.log("frozen request/raw hashes: 37/37 / 37/37");
console.log("response IDs unique / forbidden keys: 37/37 / 0");
console.log("Policy / typecheck / lint / build: 40/40 / PASS / 0 warnings / PASS");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("Active Service / main: unchanged / unchanged");
console.log("R4 authorized: false");
