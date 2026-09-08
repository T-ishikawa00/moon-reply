import assert from "node:assert/strict";
import { createHash } from "node:crypto";

export const migrationSha256 = value => createHash("sha256").update(value).digest("hex");
export const migrationInventoryEntry = (file, bytes) => ({ file, sha256: migrationSha256(bytes),
  canonicalLfSha256: migrationSha256(bytes.toString().replaceAll("\r\n", "\n")) });
const rpc = (signature, trigger = false, serviceExecute = true) => ({ signature: `public.${signature}`, trigger, serviceExecute });
const commonTables = ["production_fulfillment_jobs", "production_payment_adjustment_ledger", "production_customer_deliveries",
  "production_logical_assessments", "production_preparations", "assessment_runs", "assessment_stage_runs", "production_operator_notification_outbox"];

// Reviewed immutable SQL artifacts, not hashes recomputed as expected values.
// The canonical gate checks these pins before importing any SQL verifier.
export const remediationMigrationRegistry = Object.freeze([
  { number: 32, file: "0032_f004_notification_cutover_fence.sql", sha256: "140dca12f8bbc3fc9206c3ba8fc0db0ceec8fa46f0f845e6d1ff5a26a5b76a72",
    verifier: "./verify-f004-cutover-db.mjs" },
  { number: 33, file: "0033_paid_fulfillment_recovery.sql", sha256: "2781946bcc14f51cb7592d7cd6bd406f54cfe7293f0008a7d00b8a3cc88d4734",
    verifier: "./verify-paid-recovery-release-gate.mjs", tables: commonTables,
    columns: { production_fulfillment_jobs: ["recovery_next_attempt_at", "recovery_reason_code", "recovery_owner", "recovery_review_due_at",
      "recovery_started_at", "recovery_cycle_count", "recovery_operator_evidence", "provider_call_count", "provider_reserved_cost_usd", "provider_reservations"] },
    indexes: ["paid_recovery_due_idx"], constraints: ["paid_recovery_nonnegative", "paid_recovery_evidence_arrays"],
    triggers: { paid_financial_adjustment_fence: "fence_paid_financial_adjustment_v1", paid_canonical_financial_fence: "fence_paid_canonical_delivery_v1",
      paid_fulfillment_completion_audit: "record_paid_fulfillment_completion_v1", paid_notification_recovery_completion: "record_paid_notification_recovery_completion_v1" },
    functions: [rpc("lock_paid_fulfillment_financial_v1(uuid)"), rpc("fence_paid_financial_adjustment_v1()", true), rpc("fence_paid_canonical_delivery_v1()", true),
      rpc("schedule_paid_fulfillment_recovery_v1(uuid,uuid,text,boolean,timestamptz,timestamptz,integer)"),
      rpc("refresh_paid_fulfillment_recovery_v1(text,timestamptz,integer)"), rpc("claim_rc2_fulfillment_job_by_id_v3(uuid,uuid,timestamptz,timestamptz,integer)"),
      rpc("list_due_paid_fulfillment_dispatch_v1(text,timestamptz,integer)"), rpc("claim_rc2_fulfillment_dispatch_v3(uuid,text,uuid,timestamptz,timestamptz)"),
      rpc("record_paid_fulfillment_completion_v1()", true), rpc("record_paid_notification_recovery_completion_v1()", true),
      rpc("reserve_paid_fulfillment_provider_v1(uuid,uuid,uuid,numeric,timestamptz)"), rpc("complete_paid_fulfillment_provider_v1(uuid,uuid,uuid,timestamptz)"),
      rpc("inspect_paid_fulfillment_recovery_v1(uuid)"), rpc("resume_paid_fulfillment_recovery_v1(uuid,text,text,text,timestamptz)")] },
  { number: 34, file: "0034_paid_fulfillment_candidate_contract.sql", sha256: "8427d527e701ff7f684736f2d243752ab84e31b053a81ef9a8903b8436c3d5ca",
    // Historical local proof used mixed newlines; the committed Git blob uses
    // LF. Accept these two reviewed byte artifacts only, with one exact body.
    acceptedSha256: ["8427d527e701ff7f684736f2d243752ab84e31b053a81ef9a8903b8436c3d5ca", "6530c6fd4667e169636d8af454304c1726ecfb1488d2c63079ee6715753aa8ab"],
    canonicalLfSha256: "6530c6fd4667e169636d8af454304c1726ecfb1488d2c63079ee6715753aa8ab",
    verifier: "./verify-paid-recovery-release-gate.mjs", tables: commonTables,
    columns: { assessment_stage_runs: ["input_json"], production_logical_assessments: ["fulfillment_job_owner_id", "validated_candidate_run_id",
      "validated_candidate_report_hash", "validated_candidate_validation_hash", "validated_candidate_evidence"] },
    indexes: [], constraints: ["assessment_runs_topology_runtime_identity", "production_preparations_state"],
    triggers: { paid_candidate_delivery_fence: "fence_paid_candidate_delivery_v1", assessment_stage_runs_topology_v5: "enforce_assessment_stage_topology_v5" },
    functions: [rpc("paid_recovery_contract_matches_v1(jsonb,text,text,text,text)"), rpc("claim_production_fulfillment_v4(uuid,uuid,timestamptz,timestamptz)"),
      rpc("attest_paid_recovery_candidate_v1(uuid,uuid,uuid,text,text,jsonb,uuid,jsonb,jsonb,timestamptz,text,boolean,text)"),
      rpc("complete_production_fulfillment_v3(uuid,uuid,uuid,uuid,text,text,uuid,jsonb,text,uuid,text,uuid,timestamptz)"),
      rpc("fence_paid_candidate_delivery_v1()", true), rpc("enforce_assessment_stage_topology_v5()", true, false)] },
  { number: 35, file: "0035_paid_recovery_operator_followup.sql", sha256: "848b4c5ceadd9e2c592a9d580881af4882c7928eb948f109c8c9b6c920230e95",
    verifier: "./verify-paid-recovery-release-gate.mjs", tables: commonTables, columns: {}, indexes: [],
    constraints: ["production_operator_notification_event_key"], triggers: {},
    functions: [rpc("paid_recovery_operator_signal_v1(uuid,timestamptz)"),
      rpc("claim_production_operator_notification_batch_v1(uuid,text,timestamptz,timestamptz,timestamptz,integer)"),
      rpc("begin_production_operator_notification_send_v1(uuid,uuid,timestamptz)")] },
]);

export function assertMigrationInventory(registry, inventory) {
  assert.equal(new Set(registry.map(entry => entry.file)).size, registry.length, "B2_DUPLICATE_REGISTRATION");
  assert.equal(new Set(registry.map(entry => entry.number)).size, registry.length, "B2_DUPLICATE_MIGRATION_NUMBER");
  assert.deepEqual(registry.map(entry => entry.number), [...registry.map(entry => entry.number)].sort((a, b) => a - b), "B2_MIGRATION_ORDER_INVALID");
  for (const entry of registry) {
    assert.equal(entry.number, Number(entry.file.slice(0, 4)), "B2_MIGRATION_NUMBER_INVALID");
    assert.match(entry.file, /^\d{4}_[a-z0-9_]+\.sql$/u); assert.match(entry.sha256, /^[a-f0-9]{64}$/u);
  }
  assert.deepEqual(inventory.map(entry => entry.file), registry.map(entry => entry.file), "B2_MIGRATION_INVENTORY_MISMATCH");
  for (const entry of registry) {
    const actual = inventory.find(candidate => candidate.file === entry.file);
    assert.ok((entry.acceptedSha256 ?? [entry.sha256]).includes(actual?.sha256), `B2_MIGRATION_HASH_MISMATCH:${entry.file}`);
    assert.equal(actual.canonicalLfSha256, entry.canonicalLfSha256 ?? entry.sha256, `B2_MIGRATION_BODY_MISMATCH:${entry.file}`);
  }
}

export function assertMigrationReceipt(entry, results, actualArtifact) {
  assert.deepEqual(results.map(result => result.mode), ["superuser-reference", "restricted-owner"], "B2_INSTALLER_LAYERS_REQUIRED");
  for (const result of results) {
    assert.ok(result.functional > 0 && result.permissionChecks > 0, "B2_RUNTIME_PERMISSION_EVIDENCE_REQUIRED");
    assert.deepEqual(result.artifacts.filter(artifact => artifact.file === entry.file), [{ file: entry.file, sha256: actualArtifact.sha256 }], `B2_APPLIED_ARTIFACT_MISMATCH:${entry.file}`);
  }
}

const literal = value => `'${String(value).replaceAll("'", "''")}'`;
const roles = ["service_role", "anon", "authenticated", "m2_b2_stripe_ingress"];
const tablePrivileges = ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER", "MAINTAIN"];
const columnPrivileges = ["SELECT", "INSERT", "UPDATE", "REFERENCES"];
export function capturePaidTablePrivileges(db) {
  return JSON.parse(db.sql(`select jsonb_object_agg(c.relname,(select jsonb_object_agg(role_name,
    (select jsonb_object_agg(privilege_name,has_table_privilege(role_name,c.oid,privilege_name))
      from unnest(array[${tablePrivileges.map(literal).join(",")}]) privilege_name)
      || (select jsonb_object_agg('COLUMN_'||privilege_name,has_any_column_privilege(role_name,c.oid,privilege_name))
        from unnest(array[${columnPrivileges.map(literal).join(",")}]) privilege_name)) from unnest(array[${roles.map(literal).join(",")}]) role_name))
    from pg_class c where c.relnamespace='public'::regnamespace and c.relname in (${commonTables.map(literal).join(",")});`));
}
export function capturePaidRuntimeDependencies(db) {
  return JSON.parse(db.sql(`select jsonb_build_object('schemaOwner',pg_get_userbyid(n.nspowner),'digestOwner',pg_get_userbyid(p.proowner),
    'serviceSchemaUsage',has_schema_privilege('service_role',n.oid,'USAGE'),
    'serviceDigestExecute',has_function_privilege('service_role',p.oid,'EXECUTE'),
    'publicDigestExecute',exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE'),
    'explicitServiceDigestExecute',exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
      where a.grantee=(select oid from pg_roles where rolname='service_role') and a.privilege_type='EXECUTE'))
    from pg_namespace n join pg_proc p on p.oid=to_regprocedure('extensions.digest(bytea,text)') where n.nspname='extensions';`));
}
export function assertPaidMigrationCatalog(db, registry, expectedOwner, baselineTablePrivileges, baselineRuntimeDependencies) {
  const functions = registry.flatMap(entry => entry.functions ?? []);
  const tables = [...new Set(registry.flatMap(entry => entry.tables ?? []))];
  const signatures = functions.map(entry => `(${literal(entry.signature)})`).join(",");
  const catalog = JSON.parse(db.sql(`select jsonb_build_object(
    'functions',(select jsonb_agg(jsonb_build_object('signature',required.signature,'exists',p.oid is not null,
      'owner',pg_get_userbyid(p.proowner),'securityDefiner',p.prosecdef,'config',p.proconfig,
      'privileges',(select jsonb_object_agg(role_name,case when p.oid is null then false else has_function_privilege(role_name,p.oid,'EXECUTE') end)
        from unnest(array[${roles.map(literal).join(",")}]) role_name)) order by required.signature)
      from (values ${signatures}) required(signature) left join pg_proc p on p.oid=to_regprocedure(required.signature)),
    'tables',(select jsonb_agg(jsonb_build_object('name',c.relname,'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,
      'privileges',(select jsonb_object_agg(role_name,has_table_privilege(role_name,c.oid,'SELECT')) from unnest(array[${roles.map(literal).join(",")}]) role_name)) order by c.relname)
      from pg_class c where c.relnamespace='public'::regnamespace and c.relname in (${tables.map(literal).join(",")})),
    'columns',(select jsonb_object_agg(table_name,column_names) from (select table_name,jsonb_agg(column_name) column_names from information_schema.columns
      where table_schema='public' group by table_name) columns),
    'indexes',(select jsonb_agg(indexname) from pg_indexes where schemaname='public'),
    'constraints',(select jsonb_object_agg(conname,convalidated) from pg_constraint where connamespace='public'::regnamespace),
    'triggers',(select jsonb_object_agg(t.tgname,jsonb_build_object('function',p.proname,'enabled',t.tgenabled)) from pg_trigger t
      join pg_proc p on p.oid=t.tgfoid where not t.tgisinternal and p.pronamespace='public'::regnamespace));`));
  for (const fn of catalog.functions) {
    assert.equal(fn.exists, true, `B2_REQUIRED_RPC_MISSING:${fn.signature}`);
    assert.equal(fn.owner, expectedOwner, `B2_FUNCTION_OWNER_MISMATCH:${fn.signature}`);
    assert.equal(fn.securityDefiner, false, `B2_SECURITY_INVOKER_REQUIRED:${fn.signature}`);
    assert.ok(fn.config?.includes('search_path=""'), `B2_EMPTY_SEARCH_PATH_REQUIRED:${fn.signature}`);
    const required = functions.find(entry => entry.signature === fn.signature);
    for (const role of roles) assert.equal(fn.privileges[role], role === "service_role" && required.serviceExecute, `B2_RUNTIME_EXECUTE_MISMATCH:${role}:${fn.signature}`);
  }
  assert.equal(catalog.tables.length, tables.length, "B2_REQUIRED_TABLE_MISSING");
  for (const table of catalog.tables) {
    assert.equal(table.owner, expectedOwner, `B2_TABLE_OWNER_MISMATCH:${table.name}`);
    assert.equal(table.rls, true, `B2_RLS_REQUIRED:${table.name}`);
    for (const role of roles) assert.equal(table.privileges[role], role === "service_role", `B2_TABLE_SELECT_MISMATCH:${role}:${table.name}`);
  }
  const effectiveTablePrivileges = capturePaidTablePrivileges(db);
  for (const [table, matrix] of Object.entries(effectiveTablePrivileges)) {
    for (const role of roles.filter(role => role !== "service_role"))
      for (const [privilege, allowed] of Object.entries(matrix[role])) assert.equal(allowed, false, `B2_UNEXPECTED_TABLE_PRIVILEGE:${role}:${table}:${privilege}`);
    assert.ok(baselineTablePrivileges?.[table], `B2_BASELINE_TABLE_PRIVILEGES_REQUIRED:${table}`);
    const expected = { ...baselineTablePrivileges[table].service_role,
      ...(table === "production_payment_adjustment_ledger" ? { SELECT: true, COLUMN_SELECT: true } : {}) };
    assert.deepEqual(matrix.service_role, expected, `B2_SERVICE_TABLE_PRIVILEGES_CHANGED:${table}`);
  }
  for (const entry of registry) {
    for (const [table, columns] of Object.entries(entry.columns ?? {})) for (const column of columns)
      assert.ok(catalog.columns[table]?.includes(column), `B2_REQUIRED_COLUMN_MISSING:${table}.${column}`);
    for (const index of entry.indexes ?? []) assert.ok(catalog.indexes.includes(index), `B2_REQUIRED_INDEX_MISSING:${index}`);
    for (const constraint of entry.constraints ?? []) assert.equal(catalog.constraints[constraint], true, `B2_REQUIRED_CONSTRAINT_MISSING:${constraint}`);
    for (const [trigger, fn] of Object.entries(entry.triggers ?? {})) {
      assert.equal(catalog.triggers[trigger]?.function, fn, `B2_REQUIRED_TRIGGER_MISMATCH:${trigger}`);
      assert.equal(catalog.triggers[trigger]?.enabled, "O", `B2_REQUIRED_TRIGGER_DISABLED:${trigger}`);
    }
  }
  assert.equal(db.sql("select has_table_privilege('service_role','public.production_payment_adjustment_ledger','INSERT,UPDATE,DELETE');"), "f", "B2_FINANCIAL_WRITE_PRIVILEGE_FORBIDDEN");
  const runtimeDependencies = capturePaidRuntimeDependencies(db);
  assert.ok(runtimeDependencies, "B2_RUNTIME_DIGEST_OBJECT_REQUIRED");
  assert.equal(runtimeDependencies.serviceSchemaUsage, true, "B2_RUNTIME_SCHEMA_USAGE_REQUIRED");
  assert.equal(runtimeDependencies.serviceDigestExecute, true, "B2_RUNTIME_DIGEST_EXECUTE_REQUIRED");
  for (const key of ["schemaOwner", "digestOwner"]) assert.equal(runtimeDependencies[key], baselineRuntimeDependencies?.[key], `B2_EXTENSION_OWNER_CHANGED:${key}`);
  return { owner: expectedOwner, requiredFunctions: catalog.functions, tables: catalog.tables, effectiveTablePrivileges, runtimeDependencies,
    migrationNumbers: registry.map(entry => entry.number), serviceRoleFinancialWrites: false };
}

export async function probePaidMigrationRuntime(db, registry) {
  const functions = registry.flatMap(entry => entry.functions ?? []);
  const runtime = [];
  const digest = await db.startSql("begin; set local role service_role; select encode(extensions.digest(convert_to('B2_RUNTIME_DEPENDENCY','UTF8'),'sha256'),'hex'); rollback;").result;
  assert.equal(digest.code, 0, `B2_RUNTIME_DIGEST_CALL_FAILED:${digest.error}`);
  assert.equal(digest.output, migrationSha256("B2_RUNTIME_DEPENDENCY"));
  runtime.push({ role: "service_role", dependency: "extensions.digest(bytea,text)", outcome: "actual SHA256 invocation matched" });
  for (const role of roles) {
    const blocks = functions.map(fn => {
      const [, name, types] = /^(.*)\((.*)\)$/u.exec(fn.signature);
      const call = `${name}(${types ? types.split(",").map(type => `null::${type}`).join(",") : ""})`;
      if (role === "service_role" && fn.trigger) return "";
      return role === "service_role"
        ? `do $probe$ begin perform ${call}; exception when sqlstate 'P0001' then null; end; $probe$;`
        : `do $probe$ begin begin perform ${call}; exception when insufficient_privilege then return; end; raise exception 'B2_UNEXPECTED_RUNTIME_ADMISSION'; end; $probe$;`;
    }).join("\n");
    const result = await db.startSql(`begin; set local role ${role}; ${blocks} rollback;`).result;
    assert.equal(result.code, 0, `B2_RUNTIME_PROBE_FAILED:${role}:${result.error}`);
    runtime.push({ role, functionsProbed: functions.filter(fn => role !== "service_role" || !fn.trigger).length,
      outcome: role === "service_role" ? "call admitted or existing business input guard" : "permission denied" });
  }
  return runtime;
}
