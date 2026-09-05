import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createLocalPostgres } from "./remediation-local-postgres.mjs";

// All actual migrations through 0026 are applied in a disposable PG17 cluster.
// Report/projection JSON below is deliberately synthetic: this proves DB crash,
// transaction, lease and identity fences. Application tests prove artifact
// validation; these fixtures are not acceptable Customer delivery content.
const db = await createLocalPostgres("f001-recovery");
const claimSignature = "public.claim_production_fulfillment_v2(uuid,uuid,timestamptz,timestamptz)";
const completeSignature = "public.complete_production_fulfillment_v2(uuid,uuid,uuid,uuid,uuid,jsonb,text,uuid,text,uuid,timestamptz)";
const newSignature = "public.claim_production_fulfillment_v3(uuid,uuid,timestamptz,timestamptz)";
const digest = (value) => createHash("sha256").update(value).digest("hex");
let passed = 0, terminated = 0;
async function check(name, run) { await run(); console.log(`PASS F001 DB ${++passed} ${name}`); }
function seed() {
  const f = Object.fromEntries(["request", "preparation", "purchase", "grant", "logical", "run", "report", "owner"].map((name) => [name, randomUUID()]));
  const hash = digest(f.request);
  db.sql(`insert into public.assessment_requests(id,idempotency_key,source,raw_situation,relationship,
    requested_topics,privacy_acknowledged,status,created_at,updated_at)
    values('${f.request}','${f.request}','production_fulfillment_runtime','synthetic DB crash fixture',
    'dating','["next_action"]',true,'processing',now()-interval '20 minutes',now());
    insert into public.production_preparations(id,assessment_request_id,idempotency_key_hash,
    consultation_snapshot_sha256,consultation_snapshot_json,safety_authority_json,status,created_at,updated_at)
    values('${f.preparation}','${f.request}','${hash}','${hash}','{}',
    '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}','preparing',now(),now());
    insert into public.production_purchases(id,preparation_id,purchase_authority_reference_hash,verified_at)
    values('${f.purchase}','${f.preparation}','${hash}',now());
    insert into public.production_assessment_grants(id,purchase_id,preparation_id,delivery_authority_reference,status,issued_at)
    values('${f.grant}','${f.purchase}','${f.preparation}','synthetic-delivery-${f.grant}','issued',now());
    insert into public.production_logical_assessments(id,grant_id,preparation_id,assessment_request_id,status,
    owner_id,ownership_acquired_at,generation_started_at,attempt_count,recovery_state,created_at,updated_at,lease_expires_at)
    values('${f.logical}','${f.grant}','${f.preparation}','${f.request}','generating','${f.owner}',
    now()-interval '20 minutes',now()-interval '19 minutes',1,'post_provider_retryable_same_assessment',
    now()-interval '20 minutes',now(),now()-interval '1 second');
    insert into public.assessment_runs(id,request_id,status,requested_model,prompt_bundle_version,schema_set_version,
    stage_topology_version,run_kind,total_input_tokens,total_cached_tokens,total_output_tokens,total_reasoning_tokens,
    usage_derived_cost_usd,started_at)
    values('${f.run}','${f.request}','processing','gpt-5.6-luna','prompt-bundle-runtime-v17.0.0',
    'pipeline-schema-runtime-v6.0.0','split-base-candidate-v1','fulfillment_resume',0,0,0,0,0,now()-interval '19 minutes');`);
  return f;
}
const finalizeSql = (f) => `select public.finalize_completed_assessment('${f.report}','${f.run}','${f.request}',
  'gpt-5.6-luna','wait_and_reassess','{"synthetic_db_evidence":true}','{"synthetic_db_evidence":true}',0,0,0,0,0,clock_timestamp());`;
const finalize = (f) => db.sql(`set role service_role; ${finalizeSql(f)}`);
const claimSql = (f, owner = randomUUID()) => `select public.claim_production_fulfillment_v3('${f.grant}',
  '${owner}',clock_timestamp()+interval '16 minutes',clock_timestamp());`;
const claim = (f, owner) => JSON.parse(db.sql(`set role service_role; ${claimSql(f, owner)}`));
const completeSql = (f, owner, run = f.run) => `select public.complete_production_fulfillment_v2('${f.grant}','${f.logical}',
  ${owner === null ? "null" : `'${owner}'`},'${run}','${randomUUID()}','{"synthetic_db_evidence":true}',
  '${digest(f.logical)}','${randomUUID()}','${digest(randomUUID())}','${randomUUID()}',clock_timestamp());`;
const complete = (f, owner, run) => db.sql(`set role service_role; ${completeSql(f, owner, run)}`);
const counts = (f) => JSON.parse(db.sql(`select jsonb_build_object(
  'reports',(select count(*) from public.assessment_reports where run_id='${f.run}'),
  'runs',(select count(*) from public.assessment_runs where request_id='${f.request}'),
  'deliveries',(select count(*) from public.production_customer_deliveries where logical_assessment_id='${f.logical}'),
  'credentials',(select count(*) from public.production_result_credentials c join public.production_customer_deliveries d on d.id=c.delivery_id where d.logical_assessment_id='${f.logical}'),
  'notifications',(select count(*) from public.production_notification_outbox n join public.production_customer_deliveries d on d.id=n.delivery_id where d.logical_assessment_id='${f.logical}'));`));
async function rejectSql(statement, pattern) {
  const result = await db.startSql(`set role service_role; ${statement}`).result;
  assert.notEqual(result.code, 0); assert.match(result.error, pattern);
}
async function killAtBoundary(statement, commitBeforeKill = false) {
  const applicationName = `f001-fault-${randomUUID()}`;
  const running = db.startSql(`set application_name='${applicationName}'; set role service_role;
    begin; ${statement} ${commitBeforeKill ? "commit;" : ""} select pg_sleep(9);`);
  let finished;
  void running.result.then((result) => { finished = result; });
  let pid;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (finished) assert.fail(`fault process ended before boundary: ${finished.error}`);
    const found = db.sql(`select pid from pg_stat_activity where application_name='${applicationName}' and wait_event='PgSleep';`);
    if (found) { assert.match(found, /^[0-9]+$/u); pid = Number(found); break; }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.ok(pid, "dedicated synthetic backend must reach the exact SQL boundary");
  assert.equal(db.sql(`select pg_terminate_backend(${pid});`), "t");
  const result = await running.result;
  assert.notEqual(result.code, 0); assert.match(result.error, /terminating connection|server closed the connection/u);
  terminated++;
}
try {
  let oldClaim, oldComplete;
  const applied = db.applyThrough(26, (file) => {
    if (file.startsWith("0026_")) {
      oldClaim = db.sql(`select pg_get_functiondef('${claimSignature}'::regprocedure);`);
      oldComplete = db.sql(`select pg_get_functiondef('${completeSignature}'::regprocedure);`);
    }
  });
  await check("all real migrations through 0026 apply; old claim and canonical RPC bodies unchanged", () => {
    assert.equal(applied[0].slice(0, 4), "0002"); assert.equal(applied.at(-1).slice(0, 4), "0026");
    assert.equal(db.sql(`select pg_get_functiondef('${claimSignature}'::regprocedure);`), oldClaim);
    assert.equal(db.sql(`select pg_get_functiondef('${completeSignature}'::regprocedure);`), oldComplete);
  });
  await check("new RPC is service-only and preserves security-invoker boundary", async () => {
    for (const role of ["anon", "authenticated", "m2_b2_stripe_ingress", "service_role"])
      assert.equal(db.sql(`select has_function_privilege('${role}','${newSignature}','EXECUTE');`), role === "service_role" ? "t" : "f");
    assert.equal(db.sql(`select prosecdef from pg_proc where oid='${newSignature}'::regprocedure;`), "f");
    const denied = await db.startSql(`set role anon; select public.claim_production_fulfillment_v3(null,null,null,null);`).result;
    assert.notEqual(denied.code, 0); assert.match(denied.error, /permission denied/u);
  });
  await check("backend termination before report transaction commit leaves no report and no automatic rerun", async () => {
    const f = seed(); await killAtBoundary(finalizeSql(f));
    assert.deepEqual(counts(f), { reports: 0, runs: 1, deliveries: 0, credentials: 0, notifications: 0 });
    assert.equal(db.sql(`select status from public.assessment_runs where id='${f.run}';`), "processing");
    const recovered = claim(f); assert.equal(recovered.disposition, "manual_review");
    assert.equal(recovered.automatic_rerun, false); assert.equal(counts(f).runs, 1);
  });
  await check("backend termination after atomic report commit recovers the same saved run", async () => {
    const f = seed(); await killAtBoundary(finalizeSql(f), true);
    assert.equal(db.sql(`select status from public.assessment_requests where id='${f.request}';`), "completed");
    assert.deepEqual(counts(f), { reports: 1, runs: 1, deliveries: 0, credentials: 0, notifications: 0 });
    const current = claim(f); assert.equal(current.disposition, "acquired"); assert.equal(current.recoverable_runtime_run_id, f.run);
    assert.equal(current.attempt_count, 2); assert.notEqual(current.owner_id, f.owner);
    complete(f, current.owner_id);
    assert.deepEqual(counts(f), { reports: 1, runs: 1, deliveries: 1, credentials: 1, notifications: 1 });
  });
  await check("canonical transaction termination before commit rolls back delivery, credential and outbox together", async () => {
    const f = seed(); finalize(f); const current = claim(f);
    await killAtBoundary(completeSql(f, current.owner_id));
    assert.deepEqual(counts(f), { reports: 1, runs: 1, deliveries: 0, credentials: 0, notifications: 0 });
    assert.equal(db.sql(`select status from public.production_logical_assessments where id='${f.logical}';`), "generating");
    assert.equal(claim(f).disposition, "in_progress");
    db.sql(`update public.production_logical_assessments set lease_expires_at=clock_timestamp()-interval '1 second' where id='${f.logical}';`);
    const retry = claim(f); assert.equal(retry.recoverable_runtime_run_id, f.run); complete(f, retry.owner_id);
    assert.deepEqual(counts(f), { reports: 1, runs: 1, deliveries: 1, credentials: 1, notifications: 1 });
  });
  await check("termination after canonical commit replays completion without new run or delivery", async () => {
    const f = seed(); finalize(f); const current = claim(f);
    await killAtBoundary(completeSql(f, current.owner_id), true);
    assert.equal(claim(f).disposition, "completed");
    await rejectSql(completeSql(f, current.owner_id), /PRODUCTION_FULFILLMENT_STATE_CONFLICT/u);
    assert.deepEqual(counts(f), { reports: 1, runs: 1, deliveries: 1, credentials: 1, notifications: 1 });
  });
  await check("stale owner and recovery owner compete; canonical delivery remains one", async () => {
    const f = seed(); finalize(f); const newOwner = randomUUID();
    const stale = db.startSql(`set role service_role; ${completeSql(f, f.owner)}`).result;
    const current = claim(f, newOwner); assert.equal(current.recoverable_runtime_run_id, f.run);
    const fresh = db.startSql(`set role service_role; ${completeSql(f, newOwner)}`).result;
    const [oldResult, newResult] = await Promise.all([stale, fresh]);
    assert.notEqual(oldResult.code, 0); assert.match(oldResult.error, /PRODUCTION_FULFILLMENT_STATE_CONFLICT/u);
    assert.equal(newResult.code, 0, newResult.error); assert.equal(counts(f).deliveries, 1); assert.equal(counts(f).runs, 1);
  });
  await check("sixteen recovery workers produce one lease; duplicate canonical workers commit once", async () => {
    const f = seed(); finalize(f);
    const results = (await Promise.all(Array.from({ length: 16 }, () => db.parallelSql(`set role service_role; ${claimSql(f)}`)))).map(JSON.parse);
    assert.equal(results.filter((r) => r.disposition === "acquired").length, 1);
    assert.equal(results.filter((r) => r.disposition === "in_progress").length, 15);
    const owner = results.find((r) => r.disposition === "acquired").owner_id;
    const writes = await Promise.all(Array.from({ length: 8 }, () => db.startSql(`set role service_role; ${completeSql(f, owner)}`).result));
    assert.equal(writes.filter((r) => r.code === 0).length, 1);
    for (const failure of writes.filter((r) => r.code !== 0)) assert.match(failure.error, /PRODUCTION_FULFILLMENT_STATE_CONFLICT/u);
    assert.deepEqual(counts(f), { reports: 1, runs: 1, deliveries: 1, credentials: 1, notifications: 1 });
  });
  await check("active lease and recent legacy NULL lease cannot be reclaimed", () => {
    const f = seed(); finalize(f);
    db.sql(`update public.production_logical_assessments set lease_expires_at=clock_timestamp()+interval '5 minutes' where id='${f.logical}';`);
    assert.equal(claim(f).disposition, "in_progress");
    db.sql(`update public.production_logical_assessments set lease_expires_at=null,ownership_acquired_at=clock_timestamp()-interval '15 minutes' where id='${f.logical}';`);
    assert.equal(claim(f).disposition, "in_progress"); assert.equal(counts(f).deliveries, 0);
    db.sql(`update public.production_logical_assessments set ownership_acquired_at=clock_timestamp()-interval '17 minutes' where id='${f.logical}';`);
    const expired = claim(f); assert.equal(expired.recoverable_runtime_run_id, f.run);
    assert.notEqual(expired.lease_expires_at, null); complete(f, expired.owner_id); assert.equal(counts(f).deliveries, 1);
  });
  await check("NULL requested owner, lease or time fail closed before any ownership update", async () => {
    const f = seed(); finalize(f);
    for (const args of [`null,now()+interval '1 minute',now()`, `'${randomUUID()}',null,now()`, `'${randomUUID()}',now()+interval '1 minute',null`])
      await rejectSql(`select public.claim_production_fulfillment_v3('${f.grant}',${args});`, /PRODUCTION_FULFILLMENT_LEASE_INVALID/u);
    assert.equal(db.sql(`select owner_id from public.production_logical_assessments where id='${f.logical}';`), f.owner);
    await rejectSql(completeSql(f, null), /PRODUCTION_FULFILLMENT_STATE_CONFLICT/u);
    assert.equal(counts(f).deliveries, 0);
  });
  await check("wrong contract, wrong run kind, wrong request source or missing report never recover", () => {
    for (const kind of ["contract", "run_kind", "source", "missing_report"]) {
      const f = seed(); finalize(f);
      if (kind === "contract") db.sql(`update public.assessment_runs set prompt_bundle_version='prompt-bundle-runtime-v16.0.0' where id='${f.run}';`);
      if (kind === "run_kind") db.sql(`update public.assessment_runs set run_kind='initial' where id='${f.run}';`);
      if (kind === "source") db.sql(`update public.assessment_requests set source='internal_review_runtime' where id='${f.request}';`);
      if (kind === "missing_report") db.sql(`delete from public.assessment_reports where run_id='${f.run}';`);
      const result = claim(f); assert.equal(result.disposition, "manual_review", kind);
      assert.equal(result.automatic_rerun, false); assert.equal(counts(f).deliveries, 0); assert.equal(counts(f).runs, 1);
    }
  });
  await check("canonical RPC rejects a completed report belonging to another request", async () => {
    const target = seed(); const other = seed(); finalize(target); finalize(other);
    const current = claim(target);
    await rejectSql(completeSql(target, current.owner_id, other.run), /PRODUCTION_CANONICAL_REPORT_REQUIRED/u);
    assert.equal(counts(target).deliveries, 0); assert.equal(counts(other).deliveries, 0);
    complete(target, current.owner_id); assert.equal(counts(target).deliveries, 1);
  });
  await check("final all-Purchase canonical counts remain at most one and legacy RPCs are unchanged", () => {
    assert.equal(db.sql(`select coalesce(max(n),0) from (select g.purchase_id,count(*) n from public.production_customer_deliveries d
      join public.production_logical_assessments l on l.id=d.logical_assessment_id
      join public.production_assessment_grants g on g.id=l.grant_id group by g.purchase_id) counts;`), "1");
    assert.equal(db.sql(`select pg_get_functiondef('${claimSignature}'::regprocedure);`), oldClaim);
    assert.equal(db.sql(`select pg_get_functiondef('${completeSignature}'::regprocedure);`), oldComplete);
    assert.equal(terminated, 4);
  });
  console.log(`F001 recovery database: ${passed}/${passed} PASS; terminated isolated SQL backends=${terminated}; Provider calls=0; remote operations=0`);
} finally { db.stop(); console.log("F001 isolated PostgreSQL stopped"); }
