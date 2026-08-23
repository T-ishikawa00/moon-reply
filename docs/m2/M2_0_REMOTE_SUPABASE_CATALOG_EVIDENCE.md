# M2-0 Remote Supabase Catalog Evidence

Status: `read_only_complete_source_match`

Captured: `2026-08-23`

CLI: `supabase@2.115.0`

Scope: catalog metadata only. No remote write, migration apply, table DML, customer-row query, consultation body, email, token, capability, secret, URL, or project reference was read or stored.

## Migration history

`supabase migration list --linked` returned exact local/remote pairs for every version `0002`, `0003`, `0004`, `0005`, `0006`, `0007`, `0008`, `0009`, `0010`, `0011`, `0012`, `0013`, `0014`, `0015`, and `0016`. There was no local/remote gap.

## Whole-public-schema constraint inventory

Counts are live `pg_constraint` catalog counts. `NV` is the number with `convalidated=false`.

| Table | CHECK | FK | UNIQUE | PK | NV |
| --- | ---: | ---: | ---: | ---: | ---: |
| assessment_clarifications | 9 | 2 | 3 | 1 | 0 |
| assessment_reports | 2 | 1 | 1 | 1 | 0 |
| assessment_requests | 8 | 0 | 1 | 1 | 0 |
| assessment_runs | 11 | 1 | 0 | 1 | 0 |
| assessment_stage_runs | 11 | 1 | 2 | 1 | 0 |
| production_assessment_grants | 2 | 2 | 2 | 1 | 0 |
| production_customer_auth_continuations | 4 | 1 | 1 | 1 | 0 |
| production_customer_deliveries | 1 | 2 | 2 | 1 | 0 |
| production_customer_ownership_bindings | 3 | 2 | 3 | 1 | 0 |
| production_email_verification_challenges | 5 | 3 | 1 | 1 | 0 |
| production_fulfillment_jobs | 7 | 8 | 6 | 1 | 0 |
| production_logical_assessments | 5 | 3 | 3 | 1 | 1 |
| production_notification_outbox | 5 | 1 | 1 | 1 | 1 |
| production_payment_adjustment_ledger | 4 | 1 | 1 | 1 | 0 |
| production_payment_attempts | 5 | 1 | 5 | 1 | 0 |
| production_preparation_email_bindings | 2 | 3 | 1 | 1 | 0 |
| production_preparations | 5 | 2 | 5 | 1 | 0 |
| production_purchase_intents | 7 | 9 | 5 | 1 | 0 |
| production_purchases | 1 | 1 | 2 | 1 | 0 |
| production_result_credentials | 3 | 1 | 1 | 1 | 0 |
| production_stripe_event_ledger | 6 | 5 | 0 | 1 | 0 |
| production_trusted_email_sessions | 2 | 1 | 2 | 1 | 0 |
| production_verified_email_authorities | 2 | 0 | 2 | 1 | 0 |
| production_verified_payments | 4 | 4 | 6 | 1 | 0 |

The only NOT VALID constraints are:

- `production_logical_assessments_lease_owner`: `CHECK (lease_expires_at IS NULL OR status = 'generating' AND owner_id IS NOT NULL AND ownership_acquired_at IS NOT NULL) NOT VALID`
- `production_notification_outbox_lease_owner`: `CHECK (lease_expires_at IS NULL OR status = 'processing' AND owner_id IS NOT NULL AND processing_started_at IS NOT NULL) NOT VALID`

Every other CHECK, FK, UNIQUE, and PK in the matrix is validated. NOT VALID does not disable enforcement for new inserts/updates; both displayed constraints also deliberately accept a NULL lease for expand compatibility.

Relevant validated identities include:

- Fulfillment job owner: processing requires non-NULL owner and lease; non-processing requires both NULL.
- Fulfillment job dispatch lease: dispatch owner and dispatch lease are both NULL or both non-NULL.
- Customer ownership active state: active requires non-NULL customer user and verified-email fields; detached requires those fields NULL and a non-NULL detach time.
- Assessment run returned model: NULL or exact `gpt-5.6-luna`; the finalization RPC independently rejects NULL.
- Fulfillment job FK/UNIQUE bindings join intent, verified payment, preparation, grant, logical assessment, and delivery authority as present in source.

## Triggers

All six non-internal public triggers are enabled in origin mode (`tgenabled=O`):

| Table | Trigger | Function |
| --- | --- | --- |
| assessment_clarifications | assessment_clarification_question_immutable_v1 | `protect_assessment_clarification_question_v1()` |
| assessment_stage_runs | assessment_stage_runs_topology_v5 | `enforce_assessment_stage_topology_v5()` |
| production_payment_attempts | enforce_rc2_payment_attempt_environment_v1 | `enforce_rc2_payment_attempt_environment_v1()` |
| production_purchase_intents | enforce_rc2_purchase_intent_environment_immutable_v1 | `enforce_rc2_purchase_intent_environment_immutable_v1()` |
| production_verified_payments | enforce_rc2_verified_payment_binding_v1 | `enforce_rc2_verified_payment_binding_v1()` |
| production_verified_payments | reject_rc2_verified_payment_mutation_v1 | `reject_rc2_verified_payment_mutation_v1()` |

## RLS and effective authority

All 24 public tables in the constraint matrix have RLS enabled. All have `FORCE ROW LEVEL SECURITY=false` and zero `pg_policies` rows. This is deliberate server-mediated denial for ordinary roles, not a policy that constrains the privileged service role. The inspected RPCs are `SECURITY INVOKER`; their effective authorization is therefore the caller's service-role authority plus explicit RPC predicates and table constraints. RLS must not be cited as protection from a service/secret key that bypasses RLS.

## Exact current RPC definition identity

`body_md5` is live `md5(pg_proc.prosrc)`. Ordered argument types and return types are preserved in `regprocedure` signatures. Owner is `postgres`; every row has exact ACL `{postgres=X/postgres,service_role=X/postgres}`, no PUBLIC/anon/authenticated EXECUTE, and `SECURITY INVOKER`.

The live `pg_get_functiondef` result was normalized only for CRLF/LF and compared with the cited immutable source definition. Every row matched; there is no source/remote body mismatch.

### Current v2 and identity/model authority

| Exact remote signature | Return | body_md5 | Exact source definition |
| --- | --- | --- | --- |
| `claim_production_fulfillment_v2(uuid,uuid,timestamp with time zone,timestamp with time zone)` | jsonb | `05a784665d7ecf5c1c7e66025eda18f7` | `supabase/migrations/0016_m1_4_background_fulfillment_durability.sql:64` |
| `mark_production_generation_started_v2(uuid,uuid,timestamp with time zone)` | text | `3473d59d11f071eeeebe554ce0862594` | `...0016...sql:276` |
| `complete_production_fulfillment_v2(uuid,uuid,uuid,uuid,uuid,jsonb,text,uuid,text,uuid,timestamp with time zone)` | void | `3347e6c8c2275bc75647a710aa743cb5` | `...0016...sql:304` |
| `fail_production_fulfillment_v2(uuid,uuid,text,timestamp with time zone)` | void | `7998e0da471b4e2ba8ae4fd95207aa55` | `...0016...sql:389` |
| `claim_rc2_fulfillment_dispatch_v2(uuid,text,uuid,timestamp with time zone,timestamp with time zone)` | jsonb | `57d6bb45641119b4d847326d87b98754` | `...0016...sql:417` |
| `complete_rc2_fulfillment_dispatch_v2(uuid,text,uuid,timestamp with time zone)` | void | `5f47f4a3b366a01d342e13784a494196` | `...0016...sql:519` |
| `fail_rc2_fulfillment_dispatch_v2(uuid,text,uuid,text,timestamp with time zone,timestamp with time zone)` | void | `f787094e9a329c087f57eacd67c4f862` | `...0016...sql:544` |
| `claim_rc2_fulfillment_job_by_id_v2(uuid,uuid,timestamp with time zone,timestamp with time zone)` | jsonb | `3fbee3826de492eb10e9d7596283dd91` | `...0016...sql:575` |
| `claim_rc2_fulfillment_job_v2(text,uuid,timestamp with time zone,timestamp with time zone)` | jsonb | `8a05e3f7c5f4b0aff853465f5821e684` | `...0016...sql:654` |
| `complete_rc2_fulfillment_job_v2(uuid,uuid,timestamp with time zone)` | void | `53b398bc7b9db80427474ec1aa65e629` | `...0016...sql:709` |
| `fail_rc2_fulfillment_job_v2(uuid,uuid,text,timestamp with time zone)` | void | `f7fcbdbdefdc91921469bff7e4a3c8d2` | `...0016...sql:743` |
| `claim_production_notification_v2(uuid,uuid,timestamp with time zone,timestamp with time zone)` | jsonb | `08af91aebdba9673652da7d21d67098d` | `...0016...sql:866` |
| `complete_production_notification_v2(uuid,uuid,text,timestamp with time zone)` | void | `b22646954b0fd93c7cab3833cd92bdb5` | `...0016...sql:940` |
| `fail_production_notification_v2(uuid,uuid,text,timestamp with time zone)` | void | `b56a14c35b40ef77f3d50acfb6deb6a5` | `...0016...sql:966` |
| `bind_production_preparation_to_customer_v1(uuid,uuid,text,text,uuid,text,text,text,text,timestamp with time zone,timestamp with time zone)` | jsonb | `a5d2b7dcec293ecb3a4130e7c5a43031` | `supabase/migrations/0014_customer_identity_authority_v1.sql:713` |
| `finalize_completed_assessment(uuid,uuid,uuid,text,text,jsonb,jsonb,bigint,bigint,bigint,bigint,numeric,timestamp with time zone)` | void | `4975b03007c8a4f2ca071da310f94a77` | `supabase/migrations/0003_m2_p3_atomic_finalization.sql:3` |

The full ordered argument names are preserved in those source headers, which are the exact live body matches. Notably, `finalize_completed_assessment` explicitly raises `M2_FINALIZATION_MODEL_REQUIRED` for a NULL returned model, and the active ownership table CHECK requires a non-NULL customer user ID.

### Legacy v1 retained by the expand rollout

| Exact remote signature | Return | body_md5 |
| --- | --- | --- |
| `claim_production_fulfillment_v1(uuid,uuid,timestamp with time zone)` | jsonb | `ee5afab0af13f0f069832903db4b73df` |
| `mark_production_generation_started_v1(uuid,uuid,timestamp with time zone)` | text | `db3c367f7a2dd560257cf3ac678d62c0` |
| `complete_production_fulfillment_v1(uuid,uuid,uuid,uuid,uuid,jsonb,text,uuid,text,uuid,timestamp with time zone)` | void | `1492f70b26ab502b2e2c177113974e39` |
| `fail_production_fulfillment_v1(uuid,uuid,text,timestamp with time zone)` | void | `86c185a15b7afcee6e0cb53186bcecb3` |
| `claim_rc2_fulfillment_job_by_id_v1(uuid,uuid,timestamp with time zone,timestamp with time zone)` | jsonb | `40dfe3f31aa67434545a72234fb253f5` |
| `claim_rc2_fulfillment_job_v1(text,uuid,timestamp with time zone,timestamp with time zone)` | jsonb | `afc9daafce88134139bc82277963760f` |
| `complete_rc2_fulfillment_job_v1(uuid,uuid,timestamp with time zone)` | void | `a4d5de7ac4cd71c679ff1da5000ea4e8` |
| `fail_rc2_fulfillment_job_v1(uuid,uuid,text,timestamp with time zone)` | void | `037589ff294fa8e16e2343e73e9cfe0f` |
| `claim_production_notification_v1(uuid,uuid,timestamp with time zone)` | jsonb | `55738ce9df48544cd1b58b357a7aa3d5` |
| `complete_production_notification_v1(uuid,uuid,text,timestamp with time zone)` | void | `b67551e6f5d094555314deb6752a0df5` |
| `fail_production_notification_v1(uuid,uuid,text,timestamp with time zone)` | void | `700fb448ede50daef351c4f647dba969` |

Legacy v1 and current v2 coexist and are callable by service_role. Current repository runtime call paths select v2. Coexistence is not itself a proven exploit, but later v1 revocation/contract work requires a zero-use caller inventory and explicit Human remote-write authority.

## Source comparison conclusion

- Remote migration history: exact `0002..0016`.
- Remote function signatures, returns, owner, ACL, security mode, and bodies: source match for every targeted definition.
- Remote relevant CHECK/FK/UNIQUE/trigger/RLS state: matches current source intent.
- Mismatch count: `0`.
- Remote repair/apply count: `0`.

