# ROADMAP.md

## 1. Status and Authority

This document is the authoritative high-level delivery roadmap for the initial paid Web MVP and the later Web -> iOS -> Android product sequence of 月の返事.

The canonical service is an `AIを活用した恋愛メッセージ分析・判断支援デジタルレポート`, presented to users as `恋のメッセージ鑑定ノート`. It is one report, not chat, sold as a JPY 980 one-shot service for users aged 18 or older. Safety enforcement must occur before payment.

Earlier documents considered semi-manual validation, semi-manual Web delivery, automated Web, subscription, and native-app alternatives. Those records remain historical context but do not control the current delivery sequence. Where another planning document conflicts with this roadmap, this roadmap controls until Human approves a documented change. `docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md` is the canonical detailed strategy for Payment, Platform, Purchase, Entitlement, and Monetization within this roadmap.

### Long-term platform and monetization sequence

The Human-approved platform/product sequence, with the accepted Stripe-first strategy kept separate from Provider feasibility and selection, is:

1. Phase A — Web / accepted Stripe Checkout strategic direction / credit/debit cards, Apple Pay, Google Pay, and PayPay / JPY 980 tax-inclusive one-time purchase;
2. Phase B — real-customer paid Web validation;
3. Phase C — iOS / Apple In-App Purchase / RevenueCat;
4. Phase D — Android / Google Play Billing / RevenueCat;
5. Phase E — repeat-purchase data analysis; and
6. Phase F — subscription design and implementation only if demand is established.

The initial Web milestone sequence below is the execution lane for Phases A and B. iOS and Android are not simultaneous implementation tracks. Purchase-count figures used to consider iOS or subscription are Product Owner heuristics, not automatic gates or implementation authorization.

Current status:

- Milestone 0 is completed.
- Task 18C-R3 is accepted by Human at commit `54e5f2dba518eb13ab2fb1d7f645799be65fd1e8`.
- Tasks M1-P1 and M1-P1-R1 are accepted by Human.
- Tasks M1-I1 through M1-I5 and M1-I5-R1 are accepted by Human.
- Task M1-I6 was not accepted by Human and is formally closed as superseded by M1-P2. Its implementation and evidence remain historical records, and its known defects were carried into M1-I7 through M1-I12 and final M1-I12 QA. Milestone 1's later acceptance does not retroactively accept M1-I6.
- Task M1-P2 Experience & Visual Direction Revision is complete and accepted by Human. It documents the broader revision inside Milestone 1; no later M1-I6 Human Visual QA or disposition gate is required.
- M1-P2 is a planning task. Its acceptance did not itself authorize implementation. Human subsequently authorized M1-I7, then explicitly authorized a one-time integrated M1-I7 through M1-I11 implementation batch that replaced the normal prior-slice acceptance pauses for this batch only.
- Human accepted the integrated M1-I7 through M1-I11 redesign as the baseline for the next planning stage. This was one integrated baseline decision, not independent acceptance records for each slice; by itself it did not constitute final Milestone 1 acceptance, which was recorded later through M1-I12.
- Human also accepted M1-P2-R1 Public Sample Conclusion Diversification and the subsequent bounded M1-P2-R1-R1 contrast/comparison-boundary correction. The accepted baseline contains separate wait/send/stop-additional-contact public fictional cases while preserving `result-normal-001`, Safety, and runtime boundaries.
- Task M1-P3 Reading Note Visual Excellence Specification is complete and Human and ChatGPT accepted. Its documentation/design package remains the authoritative Visual Excellence specification, and B — `Lunar Contrast Edition` is the selected canonical design direction. The specification's acceptance did not itself authorize canonical implementation.
- Task M1-I2-R1 Safety Policy Enforcement Alignment is Human-accepted and synchronized to `main`. `SEM-UNSUPPORTED-CASES` passes without waiver, and the previous M1-P3-R1 hard stop is resolved.
- M1-P3-R1 implements two isolated, review-only coded visual prototypes using the same fixed `result-normal-001` content and semantic order. Automated validation is complete. Human selected and accepted B — `Lunar Contrast Edition` as the canonical design direction and rejected A — `Quiet Editorial Letter`; the Human design-selection gate is complete.
- The required M1-P3 coded-prototype design gate is satisfied by the B selection. Figma remains optional, non-authoritative reference material and is not required for implementation. Prototype acceptance is design-direction evidence, not canonical visual implementation authorization.
- M1-I8-R1 is complete, Human-accepted, and merged to `main`; Checkpoint B's accepted implementation-and-polish commit is `bb2079aafb3666562e2876ead4c24a5c933bea8a`, and its acceptance synchronization is on `main` at `06c20f71c21d7968a97aa78dbe12f480c1abf7c5`. M1-I9-R1 is complete, Human-accepted at final implementation commit `82600df57481cae2c61d370288083a61f0c719c3`, and merged to `main`. M1-I12-R1 is on `main` at `8b35fbe24a1d32f2cf827874231ce76eb237ad07`; M1-I12-R2 is Human-accepted and on corrected `main` at `cf05dbca2bbc6ce75f2eeed69d606b5a00a07d82`. M1-I12-R3 automated final QA and Human final QA are complete. M1-I12 is Human-accepted and complete. Milestone 1 is Human-accepted, complete, and closed.
- The accepted Checkpoint B and M1-I9-R1 canonical surfaces are on `main`. The historical pre-R2 QA branch `qa/m1-i12-final-acceptance` remains preserved and non-authoritative for corrected main. The corrected QA package on `qa/m1-i12-final-acceptance-r2` is the Milestone 1 closure package and is authorized for fast-forward-only synchronization to `main`. The read-only prototype routes/components remain isolated on `design/m1-p3-coded-visual-prototype`; no prototype commit was merged, cherry-picked, or rebased into Checkpoint B, M1-I9-R1, or `main`.
- The controlling artifact names are `恋のメッセージ鑑定ノート` for the product, `Web鑑定ノート` for the long presentation, and `保存用判断カード` for the short presentation. Checkpoint B aligns the authorized saved-artifact and Brand Foundation labels. The out-of-manifest `lib/legal/review-content.ts` residual `保存用鑑定書見本` remains deliberately deferred.
- M2-P1 AI Quality Specification & Evaluation Foundation and M2-P1-R1 Evaluation Foundation Integrity Hardening are Human / ChatGPT accepted and complete. The accepted foundation implementation commit is `c56f597d0491482995c4afa6fb64cf148dd66345`. M2-P1-R2 Acceptance Manifest Boundary Correction is implemented and automatically validated at `e859b4cdfc0efa03d3372784ea34f4abb61bee9d`; it anchors historical verification and does not change the accepted dataset, Schemas, Prompt assets, hashes, or policies. The canonical foundation contains exactly 70 development cases, 42 contrast sets, 130 contrast memberships, 7 connected components, an exact frozen 20-case Human-review sample, 9 JSON Schemas, PB-01 through PB-07, 16 prompt assets, machine-readable bounded retry and stage-responsibility contracts, and all-disabled runtime capability declarations. Acceptance synchronization is authorized for fast-forward-only integration to `main`.
- The largest development contrast component contains 51 cases. Development cases must not be randomly split into holdout. The future 15-case holdout must be authored independently and must not share counterfactual or contrast-set relationships with the development dataset.
- M2-P2-A-R1 Successor Tool Allowlist Correction is Human / ChatGPT accepted and complete at `deff429e45a411f0d6c6d5bd3f199adca994ebb5`. M2-P2-A Zero-Cost Token & Cost Estimator is Human / ChatGPT accepted and complete at accepted estimator implementation commit `2e2e0cc4c57c46320d56aa986055f65187aa6aee`. The accepted evidence covers exactly six scenarios, deterministic dry-run envelopes, oracle isolation, synthetic upstream profiles, LOW / CENTRAL / HIGH estimate bands, no-cache conservative costs, deterministic JSON and Markdown reports, and generated-report hash `0e79050e8f44d91b2329e92e97fd91b833c0a37bda397bb16b20132beb4ec84f`. M2-P2-B0-R1 is accepted and complete at `a757e7f28affe29a423ff817872a1a7f650a7fd2`. M2-P2-B0-R2 is accepted and complete at `88b456622950622c35510f4b3b9d19abbd9ec8da`; it preserves the accepted historical 16-file snapshot and makes all M2-P2-A scope gates pass without adding B0 to that snapshot. The exact 18-file M2-P2-B0 contract implementation at `cf75679f2d116132f7519256cd762ba1a51a0af9` has completed automated validation and Human / ChatGPT final review and is accepted and complete. M2-P2-B1-A-R1 Successor Tool Allowlist Correction and M2-P2-B1-A are Human / ChatGPT accepted and complete. M2-P2-B1-B1-R1 is Human / ChatGPT accepted and complete at correction commit `2f9fa4f2aa0616a03ec716bf0c09e1d0e0df038e`; M2-P2-B1-B1 is Human / ChatGPT accepted and complete at implementation commit `efdf10067fb3c1b4072c891ab5f3f1d2c949de55`. M2-P2-B1-B2-A-R1 is Human / ChatGPT accepted and complete at correction commit `fa222917f0e6ff4a4e25d11da239717c062af6d0`; M2-P2-B1-B2-A Dormant OpenAI Live Binding Foundation is Human / ChatGPT accepted and complete at implementation commit `76ceb4a25cc565e84b9537bd25dbe703f87bd342`. Its HTTPS executor and environment-secret provider remain dormant: live and paid authorization are false, the approval record is absent, actual environment reads, secret resolutions, HTTPS requests, and provider calls are zero, and API spend is USD 0. M2-P2-B1-B2-B paid calibration execution remains unauthorized and not started.
- M2-P2-B1-B2-B0-R1 historical-scope and execution-boundary correction is Human / ChatGPT accepted and complete at `30c05ca2c383641676a3c1fde680e2e83d44397f`. M2-P2-B1-B2-B0 One-Time Paid Calibration Execution Package is Human / ChatGPT accepted and complete at `e8b369baa14ff417fed19d75f31c733dd5c8d240`. M2-P2-B0 through M2-P2-B1-B2-B0 are retained as paused internal QA tooling and are not the active product path. M2-P2-B1-B2-B1 true external approval creation and paid execution remain unauthorized and not started.
- M2-P3-A Internal AI Assessment Runtime Vertical Slice is Human / ChatGPT accepted and complete. The accepted implementation commit is `9bdae7cf05034c7742e5f58f7b104d65cb27a87f`; the accepted M2-P3-A-R1 Runtime Security and Transaction Hardening commit is `3f1123439dcbc724c70505956aa81fa03a9246ad`. Automated validation, dependency review, transaction hardening, and Human Visual QA are complete. In a separate post-acceptance Human-confirmed local development operational state, the OpenAI/Supabase setup, migrations, and bounded synthetic live E2E through PB-01 to PB-06, validated persistence, atomic finalization, usage-total persistence, and assessment-note rendering succeeded.
- Stripe Checkout is the Human + ChatGPT accepted strategic primary Web direction to investigate and prepare. Stripe feasibility is not established; account/contact/approval/activation are absent; formal selection is incomplete; and desired-method eligibility is unverified. PAY.JP is a paused fallback with preserved evidence. Strategy acceptance, Provider evidence/approval, formal selection, Payment Charter acceptance, and implementation authorization remain separate states.
- The explicit `2026-08-10` Human decision records the pre-payment Safety Engine and Safety UX as Human + ChatGPT accepted complete on the Safety line ending at HEAD `55238f64a2409fb0f3f60d3d008f7db4d3a805a1`. Older task-local P6 pending-review labels remain immutable historical records; this does not establish Payment implementation or final JPY 980 readiness.
- Payment Charter v1 is `human_chatgpt_accepted_complete` as of `2026-08-12`; Payment implementation authority remains `false`. The Stripe-first strategy is `stripe_feasibility_and_web_payment_strategy_pivot_human_chatgpt_accepted_complete`; Customer-facing / Public-copy Alignment is `stripe_first_customer_public_copy_alignment_human_chatgpt_accepted_complete`; and Stripe Feasibility Evidence Preparation is `stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete`. Lane A remains `preparation_human_approved / external_action_not_authorized / not_submitted / null` but is preserved inactive. Human directed on `2026-08-13` that Stripe Sales not be used (`not_used_by_human_direction`), which is not a Provider outcome. Current next work is Human + ChatGPT review of the Stripe Lane B Human Decision Package Candidate (`stripe_lane_b_human_decision_package_candidate_ready_pending_human_chatgpt_review`; acceptance `pending`). Lane B/C remain blocked; no external action is authorized. Stripe feasibility/account/approval/activation/formal selection and desired-method eligibility remain unresolved. No Provider account/contact/API, production backend connection, Payment implementation, production OpenAI/Supabase connection, email, public release, legal publication, or deployment work is authorized. The bounded synthetic development connection is not a production connection.

## 2. Initial Web MVP Completion Definition

The initial paid Web MVP is complete only at Milestone 9, when a first real unknown customer can and does:

1. open the public LP;
2. submit a reading request;
3. pass production server-side age and safety validation;
4. establish a verified delivery/recovery email through current-flow mailbox verification or a valid server-verifiable trusted session bound to the unchanged email;
5. complete the final JPY 980 purchase confirmation;
6. pay JPY 980 once;
7. trigger AI analysis and report generation;
8. open the result through an unguessable URL;
9. receive or recover the result through the verified delivery/recovery channel; and
10. submit feedback or provide traceable support follow-up.

The initial paid Web MVP remains no-login. A trusted delivery/recovery session is not a Customer account and cannot replace Safety eligibility or final purchase confirmation.

The operator must be able to identify the order, payment state, generation state, and delivery state; handle failures and refund/escalation cases; and stop new paid orders when necessary.

Completion is not established by a deployed review site, a provider application, a sandbox payment, or a successful internal E2E run alone.

## 3. Current Completed Foundations — Milestone 0

Status: completed.

Completed foundations:

- product concept and JPY 980 one-shot model;
- Next.js, TypeScript, and Tailwind project foundation;
- static LP;
- request-form UI;
- required 18-or-older age-group selection and client-side validation;
- deterministic local safety foundation;
- Supabase schema foundation;
- legal/compliance foundation;
- legal-page drafts;
- provider-inquiry preparation; and
- canonical service positioning.

These foundations do not mean that production request persistence, production server validation, provider approval, payment, AI generation, email delivery, public legal pages, or deployment is complete.

## 4. Milestone 1: Reviewable Web MVP

Status: Human-accepted, complete, and closed.

Goal: create a payment-free, externally reviewable representation of the complete purchase and delivery experience.

Accepted boundary: a fixed-fixture Reviewable Web MVP with no real AI, runtime DB, payment, email delivery, deployment, production analytics, account system, or PDF/download/share implementation. This is not the production-ready or payment-ready paid Web MVP defined for Milestone 9.

Required reviewable routes or screens:

- `/`;
- `/request`;
- request confirmation;
- safety blocked state;
- safety needs-review state;
- purchase/final-confirmation screen;
- sample report page;
- production-shaped result page using fixture data;
- legal-information index or navigation;
- Terms, Privacy, Tokushoho, Refund, AI disclosure, unsupported-cases, and contact pages.

Allowed: fixture data, mock request/payment state, sample report content, and a disabled or preparation-only purchase action.

Prohibited: real payment, OpenAI API, real email sending, public database writes, fake customer reviews, fake purchase counts, and fictional operator information presented as real.

Exit criterion: a reviewer can understand what is sold, the price, input flow, safety boundaries, final confirmation, expected output, and legal/support information without real payment or AI integration.

## 5. Milestone 2: Internal Automated AI / DB Vertical Slice

Status: M2-P1 and M2-P2-A are accepted and complete. M2-P2-B0 through M2-P2-B1-B2-B0 are retained as paused internal QA tooling. M2-P3 Runtime Vertical Slice is fully complete, including the separate post-acceptance Human-configured synthetic live E2E and successful-run DB integrity verification; Milestone 2 remains incomplete. Current work is M2-P4 quality evaluation planning, and quality evaluation execution has not started. M2-P2-B1-B2-B1 external approval creation and actual paid execution remain paused and unauthorized.

Accepted internal boundary: in a Human-confirmed local development operational state, one bounded synthetic consultation moved from the request sheet through the internal Next.js server route, eligibility, Safety, PB-01 through PB-06, Provider Structured Outputs, canonical AJV validation, Supabase Stage persistence, atomic finalization, usage-total persistence, and assessment-note rendering. This synthetic development connection is explicitly distinct from a production connection.

The completed DB integrity verification inspected existing records through server-side SELECT only. Request, Run, Stage cardinality/order, Stage persistence, usage totals, report, atomic timestamp, mixed success/failure, and global anomaly checks passed. Processing rows and integrity anomalies were `0`; two failed runs both carried safe code `M2_STAGE_PROVIDER_FAILED`, with no mixed success/failure under a request, orphan, or in-progress residue. Verification made OpenAI API calls `0`, DB writes `0`, and migration operations `0`. Historical task-time Fake zero evidence and post-acceptance live nonzero evidence remain separate and unchanged.

Milestone 2 target exclusions:

- no production payment;
- no production email;
- no Google login or other authentication;
- no public release; and
- no unconditional display of AI output.

The accepted M2-P1 foundation is limited to the AI-quality specification, exact 70-case development dataset in the 10/10/10/10/8/13/9 distribution, 42-set contrast graph with 130 memberships and 7 connected components, exact frozen 20-case Human-review sample, external-only holdout contract, 9 JSON Schemas, PB-01 through PB-07, 16 prompt assets, evaluation/scoring/retry/versioning/contamination policies, manifests, and foundation verifier. All eight declared runtime capabilities remain disabled. It calls no provider, selects no model, connects no database, and changes no UI or runtime.

M2-P2-A does not authorize execution. B1-A, B1-B1, and accepted B1-B2-A preserve the B0 identity: development case `WAIT-003`, calibration candidate `gpt-5.6-luna`, PB-01 through PB-06, B0 contract hash `c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2`, zero actual environment reads, secret resolutions, HTTPS requests, or provider calls, and USD 0 actual spend. B1-B2-A adds only dormant `POST https://api.openai.com/v1/responses` binding code with TLS 1.2 minimum, a 180000 ms timeout, 2 MiB request and 4 MiB response limits, and an absent approval record. PB-07, retry, Repair, fallback, automatic continuation, Batch, 14-case, 70-case, holdout, and real-user execution remain prohibited. The historical static hard cap is USD 0.213223; the cache-write-protected live execution guard is USD 0.26079625, which is a conservative preflight estimate rather than actual or billed cost; the preflight ceiling is USD 0.30 and the future absolute Human ceiling is USD 1.00. Live and paid authorization remain false. Luna is not selected for product or baseline. B1-B2-B requires a new separate bounded Human authorization.

M2-P2-B1-A offline replay and B1-B1 local provider-protocol handling are plumbing evidence only, not a successful OpenAI API connection. Request previews are not actual API requests, synthetic Responses are not provider Responses, parsed usage is synthetic evidence, and usage-derived cost examples are not billed cost. Provider compatibility, model availability, actual input/output/reasoning tokens, actual latency, actual billing, and model quality remain unknown.

The accepted static values are planning estimates, not guaranteed API costs. Actual tokenizer usage, reasoning tokens, latency, API cost, provider validation, repair frequency, and model quality remain unknown; the price catalog is a versioned planning snapshot and must be rechecked before any separately authorized paid calibration.

M2-P3-A creates a new successor capability manifest instead of rewriting those historical snapshots. Its accepted task-time automated path uses deterministic fakes and records zero actual OpenAI calls, zero actual Supabase calls, USD 0 API spend, and no real-user data or holdout data. Separately, the post-acceptance Human-configured synthetic live E2E has nonzero OpenAI/Supabase usage; exact aggregate tokens, cost, and call count have not been calculated, and real-user records and holdout use remain zero. Atomic finalization commits the report, decision card, run completion, request completion, completion timestamp, final decision, and usage totals in one Postgres transaction; rollback, duplicate-finalization, concurrent-idempotency, persistence-before-provider, and provider-stop evidence are accepted. The server-only bindings require all five environment variables and fail closed; no secret value is recorded in the repository. Human Visual QA accepted the internal desktop page and interaction flow, including safe `M2_RUNTIME_CONFIGURATION_INVALID` display with no stack trace or secret leakage. Mobile-width QA was intentionally omitted because the route is internal desktop-only tooling. Retry, Repair/PB-07, fallback, background execution, payment, authentication, email, analytics, public history, downloads, deployment, and public release remain excluded.

Operator identity, contact, publication, delivery, URL-lifetime, refund/reissue, privacy, retention, and deletion decisions remain deferred prerequisites for any later public review or sale. M2-P1 does not resolve or implement them.

## 6. Milestone 3: Review Site Deployment

Stripe Lane B work applies an explicit predecessor overlay to this milestone: B1 Human + ChatGPT decision review is the exact current next work; B2 Legal Draft Finalization Candidate and B3 Review-ready Website/Public Surface implementation must follow accepted predecessors; B4a prepares deployment configuration; and B4b stable-URL deployment requires separate Human external-action authority. No public Website implementation, stable-domain work, or deployment is authorized by the current Candidate.

Goal: deploy the payment-free Reviewable Web MVP to a stable external URL.

Includes hosting deployment, stable review URL, mobile and desktop review, navigation and broken-link review, contact receipt review, clear notice that payment is unavailable, and an appropriate indexing/privacy decision for the review stage.

Exit criterion: an external reviewer or payment provider can inspect the service at a stable URL.

## 7. Milestone 4: Payment Provider Review Evidence and Selection

Goal: use final intended URLs and an honest service description to obtain provider-specific authoritative approval/review evidence and a Human selection.

Current bounded Stripe Lane B sequence:

1. Payment Charter v1 remains accepted and independent from provider approval.
2. Stripe-first strategy Acceptance Sync is complete on `2026-08-12`.
3. Truthful Customer-facing/public-copy alignment is Human + ChatGPT accepted complete on `2026-08-12`; Human Visual QA and Automated QA are PASS.
4. Stripe feasibility evidence preparation is accepted complete; Lane A remains preserved inactive at `preparation_human_approved / external_action_not_authorized / not_submitted / null`. Stripe Sales is `not_used_by_human_direction`, not a Provider outcome.
5. B0 Stripe Lane B Human Decision Package Candidate is ready with status `stripe_lane_b_human_decision_package_candidate_ready_pending_human_chatgpt_review`; acceptance and every Human decision remain pending.
6. B1 Human + ChatGPT decision review and acceptance sync is the exact current next work.
7. B2 Legal Draft Finalization Candidate follows only after B1 acceptance.
8. B3 Review-ready Website/Public Surface implementation follows its accepted predecessor.
9. B4a deployment-readiness implementation/configuration remains distinct from B4b stable-URL deployment; B4b requires separate external-action authority.
10. B5 private KYC readiness keeps actual Human values outside Git.
11. B6 may prepare a Stripe Account/Activation Authorization Package without creating an account or submitting information.
12. B7 actual Stripe account creation/KYC/activation submission requires a further explicit Human external-action authorization.
13. PayPay Lane C remains separate and later. Return to explicit Human launch review if any desired method is unavailable; PayPay unavailable is not automatic approval to omit it.
14. Update comparison and scorecard only from authoritative evidence, then require Human formal Provider selection.
15. Under a separately authorized task, implement only the selected Provider in sandbox/test mode.
16. Complete Production QA without treating it as Production Payment authorization, and proceed to Soft Launch only after separate Production Payment authorization and all other applicable gates pass.

No exact future branch or mutation manifest is assigned before predecessor acceptance.

A generic support response, marketing page, silence, or SDK availability is not Stripe approval. PAY.JP fallback reactivation requires current-source review and separate Human authority.

Exit criterion: Human selects a provider using provider-specific authoritative approval/review evidence, and all applicable conditions are known. This documentation task does not meet that criterion.

## 8. Milestone 5: Core Backend, Safety, AI and Email

Goal: complete the fulfillment flow using mock-paid or test-paid state before real payment integration.

This is future production-path hardening and delivery work. It is distinct from the internal-only Milestone 2 target and remains unauthorized.

Includes request submission and Supabase persistence; production server validation of allowed age-group values; production enforcement of the accepted server-owned pre-payment eligibility contract; no payment path unless the current eligible result has `purchaseGateSatisfied=true`; server-authoritative delivery/recovery mailbox verification and trusted-session binding consistent with the accepted Charter; minimized AI payloads; structured AI judgment and full-report generation; schema/output validation; retries and failure handling; result-token generation, persistence, and display; email delivery or approved test/log mode; and feedback persistence. Historical M1 `normal_allowed` / `needs_review` / `rejected` fixtures remain historical review evidence and are not the current purchase authority.

Exit criterion: excluding real card payment, one request can move from submission to stored result and delivery in a controlled test environment.

## 9. Milestone 6: Approved Provider Sandbox Payment

Goal: connect only the Human-approved provider in test or sandbox mode.

Includes checkout creation, provider-event and webhook-signature verification, idempotency, duplicate-payment prevention, purchase state machine, payment-success requirement before generation, failure/cancellation handling, refund foundation, and provider-event evidence retention.

Exit criterion: one sandbox/test payment triggers exactly one fulfillment flow and produces exactly one accessible result.

## 10. Milestone 7: E2E, Safety and Failure Operations

Goal: prove normal and failure paths before accepting real payment.

Includes normal E2E; invalid age; every non-purchasable clarification/unsafe/urgent/unsupported/error state; duplicate webhook; payment success plus AI failure; email failure; token access protection; rate limiting; abuse/spam controls; retry/manual recovery; refund/reissue; retention/deletion; mobile and desktop UI review; legal/publication final review; and production-stop procedure.

Exit criterion: normal, dangerous, and failure cases have evidence, expected outcomes, and operator procedures.

## 11. Milestone 8: Production Application and Soft Launch

Goal: obtain production approval, configure production systems, and release intentionally to a limited audience.

Includes provider production review/application, production keys and secrets, production domain, monitoring/logging, limited traffic, manual observation of initial orders, and an emergency purchase stop.

Exit criterion: production payment is authorized and the service is intentionally open to a limited audience.

## 12. Milestone 9: First Real Purchase Verification

Goal: verify the first real unknown-customer order from payment through feedback or support follow-up.

Required evidence:

- payment evidence;
- internal purchase record;
- exactly one generation;
- exactly one result token;
- successful result access;
- email delivery;
- support traceability;
- no exposed personal information; and
- no unhandled failure.

Exit criterion: all evidence above is confirmed for the first real unknown-customer order. This is the initial paid Web MVP completion point.

## 13. Explicit Initial-MVP Out of Scope

- login;
- user account or my page;
- partner-specific notebook;
- diagnosis history or saved reports;
- subscription, coins, points, or recurring billing;
- native application or push notifications;
- full admin dashboard; and
- unapproved provider-specific implementation.

## 14. Post-MVP Candidates

Only after initial paid Web MVP completion and real demand evidence may Human consider:

- operator/admin tools;
- improved refund and regeneration operations;
- saved reports;
- user accounts;
- partner-specific notebooks;
- previous-reading comparison;
- follow-up analysis;
- iOS implementation using Apple IAP + RevenueCat;
- Android implementation after the iOS purchase/verification/entitlement/recovery path is stable; and
- subscription evaluation after repeat-purchase data is available, while retaining one-time purchase as a coexistence candidate.

These are candidates, not approved immediate tasks.

## 15. Change-Control Rule

No milestone may be skipped merely because a later integration is technically available. Human acceptance of the previous milestone is required before the next milestone begins. Payment Charter v1 is accepted as a cross-cutting authority, but its acceptance does not authorize implementation and does not by itself complete or skip a delivery milestone.

Each milestone must be planned, implemented where applicable, validated, committed as bounded work, and accepted by Human. A roadmap update does not itself authorize implementation. Changes to milestone order, completion definition, price, age policy, safety-before-payment rule, provider direction, platform order, monetization model, or MVP scope require explicit Human approval and an update to the controlling documents.
# M2-P2-B1-B2-A dormant live-binding checkpoint (2026-07-28)

- Dormant OpenAI HTTPS, environment-secret, Human approval, one-time authorization, artifact, Git, redaction, and live-budget bindings are implemented and Human / ChatGPT accepted and complete at `76ceb4a25cc565e84b9537bd25dbe703f87bd342`. The preceding R1 boundary correction is accepted and complete at `fa222917f0e6ff4a4e25d11da239717c062af6d0`.
- `WAIT-003`, `gpt-5.6-luna`, PB-01 through PB-06, the B0 hash, and the six-call maximum remain fixed. No product or baseline model is selected.
- Live and paid authorization remain false. The accepted blocked result is `HUMAN_APPROVAL_MISSING`; actual environment reads, secret resolutions, HTTPS requests, provider calls, and API spend remain zero.
- Automated validation and Human / ChatGPT final review are complete; M2-P2-B1-B2-A is accepted and complete.
- The accepted evidence is dormant protocol and binding evidence only. It is not evidence of an actual OpenAI connection, API-key validity, Project model availability, token usage, latency, billed cost, or model quality.
- M2-P2-B1-B2-B, OpenAI Project/billing/key setup, paid execution, retry, Repair, fallback, Batch, PB-07, holdout, and real-user execution remain unauthorized.

# M2-P2-B1-B2-B0 one-time paid-calibration execution-package checkpoint (2026-07-29)

- M2-P2-B1-B2-B0-R1 is Human / ChatGPT accepted and complete at correction commit `30c05ca2c383641676a3c1fde680e2e83d44397f`; it freezes the accepted B1-B2-A historical scope and exact nine successor paths and is unchanged by the implementation.
- B0 implements an exact 34-file package (A30/M4/D0) at accepted implementation commit `e8b369baa14ff417fed19d75f31c733dd5c8d240`: non-executable repository approval template, external approval policy, fixed paid CLI, price snapshot, external-path confinement, atomic one-time marker, sanitized artifact policy, 24 deterministic failure scenarios, and deterministic evidence generation.
- The Task-time blocked preflight stops with `EXTERNAL_APPROVAL_NOT_PRESENT`. The true external approval does not exist, the paid CLI is not executed, actual environment reads, secret resolutions, HTTPS requests, provider calls, and API spend remain zero, and no external approval/marker/run directory is created.
- `WAIT-003`, `gpt-5.6-luna`, PB-01 through PB-06, six calls, USD 0.213223 static cap, USD 0.26079625 live guard, USD 0.30 preflight ceiling, and USD 1.00 absolute Human ceiling remain fixed. No product or baseline model is selected.
- Automated validation and Human / ChatGPT final review are complete. M2-P2-B1-B2-B0 is accepted and complete.
- Fast-forward-only synchronization to `main` is authorized. Merge-commit creation and PR creation remain prohibited.
- M2-P2-B1-B2-B1 true approval creation and one-time paid execution remain unauthorized and not started.
