import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const authority = "752f687b5ea6bead28a464f9bb9870fb092e143e";
const expectedBranch = "task/m2-b2-i1-r3-event-trigger-acl-hardening-r1";
const expectedRemoteDefinitionHash =
  "62e77d28f3013a8047bb431be5f8b174ad51cdde883dcc3b0d6c6c0a84e954a3";
const expectedRemoteSourceMd5 = "99be20677b456ea8d3be47bdd44fb369";
const expected0019Sha256 =
  "b4e5ef6b06ef6e70c0904e7b1692c2863861c73738454d499ac3b730a082456c";
let passed = 0;

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function gitRaw(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

async function check(name, proof) {
  await proof();
  passed += 1;
  console.log(`PASS ${name}`);
}

const migrationPath = path.join(
  root,
  "supabase/migrations/0018_m2_b2_webhook_ingress_authority.sql",
);
const fixturePath = path.join(
  root,
  "supabase/tests/m2_b2_i1_remote_event_trigger_fixture_setup_r1.sql",
);
const compatibilityPath = path.join(
  root,
  "supabase/tests/m2_b2_i1_remote_event_trigger_acl_compatibility_r1.sql",
);

await check("bounded branch and authority lineage", async () => {
  assert.equal(git("branch", "--show-current"), expectedBranch);
  assert.equal(git("merge-base", authority, "HEAD"), authority);

  const allowed = new Set([
    "docs/CODEX_HANDOFF.md",
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/m2/M2_B2_I1_PUBLIC_INGRESS_AUTHORITY.md",
    "docs/m2/M2_B2_I1_R3_REMOTE_EVENT_TRIGGER_ACL_COMPATIBILITY.md",
    "docs/m2/M2_B2_I2_PRIVATE_RECOVERY_SCHEDULERS.md",
    "docs/m2/M2_MASTER_BACKLOG.md",
    "package.json",
    "scripts/verify-m2-b2-i1-r3-event-trigger-acl-compatibility.mjs",
    "scripts/verify-m2-b2-i2-private-recovery-schedulers.mjs",
    "supabase/migrations/0018_m2_b2_webhook_ingress_authority.sql",
    "supabase/tests/m2_b2_i1_remote_event_trigger_acl_compatibility_r1.sql",
    "supabase/tests/m2_b2_i1_remote_event_trigger_fixture_setup_r1.sql",
  ]);
  const committed = git("diff", "--name-only", authority, "HEAD")
    .split(/\r?\n/u)
    .filter(Boolean);
  const working = gitRaw(
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  )
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => line.slice(3).replaceAll("\\", "/"));
  const changed = [...new Set([...committed, ...working])];
  assert.deepEqual(
    changed.filter((entry) => !allowed.has(entry)),
    [],
    "out-of-manifest path changed",
  );
});

await check("accepted migrations 0002 through 0017 remain unchanged", async () => {
  assert.equal(
    git(
      "diff",
      "--name-only",
      authority,
      "--",
      "supabase/migrations/0002_*.sql",
      "supabase/migrations/0003_*.sql",
      "supabase/migrations/0004_*.sql",
      "supabase/migrations/0005_*.sql",
      "supabase/migrations/0006_*.sql",
      "supabase/migrations/0007_*.sql",
      "supabase/migrations/0008_*.sql",
      "supabase/migrations/0009_*.sql",
      "supabase/migrations/0010_*.sql",
      "supabase/migrations/0011_*.sql",
      "supabase/migrations/0012_*.sql",
      "supabase/migrations/0013_*.sql",
      "supabase/migrations/0014_*.sql",
      "supabase/migrations/0015_*.sql",
      "supabase/migrations/0016_*.sql",
      "supabase/migrations/0017_*.sql",
    ),
    "",
  );
});

await check("0019 immutable identity remains accepted", async () => {
  const content = execFileSync(
    "git",
    [
      "cat-file",
      "blob",
      "HEAD:supabase/migrations/0019_m2_b2_private_payment_reconciliation.sql",
    ],
    { cwd: root },
  );
  assert.equal(
    createHash("sha256").update(content).digest("hex"),
    expected0019Sha256,
  );
});

await check("remote routine identity is pinned fail closed", async () => {
  const migration = await readFile(migrationPath, "utf8");
  assert.match(
    migration,
    /to_regprocedure\('public\.rls_auto_enable\(\)'\)/u,
  );
  assert.match(migration, /prorettype = 'pg_catalog\.event_trigger'/u);
  assert.match(migration, /owner_role\.rolname = 'postgres'/u);
  assert.match(migration, /language\.lanname = 'plpgsql'/u);
  assert.match(migration, /routine\.prosecdef/u);
  assert.match(migration, /array\['search_path=pg_catalog'\]/u);
  assert.match(migration, /routine\.provolatile = 'v'/u);
  assert.match(migration, /pg_catalog\.length\(routine\.prosrc\) = 953/u);
  assert.match(migration, new RegExp(expectedRemoteSourceMd5, "u"));
  assert.match(
    migration,
    /M2_B2_REMOTE_RLS_EVENT_TRIGGER_IDENTITY_INVALID/u,
  );
});

await check("remote ACL identity preserves explicit runtime grants", async () => {
  const migration = await readFile(migrationPath, "utf8");
  assert.match(migration, /select pg_catalog\.count\(\*\)[\s\S]+<> 5/u);
  assert.match(
    migration,
    /'postgres'::pg_catalog\.regrole,[\s\S]+'anon'::pg_catalog\.regrole,[\s\S]+'authenticated'::pg_catalog\.regrole,[\s\S]+'service_role'::pg_catalog\.regrole/u,
  );
  assert.match(migration, /M2_B2_REMOTE_RLS_EVENT_TRIGGER_ACL_INVALID/u);
});

await check("event trigger binding is exact", async () => {
  const migration = await readFile(migrationPath, "utf8");
  assert.match(migration, /trigger\.evtname = 'ensure_rls'/u);
  assert.match(migration, /trigger\.evtevent = 'ddl_command_end'/u);
  assert.match(migration, /trigger\.evtenabled = 'O'/u);
  assert.match(
    migration,
    /array\['CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO'\]::text\[\]/u,
  );
  assert.match(
    migration,
    /M2_B2_REMOTE_RLS_EVENT_TRIGGER_BINDING_INVALID/u,
  );
});

await check("only PUBLIC execute is revoked", async () => {
  const migration = await readFile(migrationPath, "utf8");
  const compatibilityBlock = migration.match(
    /do \$remote_rls_event_trigger_compatibility\$([\s\S]+?)\$remote_rls_event_trigger_compatibility\$;/u,
  );
  assert.ok(compatibilityBlock);
  const revokeStatements = compatibilityBlock[1].match(/revoke execute/gu) ?? [];
  assert.equal(revokeStatements.length, 1);
  assert.match(
    compatibilityBlock[1],
    /revoke execute on function public\.rls_auto_enable\(\) from public/u,
  );
  assert.doesNotMatch(
    compatibilityBlock[1],
    /revoke[\s\S]{0,100}from (anon|authenticated|service_role)/u,
  );
  assert.match(
    compatibilityBlock[1],
    /M2_B2_REMOTE_RLS_EVENT_TRIGGER_REVOKE_INVALID/u,
  );
});

await check("least privilege guard remains strict", async () => {
  const migration = await readFile(migrationPath, "utf8");
  const guard = migration.match(
    /do \$least_privilege_guard\$([\s\S]+?)\$least_privilege_guard\$;/u,
  );
  assert.ok(guard);
  assert.match(guard[1], /M2_B2_INGRESS_FUNCTION_PRIVILEGE_DRIFT/u);
  assert.doesNotMatch(guard[1], /event_trigger|rls_auto_enable|ensure_rls/u);
});

await check("fixture reproduces native plain-call disposition", async () => {
  const fixture = await readFile(fixturePath, "utf8");
  assert.match(fixture, /returns event_trigger/u);
  assert.match(fixture, /security definer\s+set search_path = pg_catalog/u);
  assert.match(fixture, /create event trigger ensure_rls/u);
  assert.match(fixture, /when sqlstate '0A000'/u);
  assert.match(fixture, /M2_B2_R3_PLAIN_CALL_UNEXPECTEDLY_SUCCEEDED/u);
  const source = fixture.match(
    /as \$function\$(\r?\n[\s\S]*?\r?\n)\$function\$;/u,
  );
  assert.ok(source);
  const normalizedSource = source[1].replaceAll("\r\n", "\n");
  assert.equal(normalizedSource.length, 953);
  assert.equal(
    createHash("md5").update(normalizedSource).digest("hex"),
    expectedRemoteSourceMd5,
  );
});

await check("post-revoke proof preserves trigger behavior", async () => {
  const proof = await readFile(compatibilityPath, "utf8");
  assert.match(proof, /before\.function_oid = target_oid/u);
  assert.match(proof, /trigger\.evtfoid = target_oid/u);
  assert.match(proof, /PUBLIC_EXECUTE_REVOKE_FAILED/u);
  assert.match(proof, /set local role m2_b2_r3_ddl/u);
  assert.match(proof, /create table public\.m2_b2_r3_rls_probe/u);
  assert.match(proof, /relation\.relrowsecurity/u);
  assert.match(proof, /EVENT_TRIGGER_RLS_BEHAVIOR_FAILED/u);
});

await check("remote normalized definition hash is recorded", async () => {
  const docs = await readFile(
    path.join(
      root,
      "docs/m2/M2_B2_I1_R3_REMOTE_EVENT_TRIGGER_ACL_COMPATIBILITY.md",
    ),
    "utf8",
  );
  assert.match(docs, new RegExp(expectedRemoteDefinitionHash, "u"));
});

await check("superseded failed candidate is recorded", async () => {
  const docs = await readFile(
    path.join(
      root,
      "docs/m2/M2_B2_I1_R3_REMOTE_EVENT_TRIGGER_ACL_COMPATIBILITY.md",
    ),
    "utf8",
  );
  assert.match(
    docs,
    /53cd8f20be9a50569060f6566d04092bbe4613366c543e1d3b0643e3fd2c7805/u,
  );
  assert.match(docs, /rolled back|rollback/u);
  assert.match(docs, /never recorded|not recorded|neither version was recorded/u);
});

await check("no prohibited compatibility escape hatch", async () => {
  const combined = [
    await readFile(migrationPath, "utf8"),
    await readFile(fixturePath, "utf8"),
    await readFile(compatibilityPath, "utf8"),
  ].join("\n");
  assert.doesNotMatch(combined, /migration repair|db push --linked/u);
  assert.doesNotMatch(combined, /except(?:ion)?[\s_-]*event[_ -]?trigger/iu);
});

console.log(
  `M2-B2-I1-R3 EVENT TRIGGER ACL COMPATIBILITY PASS (${passed}/${passed})`,
);
