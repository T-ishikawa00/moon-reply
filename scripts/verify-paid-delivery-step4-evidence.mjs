import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const dir = "evals/paid-delivery-step4";
const json = name => JSON.parse(readFileSync(`${dir}/${name}.json`, "utf8"));
const hash = file => createHash("sha256").update(readFileSync(file)).digest("hex");
const git = (...args) => execFileSync("git", args, { encoding: "utf8", windowsHide: true }).trim();
const application = json("application-results"), migration = json("migration-verification"), baseline = json("preflight");
assert.equal(application.passed, 19); assert.equal(application.failed, 0);
assert.equal(application.sourceStableDuringRun, true); assert.equal(migration.status, "PASS");
for (const evidence of [application, migration])
  for (const [file, expected] of Object.entries(evidence.sourceHashes)) assert.equal(hash(file), expected, `tested source: ${file}`);
for (const [file, expected] of Object.entries(baseline.untracked)) assert.equal(hash(file), expected, `preserved pre-existing artifact: ${file}`);
for (const [file, expected] of Object.entries(baseline.migrations)) assert.equal(hash(`supabase/migrations/${file}`), expected);
assert.equal(git("branch", "--show-current"), baseline.branch);
assert.equal(git("diff", baseline.head, "--", "lib", "netlify", "supabase/migrations"), "", "no Production source changes");
const worktrees = git("worktree", "list", "--porcelain");
for (const block of baseline.worktrees.split("\n\n").slice(1)) assert.ok(worktrees.includes(block), "other worktrees preserved");
git("diff", "--check");
const results = [];
for (let n = 1; n <= 19; n++) {
  const id = `S${String(n).padStart(2, "0")}`, result = json(id), last = result.transitions.at(-1);
  assert.equal(result.status, "PASS"); assert.deepEqual(Object.keys(result.invariants), "ABCDEFGHIJKL".split(""));
  assert.equal(result.invariants.A.additionalCharges, 0); assert.ok(last.deliveryCount <= 1);
  assert.equal(result.providerInvocationCount, result.providerInvocationLedger.flatMap(r => r.invocations).filter(r => ["PB-04", "PB-05", "PB-06"].includes(r.stageId)).length);
  assert.ok(result.providerInvocationCount <= last.providerCalls, "actual paid invocations cannot exceed durable pre-call reservations");
  const blocked = ["S09", "S11", "S16"].includes(id);
  assert.equal(last.deliveryCount, blocked ? 0 : 1);
  if (!blocked) assert.equal(last.state, "completed");
  else assert.ok(last.owner && last.reasonCode && last.reviewDueAt);
  results.push({ scenarioId: id, title: result.title, status: result.status, finalState: last.state,
    purchaseId: last.purchaseIntentId, grantId: last.grantId, logicalAssessmentId: last.logicalAssessmentId,
    contractVersion: last.authorityVersion, providerInvocationCount: result.providerInvocationCount, cumulativeProviderReservations: last.providerCalls,
    reservedBudgetUsd: last.reservedCostUsd, repairCount: result.providerInvocationLedger.flatMap(r => r.invocations).filter(r => r.repair).length,
    canonicalCustomerReports: last.deliveryCount, deliveries: last.deliveryCount,
    notificationAcceptedCount: result.invariants.E.notificationInvocations.filter(r => r.status === "accepted").length,
    additionalCharges: 0, evidence: `${id}.json`, evidenceSha256: hash(`${dir}/${id}.json`) });
}
assert.equal(json("S19").providerConcurrency.status, "PASS");
results.push({ scenarioId: "S20", title: "Migration upgrade compatibility", status: migration.status,
  evidence: "migration-verification.json", evidenceSha256: hash(`${dir}/migration-verification.json`), integration: migration.integration });
const log = readFileSync(`${dir}/integration-final.log`, "utf8");
assert.match(log, /STEP4_OFFLINE_WRAPPER_PASS external_network_attempts=0/u);
assert.match(readFileSync(`${dir}/migration-verification.log`, "utf8"), /OFFLINE_WRAPPER_PASS/u);
const output = { schemaVersion: "paid-delivery-step4-final-evidence-v1", status: "PASS", startHead: baseline.head,
  evidenceAuditHead: git("rev-parse", "HEAD"), branch: baseline.branch, passed: 20, failed: 0, results,
  protectedUntrackedFilesVerified: Object.keys(baseline.untracked).length, otherWorktreesPreserved: true,
  productionSourceChanges: 0, productionOperations: 0, externalNetworkAttempts: 0,
  externalRuntimeFacts: "UNKNOWN; no Production or real provider/notification/payment observation",
  readyFor: "STEP 5 production release planning only; no activation authorization" };
writeFileSync(`${dir}/final-verification.json`, JSON.stringify(output, null, 2) + "\n");
console.log(`PASS STEP4 evidence: 20 scenarios, A-L assertions, source binding, ${output.protectedUntrackedFilesVerified} preserved files, external operations 0`);
