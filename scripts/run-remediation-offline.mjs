import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createOfflineRuntime } from "./remediation-offline-runtime.mjs";

// Run local Node verification under an OS-only environment and network guard.
const args = process.argv.slice(2);
assert.ok(args.length > 0, "a local Node verification entry point is required");
const runtime = createOfflineRuntime();
runtime.env.NODE_ENV = "test";
const child = spawn(process.execPath, args, { env: runtime.env, stdio: "inherit", windowsHide: true });
const timer = setTimeout(() => child.kill(), 300_000);
try {
  const status = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", resolve); });
  runtime.assertNoExternalAttempts();
  assert.equal(status, 0, "offline verification failed");
} finally { clearTimeout(timer); }
