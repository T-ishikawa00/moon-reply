import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { verifyMigrationAuthorityLayers } from "./remediation-migration-authority.mjs";

const migrationFile = "0033_paid_fulfillment_recovery.sql";
const migration = readFileSync(`supabase/migrations/${migrationFile}`, "utf8");
const candidateMigrationFile = "0034_paid_fulfillment_candidate_contract.sql";
const candidateMigration = readFileSync(`supabase/migrations/${candidateMigrationFile}`, "utf8");
const operatorMigrationFile = "0035_paid_recovery_operator_followup.sql";
const operatorMigration = readFileSync(`supabase/migrations/${operatorMigrationFile}`, "utf8");
const instant = seconds => new Date(Date.parse("2026-09-09T00:00:00Z") + seconds * 1000).toISOString();
const id = (prefix, n) => `${prefix}000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const hash = value => createHash("sha256").update(value).digest("hex");
const fixed = `'${instant(0)}'::timestamptz`;
const runtimeContracts = [
  ["inspect_paid_fulfillment_recovery_v1(uuid)", "inspect_paid_fulfillment_recovery_v1(null)"],
  ["lock_paid_fulfillment_financial_v1(uuid)", "lock_paid_fulfillment_financial_v1(null)"],
  ["refresh_paid_fulfillment_recovery_v1(text,timestamptz,integer)",`refresh_paid_fulfillment_recovery_v1('test',${fixed},20)`],
  ["list_due_paid_fulfillment_dispatch_v1(text,timestamptz,integer)",`list_due_paid_fulfillment_dispatch_v1('test',${fixed},20)`],
  ["claim_rc2_fulfillment_job_by_id_v3(uuid,uuid,timestamptz,timestamptz,integer)",
    `claim_rc2_fulfillment_job_by_id_v3(null,'${id("99",1)}',${fixed}+interval '16 minutes',${fixed},0)`],
  ["schedule_paid_fulfillment_recovery_v1(uuid,uuid,text,boolean,timestamptz,timestamptz,integer)",
    `schedule_paid_fulfillment_recovery_v1(null,null,'PAID_TEST_TRANSIENT',true,${fixed}+interval '5 minutes',${fixed},0)`],
  ["complete_paid_fulfillment_provider_v1(uuid,uuid,uuid,timestamptz)",
    `complete_paid_fulfillment_provider_v1(null,'${id("99",1)}','${id("99",2)}',${fixed})`],
  ["paid_recovery_contract_matches_v1(jsonb,text,text,text,text)",
    "paid_recovery_contract_matches_v1(null,null,null,null,null)"],
  ["paid_recovery_operator_signal_v1(uuid,timestamptz)",`paid_recovery_operator_signal_v1(null,${fixed})`],
].map(([signature, call]) => ({signature:`public.${signature}`,call:`public.${call}`,allowed:["service_role"]}));

const results = await verifyMigrationAuthorityLayers({ label:"paid-recovery",baselineVersion:32,runtimeContracts,
  async verify({db,installer,mode,baseline}) {
    let functional = 0;
    const check = async (name, fn) => { await fn(); functional++; console.log(`PASS paid recovery migration ${mode} ${functional} ${name}`); };
    const service = statement => db.sql(`set role service_role; ${statement}`);
    const rpc = statement => JSON.parse(service(`select ${statement};`));
    const job = n => JSON.parse(db.sql(`select to_jsonb(j) from public.production_fulfillment_jobs j where id='${id("87",n)}';`));
    const rejected = async (connection, statement, pattern) => {
      const result = await connection.startSql(statement).result;
      assert.notEqual(result.code,0); assert.match(result.error,pattern);
    };
    await check("interrupted additive migration rolls back before ACL publication", async () => {
      const broken = migration.replace("create index paid_recovery_due_idx", "select 1 / 0;\ncreate index paid_recovery_due_idx");
      await rejected(installer,broken,/division by zero/u);
      assert.equal(db.sql("select count(*) from information_schema.columns where table_schema='public' and table_name='production_fulfillment_jobs' and column_name='provider_call_count';"),"0");
      assert.equal(db.sql("select to_regprocedure('public.inspect_paid_fulfillment_recovery_v1(uuid)') is null;"),"t");
    });
    await check("actual 0002 through 0033 upgrade with legacy APIs retained", () => {
      assert.equal(baseline.length,31);
      const old = db.sql("select pg_get_functiondef('public.complete_production_fulfillment_v2(uuid,uuid,uuid,uuid,uuid,jsonb,text,uuid,text,uuid,timestamptz)'::regprocedure);");
      installer.sql(migration);
      assert.equal(db.sql("select pg_get_functiondef('public.complete_production_fulfillment_v2(uuid,uuid,uuid,uuid,uuid,jsonb,text,uuid,text,uuid,timestamptz)'::regprocedure);"),old);
    });
    await check("RLS retained and finance access is read-only", async () => {
      for (const table of ["production_fulfillment_jobs","production_payment_adjustment_ledger","production_customer_deliveries"])
        assert.equal(db.sql(`select relrowsecurity from pg_class where oid='public.${table}'::regclass;`),"t");
      assert.equal(db.sql("select has_table_privilege('service_role','public.production_payment_adjustment_ledger','SELECT');"),"t");
      assert.equal(db.sql("select has_table_privilege('service_role','public.production_payment_adjustment_ledger','INSERT,UPDATE,DELETE');"),"f");
      for (const role of ["anon","authenticated","m2_b2_stripe_ingress"])
        await rejected(db,`set role ${role}; select provider_reservations from public.production_fulfillment_jobs;`,/permission denied/u);
      assert.equal(db.sql("select count(*) from pg_proc where pronamespace='public'::regnamespace and proname like '%paid%fulfillment%' and prosecdef;"),"0");
    });
    const fixture = readFileSync("supabase/tests/m2_b2_i2_private_reconciliation_r1.sql","utf8").replaceAll("\r\n","\n");
    db.sql(fixture.slice(fixture.indexOf("insert into auth.users"),fixture.indexOf("update public.production_payment_attempts set\n  reconciliation_retry_after")));
    for (let n=1;n<=5;n++) {
      db.sql(`update public.production_payment_attempts set state='pending',provider_checkout_session_id='cs_test_m2_b2_i2_${n}',
        provider_checkout_url='https://checkout.stripe.com/c/pay/local-${n}' where id='${id("67",n)}';`);
      service(`select public.record_rc2_stripe_evidence_v2('evt_paid_recovery_${n}','webhook','checkout.session.completed',${fixed},
        '${hash(`event-${n}`)}','test','${id("57",n)}','cs_test_m2_b2_i2_${n}','pi_paid_recovery_${n}',
        'payment','paid',980,'jpy','verified',null,'${id("77",n)}','${id("87",n)}',${fixed});`);
      db.sql(`insert into public.production_purchases(id,preparation_id,purchase_authority_reference_hash,verified_at)
        values('${id("a1",n)}','${id("27",n)}','${hash(`purchase-${n}`)}',${fixed});
        insert into public.production_assessment_grants(id,purchase_id,preparation_id,delivery_authority_reference,status,issued_at)
        values('${id("a2",n)}','${id("a1",n)}','${id("27",n)}','purchase-delivery:${id("57",n)}','issued',${fixed});
        insert into public.production_logical_assessments(id,grant_id,preparation_id,assessment_request_id,status,attempt_count,recovery_state,created_at,updated_at)
        values('${id("a3",n)}','${id("a2",n)}','${id("27",n)}','${id("17",n)}','pending',0,'not_started',${fixed},${fixed});
        update public.production_fulfillment_jobs set grant_id='${id("a2",n)}',logical_assessment_id='${id("a3",n)}' where id='${id("87",n)}';`);
    }
    await check("retry intent and dispatch epoch advance atomically without new payment or grant", () => {
      const before = db.sql("select count(*) from public.production_verified_payments;");
      const result = rpc(`public.schedule_paid_fulfillment_recovery_v1('${id("87",1)}',null,'PAID_TEST_TRANSIENT',true,${fixed}+interval '5 minutes',${fixed},0)`);
      assert.equal(result.disposition,"awaiting_recovery"); assert.equal(job(1).recovery_cycle_count,1);
      assert.equal(job(1).dispatch_completed_at,null); assert.equal(job(1).recovery_owner,"fulfillment-operations");
      assert.equal(db.sql("select count(*) from public.production_verified_payments;"),before);
      assert.equal(rpc(`public.claim_rc2_fulfillment_job_by_id_v3('${id("87",1)}','${id("99",1)}',${fixed}+interval '16 minutes',${fixed},1)`).disposition,"in_progress");
      assert.equal(rpc(`public.schedule_paid_fulfillment_recovery_v1('${id("87",1)}',null,'PAID_TEST_TRANSIENT',true,${fixed}+interval '5 minutes',${fixed},0)`).disposition,"stale_event");
      assert.equal(job(1).recovery_cycle_count,1);
    });
    await check("accepted but lost queue event is rediscovered by controlled clock", () => {
      db.sql(`update public.production_fulfillment_jobs set dispatch_marker='rc2-dispatch:${id("87",2)}',dispatch_completed_at=${fixed} where id='${id("87",2)}';`);
      assert.equal(rpc(`public.refresh_paid_fulfillment_recovery_v1('test',${fixed}+interval '17 minutes',20)`).scheduled_count,1);
      assert.equal(job(2).dispatch_completed_at,null); assert.equal(job(2).recovery_cycle_count,1);
    });
    await check("provider count cost concurrency and unknown holds survive separate leases", () => {
      for (const n of [1,2,3]) db.sql(`update public.production_fulfillment_jobs set state='processing',owner_id='${id("99",n)}',lease_expires_at=${fixed}+interval '40 minutes' where id='${id("87",n)}';
        update public.production_logical_assessments set status='generating',owner_id='${id("99",n)}',ownership_acquired_at=${fixed},lease_expires_at=${fixed}+interval '40 minutes' where id='${id("a3",n)}';`);
      const reserve = (n,r,t=18*60) => rpc(`public.reserve_paid_fulfillment_provider_v1('${id("a3",n)}','${id("99",n)}','${id("b1",r)}',0.25,'${instant(t)}')`);
      assert.equal(reserve(1,1).disposition,"reserved"); assert.equal(reserve(2,2).disposition,"reserved");
      assert.equal(reserve(3,3).disposition,"concurrency_limited"); assert.equal(reserve(1,1).disposition,"reservation_already_used");
      service(`select public.complete_paid_fulfillment_provider_v1('${id("a3",1)}','${id("99",1)}','${id("b1",1)}','${instant(19*60)}');`);
      assert.equal(reserve(3,3,19*60).disposition,"reserved");
      assert.equal(reserve(2,4,35*60).disposition,"reserved");
      assert.equal(job(2).provider_call_count,2); assert.equal(job(2).provider_reserved_cost_usd,0.5);
      assert.equal(job(2).provider_reservations[0].finished_at,undefined);
      db.sql(`update public.production_fulfillment_jobs set provider_reserved_cost_usd=2 where id='${id("87",2)}';`);
      assert.equal(reserve(2,5,35*60).disposition,"budget_exhausted");
      assert.equal(job(2).provider_call_count,2);
    });
    await check("recorded financial uncertainty stops compute and durable retry", () => {
      assert.equal(service(`select public.lock_paid_fulfillment_financial_v1('${id("a3",4)}');`),"t");
      db.sql(`insert into public.production_payment_adjustment_ledger(id,verified_payment_id,adjustment_kind,state,reason_code,created_at,updated_at)
        values('${id("c1",4)}','${id("77",4)}','ordinary_refund','pending','LOCAL_SYNTHETIC_FINANCE',${fixed},${fixed});`);
      assert.equal(service(`select public.lock_paid_fulfillment_financial_v1('${id("a3",4)}');`),"f");
      const result = rpc(`public.schedule_paid_fulfillment_recovery_v1('${id("87",4)}',null,'PAID_TEST_TRANSIENT',true,${fixed}+interval '5 minutes',${fixed},0)`);
      assert.equal(result.disposition,"operator_required");
      assert.equal(job(4).recovery_reason_code,"PAID_RECOVERY_FINANCIAL_REVIEW_REQUIRED");
      assert.equal(job(4).recovery_next_attempt_at,null);
    });
    await check("financial adjustment and delayed worker serialize on the payment authority", async () => {
      const adjusting = db.startSql(`set application_name='paid-recovery-financial-race'; begin;
        insert into public.production_payment_adjustment_ledger(id,verified_payment_id,adjustment_kind,state,reason_code,created_at,updated_at)
        values('${id("c1",1)}','${id("77",1)}','reversal','succeeded','LOCAL_SYNTHETIC_RACE',${fixed},${fixed});
        select pg_sleep(0.6); commit;`);
      let observed = false;
      for (let n=0;n<30;n++) {
        observed = db.sql("select exists(select 1 from pg_stat_activity where application_name='paid-recovery-financial-race' and wait_event='PgSleep');") === "t";
        if (observed) break;
        await new Promise(resolve => setTimeout(resolve,10));
      }
      assert.equal(observed,true);
      assert.equal(service(`select public.lock_paid_fulfillment_financial_v1('${id("a3",1)}');`),"f");
      const result = await adjusting.result; assert.equal(result.code,0,result.error);
    });
    await check("completed delivery remains canonical while only failed email is requeued", () => {
      for (const n of [3,5]) {
      db.sql(`update public.production_logical_assessments set status='completed',owner_id=null,ownership_acquired_at=null,
        lease_expires_at=null,recovery_state='completed',completed_at=${fixed}+interval '20 minutes' where id='${id("a3",n)}';
        update public.production_assessment_grants set status='completed',completed_at=${fixed}+interval '20 minutes' where id='${id("a2",n)}';
        insert into public.assessment_runs(id,request_id,status,requested_model,prompt_bundle_version,schema_set_version,
          stage_topology_version,run_kind,total_input_tokens,total_cached_tokens,total_output_tokens,total_reasoning_tokens,usage_derived_cost_usd,started_at)
        values('${id("a4",n)}','${id("17",n)}','completed','gpt-5.6-luna','prompt-bundle-runtime-v17.0.0',
          'pipeline-schema-runtime-v6.0.0','split-base-candidate-v1','fulfillment_resume',0,0,0,0,0,${fixed});
        insert into public.production_customer_deliveries(id,logical_assessment_id,runtime_run_id,experience_projection_json,
          projection_sha256,delivery_authority_reference,created_at)
        values('${id("a5",n)}','${id("a3",n)}','${id("a4",n)}','{"local_synthetic":true}',
          '${hash("local-projection")}','purchase-delivery:${id("57",n)}',${fixed}+interval '20 minutes');
        insert into public.production_notification_outbox(id,delivery_id,delivery_authority_reference,status,requested_at,updated_at)
        values('${id("a6",n)}','${id("a5",n)}','purchase-delivery:${id("57",n)}','pending',${fixed},${fixed});
        update public.production_fulfillment_jobs set state='completed',owner_id=null,lease_expires_at=null,
          completed_at=${fixed}+interval '20 minutes',dispatch_marker='rc2-dispatch:${id("87",n)}',
          dispatch_completed_at=${fixed}+interval '20 minutes' where id='${id("87",n)}';`);
      // Enter failure through the real fenced F004 claim/fail RPCs. A legacy
      // failed row with no send identity correctly remains manual review.
      assert.equal(rpc(`public.claim_production_notification_v3('${id("a6",n)}','${id("99",n)}',${fixed}+interval '35 minutes',${fixed}+interval '21 minutes')`).disposition,"acquired");
      service(`select public.fail_production_notification_v2('${id("a6",n)}','${id("99",n)}',
        'PRODUCTION_NOTIFICATION_CONFIGURATION_INVALID',${fixed}+interval '22 minutes');`);
      }
      const n=3;
      const before = db.sql(`select to_jsonb(d) from public.production_customer_deliveries d where id='${id("a5",n)}';`);
      assert.ok(job(n).recovery_operator_evidence.some(item=>item.disposition === "canonical_delivered"));
      rpc(`public.refresh_paid_fulfillment_recovery_v1('test',${fixed}+interval '37 minutes',20)`);
      const due=service(`select fulfillment_job_id from public.list_due_paid_fulfillment_dispatch_v1('test',${fixed}+interval '38 minutes',20);`);
      assert.ok(due.includes(id("87",n))); assert.equal(job(n).state,"completed");
      const claimed = rpc(`public.claim_rc2_fulfillment_dispatch_v3('${id("87",n)}','rc2-dispatch:${id("87",n)}',
        '${id("99",n)}',${fixed}+interval '40 minutes',${fixed}+interval '38 minutes')`);
      assert.equal(claimed.disposition,"acquired"); assert.equal(claimed.recovery_cycle,1);
      assert.equal(db.sql(`select to_jsonb(d) from public.production_customer_deliveries d where id='${id("a5",n)}';`),before);
    });
    await check("email configuration block requires reviewed resume and records only real outbox completion", () => {
      const n=3;
      const result=rpc(`public.schedule_paid_fulfillment_recovery_v1('${id("87",n)}',null,
        'PRODUCTION_NOTIFICATION_CONFIGURATION_INVALID',false,null,${fixed}+interval '38 minutes',1)`);
      assert.equal(result.disposition,"operator_required"); assert.equal(job(n).state,"completed");
      assert.equal(job(n).recovery_cycle_count,2);
      assert.equal(rpc(`public.claim_rc2_fulfillment_job_by_id_v3('${id("87",n)}','${id("99",n)}',
        ${fixed}+interval '45 minutes',${fixed}+interval '39 minutes',2)`).disposition,"manual_review");
      rpc(`public.refresh_paid_fulfillment_recovery_v1('test',${fixed}+interval '39 minutes',20)`);
      assert.equal(job(n).recovery_cycle_count,2);
      assert.equal(rpc(`public.schedule_paid_fulfillment_recovery_v1('${id("87",n)}',null,'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED',
        true,${fixed}+interval '45 minutes',${fixed}+interval '39 minutes',1)`).disposition,"stale_event");
      assert.equal(rpc(`public.resume_paid_fulfillment_recovery_v1('${id("87",n)}','PRODUCTION_NOTIFICATION_CONFIGURATION_INVALID',
        '${hash("reviewed-local-email-config")}','local-test-operator',${fixed}+interval '39 minutes')`).disposition,"notification_recovery");
      assert.equal(job(n).recovery_cycle_count,3);
      assert.equal(rpc(`public.claim_production_notification_v3('${id("a6",n)}','${id("99",n)}',${fixed}+interval '55 minutes',${fixed}+interval '40 minutes')`).disposition,"acquired");
      service(`select public.prepare_production_notification_email_v1('${id("a6",n)}','${id("99",n)}',
        '${id("a8",n)}','${hash("local-email-token")}','local-synthetic-envelope',${fixed}+interval '40 minutes');
        select public.begin_production_notification_send_v1('${id("a6",n)}','${id("99",n)}',${fixed}+interval '40 minutes');
        select public.complete_production_notification_v2('${id("a6",n)}','${id("99",n)}','local-email-provider-ack',${fixed}+interval '40 minutes');`);
      assert.equal(job(n).recovery_reason_code,null); assert.equal(job(n).recovery_next_attempt_at,null);
      assert.ok(job(n).recovery_operator_evidence.some(item=>item.disposition==="notification_sent"));
      assert.equal(job(n).provider_call_count,1);
    });
    await check("0034 interrupted upgrade rolls back and exact contract successor installs", async () => {
      await rejected(installer,candidateMigration.replace("create function public.paid_recovery_contract_matches_v1",
        "select 1 / 0;\ncreate function public.paid_recovery_contract_matches_v1"),/division by zero/u);
      assert.equal(db.sql("select count(*) from information_schema.columns where table_schema='public' and table_name='assessment_stage_runs' and column_name='input_json';"),"0");
      installer.sql(candidateMigration);
      const authority = (schema,bundle,set) => JSON.stringify({schemaVersion:schema,runtimeIdentity:{model:"gpt-5.6-luna",
        promptBundleVersion:bundle,schemaSetVersion:set,stageTopologyVersion:"split-base-candidate-v1"}});
      for (const [schema,bundle,set] of [["rc1-purchase-ready-runtime-authority-v1","prompt-bundle-runtime-v17.0.0","pipeline-schema-runtime-v6.0.0"],
        ["v19-l5-purchase-ready-authority-v1","prompt-bundle-runtime-v23.0.0","pipeline-schema-runtime-v9.0.0"]]) {
        assert.equal(service(`select public.paid_recovery_contract_matches_v1('${authority(schema,bundle,set)}','gpt-5.6-luna','${bundle}','${set}','split-base-candidate-v1');`),"t");
        assert.equal(service(`select public.paid_recovery_contract_matches_v1('${authority(schema,bundle,set)}','gpt-5.6-luna','prompt-bundle-runtime-v999.0.0','${set}','split-base-candidate-v1');`),"f");
      }
      for (const [signature,args] of [
        ["claim_production_fulfillment_v4(uuid,uuid,timestamptz,timestamptz)","null,null,null,null"],
        ["attest_paid_recovery_candidate_v1(uuid,uuid,uuid,text,text,jsonb,uuid,jsonb,jsonb,timestamptz,text,boolean,text)","null,null,null,null,null,null,null,null,null,null,null,null,null"],
        ["complete_production_fulfillment_v3(uuid,uuid,uuid,uuid,text,text,uuid,jsonb,text,uuid,text,uuid,timestamptz)","null,null,null,null,null,null,null,null,null,null,null,null,null"]]) {
        for (const role of ["anon","authenticated","service_role","m2_b2_stripe_ingress"]) {
          assert.equal(db.sql(`select has_function_privilege('${role}','public.${signature}','EXECUTE');`),role==="service_role"?"t":"f");
          await rejected(db,`set role ${role}; select public.${signature.split("(")[0]}(${args});`,
            role==="service_role" ? /PRODUCTION_(FULFILLMENT|RECOVERY)/u : /permission denied/u);
        }
      }
    });
    await check("0035 partial failure rolls back and preserves installed claim/send ACLs", async () => {
      const before=db.sql("select pg_get_functiondef('public.begin_production_operator_notification_send_v1(uuid,uuid,timestamptz)'::regprocedure);");
      const acl=db.sql("select proacl::text from pg_proc where oid in ('public.claim_production_operator_notification_batch_v1(uuid,text,timestamptz,timestamptz,timestamptz,integer)'::regprocedure,'public.begin_production_operator_notification_send_v1(uuid,uuid,timestamptz)'::regprocedure) order by oid;");
      await rejected(installer,operatorMigration.replace("do $upgrade$","select 1 / 0;\ndo $upgrade$"),/division by zero/u);
      assert.equal(db.sql("select to_regprocedure('public.paid_recovery_operator_signal_v1(uuid,timestamptz)') is null;"),"t");
      assert.equal(db.sql("select pg_get_functiondef('public.begin_production_operator_notification_send_v1(uuid,uuid,timestamptz)'::regprocedure);"),before);
      installer.sql(operatorMigration);
      assert.equal(db.sql("select proacl::text from pg_proc where oid in ('public.claim_production_operator_notification_batch_v1(uuid,text,timestamptz,timestamptz,timestamptz,integer)'::regprocedure,'public.begin_production_operator_notification_send_v1(uuid,uuid,timestamptz)'::regprocedure) order by oid;"),acl);
      assert.equal(db.sql("select relrowsecurity from pg_class where oid='public.production_operator_notification_outbox'::regclass;"),"t");
    });
    // Existing platform extension USAGE, not installer ownership/escalation.
    db.sql("grant usage on schema extensions to service_role;");
    const operatorOwner=id("d1",1);
    const claimOperator=(minute)=>service(`select row_to_json(c) from public.claim_production_operator_notification_batch_v2(
      '${operatorOwner}','test',${fixed},${fixed}+interval '${minute+5} minutes',${fixed}+interval '${minute} minutes',4) c;`)
      .split(/\r?\n/u).filter(Boolean).map(JSON.parse);
    const beginOperator=(notificationId,minute)=>rpc(`public.begin_production_operator_notification_send_v2('${notificationId}',
      '${operatorOwner}',${fixed}+interval '${minute} minutes')`);
    const finishOperator=(notificationId,minute)=>service(`select public.complete_production_operator_notification_v1('${notificationId}',
      '${operatorOwner}','100000000000000000',${fixed}+interval '${minute} minutes');`);
    const claimTarget=(minute,eventKey)=>{
      let selected;
      for(let pass=0;pass<12;pass++) {
        const rows=claimOperator(minute);
        for(const row of rows) {
          const key=db.sql(`select event_key from public.production_operator_notification_outbox where id='${row.notification_id}';`);
          if(key===eventKey) { selected=row; continue; }
          const started=beginOperator(row.notification_id,minute);
          if(started.disposition==="ready") finishOperator(row.notification_id,minute);
        }
        if(selected) return selected;
        if(rows.length===0) break;
      }
      assert.fail(`Expected operator event ${eventKey}`);
    };
    let firstSentSnapshot;
    let firstOperatorId;
    await check("completed notification block is detected through existing scheduler and sent once",()=>{
      const n=5;
      rpc(`public.schedule_paid_fulfillment_recovery_v1('${id("87",n)}',null,'PRODUCTION_NOTIFICATION_CONFIGURATION_INVALID',
        false,null,${fixed}+interval '40 minutes',${job(n).recovery_cycle_count})`);
      const signal=rpc(`public.paid_recovery_operator_signal_v1('${id("87",n)}',${fixed}+interval '40 minutes')`);
      const notice=claimTarget(40,signal.event_key);
      assert.equal(notice.incident_code,"manual_review"); assert.equal(notice.delivery_state,"complete");
      assert.equal(notice.fulfillment_state,"manual_review");
      assert.equal(beginOperator(notice.notification_id,40).disposition,"ready"); finishOperator(notice.notification_id,40);
      firstOperatorId=notice.notification_id;
      firstSentSnapshot=db.sql(`select to_jsonb(o) from public.production_operator_notification_outbox o where id='${firstOperatorId}';`);
      assert.equal(claimOperator(40).filter(r=>r.purchase_intent_id===id("57",n)).length,0);
    });
    await check("reviewed resume and later block get a new cycle; stale unsent notice cancels before send",()=>{
      const n=5;
      rpc(`public.resume_paid_fulfillment_recovery_v1('${id("87",n)}','PRODUCTION_NOTIFICATION_CONFIGURATION_INVALID',
        '${hash("operator-config-review")}','local-operator-test',${fixed}+interval '41 minutes')`);
      rpc(`public.schedule_paid_fulfillment_recovery_v1('${id("87",n)}',null,'PRODUCTION_NOTIFICATION_CONFIGURATION_INVALID',
        false,null,${fixed}+interval '42 minutes',${job(n).recovery_cycle_count})`);
      const signal=rpc(`public.paid_recovery_operator_signal_v1('${id("87",n)}',${fixed}+interval '42 minutes')`);
      const notice=claimTarget(42,signal.event_key);
      assert.notEqual(notice.notification_id,firstOperatorId);
      rpc(`public.resume_paid_fulfillment_recovery_v1('${id("87",n)}','PRODUCTION_NOTIFICATION_CONFIGURATION_INVALID',
        '${hash("operator-config-review-2")}','local-operator-test',${fixed}+interval '43 minutes')`);
      assert.equal(beginOperator(notice.notification_id,43).disposition,"superseded");
      assert.equal(db.sql(`select to_jsonb(o) from public.production_operator_notification_outbox o where id='${firstOperatorId}';`),firstSentSnapshot);
    });
    await check("overdue review creates a distinct alert; renewal cancels obsolete deadline at send",()=>{
      const n=5;
      assert.equal(service(`select public.paid_recovery_operator_signal_v1('${id("87",n)}',${fixed}+interval '102 minutes') is null;`),"t");
      const signal=rpc(`public.paid_recovery_operator_signal_v1('${id("87",n)}',${fixed}+interval '104 minutes')`);
      assert.ok(signal.event_key.includes(":review_due:"));
      const notice=claimTarget(104,signal.event_key);
      // A newly diagnosed block supersedes the older review deadline.
      rpc(`public.schedule_paid_fulfillment_recovery_v1('${id("87",n)}',null,'PRODUCTION_NOTIFICATION_CONFIGURATION_INVALID',
        false,null,${fixed}+interval '104 minutes',${job(n).recovery_cycle_count})`);
      rpc(`public.resume_paid_fulfillment_recovery_v1('${id("87",n)}','PRODUCTION_NOTIFICATION_CONFIGURATION_INVALID',
        '${hash("operator-config-review-3")}','local-operator-test',${fixed}+interval '105 minutes')`);
      assert.equal(beginOperator(notice.notification_id,105).disposition,"superseded");
      assert.equal(db.sql(`select to_jsonb(o) from public.production_operator_notification_outbox o where id='${firstOperatorId}';`),firstSentSnapshot);
    });
    await check("operator send already started becomes ambiguous without replay or identity mutation",async()=>{
      const n=5;
      rpc(`public.schedule_paid_fulfillment_recovery_v1('${id("87",n)}',null,'PRODUCTION_NOTIFICATION_CONFIGURATION_INVALID',
        false,null,${fixed}+interval '110 minutes',${job(n).recovery_cycle_count})`);
      const signal=rpc(`public.paid_recovery_operator_signal_v1('${id("87",n)}',${fixed}+interval '110 minutes')`);
      const notice=claimTarget(110,signal.event_key);
      assert.equal(beginOperator(notice.notification_id,110).disposition,"ready");
      const before=JSON.parse(db.sql(`select to_jsonb(o) from public.production_operator_notification_outbox o where id='${notice.notification_id}';`));
      rpc(`public.resume_paid_fulfillment_recovery_v1('${id("87",n)}','PRODUCTION_NOTIFICATION_CONFIGURATION_INVALID',
        '${hash("operator-config-review-4")}','local-operator-test',${fixed}+interval '111 minutes')`);
      claimOperator(116);
      const after=JSON.parse(db.sql(`select to_jsonb(o) from public.production_operator_notification_outbox o where id='${notice.notification_id}';`));
      assert.equal(after.status,"ambiguous");
      for(const key of ["event_key","notification_type","incident_code","source_occurred_at","send_started_at","attempt_count"])
        assert.equal(after[key],before[key],key);
      await rejected(db,`set role service_role; select public.begin_production_operator_notification_send_v2('${notice.notification_id}',
        '${operatorOwner}',${fixed}+interval '116 minutes');`,/OPERATOR_NOTIFICATION_SEND_CONFLICT/u);
      assert.equal(db.sql(`select to_jsonb(o) from public.production_operator_notification_outbox o where id='${firstOperatorId}';`),firstSentSnapshot);
    });
    return {functional,artifacts:[{file:migrationFile,sha256:hash(migration)},
      {file:candidateMigrationFile,sha256:hash(candidateMigration)},
      {file:operatorMigrationFile,sha256:hash(operatorMigration)}]};
  }
});
export const migrationVerification = results;
console.log(JSON.stringify({status:"PASS",migrationAuthority:results}));
