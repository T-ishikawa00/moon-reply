import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseAuthority = "3bd47e0ed8cf1a28da8ba14525718117df7bc99e";
const targetNext = "16.3.3";
const vulnerablePatchVersions = new Set(["16.3.0", "16.3.1", "16.3.2"]);
const canonicalEvidence = "docs/m2/SEC_01_NEXT_16_3_3_SECURITY_PATCH.md";
let passed = 0;

function check(name, proof) {
  proof();
  passed += 1;
  console.log(`PASS ${name}`);
}

function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(text(relativePath));
}

function git(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function gitJson(revision, relativePath) {
  return JSON.parse(git(["show", `${revision}:${relativePath}`]));
}

function normalizedLines(value) {
  return value
    .split(/\r?\n/u)
    .map((line) => line.trim().replaceAll("\\", "/"))
    .filter(Boolean);
}

const manifest = json("package.json");
const lock = json("package-lock.json");
const baseManifest = gitJson(baseAuthority, "package.json");
const baseLock = gitJson(baseAuthority, "package-lock.json");
const installedNext = json("node_modules/next/package.json");
const installedEslintConfigNext = json("node_modules/eslint-config-next/package.json");
const changedFiles = new Set([
  ...normalizedLines(git(["diff", "--name-only", baseAuthority, "--"])),
  ...normalizedLines(git(["ls-files", "--others", "--exclude-standard"])),
]);

function assertNoChangedSurface(name, prefixes) {
  const violations = [...changedFiles].filter((file) =>
    prefixes.some((prefix) => file === prefix || file.startsWith(`${prefix}/`)),
  );
  assert.deepEqual(violations, [], `${name} changed: ${violations.join(", ")}`);
}

check("exact authority base", () => {
  assert.equal(git(["merge-base", baseAuthority, "HEAD"]), baseAuthority);
  const ahead = Number(git(["rev-list", "--count", `${baseAuthority}..HEAD`]));
  assert.equal(Number.isInteger(ahead) && ahead >= 0 && ahead <= 1, true);
});

check("package.json pins Next exactly", () => {
  assert.equal(manifest.dependencies.next, targetNext);
  assert.equal(/[\^~*xX><=|\s-]/u.test(manifest.dependencies.next), false);
});

check("package-lock root pins Next exactly", () => {
  assert.equal(lock.packages[""].dependencies.next, targetNext);
});

check("installed and locked Next resolve exactly", () => {
  assert.equal(lock.packages["node_modules/next"].version, targetNext);
  assert.equal(installedNext.version, targetNext);
  assert.match(lock.packages["node_modules/next"].resolved, /next-16\.3\.3\.tgz$/u);
  assert.match(lock.packages["node_modules/next"].integrity, /^sha512-/u);
});

check("no vulnerable 16.3.0 through 16.3.2 Next runtime resolution", () => {
  const nextResolutions = Object.entries(lock.packages)
    .filter(([packagePath]) => packagePath.endsWith("node_modules/next"))
    .map(([, entry]) => entry.version);
  assert.deepEqual(nextResolutions, [targetNext]);
  assert.equal(nextResolutions.some((version) => vulnerablePatchVersions.has(version)), false);
});

check("eslint-config-next and @next packages align", () => {
  assert.equal(manifest.devDependencies["eslint-config-next"], targetNext);
  assert.equal(lock.packages[""].devDependencies["eslint-config-next"], targetNext);
  assert.equal(lock.packages["node_modules/eslint-config-next"].version, targetNext);
  assert.equal(installedEslintConfigNext.version, targetNext);
  const nextFamily = Object.entries(lock.packages).filter(([packagePath]) =>
    packagePath.startsWith("node_modules/@next/"),
  );
  assert.equal(nextFamily.length > 0, true);
  for (const [packagePath, entry] of nextFamily) {
    assert.equal(entry.version, targetNext, `${packagePath} is ${entry.version}`);
  }
});

check("React and React DOM remain unchanged", () => {
  for (const packageName of ["react", "react-dom"]) {
    assert.equal(manifest.dependencies[packageName], baseManifest.dependencies[packageName]);
    assert.equal(
      lock.packages[`node_modules/${packageName}`].version,
      baseLock.packages[`node_modules/${packageName}`].version,
    );
    assert.equal(lock.packages[`node_modules/${packageName}`].version, "19.2.7");
  }
});

check("lockfile delta is bounded to the Next patch family", () => {
  const oldPackages = baseLock.packages;
  const newPackages = lock.packages;
  const allPackagePaths = new Set([...Object.keys(oldPackages), ...Object.keys(newPackages)]);
  const changedPackagePaths = [...allPackagePaths]
    .filter((packagePath) => JSON.stringify(oldPackages[packagePath]) !== JSON.stringify(newPackages[packagePath]))
    .sort();
  const expected = [
    "",
    "node_modules/@next/env",
    "node_modules/@next/eslint-plugin-next",
    "node_modules/@next/swc-darwin-arm64",
    "node_modules/@next/swc-darwin-x64",
    "node_modules/@next/swc-linux-arm64-gnu",
    "node_modules/@next/swc-linux-arm64-musl",
    "node_modules/@next/swc-linux-x64-gnu",
    "node_modules/@next/swc-linux-x64-musl",
    "node_modules/@next/swc-win32-arm64-msvc",
    "node_modules/@next/swc-win32-x64-msvc",
    "node_modules/@swc/helpers",
    "node_modules/eslint-config-next",
    "node_modules/next",
  ].sort();
  assert.deepEqual(changedPackagePaths, expected);
  assert.deepEqual(lock.packages["node_modules/sharp"], baseLock.packages["node_modules/sharp"]);
  const oldLibheif = Object.keys(oldPackages).filter((packagePath) => /libheif/iu.test(packagePath));
  const newLibheif = Object.keys(newPackages).filter((packagePath) => /libheif/iu.test(packagePath));
  assert.deepEqual(newLibheif, oldLibheif);
});

check("no migration change", () => {
  assertNoChangedSurface("Supabase migrations", ["supabase/migrations"]);
});

check("no Payment server authority change", () => {
  assertNoChangedSurface("Payment server authority", [
    "app/api/payments",
    "app/api/consultations/purchase-eligibility",
    "app/api/internal/purchase-eligibility",
    "lib/payment",
    "lib/purchase",
    "netlify/functions",
  ]);
});

check("no E1 measurement contract change", () => {
  assertNoChangedSurface("E1 measurement", ["lib/measurement", "components/measurement"]);
});

check("no E2 standalone Auth authority change", () => {
  assertNoChangedSurface("E2 Auth", [
    "app/api/auth",
    "app/login",
    "app/purchase/auth",
    "components/auth",
    "lib/customer-auth",
    "lib/supabase",
    "proxy.ts",
  ]);
});

check("no E3 Account and result authority change", () => {
  assertNoChangedSurface("E3 Account/result", ["app/account", "app/api/account", "app/result"]);
});

check("no F1 and F2 Purchase or Return authority change", () => {
  assertNoChangedSurface("F1/F2", [
    "app/purchase/return",
    "components/payment",
    "components/request",
    "lib/payment/purchase-return-presentation.ts",
    "lib/payment/purchase-status-contract.ts",
    "lib/payment/purchase-status-poller.ts",
  ]);
});

check("no D2 or C1 authority change", () => {
  assertNoChangedSurface("D2/C1", [
    "app/api/support",
    "components/support",
    "lib/support",
    "lib/assessment/production/prepayment-compute.ts",
    "lib/assessment/production/prepayment-compute-policy.ts",
    "supabase/tests/m2_c1_prepayment_compute_budget_setup_r1.sql",
    "supabase/tests/m2_c1_prepayment_compute_budget_verify_r1.sql",
    "supabase/tests/m2_c1_prepayment_compute_budget_worker_r1.sql",
    "supabase/tests/m2_d2_customer_support_setup_r1.sql",
    "supabase/tests/m2_d2_customer_support_verify_r1.sql",
    "supabase/tests/m2_d2_customer_support_worker_r1.sql",
  ]);
});

check("no Netlify configuration or runtime authority change", () => {
  assertNoChangedSurface("Netlify configuration", [
    "netlify.toml",
    "netlify",
    "services/stripe-webhook-ingress/.node-version",
    "services/stripe-webhook-ingress/netlify.toml",
    "services/stripe-webhook-ingress/scripts/build.mjs",
    "services/stripe-webhook-ingress/src",
  ]);
});

check("no environment or secret surface change", () => {
  const violations = [...changedFiles].filter(
    (file) =>
      /(^|\/)\.env(?:\.|$)/u.test(file) ||
      /(^|\/)environment(?:-runtime)?\.[cm]?[jt]s$/u.test(file) ||
      /(^|\/)(?:secrets?|credentials?)(?:\/|\.|$)/iu.test(file),
  );
  assert.deepEqual(violations, []);
});

check("changed-file scope is SEC-01 only", () => {
  const allowed = new Set([
    "package.json",
    "package-lock.json",
    "scripts/verify-sec-01.mjs",
    canonicalEvidence,
    "docs/CURRENT_FOCUS.md",
    "docs/CODEX_HANDOFF.md",
    "docs/WBS.md",
    "docs/m2/M2_MASTER_BACKLOG.md",
    "docs/m2/M2_0_NEXT_SECURITY_BASELINE.md",
  ]);
  const violations = [...changedFiles].filter((file) => !allowed.has(file));
  assert.deepEqual(violations, [], `out-of-scope changes: ${violations.join(", ")}`);
});

check("canonical SEC-01 advisory evidence is recorded", () => {
  const evidence = text(canonicalEvidence);
  for (const required of [
    "SOURCE CANDIDATE — PENDING HUMAN/CHATGPT REVIEW",
    baseAuthority,
    "GHSA-p293-qw3h-jr36",
    "CVE-2026-75604",
    ">= 16.0 < 16.3.3",
    "GHSA-2xp9-vwfh-vxw4",
    ">= 10.0.0 < 15.5.24",
    "< 16.3.3",
    "No known CVE",
    "React 19.2.7",
    "React DOM 19.2.7",
    "Production patched: not claimed",
  ]) {
    assert.equal(evidence.includes(required), true, `missing evidence: ${required}`);
  }
});

check("SEC-01 did not change application or framework configuration source", () => {
  const sourceChanges = [...changedFiles].filter(
    (file) =>
      file.startsWith("app/") ||
      file.startsWith("components/") ||
      file.startsWith("lib/") ||
      file === "next.config.ts" ||
      file === "tsconfig.json" ||
      file === "eslint.config.mjs",
  );
  assert.deepEqual(sourceChanges, []);
});

console.log(`SEC-01 verifier: ${passed}/${passed} passed`);
