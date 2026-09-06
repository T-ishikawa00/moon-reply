import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { verifyMigrationAuthorityLayers } from "./remediation-migration-authority.mjs";

// Full 0002-0032 chain, isolated PostgreSQL 17 on loopback. All rows below
// are synthetic, including report/projection JSON. No env files, existing DB,
// Provider, queue, email, or other external service is used.
async function verifyCutover({ db, installer, mode, baseline }) {
const migrationFile = "0032_f004_notification_cutover_fence.sql";
const migration = readFileSync(`supabase/migrations/${migrationFile}`, "utf8");
const digest = (value) => createHash("sha256").update(value).digest("hex");
const id = (prefix, n) => `${prefix}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const legacySeed = readFileSync("supabase/tests/m2_b2_i2_private_reconciliation_r1.sql", "utf8").replaceAll("\r\n", "\n");
const fixtureSeed = legacySeed.slice(legacySeed.indexOf("insert into auth.users"),
  legacySeed.indexOf("update public.production_payment_attempts set\n  reconciliation_retry_after"));
const f = (n) => ({ request: id("17", n), preparation: id("27", n), intent: id("57", n),
  payment: id("77", n), job: id("87", n), purchase: id("a1", n), grant: id("a2", n),
  logical: id("a3", n), run: id("a4", n), delivery: id("a5", n), notification: id("a6", n),
  handoff: id("a7", n), credential: id("a8", n), owner: id("a9", n) });
const serviceSql = (statement) => db.sql(`set role service_role; ${statement}`);
const outbox = (n) => JSON.parse(db.sql(`select to_jsonb(n) from public.production_notification_outbox n where id='${f(n).notification}';`));
const canonical = () => db.sql(`select jsonb_build_object(
  'deliveries',(select jsonb_agg(to_jsonb(d) order by d.id) from public.production_customer_deliveries d),
  'jobs',(select jsonb_agg(to_jsonb(j) order by j.id) from public.production_fulfillment_jobs j),
  'payments',(select jsonb_agg(to_jsonb(p) order by p.id) from public.production_verified_payments p),
  'handoffs',(select jsonb_agg(to_jsonb(c)-'f004_legacy_sent_cutover_protected' order by c.id)
    from public.production_result_credentials c where purpose='customer_handoff'));`);
const claimExpr = (n, version = 3, owner = f(n).owner, now = "clock_timestamp()") =>
  `public.claim_production_notification_v${version}('${f(n).notification}','${owner}',${now}+interval '16 minutes',${now})`;
const claim = (n, version = 3, owner) => JSON.parse(serviceSql(`select ${claimExpr(n, version, owner)};`));
const prepare = (n) => serviceSql(`select public.prepare_production_notification_email_v1('${f(n).notification}',
  '${f(n).owner}','${f(n).credential}','${digest(`mail-${n}`)}','synthetic-envelope-${n}',clock_timestamp());`);
const send = (n) => serviceSql(`select public.begin_production_notification_send_v1('${f(n).notification}','${f(n).owner}',clock_timestamp());`);
const complete = (n) => serviceSql(`select public.complete_production_notification_v2('${f(n).notification}','${f(n).owner}','synthetic-mail-${n}',clock_timestamp());`);
const fail = (n, code = "PRODUCTION_NOTIFICATION_SEND_OUTCOME_UNKNOWN") => serviceSql(`select public.fail_production_notification_v2(
  '${f(n).notification}','${f(n).owner}','${code}',clock_timestamp());`);
const reserveExpr = (environment = "test") => `public.claim_production_notification_cutover_recovery_v1('${environment}')`;
const reserve = (environment) => { const result = serviceSql(`select ${reserveExpr(environment)};`); return result ? JSON.parse(result) : null; };
const resetClock = () => db.sql("update public.production_notification_cutover_recovery_clock set next_claim_at='-infinity';");
let passed = 0;
async function check(name, action) { await action(); console.log(`PASS F004 cutover DB ${mode} ${++passed} ${name}`); }
async function rejects(statement, pattern, role = "service_role") {
  const result = await db.startSql(`${role ? `set role ${role};` : ""} ${statement}`).result;
  assert.notEqual(result.code, 0, "SQL must fail closed"); assert.match(result.error, pattern);
}
async function rejectsMigration(statement, pattern) {
  const result = await installer.startSql(statement).result;
  assert.notEqual(result.code, 0, "Migration must fail closed under its actual installer authority");
  assert.match(result.error, pattern);
}
async function waitFor(query) {
  for (let n = 0; n < 80; n++) {
    if (db.sql(query) === "t") return;
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
  assert.fail("synthetic concurrent SQL did not reach its observed boundary");
}
function seedCanonical(n) {
  const row = f(n);
  db.sql(`update public.production_payment_attempts set state='pending',provider_checkout_session_id='cs_test_m2_b2_i2_${n}',
    provider_checkout_url='https://checkout.stripe.com/c/pay/synthetic-${n}' where id='${id("67", n)}';
    set role service_role;
    select public.record_rc2_stripe_evidence_v2('evt_f004_${n}','webhook','checkout.session.completed',clock_timestamp(),
      '${digest(`event-${n}`)}','test','${row.intent}','cs_test_m2_b2_i2_${n}','pi_f004_${n}',
      'payment','paid',980,'jpy','verified',null,'${row.payment}','${row.job}',clock_timestamp());`);
  // FK/check-valid canonical fixtures; no constraints/triggers are disabled.
  db.sql(`insert into public.production_purchases(id,preparation_id,purchase_authority_reference_hash,verified_at)
    values('${row.purchase}','${row.preparation}','${digest(`purchase-${n}`)}',now());
    insert into public.production_assessment_grants(id,purchase_id,preparation_id,delivery_authority_reference,status,issued_at)
    values('${row.grant}','${row.purchase}','${row.preparation}','purchase-delivery:${row.intent}','completed',now());
    insert into public.production_logical_assessments(id,grant_id,preparation_id,assessment_request_id,status,
      attempt_count,recovery_state,created_at,completed_at,updated_at)
    values('${row.logical}','${row.grant}','${row.preparation}','${row.request}','completed',1,'completed',now(),now(),now());
    insert into public.assessment_runs(id,request_id,status,requested_model,prompt_bundle_version,schema_set_version,
      stage_topology_version,run_kind,total_input_tokens,total_cached_tokens,total_output_tokens,total_reasoning_tokens,
      usage_derived_cost_usd,started_at)
    values('${row.run}','${row.request}','completed','gpt-5.6-luna','prompt-bundle-runtime-v17.0.0',
      'pipeline-schema-runtime-v6.0.0','split-base-candidate-v1','fulfillment_resume',0,0,0,0,0,now());
    insert into public.production_customer_deliveries(id,logical_assessment_id,runtime_run_id,experience_projection_json,
      projection_sha256,delivery_authority_reference,created_at)
    values('${row.delivery}','${row.logical}','${row.run}','{"synthetic_f004_cutover":true}',
      '${digest(`projection-${n}`)}','purchase-delivery:${row.intent}',now());
    insert into public.production_result_credentials(id,delivery_id,token_hash,purpose,issued_at)
    values('${row.handoff}','${row.delivery}','${digest(`handoff-${n}`)}','customer_handoff',now());
    insert into public.production_notification_outbox(id,delivery_id,delivery_authority_reference,status,requested_at,updated_at)
    values('${row.notification}','${row.delivery}','purchase-delivery:${row.intent}','pending',now(),now());
    update public.production_fulfillment_jobs set state='completed',grant_id='${row.grant}',logical_assessment_id='${row.logical}',
      completed_at=now(),dispatch_marker='rc2-dispatch:${row.job}',dispatch_completed_at=now() where id='${row.job}';`);
  return row;
}

  assert.equal(baseline.length, 30);
  db.sql(fixtureSeed);
  for (let n = 1; n <= 11; n++) seedCanonical(n);
  // Faithful legacy successful send: claim, credential, provider acknowledgement,
  // completion. An old callback may still attempt revoke after losing that ACK.
  assert.equal(claim(1, 2).disposition, "acquired");
  serviceSql(`insert into public.production_result_credentials(id,delivery_id,token_hash,purpose,issued_at)
    values('${f(1).credential}','${f(1).delivery}','${digest("legacy-mail")}','notification',clock_timestamp());`);
  complete(1);
  const canonicalBefore = canonical();
  const pendingBefore = outbox(2);
  const beforeDefinition = db.sql("select pg_get_functiondef('public.claim_production_notification_v2(uuid,uuid,timestamptz,timestamptz)'::regprocedure);");
  const detachAuthority = db.sql("select prosecdef,proacl,proconfig from pg_proc where oid='public.detach_production_customer_identity_v1(uuid,uuid,timestamptz)'::regprocedure;");
  const oldDetachSource = db.sql("select pg_get_functiondef('public.detach_production_customer_identity_v1(uuid,uuid,timestamptz)'::regprocedure);");
  if (mode === "restricted-owner") await check("failed Production artifact reproduces unauthorized custom SET and rolls back", async () => {
    const oldMigration = execFileSync("git", ["show", "0014a1f001d5b6f82cfd13532b2f4ccbcd8b5299:supabase/migrations/0032_f004_notification_cutover_fence.sql"],
      { encoding: "utf8", windowsHide: true });
    await rejectsMigration(oldMigration, /permission denied to set parameter "moon_reply.f004_identity_detach"/u);
    assert.equal(db.sql("select exists(select 1 from information_schema.columns where table_schema='public' and table_name='production_result_credentials' and column_name='f004_legacy_sent_cutover_protected');"), "f");
    assert.equal(db.sql("select pg_get_functiondef('public.claim_production_notification_v2(uuid,uuid,timestamptz,timestamptz)'::regprocedure);"), beforeDefinition);
    assert.deepEqual(outbox(2), pendingBefore); assert.equal(canonical(), canonicalBefore);
  });
  await check("0024 still lets old sender acquire untouched pending; rollback isolates reproduction", async () => {
    const result = db.sql(`set role service_role; begin; select ${claimExpr(2, 2)}->>'disposition'; rollback;`);
    assert.equal(result, "acquired"); assert.deepEqual(outbox(2), pendingBefore);
  });
  await check("unsafe legacy live, expired, NULL lease, failed, unknown and multi-attempt sent reject atomically", async () => {
    const variants = [
      `select ${claimExpr(2, 2)};`,
      `select ${claimExpr(2, 2)}; update public.production_notification_outbox set lease_expires_at=clock_timestamp()-interval '1 hour' where id='${f(2).notification}';`,
      `select ${claimExpr(2, 2)}; update public.production_notification_outbox set lease_expires_at=null where id='${f(2).notification}';`,
      `update public.production_notification_outbox set status='failed',attempt_count=1,last_error_code='PRODUCTION_NOTIFICATION_SEND_OUTCOME_UNKNOWN' where id='${f(2).notification}';`,
      `update public.production_notification_outbox set attempt_count=2 where id='${f(1).notification}';`,
      `update public.production_result_credentials set revoked_at=now() where id='${f(1).credential}';`,
      `insert into public.production_result_credentials(id,delivery_id,token_hash,purpose,issued_at) values('${randomUUID()}','${f(2).delivery}','${digest("orphan-mail")}','notification',now());`,
    ];
    for (const variant of variants) {
      await rejectsMigration(`begin; ${variant} ${migration}`, /F004_CUTOVER_LEGACY_SEND_UNSAFE/u);
      assert.deepEqual(outbox(2), pendingBefore);
      assert.equal(db.sql("select to_regclass('public.production_notification_cutover_recovery_clock') is null;"), "t");
      assert.equal(db.sql("select pg_get_functiondef('public.claim_production_notification_v2(uuid,uuid,timestamptz,timestamptz)'::regprocedure);"), beforeDefinition);
    }
    assert.equal(canonical(), canonicalBefore);
  });
  await check("unexpected pre-cutover versioned history is rejected without discarding its state", async () => {
    await rejectsMigration(`begin; select ${claimExpr(2, 3)}; ${migration}`, /F004_CUTOVER_UNEXPECTED_VERSIONED_HISTORY/u);
    assert.deepEqual(outbox(2), pendingBefore);
  });
  await check("migration locks serialize an old body already waiting at its table access", async () => {
    const paused = migration.replace("do $preflight$", "select pg_sleep(1);\ndo $preflight$");
    const migrationTask = installer.startSql(`set application_name='f004-migration-barrier'; ${paused}`);
    await waitFor("select exists(select 1 from pg_stat_activity where application_name='f004-migration-barrier' and wait_event='PgSleep');");
    const oldTask = db.startSql(`set application_name='f004-old-at-cutover'; set role service_role; select ${claimExpr(2, 2)};`);
    const oldRevoke = db.startSql(`set application_name='f004-old-revoke-at-cutover'; set role service_role;
      update public.production_result_credentials set revoked_at=clock_timestamp() where id='${f(1).credential}';`);
    const oldDetach = db.startSql(`set application_name='f004-old-detach-at-cutover'; set role service_role;
      select public.detach_production_customer_identity_v1('37000000-0000-4000-8000-000000000001','${randomUUID()}',clock_timestamp());`);
    const [migrated, old, revoke, detached] = await Promise.all([migrationTask.result, oldTask.result, oldRevoke.result, oldDetach.result]);
    assert.equal(migrated.code, 0, migrated.error);
    if (old.code === 0) assert.equal(JSON.parse(old.output).disposition, "in_progress");
    else assert.match(old.error, /F004_LEGACY_NOTIFICATION_CLAIM_FENCED/u);
    assert.notEqual(revoke.code, 0); assert.match(revoke.error, /F004_LEGACY_NOTIFICATION_REVOCATION_FENCED/u);
    assert.notEqual(detached.code, 0); assert.match(detached.error, /F004_LEGACY_NOTIFICATION_REVOCATION_FENCED/u);
    assert.equal(db.sql("select count(*) from public.production_customer_ownership_bindings where state='active';"), "12");
    const { email_sender_claim_generation, email_cutover_recovery_after, ...after } = outbox(2);
    assert.equal(email_sender_claim_generation, 0); assert.equal(email_cutover_recovery_after, null);
    assert.deepEqual(after, pendingBefore);
    assert.equal(canonical(), canonicalBefore);
  });
  await check("schema expansion and new guards/RPC remain confined to their service authority", () => {
    for (const signature of ["claim_production_notification_cutover_recovery_v1(text)",
      "guard_f004_notification_sender_claim_v1()", "guard_f004_legacy_notification_revocation_v1()"])
      for (const role of ["anon", "authenticated", "m2_b2_stripe_ingress", "service_role"])
        assert.equal(db.sql(`select has_function_privilege('${role}','public.${signature}','EXECUTE');`), role === "service_role" ? "t" : "f");
    for (const role of ["anon", "authenticated", "m2_b2_stripe_ingress", "service_role"])
      assert.equal(db.sql(`select has_table_privilege('${role}','public.production_notification_cutover_recovery_clock','SELECT,INSERT,UPDATE,DELETE');`), "f");
    assert.equal(db.sql("select relrowsecurity from pg_class where oid='public.production_notification_cutover_recovery_clock'::regclass;"), "t");
    assert.equal(db.sql("select prosecdef from pg_proc where oid='public.claim_production_notification_cutover_recovery_v1(text)'::regprocedure;"), "t");
  });
  await check("new runtime absent: old v1/v2 cannot mutate pre/post-cutover pending or allocate credentials", () => {
    seedCanonical(12);
    for (const n of [2, 12]) {
      const before = outbox(n);
      const credentials = db.sql("select count(*) from public.production_result_credentials;");
      for (let attempt = 0; attempt < 12; attempt++) assert.equal(claim(n, 2).disposition, "in_progress");
      assert.equal(serviceSql(`select public.claim_production_notification_v1('${f(n).notification}','${f(n).owner}',clock_timestamp());`), "");
      assert.deepEqual(outbox(n), before);
      assert.equal(db.sql("select count(*) from public.production_result_credentials;"), credentials);
    }
    assert.equal(claim(1, 2).disposition, "sent");
  });
  await check("lost completion ACK cannot let legacy service-role catch revoke delivered URL", async () => {
    const before = db.sql(`select to_jsonb(c) from public.production_result_credentials c where id='${f(1).credential}';`);
    await rejects(`update public.production_result_credentials set revoked_at=clock_timestamp() where id='${f(1).credential}';`, /F004_LEGACY_NOTIFICATION_REVOCATION_FENCED/u);
    assert.equal(db.sql(`select to_jsonb(c) from public.production_result_credentials c where id='${f(1).credential}';`), before);
    // Explicit owner security revocation remains available; rollback this test.
    assert.equal(db.sql(`begin; update public.production_result_credentials set revoked_at=clock_timestamp() where id='${f(1).credential}';
      select revoked_at is not null from public.production_result_credentials where id='${f(1).credential}'; rollback;`), "t");
  });
  await check("existing identity-detachment RPC preserves authority, exact revocation and idempotence without bypass state", async () => {
    assert.equal(db.sql("select prosecdef,proacl,proconfig from pg_proc where oid='public.detach_production_customer_identity_v1(uuid,uuid,timestamptz)'::regprocedure;"), detachAuthority);
    const lines = db.sql(`begin; set role service_role;
      select public.detach_production_customer_identity_v1('37000000-0000-4000-8000-000000000001','${randomUUID()}',clock_timestamp());
      select revoked_at is not null from public.production_result_credentials where id='${f(1).credential}';
      select count(*) from public.production_customer_ownership_bindings where state='active';
      select count(*) from public.production_customer_ownership_bindings where state='identity_detached'
        and customer_user_id is null and delivery_email_sha256 is null and delivery_email_ciphertext is null;
      select public.detach_production_customer_identity_v1('37000000-0000-4000-8000-000000000001','${randomUUID()}',clock_timestamp()); rollback;`).split(/\r?\n/u);
    assert.deepEqual(JSON.parse(lines[0]), { disposition: "completed", detached_binding_count: 12 });
    assert.deepEqual(lines.slice(1, 4), ["t", "0", "12"]);
    assert.deepEqual(JSON.parse(lines[4]), { disposition: "completed", detached_binding_count: 0 });
    // A harmless call cannot authorize a later unrelated direct UPDATE.
    await rejects(`begin; select public.detach_production_customer_identity_v1('${randomUUID()}','${randomUUID()}',clock_timestamp());
      update public.production_result_credentials set revoked_at=clock_timestamp() where id='${f(1).credential}';`,
      /F004_LEGACY_NOTIFICATION_REVOCATION_FENCED/u);
    await rejects(`begin;
      alter table public.production_customer_ownership_bindings add constraint f004_test_detach_reject check(state<>'identity_detached');
      set role service_role;
      do $test$ begin
        begin
          perform public.detach_production_customer_identity_v1('37000000-0000-4000-8000-000000000001','${randomUUID()}',clock_timestamp());
          raise exception 'F004_TEST_DETACH_EXPECTED_FAILURE';
        exception when check_violation then null;
        end;
      end $test$;
      update public.production_result_credentials set revoked_at=clock_timestamp() where id='${f(1).credential}';`,
      /F004_LEGACY_NOTIFICATION_REVOCATION_FENCED/u, null);
    assert.equal(db.sql(`select revoked_at is null from public.production_result_credentials where id='${f(1).credential}';`), "t");
  });
  const secondCustomer = "37000000-0000-4000-8000-000000000002";
  const otherCustomerFixture = `insert into auth.users(id) values('${secondCustomer}');
    update public.production_customer_ownership_bindings set customer_user_id='${secondCustomer}'
      where preparation_id='${f(12).preparation}';
    insert into public.production_result_credentials(id,delivery_id,token_hash,purpose,issued_at)
      values('${randomUUID()}','${f(1).delivery}','${digest("recovery-customer-1")}','recovery',now());`;
  await check("detachment revokes every credential purpose only for the exact customer; unrelated detach cannot bypass fence", async () => {
    const lines = db.sql(`begin; ${otherCustomerFixture} set role service_role;
      select public.detach_production_customer_identity_v1('37000000-0000-4000-8000-000000000001','${randomUUID()}',now());
      select count(*) from public.production_result_credentials where revoked_at is not null;
      select string_agg(distinct purpose,',' order by purpose) from public.production_result_credentials where revoked_at is not null;
      select revoked_at is null from public.production_result_credentials where id='${f(12).handoff}';
      select state from public.production_customer_ownership_bindings where preparation_id='${f(12).preparation}'; rollback;`).split(/\r?\n/u);
    assert.deepEqual(JSON.parse(lines[0]), { disposition: "completed", detached_binding_count: 11 });
    assert.deepEqual(lines.slice(1), ["13", "customer_handoff,notification,recovery", "t", "active"]);
    await rejects(`begin; ${otherCustomerFixture} set role service_role;
      select public.detach_production_customer_identity_v1('${secondCustomer}','${randomUUID()}',now());
      update public.production_result_credentials set revoked_at=clock_timestamp() where id='${f(1).credential}';`,
      /F004_LEGACY_NOTIFICATION_REVOCATION_FENCED/u, null);
  });
  await check("a matching detached binding with a different timestamp does not authorize an old revoke", async () => {
    await rejects(`begin;
      select public.detach_production_customer_identity_v1('37000000-0000-4000-8000-000000000001','${randomUUID()}',now()-interval '1 minute');
      update public.production_result_credentials set revoked_at=null where id='${f(1).credential}';
      set role service_role;
      update public.production_result_credentials set revoked_at=now() where id='${f(1).credential}';`,
      /F004_LEGACY_NOTIFICATION_REVOCATION_FENCED/u, null);
  });
  await check("credential failure after binding transition rolls back identity and every credential", () => {
    const before = canonical();
    const lines = db.sql(`begin;
      alter table public.production_result_credentials add constraint f004_test_revoke_reject check(revoked_at is null);
      set role service_role;
      do $test$ begin
        begin
          perform public.detach_production_customer_identity_v1('37000000-0000-4000-8000-000000000001','${randomUUID()}',now());
          raise exception 'F004_TEST_EXPECTED_CREDENTIAL_FAILURE';
        exception when check_violation then null;
        end;
      end $test$;
      select count(*) from public.production_customer_ownership_bindings where state='active';
      select count(*) from public.production_result_credentials where revoked_at is not null; rollback;`).split(/\r?\n/u);
    assert.deepEqual(lines, ["12", "0"]); assert.equal(canonical(), before);
  });
  await check("a stale detachment body fails atomically; retry through current RPC completes without a bypass", () => {
    const stale = oldDetachSource.replace("public.detach_production_customer_identity_v1", "public.f004_test_legacy_detach");
    const lines = db.sql(`begin; ${stale};
      revoke all on function public.f004_test_legacy_detach(uuid,uuid,timestamptz) from public;
      grant execute on function public.f004_test_legacy_detach(uuid,uuid,timestamptz) to service_role;
      set role service_role;
      do $test$ begin
        begin
          perform public.f004_test_legacy_detach('37000000-0000-4000-8000-000000000001','${randomUUID()}',now());
          raise exception 'F004_TEST_EXPECTED_LEGACY_DETACH_FAILURE';
        exception when raise_exception then
          if sqlerrm <> 'F004_LEGACY_NOTIFICATION_REVOCATION_FENCED' then raise; end if;
        end;
      end $test$;
      select count(*) from public.production_customer_ownership_bindings where state='active';
      select count(*) from public.production_result_credentials where revoked_at is not null;
      select public.detach_production_customer_identity_v1('37000000-0000-4000-8000-000000000001','${randomUUID()}',now());
      select revoked_at is not null from public.production_result_credentials where id='${f(1).credential}'; rollback;`).split(/\r?\n/u);
    assert.deepEqual(lines.slice(0, 2), ["12", "0"]);
    assert.deepEqual(JSON.parse(lines[2]), { disposition: "completed", detached_binding_count: 12 });
    assert.equal(lines[3], "t");
  });
  await check("new sender acquires pending and old/new workers cannot overlap ownership", async () => {
    const responses = await Promise.all([
      db.parallelSql(`set role service_role; begin; select ${claimExpr(3)}->>'disposition'; select pg_sleep(0.2); commit;`),
      db.parallelSql(`set role service_role; select ${claimExpr(3, 2)}->>'disposition';`),
      db.parallelSql(`set role service_role; select ${claimExpr(3, 3, randomUUID())}->>'disposition';`),
    ]);
    assert.deepEqual(responses.sort(), ["acquired", "in_progress", "in_progress"]);
    assert.equal(outbox(3).attempt_count, 1); assert.equal(outbox(3).email_sender_claim_generation, 1);
  });
  await check("faithful old SQL body cannot claim pending or reclaim expired versioned identities", async () => {
    const oldSource = readFileSync("supabase/migrations/0017_m2_a1_null_fence_integrity.sql", "utf8");
    const oldFunction = oldSource.match(/create or replace function public\.claim_production_notification_v2\([\s\S]*?\$function\$;/u)[0]
      .replace("claim_production_notification_v2", "f004_test_stale_claim_body");
    db.sql(`${oldFunction} grant execute on function public.f004_test_stale_claim_body(uuid,uuid,timestamptz,timestamptz) to service_role;`);
    for (const n of [4, 3]) {
      const before = outbox(n);
      await rejects(`select public.f004_test_stale_claim_body('${f(n).notification}','${randomUUID()}',
        clock_timestamp()+interval '2 hours',clock_timestamp()+interval '1 hour');`, /F004_LEGACY_NOTIFICATION_CLAIM_FENCED/u);
      assert.deepEqual(outbox(n), before);
    }
  });
  await check("unknown send retries preserve payload credential URL and effective fake delivery identity", () => {
    assert.equal(claim(5).disposition, "acquired"); prepare(5); send(5);
    const effectiveDeliveries = new Map();
    const fakeSend = () => {
      const row = outbox(5); const key = `result-notification:${row.id}`;
      if (effectiveDeliveries.has(key)) assert.equal(effectiveDeliveries.get(key), row.email_payload_ciphertext);
      else effectiveDeliveries.set(key, row.email_payload_ciphertext);
    };
    fakeSend(); fail(5);
    const first = outbox(5);
    const credential = db.sql(`select to_jsonb(c) from public.production_result_credentials c where id='${f(5).credential}';`);
    assert.equal(claim(5).disposition, "acquired");
    assert.equal(prepare(5), first.email_payload_ciphertext); send(5); fakeSend(); complete(5);
    assert.equal(effectiveDeliveries.size, 1);
    assert.equal(outbox(5).email_credential_id, first.email_credential_id);
    assert.equal(outbox(5).email_payload_ciphertext, first.email_payload_ciphertext);
    assert.equal(db.sql(`select to_jsonb(c) from public.production_result_credentials c where id='${f(5).credential}';`), credential);
    assert.equal(claim(5).disposition, "sent");
  });
  await check("recovery reserves only untouched pending completed verified Paid jobs in matching environment", async () => {
    await rejects("select public.claim_production_notification_cutover_recovery_v1(null);", /F004_CUTOVER_RECOVERY_ENVIRONMENT_INVALID/u);
    assert.equal(reserve("live"), null);
    assert.equal(db.sql("select next_claim_at='-infinity' from public.production_notification_cutover_recovery_clock;"), "t");
    const before = outbox(2);
    const selected = reserve("test");
    assert.deepEqual(selected, { fulfillment_job_id: f(2).job, notification_id: f(2).notification });
    const { email_cutover_recovery_after: afterClock, ...after } = outbox(2);
    const { email_cutover_recovery_after: beforeClock, ...beforeRest } = before;
    assert.equal(beforeClock, null); assert.ok(afterClock); assert.deepEqual(after, beforeRest);
    assert.equal(reserve("test"), null);
  });
  await check("lost queue acknowledgement remains retryable from durable pending without state reset", () => {
    // Advance only the synthetic owner-controlled clock; no minute-long sleep.
    resetClock();
    const next = reserve(); assert.notEqual(next.notification_id, f(2).notification);
    db.sql("update public.production_notification_outbox set email_cutover_recovery_after=clock_timestamp()+interval '1 hour' where email_identity_version is null;");
    db.sql(`update public.production_notification_outbox set email_cutover_recovery_after=clock_timestamp()-interval '1 second' where id='${f(2).notification}';`);
    resetClock();
    assert.deepEqual(reserve(), { fulfillment_job_id: f(2).job, notification_id: f(2).notification });
    assert.equal(outbox(2).status, "pending"); assert.equal(outbox(2).attempt_count, 0);
    assert.equal(claim(2).disposition, "acquired"); prepare(2); send(2); complete(2);
    resetClock(); assert.equal(reserve(), null);
  });
  await check("concurrent recovery schedulers get one global reservation without notification claim", async () => {
    db.sql(`update public.production_notification_outbox set email_cutover_recovery_after=null where id='${f(6).notification}';`);
    resetClock(); const before = outbox(6);
    const results = await Promise.all(Array.from({ length: 8 }, () => db.parallelSql(`set role service_role; select ${reserveExpr()};`)));
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(JSON.parse(results.find(Boolean)).notification_id, f(6).notification);
    assert.equal(outbox(6).attempt_count, before.attempt_count); assert.equal(outbox(6).status, "pending");
  });
  await check("failed or unknown versioned rows do not enter cutover recovery or reset retry policy", () => {
    assert.equal(claim(7).disposition, "acquired"); prepare(7); send(7); fail(7);
    const before = outbox(7); resetClock(); assert.equal(reserve(), null);
    assert.deepEqual(outbox(7), before);
  });
  await check("recovery excludes incomplete jobs, conflicting dispatch markers and noncanonical or unverified bindings", () => {
    const row = f(8);
    const isolate = `begin;
      update public.production_notification_outbox set email_cutover_recovery_after=clock_timestamp()+interval '1 hour';
      update public.production_notification_outbox set email_cutover_recovery_after=null where id='${row.notification}';
      update public.production_notification_cutover_recovery_clock set next_claim_at='-infinity';`;
    const probe = (mutation = "") => db.sql(`${isolate} ${mutation} set role service_role; select ${reserveExpr()}; rollback;`);
    assert.equal(JSON.parse(probe()).notification_id, row.notification);
    for (const mutation of [
      `update public.production_fulfillment_jobs set state='retryable' where id='${row.job}';`,
      `update public.production_fulfillment_jobs set dispatch_marker='rc2-dispatch:conflicting-marker' where id='${row.job}';`,
      `update public.production_customer_deliveries set delivery_authority_reference='synthetic-other-canonical-authority' where id='${row.delivery}';`,
      `update public.production_purchase_intents set state='pending',successful_payment_id=null where id='${row.intent}';`,
    ]) assert.equal(probe(mutation), "");
  });
  await check("least-recent handoff ordering prevents the first cooled-down row starving untouched notifications", () => {
    const first = f(9), untouched = f(10);
    const reserved = db.sql(`begin;
      update public.production_notification_outbox set email_cutover_recovery_after=clock_timestamp()+interval '1 hour';
      update public.production_notification_outbox set email_cutover_recovery_after=clock_timestamp()-interval '1 second' where id='${first.notification}';
      update public.production_notification_outbox set email_cutover_recovery_after=null where id='${untouched.notification}';
      update public.production_notification_cutover_recovery_clock set next_claim_at='-infinity';
      set role service_role; select ${reserveExpr()}; rollback;`);
    assert.equal(JSON.parse(reserved).notification_id, untouched.notification);
  });
  await check("schema retained forward fix leaves canonical results, Paid jobs and notification count intact", () => {
    assert.equal(db.sql("select count(*) from public.production_notification_outbox;"), "12");
    assert.equal(db.sql("select count(*) from public.production_notification_outbox where status='pending' and attempt_count<>0;"), "0");
    assert.equal(db.sql("select count(*) from public.production_notification_outbox where email_sender_claim_generation<>attempt_count and email_identity_version=1;"), "0");
    const current = JSON.parse(canonical()); const previous = JSON.parse(canonicalBefore);
    for (const key of ["deliveries", "jobs", "payments", "handoffs"])
      assert.deepEqual(current[key].filter((row) => row.id !== ({ deliveries: f(12).delivery, jobs: f(12).job,
        payments: f(12).payment, handoffs: f(12).handoff })[key]), previous[key]);
    // Reinstalling the compatible v3 body is a forward fix and does not reset
    // identities; old claims remain fenced. No destructive down migration.
    const v3 = db.sql("select pg_get_functiondef('public.claim_production_notification_v3(uuid,uuid,timestamptz,timestamptz)'::regprocedure);");
    const before = outbox(7); db.sql(v3); assert.deepEqual(outbox(7), before);
    assert.equal(claim(7, 2).disposition, "in_progress");
  });
  await check("concurrent detaches and old catch cannot deadlock or duplicate the ownership transition", async () => {
    const before = JSON.parse(canonical());
    const first = db.startSql(`begin; set role service_role;
      select public.detach_production_customer_identity_v1('37000000-0000-4000-8000-000000000001','${randomUUID()}',now());
      select pg_sleep(0.2); commit;`);
    const second = db.startSql(`set role service_role;
      select public.detach_production_customer_identity_v1('37000000-0000-4000-8000-000000000001','${randomUUID()}',now());`);
    const oldCatch = db.startSql(`begin; set role service_role;
      update public.production_result_credentials set revoked_at=now() where id='${f(1).credential}'; rollback;`);
    const [one, two, caught] = await Promise.all([first.result, second.result, oldCatch.result]);
    for (const outcome of [one, two]) assert.equal(outcome.code, 0, outcome.error);
    assert.deepEqual([one, two].map(r=>JSON.parse(r.output).detached_binding_count).sort((a,b)=>a-b), [0, 12]);
    if (caught.code !== 0) assert.match(caught.error, /F004_LEGACY_NOTIFICATION_REVOCATION_FENCED/u);
    assert.equal(db.sql("select count(*) from public.production_customer_ownership_bindings where state='active';"), "0");
    assert.equal(db.sql("select count(*) from public.production_result_credentials where revoked_at is null;"), "0");
    assert.equal(db.sql("select count(*) from public.production_notification_outbox;"), "12");
    const after = JSON.parse(canonical());
    for (const key of ["deliveries", "jobs", "payments"]) assert.deepEqual(after[key], before[key]);
    const withoutRevocation = rows=>rows.map(row=>Object.fromEntries(Object.entries(row).filter(([key])=>key!=="revoked_at")));
    assert.deepEqual(withoutRevocation(after.handoffs), withoutRevocation(before.handoffs));
  });
  console.log(`PASS F004 cutover PostgreSQL ${mode} ${passed}/${passed}; external operation=0`);
  // Receipt hashes the exact SQL used above, so another migration cannot reuse
  // this verifier's successful installation evidence by registry alias alone.
  return { functional: passed, artifacts: [{ file: migrationFile, sha256: digest(migration) }] };
}

const missingId = "00000000-0000-4000-8000-000000000000";
const contracts = [
  ["public.claim_production_notification_cutover_recovery_v1(text)", "public.claim_production_notification_cutover_recovery_v1('live')"],
  ["public.claim_production_notification_v1(uuid,uuid,timestamptz)", `public.claim_production_notification_v1('${missingId}','${missingId}',now())`],
  ["public.claim_production_notification_v2(uuid,uuid,timestamptz,timestamptz)", `public.claim_production_notification_v2('${missingId}','${missingId}',now()+interval '1 minute',now())`],
  ["public.claim_production_notification_v3(uuid,uuid,timestamptz,timestamptz)", `public.claim_production_notification_v3('${missingId}','${missingId}',now()+interval '1 minute',now())`],
  ["public.detach_production_customer_identity_v1(uuid,uuid,timestamptz)", `public.detach_production_customer_identity_v1('${missingId}','${missingId}',now())`],
].map(([signature, call]) => ({ signature, call, allowed: ["service_role"] }));
const results = await verifyMigrationAuthorityLayers({ label: "f004-cutover", baselineVersion: 31,
  runtimeContracts: contracts, verify: verifyCutover });
export const migrationVerification = results;
console.log(`PASS F004 migration layers 2/2; functional=${results.map(r => `${r.mode}:${r.functional}`).join(",")}; runtime permissions=${results.reduce((n,r) => n+r.permissionChecks,0)}; external operation=0`);
