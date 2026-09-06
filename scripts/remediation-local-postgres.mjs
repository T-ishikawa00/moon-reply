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
  function startSql(statement, selectedConnection = connection) {
    const child = spawn(exe("psql"), selectedConnection, { cwd: temporary, env, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
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
    // Bootstrap-only fixture setup for migration privilege verification. This
    // is an application-object owner, not a platform administrator or runtime
    // service role. Each returned operation starts a real restricted session;
    // SET ROLE inside a superuser session is not used as a substitute.
    // Optional dependency schemas receive USAGE only; their owners and their
    // function ACLs remain unchanged. This models existing extension access.
    createRestrictedMigrationRole({ roleName = "local_migration_owner", schemas = ["public"], usageSchemas = [] } = {}) {
      const identifier = /^[a-z][a-z0-9_]{0,62}$/u;
      assert.match(roleName, identifier);
      assert.ok(!["postgres", "service_role", "anon", "authenticated"].includes(roleName) && !roleName.startsWith("pg_"),
        "Migration executor must be separate from bootstrap and runtime roles");
      assert.ok(Array.isArray(schemas) && schemas.length > 0 && new Set(schemas).size === schemas.length);
      assert.ok(Array.isArray(usageSchemas) && new Set(usageSchemas).size === usageSchemas.length);
      for (const schema of schemas) {
        assert.match(schema, identifier);
        assert.ok(!schema.startsWith("pg_") && schema !== "information_schema",
          "Only explicit application schemas may change owner");
      }
      const schemaList = schemas.map(schema => `'${schema}'`).join(",");
      const present = JSON.parse(sql(`select coalesce(json_agg(nspname order by nspname),'[]')
        from pg_namespace where nspname in (${schemaList});`));
      assert.deepEqual(present, [...schemas].sort(), "Every requested ownership schema must already exist");
      for (const schema of usageSchemas) {
        assert.match(schema, identifier);
        assert.ok(!schema.startsWith("pg_") && schema !== "information_schema",
          "Usage grants must name explicit application dependency schemas");
      }
      const usageSchemaList = usageSchemas.map(schema => `'${schema}'`).join(",");
      if (usageSchemas.length) {
        const usagePresent = JSON.parse(sql(`select coalesce(json_agg(nspname order by nspname),'[]')
          from pg_namespace where nspname in (${usageSchemaList});`));
        assert.deepEqual(usagePresent, [...usageSchemas].sort(), "Every requested usage schema must already exist");
      }
      sql(`begin;
        create role ${roleName} login noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
        ${usageSchemas.map(schema => `grant usage on schema ${schema} to ${roleName};`).join("\n")}
        do $ownership$ declare item record; begin
          for item in select nspname from pg_namespace where nspname in (${schemaList}) loop
            execute format('alter schema %I owner to %I',item.nspname,'${roleName}');
          end loop;
          for item in
            select c.relname,n.nspname,case c.relkind
              when 'v' then 'view' when 'm' then 'materialized view' when 'S' then 'sequence'
              when 'f' then 'foreign table' else 'table' end object_kind
            from pg_class c join pg_namespace n on n.oid=c.relnamespace
            where n.nspname in (${schemaList}) and c.relkind in ('r','p','v','m','S','f')
              and not exists(select 1 from pg_depend d where d.classid='pg_class'::regclass
                and d.objid=c.oid and d.deptype='e')
            order by case when c.relkind='S' then 1 else 0 end,c.oid
          loop
            execute format('alter %s %I.%I owner to %I',item.object_kind,item.nspname,item.relname,'${roleName}');
          end loop;
          for item in
            select p.proname,n.nspname,pg_get_function_identity_arguments(p.oid) arguments,
              case p.prokind when 'p' then 'procedure' when 'a' then 'aggregate' else 'function' end object_kind
            from pg_proc p join pg_namespace n on n.oid=p.pronamespace
            where n.nspname in (${schemaList})
              and not exists(select 1 from pg_depend d where d.classid='pg_proc'::regclass
                and d.objid=p.oid and d.deptype='e')
          loop
            execute format('alter %s %I.%I(%s) owner to %I',item.object_kind,item.nspname,item.proname,item.arguments,'${roleName}');
          end loop;
          for item in
            select t.typname,n.nspname,case when t.typtype='d' then 'domain' else 'type' end object_kind
            from pg_type t join pg_namespace n on n.oid=t.typnamespace
            left join pg_class c on c.oid=t.typrelid
            where n.nspname in (${schemaList}) and t.typelem=0
              and (t.typtype in ('d','e','r') or (t.typtype='c' and c.relkind='c'))
              and not exists(select 1 from pg_depend d where d.classid='pg_type'::regclass
                and d.objid=t.oid and d.deptype='e')
          loop
            execute format('alter %s %I.%I owner to %I',item.object_kind,item.nspname,item.typname,'${roleName}');
          end loop;
        end; $ownership$;
        commit;`);
      const restrictedConnection = [...connection];
      restrictedConnection[restrictedConnection.indexOf("-U") + 1] = roleName;
      const restrictedSql = statement => execute("psql", restrictedConnection, prefix + statement);
      const restrictedStartSql = statement => startSql(statement, restrictedConnection);
      return {
        roleName, schemas: [...schemas], usageSchemas: [...usageSchemas], sql: restrictedSql, startSql: restrictedStartSql,
        async parallelSql(statement) {
          const result = await restrictedStartSql(statement).result;
          assert.equal(result.code, 0, result.error); return result.output;
        },
        inspect() {
          return JSON.parse(restrictedSql(`select json_build_object(
            'currentUser',current_user,'sessionUser',session_user,
            'attributes',(select json_build_object('superuser',rolsuper,'createDb',rolcreatedb,
              'createRole',rolcreaterole,'replication',rolreplication,'bypassRls',rolbypassrls,
              'inherit',rolinherit,'login',rolcanlogin) from pg_roles where rolname=current_user),
            'memberships',(select coalesce(json_agg(r.rolname order by r.rolname),'[]')
              from pg_auth_members m join pg_roles r on r.oid=m.roleid
              where m.member=(select oid from pg_roles where rolname=current_user)),
            'explicitParameterGrants',(select coalesce(json_agg(json_build_object('name',p.parname,
              'privilege',a.privilege_type) order by p.parname,a.privilege_type),'[]')
              from pg_parameter_acl p cross join lateral aclexplode(p.paracl) a
              where a.grantee in (0,(select oid from pg_roles where rolname=current_user))),
            'schemas',(select json_agg(json_build_object('name',nspname,'owner',pg_get_userbyid(nspowner)) order by nspname)
              from pg_namespace where nspname in (${schemaList})),
            'usageSchemas',${usageSchemas.length ? `(select json_agg(json_build_object('name',nspname,
              'owner',pg_get_userbyid(nspowner),'usage',has_schema_privilege(current_user,oid,'USAGE'),
              'create',has_schema_privilege(current_user,oid,'CREATE')) order by nspname)
              from pg_namespace where nspname in (${usageSchemaList}))` : "'[]'::json"},
            'objects',(select json_build_object('owned',count(*) filter(where owner=current_user),
              'otherOwners',coalesce(json_agg(json_build_object('kind',kind,'name',name,'owner',owner))
                filter(where owner<>current_user),'[]')) from (
                select 'relation' kind,c.oid::regclass::text name,pg_get_userbyid(c.relowner) owner
                from pg_class c join pg_namespace n on n.oid=c.relnamespace
                where n.nspname in (${schemaList}) and c.relkind in ('r','p','v','m','S','f')
                  and not exists(select 1 from pg_depend d where d.classid='pg_class'::regclass and d.objid=c.oid and d.deptype='e')
                union all
                select 'routine',p.oid::regprocedure::text,pg_get_userbyid(p.proowner)
                from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                where n.nspname in (${schemaList})
                  and not exists(select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e')
                union all
                select 'type',t.oid::regtype::text,pg_get_userbyid(t.typowner)
                from pg_type t join pg_namespace n on n.oid=t.typnamespace
                left join pg_class c on c.oid=t.typrelid
                where n.nspname in (${schemaList}) and t.typelem=0
                  and (t.typtype in ('d','e','r') or (t.typtype='c' and c.relkind='c'))
                  and not exists(select 1 from pg_depend d where d.classid='pg_type'::regclass and d.objid=t.oid and d.deptype='e')
              ) application_objects));`));
        },
      };
    },
    applyThrough(version, beforeMigration = () => {}) {
      sql("create role anon; create role authenticated; create role service_role bypassrls; create schema extensions; create schema auth; create table auth.users(id uuid primary key, aud text, role text, email text, email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz, updated_at timestamptz, is_sso_user boolean, is_anonymous boolean); grant usage on schema public to anon,authenticated,service_role;");
      const migrations = readdirSync("supabase/migrations").filter((file) => /^\d{4}_.*\.sql$/.test(file) && Number(file.slice(0, 4)) <= version).sort();
      for (const file of migrations) { beforeMigration(file); sql(readFileSync(path.join("supabase/migrations", file), "utf8")); }
      return migrations;
    },
    stop() { execute("pg_ctl", ["-D", data, "-m", "immediate", "-w", "stop"], undefined, true); },
  };
}
