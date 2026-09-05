import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Disposable synthetic PostgreSQL proof only. No project environment files,
// existing clusters, remote addresses, or real Customer data are read.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const binaryDirectory = process.platform === "win32"
  ? "C:/Program Files/PostgreSQL/17/bin"
  : "/usr/lib/postgresql/17/bin";
const binary = (name) => path.join(
  binaryDirectory,
  `${name}${process.platform === "win32" ? ".exe" : ""}`,
);
for (const name of ["initdb", "pg_ctl", "psql"]) {
  assert.ok(existsSync(binary(name)), `Local PostgreSQL 17 ${name} is required`);
}

const migrationPath = "supabase/migrations/0024_f004_notification_send_identity.sql";
const [core, durability, fencing, migration] = await Promise.all([
  "supabase/migrations/0010_rc1_production_fulfillment_core.sql",
  "supabase/migrations/0016_m1_4_background_fulfillment_durability.sql",
  "supabase/migrations/0017_m2_a1_null_fence_integrity.sql",
  migrationPath,
].map((relative) => readFile(path.join(root, relative), "utf8")));

function tableDefinition(name) {
  const result = core.match(new RegExp(`create table public\\.${name} \\([\\s\\S]*?\\r?\\n\\);`, "u"));
  assert.ok(result, `Missing authoritative table ${name}`);
  return result[0];
}

function functionDefinition(source, name) {
  const result = source.match(new RegExp(`create(?: or replace)? function public\\.${name}\\([\\s\\S]*?\\$function\\$;`, "u"));
  assert.ok(result, `Missing authoritative function ${name}`);
  return result[0];
}

const bootstrap = `
create role anon;
create role authenticated;
create role service_role bypassrls;
create role m2_b2_stripe_ingress noinherit;
grant usage on schema public to anon, authenticated, service_role;
create table public.production_customer_deliveries (id uuid primary key);
${tableDefinition("production_result_credentials")}
${tableDefinition("production_notification_outbox")}
alter table public.production_notification_outbox add column lease_expires_at timestamptz;
alter table public.production_notification_outbox
  add constraint production_notification_outbox_lease_owner check (
    lease_expires_at is null or (status = 'processing' and owner_id is not null
      and processing_started_at is not null)
  ) not valid;
alter table public.production_result_credentials enable row level security;
alter table public.production_notification_outbox enable row level security;
revoke all on public.production_result_credentials,
  public.production_notification_outbox from public, anon, authenticated;
grant select, insert, update on public.production_result_credentials,
  public.production_notification_outbox to service_role;
${functionDefinition(fencing, "claim_production_notification_v2")}
${functionDefinition(durability, "complete_production_notification_v2")}
${functionDefinition(durability, "fail_production_notification_v2")}
revoke all on function public.claim_production_notification_v2(uuid,uuid,timestamptz,timestamptz),
  public.complete_production_notification_v2(uuid,uuid,text,timestamptz),
  public.fail_production_notification_v2(uuid,uuid,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.claim_production_notification_v2(uuid,uuid,timestamptz,timestamptz),
  public.complete_production_notification_v2(uuid,uuid,text,timestamptz),
  public.fail_production_notification_v2(uuid,uuid,text,timestamptz)
  to service_role;
`;

const port = await new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    server.close((error) => error ? reject(error) : resolve(address.port));
  });
});
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "moon-reply-f004-pg-"));
const dataDirectory = path.join(temporaryDirectory, "data");
// Inherit no database/provider variables or user connection defaults.
const childEnvironment = {
  ...(process.platform === "win32" ? {
    SystemRoot: process.env.SystemRoot ?? "C:/Windows",
    WINDIR: process.env.SystemRoot ?? "C:/Windows",
  } : {}),
  PATH: process.platform === "win32"
    ? `${binaryDirectory};${path.join(process.env.SystemRoot ?? "C:/Windows", "System32")}`
    : `${binaryDirectory}:/usr/bin:/bin`,
  TEMP: temporaryDirectory,
  TMP: temporaryDirectory,
  LANG: "C",
  PGPASSFILE: path.join(temporaryDirectory, "unused.pgpass"),
  PGSERVICEFILE: path.join(temporaryDirectory, "unused.pg_service.conf"),
  PGSYSCONFDIR: temporaryDirectory,
};
const connectionArguments = ["-X", "-q", "-w", "-h", "127.0.0.1", "-p", String(port),
  "-U", "f004_verifier_owner", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At"];

function execute(name, args, input, detachedOutput = false) {
  const result = spawnSync(binary(name), args, {
    cwd: temporaryDirectory,
    env: childEnvironment,
    encoding: "utf8",
    input,
    ...(detachedOutput ? { stdio: "ignore" } : {}),
    timeout: 30_000,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Local ${name} failed (status ${result.status}): ${result.error?.message ?? ""}\n${result.stderr ?? ""}\n${result.stdout ?? ""}`);
  }
  return result.stdout?.trim() ?? "";
}

function sql(statement) {
  return execute("psql", connectionArguments, statement);
}

function sqlAsync(statement) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary("psql"), connectionArguments, {
      cwd: temporaryDirectory,
      env: childEnvironment,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    let errors = "";
    const timer = setTimeout(() => child.kill(), 30_000);
    child.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { errors += chunk; });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`Local SQL child failed: ${errors}`));
      else resolve(output.trim());
    });
    child.stdin.end(statement);
  });
}

let passed = 0;
async function check(name, verify) {
  await verify();
  passed += 1;
  console.log(`PASS F004 DB ${name}`);
}

const uuid = (kind, index) => `${kind}0000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const ownerA = uuid(3, 1);
const ownerB = uuid(3, 2);
const instant = (seconds = 0) => new Date(Date.parse("2026-09-06T00:00:00Z") + seconds * 1_000).toISOString();
const literal = (value) => value === null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const serviceSql = (statement) => sql(`set role service_role;\n${statement}`);
const notification = (index) => literal(uuid(1, index));
const claim = (index, owner = ownerA, now = 0, lease = 300, version = 3) =>
  `public.claim_production_notification_v${version}(${notification(index)},${literal(owner)},${literal(lease === null ? null : instant(lease))},${literal(now === null ? null : instant(now))})`;
const prepare = (index, owner = ownerA, candidate = index, now = 0) =>
  `public.prepare_production_notification_email_v1(${notification(index)},${literal(owner)},${literal(uuid(4, candidate))},${literal(candidate.toString(16).padStart(64, "0"))},${literal(`synthetic-ciphertext-${candidate}`)},${literal(now === null ? null : instant(now))})`;
const beginSend = (index, owner = ownerA, now = 0) =>
  `public.begin_production_notification_send_v1(${notification(index)},${literal(owner)},${literal(now === null ? null : instant(now))})`;
const fail = (index, owner = ownerA, code = "PRODUCTION_NOTIFICATION_SEND_OUTCOME_UNKNOWN", now = 1) =>
  `public.fail_production_notification_v2(${notification(index)},${literal(owner)},${literal(code)},${literal(instant(now))})`;
const disposition = (expression) => serviceSql(`select ${expression}->>'disposition';`);
const credentialCount = () => Number(sql("select count(*) from public.production_result_credentials;"));
const expectFailure = (statement, code) => assert.throws(
  () => serviceSql(statement), new RegExp(code, "u"),
);

function seed(index, { status = "pending", attempts = 0, owner = null, lease = null } = {}) {
  sql(`insert into public.production_customer_deliveries values (${literal(uuid(2, index))});
    insert into public.production_notification_outbox
      (id, delivery_id, delivery_authority_reference, status, attempt_count,
       owner_id, requested_at, processing_started_at, lease_expires_at, updated_at)
    values (${notification(index)},${literal(uuid(2, index))},${literal(`synthetic-authority-${index}`)},
      ${literal(status)},${attempts},${literal(owner)},${literal(instant())},
      ${literal(status === "processing" ? instant() : null)},
      ${literal(lease === null ? null : instant(lease))},${literal(instant())});`);
}

function assertCredentialActive(index) {
  assert.equal(sql(`select count(*) from public.production_result_credentials credential
    join public.production_notification_outbox notification
      on notification.email_credential_id = credential.id
    where notification.id = ${notification(index)} and credential.revoked_at is null
      and credential.delivery_id = notification.delivery_id
      and credential.purpose = 'notification';`), "1");
}

let initialized = false;
try {
  execute("initdb", ["-D", dataDirectory, "-U", "f004_verifier_owner", "-A", "trust",
    "--encoding=UTF8", "--locale=C"]);
  initialized = true;
  execute("pg_ctl", ["-D", dataDirectory, "-l", path.join(temporaryDirectory, "postgres.log"),
    "-o", `-h 127.0.0.1 -p ${port} -c max_connections=12 -c fsync=off -c logging_collector=off`,
    "-w", "start"], undefined, true);
  sql(bootstrap);
  sql(migration);
  await check("migration applies to authoritative notification tables", () => {
    assert.equal(sql("select count(*) from public.production_notification_outbox;"), "0");
  });
  await check("new RPC and trigger ACLs exclude public Customer roles", () => {
    for (const signature of [
      "guard_production_notification_email_identity_v1()",
      "claim_production_notification_v3(uuid,uuid,timestamptz,timestamptz)",
      "prepare_production_notification_email_v1(uuid,uuid,uuid,text,text,timestamptz)",
      "begin_production_notification_send_v1(uuid,uuid,timestamptz)",
    ]) {
      assert.equal(sql(`select has_function_privilege('anon','public.${signature}','execute'),
        has_function_privilege('authenticated','public.${signature}','execute'),
        has_function_privilege('service_role','public.${signature}','execute'),
        has_function_privilege('m2_b2_stripe_ingress','public.${signature}','execute');`), "f|f|t|f");
    }
    for (const table of ["production_notification_outbox", "production_result_credentials"]) {
      assert.equal(sql(`select relrowsecurity from pg_class where oid = 'public.${table}'::regclass;`), "t");
      assert.equal(sql(`select has_table_privilege('anon','public.${table}','select'),
        has_table_privilege('authenticated','public.${table}','select');`), "f|f");
    }
  });
  await check("normal claim, atomic identity, replay, send, completion and sent duplicate", () => {
    seed(1);
    assert.equal(disposition(claim(1)), "acquired");
    assert.equal(serviceSql(`select ${prepare(1)};`), "synthetic-ciphertext-1");
    const before = credentialCount();
    assert.equal(serviceSql(`select ${prepare(1, ownerA, 101)};`), "synthetic-ciphertext-1");
    assert.equal(credentialCount(), before);
    assertCredentialActive(1);
    serviceSql(`select ${beginSend(1)};
      select public.complete_production_notification_v2(${notification(1)},${literal(ownerA)},'synthetic-provider-1',${literal(instant(1))});`);
    assert.equal(disposition(claim(1, ownerB, 2, 302)), "sent");
    assert.equal(credentialCount(), before);
  });
  await check("failure before payload preparation retains retryable version identity", () => {
    seed(2);
    assert.equal(disposition(claim(2)), "acquired");
    serviceSql(`select ${fail(2, ownerA, "RESULT_EMAIL_AUTHORITY_NOT_FOUND")};`);
    assert.equal(disposition(claim(2, ownerB, 2, 302)), "acquired");
    assert.equal(serviceSql(`select ${prepare(2, ownerB, 2, 2)};`), "synthetic-ciphertext-2");
    assertCredentialActive(2);
  });
  await check("ambiguous send and acknowledgement failure retain exact identity", () => {
    seed(3);
    assert.equal(disposition(claim(3)), "acquired");
    serviceSql(`select ${prepare(3)}; select ${beginSend(3)}; select ${fail(3)};`);
    const first = sql(`select email_credential_id,email_payload_ciphertext,email_first_send_started_at
      from public.production_notification_outbox where id=${notification(3)};`);
    assert.equal(disposition(claim(3, ownerB, 2, 302)), "acquired");
    serviceSql(`select ${beginSend(3, ownerB, 2)}; select ${fail(3, ownerB, "PRODUCTION_NOTIFICATION_ACK_OUTCOME_UNKNOWN", 3)};`);
    assert.equal(sql(`select email_credential_id,email_payload_ciphertext,email_first_send_started_at
      from public.production_notification_outbox where id=${notification(3)};`), first);
    assertCredentialActive(3);
    assert.equal(sql(`select email_send_attempt_count from public.production_notification_outbox where id=${notification(3)};`), "2");
  });
  await check("concurrent workers observe exactly one live lease", async () => {
    seed(4);
    const results = await Promise.all([
      sqlAsync(`set role service_role; begin; select ${claim(4)}->>'disposition'; select pg_sleep(0.2); commit;`),
      sqlAsync(`set role service_role; begin; select ${claim(4, ownerB)}->>'disposition'; commit;`),
    ]);
    assert.deepEqual(results.sort(), ["acquired", "in_progress"]);
    assert.equal(sql(`select attempt_count from public.production_notification_outbox where id=${notification(4)};`), "1");
  });
  await check("concurrent identity installation commits one credential and one payload", async () => {
    seed(5);
    assert.equal(disposition(claim(5)), "acquired");
    const before = credentialCount();
    const results = await Promise.all([
      sqlAsync(`set role service_role; begin; select ${prepare(5, ownerA, 5)}; select pg_sleep(0.2); commit;`),
      sqlAsync(`set role service_role; begin; select ${prepare(5, ownerA, 105)}; commit;`),
    ]);
    assert.equal(results[0], results[1]);
    assert.ok(["synthetic-ciphertext-5", "synthetic-ciphertext-105"].includes(results[0]));
    assert.equal(credentialCount(), before + 1);
    assertCredentialActive(5);
  });
  await check("expired owner cannot install, send, complete or fail after reclaim", () => {
    seed(6);
    assert.equal(disposition(claim(6, ownerA, 0, 5)), "acquired");
    serviceSql(`select ${prepare(6)};`);
    assert.equal(disposition(claim(6, ownerB, 6, 306)), "acquired");
    const before = credentialCount();
    expectFailure(`select ${prepare(6, ownerA, 106, 6)};`, "PRODUCTION_NOTIFICATION_STATE_CONFLICT");
    expectFailure(`select ${beginSend(6, ownerA, 6)};`, "PRODUCTION_NOTIFICATION_STATE_CONFLICT");
    expectFailure(`select public.complete_production_notification_v2(${notification(6)},${literal(ownerA)},'stale-provider',${literal(instant(6))});`, "PRODUCTION_NOTIFICATION_STATE_CONFLICT");
    expectFailure(`select ${fail(6, ownerA, "STALE", 6)};`, "PRODUCTION_NOTIFICATION_STATE_CONFLICT");
    assert.equal(credentialCount(), before);
    assert.equal(serviceSql(`select ${prepare(6, ownerB, 106, 6)};`), "synthetic-ciphertext-6");
  });
  await check("NULL owner, time and lease fail closed without credential writes", () => {
    seed(7);
    for (const expression of [claim(7, null), claim(7, ownerA, null), claim(7, ownerA, 0, null), claim(7, ownerA, 0, 0)]) {
      expectFailure(`select ${expression};`, "PRODUCTION_NOTIFICATION_LEASE_INVALID");
    }
    assert.equal(disposition(claim(7)), "acquired");
    const before = credentialCount();
    for (const expression of [prepare(7, null), prepare(7, ownerA, 7, null), beginSend(7, null), beginSend(7, ownerA, null)]) {
      expectFailure(`select ${expression};`, "PRODUCTION_NOTIFICATION_STATE_CONFLICT");
    }
    sql(`update public.production_notification_outbox set lease_expires_at=null where id=${notification(7)};`);
    expectFailure(`select ${prepare(7)};`, "PRODUCTION_NOTIFICATION_STATE_CONFLICT");
    expectFailure(`select ${beginSend(7)};`, "PRODUCTION_NOTIFICATION_STATE_CONFLICT");
    assert.equal(disposition(claim(7, ownerB)), "manual_review");
    assert.equal(credentialCount(), before);
  });
  await check("payload update failure rolls back prior credential insert atomically", () => {
    seed(8);
    assert.equal(disposition(claim(8)), "acquired");
    sql(`alter table public.production_notification_outbox add constraint f004_test_install_failure
      check (id <> ${notification(8)} or email_payload_ciphertext is null);`);
    const before = credentialCount();
    expectFailure(`select ${prepare(8)};`, "f004_test_install_failure");
    assert.equal(credentialCount(), before);
    assert.equal(sql(`select email_credential_id is null and email_payload_ciphertext is null
      from public.production_notification_outbox where id=${notification(8)};`), "t");
    sql("alter table public.production_notification_outbox drop constraint f004_test_install_failure;");
    assert.equal(serviceSql(`select ${prepare(8)};`), "synthetic-ciphertext-8");
  });
  await check("persisted envelope, credential, version and send marker cannot rotate", () => {
    serviceSql(`select ${beginSend(8)};`);
    for (const mutation of [
      "email_payload_ciphertext='different-payload'", "email_credential_id=null",
      "email_identity_version=null", `email_first_send_started_at=${literal(instant(1))}`,
      "email_send_attempt_count=0",
    ]) {
      expectFailure(`update public.production_notification_outbox set ${mutation} where id=${notification(8)};`, "PRODUCTION_NOTIFICATION_IDENTITY_IMMUTABLE");
    }
    assertCredentialActive(8);
  });
  await check("attempted legacy rows require review and old workers cannot rotate v3 identity", () => {
    seed(9, { status: "failed", attempts: 1 });
    seed(10, { status: "sent", attempts: 1 });
    assert.equal(disposition(claim(9)), "manual_review");
    assert.equal(disposition(claim(10)), "sent");
    const before = credentialCount();
    assert.equal(disposition(claim(8, ownerB, 2, 302, 2)), "manual_review");
    assert.equal(credentialCount(), before);
  });
  await check("one hour does not remove recovery; explicit payload conflict still stops sends", () => {
    assert.equal(disposition(claim(3, ownerA, 7200, 7500)), "acquired");
    serviceSql(`select ${beginSend(3, ownerA, 7201)};`);
    assertCredentialActive(3);
    seed(11);
    assert.equal(disposition(claim(11)), "acquired");
    serviceSql(`select ${prepare(11)}; select ${fail(11, ownerA, "PRODUCTION_NOTIFICATION_PAYLOAD_CONFLICT")};`);
    assert.equal(disposition(claim(11, ownerB, 2, 302)), "manual_review");
    assertCredentialActive(11);
  });
  await check("F004 does not add an eight-attempt limit and preserves the same Customer URL", () => {
    seed(12);
    assert.equal(disposition(claim(12)), "acquired");
    serviceSql(`select ${prepare(12)};`);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      serviceSql(`select ${beginSend(12, ownerA, attempt)};`);
    }
    serviceSql(`select ${beginSend(12, ownerA, 9)};`);
    assert.equal(sql(`select email_send_attempt_count from public.production_notification_outbox where id=${notification(12)};`), "9");
    serviceSql(`select ${fail(12, ownerA, "PRODUCTION_NOTIFICATION_SEND_OUTCOME_UNKNOWN", 10)};`);
    assert.equal(disposition(claim(12, ownerB, 11, 311)), "acquired");
    assertCredentialActive(12);
  });
  await check("explicit credential revocation prevents retry and cannot reactivate URL", () => {
    seed(13);
    assert.equal(disposition(claim(13)), "acquired");
    serviceSql(`select ${prepare(13)};`);
    sql(`update public.production_result_credentials set revoked_at=${literal(instant(1))} where id=${literal(uuid(4, 13))};`);
    expectFailure(`select ${beginSend(13, ownerA, 2)};`, "PRODUCTION_NOTIFICATION_STATE_CONFLICT");
    serviceSql(`select ${fail(13, ownerA, "EXPLICIT_REVOKED", 3)};`);
    assert.equal(disposition(claim(13, ownerB, 4, 304)), "manual_review");
    assert.equal(sql(`select revoked_at is not null from public.production_result_credentials where id=${literal(uuid(4, 13))};`), "t");
  });
  await check("identity shape constraint rejects NULL version with activated payload", () => {
    seed(14);
    sql(`insert into public.production_result_credentials (id,delivery_id,token_hash,purpose,issued_at)
      values (${literal(uuid(4, 14))},${literal(uuid(2, 14))},${literal("e".padStart(64, "0"))},'notification',${literal(instant())});`);
    expectFailure(`update public.production_notification_outbox
      set email_credential_id=${literal(uuid(4, 14))},email_payload_ciphertext='synthetic-invalid-unversioned-payload'
      where id=${notification(14)};`, "notification_email_identity_shape");
    assert.equal(sql(`select email_identity_version is null and email_payload_ciphertext is null
      from public.production_notification_outbox where id=${notification(14)};`), "t");
  });
  console.log(`PASS F004 notification database ${passed}/${passed}`);
} finally {
  if (initialized) {
    // The path came directly from mkdtemp in this invocation. Never stop an
    // existing service/cluster or delete a directory during verification.
    const status = spawnSync(binary("pg_ctl"), ["-D", dataDirectory, "status"], {
      cwd: temporaryDirectory, env: childEnvironment,
      encoding: "utf8", windowsHide: true, timeout: 10_000,
    });
    assert.ifError(status.error);
    assert.ok(status.status === 0 || status.status === 3,
      "Cannot establish the disposable cluster shutdown state");
    if (status.status === 0) {
      execute("pg_ctl", ["-D", dataDirectory, "-m", "immediate", "-w", "stop"]);
      const stopped = spawnSync(binary("pg_ctl"), ["-D", dataDirectory, "status"], {
        cwd: temporaryDirectory, env: childEnvironment,
        encoding: "utf8", windowsHide: true, timeout: 10_000,
      });
      assert.ifError(stopped.error);
      assert.equal(stopped.status, 3, "Disposable cluster must be stopped after verification");
    }
  }
}
