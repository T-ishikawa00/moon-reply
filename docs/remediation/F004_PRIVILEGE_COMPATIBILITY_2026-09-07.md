# F004 — 0032 non-superuser installation compatibility

Date: 2026-09-07 JST. Scope: LOCAL ONLY, 0032 compatibility and migration verification. This record supersedes the custom-GUC design and installation-evidence limitation in [the preceding cutover review](F004_CUTOVER_SAFETY_2026-09-07.md). It does not authorize another Production operation.

## Authority and incident

Start: `release/private-ready@0014a1f001d5b6f82cfd13532b2f4ccbcd8b5299`, clean worktree, stash 0. Current Git, source and local PostgreSQL tests are the implementation authority. Human supplies the current Production facts: 0024–0031 applied; 0032 failed and transaction rolled back; R1 runtime unpublished; Sales Stop effective with emergency stop false; incomplete LIVE Paid obligation and pending/processing/failed notification counts 0. These facts were not re-queried in this LOCAL task.

The failed statement was `ALTER FUNCTION ... SET "moon_reply.f004_identity_detach" = 'true'`, returning SQLSTATE 42501 from the non-superuser Dashboard migration runner. The earlier local helper installed migrations as the bootstrap PostgreSQL superuser. Runtime service-role tests did not test the installer's rights. The previous 18/18 proves the functional cases under that installation authority; it did not prove Production-compatible installation. That was a verification gap.

## Replacement design

The custom GUC distinguished a delayed old sender's automatic credential revoke from the accepted identity-detachment RPC, even though both use `service_role`. It did not authenticate arbitrary privileged SQL.

0032 now replaces that GUC with the existing, authoritative ownership transition:

1. Retain the detach RPC's exact signature, SECURITY INVOKER, ACL, empty search path, advisory lock, Customer selection and return contract.
2. Lock the selected active bindings. Perform the existing identity-detached update first, clearing the same identity/email fields. Capture only IDs actually updated with `UPDATE ... RETURNING`.
3. In a separate statement within the same transaction, revoke credentials through the original delivery/logical-assessment/purchase-intent/binding join, restricted to those IDs.
4. For a protected legacy notification credential, the guard allows a service-role transition from unrevoked to revoked only if that exact ownership chain is already identity-detached and its detachment timestamp equals the revocation timestamp.

Any error rolls back both identity and credential changes. There is no session flag to leak after success or exception. The guard reads binding state without taking a second binding lock, avoiding a reverse binding/credential lock order. A different Customer, a harmless/replayed detach call, or a mismatched timestamp cannot authorize the old revoke.

No helper table, custom SET, parameter grant, new database role, SECURITY DEFINER detachment wrapper, or platform privilege is introduced. The existing security-definer notification recovery RPC is unchanged. Schema/table/routine ownership is sufficient for installation; the installer needs no superuser, BYPASSRLS, CREATE ROLE or ALTER ROLE authority.

This remains an old-runtime compatibility fence, not a new sandbox against arbitrary SQL from a principal that already has broad application-table permissions. Intentional owner security revocation remains supported. No existing authentication/authorization policy is relaxed.

## Preserved cutover invariants

0032's locked legacy-history preflight, generation trigger, old v1/v2 claim behavior, new v3 claim behavior, recovery clock/selector, and their ACLs are unchanged. After a successful install:

- Old senders cannot acquire pending notifications; an old claim body waiting across cutover is fenced by the trigger.
- Pre/post-cutover pending notifications and canonical results are retained. New runtime can recover untouched pending work through the existing notification-only completed-job lane.
- Credential/token identity and existing sent URLs remain protected against delayed old automatic revokes. Explicit accepted identity-detachment still revokes the correct Customer's credentials of every purpose.
- Unsafe legacy send history causes atomic STOP. No history edits, lease resets, customer-row repair, token regeneration or queue deletion are required.
- A detach function body already executing before replacement may fail closed when it reaches the new credential guard. Its whole transaction rolls back; a new invocation of the unchanged RPC name uses the compatible body. Local tests cover both the real migration-lock overlap and an exact stale body followed by a successful current-body call. This is not a promise that every in-flight old detach call succeeds without retry.

The old runtime already invokes the same RPC name; no TypeScript runtime change is needed. Product, Safety, Payment, Quality, refund, retry and terminal-obligation policies remain unchanged.

## Migration artifact policy

Only the still-unapplied **0032 artifact is replaced in place**. The file is neither deleted nor renumbered. Human explicitly confirms the Production transaction rolled back and 0032 is absent from migration history, and authorizes this local correction. Thus there is no applied artifact whose meaning is being rewritten. Appending 0033 alone would leave the mandatory preceding 0032 broken.

Applied migrations 0002–0031 remain byte-identical. No migration-history data is edited. The original failed artifact remains preserved at `0014a1f001d5b6f82cfd13532b2f4ccbcd8b5299` and is tested as a negative control.

| Artifact | Git blob |
| --- | --- |
| Failed original 0032 | `863f1a23d6621e0f79cb667ea5cab3cda09e0a06` |
| Corrected pending 0032 | `6b1ba114f920de0b83656d4574c69153fbd07f47` |

Historical evidence pins are retained; the verifier permits only this literal replacement, not arbitrary new HEAD/schema drift. A future Production authorization must identify the corrected source and artifact. Already-applied 0024–0031 must not be retried. Remote parity is not asserted by this local report.

## Common three-layer migration gate

`remediation-local-postgres.mjs` now provides a reusable restricted migration-owner fixture. It creates a fresh local role with NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, NOBYPASSRLS and NOINHERIT, no role memberships and no parameter grants. SQL connects directly as that role; both session_user and current_user must match. Fixture bootstrap assigns existing application-object ownership to it, separately from the runtime roles. The bootstrap itself is not presented as non-superuser migration evidence.

The fixture grants only ordinary USAGE on the existing extensions schema so pre-existing application security-definer functions can call pgcrypto. It does not transfer extension ownership, grant CREATE there, change extension routine ACLs or add a parameter privilege. This models an existing application dependency in the disposable cluster; it is not a proposed Production GRANT or a step in 0032.

`remediation-migration-authority.mjs` requires two independent PostgreSQL clusters: superuser reference and restricted owner. Both execute the same functional suite. The restricted installer is also proved unable to create roles, make itself superuser, enter the bootstrap role or set a superuser-only parameter. Installer attributes/memberships/parameter grants must be unchanged after migration. Runtime invocation and ACL checks run separately as service/anon/authenticated/ingress roles and roll back their probes.

`verify-remediation-migration-privileges.mjs` is now mandatory in the cumulative remediation runner. Every migration after the applied 0031 baseline must register a verifier that reports both installation modes and executable runtime permission evidence. Each mode returns the filename and SHA-256 of the exact SQL used; the gate matches that receipt to the current registered artifact. An unregistered future migration, a changed artifact, or another migration incorrectly registered to the 0032 verifier fails the gate. Existing historical verifier evidence is retained; this does not retroactively claim restricted-role installation of every historical bootstrap migration.

## Verification

Focused results: superuser functional **23/23**, restricted-owner functional **24/24** including exact failed-artifact reproduction, runtime permission probes **40/40**, focused application runtime **15/15**. Real PostgreSQL uses owned disposable PostgreSQL 17 clusters on loopback; each is stopped in `finally`. Tests/build use the existing offline environment/network guard, and no env file changes.

Coverage includes pending before/after cutover, absent new runtime, old/new claims and migration concurrency, old revoke/old detach waiting across the migration lock, unknown send/queue acknowledgement, current detach idempotence, all credential purposes for the exact Customer, unrelated Customer and timestamp rejection, binding and credential-stage exceptions, concurrent detaches with an old catch, canonical preservation, no notification loss, stable token/payload identity, and retained-schema forward fix. Duplicate effective fake delivery 0, token regeneration 0, assessment regeneration 0. External provider idempotency retention or unlimited-time exactly-once delivery is not established by fake tests.

| Runtime principal/path | Permitted | Rejected |
| --- | --- | --- |
| service_role / old v1/v2 sender | Existing lookup dispositions | New pending claim; stale claim-body mutation; protected automatic revoke |
| service_role / new sender | v3 pending claim; same credential/payload retry; bounded recovery handoff | Conflicting/invalid identity and unsafe legacy state |
| service_role / current detach RPC | Exact Customer's atomic identity purge and credential revocation | Unrelated binding or timestamp as a revoke exception |
| anon / authenticated | No privileged notification/detach RPC | All five tested RPC entry points |
| dedicated Stripe ingress | Its unchanged ingress contract | All five tested notification/detach RPC entry points |
| migration owner | Reviewed application DDL as object owner | Role creation/elevation, superuser-only SET, role membership and parameter-grant expansion |

Runtime probes use `SET LOCAL ROLE` to test effective-role SQL and ACL boundaries. They do not claim a Production authenticator/login integration test.
The historical local `service_role` fixture has BYPASSRLS to model the runtime principal; the independent migration installer has no BYPASSRLS or membership in that role. No runtime privilege is added by this correction.

| Required check | Final result |
| --- | --- |
| Focused application runtime | 15/15 PASS |
| Real PostgreSQL, superuser installer | 23/23 PASS |
| Real PostgreSQL, independent restricted installer | 24/24 PASS, including rejection and atomic rollback of the failed original artifact |
| Runtime ACL and actual invocation matrix | 40/40 PASS across both installed schemas |
| Cumulative remediation regression | 42/42 PASS, including the required three-layer artifact gate and 0024–0031 regression |
| Typecheck | `tsc --noEmit` PASS; Production build TypeScript phase also PASS |
| Lint | Full repository ESLint PASS with `--max-warnings=0` |
| Production build | Offline Next.js build PASS, 47/47 pages, external network attempts 0 |
| Diff and scope | `git diff --check` PASS; application/runtime/config and applied 0002–0031 unchanged |
| Independent final review | SQL/privilege design and final artifact-receipt/recovery-purpose corrections reviewed; no outstanding finding |

Final cumulative command: `node scripts/verify-remediation-wave3.mjs`. Local logs: `C:/Users/PUBLIC_USER/AppData/Local/Temp/moon-reply-wave3-regression-GluQhH/`, with 42 zero-exit results in `results.json`. These logs are local evidence, not Production observations. Build command: `node --input-type=module -e 'import {buildOffline} from "./scripts/remediation-offline-runtime.mjs"; await buildOffline();'`.

During focused verification, a new stale-body test initially omitted a separator after `pg_get_functiondef`; the test fixture was corrected. The first restricted fixture run also exposed its missing ordinary extensions-schema USAGE; the explicit fixture dependency above corrects that without altering 0032. Neither failure required a runtime/security-policy change. The evidence helper's old literal 0032 assertion then failed as expected (old `863f1a...`, new `6b1ba1...`); classified as a B successor-artifact mismatch. Its narrow update preserves the historical pin and all earlier migration/runtime checks.

## Changed files

| File | Change |
| --- | --- |
| `supabase/migrations/0032_f004_notification_cutover_fence.sql` | Replace the custom GUC with the atomic ownership-state guard and compatible detach body |
| `scripts/remediation-local-postgres.mjs` | Reusable restricted installer fixture with direct sessions and privilege inspection |
| `scripts/remediation-migration-authority.mjs` | Shared superuser/restricted-installer/runtime permission harness |
| `scripts/verify-remediation-migration-privileges.mjs` | Required future migration registry and applied SQL artifact receipts |
| `scripts/verify-f004-cutover-db.mjs` | Both installer layers, failed-artifact reproduction, detachment and concurrency cases |
| `scripts/verify-remediation-wave3.mjs` | Include the mandatory three-layer migration gate in cumulative regression |
| `scripts/remediation-wave3-evidence.mjs` | Preserve the failed artifact pin and permit only the exact reviewed replacement |
| `scripts/verify-m2-b2-i4-cutover-safety-controls.mjs` | Consume the corrected pin with historical evidence checks |
| `docs/remediation/F004_CUTOVER_SAFETY_2026-09-07.md` | Link this successor and identify the previous installation-evidence gap |
| `docs/remediation/F004_PRIVILEGE_COMPATIBILITY_2026-09-07.md` | Incident, design, artifact policy and verification report |

## Completion boundary

Technical PASS permits a local commit only. Production remains at the Human-reported STOP state; this task performs no external remeasurement or mutation. It does not consume a new Production authorization, retry a remote migration, publish runtime, reopen sales or claim Human Acceptance. Protected `C:/tmp/mrexp-e98` is untouched.
