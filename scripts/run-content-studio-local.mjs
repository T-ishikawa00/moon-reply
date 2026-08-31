import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const loopbackHost = "127.0.0.1";
const localPort = "3101";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const localProjectDirectory = path.join(
  repositoryRoot,
  "tools",
  "content-studio-local",
);
const nextCli = path.join(
  repositoryRoot,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

const netlifyDeploymentMarkers = [
  "CONTEXT",
  "DEPLOY_ID",
  "DEPLOY_PRIME_URL",
  "DEPLOY_URL",
  "NETLIFY_IMAGES_CDN_DOMAIN",
  "SITE_ID",
];

function fail(message) {
  console.error(`CONTENT_STUDIO_LOCAL_LAUNCH_REJECTED: ${message}`);
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  fail("NODE_ENV=production is not allowed");
}
if (
  process.env.NETLIFY === "true" ||
  process.env.NETLIFY_LOCAL === "true" ||
  netlifyDeploymentMarkers.some((name) => Boolean(process.env[name]))
) {
  fail("Netlify and deployment environments are not allowed");
}
if (!existsSync(localProjectDirectory) || !existsSync(nextCli)) {
  fail("local project or repository-local Next.js CLI is missing");
}

process.chdir(repositoryRoot);
console.log(`Content Studio Local: http://${loopbackHost}:${localPort}`);

const childEnvironment = { ...process.env };
for (const name of Object.keys(childEnvironment)) {
  if (
    name === "OPENAI_API_KEY" ||
    name.startsWith("NEXT_PUBLIC_") ||
    /(?:SUPABASE|STRIPE|PAYMENT|RESEND|EMAIL|DISCORD|MEASUREMENT|GA4|NETLIFY|BLOB|ASYNC_WORKLOAD)/u.test(
      name,
    )
  ) {
    delete childEnvironment[name];
  }
}

const child = spawn(
  process.execPath,
  [
    nextCli,
    "dev",
    localProjectDirectory,
    "--hostname",
    loopbackHost,
    "--port",
    localPort,
  ],
  {
    cwd: repositoryRoot,
    env: {
      ...childEnvironment,
      CONTENT_STUDIO_LOCAL_ENABLED: "true",
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_ENV: "development",
    },
    stdio: "inherit",
    windowsHide: true,
  },
);

child.once("error", (error) => {
  console.error("CONTENT_STUDIO_LOCAL_LAUNCH_FAILED", error.message);
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  if (signal) {
    process.exitCode = signal === "SIGINT" || signal === "SIGTERM" ? 0 : 1;
    return;
  }
  process.exitCode = code ?? 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}
