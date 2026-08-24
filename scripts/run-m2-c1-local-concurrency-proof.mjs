import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const container = process.argv[2];
if (!container || !/^supabase_db_moon-reply-m2-c1-[a-z0-9-]+$/u.test(container)) {
  throw new Error("M2_C1_LOCAL_CONTAINER_INVALID");
}

const worker = readFileSync(
  path.join(
    process.cwd(),
    "supabase/tests/m2_c1_prepayment_compute_budget_worker_r1.sql",
  ),
  "utf8",
);

const cases = [
  [
    "CUSTOMER_A",
    "c1000000-0000-4000-8000-000000000001",
    "c2000000-0000-4000-8000-000000000001",
  ],
  [
    "CUSTOMER_B",
    "c1000000-0000-4000-8000-000000000002",
    "c2000000-0000-4000-8000-000000000002",
  ],
  [
    "ROLLOVER",
    "c1000000-0000-4000-8000-000000000003",
    "c2000000-0000-4000-8000-000000000003",
  ],
];

function claim(customerUserId, preparationId) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker.exe",
      [
        "exec",
        "-i",
        container,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        `customer_user_id=${customerUserId}`,
        "-v",
        `preparation_id=${preparationId}`,
      ],
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
      else reject(new Error(`M2_C1_WORKER_FAILED exit=${code} ${stderr}`));
    });
    child.stdin.end(worker);
  });
}

for (const [name, customerUserId, preparationId] of cases) {
  const outputs = await Promise.all(
    Array.from({ length: 20 }, () => claim(customerUserId, preparationId)),
  );
  const joined = outputs.join("\n");
  const acquired = joined.match(/\bacquired\b/gu)?.length ?? 0;
  const exhausted = joined.match(/\bexhausted\b/gu)?.length ?? 0;
  if (acquired !== 3 || exhausted !== 17) {
    throw new Error(
      `M2_C1_CONCURRENCY_FAILED ${name} acquired=${acquired} exhausted=${exhausted}`,
    );
  }
  console.log(`${name}_ACQUIRED=${acquired}`);
  console.log(`${name}_EXHAUSTED=${exhausted}`);
}

console.log("M2_C1_CONCURRENT_EXACT_LIMIT=PASS");
