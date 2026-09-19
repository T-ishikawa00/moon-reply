import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";
import { createOfflineRuntime } from "./remediation-offline-runtime.mjs";

// Local Human review only: no dotenv, credentials, analytics, AI or payment.
const runtime = createOfflineRuntime();
const lan = process.argv.includes("--lan");
const port = lan ? 3102 : 3100;
runtime.env.NEXT_PUBLIC_APP_URL = `http://localhost:${port}`;
if (lan) {
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) console.log(`LAN review: http://${entry.address}:${port}/sample-report`);
    }
  }
}
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", lan ? "0.0.0.0" : "127.0.0.1", "--port", String(port)], {
  env: runtime.env, stdio: "inherit", windowsHide: true,
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill());
child.on("exit", (code) => {
  runtime.assertNoExternalAttempts();
  process.exitCode = code ?? 0;
});
