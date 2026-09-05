import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

// Synthetic, isolated native PostgreSQL only; never reads project env files or
// inherited DB configuration and never touches an existing cluster.
const bin = process.platform === "win32" ? "C:/Program Files/PostgreSQL/17/bin" : "/usr/lib/postgresql/17/bin";
const exe = (name) => path.join(bin, `${name}${process.platform === "win32" ? ".exe" : ""}`);
for (const name of ["initdb", "pg_ctl", "psql"]) assert.ok(existsSync(exe(name)), `PostgreSQL17 ${name} required`);
const migration = readFileSync("supabase/migrations/0025_f010_account_otp_throttle.sql", "utf8");
const temporary = mkdtempSync(path.join(os.tmpdir(), "moon-reply-f010-pg-"));
const data = path.join(temporary, "data");
const env = { SystemRoot: process.env.SystemRoot ?? "C:/Windows", WINDIR: process.env.SystemRoot ?? "C:/Windows",
  PATH: process.platform === "win32" ? `${bin};${path.join(process.env.SystemRoot ?? "C:/Windows", "System32")}` : `${bin}:/usr/bin:/bin`,
  TEMP: temporary, TMP: temporary, LANG: "C", PGPASSFILE: path.join(temporary, "none.pgpass"),
  PGSERVICEFILE: path.join(temporary, "none.conf"), PGSYSCONFDIR: temporary };
const port = await new Promise((resolve, reject) => {
  const server = net.createServer(); server.once("error", reject);
  server.listen(0, "127.0.0.1", () => { const p = server.address().port; server.close((e) => e ? reject(e) : resolve(p)); });
});
const connection = ["-X", "-q", "-w", "-h", "127.0.0.1", "-p", String(port), "-U", "f010_owner", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At"];
function execute(name, args, input, ignore = false) {
  const r = spawnSync(exe(name), args, { cwd: temporary, env, input, encoding: "utf8", windowsHide: true,
    timeout: 30_000, ...(ignore ? { stdio: "ignore" } : {}) });
  if (r.error || r.status !== 0) throw new Error(`F010_LOCAL_${name}_FAILED(${r.status}): ${r.error?.message ?? ""} ${r.stderr ?? ""} ${r.stdout ?? ""}`);
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
      else reject(new Error(`F010_LOCAL_CONCURRENT_FAILED ${error}`));
    });
    child.stdin.end(prefix + statement);
  });
}
const hash = (n) => n.toString(16).padStart(64, "0");
const expression = (n, purpose = "verify") => `public.consume_account_otp_attempt_v1('${hash(n)}','${purpose}')`;
const consume = (n, purpose) => JSON.parse(sql(`set role service_role; select ${expression(n, purpose)};`));
const count = () => Number(sql("select count(*) from public.account_otp_throttle_buckets;"));
let initialized = false, passed = 0;
async function check(name, run) { await run(); console.log(`PASS F010 DB ${++passed} ${name}`); }
try {
  execute("initdb", ["-D", data, "-U", "f010_owner", "-A", "trust", "--no-locale", "-E", "UTF8"]); initialized = true;
  execute("pg_ctl", ["-D", data, "-l", path.join(temporary, "postgres.log"), "-o", `-h 127.0.0.1 -p ${port}`, "-w", "start"], undefined, true);
  sql("create role anon; create role authenticated; create role service_role bypassrls; create role m2_b2_stripe_ingress; create table public.existing_auth_sentinel(value text); insert into public.existing_auth_sentinel values('unchanged');");
  await check("expand migration applies without changing pre-existing objects", () => {
    sql(migration);
    assert.equal(sql("select value from public.existing_auth_sentinel;"), "unchanged");
    assert.equal(sql("select string_agg(column_name,',' order by ordinal_position) from information_schema.columns where table_name='account_otp_throttle_buckets';"),
      "identity_hash,purpose,window_started_at,expires_at,attempt_count");
    assert.equal(sql("select relrowsecurity from pg_class where oid='public.account_otp_throttle_buckets'::regclass;"), "t");
  });
  await check("only service role can execute; no application role can read/write raw counters", () => {
    for (const role of ["anon", "authenticated", "m2_b2_stripe_ingress", "service_role"]) {
      assert.equal(sql(`select has_table_privilege('${role}','public.account_otp_throttle_buckets','SELECT,INSERT,UPDATE,DELETE');`), "f");
      assert.equal(sql(`select has_function_privilege('${role}','public.consume_account_otp_attempt_v1(text,text)','EXECUTE');`), role === "service_role" ? "t" : "f");
    }
    assert.equal(sql("select pronargs||':'||prosecdef::text from pg_proc where oid='public.consume_account_otp_attempt_v1(text,text)'::regprocedure;"), "2:true");
  });
  await check("ten verification attempts, then denial without count/window extension", () => {
    for (let i = 0; i < 10; i++) assert.equal(consume(1).allowed, true);
    const before = sql(`select row_to_json(b) from public.account_otp_throttle_buckets b where identity_hash='${hash(1)}';`);
    for (let i = 0; i < 3; i++) { const r = consume(1); assert.equal(r.allowed, false); assert.ok(r.retry_after_seconds > 0 && r.retry_after_seconds <= 600); }
    assert.equal(sql(`select row_to_json(b) from public.account_otp_throttle_buckets b where identity_hash='${hash(1)}';`), before);
  });
  await check("request purpose has five slots without resetting verification or another identity", () => {
    for (let i = 0; i < 5; i++) assert.equal(consume(1, "request").allowed, true);
    assert.equal(consume(1, "request").allowed, false); assert.equal(consume(1).allowed, false);
    assert.equal(consume(2).allowed, true);
  });
  await check("expired window admits a fresh attempt using the database clock", () => {
    sql(`update public.account_otp_throttle_buckets set window_started_at=now()-interval '11 minutes', expires_at=now()-interval '1 minute' where identity_hash='${hash(1)}' and purpose='verify';`);
    assert.equal(consume(1).allowed, true);
    assert.equal(sql(`select attempt_count||':'||(expires_at>clock_timestamp())::text from public.account_otp_throttle_buckets where identity_hash='${hash(1)}' and purpose='verify';`), "1:true");
  });
  await check("thirty independent connections atomically share exactly ten admissions", async () => {
    const results = await Promise.all(Array.from({ length: 30 }, () => parallelSql(`set role service_role; select ${expression(3)};`)));
    assert.equal(results.map(JSON.parse).filter((r) => r.allowed).length, 10);
    assert.equal(sql(`select attempt_count from public.account_otp_throttle_buckets where identity_hash='${hash(3)}';`), "10");
  });
  await check("bounded cleanup removes at most one hundred expired counters", () => {
    sql("insert into public.account_otp_throttle_buckets select lpad(to_hex(n),64,'0'),'verify',now()-interval '11 minutes',now()-interval '1 minute',1 from generate_series(1000,1249) n;");
    const before = count(); consume(4); assert.equal(count(), before + 1 - 100);
  });
  await check("mixed-target concurrent expiry and cleanup avoid lock cycles", async () => {
    sql("insert into public.account_otp_throttle_buckets select lpad(to_hex(n),64,'0'),'verify',now()-interval '11 minutes',now()-interval '1 minute',10 from generate_series(2000,2019) n;");
    const results = await Promise.all(Array.from({ length: 20 }, (_, i) => parallelSql(`set role service_role; select ${expression(2000 + i)};`)));
    assert.equal(results.map(JSON.parse).filter((r) => r.allowed).length, 20);
  });
  await check("invalid or raw-email input cannot allocate a counter", () => {
    const before = count();
    for (const input of ["null,'verify'", "'user@example.test','verify'", `'${hash(9)}',null`, `'${hash(9)}','unknown'`]) {
      const r = spawnSync(exe("psql"), connection, { cwd: temporary, env, windowsHide: true, encoding: "utf8",
        input: `${prefix}set role service_role; select public.consume_account_otp_attempt_v1(${input});`, timeout: 10_000 });
      assert.equal(r.status, 3); assert.match(r.stderr, /ACCOUNT_OTP_THROTTLE_INPUT_INVALID/u);
    }
    assert.equal(count(), before);
  });
  console.log(`F010 OTP database: ${passed}/${passed} PASS; remote operations=0`);
} finally {
  if (initialized) {
    const status = spawnSync(exe("pg_ctl"), ["-D", data, "status"], { cwd: temporary, env, windowsHide: true, encoding: "utf8", timeout: 10_000 });
    assert.ifError(status.error); assert.ok(status.status === 0 || status.status === 3);
    if (status.status === 0) execute("pg_ctl", ["-D", data, "-m", "immediate", "-w", "stop"]);
    const stopped = spawnSync(exe("pg_ctl"), ["-D", data, "status"], { cwd: temporary, env, windowsHide: true, encoding: "utf8", timeout: 10_000 });
    assert.ifError(stopped.error); assert.equal(stopped.status, 3, "exact temporary cluster must be stopped");
  }
}
