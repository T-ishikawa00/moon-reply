import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

// First privilege-parity gate after the already-applied 0002-0031 baseline.
// A new migration must register its three-layer verifier here; adding a file
// without installation AND runtime permission evidence fails the cumulative gate.
const baselineVersion = 31;
const verifiedMigrations = Object.freeze({
  "0032_f004_notification_cutover_fence.sql": "./verify-f004-cutover-db.mjs",
});
const pending = readdirSync("supabase/migrations").filter(file => /^\d{4}_.*\.sql$/u.test(file)
  && Number(file.slice(0, 4)) > baselineVersion).sort();
assert.deepEqual(pending, Object.keys(verifiedMigrations).sort(), "Every post-baseline migration requires a registered three-layer verifier");
for (const [file, verifier] of Object.entries(verifiedMigrations)) {
  const { migrationVerification } = await import(verifier);
  assert.deepEqual(migrationVerification.map(result => result.mode), ["superuser-reference", "restricted-owner"]);
  assert.ok(migrationVerification.every(result => result.functional > 0 && result.permissionChecks > 0));
  const expected = { file, sha256: createHash("sha256").update(readFileSync(`supabase/migrations/${file}`)).digest("hex") };
  for (const result of migrationVerification) {
    const matching = result.artifacts.filter(artifact => artifact.file === file);
    assert.deepEqual(matching, [expected], `Each installation layer must prove the actual registered artifact: ${file}`);
  }
  console.log(`PASS required migration privilege gate ${file}; installation layers=2; runtime permission layer=verified`);
}
