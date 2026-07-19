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
- M1-P3 Reading Note Visual Excellence Specification is Human and ChatGPT accepted. Its five documentation/design documents are authoritative, and acceptance grants no implementation authority. Actual Figma production has not started and is the next design gate.
- Checkpoint A / M1-I8-R1 Technical Preparation and Checkpoint B / M1-I8-R1 Visual Excellence remain unauthorized and unimplemented. Checkpoint B is blocked until a Human-approved Figma file exists and separate explicit implementation authorization is recorded. M1-I9-R1 and M1-I12 remain unauthorized and unimplemented. Milestone 1 remains incomplete. Milestone 2 and every later milestone remain unauthorized.
- Human rejected a fixed/sticky mobile CTA for Milestone 1; non-fixed CTA behavior is controlling.
- Browser use and screenshot acquisition by CodeX/agents are prohibited. Human alone performs visual review manually in ordinary external Microsoft Edge.
- `docs/ROADMAP.md` remains the authoritative high-level roadmap.

The canonical service is an `AIを活用した恋愛メッセージ分析・判断支援デジタルレポート`, presented to users as `恋のメッセージ鑑定ノート`: 1相談 / 1鑑定ノート, 税込980円, 都度払い, no automatic renewal, 18+, AI disclosed, and Safety before payment.

## Current Status

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
- `保存用鑑定書` is not the current formal name. Residual application copy using that label is a known deferred M1-I8-R1 item; baseline closure must not change application copy.

## Preserved Product and Safety Boundaries

- Reading Note: approved 14-part Web structure; distinct save-oriented decision card; fixed judgment, scenario, uncertainty, non-guarantee, and limitations preserved.
- LP: approved ten-part sequence with the Reading Note artifact as primary value proof.
- Request Sheet: 18+ self-declaration, one large current-situation field, relationship/what-to-know chips, Safety, one acknowledgement, privacy guidance, Request Memo, then email and purchase confirmation.
- Safety: existing deterministic vocabulary and classification meaning are unchanged. Only `normal_allowed` continues; needs_review, rejected, contradictory, invalid-age, missing-confirmation, and unknown states fail closed.
- Legal Review: user-readable body, publication decisions, and collapsed review metadata are separate. Legal substance and unresolved operator facts remain unchanged; Contact is inactive.
- Presentation fixtures/schemas were reorganized only inside M1-I8 and M1-I10 and do not activate runtime behavior.
- M1-P2-R1 public cases are static presentation data under `fixtures/public/`; they are not Safety fixtures, result fixtures, real consultations, purchaser examples, reviews, or AI-generation evidence.

## Runtime and External Status

- No provider inquiry was sent and no provider was selected.
- No legal page is publication-approved and no review site is deployed.
- No active contact channel or legal acceptance exists.
- No production database connection, payment/refund, AI call, prompt execution, email, API route, server action, analytics, authentication, external form/asset, persistence, file generation, or deployment was added.
- No package, `supabase`, or `lib/safety/**` change was made.
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

Controlling Human design decisions:

- The product artifact is `恋のメッセージ鑑定ノート`; the long presentation is `Web鑑定ノート`; the short presentation is `保存用判断カード`.
- Web reading order begins with a one-line `今夜の答え` inside the cover, then `月の返事からの短い手紙`, then the detailed answer, followed by the remaining body.
- Fixed judgment, consultation facts, Safety meaning, non-guarantee, uncertainty, and chapter purpose do not change.
- The public full sample uses the same visual grammar as a shorter edited artifact and need not mirror all fourteen chapters.
- 390px is the primary mobile design width; 320px is a QA fallback; 768px is a reflow target.
- No external font may be used.
- Figma/design handoff is the formal Human design gate.
- The Reading Note artifact is the primary first-impression target; Header, ReviewBanner, and the route-level review boundary must not interfere with its impression, reading entry, or closing aftertaste.

## Current Restriction

The accepted M1-P3 package is the authoritative Visual Excellence documentation/design specification. It grants no implementation authority. Actual Figma production has not started. Do not start Checkpoint A / M1-I8-R1 Technical Preparation, Checkpoint B / M1-I8-R1 Visual Excellence, M1-I9-R1, or M1-I12 without the applicable separate explicit Human authorization. Checkpoint B additionally remains blocked until a Human-approved Figma file exists. Do not start operator completion, publication, deployment, provider inquiry, payment, AI, email, DB/API integration, or Milestone 2+ work.

Browser use remains prohibited, including the Codex in-app browser, CDP, Playwright, Puppeteer, Selenium, GUI browsers, and screenshot acquisition. Automated checks do not establish visual acceptance.

## Next Gate

Using the accepted M1-P3 canonical package, produce and obtain Human acceptance of the actual Figma design for Web鑑定ノート desktop/390px, 保存用判断カード desktop/390px, 公開全文見本 desktop/390px, 768px reflow, 320px fallback, six archetype sheets, typography/spacing/color/component anatomy, the Review wrapper, and the LP preview. Figma production and Human acceptance are not application implementation authorization. Checkpoint A or Checkpoint B may begin only after its own separate explicit Human authorization. M1-I9-R1 and M1-I12 remain unauthorized. Milestone 1 remains incomplete, and Milestone 2 remains unauthorized.
