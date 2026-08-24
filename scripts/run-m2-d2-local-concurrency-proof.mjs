import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const container = process.argv[2];
if (
  !container ||
  !/^supabase_db_moon-reply-m2-d2-[a-z0-9-]+$/u.test(container)
) {
  throw new Error("M2_D2_LOCAL_CONTAINER_INVALID");
}

const worker = readFileSync(
  path.join(
    process.cwd(),
    "supabase/tests/m2_d2_customer_support_worker_r1.sql",
  ),
  "utf8",
);

function submit() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker.exe",
      ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres"],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`M2_D2_WORKER_FAILED exit=${code} ${stderr}`));
    });
    child.stdin.end(worker);
  });
}

function fingerprint() {
  const query = String.raw`
    select pg_catalog.md5(coalesce(pg_catalog.string_agg(
      authority.table_name || ':' || authority.digest,
      '|' order by authority.table_name
    ), ''))
    from (
      select 'production_purchase_intents' as table_name,
        pg_catalog.md5(coalesce(
          pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
            order by pg_catalog.to_jsonb(row_value)::text)::text, '[]')) as digest
      from public.production_purchase_intents as row_value
      union all
      select 'production_payment_attempts', pg_catalog.md5(coalesce(
        pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
          order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
      from public.production_payment_attempts as row_value
      union all
      select 'production_verified_payments', pg_catalog.md5(coalesce(
        pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
          order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
      from public.production_verified_payments as row_value
      union all
      select 'production_stripe_event_ledger', pg_catalog.md5(coalesce(
        pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
          order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
      from public.production_stripe_event_ledger as row_value
      union all
      select 'production_fulfillment_jobs', pg_catalog.md5(coalesce(
        pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
          order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
      from public.production_fulfillment_jobs as row_value
      union all
      select 'production_logical_assessments', pg_catalog.md5(coalesce(
        pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
          order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
      from public.production_logical_assessments as row_value
      union all
      select 'production_customer_deliveries', pg_catalog.md5(coalesce(
        pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
          order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
      from public.production_customer_deliveries as row_value
      union all
      select 'production_notification_outbox', pg_catalog.md5(coalesce(
        pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
          order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
      from public.production_notification_outbox as row_value
      union all
      select 'production_payment_adjustment_ledger', pg_catalog.md5(coalesce(
        pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
          order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
      from public.production_payment_adjustment_ledger as row_value
    ) as authority;
  `;
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker.exe",
      [
        "exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres",
        "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", query,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`M2_D2_FINGERPRINT_FAILED exit=${code} ${stderr}`));
    });
  });
}

const beforeAuthority = await fingerprint();
const outputs = await Promise.all(Array.from({ length: 20 }, () => submit()));
const joined = outputs.join("\n");
const created = joined.match(/"disposition": "created"/gu)?.length ?? 0;
const replay = joined.match(/"disposition": "replay"/gu)?.length ?? 0;
if (created !== 1 || replay !== 19) {
  throw new Error(
    `M2_D2_CONCURRENCY_FAILED created=${created} replay=${replay}`,
  );
}
const afterAuthority = await fingerprint();
if (beforeAuthority.length !== 32 || beforeAuthority !== afterAuthority) {
  throw new Error("M2_D2_EXISTING_AUTHORITY_MUTATED");
}
console.log(`M2_D2_CREATED=${created}`);
console.log(`M2_D2_REPLAY=${replay}`);
console.log("M2_D2_PAYMENT_FULFILLMENT_UNCHANGED=PASS");
console.log("M2_D2_CONCURRENT_SINGLE_CASE=PASS");
