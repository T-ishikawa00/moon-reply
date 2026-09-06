# F004 Remediation R1.1 — verification and rollout conditions

Date: 2026-09-06 JST. Scope: F004 only. Technical evidence is not Human Acceptance or Production Authorization.

Historical record: the F004 hold/drain procedure below is superseded, only after a successful 0032 cutover, by [Release R1 local cutover safety](../remediation/F004_CUTOVER_SAFETY_2026-09-07.md). Historical observations and verification results below are retained unchanged.

## Authority and scope

Start: `release/private-ready@fd01f7fb96241c448f6cbe57a197752cf411e71e`, upstream `origin/release/private-ready`.
Direct remote: `63520234267af67f319f1eb7b7999498239a3909`; the committed difference is only `AGENTS.md`.
The existing F004 work was modified 9 / untracked 4 / staged 0. Stash and active Git operations were 0.
Root: `C:/projects/moon-reply`. Linked `C:/tmp/mrexp-e98` and `C:/tmp/mrexp-ea4` were not operated on.
No Payment, Auth, Quality, Rate Limit, CSP, dependency, reconciliation, or F002 obligation implementation is changed.

## Verifier failure classification

All original line numbers below refer to the verifier at the exact start HEAD above, before R1.1 edits.
Classification: A = implementation regression; B = stale source/migration shape assertion; C = unrelated pre-existing failure; D = missing execution prerequisite.

| Original verifier / line | Class | Expected | Actual at start HEAD / F004 worktree | Evidence and F004 relationship |
| --- | --- | --- | --- | --- |
| `scripts/verify-rc2-resend-email-provider.mjs:245-249` | B | No file contains the provider-specific key name | One file: existing ingress security verifier | `scripts/verify-m2-b2-i1-public-ingress-authority.mjs:654` is a forbidden-name array; line 665 rejects it in the bundle. The file is byte-unchanged from start HEAD. No credential value or runtime use caused this failure. |
| Same, `:536,540-542` | B | Exactly 0002–0014, 13 migrations | HEAD 0002–0023, 22; F004 worktree 0002–0024, 23 | 0015–0023 already exist in HEAD. Only 0024 is new; predecessors are unchanged. |
| Same, `:559` | B | Historical protected-source diff has exactly 2 files | Historical diff has 31 files at HEAD, 32 in F004 worktree | The extra historical-list entry is `production/notification.ts`; actual F004 protected-source diff is exactly the 5 notification-related assessment files. The other history already predates F004. |
| Same, `:585` | B | Historical Foundation app diff has exactly 15 files | HEAD and F004 worktree both have 48 | F004 `app/` diff is 0. |
| `scripts/verify-m2-e3-account-my-reports-result.mjs:411,414` | B | Old Support function identifier and old inquiry label | HEAD/current use `isPurchaseSupportEmailEnabled` and the purchase inquiry label | Account page line 44, gallery line 95; `lib/support/environment.ts:16` retains exact `"true"` gating. Account and Support implementation are unchanged. |
| Same, `:589-597` | B | E1 file group has no diff from historical E3 base | HEAD and F004 worktree both include RequestForm | RequestForm itself has no F004 diff. |
| Same, `:602` | B | No migration diff from historical E3 base | HEAD/current tracked diff is 0022 and 0023 | Original assertion did not see untracked 0024. Filesystem inventory now covers it as well. |

The Account runner originally stopped at the first failure. Collecting all outcomes exposed three failing groups out of 43; the old inquiry label was a nested stale assertion in the first group. No A, C, or D failure was found.

Read-only comparison evidence:

```powershell
git.exe -c safe.directory=C:/projects/moon-reply show fd01f7fb96241c448f6cbe57a197752cf411e71e:scripts/verify-rc2-resend-email-provider.mjs
git.exe -c safe.directory=C:/projects/moon-reply show fd01f7fb96241c448f6cbe57a197752cf411e71e:scripts/verify-m2-e3-account-my-reports-result.mjs
git.exe -c safe.directory=C:/projects/moon-reply diff --name-only fd01f7fb96241c448f6cbe57a197752cf411e71e -- app components lib/support scripts/verify-m2-b2-i1-public-ingress-authority.mjs
git.exe -c safe.directory=C:/projects/moon-reply diff --name-only 8bf6c4e9c0a860b48826708676f0abe7c4395714 fd01f7fb96241c448f6cbe57a197752cf411e71e -- app
git.exe -c safe.directory=C:/projects/moon-reply diff --name-only 01cfab6666ef8523ba0492d4838d87da6b368b27 fd01f7fb96241c448f6cbe57a197752cf411e71e -- components/request/RequestForm.tsx supabase/migrations package-lock.json
```

The third command is empty. The last command reports only RequestForm, 0022, and 0023.
Email preserves the original 0002–0013 integrity check, adds immutability for every pre-F004 migration, and permits only 0024 as an addition. Protected product-source changes have an exact 5-file allowlist; all app routes must remain unchanged.
The full-repository credential-value scan remains. Its name scan permits only the single existing, immutable security-test denylist literal after verifying its purpose and occurrence count. No runtime/config occurrence is exempted.
Account verifies the current exact-true Support gate, propagation, and CTA; ownership, privacy, canonical-result, Auth, and dependency checks remain. Its runner now reports every failure and still exits nonzero on any failure.

## Retry policy reconciliation

The notification-specific 1-hour / 8-send limit was introduced by uncommitted R1; it did not exist at start HEAD. R1 locations were 0024 lines 20, 70, 73, 140–141 and fake repository lines 632–634, 695–696. No measured or accepted contract supported either number. They are not required to persist a stable credential or payload, so R1.1 removes both limits.

Final `0024:20` checks a nonnegative attempt count only. `0024:124-149` records first-send time and count behind the live owner/lease fence; neither field imposes a new recovery policy. Tests explicitly exercise the same identity after two hours and after eight failed sends. This is a test of preserved retry eligibility, not a new scheduler or infinite-retry authorization.

In R1, reaching a limit returned `manual_review` without updating the stored status. A row therefore remained `failed` or expired `processing`; Account access remained valid. The existing payment wrapper mapped that disposition to `ErrorDoNotRetry` (`lib/payment/production/application.ts:945-960`, `async-workloads-worker.ts:78-79`). The predicates would remain true on every later claim. There was no added Human/operator notification or automatic re-entry mechanism. That side effect is removed.

The pre-existing Async Workloads limit is separate: `lib/payment/production/async-workloads-worker.ts:15,43-59` has `PRODUCTION_FULFILLMENT_MAX_RETRIES = 8`. It limits workload event retries, not the number of result emails; its final completed-job path can invoke notification processing. That file and the backoff definition in `netlify/functions/production-fulfillment-background.mts` are unchanged from HEAD. F002 terminal obligations and operator recovery are not decided here.

Legacy attempted rows, explicit credential revocation, and payload conflicts still stop automatic sends; they cannot safely acquire a replacement payload under the existing idempotency key. These integrity holds are distinct from elapsed-time/attempt limits. Provider key-retention duration is not established by the installed SDK and remains UNKNOWN; fixed payload identity does not prove delivery exactly once after a provider discards its key.

## Limited encryption review

| Check | Source / result |
| --- | --- |
| Cipher and IV | `lib/payment/production/notification-envelope.ts:20-25`: AES-256-GCM, a fresh 12-byte CSPRNG IV for each encryption, 16-byte authentication tag. Retry reuses existing ciphertext and does not encrypt again. No deliberate IV reuse; a 129-IV synthetic uniqueness sample passes. |
| Domain separation | Same `:5-12`: 32-byte master, HKDF-SHA256 with a notification-envelope-specific info domain, separate from the delivery-email encryption purpose. |
| Identity binding | Same `:22,41,46-49`: identical notification-bound AAD for encrypt/decrypt; decrypted idempotency key must match the notification. Substitution/tampering fails authentication. |
| DB persistence | `lib/assessment/production/supabase-repository.ts:921-924` and 0024 preparation RPC: hash plus versioned IV/tag/ciphertext; no plaintext bearer, address, or body. Lease-fenced credential activation and immutable payload installation share one transaction. |
| Logs | F004 code has no plaintext logging and surfaces fixed error codes. Installed Resend SDK logs error detail only outside `NODE_ENV=production`; an offline real-SDK error test confirms Production emits no provider-detail log. Production mode is a rollout condition; external log collection configuration is UNKNOWN. |
| Client bundle | Public Next service entry is server-only; final Production `.next/static/**/*.js` must contain none of the envelope domain, integrity-code or prepare-RPC markers. Actual final-build scan is recorded below. |
| Decrypt failure | No token rotation, payload regeneration, or plaintext fallback. Wrong key, tamper, and notification substitution stop before provider send. |
| Key rotation | Existing configuration key `EMAIL_ADDRESS_ENCRYPTION_KEY` must remain available unchanged for queued payloads. Envelope version is not a key ID. No keyring/rotation/reencryption machinery is added. Changing the key safely prevents sending existing ciphertext and requires a separately reviewed migration; immutable ciphertext must not be casually rewritten. |
| Token entropy | `lib/assessment/production/capabilities.ts:10-11` remains unchanged: `randomBytes(32)`, 256 bits. |

Full payload persists sender, recipient, subject, text, HTML and URL so deploys, sender/origin configuration, recipient attributes, and template changes cannot alter customer-visible content under the same provider key. Persisting only a token would not satisfy that invariant.

## Migration compatibility matrix

Here “safe” refers to F004 email behavior, not broad production readiness.

| Combination | Schema compatibility / F004 safety | Customer impact |
| --- | --- | --- |
| Old DB + old runtime | Compatible / unsafe | Existing token rotation, invalidation and provider payload-conflict risk remains. |
| New DB + old runtime | Compatible / unsafe for normal operation | v2 guard protects versioned identities, but old code can still claim unversioned pending/failed rows. Migration alone is not a drain barrier. With old notification execution held, expansion itself does not change existing rows. |
| New DB + new runtime | Compatible / safe for fixed identity, subject to rollout conditions | New notifications retry the same credential/payload. Sent rows short-circuit. Attempted legacy rows require review; Account recovery remains available. Provider exactly-once behavior remains bounded by its own contract. |
| Old runtime rollback after new DB | Compatible / only conditionally safe while old sends remain held | New identities are protected by the retained v2 guard, so old code leaves them unsent. Resuming legacy sends revives the original defect. Keep columns, ciphertext, credentials, and v2 guard; do not roll back schema destructively. |

New runtime + old DB is not a permitted rollout state: its v3/preparation RPCs do not exist and notification delivery fails closed.

## Exact future rollout order

No step below is executed or authorized by this evidence.

1. Obtain Human Acceptance and separate Production Authorization for the exact reviewed source and migration. Confirm current deployed source, DB predecessors, key continuity, Production mode, and queue routing. Re-run the count-only preflight below.
2. Establish an approved hold preventing every new invocation/routing to old notification workers, while preserving queued events. Include existing router/queue retries and old deployment origins. Merely disabling the dispatch scheduler does not stop already accepted queue events. The actual platform control for this hold is UNKNOWN in this task; if it cannot be established and observed, STOP before migration/deploy.
3. Drain already-running old workers: old-deployment active invocations = 0; no new routing to old origins; no live lease held by an old notification worker. Expired processing rows are reviewed as legacy rows, not forcibly reset. Queue entries may remain and must be preserved.
4. Recheck non-sent/attempted-legacy counts under the hold. Apply only 0024, then read back columns, constraints, trigger, RPC signatures and restricted EXECUTE privileges. Existing rows are not backfilled and neither canonical delivery nor credentials are rewritten by apply.
5. Deploy the reviewed new runtime against new DB with the hold still effective. Prevent routing to old deployment origins. Keep the payload encryption key unchanged.
6. Verify exact source/DB pairing, Production mode, unchanged key availability, client exclusion, Account ownership recovery and sent-row duplicate behavior using separately authorized smoke scope. No real email/payment/Provider smoke is implicitly authorized.
7. Route retained events only to the verified new runtime, then release the hold. Inspect natural processing using counts and safe codes. Do not delete/recreate queued events, reset leases, resend manually, or regenerate assessments as part of this rollout.

Definition of drained: all three observations in step 3 must hold after old invocation admission stops. A database lease expiry by itself is not proof of process termination. An old request already past its send fence can still execute network work until the host actually terminates it.

Timing: application notification lease is 16 minutes (`application.ts:74,801-802`, no production override in `application-runtime.ts:29-44`). Installed Async Workloads SDK gives background work a 899,500 ms timeout (`node_modules/@netlify/async-workloads/index.js:418-429`), implemented via Promise racing rather than proof of cancellation. Sixteen minutes after the last old claim is the lease-expiry boundary, not a sufficient or universal waiting period. Maximum total drain time is **UNKNOWN** without host termination and routing observations.

Queued events: installed SDK defaults to the Production global queue store (`index.js:113-124`); `AWL_PERSISTENCE_CONTEXT` can override it and the live setting is UNKNOWN. Pending jobs persist function name/event data; dispatch reconstructs routing using current mapping and request origin (`_internal/chunk-FUT6WL54.js:52-68`, `_internal/router.js:81-95`). They are not source-SHA-pinned records. Confirm the actual new destination before releasing the hold. Their mere presence does not require deletion or processing under old code.

## LIVE count-only observation

Observed 2026-09-06 **06:49:56–06:49:58 JST** (2026-09-05 21:49:56–21:49:58 UTC). Configured Supabase host matched the locally linked project reference. These are actual remote counts from that configured/linked database, **all Payment environments combined**, not a Stripe LIVE-only filter. Published Production's current connection to the same database was not independently inspected in Netlify and remains **UNKNOWN**. Confirm that correspondence before using this observation as a Production rollout gate.

| Count | Value |
| --- | ---: |
| pending | 0 |
| failed / retryable stored state | 0 |
| processing | 0 |
| sent | 12 |
| non-sent | 0 |
| attempted non-sent legacy (`attempt_count > 0`) | 0 |
| processing with NULL lease, a manual-review predicate | 0 |

Stored status has no `manual_review` value: 0010 defines pending/processing/failed/sent. A literal status count returned 0 but is not a workflow-state metric. With non-sent = 0, the current legacy manual-review candidate count is also 0. `attempt_count` measures claims, not proven provider sends; it is a conservative proxy for legacy send ambiguity. The old schema cannot provide an exact historical network-send count. The 0024 identity column was absent at observation.

Reads used a zero-row schema probe and exact HEAD counts; Customer row bodies read = 0, external writes = 0. Sequential requests are a short observation window, not an atomic transaction snapshot. Counts can change before rollout.

Human read-only preflight in **Supabase Dashboard → the same project → SQL Editor** (before 0024):

```sql
begin read only;
select
  count(*) filter (where status = 'pending') as pending,
  count(*) filter (where status = 'failed') as failed,
  count(*) filter (where status = 'processing') as processing,
  count(*) filter (where status = 'sent') as sent,
  count(*) filter (where status <> 'sent') as non_sent,
  count(*) filter (where status <> 'sent' and attempt_count > 0) as attempted_legacy_non_sent,
  count(*) filter (where status = 'processing' and lease_expires_at is null) as null_lease_review_candidates,
  count(*) filter (where status = 'processing' and lease_expires_at > now()) as processing_live_lease,
  count(*) filter (where status = 'processing' and lease_expires_at <= now()) as processing_expired_lease
from public.production_notification_outbox;
commit;
```

After 0024, add `email_identity_version is null` to the attempted-legacy filter. Do not equate elapsed leases with drained hosts. Do not select recipient, ciphertext, token hash, body or row identifiers for these checks.

## Verification and commit gate

| Final verification | Result |
| --- | --- |
| `npm.cmd run verify:f004` | PASS 26/26; no generation, canonical duplication, or external calls |
| `npm.cmd run verify:f004:db` | PASS 16/16; isolated native PostgreSQL 17, exact temporary cluster stopped |
| `npm.cmd run verify:rc2:email-provider` | PASS 14/14 |
| `npm.cmd run verify:rc1` | PASS 19/19 |
| `npm.cmd run verify:rc2` | PASS 55/55 |
| `npm.cmd run verify:m1-4:background-fulfillment` | PASS 21/21 |
| `npm.cmd run verify:m2-e3` | PASS 43/43 |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run lint` | PASS, zero ESLint warnings |
| Production build | PASS 47/47 static pages; telemetry off, process-local flags disabled, HTTP/fetch/TLS guard installed; no environment files changed |
| Final `.next/static/**/*.js` scan | Envelope domain, integrity-code and preparation-RPC marker matches = 0 |
| `git diff --check` | PASS |

No invariant has been waived and no failing required verifier remains. Node's pre-existing module-format performance warnings are not lint failures. Technical PASS meets the previously authorized local-commit gate only; it does not authorize Production operation.

Remaining operational conditions: actual host hold/drain control and maximum wait UNKNOWN; provider key retention/real delivery UNKNOWN; key rotation requires separate handling; legacy review has no new operator notification mechanism. Other audit findings stay in backlog. Push, deploy and external write remain 0.
