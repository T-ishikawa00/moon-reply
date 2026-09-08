import assert from "node:assert/strict";
import { execFileSync, fork, spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { createLocalPostgres } from "./remediation-local-postgres.mjs";
import { createPaidRecoveryPostgrest, sqlLiteral as lit } from "./lib/paid-recovery-postgrest.mjs";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") return { url: "data:text/javascript,export%20{}", shortCircuit: true };
  return nextResolve(specifier, context);
} });
const { createPaidRecoveryApplication } = await import("./lib/paid-recovery-application.mjs");
const { requestProductionFulfillmentDispatch } = await import("../lib/payment/production/fulfillment-dispatch.ts");
const outputDirectory = "evals/paid-delivery-step4";
mkdirSync(outputDirectory, { recursive: true });
const hash = value => createHash("sha256").update(value).digest("hex");
const git = args => execFileSync("git", args, { encoding: "utf8", windowsHide: true }).trim();
const head = git(["rev-parse", "HEAD"]);
const sourceFiles = [...new Set([...git(["ls-files", "lib", "supabase", "netlify", "scripts"]).split(/\r?\n/u),
  "scripts/verify-paid-delivery-step4-migration.mjs"].filter(Boolean))].sort();
const sourceHashes = () => Object.fromEntries(sourceFiles.map(file => [file, hash(readFileSync(file))]));
const initialHashes = sourceHashes();
const migrations = readdirSync("supabase/migrations").filter(file => /^003[345]_/u.test(file)).sort();
assert.equal(migrations.length, 3);
const results = [];
let donor, donorRest, upgraded, upgradedRest;
const evidence = { schemaVersion: "paid-delivery-step4-migration-v1", scenarioId: "S20", head,
  status: "RUNNING", sourceHashes: initialHashes, externalOperations: 0, checks: results };
const json = (db, statement) => JSON.parse(db.sql(statement));
const ident = value => { assert.match(value, /^[a-z][a-z0-9_]*$/u); return `"${value}"`; };
const check = async (name, callback) => { const detail = await callback(); results.push({ name, status: "PASS", ...detail }); console.log(`PASS S20 ${name}`); };

async function killAfterReport(run, jobId, rest) {
  const config = { url: rest.url, now: run.now(), jobId, cycle: 0, pauseAt: "report" };
  const child = fork("scripts/lib/paid-recovery-worker.mjs", [Buffer.from(JSON.stringify(config)).toString("base64url")], {
    execArgv: ["--experimental-transform-types"], windowsHide: true, stdio: ["ignore", "pipe", "pipe", "ipc"],
    env: { SystemRoot: process.env.SystemRoot, WINDIR: process.env.SystemRoot, PATH: process.env.SystemRoot + "\\System32",
      ...(process.env.NODE_OPTIONS ? { NODE_OPTIONS: process.env.NODE_OPTIONS } : {}) },
  });
  let stderr = ""; child.stderr.on("data", chunk => stderr += chunk);
  const exit = new Promise(resolve => child.once("exit", (code, signal) => resolve({ code, signal })));
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { child.kill(); reject(new Error(`report boundary timeout: ${stderr}`)); }, 25000);
      child.on("error", error => { clearTimeout(timer); reject(error); });
      child.on("message", message => { if (message.boundary === "completed") { clearTimeout(timer); reject(new Error(`worker completed before boundary: ${message.status}`)); } });
      rest.fault.after = async call => {
        if (call.name !== "finalize_completed_assessment") return;
        clearTimeout(timer); rest.fault.after = null; child.kill(); resolve();
        await new Promise(done => setTimeout(done, 200));
      };
    });
    const stopped = await exit;
    assert.ok(stopped.signal || stopped.code !== 0);
    return stopped;
  } finally { rest.fault.after = null; child.kill(); }
}

function identity(db, jobId) {
  return json(db, `select jsonb_build_object('job',j.id,'purchaseIntent',j.purchase_intent_id,'verifiedPayment',j.verified_payment_id,
    'grant',j.grant_id,'logical',j.logical_assessment_id,'preparation',j.preparation_id,'jobState',j.state,
    'inputHash',p.consultation_snapshot_sha256,'authorityHash',p.purchase_ready_authority_sha256,
    'authority',p.purchase_ready_authority_json,'paymentState',i.state,
    'purchases',(select count(*) from public.production_purchases where preparation_id=p.id),
    'grants',(select count(*) from public.production_assessment_grants where preparation_id=p.id),
    'payments',(select count(*) from public.production_verified_payments),
    'adjustments',(select count(*) from public.production_payment_adjustment_ledger),
    'runs',(select count(*) from public.assessment_runs where request_id=p.assessment_request_id),
    'reports',(select count(*) from public.assessment_reports a join public.assessment_runs r on r.id=a.run_id where r.request_id=p.assessment_request_id),
    'deliveries',(select count(*) from public.production_customer_deliveries where logical_assessment_id=j.logical_assessment_id),
    'canonicalRun',(select runtime_run_id from public.production_customer_deliveries where logical_assessment_id=j.logical_assessment_id),
    'canonicalHash',(select projection_sha256 from public.production_customer_deliveries where logical_assessment_id=j.logical_assessment_id))
    from public.production_fulfillment_jobs j join public.production_preparations p on p.id=j.preparation_id
    join public.production_purchase_intents i on i.id=j.purchase_intent_id where j.id=${lit(jobId)};`);
}

// This is a fixture transfer into a genuinely pre-0033 database, not a migration
// simulation: only columns actually present in 0032 can be inserted. Foreign
// keys, CHECK constraints and triggers remain enabled throughout. The donor
// report and all legacy request/prompt/schema hashes are never rewritten.
function transferBaselineRows(from, to) {
  const tables = json(to, `select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'columns',
    (select jsonb_agg(a.attname order by a.attnum) from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped)))
    from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ('public','auth');`);
  const dependencies = json(to, `select coalesce(jsonb_agg(jsonb_build_object('child',conrelid::regclass::text,'parent',confrelid::regclass::text)),'[]')
    from pg_constraint where contype='f';`);
  const pending = tables.map(table => {
    const qualified = `${ident(table.schema)}.${ident(table.table)}`;
    const columns = table.columns.map(ident).join(",");
    const rows = json(from, `select coalesce(jsonb_agg(t order by to_jsonb(t)::text),'[]') from (select ${columns} from ${qualified}) t;`);
    return { ...table, qualified, columns, rows, key: table.schema === "public" ? table.table : `${table.schema}.${table.table}` };
  }).filter(table => table.rows.length);
  // The payment INSERT trigger owns this ancillary measurement row and creates
  // its random id/transaction_id. Do not insert a second copy or disable it.
  const remaining = pending.filter(table => table.table !== "production_purchase_measurement_jobs");
  const insertSql = table => `insert into ${table.qualified}(${table.columns}) select ${table.columns} from jsonb_populate_recordset(null::${table.qualified},${lit(JSON.stringify(table.rows))}::jsonb)`;
  while (remaining.length) {
    const ready = remaining.findIndex(table => !dependencies.some(dependency => dependency.child === table.key &&
      dependency.parent !== table.key && remaining.some(other => other.key === dependency.parent)));
    if (ready === -1) break;
    const [table] = remaining.splice(ready, 1);
    const existing = json(to, `select coalesce(jsonb_agg(t order by to_jsonb(t)::text),'[]') from (select ${table.columns} from ${table.qualified}) t;`);
    if (existing.length) assert.deepEqual(existing, table.rows, "migration bootstrap rows must already match exactly");
    else to.sql(insertSql(table) + ";");
  }
  // Intent, payment and provider-event authority have mutual foreign keys.
  // One data-modifying CTE statement lets PostgreSQL validate all immediate
  // foreign keys at statement end, without deferring or disabling constraints.
  if (remaining.length) to.sql(`with ${remaining.map((table, index) => `fixture_${index} as (${insertSql(table)} returning 1)`).join(",\n")} select 1;`);
  const transferred = [];
  for (const table of pending) {
    const inserted = json(to, `select jsonb_agg(t order by to_jsonb(t)::text) from (select ${table.columns} from ${table.qualified}) t;`);
    if (table.table === "production_purchase_measurement_jobs") {
      const semantic = rows => rows.map(row => Object.fromEntries(Object.entries(row)
        .filter(([key]) => !["id", "transaction_id"].includes(key))));
      assert.deepEqual(semantic(inserted), semantic(table.rows));
    } else assert.deepEqual(inserted, table.rows);
    transferred.push({ table: table.key, rows: table.rows.length, columns: table.columns, legacyRowsSha256: hash(JSON.stringify(inserted)),
      ...(table.table === "production_purchase_measurement_jobs" ? { origin: "baseline payment INSERT trigger; random id and transaction_id newly generated" } : {}) });
  }
  return transferred;
}

try {
  await check("fresh and restricted migration authority regression, actual PostgreSQL", async () => {
    const child = spawn(process.execPath, ["scripts/verify-paid-recovery-migration.mjs"], { env: process.env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout.on("data", data => { stdout += data; process.stdout.write(data); });
    child.stderr.on("data", data => { stderr += data; process.stderr.write(data); });
    const code = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", resolve); });
    writeFileSync(`${outputDirectory}/migration-authority.log`, stdout + stderr);
    assert.equal(code, 0, stderr);
    const summary = JSON.parse(stdout.slice(stdout.lastIndexOf('\n{') + 1));
    assert.equal(summary.status, "PASS");
    assert.equal(summary.migrationAuthority.length, 2);
    assert.ok(summary.migrationAuthority.every(mode => mode.functional === 16 && mode.permissionChecks === 36));
    return summary;
  });
  donor = await createLocalPostgres("step4-migration-donor");
  donor.applyThrough(35); donor.sql("grant usage on schema extensions to service_role;");
  donorRest = await createPaidRecoveryPostgrest(donor);
  const donorRun = await createPaidRecoveryApplication(donorRest);
  const purchase = await donorRun.seedVerifiedPurchase();
  const jobId = purchase.fulfillmentJobId;
  await check("actual V17 application saves report before forced worker termination", async () => {
    const killed = await killAfterReport(donorRun, jobId, donorRest);
    const state = identity(donor, jobId);
    assert.equal(state.reports, 1); assert.equal(state.deliveries, 0);
    assert.equal(state.authority.runtimeIdentity.promptBundleVersion, "prompt-bundle-runtime-v17.0.0");
    return { killed, reportCount: state.reports, canonicalCount: state.deliveries, fixtureOrigin: "actual V17 application; fake external providers only" };
  });
  upgraded = await createLocalPostgres("step4-migration-existing-v17");
  upgraded.applyThrough(32);
  const beforeTransfer = identity(donor, jobId);
  let legacySnapshot;
  await check("valid existing purchase and immutable report inserted under actual 0032 schema", async () => {
    assert.equal(upgraded.sql("select count(*) from information_schema.columns where table_schema='public' and column_name in ('input_json','provider_call_count','validated_candidate_run_id');"), "0");
    const constraints = () => json(upgraded, `select jsonb_agg(jsonb_build_object('name',conname,'validated',convalidated) order by conname)
      from pg_constraint where connamespace='public'::regnamespace;`);
    const constraintsBefore = constraints();
    const transferred = transferBaselineRows(donor, upgraded);
    legacySnapshot = identity(upgraded, jobId);
    assert.deepEqual(legacySnapshot, beforeTransfer);
    assert.deepEqual(constraints(), constraintsBefore);
    assert.equal(upgraded.sql("select count(*) from pg_trigger where tgrelid in (select oid from pg_class where relnamespace='public'::regnamespace) and tgenabled='D';"), "0");
    return { transferred, identity: legacySnapshot, constraintsEnabled: true,
      inheritedNotValidConstraints: constraintsBefore.filter(constraint => !constraint.validated).map(constraint => constraint.name),
      note: "0032 retains two 0016 NOT VALID checks; PostgreSQL still enforces them on every newly inserted fixture row. No constraints or triggers are weakened." };
  });
  const installer = upgraded.createRestrictedMigrationRole({ usageSchemas: ["extensions"] });
  const ownerBefore = installer.inspect();
  assert.equal(ownerBefore.attributes.superuser, false); assert.equal(ownerBefore.attributes.bypassRls, false);
  assert.deepEqual(ownerBefore.memberships, []);
  await check("restricted owner partial failure rolls back existing rows then safely retries 0033 through 0035", async () => {
    const applied = [];
    for (const file of migrations) {
      const sql = readFileSync(`supabase/migrations/${file}`, "utf8");
      // Fail after all DDL/backfill but before COMMIT, proving transaction-level
      // recovery. A committed additive migration is intentionally not replayed.
      assert.match(sql, /commit;\s*$/iu);
      const failed = await installer.startSql(sql.replace(/commit;\s*$/iu, "select 1/0;\ncommit;")).result;
      assert.notEqual(failed.code, 0); assert.match(failed.error, /division by zero/u);
      assert.deepEqual(identity(upgraded, jobId), legacySnapshot);
      installer.sql(sql);
      assert.deepEqual(identity(upgraded, jobId), legacySnapshot);
      applied.push({ file, sha256: hash(sql), injectedFailure: "before COMMIT", rollbackPreservedLegacyIdentity: true, retry: "PASS" });
    }
    assert.deepEqual(installer.inspect().attributes, ownerBefore.attributes);
    assert.deepEqual(installer.inspect().memberships, []);
    assert.equal(upgraded.sql("select count(*) from public.assessment_stage_runs where input_json is not null;"), "0");
    return { applied, installer: { currentUser: ownerBefore.currentUser, attributes: ownerBefore.attributes, memberships: ownerBefore.memberships } };
  });
  // Supabase platform prerequisite, separate from application DDL. The actual
  // service role owns no tables and reaches all app state through ACL/RLS.
  upgraded.sql("grant usage on schema extensions to service_role;");
  upgradedRest = await createPaidRecoveryPostgrest(upgraded);
  const recovered = await createPaidRecoveryApplication(upgradedRest, { now: donorRun.now() });
  const acceptedNotificationKeyHashes = [];
  const sendPreparedResult = recovered.email.sendPreparedAssessmentResult.bind(recovered.email);
  recovered.email.sendPreparedAssessmentResult = async request => {
    const receipt = await sendPreparedResult(request);
    // Acceptance is recorded only after the fake external adapter resolves.
    // Payloads, recipients, result URLs and raw idempotency keys stay private.
    acceptedNotificationKeyHashes.push(hash(request.messageIdempotencyKey));
    return receipt;
  };
  const immutable = () => json(upgraded, `select jsonb_build_object('reports',(select jsonb_agg(to_jsonb(r) order by r.run_id) from public.assessment_reports r),
    'stages',(select jsonb_agg(to_jsonb(s)-'input_json' order by s.id) from public.assessment_stage_runs s where s.status='completed'))`);
  const oldArtifacts = immutable();
  const financial = () => json(upgraded, `select jsonb_build_object('payments',(select jsonb_agg(to_jsonb(p) order by p.id) from public.production_verified_payments p),
    'adjustments',(select coalesce(jsonb_agg(to_jsonb(a) order by a.id),'[]') from public.production_payment_adjustment_ledger a),
    'purchases',(select jsonb_agg(to_jsonb(p) order by p.id) from public.production_purchases p))`);
  const oldFinancial = financial();
  const budget = () => json(upgraded, `select jsonb_build_object('calls',provider_call_count,'cost',provider_reserved_cost_usd) from public.production_fulfillment_jobs where id=${lit(jobId)};`);
  const oldBudget = budget();
  const repairCount = () => Number(upgraded.sql(`select count(*) from public.assessment_stage_runs s join public.assessment_runs r on r.id=s.run_id
    join public.production_fulfillment_jobs j on j.preparation_id=(select id from public.production_preparations where assessment_request_id=r.request_id)
    where j.id=${lit(jobId)} and s.attempt_number>1 and s.stage_id in ('PB-04','PB-05','PB-06');`));
  const oldRepairCount = repairCount();
  const finalFacts = () => json(upgraded, `select jsonb_build_object('finalState',j.state,
    'jobObligation',jsonb_build_object('state',j.state,'owner',j.recovery_owner,'workerOwner',j.owner_id,
      'nextAttemptAt',j.recovery_next_attempt_at,'reasonCode',j.recovery_reason_code,'reviewDueAt',j.recovery_review_due_at,
      'completedAt',j.completed_at,'recoveryCycle',j.recovery_cycle_count),
    'grantState',(select status from public.production_assessment_grants where id=j.grant_id),
    'logicalState',(select status from public.production_logical_assessments where id=j.logical_assessment_id),
    'notificationOutboxSentCount',(select count(*) from public.production_notification_outbox n where n.delivery_authority_reference=j.delivery_authority_reference and n.status='sent'),
    'notificationOutboxTotalCount',(select count(*) from public.production_notification_outbox n where n.delivery_authority_reference=j.delivery_authority_reference))
    from public.production_fulfillment_jobs j where j.id=${lit(jobId)};`);
  await check("actual recovery scan, dispatch and application recover legacy V17 with zero Provider additions", async () => {
    recovered.advance(1000);
    await recovered.recoveryRepository.refresh({ environment: "test", now: recovered.now(), limit: 20 });
    recovered.advance(2);
    const due = await recovered.recoveryRepository.listDue({ environment: "test", now: recovered.now(), limit: 20 });
    assert.ok(due.includes(jobId));
    await requestProductionFulfillmentDispatch({ repository: recovered.paymentRepository, dispatcher: recovered.dispatcher,
      jobId, now: recovered.now, uuid: randomUUID });
    const recovery = await recovered.recoveryRepository.inspect(jobId);
    const result = await recovered.payment.processFulfillmentJobById(jobId, Number(recovery.recovery_cycle));
    assert.equal(result.status, "completed", JSON.stringify({ result, recovery, failures: upgradedRest.failures }));
    const after = identity(upgraded, jobId);
    for (const key of Object.keys(legacySnapshot).filter(key => !["jobState", "deliveries", "canonicalRun", "canonicalHash"].includes(key)))
      assert.deepEqual(after[key], legacySnapshot[key], `same existing purchase: ${key}`);
    assert.equal(after.deliveries, 1); assert.equal(after.jobState, "completed");
    assert.equal(recovered.transport.calls.length, 0); assert.equal(recovered.checkoutProvider.requests.length, 0);
    assert.deepEqual(immutable(), oldArtifacts);
    assert.deepEqual(financial(), oldFinancial); assert.deepEqual(budget(), oldBudget);
    const selectedRun = upgraded.sql("select run_id from public.assessment_reports;");
    assert.equal(after.canonicalRun, selectedRun);
    const proof = json(upgraded, `select validated_candidate_evidence from public.production_logical_assessments where id=${lit(after.logical)};`);
    assert.equal(proof.reconstructed_legacy_input, true);
    assert.equal(proof.validation_policy_version, "paid-recovery-validation-v1");
    const stagesRemainLegacy = upgraded.sql("select count(*) from public.assessment_stage_runs where input_json is not null;");
    assert.equal(stagesRemainLegacy, "0");
    assert.ok(upgradedRest.calls.some(call => call.name === "attest_paid_recovery_candidate_v1"));
    assert.ok(upgradedRest.calls.some(call => call.name === "complete_production_fulfillment_v3"));
    const facts = finalFacts();
    assert.equal(facts.finalState, "completed"); assert.equal(facts.grantState, "completed"); assert.equal(facts.logicalState, "completed");
    assert.ok(facts.jobObligation.owner); assert.ok(facts.jobObligation.completedAt);
    for (const key of ["workerOwner", "nextAttemptAt", "reasonCode", "reviewDueAt"]) assert.equal(facts.jobObligation[key], null);
    assert.equal(facts.notificationOutboxSentCount, 1); assert.equal(facts.notificationOutboxTotalCount, 1);
    assert.equal(acceptedNotificationKeyHashes.length, 1);
    const notificationId = upgraded.sql(`select id from public.production_notification_outbox where delivery_authority_reference=(select delivery_authority_reference from public.production_fulfillment_jobs where id=${lit(jobId)});`);
    assert.equal(acceptedNotificationKeyHashes[0], hash(`result-notification:${notificationId}`));
    assert.equal(repairCount() - oldRepairCount, 0);
    Object.assign(after, facts, { contractVersion: "V17", runtimeIdentity: after.authority.runtimeIdentity,
      providerInvocationCount: recovered.transport.calls.length, repairCount: repairCount() - oldRepairCount,
      notificationAcceptedCount: acceptedNotificationKeyHashes.length, notificationAcceptedIdempotencyKeyHashes: [...acceptedNotificationKeyHashes],
      budgetBefore: oldBudget, budgetAfter: budget() });
    assert.equal(after.runtimeIdentity.promptBundleVersion, "prompt-bundle-runtime-v17.0.0");
    assert.equal(after.runtimeIdentity.schemaSetVersion, "pipeline-schema-runtime-v6.0.0");
    evidence.integration = { before: legacySnapshot, after, providerCalls: 0, checkoutCalls: 0, originalArtifactsUnchanged: true,
      financialRowsUnchanged: true, cumulativeBudgetBeforeAfter: oldBudget, budgetBefore: oldBudget, budgetAfter: budget(),
      legacyProofSha256: hash(JSON.stringify(proof)), canonicalSelectedExistingReport: true, serviceRoleRequests: upgradedRest.calls.length };
    return evidence.integration;
  });
  await check("post-upgrade replay is idempotent and application rollback requires retained additive schema", async () => {
    const before = identity(upgraded, jobId);
    const factsBeforeReplay = finalFacts();
    const current = await recovered.recoveryRepository.inspect(jobId);
    await recovered.payment.processFulfillmentJobById(jobId, Number(current.recovery_cycle));
    assert.deepEqual(identity(upgraded, jobId), before);
    assert.equal(recovered.transport.calls.length, 0);
    assert.equal(upgraded.sql("select count(*) from public.production_notification_outbox where status='sent';"), "1");
    assert.deepEqual(finalFacts(), factsBeforeReplay);
    assert.equal(acceptedNotificationKeyHashes.length, 1, "duplicate worker cannot create another accepted notification");
    assert.deepEqual(budget(), oldBudget); assert.equal(repairCount() - oldRepairCount, 0);
    return { duplicateCanonical: false, providerCalls: 0, rollbackLimit: "Only uncommitted migration failure was rolled back. Committed additive schema and recovery evidence are retained; destructive down-migration and rollback of delivered purchases are neither implemented nor claimed.",
      legacyCompletionApisRetained: upgraded.sql("select to_regprocedure('public.complete_production_fulfillment_v2(uuid,uuid,uuid,uuid,uuid,jsonb,text,uuid,text,uuid,timestamptz)') is not null;") === "t" };
  });
  assert.equal(git(["rev-parse", "HEAD"]), head);
  assert.deepEqual(sourceHashes(), initialHashes, "source unchanged throughout S20");
  evidence.status = "PASS";
} catch (error) {
  evidence.status = "FAIL"; evidence.error = error.stack;
  evidence.databaseError = upgradedRest?.failures.at(-1) ?? donorRest?.failures.at(-1);
  process.exitCode = 1; console.error(error);
} finally {
  if (upgradedRest) await upgradedRest.stop(); if (donorRest) await donorRest.stop();
  upgraded?.stop(); donor?.stop();
  writeFileSync(`${outputDirectory}/migration-verification.json`, JSON.stringify(evidence, null, 2) + "\n");
  console.log(JSON.stringify({ scenarioId: "S20", status: evidence.status, checks: results.length, head,
    artifact: `${outputDirectory}/migration-verification.json`, providerCalls: evidence.integration?.providerCalls }));
}
