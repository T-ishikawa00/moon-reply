import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration0012 =
  "supabase/migrations/0012_rc2_activation_database_hardening.sql";
const status =
  "RC-2 Production Activation Step B implemented_pending_human_chatgpt_review";

const immutableMigrationBlobs = new Map([
  ["supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql", "5457adba613e39861fa9ceca6b39b2534ed46e37"],
  ["supabase/migrations/0003_m2_p3_atomic_finalization.sql", "3a2442acb000d6fb109d77a56d7b62600265f6c1"],
  ["supabase/migrations/0004_m2_p4_candidate_source_isolation.sql", "e3c42330d8e024a888fe8fd417e853ee1afad73c"],
  ["supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql", "d3c01e8d5a157dfbdc15b2333f1df01969a84cf7"],
  ["supabase/migrations/0006_m2_p4_jpy980_clarification_lifecycle.sql", "0a3206022a9eeac3b963460eea5820fd87510043"],
  ["supabase/migrations/0007_m2_p4_jpy980_semantic_depth_runtime_identity.sql", "1962c483f0b89cadc579dee8e6d39f9ba9067bae"],
  ["supabase/migrations/0008_m2_p4_jpy980_semantic_quality_runtime_identity.sql", "936ec63bbfa3af22d3c09b999ba0000c696781d5"],
  ["supabase/migrations/0009_m2_p4_jpy980_quality_reassessment.sql", "f6c906812ba03dc2b4a50151b7f268abd1042d04"],
  ["supabase/migrations/0010_rc1_production_fulfillment_core.sql", "8b5bd5b02ca7756299049cf6215af299ace69e3c"],
  ["supabase/migrations/0011_rc2_production_payment_delivery.sql", "70dc2c62631de6f1a81e5257eb076f45c4078565"],
]);

const immutableQ0V17Blobs = new Map([
  ["components/runtime/CustomerAssessmentNote.tsx", "ee3fcf5cd3c0d164d292ab5165522aebafdb0473"],
  ["lib/assessment/runtime/pipeline.ts", "206f2dd397dc098ece86c1414dd9c19c89ffd835"],
  ["lib/assessment/runtime/change-condition-grounding-v4.ts", "9da403b99a3ef263af12f7b8633e902b22f99f6d"],
  ["lib/assessment/runtime/semantic-disposition-v7.ts", "88c208afc55ad368386e15535cf92fe87beabf8b"],
  ["scripts/verify-m2-p4-q0-final-reassessment-semantics.mjs", "39c4571da4312ca8e72c8af9d025864c457770ca"],
]);

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

function workingBlob(relativePath) {
  return gitText(["hash-object", `--path=${relativePath}`, "--", relativePath]);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function assertBlobMap(expected) {
  for (const [relativePath, blob] of expected) {
    assert.equal(existsSync(path.join(root, relativePath)), true, relativePath);
    assert.equal(workingBlob(relativePath), blob, relativePath);
  }
}

let checks = 0;
const failures = [];

async function check(name, callback) {
  try {
    await callback();
    checks += 1;
    console.log(`PASS ${String(checks).padStart(2, "0")} ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

await check("append-only 0012 exists with an explicit transaction", () => {
  assert.equal(existsSync(path.join(root, migration0012)), true);
  const source = readText(migration0012);
  assert.match(source, /^begin;$/mu);
  assert.match(source, /^commit;$/mu);
  assert.ok(source.indexOf("begin;") < source.lastIndexOf("commit;"));
});

await check("accepted migrations 0002 through 0011 are byte-authoritative", () => {
  assertBlobMap(immutableMigrationBlobs);
});

await check("assessment tables retain RLS and explicit public role revocation", () => {
  const source = readText(migration0012);
  for (const table of [
    "assessment_requests",
    "assessment_runs",
    "assessment_stage_runs",
    "assessment_reports",
    "assessment_clarifications",
  ]) {
    assert.match(
      source,
      new RegExp(`alter table public\\.${table} enable row level security;`, "u"),
    );
    assert.match(
      source,
      new RegExp(
        `revoke all on table public\\.${table}\\s+from public, anon, authenticated, service_role;`,
        "u",
      ),
    );
  }
  assert.doesNotMatch(source, /disable row level security/iu);
});

await check("service role assessment grants are the exact minimal matrix", () => {
  const source = readText(migration0012);
  const expected = new Map([
    ["assessment_requests", "select, insert, update"],
    ["assessment_runs", "select, insert, update"],
    ["assessment_stage_runs", "select, insert, update"],
    ["assessment_reports", "select, insert"],
    ["assessment_clarifications", "select, insert, update"],
  ]);
  for (const [table, privileges] of expected) {
    assert.match(
      source,
      new RegExp(
        `grant ${escapeRegExp(privileges)} on table public\\.${table}\\s+to service_role;`,
        "u",
      ),
    );
  }
  const assessmentGrantStatements = source
    .split(";")
    .filter((statement) =>
      /\bgrant\b[\s\S]*?\bon table public\.assessment_[a-z_]+/iu.test(
        statement,
      ),
    );
  assert.equal(assessmentGrantStatements.length, 5);
  assert.equal(assessmentGrantStatements.some((entry) => /\bdelete\b/iu.test(entry)), false);
  assert.equal(assessmentGrantStatements.some((entry) => /grant\s+all/iu.test(entry)), false);
});

await check("checkout helper binds test and live prefixes fail closed", () => {
  const source = readText(migration0012);
  assert.match(source, /rc2_checkout_session_matches_environment_v1/gu);
  assert.match(source, /when 'test' then[\s\S]*?\^cs_test_/u);
  assert.match(source, /when 'live' then[\s\S]*?\^cs_live_/u);
  assert.match(source, /else false/u);
});

await check("payment attempts enforce parent environment on insert and update", () => {
  const source = readText(migration0012);
  assert.match(
    source,
    /create trigger enforce_rc2_payment_attempt_environment_v1\s+before insert or update on public\.production_payment_attempts/iu,
  );
  assert.match(
    source,
    /select environment into intent_environment[\s\S]*?where id = new\.purchase_intent_id/iu,
  );
  assert.match(source, /RC2_PAYMENT_ENVIRONMENT_MISMATCH/u);
});

await check("purchase intent environment cannot be rewritten", () => {
  const source = readText(migration0012);
  assert.match(
    source,
    /before update of environment on public\.production_purchase_intents/iu,
  );
  assert.match(source, /RC2_PURCHASE_INTENT_ENVIRONMENT_IMMUTABLE/u);
});

await check("verified payments have a same-row check and full parent binding trigger", () => {
  const source = readText(migration0012);
  assert.match(source, /production_verified_payment_environment_session_binding/u);
  assert.match(
    source,
    /environment = 'test'[\s\S]*?\^cs_test_[\s\S]*?environment = 'live'[\s\S]*?\^cs_live_/u,
  );
  assert.match(
    source,
    /create trigger enforce_rc2_verified_payment_binding_v1\s+before insert or update on public\.production_verified_payments/iu,
  );
  for (const binding of [
    "new.environment is distinct from intent_environment",
    "attempt_intent_id is distinct from new.purchase_intent_id",
    "attempt_checkout_session_id is distinct from",
  ]) assert.ok(source.includes(binding), binding);
});

await check("verified payment row-lock authority cannot mutate rows", () => {
  const source = readText(migration0012);
  assert.match(
    source,
    /grant update on table public\.production_verified_payments to service_role;/u,
  );
  assert.match(
    source,
    /create trigger reject_rc2_verified_payment_mutation_v1\s+before update on public\.production_verified_payments/iu,
  );
  assert.match(source, /RC2_VERIFIED_PAYMENT_IMMUTABLE/u);
});

await check("Stripe evidence performs the three-way guard before state mutation", () => {
  const source = readText(migration0012);
  const guard = source.indexOf("if intent.id is not null and (");
  const stateMutation = source.indexOf("if not terminal_success then");
  assert.ok(guard > 0);
  assert.ok(stateMutation > guard);
  assert.ok(source.slice(guard, stateMutation).includes(
    "p_environment is distinct from intent.environment",
  ));
  assert.ok(source.slice(guard, stateMutation).includes(
    "rc2_checkout_session_matches_environment_v1",
  ));
});

await check("mismatched evidence stays rejected in the audit ledger", () => {
  const source = readText(migration0012);
  assert.match(
    source,
    /disposition = 'rejected',[\s\S]*?reason_code = 'PAYMENT_ENVIRONMENT_MISMATCH'/u,
  );
  assert.match(
    source,
    /'verified_payment_id', null,[\s\S]*?'fulfillment_job_id', null/u,
  );
});

await check("0012 preserves invoker and empty-search-path function design", () => {
  const source = readText(migration0012);
  assert.doesNotMatch(source, /security definer/iu);
  const createdFunctions = source.match(/create(?: or replace)? function/giu) ?? [];
  const invokers = source.match(/^security invoker$/gimu) ?? [];
  const emptyPaths = source.match(/^set search_path = ''$/gmu) ?? [];
  assert.equal(createdFunctions.length, invokers.length);
  assert.equal(createdFunctions.length, emptyPaths.length);
});

await check("new functions deny public roles and grant only service execution", () => {
  const source = readText(migration0012);
  for (const functionName of [
    "rc2_checkout_session_matches_environment_v1",
    "enforce_rc2_purchase_intent_environment_immutable_v1",
    "enforce_rc2_payment_attempt_environment_v1",
    "enforce_rc2_verified_payment_binding_v1",
    "reject_rc2_verified_payment_mutation_v1",
    "record_rc2_stripe_evidence_v1",
  ]) {
    const anchor = `public.${functionName}`;
    assert.ok(source.includes(anchor), anchor);
  }
  assert.match(source, /from public, anon, authenticated;/gu);
  assert.match(source, /to service_role;/gu);
});

await check("migration preflight rejects existing cross-environment rows", () => {
  const source = readText(migration0012);
  assert.match(source, /RC2_EXISTING_PAYMENT_ATTEMPT_ENVIRONMENT_MISMATCH/u);
  assert.match(source, /RC2_EXISTING_VERIFIED_PAYMENT_ENVIRONMENT_MISMATCH/u);
});

await check("accepted Q0 and V17 assets remain immutable", () => {
  assertBlobMap(immutableQ0V17Blobs);
});

await check("the offline package entrypoint is exact", () => {
  const packageJson = JSON.parse(readText("package.json"));
  assert.equal(
    packageJson.scripts["verify:rc2:stepb"],
    "node scripts/verify-rc2-stepb-local-db-evidence.mjs",
  );
});

await check("Step B evidence documentation is status-consistent", () => {
  const docs = [
    "docs/payment/RC2_PRODUCTION_ACTIVATION_RUNBOOK.md",
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/CODEX_HANDOFF.md",
  ];
  for (const relativePath of docs) {
    const source = readText(relativePath);
    assert.ok(source.includes("RC-2-PRODUCTION-ACTIVATION-STEP-B:BEGIN"), relativePath);
    assert.ok(source.includes(status), relativePath);
    assert.ok(source.includes("REMOTE_SUPABASE_STATE = UNRESOLVED"), relativePath);
  }
  const runbook = readText(docs[0]);
  for (const evidence of [
    "PASS_0002_THROUGH_0012_FRESH_APPLY",
    "PAYMENT_INTEGRITY_A_THROUGH_O = PASS",
    "SERVICE_ROLE_REAL_RUNTIME_RPC_PROOF = PASS",
    "ATOMICITY_PROBE_OBJECT_ABSENT = true",
    "PASS_0002_THROUGH_0012_FRESH_REPLAY",
  ]) assert.ok(runbook.includes(evidence), evidence);
  assert.ok(runbook.includes("Production Payment: inactive"));
  assert.ok(runbook.includes("PRIVATE RELEASE READY = false"));
  assert.ok(runbook.includes("Public Launch = false"));
});

await check("the disposable atomicity probe remains absent after Step D", () => {
  const names = readdirSync(path.join(root, "supabase/migrations"));
  assert.equal(
    names.includes("0013_rc2_service_role_acl_hardening.sql"),
    true,
  );
  assert.equal(names.some((name) => /atomicity_probe/iu.test(name)), false);
  assert.equal(
    names.filter((name) => /^00(?:0[2-9]|1[0-3])_.*\.sql$/u.test(name))
      .length,
    12,
  );
});

if (failures.length > 0) {
  console.error(`RC2_STEPB_LOCAL_DB_EVIDENCE: FAIL ${failures.length}/${checks + failures.length}`);
  process.exitCode = 1;
} else {
  console.log(`RC2_STEPB_LOCAL_DB_EVIDENCE: PASS ${checks}/${checks}`);
}
