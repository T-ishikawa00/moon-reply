import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { createLocalPostgres } from "./remediation-local-postgres.mjs";
import { runProductionPaymentReconciliationSchedule, runProductionPaymentReconciliationFollowup } from "../lib/payment/production/recovery-schedulers.ts";

// Synthetic, isolated native PostgreSQL only; never reads project env files or
// inherited DB configuration and never touches an existing cluster.
const bin = process.platform === "win32" ? "C:/Program Files/PostgreSQL/17/bin" : "/usr/lib/postgresql/17/bin";
const exe = (name) => path.join(bin, `${name}${process.platform === "win32" ? ".exe" : ""}`);
for (const name of ["initdb", "pg_ctl", "psql"]) assert.ok(existsSync(exe(name)), `PostgreSQL17 ${name} required`);

const temporary = mkdtempSync(path.join(os.tmpdir(), "moon-reply-f003-pg-"));
const data = path.join(temporary, "data");
const env = { SystemRoot: process.env.SystemRoot ?? "C:/Windows", WINDIR: process.env.SystemRoot ?? "C:/Windows",
  PATH: process.platform === "win32" ? `${bin};${path.join(process.env.SystemRoot ?? "C:/Windows", "System32")}` : `${bin}:/usr/bin:/bin`,
  TEMP: temporary, TMP: temporary, LANG: "C", PGPASSFILE: path.join(temporary, "none.pgpass"),
  PGSERVICEFILE: path.join(temporary, "none.conf"), PGSYSCONFDIR: temporary };
const port = await new Promise((resolve, reject) => {
  const server = net.createServer(); server.once("error", reject);
  server.listen(0, "127.0.0.1", () => { const p = server.address().port; server.close((e) => e ? reject(e) : resolve(p)); });
});
const connection = ["-X", "-q", "-w", "-h", "127.0.0.1", "-p", String(port), "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At"];
function execute(name, args, input, ignore = false) {
  const r = spawnSync(exe(name), args, { cwd: temporary, env, input, encoding: "utf8", windowsHide: true,
    timeout: 30_000, ...(ignore ? { stdio: "ignore" } : {}) });
  if (r.error || r.status !== 0) throw new Error(`F003_LOCAL_${name}_FAILED(${r.status}): ${r.error?.message ?? ""} ${r.stderr ?? ""} ${r.stdout ?? ""}`);
  return r.stdout?.trim() ?? "";
}
const prefix = "set statement_timeout='8s'; set lock_timeout='5s';\n";
const sql = (statement) => execute("psql", connection, prefix + statement);
function parallelSql(statement) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe("psql"), connection, { cwd: temporary, env, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let output = "", error = "";
    const timer = setTimeout(() => child.kill(), 15_000);
    child.stdout.setEncoding("utf8").on("data", (chunk) => output += chunk);
    child.stderr.setEncoding("utf8").on("data", (chunk) => error += chunk);
    child.once("error", (e) => { clearTimeout(timer); reject(e); });
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(output.trim());
      else reject(new Error(`F003_LOCAL_CONCURRENT_FAILED ${error}`));
    });
    child.stdin.end(prefix + statement);
  });
}

const attemptId = n => '67000000-0000-4000-8000-' + String(n).padStart(12,'0');
const intentId = n => '57000000-0000-4000-8000-' + String(n).padStart(12,'0');
const owner = n => '97000000-0000-4000-8000-' + String(n).padStart(12,'0');
const instant = seconds => new Date(Date.parse('2026-09-06T00:00:00Z')+seconds*1000).toISOString();
const followups='public.production_payment_reconciliation_followups';
const attempts='public.production_payment_attempts';
const claim = (seconds, n=1) => sql("set role service_role; select row_to_json(c) from public.claim_rc2_payment_reconciliation_followup_v2('"+owner(n)+"','"+instant(seconds)+"','test') as c;").split('\n').filter(Boolean).map(JSON.parse);
const state = n => JSON.parse(sql("select row_to_json(f) from "+followups+" f where payment_attempt_id='"+attemptId(n)+"';"));
function stop(n,cause='PAYMENT_RECONCILIATION_PENDING') {
  sql("update "+attempts+" set reconciliation_attempt_count=6, reconciliation_owner_id='"+owner(n)+"',reconciliation_lease_expires_at='"+instant(24)+"' where id='"+attemptId(n)+"'; set role service_role; select public.finish_rc2_payment_reconciliation_v2('"+attemptId(n)+"','"+owner(n)+"','stop',null,'PAYMENT_RECONCILIATION_STOPPED',"+(cause===null?'null':"'"+cause+"'")+",'"+instant(0)+"');");
}
function finish(n,seconds,outcome='retry',code='PAYMENT_RECONCILIATION_PENDING', ownerNumber=1) {
  return sql("set role service_role; select public.finish_rc2_payment_reconciliation_followup_v1('"+attemptId(n)+"','"+owner(ownerNumber)+"','"+outcome+"',"+(code===null?'null':"'"+code+"'")+",'"+instant(seconds)+"');");
}
function expectSqlError(statement, pattern) {
  const r=spawnSync(exe('psql'), connection,{cwd:temporary,env,windowsHide:true,encoding:'utf8',input:prefix+statement,timeout:10000});
  assert.equal(r.status,3);assert.match(r.stderr,pattern);
}
function evidence(n,event,seconds,paid=true,source='reconciliation') {
  event = source === 'reconciliation' ? 'reconcile_' + createHash('sha256').update(event).digest('hex') : event;
  return "set role service_role; select public.record_rc2_stripe_evidence_v2('"+event+"','"+source+"','checkout.session.completed','"+instant(seconds)+"',repeat('a1',32),'test','"+intentId(n)+"','cs_test_m2_b2_i2_"+n+"',"+(paid?"'pi_f003_"+n+"'":"null")+",'payment','"+(paid?'paid':'unpaid')+"',980,'jpy','"+(paid?'verified':'pending')+"',null,'77000000-0000-4000-8000-"+String(n).padStart(12,'0')+"','87000000-0000-4000-8000-"+String(n).padStart(12,'0')+"','"+instant(seconds)+"');";
}
let initialized=false,passed=0;
async function check(name,run){await run();console.log('PASS F003 DB '+(++passed)+' '+name);}
try {
  execute('initdb',['-D',data,'-U','postgres','-A','trust','--no-locale','-E','UTF8']);initialized=true;
  execute('pg_ctl',['-D',data,'-l',path.join(temporary,'postgres.log'),'-o','-h 127.0.0.1 -p '+port,'-w','start'],undefined,true);
  sql("create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon,authenticated,service_role; create schema extensions; create schema auth; create table auth.users(id uuid primary key,aud text,role text,email text,email_confirmed_at timestamptz,raw_app_meta_data jsonb,raw_user_meta_data jsonb,created_at timestamptz,updated_at timestamptz,is_sso_user boolean,is_anonymous boolean);");
  await check('all repository migrations apply to an isolated synthetic cluster',()=>{
    const files=readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
    let oldShort, oldLong;
    for(const file of files) {
      if (file.startsWith('0030_')) {
        oldShort=sql("select pg_get_functiondef('public.claim_rc2_payment_reconciliation_batch_v1(uuid,timestamptz,timestamptz,timestamptz,integer,integer)'::regprocedure);");
        oldLong=sql("select pg_get_functiondef('public.claim_rc2_payment_reconciliation_followup_v1(uuid,timestamptz)'::regprocedure);");
      }
      sql(readFileSync(path.join('supabase/migrations',file),'utf8'));
    }
    assert.ok(files.includes('0027_f003_payment_reconciliation_followup.sql'));
    assert.ok(files.includes('0030_f003_reconciliation_environment_fence.sql'));
    assert.equal(sql("select pg_get_functiondef('public.claim_rc2_payment_reconciliation_batch_v1(uuid,timestamptz,timestamptz,timestamptz,integer,integer)'::regprocedure);"),oldShort);
    assert.equal(sql("select pg_get_functiondef('public.claim_rc2_payment_reconciliation_followup_v1(uuid,timestamptz)'::regprocedure);"),oldLong);
  });
  await check('original short-reconciliation and ingress privilege SQL proofs pass on the expanded schema',()=>{
    assert.match(sql(readFileSync('supabase/tests/m2_b2_i2_private_reconciliation_r1.sql','utf8')),/PASS M2-B2-I2 private reconciliation DB proof/u);
    assert.match(sql(readFileSync('supabase/tests/m2_b2_i1_ingress_privilege_preflight_r1.sql','utf8')),/M2-B2-I1 INGRESS PRIVILEGE PREFLIGHT PASS/u);
  });
  const fixture=readFileSync('supabase/tests/m2_b2_i2_private_reconciliation_r1.sql','utf8');
  // The seed has only synthetic local data. Stop before the old verifier's scenario updates.
  const normalized=fixture.replaceAll('\r\n','\n');
  sql(normalized.slice(normalized.indexOf('insert into auth.users'),normalized.indexOf('update public.production_payment_attempts set\n  reconciliation_retry_after')));
  sql("update "+attempts+" set state='pending',provider_checkout_session_id='cs_test_m2_b2_i2_'||sequence_id,provider_checkout_url='https://checkout.stripe.com/c/pay/f003-'||sequence_id from (select id as selected_id,row_number()over(order by id) as sequence_id from "+attempts+") s where id=s.selected_id;");
  await check('ACL confines tracking, read claims and operator wrappers to service_role',()=>{
    for(const role of ['anon','authenticated','m2_b2_stripe_ingress']) {
      for(const table of [followups,'public.production_payment_reconciliation_followup_clock','public.production_unresolved_payment_reconciliations']) assert.equal(sql("select has_table_privilege('"+role+"','"+table+"','SELECT,INSERT,UPDATE,DELETE');"),'f');
      for(const fn of ['public.claim_rc2_payment_reconciliation_followup_v1(uuid,timestamptz)','public.finish_rc2_payment_reconciliation_followup_v1(uuid,uuid,text,text,timestamptz)','public.finish_rc2_payment_reconciliation_v2(uuid,uuid,text,timestamptz,text,text,timestamptz)','public.claim_production_operator_notification_batch_v2(uuid,text,timestamptz,timestamptz,timestamptz,integer)','public.begin_production_operator_notification_send_v2(uuid,uuid,timestamptz)']) assert.equal(sql("select has_function_privilege('"+role+"','"+fn+"','EXECUTE');"),'f');
    }
    assert.equal(sql("select relrowsecurity from pg_class where oid='"+followups+"'::regclass;"),'t');
  });
  await check('new short exhaustion keeps reason and grants one-hour pending/transient followup only',()=>{
    stop(1);stop(2,'PAYMENT_RECONCILIATION_PROVIDER_UNAVAILABLE');stop(3,'PAYMENT_RECONCILIATION_SESSION_INVALID');stop(4,'PAYMENT_RECONCILIATION_UNKNOWN');
    assert.equal(state(1).status,'pending');assert.equal(state(2).status,'pending');assert.equal(state(3).status,'blocked');assert.equal(state(4).status,'blocked');
    assert.equal(state(1).short_error_code,'PAYMENT_RECONCILIATION_STOPPED');assert.equal(Date.parse(state(1).next_check_at),Date.parse(instant(3600)));
    assert.equal(claim(3599).length,0);
  });
  await check('historic ambiguous stopped attempts are detected and monitored without Stripe reads',()=>{
    sql("update "+attempts+" set reconciliation_stopped_at='"+instant(0)+"',reconciliation_last_error_code='PAYMENT_RECONCILIATION_STOPPED' where id='"+attemptId(5)+"';");
    assert.equal(sql("select followup_status from public.production_unresolved_payment_reconciliations where payment_attempt_id='"+attemptId(5)+"';"),'untracked');
    assert.equal(claim(3599).length,0);assert.equal(state(5).status,'blocked');assert.equal(state(5).stop_cause_code,null);
  });
  await check('new finish rejects NULL authority and old final-read crashes are detected without inferred provenance',()=>{
    sql("update "+attempts+" set reconciliation_attempt_count=6,reconciliation_owner_id='"+owner(7)+"',reconciliation_lease_expires_at='"+instant(24)+"' where id='"+attemptId(7)+"';");
    for(const args of ["null,'"+instant(1)+"'","'stop',null"]){
      const [outcome,time]=args.split(',');
      expectSqlError("set role service_role; select public.finish_rc2_payment_reconciliation_v2('"+attemptId(7)+"','"+owner(7)+"',"+outcome+",null,'PAYMENT_RECONCILIATION_STOPPED','PAYMENT_RECONCILIATION_PENDING',"+time+");",/RC2_PAYMENT_RECONCILIATION_FINISH_INVALID/u);
    }
    sql("set role service_role; select * from public.claim_rc2_payment_reconciliation_batch_v2('"+owner(7)+"','"+instant(1024)+"','"+instant(1000)+"','"+instant(880)+"',4,6,'test');");
    assert.equal(claim(3599).length,0); assert.equal(state(7).status,'blocked');
    assert.equal(state(7).short_error_code,'PAYMENT_RECONCILIATION_RETRY_EXHAUSTED');assert.equal(state(7).stop_cause_code,null);
  });
  await check('concurrent instances share one global claim and cannot reclaim a live attempt',async()=>{
    const rows=await Promise.all(Array.from({length:8},(_,i)=>parallelSql("set role service_role; select row_to_json(c) from public.claim_rc2_payment_reconciliation_followup_v2('"+owner(i+1)+"','"+instant(3600)+"','test') c;")));
    assert.equal(rows.filter(Boolean).length,1);assert.equal(claim(3601).length,0);
    assert.equal(state(1).attempt_count,1);assert.ok(Date.parse(state(1).next_check_at)>=Date.parse(instant(7200)));
  });
  const firstOwner=state(1).owner_id;
  await check('late verified evidence creates exactly one payment/job using existing atomic authority',()=>{
    const first=JSON.parse(sql(evidence(1,'reconcile_f003_paid',3602)));assert.equal(first.disposition,'verified');
    sql("set role service_role; select public.finish_rc2_payment_reconciliation_followup_v1('"+attemptId(1)+"','"+firstOwner+"','settled',null,'"+instant(3603)+"');");
    assert.equal(state(1).status,'resolved');
    assert.equal(sql("select count(*) from public.production_verified_payments where purchase_intent_id='"+intentId(1)+"';"),'1');
    assert.equal(sql("select count(*) from public.production_fulfillment_jobs where purchase_intent_id='"+intentId(1)+"';"),'1');
    assert.equal(sql("select reconciliation_attempt_count||':'||reconciliation_last_error_code from "+attempts+" where id='"+attemptId(1)+"';"),'6:PAYMENT_RECONCILIATION_STOPPED');
  });
  await check('duplicate and out-of-order webhook/reconciliation evidence cannot duplicate authority or downgrade paid',async()=>{
    const r=await Promise.all([parallelSql(evidence(1,'evt_f003_duplicate',3604,true,'webhook')),parallelSql(evidence(1,'reconcile_f003_duplicate',3604)),parallelSql(evidence(1,'reconcile_f003_old_pending',3590,false))]);
    assert.ok(r.every(Boolean));
    assert.equal(sql("select state from "+attempts+" where id='"+attemptId(1)+"';"),'succeeded');
    assert.equal(sql('select count(*) from public.production_verified_payments;'),'1');assert.equal(sql('select count(*) from public.production_fulfillment_jobs;'),'1');
  });
  await check('unknown read remains blocked/visible; old-owner and premature settlement are fenced',()=>{
    assert.equal(claim(3900)[0].payment_attempt_id,attemptId(2));
    assert.equal(state(2).status,'processing');
    expectSqlError("set role service_role; select public.finish_rc2_payment_reconciliation_followup_v1('"+attemptId(2)+"','"+owner(2)+"','retry','PAYMENT_RECONCILIATION_PENDING','"+instant(3901)+"');",/RC2_PAYMENT_FOLLOWUP_CONFLICT/u);
    expectSqlError("set role service_role; select public.finish_rc2_payment_reconciliation_followup_v1('"+attemptId(2)+"','"+owner(1)+"','settled',null,'"+instant(3901)+"');",/RC2_PAYMENT_FOLLOWUP_NOT_SETTLED/u);
    finish(2,3902,'blocked','PAYMENT_RECONCILIATION_UNKNOWN');assert.equal(state(2).status,'blocked');
    assert.equal(sql("select count(*) from public.production_unresolved_payment_reconciliations where payment_attempt_id='"+attemptId(2)+"';"),'1');
  });
  await check('lease-expired crash preserves bounded due time then permits a new owner',()=>{
    stop(6);const rows=claim(4200);assert.equal(rows.length,1);assert.equal(rows[0].payment_attempt_id,attemptId(6));
    assert.equal(claim(4500).length,0);
    const due=state(6).next_check_at;
    const seconds=(Date.parse(due)-Date.parse(instant(0)))/1000;
    const next=claim(seconds,7);assert.equal(next.length,1);assert.equal(next[0].reconciliation_attempt_count,2);
    expectSqlError("set role service_role; select public.finish_rc2_payment_reconciliation_followup_v1('"+attemptId(6)+"','"+owner(1)+"','retry','PAYMENT_RECONCILIATION_PENDING','"+instant(seconds+1)+"');",/RC2_PAYMENT_FOLLOWUP_CONFLICT/u);
    finish(6,seconds+1,'retry','PAYMENT_RECONCILIATION_PENDING',7);
    assert.ok(Date.parse(state(6).next_check_at)>=Date.parse(due)+7200000);
  });
  await check('long-running unresolved attempts retain monitoring with bounded 24-hour backoff',()=>{
    sql("update "+followups+" set attempt_count=100,next_check_at='"+instant(9000)+"' where payment_attempt_id='"+attemptId(6)+"';");
    const row=claim(9000,8)[0];assert.equal(row.payment_attempt_id,attemptId(6));
    const delay=(Date.parse(state(6).next_check_at)-Date.parse(instant(9000)))/1000;
    assert.ok(delay>=86400 && delay<=86700);finish(6,9001,'retry','PAYMENT_RECONCILIATION_PROVIDER_UNAVAILABLE',8);
    assert.equal(state(6).status,'pending');assert.equal(state(6).stop_cause_code,'PAYMENT_RECONCILIATION_PENDING');
    assert.equal(sql("select count(*) from public.production_unresolved_payment_reconciliations where payment_attempt_id='"+attemptId(6)+"';"),'1');
  });
  await check('operator wrapper truthfully claims unresolved once; legacy claim cannot steal/supersede it',()=>{
    const q=(version,seconds)=>"set role service_role; select row_to_json(c) from public.claim_production_operator_notification_batch_v"+version+"('"+owner(9)+"','test','"+instant(0)+"','"+instant(seconds+30)+"','"+instant(seconds)+"',4) c;";
    const first=sql(q(2,10000)).split('\n').filter(Boolean).map(JSON.parse);
    assert.ok(first.length<=4);const incident=first.find(r=>r.incident_code==='payment_reconciliation_stopped');assert.ok(incident);assert.equal(incident.payment_state,'unverified');assert.equal(incident.fulfillment_state,'not_authorized');
    sql(q(1,10031));assert.equal(sql("select status from public.production_operator_notification_outbox where id='"+incident.notification_id+"';"),'retryable');
    const second=sql(q(2,10032)).split('\n').filter(Boolean).map(JSON.parse);const again=second.find(r=>r.notification_id===incident.notification_id);assert.ok(again);
    assert.equal(JSON.parse(sql("set role service_role; select public.begin_production_operator_notification_send_v2('"+incident.notification_id+"','"+owner(9)+"','"+instant(10033)+"');")).disposition,'ready');
    sql("set role service_role; select public.finish_production_operator_notification_v1('"+incident.notification_id+"','"+owner(9)+"','ambiguous',null,'DISCORD_NETWORK_AMBIGUOUS','"+instant(10034)+"');");
    sql(q(2,10100));assert.equal(sql("select status from public.production_operator_notification_outbox where id='"+incident.notification_id+"';"),'ambiguous');
    assert.equal(sql("select count(*) from public.production_operator_notification_outbox where reconciliation_attempt_id=(select reconciliation_attempt_id from public.production_operator_notification_outbox where id='"+incident.notification_id+"');"),'1');
  });
} finally {
  if(initialized){const status=spawnSync(exe('pg_ctl'),['-D',data,'status'],{cwd:temporary,env,windowsHide:true,encoding:'utf8',timeout:10000});assert.ifError(status.error);assert.ok(status.status===0||status.status===3);if(status.status===0)execute('pg_ctl',['-D',data,'-m','immediate','-w','stop']);const stopped=spawnSync(exe('pg_ctl'),['-D',data,'status'],{cwd:temporary,env,windowsHide:true,encoding:'utf8',timeout:10000});assert.ifError(stopped.error);assert.equal(stopped.status,3);}
}

// Independent mixed-mode cluster: real SQL selects rows; real scheduler code
// receives those rows and invokes only a counted in-memory provider callback.
const mixed = await createLocalPostgres('f003-mixed-environment');
const quote = value => value === null || value === undefined ? 'null' : "'" + String(value).replaceAll("'", "''") + "'";
const rows = value => value.split('\n').filter(Boolean).map(JSON.parse);
const activeAttemptEnvironment = id => mixed.sql(`select i.environment from public.production_payment_attempts a join public.production_purchase_intents i on i.id=a.purchase_intent_id where a.id=${quote(id)};`);
const modeSnapshot = environment => mixed.sql(`select jsonb_build_object(
  'attempts',(select jsonb_agg(to_jsonb(a) order by a.id) from public.production_payment_attempts a join public.production_purchase_intents i on i.id=a.purchase_intent_id where i.environment=${quote(environment)}),
  'intents',(select jsonb_agg(to_jsonb(i) order by i.id) from public.production_purchase_intents i where i.environment=${quote(environment)}),
  'followups',(select jsonb_agg(to_jsonb(f) order by f.payment_attempt_id) from public.production_payment_reconciliation_followups f join public.production_payment_attempts a on a.id=f.payment_attempt_id join public.production_purchase_intents i on i.id=a.purchase_intent_id where i.environment=${quote(environment)}));`);
const mapClaim = row => ({ paymentAttemptId: row.payment_attempt_id, providerCheckoutSessionId: row.provider_checkout_session_id, attemptCount: row.reconciliation_attempt_count });
const shortSql = input => `set role service_role; select row_to_json(c) from public.claim_rc2_payment_reconciliation_batch_v2(${[
  input.ownerId, input.leaseExpiresAt, input.now, input.notNewerThan, input.limit, input.maximumAttempts, input.environment,
].map(quote).join(',')}) c;`;
const longSql = input => `set role service_role; select row_to_json(c) from public.claim_rc2_payment_reconciliation_followup_v2(${[
  input.ownerId, input.now, input.environment,
].map(quote).join(',')}) c;`;
const mixedRepository = {
  async claimPaymentReconciliationBatch(input) { return rows(mixed.sql(shortSql(input))).map(mapClaim); },
  async finishPaymentReconciliation(input) {
    mixed.sql(`set role service_role; select public.finish_rc2_payment_reconciliation_v2(${[
      input.paymentAttemptId, input.ownerId, input.outcome, input.retryAfter, input.errorCode, input.stopCauseCode, input.now,
    ].map(quote).join(',')});`);
  },
  async claimPaymentReconciliationFollowup(input) { return rows(mixed.sql(longSql(input))).map(mapClaim); },
  async finishPaymentReconciliationFollowup(input) {
    mixed.sql(`set role service_role; select public.finish_rc2_payment_reconciliation_followup_v1(${[
      input.paymentAttemptId, input.ownerId, input.outcome, input.errorCode, input.now,
    ].map(quote).join(',')});`);
  },
};
const providerReads = { test: 0, live: 0 };
const mixedReconcile = environment => async id => {
  assert.equal(activeAttemptEnvironment(id), environment, 'inactive Stripe mode must never reach the provider callback');
  providerReads[environment]++;
  return { disposition: 'pending', purchaseIntentId: null, verifiedPaymentId: null, fulfillmentJobId: null };
};
try {
  const applied = mixed.applyThrough(30);
  assert.equal(applied.at(-1), '0030_f003_reconciliation_environment_fence.sql');
  const fixture = readFileSync('supabase/tests/m2_b2_i2_private_reconciliation_r1.sql', 'utf8').replaceAll('\r\n', '\n');
  const mixedSeed = fixture.slice(fixture.indexOf('insert into auth.users'), fixture.indexOf('update public.production_payment_attempts set\n  reconciliation_retry_after'));
  assert.equal(mixedSeed.split("'stripe', 'test', 'requires_payment'").length, 2);
  assert.equal(mixedSeed.split("'cs_test_m2_b2_i2_' || n").length, 2);
  mixed.sql(mixedSeed
    .replace("'stripe', 'test', 'requires_payment'", "'stripe', case when n % 2=0 then 'live' else 'test' end, 'requires_payment'")
    .replace("'cs_test_m2_b2_i2_' || n", "(case when n % 2=0 then 'cs_live_f003_mode_' else 'cs_test_f003_mode_' end) || n"));
  mixed.sql(`update public.production_payment_attempts a set state='pending',
      provider_checkout_session_id='cs_'||i.environment||'_f003_mode_'||a.sequence_number||'_'||right(a.id::text,12),
      provider_checkout_url='https://checkout.stripe.com/c/pay/f003-mode-'||a.id::text,
      reconciliation_attempt_count=case when right(a.id::text,12)::integer>6 then 6 else 0 end
    from public.production_purchase_intents i where i.id=a.purchase_intent_id;`);
  await check('mixed test/live short claims and exhaustion mutate only the active mode; provider callbacks follow SQL selection', async () => {
    for (const environment of ['live', 'test']) {
      const inactive = environment === 'test' ? 'live' : 'test';
      const before = modeSnapshot(inactive), beforeReads = providerReads[inactive];
      const result = await runProductionPaymentReconciliationSchedule({ environment, repository: mixedRepository,
        reconcileAttempt: mixedReconcile(environment), now: () => instant(3600), uuid: () => owner(1) });
      assert.equal(result.claimed, 3); assert.equal(result.stripeReads, 3); assert.equal(result.retried, 3);
      assert.equal(modeSnapshot(inactive), before); assert.equal(providerReads[inactive], beforeReads);
      assert.equal(mixed.sql(`select count(*) from public.production_payment_attempts a join public.production_purchase_intents i on i.id=a.purchase_intent_id where i.environment=${quote(environment)} and a.reconciliation_stopped_at is not null;`), '3');
    }
  });
  await check('followup materialization, cleanup and claim preserve inactive mode while sharing the global clock', async () => {
    mixed.sql(`update public.production_payment_attempts set state='pending', reconciliation_attempt_count=6,
      reconciliation_stopped_at=${quote(instant(0))},reconciliation_owner_id=null,reconciliation_lease_expires_at=null,
      reconciliation_retry_after=null,reconciliation_last_error_code='PAYMENT_RECONCILIATION_STOPPED';`);
    for (const n of [1, 2, 3, 4]) {
      mixed.sql(`update public.production_payment_attempts set reconciliation_stopped_at=null,reconciliation_owner_id=${quote(owner(n))},reconciliation_lease_expires_at=${quote(instant(24))} where id=${quote(attemptId(n))};
        set role service_role; select public.finish_rc2_payment_reconciliation_v2(${quote(attemptId(n))},${quote(owner(n))},'stop',null,'PAYMENT_RECONCILIATION_STOPPED','PAYMENT_RECONCILIATION_PENDING',${quote(instant(0))});`);
    }
    mixed.sql(`update public.production_payment_attempts set state='failed' where id in (${quote(attemptId(3))},${quote(attemptId(4))});`);
    const inactiveBefore = modeSnapshot('test'), inactiveReads = providerReads.test;
    const live = await runProductionPaymentReconciliationFollowup({ environment: 'live', repository: mixedRepository,
      reconcileAttempt: mixedReconcile('live'), now: () => instant(3600), uuid: () => owner(2) });
    assert.equal(live.stripeReads, 1); assert.equal(live.retried, 1);
    assert.equal(modeSnapshot('test'), inactiveBefore); assert.equal(providerReads.test, inactiveReads);
    assert.equal(mixed.sql(`select status from public.production_payment_reconciliation_followups where payment_attempt_id=${quote(attemptId(4))};`), 'resolved');
    assert.equal(mixed.sql(`select count(*) from public.production_payment_reconciliation_followups where payment_attempt_id=${quote(attemptId(5))};`), '0');
    assert.equal(mixed.sql(`select status from public.production_payment_reconciliation_followups where payment_attempt_id=${quote(attemptId(6))};`), 'blocked');
    const liveBefore = modeSnapshot('live'), liveReads = providerReads.live;
    const held = await runProductionPaymentReconciliationFollowup({ environment: 'test', repository: mixedRepository,
      reconcileAttempt: mixedReconcile('test'), now: () => instant(3600), uuid: () => owner(3) });
    assert.equal(held.claimed, 0); assert.equal(held.stripeReads, 0);
    const test = await runProductionPaymentReconciliationFollowup({ environment: 'test', repository: mixedRepository,
      reconcileAttempt: mixedReconcile('test'), now: () => instant(3900), uuid: () => owner(3) });
    assert.equal(test.stripeReads, 1); assert.equal(test.retried, 1);
    assert.equal(modeSnapshot('live'), liveBefore); assert.equal(providerReads.live, liveReads);
  });
  await check('concurrent different-mode followups still share one global claim per five minutes', async () => {
    mixed.sql(`update public.production_payment_reconciliation_followups set next_check_at=${quote(instant(6000))} where status='pending';`);
    const results = await Promise.all(['test', 'live'].map((environment, i) => mixed.parallelSql(longSql({ environment, ownerId: owner(i + 5), now: instant(6000) }))));
    assert.equal(results.flatMap(rows).length, 1);
    assert.equal(mixed.sql("select count(*) from public.production_payment_reconciliation_followups where status='processing';"), '1');
    assert.equal(mixed.sql("select count(*) from public.production_payment_reconciliation_followup_clock;"), '1');
  });
  await check('new mode claims are service-only and reject missing/invalid mode before any mutation', async () => {
    for (const signature of ['public.claim_rc2_payment_reconciliation_batch_v2(uuid,timestamptz,timestamptz,timestamptz,integer,integer,text)',
      'public.claim_rc2_payment_reconciliation_followup_v2(uuid,timestamptz,text)']) {
      for (const role of ['anon','authenticated','m2_b2_stripe_ingress','service_role']) {
        assert.equal(mixed.sql(`select has_function_privilege(${quote(role)},${quote(signature)},'EXECUTE');`), role === 'service_role' ? 't' : 'f');
      }
      assert.equal(mixed.sql(`select prosecdef from pg_proc where oid=${quote(signature)}::regprocedure;`), 'f');
    }
    const before = [modeSnapshot('test'), modeSnapshot('live'), mixed.sql('select row_to_json(c) from public.production_payment_reconciliation_followup_clock c;')];
    for (const environment of [null, '', 'production']) {
      const input = { environment, ownerId: owner(9), now: instant(10000), leaseExpiresAt: instant(10024), notNewerThan: instant(9880), limit: 4, maximumAttempts: 6 };
      for (const statement of [shortSql(input), longSql(input)]) {
        const result = await mixed.startSql(statement).result;
        assert.notEqual(result.code, 0); assert.match(result.error, /RECONCILIATION_CLAIM_INVALID|FOLLOWUP_CLAIM_INVALID/u);
      }
    }
    assert.deepEqual([modeSnapshot('test'), modeSnapshot('live'), mixed.sql('select row_to_json(c) from public.production_payment_reconciliation_followup_clock c;')], before);
    assert.equal(mixed.sql('select (select count(*) from public.production_verified_payments)||\':\'||(select count(*) from public.production_fulfillment_jobs);'), '0:0');
  });
} finally { mixed.stop(); }
console.log('F003 reconciliation DB: '+passed+'/'+passed+' PASS; mixed-mode provider callbacks='+JSON.stringify(providerReads)+'; external operations=0; isolated clusters stopped');
