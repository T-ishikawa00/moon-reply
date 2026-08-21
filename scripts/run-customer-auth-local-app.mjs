import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const proofRoot = path.resolve(process.argv[2] ?? "");
const port = process.argv[3] ?? "3101";
const temporaryRoot = path.resolve(os.tmpdir());

assert.ok(
  proofRoot.startsWith(`${temporaryRoot}${path.sep}`),
  "proof root must be disposable and outside the repository",
);
assert.ok(existsSync(path.join(proofRoot, "supabase", "config.toml")));
assert.match(port, /^\d{4,5}$/u);

const status = spawnSync(
  process.env.ComSpec ?? "cmd.exe",
  [
    "/d",
    "/s",
    "/c",
    `npx.cmd --yes supabase@2.115.0 status --workdir ${proofRoot} --output json`,
  ],
  { encoding: "utf8", windowsHide: true },
);
assert.equal(
  status.status,
  0,
  `local Supabase status failed: ${status.stderr.trim()}`,
);
const local = JSON.parse(status.stdout);
assert.ok(local.API_URL?.startsWith("http://127.0.0.1:"));
assert.ok(local.PUBLISHABLE_KEY?.startsWith("sb_publishable_"));
assert.ok(local.SECRET_KEY?.startsWith("sb_secret_"));

const appOrigin = `http://127.0.0.1:${port}`;
const childEnvironment = {
  ...process.env,
  SUPABASE_URL: local.API_URL,
  SUPABASE_PUBLISHABLE_KEY: local.PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: local.SECRET_KEY,
  NEXT_PUBLIC_APP_URL: appOrigin,
  APP_ENV: "local_customer_auth_proof",
  CUSTOMER_AUTH_ENABLED: "true",
  CUSTOMER_AUTH_GOOGLE_ENABLED: "false",
  CUSTOMER_AUTH_EMAIL_OTP_ENABLED: "true",
  CUSTOMER_AUTH_EMERGENCY_STOP: "false",
  CUSTOMER_AUTH_CONTINUATION_TTL_SECONDS: "600",
  CUSTOMER_AUTH_RATE_LIMIT_MODE: "in_memory_seam",
  CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS: "100",
  CUSTOMER_AUTH_RATE_LIMIT_WINDOW_SECONDS: "60",
  CUSTOMER_AUTH_EMAIL_KEY_VERSION: "v1",
  EMAIL_VERIFICATION_SECRET_PEPPER: randomBytes(32).toString("hex"),
  EMAIL_ADDRESS_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
  M2_INTERNAL_RUNTIME_ENABLED: "false",
  ASSESSMENT_PRODUCTION_PREPARATION_ENABLED: "false",
  ASSESSMENT_PRODUCTION_RUNTIME_ENABLED: "false",
  ASSESSMENT_PRODUCTION_RESULT_ACCESS_ENABLED: "false",
  PAYMENT_PRODUCTION_ENABLED: "false",
  PAYMENT_FULFILLMENT_PROCESSING_ENABLED: "false",
  STRIPE_WEBHOOK_ENABLED: "false",
  STRIPE_RECONCILIATION_ENABLED: "false",
  EMAIL_VERIFICATION_ENABLED: "false",
};

const nextBinary = path.join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
console.log(`LOCAL_CUSTOMER_AUTH_APP_ORIGIN=${appOrigin}`);
const child = spawn(process.execPath, [nextBinary, "start", "-p", port], {
  cwd: process.cwd(),
  env: childEnvironment,
  stdio: "inherit",
  windowsHide: true,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

const exitCode = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
});
process.exitCode = exitCode;
