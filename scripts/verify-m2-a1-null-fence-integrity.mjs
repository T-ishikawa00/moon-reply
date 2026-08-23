import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const base = "90c4a585a951c1de073f041b0a656e21742133da";
const authority = "0befd512219eb2897fb1edf969ad37d7e8c56b0d";
const expectedBranch = "task/m2-a1-null-fence-integrity-r1";
const migrationPath =
  "supabase/migrations/0017_m2_a1_null_fence_integrity.sql";
const proofPath = "supabase/tests/m2_a1_null_fence_integrity_r1.sql";
const migration = text(migrationPath);
const predecessor = text(
  "supabase/migrations/0016_m1_4_background_fulfillment_durability.sql",
);
const proof = text(proofPath);
let passed = 0;

function git(args, encoding = "utf8") {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding, maxBuffer: 256 * 1024 * 1024 },
  );
}

function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function check(name, callback) {
  callback();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

function changedPathsFromBase() {
  const tracked = git(["diff", "--name-only", base, "--"])
    .trim()
    .split(/\r?\n/u)
    .filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].map((entry) =>
    entry.replaceAll("\\", "/"),
  );
}

function functionBlock(source, functionName) {
  const pattern = new RegExp(
    `create(?: or replace)? function public\\.${functionName}\\([\\s\\S]*?\\n\\$function\\$;`,
    "u",
  );
  const match = source.match(pattern);
  assert.ok(match, `missing function ${functionName}`);
  return match[0];
}

function assertBefore(source, earlier, later) {
  const earlierIndex = source.indexOf(earlier);
  const laterIndex = source.indexOf(later);
  assert.ok(earlierIndex >= 0, `missing ordered text: ${earlier}`);
  assert.ok(laterIndex >= 0, `missing ordered text: ${later}`);
  assert.ok(earlierIndex < laterIndex, `${earlier} must precede ${later}`);
}

check("exact base branch and unchanged release authority", () => {
  assert.equal(git(["branch", "--show-current"]).trim(), expectedBranch);
  assert.equal(git(["merge-base", base, "HEAD"]).trim(), base);
  assert.equal(git(["rev-parse", "release/private-ready"]).trim(), authority);
  assert.equal(
    git(["rev-parse", "refs/remotes/origin/release/private-ready"]).trim(),
    authority,
  );
  assert.equal(git(["stash", "list"]).trim(), "");
});

check("bounded M2-A1 path manifest", () => {
  const allowed = new Set([
    "docs/m2/M2_A1_NULL_FENCE_INTEGRITY.md",
    "package.json",
    "scripts/verify-m2-a1-null-fence-integrity.mjs",
    migrationPath,
    proofPath,
    "supabase/tests/m2_a1_null_fence_concurrency_setup_r1.sql",
    "supabase/tests/m2_a1_null_fence_concurrent_claim_r1.sql",
    "supabase/tests/m2_a1_null_fence_concurrent_completion_r1.sql",
    "supabase/tests/m2_a1_null_fence_concurrency_verify_r1.sql",
  ]);
  const changed = changedPathsFromBase();
  assert.ok(changed.length >= 9, "M2-A1 package is incomplete");
  assert.deepEqual(
    changed.filter((entry) => !allowed.has(entry)),
    [],
    "out-of-manifest path changed",
  );
});

check("0016 and every predecessor migration are immutable", () => {
  git(["diff", "--exit-code", base, "--", "supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql"]);
  for (let version = 3; version <= 16; version += 1) {
    const prefix = String(version).padStart(4, "0");
    const paths = git(["ls-tree", "-r", "--name-only", base, "supabase/migrations"])
      .split(/\r?\n/u)
      .filter((entry) => entry.includes(`/${prefix}_`));
    assert.equal(paths.length, 1, `base migration ${prefix} identity missing`);
    git(["diff", "--exit-code", base, "--", paths[0]]);
  }
  assert.equal(
    (migration.match(/create or replace function public\./gu) ?? []).length,
    3,
  );
  assert.doesNotMatch(migration, /alter table|create function public\..*_v1/iu);
});

check("target bodies are predecessor-identical outside the three guards", () => {
  const exactSuccessor = (functionName, oldGuard, newGuard) => {
    const expected = functionBlock(predecessor, functionName)
      .replaceAll("\r\n", "\n")
      .replace("create function", "create or replace function")
      .replace(oldGuard, newGuard);
    assert.equal(
      functionBlock(migration, functionName).replaceAll("\r\n", "\n"),
      expected,
    );
  };
  exactSuccessor(
    "claim_production_fulfillment_v2",
    "  if p_owner_id is null or p_lease_expires_at <= p_now then",
    `  if p_owner_id is null
     or p_lease_expires_at is null
     or p_lease_expires_at <= p_now then`,
  );
  exactSuccessor(
    "complete_production_fulfillment_v2",
    `  if locked.id is null
     or locked.status <> 'generating'
     or locked.owner_id <> p_owner_id
     or locked.lease_expires_at <= p_now
     or locked.generation_started_at is null then`,
    `  if locked.id is null
     or locked.status <> 'generating'
     or p_owner_id is null
     or locked.owner_id is null
     or locked.owner_id is distinct from p_owner_id
     or locked.lease_expires_at is null
     or locked.lease_expires_at <= p_now
     or locked.generation_started_at is null then`,
  );
  exactSuccessor(
    "claim_production_notification_v2",
    "  if p_owner_id is null or p_lease_expires_at <= p_now then",
    `  if p_owner_id is null
     or p_lease_expires_at is null
     or p_lease_expires_at <= p_now then`,
  );
});

check("logical claim rejects NULL owner and lease before locking", () => {
  const block = functionBlock(migration, "claim_production_fulfillment_v2");
  assert.match(
    block,
    /if p_owner_id is null\s+or p_lease_expires_at is null\s+or p_lease_expires_at <= p_now then/u,
  );
  assertBefore(block, "p_lease_expires_at is null", "select * into locked");
  assert.match(block, /'disposition', 'acquired'/u);
  assert.match(block, /'disposition', 'in_progress'/u);
  assert.match(block, /PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS/u);
  assert.match(block, /PRODUCTION_WORKER_CRASH_BEFORE_PROVIDER/u);
});

check("completion fence is NULL-safe and precedes every side effect", () => {
  const block = functionBlock(migration, "complete_production_fulfillment_v2");
  for (const guard of [
    "p_owner_id is null",
    "locked.owner_id is null",
    "locked.owner_id is distinct from p_owner_id",
    "locked.lease_expires_at is null",
    "locked.lease_expires_at <= p_now",
  ]) {
    assert.match(block, new RegExp(guard.replaceAll(".", "\\."), "u"));
    assertBefore(block, guard, "perform 1 from public.assessment_reports");
    assertBefore(block, guard, "insert into public.production_customer_deliveries");
  }
  assertBefore(
    block,
    "raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT'",
    "insert into public.production_customer_deliveries",
  );
  assert.equal(
    (block.match(/insert into public\.production_customer_deliveries/gu) ?? [])
      .length,
    1,
  );
  assert.equal(
    (block.match(/insert into public\.production_result_credentials/gu) ?? [])
      .length,
    1,
  );
  assert.equal(
    (block.match(/insert into public\.production_notification_outbox/gu) ?? [])
      .length,
    1,
  );
});

check("notification claim rejects NULL owner and lease before locking", () => {
  const block = functionBlock(migration, "claim_production_notification_v2");
  assert.match(
    block,
    /if p_owner_id is null\s+or p_lease_expires_at is null\s+or p_lease_expires_at <= p_now then/u,
  );
  assertBefore(block, "p_lease_expires_at is null", "select * into locked");
  assert.match(block, /'reclaimed'/u);
  assert.match(block, /'in_progress'/u);
});

check("v1 signatures and non-target v2 definitions remain predecessor-owned", () => {
  assert.equal((migration.match(/_v1/gu) ?? []).length, 0);
  for (const functionName of [
    "heartbeat_production_fulfillment_v2",
    "mark_production_generation_started_v2",
    "fail_production_fulfillment_v2",
    "claim_rc2_fulfillment_dispatch_v2",
    "claim_rc2_fulfillment_job_by_id_v2",
    "complete_production_notification_v2",
    "fail_production_notification_v2",
    "recover_stale_assessment_run_v2",
    "quarantine_rc2_fulfillment_job_after_async_retries_v2",
  ]) {
    assert.match(predecessor, new RegExp(`function public\\.${functionName}`, "u"));
    assert.doesNotMatch(migration, new RegExp(`function public\\.${functionName}`, "u"));
  }
});

check("runtime remains on the same v2 signatures", () => {
  const repository = text("lib/assessment/production/supabase-repository.ts");
  for (const functionName of [
    "claim_production_fulfillment_v2",
    "complete_production_fulfillment_v2",
    "claim_production_notification_v2",
  ]) {
    assert.match(repository, new RegExp(functionName, "u"));
  }
  assert.match(repository, /ownerId: string/u);
  assert.match(repository, /leaseExpiresAt: string/u);
});

check("sequential DB proof covers invalid atomicity, valid, replay, and regressions", () => {
  for (const expected of [
    "M2_A1_INVALID_LOGICAL_CLAIM_LEFT_SIDE_EFFECT",
    "M2_A1_NULL_LOGICAL_HEARTBEAT_LEFT_SIDE_EFFECT",
    "M2_A1_INVALID_COMPLETION_OR_FAILURE_LEFT_SIDE_EFFECT",
    "M2_A1_VALID_COMPLETION_SIDE_EFFECT_SET_INVALID",
    "M2_A1_COMPLETION_REPLAY_LEFT_SIDE_EFFECT",
    "M2_A1_INVALID_NOTIFICATION_CLAIM_LEFT_SIDE_EFFECT",
    "M2_A1_NULL_NOTIFICATION_HEARTBEAT_LEFT_SIDE_EFFECT",
    "M2_A1_NOTIFICATION_RECLAIM_CHANGED",
    "M2_A1_NULL_JOB_LEASE_LEFT_SIDE_EFFECT",
    "M2_A1_NULL_DISPATCH_LEASE_LEFT_SIDE_EFFECT",
    "M2_A1_NULL_RETURNED_MODEL_LEFT_SIDE_EFFECT",
    "M2_A1_NULL_CUSTOMER_USER_LEFT_SIDE_EFFECT",
    "M2_A1_INVALID_GENERATION_MARK_LEFT_SIDE_EFFECT",
  ]) {
    assert.match(proof, new RegExp(expected, "u"));
  }
  assert.match(proof, /^rollback;$/mu);
  assert.doesNotMatch(proof, /https?:\/\/|OPENAI_API_KEY|customer@example/iu);
});

check("two-session proof requires one winner and exact side-effect cardinality", () => {
  const setup = text(
    "supabase/tests/m2_a1_null_fence_concurrency_setup_r1.sql",
  );
  const verification = text(
    "supabase/tests/m2_a1_null_fence_concurrency_verify_r1.sql",
  );
  assert.match(setup, /p_client_id integer,\s+p_kind_id integer/u);
  const claimWorkload = text(
    "supabase/tests/m2_a1_null_fence_concurrent_claim_r1.sql",
  );
  assert.match(claimWorkload, /:claim_kind_id/u);
  assert.match(setup, /run_completion\(p_client_id integer\)/u);
  assert.match(verification, /disposition = 'acquired'\) <> 1/gu);
  assert.match(verification, /disposition = 'in_progress'\) <> 1/gu);
  assert.match(verification, /kind = 'notification_reclaim' and disposition = 'reclaimed'\) <> 1/u);
  assert.match(verification, /M2_A1_CONCURRENT_NOTIFICATION_RECLAIM_INVALID/u);
  assert.match(verification, /row_json - array\[/u);
  assert.match(verification, /disposition = 'completed'\) <> 1/u);
  assert.match(verification, /disposition = 'conflict'/u);
  assert.match(verification, /purpose = 'customer_handoff'\) <> 1/u);
});

check("remote apply plan is append-only and forward-fix only", () => {
  const plan = text("docs/m2/M2_A1_NULL_FENCE_INTEGRITY.md");
  for (const required of [
    migrationPath,
    "Expected affected RPCs",
    "Expected unchanged RPCs",
    "Pre-apply checks",
    "Post-apply checks",
    "Forward-fix",
    "Remote apply authority: `false`",
    "release/private-ready integration authority: `false`",
  ]) {
    assert.match(plan, new RegExp(required.replaceAll("/", "\\/"), "u"));
  }
});

console.log(`M2-A1 NULL FENCE INTEGRITY PASS ${passed}/${passed}`);
console.log("REMOTE_WRITES=0 PROVIDER_CALLS=0 DEPLOYS=0 AUTHORITY_INTEGRATIONS=0");
