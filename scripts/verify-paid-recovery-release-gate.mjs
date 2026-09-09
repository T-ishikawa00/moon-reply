import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createLocalPostgres } from "./remediation-local-postgres.mjs";
import { remediationMigrationRegistry, migrationSha256, migrationInventoryEntry, assertMigrationInventory, assertMigrationReceipt, assertPaidMigrationCatalog,
  capturePaidTablePrivileges, capturePaidRuntimeDependencies, probePaidMigrationRuntime } from "./lib/remediation-migration-release-contracts.mjs";
// Registered by the canonical gate, retaining the existing actual PostgreSQL
// functional, installer and runtime proof rather than replacing it with flags.
import { migrationVerification as recoveryVerification } from "./verify-paid-recovery-migration.mjs";
import { migrationVerification as preparationVerification } from "./verify-v19-preparation-migration.mjs";
export const migrationVerification = recoveryVerification.map(layer => {
  const preparation = preparationVerification.find(candidate => candidate.mode === layer.mode);
  assert.ok(preparation, "0036_INSTALLER_LAYER_REQUIRED");
  return { ...layer, functional: layer.functional + preparation.functional,
    permissionChecks: layer.permissionChecks + preparation.permissionChecks,
    artifacts: [...layer.artifacts, ...preparation.artifacts] };
});

const inventory = remediationMigrationRegistry.map(({ file }) => migrationInventoryEntry(file, readFileSync(`supabase/migrations/${file}`)));
const paidRegistry = remediationMigrationRegistry.filter(entry => entry.number >= 33)
  .map(entry => ({ ...entry, sha256: inventory.find(actual => actual.file === entry.file).sha256 }));
const checks = [];
const record = (id, name, detail = {}) => { checks.push({ id, name, status: "PASS", ...detail }); console.log(`PASS B2 ${id} ${name}`); };
const negative = (id, name, callback, expected) => { assert.throws(callback, expected); record(id, name, { rejects: String(expected) }); };
assertMigrationInventory(remediationMigrationRegistry, inventory);
negative("B", "missing 0035 registration rejected", () => assertMigrationInventory(remediationMigrationRegistry.filter(entry => entry.number !== 35), inventory), /B2_MIGRATION_INVENTORY_MISMATCH/u);
negative("B.0036", "missing 0036 registration rejected", () => assertMigrationInventory(remediationMigrationRegistry.filter(entry => entry.number !== 36), inventory), /B2_MIGRATION_INVENTORY_MISMATCH/u);
negative("B.future", "unregistered future migration rejected", () => assertMigrationInventory(remediationMigrationRegistry,
  [...inventory, { file: "0037_unregistered_fixture.sql", sha256: "0".repeat(64) }]), /B2_MIGRATION_INVENTORY_MISMATCH/u);
negative("C", "changed SQL bytes rejected against pinned hash", () => assertMigrationInventory(remediationMigrationRegistry,
  inventory.map(entry => entry.file.startsWith("0034") ? { ...entry, sha256: migrationSha256(readFileSync(`supabase/migrations/${entry.file}`, "utf8") + "\n-- drift fixture") } : entry)), /B2_MIGRATION_HASH_MISMATCH/u);
negative("D", "wrong registered application order rejected", () => assertMigrationInventory(
  [remediationMigrationRegistry[0], remediationMigrationRegistry[1], remediationMigrationRegistry[3], remediationMigrationRegistry[2], ...remediationMigrationRegistry.slice(4)], inventory), /B2_MIGRATION_ORDER_INVALID/u);
negative("D.number", "wrong migration number rejected", () => assertMigrationInventory(remediationMigrationRegistry.map(entry => entry.number === 34 ? { ...entry, number: 33.5 } : entry), inventory), /B2_MIGRATION_NUMBER_INVALID/u);
negative("D.duplicate", "duplicate registered migration number rejected", () => assertMigrationInventory(
  [...remediationMigrationRegistry.slice(0, 2), { ...remediationMigrationRegistry[1], file: "0033_duplicate_fixture.sql" }, ...remediationMigrationRegistry.slice(2)], inventory), /B2_DUPLICATE_MIGRATION_NUMBER/u);
const lfInventory = inventory.map(entry => entry.file.startsWith("0034")
  ? migrationInventoryEntry(entry.file, readFileSync(`supabase/migrations/${entry.file}`, "utf8").replaceAll("\r\n", "\n")) : entry);
assertMigrationInventory(remediationMigrationRegistry, lfInventory);
record("C.lf", "exact committed LF variant accepted with same pinned body", { actual: lfInventory.find(entry => entry.file.startsWith("0034")) });
negative("C.receipt", "valid artifact variant cannot borrow another raw-hash receipt", () => assertMigrationReceipt(paidRegistry[1],
  migrationVerification.map(layer => ({ ...layer, artifacts: layer.artifacts.map(entry => entry.file.startsWith("0034") ? { ...entry, sha256: "0".repeat(64) } : entry) })), inventory.find(entry => entry.file.startsWith("0034"))), /B2_APPLIED_ARTIFACT_MISMATCH/u);
negative("K.receipt", "superuser-only receipt cannot satisfy installer parity", () => assertMigrationReceipt(paidRegistry[0],
  migrationVerification.filter(layer => layer.mode === "superuser-reference"), inventory.find(entry => entry.file.startsWith("0033"))), /B2_INSTALLER_LAYERS_REQUIRED/u);

const fresh = await createLocalPostgres("step5a1-b2-fresh-empty");
try {
  fresh.applyThrough(32);
  // Explicit platform prerequisite in this disposable cluster, not a new
  // application migration grant or a claim about Production permissions.
  fresh.sql("grant usage on schema extensions to service_role;");
  const baselineRuntimeDependencies = capturePaidRuntimeDependencies(fresh);
  const empty = () => Number(fresh.sql("select (select count(*) from public.production_purchase_intents)+(select count(*) from public.production_verified_payments)+(select count(*) from public.production_fulfillment_jobs)+(select count(*) from public.assessment_runs)+(select count(*) from public.assessment_stage_runs)+(select count(*) from public.production_customer_deliveries);"));
  assert.equal(empty(), 0);
  const baselinePrivileges = capturePaidTablePrivileges(fresh);
  const owner = fresh.createRestrictedMigrationRole({ roleName: "b2_fresh_owner", usageSchemas: ["extensions"] });
  for (const entry of paidRegistry) owner.sql(readFileSync(`supabase/migrations/${entry.file}`, "utf8"));
  assert.equal(empty(), 0);
  const freshCatalog = assertPaidMigrationCatalog(fresh, paidRegistry, owner.roleName, baselinePrivileges, baselineRuntimeDependencies);
  const freshRuntime = await probePaidMigrationRuntime(fresh, paidRegistry);
  record("I", "empty business database installs 0033 through 0036 with restricted owner", { businessRowsBefore: 0, businessRowsAfter: 0,
    applicationOrder: paidRegistry.map(entry => entry.number), owner: owner.inspect().attributes,
    requiredFunctions: freshCatalog.requiredFunctions.length, runtime: freshRuntime,
    platformPrerequisite: { serviceExtensionsUsage: "explicit fixture bootstrap", digestExecute: "existing pgcrypto ACL asserted", ...baselineRuntimeDependencies } });
} finally { fresh.stop(); }

const db = await createLocalPostgres("step5a1-b2-release-gate");
let catalog, runtime, installerProof, applied;
const sqlJson = statement => JSON.parse(db.sql(statement));
const instant = "2026-09-09T00:00:00Z";
try {
  db.applyThrough(32);
  db.sql("grant usage on schema extensions to service_role;");
  const baselineRuntimeDependencies = capturePaidRuntimeDependencies(db);
  // Existing authenticated TEST purchase under the exact 0032 schema. The
  // actual verified-payment RPC creates the payment/job; external facts only
  // are synthetic. Constraints, RLS and triggers are never disabled to seed.
  const fixture = readFileSync("supabase/tests/m2_b2_i2_private_reconciliation_r1.sql", "utf8").replaceAll("\r\n", "\n");
  const start = fixture.indexOf("insert into auth.users"), end = fixture.indexOf("update public.production_payment_attempts set\n  reconciliation_retry_after");
  assert.ok(start >= 0 && end > start); db.sql(fixture.slice(start, end));
  db.sql(`update public.production_payment_attempts set state='pending',provider_checkout_session_id='cs_test_m2_b2_i2_1',
    provider_checkout_url='https://checkout.stripe.com/c/pay/b2-local' where id='67000000-0000-4000-8000-000000000001';
    set role service_role;
    select public.record_rc2_stripe_evidence_v2('evt_b2_release_fixture','webhook','checkout.session.completed','${instant}',
      '${"b".repeat(64)}','test','57000000-0000-4000-8000-000000000001','cs_test_m2_b2_i2_1','pi_b2_release_fixture',
      'payment','paid',980,'jpy','verified',null,'77000000-0000-4000-8000-000000000001','87000000-0000-4000-8000-000000000001','${instant}');`);
  const baselineRows = () => sqlJson(`select jsonb_build_object('payment',(select to_jsonb(p) from public.production_verified_payments p where id='77000000-0000-4000-8000-000000000001'),
    'intent',(select to_jsonb(i) from public.production_purchase_intents i where id='57000000-0000-4000-8000-000000000001'),
    'job',(select jsonb_build_object('id',id,'state',state,'purchase_intent_id',purchase_intent_id,'verified_payment_id',verified_payment_id,'preparation_id',preparation_id,'attempt_count',attempt_count)
      from public.production_fulfillment_jobs where id='87000000-0000-4000-8000-000000000001'))`);
  const before = baselineRows(); assert.equal(before.intent.state, "verified"); assert.equal(before.job.state, "pending"); assert.ok(before.payment);
  const baselinePrivileges = capturePaidTablePrivileges(db);
  const installer = db.createRestrictedMigrationRole({ roleName: "b2_migration_owner", usageSchemas: ["extensions"] });
  const inspect = () => assertPaidMigrationCatalog(db, paidRegistry, installer.roleName, baselinePrivileges, baselineRuntimeDependencies);
  installerProof = installer.inspect();
  assert.deepEqual(installerProof.attributes, { superuser: false, createDb: false, createRole: false, replication: false, bypassRls: false, inherit: false, login: true });
  assert.equal(installerProof.currentUser, installer.roleName); assert.equal(installerProof.sessionUser, installer.roleName);
  assert.deepEqual(installerProof.memberships, []); assert.deepEqual(installerProof.explicitParameterGrants, []); assert.deepEqual(installerProof.objects.otherOwners, []);

  db.sql("alter table public.production_fulfillment_jobs owner to postgres;");
  try {
    const denied = await installer.startSql(readFileSync(`supabase/migrations/${paidRegistry[0].file}`, "utf8")).result;
    assert.notEqual(denied.code, 0); assert.match(denied.error, /must be owner|permission denied/u);
    assert.equal(db.sql("select count(*) from information_schema.columns where table_schema='public' and table_name='production_fulfillment_jobs' and column_name='provider_call_count';"), "0");
    assert.deepEqual(baselineRows(), before);
    record("F.installer", "actual insufficient-ownership installer fails atomically", { actualSqlRejected: true, existingRowsUnchanged: true });
  } finally { db.sql(`alter table public.production_fulfillment_jobs owner to ${installer.roleName};`); }

  applied = [];
  for (const entry of paidRegistry) {
    const migration = readFileSync(`supabase/migrations/${entry.file}`, "utf8"); assert.equal(migrationSha256(migration), entry.sha256);
    installer.sql(migration); assert.deepEqual(baselineRows(), before);
    applied.push({ number: entry.number, file: entry.file, sha256: migrationSha256(migration), owner: installer.roleName });
    assertPaidMigrationCatalog(db, paidRegistry.filter(candidate => candidate.number <= entry.number), installer.roleName, baselinePrivileges, baselineRuntimeDependencies);
  }
  assert.deepEqual(installer.inspect().attributes, installerProof.attributes);
  assert.deepEqual(installer.inspect().memberships, []); assert.deepEqual(installer.inspect().explicitParameterGrants, []);
  record("J", "0032 verified purchase upgrade preserves existing authority", { priorMigration: 32, applicationOrder: applied.map(entry => entry.number),
    verifiedPayments: 1, existingRowsSha256: migrationSha256(JSON.stringify(before)), existingRowsUnchanged: true });
  record("K", "direct non-superuser installer installs all exact artifacts", { attributes: installerProof.attributes, directLogin: true, parameterPrivilegesAdded: false });
  catalog = inspect(); runtime = await probePaidMigrationRuntime(db, paidRegistry);
  record("L", "RPC owner security-invoker ACL and table RLS matrix passes", { functions: catalog.requiredFunctions.length, tables: catalog.tables.length, runtime,
    baselineTablePrivileges: baselinePrivileges, allowedServiceTableDelta: "0033 adds finance ledger SELECT only" });

  const signature = "public.inspect_paid_fulfillment_recovery_v1(uuid)";
  installer.sql(`alter function ${signature} rename to b2_missing_required_rpc_fixture;`);
  try { negative("E", "missing exact RPC signature rejected", inspect, /B2_REQUIRED_RPC_MISSING/u); }
  finally { installer.sql("alter function public.b2_missing_required_rpc_fixture(uuid) rename to inspect_paid_fulfillment_recovery_v1;"); }
  db.sql(`alter function ${signature} owner to postgres;`);
  try { negative("F.owner", "wrong installed function owner rejected", inspect, /B2_FUNCTION_OWNER_MISMATCH/u); }
  finally { db.sql(`alter function ${signature} owner to ${installer.roleName};`); }
  installer.sql(`revoke execute on function ${signature} from service_role;`);
  try {
    negative("G", "missing service-role EXECUTE rejected", inspect, /B2_RUNTIME_EXECUTE_MISMATCH:service_role/u);
    const denied = await db.startSql("set role service_role; select public.inspect_paid_fulfillment_recovery_v1(null);").result;
    assert.notEqual(denied.code, 0); assert.match(denied.error, /permission denied/u);
  } finally { installer.sql(`grant execute on function ${signature} to service_role;`); }
  const exposureSignature = "public.paid_recovery_contract_matches_v1(jsonb,text,text,text,text)";
  for (const role of ["anon", "authenticated"]) {
    installer.sql(`grant execute on function ${exposureSignature} to ${role};`);
    try {
      negative(`H.${role}`, `unexpected ${role} EXECUTE rejected`, inspect, /B2_RUNTIME_EXECUTE_MISMATCH/u);
      const admitted = await db.startSql(`set role ${role}; select public.paid_recovery_contract_matches_v1(null,null,null,null,null);`).result;
      assert.equal(admitted.code, 0, "permission drift fixture actually admits the role");
    } finally { installer.sql(`revoke execute on function ${exposureSignature} from ${role};`); }
    installer.sql(`grant insert on table public.production_fulfillment_jobs to ${role};`);
    try { negative(`H.${role}.insert`, `unexpected ${role} INSERT without SELECT rejected`, inspect, /B2_UNEXPECTED_TABLE_PRIVILEGE/u); }
    finally { installer.sql(`revoke insert on table public.production_fulfillment_jobs from ${role};`); }
    for (const privilege of ["select", "insert"]) {
      installer.sql(`grant ${privilege}(id) on table public.production_fulfillment_jobs to ${role};`);
      try { negative(`H.${role}.column-${privilege}`, `unexpected ${role} column-only ${privilege} rejected`, inspect, /B2_UNEXPECTED_TABLE_PRIVILEGE/u); }
      finally { installer.sql(`revoke ${privilege}(id) on table public.production_fulfillment_jobs from ${role};`); }
    }
  }
  const preparationSignature = paidRegistry.find(entry => entry.number === 36).functions[0].signature;
  installer.sql(`alter function ${preparationSignature} rename to missing_0036_rpc_fixture;`);
  try { negative("E.0036", "missing exact 0036 RPC signature rejected", inspect, /B2_REQUIRED_RPC_MISSING/u); }
  finally { installer.sql("alter function public.missing_0036_rpc_fixture(uuid,uuid,text,jsonb,bigint,bigint,bigint,bigint,numeric,timestamptz) rename to finalize_purchase_ready_assessment_v1;"); }
  installer.sql(`revoke execute on function ${preparationSignature} from service_role;`);
  try { negative("G.0036", "missing 0036 service EXECUTE rejected", inspect, /B2_RUNTIME_EXECUTE_MISMATCH/u); }
  finally { installer.sql(`grant execute on function ${preparationSignature} to service_role;`); }
  for (const role of ["anon", "authenticated"]) {
    installer.sql(`grant execute on function ${preparationSignature} to ${role};`);
    try { negative(`H.0036.${role}.execute`, `unexpected preparation ${role} EXECUTE rejected`, inspect, /B2_RUNTIME_EXECUTE_MISMATCH/u); }
    finally { installer.sql(`revoke execute on function ${preparationSignature} from ${role};`); }
    for (const table of ["assessment_requests", "assessment_clarifications"]) {
      installer.sql(`grant insert(id) on table public.${table} to ${role};`);
      try { negative(`H.0036.${role}.${table}.column`, `unexpected ${role} preparation column INSERT rejected`, inspect, /B2_UNEXPECTED_TABLE_PRIVILEGE/u); }
      finally { installer.sql(`revoke insert(id) on table public.${table} from ${role};`); }
    }
  }
  installer.sql("alter table public.assessment_clarifications disable row level security;");
  try { negative("L.0036.rls", "disabled clarification RLS rejected", inspect, /B2_RLS_REQUIRED/u); }
  finally { installer.sql("alter table public.assessment_clarifications enable row level security;"); }
  installer.sql("revoke update on table public.production_fulfillment_jobs from service_role;");
  try { negative("G.table", "missing service table UPDATE rejected", inspect, /B2_SERVICE_TABLE_PRIVILEGES_CHANGED/u); }
  finally { installer.sql("grant update on table public.production_fulfillment_jobs to service_role;"); }
  installer.sql("alter table public.production_fulfillment_jobs disable row level security;");
  try { negative("L.rls", "disabled required RLS rejected", inspect, /B2_RLS_REQUIRED/u); }
  finally { installer.sql("alter table public.production_fulfillment_jobs enable row level security;"); }
  db.sql("revoke usage on schema extensions from service_role;");
  try {
    negative("G.extensions-usage", "missing runtime extensions USAGE rejected", inspect, /B2_RUNTIME_SCHEMA_USAGE_REQUIRED/u);
    const denied = await db.startSql("set role service_role; select extensions.digest('test'::bytea,'sha256');").result;
    assert.notEqual(denied.code, 0); assert.match(denied.error, /permission denied for schema/u);
  } finally { db.sql("grant usage on schema extensions to service_role;"); }
  db.sql("revoke execute on function extensions.digest(bytea,text) from public,service_role;");
  try {
    negative("G.digest-execute", "missing runtime digest EXECUTE rejected", inspect, /B2_RUNTIME_DIGEST_EXECUTE_REQUIRED/u);
    const denied = await db.startSql("set role service_role; select extensions.digest('test'::bytea,'sha256');").result;
    assert.notEqual(denied.code, 0); assert.match(denied.error, /permission denied for function/u);
  } finally {
    if (baselineRuntimeDependencies.publicDigestExecute) db.sql("grant execute on function extensions.digest(bytea,text) to public;");
    if (baselineRuntimeDependencies.explicitServiceDigestExecute) db.sql("grant execute on function extensions.digest(bytea,text) to service_role;");
  }
  assert.deepEqual(inspect(), catalog, "negative fixture cleanup restores exact catalog contract"); assert.deepEqual(baselineRows(), before);
  record("A", "0033 0034 0035 0036 canonical release contract passes", { applied });
} finally { db.stop(); }

export const releaseGateVerification = { status: "PASS", registeredMigrationNumbers: paidRegistry.map(entry => entry.number), checks,
  applied, installer: { currentUser: installerProof.currentUser, sessionUser: installerProof.sessionUser, attributes: installerProof.attributes,
    memberships: installerProof.memberships, explicitParameterGrants: installerProof.explicitParameterGrants }, catalog, runtime };
