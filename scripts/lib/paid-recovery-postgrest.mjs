import assert from "node:assert/strict";
import http from "node:http";

// Test transport only: unchanged Supabase repository code reaches real SQL and
// real ACL/RLS as service_role. No lifecycle, recovery, or validation is mocked.
// Deliberately supports only the small PostgREST subset used by these tests.
export const sqlLiteral = value => value === null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const ident = value => { assert.match(value, /^[a-z][a-z0-9_]*$/u); return `"${value}"`; };

export async function readPaidRecoveryJsonBody(chunks) {
  const buffers = [];
  for await (const chunk of chunks) buffers.push(chunk);
  const body = Buffer.concat(buffers).toString("utf8");
  return body ? JSON.parse(body) : null;
}

export async function createPaidRecoveryPostgrest(db) {
  const calls = [];
  const failures = [];
  const fault = { before: null, after: null };
  const rpcTypes = new Map();
  const server = http.createServer(async (request, response) => {
    try {
      assert.equal(request.socket.remoteAddress, "127.0.0.1");
      const url = new URL(request.url, "http://127.0.0.1");
      assert.ok(url.pathname.startsWith("/rest/v1/"));
      const payload = await readPaidRecoveryJsonBody(request);
      const name = url.pathname.split("/").at(-1);
      const call = { name, method: request.method, payload };
      calls.push(call);
      if (fault.before) await fault.before(call);
      let statement;
      let rpc = false;
      if (url.pathname.startsWith("/rest/v1/rpc/")) {
        rpc = true;
        if (!rpcTypes.has(name)) {
          const types = JSON.parse(db.sql(`select coalesce(json_object_agg(a.name,format_type(a.type,null)),'{}')
            from pg_proc p join pg_namespace n on n.oid=p.pronamespace,
            lateral unnest(p.proargnames,p.proargtypes::oid[]) a(name,type)
            where n.nspname='public' and p.proname=${sqlLiteral(name)};`));
          const returnsSet = db.sql(`select proretset from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=${sqlLiteral(name)};`) === "t";
          rpcTypes.set(name, { types, returnsSet });
        }
        const { types, returnsSet } = rpcTypes.get(name);
        const args = Object.entries(payload ?? {}).map(([key, value]) => {
          assert.ok(types[key], `Unknown RPC argument ${name}.${key}`);
          const serial = typeof value === "object" && value !== null ? JSON.stringify(value) : value;
          return `${ident(key)} => ${sqlLiteral(serial)}::${types[key]}`;
        });
        statement = returnsSet
          ? `select coalesce(jsonb_agg(t),'[]'::jsonb) from (select * from public.${ident(name)}(${args.join(",")})) t;`
          : `select coalesce(to_jsonb(public.${ident(name)}(${args.join(",")})),'null'::jsonb);`;
      } else {
        const relation = `public.${ident(name)}`;
        const filters = [];
        for (const [key, value] of url.searchParams) {
          if (["select", "order", "limit", "offset", "on_conflict"].includes(key)) continue;
          const dot = value.indexOf(".");
          const op = value.slice(0, dot), operand = value.slice(dot + 1);
          if (op === "eq") filters.push(`${ident(key)}=${sqlLiteral(operand)}`);
          else if (op === "is") { assert.ok(["null", "true", "false"].includes(operand)); filters.push(`${ident(key)} is ${operand}`); }
          else if (op === "in") filters.push(`${ident(key)} in (${operand.slice(1,-1).split(",").map(sqlLiteral).join(",")})`);
          else if (["lt", "lte", "gt", "gte"].includes(op)) filters.push(`${ident(key)}${{lt:"<",lte:"<=",gt:">",gte:">="}[op]}${sqlLiteral(operand)}`);
          else throw new Error(`Unsupported local filter ${key}:${value}`);
        }
        const where = filters.length ? ` where ${filters.join(" and ")}` : "";
        if (request.method === "GET" || request.method === "HEAD") {
          const selected = url.searchParams.get("select") ?? "*";
          assert.match(selected, /^(\*|[a-z0-9_,]+)$/u);
          let suffix = "";
          if (url.searchParams.has("order")) suffix += " order by " + url.searchParams.get("order").split(",").map(part => {
            const [column, direction] = part.split(".");
            assert.ok(["asc", "desc"].includes(direction)); return `${ident(column)} ${direction}`;
          }).join(",");
          if (url.searchParams.has("limit")) { const limit = Number(url.searchParams.get("limit")); assert.ok(Number.isSafeInteger(limit) && limit >= 0); suffix += ` limit ${limit}`; }
          statement = `select coalesce(jsonb_agg(t),'[]'::jsonb) from (select ${selected} from ${relation}${where}${suffix}) t;`;
        } else {
          assert.ok(["POST", "PATCH"].includes(request.method));
          const rows = Array.isArray(payload) ? payload : [payload];
          assert.ok(rows.length > 0);
          const keys = Object.keys(rows[0]);
          const record = `jsonb_populate_recordset(null::${relation},${sqlLiteral(JSON.stringify(rows))}::jsonb)`;
          const mutation = request.method === "POST"
            ? `insert into ${relation}(${keys.map(ident).join(",")}) select ${keys.map(ident).join(",")} from ${record}`
            : `update ${relation} set (${keys.map(ident).join(",")})=(select ${keys.map(ident).join(",")} from ${record})${where}`;
          statement = `with changed as (${mutation} returning *) select coalesce(jsonb_agg(changed),'[]'::jsonb) from changed;`;
        }
      }
      const output = await db.parallelSql(`set role service_role; ${statement}`);
      let result = JSON.parse(output);
      if (fault.after) await fault.after(call, result);
      if (!rpc && request.headers.accept?.includes("application/vnd.pgrst.object+json")) {
        if (result.length !== 1) {
          response.writeHead(406, { "content-type": "application/json" });
          response.end(JSON.stringify({ code: "PGRST116", details: `The result contains ${result.length} rows`, message: "JSON object requested, multiple (or no) rows returned" })); return;
        }
        [result] = result;
      }
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(result));
    } catch (error) {
      failures.push({ name: request.url, message: error.message });
      response.writeHead(400, { "content-type": "application/json" });
      // PostgREST exposes PostgreSQL's message field without psql's diagnostic
      // prefix/context. Preserve raw stderr above only for harness diagnosis.
      const message = /^ERROR:\s+([^\r\n]+)/mu.exec(error.message)?.[1] ?? error.message;
      response.end(JSON.stringify({ code: "LOCAL_SQL_FAILURE", message }));
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, calls, failures, fault,
    async stop() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
}
