# CODEX_HANDOFF.md

## Role

CodeX is the implementation and repository operation agent. It must follow the current Human-approved milestone and the scope of the current task.

## Current Authority

- Human confirms that the active initial runtime migrations `supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql` and `supabase/migrations/0003_m2_p3_atomic_finalization.sql` are applied to `moon-reply-dev`. The obsolete `0001_stage3_data_foundation.sql` remains unapplied and is preserved under `supabase/archive/` only as historical design evidence. Migration repair was not used. This documentation synchronization grants no migration or DB-operation authority.
- Task 18C-R3 Roadmap Reset is accepted by Human at commit `54e5f2dba518eb13ab2fb1d7f645799be65fd1e8`.
- Tasks M1-P1 and M1-P1-R1 are accepted by Human at their recorded commits.
- Tasks M1-I1 through M1-I5 and M1-I5-R1 are accepted by Human at their recorded commits.
- M1-I6 was implemented and automatically validated, was not accepted by Human, and is formally closed as superseded by M1-P2. Its evidence and carried defect inventory remain historical.
- M1-P2 Experience & Visual Direction Revision is complete and accepted by Human.
- Human initially authorized M1-I7, then explicitly authorized a one-time integrated M1-I7 through M1-I11 implementation batch. For this batch only, internal checkpoints replaced the normal Human acceptance pause between slices.
- M1-I7 through M1-I11 are implemented and automatically validated from base commit `923d43057178da070a72f380d7054d60efca7daf`. Human accepted the integrated result as the next-stage baseline; this was one integrated baseline decision, not five independent acceptance records, and by itself did not constitute the final Milestone 1 acceptance later recorded through M1-I12.
- M1-P2-R1 Public Sample Conclusion Diversification and the subsequent bounded M1-P2-R1-R1 contrast/comparison-boundary correction are Human-accepted as part of that baseline.
- M1-P3 Reading Note Visual Excellence Specification is complete and Human and ChatGPT accepted. Its documentation/design package remains authoritative, B — `Lunar Contrast Edition` is selected, and specification acceptance did not itself grant canonical implementation authority. Figma is optional and non-authoritative.
- Human accepted the bounded M1-I2-R1 Safety enforcement correction at implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`. `SEM-UNSUPPORTED-CASES` passes without waiver, the previous M1-P3-R1 hard stop is resolved, and the accepted correction is synchronized to `main`.
- M1-P3-R1 review-only A/B coded visual prototypes are implemented and automatically validated on `design/m1-p3-coded-visual-prototype`. Human selected and accepted B — `Lunar Contrast Edition` as the canonical design direction and rejected A — `Quiet Editorial Letter`. Prototype acceptance is not canonical visual implementation authorization.
- M1-I8-R1 Checkpoints A and B are complete, Human-accepted, and merged to `main`; Checkpoint B's acceptance synchronization is `06c20f71c21d7968a97aa78dbe12f480c1abf7c5`. M1-I9-R1 is complete, Human-accepted at final implementation commit `82600df57481cae2c61d370288083a61f0c719c3`, and merged to `main`. M1-I12-R1 is on `main` at `8b35fbe24a1d32f2cf827874231ce76eb237ad07`; M1-I12-R2 is Human-accepted and on corrected `main` at `cf05dbca2bbc6ce75f2eeed69d606b5a00a07d82`. M1-I12 automated final QA and Human final QA are complete; M1-I12 is Human-accepted and complete. Milestone 1 is Human-accepted, complete, and closed.
- M2-P1 AI Quality Specification & Evaluation Foundation and M2-P1-R1 Evaluation Foundation Integrity Hardening are Human / ChatGPT accepted and complete at accepted foundation implementation commit `c56f597d0491482995c4afa6fb64cf148dd66345`. M2-P1-R2 Acceptance Manifest Boundary Correction is implemented and validated at `e859b4cdfc0efa03d3372784ea34f4abb61bee9d`. M2-P2-A-R1 is Human / ChatGPT accepted and complete at `deff429e45a411f0d6c6d5bd3f199adca994ebb5`. M2-P2-A Zero-Cost Token & Cost Estimator is Human / ChatGPT accepted and complete at `2e2e0cc4c57c46320d56aa986055f65187aa6aee`. M2-P2-B0-R1 is accepted and complete at `a757e7f28affe29a423ff817872a1a7f650a7fd2`; M2-P2-B0-R2 is accepted and complete at `88b456622950622c35510f4b3b9d19abbd9ec8da`. The exact M2-P2-B0 implementation commit `cf75679f2d116132f7519256cd762ba1a51a0af9` has completed automated validation and Human / ChatGPT final review and is accepted and complete. M2-P2-B1-A-R1 successor-tool correction is Human / ChatGPT accepted and complete at `22bbf6f69ad2e21d3d43808e3518970eb1dc48e7`. M2-P2-B1-A deterministic Offline One-Case Calibration Runner has completed automated validation and Human / ChatGPT final review and is accepted and complete at `630cde811d63e0304ed528dc2e426400e81506a6`. M2-P2-B1-B1-R1 historical-scope/successor-boundary correction and M2-P2-B1-B1 network-disabled provider adapter are Human / ChatGPT accepted and complete at `2f9fa4f2aa0616a03ec716bf0c09e1d0e0df038e` and `efdf10067fb3c1b4072c891ab5f3f1d2c949de55`. M2-P2-B1-B2-A-R1 and M2-P2-B1-B2-A are Human / ChatGPT accepted and complete at `fa222917f0e6ff4a4e25d11da239717c062af6d0` and `76ceb4a25cc565e84b9537bd25dbe703f87bd342`. B1-B2-A makes zero actual environment reads, secret resolutions, HTTPS requests, provider calls, and API spend, and selects no product or baseline model. M2-P2-B1-B2-B remains unauthorized and not started.
- M2-P2-B1-B2-B0-R1 historical-scope and execution-boundary correction and M2-P2-B1-B2-B0 One-Time Paid Calibration Execution Package are Human / ChatGPT accepted and complete at `30c05ca2c383641676a3c1fde680e2e83d44397f` and `e8b369baa14ff417fed19d75f31c733dd5c8d240`. B0 acceptance does not authorize M2-P2-B1-B2-B1 external approval creation or paid execution.
- M2-P3-A is Human / ChatGPT accepted and complete at implementation commit `9bdae7cf05034c7742e5f58f7b104d65cb27a87f`. M2-P3-A-R1 Runtime Security and Transaction Hardening is accepted and complete at `3f1123439dcbc724c70505956aa81fa03a9246ad`. The accepted slice does not rewrite M2-P1/M2-P2 historical snapshots. M2-P2-B0 through M2-P2-B1-B2-B0 are retained as paused internal QA tooling and are not the active product path.
- Human rejected a fixed/sticky mobile CTA for Milestone 1; non-fixed CTA behavior is controlling.
- Browser use and screenshot acquisition by CodeX/agents are prohibited. Human alone performs visual review manually in ordinary external Microsoft Edge.
- `docs/ROADMAP.md` remains the authoritative high-level roadmap.

The canonical service is an `AIを活用した恋愛メッセージ分析・判断支援デジタルレポート`, presented to users as `恋のメッセージ鑑定ノート`: 1相談 / 1鑑定ノート, 税込980円, 都度払い, no automatic renewal, 18+, AI disclosed, and Safety before payment.

The accepted Milestone 1 deliverable is a fixed-fixture Reviewable Web MVP. It has no real AI, runtime DB, payment, email delivery, deployment, production analytics, account system, or PDF/download/share implementation and is not production-ready or payment-ready.

## Current Status

The active Supabase migration sequence begins with `0002_m2_p3_runtime_vertical_slice.sql` and continues with `0003_m2_p3_atomic_finalization.sql`; archived migration `0001_stage3_data_foundation.sql` is outside the live migration sequence.

The post-acceptance synthetic live E2E ran against code commit `66ab02c566d61d0c563e26e3d2c5fb23f6500d45`.

Current state: M2-P3 Runtime Vertical Slice is accepted and complete; Milestone 2 remains incomplete. The accepted implementation provides `/review/runtime`, `POST /api/internal/assessments`, PB-01 through PB-06, deterministic application policy, persistence-before-provider, atomic Postgres finalization, assessment-note rendering, deterministic fakes, and dedicated verification. Human desktop Visual QA and interaction QA are complete. Separately, Human confirms the local development OpenAI/Supabase setup, migrations, and bounded synthetic live E2E are complete with `gpt-5.6-luna` and the internal runtime enabled.

Evidence remains two-layered: task-time automated validation used `FakeAiStageTransport` and `FakeAssessmentRepository` only and retains OpenAI calls `0`, Supabase calls `0`, and API spend `USD 0`; the post-acceptance Human-configured synthetic live E2E has nonzero usage, while exact aggregate tokens, cost, and call count have not been calculated. Real-user records and holdout use remain `0`.

Human Visual QA accepted initial rendering, request-sheet interaction, required selections and acknowledgement behavior, configuration-missing fail-closed behavior, and safe `M2_RUNTIME_CONFIGURATION_INVALID` display. No stack trace or secret leakage was observed. Mobile-width QA was intentionally omitted because the route is internal desktop-only tooling. The truncated `実行境` label and weak disabled-submit distinction are non-blocking backlog items; this acceptance creates no correction task.

The accepted B1-A Runner fixes execution mode `offline_replay`, `WAIT-003`, candidate `gpt-5.6-luna`, PB-01 through PB-06 synthetic replay, six simulated stages, B0 contract hash `c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2`, and deterministic local policy checks. Accepted B1-B1 adds network-disabled request, parser, ledger, adapter-interface, interlock, and sanitization protocol evidence. Accepted B1-B2-A adds only dormant fixed-endpoint HTTPS, environment-secret, approval, one-time authorization, artifact, Git, redaction, and live-budget bindings. Retry, Repair, fallback, automatic continuation, PB-07, Batch, 14-case, 70-case, holdout, and real-user execution are prohibited. The static hard cap is USD 0.213223; the cache-write-protected live guard is USD 0.26079625 and is not actual or billed cost; the preflight ceiling is USD 0.30 and the future absolute Human ceiling is USD 1.00. Actual environment reads, secret resolutions, HTTPS requests, and provider calls are zero, spend is USD 0, the approval record is absent, and live and paid authorization are false. Provider compatibility, API-key validity, model availability, actual token usage, latency, billing, and model quality remain unknown. M2-P2-B1-B2-B paid calibration execution remains unauthorized and not started.

The accepted M2-P1 foundation preserves exactly 70 development cases in the 10/10/10/10/8/13/9 distribution and an external-only 15-case holdout contract while defining 42 contrast sets with 130 memberships, 7 connected components, an exact frozen 20-case Human-review sample, 9 JSON Schemas, machine-readable bounded retry semantics, and machine-readable contracts for PB-01 through PB-07. The prompt bundle contains 16 assets. Its all-disabled capability record remains an immutable historical snapshot. M2-P3-A declares the separately authorized successor boundary in `evals/runtime/m2-p3-runtime-capabilities-v1.json`; it does not retroactively change what M2-P1 or M2-P2 accepted. M2-P1-R2 anchors the immutable R1 42-file snapshot to the accepted historical range without changing any accepted foundation asset.

M1-I12 Human Final QA is complete. Human reported PASS for 320px responsive QA, keyboard/focus QA, 200% zoom QA, reduced-motion QA, and reading-quality/contrast QA, with no release-blocking visual defect. These are Human observational results and remain distinct from the automated QA evidence. M1-I12 and Milestone 1 are Human-accepted and complete; Milestone 1 is closed.

M1-I2-R1 is Human-accepted, implemented, and automatically validated on `fix/m1-i2-r1-safety-policy-alignment`; the accepted implementation commit is `23ee6f3b98837e48628b59b41eab811da627e730`. All 13 locked unsupported-case labels now classify to the required fail-closed state/reason. The five confirmed free-text gaps are covered through NFKC/whitespace normalization, targeted phrases, and bounded negation guards. `illegal_conduct` and `third_party_secret` are added without changing existing reason-code meaning or structured-flag classification/severity. The permanent verifier executes the real classifier and the real category export, preserves the locked source hash, and reports `SEM-UNSUPPORTED-CASES: PASS` without waiver.

The previous M1-P3-R1 hard stop is resolved. A — `Quiet Editorial Letter` and B — `Lunar Contrast Edition` are implemented only on `/review/visual-excellence/**`. Both use `getReportFixture("result-normal-001")`, the same content subset, and the same semantic order. Human selected B and rejected A. Canonical UI, Reading Note, LP, Request Form UI, Legal UI, fixtures, Safety, packages, Supabase, and runtime integrations were not changed, and the prototype routes/components are not merged into `main`.

Checkpoint B independently implements the selected Lunar Contrast direction on the authorized Web note, saved decision card, public sample, comparison navigation, error/loading, and review-boundary surfaces. It uses shared presentation-only artifact compositions, preserves every locked judgment and disclosure, keeps unknown IDs fail closed, and adds no runtime behavior. Automated content, Safety, typecheck, lint, build, source, manifest, and raw-HTTP checks pass. Human accepted the implementation-and-polish commit after external review of the primary desktop and 390px targets. CodeX/agents used no Browser or screenshots.

M1-I9-R1 applies the accepted Lunar Contrast grammar only to the LP Hero cover preview, `#note` same-case short/Web/save proof, artifact-entry links, and the different-case public comparison. Existing artifact and brand components are imported without modification. The fixed judgment is read from `preview`; `PUBLIC_SAMPLE_CASES`, report components/routes, fixtures, Safety, product facts, price, age, request/purchase/legal behavior, packages, and runtime remain unchanged. Automated and raw-HTTP evidence passes. Human accepted the final implementation commit after primary desktop/390px Visual QA, including confirmation that the mobile one-character wrapping defect is resolved.

The integrated batch implemented:

- M1-I7 Brand Foundation bounded corrections;
- M1-I8 Reading Note Product Redesign;
- M1-I9 LP Redesign;
- M1-I10 Request Sheet Redesign; and
- M1-I11 Legal Review Redesign.

Every slice passed typecheck, lint, build, and `git diff --check`. M1-I8 through M1-I11 also passed their required raw HTTP/rendered-text route checks. These remain automated evidence; Human's later integrated baseline decision is recorded separately and does not convert the checks into browser evidence.

M1-P2-R1 adds separate public-only `wait`, `send`, and `stop additional contact` fictional cases, changes `/sample-report` to the complete `sample-send-001` example, and distinguishes different-case conclusion comparison from same-case LP/Web/save format comparison. The fixed `result-normal-001` object, its `今日は送らない方がいい` judgment, Safety fixtures, `lib/safety/**`, and runtime behavior remain unchanged. Its evidence is in `docs/phase1/TASK_M1_P2_R1_PUBLIC_SAMPLE_CONCLUSION_DIVERSIFICATION_REVIEW.md`.

M1-P2-R1-R1 replaces the LP three-case section's undefined `--night-600` background token with the defined `--night-950` token and makes the public `/sample-report` footer explicitly state that the following short/Web/save comparison uses a separate fixed wait case and does not show three different results. No report body, fixture, Safety, runtime, product-fact, or package scope was reopened. Human accepted this bounded correction in the integrated baseline decision.

The complete mutation manifest, slice evidence, audits, Human route checklist, limitations, and M1-I12 carry-forward are recorded in `docs/phase1/TASK_M1_I7_I11_INTEGRATED_REVIEW.md`.

## Naming Decision

- Product: `恋のメッセージ鑑定ノート`.
- Long presentation: `Web鑑定ノート`.
- Short presentation: `保存用判断カード`.
- `保存用鑑定書` is not the current formal name. Checkpoint B changes the authorized saved-artifact and Brand Foundation labels to `保存用判断カード`; the out-of-manifest `lib/legal/review-content.ts` label `保存用鑑定書見本` remains a documented deferred residual.

## Preserved Product and Safety Boundaries

- Reading Note: approved 14-part Web structure; distinct save-oriented decision card; fixed judgment, scenario, uncertainty, non-guarantee, and limitations preserved.
- LP: approved ten-part sequence with the Reading Note artifact as primary value proof.
- Request Sheet: 18+ self-declaration, one large current-situation field, relationship/what-to-know chips, Safety, one acknowledgement, privacy guidance, Request Memo, then email and purchase confirmation.
- Safety: existing structured vocabulary, classification, severity, and reason-code meanings remain intact; M1-I2-R1 adds only `illegal_conduct`, `third_party_secret`, targeted free-text coverage, normalization, bounded negation guards, and truthful non-normal blocking. Only `normal_allowed` continues; needs_review, rejected, contradictory, invalid-age, missing-confirmation, and unknown states fail closed.
- Legal Review: user-readable body, publication decisions, and collapsed review metadata are separate. Legal substance and unresolved operator facts remain unchanged; Contact is inactive.
- Presentation fixtures/schemas were reorganized only inside M1-I8 and M1-I10 and do not activate runtime behavior.
- M1-P2-R1 public cases are static presentation data under `fixtures/public/`; they are not Safety fixtures, result fixtures, real consultations, purchaser examples, reviews, or AI-generation evidence.

## Runtime and External Status

- No provider inquiry was sent and no provider was selected.
- No legal page is publication-approved and no review site is deployed.
- No active contact channel or legal acceptance exists.
- The historical Milestone 1 baseline added no production database connection, payment/refund, AI call, prompt execution, email, API route, server action, analytics, authentication, external form/asset, persistence, file generation, or deployment. M2-P3 adds an internal development-only route and a bounded Human-configured synthetic live connection; no production or public capability is configured.
- The historical Milestone 1 baseline made no package or `supabase` change. M2-P3-A adds only `openai`, `ajv`, and the versioned internal runtime migration; `lib/safety/**` remains unchanged.
- No real or invented operator, provider, address, telephone, email, contact URL, response time, storage region, retention period, effective date, or updated date was added.
- M2-P1-R1 assets remain immutable historical foundation inputs. M2-P3-A reads the accepted Prompt and Schema assets server-side at runtime without rewriting their historical capability snapshot.
- M2-P3-A task-time automated evidence made no OpenAI or Supabase request and records API spend `USD 0`. Separately, the post-acceptance Human-configured synthetic live E2E used `gpt-5.6-luna` and succeeded with nonzero provider/database usage. Exact aggregate tokens, cost, and call count have not been calculated; no holdout or real-user data was used.
- The live E2E establishes bounded synthetic local operability, not M2-P4 product-quality acceptance or guaranteed API cost. M2-P2-A estimates remain planning evidence, not actual usage or guaranteed API cost.

## M1-P3 Record

- Task ID: `M1-P3`.
- Task name: `Reading Note Visual Excellence Specification`.
- Status: `Human and ChatGPT accepted; documentation/design specification complete; not implementation authorization`.

Purpose:

- polish the Reading Note as the JPY 980 product artifact;
- improve editorial design and reading experience without changing content or judgment;
- determine PC and 390px-centered Figma/design handoff specifications;
- define 768px reflow and 320px fallback; and
- settle pre-implementation content lock, component anatomy, tokens, typography, chapter archetypes, responsive specification, acceptance criteria, and implementation plan.

Dependencies:

- current integrated redesign baseline closure commit;
- clean working tree; and
- Human decisions recorded.

Out of scope:

- implementation;
- product fact or price changes;
- fixture judgment or Safety changes;
- request/legal redesign;
- real AI, DB, payment, email, API, or deployment;
- external fonts, Storybook, or visual regression tooling; and
- PDF, download, share, print, or actual persistence.

## M1-I2-R1 Record

- Task ID: `M1-I2-R1`.
- Task name: `Safety Policy Enforcement Alignment`.
- Base commit: `6858352ceccc266c4e4e939507575cabbda49fc0`.
- Status: Human-accepted; implementation and automated validation complete.
- Accepted implementation commit: `23ee6f3b98837e48628b59b41eab811da627e730`.
- Review record: `docs/phase1/TASK_M1_I2_R1_SAFETY_POLICY_ALIGNMENT_REVIEW.md`.
- Required gate: all 13 exact locked unsupported-case categories fail closed; `needs_review` and `rejected` both block ordinary confirmation.
- Validation: permanent Safety verifier, typecheck, lint, production build, exact-lock check, `git diff --check`, and prohibited-scope audit pass without Browser or screenshot use.

Controlling Human design decisions:

- The product artifact is `恋のメッセージ鑑定ノート`; the long presentation is `Web鑑定ノート`; the short presentation is `保存用判断カード`.
- Web reading order begins with a one-line `今夜の答え` inside the cover, then `月の返事からの短い手紙`, then the detailed answer, followed by the remaining body.
- Fixed judgment, consultation facts, Safety meaning, non-guarantee, uncertainty, and chapter purpose do not change.
- The public full sample uses the same visual grammar as a shorter edited artifact and need not mirror all fourteen chapters.
- 390px is the primary mobile design width; 320px is a QA fallback; 768px is a reflow target.
- No external font may be used.
- The formal Human design gate is complete: B — `Lunar Contrast Edition` is selected and accepted as the canonical design direction; A — `Quiet Editorial Letter` is rejected.
- Figma is optional, non-authoritative reference material and is not required for the gate.
- The Reading Note artifact is the primary first-impression target; Header, ReviewBanner, and the route-level review boundary must not interfere with its impression, reading entry, or closing aftertaste.

## Current Restriction

The accepted M1-P3 package remains the authoritative Visual Excellence documentation/design specification. M1-P3-R1 coded prototypes are review-only design evidence, not canonical implementation. Do not treat Figma as a required or authoritative gate. Keep historical M1 and M2 snapshots immutable. This documentation synchronization authorizes no DB query/write, API call, migration, migration repair, secret read, or environment-value output. Do not create a PR, process real-user data, publish, deploy, or add payment, email, authentication, analytics, retry, Repair/PB-07, fallback, queue, cron, mobile API, public history, or downloads.

Browser use remains prohibited, including the Codex in-app browser, CDP, Playwright, Puppeteer, Selenium, GUI browsers, and screenshot acquisition. Automated checks do not establish visual acceptance; the completed visual and interaction acceptance is recorded separately as Human observational evidence.

## Next Work

Milestone 1 is closed. M2-P1 and M2-P2-A are accepted and complete. M2-P2-B0 through M2-P2-B1-B2-B0 are retained as paused internal QA tooling. M2-P3 Runtime Vertical Slice and the post-acceptance Human-configured synthetic live E2E are complete; Milestone 2 remains incomplete. Current work is successful-run DB integrity verification. After that, proceed to M2-P4 quality evaluation planning. True paid approval/CLI execution remains paused and is not the active product path.
# M2-P2-B1-B2-A handoff

- Branch: `design/m2-p2-b1-b2-a-live-bindings`
- Correction commit: `fa222917f0e6ff4a4e25d11da239717c062af6d0`
- Implementation scope: exact 41 paths, A37/M4/D0
- Blocked stop: `HUMAN_APPROVAL_MISSING`
- Case/model/stages: `WAIT-003` / `gpt-5.6-luna` / PB-01 through PB-06
- Historical static cap: USD 0.213223
- Live guard: recompute from exact registered B1-B1 envelopes; must be at or below USD 0.30
- Future Human ceiling: USD 1.00
- Current actual counts: environment reads 0, secret resolutions 0, HTTPS requests 0, provider calls 0, API spend USD 0
- Automated validation: complete, including 40/40 deterministic failure scenarios and repeated byte-identical evidence generation
- Review/acceptance: Human / ChatGPT final review complete; accepted and complete

M2-P2-B1-B2-B is not authorized. Do not create or configure an API key, Project, billing, or true approval record; do not execute the API or create a PR.

# M2-P2-B1-B2-B0 handoff

- Branch: `design/m2-p2-b1-b2-b0-paid-execution-package`
- Correction commit: `30c05ca2c383641676a3c1fde680e2e83d44397f` (unchanged)
- Implementation scope: exact 34 paths, A30/M4/D0
- Repository approval: draft, absent, live false, paid false, non-executable
- Future true approval: fixed external path, exact final-main binding, maximum 30-minute validity, not created
- Price snapshot: 2026-07-29, maximum age 24 hours
- Fixed target: `WAIT-003`, `gpt-5.6-luna`, PB-01 through PB-06, maximum six calls
- Budget boundaries: USD 0.213223 static cap, USD 0.26079625 live guard, USD 0.30 preflight, USD 1.00 Human ceiling
- Task-time runner: blocked preflight only; expected `EXTERNAL_APPROVAL_NOT_PRESENT`
- Paid entrypoint: implemented for future separate authorization, not executed
- Failure matrix: exact 24 scenarios, all stop before secret/HTTPS
- Current actual counts: environment reads 0, secret resolutions 0, HTTPS requests 0, provider calls 0, API spend USD 0
- External state created: approval files 0, markers 0, run directories 0
- Automated validation: complete
- Review/acceptance: Human / ChatGPT final review complete; accepted and complete
- Accepted implementation commit: `e8b369baa14ff417fed19d75f31c733dd5c8d240`

Fast-forward-only synchronization to `main` is authorized. M2-P2-B1-B2-B1 remains unauthorized and not started. Do not create a true approval, run the paid entrypoint, access the Human-controlled credential, create a merge commit, or create a PR.
