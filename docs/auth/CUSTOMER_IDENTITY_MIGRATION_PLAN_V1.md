# Customer Identity Migration Plan V1

- Status: `design_only_not_executable`
- Architecture status: `Customer Identity Architecture V1 designed_pending_human_chatgpt_review`
- Accepted migration authority: `0002..0013` remain byte-identical
- Reserved future filename: `0014_customer_identity_authority_v1.sql`

## 1. Non-mutation boundary

This plan does not create SQL, alter a database, apply or repair a migration, configure Supabase Auth, or write Customer data. It defines the review target for a future append-only migration only.

Never edit `0010`, `0011`, `0012`, or `0013`. The future implementation must prove the Git blob identity of all accepted migrations before and after every local database test.

## 2. Selected model

Use Option B: one canonical ownership-binding table. Only that table directly references `auth.users.id`.

Future ownership chain:

`auth.users.id -> production_customer_ownership_bindings -> production_preparations -> production_purchase_intents -> production_verified_payments -> production_assessment_grants -> production_logical_assessments -> production_customer_deliveries`

The exact downstream table names and keys must be re-audited against the accepted schema when the implementation task begins. No `owner_id` column participates.

## 3. Proposed schema

### 3.1 `production_customer_auth_continuations`

Purpose: one-use, short-lived bridge from an anonymous purchase-ready preparation to a completed server-side Auth flow.

Proposed fields:

| Field | Contract |
| --- | --- |
| `id uuid primary key` | Random server ID |
| `preparation_id uuid not null` | FK to `production_preparations(id) ON DELETE RESTRICT` |
| `continuation_token_hash text not null unique` | Hash-only high-entropy secret; no raw token in DB/logs |
| `csrf_token_hash text not null` | Hash-only per-continuation CSRF authority; the raw CSRF token remains same-origin/browser-bound |
| `flow_kind text not null` | `google` or `email_otp` |
| `state text not null` | `pending`, `consumed`, `expired`, or `revoked` |
| `expires_at timestamptz not null` | Short, explicitly configured TTL |
| `consumed_at / revoked_at timestamptz null` | Terminal evidence |
| `created_at / updated_at timestamptz not null` | Audit timestamps |

Required constraints:

- hash format/length check;
- independent continuation-token and CSRF-token hash checks; the two raw secrets must never be equal or derived from one another;
- expiry after creation;
- terminal-state consistency;
- at most one pending continuation per preparation, implemented as a partial unique index on `preparation_id WHERE state = 'pending'`;
- no CustomerUserId before Auth completes;
- no raw continuation, CSRF token, OAuth state, OTP, PKCE verifier, preparation capability, access token, refresh token, email, or result token in ordinary columns or logs.

The server cookie binds the raw continuation to the browser. The raw CSRF token is supplied only to the same-origin Auth form/flow. Mutating Auth routes require exact Origin/Host, the valid per-continuation CSRF pair, a pending unexpired continuation, and the rate-limit seam. Google PKCE verifier/session material is managed through the reviewed server-side Supabase flow, not copied into this table.

Do not use `now()` or any other volatile clock expression in a partial-index predicate. Under the locked preparation row, the start function must first transition an expired pending continuation to `expired`, revoke any still-pending superseded flow when policy permits a provider switch, and then insert the single new `pending` row. CSRF validation and continuation consumption occur atomically in the binding/callback transaction.

### 3.2 `production_customer_ownership_bindings`

Purpose: the only canonical application ownership edge between Supabase Auth and a purchase-ready preparation.

Proposed fields:

| Field | Contract |
| --- | --- |
| `id uuid primary key` | Random binding ID |
| `ownership_reference_id uuid not null unique` | Random non-reversible reference retained after identity deletion |
| `customer_user_id uuid null` | FK to `auth.users(id) ON DELETE RESTRICT`; nullable only after explicit detachment |
| `preparation_id uuid not null unique` | FK to `production_preparations(id) ON DELETE RESTRICT` |
| `delivery_email_sha256 text null` | Keyed/HMAC index, not a plain SHA-256 identity |
| `delivery_email_ciphertext text null` | Existing reviewed AES-256-GCM envelope format |
| `delivery_email_key_version text null` | Enables controlled key rotation |
| `delivery_email_verified_source text null` | `supabase_email_otp` or `google_verified_identity` |
| `delivery_email_verified_at timestamptz null` | Snapshot authority time |
| `state text not null` | `active` or `identity_detached` |
| `bound_at timestamptz not null` | First successful ownership bind |
| `identity_detached_at timestamptz null` | Required only for detached state |
| `created_at / updated_at timestamptz not null` | Audit timestamps |

Required invariants:

- `preparation_id` is globally unique: one preparation, one Customer binding.
- Active state requires non-null CustomerUserId and a complete verified delivery-email envelope.
- Detached state requires null CustomerUserId and an identity-detachment timestamp.
- The encrypted email is an attribute and delivery snapshot, never a uniqueness source for Customer ownership.
- The CustomerUserId is not copied into Payment, Assessment, Delivery, result, outbox, or Runtime lease tables.
- Add `unique (id, preparation_id)` to support a composite Purchase Intent FK.

### 3.3 `production_purchase_intents` compatibility extension

Add:

- `customer_ownership_binding_id uuid null`;
- a foreign key to `production_customer_ownership_bindings(id) ON DELETE RESTRICT`;
- a composite foreign key `(customer_ownership_binding_id, preparation_id)` to binding `(id, preparation_id)` so a binding cannot be attached to another preparation.

The existing legacy fields are:

- `verified_email_authority_id`;
- `trusted_email_session_id`;
- the composite link to `production_preparation_email_bindings`.

They currently require non-null values. The future migration must deliberately replace that single-lane assumption with one exact CHECK:

1. **legacy lane:** `customer_ownership_binding_id is null` and both legacy IDs are non-null; or
2. **authenticated lane:** `customer_ownership_binding_id is non-null` and both legacy IDs are null.

Do not simply drop NOT NULL constraints. The new lane CHECK, existing legacy foreign keys, new binding foreign keys, and every affected RPC/function must land atomically in `0014`. Existing rows remain valid in the legacy lane without backfill or reinterpretation.

`delivery_authority_reference` remains purchase-local and non-identity authority. Its format and uniqueness remain unchanged.

### 3.4 Accepted functions that currently assume the legacy lane

The future implementation must not stop at table constraints. The current `0011` definitions include direct legacy-email assumptions in:

- `begin_rc2_purchase_intent_v1` — requires a trusted email session and matching preparation email binding;
- `record_rc2_stripe_evidence_v1` — reads the Purchase Intent's verified-email authority while converging Provider evidence;
- `issue_rc2_production_assessment_grant_v1` — reads the verified-email authority when bridging verified Payment into fulfillment.

The application notification/status repositories also resolve the delivery address and result disclosure through the legacy authority/session path.

`0014` must add reviewed versioned entrypoints for the authenticated lane. Payment evidence and Grant entrypoints should support both legacy and authenticated Purchase Intents without weakening any economic, environment, delivery-reference, or one-Grant invariant. New authenticated rows must never be sent to a legacy-only function that treats null email-authority IDs as corruption. Existing V1 functions remain historical/legacy behavior until a separately staged code cutover; do not edit `0011`.

## 4. Database functions and atomic transitions

The future migration should add versioned functions rather than rewriting historical migration files.

### 4.1 Start continuation

`create_customer_auth_continuation_v1` must:

- lock and validate the exact purchase-ready preparation;
- validate the hash-only preparation capability through the existing authority;
- revoke/supersede an earlier usable continuation for that preparation;
- insert one bounded continuation;
- return only the raw capability supplied/generated by the trusted application layer, never a Customer identity.

If generation of the raw secret remains in TypeScript, the RPC receives and stores only its hash.

### 4.2 Bind preparation

`bind_production_preparation_to_customer_v1` must:

- receive a CustomerUserId only from a server route that freshly verified the Supabase session;
- lock continuation, preparation, and any existing binding;
- consume only a pending, unexpired, matching continuation;
- require the preparation to remain purchase-ready;
- insert the active ownership binding and encrypted verified-email snapshot;
- return idempotent success for the same Customer/preparation replay;
- raise a stable generic conflict for a different Customer;
- never rebind an existing preparation;
- avoid returning another Customer's UUID or email.

The SQL cannot prove that the caller obtained CustomerUserId from a real Auth session because service role can supply any UUID. The application call path, repository API, and verifier must make that trust boundary explicit and non-bypassable.

### 4.3 Create authenticated Purchase Intent

Add a versioned authenticated equivalent of `begin_rc2_purchase_intent_v1`. It must:

- lock the binding and preparation;
- require `state = active` and the exact current CustomerUserId;
- require the same accepted purchase-ready facts and final confirmation;
- create or return the same Purchase Intent idempotently;
- set only `customer_ownership_binding_id` for the new lane;
- preserve exact JPY 980 one-time Product, currency, environment, Provider, status capability, and Attempt rules;
- reject legacy/auth mixed rows.

Binding and Purchase Intent creation should be one transaction where practical. If the binding already exists but intent creation fails, retry by the same Customer is safe and another Customer remains blocked.

Add dual-lane versioned successors for `record_rc2_stripe_evidence_v1` and `issue_rc2_production_assessment_grant_v1`. They must preserve the accepted Stripe evidence, Payment Integrity, idempotency, concurrency, and fulfillment invariants while resolving delivery ownership from exactly one lane. The webhook, reconciliation, browser recovery, and worker paths must converge on those same successors.

### 4.4 Resolve account/history and result

Add ownership-constrained server functions or repository queries that begin with `customer_user_id` and join through the binding. They must:

- return only safe history fields;
- never accept browser-supplied CustomerUserId as authority;
- require active binding state;
- require exact purchase/delivery association;
- distinguish not-found from infrastructure failure without exposing cross-account existence;
- return a result only after ownership is proven.

### 4.5 Identity detachment

`detach_production_customer_identity_v1` must:

- require an idempotency/request ID and a recently reauthenticated server identity;
- lock all active bindings for the Customer;
- block new Purchase Intents and private access;
- revoke applicable result credentials;
- clear CustomerUserId and delivery-email material according to the approved retention plan;
- set `identity_detached` and timestamp;
- retain only `ownership_reference_id` for Payment/integrity joins;
- return an idempotent completion state.

The subsequent Supabase Admin user deletion is an external application step. Failure leaves access denied and is retried; it must not roll back into an active account automatically.

## 5. Foreign-key and deletion semantics

Use `ON DELETE RESTRICT` from the active binding to `auth.users(id)`. This intentionally makes direct Dashboard/Admin deletion fail while active ownership exists. Operators must use the reviewed detachment workflow first.

Rationale:

- `CASCADE` could erase purchase/history links and violate Payment Integrity.
- plain `SET NULL` could silently bypass the required revocation/anonymization workflow.
- `RESTRICT` fails closed and makes the two-step lifecycle visible.

After detachment has cleared CustomerUserId, deleting `auth.users` no longer has a dependent FK. If Auth deletion fails, the retry queue contains no raw provider token and the account remains inaccessible through application ownership.

All downstream financial and fulfillment foreign keys stay `ON DELETE RESTRICT`. Account deletion never cascades through Purchase, Payment, Grant, Assessment, or Delivery.

## 6. Indexes and query shape

Required indexes:

- unique `production_customer_ownership_bindings(preparation_id)`;
- index `production_customer_ownership_bindings(customer_user_id, state, bound_at desc)` for server account history;
- unique `production_customer_ownership_bindings(id, preparation_id)` for the composite FK;
- index `production_purchase_intents(customer_ownership_binding_id) WHERE customer_ownership_binding_id IS NOT NULL`;
- unique `production_customer_auth_continuations(continuation_token_hash)`;
- index `production_customer_auth_continuations(preparation_id, state, expires_at)`;
- a reviewed partial uniqueness rule preventing concurrent usable continuations.

Do not add an email-based ownership index beyond the existing keyed delivery lookup requirement. Never use plain email equality to resolve account history.

## 7. ACL and RLS implications

For both new tables:

- enable RLS;
- revoke all privileges from PUBLIC, `anon`, and `authenticated`;
- grant no direct browser DML;
- preserve zero DELETE/TRUNCATE/REFERENCES/TRIGGER authority for Runtime service role unless a separately reviewed operation proves a need;
- grant only exact SELECT/INSERT/UPDATE/EXECUTE required by versioned server functions;
- harden default privileges consistently with accepted Step D;
- pin `search_path` and schema-qualify objects in every SECURITY DEFINER function;
- do not expose raw hashes, ciphertext, Auth UUIDs, or internal ownership references through public APIs.

The service role bypasses RLS. Every server repository and function must enforce the Customer ownership predicate explicitly. RLS-enabled is not proof of Customer isolation in a service-role architecture.

Future verifier requirements:

- application tables with PUBLIC/`anon`/`authenticated` DML: `0`;
- new tables RLS-enabled: `2/2`;
- excess service-role privileges: `0`;
- direct Auth client access to production tables: `0`;
- cross-Customer fixture reads/writes: denied;
- deleted/detached Customer reads: denied;
- legacy Purchase behavior: unchanged.

## 8. Migration execution order

The future `0014` should be one atomic transaction in this order:

1. precondition assertions for accepted objects/constraints/functions from `0011..0013`;
2. create continuation table and constraints;
3. create ownership-binding table and constraints;
4. add nullable Purchase Intent binding column;
5. add binding foreign keys/indexes;
6. replace only the necessary Purchase Intent legacy NOT NULL assumption with the exact two-lane CHECK;
7. add versioned Auth-lane functions and grants;
8. add detachment/account-query functions and grants;
9. enable RLS/revoke/grant/default-privilege hardening;
10. catalog self-checks that abort on any missing constraint, unexpected privilege, or mixed ownership lane.

Do not backfill legacy rows to an Auth user by matching email. Existing rows remain legacy forever unless a separate Customer-initiated, verified, audited claim procedure is designed and accepted.

## 9. Local proof required before any remote review

Use a disposable local Supabase/PostgreSQL environment and synthetic identities only.

Required evidence:

1. fresh apply of `0002..0014`;
2. clean replay;
3. immutable Git/index blob proof for `0002..0013`;
4. legacy row remains valid and unchanged;
5. authenticated-lane row satisfies the new CHECK;
6. mixed/null ownership lanes fail;
7. same Customer replay is idempotent;
8. second Customer claim fails under concurrency;
9. binding/preparation mismatch fails by FK;
10. one preparation still creates at most one Purchase Intent;
11. Payment Attempt/idempotency and webhook/reconciliation convergence remain intact;
12. cross-Customer account/history/result reads fail;
13. service-role missing-ownership negative tests fail at repository/application boundary;
14. identity detachment preserves Payment evidence but denies access;
15. direct Auth user deletion is restricted before detachment and succeeds after detachment;
16. new-table ACL/RLS/default privileges match the reviewed matrix;
17. migration transaction rollback leaves `0002..0013` state unchanged;
18. all RC baseline verifiers, typecheck, lint, build, diff check, and audits pass.

Static SQL inspection alone is insufficient.

## 10. Deployment and rollback/recovery strategy

No destructive rollback SQL is planned. Forward recovery is mandatory.

Recommended future rollout:

1. deploy `0014` while all Auth code paths remain disabled;
2. verify remote catalog/history read-only;
3. deploy code with Auth lane still fail-closed and external providers unconfigured;
4. configure/test Supabase Auth, Google, and Resend SMTP under separate Human authorization;
5. enable only synthetic/test-environment Auth;
6. run dual-path deterministic and bounded end-to-end evidence;
7. enable new Purchase creation for authenticated Customers;
8. keep legacy reads/recovery active;
9. monitor binding conflicts, Auth errors, cross-Customer denials, notification failures, and Payment convergence;
10. only after a separate acceptance consider stopping new custom-verification writes.

If Auth or provider configuration fails:

- stop new binding/Checkout;
- preserve anonymous consultations and existing legacy purchase recovery;
- do not delete bindings or rewrite ownership;
- do not treat login failure as Payment failure;
- retry only idempotent Auth/continuation operations;
- use a forward corrective migration if the schema is defective.

The migration must not be remotely applied, repaired, or marked in this architecture task.

## 11. Human/legal decisions required before activation

The architecture decision is complete, but these external facts require later Human action:

- exact Supabase plan support and configured session limits;
- actual Google OAuth project/domain/consent-screen verification;
- Supabase Pro-or-higher support for the target time-box/inactivity controls, or a separately reviewed application-level equivalent;
- actual Resend SMTP sender/domain and deliverability configuration;
- final processor/region/overseas-transfer description;
- exact retention periods for consultation, assessment, delivery email, payment evidence, integrity ledger, and security logs;
- verified account-deletion request/contact procedure;
- whether a later manual identity-linking or legacy-purchase claim feature is authorized.

None permits implementation to silently choose broader data collection, longer retention, or automatic account merging.
