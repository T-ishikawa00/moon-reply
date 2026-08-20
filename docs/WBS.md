# WBS.md

<!-- RC-2-PRODUCTION-ACTIVATION-STEP-D:BEGIN -->
## RC-2 Production Activation Step D — Candidate

Status: `RC-2 Production Activation Step D Service-Role Least-Privilege Hardening implemented_pending_human_chatgpt_review`.

- [x] Accept/integrate Step C at `403b9af17431bf7c18a4e28ddbe63889409dc10c` by ff-only release update.
- [x] Add append-only `0013_rc2_service_role_acl_hardening.sql`; retain `0002..0012` byte-identically.
- [x] Audit the 22-table Runtime matrix and preserve row-lock-required UPDATE authority.
- [x] Remove DELETE/TRUNCATE/REFERENCES/TRIGGER and client-role authority from all 22 tables.
- [x] Remove future public-schema default table authority for the actual migration creator role.
- [x] Prove exact local catalog matrix, default ACL, RLS 22/22, service-role runtime behavior, destructive denials, and zero persisted proof rows.
- [x] Prove `PASS_0002_THROUGH_0013_FRESH_APPLY` and `PASS_0002_THROUGH_0013_FRESH_REPLAY`.
- [x] Reconfirm remote identity and exact pre-state `0002..0012`; dry-run exact `0013`; apply once; prove exact post-state `0002..0013`.
- [x] Prove remote exact matrix, destructive privileges zero, client authority zero, RLS 22/22, default ACL PASS, and unchanged `0012` controls.
- [x] Record sanitized evidence with Customer data read and non-migration remote writes at zero.
- [ ] Complete Human/ChatGPT Step D final review and acceptance.
- [ ] Separately resolve or accept the remaining `npm audit --omit=dev` `3 high` blocker.
- [ ] Start Stripe, webhook, Payment, Email, OpenAI Provider, runtime activation, deploy, DNS, PRIVATE RELEASE READY, or Public Launch. All remain prohibited in this task.

Exact next action: Human/ChatGPT review Step D. `release/private-ready` remains at accepted Step C and `main` remains unchanged.
<!-- RC-2-PRODUCTION-ACTIVATION-STEP-D:END -->

<!-- RC-2-PRODUCTION-ACTIVATION-STEP-C:BEGIN -->
## RC-2 Production Activation Step C — Accepted

Status: `RC-2 Production Activation Step C accepted_complete`; ChatGPT final review `PASS`; Human/ChatGPT acceptance `complete`.

- [x] Confirm exact starting authority, branch, clean worktree, stash zero, and no unresolved Git operation.
- [x] Confirm `AUTH = PRESENT`, `REMOTE_PROJECT_IDENTITY = MATCH`, and `DB_AUTH = READY` without exposing credentials or remote identifiers.
- [x] Accept Human amendment class C0: applied `0002..0003`; expected pending `0004..0012`.
- [x] Prove pre-write schema/history consistency and absence of conflicting pending-migration objects.
- [x] Prove the official dry-run reports exactly `0004..0012`.
- [x] Apply exactly `0004..0012` once through the official linked migration runner.
- [x] Prove exact post-state `0002..0012`, required tables, 22/22 zero-row table SELECT capability calls, RLS, assessment ACL, role denial, `0012` triggers/CHECK/RPC, and pure helper behavior.
- [x] Complete repository regression and immutability checks; retain `npm audit` `3 high` as a separate blocker.
- [x] Record sanitized evidence with zero Customer-row access and zero non-migration remote writes.
- [x] Complete Human/ChatGPT review and acceptance of Step C candidate `d32b85347a5badb4955566008140bc2226e4c25f`.
- [ ] Complete Step D append-only service-role least-privilege hardening for all 22 application tables before Stripe or Production Runtime activation.
- [ ] Provision Stripe, register a webhook, perform an actual Payment, activate Email/OpenAI/runtime/deployment, or change remote flags/secrets. These remain prohibited in this task.
- [ ] Complete RC-3, PRIVATE RELEASE READY, and Public Launch.

This acceptance sync changes only the three top acceptance overlays. Product code, migrations, verifiers, runtime, package/lock, Q0/V17, and Step C evidence remain unchanged.

Exact next stage: **RC-2 Production Activation Step D — Service-Role Least-Privilege Hardening**. `main` remains unchanged; no Provider or runtime activation is authorized.
<!-- RC-2-PRODUCTION-ACTIVATION-STEP-C:END -->

<!-- RC-2-PRODUCTION-ACTIVATION-STEP-B:BEGIN -->
## RC-2 Production Activation Step B — Accepted

Status: `RC-2 Production Activation Step B accepted_complete`; ChatGPT final review `PASS`; Human/ChatGPT acceptance `complete`.

Historical candidate status before acceptance: `RC-2 Production Activation Step B implemented_pending_human_chatgpt_review`; its Step B remote boundary was `REMOTE_SUPABASE_STATE = UNRESOLVED`.

- [x] Accept candidate `63767f2235f3c5999a31507945b4b140390e81c7`.
- [x] Accept append-only `0012_rc2_activation_database_hardening.sql` and immutable `0002..0011` lineage.
- [x] Accept fresh PostgreSQL/Supabase apply, service-role minimum authority, anon/authenticated denial, and real Runtime/RPC execution evidence.
- [x] Accept Stripe test/live Checkout DB binding, Payment Integrity A–O, migration atomicity, and clean `0002..0012` replay.
- [x] Complete Human/ChatGPT final review and acceptance of Step B.
- [ ] Resolve remote Supabase migration state and perform any authorized migration apply only in Step C.
- [ ] Provision Stripe Sandbox secrets, register the webhook, and complete a Stripe test Payment.
- [ ] Establish a production transactional email Provider and actual email delivery.
- [ ] Establish distributed rate limiting/WAF and production monitoring/rehearsal.
- [ ] Resolve the remaining `npm audit --omit=dev` `3 high` findings.
- [ ] Complete RC-3, PRIVATE RELEASE READY, and Public Launch.

Exact next stage: **RC-2 Production Activation Step C — Remote Supabase State + Authorized Migration Apply**. Step C is not started in this acceptance sync.
<!-- RC-2-PRODUCTION-ACTIVATION-STEP-B:END -->

<!-- RC-2-PRODUCTION-ACTIVATION-STEP-A:BEGIN -->
## RC-2 Production Activation Step A — Accepted

Status: `RC-2 Production Activation Step A accepted_complete`; ChatGPT final review `PASS`; Human/ChatGPT acceptance `complete`.

- [x] Accept implementation lineage `dcccf1c780619e9716b72764d2f2f7f93a961543` -> `68ddb485bf12254f82446f919dad5ded9d5a80d4`.
- [x] Accept the activation environment matrix and fail-closed complete activation gate.
- [x] Accept secret-safe `.env` Git protection and the activation-preflight verifier.
- [x] Accept the Stripe Sandbox code-readiness audit and static `0010`/`0011` dependency audit.
- [x] Accept the exact next activation order/runbook.
- [x] Complete Human/ChatGPT Step A review and acceptance.
- [ ] Establish disposable PostgreSQL compatibility proof and remote Supabase migration state; migration `0011` remains unapplied.
- [ ] Provision Stripe secrets, register the Stripe webhook, and complete a Stripe test Payment.
- [ ] Establish a transactional email Provider and real email delivery.
- [ ] Establish distributed rate limiting/WAF and monitoring/runbook operational rehearsal.
- [ ] Resolve or formally disposition the remaining `npm audit` `3 high` findings.
- [ ] Complete RC-3, PRIVATE RELEASE READY, and Public Launch.
- [ ] Begin **RC-2 Production Activation Step B — Disposable PostgreSQL / Supabase Migration Compatibility Proof** only under a separate task. Step B is not started here.

This acceptance sync changes documentation only; production code, migration, package, lock, runtime, Q0/V17, verifier, and `.gitignore` remain unchanged. Stripe API/Dashboard/charge/Payment/webhook registration, email, OpenAI Provider, Supabase remote read/write, migration apply/repair, Netlify deploy, secret/env remote change, DNS, Public Launch, PR, and main merge remain `0`.
<!-- RC-2-PRODUCTION-ACTIVATION-STEP-A:END -->

<!-- RC-2-R2-PER-PURCHASE-EMAIL-AUTHORITY-BINDING:BEGIN -->
## RC-2 Production Payment + Customer Delivery Implementation Core — Accepted

Status: RC-2 Implementation Core `accepted_complete`; R1 `accepted_complete`; R2 `accepted_complete`; ChatGPT final review `PASS`; Human/ChatGPT implementation acceptance `complete`.

- [x] Accept lineage `57651f5fa850a061170389387b8201b03749c6ff` -> `dd6a813cd8c6cb27e72687ffdafea111585de31b` -> `5d2d1c915924ff5072babe0e25858a352e9e703d` -> `7ac706e96e86e7dcb276b23a756937cf8eaf104a`.
- [x] Accept verified mailbox control, trusted email sessions, per-preparation verified-email binding, and preparation-local reverification.
- [x] Accept Purchase Intent, sequential Attempts, exact JPY 980 one-time Checkout, server idempotency, raw-body webhook verification, reconciliation convergence, unknown-not-failed, same-Attempt recovery, and server/DB Payment Integrity.
- [x] Accept durable browser-independent fulfillment, verified Payment -> RC-1 Grant handoff, browser/worker concurrency safety, Purchase-bound result disclosure, and independent result-email recovery.
- [x] Complete Human/ChatGPT review of the RC-2 Implementation Core only.
- [ ] Overall RC-2 Production Activation remains `PENDING`; Provider/account/KYC/payout/method approval, secrets, webhook registration, live email, TTL policy, `0011` apply/live PostgreSQL proof, Supabase/OpenAI/Stripe test execution, WAF/rate limiting, production deployment/secrets, monitoring/runbook, and RC-3 remain incomplete.
- [ ] Close the remaining `npm audit --omit=dev` `3 high` findings through `next@16.2.12` / `postcss@8.4.31` / `sharp@0.34.5` before PRIVATE RELEASE READY.
- [ ] Begin the exact next stage, **RC-2 Production Activation / Provider Setup**, only under a separate Human-guided task.

Stripe calls, charge, Payment, email send, Supabase remote writes, migration apply, Netlify deploy, DNS, Legal publication, Public Launch, PR, and main merge remain `0` in this acceptance sync.
<!-- RC-2-R2-PER-PURCHASE-EMAIL-AUTHORITY-BINDING:END -->

<!-- RC-2-R1-PAYMENT-RECOVERY-FULFILLMENT-PRIVACY:BEGIN -->
## RC-2 R1 Payment Recovery / Fulfillment / Result Privacy — Implemented, Review Pending

Status: `RC-2 R1 implemented_pending_human_chatgpt_review` from exact starting SHA `dd6a813cd8c6cb27e72687ffdafea111585de31b`.

- [x] Add server-only authoritative Stripe Checkout Session reconciliation; normalize into the same webhook verification invariants and central DB evidence authority.
- [x] Preserve unknown-not-failed; keep open/unpaid processing, accept authoritative expiry only, and retain unknown on Provider/network failure.
- [x] Recover unknown Checkout creation with the same persisted Attempt and same derived Stripe idempotency identity; prohibit a second unresolved economic Attempt.
- [x] Converge webhook-first and reconciliation-first success on one verified Payment and one fulfillment job.
- [x] Wire `claim_rc2_fulfillment_job_by_id_v1` through repository/Application/service with no public worker route; share browser/worker Product processing.
- [x] Preserve one Grant, one logical Assessment, one canonical Report, and the notification path under browser absence, browser/worker concurrency, replay, and stale RC-2 lease reclaim.
- [x] Require the currently valid Purchase-bound trusted email session before returning a raw result-token path; return `completed_check_verified_email` otherwise.
- [x] Minimally correct unapplied `0011`; keep accepted `0010`, Q0/V17 semantics, JPY 980 one-time economics, one-total clarification, `generation_started`, source separation, canonical delivery, and refund boundaries unchanged.
- [x] Triage `npm audit --omit=dev --json`: exactly `5 high` remain in the existing Next/toolchain graph; no force fix or unproven dependency override.
- [x] Pass RC-2 R1 `48/48`, RC-1 `14/14`, typecheck, zero-warning lint, production build, `git diff --check`, and pre/post-build `next-env.d.ts` / accepted `0010` blob checks.
- [ ] Human/ChatGPT R1 review and acceptance.
- [ ] Resolve dependency advisories and all existing RC-2 activation/provider/email/migration/operations blockers before any PRIVATE RELEASE claim.

No actual Stripe call, charge, Payment, email, Supabase remote write, migration apply, deploy, DNS, Public Launch, PR, release merge, or main merge is authorized or performed by R1.
<!-- RC-2-R1-PAYMENT-RECOVERY-FULFILLMENT-PRIVACY:END -->

<!-- RC-2-PRODUCTION-PAYMENT-CUSTOMER-DELIVERY:BEGIN -->
## RC-2 Production Payment + Customer Delivery — Implemented, Review Pending

Status: `implemented_pending_human_chatgpt_review` on `task/rc2-production-payment-delivery`, from exact accepted RC-1 base `57651f5fa850a061170389387b8201b03749c6ff`.

- [x] Preserve deterministic pre-payment Safety, exact RC-1 V17 Product preparation, one-total Product clarification, source separation, canonical delivery integrity, and the PB-04 `generation_started` boundary.
- [x] Implement no-login mailbox verification with hash-only one-time challenge material, expiry/attempt policy seams, replay closure, changed-email revocation, encrypted address storage, and a host-only HttpOnly/Secure/SameSite=Lax trusted-session cookie.
- [x] Implement a provider-independent transactional-email boundary for mailbox verification and RC-1 notification-outbox result delivery; leave the production provider unselected/unconfigured and fail closed.
- [x] Implement one Purchase Intent per preparation, `0..N` sequential Attempts, unknown-not-failed handling, active-attempt exclusion, stable Stripe idempotency, and at-most-one verified economic success.
- [x] Implement Stripe Checkout for exact JPY 980 / quantity 1 / `mode=payment`; cards primary, Apple Pay/Google Pay delegated to eligible Checkout capability, PayPay separately config-gated.
- [x] Implement the raw-body `Stripe-Signature` webhook boundary, duplicate/out-of-order-safe evidence ledger, central server/DB Payment verifier, and durable fulfillment job without webhook-owned Provider generation.
- [x] Bind DB-verified Payment to exactly one RC-1 Assessment Grant; preserve one logical Assessment across reload/retry; reuse the canonical result and RC-1 result-notification outbox.
- [x] Connect RequestForm through RC-1 preparation, one clarification, email verification, final accepted purchase facts/legal links, Checkout, Customer-safe return status, and explicit same-Purchase retry after a confirmed failed/canceled Attempt.
- [x] Add append-only migration `0011_rc2_production_payment_delivery.sql` with RLS, denied anon/authenticated direct authority, service-role RPCs, uniqueness/FK/transaction/advisory-lock integrity; preserve `0010`; do not apply remotely.
- [x] Add route-level rate-limit seams and independent Payment, webhook, fulfillment, email, and emergency-stop flags, all fail-closed/off by default.
- [x] Complete offline implementation evidence: RC-2 `35/35`, RC-1 `14/14`, typecheck, zero-warning lint, production build, diff check, changed-secret-pattern scan, immutable `0010`, and zero RC-2 delta in protected Q0/runtime paths. Current Q0 semantic assertions are `9/9`; retained exact-branch/tree gates remain structurally non-portable on the RC-2 branch.
- [ ] Human/ChatGPT review and acceptance.
- [ ] Stripe account/category/payment-method approval, formal production configuration, secrets, webhook endpoint registration, and live-mode evidence.
- [ ] Transactional email provider selection/adapter, sender/domain authentication, deliverability/privacy review, and live evidence.
- [ ] Resolve or formally disposition the current `npm audit --omit=dev` result (`5 high`, pre-existing Next/toolchain graph; no Stripe finding). Then complete remote migration review/apply, distributed rate-limit/WAF/monitoring/runbooks, deployment, PRIVATE RELEASE READY, and the RC-3 hard gate.

No actual Stripe API call, charge, Payment, email send, Supabase remote write, migration apply, deploy, domain/DNS action, legal publication, Public Launch, PR, or main merge is part of RC-2 implementation.
<!-- RC-2-PRODUCTION-PAYMENT-CUSTOMER-DELIVERY:END -->

<!-- RC-1-PRODUCTION-FULFILLMENT-CORE:BEGIN -->
## Current authority overlay — RC-1 Production Fulfillment Core accepted

- [x] RC-1 Production Fulfillment Core — `accepted_complete`.
- [x] RC-1 R1 Product Input / Canonical Delivery Integrity — `accepted_complete`.
- [x] Accepted implementation lineage — `84e14ed80ee32a03a8332d709476d55e68c8436f` -> `438c4703018bdeda7fa3c2da846f59ff6c7ec36c` -> `f1af409b3da6b79f9a2acb7b32e6831cc10853f8`.
- [x] ChatGPT final review `PASS`; Human/ChatGPT acceptance `complete`.
- [x] Pre-payment acceptance — deterministic server-side Safety; exact V17 AI qualification before Payment; purchase-ready stop before PB-04/PB-05/PB-06; exactly one Product clarification total; actual inbound/current situation/outgoing Candidate source separation.
- [x] Purchase and fulfillment acceptance — server-only verified-purchase Grant boundary; persisted purchase-ready authority reuse; V17 PB-04/PB-05/PB-06 post-payment fulfillment; `generation_started` boundary.
- [x] Delivery acceptance — one canonical `CustomerAssessmentExperienceProjectionV2`; canonical projection SHA integrity verification; protected hash-only result credentials; result absence versus service failure separation; independent notification outbox/retry boundary.
- [ ] Live migration apply; Production Stripe Payment; verified delivery/recovery email implementation; live email sending; RequestForm production connection.
- [ ] Stale ownership recovery policy; retry limit finalization; result credential expiry policy; rate limiting/WAF/abuse final hardening; Production secrets/config.
- [ ] Production deployment; domain/DNS; PRIVATE RELEASE READY; Public Launch.
- [ ] Exact next release stage — **RC-2 Production Payment + real operator/customer delivery integration**. RC-2 is not started by this acceptance sync.

`release/private-ready` remains the sole current Product authority. This acceptance sync changes documentation only. Actual Provider / Supabase remote write / migration apply / Stripe-Payment / email send / Netlify deploy / domain-DNS / Legal publication / Public Launch / PR / main merge / RC-2 implementation operations are `0 / 0 / 0 / 0 / 0 / 0 / 0 / 0 / 0 / 0 / 0 / 0`. Main remains `61e33a10e195fad17e253a6b9719217e1992f273`.

All current-looking and next-action entries below are preserved historical snapshots. They are superseded as current authority by this RC-1 overlay and do not independently authorize Payment, migration apply, deployment, publication, or launch.
<!-- RC-1-PRODUCTION-FULFILLMENT-CORE:END -->

## Historical accepted Stripe / Legal / Public / Hosting authority

> **CURRENT Stripe Lane B B4b Private Review Hard Gate acceptance:** `stripe_lane_b_b4b_private_review_hard_gate_human_chatgpt_accepted_complete`; Acceptance date `2026-08-15`; Technical Evidence Closure SHA `ae20d3540a890f0a0b567695fd982b1d5a57d7f9`; `technicalEvidence = complete`.
>
> ChatGPT final review `PASS / complete`; Human final review `PASS / complete`; B4b acceptance `complete`; Netlify Hard Gate `human_chatgpt_accepted_complete_private_review_scope_only`; acceptance scope `private_review_technical_scope_only`; Production B4a SHA `025e28a82c0b773d21ececfd8064af045922079d` remains `unchanged / locked`; Paid Production Hosting `provisional`; Production readiness `not established`. This acceptance is limited to B4b Private Review technical evidence closure and the Netlify Private Review Hard Gate. Payment remains unimplemented; Production Runtime / Production Payment / Stripe approval or formal selection / additional Provider operations / public visibility / domain-DNS / legal publication / Public Launch remain unapproved or unauthorized. Exact next candidate is **Paid Production Readiness Planning** (`planning only / not started / no external authority created`). Historical B3/B4a/B4b snapshots remain unchanged. Detailed evidence: docs/payment/STRIPE_LANE_B_B4B_STABLE_REVIEW_URL_DEPLOYMENT.md.

## Payment / Platform / Monetization Strategy and Payment Charter

> **Stripe Lane B B3 accepted current overlay:** `stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete` on `2026-08-14`; Human Visual QA `PASS / complete`; ChatGPT review `PASS / complete`; Human acceptance / B3 acceptance `complete / complete`. B3 means only `Review-ready Website/Public Surface implementation accepted`. Exact next work is **Stripe Lane B deployment readiness (B4a)**, planning/readiness only. B4a does not authorize domain purchase, DNS mutation, deployment, public publication, Stripe submission, Provider activation, or Production Payment; B4b stable-URL deployment requires separate authority.

- [x] Agreed long-term product direction: Web -> real paid Web validation -> iOS -> Android -> repeat-purchase analysis -> subscription only if demand is established
- [x] Agreed initial product direction: one assessment / JPY 980 tax-inclusive / one-time / no automatic renewal / no customer-facing coins or points
- [x] Human + ChatGPT accepted Stripe-first Product/strategy direction on `2026-08-12`: Stripe Checkout is the strategic primary Web direction; credit/debit cards, Apple Pay, Google Pay, and PayPay are desired initially; status `stripe_feasibility_and_web_payment_strategy_pivot_human_chatgpt_accepted_complete`; all feasibility and method evidence remains pending
- [x] Agreed mobile direction: Apple IAP + RevenueCat for iOS, then Google Play Billing + RevenueCat for Android
- [x] Conceptually agreed provider-independent boundary: external transaction -> verified normalized Moon Reply purchase -> entitlement/assessment grant -> consume once
- [x] Subscription retained as a future coexistence candidate, with approximately 30–50 paid customers or 50–100 paid assessments recorded only as non-binding Product Owner heuristics
- [x] Explicit `2026-08-10` Human decision records Safety Engine / Safety UX as Human + ChatGPT accepted complete at Safety HEAD `55238f64a2409fb0f3f60d3d008f7db4d3a805a1`; historical task-local pending-review labels remain immutable and final JPY 980 readiness remains separate
- [x] Payment Charter v1 Candidate formulation — historical lineage at `7aeb9ecbc5a786b895f9280112f13b0629730429`, corrected by `b6f38586fadd2a17034810dbb139465af5eade2f`
- [x] Human + ChatGPT Payment Charter v1 acceptance — `human_chatgpt_accepted_complete` on `2026-08-12`; implementation authority remains `false`
- [x] Delivery/Recovery Email Verification Product/Privacy direction — `accepted_required_control_with_trusted_session_reuse`; server-verifiable trust, repeat reuse only for unchanged verified email, reverification on email/trust change, no-login/account boundary preserved
- [x] Human + ChatGPT integrated acceptance of Stripe Feasibility and Web Payment Strategy Pivot Candidate — Product/strategy acceptance sync complete on `2026-08-12`; not feasibility, approval, selection, or implementation authority
- [x] Truthful Customer-facing/public-copy alignment — `stripe_first_customer_public_copy_alignment_human_chatgpt_accepted_complete` on `2026-08-12`; accepted lineage `3d3888f53293231506838195c478fa2e1a88417f` -> `0bdbdc87b9de5b28707a7f5ce25f12d7b6333c95` -> `48d21e7ee7d672575eae6fd957e637b37da2a52f`; Human Visual QA / Automated QA `PASS / PASS`; Product/UI/content authority only
- [ ] Stripe feasibility/account/business/site/category/Live Payment and cards/Apple Pay/Google Pay/PayPay evidence — not started; Provider account/contact unauthorized
- [ ] Human formal Provider selection — Stripe incomplete; PAY.JP paused fallback / not approved / not selected
- [ ] Payment implementation, including Provider SDK/API/checkout/webhook, purchase DB/migration, and refund execution — unauthorized
- [ ] RevenueCat initial Web configuration, future synchronization, Apple IAP, Google Play Billing, Runtime, PR, and main integration — unauthorized

Canonical detail is in `docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md`. Strategy agreement, provider approval, Charter acceptance, implementation, production authorization, and release are separate states. This WBS entry authorizes documentation only.
## Historical Q0 / Product authority snapshots

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-D-V17:BEGIN -->
## Q0 V17 Final Product Recovery — Implemented, Review Pending

- [x] Start exactly from actual-evidence commit `37d98d405532009ac1057dfb5f44bb034ed64d9b`
- [x] Add exact V17 Runtime with unchanged schema/topology/model and unchanged PB-01/PB-01C/PB-02/PB-03
- [x] Correct structured Decision semantics for Cases 3/5 while preserving deadline and incoming obligations
- [x] Combine semantic, completeness, source, and customer-surface defects into one bounded attempt2
- [x] Map Application-derived change commentary to Plan ownership and reject unknown ownership
- [x] Preserve Base sent/direct-message state separately from unsent Candidate presence
- [x] Require permitted requested current/later drafts and truthful generated source metadata
- [x] Block system-authored internal implementation vocabulary from Customer Product
- [x] Add Case 4/6/7 fake recovery and Case 1/2/3/5/8/9 regressions with Provider calls 0
- [x] Add exact V17 controlled evidence provenance, authorization, runner selection, and V18 rejection
- [x] Preserve historical V15/V16 evidence, controlled inputs, Human artifacts, Prompt/catalog bytes, and `next-env.d.ts`
- [x] Dedicated verifier `PASS 23/23`; predecessor `PASS 31/31`; typecheck/lint/build/diff/protected `399`/sensitive/next-env PASS
- [ ] Exactly one implementation commit and normal push
- [ ] Human / ChatGPT review

No actual Provider, DB, Supabase, migration, Payment, deployment, PR, merge, or main operation is authorized or performed in this task.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-D-V17:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-D:BEGIN -->
## Q0 Consolidated Remediation — Implemented, Review Pending

- [x] Exact baseline `a02f8bb14232c5bd306aed23737846c8ea305a5b` and isolated branch
- [x] Preserve V1/V2 and connect functional-sufficiency V3 to V16 only
- [x] Use trusted structured combinations; no raw prose/keyword/fixture parsing
- [x] Preserve Safety, provenance, sent/unsent, Candidate, certainty, factual, contact, and one-question hard gates
- [x] Add typed selected-request Product-completeness checker
- [x] Reuse existing bounded V1-C reassessment; max attempt2, no attempt3
- [x] Consolidated actual-evidence verifier `PASS 31/31`: Cases 1-8 Ready; Case 9 one exact question then Ready
- [x] Negative/sparse/emotion-only/Candidate-only/topic-only/message-impact-without-Candidate regressions
- [x] Actual incomplete Case 4 attempt1 withheld; fake corrected attempt2 alone projected; incomplete attempt2 exhausts with no Report/attempt3
- [x] Exact Case 5/6 Candidate preservation
- [x] Closest immutable predecessor verifier `PASS 21/21` in one complete run
- [x] Typecheck, zero-warning lint, build, diff, protected `248`, sensitive, exact `10/10` scope
- [ ] Exactly one implementation commit and normal push
- [ ] Human / ChatGPT review

Status is `implemented_pending_human_chatgpt_review`. Provider/DB/Supabase/migration-apply/Payment/deploy are `0/0/0/0/0/0`; no Prompt/catalog/schema, UI/CSS, evidence, Production, main, or `next-env.d.ts` changes. Two isolated-clone setup invocations stopped before predecessor completion and performed no Provider work; the one complete predecessor run passed. R2-C remains `remediation_required`; `experienceProductJudgment=pending_remediation`; `jpy980RuntimeReadiness=not_established`; `globalQ0Completion=false`.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-D:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-C:BEGIN -->
## V1-C Evaluator / Recovery Successor — Accepted Complete

- [x] Accepted snapshot `a436210bb035746c129fe071e6225b3799b9e5d8`; ChatGPT/Human review `PASS_complete`; Human acceptance `complete`; acceptance date `2026-08-17`
- [x] Core snapshot `e7ae51aa96bbb3d1e791ac957e26bb8918d10547` remains `PASS 0/0/0`
- [x] Historical R1 initial review remains `NEEDS_CORRECTION 0/1/0`; R1-C1 review is `PASS 0/0/0`
- [x] Acceptance is deterministic infrastructure evidence only; actual Provider/Product quality remains unestablished
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-C:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-B:BEGIN -->
## V1-B PB-05 Semantic Depth Successor — Accepted Complete

- [x] Exact parent fixed at Human + ChatGPT accepted V1-A snapshot `d19d72e9a3f7e9fbbbd7fda9e11b131314030cea`
- [x] V1-A1, V1-A2, and V1-A overall synchronized as `accepted_complete`; V1-A2 acceptance date `2026-08-17`
- [x] Exact scope `18/18`: 10 UPDATE + 8 NEW; DELETE / RENAME 0
- [x] V13 identity fixed at catalog `v13.0.0`, Prompt bundle `v13.0.0`, unchanged Schema set `v6.0.0`, unchanged split topology
- [x] Common Prompt and PB-01/PB-01C/PB-02/PB-03/PB-04/PB-06 manifest-identical to V12
- [x] PB-05 only successor fixed at source `m2-p4-v1-b-semantic-depth-successor`, Prompt `v5.0.0`, existing Report schema
- [x] Self-contained PB-05 Prompt carries accepted V12 source, timing, contact, Product, field, draft, Application-grounding, and clarification responsibilities
- [x] Consultation core, evidence significance, decision logic, action artifact, and baseline emotional containment mandatory
- [x] At least one honest uncertainty or observable reassessment function required; alternative tradeoff remains conditional
- [x] Exact existing-field ownership fixed; Application owns relationship summary and change-condition grounding
- [x] No fixed word/sentence/section minimum; padding, repeated conclusion/reassurance, generic aftercare, and invented insight prohibited
- [x] Unsupported causality, chronology, hidden state, future reply, and relationship outcome prohibited
- [x] PB-04 exact final draft authority preserved; no Candidate reconstruction, second draft, persona/emoji/line-break normalization
- [x] V1-B non-repetition remains Prompt-generation intent; V1-C is a separate successor
- [x] V13 loader verifies V12 predecessor, common Prompt, seven stages, exact topology, PB-05-only change, hashes, schema compilation, and OpenAI compatibility
- [x] Service selects V13 internally; Pipeline classifies V13 as V1-A2, timezone-authority, and Candidate Grounding V2 capable
- [x] V12 no-clarification routing and one-answer clarification lifecycle retained; no second question or routing-state change
- [x] Migration `0007` only widens Runtime identity to V13/v6; historical pairs preserved; apply 0; migration `0006` unchanged
- [x] Dedicated verifier fixed at `38/38`; immutable V1-A2/upstream and Decision Policy evidence retained
- [x] R2-B UI/CSS, V2/V1 projections, Report/Decision schemas, PB-04/PB-06, Effective Decision Policy, Payment, and `next-env.d.ts` protected
- [x] Provider/DB/Supabase/migration-apply/Payment/deploy operations `0/0/0/0/0/0`
- [x] V1-B ChatGPT/Human review `PASS / complete`, Human acceptance complete on `2026-08-17`; accepted snapshot `e21c9b571426160703b1112c9057cc26c7738a0a`
- [x] V1-C Human/ChatGPT review and acceptance complete; V1-D Step 1 separately authorized
- [ ] Provider execution, R2-C re-review/PASS, Production Runtime, Payment, deploy, PR, or main integration — unauthorized

Status is `accepted_complete`. Provider prose quality, actual semantic non-repetition, Human feeling of being understood, `plausibly_worth_jpy980`, and Provider semantic fidelity remain unestablished. V1-C is accepted complete; V1-D Step 1 is accepted complete and Step 2A is `in_progress_controlled_provider_executor` with Provider execution unauthorized. R2-C remains `remediation_required`; `experienceProductJudgment=pending_remediation`; `jpy980RuntimeReadiness=not_established`; `globalQ0Completion=false`.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-B:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A2-IMPL:BEGIN -->
## V1-A2 Clarification Integration — Accepted Complete

- [x] Accepted R1 authority `9f397ed41f3f284e7a984ad139768af16373a747` synchronized; V1-A1 immutable
- [x] Exact implementation scope `37/37`: 14 UPDATE + 23 NEW; DELETE / RENAME 0
- [x] Review findings fixed: 1 BLOCKER / 5 MAJOR / 1 MINOR from implementation parent `3195c278d688bc866d2e0825df88cdf62b149547`
- [x] Exact correction scope `23/23`: 23 UPDATE + 0 NEW; DELETE / RENAME 0
- [x] Residual R2 finding fixed: `clarification_consumption_record_exceeds_actual_authority`, BLOCKER 0 / MAJOR 1 / MINOR 0, from R1 parent `a5e0c6b9e0a6f51d5534cf5d8a7ea72f54ec2203`
- [x] Exact R2 correction scope `10/10`: 10 UPDATE + 0 NEW; DELETE / RENAME 0
- [x] Shared actionable-topic and `message_impact` Candidate validation before request creation
- [x] V1-A1-compatible Policy V2 connected after Safety with cadence V2 copy correction
- [x] One-question/one-answer maximum, secure opaque capability, canonical fingerprint, same/different-answer behavior
- [x] Separate Clarification Evidence/Grounding provenance; no Base/currentSituation/Candidate mutation
- [x] Same-request awaiting→processing resume lifecycle and initial idempotency replay
- [x] Derived `EffectiveAssessmentAuthorityV1` and clarification-aware `EffectiveDecisionPolicyV1`
- [x] Clarification-aware PB-01/PB-04/PB-05/PB-06 without V1-B semantic-depth expansion
- [x] Resume reuse of immutable Base/Candidate/Safety; PB-01C/PB-02/PB-03 skipped deterministically
- [x] First-class ready / needs-more / not-full / Safety Runtime and Delivery V2 states
- [x] Migration `0006` created with atomic lifecycle RPCs; migration apply 0
- [x] Initial API, separate clarification answer API, accessible one-question UI, and customer-safe no-charge stops
- [x] Actual V12 PB-01/04/05/06 developer prompts self-contain accepted predecessor responsibilities plus clarification deltas
- [x] Bounded timing never creates exact minutes; trusted local datetime may derive exact minutes
- [x] Clarification overlay source paths resolve to deep-equal Grounding values; five provenance mutants fail closed
- [x] Deterministic downstream wiring and PB-06 fail-closed plumbing proven without claiming Provider semantic fidelity
- [x] Resume failure preserves actual accumulated model/usage and finalizes once in Pipeline
- [x] Historical resultJson-less needs-more/Safety completion compatibility preserved; V1-A2 first-class stops unchanged
- [x] Central concern answer is structured concern/explicit-none; none is non-resolving and creates no concern
- [x] Effective Decision Policy consumption claims limited to exact timing/cadence values actually projected into Decision Facts
- [x] Material concern and relationship intent excluded from current Effective Decision Policy consumption claims
- [x] PB-04/05/06 broad path-prefix inference replaced by exact six-target consumer matrix; material concern excluded from PB-04
- [x] Original 28 intentions and all 36 R1 intentions retained; seven matrix regressions expand offline fake fixtures to `43/43`
- [x] Human / ChatGPT implementation review `PASS / complete`; Human acceptance and V1-A2 acceptance complete on `2026-08-17`
- [x] Final accepted snapshot `d19d72e9a3f7e9fbbbd7fda9e11b131314030cea`; V1-A overall `accepted_complete`
- [x] V1-B implementation separately authorized; accepted V1-A2 behavior remains immutable predecessor authority
- [ ] V1-C/D, Provider execution, Production Runtime, Payment, deploy, PR, or main integration — unauthorized

Status is `accepted_complete`. Accepted V12 Runtime/persistence/API/UI/Prompt/Schema/catalog/migration behavior remains the V1-A predecessor. Provider semantic fidelity remains unestablished. Provider/DB/Supabase/migration-apply/Payment/deploy operations are 0/0/0/0/0/0. R2-C remains remediation_required; jpy980RuntimeReadiness remains not_established; globalQ0Completion=false.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A2-IMPL:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A2-PLAN:BEGIN -->
## V1-A2 R1 Effective Authority / Downstream Consumption Correction

- [x] Reviewed planning commit `ab99f003901475199fcb316264ecd02c4f2baef8`; review `NEEDS_CORRECTION`, BLOCKER 0 / MAJOR 1 / MINOR 2
- [x] Exact parent fixed at accepted V1-A1 snapshot `8db5c6386ed0b9b16f0d1586f47d384262cc502b`; main/origin-main `61e33a10e195fad17e253a6b9719217e1992f273`
- [x] V1-A1 ChatGPT/Human review `PASS / complete`, Human acceptance and V1-A1 acceptance complete on `2026-08-16`; V1-A1=`accepted_complete`
- [x] Base, Candidate, and Clarification Evidence fixed as three separate immutable authority lanes
- [x] Clarification provenance `user_clarification`; no `currentSituation` append, false Base source, Candidate contamination, or unrelated-field write
- [x] Same PB-01 stage successor selected; PB-01F/new stage prohibited; initial Base grounding reused immutably on same-request resume run
- [x] Clarification Evidence/Grounding contract, structural source integrity, target-limited grounding, and clarification Safety aggregation defined
- [x] Application-derived `EffectiveAssessmentAuthorityV1` defined with effective decision/writing/emotional contexts and per-value Base/Candidate/Clarification provenance
- [x] Derived authority is not a fact source; known Base override, Candidate contamination, unrelated-target change, and hidden propagation prohibited
- [x] `EffectiveDecisionPolicyV1` successor seam defined without mutating accepted Decision Policy files
- [x] Clarification-aware PB-04/PB-05/PB-06 Prompt successors selected as explicit additional-input consumers; existing output schemas reused
- [x] Hard invariant fixed: a clarification used to establish Ready cannot be discarded before materially relevant Product output; PB-06 failure is blocking
- [x] Six-target downstream consumer matrix and prohibited effects fixed
- [x] Persistence fixed as one request + zero/one clarification + one-or-more runs with `awaiting_clarification`, opaque continuation ID, duplicate-submit idempotency, and different-answer fail-close
- [x] First answer atomically transitions `awaiting_clarification → processing` and creates exactly one resume run; same-answer duplicate creates zero runs
- [x] Resume terminal mapping fixed to completed for ready/not-full/Safety and failed for technical failure; no return to awaiting
- [x] Opaque continuation capability fixed as cryptographically random/non-sequential with at least 128 bits unpredictability; request ID alone insufficient
- [x] One clarification maximum and automatic second clarification/loop prohibition preserved
- [x] `not_full_product_candidate` fixed as first-class completed no-charge stopped outcome, distinct from needs-more/failure/Safety/ready
- [x] `message_impact` Candidate requirement fixed under `M2_MESSAGE_IMPACT_CANDIDATE_REQUIRED`; missing Candidate consumes no clarification budget
- [x] Actionable anchors fixed exactly to decide_send_or_wait, draft_message, message_impact, next_three_days
- [x] relationship and organize_emotions fixed as supplementary-only; unanchored scope validation uses `M2_ACTIONABLE_TOPIC_REQUIRED` before request/Provider/budget
- [x] Six clarification target answer/grounding/Safety/provenance boundaries defined without raw-prose routing or unrelated field mutation
- [x] Cadence V2 copy aligned to relation answers: `今の待ち時間は、その相手の普段の返信ペースの範囲内ですか？` → within/beyond/unknown
- [x] Customer Delivery V2 states and separate opaque-ID answer endpoint planned; initial request body remains immutable
- [x] No-charge boundary preserved for needs-more, not-full, and Safety; Payment remains unauthorized
- [x] Future A2 implementation manifest recomputed at `37/37`: 14 UPDATE + 23 NEW; any change requires STOP and new review
- [x] Original planning scope retained at `10/10`; R1 correction scope fixed at `8/8`: 7 UPDATE + 1 NEW; DELETE / RENAME 0
- [ ] Human / ChatGPT review of V1-A2 R1 Effective Authority correction
- [ ] V1-A2 implementation, V1-B/C/D, Provider execution, Production Runtime, Payment, PR, or main integration — unauthorized

Status is r1_effective_authority_correction_defined_pending_human_chatgpt_review with V1-A2 implementation_authorized=false. PB-05 only receives clarification authority in the future package; V1-B semantic-depth implementation remains excluded. V1-A overall remains incomplete. R2-C=remediation_required; experienceProductJudgment=pending_remediation; jpy980RuntimeReadiness=not_established; globalQ0Completion=false. Current Product/Runtime/API/UI/DB/migration/Prompt/Schema/Catalog/Provider/PB-05/semantic/Payment implementation changes are 0; Provider / DB / Supabase are 0 / 0 / 0. next_action=human_chatgpt_review_of_v1_a2_r1_effective_authority_correction.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A2-PLAN:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A1:BEGIN -->
## V1-A1 R1 Materiality Correction — Accepted

- [x] Accepted snapshot `8db5c6386ed0b9b16f0d1586f47d384262cc502b`; original V1-A1 `65c245860813f6179689855b344dbf6fd425867a`
- [x] ChatGPT and Human review `PASS / complete`; Human acceptance and V1-A1 acceptance `complete` on `2026-08-16`
- [x] Emotion-only Product materiality false positive removed without raw-prose routing
- [x] Offline fixtures `16/16`; R1 verifier `25/25`; immutable original V1-A1 verifier `24/24`
- [x] Safety priority, one-total-question budget, no automatic second question, determinism, and malformed fail-closed behavior preserved
- [x] Exact R1 implementation scope `11/11`: 10 UPDATE + 1 NEW; DELETE / RENAME 0
- [x] V1-A1=`accepted_complete`; accepted policy remains immutable
- [ ] V1-A overall completion — pending V1-A2 implementation and review

V1-A1 acceptance authorizes no V1-A2 implementation, V1-B/C/D, Provider, Production Runtime, Payment, PR, or main integration.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A1:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-C-R1:BEGIN -->
## R2-C R1 JPY980 Value Architecture Boundary Correction

- [x] Exact correction parent and original planning commit 885d46db8bfbc2add4828b7205af9a9e3d6c009c, original planning parent d28fdf37f3e80f28a927a9f9dcc793cdd26b92e2, R2-B snapshot fa956b9b1941c73f8e1767c64ab24f07fadd36c6, R2-A acceptance 1229627588e3c6ccd41ea7ea32751b8b8ac79c6e, and main/origin-main 61e33a10e195fad17e253a6b9719217e1992f273 fixed
- [x] Current accepted directions recorded: Visual, Customer note architecture, draft utility, and overall content direction
- [x] Current remediation findings recorded: Semantic depth and Input sufficiency handling
- [x] R2-C remediation_required, experienceProductJudgment=pending_remediation, jpy980RuntimeReadiness=not_established, and globalQ0Completion=false preserved
- [x] Formal Human Visual unperformed items preserved as PENDING; no R2-C or Human Visual PASS declared
- [x] Safety-first Input Sufficiency Gate and four planning states defined
- [x] Existing needs_more_information reuse with one-total-question clarification budget, no automatic second question or loop, no pre-eligibility charge, and no insufficient-input Report/draft fixed
- [x] Budget exhaustion and non-material consultations terminate at not_full_product_candidate; Safety remains higher priority
- [x] emotional_containment promoted to mandatory baseline Ready function; additional emotional depth remains conditional
- [x] Analytical new-proposition and emotional/ritual distinct-function non-repetition contracts separated
- [x] simple, nullable, ordinary waiting, polite draft, and persona-preserved case routes defined
- [x] Pairwise-separated future Packages V1-A through V1-D corrected and seven boundary fixtures added without removing existing fixtures
- [x] Future Product re-review acceptance and maximum plausibly_worth_jpy980 meaning defined
- [x] Optional post-delivery follow-up question recorded as decision_pending and unauthorized
- [x] Exact correction scope fixed at 10/10: 9 UPDATE + 1 NEW; DELETE / RENAME 0
- [x] Original planning verifier remains immutable and must pass 18/18 at 885d46db8bfbc2add4828b7205af9a9e3d6c009c
- [ ] Human / ChatGPT review of this boundary correction
- [ ] Product, Prompt, evaluator, UI, Runtime, Provider, DB/Supabase, Payment, or future package implementation — unauthorized

Status is r2_c_remediation_required_jpy980_value_depth_r1_correction_ready_pending_human_chatgpt_review. This is planning-only and not an R2-C PASS. Formal Human Visual remains PENDING/incomplete; every future package is unauthorized. Provider / DB / Supabase are 0 / 0 / 0; Product snapshot and main remain unchanged. next_action=human_chatgpt_review_of_jpy980_value_depth_r1_correction.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-C-R1:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R1:BEGIN -->
## R2-A Acceptance / R2-B Implementation Authorization Sync

- [x] Exact sync parent `5070c02267f49e1e0095ce2e46fb106b886f7df5`; main/origin-main `61e33a10e195fad17e253a6b9719217e1992f273`
- [x] Authorized R2-A implementation snapshot preserved at exact seven-file scope
- [x] R2-A ChatGPT review `PASS / complete`
- [x] R2-A Human review `PASS / complete`
- [x] R2-A Human acceptance and R2-A acceptance `complete` on `2026-08-16`
- [x] Q0-A Doctrine, Package A/R1, Package B historical `10/10`, Provider marker, consumed authorization, and Active Runtime v4 preserved
- [x] R2-B implementation authorized only for the exact `9/9` manifest
- [x] Formal R2-B future branch fixed as `feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-r2-authorized-reassuring-note`
- [x] Accepted V2 and navy/paper/gold shell consumption, reduced hero, consultation-specific journey, facts/uncertainty separation, prominent exact-copy draft, immediate action, reassessment, closing, semantic section selection, below-six simple case, no padding, and reduced repetition fixed as the R2-B contract
- [x] Historical R2-B implementation and mobile-fix branches retained as read-only references; reset/overwrite/rebase/cherry-pick/force-push prohibited
- [ ] R2-B implementation — authorized but not performed by this sync
- [ ] R2-C execution/review — unauthorized; `not_ready_until_R2_B_acceptance`
- [ ] Provider rerun, DB/Supabase, Runtime activation, Production Runtime, Payment, R4, C2, PR, or main integration — unauthorized

Status is r2_a_human_chatgpt_accepted_complete_r2_b_implementation_authorized on chore/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-acceptance-r2-b-authorization. This exact acceptance sync is 8 UPDATE + 1 NEW and performs no R2-B implementation. R2-B may not change CustomerAssessmentExperienceProjectionV2, CustomerAssessmentProjectionV1, Full Report, Provider, Prompt, Catalog, Schema, PB-05, evaluator/semantic disposition, Safety UX, Payment, DB/Supabase/migration, Runtime activation, R2-C, or main. R2-C execution_authorized=false and review_authorized=false. experienceProductJudgment=not_established_pending_R2_C_human_product_review; jpy980RuntimeReadiness=not_established; globalQ0Completion=false; providerQualityEstablished=false. Provider / DB / Supabase / Runtime / Payment changes are `0 / 0 / 0 / 0 / 0`; main remains `61e33a10e195fad17e253a6b9719217e1992f273`. next_action=human_chatgpt_review_of_r2_a_acceptance_r2_b_authorization_sync.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R1:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P1:BEGIN -->
## M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P1 v12 Implementation Decomposition

- [x] Exact baseline 366b99b19ccf7f2aabe92fa760d07521de5e4104 and exact planning scope 11/11 fixed
- [x] Preflight passed with clean worktree, empty stash, HEAD=upstream, main=origin/main, frozen authorities unchanged, consumed authorization, and rerun_authorized=false
- [x] Forty-four source authorities fixed by Git blob SHA, raw SHA-256, and byte count
- [x] Legacy ready, split ready, safety_blocked, and needs_more_information shapes audited
- [x] Active v4 legacy and inactive v9-v11 split output compatibility mapped
- [x] Unsafe isCompleted narrowing, unchecked API cast, unchecked persisted-report cast, and masked runtime mismatch documented
- [x] Every RuntimeAssessmentNote field mapped across legacy/split/nullability/guard/failure/adapter
- [x] Presentation density separated into internal audit, persisted Product report, CustomerAssessmentProjection, and visual sections
- [x] Deterministic full report → CustomerAssessmentProjection → UI boundary defined
- [x] Payment state recorded exactly as absent and current/required Safety sequences mapped
- [x] Future Packages A through F fixed with pairwise-disjoint proposed paths, tests, gates, Provider requirements, and Human visual-review requirements
- [x] Offline acceptance matrix fixed at 24 cases with mandatory Product Owner successor-output review
- [ ] Human / ChatGPT review of the v12 implementation decomposition
- [ ] Any Package A-F implementation, Provider rerun, Runtime activation, R4, C2, PR, or main integration — unauthorized

Status is v12_implementation_decomposition_ready_pending_human_chatgpt_review. Provider / DB / Supabase are 0 / 0 / 0. Runtime, Prompt, Catalog, Schema, evaluator, semantic disposition, UI, API route, payment, fixtures, migrations, Active Service, Active Runtime, and main remain unchanged. next_action=human_chatgpt_review_of_v12_implementation_decomposition.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P1:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3:BEGIN -->
## M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3 Product Owner Decision and v12 Remediation Charter

- [x] Exact Product Owner Review Packet baseline fixed at f0b5dff36b63a9deaf5f87f8825911b0510ac0b1
- [x] Exact offline planning-only scope fixed at 11/11
- [x] Three strict UTF-8 source authorities fixed by Git blob SHA, raw SHA-256, bytes, JSON validity, U+FFFD count 0, and secret count 0
- [x] Existing Review Packet 11/11, frozen Evidence 10/10, and frozen Package 7/7 preserved
- [x] Pending Product Owner Artifact 16/16 null and frozen original Artifact 28/28 null preserved
- [x] Product Owner review completed for E-R3-01 through E-R3-04; E-R3-05 and E-R3-06 excluded because accepted_final_result is absent
- [x] Overall Product judgment recorded as not_ready_for_jpy_980_runtime_activation
- [x] P0 unsupported-causality, no-contact fail-closed, and pre-payment Safety UX requirements fixed
- [x] P1 proportionality, non-repetition, fact precision, chronology, anxiety-safe uncertainty, and draft prominence requirements fixed
- [x] Planning-only v12 Workstreams A through G fixed
- [x] Provider quality established / Provider rerun authorized / remediation implementation authorized recorded as false / false / false
- [ ] Human / ChatGPT review of the v12 remediation charter
- [ ] Provider rerun, v12 implementation, Runtime activation, R4, C2, PR, and main integration — unauthorized

Status is product_owner_review_complete_remediation_required and capabilities status is product_owner_review_complete_remediation_charter_ready. Provider / DB / Supabase are 0 / 0 / 0. Machine verdict, Protocol verdict, ChatGPT adjudication, marker, authorization, Runtime, Prompt, Catalog, Schema, Evaluator, semantic disposition, UI, migrations, Active Service, Active Runtime, and main remain unchanged.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R2:BEGIN -->
## M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R2 Evidence Adjudication and Product Owner Review Packet

- [x] Exact Evidence Commit B baseline fixed at `9e9bf7d90740c1d00bfc4e282c85906744cd736c`
- [x] Exact offline-only mutation scope fixed at `11/11`
- [x] Ten frozen sources recorded with Git blob SHA and raw SHA-256
- [x] Frozen Machine / Protocol / Hard / Product verdict preserved as `FAIL / PASS / FAIL / FAIL`
- [x] ChatGPT adjudication recorded separately: evaluator false positive `1`, PB-06 false positive `1`, genuine Product defect `1`, evaluator contract defect `1`
- [x] Accepted `final_result` only packet prepared for E-R3-01 through E-R3-04
- [x] E-R3-05 and E-R3-06 excluded as `棄却された中間生成物`; no intermediate output presented as Product
- [x] Product Owner rating artifact restricted to four cases with `16/16 null`
- [x] Six successor remediation candidates recorded as planning-only
- [ ] Product Owner review of accepted final results
- [ ] Provider rerun, remediation implementation, Runtime activation, R4, C2, PR, and main integration — unauthorized

Status is `chatgpt_evidence_adjudication_complete_product_owner_review_pending`. Provider quality remains unestablished. Provider rerun required-now / ready / authorized is `false / false / false`. This Task performs Provider / DB / Supabase `0 / 0 / 0` and does not change Runtime, Prompt, Catalog, Schema, migrations, Active Service, Active Runtime, or main. Next action is Product Owner review, not technical execution.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R2:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R1:BEGIN -->
M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R1 executed status is EXECUTED_PENDING_EVIDENCE_COMMIT on test/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r1-v11-provider-package. Package Commit A is 6eea601c99f18cbde62659140502d0456b0b505b; Provider attempts / completed calls are 37 / 37; machine verdict is FAIL. Product Owner review remains pending. Provider / DB / Supabase are 37 / 0 / 0. Authorization remains consumed after any attempted run and the marker remains present. Active Runtime and main remain unchanged; R4 and C2 remain unauthorized.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R1:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R2:BEGIN -->
## M2-P4-I3-R1-C1-R3-R2-E-R3-R2 Offline Authority, Constraint, and Review Integrity Remediation

- [x] Exact implementation scope fixed at `25/25`
- [x] Acceptance correction R1 fixed at exact `14/14` from `1fd102b7235481e3ee6bcd733744db5bb2887773`
- [x] Inactive v11 Catalog / Prompt bundle / Schema set created with split Stage order `7/7`
- [x] Application-owned `action_context` and separate `contact_constraint_policy` integrated only for v11
- [x] PB-01 v3 ordinary restriction omission corrected to `none / none / []`; genuine unknown reserved for an indicated but unclassifiable restriction
- [x] Candidate Grounding v2 composes and deep-clones accepted v1; non-conflicting parity and accepted-field-only normalization proven
- [x] Deterministic no-followup, unknown fail-closed, and bounded business-only constraint integrity added before PB-05
- [x] Decision Plan v2 limitations record incomplete personal-vs-business classification; PB-06 semantic validation remains required, with no Schema mutation or Japanese-substring policy
- [x] PB-01 prompt SHA-256 `620b73a7264dfc877f19b6708e59fe23e232d824952ead9d4a77eb6e6a55b06d` synchronized to the sole authorized Catalog field; v11 identity and Stage order `7/7` unchanged
- [x] Frozen E-R3 evidence independently audited; request/output hashes and response IDs `37/37`, forbidden input keys `0`
- [x] Corrected Product Review labels null-final Plan / Report as `棄却された中間生成物`
- [x] Offline fixtures `39/39`; timing `6/6`, contact constraint `13/13`, Candidate `10/10`, Runtime `5/5`, evidence review `5/5`
- [x] v9 / v10 parity `PASS / PASS`
- [x] Human / ChatGPT implementation review and acceptance — `IMPLEMENTATION ACCEPTED COMPLETE`
- [x] Acceptance sync exact `5/5`; non-sync implementation blobs unchanged `20/20`; dedicated verifier `93/93`
- [ ] Provider rerun, R4, C2, Runtime activation, PR, and main integration — unauthorized
- [ ] M2-P4-I3-R1-C1-R3-R2-E-R3-R3 — next candidate, unauthorized

Status is `human_chatgpt_accepted_complete` on `fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r2-authority-integrity`; accepted implementation / correction commits are `1fd102b7235481e3ee6bcd733744db5bb2887773` / `fba4c822f37856538d933957f26225b8e0adc521`. Human / ChatGPT result is `IMPLEMENTATION ACCEPTED COMPLETE`; the acceptance correction is accepted. The v11 Catalog / Prompt bundle / Schema set, Stage topology `7/7`, Application-owned `action_context`, `contact_constraint_policy`, ordinary `none / none / []`, genuine-unknown fail-closed behavior, Candidate Grounding v2 composition of accepted v1, bounded business-only guard, and corrected Product Review projection are accepted. Full personal/business semantic enforcement remains `false`, and PB-06 semantic validation remains required. Fixtures `39/39`, dedicated verifier `93/93`, and v9 / v10 parity `PASS / PASS` are accepted automated evidence. Frozen E-R3 evidence remains unchanged and its machine verdict remains `FAIL / 1 of 6`. Provider / DB / Supabase remain `0 / 0 / 0`; migrations remain unchanged and unapplied; Active Service and main remain unchanged. Provider quality is unestablished; Provider rerun readiness/authorization is `true / false`; Active Runtime activation, R4 readiness/authorization, C2 authorization, and next-candidate authorization are `false / false / false / false / false`. Next candidate is `M2-P4-I3-R1-C1-R3-R2-E-R3-R3`.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3-R2:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3:BEGIN -->
M2-P4-I3-R1-C1-R3-R2-E-R3 replacement package revision `R1` is `provider_product_diagnostic_failed_pending_human_chatgpt_review` on `test/m2-p4-i3-r1-c1-r3-r2-e-r3-r1-provider-product-diagnostic` from exact baseline `84ce1bce84f834c53bc46b5bb636ce77322da383`. Original Commit A `b909bf3ad259bea0251cf2f81e7a40d9262ce211` remains `aborted_before_execution` with Provider calls `0`, marker `false`, authorization consumed `false`, and no evidence Commit B. Replacement scope is `16/16`; Product cases / Quality doctrine / Provider budget changed are `false / false / false`; Provider calls expected / maximum / actual are `37 / 40 / 37`. Machine verdict is `FAIL`; Product Owner review is pending; Provider quality established is `false`. Migration 0005 is unchanged and unapplied, Active Service and main are unchanged, and Runtime activation / R4 / C2 remain unauthorized.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R2:BEGIN -->
## M2-P4-I3-R1-C1-R3-R2-E-R2 Directional Guidance and Semantic Materiality Revision

- [x] Accepted Product Doctrine and Product Owner decisions `4/4` preserved
- [x] Exact implementation scope fixed and implemented `21/21`
- [x] Inactive v10 Catalog / Prompt bundle with unchanged Schema set and split topology created
- [x] Grounding v2 and Semantic Disposition v4 created
- [x] PB-01, PB-01C, PB-04, PB-05, and PB-06 directional Prompt successors created
- [x] Frozen E PB-01 replay `8/8`; frozen assets and raw hashes unchanged
- [x] Synthetic Materiality fixtures `12/12`; v10 Fake flows `10/10`; v9 parity `3/3`
- [x] Migration 0005 created and statically validated
- [x] Human / ChatGPT implementation review and acceptance
- [ ] Provider retest — unauthorized
- [ ] R4 — HOLD / unauthorized
- [ ] Runtime activation, C2, PR, and main integration — unauthorized

Status is `human_chatgpt_accepted_complete`. Human / ChatGPT result: `IMPLEMENTATION ACCEPTED COMPLETE`. Accepted implementation commit `a66c82ac74775f5fcab3b8fce6ffb09f6dbd590f` fixes immutable snapshot `6b001a76c80747f60c69624d9d148465d2e1a963..a66c82ac74775f5fcab3b8fce6ffb09f6dbd590f` at exact `21/21`. Acceptance Sync scope is exact `6/6`; non-sync implementation blobs are unchanged `15/15`, frozen E assets are unchanged `11/11`, and accepted Product Direction non-sync blobs are unchanged `4/4`. Migration 0005 is accepted as an unapplied artifact; live DB compatibility is not established. Provider / DB / Supabase operations are `0 / 0 / 0`; Provider quality remains unestablished, Provider retest and E-R3 remain unauthorized, R4 and C2 remain unauthorized, and Active Service and main remain unchanged.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R2:END -->

<!-- M2-P4-I3-R1-C1-R3-R2-E-R1-R1:BEGIN -->
M2-P4-I3-R1-C1-R3-R2-E-R1-R1 is `human_chatgpt_accepted_complete` on `docs/m2-p4-i3-r1-c1-r3-r2-e-r1-r1-product-direction`; Human / ChatGPT result is `PRODUCT DIRECTION AND MATERIALITY DOCTRINE ACCEPTED COMPLETE`. The accepted content commit `32bb29f16e962918fefa313f3e04c440d9d948d9` is fixed; its immutable content snapshot `dcd34011bfc2638bc0a1f7bd9b965b9880497a40..32bb29f16e962918fefa313f3e04c440d9d948d9` is exact `10/10`, acceptance synchronization is exact `6/6`, and non-sync Product Direction blobs remain unchanged `4/4`. The Product Direction Doctrine is accepted, the E frozen machine result remains `FAIL / 6 of 14`, and the E-R1 responsibility postmortem is retained. Product Owner decisions `4/4` approved; Hard / Flexible / Product Outcome evaluation is adopted; the successor `frozen_case_passed` projection matches frozen `case_verdict` for `14/14`. Responsibility categories remain Evaluator `4`, Quality Contract `1`, Application bookkeeping `3`, Provider / Prompt `5`, unresolved `0`; Materiality remains blocking / conditional / nonblocking `5/2/6`. Provider Stage remains blocking / conditional / flexible / clean / unresolved `4/1/2/7/0`; Split Runtime pre-R4 remains blocked / conditional / locally-ready / unresolved `4/1/9/0`, where locally-ready is not R4-ready. Frozen E assets remain unchanged `11/11`. Provider quality remains unestablished and Candidate ready for isolated E2E remains `false`. E-R2 is ready but remains unauthorized; R4 remains HOLD. Provider calls `0`; DB / Supabase operations `0 / 0`. Active Runtime, main, and migration remain unchanged; migration is unapplied and Active Service is unchanged.
<!-- M2-P4-I3-R1-C1-R3-R2-E-R1-R1:END -->

<!-- M2-P4-I3-R1-C1-R3-R2:START -->
## M2-P4-I3-R1-C1-R3-R2 Candidate Source Isolation Architecture, R3-R2-A/B, and R3-R2-C

- [x] Candidate Source Isolation failure recorded separately from immutable R3/R3-R1 history
- [x] Decision B fixed: separate Base PB-01 and Candidate PB-01C Provider boundaries
- [x] Base-only Schema ownership, exact source-ref allowlist, and fail-closed Source Integrity planned
- [x] Application-owned exact `CandidateEnvelope` and absent/available/unavailable semantics planned through PB-06
- [x] PB-04/PB-05/PB-06 explicit CandidateEnvelope routing and PB-06 independent original-candidate fidelity validation planned
- [x] Candidate embedded-instruction signal, inert raw-data treatment, and separate Safety cross-channel routing planned
- [x] Application-canonical Base relationship/request fields fixed; Provider override and Base `proposed_message_present` prohibited
- [x] Production Source Integrity corrected to structural proof; arbitrary candidate-literal rejection prohibited; registered Sentinels test-only
- [x] Legitimate literal-overlap no-false-positive gate fixed alongside Candidate A/B/null counterfactuals
- [x] Authoritative parent-run `stage_topology_version` and R3-R2-C migration ownership fixed without modifying historical Stage rows
- [x] R3-R2-A through E exact future path manifests and sequential acceptance barriers fixed
- [x] A-through-E exact path counts and path lists preserved; any future manifest change is stop-and-re-scope
- [x] Exact Planning mutation scope fixed at `10/10`
- [x] Automated Planning validation PASS
- [x] Human / ChatGPT result: `PLANNING PACKAGE ACCEPTED COMPLETE`
- [x] Accepted Planning content commit `212720bba2ebb805da9ef701d645359a6bd470a7`
- [x] Immutable Planning snapshot exact `10/10`: `df03cc2cc374ed059d40c122788e736f75883758..212720bba2ebb805da9ef701d645359a6bd470a7`; working tree excluded
- [x] Acceptance synchronization exact `5/5`; five accepted Planning blobs and A-through-E manifests unchanged
- [x] R3-R2-A implementation authorized in exact scope `10/10` from `7a4e5d3187e1731d677cc5aa19c23acdeb535ed8`
- [x] Base Provider Schema `pipeline-schema-base-v1.0.0` and Candidate Provider Schema metadata `pipeline-schema-candidate-v1.0.0` created as closed Draft 2020-12 contracts
- [x] Base source-ref allowlist `3/3`, Candidate Safety union `29/29`, and exact four-state `CandidateEnvelope` fixed in machine-verifiable contracts
- [x] `legacy-six-v1` and `split-base-candidate-v1` topology constants and JSON contract agree `2/2`
- [x] Dedicated verifier: exact scope `10/10`, JSON `4/4`, AJV `2/2`, valid `2/2`, invalid expected failures `18/18`, protected diff `0`
- [x] Typecheck, lint with warnings `0`, production build, and `git diff --check` PASS
- [x] M2-P4-I3-R1-C1-R3-R2-A Human / ChatGPT result: `IMPLEMENTATION ACCEPTED COMPLETE`
- [x] Accepted implementation commit `2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f`
- [x] Immutable implementation snapshot exact `10/10`: `7a4e5d3187e1731d677cc5aa19c23acdeb535ed8..2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f`; working tree excluded
- [x] Acceptance synchronization exact `6/6`; four implementation blobs and five accepted Planning blobs unchanged
- [x] R3-R2-B exact `13/13` implementation authorized from accepted A baseline `be78f8930475e42d9a746a6754bc9e2f34c5aad0`
- [x] Base Provider projection, Base grounding, and byte-equivalent deep-cloned Base Legacy View implemented without Candidate input
- [x] Candidate Provider projection and explicit field-by-field Candidate analysis / separate Safety allowlist grounding implemented
- [x] Base and Candidate Source Integrity implemented with structural keys, provenance allowlists, recursive ownership exclusion, and no arbitrary literal scan
- [x] CandidateEnvelope constructors and Safety cross-state consistency implemented `4/4`; Split Envelope keeps Base and Candidate as siblings
- [x] Synthetic fixtures fixed at valid `15`, invalid expected-failure `35`, and mutation rejection `10`
- [x] M2-P4-I3-R1-C1-R3-R2-B Human / ChatGPT result: `IMPLEMENTATION ACCEPTED COMPLETE`
- [x] Accepted implementation commit `ef5c6db66da77deebb9ad0d5498fe69ec584aad8`
- [x] Immutable implementation snapshot exact `13/13`: `be78f8930475e42d9a746a6754bc9e2f34c5aad0..ef5c6db66da77deebb9ad0d5498fe69ec584aad8`; working tree excluded
- [x] Acceptance synchronization exact `6/6`; seven non-sync implementation blobs `7/7`, accepted A implementation blobs `4/4`, accepted A acceptance state, and accepted Planning blobs `5/5` unchanged
- [x] Dedicated verifier, typecheck, lint with warnings `0`, production build, protected diff `0`, and `git diff --check` PASS
- [x] R3-R2-C exact `23/23` implementation authorized and completed from baseline `93893d78b58463b067a1419e8bf7056540636921`
- [x] Inactive Catalog v9 / Prompt bundle v9 / Schema set v4 / exact split seven-stage topology implemented without Active Service switch
- [x] PB-01 Base and PB-01C Candidate routing, absent skip, degraded continuation, Candidate Safety fail-close, and cross-channel Safety implemented
- [x] Application-owned transient Policy projection, split Plan/Report v2, PB-06 fidelity authorities, and major/critical fail-close implemented
- [x] Topology persistence and `skipStage` repository contract implemented; migration `0004` created and statically validated but not applied
- [x] Synthetic routing fixtures `16/16`, Fake split scenarios `11`, mutation rejection `17/17`, payload routing `7/7`, and legacy parity PASS
- [x] Dedicated verifier, Policy `40/40`, typecheck, lint warnings `0`, build, protected blob gates, and `git diff --check` PASS
- [x] R3-R2-C-R1 Human / ChatGPT review correction implemented in exact scope `13/13`; original C cumulative scope remains `23/23`
- [x] PB-01 Base semantic responsibility, PB-04 Decision product quality, PB-05 Report field/voice, and PB-06 validation-quality parity restored; four predecessor accepted Prompts unchanged
- [x] PB-01C start/complete/fail/skip persistence ownership corrected to fail only as `M2_STAGE_PERSISTENCE_FAILED`, with no Candidate Safety/degraded/`safety_blocked` reclassification or duplicate Stage-failure write
- [x] Existing `99` checks, `17/17` mutations, and `16/16` routing fixtures retained; persistence fixtures `4/4`, Fake split scenarios `15`, and Prompt parity assertions PASS
- [x] M2-P4-I3-R1-C1-R3-R2-C Human / ChatGPT result: `IMPLEMENTATION ACCEPTED COMPLETE`
- [x] Accepted corrected implementation commit `7e09b540220eac3b0afb91bc9cfb822cc0ab632d`; initial implementation commit `3afb05ad37073b6b95e872c2e34360341c2542dc`
- [x] Immutable cumulative snapshot exact `23/23`: `93893d78b58463b067a1419e8bf7056540636921..7e09b540220eac3b0afb91bc9cfb822cc0ab632d`; working tree excluded
- [x] Immutable review-correction snapshot exact `13/13`: `3afb05ad37073b6b95e872c2e34360341c2542dc..7e09b540220eac3b0afb91bc9cfb822cc0ab632d`; working tree excluded
- [x] Acceptance synchronization exact `6/6`; non-sync implementation blobs `17/17` unchanged; accepted A `4/4`, B `7/7`, Planning `5/5`, and predecessor Prompts `4/4` unchanged
- [x] Dedicated verifier `154` checks, fixtures `20/20`, mutations `17/17`, Fake split scenarios `15`, payload routing `7/7`, Policy `40/40`, typecheck, lint warnings `0`, build, and `git diff --check` PASS
- [x] R3-R2-D exact `10/10` Offline Counterfactual and Historical Regression authorized and implemented from accepted C baseline `9d2bd94a2629d97197c6ffbb0608ec573b9b824a`
- [x] Candidate A / B / null Base Request, grounded Base Intake, and Base Legacy View byte identity established; registered Sentinel and Base optional source-ref counts `0`
- [x] Hard counterfactual gates `14/14`, accepted negative mutants `7/7`, legitimate literal overlap `PASS`, and null Candidate PB-01C calls `0` with persisted `skipped` state
- [x] Active Catalog v4 legacy-six replay `4/4 PASS`: ready parity, safety stop, PB-05 failure stop, and duplicate behavior; PB-01C legacy calls `0`
- [x] Fake split / legacy Stage invocations `20 / 20`; external Provider / DB / Supabase operations `0 / 0 / 0`; migration unchanged and unapplied
- [x] R3-R2-D dedicated verifier `47` checks, Policy `40/40`, typecheck, lint warnings `0`, build, exact scope `10/10`, protected blob gates, and `git diff --check` PASS
- [x] R3-R2-D Human / ChatGPT result: `OFFLINE COUNTERFACTUAL ACCEPTED COMPLETE`
- [x] Accepted implementation commit `8b9b4a4dff2992483266a3fb9bbc80b183091b2e`; immutable implementation snapshot exact `10/10` for `9d2bd94a2629d97197c6ffbb0608ec573b9b824a..8b9b4a4dff2992483266a3fb9bbc80b183091b2e`, working tree excluded
- [x] Acceptance synchronization exact `6/6`; non-sync evidence blobs `4/4` unchanged; accepted Planning `5/5`, A `4/4`, B `7/7`, C non-sync `17/17`, and Active v4 assets `19/19` unchanged
- [x] Acceptance-aware verifier `54` checks including retained original `47`; deterministic replay, hard gates `14/14`, mutants `7/7`, historical regression `4/4`, legitimate overlap, Policy `40/40`, typecheck, lint warnings `0`, build, and `git diff --check` PASS
- [x] R3-R2-E Bounded Split-Stage Provider Diagnostic — frozen `FAIL / 6 of 14`; execution protocol accepted
- [x] R3-R2-E-R1 Frozen Provider Diagnostic Postmortem — retained at baseline `dcd34011bfc2638bc0a1f7bd9b965b9880497a40`
- [x] R3-R2-E-R1-R1 Product Direction Doctrine and Product Owner Decision Sync — `human_chatgpt_accepted_complete` at accepted content commit `32bb29f16e962918fefa313f3e04c440d9d948d9`; Product Owner decisions `4/4` approved; Hard / Flexible / Product Outcome evaluation adopted; successor `frozen_case_passed` corrected
- [ ] R3-R2-E-R2 Semantic Responsibility Revision — unauthorized
- [ ] R4 Isolated Full Runtime E2E — HOLD
- [ ] C2 Runtime activation — HOLD

Current R3-R2-C status remains `human_chatgpt_accepted_complete` at accepted corrected implementation commit `7e09b540220eac3b0afb91bc9cfb822cc0ab632d`. R3-R2-D is `human_chatgpt_accepted_complete` at accepted implementation commit `8b9b4a4dff2992483266a3fb9bbc80b183091b2e` on `test/m2-p4-i3-r1-c1-r3-r2-d-counterfactual-regression`; it establishes only offline Candidate source isolation, A/B/null Base invariance, legitimate-overlap no-false-positive behavior, and Active v4 legacy-six regression. R3-R2-E subsequently executed with frozen `FAIL / 6 of 14`; E-R1 is retained, and E-R1-R1 Product Direction Sync is `human_chatgpt_accepted_complete` with Product Owner decisions `4/4` approved. Provider quality, migration application, live DB compatibility, isolated E2E readiness, Active Service activation, production readiness, and Milestone 2 completion remain unestablished. E-R1-R1 Provider / DB / Supabase operations are `0 / 0 / 0`; migration remains unapplied, Active Service remains catalog v4, Active Runtime is not activated, and `main` is unchanged. E-R2 is ready but remains unauthorized; R4, C2, E1, PR, and main merge remain unauthorized.
<!-- M2-P4-I3-R1-C1-R3-R2:END -->

<!-- M2-P4-I3-R1-C1-R3-R1:START -->
## M2-P4-I3-R1-C1-R3-R1 Offline Evidence Adjudication and Context-Inference Canonicalization

- [x] Exact `13/13` implementation scope fixed from R3 Commit B `34a21c2a6acdec6b6208cacd2182f2e40302813f`
- [x] Frozen R3 evaluator, results, evidence, Prompt v7, catalog v8, Schema, outputs, and response IDs preserved
- [x] Practical-reason `kind/active` subset adjudication applied on raw and grounded surfaces: `4/4`
- [x] R3-08 `other / current_situation_explicit` accepted without permitting `optional_message` or `relationship_chip`
- [x] R3-03/R3-07 unresolved or unknown context inferences canonicalized; known resolved inference order preserved
- [x] Offline exact-eight replay passed Schemas, both Integrity gates, Decision Facts, semantic core, ownership, candidate, relationship, privacy, and case gates
- [x] Provider calls / output mutations / expected-data injection: `0 / 0 / 0`
- [x] Candidate pipeline confirmation passed; candidate ready for separately authorized isolated E2E
- [ ] Human / ChatGPT review
- [ ] M2-P4-I3-R1-C1-R4 Isolated Candidate Runtime E2E — unauthorized
- [ ] C2 Runtime activation — unauthorized

Current automated status is `offline_adjudication_passed_pending_human_chatgpt_review`. The frozen R3 verdict remains `EVALUATION_BLOCKED`; Provider semantic quality is established only for `exact_eight_case_pb01_v7_semantic_suite`. Active Runtime and `main` are unchanged. R4, C2, E1, PR, main merge, release, and Provider rerun remain unauthorized.
<!-- M2-P4-I3-R1-C1-R3-R1:END -->

<!-- M2-P4-I3-R1-C1-R3:START -->
## M2-P4-I3-R1-C1-R3 Final Eight-Case PB-01 Provider Confirmation

- Status: `evaluation_blocked_pending_human_chatgpt_review`
- Baseline / branch: `3a56237a251bbc072ea34304a021c026fb7486f1` / `test/m2-p4-i3-r1-c1-r3-final-eight-case-provider-confirmation`
- Scope: exact `17/17`; post-run mutable `8/8`
- Authorization: exact eight synthetic PB-01 v7 calls; retry / repair / fallback `0 / 0 / 0`; rerun `false`
- Commit A: `86d990a791a48dbb552f1b2eacc2011e7e8fa380`
- Calls actual / completed: `8/8` / `8/8`; authorization and marker consumed; rerun `false`
- Frozen cases: `2/8`, non-final because the practical-reason evaluator compared a full object to a `kind/active` subset and rejected valid `deadline` fields
- Schemas / Writing Context Integrity / Decision Facts / ownership / boundary / candidate / grounding: `8/8`
- Contextual intake Integrity / semantic core: `6/8` / `7/8`
- Known taxonomy / no-contact ownership / quoted ownership / principal R3-08 ownership: PASS
- Provider quality / isolated-E2E readiness: `false / false`
- Active Runtime changed: `false`; C2 remains unauthorized
- Next: Human / ChatGPT review only; no offline reevaluation, Provider rerun, Runtime activation, or C2
<!-- M2-P4-I3-R1-C1-R3:END -->

<!-- M2-P4-I3-R1-C1-R2-R2-R1:START -->
## M2-P4-I3-R1-C1-R2-R2-R1 Current Gate

- [x] Exact 13-path offline practical-reason consistency revision implemented
- [x] Inactive PB-01 Prompt v7 and catalog v8 created without Schema change
- [x] Concrete current-situation schedule evidence and cross-projection agreement required
- [x] Candidate-only and `optional_message` schedule inference prohibited
- [x] Targeted repairs `3/3` and ownership sequence preserved from immutable R2-R2 evidence
- [x] Provider calls and Provider-output mutations held at `0 / 0`
- [x] Active Runtime, Decision Policy, Application grounding, and protected Production paths unchanged
- [x] Human / ChatGPT acceptance complete at `b65af5303d0f1514742b794a00ce35f5c4a99bf4`
- [x] Immutable implementation snapshot `13/13` and acceptance sync `8/8` verified
- [ ] Final eight-case PB-01 Provider confirmation — unauthorized
- [ ] C2 Runtime activation — unauthorized

Current status: `human_chatgpt_accepted_complete`; accepted implementation commit `b65af5303d0f1514742b794a00ce35f5c4a99bf4`; immutable snapshot `33a91f00be9f71fa533c9635d30425dc23914d81..b65af5303d0f1514742b794a00ce35f5c4a99bf4` exact `13/13`; acceptance sync exact `8/8`. Prompt v7 requires an evidence-backed incoming schedule question or coordination need to project `schedule_coordination / true` while permitting `question` versus `schedule_coordination` only as a taxonomy difference that preserves the practical function. Catalog v8 is inactive and PB-02 through PB-06 remain deep-equal to catalog v7. Prompt v6/v7, catalog v7/v8, accepted R2-R2 evidence, Provider Schema v5, grounded Schema v4, Application grounding, Integrity v2, Decision Policy, Pipeline, Service, UI, Supabase, active catalog v4, and `main` remain unchanged by acceptance sync. Provider calls/output mutations remain `0/0`; Provider quality is unestablished; final eight-case Provider confirmation remains required and unauthorized; C2 remains unauthorized.
<!-- M2-P4-I3-R1-C1-R2-R2-R1:END -->

<!-- M2-P4-I3-R1-C1-R2-R2:START -->
## M2-P4-I3-R1-C1-R2-R2 Current Gate

- [x] Exact four-case PB-01 Prompt v6 diagnostic package prepared in exact 17-path scope
- [x] Commit A 36e7d1967a502f0ed80aaccb12d44507f0058560 validated and pushed
- [x] One-time sequential Provider execution completed at exact 4 / 4 calls
- [x] Post-run evidence synchronized within the exact eight-path mutable scope
- [x] Human / ChatGPT review completed with frozen verdict FAIL
- [x] Immutable diagnostic snapshot 17 / 17 and review sync 8 / 8 verified
- [x] Saved-evidence Decision Policy equivalence verified without evidence rewrite

Current status: `human_chatgpt_reviewed_fail_complete`; frozen verdict `FAIL` and cases `3 / 4`. Targeted repairs are accepted `3 / 3 PASS`; principal quoted ownership and R2R2-04 ownership sequence are PASS. R2R2-04 is `decision_policy_equivalent_but_semantically_incomplete`, not an ownership regression: actual and comparison-only Decision Facts both produce `reply_now / unanswered_meaningful_message`, while semantic completeness and the frozen normal control remain FAIL. Immutable execution snapshot is exact `17/17`; review sync is exact `8/8`; nine execution artifacts remain unchanged. Calls remain `4/4`, additional calls `0`, authorization and marker consumed, rerun unauthorized, Provider quality unestablished, full eight-case confirmation required, Active Runtime and `main` unchanged, C2 unauthorized, and next candidate `M2-P4-I3-R1-C1-R2-R2-R1 Offline Practical Reason Consistency Revision` unauthorized.
<!-- M2-P4-I3-R1-C1-R2-R2:END -->

## Status Rule

Historical completed work is preserved below. Current delivery sequencing is controlled by `docs/ROADMAP.md`. A checked historical planning item does not authorize a later implementation. Milestone 1 has satisfied its validation and Human acceptance gates; Milestones 2–9 remain incomplete, and no work beyond an explicitly authorized bounded task may start.

Current state: Milestone 1 is Human-accepted, complete, and closed. M2-P1 and M2-P2-A are accepted and complete. M2-P2-B0 through M2-P2-B1-B2-B0 are retained as paused internal QA tooling. M2-P3 Runtime Vertical Slice is fully complete after successful-run DB integrity verification passed; Milestone 2 remains incomplete. The M2-P4 planning package and I1-A through I2 are Human / ChatGPT accepted and complete. I1-C's accepted implementation stack is the immutable exact 27-path range `c27120eea067f91c5e9ef4447e382f55a329e158..b523349ec33c36a90c645d4a1b7a6d37832af151`; I2's accepted implementation is the immutable exact 16-path range `20d4178e3a63026128f3a25d052196c7161e7e27..410714875903ae61b5bcdc6cce90030f5679b3b3`. Desktop and 399px mobile I2 Visual QA passed with horizontal overflow and clipping `0`. I3 is offline accepted at `c85d6d122ad71569532a55887b9a3b6d93f8a288`, and one synthetic live smoke succeeded, while final I3 acceptance and merge to `main` remain pending. I3-R1 Final Planning is Human / ChatGPT accepted complete at `3c64e5e2179b4c03979119068716326337a002c6`; its immutable exact `12/12` path snapshot is `ec7cd53884ab4056c78d2596c609baef5701274a..3c64e5e2179b4c03979119068716326337a002c6`, and the review correction is resolved. R1-A is Human / ChatGPT accepted complete at `8030c0b7778ccea3d7d90cbffcf21ac9c1052bcd`; its immutable exact 18-path contract-only snapshot is `e5cfd903740267db6d070964a9ec72a7d823f310..8030c0b7778ccea3d7d90cbffcf21ac9c1052bcd`, and its verifier-only self-correction is resolved without scope expansion or force push. R1-B is Human / ChatGPT accepted complete at `4a1237ac647bff79229d7181d978d5613c2c3b87`; its immutable exact 22-path snapshot is `2381312ced5fc726dfa245632c25da6bb68a376f..4a1237ac647bff79229d7181d978d5613c2c3b87`, and its exact `9/9` review correction is resolved. Candidate catalog v5 remains inactive, active Service stays on catalog v4 / schema set v3, downstream receives the v3 legacy view, and Decision / Report remain unchanged. The C1 bounded execution protocol is Human / ChatGPT accepted complete with immutable evidence and product-quality verdict `FAIL`; R1-C1-R2 remains reviewed `FAIL / 5/8` with consumed authorization, and its offline R1-C1-R2-R1 Prompt-contract revision is Human / ChatGPT accepted complete at `378c304c45b85cf419d263204e495f2d800a8bc9`. The later R2-R2 diagnostic is `human_chatgpt_reviewed_fail_complete`: targeted repairs `3/3 PASS`, ownership sequence PASS, Policy equivalence PASS, Decision Facts semantic completeness FAIL, and frozen verdict FAIL. R2-R2-R1 is now Human / ChatGPT accepted complete at `b65af5303d0f1514742b794a00ce35f5c4a99bf4`, with immutable exact `13/13` implementation and exact `8/8` acceptance sync. Provider quality remains unestablished; rerun, final eight-case confirmation, C2, Supabase, holdout, and E1 remain unauthorized or unstarted, and C2 eligibility is false.

R1-C1 current update: Human / ChatGPT accepted the bounded execution protocol as complete and confirmed product-quality `FAIL`. Immutable execution snapshot `76c469db264cd1cb9434b6a19ec5c75db5754a2a..7b0c1b6da5d877f7a7a6de5be431276452e3b8b2` is exact `21/21`; Provider calls `12/12`, retry / repair / fallback `0`; raw and grounded Schema `12/12`, v4 Writing Context Integrity `0/8`, v3 contextual Integrity `3/4`. Style evidence is unavailable and soft assertion `0/0` is not positive evidence. C2 eligibility and authorization are false; no paid rerun is authorized.

## P0: Repository Setup

- [x] Git repository initialized
- [x] GitHub private repository created
- [x] Initial docs created
- [x] First commit pushed

## P1: Product Spec

- [x] PRODUCT_SPEC.md finalized for its historical phase
- [x] DEVELOPMENT_FLOW.md created as historical planning context
- [x] ROADMAP.md created
- [ ] GO_NO_GO.md finalized
- [ ] VALIDATION_PLAN.md finalized

## P2: Phase 0 Assets

- [x] Initial consultation dataset template created
- [x] Judgment criteria table created
- [x] Golden sample format created
- [x] External evaluation sheet created
- [x] Forbidden copy checklist finalized
- [x] Safety branching checklist finalized
- [x] Phase 0 runbook created

## P2.5: Phase 0 Working Files

- [x] Consultation cases working file created
- [x] Judgment work table created
- [x] Golden sample drafts file created
- [x] External evaluator recruitment copy created
- [x] Payment provider inquiry copy created
- [x] Phase 0 decision log created

## P2.6: Human-approved Phase 0 Case Design

- [x] Initial 10 consultation case outlines approved
- [x] Initial 5 safety case outlines approved
- [x] Initial judgment boundaries approved
- [x] Consultation cases working file updated
- [x] Judgment work table updated
- [x] Phase 0 decision log updated

## P2.7: Result Presentation Spec

- [x] Result presentation spec created
- [x] Diagnosis page structure defined
- [x] Saveable image card structure defined
- [x] LP/X sample image direction defined
- [x] G001 presentation notes added

## P2.8: Approved Golden Samples

- [x] G001 full diagnosis approved and documented
- [x] G001 saveable image card copy approved and documented
- [x] G001 LP/X sample copy approved and documented
- [x] G002 full diagnosis approved and documented
- [x] G002 saveable image card copy approved and documented
- [x] G002 LP/X sample copy approved and documented
- [x] G003 full diagnosis approved and documented
- [x] G003 saveable image card copy approved and documented
- [x] G003 LP/X sample copy approved and documented

## P2.9: External Evaluation Package

- [x] Evaluator package created
- [x] Evaluation form questions created
- [x] Evaluation results template created
- [x] Recruitment message created
- [x] Phase 0 external decision rule created

## P3: Historical Phase 1 Validation Setup — Superseded as Current Sequence

These items record early setup ideas. They do not control the Milestone 1–9 sequence.

- [x] Payment provider inquiry templates created later under P4.8
- [x] LP copy/static LP completed later under P4.1
- [x] Request-form draft/UI completed later under P4.2
- [ ] Feedback form draft; remapped to Milestone 1 review planning and Milestone 5 persistence
- [ ] Delivery template draft; remapped to Milestone 1 sample output and Milestone 5 delivery

## P3.1: Historical Phase 1 Sales MVP Specs

- [x] Phase 0 Founder Override decision recorded
- [x] MVP scope defined for the historical plan
- [x] LP structure defined
- [x] Order form spec defined
- [x] Payment flow defined
- [x] Delivery workflow defined
- [x] Quality checklist defined
- [x] Metrics template defined
- [x] Phase 1 runbook defined

## P3.2: Historical Automated Public MVP Revision

Completed planning record; current sequencing is superseded by `docs/ROADMAP.md`.

- [x] Phase 1 MVP corrected from semi-manual to automated public MVP at that time
- [x] Automated public MVP spec created
- [x] Automation architecture created
- [x] Draft data model created
- [x] Development QA mode defined
- [x] Historical MVP scope updated
- [x] Form/payment/delivery docs updated for automation
- [x] Quality checklist updated for automation readiness
- [x] Metrics updated for automation

## P3.3: Historical Automated MVP Implementation Plan

Completed planning record; it does not authorize implementation outside Milestones 1–9.

- [x] README updated for automated public MVP direction at that time
- [x] Implementation plan created
- [x] Route structure created
- [x] Environment variable plan created
- [x] Integration staging plan created
- [x] Implementation WBS created
- [x] Acceptance criteria created

## P4: Completed Foundations

### P4.1: Stage 1 Project Bootstrap + Static LP

- [x] Next.js project foundation created
- [x] TypeScript configured
- [x] Tailwind CSS configured
- [x] Static LP implemented at `/`
- [x] Responsive layout added
- [x] CTA placeholder added
- [x] Safety/AI/refund notes displayed
- [x] No backend/API integrations added
- [x] Build passed at Stage 1 acceptance

### P4.2: Stage 2 Request Form UI

- [x] Stage 1 acceptance recorded
- [x] `/request` page created
- [x] Basic information fields added
- [x] Relationship and message-context fields added
- [x] Emotion/outcome fields added
- [x] Safety-screening UI added
- [x] Consent checkboxes added
- [x] Client-side validation added
- [x] Local-only confirmation state added
- [x] LP CTA updated to `/request`
- [x] No backend/API integrations added

### P4.3: Stage 3 Data Foundation Revision

- [x] Stage 2 acceptance recorded
- [x] Payment-provider risk note created
- [x] Provider sync/source-of-truth policy created
- [x] Stage 3 data-foundation scope created
- [x] Data model strengthened for purchases, credits, entitlements, provider events, and AI logs
- [x] Stage 3 plan, WBS, and acceptance criteria updated

### P4.4: Stage 3 Supabase Data Foundation

- [x] Supabase package added
- [x] `.env.example` created
- [x] Supabase helper files created
- [x] Stage 3 migration created
- [x] `reading_requests`, `safety_checks`, `readings`, `purchases`, `credit_ledger`, `entitlements`, `provider_events`, `ai_generation_logs`, `email_deliveries`, and `feedback` tables defined
- [x] RLS enabled without public policies
- [x] No OpenAI/payment/email/API integration added
- [ ] Production request persistence/public database-write connection; deferred to Milestone 5

### P4.5: Stage 4 Deterministic Safety Foundation

- [x] Stage 3 acceptance recorded
- [x] Safety types, reason codes, and deterministic rules created
- [x] Request form uses local safety classification
- [x] Rejected-level issues block local confirmation
- [x] Needs-review issues show warning
- [x] No DB persistence, API route, OpenAI, payment, or email added
- [ ] Production server safety enforcement; deferred to Milestone 5

### P4.6: Legal / Compliance Foundation

- [x] Stage 4 acceptance recorded
- [x] Compliance, prohibited-copy, safety, input, AI-minimization, provider-inquiry, payment-confirmation, and legal-page requirements documented
- [x] No payment implementation started

### P4.7: Legal Page Drafts and Operator Decisions

- [x] Japanese legal-page drafts created
- [x] Operator placeholders and decision register created
- [x] Unknown provider facts remain explicit
- [x] Publication gate created
- [x] No legal draft published

### P4.8: Provider Inquiry Preparation

- [x] Operator decisions explained
- [x] Provider inquiry drafts prepared
- [x] Evidence log, scorecard, and provider-selection gate prepared
- [x] No inquiry sent
- [x] No provider selected
- [x] No payment implementation started

### P4.9: Task 18C-R1 Age Eligibility Policy Alignment

- [x] `回答しない` removed from request-form age choices
- [x] Required boolean self-attestation `私は18歳以上です` aligned across current accepted B2 specifications; Production enforcement remains pending
- [x] 18-or-older notice added near the age field
- [x] Separate age checkbox rejected by policy
- [x] Date-of-birth and identity-document collection excluded
- [x] Future production server validation requirement recorded
- [x] No provider inquiry or payment/API/OpenAI/email implementation added
- [x] Human acceptance of Task 18C-R1

### P4.10: Task 18C-R2 Service Positioning and Classification Alignment

- [x] Canonical service-positioning document created
- [x] Product, public copy, result, AI, legal/compliance, and provider-inquiry language aligned
- [x] Historical Phase 0 evidence preserved and classified
- [x] No provider inquiry sent
- [x] No provider approved or selected
- [x] No payment/OpenAI/email/API/server-action implementation added
- [x] Human acceptance of Task 18C-R2

## P4.11: Human Accepted — Task 18C-R3 Roadmap Reset and Delivery Lane Alignment

- [x] `docs/ROADMAP.md` reset as authoritative Milestone 1–9 roadmap
- [x] Initial MVP completion fixed at first verified real purchase
- [x] Completed foundations separated from runtime integrations
- [x] Implementation plan and implementation WBS aligned
- [x] Parent WBS and acceptance criteria aligned
- [x] Current focus, handoff, and review record aligned
- [x] Stale controlling statements classified and corrected
- [x] Documentation-only boundary preserved
- [x] Human acceptance of Task 18C-R3

## P4.12: Human Accepted — Task M1-P1 Reviewable Web MVP Planning and Specification

- [x] Exact route inventory and review journey specified
- [x] Route, inline-state, fixture-route, and review-preview ownership specified
- [x] Safety, invalid-age, missing-consent, and error states specified
- [x] Payment-free final confirmation specified
- [x] Sample report and production-shaped fixture result separated
- [x] Fixture/mock data boundary specified
- [x] Legal/contact review presentation specified without fictional operator facts
- [x] 月の返事-specific design brief specified
- [x] Accessibility, responsive, navigation, analytics, and error requirements specified
- [x] Milestone 1 implementation divided into M1-I1 through M1-I6 one-commit slices
- [x] Material Human decisions and slice blockers recorded
- [x] Documentation-only boundary preserved
- [x] Milestone 1 implementation remained unstarted during planning
- [x] Human acceptance of Task M1-P1 at commit `05c02efeb90a53caaf603f7a4e983a7bc5c7914b`

## P4.13: Human Accepted — Task M1-P1-R1 UI/UX Decision Alignment

- [x] Human-approved emotional objective documented
- [x] Vertical LP order, LP/`/request` separation, CTA and price clarity aligned
- [x] Text-only input, conversation paste/anonymization, and image-upload deferral aligned
- [x] Initial free/ad exclusions and `/sample-report` free-experience role aligned
- [x] Complete recommendation requirements aligned for all approved send/light-send/wait/do-not-send labels
- [x] Web鑑定ノート and the then-named 保存用鑑定書 separated; the current formal short-presentation name is 保存用判断カード
- [x] `/review/save-report/result-normal-001` added to planning only
- [x] Safety-before-payment and future post-payment refund/operator state requirement aligned
- [x] Two-level review banner aligned
- [x] The Pattern adopt/transform/reject boundary recorded without adding reference assets
- [x] M1-I1 through M1-I6 planning aligned without authorization
- [x] Documentation-only boundary preserved
- [x] Milestone 1 implementation remained unstarted during planning
- [x] Human acceptance of Task M1-P1-R1 at commit `479f3b9610ed93be921c5b844dff03d6f1c16f31`

## P4.14: Human Review In Progress — M1-I1 Route Shell and Review Navigation

- [x] Human explicitly authorized M1-I1
- [x] Refreshed vertical LP implemented at `/`
- [x] Shared responsive header and footer implemented
- [x] Shared two-level `/review/**` banner implemented
- [x] Static `/review` route/status inventory implemented
- [x] Unimplemented routes shown only as non-clickable preparation items
- [x] Existing `/request` behavior, age choices, and Safety implementation preserved
- [x] No fixture or runtime integration added
- [x] Desktop visual direction approved by Human
- [x] M1-I1-R1 internal terminology removed from the ordinary LP
- [x] M1-I1-R1 completed and awaiting Human review
- [ ] Human review of mobile LP, `/request`, and `/review`
- [x] Human acceptance of Task M1-I1 at commit `dd031183dd347493fd5619f1b0d8bb355fc93560`

## P4.15: Human Accepted — M1-I2 Request Confirmation and Safety Review States

- [x] Human explicitly authorized M1-I2
- [x] Human selected a three-step request flow
- [x] Human selected one unified required acknowledgement after a visible five-item list
- [x] Three-step `/request` flow and in-memory navigation implemented
- [x] `normal_allowed`-only local request confirmation implemented
- [x] Deterministic typed fixtures and all required request review routes implemented
- [x] `needs_review`, `rejected`, contradictory selection, invalid age, missing consent, and unknown/error fail closed
- [x] Refund and transaction-specific acceptance kept outside M1-I2
- [x] Marketing/newsletter consent not added
- [x] Typecheck, lint, build, static scope audit, required-route HTTP checks, and unknown-ID fail-closed checks
- [x] Human visual review and acceptance of M1-I2 at commit `de332b9f7911cb09ca2e3f7b26ef24c692dc2ae1`

## P4.16: Human Accepted — M1-I3 Final Purchase Confirmation Without Payment

- [x] Human explicitly authorized M1-I3
- [x] Typed `normal-001` purchase fixture references accepted `request-normal-001`
- [x] `normal_allowed`-only purchase confirmation route implemented
- [x] Product, 税込980円, quantity, request summary, delivery plan, AI/non-guarantee, and draft transaction boundaries displayed
- [x] Native disabled purchase control implemented with no transaction handler
- [x] Unknown and non-normal purchase IDs fail closed without fallback
- [x] Legal/contact destinations remain truthful non-clickable preparation items
- [x] Payment provider remains unselected; no payment, persistence, network, AI, or email behavior implemented
- [x] Typecheck, lint, build, required-route HTTP, content, fail-closed, and prohibited-scope checks completed
- [x] Human visual review and acceptance of M1-I3 at commit `5cec9ea7ae0525a125ac8c3a8d90b48cefc4df25`

## P4.17: Human Accepted — M1-I4 Sample Report and Fixture Result Experience

- [x] Human explicitly authorized M1-I4
- [x] Public `/sample-report` implemented with `sample-report-g001` and explicit fictional/non-purchase/non-review/non-AI-generation labels
- [x] Shared typed `result-normal-001` references `request-normal-001`
- [x] Nine-section Web鑑定ノート implemented with fixed `今日は送らない方がいい` judgment and complete recommendation coverage
- [x] A4-oriented short presentation implemented by selecting and recomposing the same structured result; its current formal name is 保存用判断カード
- [x] Missing-fixture, unavailable-report, static loading, and unknown-ID fail-closed states implemented
- [x] LP output previews and sample/Web/save comparison navigation updated without redesigning unrelated sections
- [x] Sample 840-character and Web 1,973-character counts verified
- [x] Typecheck, lint, build, required-route HTTP, content, fail-closed, and prohibited-scope checks completed
- [x] No AI, payment, email, DB, API, file generation, download/copy/share, package, Safety, age, or legal-publication work added
- [x] Human Visual QA and acceptance of M1-I4 at commit `620792e61b002190aff100fd145e986b5ae4c89b`

## P4.18: Human Accepted — M1-I5 Legal, Disclosure and Contact Review Pages

- [x] Human explicitly authorized M1-I5 and approved the incomplete-field presentation rule
- [x] `/legal`, Terms, Privacy, Tokushoho, Refund, AI disclosure, Unsupported Cases, and inactive Contact routes implemented
- [x] Shared draft/publication/legal-advice boundary, legal navigation, fixed-fact rows, and unresolved Decision status cards implemented
- [x] Every legal/contact route marked noindex/nofollow
- [x] Footer, purchase confirmation, blocked Safety states, and `/review` integrated without changing transaction or Safety logic
- [x] No raw placeholder, invented operator/provider/contact value, active contact, legal acceptance, payment, AI, email, DB/API, package, Supabase, or Safety change added
- [x] Typecheck, lint, build, HTTP, required-label, placeholder, runtime, and prohibited-scope checks completed
- [x] Human accepted the overall M1-I5 page structure and direction and authorized only the M1-I5-R1 active-state correction
- [x] M1-I5-R1 replaced the blacked-out legal-navigation current item with a warm, readable card and visible compact `現在` badge while preserving `aria-current="page"`
- [x] M1-I5-R1 typecheck, lint, build, eight-route HTTP, rendered current-marker/navigation, and prohibited-scope checks completed
- [x] Human Visual QA and acceptance of M1-I5 and M1-I5-R1 at commit `7a232b8feef446200cde5425cb3a98eb683b4391`

## P4.19: Closed Unaccepted — M1-I6 Responsive, Accessibility and Visual QA Hardening

- [x] Human explicitly authorized M1-I6 after accepting M1-I5 and M1-I5-R1
- [x] Human fixed-mobile-CTA decision recorded as `rejected for Milestone 1`; non-fixed CTA preserved
- [x] Responsive Japanese heading wrapping and mobile type scales hardened without changing desktop hierarchy
- [x] Original local crescent icon added through `app/icon.svg`
- [x] Customer-facing raw `none`, public/review terminology, sample metadata hierarchy, and comparison-count mismatch corrected
- [x] `/review/**` centrally marked `noindex, nofollow`; legal/contact boundary preserved
- [x] Typecheck, lint, build, 30-route HTTP/rendered checks, 25-link integrity checks, and five fail-closed checks completed
- [x] No fixture, Safety, price, legal substance, Decision state, package, Supabase, or runtime integration change added
- [x] Partial Human visual review performed manually in external Edge; unresolved visual/accessibility defects and broader product-experience concerns identified
- [x] Full cross-width and keyboard QA recorded as incomplete historical review work
- [x] M1-I6 not accepted by Human and formally closed as superseded by M1-P2
- [x] M1-I6 implementation and evidence retained as historical records
- [x] Known M1-I6/M1-I6-R1 defects carried into M1-I7 through M1-I12 and final M1-I12 QA
- [x] Human acceptance of Milestone 1, subsequently completed through M1-I12 final acceptance

This closure is not M1-I6 acceptance and did not itself complete Milestone 1. The later M1-I12 final acceptance completed Milestone 1 without retroactively accepting M1-I6. No further M1-I6 Human Visual QA or disposition gate is required.

## P4.20: Accepted — M1-P2 Experience & Visual Direction Revision Planning

- [x] Confirm clean base state at `38319adbe019826180db71e0b32302a000cc4a02`
- [x] Confirm no existing M1-P2 or M1-I7 through M1-I12 ID conflict
- [x] Create `docs/phase1/M1_P2_EXPERIENCE_REVISION_PLAN.md`
- [x] Document the approved 14-part Reading Note structure and distinct save-oriented note purpose
- [x] Document the approved free-text/chip Request Sheet input, privacy warning, email timing, and truthful no-AI fixture representation
- [x] Document the approved ten-part LP sequence with the Reading Note artifact as primary value proof
- [x] Document the approved three-layer Legal Review architecture
- [x] Preserve product definition, JPY 980 price, 18+ policy, Safety/classification meaning, fixed judgment, core scenario facts, and runtime boundaries
- [x] Preserve the Milestone 1 rejection of a fixed/sticky mobile CTA
- [x] Propose M1-I7 Brand Foundation
- [x] Propose M1-I8 Reading Note Product Redesign
- [x] Propose M1-I9 LP Redesign
- [x] Propose M1-I10 Request Sheet Redesign
- [x] Propose M1-I11 Legal Review Redesign
- [x] Propose M1-I12, subsequently authorized as Final QA & Milestone 1 Acceptance Package
- [x] Record that every implementation slice requires separate explicit Human authorization and acceptance
- [x] Record that Safety fixtures, classification meaning, fail-closed behavior, fixed judgment, and core scenario facts remain fixed
- [x] Allow presentation fixture/schema extension or reorganization only inside the separately authorized relevant slice, with Human review and no runtime activation
- [x] Record that real AI, DB, payment, email, API, deployment, and Safety changes remain prohibited
- [x] Record the Browser-use and screenshot prohibition; visual checks belong only to Human in ordinary external Microsoft Edge
- [x] Preserve documentation-only scope with no product-code or package change
- [x] Human acceptance of Task M1-P2; documentation acceptance does not authorize implementation
- [x] Separate Human authorization and implementation of M1-I7
- [x] One-time Human batch authorization of M1-I7 through M1-I11
- [x] M1-I7 through M1-I11 implementation and automated validation under internal checkpoints
- [x] Human acceptance of M1-I7 through M1-I11 plus M1-P2-R1 and bounded M1-P2-R1-R1 as one integrated next-stage baseline
- [x] Separate Human authorization of M1-I12 Final QA & Milestone 1 Acceptance Package
- [x] M1-I12-R3 automated final QA against corrected main
- [x] M1-I12 Human final QA and acceptance
- [x] Human acceptance of Milestone 1

## P4.21: Human-Accepted as Part of the Integrated Baseline — M1-I7 Brand Foundation

- [x] Human initially authorized only M1-I7 Brand Foundation from base commit `923d43057178da070a72f380d7054d60efca7daf`; later integrated authorization is recorded below
- [x] Role-based night, moon-gold, paper, ink, state, layout, typography, border, shadow, focus, and motion tokens added
- [x] OS-font typography roles and corrected Japanese wrapping foundation with scoped `phrase-keep` utility added
- [x] `surface-brand`, `surface-paper`, `surface-worksheet`, `surface-answer`, `surface-caution`, and `surface-legal` roles added without applying later page redesigns
- [x] Original `MoonSeal`, `LunarArc`, and `EditorialDivider` components plus CSS-only `SoftGlow` and `PaperGrain` primitives added
- [x] Shared primary/secondary CTA, text-link, status, focus, contrast, touch-target, and reduced-motion foundations added
- [x] Review-only Brand Foundation preview added inside existing `/review`; no new route added
- [x] Stale M1-I6 review-gate copy corrected to the M1-I7 Human Visual QA gate
- [x] Typecheck, lint, build, raw HTTP/rendered-text, prohibited-scope, and diff validation completed without Browser use
- [x] No package, fixture, Safety, Supabase, AI, DB, payment, email, API, server action, analytics, deployment, or external asset change added
- [x] Human acceptance as part of the integrated M1-I7 through M1-I11 baseline, including the bounded public-sample corrections
- [x] M1-I8 through M1-I11 authorized and implemented under the one-time integrated batch; no standalone acceptance recorded

## P4.22: Human-Accepted Integrated Baseline — M1-I7 through M1-I11

- [x] Preserve inherited M1-I7 work from base commit `923d43057178da070a72f380d7054d60efca7daf`
- [x] Complete M1-I7 bounded Brand Foundation corrections
- [x] Implement M1-I8 14-part Reading Note, distinct saved decision card, and fictional public sample
- [x] Implement M1-I9 approved ten-part LP
- [x] Implement M1-I10 free-text Request Sheet, deterministic Safety gate, Request Memo, post-Safety email, and preparation-only purchase confirmation
- [x] Implement M1-I11 document-first Legal Review, readiness hierarchy, Unsupported cases, and inactive Contact
- [x] Complete per-slice typecheck, lint, build, `git diff --check`, and required raw HTTP/rendered-text checks without Browser use
- [x] Preserve product facts, fixed judgment, core scenario, `lib/safety/**`, fail-closed behavior, runtime inactivity, non-fixed CTAs, and legal facts
- [x] Human acceptance of M1-I7 through M1-I11 as one integrated next-stage baseline
- [x] Record that M1-I12 remained outside this batch and was later separately Human-authorized
- [x] Human acceptance of Milestone 1, subsequently completed through M1-I12 final acceptance

## P4.23: Human-Accepted as Part of the Integrated Baseline — M1-P2-R1 and M1-P2-R1-R1

- [x] Preserve the inherited uncommitted M1-I7 through M1-I11 integrated redesign
- [x] Add separate public-only static cases for wait, send, and stop additional contact
- [x] Show the three different-case conclusions and their distinguishing facts on the LP
- [x] Change `/sample-report` to the complete `sample-send-001` fictional example
- [x] Separate same-case LP/Web/save format comparison from different-case conclusion comparison
- [x] Preserve `result-normal-001`, Safety fixtures, `lib/safety/**`, packages, and runtime boundaries
- [x] Complete typecheck, lint, build, `git diff --check`, and static boundary checks without Browser use
- [x] Correct the bounded M1-P2-R1-R1 LP contrast and separate-case comparison-boundary defects
- [x] Human acceptance with the integrated M1-I7 through M1-I11 baseline
- [x] Record that M1-I12 remained outside this correction and was later separately Human-authorized
- [x] Human acceptance of Milestone 1, subsequently completed through M1-I12 final acceptance

## P4.24: Human and ChatGPT Accepted — M1-P3 Reading Note Visual Excellence Specification

- [x] Human authorization limited to documentation/design work
- [x] Record the formal names `恋のメッセージ鑑定ノート`, `Web鑑定ノート`, and `保存用判断カード`
- [x] Record residual application use of `保存用鑑定書` as a deferred M1-I8-R1 alignment item
- [x] Prepare the fixed-content lock, information hierarchy, Figma/design handoff, typography, chapter archetypes, responsive specification, acceptance criteria, implementation plan, and review record
- [x] Human and ChatGPT review of the M1-P3 package
- [x] Human acceptance of the five M1-P3 documents as the authoritative Visual Excellence design specification
- [x] Replace the former required-Figma gate with a Human-approved coded visual prototype gate; retain Figma only as optional non-authoritative reference material
- [x] Implement isolated M1-P3-R1 A/B coded visual prototypes from the same fixed fixture and semantic order
- [x] Human selection and acceptance of B — `Lunar Contrast Edition` as the canonical design direction; A — `Quiet Editorial Letter` rejected
- [x] Separate Human authorization of Checkpoint A / M1-I8-R1 Technical Preparation
- [x] Checkpoint A implementation and automated validation within its exact mutation manifest
- [x] Human acceptance of Checkpoint A at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda`
- [x] Separate Human authorization of Checkpoint B / M1-I8-R1 Visual Excellence; B — `Lunar Contrast Edition` controlling
- [x] Checkpoint B implementation and automated validation on `feat/m1-i8-r1-checkpoint-b-lunar-contrast` within the exact mutation manifest
- [x] Checkpoint B Human Visual QA and acceptance for the primary desktop and 390px targets at implementation-and-polish commit `bb2079aafb3666562e2876ead4c24a5c933bea8a`; fast-forward to `main` authorized
- [x] Separate Human authorization of M1-I9-R1 Reading Note Preview Alignment
- [x] M1-I9-R1 implementation and automated validation within its exact mutation manifest on `feat/m1-i9-r1-reading-note-preview-alignment`
- [x] M1-I9-R1 primary desktop/390px Human Visual QA and acceptance at final implementation commit `82600df57481cae2c61d370288083a61f0c719c3`; fast-forward to `main` authorized
- [x] Separate Human authorization of M1-I12 Final QA & Milestone 1 Acceptance Package

M1-P3 acceptance and M1-P3-R1 prototype acceptance are not canonical implementation authorization. Figma is optional and non-authoritative. Neither prototype selection nor optional Figma material may change product facts, price, fixture judgment, Safety, request/legal behavior, or runtime scope.

## P4.25: Human Accepted — M1-I2-R1 Safety Policy Enforcement Alignment

- [x] Stop M1-P3-R1 before coded visual prototype implementation when `SEM-UNSUPPORTED-CASES` fails
- [x] Human authorization of only the bounded M1-I2-R1 Safety correction
- [x] Add `illegal_conduct` and `third_party_secret` without changing existing reason-code meaning or structured classification/severity
- [x] Align all 13 exact locked unsupported-case labels to their required fail-closed classification/reason
- [x] Add NFKC/whitespace normalization, targeted free-text variants, and bounded negation guards for the confirmed coverage gaps
- [x] Ensure every non-`normal_allowed` result blocks ordinary confirmation
- [x] Add `scripts/verify-m1-safety-policy.mjs` using the real classifier, real category export, existing TypeScript compiler, OS temp directory, and exact lock
- [x] Pass exact-category, natural-language, benign-control, structured-flag, normal, contradictory-selection, `SEM-UNSUPPORTED-CASES`, and aggregate Safety gates
- [x] Pass typecheck, lint, production build, `git diff --check`, and prohibited-scope audit without Browser or screenshots
- [x] Human review and acceptance of M1-I2-R1 at implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`; `SEM-UNSUPPORTED-CASES` PASS without waiver
- [x] Resolve the previous M1-P3-R1 hard stop; coded visual prototype implementation may resume and remains zero before that work starts

This correction does not authorize canonical UI or Reading Note changes, Checkpoint A, Checkpoint B, M1-I9-R1, M1-I12, Milestone 1 acceptance, or Milestone 2.

## P4.26: Human Design Selection Accepted — M1-P3-R1 Coded Visual Prototype Gate

- [x] Continue the existing Human authorization after M1-I2-R1 acceptance and `main` synchronization
- [x] Add review-only `/review/visual-excellence`, `/review/visual-excellence/a`, and `/review/visual-excellence/b`
- [x] Use only the existing exported `getReportFixture("result-normal-001")` resolver; keep fixture content unchanged
- [x] Use the same content subset and semantic order for A and B while demonstrating all six M1-P3 chapter archetypes
- [x] Keep canonical report components, LP, Request UI, Legal UI, `fixtures/**`, `lib/safety/**`, package files, and runtime behavior unchanged
- [x] Pass exact locks, semantic assertions, Safety verifier, typecheck, lint, build, raw HTTP/rendered checks, prohibited-scope audit, and `git diff --check` without Browser or screenshots
- [x] Human selected and accepted B — `Lunar Contrast Edition` and rejected A — `Quiet Editorial Letter`; this explicit Human decision is the design-selection evidence
- [x] Separate Human authorization of Checkpoint A with its exact mutation manifest
- [x] Checkpoint A implementation, automated validation, and Human acceptance at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda`
- [x] Separate Human authorization of Checkpoint B after design selection
- [x] Checkpoint B implementation, automated validation, primary desktop/390px Human Visual QA, and Human acceptance at implementation-and-polish commit `bb2079aafb3666562e2876ead4c24a5c933bea8a`

Prototype acceptance alone is not canonical visual implementation authorization. Figma is optional and non-authoritative. Later separate Human decisions accepted Checkpoint A, authorized and accepted Checkpoint B within its exact mutation manifest, authorized its fast-forward to `main`, and authorized M1-I9-R1 within a new exact manifest.

## P4.27: Human Accepted — M1-I8-R1 Checkpoint A Technical Preparation

- [x] Branch from accepted documentation commit `d6a9f111a2e15c54e9f250a2126d64abfacdefd0`
- [x] Add deterministic exact-lock, rendered-lock, semantic-assertion, and Safety aggregate verifier
- [x] Resolve the three undefined CSS references through approved existing palette aliases
- [x] Isolate paper-grain positioning, order media queries broad-to-narrow, and add the 320px fallback without redesign
- [x] Remove only statically proven unconsumed legacy LP selectors
- [x] Add narrow, currently unadopted artifact surface/rule/metadata/stamp/section-label presentation primitives
- [x] Inventory residual `保存用鑑定書` sources without changing customer-facing copy
- [x] Document the deliberate `--swatch-color` dynamic source and defensive fallback
- [x] Pass content locks, semantic assertions, Safety, typecheck, lint, production build, `git diff --check`, manifest, and protected-scope audits
- [x] Human acceptance of Checkpoint A at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda`
- [x] Separate Human authorization of Checkpoint B

Checkpoint A acceptance is technical acceptance, not visual acceptance. Its following decision authorized Checkpoint B only within that checkpoint's exact mutation manifest. A later Human decision accepted Checkpoint B and authorized its fast-forward plus the bounded M1-I9-R1 task. A subsequent Human decision accepted M1-I9-R1 and separately authorized M1-I12. Human Final QA later accepted M1-I12 and completed Milestone 1 without retroactively widening any earlier authorization.

## P4.28: Human Accepted — M1-I8-R1 Checkpoint B Visual Excellence

- [x] Branch from accepted `main` commit `79011f274c35a0cf80f68af845ffaca95e8884c9` on `feat/m1-i8-r1-checkpoint-b-lunar-contrast`
- [x] Use prototype commit `d5095ec3c7cf14a9646cb621a64b88d970e908bc` only as read-only design evidence; no merge, cherry-pick, or rebase
- [x] Implement B — `Lunar Contrast Edition` for Web鑑定ノート, 保存用判断カード, 公開全文見本, comparison navigation, error/loading, and review boundary
- [x] Introduce shared presentation-only artifact compositions with caller-owned semantics and no fixture/schema renderer, routing, state, behavior, or runtime integration
- [x] Preserve the exact Web/save judgment, public conclusion/disclosure, approved content order, Safety meaning, and fail-closed unknown-ID behavior
- [x] Align only authorized customer-facing `保存用鑑定書` labels; defer `lib/legal/review-content.ts` residual `保存用鑑定書見本`
- [x] Pass content locks, semantic assertions, Safety, typecheck, lint, production build, raw HTTP, one-`h1`, heading-order, exact-copy, manifest, prohibited-scope, and `git diff --check` audits without Browser or screenshots
- [x] Human Visual QA for the primary desktop and 390px targets, including Web鑑定ノート, 保存用判断カード, 公開全文見本, and review-chrome subordination
- [x] Human acceptance at implementation-and-polish commit `bb2079aafb3666562e2876ead4c24a5c933bea8a` and separate fast-forward-only merge authorization

Checkpoint B is fast-forwarded to `main` at acceptance synchronization commit `06c20f71c21d7968a97aa78dbe12f480c1abf7c5`. M1-I9-R1 is Human-accepted at `82600df57481cae2c61d370288083a61f0c719c3` and synchronized to `main`. M1-I12-R1 and Human-accepted M1-I12-R2 are on corrected `main`; M1-I12-R3 completed the non-browser all-route regression gates. Human 320px, 200% zoom, keyboard/focus, reduced-motion, reading-quality, and contrast QA passed with no reported release blocker. M1-I12 and Milestone 1 are Human-accepted and complete; Milestone 1 is closed. At that closure checkpoint, Milestone 2 was unauthorized and not started.

## P4.29: Human-Accepted — M1-I9-R1 Reading Note Preview Alignment

- [x] Branch from accepted Checkpoint B `main` commit `06c20f71c21d7968a97aa78dbe12f480c1abf7c5`
- [x] Align only the Hero cover, `#note` same-case product proof and direct links, and the different-case public comparison
- [x] Reuse existing artifact/brand components without changing `components/**`
- [x] Read the fixed judgment from `preview`; preserve `PUBLIC_SAMPLE_CASES`, public conclusions, facts, and review conditions
- [x] Preserve one page `h1`, DOM/visual order, 44px links, 3px focus, non-fixed CTAs, and the M1-I12 final-QA hold
- [x] Pass content locks, Safety, typecheck, lint, production build, raw HTTP, CSS asset, manifest, prohibited-scope, and `git diff --check` gates without Browser or screenshots
- [x] Human Visual QA at primary desktop and 390px, including the corrected mobile one-character wrapping defect
- [x] Human acceptance at final implementation commit `82600df57481cae2c61d370288083a61f0c719c3` and separate fast-forward-only merge authorization

M1-I9-R1 is synchronized to `main`. M1-I12 automated final QA and Human final QA are complete, and M1-I12 is Human-accepted. The historical pre-R2 QA branch remains immutable. Milestone 1 is complete and closed. At that closure checkpoint, Milestone 2 was unauthorized and not started.

## P4.30: Human Accepted — M1-I12 Final QA and Milestone 1 Closure

- [x] M1-I12 automated final QA completed against corrected `main`
- [x] Human 320px responsive QA: PASS
- [x] Human keyboard/focus QA: PASS
- [x] Human 200% zoom QA: PASS
- [x] Human reduced-motion QA: PASS
- [x] Human reading-quality/contrast QA: PASS
- [x] Human-reported release-blocking visual defect: none
- [x] M1-I12 Human-accepted and complete
- [x] Milestone 1 Human-accepted, complete, and closed
- [x] At Milestone 1 closure, Milestone 2 was unauthorized and not started

Human observational evidence is recorded separately from automated QA evidence. No application implementation was changed by the acceptance synchronization.

## P5: Human / ChatGPT Accepted — M2-P1 AI Quality & Evaluation Foundation

- [x] Human authorization limited to M2-P1 foundation
- [x] Exact clean base and dedicated branch
- [x] Ten Phase 2 specification, policy, plan, and review documents
- [x] Exactly 70 development cases in the required 10/10/10/10/8/13/9 distribution
- [x] External-only 15-case holdout contract with no case data committed
- [x] Nine Draft 2020-12 JSON Schemas
- [x] PB-01 through PB-07 and nine shared prompt assets accepted as foundation assets
- [x] Strict counterfactual-group identifiers
- [x] 42 explicit contrast sets with 130 memberships covering all 70 development cases
- [x] Connected-component contamination split enforcement
- [x] Exact 20-case Human-review sample pre-registered in stable order
- [x] Machine-readable bounded retry policy
- [x] Machine-readable responsibility contracts for all seven prompt stages
- [x] Eight runtime capability declarations fixed to `false`
- [x] Prompt SHA-256 manifest
- [x] Evaluation version, per-file hash, and aggregate hash manifest
- [x] Node-built-ins-only permanent foundation verifier
- [x] M2 foundation, M1 content-lock, M1 Safety, typecheck, lint, build, and diff gates
- [x] Human / ChatGPT final review and acceptance of M2-P1 and M2-P1-R1
- [x] M2-P1 marked accepted and complete at accepted foundation implementation commit `c56f597d0491482995c4afa6fb64cf148dd66345`
- [x] M2-P1-R2 anchors the immutable 42-file R1 manifest to its accepted historical commit range; correction commit `e859b4cdfc0efa03d3372784ea34f4abb61bee9d`
- [ ] Separate M2-P2 planning and Human authorization for any model selection, API, database, UI, or runtime work

M2-P1 acceptance is foundation-contract acceptance. It is not AI runtime authorization, model-quality acceptance, holdout execution, DB authorization, or general Milestone 2 authorization.

The accepted development graph has 42 contrast sets, 130 memberships, and 7 connected components; the largest component contains 51 cases. Development cases must not be randomly split into holdout. The future 15-case holdout must be independently authored and must not share counterfactual or contrast-set relationships with the 70 development cases.

## P5.1: M2-P2-A Zero-Cost Token & Cost Estimator Foundation

- [x] Clean exact base and dedicated feature branch
- [x] Canonical local request-envelope renderer for PB-01 through PB-06
- [x] PB-07 isolated to the repair-stress scenario
- [x] Oracle excluded from rendered request payloads
- [x] Deterministic minimum, nominal, and conservative Schema-shaped upstream profiles
- [x] Exact byte, code-point, JSON-character, and line metrics
- [x] Configurable LOW, CENTRAL, and HIGH offline token bands
- [x] Separate nominal, conservative, and configured-cap output profiles
- [x] Versioned USD price catalog with every model unselected
- [x] Six exact static planning scenarios
- [x] Standard, conservative, hard-cap, and Batch reference formulas
- [x] Deterministic JSON and Markdown reports
- [x] Local-only permanent verifier with Node built-ins and exact sibling-tool imports
- [x] OpenAI API calls: zero; API spend: USD 0
- [x] ChatGPT implementation review and automated validation
- [x] M2-P2-A-R1 Human / ChatGPT acceptance and completion at `deff429e45a411f0d6c6d5bd3f199adca994ebb5`
- [x] M2-P2-A Human / ChatGPT acceptance and completion at `2e2e0cc4c57c46320d56aa986055f65187aa6aee`
- [x] Complete M2-P2-B1-A deterministic offline replay acceptance with zero provider calls and USD 0 spend
- [x] Implement, automatically validate, Human / ChatGPT accept, and complete M2-P2-B1-B1 network-disabled provider protocol foundation at `efdf10067fb3c1b4072c891ab5f3f1d2c949de55`
- [x] Human / ChatGPT accept and complete M2-P2-B1-B2-A-R1 at `fa222917f0e6ff4a4e25d11da239717c062af6d0` and M2-P2-B1-B2-A at `76ceb4a25cc565e84b9537bd25dbe703f87bd342`
- [x] Implement, automatically validate, Human / ChatGPT accept, and complete M2-P2-B1-B2-B0 one-time paid-calibration execution package at `e8b369baa14ff417fed19d75f31c733dd5c8d240`
- [ ] Separately authorize M2-P2-B1-B2-B1 external approval creation and paid one-case calibration execution, capped at USD 1 total

M2-P2-A estimates are not actual usage or guaranteed API cost. Actual tokenizer usage, reasoning tokens, latency, API cost, and provider validation remain unknown. No product-quality evidence was produced, and the price catalog is a versioned planning snapshot. Development-70 represents evaluation cost, not one customer report cost. No 14-case or 70-case API execution is authorized. Any first M2-P2-B calibration requires separate authorization and is limited to one case, one model, no repair, one execution, and an absolute future ceiling of USD 1. M2-P2-A adds no provider, model selection, database, authentication, payment, email, API route, server action, UI, or runtime implementation.

## P5.2: M2-P2-B0 One-Case Paid Calibration Contract Foundation

- [x] Exact clean main base and dedicated feature branch
- [x] Independent two-file successor-tool allowlist correction at `a757e7f28affe29a423ff817872a1a7f650a7fd2`
- [x] Register only development case `WAIT-003`
- [x] Register `gpt-5.6-luna` only as the cost-and-plumbing calibration candidate
- [x] Keep product and baseline model selection false
- [x] Fix PB-01 through PB-06 to six provider calls maximum and four local deterministic steps
- [x] Exclude PB-07, retry, Repair, fallback, automatic continuation, 14-case, 70-case, holdout, and real-user execution
- [x] Fix standard Luna pricing, USD 0 current authorization, USD 1 future ceiling, and USD 0.30 preflight ceiling
- [x] Add deterministic contract preparation, three Schemas, artifact/Security policy, and permanent verifier
- [x] Pass all B0, M2-P2-A, M2 foundation, M1 lock/Safety, typecheck, lint, build, and diff gates
- [x] M2-P2-B0-R1 accepted and complete at `a757e7f28affe29a423ff817872a1a7f650a7fd2`
- [x] M2-P2-B0-R2 accepted and complete at `88b456622950622c35510f4b3b9d19abbd9ec8da`
- [x] Human / ChatGPT final review and acceptance of the implemented B0 contract at `cf75679f2d116132f7519256cd762ba1a51a0af9`
- [x] M2-P2-B0 marked accepted and complete
- [x] M2-P2-B1-A-R1 Human / ChatGPT acceptance and completion at correction commit `22bbf6f69ad2e21d3d43808e3518970eb1dc48e7`
- [x] Implement M2-P2-B1-A deterministic offline one-case Runner with zero provider calls and USD 0 spend
- [x] Complete M2-P2-B1-A automated validation
- [x] Complete M2-P2-B1-A Human / ChatGPT final review and acceptance at implementation commit `630cde811d63e0304ed528dc2e426400e81506a6`
- [x] Mark M2-P2-B1-A accepted and complete
- [x] Accept and complete M2-P2-B1-B1-R1 historical-scope/successor-boundary correction at `2f9fa4f2aa0616a03ec716bf0c09e1d0e0df038e`
- [x] Implement M2-P2-B1-B1 with immutable network/secret interlocks, synthetic receipts, zero provider calls, and USD 0 spend
- [x] Complete M2-P2-B1-B1 automated validation, Human / ChatGPT final review, acceptance, and completion at `efdf10067fb3c1b4072c891ab5f3f1d2c949de55`
- [x] Implement, automatically validate, Human / ChatGPT accept, and complete M2-P2-B1-B2-A dormant live bindings with zero actual calls and USD 0 spend
- [x] Implement, automatically validate, Human / ChatGPT accept, and complete M2-P2-B1-B2-B0 before any actual provider call or spend
- [ ] Separately authorize M2-P2-B1-B2-B1 before any actual provider call or spend

M2-P2-B0 is zero-cost contract work only. It does not call the OpenAI API, read an API key, implement a network/provider executor, select a product model, or authorize B1. The only possible future path is `WAIT-003`, `gpt-5.6-luna`, PB-01 through PB-06, no retry/Repair/fallback, and six provider calls maximum.

Acceptance boundary: M2-P2-B0-R2 is accepted and complete at `88b456622950622c35510f4b3b9d19abbd9ec8da`. It anchors the accepted M2-P2-A 16-file scope to its immutable historical commit range without adding B0 paths. The independent exact B0 scope remains 18 files. `M2_B0_EXACT_SCOPE_GATE`, both M2-P2-A historical sub-gates, both aggregates, M2 foundation, M1 locks/Safety, typecheck, lint, build, and diff checks pass. The B0 contract at `cf75679f2d116132f7519256cd762ba1a51a0af9` completed Human / ChatGPT final review and is accepted and complete.

B1-A acceptance boundary: execution mode `offline_replay`, `WAIT-003`, `gpt-5.6-luna`, PB-01 through PB-06, six simulated stages, zero actual provider calls, USD 0 spend, no PB-07, retry, Repair, fallback, 14-case, 70-case, holdout, or real-user execution, and live authorization false. Offline replay proves plumbing and stop semantics only. It does not establish provider compatibility, actual token/reasoning usage, latency, billed API cost, or model quality. Product and baseline models remain unselected.

B1-B1 acceptance boundary: local provider-protocol handling only for `WAIT-003`, `gpt-5.6-luna`, and PB-01 through PB-06; `POST /v1/responses` is a path contract, not a live connection. Request previews are not API requests, synthetic Responses are not provider Responses, parsed usage is synthetic, and usage-derived costs are not billed costs. Secret resolutions, executor calls, provider calls, and API spend remain zero; live authorization is false. Provider compatibility, model availability, actual input/output/reasoning tokens, latency, billing, and model quality remain unknown. The B1-A historical scope remains exactly 30 files (A26/M4/D0), the B1-B1 implementation scope remains exactly 39 files (A35/M4/D0), the scopes remain independent, and no wildcard, prefix, or self-authorizing scope exists.

## P6: Future Delivery Sequence Status

Dependency order is mandatory. Detailed tasks are in `docs/phase1/IMPLEMENTATION_WBS.md`.

- [x] Milestone 1: fixed-fixture Reviewable Web MVP — Human-accepted, complete, and closed
- [ ] Milestone 2: internal automated AI / DB vertical slice — M2-P3 Runtime Vertical Slice, M2-P4 planning, M2-P4-I1-A through I2, I3-R1 Final Planning, R1-A contract-only implementation, and R1-B exact 22-path offline integration are accepted and complete; I3 offline implementation accepted and one synthetic live smoke succeeded; R1-B exact `9/9` review correction is resolved; C1 bounded execution protocol is Human / ChatGPT accepted complete with product-quality `FAIL`; final I3 acceptance / main merge, C2 Runtime activation, scored provider quality acceptance, and Milestone 2 completion remain pending or not started
- [x] Pre-payment Safety Engine / Safety UX — Human + ChatGPT accepted complete by the explicit `2026-08-10` Human decision; final JPY 980 readiness and Payment authority remain false
- [x] Payment Charter v1 — Human + ChatGPT accepted complete on `2026-08-12`; implementation remains unauthorized and Charter acceptance does not complete or skip Milestones 2–6
- [ ] Milestone 3: Review Site Deployment — Stripe Lane B B1/B2 and B3 review-ready Website/Public Surface implementation are accepted; Stripe Lane B deployment readiness (B4a) is the exact current next work and remains planning/readiness only. B4b stable-URL deployment requires separate external-action authority
- [ ] Milestone 4: Payment Provider Review Evidence and Selection — Stripe-first strategy, Customer-facing/public-copy, Stripe feasibility evidence preparation, and all seven Lane B Human policy decisions are accepted complete; Lane A remains Human-approved preparation with external action not authorized / not submitted / outcome `null` but is preserved inactive; Stripe Sales is `not_used_by_human_direction`, not a Provider outcome; `AGE-GATE-001` B2 docs/spec/legal alignment is accepted; Production enforcement and other Legal/Site/KYC/domain requirements remain pending; Lane B/C remain blocked and actual Stripe contact/submission, evidence acquisition, and formal selection remain unauthorized/evidence-gated
- [ ] Milestone 5: Core Backend, Safety, AI and Email
- [ ] Milestone 6: Approved Provider Sandbox Payment
- [ ] Milestone 7: E2E, Safety and Failure Operations
- [ ] Milestone 8: Production Application and Soft Launch
- [ ] Milestone 9: First Real Purchase Verification

## Blocked Future Work

M1-P2 is complete and Human-accepted planning. M1-I6 was not accepted and remains formally closed as superseded by M1-P2; later Milestone 1 acceptance does not retroactively accept it. M1-I12 and Milestone 1 are Human-accepted and complete; Milestone 1 is closed. M2-P1 and M2-P2-A are accepted and complete. M2-P2-B0 through M2-P2-B1-B2-B0 are paused internal QA tooling. M2-P3 Runtime Vertical Slice, Human setup, migration application, bounded synthetic live E2E, successful-run DB integrity verification, M2-P4 planning, M2-P4-I1-A through M2-P4-I2, M2-P4-I3-R1 Final Planning, M2-P4-I3-R1-A, M2-P4-I3-R1-B, and M2-P4-I3-R1-C1-R1 Application architecture / offline implementation are Human / ChatGPT accepted and complete. The accepted I1-C stack remains the immutable exact 27-path range `c27120eea067f91c5e9ef4447e382f55a329e158..b523349ec33c36a90c645d4a1b7a6d37832af151`; I2 is accepted at `410714875903ae61b5bcdc6cce90030f5679b3b3` with immutable exact 16-path snapshot `20d4178e3a63026128f3a25d052196c7161e7e27..410714875903ae61b5bcdc6cce90030f5679b3b3`, field disposition `7/7`, intent mapping `6/6`, and zero OpenAI/DB/migration/holdout task execution. `M2-P4-I3 PB-04 / PB-05 / PB-06 Product Quality Revision` is offline accepted at `c85d6d122ad71569532a55887b9a3b6d93f8a288`; one separately Human-authorized synthetic live smoke succeeded and showed major improvement, while final I3 acceptance and merge to `main` remain pending. I3-R1 Final Planning is accepted at `3c64e5e2179b4c03979119068716326337a002c6` with immutable exact `12/12` path snapshot `ec7cd53884ab4056c78d2596c609baef5701274a..3c64e5e2179b4c03979119068716326337a002c6`. `M2-P4-I3-R1-A Successor Schemas and Typed Writing Context Contracts` is accepted at `8030c0b7778ccea3d7d90cbffcf21ac9c1052bcd` with immutable exact `18/18` path snapshot `e5cfd903740267db6d070964a9ec72a7d823f310..8030c0b7778ccea3d7d90cbffcf21ac9c1052bcd`; its candidate Schemas are not active and active Runtime remains v3. R1-B is accepted at `4a1237ac647bff79229d7181d978d5613c2c3b87` with immutable exact `22/22` path snapshot `2381312ced5fc726dfa245632c25da6bb68a376f..4a1237ac647bff79229d7181d978d5613c2c3b87`; its exact `9/9` correction resolves provenance ownership `7/7`, valid/invalid grounding `20/20` each, and downstream input parity `15/15`. Catalog v5 remains an inactive candidate; active Service and catalog v4 remain unchanged; downstream Decision / Report behavior is preserved. The C1 bounded execution protocol remains Human / ChatGPT accepted complete with product-quality `FAIL`; evidence is immutable, no rerun is authorized, and C2 eligibility is false. R1-C1-R1 is accepted at `d8415e2ae165143d646c6f9573e24752d8b1a1c7` with immutable exact `31/31` implementation snapshot `bdc98af2c7c59a1d7ececa2077906c8fbb839ac9..d8415e2ae165143d646c6f9573e24752d8b1a1c7` and exact `9/9` final review correction `28bedad969d1007bbd731f0e9d47824eecd84651..d8415e2ae165143d646c6f9573e24752d8b1a1c7`; expected input injection remains `0`, strict source replay remains `FAIL / 5/8`, Application-adjudicated Decision Facts and canonical fixtures remain `8/8`, strict ownership and Provider semantic coverage remain `7/8`, Provider quality is not accepted, Provider retest remains required, and Fake Pipeline remains `3/3`; catalog v6 is inactive and active Service remains unchanged. R1-C1-R2 consumed its separate Human authorization in one exact eight-call synthetic-only PB-01 v5 diagnostic and is now `human_chatgpt_reviewed_fail_complete`: execution protocol, diagnostic evidence, and the offline evaluator correction are accepted, Provider product gate remains failed, verdict remains `FAIL`, and no rerun is authorized. C2 Runtime activation, E1, and holdout execution remain unauthorized or not started. `M2-P4-E1` and `M2-P4-E2` remain unauthorized and not started. Publication, deployment, production connections, any provider execution outside R1-C1-R2, new live DB execution, historical Prompt or Schema modification, email, payment, authentication, and later implementation remain blocked.
The preceding blocked-work paragraph preserves the state before the later separately authorized R2-R2 execution. That one-time four-call exception is now consumed and reviewed at `human_chatgpt_reviewed_fail_complete`; it grants no further Provider execution. All further rerun, R2-R2-R1, C2, E1, and release work remains unauthorized.

# M2-P2-B1-B2-A Dormant Live Binding Foundation

- [x] Freeze accepted B1-B1 to exact historical 39-file scope.
- [x] Register exact twelve successor script paths and three capability owners.
- [x] Human / ChatGPT accept and complete the R1 correction at `fa222917f0e6ff4a4e25d11da239717c062af6d0`.
- [x] Define dormant live-binding, approval, secret, HTTPS, one-time, artifact, Git, redaction, and budget contracts.
- [x] Implement fixture/in-memory bindings with no import-time side effects.
- [x] Fix live and paid authorization to false and block on `HUMAN_APPROVAL_MISSING`.
- [x] Define exact 40 failure-injection scenarios.
- [x] Run B1-B2-A, predecessor M2, M1, typecheck, lint, build, and diff gates.
- [x] Commit/push the exact 41-file implementation manifest at `76ceb4a25cc565e84b9537bd25dbe703f87bd342`.
- [x] Complete independent Human / ChatGPT final review, acceptance, and completion.
- [x] Implement, automatically validate, Human / ChatGPT accept, and complete the exact B0 execution package without a true approval, provider call, or spend.
- [ ] Separately authorize M2-P2-B1-B2-B1, if ever approved.

OpenAI Project/billing/key setup, API execution, retry, Repair, fallback, Batch, PB-07, 14-case, 70-case, holdout, real-user execution, and product/baseline model selection are outside this WBS slice.

# M2-P2-B1-B2-B0 One-Time Paid Calibration Execution Package

- [x] Preserve the accepted B1-B2-A historical scope and the pushed correction commit `30c05ca2c383641676a3c1fde680e2e83d44397f`.
- [x] Implement the exact 34-file manifest (A30/M4/D0) without dependency, application, UI, database, auth, payment, email, API route, or server-action changes.
- [x] Keep the repository approval template draft, absent, and non-executable.
- [x] Bind future approval to exact final `main`, `origin/main`, B0 contract, request hashes, price snapshot, 30-minute expiry, and Human decision reference.
- [x] Fix `WAIT-003`, `gpt-5.6-luna`, PB-01 through PB-06, six calls, and the USD 0.30/USD 1.00 ceilings.
- [x] Enforce exact external approval, marker, and artifact roots with traversal/UNC/reparse escape rejection.
- [x] Atomically consume the one-time marker before secret resolution and prohibit reuse after a crash.
- [x] Generate deterministic template, blocked-preflight, approval-preview, 24-scenario rejection matrix, summary, and report hashes.
- [x] Run the blocked preflight only; confirm `EXTERNAL_APPROVAL_NOT_PRESENT`, zero external directories, zero secret/network/provider activity, and USD 0 spend.
- [x] Complete automated validation.
- [x] Complete independent Human / ChatGPT final review and acceptance at implementation commit `e8b369baa14ff417fed19d75f31c733dd5c8d240`.
- [x] Mark M2-P2-B1-B2-B0-R1 accepted and complete at correction commit `30c05ca2c383641676a3c1fde680e2e83d44397f`.
- [x] Mark M2-P2-B1-B2-B0 accepted and complete.
- [ ] Separately authorize M2-P2-B1-B2-B1 true approval creation and one-time paid execution.

The paid entrypoint exists but was not executed. No true external approval record, marker, or run directory was created. Automated PASS alone was not Human / ChatGPT acceptance; the separate final decision accepted B0. That acceptance is not model-quality evidence and does not authorize M2-P2-B1-B2-B1.

# M2-P3-A Internal AI Assessment Runtime Vertical Slice

- [x] Preserve all M2-P1/M2-P2 historical capability snapshots and add an explicit M2-P3 successor manifest.
- [x] Reclassify the paid-once runner as paused internal QA tooling without deleting it.
- [x] Implement development-only `/review/runtime` with synthetic-data warning and no public navigation.
- [x] Implement Node `POST /api/internal/assessments` with origin, strict-body, privacy, length, UUID, and idempotency checks.
- [x] Implement OpenAI Responses and Supabase server-only bindings with fail-closed environment configuration.
- [x] Implement PB-01 through PB-06, deterministic Safety/eligibility/decision policy, per-Stage persistence, and report rendering.
- [x] Add the four-table versioned SQL migration with RLS and no public policies.
- [x] Add fake transport/repository scenarios and the dedicated M2-P3 verifier.
- [x] Complete the final exact sequential validation command set and record accepted implementation commit `9bdae7cf05034c7742e5f58f7b104d65cb27a87f`.
- [x] Complete M2-P3-A-R1 dependency security and transaction hardening at accepted commit `3f1123439dcbc724c70505956aa81fa03a9246ad`.
- [x] Confirm zero production-reachable high/critical vulnerabilities; classify three remaining production-installed findings as not reachable from M2 Runtime and nine findings as development-only.
- [x] Accept atomic report/decision-card/run/request finalization, rollback, duplicate-finalization, concurrent-idempotency, persistence-before-provider, and provider-stop evidence.
- [x] Complete Human desktop Visual QA and interaction QA with no observed stack trace or secret leakage; mobile-width QA intentionally omitted for the internal desktop-only route.
- [x] Complete code review and Human / ChatGPT acceptance; mark M2-P3-A complete.
- [x] Human creates `moon-reply-dev`, configures the local development OpenAI/Supabase runtime, and uses `gpt-5.6-luna` with the internal runtime enabled.
- [x] Human applies migrations `0002` and `0003`; `0001` remains archived and unapplied, and migration repair is not used.
- [x] Complete the post-acceptance Human-configured synthetic live E2E through PB-01 to PB-06, Structured Outputs, canonical AJV validation, Stage persistence, atomic finalization, usage-total persistence, and assessment-note display.
- [x] Preserve the accepted task-time Fake zero-call/zero-spend evidence separately from nonzero post-acceptance live usage with no inferred aggregate.
- [x] Complete read-only successful-run DB integrity verification through server-side SELECT only: all target integrity checks PASS; processing rows `0`; integrity anomalies `0`; OpenAI API calls `0`; DB writes `0`; migration operations `0`.
- [x] Confirm two failed runs with safe code `M2_STAGE_PROVIDER_FAILED` do not mix with the successful request and leave no orphan or processing state.
- [x] Complete Human / ChatGPT review and acceptance of the planning-only M2-P4 Quality Evaluation Planning Package at accepted planning content commit `34e2b1592428517564aeff95f2b7e40527f42a9e`.
- [ ] Quality evaluation execution: not started.

# M2-P4 Quality Evaluation Planning Package

- [x] Record `M2P4-LIVE-001` against source code commit `66ab02c566d61d0c563e26e3d2c5fb23f6500d45` without full DB UUIDs, raw DB contents, or secrets.
- [x] Record observed `wait_and_reassess`, expected `reply_now`, and the fixed nine-defect baseline.
- [x] Record runtime decision-policy divergence as the confirmed primary root cause by comparing the accepted M2-P1 rule, current allowed-set implementation, and `REPLY-004` oracle.
- [x] Freeze the exact 12-case diagnostic sample with ten ready cases plus `INFO-001` and `SAFETY-001`.
- [x] Preserve `evals/development/human-review-sample-v1.json` as the immutable formal 20-case G5 sample.
- [x] Preserve holdout as external, unused, and untouched.
- [x] Define the eleven hard-fail codes, eleven five-point product axes, required product direction, and future representative-run acceptance gate.
- [x] Record the seven required report-content fields that are not directly rendered and require a future display/integrate/deprecate disposition.
- [x] Document bounded future slices `M2-P4-I1`, `M2-P4-I2`, `M2-P4-I3`, `M2-P4-E1`, and `M2-P4-E2` without authorizing them.
- [x] Bound future `M2-P4-I1` against overfitting: require application-owned typed decision-material facts, prohibit raw-prose keyword/regex replacement, and require an insufficient current contract to stop with no heuristic workaround; its execution boundary fixes OpenAI calls `0` and DB operations `0`.
- [x] Keep this task planning-only with OpenAI calls `0`, DB operations `0`, runtime changes `0`, Prompt changes `0`, Schema changes `0`, and quality execution not started.
- [x] Human / ChatGPT review and acceptance of the planning package.
- [x] Separately authorize the bounded `M2-P4-I1-A Typed Decision Facts & Pure Policy Reference` sub-slice after planning acceptance.

Planning acceptance did not authorize future slices by itself. Human subsequently authorized and accepted only the exact eight-file M2-P4-I1-A reference-policy sub-slice at accepted implementation commit `27752471caa644b569a08a4587ddf677195c203a`. It uses typed decision-material facts rather than raw consultation-prose keyword or regex matching, validates all 40 decision cases, and made OpenAI calls `0` and DB operations `0`; Prompt assets, historical Schema assets, holdout, current `policy.ts`, and runtime remain unchanged. Live runtime integration remains outside this accepted sub-slice.

# M2-P4-I1-A Typed Decision Facts & Pure Policy Reference

- [x] Confirm exact clean main baseline `3ae93c0d3d9af3e1eccc0b5e53d9b2bca5b93c42` and create `feat/m2-p4-i1-a-typed-decision-policy`.
- [x] Add the strict Draft 2020-12 typed decision-material facts contract.
- [x] Add Human-owned typed projections for exactly 40 existing decision cases in stable development-index order.
- [x] Add the pure deterministic policy reference with order boundary/repeated contact -> meaningful incoming reply -> practical send -> wait.
- [x] Add the dedicated offline verifier and prove exact 40/40, each category 10/10, allowed-set violations `0`, forbidden decisions `0`, and case-specific matching `0`.
- [x] Preserve live runtime/current `policy.ts`, PB-01 Prompt assets, historical `ai/schemas/**`, development cases, frozen G5 sample, holdout, packages, OpenAI, and DB without change or use.
- [x] Complete Human / ChatGPT review and acceptance of M2-P4-I1-A at accepted implementation commit `27752471caa644b569a08a4587ddf677195c203a`.

M2-P4-I1-A is Human / ChatGPT accepted and complete. The typed facts contract, pure deterministic reference policy, Human-owned 40-case projection, exact decision result 40/40, each category 10/10, allowed-set violations `0`, forbidden decisions `0`, and case-specific matching `0` are accepted. Acceptance proves the reference policy; provider/model quality is not proven. M2-P4-I1-B Runtime Typed-Facts Integration is also Human / ChatGPT accepted and complete at `9588c8fd6ab47c265f5f661d4473a29d73885427`. Milestone 2 remains incomplete.

# M2-P4-I1-B Runtime Typed-Facts Integration

- [x] Confirm clean fixed baseline `554d2cb5a2f816ac82edf3cc247458fe34a4a74c` and create `feat/m2-p4-i1-b-runtime-typed-facts`.
- [x] Add PB-01 v2 successor Prompt, self-contained Structured Intake v2 Schema, and hash-verified runtime catalog.
- [x] Preserve the accepted historical common Prompt, PB-02 through PB-06 assets, M2-P1 assets, and canonical loader.
- [x] Implement typed-facts-only runtime policy v2 with I1-A 40/40 reference parity.
- [x] Remove legacy raw-prose policy construction from the active pipeline while preserving `policy.ts` Safety functions.
- [x] Prove Fake `M2P4-LIVE-001` equivalent `reply_now` through report and decision card.
- [x] Prove `ready` null facts fail closed and nonready null facts stop normally before PB-04.
- [x] Keep OpenAI live calls `0`, DB operations `0`, migrations `0`, holdout use `0`, and real-user data `0`.
- [x] Human / ChatGPT review and acceptance; accepted implementation commit `9588c8fd6ab47c265f5f661d4473a29d73885427`.
- [ ] After acceptance only: separately authorize and execute one synthetic `M2P4-LIVE-001` live smoke candidate.

M2-P4-I1-B is accepted and complete. Its v2 catalog and policy remain immutable historical assets. M2-P4-I1-C and R1 through R4 are also Human / ChatGPT accepted and complete: the active service uses PB-01/PB-03/PB-04/PB-05 successor contracts, application-owned Safety-only eligibility, non-null DecisionFactsV2, and accepted v2 policy through a safe adapter. UI and renderer are unchanged; full prose-quality improvement has not started. The acceptance verification used SELECT only and made OpenAI calls `0`, DB writes `0`, and migrations `0`.

# M2-P4-I1-C Contextual Best-Effort Consultation

- [x] Confirm clean fixed baseline `c27120eea067f91c5e9ef4447e382f55a329e158` and create `feat/m2-p4-i1-c-contextual-best-effort`.
- [x] Add Structured Intake v3 with non-null DecisionFactsV2, strict traceable `context_inferences`, best-effort information state, and unresolved decision-field paths.
- [x] Add application-owned Safety-only runtime eligibility and PB-03 acknowledgement-only projection with no `needs_more_information` path.
- [x] Add strict v3 facts validation and safe v2 policy projection while retaining I1-A parity 40/40.
- [x] Advance the active pipeline through PB-04 for all normal consultations, including sparse and largely unknown inputs.
- [x] Preserve accepted I1-A/I1-B and historical Prompt/Schema assets, UI, renderer, packages, development data, and holdout.
- [x] Prove 11/11 normal sparse cases ready with reports, 1/1 Safety case blocked without report, sanitized baseline `reply_now`, and zero external execution.
- [x] Human / ChatGPT review and acceptance at initial implementation commit `da520621b6569ff65ae652fb75945ed923b4fc3b` and accepted stack commit `b523349ec33c36a90c645d4a1b7a6d37832af151`.
- [x] Human executed one synthetic live run; complete SELECT-only integrity verification with OpenAI calls `0`, DB writes `0`, and migrations `0`.

Milestone 2 remains incomplete. I1-C acceptance does not authorize new live OpenAI/Supabase execution, migration, secret access, I2/I3/E1/E2 implementation, representative quality execution, or release.

# M2-P4-I1-C-R1 Contextual Integrity Hardening

- [x] Preserve the original I1-C baseline and exact 21-path historical `implementation_paths` record.
- [x] Freeze the R1 baseline at `da520621b6569ff65ae652fb75945ed923b4fc3b` and declare a separate exact 12-path successor record with no wildcard or prefix authorization.
- [x] Add deterministic PB-01 contextual integrity checks for identifiers, supporting facts/source references, inference-used state, inferred/unresolved exclusion, and unresolved actual values.
- [x] Prohibit inferred boundary/repeated-contact fields and reject invalid contextual intake before PB-02 with `M2_CONTEXTUAL_INFERENCE_INVALID`.
- [x] Fix practical reason and boundary state to three legal canonical/provider Schema branches and conservatively project unresolved practical reason without terminating consultation.
- [x] Limit the runtime catalog change to the new PB-01 Structured Intake Schema SHA-256.
- [x] Preserve the I1-B v2 runtime path and leave `scripts/verify-m2-p3-runtime-vertical-slice.mjs` unchanged.
- [x] Run the required sequential offline verifier, typecheck, lint, build, exact-scope, protected-diff, and `git diff --check` gates.
- [x] Human / ChatGPT review and acceptance at implementation commit `bee69d1cf0f1792786eccc6508fb5e7184ad6241`.
- [x] Preserve the separate Human-executed synthetic live and SELECT-only integrity evidence without changing task-time offline evidence.

R1 does not authorize OpenAI live calls, DB operations, migrations, holdout use, real-user data, retry, Repair/PB-07, fallback, PR creation, merge to `main`, or release.

# M2-P4-I1-C-R2 Safety Aggregation & Report Direction Grounding

- [x] Preserve the original I1-C exact 21-path history and R1 exact 12-path successor history unchanged.
- [x] Freeze R2 baseline at `bee69d1cf0f1792786eccc6508fb5e7184ad6241` and declare a separate exact 10-path successor without wildcard, prefix, or future-path authorization.
- [x] Add contextual Safety aggregation with strictest classification, `normal_allowed -> none`, specialized non-normal response modes, and mixed `normal` removal.
- [x] Preserve legacy `policy.ts` and `aggregateSafety()` unchanged.
- [x] Ground only `relationship_summary` from typed sender/reply state after PB-05 while retaining raw PB-05 Stage evidence.
- [x] Supply grounded report content to PB-06 and persist it in the final report without retry, Repair, PB-07, or fallback.
- [x] Prove four report-direction states, reversed-summary correction, PB-06 input/final grounding, and major/critical PB-06 fail-closed behavior.
- [x] Preserve policy parity `40/40`, sparse `11/11`, Safety `1/1`, I1-B/I1-A/foundation/M2-P3 gates, protected diff `0`, and exact R2 scope `10/10`.
- [x] Human / ChatGPT review and acceptance at implementation commit `2659c14d82fe2589d2e1cfc655c52c13b878dc7c`.
- [x] Preserve the separate Human-executed synthetic live and SELECT-only integrity evidence without changing task-time offline evidence.

R2 task-time evidence uses OpenAI calls `0`, DB operations `0`, migrations `0`, holdout use `0`, and real-user data `0`; its task-time live rerun was not executed. The later Human-executed synthetic run and SELECT-only integrity verification are recorded separately. R2 alone did not authorize a PR, merge to `main`, broader prose-quality work, or release.

# M2-P4-I1-C-R3 PB-01 Evidence Canonicalization

- [x] Preserve the original I1-C exact 21-path, R1 exact 12-path, and R2 exact 10-path histories unchanged.
- [x] Freeze R3 baseline at `2659c14d82fe2589d2e1cfc655c52c13b878dc7c` and declare a separate exact 9-path successor without wildcard, prefix, or future-path authorization.
- [x] Make request relationship, exact requested topics, and trimmed optional-message presence authoritative in a deep-cloned downstream PB-01 intake.
- [x] Remove contextual inference and unresolved markers for application-owned relationship and proposed-message fields.
- [x] Canonicalize remaining inference source refs from the stable unique union of existing supporting-fact source refs without inventing facts or changing supporting IDs.
- [x] Preserve raw PB-01 Provider output as Stage evidence; revalidate and integrity-check only the grounded downstream object.
- [x] Prove the `2026-07-31` live-failure equivalent reaches `ready -> reply_now -> non-null draft -> report 1`, while named invalid evidence remains rejected.
- [x] Preserve policy parity `40/40`, sparse and Safety cases, PB-06 fail-closed behavior, I1-B/I1-A/foundation/M2-P3 gates, protected diff `0`, and exact R3 scope `9/9`.
- [x] Human / ChatGPT review and acceptance at implementation commit `e4e844cbaa8534c68a0d87d5831d04b5afe676a1`.
- [x] Preserve the separate Human-executed synthetic live and SELECT-only integrity evidence without changing task-time offline evidence.

R3 task-time evidence uses OpenAI calls `0`, DB operations `0`, migrations `0`, holdout use `0`, and real-user data `0`; its task-time live rerun was not executed. The later Human-executed synthetic run and SELECT-only integrity verification are recorded separately. R3 alone did not authorize a PR, merge to `main`, Schema/Prompt/catalog/hash changes, broader prose-quality work, or release.

# M2-P4-I1-C-R4 Temporal Change-Condition Semantics

- [x] Preserve the original I1-C exact 21-path, R1 exact 12-path, R2 exact 10-path, and R3 exact 9-path histories unchanged.
- [x] Freeze R4 baseline at `e4e844cbaa8534c68a0d87d5831d04b5afe676a1` and declare a separate exact 10-path successor without wildcard, prefix, or future-path authorization.
- [x] Generate application-owned future-condition commentary in PB-04 change-condition order without converting it to a current send/wait/stop instruction.
- [x] Preserve raw PB-05 output as Stage evidence; revalidate and supply the relationship/change-condition-grounded projection to PB-06 and the final report.
- [x] Make only exact future `DECISION_ALLOWED` and exactly matched grounded-commentary `MESSAGE_POLICY_CONSISTENCY` findings nonblocking for contextual runtime.
- [x] Preserve selected-decision, message-draft, action, three-day-plan, fact, assumption, Safety, certainty, mismatched-commentary, and all other major/critical fail-closed behavior.
- [x] Prove the four-finding live-failure equivalent is temporal false positives `4`, blocking `0`, final report `1`, with raw Stage evidence and relationship grounding preserved.
- [x] Preserve policy parity `40/40`, sparse and Safety cases, I1-B/I1-A/foundation/M2-P3 gates, protected diff `0`, and exact R4 scope `10/10`.
- [x] Human / ChatGPT review and acceptance at implementation commit `b523349ec33c36a90c645d4a1b7a6d37832af151`.
- [x] Complete exact accepted stack audit `27/27`, exact acceptance-sync scope `8/8`, protected historical diff `0`, and SELECT-only live integrity verification.

R4 task-time evidence remains OpenAI calls `0`, DB operations `0`, migrations `0`, holdout use `0`, and real-user data `0`. Separately, the Human-executed synthetic run at `2026-07-31T22:20:38+09:00` passed read-only integrity verification for request prefix `dd1e4da8` / run prefix `ae3562b6`: `completed / ready / reply_now`, six ordered completed Stages, draft present, report `1`, `normal_allowed / none`, matching nonzero usage, processing residue `0`, mixed state `0`, and integrity anomalies `0`. Verification made OpenAI calls `0`, DB writes `0`, and migrations `0`.

# M2-P4-I2 / I3 Human Product Direction

- [x] Fix the target: 恋愛の悩みを毎回友人へ相談しづらくなり、ひとりで考えすぎてしまう夜の相談相手を必要とする30代前後の女性。
- [x] Fix the product position: 月の返事は恋の正解や未来を断定するサービスではない。相談者の気持ちを受け止め、状況を整理し、今夜の一歩を一緒に決める相談相手である。
- [x] Fix the desired after-feeling as `分かってもらえた` -> `納得できた` -> `動けそう`.
- [x] Fix the voice: 優しいが曖昧ではない。親身だが馴れ馴れしすぎない。大人の利用者を子ども扱いしない。相手の本心は断定しない。相談者の次の行動は明確にする。不安を受け止めるが、不安を増幅しない。業務レポート調、AI免責の反復、過度な占い師口調を避ける。
- [x] Fix the hierarchy with `今夜の答え`, `そのまま使える返信案`, and `今夜の具体的な動き方` above reasons, readable facts, non-assertable matters, tomorrow onward, and change conditions.
- [x] Require case-specific `送る前`, `送る文面`, `送った直後`, `今夜やらないこと`, and `明日以降` guidance rather than only “返信する”.
- [x] Preserve Safety: 都合の良い断定はしない。ただし、通常の情報不足を理由に相談回答を止めない。Safety問題時も、可能な範囲で安全な次の一歩を返す。
- [x] M2-P4-I2 Report Information Architecture and Intent Fulfillment: Human / ChatGPT accepted complete at `410714875903ae61b5bcdc6cce90030f5679b3b3`; immutable exact implementation scope `16/16`; exact renderer exceptions `4/4`; seven hidden fields disposed `7/7`; selected intent mappings `6/6`; desktop and 399px mobile Visual QA PASS; horizontal overflow and content clipping `0`; tonight answer/draft/action hierarchy and responsive three-day timeline PASS; OpenAI/DB/migrations/holdout `0`.
- [ ] M2-P4-I3 PB-04 / PB-05 / PB-06 Product Quality Revision: exact scope `19/19` offline accepted at `c85d6d122ad71569532a55887b9a3b6d93f8a288`; one separately Human-authorized synthetic live smoke succeeded and showed major improvement; final I3 acceptance and merge to `main` remain pending. Runtime v4 advances PB-04/PB-05/PB-06 only, passes the optional candidate/topics directly, preserves Schema/UI/Policy/Safety, makes minor tone/genericity/repetition findings nonblocking, and keeps true major/critical defects fail-closed.
- [x] M2-P4-I3-R1 Interaction, Relationship & Voice Fidelity Final Planning Package: Human / ChatGPT accepted complete at accepted planning commit `3c64e5e2179b4c03979119068716326337a002c6`; review correction resolved; immutable exact `12/12` path snapshot `ec7cd53884ab4056c78d2596c609baef5701274a..3c64e5e2179b4c03979119068716326337a002c6`; Canonical Suite `64/64`, Layer 1 `32/32`, Layer 2 `32/32`, eight categories of eight, Layer 1 deep equality PASS; final precedence, flexible aftercare, `pre_action_check`, Structured Intake successor `writing_context`, all 25 hard-fail owners, quality-gate disposition, Privacy, repeat consultation, version drift, one recommended draft, and one user-initiated adjustment included in JPY 980 accepted. That planning acceptance itself did not authorize implementation.
- [x] M2-P4-I3-R1-A Successor Schemas and Typed Writing Context Contracts: Human / ChatGPT accepted complete at `8030c0b7778ccea3d7d90cbffcf21ac9c1052bcd`; implementation commits `3ba1d2aab4d3af5cb30e95b5c5c12c0f0eb2e19a` and `8030c0b7778ccea3d7d90cbffcf21ac9c1052bcd`; immutable exact `18/18` contract-only snapshot `e5cfd903740267db6d070964a9ec72a7d823f310..8030c0b7778ccea3d7d90cbffcf21ac9c1052bcd`; verifier-only self-correction resolved with no scope expansion and no force push; candidate schema set `pipeline-schema-runtime-v4.0.0`; Structured Intake v4, pure `writing_context` contract, Decision Plan v2, Report Content v2, Provider projection, fixtures `6/6` valid and `10/10` invalid accepted; Canonical Suite `64/64` and decision Policy `40/40`; active Runtime remains v3; Provider score absent.
- [x] M2-P4-I3-R1-B PB-01 v4 Writing Context Extraction and Grounding: Human / ChatGPT accepted complete at `4a1237ac647bff79229d7181d978d5613c2c3b87`; implementation commits `0ccf59114fe4079e0a5513fef3faf1b9fade11e7` and `4a1237ac647bff79229d7181d978d5613c2c3b87`; immutable exact `22/22` snapshot `2381312ced5fc726dfa245632c25da6bb68a376f..4a1237ac647bff79229d7181d978d5613c2c3b87`; review correction resolved in exact `9/9` scope with provenance ownership `7/7`, valid grounding `20/20`, invalid grounding `20/20`, Fake Pipeline `3/3`, full PB-02 through PB-06 input parity `15/15`, and leakage `0`; PB-01 v4 Prompt, typed grounding, Integrity validation, and v3 legacy downstream view accepted; inactive catalog v5 / prompt bundle v5 / transitional schema set v3.1; active Service remains catalog v4 / schema set v3; Decision / Report unchanged.
- [x] M2-P4-I3-R1-C1 PB-01 v4 Bounded Provider Diagnostic execution protocol: Human / ChatGPT accepted complete with immutable exact `21/21` snapshot `76c469db264cd1cb9434b6a19ec5c75db5754a2a..7b0c1b6da5d877f7a7a6de5be431276452e3b8b2`; commits `0c228406298fbb829cbb216e31c00e6812cc1393`, `7b0c1b6da5d877f7a7a6de5be431276452e3b8b2`; calls `12/12`; retry / repair / fallback `0`; raw / grounded Schema `12/12`; v4 Integrity `0/8`; v3 Integrity `3/4`; style evidence unavailable; product gate `FAIL`; active Runtime unchanged; no rerun; C2 eligibility / authorization false.
- [x] M2-P4-I3-R1-C1-R1 Offline Diagnostic Postmortem and Grounding Responsibility Revision: Application architecture and offline implementation Human / ChatGPT accepted complete at `d8415e2ae165143d646c6f9573e24752d8b1a1c7`; implementation commits `715fd906ad94ecc18b55dd13b16784c26bf12129`, `28bedad969d1007bbd731f0e9d47824eecd84651`, and `d8415e2ae165143d646c6f9573e24752d8b1a1c7`; immutable exact `31/31` snapshot `bdc98af2c7c59a1d7ececa2077906c8fbb839ac9..d8415e2ae165143d646c6f9573e24752d8b1a1c7`; final review correction exact `9/9` at `28bedad969d1007bbd731f0e9d47824eecd84651..d8415e2ae165143d646c6f9573e24752d8b1a1c7`; expected input injection `0`; strict source replay remains `FAIL / 5/8`, critical expected subset `5/8`, ownership `7/8`; Application-adjudicated Decision Facts and canonical fixtures `8/8`; PAIR-02 expectation-contract defect; V4-06 nonmaterial taxonomy equivalence with identical Decision Policy; PAIR-03 `temporary_distance / explicit` -> `none / none`; PAIR-04 `no_contact / explicit` preserved pre/post; V4-08 strict `unknown / unknown` -> Application `none / none`, ownership evidence unavailable from source diagnostic, Provider semantic coverage `7/8`, Provider quality not accepted, Provider retest required `true`; Application fixture is unit-only evidence; Provider / DB / Supabase / holdout `0`; inactive catalog v6; active Runtime unchanged; R1-C1-R2 and C2 unauthorized.
- Historical note: the preceding R1-C1-R1 checklist records the authorization state at its acceptance commit. The current separate R1-C1-R2 authorization is limited to the exact package below and does not mutate that historical record or authorize C2.
- [x] M2-P4-I3-R1-C1-R2 PB-01 v5 Bounded Provider Diagnostic: `human_chatgpt_reviewed_fail_complete`; execution protocol, diagnostic evidence, and the saved-evidence offline evaluator correction accepted; Provider product gate failed. Immutable diagnostic snapshot `277101219c27477e67e1196af0e6067713571edc..7239f50fd24eb80369e74583cd619c2155813401` is exact `17/17`, execution commits are `d0ad3eceb130a806b2c2b06cb1a59dbbaa35bf4e` and `7239f50fd24eb80369e74583cd619c2155813401`, and review sync is exact `8/8` with remaining execution-evidence blobs unchanged. Exact eight sequential synthetic-only PB-01 v5 calls used `gpt-5.6-luna`; calls / completed `8/8`, retry / repair / fallback / PB-02 through PB-06 / DB / Supabase / holdout / real-user data all `0`; raw / grounded Schema and Writing Context Integrity v2 `8/8`, Provider semantic core `5/8`, contextual Integrity and Decision Facts `7/8`, ownership `6/8`, boundary ownership `8/8`, privacy-repeat-injection `8/8`, cases passed `5/8`, verdict before / after evaluator correction `FAIL / FAIL`. R2-03 is a constraint-taxonomy failure, not a restrictive-boundary safety failure; R2-04 is a cross-projection message-ownership inconsistency with `no_contact / explicit` preserved; R2-08 omitted quoted other-person ownership despite injection, privacy, repeat, and candidate-absence passes. Authorization is consumed, no rerun is authorized, active Runtime is unchanged, and C2 is ineligible / unauthorized. Historical verifier mode is `accepted_sha_external_clone`: the old seven pass `7/7` at `277101219c27477e67e1196af0e6067713571edc`, remain current-branch incompatible due to exact R1-C1-R1 31-path snapshot authority, and have mutations / scope expansion `0 / 0`. Next candidate `M2-P4-I3-R1-C1-R2-R1 Offline Provider Semantic Consistency Revision` is unauthorized.
- Historical note: the preceding R2 checklist preserves its review-commit authorization state. A later separate Human instruction authorized only the offline R1-C1-R2-R1 successor below.
- [x] M2-P4-I3-R1-C1-R2-R1 Offline Provider Semantic Consistency Revision: Human / ChatGPT accepted complete at implementation commit `378c304c45b85cf419d263204e495f2d800a8bc9`; immutable exact `13/13` snapshot `2c3f9e8a4b1c763a2d7d56d367cf16dc4993aca6..378c304c45b85cf419d263204e495f2d800a8bc9`; acceptance sync exact `8/8`. Inactive PB-01 Prompt v6 / catalog v7 accept known-taxonomy precedence, cross-projection message consistency, untrusted quoted-content ownership, and the final internal consistency check; `no_additional_message` maps to `no_followup_message`. Provider Schema v5, candidate Runtime schema set v3.2, grounded Schema v4, Prompt v5, catalog v6, PB-02 through PB-06, accepted R2 evidence, and active Runtime catalog v4 remain unchanged. Provider calls / outputs mutated / DB / Supabase / holdout / real-user data are `0 / 0 / 0 / 0 / 0 / 0`; the R2 result remains `human_chatgpt_reviewed_fail_complete`, `FAIL / 5/8`, authorization consumed, rerun unauthorized; Provider quality established `false`; retest required `true`; R2-R2 retest authorized `false`; C2 eligible / authorized `false / false`; final I3 acceptance pending; `main` unchanged; Milestone 2 incomplete.
- Historical note: the preceding R2-R1 checklist preserves its acceptance-time authorization state. A later separate Human instruction authorized only the completed R2-R2 diagnostic below.
- [x] M2-P4-I3-R1-C1-R2-R2 Four-Case Bounded Provider Diagnostic: `human_chatgpt_reviewed_fail_complete`; execution protocol and diagnostic evidence valid; immutable exact `17/17` snapshot `fbb315f45e777fe2001e54657d7015ebbf7d3663..2cb243486063ba9235f4f3ce65f051cf5fd38d6e`; Commit A `36e7d1967a502f0ed80aaccb12d44507f0058560`; Commit B `2cb243486063ba9235f4f3ce65f051cf5fd38d6e`; review sync exact `8/8`; nine execution artifacts unchanged. Provider calls `4/4`, additional calls `0`, retry / repair / fallback / PB-02 through PB-06 / DB / Supabase / holdout / real-user data all `0`. Targeted repairs `3/3 PASS`, principal quoted ownership PASS, ownership sequence control PASS, normal control FAIL, Decision Facts semantic completeness FAIL, and frozen targeted verdict `FAIL / 3 of 4`. R2R2-04 is `decision_policy_equivalent_but_semantically_incomplete`: actual facts and the temporary comparison-only practical reason both yield deep-equal `reply_now / unanswered_meaningful_message`; no evidence or verdict was rewritten. Authorization consumed, rerun unauthorized, Provider quality unestablished, full eight-case confirmation required, Active Runtime and `main` unchanged, C2 ineligible / unauthorized. Next candidate `M2-P4-I3-R1-C1-R2-R2-R1 Offline Practical Reason Consistency Revision` is unauthorized.
- Historical note: the preceding R2-R2 checklist preserves its review-time authorization state. A later separate Human instruction authorized only the offline R2-R2-R1 revision below.
- [x] M2-P4-I3-R1-C1-R2-R2-R1 Offline Practical Reason Consistency Revision: `human_chatgpt_accepted_complete` at accepted implementation commit `b65af5303d0f1514742b794a00ce35f5c4a99bf4`; immutable exact `13/13` snapshot `33a91f00be9f71fa533c9635d30425dc23914d81..b65af5303d0f1514742b794a00ce35f5c4a99bf4`; acceptance sync exact `8/8`; inactive Prompt v7 / catalog v8 require concrete schedule evidence and practical-reason agreement, accept `question` / `schedule_coordination` taxonomy equivalence when practical function is preserved, prohibit candidate-only and `optional_message` incoming inference, preserve targeted repairs `3/3` and ownership sequence, and leave Prompt v6/v7, catalog v7/v8, R2-R2 evidence, Application, Policy, and active Runtime unchanged by the sync. Provider calls / outputs mutated `0/0`; Provider quality established `false`; final eight-case confirmation required `true` and authorized `false`; C2 eligible / authorized `false / false`; `main` unchanged; Milestone 2 incomplete.

I2 is Human / ChatGPT accepted and complete. Its non-blocking backlog is the mobile tonight-action heading wrap, slightly tall cover, and intent-link affordance; no UI correction is part of I3 or I3-R1 planning. I3 task-time OpenAI calls, DB operations, migrations, holdout use, and real-user data were `0`; the separate synthetic live smoke is not the R1-C1 scored Provider diagnostic or final acceptance. R1-A and R1-B remain accepted inactive/offline slices. R1-C1-R2 is Human / ChatGPT reviewed complete with Provider verdict `FAIL`; R1-C1-R2-R1 and R2-R2-R1 are accepted offline. The later R2-R2 four-case diagnostic is Human / ChatGPT reviewed complete with targeted repairs `3/3 PASS` but frozen verdict `FAIL`; its consumed authorization grants no rerun. R2-R2-R1 acceptance does not establish Provider quality or an eight-case PASS. Final eight-case confirmation, C2 Runtime activation, E1, final I3 acceptance, release, and merge remain unauthorized or pending. Active Runtime remains catalog v4, `main` remains `61e33a10e195fad17e253a6b9719217e1992f273`, and Milestone 2 remains incomplete.

Payment, authentication, email, analytics, public release, real-user processing, PDF/download/share/print, background execution, queue, cron, mobile API, public history, retry, Repair/PB-07, and fallback remain unauthorized.
