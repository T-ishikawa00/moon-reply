# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-P0-R1 Review

## Status

`prepayment_safety_intent_charter_rewritten_pending_human_chatgpt_review`

This is a planning-only correction of the Pre-Payment Safety Charter. It separates the contact boundary from the assistance the customer is requesting. It does not implement UI, API, payment, Runtime, Provider, database, or Supabase behavior.

**PRODUCT OWNER DIRECTION: ACCEPTED**

Detailed Human / ChatGPT Charter review remains pending. Product Owner acceptance of the direction is not implementation acceptance, JPY980 readiness, Runtime authority, or release approval.

## Technical result

- Exact baseline: `30e762e1f3d17f2a007b7f7f92d3ba91e01b861e`
- Exact correction scope: 8/8 existing files updated; no new or deleted files
- Upstream dependency: accepted Package D unchanged
- Safety model: `contact_boundary_state × requested_assistance_goal`, plus normalized request/Candidate comparison
- Boundary states: exact 9/9
- Assistance goals: exact 8/8
- Safety dispositions: exact 5/5
- Eligible delivery scopes: exact 5/5
- Derived purchase classifications: exact 9/9
- Decision matrix: 42/42 required cases
- Eligible classifications: `eligible_general`, `eligible_pause_assessment`, `eligible_boundary_support_only`, `eligible_scoped_reply`, `eligible_business_only`
- Non-purchase classifications: `needs_clarification`, `blocked_unsafe_assistance`, `urgent_safety_redirect`, `unsupported_professional_request`
- Purchase authority: canonical, input-bound, server-owned eligibility identity only
- Active Runtime: v4
- v12: inactive
- Payment implementation and SDK: absent
- Provider / DB / Supabase: `0 / 0 / 0`
- Human / ChatGPT Charter review: pending
- Package E implementation: unauthorized
- Payment-provider integration: unauthorized
- JPY980 readiness: not established

The protected Package D, Runtime, Pipeline, Service, Prompt, Catalog, Schema, PB stages, evaluator, semantic disposition, Customer Assessment Note, Projection, DB/repository, and governance files remain outside this correction. Prior evidence is not rewritten.

## Superseded policy

The prior P6-P0 state-only policy is expressly superseded in three places:

1. `temporary_pause` is no longer an automatic free stop. A safe request may become `eligible_pause_assessment` and receive a paid, no-draft assessment.
2. `explicit_no_contact`, `channel_restricted`, and `relationship_closed` are no longer automatic exclusions from all paid support. A boundary-respecting request may become `eligible_boundary_support_only`.
3. A legal, medical, financial, or contractual context no longer blocks by mere presence. Only a primary output requiring professional judgment is `unsupported_professional_request`; separable emotional organization can remain eligible.

The correction does not create contact permission. Time passage, unblocking, another account, another channel, a workplace, or a third party never reopens contact. Business-only and new-inbound reply remain strictly scoped.

## Safety Gate versus Decision Engine

The Safety Gate answers one question: **may Moon Reply provide this requested kind of assistance?** It blocks unsafe execution assistance, redirects urgent current Safety, excludes professional judgment, requests clarification when necessary, or selects an eligible delivery scope.

The Decision Engine answers a different question: **within a permitted scope, should the customer send, reply, wait, or pause additional contact?** `wait_and_reassess` and `pause_additional_contact` are normal Product outcomes. Using either as a reason to deny purchase would recreate the defect this correction removes.

The paid Product is the individualized assessment note, not a guaranteed message draft. A result can therefore be commercially valid while intentionally omitting a draft.

## Eligible delivery contracts

| Classification | Paid value | Hard limit |
| --- | --- | --- |
| `eligible_general` | Normal assessment, direction, action, reassessment, and draft when supported | No unsafe, urgent, or professional request |
| `eligible_pause_assessment` | Full no-draft assessment, reasons, immediate self-directed action, observable reassessment condition, reassurance | No current draft or time-only later-contact plan |
| `eligible_boundary_support_only` | Facts, uncertainty, emotional organization, boundary-respecting direction, self-directed action, calm closure | No draft, recontact strategy, countdown, alternate/third-party contact, guarantee, or hidden-state certainty |
| `eligible_scoped_reply` | Assessment and possible reply limited to the explicitly invited inbound subject | No broader permission or unrelated follow-up |
| `eligible_business_only` | Assessment and possible draft limited to an explicitly permitted practical subject | No private, romantic, pressure, or relationship-progression content |

## True pre-payment stops

`blocked_unsafe_assistance` applies to requested execution help for circumvention, surveillance, tracking, deception, coercion, threats, harassment, humiliation, or using practical contact as a pretext. A safe dropdown choice cannot override explicit unsafe free text.

`urgent_safety_redirect` applies to a current self-harm/suicide risk, a current threat to another person, violence, immediate danger, coercive control with current danger, or an equivalent urgent condition. It returns static safety-oriented guidance without a relationship strategy or invented location-specific number.

`unsupported_professional_request` applies when the primary output requires legal, medical, clinical, contractual, financial, or equivalent professional judgment. Mere context is insufficient; nonprofessional emotional organization must be separated where possible.

Past unsafe behavior mentioned in a request is not, by itself, a block. A present request for help stopping or respecting a boundary can be boundary-support-only. The system classifies the requested assistance, not the customer's identity.

## Pre-purchase disclosure and authority

Before a pause assessment can be purchased, the customer is told:

> 鑑定結果によっては、
> 「今は送らない」という判断になり、
> 送信文案が表示されない場合があります。
>
> その場合も、
> 理由・今の動き方・見直す条件を
> 鑑定ノートとしてお返しします。

Before boundary-support-only can be purchased, the customer is told:

> この鑑定では、
> 相手への連絡文案や再接触方法は提供しません。
>
> 確認できる事実、
> 気持ちの整理、
> 相手の境界を尊重した今後の方向性を
> 鑑定ノートとしてお返しします。

All five eligible classifications also require the anti-circumvention attestation. Scope acknowledgement and attestation are purchase gates, not evidence that the customer's statements are true and not overrides for unsafe, urgent, or professional content.

Eligibility is bound by the server to normalized request text, normalized Candidate or null, authoritative requested topics, both classification axes, all clarification answers, the applicable scope acknowledgement, attestation, and Safety policy version. Any bound-field mutation revokes eligibility and `purchase_available`, returns the request to `unassessed`, and rejects stale tabs or copied URLs. The client cannot create an authority hash.

## Purchase state machine

The exact 14 planned states are:

`unassessed` → `collecting_safety_answers` → clarification or one of nine derived classifications → one of five eligible classifications → `purchase_available` → future `payment_pending` → future `payment_completed`.

Only the five eligible classifications can enter `purchase_available`, and only after the applicable scope disclosure plus `attestation_confirmed=true`. Clarification, unsafe, urgent, and professional states cannot create payment sessions. Payment transitions remain policy definitions only; implementation is absent.

## Independent product-risk assessment

The rewrite corrects an overbroad policy, but it increases classification burden. The main abuse surface is no longer the checkbox; it is semantic conflict between structured answers and free text. A future implementation that trusts selected options without classifying the normalized request and Candidate would be unsafe and contractually noncompliant.

The second risk is false commercial framing. Charging for a no-draft assessment is defensible only if the note delivers individualized facts, bounded uncertainty, reasons, useful self-directed action, observable reassessment conditions, reassurance, and closure. A thin restatement of “do not contact” would not justify JPY980 even though the charter permits the category.

The third risk is boundary laundering through `business_only` or `new_inbound_after_boundary`. Practical permission cannot absorb personal content, and receipt of a new message cannot create broad relationship permission. Both require exact-subject enforcement against actual request content.

The attestation is a governance control, not a safety classifier. Treating it as proof of truthfulness or allowing it to override unsafe content would be a critical design defect.

## Product Owner direction accepted

The Product Owner accepts all eight principles:

1. Temporary pause can receive a paid no-draft assessment.
2. Explicit boundary states can receive paid boundary-support-only assessment.
3. Unsafe execution assistance stops before payment.
4. Urgent current Safety redirects before payment.
5. Professional judgment is unsupported; separable emotional organization may remain eligible.
6. Business-only remains strictly practical.
7. New-inbound reply remains strictly scoped.
8. Product value is the individualized assessment note, not guaranteed draft presence.

This acceptance supersedes the three overbroad P6-P0 decisions. It does not authorize Package E or any implementation.

## Plain-language summary

1. **なぜ一時的な距離置きは有料鑑定可能なのか** — 「今は送らない」という判断でも、理由、気持ちの整理、今できる行動、見直すための観察可能な条件まで個別に返せるためです。課金対象は文案ではなく、完全な個別鑑定ノートです。ただし、時間がたてば送ってよいという計画や現在の文案は出しません。
2. **明確な拒絶後でも何を提供できるのか** — 相手へ送る文案や再接触方法ではなく、確認できる事実、不明点、本人の気持ちの整理、連絡を止める方向、本人だけで実行できる次の行動、落ち着いた区切りを提供できます。
3. **何を求めた場合に本当に無料停止するのか** — 拒否やブロックの回避、別アカウントや第三者、監視・追跡、だまし、脅し、強制、嫌がらせ等の実行支援を求めた場合です。安全そうな選択肢を選んでも、自由記述が危険なら決済前に止めます。
4. **緊急Safetyと通常の恋愛不安の違い** — 悲しさ、返信への不安、待つつらさだけでは緊急扱いにしません。現在の自傷・自殺リスク、他者への加害予告、暴力、差し迫った危険等がある場合に限り、安全確保を優先して無料で止めます。
5. **専門案件をどう分けるのか** — 法律・医療・契約・金銭の話題があるだけでは止めません。診断、法的判断、契約解釈、債務判断等そのものを求める場合は対象外です。専門判断を除いた気持ちや状況の整理へ明確に分けられるなら、再分類できます。
6. **文案が出ない可能性を購入前にどう説明するのか** — 「今は送らない」という結果では送信文案が表示されない場合があること、その場合も理由・今の動き方・見直す条件を鑑定ノートで返すことを明示し、同意がなければ購入可能にしません。
7. **Safety GateとDecision Engineの役割の違い** — Safety Gateは「その支援を提供してよいか」を決めます。Decision Engineは、提供可能な範囲で「送る・返す・待つ・追加連絡を止める」のどれが妥当かを決めます。待つ判断は通常の有料鑑定結果であり、安全停止理由ではありません。
8. **まだ実装していないもの** — UI、API、決済、決済セッション、決済SDK、Runtime接続、Provider実行、DB/Supabase、Package E/F、R4、C2は実装・実行・承認していません。Active Runtimeはv4のままで、v12も非アクティブです。
9. **次のゲート** — 次は Human / ChatGPT Charter review です。Product Owner方向性の受理だけで、実装、JPY980 readiness、公開、リリースへ進むことはできません。

## Authority boundary

`product_owner_direction_accepted=true`, `human_chatgpt_charter_review_complete=false`, `package_e_implementation_authorized=false`, `payment_provider_integration_authorized=false`, `provider_rerun_authorized=false`, `active_runtime_activated=false`, `package_f_authorized=false`, `r4_authorized=false`, `c2_authorized=false`, and `final_jpy980_readiness_established=false`.

No PR, main merge, force push, Provider execution, DB/Supabase operation, payment implementation, or Runtime activation is authorized by this package.
