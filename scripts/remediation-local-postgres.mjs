import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

// Disposable native database only. Never reads project env or any existing
// database/service/password defaults. Owned temporary cluster is stopped.
export async function createLocalPostgres(label) {
  assert.match(label, /^[a-z0-9-]+$/);
  const bin = process.platform === "win32" ? "C:/Program Files/PostgreSQL/17/bin" : "/usr/lib/postgresql/17/bin";
  const exe = (name) => path.join(bin, name + (process.platform === "win32" ? ".exe" : ""));
  for (const name of ["initdb", "pg_ctl", "psql"]) assert.ok(existsSync(exe(name)), `Local PostgreSQL17 ${name} required`);
  const temporary = mkdtempSync(path.join(os.tmpdir(), `moon-reply-${label}-pg-`));
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
  const options = { cwd: temporary, env, encoding: "utf8", windowsHide: true, timeout: 30_000, maxBuffer: 4 * 1024 * 1024 };
  function execute(name, args, input, ignore = false) {
    const result = spawnSync(exe(name), args, { ...options, input, ...(ignore ? { stdio: "ignore" } : {}) });
    if (result.error || result.status !== 0) throw new Error(`LOCAL_${name}_FAILED: ${result.error?.message ?? ""} ${result.stderr ?? ""}`);
    return result.stdout?.trim() ?? "";
  }
  const prefix = "set statement_timeout='10s'; set lock_timeout='5s';\n";
  const sql = (statement) => execute("psql", connection, prefix + statement);
  function startSql(statement) {
    const child = spawn(exe("psql"), connection, { cwd: temporary, env, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let output = "", error = "";
    const timer = setTimeout(() => child.kill(), 20_000);
    child.stdout.setEncoding("utf8").on("data", (s) => output += s);
    child.stderr.setEncoding("utf8").on("data", (s) => error += s);
    const result = new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (code) => { clearTimeout(timer); resolve({ code, output: output.trim(), error }); });
    });
    child.stdin.end(prefix + statement);
    return { child, result };
  }
  async function parallelSql(statement) {
    const result = await startSql(statement).result;
    assert.equal(result.code, 0, result.error); return result.output;
  }
  execute("initdb", ["-D", data, "-U", "postgres", "-A", "trust", "--no-locale", "-E", "UTF8"]);
  execute("pg_ctl", ["-D", data, "-l", path.join(temporary, "postgres.log"), "-o", `-h 127.0.0.1 -p ${port}`, "-w", "start"], undefined, true);
  return { sql, startSql, parallelSql,
    applyThrough(version, beforeMigration = () => {}) {
      sql("create role anon; create role authenticated; create role service_role bypassrls; create schema extensions; create schema auth; create table auth.users(id uuid primary key, aud text, role text, email text, email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz, updated_at timestamptz, is_sso_user boolean, is_anonymous boolean); grant usage on schema public to anon,authenticated,service_role;");
      const migrations = readdirSync("supabase/migrations").filter((file) => /^\d{4}_.*\.sql$/.test(file) && Number(file.slice(0, 4)) <= version).sort();
      for (const file of migrations) { beforeMigration(file); sql(readFileSync(path.join("supabase/migrations", file), "utf8")); }
      return migrations;
    },
    stop() { execute("pg_ctl", ["-D", data, "-m", "immediate", "-w", "stop"], undefined, true); },
  };
}
