import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verifyMigrationAuthorityLayers } from "./remediation-migration-authority.mjs";
import { migrationSha256, remediationMigrationRegistry, capturePaidTablePrivileges } from "./lib/remediation-migration-release-contracts.mjs";

const entry = remediationMigrationRegistry.find(candidate => candidate.number === 36);
assert.ok(entry, "0036_REGISTRATION_REQUIRED");
const migration = readFileSync(`supabase/migrations/${entry.file}`, "utf8");
assert.equal(migrationSha256(migration), entry.sha256);
const signature = entry.functions[0].signature;
const now = "2026-09-09T00:00:00Z";
const id = n => `36000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const finalize = (n, extra = {}) => `public.finalize_purchase_ready_assessment_v1('${id(n + 100)}','${id(extra.request ?? n)}',
  '${extra.model ?? "gpt-5.6-luna"}','${extra.policy ?? '{"fixture":"ready"}'}',11,2,3,1,0.01,'${now}')`;
const request = (n, source = "production_fulfillment_runtime") => `insert into public.assessment_requests
  (id,idempotency_key,source,raw_situation,optional_message,relationship,requested_topics,privacy_acknowledged,status,created_at,updated_at)
  values ('${id(n)}','preparation-0036-${n}','${source}','local preparation fixture','original draft','dating','["reply"]',true,'processing','${now}','${now}');`;
const run = (n, bundle, schema, kind = "initial") => `insert into public.assessment_runs
  (id,request_id,status,requested_model,prompt_bundle_version,schema_set_version,total_input_tokens,total_cached_tokens,total_output_tokens,
   total_reasoning_tokens,usage_derived_cost_usd,started_at,stage_topology_version,run_kind)
  values ('${id(n + 100)}','${id(n)}','processing','gpt-5.6-luna','prompt-bundle-runtime-v${bundle}.0.0',
   'pipeline-schema-runtime-v${schema}.0.0',0,0,0,0,0,'${now}','split-base-candidate-v1','${kind}');`;
const clarification = (n, target) => `insert into public.assessment_clarifications
  (schema_version,id,request_id,ordinal,question_code,target,question_snapshot,provenance,source_identity,answer_status,created_at)
  values ('m2-p4-assessment-clarification-v1','clarification-0036-${String(n).padStart(8, "0")}','${id(n)}',1,'test_question','${target}',
   'local immutable question','user_clarification','clarification:clarification-0036-${String(n).padStart(8, "0")}:answer:1','pending','${now}');`;

export const migrationVerification = await verifyMigrationAuthorityLayers({ label: "step5a1-0036-preparation", baselineVersion: 35,
  runtimeContracts: [{ signature, call: finalize(10), allowed: ["service_role"] }],
  async verify({ db, installer, mode }) {
    let functional = 0;
    const check = async (name, fn) => { await fn(); functional++; console.log(`PASS 0036 ${mode} ${functional} ${name}`); };
    const rejected = async (connection, sql, pattern) => {
      const result = await connection.startSql(sql).result;
      assert.notEqual(result.code, 0); assert.match(result.error, pattern);
    };
    const functionCatalog = () => db.sql(`select jsonb_build_object('definition',pg_get_functiondef(oid),'owner',proowner,'acl',proacl,
      'securityDefiner',prosecdef,'config',proconfig) from pg_proc where oid='${signature}'::regprocedure;`);
    const constraint = () => db.sql("select pg_get_constraintdef(oid) from pg_constraint where conrelid='public.assessment_clarifications'::regclass and conname='assessment_clarifications_target';");
    const rows = () => db.sql(`select jsonb_build_object('requests',(select jsonb_agg(to_jsonb(r) order by id) from public.assessment_requests r),
      'runs',(select jsonb_agg(to_jsonb(r) order by id) from public.assessment_runs r),
      'clarifications',(select jsonb_agg(to_jsonb(r) order by id) from public.assessment_clarifications r));`);
    for (const n of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]) db.sql(request(n, n === 5 ? "internal_review_runtime" : undefined));
    db.sql(run(1,17,6) + run(2,23,9) + run(3,17,6,"clarification_resume") + run(4,23,9,"clarification_resume")
      + run(5,23,9) + run(6,23,9,"fulfillment_resume") + run(7,16,6) + run(10,23,9));
    db.sql(clarification(11,"requested_message_tone"));
    const beforeRows = rows(), beforeFunction = functionCatalog(), beforeConstraint = constraint(), beforePrivileges = capturePaidTablePrivileges(db);
    await check("0035 rejects V19 finalization and original_message while V17 remains valid", async () => {
      db.sql(`begin; set local role service_role; select ${finalize(1)}; rollback;`);
      await rejected(db, `set role service_role; select ${finalize(2)};`, /M2_PREPARATION_FINALIZATION_CONFLICT/u);
      await rejected(db, clarification(12,"original_message"), /assessment_clarifications_target/u);
      assert.equal(rows(), beforeRows);
    });
    await check("partway failure after both DDL changes rolls back body constraint ACL and rows", async () => {
      const broken = migration.replace(/\ncommit;\s*$/u, "\nselect 1 / 0;\ncommit;\n");
      assert.notEqual(broken, migration);
      await rejected(installer, broken, /division by zero/u);
      assert.equal(functionCatalog(), beforeFunction); assert.equal(constraint(), beforeConstraint);
      assert.equal(rows(), beforeRows); assert.deepEqual(capturePaidTablePrivileges(db), beforePrivileges);
    });
    await check("safe retry installs exact 0036 from 0035 preserving existing rows owner ACL RLS", () => {
      installer.sql(migration);
      assert.equal(rows(), beforeRows);
      const before = JSON.parse(beforeFunction), after = JSON.parse(functionCatalog());
      for (const key of ["owner","acl","securityDefiner","config"]) assert.deepEqual(after[key], before[key]);
      assert.deepEqual(capturePaidTablePrivileges(db), beforePrivileges);
      for (const table of ["assessment_requests","assessment_runs","assessment_clarifications"])
        assert.equal(db.sql(`select relrowsecurity from pg_class where oid='public.${table}'::regclass;`), "t");
    });
    await check("exact V17/V6 and V23/V9 initial and clarification_resume finalize as service", () => {
      for (const n of [1,2,3,4]) {
        db.sql(`set role service_role; select ${finalize(n)};`);
        const saved = JSON.parse(db.sql(`select to_jsonb(r) from public.assessment_runs r where id='${id(n+100)}';`));
        assert.equal(saved.status,"completed"); assert.equal(saved.eligibility,"ready"); assert.equal(saved.decision,null);
        assert.equal(saved.prompt_bundle_version,`prompt-bundle-runtime-v${n % 2 ? 17 : 23}.0.0`);
        assert.equal(saved.schema_set_version,`pipeline-schema-runtime-v${n % 2 ? 6 : 9}.0.0`);
        assert.equal(saved.total_input_tokens,11); assert.equal(saved.total_cached_tokens,2); assert.equal(saved.total_output_tokens,3);
        assert.equal(saved.total_reasoning_tokens,1); assert.equal(saved.usage_derived_cost_usd,0.01);
        assert.deepEqual(saved.policy_result_json,{fixture:"ready"}); assert.equal(saved.result_json,null);
        assert.equal(db.sql(`select optional_message from public.assessment_requests where id='${id(n)}';`),"original draft");
      }
    });
    await check("mixed bundle/schema pairs rejected by retained identity constraint", async () => {
      await rejected(db,run(8,17,9),/assessment_runs_topology_runtime_identity/u);
      await rejected(db,run(9,23,6),/assessment_runs_topology_runtime_identity/u);
    });
    await check("source kind old unsupported pair completed run model request and policy guards retained", async () => {
      for (const n of [1,5,6,7]) await rejected(db,`set role service_role; select ${finalize(n)};`,/M2_PREPARATION_FINALIZATION_CONFLICT/u);
      for (const extra of [{model:"unexpected"},{request:9},{policy:"[]"}])
        await rejected(db,`set role service_role; select ${finalize(10,extra)};`,/M2_PREPARATION_FINALIZATION_CONFLICT/u);
    });
    await check("original_message and all old targets accepted; immutable question and arbitrary target remain guarded", async () => {
      const targets = ["original_message","material_relationship_or_communication_concern","latest_contact_timing","usual_reply_cadence",
        "central_fear_or_decision_concern","relationship_intent","requested_message_tone"];
      for (let index=0;index<targets.length;index++) db.sql(`set role service_role; ${clarification(index+12,targets[index])}`);
      await rejected(db,`begin; delete from public.assessment_clarifications where request_id='${id(12)}'; ${clarification(12,"arbitrary_target")} rollback;`,/assessment_clarifications_target/u);
      await rejected(db,`set role service_role; update public.assessment_clarifications set target='relationship_intent' where request_id='${id(12)}';`,/immutable|CLARIFICATION|conflict|cannot change/iu);
      assert.equal(db.sql(`select target from public.assessment_clarifications where request_id='${id(12)}';`),"original_message");
    });
    await check("rollback limit recorded: old target constraint cannot validate after original_message persists", async () => {
      await rejected(installer,`begin; alter table public.assessment_clarifications drop constraint assessment_clarifications_target;
        alter table public.assessment_clarifications add constraint assessment_clarifications_target ${beforeConstraint}; rollback;`,/violated by some row/u);
      assert.match(constraint(),/original_message/u);
    });
    return { functional, artifacts:[{file:entry.file,sha256:migrationSha256(migration)}] };
  },
});
