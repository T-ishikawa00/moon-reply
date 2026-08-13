# 月の返事

月の返事は、返信待ち・追いメッセージ・曖昧な関係で不安になる夜に、恋愛関係の状況や送信予定のメッセージをAIが整理・分析し、次の一手の判断材料を鑑定ノート形式で返すサービスです。

公式な事業・法務・provider向け定義は、AIを活用した恋愛メッセージ分析・判断支援デジタルレポートです。ユーザー向けには「恋のメッセージ鑑定ノート」と表現しますが、占術や超自然的な予測は使用しません。

## Current Phase

> **Stripe Lane B B2 accepted current overlay:** `stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete` on `2026-08-13`; Human + ChatGPT review / acceptance is `complete / complete`. The exact current next work is **Stripe Lane B Review-ready Website/Public Surface implementation (B3)**. B3 is not started by this Acceptance Sync and requires the next explicit Human instruction; legal publication, Provider operations, Payment implementation, Production Payment, domain/deployment, and actual Human PII insertion remain unauthorized.

Payment Charter v1 is `human_chatgpt_accepted_complete` as of 2026-08-12; Payment implementation remains unauthorized.

The Stripe-first Web Payment Strategy is Human + ChatGPT accepted at the Product/strategy level as of `2026-08-12`. Its status is `stripe_feasibility_and_web_payment_strategy_pivot_human_chatgpt_accepted_complete`. Stripe Checkout is the accepted strategic primary Web direction to investigate and prepare, while Stripe feasibility is not established; account, contact, approval, and activation are absent; formal Provider selection is incomplete; and every desired method remains unverified. PAY.JP is preserved as `paused_fallback_provider_direction`. Provider account/contact/API operations, Payment implementation, and Production Payment remain unauthorized.

The Stripe-first Customer-facing / Public-copy Alignment is Human + ChatGPT accepted complete as of `2026-08-12` with status `stripe_first_customer_public_copy_alignment_human_chatgpt_accepted_complete`. The accepted lineage is baseline `3d3888f53293231506838195c478fa2e1a88417f`, initial implementation `0bdbdc87b9de5b28707a7f5ce25f12d7b6333c95`, and Human Visual QA correction `48d21e7ee7d672575eae6fd957e637b37da2a52f`. Human Visual QA and Automated QA are PASS at the accepted implementation lineage. This accepts Product/UI/content alignment only and creates no Provider, Payment implementation, Production Payment, or legal-publication authority.

Stripe Feasibility Evidence Preparation is `stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete` as of `2026-08-12`. Lane A remains `preparation_human_approved / external_action_not_authorized / not_submitted / null` but is preserved inactive. On `2026-08-13`, Human directed that the Stripe Sales route not be used (`not_used_by_human_direction`); this is a workflow choice, not a Stripe Provider outcome. The [Stripe Lane B Human Decision Package](docs/payment/STRIPE_LANE_B_HUMAN_DECISION_PACKAGE.md) is Human + ChatGPT accepted complete with status `stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete`; all seven policy decisions are accepted. Their accepted B2 docs/spec/legal authority status is `stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete`, with `AGE-GATE-001 = accepted_direction_legal_spec_alignment_human_chatgpt_accepted_complete`; Human + ChatGPT review / acceptance is `complete / complete`. The exact current next work is **Stripe Lane B Review-ready Website/Public Surface implementation (B3)**. Lane B/C remain blocked, no external action is authorized, and Stripe feasibility, account/contact/approval/activation, formal selection, and all desired-method eligibility remain unresolved.

Current canonical planning:

- `docs/ROADMAP.md`
- `docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md`
- `docs/payment/PAYMENT_CHARTER.md`
- `docs/payment/STRIPE_FEASIBILITY_AND_WEB_PAYMENT_STRATEGY_PIVOT_CANDIDATE.md`
- `docs/payment/STRIPE_LANE_B_HUMAN_DECISION_PACKAGE.md`
- `docs/payment/PAYJP_PRODUCTION_APPLICATION_READINESS.md`
- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`

## MVP Direction

Phase 1 MVP is not a full app.

The public MVP target is an automated one-shot paid diagnosis flow:

LP → self-hosted request form → accepted server-owned Safety/purchase eligibility → delivery/recovery email → mailbox verification when no valid trusted session exists → verified-email binding → final JPY 980 confirmation → verified payment → one assessment grant → AI assessment → result delivery/recovery → feedback.

The initial paid Web MVP remains no-login. A valid server-verifiable trusted session bound to the unchanged verified delivery/recovery email may be reused; Safety eligibility and final purchase confirmation are still required for every purchase.

Development may use manual, mock, and QA modes, but the public MVP should automate normal diagnosis flow.

## In Scope for MVP

- One-page LP
- Self-hosted diagnosis request form
- Safety screening
- Payment flow
- AI judgment generation
- AI full diagnosis generation
- Result page
- Email notification
- Feedback collection
- Minimal database/logging

## Out of Scope for MVP

- Login
- User account
- My page
- Partner-specific notebook
- Diagnosis history list
- Subscription
- Coin/point system
- Native app
- Full admin panel
- Auto-generated image card

## Product Roadmap

- Phase A: Web / accepted Stripe Checkout strategic direction / credit/debit cards, Apple Pay, Google Pay, and PayPay / JPY 980 tax-inclusive one-time purchase; feasibility and method evidence remain pending
- Phase B: real-customer paid Web validation
- Phase C: iOS / Apple IAP / RevenueCat
- Phase D: Android / Google Play Billing / RevenueCat
- Phase E: repeat-purchase data analysis
- Phase F: subscription only if demand is established

The detailed initial Web delivery milestones remain in `docs/ROADMAP.md`. Purchase-count figures are Product Owner heuristics, not automatic release gates.

## Development Rules

- 需要検証なしに本格実装へ進まない
- 実装は承認済みステージごとに分割する
- 単発税込¥980で実需要と再購入を検証するまでサブスクを実装しない
- Webで有料検証し、その後iOS、安定後にAndroidへ進む
- 初期Customer-facing modelにコイン/ポイント制を採用しない
- Stripe戦略Candidate、feasibility、provider承認・正式選定、Payment Charter受入、実装権限を混同しない
- 不安を煽って課金させない
- 危険相談は通常鑑定にしない
- AI利用は隠さない
- 実名、個人情報、LINEスクショをRepoに入れない

## Integrity Notes

External evaluation was not executed.

The transition to Phase 1 was made via Founder Override.

Do not fabricate evaluator feedback, sales results, purchase counts, or testimonials.
