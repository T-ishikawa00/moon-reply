# B2 — Canonical migration release gate PASS

The existing entry point is unchanged:

```text
node scripts/run-remediation-offline.mjs scripts/verify-remediation-migration-privileges.mjs
```

The canonical gate registers 0032, 0033, 0034 and 0035, imports each registered
verifier once, and requires both superuser-reference and direct restricted-owner
installation receipts plus executable runtime permission evidence. It freezes
the inventory and source hashes across execution. Future unregistered files,
duplicate versions, wrong order, changed SQL and mismatched applied receipts fail
before a release can pass. No temporary verifier replaces the existing gate.

Final evidence:

- 30-check receipt（参照原本はPrivate保全・候補には非同梱）,
  SHA256 `9ddc3902c958c0008ec72dc24c881128c2d93414a65f4de7ff1b1fcf5717484e`.
- Offline execution log（参照原本はPrivate保全・候補には非同梱）,
  SHA256 `44a19f805a123c0fb9f07ca24ab49613e6468f992f24a34e69a6a1ea612e783d`.
  The child exited zero and the existing offline wrapper verified zero external
  attempts before `OFFLINE_WRAPPER_PASS` was appended.
- Gate source and SQL: all 12 recorded file hashes independently rechecked by
  the primary agent after the final run. Earlier logs/receipts are retained
  development evidence, not substitutes for this final receipt.

## Required matrix

| User gate | Result and proof |
| --- | --- |
| A | 0033/0034/0035 installed in registered order; canonical gate PASS. |
| B | Missing 0035 and unregistered future migration fixtures rejected. |
| C | SQL drift and incorrect exact applied receipt rejected. |
| D | Wrong order, wrong number and duplicate migration number rejected. |
| E | Actual required RPC rename is detected as missing signature. |
| F | Actual insufficient-owner installation fails atomically; installed owner drift rejected. |
| G | Missing service EXECUTE, UPDATE, extension USAGE and digest EXECUTE rejected. |
| H | Actual anon/authenticated function, table and column-only grants rejected. |
| I | Separate empty-business database upgraded 0032→0035 with restricted owner; zero business rows throughout. |
| J | Separate valid pre-upgrade verified purchase preserves payment/intent/job authority through 0032→0035. |
| K | Direct restricted login is NOSUPERUSER/NOCREATEDB/NOCREATEROLE/NOREPLICATION/NOBYPASSRLS/NOINHERIT; no memberships or parameter grants added. Superuser-only receipt rejected. |
| L | 23 required functions, eight tables, effective table/column ACLs, RLS, owner, search_path, objects, triggers and constraints checked; disabled RLS fixture rejected. |

The registered pre-existing functional suites also pass: 0032 has 47 functional
checks and 40 runtime permission probes; 0033–0035 have 32 functional checks and
72 runtime permission probes. Actual service-role SHA256 calls separately reach
`extensions.digest(bytea,text)` in both empty and populated upgrade checks;
null-input business guards are not used as proof of that dependency.

## Exact SQL identity and prerequisites

0033–0035 files are unchanged. 0034 already has mixed line endings in the working
copy although its Git blob is LF. The registry explicitly permits only its two
reviewed exact byte hashes, with the same separately pinned LF-normalized body:

- Existing working bytes: `8427d527e701ff7f684736f2d243752ab84e31b053a81ef9a8903b8436c3d5ca`.
- Git/LF bytes: `6530c6fd4667e169636d8af454304c1726ecfb1488d2c63079ee6715753aa8ab`.

Every receipt must still match the exact bytes actually installed. Arbitrary
newline variants or changed SQL bodies do not pass. Other migration files have
one pinned byte hash. Original SQL and STEP4 artifacts were not normalized or
rewritten.

The platform prerequisite is explicit: service_role already has USAGE on
`extensions` and EXECUTE on `extensions.digest(bytea,text)`. The disposable
bootstrap models this before application migration and records extension object
owners. The gate rejects loss of these privileges and asserts the migration
does not change extension ownership. This is **not a Production GRANT proposal**
and does not establish actual Production owner/ACL state. That state remains a
release preflight requirement. Financial service-role authority remains SELECT
only; no financial mutation privilege is introduced.

## Changed source

- `scripts/verify-remediation-migration-privileges.mjs`: canonical registration,
  receipt validation, source freeze and unique per-run evidence.
- `scripts/lib/remediation-migration-release-contracts.mjs`: pinned inventory,
  object/privilege contracts and reusable gate assertions.
- `scripts/verify-paid-recovery-release-gate.mjs`: registered real PostgreSQL
  empty/upgrade and negative-fixture verification.
- `scripts/verify-paid-recovery-migration.mjs`: export the existing results only.

No migration SQL, runtime implementation, package, environment file or external
system was modified. B2 PASS does not resolve B1 or authorize Production release.
