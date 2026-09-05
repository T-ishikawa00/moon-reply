import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Local verification only. This is not a deployment or activation runner.
export function createOfflineRuntime() {
  const directory = mkdtempSync(path.join(os.tmpdir(), "moon-reply-offline-"));
  const guard = path.join(directory, "guard.mjs");
  const attempts = path.join(directory, "attempts.log");
  writeFileSync(attempts, "");
  writeFileSync(guard, `
import { appendFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import net from "node:net";
import tls from "node:tls";
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
// Do not load local dotenv secrets either. The sample file remains readable.
const dotenv = (file) => typeof file === "string" && /^\\.env(?:$|\\.(?:local|production|development|test)(?:\\.local)?$)/.test(path.basename(file));
const originalRead = fs.readFileSync;
fs.readFileSync = function(file, options) { return dotenv(file) ? (typeof options === "string" || options?.encoding ? "" : Buffer.alloc(0)) : originalRead.call(this, file, options); };
const originalAsyncRead = fs.promises.readFile;
fs.promises.readFile = async function(file, options) { return dotenv(file) ? (typeof options === "string" || options?.encoding ? "" : Buffer.alloc(0)) : originalAsyncRead.call(this, file, options); };
const local = (host) => ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);
function reject() {
  appendFileSync(${JSON.stringify(attempts)}, "EXTERNAL_NETWORK_BLOCKED\\n");
  throw new Error("OFFLINE_VERIFICATION_EXTERNAL_NETWORK_BLOCKED");
}
const originalFetch = globalThis.fetch;
globalThis.fetch = function(input, init) {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  if (!local(url.hostname)) reject();
  return originalFetch(input, init);
};
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function(...args) {
  const values = Array.isArray(args[0]) ? args[0] : args;
  const options = values[0];
  if (options && typeof options === "object") {
    if (!options.path && !local(options.host ?? "localhost")) reject();
  } else if (typeof options === "number") {
    if (typeof values[1] === "string" && !local(values[1])) reject();
  } else if (typeof options !== "string") reject();
  return originalConnect.apply(this, args);
};
for (const module of [http, https]) {
  for (const method of ["request", "get"]) {
    const original = module[method];
    module[method] = function(input, ...args) {
      if (typeof input === "string" || input instanceof URL) {
        if (!local(new URL(input).hostname)) reject();
      } else if (!input?.socketPath && !local(input?.hostname ?? input?.host ?? "localhost")) reject();
      return original.call(this, input, ...args);
    };
  }
}
tls.connect = reject;
syncBuiltinESMExports();
`);
  // Never inherit Production credentials, URLs, Node preloads or activation
  // variables into a test/build child. Keep only OS/runtime plumbing.
  const systemNames = new Set(["path", "pathext", "systemroot", "windir", "comspec", "temp", "tmp", "userprofile", "homedrive", "homepath", "appdata", "localappdata", "programdata", "programfiles", "programfiles(x86)", "commonprogramfiles", "processor_architecture", "number_of_processors", "os"]);
  const system = Object.fromEntries(Object.entries(process.env).filter(([name]) => systemNames.has(name.toLowerCase())));
  const env = { ...system, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1",
    NODE_OPTIONS: `--import=${pathToFileURL(guard).href}`, __NEXT_PROCESSED_ENV: "true",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000" };
  for (const match of readFileSync(".env.example", "utf8").matchAll(/^([A-Z0-9_]+)=/gm)) {
    env[match[1]] = match[1].endsWith("ENABLED") ? "false" : "";
  }
  env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  return { env, assertNoExternalAttempts() {
    assert.equal(readFileSync(attempts, "utf8"), "", "offline external attempts must be zero");
  } };
}

export async function buildOffline() {
  const offline = createOfflineRuntime();
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
    env: offline.env, stdio: "inherit", windowsHide: true,
  });
  const timer = setTimeout(() => child.kill(), 240_000);
  try {
    const status = await new Promise((resolve, reject) => {
      child.once("error", reject); child.once("exit", resolve);
    });
    assert.equal(status, 0, "offline Next build failed");
    offline.assertNoExternalAttempts();
    console.log("Offline Production build PASS; external network attempts=0");
  } finally { clearTimeout(timer); }
}
