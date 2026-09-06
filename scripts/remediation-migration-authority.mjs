import assert from "node:assert/strict";
import { createLocalPostgres } from "./remediation-local-postgres.mjs";

// Reusable three-layer gate for new application migrations. Historical schema
// bootstrap is separate from the actual installer and runtime authorities.
// Every caller supplies functional invariants AND executable runtime contracts.
export async function verifyMigrationAuthorityLayers({ label, baselineVersion, runtimeContracts, verify }) {
  assert.ok(runtimeContracts.length > 0, "Migration verification needs runtime permission contracts");
  const results = [];
  for (const mode of ["superuser-reference", "restricted-owner"]) {
    const db = await createLocalPostgres(`${label}-${mode}`);
    try {
      const baseline = db.applyThrough(baselineVersion);
      // Existing application functions use pgcrypto in the extension schema.
      // Fixture-only USAGE models that dependency without owning the extension
      // or granting platform/parameter privileges to the installer.
      const installer = mode === "restricted-owner" ? db.createRestrictedMigrationRole({ usageSchemas: ["extensions"] }) : db;
      const before = mode === "restricted-owner" ? installer.inspect() : null;
      if (before) {
        assert.equal(before.currentUser, installer.roleName);
        assert.equal(before.sessionUser, installer.roleName, "Must connect directly as the restricted installer");
        assert.deepEqual(before.attributes, { superuser: false, createDb: false, createRole: false,
          replication: false, bypassRls: false, inherit: false, login: true });
        assert.deepEqual(before.memberships, []);
        assert.deepEqual(before.explicitParameterGrants, []);
        assert.deepEqual(before.objects.otherOwners, []);
        for (const statement of [
          "create role forbidden_migration_role;",
          `alter role ${installer.roleName} superuser;`,
          "set role postgres;",
          "set log_statement = 'all';",
        ]) {
          const attempt = await installer.startSql(`begin; ${statement} rollback;`).result;
          assert.notEqual(attempt.code, 0, "Restricted installer must not acquire platform privileges");
          assert.match(attempt.error, /permission denied|must be superuser|Only roles with/u);
        }
      } else {
        assert.equal(db.sql("select rolsuper from pg_roles where rolname=current_user;"), "t");
      }

      const { functional, artifacts } = await verify({ db, installer, mode, baseline });
      assert.ok(Number.isInteger(functional) && functional > 0, "Migration needs functional evidence");
      assert.ok(Array.isArray(artifacts) && artifacts.length > 0, "Migration needs applied artifact receipts");
      // Runtime SQL never inherits installer ownership. Check both the catalog
      // ACL and a real invocation, rolled back to isolate permission probes.
      let permissionChecks = 0;
      for (const contract of runtimeContracts) {
        for (const role of ["anon", "authenticated", "service_role", "m2_b2_stripe_ingress"]) {
          const allowed = contract.allowed.includes(role);
          assert.equal(db.sql(`select has_function_privilege('${role}','${contract.signature}','EXECUTE');`), allowed ? "t" : "f");
          const response = await db.startSql(`begin; set local role ${role};
            select current_user; select ${contract.call}; rollback;`).result;
          if (allowed) {
            assert.equal(response.code, 0, response.error);
            assert.equal(response.output.split(/\r?\n/u)[0], role);
          } else {
            assert.notEqual(response.code, 0);
            assert.match(response.error, /permission denied/u);
          }
          permissionChecks++;
        }
      }
      if (before) {
        const after = installer.inspect();
        for (const key of ["currentUser", "sessionUser", "attributes", "memberships", "explicitParameterGrants"])
          assert.deepEqual(after[key], before[key], `Migration must not expand installer ${key}`);
      }
      results.push({ mode, functional, artifacts, permissionChecks });
      console.log(`PASS migration authority ${mode}; runtime permission probes=${permissionChecks}`);
    } finally {
      db.stop();
    }
  }
  return results;
}
