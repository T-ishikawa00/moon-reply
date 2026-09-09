import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { remediationMigrationRegistry, migrationSha256, migrationInventoryEntry, assertMigrationInventory, assertMigrationReceipt } from "./lib/remediation-migration-release-contracts.mjs";

// First privilege-parity gate after the already-applied 0002-0031 baseline.
// A new migration must register its three-layer verifier here; adding a file
// without installation AND runtime permission evidence fails the cumulative gate.
const baselineVersion = 31;
const readInventory = () => readdirSync("supabase/migrations").filter(file => /^\d{4}_.*\.sql$/u.test(file)
  && Number(file.slice(0, 4)) > baselineVersion).sort().map(file => migrationInventoryEntry(file, readFileSync(`supabase/migrations/${file}`)));
const inventory = readInventory();
assertMigrationInventory(remediationMigrationRegistry, inventory);
const files = ["scripts/verify-remediation-migration-privileges.mjs", "scripts/lib/remediation-migration-release-contracts.mjs",
  "scripts/verify-paid-recovery-release-gate.mjs", "scripts/verify-v19-preparation-migration.mjs", "scripts/verify-paid-recovery-migration.mjs", "scripts/verify-f004-cutover-db.mjs",
  "scripts/remediation-migration-authority.mjs", "scripts/remediation-local-postgres.mjs", "scripts/run-remediation-offline.mjs",
  ...inventory.map(entry => `supabase/migrations/${entry.file}`)];
const sourceHashes = () => Object.fromEntries(files.map(file => [file, migrationSha256(readFileSync(file))]));
const beforeSourceHashes = sourceHashes();
const modules = new Map();
for (const verifier of new Set(remediationMigrationRegistry.map(entry => entry.verifier))) modules.set(verifier, await import(verifier));
for (const entry of remediationMigrationRegistry) {
  const verifierModule = modules.get(entry.verifier);
  const actualArtifact = inventory.find(candidate => candidate.file === entry.file);
  assertMigrationReceipt(entry, verifierModule.migrationVerification, actualArtifact);
  if (entry.number >= 33) {
    assert.equal(verifierModule.releaseGateVerification?.status, "PASS", "B2_RELEASE_CATALOG_EVIDENCE_REQUIRED");
    assert.ok(verifierModule.releaseGateVerification.registeredMigrationNumbers.includes(entry.number));
    assert.deepEqual(verifierModule.releaseGateVerification.applied.find(result => result.number === entry.number), {
      number: entry.number, file: entry.file, sha256: actualArtifact.sha256, owner: verifierModule.releaseGateVerification.installer.currentUser,
    });
  }
  console.log(`PASS required migration privilege gate ${entry.file}; installation layers=2; runtime permission layer=verified`);
}
const directory = `evals/paid-delivery-step5a1-0036/migration/runs/${randomUUID()}`;
mkdirSync(directory, { recursive: true });
assert.deepEqual(readInventory(), inventory, "B2_MIGRATION_INVENTORY_CHANGED_DURING_VERIFICATION");
assert.deepEqual(sourceHashes(), beforeSourceHashes, "B2_GATE_SOURCE_CHANGED_DURING_VERIFICATION");
const evidence = { schemaVersion: "remediation-migration-release-gate-v2", status: "PASS",
  head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", windowsHide: true }).trim(),
  entryPoint: "scripts/verify-remediation-migration-privileges.mjs", inventory,
  sourceHashes: beforeSourceHashes,
  migrationAuthority: [...modules.entries()].map(([verifier, verifierModule]) => ({ verifier, results: verifierModule.migrationVerification })),
  releaseGate: modules.get("./verify-paid-recovery-release-gate.mjs").releaseGateVerification };
writeFileSync(`${directory}/migration-release-gate.json`, JSON.stringify(evidence, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ status: "PASS", releaseGate: "B2", migrations: inventory.map(entry => entry.file),
  checks: evidence.releaseGate.checks.length, artifact: `${directory}/migration-release-gate.json` }));
