import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseSha = "ea4acd5d3620fb546e5cf7bc0d1f7db414c54ebc";
const migrationPath =
  "supabase/migrations/0015_m1_4_skipped_stage_constraint_alignment.sql";
const historicalSeedPath =
  "supabase/tests/m1_4_skipped_stage_constraint_historical_seed_r1.sql";
const regressionPath =
  "supabase/tests/m1_4_skipped_stage_constraint_r1.sql";
const expectedChangedPaths = [
  "package.json",
  "scripts/verify-m1-4-skipped-stage-constraint.mjs",
  migrationPath,
  historicalSeedPath,
  regressionPath,
].sort();

function gitText(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  ).trim();
}

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function lines(value) {
  return value === "" ? [] : value.split(/\r?\n/u).filter(Boolean);
}

let passed = 0;

function check(name, callback) {
  callback();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

check("exact authority base and task branch are present", () => {
  assert.equal(
    gitText(["rev-parse", `${baseSha}^{commit}`]),
    baseSha,
    "exact authority base is unavailable",
  );
  assert.equal(
    gitText(["branch", "--show-current"]),
    "task/m1-4-skipped-stage-constraint-r1",
  );
});

check("task diff is confined to the five authorized files", () => {
  const tracked = lines(gitText(["diff", "--name-only", baseSha, "--"]));
  const untracked = lines(
    gitText(["ls-files", "--others", "--exclude-standard"]),
  );
  assert.deepEqual([...new Set([...tracked, ...untracked])].sort(), expectedChangedPaths);
});

check("0015 is the sole append-only migration and is transaction bounded", () => {
  assert.equal(existsSync(path.join(root, migrationPath)), true);
  const migrationNames = lines(
    gitText(["ls-files", "--others", "--exclude-standard", "supabase/migrations"]),
  ).concat(
    lines(gitText(["diff", "--name-only", baseSha, "--", "supabase/migrations"])),
  );
  assert.deepEqual([...new Set(migrationNames)], [migrationPath]);
  const source = readText(migrationPath);
  assert.equal((source.match(/^begin;$/gmu) ?? []).length, 1);
  assert.equal((source.match(/^commit;$/gmu) ?? []).length, 1);
  assert.ok(source.indexOf("begin;") < source.lastIndexOf("commit;"));
});

check("accepted migrations 0002 through 0014 remain byte-authoritative", () => {
  assert.equal(
    gitText([
      "diff",
      "--name-only",
      baseSha,
      "--",
      "supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql",
      "supabase/migrations/0003_m2_p3_atomic_finalization.sql",
      "supabase/migrations/0004_m2_p4_candidate_source_isolation.sql",
      "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql",
      "supabase/migrations/0006_m2_p4_jpy980_clarification_lifecycle.sql",
      "supabase/migrations/0007_m2_p4_jpy980_semantic_depth_runtime_identity.sql",
      "supabase/migrations/0008_m2_p4_jpy980_semantic_quality_runtime_identity.sql",
      "supabase/migrations/0009_m2_p4_jpy980_quality_reassessment.sql",
      "supabase/migrations/0010_rc1_production_fulfillment_core.sql",
      "supabase/migrations/0011_rc2_production_payment_delivery.sql",
      "supabase/migrations/0012_rc2_activation_database_hardening.sql",
      "supabase/migrations/0013_rc2_service_role_acl_hardening.sql",
      "supabase/migrations/0014_customer_identity_authority_v1.sql",
    ]),
    "",
  );
});

check("stale constraint is replaced exactly once without data rewriting", () => {
  const source = readText(migrationPath);
  assert.equal(
    (source.match(/drop constraint assessment_stage_runs_skipped_invariants/gu) ?? [])
      .length,
    1,
  );
  assert.equal(
    (source.match(/add constraint assessment_stage_runs_skipped_invariants/gu) ?? [])
      .length,
    1,
  );
  assert.doesNotMatch(
    source,
    /\b(?:insert\s+into|update\s+public|delete\s+from|truncate|drop\s+table|create\s+(?:or\s+replace\s+)?function|drop\s+function|create\s+trigger|drop\s+trigger|grant|revoke)\b/iu,
  );
  assert.doesNotMatch(source, /\bnot valid\b/iu);
});

check("replacement check owns only skipped-row structural invariants", () => {
  const source = readText(migrationPath);
  const checkStart = source.indexOf(
    "add constraint assessment_stage_runs_skipped_invariants",
  );
  const checkEnd = source.indexOf("comment on constraint", checkStart);
  const definition = source.slice(checkStart, checkEnd);
  assert.ok(checkStart >= 0 && checkEnd > checkStart);
  assert.match(definition, /status <> 'skipped'/u);
  for (const nullableField of [
    "response_id",
    "returned_model",
    "output_json",
    "error_code",
  ]) {
    assert.match(definition, new RegExp(`${nullableField} is null`, "u"));
  }
  for (const zeroField of [
    "input_tokens",
    "cached_tokens",
    "output_tokens",
    "reasoning_tokens",
    "latency_ms",
  ]) {
    assert.match(definition, new RegExp(`${zeroField} = 0`, "u"));
  }
  for (const contextualField of [
    "run_kind",
    "stage_id",
    "sequence_number",
    "attempt_number",
    "skip_reason",
  ]) {
    assert.doesNotMatch(definition, new RegExp(`\\b${contextualField}\\b`, "u"));
  }
});

check("trigger v5 remains the contextual skip-policy authority", () => {
  const source = readText(
    "supabase/migrations/0010_rc1_production_fulfillment_core.sql",
  );
  assert.match(source, /create function public\.enforce_assessment_stage_topology_v5\(\)/u);
  assert.match(source, /parent_run_kind = 'initial'[\s\S]*?new\.stage_id = 'PB-01C'[\s\S]*?new\.skip_reason = 'candidate_absent'/u);
  assert.match(source, /parent_run_kind = 'clarification_resume'[\s\S]*?new\.stage_id in \('PB-01C', 'PB-02', 'PB-03'\)[\s\S]*?new\.skip_reason = 'reused_initial_authority'/u);
  assert.match(source, /parent_run_kind = 'fulfillment_resume'[\s\S]*?new\.stage_id in \('PB-01', 'PB-01C', 'PB-02', 'PB-03'\)[\s\S]*?new\.skip_reason = 'reused_purchase_ready_authority'/u);
  assert.match(source, /new\.attempt_number = 2 and not \([\s\S]*?new\.status <> 'skipped'/u);
});

check("skip-reason constraint remains the closed reason vocabulary", () => {
  const source = readText(
    "supabase/migrations/0010_rc1_production_fulfillment_core.sql",
  );
  const reasonStart = source.indexOf(
    "add constraint assessment_stage_runs_skip_reason",
  );
  const reasonEnd = source.indexOf(
    "drop trigger assessment_stage_runs_topology_v4",
    reasonStart,
  );
  const definition = source.slice(reasonStart, reasonEnd);
  for (const reason of [
    "candidate_absent",
    "reused_initial_authority",
    "reused_purchase_ready_authority",
    "routing_stopped",
  ]) {
    assert.match(definition, new RegExp(`'${reason}'`, "u"));
  }
  assert.match(definition, /status <> 'skipped' and skip_reason is null/u);
});

check("current fulfillment path emits the four authorized reused stages", () => {
  const source = readText("lib/assessment/runtime/pipeline.ts");
  const start = source.indexOf('runKind: "fulfillment_resume"');
  const end = source.indexOf("return await this.completeV1A2Ready", start);
  const fulfillment = source.slice(start, end);
  assert.ok(start >= 0 && end > start);
  for (const stage of ["PB-01", "PB-01C", "PB-02", "PB-03"]) {
    assert.match(
      fulfillment,
      new RegExp(
        `this\\.skipReusedStage\\(\\s*runContext,\\s*"${stage}",\\s*"reused_purchase_ready_authority"`,
        "u",
      ),
    );
  }
  assert.equal(
    (fulfillment.match(/"reused_purchase_ready_authority"/gu) ?? []).length,
    4,
  );
});

check("regression assets cover pre-0015 history and acceptance matrix A-C", () => {
  const seed = readText(historicalSeedPath);
  const regression = readText(regressionPath);
  assert.match(seed, /PROOF_EXPECTED_STALE_CONSTRAINT_NOT_PRESENT/u);
  assert.match(seed, /m1_4_historical_skip_probe/u);
  assert.match(regression, /PASS F historical skipped row preserved without rewrite/u);
  assert.match(regression, /PASS A initial candidate_absent accepted/u);
  assert.match(regression, /PASS B clarification reused authority accepted/u);
  assert.match(regression, /PASS C fulfillment reused purchase-ready authority accepted/u);
  for (const stage of ["PB-01", "PB-01C", "PB-02", "PB-03"]) {
    assert.match(regression, new RegExp(`'${stage}'`, "u"));
  }
});

check("regression assets reject malformed skips and preserve ordinary states D-E", () => {
  const regression = readText(regressionPath);
  for (const testCase of [
    "wrong_stage",
    "wrong_run_kind",
    "wrong_skip_reason",
    "attempt_2_skipped",
    "nonzero_input_tokens",
    "nonzero_cached_tokens",
    "nonzero_output_tokens",
    "nonzero_reasoning_tokens",
    "nonzero_latency",
    "response_present",
    "returned_model_present",
    "output_present",
    "error_present",
  ]) {
    assert.match(regression, new RegExp(`'${testCase}'`, "u"));
  }
  assert.match(regression, /disable trigger assessment_stage_runs_topology_v5/u);
  assert.match(regression, /'23514'[\s\S]*?'assessment_stage_runs_skipped_invariants'/u);
  assert.match(regression, /PASS D malformed skips rejected/u);
  assert.match(regression, /PASS E completed and failed stages unchanged/u);
});

check("package exposes the focused verifier exactly", () => {
  const packageJson = JSON.parse(readText("package.json"));
  assert.equal(
    packageJson.scripts["verify:m1-4:skipped-stage-constraint"],
    "node scripts/verify-m1-4-skipped-stage-constraint.mjs",
  );
});

console.log(`M1-4 SKIPPED-STAGE CONSTRAINT PASS ${passed}/${passed}`);
console.log("PROVIDER_CALLS=0 REMOTE_OPERATIONS=0 MIGRATIONS_APPLIED_REMOTE=0");
