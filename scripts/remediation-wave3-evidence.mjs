import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

// Source evidence only. Importing this module performs no verification or I/O.
// Technical evidence is separate from Human acceptance/Production authorization.
export const REMEDIATION_WAVE3_BASE = "3a13bd1d06a658becd07f05dae8ef6328b285ac8";
// Completed F003 environment correction, after all four Finding commits.
// This fixed source authority deliberately has no current-HEAD fallback.
export const REMEDIATION_WAVE3_REVIEWED = "864aa1467303a9ef927a0847119f8966eeea1e0d";
// F005-only additive successor. Keep every historical Wave 3 blob pinned;
// this literal blob permits no other schema/runtime drift or HEAD fallback.
export const REMEDIATION_F005_CORRECTION = Object.freeze({
  file: "supabase/migrations/0031_f005_anonymous_admission_isolation.sql",
  blob: "b2897db09428d25a7e6e10cf29551d38a8c86d73",
});
// F004 cutover successor: fixed pre-cutover authority and exact reviewed blobs.
// Historical Wave 3 and F005 evidence is still checked independently below.
export const REMEDIATION_F004_CUTOVER = Object.freeze({
  base: "7ccfc2a4b563f9a355815075dff6e38fd1228077",
  file: "supabase/migrations/0032_f004_notification_cutover_fence.sql",
  blob: "863f1a23d6621e0f79cb667ea5cab3cda09e0a06",
  runtime: Object.freeze({
    "lib/payment/production/dispatch-scheduler-runtime-service.ts": "986aa085aae9ff33c24e34fb40edb7fa37549254",
    "lib/payment/production/notification-cutover-recovery.ts": "55ccbdf173461e0f101efb9c1d0b6ac6567cb2bc",
    "lib/payment/production/supabase-repository.ts": "9b026a5259b6520c0b253757c3542b14ac434eb8",
  }),
});
// Replacement of the unapplied/rolled-back 0032 artifact only. Preserve the
// failed artifact's historical pin and require the literal reviewed successor.
export const REMEDIATION_F004_PRIVILEGE_CORRECTION = Object.freeze({
  base: "0014a1f001d5b6f82cfd13532b2f4ccbcd8b5299",
  blob: "6b1ba114f920de0b83656d4574c69153fbd07f47",
});

export const REMEDIATION_WAVE3_MIGRATIONS = Object.freeze([
  "supabase/migrations/0026_f001_completed_fulfillment_recovery.sql",
  "supabase/migrations/0027_f003_payment_reconciliation_followup.sql",
  "supabase/migrations/0028_f005_anonymous_admission.sql",
  "supabase/migrations/0029_f006_global_unpaid_compute.sql",
  "supabase/migrations/0030_f003_reconciliation_environment_fence.sql",
]);

// Exact approved F001/F003/F005/F006 source delta. Existing Product, Safety,
// Quality, Auth, payment semantics and Provider/model sources outside this
// literal list must remain identical to the Wave 3 base.
export const REMEDIATION_WAVE3_RUNTIME_FILES = Object.freeze([
  ".env.example",
  "lib/assessment/production/anonymous-admission-runtime.ts",
  "lib/assessment/production/anonymous-admission.ts",
  "lib/assessment/production/application-runtime.ts",
  "lib/assessment/production/application.ts",
  "lib/assessment/production/fakes.ts",
  "lib/assessment/production/global-unpaid-compute-runtime.ts",
  "lib/assessment/production/global-unpaid-compute.ts",
  "lib/assessment/production/supabase-repository.ts",
  "lib/assessment/runtime/openai-transport.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/provider-deadline.ts",
  "lib/payment/production/operator-notification-supabase-repository.ts",
  "lib/payment/production/operator-notification.ts",
  "lib/payment/production/reconciliation-scheduler-runtime-service.ts",
  "lib/payment/production/recovery-schedulers.ts",
  "lib/payment/production/stripe.ts",
  "lib/payment/production/supabase-repository.ts",
  "lib/payment/production/worker-service.ts",
]);
const runtimeRoots = [
  "app", "components", "lib", "netlify", "services", "ai", "schemas",
  "evals", "public", ".env.example", "netlify.toml", "next.config.ts",
  "proxy.ts", "package.json", "package-lock.json",
];

export function assertRemediationWave3Evidence({ root = process.cwd() } = {}) {
  const f005Correction = REMEDIATION_F005_CORRECTION;
  const cutover = REMEDIATION_F004_CUTOVER;
  const privilegeCorrection = REMEDIATION_F004_PRIVILEGE_CORRECTION;
  const git = (args) => execFileSync("git.exe", [
    "-c", `safe.directory=${root.replaceAll("\\", "/")}`, ...args,
  ], { cwd: root, encoding: "utf8", windowsHide: true, timeout: 10_000 }).trim();
  const lines = (value) => value.split(/\r?\n/u).filter(Boolean);
  const base = REMEDIATION_WAVE3_BASE;
  const reviewed = REMEDIATION_WAVE3_REVIEWED;
  for (const ref of [base, reviewed, cutover.base, privilegeCorrection.base]) {
    assert.match(ref, /^[0-9a-f]{40}$/u, "Wave 3 evidence must use fixed full commit hashes");
    assert.equal(git(["rev-parse", "--verify", `${ref}^{commit}`]), ref);
    assert.equal(git(["merge-base", "HEAD", ref]), ref, "reviewed evidence must be an ancestor of current HEAD");
  }
  assert.equal(git(["merge-base", base, reviewed]), base);
  assert.deepEqual(
    lines(git(["diff", "--no-renames", "--name-only", base, reviewed, "--", ...runtimeRoots])),
    [...REMEDIATION_WAVE3_RUNTIME_FILES],
    "Wave 3 source delta must be exactly the reviewed Finding manifest",
  );
  assert.equal(
    git(["diff", "--no-renames", "--name-only", reviewed, cutover.base, "--", ...runtimeRoots]), "",
    "pre-cutover runtime must remain identical to the fixed Wave 3 reviewed commit",
  );
  const cutoverFiles = Object.keys(cutover.runtime);
  assert.deepEqual(
    [...new Set([
      ...lines(git(["diff", "--no-renames", "--name-only", cutover.base, "--", ...runtimeRoots])),
      ...lines(git(["ls-files", "--others", "--exclude-standard", "--", ...runtimeRoots])),
    ])].sort(),
    cutoverFiles,
    "current runtime delta must be exactly the F004 cutover successor manifest",
  );
  for (const [file, blob] of Object.entries(cutover.runtime)) {
    assert.equal(git(["hash-object", file]), blob, `${file}: literal F004 cutover blob`);
  }
  for (const file of REMEDIATION_WAVE3_RUNTIME_FILES) {
    assert.equal(git(["rev-parse", `${cutover.base}:${file}`]), git(["rev-parse", `${reviewed}:${file}`]),
      `${file}: approved runtime blob must equal the fixed reviewed commit`);
    if (!cutoverFiles.includes(file)) {
      assert.equal(git(["hash-object", file]), git(["rev-parse", `${reviewed}:${file}`]));
    }
  }

  const baseMigrations = lines(git(["ls-tree", "-r", "--name-only", base, "--", "supabase/migrations"]));
  assert.deepEqual(baseMigrations.map((file) => path.posix.basename(file).slice(0, 4)),
    Array.from({ length: 24 }, (_, index) => String(index + 2).padStart(4, "0")),
    "Wave 3 base contains exactly historical migrations 0002 through 0025");
  const expectedMigrations = [...baseMigrations, ...REMEDIATION_WAVE3_MIGRATIONS];
  assert.deepEqual(
    lines(git(["ls-tree", "-r", "--name-only", reviewed, "--", "supabase/migrations"])),
    expectedMigrations, "reviewed migration inventory must include exactly 0026 through 0030",
  );
  assert.deepEqual(
    lines(git(["diff", "--no-renames", "--name-status", base, reviewed, "--", "supabase/migrations"])),
    REMEDIATION_WAVE3_MIGRATIONS.map((file) => `A\t${file}`),
    "Wave 3 migrations are additive; historical migration blobs cannot change",
  );
  assert.deepEqual(
    readdirSync(path.join(root, "supabase/migrations"))
      .filter((file) => file.endsWith(".sql")).sort().map((file) => `supabase/migrations/${file}`),
    [...expectedMigrations, f005Correction.file, cutover.file], "current migrations must be reviewed Wave 3 plus exact F005 and F004 successors",
  );
  assert.equal(git(["rev-parse", `${privilegeCorrection.base}:${cutover.file}`]), cutover.blob,
    "historical failed F004 artifact must retain its literal pin");
  assert.equal(git(["hash-object", cutover.file]), privilegeCorrection.blob,
    "unapplied F004 replacement must match its literal reviewed blob");
  assert.equal(git(["hash-object", f005Correction.file]), f005Correction.blob,
    "F005 corrective migration must match its literal reviewed blob");
  for (const file of expectedMigrations) {
    const authority = baseMigrations.includes(file) ? base : reviewed;
    assert.equal(git(["hash-object", file]), git(["rev-parse", `${authority}:${file}`]),
      `${file}: current migration blob must equal its fixed authority`);
  }
  return { base, reviewed, runtimeFiles: [...REMEDIATION_WAVE3_RUNTIME_FILES],
    cutover, privilegeCorrection, migrations: [...expectedMigrations, f005Correction.file, cutover.file] };
}
