import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const authority = "0befd512219eb2897fb1edf969ad37d7e8c56b0d";
const uxCandidate = "1b8b61b32b1f284f843593777d8f0520ce13281b";
const expectedBranch = "codex/m2-0-authority-critical-db-baseline";
let passed = 0;

function git(args, encoding = "utf8") {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding, maxBuffer: 256 * 1024 * 1024 },
  );
}

function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function check(name, fn) {
  fn();
  passed += 1;
  console.log(`[PASS] ${name}`);
}

function assertContains(source, values) {
  for (const value of values) {
    assert.ok(source.includes(value), `missing required text: ${value}`);
  }
}

function changedPathsFromAuthority() {
  const tracked = git(["diff", "--name-only", authority, "--"])
    .trim()
    .split(/\r?\n/u)
    .filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].map((entry) =>
    entry.replaceAll("\\", "/"),
  );
}

check("exact task branch and authority refs", () => {
  assert.equal(git(["branch", "--show-current"]).trim(), expectedBranch);
  assert.equal(git(["rev-parse", "release/private-ready"]).trim(), authority);
  assert.equal(
    git(["rev-parse", "refs/remotes/origin/release/private-ready"]).trim(),
    authority,
  );
  assert.equal(
    git([
      "rev-parse",
      "refs/remotes/origin/task/m2-purchase-trust-ux-r1",
    ]).trim(),
    uxCandidate,
  );
  assert.equal(git(["stash", "list"]).trim(), "");
});

check("bounded M2-0 path manifest", () => {
  const allowed = new Set([
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/CODEX_HANDOFF.md",
    "docs/m2/M2_MASTER_BACKLOG.md",
    "docs/m2/M2_0_AUTHORITY_CRITICAL_DB_BASELINE.md",
    "docs/m2/M2_0_REMOTE_SUPABASE_CATALOG_EVIDENCE.md",
    "docs/m2/M2_0_LOCAL_NULL_FENCING_PROOF.md",
    "docs/m2/M2_0_NEXT_SECURITY_BASELINE.md",
    "docs/m2/M2_0_UX_SELECTIVE_PORT_MAP.md",
    "scripts/verify-m2-0-authority-critical-db-baseline.mjs",
    "package.json",
  ]);
  const changed = changedPathsFromAuthority();
  assert.ok(changed.length >= 10, "M2-0 evidence package is incomplete");
  assert.deepEqual(
    changed.filter((entry) => !allowed.has(entry)),
    [],
    "out-of-manifest path changed",
  );
});

check("protected runtime, dependencies, and migrations unchanged", () => {
  git([
    "diff",
    "--exit-code",
    authority,
    "--",
    "netlify.toml",
    "netlify/functions",
    "scripts/verify-m1-4-background-runtime-assets.mjs",
    "scripts/verify-m1-4-async-router-artifacts.mjs",
    "package-lock.json",
    "supabase/migrations",
  ]);
  const packageJson = JSON.parse(text("package.json"));
  assert.equal(packageJson.dependencies.next, "^16.3.0");
  assert.equal(packageJson.dependencies.react, "^19.2.7");
  assert.equal(packageJson.dependencies["react-dom"], "^19.2.7");
  assert.equal(packageJson.dependencies["@netlify/async-workloads"], "0.0.92");
  assert.equal(packageJson.devDependencies["@netlify/zip-it-and-ship-it"], "15.4.0");
  assert.equal(packageJson.devDependencies.toml, "3.0.0");
});

check("UX candidate was not integrated", () => {
  let candidateIsAncestor = true;
  try {
    git(["merge-base", "--is-ancestor", uxCandidate, "HEAD"]);
  } catch {
    candidateIsAncestor = false;
  }
  assert.equal(candidateIsAncestor, false);
});

check("canonical M1 closure is recorded only in current overlays", () => {
  for (const file of [
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/CODEX_HANDOFF.md",
  ]) {
    const source = text(file);
    assertContains(source, [
      "M2-0-AUTHORITY-CRITICAL-DB-BASELINE:BEGIN",
      authority,
      "Stripe Sandbox",
      "checkout.session.completed",
      "Async Workloads",
      "Background Fulfillment",
      "Human result read",
      "M1 remains closed",
    ]);
    assertContains(source, [
      "MEASUREMENT-FOUNDATION-V1:BEGIN",
      "CUSTOMER-IDENTITY-AUTH-FOUNDATION-R1:BEGIN",
    ]);
  }
});

check("canonical backlog has every audit finding and evidence state", () => {
  const source = text("docs/m2/M2_MASTER_BACKLOG.md");
  for (const id of [
    "REL-01", "REL-02", "REL-03",
    "DB-01", "DB-02", "DB-03",
    "AI-01", "AI-02",
    "SEC-01", "SEC-02",
    "LEG-01", "CON-01", "IA-01", "AUTH-01", "ACC-01", "RES-01",
    "PROD-01", "UX-01", "PERF-01", "PERF-02", "ERR-01", "NAV-01",
    "OPS-01", "WEB-01", "GOV-01",
  ]) {
    assert.ok(source.includes(`| ${id} |`), `missing finding ${id}`);
  }
  assertContains(source, [
    "CONFIRMED_LIVE",
    "CONFIRMED_SOURCE",
    "CONFIRMED_LOCAL_DB",
    "REMOTE_CATALOG_PENDING",
    "HUMAN_VISUAL",
    "EXTERNAL_RELEASE_PENDING",
    "Self Dogfood",
    "External Private Beta",
    "M2-A1 — NULL lease/fence integrity",
    "M2-G2 — Operations and 7-day Dogfood package",
  ]);
});

check("remote catalog exact identities are preserved", () => {
  const source = text("docs/m2/M2_0_REMOTE_SUPABASE_CATALOG_EVIDENCE.md");
  assertContains(source, [
    "0002..0016",
    "production_logical_assessments_lease_owner",
    "production_notification_outbox_lease_owner",
    "05a784665d7ecf5c1c7e66025eda18f7",
    "3347e6c8c2275bc75647a710aa743cb5",
    "08af91aebdba9673652da7d21d67098d",
    "a5d2b7dcec293ecb3a4130e7c5a43031",
    "4975b03007c8a4f2ca071da310f94a77",
    "Mismatch count: `0`",
    "Remote repair/apply count: `0`",
  ]);
});

check("local proof records exploit and rejected hypotheses", () => {
  const source = text("docs/m2/M2_0_LOCAL_NULL_FENCING_PROOF.md");
  assertContains(source, [
    "DB-01",
    "DB-02",
    "DB-03",
    "NULL customer user ID",
    "NULL returned model",
    "mismatched owner",
    "expired lease",
    "Exact valid owner/fence",
    "Concurrency",
    "Remote write count: `0`",
    "Migration created: `0`",
  ]);
});

check("Next and UX plans preserve no-change boundary", () => {
  assertContains(text("docs/m2/M2_0_NEXT_SECURITY_BASELINE.md"), [
    "16.3.0",
    "19.2.7",
    "2026-08-26",
    "exact stable version",
    "No dependency, lockfile, Netlify configuration, deploy, or external state was changed",
  ]);
  assertContains(text("docs/m2/M2_0_UX_SELECTIVE_PORT_MAP.md"), [
    uxCandidate,
    "A — Return contract reliability",
    "E — Authority runtime-assets conflict",
    "F — State contract change",
    "Never port",
    "netlify.toml",
  ]);
});

check("no M2-0 migration was created", () => {
  const migrationDiff = git([
    "diff",
    "--name-only",
    authority,
    "--",
    "supabase/migrations",
  ]).trim();
  assert.equal(migrationDiff, "");
});

console.log(`M2-0 authority / critical DB baseline verifier: ${passed}/${passed} PASS`);
