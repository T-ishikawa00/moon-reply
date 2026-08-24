# M2-B2-I1-R3 Remote Event-Trigger ACL Compatibility

## Status and stop boundary

- Base authority: `release/private-ready@752f687b5ea6bead28a464f9bb9870fb092e143e`.
- Task branch: `task/m2-b2-i1-r3-event-trigger-acl-hardening-r1`.
- Remote database remains exact `0002..0017`.
- The authorized 0018/0019 push attempted 0018 once. Its in-transaction least-privilege guard raised `M2_B2_INGRESS_FUNCTION_PRIVILEGE_DRIFT`; 0018 rolled back safely, 0019 was not started, and neither version was recorded. Retry and history repair counts remain `0`.
- Failed and rolled-back 0018 candidate SHA-256 `53cd8f20be9a50569060f6566d04092bbe4613366c543e1d3b0643e3fd2c7805` is superseded and must never be retried.
- Hardened pending 0018 Git-blob SHA-256: `1aa84f874e1f7585b51377dc5f201dc87f6448bc94574e342008597bb6270010`.
- Pending 0019 remains byte-identical at `b4e5ef6b06ef6e70c0904e7b1692c2863861c73738454d499ac3b730a082456c`.

No remote migration apply/write, migration repair, credential/password, Netlify project/config/deploy/publish, Stripe operation, real Async event, Provider/OpenAI, Purchase, email, or `main` change is authorized by this record.

## Exact remote identity

Read-only catalog evidence identifies one remote-only routine:

| Field | Exact value |
| --- | --- |
| Identity | `public.rls_auto_enable()` |
| OID | `17362` |
| Owner / language | `postgres` / `plpgsql` |
| Arguments / return | zero arguments / `event_trigger` |
| Security | `SECURITY DEFINER` |
| Search path / volatility | `search_path=pg_catalog` / volatile |
| ACL | EXECUTE to `PUBLIC`, `postgres`, `anon`, `authenticated`, `service_role`; grantor `postgres`; no grant option |
| Normalized `pg_get_functiondef` SHA-256 | `62e77d28f3013a8047bb431be5f8b174ad51cdde883dcc3b0d6c6c0a84e954a3` |
| `prosrc` identity | length `953`; MD5 `99be20677b456ea8d3be47bdd44fb369` |

Its only event-trigger binding is OID `17363`, name `ensure_rls`, owner `postgres`, event `ddl_command_end`, enabled for origin (`O`), tags exact `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO`, and function OID exact `17362`.

This matches Supabase's documented RLS-auto-enable structure: zero-argument `RETURNS event_trigger`, `SECURITY DEFINER`, `search_path=pg_catalog`, and the same DDL tags. The remote body is older/different in one material detail: its inner exception handler logs and continues, while the current documentation rethrows after logging. Candidate 0018 therefore pins the observed remote source identity rather than silently accepting any similarly named routine. Official references: [Supabase event triggers](https://supabase.com/docs/guides/database/postgres/event-triggers), [PostgreSQL CREATE EVENT TRIGGER](https://www.postgresql.org/docs/current/sql-createeventtrigger.html).

## Plain-call and revoke proof

An exact disposable fixture reproduced the remote body, ACL, and event trigger. Before revoke, a synthetic low-privilege role had effective EXECUTE through PUBLIC. A plain `SELECT public.rls_auto_enable()` still failed with PostgreSQL SQLSTATE `0A000`, `trigger functions can only be called as triggers`. Effective EXECUTE in the catalog is therefore not equivalent to successful direct invocation. PostgreSQL's own regression test exercises the same native rejection: [event trigger regression SQL](https://github.com/postgres/postgres/blob/master/src/test/regress/sql/event_trigger.sql).

After `REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC`:

- function OID, owner, source, security, search path, and volatility were unchanged;
- event-trigger OID, owner, event, enabled state, tags, and function binding were unchanged;
- explicit `postgres`, `anon`, `authenticated`, and `service_role` EXECUTE grants remained true;
- PUBLIC, the synthetic plain-call role, and `m2_b2_stripe_ingress` effective EXECUTE became false;
- ingress CREATE remained false on both `public` and `private_payment_ingress`;
- an ordinary DDL-capable synthetic role created a new public table and `ensure_rls` still set `relrowsecurity=true`.

Chosen disposition: keep `least_privilege_guard` strict and normalize the one reviewed ACL. There is no event-trigger exception/allowlist in the guard.

## Candidate 0018 compatibility block

The block uses `to_regprocedure('public.rls_auto_enable()')`. Absence is a safe no-op for repository-only fresh databases. Presence requires exact routine structure, source identity, the five reviewed ACL entries, and the one exact `ensure_rls` binding. Any deviation fails closed before the revoke. Only then does it revoke PUBLIC and verify the four explicit grants remain while ingress effective EXECUTE is false.

The original remote ACL snapshot `c68d7306e097d7c54b9abfada970b526f4ba3d9c24211b7e24c1ea1cef0b2265` remains historical evidence. R3 also defines a new canonical snapshot over effective function ACL rows in `public` and `private_payment_ingress`, sorted as `identity|owner|grantee|privilege|grantable`:

- current remote pre-apply rows `149`, SHA-256 `48b9e923b43e89b36123b2f4be389580132d41331d5789a02e7423a7ee0b56ee`;
- expected post-apply rows `148`, SHA-256 `85f7a6035af44d6593c108abd32feec6b18c7e5e87652b7d743358c76cb5f81c`.

The exact expected existing-function ACL delta is one row only:

`public.rls_auto_enable()|postgres|PUBLIC|EXECUTE|false`: present to absent.

All other existing function ACL rows remain identical. Runtime authority is unchanged except removal of an inherited but natively unusable direct-call privilege for this event-trigger-only routine.

## Local proof

Two fresh, unlinked disposable Supabase paths passed:

1. Exact migrations `0002..0017`, inject the exact remote-only fixture, then apply hardened 0018 and unchanged 0019. Plain call returned `0A000`; compatibility proof showed ingress EXECUTE false, explicit runtime grants preserved, and a new public table RLS-enabled after revoke.
2. Exact repository migrations `0002..0019` without the fixture. The compatibility block no-op path applied successfully and the branch-independent ingress privilege preflight passed.

The fixture path also passed I1 sequential atomicity/invalid-zero-effect/order/conflict proof, future-function default-privilege proof, I2 reconciliation proof, actual two-client reconciliation winner `1`, actual two-client ingress convergence `verified 1 / duplicate 1`, Background durability, and Customer Auth database proof. No fixture or proof connected to remote data or an external Provider.

## Regression result

- I1-R3 verifier `13/13`; I1/I1-R2 descendant regression `15/15`.
- I2 `15/15`; B1 `15/15`; A1 `12/12`, plus the sequential NULL-fence matrix and two-client claim/notification/reclaim/completion matrix against the fresh `0002..0019` database.
- RC-2 `50/50`; RC-1 `19/19`; Background durability `21/21`.
- Async graph `105` modules / `355` edges, Async generated artifacts, Background runtime assets, and both Scheduled Function ZIP import/schedule checks PASS.
- Customer Auth database proof and Auth entry `11/11`; Product Intent `18/18`; Clarification `7/7` PASS.
- Root typecheck, zero-warning lint, customer Production build `38/38`, ingress typecheck/build, and `git diff --check` PASS.
- External operations remained `0`: no remote migration/write, Stripe call, Async event, Provider/OpenAI, email, Purchase, deploy/publish, or configuration change.

## Permanent governance

After a future reviewed 0018 apply, postgres-owned functions receive no implicit PUBLIC EXECUTE. Every future migration must explicitly grant intended roles and run the branch-independent `m2_b2_i1_ingress_privilege_preflight_r1.sql`. Event-trigger functions are not exempt from that rule. Existing explicit grants must be inventoried and preserved or changed only under a separately reviewed authorization.
