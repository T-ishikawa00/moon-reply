# M2-D1 — Customer-facing Legal / Contract Current Truth

Status: `SOURCE CANDIDATE — PENDING HUMAN/CHATGPT REVIEW`

This is the existing M2-D1 backlog task, not a new Milestone or Gate. The source authority is `release/private-ready@3f170941fd16b6b997089c2959489758ac9553eb`; `main` remains `61e33a10e195fad17e253a6b9719217e1992f273`. Production Publish, C1 activation, Netlify configuration, remote database mutation, Payment, Provider, email, and support-channel operations are outside this task.

## Current authority and C1 closure sync

- Remote migration history: exact `0002–0020`; pending `0`; unknown `0`.
- Accepted `0020_m2_c1_prepayment_compute_budget.sql` SHA-256: `3e2683bf65a783047c1cec1b86b9663d4b315bcc1a8ebc080c8bc9bfcb7b9e75`.
- M2-C1: `Human/ChatGPT SOURCE + REMOTE DB PASS`.
- AI-01 / AI-02: `CLOSED IN SOURCE + REMOTE AUTHORITY — ACTIVATION PENDING`.
- `PREPAYMENT_COMPUTE_*` Production environment values remain unset/disabled. The Self Dogfood decision `86400 seconds / 10 invocation units` is recorded for future activation only.
- Nothing in D1 claims Production activation, external-beta availability, Public Launch, or current Published runtime convergence.

## Pre-implementation customer-surface evidence matrix

Classification: **A** current product fact; **B** current operation fact; **C** historical review evidence; **D** unresolved Human/legal decision; **E** false or stale current claim.

| Customer-reachable surface or shared source | Pre-D1 classification | Exact current-truth finding | D1 disposition |
|---|---:|---|---|
| `/legal` | C, E | Rendered B2/B3/B4 review gates, Human/ChatGPT acceptance, commit/deploy evidence, and obsolete Payment/Stripe readiness statements | Replace with a plain customer information hub |
| `/legal/terms` | A, C, D, E | Correct core product facts were mixed with draft/review language, old unimplemented Payment statements, and internal decisions | Render a current customer terms document; keep unresolved decisions internal |
| `/legal/privacy` | A, B, C, D, E | A future-plan inventory contradicted current OpenAI, Stripe, Supabase, Netlify, Auth, and transactional-email paths | Describe actual categories, purposes, processors, minimization, and honest retention limits |
| `/legal/tokushoho` | A, C, D, E | Correct price/quantity facts were mixed with a review dashboard; seller identity and contact fields remain unknown | Publish known product/payment facts and an honest incomplete-disclosure notice; do not fabricate seller fields |
| `/legal/refund` | A, C, D, E | Review-only policy mixed intended recovery with obsolete non-implementation claims | Separate incomplete Payment, erroneous charge, undeliverable paid order, convenience request, system incident, and manual recovery |
| `/legal/ai-disclosure` | A, B, C, E | Correct AI limits were mixed with a fixed-fixture/AI-not-running review chronology | Explain current AI role, uncertainty, non-guarantees, agency, and professional/safety boundaries |
| `/legal/unsupported-cases` | A, C, E | Safety boundary was substantially correct but included review status, internal decision IDs, and obsolete Payment wording | Preserve the narrow safety boundary in customer language |
| `/contact` | D, E | Non-operational state was honest, but the page exposed review terminology and internal decision status | Keep an honest preparation-only page with no form, fake success, address, or response SLA |
| purchase confirmation and auth continuation | A, B | Current links and `税込980円 / 1相談・1鑑定ノート / 都度払い / 自動更新なし` facts are already aligned | Preserve and verify |
| site footer/header legal links | C, E | Legal pages were labelled as review/preparation artifacts | Present ordinary legal/information links; identify only the contact channel as preparing |
| `lib/legal/review-content.ts` and `components/legal/LegalReview.tsx` | C | Historical B2–B4 review authority and UI | Preserve byte history; remove all customer-route imports |
| Home, Request, sample/report customer copy | A, B | Core price, quantity, AI, and non-guarantee facts are customer current truth; operational availability copy reflects disabled activation | Preserve and cross-check; do not rewrite activation policy in D1 |
| `/review/**` | C | Internal synthetic and historical review surfaces | Keep outside customer legal-content authority and outside the customer-visible verifier |

## Locked current product facts

| Fact | Current authority |
|---|---|
| Service | 月の返事 |
| Product | 恋のメッセージ鑑定ノート |
| Classification | AIを活用した恋愛メッセージ分析・判断支援デジタルレポート |
| Economics | 税込980円; 1相談 / 1鑑定ノート; 都度払い; 自動更新なし |
| Eligibility | 申込み時点で18歳以上 |
| Clarification | 通常0回; 本当に必要な場合のみ最大1回; sparse input remains allowed |
| AI boundary | AI utilization disclosed; no tarot, astrology, psychic/supernatural technique, or mind-reading claim |
| Non-guarantee | No guarantee of the other person’s true thoughts, reply, reconciliation, future, or relationship improvement |
| Professional boundary | Not a substitute for medical, psychological, or legal professional advice |

Stripe is the current Payment provider and the exact price authority is JPY 980 for one one-time purchase. Normal customer legal copy describes the service contract and does not expose Sandbox, deployment chronology, or activation gates. It does not claim that live purchase or Public Launch is available.

## Actual current data-path inventory

| Processing area | Current categories and role |
|---|---|
| Customer intake | Consultation text, relationship/topic selections, optional supplied message/draft, adult confirmation, and any one clarification answer needed to prepare the note |
| Customer identity | Auth account identity and email, server-resolved customer identity, preparation ownership, continuation, access, and recovery records |
| Preparation and delivery | Preparation/request/result/job/delivery identifiers, status, retry/error, safety, and delivery metadata |
| Payment | Stripe Checkout/payment identifiers and status, exact economics, purchase and verification records; card details are entered on Stripe’s payment surface rather than consultation input |
| AI | OpenAI processes the consultation context needed for analysis and generation. Email, Payment identifiers, auth/capability secrets, and C1 budget records are not AI analysis inputs |
| Transactional email | Resend handles address and notification/delivery information for account or result communication; the consultation body is not sent as transactional-email content |
| Hosting/data/auth | Netlify hosts and runs the customer application; Supabase provides database and authentication services |
| C1 budget | Customer identity reference, policy/window and used-unit/timestamp metadata only; no consultation, message, email, Stripe data, or AI request/response body |

Exact per-category retention periods are not established. D1 does not promise immediate deletion, zero retention, or a fabricated duration. Access/security logs may contain ordinary technical metadata handled by the hosting or security layer; raw IP is not a C1 compute-budget identity or ledger field.

## Customer/internal authority separation

D1 introduces one typed current customer legal-content authority and a customer document component used by `/legal/**` and `/contact`. Customer routes no longer import the historical Stripe Lane B/B4 review content or its review dashboard component. Those historical modules and documentation remain intact as internal evidence and source history.

Runtime Payment authorization does not depend on the legal rendering module. The legal pages remain static and renderable while Provider, Payment, C1, or scheduler activation flags are disabled. The existing `/legal` `noindex, nofollow` policy remains unchanged.

## Human/legal decision register

### Current facts established by source and operation

- The locked product/economic/AI/safety facts above.
- Stripe Payment integration, durable server/DB verification, protected result access/delivery authority, OpenAI processing, Supabase data/auth, Netlify hosting/runtime, and Resend transactional email exist in current source.
- Paid fulfillment recovery must preserve one paid purchase without duplicate charge; a paid customer must not simply lose the assessment.

### Customer copy implemented in D1

- Current terms, privacy, refund, AI, unsupported-cases, commercial-disclosure, contact, and legal-index documents.
- Plain-language separation of contract facts from current availability and internal review history.
- No fixed refund deadline, delivery SLA, support SLA, uptime guarantee, or absolute data-security/deletion promise.

### Human decisions still required

- Legal seller identity, representative, postal address, telephone number, and actual support/contact address.
- A real support/recovery channel and its controlled operating procedure.
- Final operational refund/cancellation procedure, especially customer-convenience cancellation after Payment and before fulfillment.
- Data-category retention schedule and deletion/request operating procedure.
- Effective/revision date and final change-notice mechanism.
- Governing jurisdiction wording after seller identity/location is established.

Human-controlled private seller/contact details must not be pasted into repository history or Codex chat merely to complete D1. A later reviewed procedure must source approved values from a secure Human-controlled authority.

### External-beta blockers

- Complete and accepted seller disclosure with real required fields.
- Real support/recovery contact channel.
- Accepted refund/cancellation operating procedure and customer request path.
- Accepted privacy retention/request procedure and document effective date.
- C1 activation and all separately governed release/Payment/runtime gates.

### Public-launch blockers

All external-beta blockers, Public Launch review, legal/current-operation revalidation, and any other launch authority remain separate. Optional professional legal review is prudent but is not labelled a blocker without a concrete requirement.

## Validation record

The D1 verifier establishes all eight legal/contact route sources, one shared h1 authority, accessible navigation/current-page semantics, valid Request/purchase links, static flag-independent rendering, exact typed facts, no historical imports, zero forbidden internal token families, current Stripe/AI/privacy/refund truth, no fabricated seller/contact values, no fake support/refund SLA, and unchanged legal robots policy. Final task evidence is:

- D1 current-truth verifier: `30/30` PASS.
- Product Intent: `18/18`; Purchase Eligibility: `9/9`; C1: `8/8`; Auth Entry: `11/11`; Clarification: `7/7`; RC-1: `19/19`; RC-2: `50/50`; Background Durability: `21/21` PASS.
- Async graph: `107 modules / 363 edges`; generated Async router/background artifacts, Scheduled Function artifacts, and background runtime assets PASS with Provider/Stripe/Async/Supabase remote calls `0`.
- Root typecheck PASS; zero-warning ESLint PASS; Next.js `16.3.0` customer Production build PASS with static generation `38/38`; `git diff --check` PASS.
- Historical literal disposition is preserved rather than weakened: the B1 verifier stops on its exact old task-branch pin before functional checks; I4 passes its six current scheduler/source checks and then stops on its historical exact 0002–0019 migration list because accepted 0020 now exists.
- Fresh linked read-only migration history lists local/remote exact 0002–0020, pending `0`, unknown `0`; canonical Git 0020 SHA-256 remains `3e2683bf65a783047c1cec1b86b9663d4b315bcc1a8ebc080c8bc9bfcb7b9e75`.
- C1 remains inactive under the accepted current operational authority. The D1 process/build environment contains none of the three `PREPAYMENT_COMPUTE_*` values and D1 performs no Netlify configuration operation; future 86400 / 10 activation remains separately authorized.

Changed customer authority is bounded to `/legal/**`, `/contact`, the typed current legal module/component, footer links, and current-truth wording on Home, Request, purchase confirmation, and public sample copy. Supporting changes are the D1 verifier/package script and the five required operational/evidence documents. Historical review modules, migrations, Next.js/dependencies, runtime authorization, Payment, Provider, email, scheduler, and `main` remain unchanged.

No remote database write, migration, Production Publish, Netlify configuration change, Payment, Provider, transactional email, support-channel action, Async event, or scheduler action occurred in D1. The only authorized external write will be the normal task-branch Git push after the source commit.
