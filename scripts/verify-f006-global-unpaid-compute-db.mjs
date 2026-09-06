import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createLocalPostgres } from "./remediation-local-postgres.mjs";

// All actual migrations through 0029, with synthetic fixtures only. A fresh
// native PG17 cluster uses loopback and a credential-free child environment.
// This does not establish remote migration state or Provider cancellation.
const db = await createLocalPostgres("f006-global-compute");
const { sql, parallelSql } = db;
const c1Signature = "public.claim_production_prepayment_compute_unit_v1(uuid,uuid,timestamptz,text,integer,integer,text,integer)";
const claimSignature = "public.claim_global_unpaid_compute_v1(uuid,uuid,uuid,text,integer,integer,text,integer,integer,integer,integer)";
const releaseSignature = "public.release_global_unpaid_compute_v1(uuid,integer)";
function rejected(statement, pattern) {
  assert.throws(() => sql(statement), pattern);
}
const hash = (n) => n.toString(16).padStart(64, "0");
const fixtures = Array.from({ length: 32 }, (_, i) => ({ customer: randomUUID(), preparation: randomUUID(), request: randomUUID(), n: i + 1 }));
function expression(index = 0, options = {}) {
  const { invocation = randomUUID(), customer = fixtures[index].customer, preparation = fixtures[index].preparation,
    customerMaximum = 100, stage = "PB-01", attempt = 1, window = 60, maximum = 100, concurrency = 2 } = options;
  return `public.claim_global_unpaid_compute_v1('${invocation}','${customer}','${preparation}',
    'm2-c1-prepayment-compute-v1',86400,${customerMaximum},'${stage}',${attempt},${window},${maximum},${concurrency})`;
}
const claim = (index = 0, options) => JSON.parse(sql(`set role service_role; select ${expression(index, options)};`));
const release = (receipt) => sql(`set role service_role; select public.release_global_unpaid_compute_v1('${receipt.invocation_id}',${receipt.slot_number});`);
const snapshot = () => sql(`select jsonb_build_object('global',coalesce((select used_invocations from public.global_unpaid_compute_budget),0),
  'customer',coalesce((select sum(used_provider_invocation_units) from public.production_prepayment_compute_budgets),0),
  'active',(select count(*) from public.global_unpaid_compute_slots where lease_expires_at>clock_timestamp()),
  'stored',(select count(*) from public.global_unpaid_compute_slots));`);
const counts = () => JSON.parse(snapshot());
const reset = () => sql("delete from public.global_unpaid_compute_budget; delete from public.production_prepayment_compute_budgets; update public.global_unpaid_compute_slots set invocation_id=null,lease_expires_at=null;");
let passed = 0, originalC1, terminated = 0;
async function check(name, run) { await run(); console.log(`PASS F006 DB ${++passed} ${name}`); }
async function terminateAfterCommittedClaim() {
  const applicationName = `f006-fault-${randomUUID()}`;
  const running = db.startSql(`set application_name='${applicationName}'; set role service_role;
    begin; select ${expression(0, { concurrency: 1 })}; commit; select pg_sleep(9);`);
  let finished;
  void running.result.then((result) => { finished = result; });
  let pid;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (finished) assert.fail(`fault process ended before committed boundary: ${finished.error}`);
    const found = sql(`select pid from pg_stat_activity where application_name='${applicationName}' and wait_event='PgSleep';`);
    if (found) { assert.match(found, /^[0-9]+$/u); pid = Number(found); break; }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.ok(pid, "dedicated synthetic backend must pass claim commit");
  assert.equal(sql(`select pg_terminate_backend(${pid});`), "t");
  const result = await running.result;
  assert.notEqual(result.code, 0); assert.match(result.error, /terminating connection|server closed the connection/u);
  terminated++;
  return JSON.parse(result.output.split(/\r?\n/u).find((line) => line.startsWith("{")));
}
try {
  const applied = db.applyThrough(29, (file) => {
    if (file.startsWith("0029_")) originalC1 = sql(`select pg_get_functiondef('${c1Signature}'::regprocedure);`);
  });
  sql("create table public.paid_ledger_sentinel(value text); insert into public.paid_ledger_sentinel values('unchanged');");
  for (const f of fixtures) sql(`insert into auth.users(id) values('${f.customer}');
    insert into public.assessment_requests(id,idempotency_key,source,raw_situation,relationship,
      requested_topics,privacy_acknowledged,status,created_at,updated_at)
      values('${f.request}','${f.request}','production_fulfillment_runtime','synthetic global compute fixture',
      'dating','["next_action"]',true,'processing',now(),now());
    insert into public.production_preparations(id,assessment_request_id,idempotency_key_hash,consultation_snapshot_sha256,
      consultation_snapshot_json,safety_authority_json,status,created_at,updated_at)
      values('${f.preparation}','${f.request}','${hash(f.n)}','${hash(100 + f.n)}','{}',
      '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}','preparing',now(),now());
    insert into public.production_customer_ownership_bindings(id,ownership_reference_id,customer_user_id,preparation_id,
      delivery_email_sha256,delivery_email_ciphertext,delivery_email_key_version,delivery_email_verified_source,
      delivery_email_verified_at,state,bound_at,created_at,updated_at)
      values('${randomUUID()}','${randomUUID()}','${f.customer}','${f.preparation}','${hash(200 + f.n)}',
      'synthetic-only','test-v1','supabase_email_otp',now(),'active',now(),now(),now());
    insert into public.production_prepayment_execution_authorities(preparation_id,execution_capability_hash,state,
      execution_started_at,created_at,updated_at) values('${f.preparation}','${hash(300 + f.n)}','executing',now(),now(),now());`);
  await check("actual migrations 0002 through 0029 preserve exact Customer function and create 32 fixed slots", () => {
    assert.equal(applied[0].slice(0, 4), "0002"); assert.equal(applied.at(-1).slice(0, 4), "0029");
    assert.equal(sql(`select pg_get_functiondef('${c1Signature}'::regprocedure);`), originalC1);
    assert.deepEqual(counts(), { global: 0, customer: 0, active: 0, stored: 32 });
    assert.equal(sql("select value from public.paid_ledger_sentinel;"), "unchanged");
  });
  await check("RLS and function-only service ACL reject all raw application access", () => {
    for (const name of ["global_unpaid_compute_budget", "global_unpaid_compute_slots"]) {
      assert.equal(sql(`select relrowsecurity from pg_class where oid='public.${name}'::regclass;`), "t");
      for (const role of ["anon", "authenticated", "m2_b2_stripe_ingress", "service_role"])
        assert.equal(sql(`select has_table_privilege('${role}','public.${name}','SELECT,INSERT,UPDATE,DELETE');`), "f");
    }
    for (const signature of [claimSignature, releaseSignature]) {
      assert.equal(sql(`select prosecdef from pg_proc where oid='${signature}'::regprocedure;`), "t");
      for (const role of ["anon", "authenticated", "m2_b2_stripe_ingress", "service_role"])
        assert.equal(sql(`select has_function_privilege('${role}','${signature}','EXECUTE');`), role === "service_role" ? "t" : "f");
    }
    rejected(`set role anon; select ${expression()};`, /permission denied/u);
  });
  await check("twenty Customers atomically consume exactly three global units", async () => {
    reset();
    const results = (await Promise.all(Array.from({ length: 20 }, (_, i) => parallelSql(`set role service_role; select ${expression(i, { maximum: 3, concurrency: 32 })};`)))).map(JSON.parse);
    assert.equal(results.filter((r) => r.disposition === "acquired").length, 3);
    assert.equal(results.filter((r) => r.disposition === "global_exhausted").length, 17);
    assert.deepEqual(counts(), { global: 3, customer: 3, active: 3, stored: 32 });
    const before = snapshot(); assert.equal(claim(20, { maximum: 3, concurrency: 32 }).disposition, "global_exhausted");
    assert.equal(snapshot(), before);
  });
  await check("concurrency caps independent instances without burning denied Customer units", async () => {
    reset();
    const results = (await Promise.all(Array.from({ length: 20 }, (_, i) => parallelSql(`set role service_role; select ${expression(i)};`)))).map(JSON.parse);
    assert.equal(results.filter((r) => r.disposition === "acquired").length, 2);
    assert.equal(results.filter((r) => r.disposition === "concurrency_exhausted").length, 18);
    assert.deepEqual(counts(), { global: 2, customer: 2, active: 2, stored: 32 });
    const receipt = results.find((r) => r.disposition === "acquired");
    assert.equal(release(receipt), "t"); assert.equal(release(receipt), "f");
    assert.deepEqual(counts(), { global: 2, customer: 2, active: 1, stored: 32 });
    assert.equal(claim(20).disposition, "acquired");
    assert.deepEqual(counts(), { global: 3, customer: 3, active: 2, stored: 32 });
  });
  await check("existing Customer quota remains independently binding without global debit", () => {
    reset(); const receipt = claim(0, { customerMaximum: 1 }); assert.equal(receipt.disposition, "acquired");
    release(receipt);
    assert.equal(claim(0, { customerMaximum: 1 }).disposition, "customer_exhausted");
    assert.deepEqual(counts(), { global: 1, customer: 1, active: 0, stored: 32 });
    assert.equal(claim(1).disposition, "acquired");
  });
  await check("lost-ack replay cannot grant a second invocation under a single debit", () => {
    reset(); const invocation = randomUUID(); const receipt = claim(0, { invocation });
    const before = snapshot(); assert.equal(claim(0, { invocation }).disposition, "duplicate");
    assert.equal(claim(1, { invocation }).disposition, "duplicate"); assert.equal(snapshot(), before);
    assert.equal(receipt.disposition, "acquired");
    assert.equal(sql(`select extract(epoch from (lease_expires_at-clock_timestamp())) between 235 and 240 from public.global_unpaid_compute_slots where invocation_id='${invocation}';`), "t");
  });
  await check("invalid Customer ownership, missing authority and Paid stages roll back all counters", () => {
    reset();
    rejected(`set role service_role; select ${expression(0, { customer: fixtures[1].customer })};`, /M2_C1_EXECUTION_AUTHORIZATION_INVALID/u);
    rejected(`set role service_role; select ${expression(0, { preparation: randomUUID() })};`, /F006_CUSTOMER_AUTHORITY_INVALID/u);
    for (const stage of ["PB-04", "PB-08", "PB-09"]) rejected(`set role service_role; select ${expression(0, { stage })};`, /M2_C1_COMPUTE_POLICY_INVALID/u);
    sql(`delete from public.production_prepayment_execution_authorities where preparation_id='${fixtures[31].preparation}';`);
    // Reproduce the old nullable <> comparison, then verify the new wrapper's
    // explicit presence guard without rewriting the historical function.
    assert.equal(sql(`set role service_role; select public.claim_production_prepayment_compute_unit_v1(
      '${fixtures[31].customer}','${fixtures[31].preparation}',clock_timestamp(),
      'm2-c1-prepayment-compute-v1',86400,100,'PB-01',1);`), "acquired");
    reset();
    rejected(`set role service_role; select ${expression(31)};`, /F006_CUSTOMER_AUTHORITY_INVALID/u);
    rejected(`set role service_role; select ${expression(0, { maximum: 0 })};`, /F006_COMPUTE_INPUT_INVALID/u);
    rejected(`set role service_role; select ${expression(0, { concurrency: 33 })};`, /F006_COMPUTE_INPUT_INVALID/u);
    rejected(`set role service_role; select ${expression(0, { attempt: 3 })};`, /M2_C1_COMPUTE_POLICY_INVALID/u);
    assert.deepEqual(counts(), { global: 0, customer: 0, active: 0, stored: 32 });
  });
  await check("fault after Customer debit rolls back Customer, global unit and slot together", () => {
    reset();
    sql(`create function public.f006_fixture_fail_slot() returns trigger language plpgsql as $fault$ begin
      raise exception 'F006_SYNTHETIC_FAILURE_AFTER_CUSTOMER_DEBIT'; end; $fault$;
      create trigger f006_fixture_fail_slot before update on public.global_unpaid_compute_slots for each row execute function public.f006_fixture_fail_slot();`);
    try { rejected(`set role service_role; select ${expression()};`, /F006_SYNTHETIC_FAILURE_AFTER_CUSTOMER_DEBIT/u); }
    finally { sql("drop trigger f006_fixture_fail_slot on public.global_unpaid_compute_slots; drop function public.f006_fixture_fail_slot();"); }
    assert.deepEqual(counts(), { global: 0, customer: 0, active: 0, stored: 32 });
  });
  await check("actual backend termination after committed claim retains quota and slot; stale release is fenced", async () => {
    reset();
    const old = await terminateAfterCommittedClaim(); assert.equal(old.disposition, "acquired");
    assert.deepEqual(counts(), { global: 1, customer: 1, active: 1, stored: 32 });
    assert.equal(claim(1, { concurrency: 1 }).disposition, "concurrency_exhausted");
    sql(`update public.global_unpaid_compute_slots set lease_expires_at=clock_timestamp()-interval '1 second' where invocation_id='${old.invocation_id}';`);
    const current = claim(1, { concurrency: 1 }); assert.equal(current.disposition, "acquired");
    assert.equal(current.slot_number, old.slot_number); assert.equal(release(old), "f");
    assert.deepEqual(counts(), { global: 2, customer: 2, active: 1, stored: 32 });
    assert.equal(release(current), "t"); assert.equal(counts().global, 2);
  });
  await check("active policy cannot change to reset a quota; DB expiry alone opens a fresh window", () => {
    reset(); const receipt = claim(0, { maximum: 1 }); release(receipt);
    const before = snapshot();
    for (const options of [{ maximum: 2 }, { maximum: 1, window: 120 }, { maximum: 1, concurrency: 3 }])
      rejected(`set role service_role; select ${expression(1, options)};`, /F006_ACTIVE_POLICY_MISMATCH/u);
    assert.equal(snapshot(), before); assert.equal(claim(1, { maximum: 1 }).disposition, "global_exhausted");
    sql("update public.global_unpaid_compute_budget set window_started_at=now()-interval '61 seconds',window_expires_at=now()-interval '61 seconds'+make_interval(secs=>window_seconds);");
    assert.equal(claim(0, { maximum: 2, window: 120 }).disposition, "acquired");
    assert.deepEqual(counts(), { global: 1, customer: 2, active: 1, stored: 32 });
    assert.equal(sql("select maximum_invocations||':'||window_seconds from public.global_unpaid_compute_budget;"), "2:120");
  });
  await check("parallel releases and claims preserve bounded slots without lock cycles", async () => {
    reset();
    const receipts = Array.from({ length: 8 }, (_, i) => claim(i, { concurrency: 8 }));
    await Promise.all(receipts.map((receipt, i) => parallelSql(`set role service_role;
      select public.release_global_unpaid_compute_v1('${receipt.invocation_id}',${receipt.slot_number});
      select ${expression(i + 8, { concurrency: 8 })};`)));
    assert.deepEqual(counts(), { global: 16, customer: 16, active: 8, stored: 32 });
  });
  await check("final exact C1 function and Paid sentinel remain untouched", () => {
    assert.equal(sql(`select pg_get_functiondef('${c1Signature}'::regprocedure);`), originalC1);
    assert.equal(sql("select value from public.paid_ledger_sentinel;"), "unchanged");
    assert.equal(sql("select count(*) from public.global_unpaid_compute_budget;"), "1");
  });
  assert.equal(terminated, 1);
  console.log(`F006 global unpaid database: ${passed}/${passed} PASS; terminated isolated SQL backends=${terminated}; remote operations=0`);
} finally { db.stop(); console.log("F006 isolated PostgreSQL stopped"); }
