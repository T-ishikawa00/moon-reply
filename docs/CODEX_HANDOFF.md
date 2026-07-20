# CODEX_HANDOFF.md

## Role

CodeX is the implementation and repository operation agent. It must follow the current Human-approved milestone and the scope of the current task.

## Current Authority

- Task 18C-R3 Roadmap Reset is accepted by Human at commit `54e5f2dba518eb13ab2fb1d7f645799be65fd1e8`.
- Tasks M1-P1 and M1-P1-R1 are accepted by Human at their recorded commits.
- Tasks M1-I1 through M1-I5 and M1-I5-R1 are accepted by Human at their recorded commits.
- M1-I6 was implemented and automatically validated, was not accepted by Human, and is formally closed as superseded by M1-P2. Its evidence and carried defect inventory remain historical.
- M1-P2 Experience & Visual Direction Revision is accepted by Human.
- Human initially authorized M1-I7, then explicitly authorized a one-time integrated M1-I7 through M1-I11 implementation batch. For this batch only, internal checkpoints replaced the normal Human acceptance pause between slices.
- M1-I7 through M1-I11 are implemented and automatically validated from base commit `923d43057178da070a72f380d7054d60efca7daf`. Human accepted the current integrated result as the next-stage baseline; this is one integrated baseline decision, not five independent acceptance records and not final Milestone 1 acceptance.
- M1-P2-R1 Public Sample Conclusion Diversification and the subsequent bounded M1-P2-R1-R1 contrast/comparison-boundary correction are Human-accepted as part of that baseline.
- M1-P3 Reading Note Visual Excellence Specification is Human and ChatGPT accepted. Its documentation/design package remains authoritative, and acceptance grants no canonical implementation authority. The required design gate is now a Human-approved coded visual prototype; Figma is optional and non-authoritative.
- Human accepted the bounded M1-I2-R1 Safety enforcement correction at implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`. `SEM-UNSUPPORTED-CASES` passes without waiver, the previous M1-P3-R1 hard stop is resolved, and the accepted correction is synchronized to `main`.
- M1-P3-R1 review-only A/B coded visual prototypes are implemented and automatically validated on `design/m1-p3-coded-visual-prototype`. Human selected and accepted B — `Lunar Contrast Edition` as the canonical design direction and rejected A — `Quiet Editorial Letter`. Prototype acceptance is not canonical visual implementation authorization.
- Checkpoint A / M1-I8-R1 Technical Preparation and Checkpoint B / M1-I8-R1 Visual Excellence are Human-accepted. Checkpoint B's accepted implementation-and-polish commit is `bb2079aafb3666562e2876ead4c24a5c933bea8a`; its acceptance synchronization was fast-forwarded to `main` at `06c20f71c21d7968a97aa78dbe12f480c1abf7c5`. M1-I9-R1 Reading Note Preview Alignment is Human-accepted at final implementation commit `82600df57481cae2c61d370288083a61f0c719c3`; implementation, automated validation, and primary desktop/390px Visual QA are complete, and fast-forward to `main` is authorized. M1-I12 Final QA & Milestone 1 Acceptance Package is Human-authorized and not yet completed. Milestone 1 remains incomplete pending M1-I12. Milestone 2 and every later milestone remain unauthorized.
- Human rejected a fixed/sticky mobile CTA for Milestone 1; non-fixed CTA behavior is controlling.
- Browser use and screenshot acquisition by CodeX/agents are prohibited. Human alone performs visual review manually in ordinary external Microsoft Edge.
- `docs/ROADMAP.md` remains the authoritative high-level roadmap.

The canonical service is an `AIを活用した恋愛メッセージ分析・判断支援デジタルレポート`, presented to users as `恋のメッセージ鑑定ノート`: 1相談 / 1鑑定ノート, 税込980円, 都度払い, no automatic renewal, 18+, AI disclosed, and Safety before payment.

## Current Status

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
- No production database connection, payment/refund, AI call, prompt execution, email, API route, server action, analytics, authentication, external form/asset, persistence, file generation, or deployment was added.
- No package or `supabase` change was made. `lib/safety/**` changed only inside the authorized M1-I2-R1 correction.
- No real or invented operator, provider, address, telephone, email, contact URL, response time, storage region, retention period, effective date, or updated date was added.

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

The accepted M1-P3 package remains the authoritative Visual Excellence documentation/design specification. M1-P3-R1 coded prototypes are review-only design evidence, not canonical implementation. Do not treat Figma as a required or authoritative gate. Checkpoint A, Checkpoint B, and M1-I9-R1 are Human-accepted; fast-forward M1-I9-R1 to `main` only through the authorized `--ff-only` path. M1-I12 is validation/documentation-only: do not change application, component, CSS, fixture, Safety, Legal, package, or runtime files. Do not create a PR or start operator completion, publication, deployment, provider inquiry, payment, AI, email, DB/API integration, or Milestone 2+ work.

Browser use remains prohibited, including the Codex in-app browser, CDP, Playwright, Puppeteer, Selenium, GUI browsers, and screenshot acquisition. Automated checks do not establish visual acceptance.

## Next Gate

Synchronize the accepted M1-I9-R1 record, fast-forward the accepted branch to `main`, then create `qa/m1-i12-final-acceptance` from that exact latest `main` and perform M1-I12. Record non-browser automated final QA and leave 320px, keyboard/focus, 200% zoom, reduced-motion, and reading-quality review pending for Human. Milestone 1 remains incomplete pending Human final acceptance, and Milestone 2 remains unauthorized.
