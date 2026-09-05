import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { createLocalPostgres } from "./remediation-local-postgres.mjs";

// Fresh synthetic PostgreSQL 17 cluster, loopback only, no project env files,
// inherited connection credentials, existing clusters or external APIs.
const bin = process.platform === "win32" ? "C:/Program Files/PostgreSQL/17/bin" : "/usr/lib/postgresql/17/bin";
const exe = (name) => path.join(bin, `${name}${process.platform === "win32" ? ".exe" : ""}`);
for (const name of ["initdb", "pg_ctl", "psql"]) assert.ok(existsSync(exe(name)), `PostgreSQL17 ${name} required`);
const read = (name) => readFileSync(`supabase/migrations/${name}`, "utf8");
const first = read("0002_m2_p3_runtime_vertical_slice.sql");
const core = read("0010_rc1_production_fulfillment_core.sql");
const compute = read("0020_m2_c1_prepayment_compute_budget.sql");
const otp = read("0025_f010_account_otp_throttle.sql");
const migration = read("0028_f005_anonymous_admission.sql");
function table(source, name) {
  const match = source.match(new RegExp(`create table public\\.${name} \\([\\s\\S]*?\\r?\\n\\);`, "u"));
  assert.ok(match, `authoritative table ${name}`); return match[0];
}
function definition(source, name) {
  const match = source.match(new RegExp(`create(?: or replace)? function public\\.${name}\\([\\s\\S]*?\\$function\\$;`, "u"));
  assert.ok(match, `authoritative function ${name}`); return match[0];
}
const oldSignature = "public.begin_production_prepayment_intake_v1(uuid,uuid,text,text,jsonb,jsonb,text,text,text,jsonb,text,timestamptz)";
const signature = "public.begin_production_prepayment_intake_v2(uuid,uuid,text,text,jsonb,jsonb,text,text,text,jsonb,text,timestamptz,text,integer,integer,integer,integer,integer)";
const bootstrap = `
create role anon; create role authenticated; create role service_role bypassrls;
create role m2_b2_stripe_ingress noinherit;
grant usage on schema public to anon, authenticated, service_role;
${table(first, "assessment_requests")}
${core.match(/alter table public\.assessment_requests[\s\S]*?check \(source in \('internal_review_runtime', 'production_fulfillment_runtime'\)\);/u)[0]}
create table public.assessment_clarifications(id text primary key);
${table(core, "production_preparations")}
${table(compute, "production_prepayment_execution_authorities")}
${definition(core, "begin_production_preparation_v1")}
${definition(compute, "begin_production_prepayment_intake_v1")}
revoke all on function ${oldSignature} from public, anon, authenticated;
grant execute on function ${oldSignature} to service_role;
grant select,insert,update on public.assessment_requests,public.production_preparations,public.production_prepayment_execution_authorities to service_role;
create table public.existing_paid_account_reconciliation_sentinel(value text);
insert into public.existing_paid_account_reconciliation_sentinel values('unchanged');
`;
const temporary = mkdtempSync(path.join(os.tmpdir(), "moon-reply-f005-pg-"));
const data = path.join(temporary, "data");
const env = { SystemRoot: process.env.SystemRoot ?? "C:/Windows", WINDIR: process.env.SystemRoot ?? "C:/Windows",
  PATH: process.platform === "win32" ? `${bin};${path.join(process.env.SystemRoot ?? "C:/Windows", "System32")}` : `${bin}:/usr/bin:/bin`,
  TEMP: temporary, TMP: temporary, LANG: "C", PGPASSFILE: path.join(temporary, "none.pgpass"),
  PGSERVICEFILE: path.join(temporary, "none.conf"), PGSYSCONFDIR: temporary };
const port = await new Promise((resolve, reject) => {
  const server = net.createServer(); server.once("error", reject);
  server.listen(0, "127.0.0.1", () => { const p = server.address().port; server.close((e) => e ? reject(e) : resolve(p)); });
});
const connection = ["-X", "-q", "-w", "-h", "127.0.0.1", "-p", String(port), "-U", "f005_owner", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At"];
function execute(name, args, input, ignore = false) {
  const result = spawnSync(exe(name), args, { cwd: temporary, env, input, encoding: "utf8", windowsHide: true,
    timeout: 30_000, ...(ignore ? { stdio: "ignore" } : {}) });
  if (result.error || result.status !== 0) throw new Error(`F005_LOCAL_${name}_FAILED(${result.status}): ${result.error?.message ?? ""} ${result.stderr ?? ""} ${result.stdout ?? ""}`);
  return result.stdout?.trim() ?? "";
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
    child.once("close", (code) => { clearTimeout(timer);
      if (code === 0) resolve(output.trim()); else reject(new Error(`F005_LOCAL_CONCURRENT_FAILED ${error}`)); });
    child.stdin.end(prefix + statement);
  });
}
const hash = (n) => n.toString(16).padStart(64, "0");
const uuid = (n) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
const defaults = { window: 600, ipRequests: 12, globalRequests: 48, ipIntakes: 3, globalIntakes: 12 };
function args(key, overrides = {}) {
  const p = { ...defaults, ...overrides };
  return [`'${uuid(key)}'`, `'${uuid(key + 100000)}'`, `'${hash(key)}'`, `'${hash(p.snapshot ?? 999)}'`, "'{}'::jsonb",
    "'{\"purchaseGateSatisfied\":true,\"paymentAuthorityIssued\":false}'::jsonb", "'short ordinary consultation'", "null", "'other'", "'[\"feelings\"]'::jsonb",
    `'${hash(p.capability ?? key + 200000)}'`, "'2026-09-06T00:00:00Z'::timestamptz", `'${hash(p.ip ?? 1)}'`, p.window, p.ipRequests, p.globalRequests, p.ipIntakes, p.globalIntakes];
}
const expression = (key, overrides) => `public.begin_production_prepayment_intake_v2(${args(key, overrides).join(",")})`;
const consume = (key, overrides) => JSON.parse(sql(`set role service_role; select ${expression(key, overrides)};`));
const coreCount = () => sql("select (select count(*) from public.assessment_requests)||':'||(select count(*) from public.production_preparations)||':'||(select count(*) from public.production_prepayment_execution_authorities);");
const counts = () => JSON.parse(sql("select coalesce(jsonb_object_agg(scope||':'||identity_hash,jsonb_build_array(request_count,intake_count)),'null'::jsonb) from public.anonymous_intake_admission_buckets;"));
const reset = () => sql("truncate public.anonymous_intake_admission_buckets;");
let initialized = false, passed = 0;
async function check(name, run) { await run(); console.log(`PASS F005 DB ${++passed} ${name}`); }
try {
  execute("initdb", ["-D", data, "-U", "f005_owner", "-A", "trust", "--no-locale", "-E", "UTF8"]); initialized = true;
  execute("pg_ctl", ["-D", data, "-l", path.join(temporary, "postgres.log"), "-o", `-h 127.0.0.1 -p ${port}`, "-w", "start"], undefined, true);
  sql(bootstrap); sql(otp);
  sql(`set role service_role; select public.consume_account_otp_attempt_v1('${hash(1)}','verify');`);
  const otpBefore = sql("select row_to_json(b) from public.account_otp_throttle_buckets b;");
  const oldBefore = sql(`select pg_get_functiondef('${oldSignature}'::regprocedure);`);
  await check("expand-only migration and service-only definer privilege boundary", () => {
    sql(migration);
    assert.equal(sql(`select pg_get_functiondef('${oldSignature}'::regprocedure);`), oldBefore);
    assert.equal(sql("select relrowsecurity from pg_class where oid='public.anonymous_intake_admission_buckets'::regclass;"), "t");
    for (const role of ["anon", "authenticated", "service_role", "m2_b2_stripe_ingress"]) {
      assert.equal(sql(`select has_table_privilege('${role}','public.anonymous_intake_admission_buckets','SELECT,INSERT,UPDATE,DELETE');`), "f");
      assert.equal(sql(`select has_function_privilege('${role}','${signature}','EXECUTE');`), role === "service_role" ? "t" : "f");
    }
    assert.equal(sql(`select prosecdef::text||':'||array_to_string(proconfig,',') from pg_proc where oid='${signature}'::regprocedure;`), 'true:search_path="",lock_timeout=2s');
  });
  await check("normal short intake creates exactly three authoritative records", () => {
    assert.equal(coreCount(), "0:0:0");
    const result = consume(1);
    assert.equal(result.admission_disposition, "admitted");
    assert.equal(result.intake.disposition, "created");
    assert.equal(result.intake.execution_disposition, "awaiting_auth");
    assert.equal(coreCount(), "1:1:1");
    assert.deepEqual(counts()[`ip:${hash(1)}`], [1, 1]);
  });
  await check("shared IP allows several Customers then blocks new keys without new records", () => {
    for (const key of [2, 3]) assert.equal(consume(key).admission_disposition, "admitted");
    const before = coreCount();
    for (const key of [4, 5]) {
      const r = consume(key); assert.equal(r.admission_disposition, "intake_limited"); assert.ok(r.retry_after_seconds > 0 && r.retry_after_seconds <= 600);
    }
    assert.equal(coreCount(), before); assert.deepEqual(counts()[`ip:${hash(1)}`], [5, 3]);
    assert.equal(consume(6, { ip: 2 }).admission_disposition, "admitted");
  });
  await check("lost-response replay preserves preparation and rotates awaiting-auth capability without new intake charge", () => {
    const before = coreCount();
    const response = consume(1, { capability: 876543 });
    assert.equal(response.intake.disposition, "existing");
    assert.equal(response.intake.preparation_id, uuid(1));
    assert.equal(coreCount(), before); assert.deepEqual(counts()[`ip:${hash(1)}`], [6, 3]);
    assert.equal(sql(`select execution_capability_hash from public.production_prepayment_execution_authorities where preparation_id='${uuid(1)}';`), hash(876543));
  });
  await check("changed snapshot retains conflict semantics and still charges request budget", () => {
    const before = coreCount();
    assert.equal(consume(1, { snapshot: 1000 }).admission_disposition, "idempotency_conflict");
    assert.equal(coreCount(), before); assert.deepEqual(counts()[`ip:${hash(1)}`], [7, 3]);
  });
  await check("repeated same-key traffic reaches individual request maximum without window extension", () => {
    for (let i = 0; i < 5; i++) assert.equal(consume(1).admission_disposition, "admitted");
    const expiry = sql(`select expires_at from public.anonymous_intake_admission_buckets where scope='ip' and identity_hash='${hash(1)}';`);
    const before = coreCount();
    for (let i = 0; i < 3; i++) assert.equal(consume(1).admission_disposition, "request_limited");
    assert.deepEqual(counts()[`ip:${hash(1)}`], [12, 3]); assert.equal(coreCount(), before);
    assert.equal(sql(`select expires_at from public.anonymous_intake_admission_buckets where scope='ip' and identity_hash='${hash(1)}';`), expiry);
  });
  await check("global new-intake budget spans different IPs and preserves bounded replay", () => {
    reset(); const options = { ipIntakes: 2, globalIntakes: 4 };
    for (let i = 0; i < 4; i++) assert.equal(consume(100 + i, { ...options, ip: 100 + i }).admission_disposition, "admitted");
    const before = coreCount();
    assert.equal(consume(104, { ...options, ip: 104 }).admission_disposition, "intake_limited");
    assert.equal(consume(100, { ...options, ip: 105 }).intake.disposition, "existing");
    assert.equal(coreCount(), before); assert.deepEqual(counts()["global:global-v1"], [6, 4]);
  });
  await check("global request exhaustion blocks rotating IP replay without allocating further buckets", () => {
    reset(); const options = { ipRequests: 3, globalRequests: 6, ipIntakes: 2, globalIntakes: 4 };
    for (let i = 0; i < 6; i++) assert.equal(consume(100, { ...options, ip: 200 + i }).admission_disposition, "admitted");
    const before = counts();
    assert.equal(consume(100, { ...options, ip: 206 }).admission_disposition, "request_limited");
    assert.deepEqual(counts(), before); assert.equal(Object.keys(before).length, 7);
  });
  await check("database-clock expiry restores slots independent of supplied historical request time", () => {
    sql("update public.anonymous_intake_admission_buckets set window_started_at=now()-interval '11 minutes',expires_at=now()-interval '11 minutes'+window_seconds*interval '1 second';");
    assert.equal(consume(107, { ip: 200, ipRequests: 3, globalRequests: 6, ipIntakes: 2, globalIntakes: 4 }).admission_disposition, "admitted");
    assert.deepEqual(counts()["global:global-v1"], [1, 1]);
    assert.deepEqual(counts()[`ip:${hash(200)}`], [1, 1]);
    assert.equal(sql("select bool_and(expires_at>clock_timestamp()) from public.anonymous_intake_admission_buckets;"), "t");
  });
  await check("parallel serverless-equivalent connections cannot overshoot global intake capacity", async () => {
    reset(); const before = Number(coreCount().split(":")[0]);
    const options = { ipRequests: 6, globalRequests: 40, ipIntakes: 3, globalIntakes: 7 };
    const results = (await Promise.all(Array.from({ length: 20 }, (_, i) =>
      parallelSql(`set role service_role; select ${expression(300 + i, { ...options, ip: 300 + i })};`)))).map(JSON.parse);
    assert.equal(results.filter((r) => r.admission_disposition === "admitted").length, 7);
    assert.equal(results.filter((r) => r.admission_disposition === "intake_limited").length, 13);
    assert.equal(coreCount(), `${before + 7}:${before + 7}:${before + 7}`);
    assert.deepEqual(counts()["global:global-v1"], [20, 7]);
  });
  await check("concurrent same-key requests from independent connections create only one intake", async () => {
    reset(); const before = Number(coreCount().split(":")[0]);
    const options = { ipRequests: 24, globalRequests: 48, ipIntakes: 3, globalIntakes: 12 };
    const results = (await Promise.all(Array.from({ length: 12 }, () =>
      parallelSql(`set role service_role; select ${expression(400, options)};`)))).map(JSON.parse);
    assert.equal(results.filter((r) => r.intake?.disposition === "created").length, 1);
    assert.equal(results.filter((r) => r.intake?.disposition === "existing").length, 11);
    assert.equal(coreCount(), `${before + 1}:${before + 1}:${before + 1}`);
    assert.deepEqual(counts()["global:global-v1"], [12, 1]);
  });
  await check("active-window policy changes fail closed without resetting intake counters", () => {
    const before = coreCount(), previous = counts();
    assert.equal(consume(401, { ipRequests: 24, globalRequests: 49 }).admission_disposition, "configuration_mismatch");
    assert.equal(coreCount(), before); assert.deepEqual(counts(), previous);
  });
  await check("concurrent new keys on one shared IP cannot overshoot individual intake capacity", async () => {
    reset(); const before = Number(coreCount().split(":")[0]);
    const results = (await Promise.all(Array.from({ length: 20 }, (_, i) =>
      parallelSql(`set role service_role; select ${expression(700 + i, { ipRequests: 24 })};`)))).map(JSON.parse);
    assert.equal(results.filter((r) => r.admission_disposition === "admitted").length, 3);
    assert.equal(results.filter((r) => r.admission_disposition === "intake_limited").length, 17);
    assert.equal(coreCount(), `${before + 3}:${before + 3}:${before + 3}`);
    assert.deepEqual(counts()[`ip:${hash(1)}`], [20, 3]);
  });
  await check("concurrent replay traffic cannot overshoot individual request capacity", async () => {
    reset(); const before = coreCount();
    const results = (await Promise.all(Array.from({ length: 24 }, () =>
      parallelSql(`set role service_role; select ${expression(400)};`)))).map(JSON.parse);
    assert.equal(results.filter((r) => r.admission_disposition === "admitted").length, 12);
    assert.equal(results.filter((r) => r.admission_disposition === "request_limited").length, 12);
    assert.equal(coreCount(), before);
    assert.deepEqual(counts()[`ip:${hash(1)}`], [12, 0]);
    assert.deepEqual(counts()["global:global-v1"], [24, 0]);
  });
  await check("invalid direct RPC arguments cannot allocate counters or intake records", () => {
    reset(); const before = coreCount();
    for (const [index, value] of [[12, "'192.0.2.1'"], [12, "null"], [13, "0"], [14, "1"], [15, "2"], [16, "13"], [17, "49"]]) {
      const invalid = args(499); invalid[index] = value;
      const result = spawnSync(exe("psql"), connection, { cwd: temporary, env, windowsHide: true, encoding: "utf8", timeout: 10_000,
        input: `${prefix}set role service_role; select public.begin_production_prepayment_intake_v2(${invalid.join(",")});` });
      assert.equal(result.status, 3); assert.match(result.stderr, /ANONYMOUS_ADMISSION_INPUT_INVALID/u);
    }
    assert.equal(counts(), null); assert.equal(coreCount(), before);
  });
  await check("inner intake failure rolls back all three records and conservatively retains reservation", () => {
    reset(); const before = coreCount();
    // Valid table-level input except duplicate execution capability: the actual
    // old v1 inserts the first two rows, then its third write fails uniqueness.
    const r = consume(500, { capability: 200400 });
    assert.equal(r.admission_disposition, "unavailable");
    assert.equal(coreCount(), before); assert.deepEqual(counts()["global:global-v1"], [1, 1]);
    assert.equal(consume(500).admission_disposition, "admitted");
    assert.deepEqual(counts()["global:global-v1"], [2, 2]);
  });
  await check("expired target resets even when bounded cleanup leaves other expired rows", () => {
    reset();
    sql("insert into public.anonymous_intake_admission_buckets select 'ip',lpad(to_hex(n),64,'0'),now()-interval '11 minutes',now()-interval '1 minute',600,12,3,12,3 from generate_series(1000,1249) n;");
    assert.equal(consume(501, { ip: 1249 }).admission_disposition, "admitted");
    assert.deepEqual(counts()[`ip:${hash(1249)}`], [1, 1]);
    assert.equal(Object.keys(counts()).length, 151);
  });
  await check("outer transaction rollback leaves neither counters nor partial intake records", () => {
    reset(); const before = coreCount();
    const r = JSON.parse(sql(`begin; set local role service_role; select ${expression(550)}; rollback;`));
    assert.equal(r.admission_disposition, "admitted");
    assert.equal(counts(), null); assert.equal(coreCount(), before);
  });
  await check("legacy entry remains callable for expand compatibility; new wrapper leaves OTP and Paid sentinels unchanged", () => {
    const raw = args(600).slice(0, 12).join(",");
    const before = counts();
    assert.equal(JSON.parse(sql(`set role service_role; select public.begin_production_prepayment_intake_v1(${raw});`)).disposition, "created");
    assert.deepEqual(counts(), before);
    assert.equal(sql("select row_to_json(b) from public.account_otp_throttle_buckets b;"), otpBefore);
    assert.equal(sql("select value from public.existing_paid_account_reconciliation_sentinel;"), "unchanged");
  });
} finally {
  if (initialized) {
    const status = spawnSync(exe("pg_ctl"), ["-D", data, "status"], { cwd: temporary, env, windowsHide: true, encoding: "utf8", timeout: 10_000 });
    assert.ifError(status.error); assert.ok(status.status === 0 || status.status === 3);
    if (status.status === 0) execute("pg_ctl", ["-D", data, "-m", "immediate", "-w", "stop"]);
    const stopped = spawnSync(exe("pg_ctl"), ["-D", data, "status"], { cwd: temporary, env, windowsHide: true, encoding: "utf8", timeout: 10_000 });
    assert.ifError(stopped.error); assert.equal(stopped.status, 3, "exact temporary cluster must be stopped");
  }
}

// Complement the narrow authority/fault proof with every current real migration
// up to F005, including existing production ACLs, constraints and triggers.
const full = await createLocalPostgres("f005-full-compatibility");
try {
  let priorIntake;
  const applied = full.applyThrough(28, (file) => {
    if (file.startsWith("0028_")) priorIntake = full.sql(`select pg_get_functiondef('${oldSignature}'::regprocedure);`);
  });
  await check("complete actual migration chain through 0028 preserves legacy intake and admits/replays under production ACLs", () => {
    assert.equal(applied.at(-1), "0028_f005_anonymous_admission.sql");
    assert.ok(applied.includes("0026_f001_completed_fulfillment_recovery.sql"));
    assert.ok(priorIntake);
    assert.equal(full.sql(`select pg_get_functiondef('${oldSignature}'::regprocedure);`), priorIntake);
    const first = JSON.parse(full.sql(`set role service_role; select ${expression(900)};`));
    assert.equal(first.admission_disposition, "admitted");
    assert.equal(first.intake.disposition, "created");
    const replay = JSON.parse(full.sql(`set role service_role; select ${expression(900, { capability: 290001 })};`));
    assert.equal(replay.admission_disposition, "admitted");
    assert.equal(replay.intake.disposition, "existing");
    assert.equal(replay.intake.preparation_id, first.intake.preparation_id);
    assert.equal(full.sql("select (select count(*) from public.assessment_requests)||':'||(select count(*) from public.production_preparations)||':'||(select count(*) from public.production_prepayment_execution_authorities);"), "1:1:1");
    assert.equal(full.sql("select request_count||':'||intake_count from public.anonymous_intake_admission_buckets where scope='global';"), "2:1");
    assert.equal(full.sql(`select has_function_privilege('service_role','${signature}','EXECUTE');`), "t");
    assert.equal(full.sql("select has_table_privilege('service_role','public.anonymous_intake_admission_buckets','SELECT,INSERT,UPDATE,DELETE');"), "f");
    console.log(`F005 full migration evidence: ${applied.join(", ")}`);
  });
} finally { full.stop(); }
console.log(`F005 anonymous admission database: ${passed}/${passed} PASS; remote operations=0; both isolated clusters stopped`);
