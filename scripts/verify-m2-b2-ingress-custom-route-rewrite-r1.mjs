import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import toml from "toml";
import { createStripeWebhookIngressHandler } from "../services/stripe-webhook-ingress/src/stripe-webhook.ts";

const root = process.cwd();
const ingressRoot = path.join(root, "services", "stripe-webhook-ingress");
const authority = "122879e7c371de10a3f627b76692feca1942261d";
const expectedBranch = "task/b2-ingress-custom-route-rewrite-r1";
const canonicalPath = "/api/payments/stripe/webhook";
const functionPath = "/.netlify/functions/stripe-webhook";
const expectedChanges = [
  "scripts/verify-m2-b2-ingress-custom-route-rewrite-r1.mjs",
  "services/stripe-webhook-ingress/netlify.toml",
];
let passed = 0;

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function workingPaths() {
  return execFileSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    { cwd: root, encoding: "utf8" },
  )
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => line.slice(3).replaceAll("\\", "/"));
}

async function check(name, proof) {
  await proof();
  passed += 1;
  console.log(`PASS ${name}`);
}

await check("exact authority branch and bounded change surface", async () => {
  assert.equal(git("branch", "--show-current"), expectedBranch);
  assert.equal(git("rev-parse", "release/private-ready"), authority);
  assert.equal(git("merge-base", "--is-ancestor", authority, "HEAD"), "");

  const committed = git("diff", "--name-only", authority, "HEAD")
    .split(/\r?\n/u)
    .filter(Boolean);
  const changed = [...new Set([...committed, ...workingPaths()])].sort();
  assert.deepEqual(changed, [...expectedChanges].sort());
  assert.equal(
    changed.some((entry) =>
      /^(app|components|lib|public|supabase)\//u.test(entry),
    ),
    false,
  );
  assert.equal(
    changed.some((entry) =>
      /^services\/stripe-webhook-ingress\/(package|scripts|src|tsconfig)/u.test(
        entry,
      ),
    ),
    false,
  );
});

await check("canonical rewrite is exact and narrow", async () => {
  const config = toml.parse(
    readFileSync(path.join(ingressRoot, "netlify.toml"), "utf8"),
  );
  assert.equal(config.redirects.length, 1);
  const [rewrite] = config.redirects;
  assert.deepEqual(Object.keys(rewrite).sort(), [
    "force",
    "from",
    "status",
    "to",
  ]);
  assert.equal(rewrite.from, canonicalPath);
  assert.equal(rewrite.to, functionPath);
  assert.equal(rewrite.status, 200);
  assert.equal(rewrite.force, true);
  assert.equal(rewrite.from.includes("*"), false);
  assert.equal(rewrite.from.includes(":splat"), false);
  assert.equal(rewrite.to.includes("*"), false);
  assert.equal(rewrite.to.includes(":splat"), false);
});

await check("disabled webhook remains fail-closed before durable authority", async () => {
  let durableCalls = 0;
  const handler = createStripeWebhookIngressHandler({
    environment: {
      PAYMENT_ENVIRONMENT: "test",
      STRIPE_WEBHOOK_ENABLED: "false",
      STRIPE_WEBHOOK_SECRET: "synthetic_not_a_real_secret",
    },
    recordEvidence: async () => {
      durableCalls += 1;
      return { disposition: "verified" };
    },
  });
  const response = await handler(
    new Request(`https://ingress.example.test${canonicalPath}`, {
      method: "POST",
      body: "{}",
    }),
  );
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: { code: "PAYMENT_WEBHOOK_UNAVAILABLE" },
  });
  assert.equal(durableCalls, 0);
});

await check("built ingress artifact remains one stripe-webhook function", async () => {
  const functionDir = path.join(ingressRoot, "dist", "functions");
  const functionFiles = readdirSync(functionDir).sort();
  assert.deepEqual(functionFiles, ["stripe-webhook.mjs"]);
  assert.ok(statSync(path.join(functionDir, "stripe-webhook.mjs")).size > 0);
  assert.deepEqual(
    readdirSync(path.join(ingressRoot, "dist", "public")).sort(),
    [],
  );
});

console.log(
  `M2-B2 INGRESS CUSTOM ROUTE REWRITE R1 PASS ${passed}/${passed}`,
);
